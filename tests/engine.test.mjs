import test from 'node:test';
import assert from 'node:assert/strict';
import {vehicleModel,evaluateAt,configuration,findCritical} from '../public/engine.js';
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`Esperado ${b}, recibido ${a}`);

test('Modelo IMT 66.5, L < 30 m: seis ejes y 66.5 tf',()=>{
  const m=vehicleModel(29.99);assert.equal(m.axles.length,6);assert.deepEqual(m.axles.map(a=>a.offset),[0,4.4,5.6,12.8,14,15.2]);near(m.axles.reduce((s,a)=>s+a.force,0),66.5);near(m.w,0);
});
test('Modelo L >= 30 m: tres cargas y w(L) según norma',()=>{
  for(const [L,w] of [[30,0],[45,.25],[60,.5],[90,1],[200,1]]){
    const m=vehicleModel(L);assert.deepEqual(m.axles.map(a=>a.force),[5,24,37.5]);assert.deepEqual(m.axles.map(a=>a.offset),[0,5,14]);near(m.w,w);
  }
});
test('Carga puntual centrada sobre claro de 10 m: RA = RB = 5 tf, Mmax=25 tf·m',()=>{
  const a=evaluateAt({L:10,shift:5,axles:[{force:10,offset:0}],w:0},5);
  near(a.RA,5);near(a.RB,5);near(a.Mmax,25);near(a.xM,5);near(a.momentAt(0),0);near(a.momentAt(10),0);
});
test('Carga uniforme sobre L=10 m: RA=RB=10 tf, Mmax=25 tf·m',()=>{
  const a=evaluateAt({L:10,shift:0,axles:[],w:2},5);
  near(a.RA,10);near(a.RB,10);near(a.Mmax,25);near(a.xM,5);near(a.Vleft(5),0);
});
test('Equilibrio estático y condiciones de contorno para posiciones variadas',()=>{
  for(const L of [7,29,30,37,60,100])for(const s of [-16,-10,-1,0,3,L/3,L-4,L]){
    const q=evaluateAt(configuration(L,s,1.33,.9),L/3);
    near(q.RA+q.RB,q.loads.reduce((acc,a)=>acc+a.p,0)+q.w*L,1e-8);
    near(q.momentAt(0),0,1e-8);near(q.momentAt(L),0,1e-7);
    assert.ok(q.Mmax>=-1e-9);
  }
});
test('Inversión de sentido preserva cargas y modifica separación relativa',()=>{
  const a=vehicleModel(28,false),b=vehicleModel(28,true);
  near(a.axles.reduce((s,v)=>s+v.force,0),b.axles.reduce((s,v)=>s+v.force,0));
  assert.deepEqual(b.axles.map(v=>Number(v.offset.toFixed(1))),[0,1.2,2.4,9.6,10.8,15.2]);
});
test('Optimización coincide con barrido denso en las cercanías de posición crítica',()=>{
  for(const L of [10,29.1,30,45,75]){
    const result=findCritical(L);
    let observed=0;const m=vehicleModel(L);
    for(let i=0;i<=400;i++){
      const s=-m.length+(L+m.length)*i/400;
      const q=evaluateAt(configuration(L,s),L/2);
      observed=Math.max(observed,q.Mmax);
    }
    assert.ok(result.moment.value>=observed-0.01,`L=${L}: optimized ${result.moment.value}, sweep ${observed}`);
    assert.ok(result.shear.absolute>0);
  }
});

test('HS20-44: tres ejes, 8/32/32 kip y separación editable 14-30 ft',()=>{
 const kip=.45359237,ft=.3048;
 for(const rear of [14,22,30]){
  const m=vehicleModel(30,false,'hs20',rear);
  assert.equal(m.axles.length,3);
  for(const [i,v] of [8,32,32].entries())near(m.axles[i].force,v*kip,1e-9);
  near(m.axles[1].offset,14*ft);near(m.axles[2].offset,(14+rear)*ft);
 }
 assert.throws(()=>vehicleModel(30,false,'hs20',31),RangeError);
});
test('HS-20 carril es alternativa: w=0.64kip/ft y P=18/26kip',()=>{
 const m=vehicleModel(20,false,'hs20lane-m');
 const v=vehicleModel(20,false,'hs20lane-v');
 near(m.w,.64*.45359237/.3048);near(m.axles[0].force,18*.45359237);near(v.axles[0].force,26*.45359237);
});
test('Cooper E-80: 18 ejes, 2 locomotoras y separación AREMA',()=>{
 const e=vehicleModel(30,false,'e80');
 assert.equal(e.axles.length,18);
 assert.deepEqual(e.axles.map(a=>Number((a.force/.45359237).toFixed(6))),[40,80,80,80,80,52,52,52,52,40,80,80,80,80,52,52,52,52]);
 near(e.axles[1].offset,8*.3048);near(e.axles[5].offset,32*.3048);
 near(e.axles[9].offset,56*.3048);
 near(e.length,e.axles[17].offset);
 near(e.w,8*.45359237/.3048);
});
test('Cooper E-50 reproduce E-80 escalado 50/80, incl. cola uniforme',()=>{
 const a=vehicleModel(50,false,'e50'),b=vehicleModel(50,false,'e80');
 a.axles.forEach((v,i)=>near(v.force/b.axles[i].force,50/80));
 near(a.w/b.w,50/80);
 for(const shift of [-20,0,7,35]){
  const x=23;
  const qa=evaluateAt(configuration(50,shift,1,1,false,'e50'),x);
  const qb=evaluateAt(configuration(50,shift,1,1,false,'e80'),x);
  near(qa.RA/qb.RA,50/80,1e-10);near(qa.Mselected/qb.Mselected,50/80,1e-10);
 }
});
test('Cola uniforme del tren entra y sale sin ocupar siempre el claro',()=>{
 const L=30,model=vehicleModel(L,false,'e80');
 const q1=evaluateAt(configuration(L,-model.length,1,1,false,'e80'),15);
 const q2=evaluateAt(configuration(L,0,1,1,false,'e80'),15);
 const q3=evaluateAt(configuration(L,L,1,1,false,'e80'),15);
 near(q1.segments[0].a,0);near(q1.segments[0].b,L); // Dos locomotoras fuera, vagones sobre el claro
 assert.equal(q2.segments.length,0);assert.equal(q3.segments.length,0);
 for(const [reversed,shift] of [[false,-5],[true,20]]){
  const q=evaluateAt(configuration(L,shift,1,1,reversed,'e80'),15);
  const resultant=q.loads.reduce((v,t)=>v+t.p,0)+q.segments.reduce((v,s)=>v+s.w*(s.b-s.a),0);
  near(q.RA+q.RB,resultant,1e-7);near(q.momentAt(L),0,1e-6);
 }
});
test('Búsqueda de extremos funciona en nuevos modelos ferroviarios y HS20',()=>{
 for(const name of ['hs20','hs20lane-m','hs20lane-v','e50','e80']){
  const L=27;const result=findCritical(L,1,1,false,name,14);
  assert.ok(result.moment.value>0&&result.shear.absolute>0,`Falla caso ${name}`);
  const m=vehicleModel(L,false,name,14);let coarse=0;
  for(let i=0;i<=180;i++){
   const s=-m.length+(L+m.length)*i/180;
   coarse=Math.max(coarse,evaluateAt(configuration(L,s,1,1,false,name,14),L/2).Mmax);
  }
  assert.ok(result.moment.value>=coarse-.05,`${name}: M ${result.moment.value} menor que barrido ${coarse}`);
 }
});
