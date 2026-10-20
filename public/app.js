import {vehicleModel,evaluateAt,configuration,findCritical,sampleDiagram,round,CASES,FT,KIP} from './engine.js';
const $=id=>document.getElementById(id);
const number=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const saved=(()=>{try{return JSON.parse(localStorage.getItem('sphyre-live-loads-v1')||'{}')}catch{return {}}})();
const state={L:30,shift:0,x:15,loadFactor:1,reduction:1,reversed:false,caseId:CASES.IMT,hs20SpacingFt:14,critical:null,response:null,playing:false,frame:null,lastFrame:0};
let updateToken=0;
if(Number.isFinite(+saved.L)&&+saved.L>=1&&+saved.L<=300)state.L=+saved.L;
if(saved.loadFactor===1.33)state.loadFactor=1.33;
if(saved.reduction===0.9)state.reduction=0.9;
if(saved.reversed===true)state.reversed=true;
if(Object.values(CASES).includes(saved.caseId))state.caseId=saved.caseId;
if(Number.isFinite(+saved.hs20SpacingFt)&&+saved.hs20SpacingFt>=14&&+saved.hs20SpacingFt<=30)state.hs20SpacingFt=+saved.hs20SpacingFt;
$('case-select').value=state.caseId;$('hs20-spacing').value=state.hs20SpacingFt;
$('span-input').value=state.L.toFixed(2);$('span-range').value=Math.min(100,Math.max(5,state.L));
$('impact-select').value=String(state.loadFactor);$('road-c').checked=state.reduction===0.9;$('reverse').checked=state.reversed;
function cache(){try{localStorage.setItem('sphyre-live-loads-v1',JSON.stringify({L:state.L,loadFactor:state.loadFactor,reduction:state.reduction,reversed:state.reversed,caseId:state.caseId,hs20SpacingFt:state.hs20SpacingFt}))}catch{}}
function model(){return vehicleModel(state.L,state.reversed,state.caseId,state.hs20SpacingFt)}
function current(){return evaluateAt(configuration(state.L,state.shift,state.loadFactor,state.reduction,state.reversed,state.caseId,state.hs20SpacingFt),state.x)}
const pos=(x,L)=>92+816*x/L;
function loadSchematicSVG(m){
 const rail=m.category==='rail',lane=m.caseId===CASES.HS20_M||m.caseId===CASES.HS20_V;
 const W=rail?1440:930,H=218,edge=44;
 const nominal=(a)=>number(a.force,rail?1:2),ft=rail||m.caseId===CASES.HS20;
 const left=rail&&m.trailing?.side==='left'?-11:0;
 const right=Math.max(m.length+(rail&&m.trailing?.side==='right'?11:0),lane?Math.min(state.L,45):m.length+1,1);
 const xp=z=>edge+(W-2*edge)*(z-left)/(right-left);
 let parts='<rect width="'+W+'" height="'+H+'" fill="#10151b"/><line x1="32" y1="150" x2="'+(W-32)+'" y2="150" stroke="#8495a4" stroke-width="4"/>';
 if(m.w){
   const a=rail?(m.trailing?.side==='left'?left:m.length):0,b=rail?(m.trailing?.side==='left'?0:right):right;
   const x1=xp(a),x2=xp(b);
   parts+='<rect x="'+Math.min(x1,x2)+'" y="91" width="'+Math.abs(x2-x1)+'" height="38" fill="#bda16d" fill-opacity=".17"/>';
   for(let i=0;i<16;i++){const x=x1+(x2-x1)*(i+.5)/16;parts+='<path d="M'+x+' 89 v34 l-4 -7 m4 7 l4 -7" stroke="#e4bc80" fill="none"/>'}
   parts+='<text x="'+((x1+x2)/2)+'" y="77" font-size="15" fill="#ebc788" text-anchor="middle">w = '+number(m.w,2)+' tf/m</text>';
 }
 for(let i=0;i<m.axles.length;i++){
   const axle=m.axles[i],x=xp(axle.offset);
   parts+='<path d="M'+x+' 73 v55 m-5 -9 l5 9 l5 -9" stroke="#f3c87e" stroke-width="2.3" fill="none"/><circle cx="'+x+'" cy="150" r="5" fill="#f1c581"/>';
   parts+='<text x="'+x+'" y="'+(i%2?52:34)+'" text-anchor="middle" font-size="'+(rail?11:14)+'" fill="#ffe0a5" font-weight="700">'+nominal(axle)+'</text>';
   if(i){const x0=xp(m.axles[i-1].offset),mid=(x0+x)/2,dy=rail?(i%2?204:185):196;
     parts+='<path d="M'+x0+' '+(dy-10)+' v16 M'+x+' '+(dy-10)+' v16 M'+x0+' '+(dy-6)+' H'+x+'" stroke="#899cab" fill="none"/><text x="'+mid+'" y="'+(dy+11)+'" text-anchor="middle" font-size="'+(rail?10:13)+'" fill="#d0d8df">'+number((axle.offset-m.axles[i-1].offset)/(ft?FT:1),rail?0:2)+'</text>';
   }
 }
 $('schematic-units').textContent='P nominal en tf · distancias en '+(ft?'ft':'m');
 $('schematic-foot').textContent=rail?'Cooper: dos locomotoras y cola uniforme móvil. Valores por vía completa; verifica AREMA.':lane?'Carga de carril: fuerza puntual más carga distribuida; alternativa al camión HS-20.':'Cargas por eje y separaciones. Desliza para ver el esquema completo.';
 const svg=$('load-schematic');svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.minWidth=rail?'1200px':'790px';
 return parts;
}
function bridgeSVG(q, m){
  const L=state.L,S=816/L,x=p=>pos(p,L), x0=92,x1=908;
  let ticks='',wheels='',loads='',loadLabels='';
  for(let i=0;i<=10;i++){
    let xx=x(L*i/10);ticks+=`<line x1="${xx}" y1="279" x2="${xx}" y2="292" stroke="#57616a"/><text x="${xx}" y="307" fill="#91969e" font-size="12" text-anchor="middle">${number(L*i/10,1)}</text>`;
  }
  const axle=m.axles.map(a=>({...a,p:a.force*state.loadFactor*state.reduction,at:state.shift+a.offset}));
  const aMin=x(state.shift),aMax=x(state.shift+m.length);
  const bodyH=60, top=120, cabX=aMin-27, cabW=Math.min(105,Math.max(40,(aMax-aMin)*0.24));
  let truck=`<g clip-path="url(#spanclip)"><ellipse cx="${(aMin+aMax)/2}" cy="205" rx="${Math.max(40,(aMax-aMin)/2+15)}" ry="9" fill="#070b0d" opacity=".65"/>
    <rect x="${aMin+cabW*.45}" y="${top+6}" width="${Math.max(25,aMax-aMin-cabW*.45+24)}" height="${bodyH-12}" rx="4" fill="url(#trailer)" stroke="#7b8790" stroke-width="1.2"/>
    <path d="M ${cabX+12} ${top+17} L ${cabX+cabW-17} ${top+17} L ${cabX+cabW} ${top+35} L ${cabX+cabW} ${top+67} L ${cabX+3} ${top+67} L ${cabX+3} ${top+34} Z" fill="url(#cab)" stroke="#8e9aa0" stroke-width="1.4"/>
    <path d="M ${cabX+cabW*.39} ${top+26} H ${cabX+cabW-19} L ${cabX+cabW-7} ${top+38} H ${cabX+cabW*.39} Z" fill="#7d9aa3" opacity=".84"/>
    <line x1="${aMin+cabW*.6}" y1="${top+19}" x2="${aMax+12}" y2="${top+19}" stroke="#cdd6d7" stroke-opacity=".25" stroke-width="2"/>
    <rect x="${aMin+cabW*.7}" y="${top+54}" width="${Math.max(14,aMax-aMin-cabW*.7+17)}" height="5" fill="#c1a772" opacity=".75"/>
    <rect x="${cabX+cabW-2}" y="${top+59}" width="6" height="9" rx="1" fill="#f3dbaa"/></g>`;
  if(m.category==='rail'){
    const tailStart=state.shift+(m.trailing.side==='right'?m.length:0);
    const locoLen=(m.length-m.trailing.gap)/2;
    truck=`<g clip-path="url(#spanclip)">${[0,1].map(i=>{
      const origin=state.shift+(state.reversed?m.trailing.gap:0)+i*locoLen;
      const xa=x(origin),xb=x(origin+locoLen-FT);
      return `<rect x="${xa}" y="153" width="${Math.max(0,xb-xa)}" height="42" rx="5" fill="url(#trailer)" stroke="#c9ad76" stroke-width="1.8"/><rect x="${xa+6}" y="135" width="${Math.max(0,Math.min(80,xb-xa-12))}" height="22" rx="3" fill="#8b999e"/><rect x="${xa+12}" y="140" width="28" height="13" rx="2" fill="#304453"/><text x="${(xa+xb)/2}" y="181" fill="#f0d19a" font-size="15" font-weight="700" text-anchor="middle">COOPER E${m.caseId==='e80'?'80':'50'}</text>`;
    }).join('')}<line x1="${x0}" y1="200" x2="${x1}" y2="200" stroke="#d6c5a5" stroke-width="4"/></g>`;
  }
  if(m.caseId==='hs20lane-m'||m.caseId==='hs20lane-v')truck='';
  for(const a of axle){
    const xx=x(a.at),inSpan=a.at>=-1e-8&&a.at<=L+1e-8;
    wheels+=`<g ${inSpan?'':'opacity=".22"'}><circle cx="${xx}" cy="192" r="13" fill="#101419" stroke="#8d989d" stroke-width="3"/><circle cx="${xx}" cy="192" r="6" fill="#b3b9bc"/><circle cx="${xx}" cy="192" r="2" fill="#343b42"/></g>`;
    if(inSpan){
      loads+=`<path d="M ${xx} 210 V 240" stroke="#e6bb6c" stroke-width="3.3"/><path d="M ${xx-6} 232 L ${xx} 241 L ${xx+6} 232 Z" fill="#e6bb6c"/>`;
      loadLabels+=`<g><rect x="${xx-28}" y="77" width="56" height="26" rx="6" fill="#27231d" stroke="#9a7c4a"/><text x="${xx}" y="94" font-size="12" fill="#efcf95" font-weight="700" text-anchor="middle">${number(a.p,1)}</text></g>`;
    }
  }
  let qdist='';
  if(q.segments.length){
    for(const seg of q.segments){for(let i=0;i<=20;i++){let xx=x(seg.a+(seg.b-seg.a)*i/20);qdist+=`<path d="M ${xx} 112 V 143" stroke="#c1a66e" stroke-opacity=".47" stroke-width="1"/><path d="M ${xx-3} 138 L ${xx} 145 L ${xx+3} 138" fill="none" stroke="#c1a66e" opacity=".55"/>`}}
    qdist+=`<text x="500" y="105" font-size="12" letter-spacing="1.2" fill="#d9bf8d" text-anchor="middle">w = ${number(m.w*state.reduction,3)} tf/m · TRAMO CARGADO MÓVIL</text>`;
  }
  const criticalLine=q.xM?`<line x1="${x(q.xM)}" y1="216" x2="${x(q.xM)}" y2="283" stroke="#fa7472" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${x(q.xM)}" cy="245" r="5" fill="#fa7774" stroke="#fff" stroke-width="1"/>`:'';
  return `<defs><linearGradient id="girder" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a3abb0"/><stop offset=".3" stop-color="#545c65"/><stop offset=".7" stop-color="#777e83"/><stop offset="1" stop-color="#313941"/></linearGradient><linearGradient id="cab" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f4eee0"/><stop offset=".5" stop-color="#8b989c"/><stop offset="1" stop-color="#4e5c68"/></linearGradient><linearGradient id="trailer" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d7dbd7"/><stop offset=".45" stop-color="#5f6a70"/><stop offset="1" stop-color="#3c4650"/></linearGradient><linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2c333b"/><stop offset="1" stop-color="#171b20"/></linearGradient><clipPath id="spanclip"><rect x="${x0-5}" y="70" width="${x1-x0+10}" height="165"/></clipPath></defs>
  <rect x="0" y="0" width="1000" height="360" fill="transparent"/><g stroke="#29313a" stroke-width="1">${Array.from({length:17},(_,i)=>`<line x1="${92+i*51}" y1="30" x2="${92+i*51}" y2="314"/>`).join('')}${Array.from({length:7},(_,i)=>`<line x1="68" y1="${42+i*44}" x2="932" y2="${42+i*44}"/>`).join('')}</g>
  <text x="92" y="44" font-size="12" fill="#8e9ba7">ANÁLISIS LONGITUDINAL</text><text x="908" y="44" text-anchor="end" font-size="12" fill="#8e9ba7">L = ${number(L)} m</text>
  ${qdist}
  <rect x="${x0}" y="200" width="${x1-x0}" height="10" fill="#30353a"/><line x1="${x0}" y1="199" x2="${x1}" y2="199" stroke="#c5ad7d" stroke-width="3"/>
  ${truck}${wheels}${loads}${loadLabels}
  <path d="M ${x0} 211 H ${x1} V 223 H ${x0} Z" fill="url(#girder)" stroke="#9da5ac"/><path d="M ${x0+12} 224 H ${x1-12} L ${x1-16} 259 H ${x0+16} Z" fill="url(#girder)" stroke="#879198" stroke-width="1"/><rect x="${x0}" y="260" width="${x1-x0}" height="12" fill="#808992"/><rect x="${x0}" y="268" width="${x1-x0}" height="4" fill="#313a43"/><line x1="${x0+3}" y1="232" x2="${x1-3}" y2="232" stroke="#b8c0c2" opacity=".4"/>
  ${criticalLine}
  <g><rect x="${x0-21}" y="273" width="42" height="9" fill="#d0a95f"/><path d="M ${x0} 282 L ${x0-21} 311 L ${x0+21} 311 Z" fill="#d6b477"/><rect x="${x0-32}" y="311" width="64" height="7" fill="#6c747b"/><rect x="${x1-21}" y="273" width="42" height="9" fill="#d0a95f"/><path d="M ${x1} 282 L ${x1-21} 311 L ${x1+21} 311 Z" fill="#d6b477"/><circle cx="${x1-14}" cy="313" r="4.2" fill="#bcc2c6"/><circle cx="${x1+14}" cy="313" r="4.2" fill="#bcc2c6"/><rect x="${x1-32}" y="318" width="64" height="6" fill="#6c747b"/></g>
  <text x="${x0}" y="340" fill="#dedede" font-size="12" text-anchor="middle">A</text><text x="${x1}" y="340" fill="#dedede" font-size="12" text-anchor="middle">B</text><g>${ticks}</g>
  <text x="500" y="352" fill="#a5aab0" font-size="10" letter-spacing="1" text-anchor="middle">COORDENADA LONGITUDINAL · m</text>`;
}
function diagramSVG(response,type){
  const L=response.L;const X=x=>35+432*x/L;let curve='';let nodes=[];
  let base,denom,Y,extLabel;
  if(type==='M'){
    const max=Math.max(0.0001,response.Mmax);base=37;denom=max;Y=v=>base+142*v/max;
    nodes=sampleDiagram(response,220).map(t=>({x:t.x,y:t.M}));
    extLabel=`M+ ${number(response.Mmax,1)} tf·m`;
  }else{
    const max=Math.max(0.0001,Math.abs(response.RA),Math.abs(response.RB));base=109;denom=max;Y=v=>base-72*v/max;
    const sorted=[...response.loads].sort((a,b)=>a.x-b.x);
    nodes=[{x:0,y:response.shearAt(0,'right')}];
    for(const a of sorted){if(a.x>0&&a.x<L){nodes.push({x:a.x,y:response.shearAt(a.x,'left')});nodes.push({x:a.x,y:response.shearAt(a.x,'right')});}}
    nodes.push({x:L,y:response.shearAt(L,'left')});
    extLabel=`V ±${number(max,1)} tf`;
  }
  curve=nodes.map((p,i)=>`${i===0?'M':'L'} ${X(p.x).toFixed(2)} ${Y(p.y).toFixed(2)}`).join(' ');
  const fill=curve+` L ${X(L)} ${base} L ${X(0)} ${base} Z`;
  const selected=type==='M'?response.Mselected:response.Vselected;
  let grid='';for(let j=0;j<=5;j++){let px=35+432*j/5;grid+=`<line x1="${px}" y1="30" x2="${px}" y2="193" stroke="#343c45" stroke-dasharray="3 5"/>`}
  for(let k=-2;k<=2;k++){let py=109+k*36;grid+=`<line x1="35" y1="${py}" x2="467" y2="${py}" stroke="#333b43"/>`}
  return `<defs><linearGradient id="f${type}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${type==='M'?'#d6b173':'#79b3b1'}" stop-opacity=".38"/><stop offset="1" stop-color="#151a20" stop-opacity=".06"/></linearGradient></defs>${grid}<line x1="35" y1="${base}" x2="467" y2="${base}" stroke="#98a2a9"/><path d="${fill}" fill="url(#f${type})"/><path d="${curve}" fill="none" stroke="${type==='M'?'#e3b871':'#8fc8c6'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line x1="${X(response.xSelected)}" y1="27" x2="${X(response.xSelected)}" y2="195" stroke="#f0d2a0" stroke-dasharray="4 4"/><circle cx="${X(response.xSelected)}" cy="${Y(selected)}" r="5" stroke="#fff" stroke-width="2" fill="${type==='M'?'#e8b871':'#91d0d0'}"/><text x="35" y="17" font-size="11" fill="#a7adb5">${extLabel}</text><text x="467" y="210" font-size="11" fill="#969aa0" text-anchor="end">x (m)</text>`;
}
function updateView(){
  const m=model();const q=current();state.response=q;
  const c=state.critical;
  $('model-name').textContent=m.label;
  $('model-description').textContent=m.description;
  $('load-schematic').innerHTML=loadSchematicSVG(m);
  $('model-forces').textContent=m.category==='rail'?'P = '+[.5,1,.65].map(f=>number((m.caseId==='e80'?80:50)*KIP*f,2)).join(' / ')+' tf (piloto / motriz / ténder)': 'P = '+m.axles.map(a=>number(a.force,2)).join(' / ')+' tf';
  $('model-w').textContent=`w = ${number(m.w*state.reduction,3)} tf/m`;
  $('metric-m').textContent=number(c.moment.value);$('metric-m-x').textContent=`x = ${number(c.moment.x)} m · móvil = ${number(c.moment.shift)} m`;
  $('metric-v').textContent=number(c.shear.absolute);$('metric-v-x').textContent=`x = ${number(c.shear.x)} m · móvil = ${number(c.shear.shift)} m`;
  $('metric-ra').textContent=number(q.RA);$('metric-rb').textContent=number(q.RB);
  $('shift-label').textContent=number(state.shift)+' m';$('vehicle-slider').value=state.shift;
  $('x-label').textContent=number(state.x);$('section-range').value=state.x;
  $('reading-m').innerHTML=`${number(q.Mselected)} <small>tf·m</small>`;
  $('reading-v').innerHTML=`${number(q.Vselected)} <small>tf</small>`;
  $('moment-max').textContent=`M actual = ${number(q.Mmax)} tf·m`;
  $('shear-max').textContent=`|V| actual = ${number(Math.max(Math.abs(q.RA),Math.abs(q.RB)))} tf`;
  $('chart-end-m').textContent=number(state.L,1)+' m';$('chart-end-v').textContent=number(state.L,1)+' m';
  $('on-span-count').textContent=`${q.loads.length} de ${m.axles.length} ejes en el claro${m.trailing?' · cola móvil '+(q.segments.length?'activa':'fuera'):''}`;
  $('bridge-svg').innerHTML=bridgeSVG(q,m);$('moment-svg').innerHTML=diagramSVG(q,'M');$('shear-svg').innerHTML=diagramSVG(q,'V');
  const isM=Math.abs(state.shift-c.moment.shift)<0.011;
  const isV=Math.abs(state.shift-c.shear.shift)<0.011;
  $('current-state').textContent=isM?'● Posición crítica de momento':isV?'● Posición crítica de cortante':'● Posición de análisis';
}
function updateControls(){
 $('hs20-spacing-field').hidden=state.caseId!==CASES.HS20;
 const imt=state.caseId===CASES.IMT;
 $('road-c-control').hidden=!imt;
 $('road-c').checked=imt&&state.reduction===.9;
 const rail=state.caseId===CASES.E50||state.caseId===CASES.E80;
 $('engineering-note').innerHTML=rail?'<strong>Ferroviario.</strong> Cargas por eje de la vía completa; la cola uniforme se desplaza con las locomotoras. Verificar incremento dinámico AREMA, distribución transversal, carga alternativa AREMA de 4 ejes y factores aplicables.':'<strong>Carretero.</strong> Modelo longitudinal nominal. HS-20 camión y carril son alternativas (no se suman), no equivalen a HL-93. Verifica incremento dinámico y distribución de carga.';
 $('viewer-title').textContent=rail?'Trabe + locomotoras Cooper':'Trabe + vehículo de diseño';
}
function recompute(resetShift=false){
  stop();updateControls();state.critical=findCritical(state.L,state.loadFactor,state.reduction,state.reversed,state.caseId,state.hs20SpacingFt);
  const m=model();$('vehicle-slider').min=-m.length;$('vehicle-slider').max=state.L;
  $('section-range').max=state.L;state.x=state.L/2;
  if(resetShift)state.shift=state.critical.moment.shift;
  state.shift=Math.min(state.L,Math.max(-m.length,state.shift));
  cache();updateView();
}
function setSpan(v){const x=Number(v);if(!Number.isFinite(x)||x<1||x>300)return;
  state.L=x;$('span-input').value=x.toFixed(2);$('span-range').value=Math.min(100,Math.max(5,x));recompute(true);}
$('span-input').addEventListener('change',e=>setSpan(e.target.value));
$('span-range').addEventListener('input',e=>{state.L=+e.target.value;$('span-input').value=state.L.toFixed(2);recompute(false)});
$('case-select').addEventListener('change',e=>{state.caseId=e.target.value;state.reduction=1;state.loadFactor=1;$('impact-select').value='1';recompute(true)});
$('hs20-spacing').addEventListener('change',e=>{const v=+e.target.value;if(v>=14&&v<=30){state.hs20SpacingFt=v;recompute(true)}else e.target.value=state.hs20SpacingFt});
$('impact-select').addEventListener('change',e=>{state.loadFactor=+e.target.value;recompute(false)});
$('road-c').addEventListener('change',e=>{state.reduction=state.caseId===CASES.IMT&&e.target.checked?.9:1;recompute(false)});
$('reverse').addEventListener('change',e=>{state.reversed=e.target.checked;recompute(true)});
$('vehicle-slider').addEventListener('input',e=>{stop();state.shift=+e.target.value;updateView()});
$('section-range').addEventListener('input',e=>{state.x=+e.target.value;updateView()});
$('crit-m-btn').addEventListener('click',()=>{stop();state.shift=state.critical.moment.shift;state.x=state.critical.moment.x;updateView()});
$('crit-v-btn').addEventListener('click',()=>{stop();state.shift=state.critical.shear.shift;state.x=state.critical.shear.x;updateView()});
$('reset-btn').addEventListener('click',()=>{state.L=30;state.loadFactor=1;state.reduction=1;state.reversed=false;state.caseId=CASES.IMT;state.hs20SpacingFt=14;state.shift=0;$('case-select').value=CASES.IMT;$('hs20-spacing').value='14';
  $('span-input').value='30.00';$('span-range').value=30;$('impact-select').value='1';$('road-c').checked=false;$('reverse').checked=false;recompute(true)});
function stop(){state.playing=false;cancelAnimationFrame(state.frame);$('play-btn').textContent='▶';$('play-btn').setAttribute('aria-label','Reproducir');}
function animate(ts){if(!state.playing)return;if(!state.lastFrame)state.lastFrame=ts;
  const elapsed=Math.min(.1,(ts-state.lastFrame)/1000);state.lastFrame=ts;
  state.shift+=elapsed*Math.max(2,state.L/13);
  if(state.shift>=state.L){state.shift=-model().length;}
  updateView();state.frame=requestAnimationFrame(animate);
}
$('play-btn').addEventListener('click',()=>{
  if(state.playing){stop();return}state.playing=true;state.lastFrame=0;
  $('play-btn').textContent='Ⅱ';$('play-btn').setAttribute('aria-label','Pausar');state.frame=requestAnimationFrame(animate);
});
$('export-btn').addEventListener('click',()=>{
  const q=current();const rows=[['SPHYRE LIVE LOADS · '+model().label],['Longitud m',q.L],['Posición móvil m',q.shift],['Modelo',state.caseId],['Separación HS20 ft',state.hs20SpacingFt],['Factor P',state.loadFactor],['Factor tipo C',state.reduction],['Carga uniformemente distribuida activa tf',q.segments.reduce((v,s)=>v+s.w*(s.b-s.a),0)],['RA tf',q.RA],['RB tf',q.RB],['M global tf·m',state.critical.moment.value],['x M global m',state.critical.moment.x],['s M global m',state.critical.moment.shift],['V global tf',state.critical.shear.value],['x V global m',state.critical.shear.x],['s V global m',state.critical.shear.shift],[],['x (m)','M (tf·m)','V (tf)']];
  for(const p of sampleDiagram(q,Math.max(50,Math.ceil(q.L/0.1))))rows.push([p.x.toFixed(4),p.M.toFixed(5),p.V.toFixed(5)]);
  const content='\ufeff'+rows.map(row=>row.join(';')).join('\r\n');
  const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`SPHYRE_${state.caseId.toUpperCase()}_${q.L}m.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
recompute(true);

