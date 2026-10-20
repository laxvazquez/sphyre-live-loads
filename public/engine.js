/* SPHYRE LIVE LOADS 1.1 · Análisis longitudinal, claro simplemente apoyado.
   Magnitudes en tf y m. 1 kip = 0.45359237 tf, 1 pie = 0.3048 m.
   Cooper: 2 locomotoras y cola uniforme móvil semiinfinita; impacto aparte.
   No sustituye análisis AREMA/AASHTO, distribución transversal ni combinaciones. */
export const FT=0.3048, KIP=0.45359237;
export const CASES = Object.freeze({ IMT:'imt', HS20:'hs20', HS20_M:'hs20lane-m', HS20_V:'hs20lane-v', E50:'e50', E80:'e80' });
export const round=(v,digits=2)=>Number(v.toFixed(digits));
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const makeAxles=(offsets,forces)=>offsets.map((offset,i)=>({id:i+1,offset,force:forces[i]}));
const coopGapsFt=[8,5,5,5,9,5,6,5,8,8,5,5,5,9,5,6,5];
const coopMultipliers=[.5,1,1,1,1,.65,.65,.65,.65,.5,1,1,1,1,.65,.65,.65,.65];
const coopOffsetsFt=[0];for(const gap of coopGapsFt)coopOffsetsFt.push(coopOffsetsFt.at(-1)+gap);
export function vehicleModel(L,reversed=false,caseId=CASES.IMT,hs20SpacingFt=14){
 if(!Number.isFinite(L)||L<=0)throw new RangeError('El claro efectivo debe ser mayor que cero.');
 if(!Object.values(CASES).includes(caseId))throw new RangeError('Modelo de carga no reconocido.');
 let axles,w=0,length=0,large=false,label='',description='',category='road',trailing=null;
 if(caseId===CASES.IMT){
  large=L>=30;const offsets=large?[0,5,14]:[0,4.4,5.6,12.8,14,15.2];
  const forces=large?[5,24,37.5]:[5,12,12,12.5,12.5,12.5];
  axles=makeAxles(offsets,forces);w=large?clamp((L-30)/60,0,1):0;
  label=large?'IMT 66.5 · L ≥ 30 m':'IMT 66.5 · L < 30 m';
  description=large?'3 ejes y w(L) sobre el claro':'6 ejes concentrados · sin w';
 }else if(caseId===CASES.HS20){
  if(!Number.isFinite(hs20SpacingFt)||hs20SpacingFt<14||hs20SpacingFt>30)throw new RangeError('HS-20: separación posterior de 14 a 30 ft.');
  axles=makeAxles([0,14,14+hs20SpacingFt].map(ft=>ft*FT),[8,32,32].map(k=>k*KIP));
  label='AASHTO HS-20-44 · Camión';description=`8 / 32 / 32 kip · 14 / ${hs20SpacingFt} ft (selección manual)`;
 }else if(caseId===CASES.HS20_M||caseId===CASES.HS20_V){
  // Standard Specs: lane loading is an ALTERNATIVE to HS-20 truck, not additive (HL-93 is different).
  const k=caseId===CASES.HS20_M?18:26;
  axles=makeAxles([0],[k*KIP]);w=.64*KIP/FT;
  label=`HS-20-44 · Carril (${caseId===CASES.HS20_M?'M':'V'})`;
  description=`0.64 kip/ft + ${k} kip puntual · alternativa al camión`;
 }else{
  category='rail';const E=caseId===CASES.E80?80:50;
  axles=makeAxles(coopOffsetsFt.map(ft=>ft*FT),coopMultipliers.map(f=>f*E*KIP));
  w=(E/10)*KIP/FT;
  label=`Cooper E-${E} · Ferroviario`;
  description='2 locomotoras (18 ejes) y carga uniforme móvil de vagones';
  trailing={gap:0,side:reversed?'left':'right'};
 }
 length=(axles.length?Math.max(...axles.map(a=>a.offset)):0)+(trailing?trailing.gap:0);
 if(reversed){axles=axles.map(a=>({...a,offset:length-a.offset})).sort((a,b)=>a.offset-b.offset)}
 const forward=axles.sort((a,b)=>a.offset-b.offset);
 return {caseId,axles:forward,w,length,large,label,description,category,trailing,hs20SpacingFt};
}
function effectiveSegments({L,shift,w=0,uniformSegments,trailing}){
 if(uniformSegments)return uniformSegments.map(s=>({a:clamp(s.a,0,L),b:clamp(s.b,0,L),w:s.w})).filter(s=>s.b>s.a);
 if(!w)return [];
 if(!trailing)return [{a:0,b:L,w}];
 if(trailing.side==='right'){
  const a=clamp(shift+trailing.start,L*-10,L);return a<L?[{a:Math.max(0,a),b:L,w}]:[];
 }
 const b=clamp(shift+trailing.start,0,L);return b>0?[{a:0,b,w}]:[];
}
export function evaluateAt({L,shift,axles,w=0,loadFactor=1,reduction=1,trailing=null,uniformSegments=null},x){
 if(!Number.isFinite(x)||x<0||x>L)throw new RangeError('Coordenada fuera del claro.');
 const loads=axles.filter(a=>shift+a.offset>=-1e-9&&shift+a.offset<=L+1e-9)
  .map(a=>({x:clamp(shift+a.offset,0,L),p:a.force*loadFactor*reduction,id:a.id}));
 const segs=effectiveSegments({L,shift,w,uniformSegments,trailing}).map(s=>({...s,w:s.w*reduction}));
 const RA=loads.reduce((s,a)=>s+a.p*(L-a.x)/L,0)+segs.reduce((v,s)=>v+s.w*(s.b-s.a)*(L-(s.a+s.b)/2)/L,0);
 const RB=loads.reduce((s,a)=>s+a.p*a.x/L,0)+segs.reduce((v,s)=>v+s.w*(s.b-s.a)*(s.a+s.b)/2/L,0);
 const uniformLeft=(z,s)=>s.w*clamp(z-s.a,0,s.b-s.a);
 const uniformMoment=(z,s)=>{if(z<=s.a)return 0;if(z<=s.b)return s.w*(z-s.a)**2/2;return s.w*(s.b-s.a)*(z-(s.a+s.b)/2)};
 const momentAt=z=>RA*z-segs.reduce((v,s)=>v+uniformMoment(z,s),0)-loads.reduce((v,a)=>v+(z>=a.x?a.p*(z-a.x):0),0);
 const shearAt=(z,side='right')=>RA-segs.reduce((v,s)=>v+uniformLeft(z,s),0)-loads.reduce((v,a)=>v+((side==='left'?a.x<z-1e-9:a.x<=z+1e-9)?a.p:0),0);
 let xM=0,Mmax=0;const xs=[0,L,...loads.map(a=>a.x)];
 const cuts=[0,L,...loads.map(a=>a.x),...segs.flatMap(s=>[s.a,s.b])].sort((a,b)=>a-b);
 for(let i=0;i<cuts.length-1;i++){
  const a=cuts[i],b=cuts[i+1];if(b-a<1e-11)continue;
  const mid=(a+b)/2;
  const active=segs.filter(s=>s.a<=mid&&mid<s.b);const line=active.reduce((v,s)=>v+s.w,0);
  if(line<=1e-12)continue;
  const vMid=shearAt(mid);const root=mid+vMid/line;
  if(root>a&&root<b)xs.push(root);
 }
 for(const xx of xs){const v=momentAt(xx);if(v>Mmax){Mmax=v;xM=xx;}}
 const Vpos=shearAt(0,'right'),Vneg=shearAt(L,'left');
 const xV=Math.abs(Vpos)>=Math.abs(Vneg)?0:L;
 const Vcritical=Math.abs(Vpos)>=Math.abs(Vneg)?Vpos:Vneg;
 return {L,shift,loads,w:segs.reduce((v,s)=>v+s.w*(s.b-s.a),0)/L,segments:segs,RA,RB,Mmax,xM,Vpos,Vneg,Vcritical,xV,momentAt,shearAt,
 Vright:z=>shearAt(z,'right'),Vleft:z=>shearAt(z,'left'),xSelected:x,Mselected:momentAt(x),Vselected:shearAt(x)};
}
export function configuration(L,shift,loadFactor=1,reduction=1,reversed=false,caseId=CASES.IMT,hs20SpacingFt=14){
 const m=vehicleModel(L,reversed,caseId,hs20SpacingFt);
 return {L,shift,axles:m.axles,w:m.w,loadFactor,reduction,
  trailing:m.trailing?{side:m.trailing.side,start:m.trailing.side==='right'?m.length:-0}:null};
}
function goldenMax(f,a,b){
 let c=b-(b-a)*.6180339887498949,d=a+(b-a)*.6180339887498949;
 let fc=f(c),fd=f(d);
 for(let k=0;k<34;k++){
  if(fc>fd){b=d;d=c;fd=fc;c=b-(b-a)*.6180339887498949;fc=f(c)}
  else{a=c;c=d;fc=fd;d=a+(b-a)*.6180339887498949;fd=f(d)}
 }
 const s=(a+b)/2;return {shift:s,value:f(s)};
}
// Barrido + refinamiento de extremos locales de M, eventos de ejes, inicio/fin de cola.
// V se evalúa a ambos lados de las secciones extremas evitando confundir la reacción con el salto en el apoyo.
export function findCritical(L,loadFactor=1,reduction=1,reversed=false,caseId=CASES.IMT,hs20SpacingFt=14){
 const m=vehicleModel(L,reversed,caseId,hs20SpacingFt);
 const minS=-m.length,maxS=L;
 const count=Math.max(700,Math.min(2300,Math.ceil((maxS-minS)/.09)));
 const step=(maxS-minS)/count;
 const get=s=>evaluateAt(configuration(L,s,loadFactor,reduction,reversed,caseId,hs20SpacingFt),L/2);
 const f=s=>get(s).Mmax;
 let bestM={value:-Infinity,shift:minS},bestV={value:-Infinity,shift:minS,side:'left'};
 const eps=Math.min(.0001,Math.max(.000001,L*1e-7));
 let prev2=null,prev1=null;
 const addM=(s,v)=>{if(v>bestM.value)bestM={value:v,shift:s}};
 const addV=s=>{const q=get(s);const left=Math.abs(q.shearAt(0,'right')),right=Math.abs(q.shearAt(L,'left'));
  if(left>bestV.value)bestV={value:left,shift:s,side:'left'};
  if(right>bestV.value)bestV={value:right,shift:s,side:'right'};
 };
 for(let i=0;i<=count;i++){
  const s=minS+i*step,val=f(s);addM(s,val);addV(s);
  if(prev2&&prev1&&prev1.val>=prev2.val&&prev1.val>=val){const opt=goldenMax(f,prev2.s,s);addM(opt.shift,opt.value)}
  prev2=prev1;prev1={s,val};
 }
 const events=[minS,maxS,...m.axles.flatMap(a=>[-a.offset,L-a.offset])];
 if(m.trailing){const start=m.trailing.side==='right'?m.length:0;events.push(-start,L-start)}
 for(const ev of events)for(const delta of [-eps,0,eps]){
  const s=clamp(ev+delta,minS,maxS);addM(s,f(s));addV(s);
 }
 const opt=goldenMax(f,clamp(bestM.shift-step,minS,maxS),clamp(bestM.shift+step,minS,maxS));addM(opt.shift,opt.value);
 const qM=get(bestM.shift),qV=get(bestV.shift);
 const xShear=bestV.side==='left'?0:L;
 const signedV=bestV.side==='left'?qV.shearAt(0,'right'):qV.shearAt(L,'left');
 return {moment:{shift:bestM.shift,x:qM.xM,value:qM.Mmax},
   shear:{shift:bestV.shift,x:xShear,value:signedV,absolute:bestV.value,side:bestV.side},model:m};
}
export function sampleDiagram(response,n=160){const points=[];for(let i=0;i<=n;i++){const x=response.L*i/n;points.push({x,M:response.momentAt(x),V:response.shearAt(x)})}return points}
