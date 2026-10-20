/* SPHYRE LIVE LOADS | Núcleo independiente y sin dependencias.
   Modelo longitudinal IMT 66.5, N-PRY-CAR-6-01-003/25 E.1.2.1.
   Simplemente apoyada, estático, respuesta de una viga bajo el modelo virtual.
   Toneladas-fuerza y metros. No sustituye revisión de proyecto. */
export const round = (v, digits=2) => Number(v.toFixed(digits));
const clamp = (v,min,max)=> Math.min(max,Math.max(min,v));

export function vehicleModel(L, reversed=false) {
  if(!Number.isFinite(L)||L<=0) throw new RangeError('El claro efectivo debe ser mayor que cero.');
  const large=L>=30;
  const positions=large ? [0,5,14] : [0,4.4,5.6,12.8,14,15.2];
  const forces=large ? [5,24,37.5] : [5,12,12,12.5,12.5,12.5];
  const length=positions.at(-1);
  const axles=positions.map((offset,i)=>({id:i+1,offset:reversed?length-offset:offset,force:forces[i]}))
    .sort((a,b)=>a.offset-b.offset);
  const w=large?clamp((L-30)/60,0,1):0;
  return {axles, w, length, large, label:large?'IMT 66.5 · L ≥ 30 m':'IMT 66.5 · L < 30 m'};
}

export function evaluateAt({L,shift,axles,w=0,loadFactor=1,reduction=1},x) {
  if (!Number.isFinite(x)||x<0||x>L) throw new RangeError('Coordenada fuera del claro.');
  const loads=axles.filter(a=>shift+a.offset>=-1e-9&&shift+a.offset<=L+1e-9)
    .map(a=>({x:clamp(shift+a.offset,0,L),p:a.force*loadFactor*reduction,id:a.id}));
  const line=w*reduction;
  const RA=loads.reduce((s,a)=>s+a.p*(L-a.x)/L,0)+line*L/2;
  const RB=loads.reduce((s,a)=>s+a.p*a.x/L,0)+line*L/2;
  const momentAt=(z)=>RA*z - line*z*z/2 - loads.reduce((s,a)=>s+(z>=a.x ? a.p*(z-a.x):0),0);
  const shearAt=(z,side='right')=>RA-line*z-loads.reduce((s,a)=>s + ((side==='left'?a.x<z-1e-9:a.x<=z+1e-9)?a.p:0),0);
  let xM=0, Mmax=0;
  const xs=[0,L,...loads.map(a=>a.x)];
  if (line>1e-12) {
    const cuts=[0,...loads.map(a=>a.x),L].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const a=cuts[i],b=cuts[i+1];
      if(b-a<1e-12)continue;
      const mid=(a+b)/2;
      const leftP=loads.filter(t=>t.x<=mid).reduce((s,t)=>s+t.p,0);
      const root=(RA-leftP)/line;
      if(root>a&&root<b)xs.push(root);
    }
  }
  for(const xx of xs){const val=momentAt(xx);if(val>Mmax){Mmax=val;xM=xx;}}
  const Vpos=RA; const Vneg=-RB;
  const xV=Math.abs(RA)>=Math.abs(RB)?0:L;
  const Vcritical=Math.abs(RA)>=Math.abs(RB)?RA:-RB;
  return {L,shift,loads,w:line,RA,RB,Mmax,xM,Vpos,Vneg,Vcritical,xV,momentAt,shearAt,
    Vright: z=>shearAt(z,'right'), Vleft:z=>shearAt(z,'left'),xSelected:x,
    Mselected:momentAt(x),Vselected:shearAt(x)};
}

export function configuration(L,shift,loadFactor=1,reduction=1,reversed=false){
  const model=vehicleModel(L,reversed);
  return {L,shift,axles:model.axles,w:model.w,loadFactor,reduction};
}

function goldenMax(f,a,b){
  let c=b-(b-a)*0.6180339887498949,d=a+(b-a)*0.6180339887498949;
  let fc=f(c),fd=f(d);
  for(let k=0;k<42;k++){
    if(fc>fd){b=d;d=c;fd=fc;c=b-(b-a)*0.6180339887498949;fc=f(c);}
    else {a=c;c=d;fc=fd;d=a+(b-a)*0.6180339887498949;fd=f(d);}
  }
  const s=(a+b)/2;return {shift:s,value:f(s)};
}

// Móvil: búsqueda numérica acotada + refinamiento alrededor de todos los
// máximos locales y eventos de entrada/salida de ejes. Precisión ~1e-6 m.
// El diagrama para cada posición se evalúa analíticamente (sin diferencias finitas).
export function findCritical(L,loadFactor=1,reduction=1,reversed=false){
  const model=vehicleModel(L,reversed);
  const minS=-model.length, maxS=L;
  const count=Math.max(650,Math.min(3400,Math.ceil((maxS-minS)/0.07)));
  const step=(maxS-minS)/count;
  const f=s=>evaluateAt({L,shift:s,axles:model.axles,w:model.w,loadFactor,reduction},L/2).Mmax;
  let bestM={value:-Infinity,shift:minS}, bestV={value:-Infinity,shift:minS,side:'left'};
  const edgeEps=Math.min(0.0001,Math.max(0.000001,L*0.0000001));
  let prev2=null,prev1=null;
  const addM=(s,val)=>{if(val>bestM.value)bestM={value:val,shift:s};};
  const addV=s=>{
    const q=evaluateAt({L,shift:s,axles:model.axles,w:model.w,loadFactor,reduction},L/2);
    // El cortante justo dentro del tramo NO incluye cargas directamente
    // ubicadas sobre los apoyos. Usar límites unilaterales.
    const left=Math.abs(q.shearAt(0,'right')),right=Math.abs(q.shearAt(L,'left'));
    if(left>bestV.value)bestV={value:left,shift:s,side:'left'};
    if(right>bestV.value)bestV={value:right,shift:s,side:'right'};
  };
  for(let i=0;i<=count;i++){
    const s=minS+i*step, val=f(s);addM(s,val);
    if(prev2&&prev1&&prev1.val>=prev2.val&&prev1.val>=val){
      const opt=goldenMax(f,prev2.s,s);addM(opt.shift,opt.value);
    }
    prev2=prev1;prev1={s,val};
  }
  // Entradas/salidas, considerando estados unilaterales para reacciones.
  const events=[minS,maxS,...model.axles.flatMap(a=>[-a.offset,L-a.offset])];
  for(const ev of events){
    for(const delta of [-edgeEps,0,edgeEps]){
      const s=clamp(ev+delta,minS,maxS);
      addM(s,f(s));addV(s);
    }
  }
  // refine near best grid value too
  const opt=goldenMax(f,clamp(bestM.shift-step,minS,maxS),clamp(bestM.shift+step,minS,maxS));
  addM(opt.shift,opt.value);
  const m=evaluateAt({L,shift:bestM.shift,axles:model.axles,w:model.w,loadFactor,reduction},L/2);
  const v=evaluateAt({L,shift:bestV.shift,axles:model.axles,w:model.w,loadFactor,reduction},L/2);
  const xShear=bestV.side==='left'?0:Math.max(0,L-edgeEps/2);
  const signedV=v.shearAt(xShear,'right');
  return {
    moment:{shift:bestM.shift,x:m.xM,value:m.Mmax},
    shear:{shift:bestV.shift,x:xShear,value:signedV,absolute:bestV.value,side:bestV.side},
    model
  };
}

export function sampleDiagram(response,n=160){
  const points=[];
  for(let i=0;i<=n;i++){
    const x=response.L*i/n;
    points.push({x,M:response.momentAt(x),V:response.shearAt(x)});
  }
  return points;
}
