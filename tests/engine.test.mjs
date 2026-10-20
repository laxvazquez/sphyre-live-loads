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
