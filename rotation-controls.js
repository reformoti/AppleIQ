'use strict';
// Віртуальна кулька: рух курсора задає орієнтацію без обмежень кутів.
((scope)=>{
 const G=scope.AppleProgression||(typeof require==='function'?require('./progression.js'):null);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function multiply(a,b){const[x,y,z,w]=a,[u,v,s,t]=b;return G.normaliseRotation([w*u+x*t+y*s-z*v,w*v-x*s+y*t+z*u,w*s+x*v-y*u+z*t,w*t-x*u-y*v-z*s])}
 function project(x,y,bounds){
  const radius=Math.max(1,Math.min(bounds.width,bounds.height)/2),px=(x-bounds.left-bounds.width/2)/radius,py=(bounds.top+bounds.height/2-y)/radius,d=px*px+py*py;
  return d<=1?[px,py,Math.sqrt(1-d)]:[px/Math.sqrt(d),py/Math.sqrt(d),0];
 }
 function turn(q,from,to){
  const dot=Math.max(-1,Math.min(1,from.reduce((sum,x,i)=>sum+x*to[i],0)));
  let delta;if(dot<-.999999){const axis=cross(from,Math.abs(from[0])<.9?[1,0,0]:[0,1,0]);delta=G.normaliseRotation([...axis,0])}else delta=G.normaliseRotation([...cross(from,to),1+dot]);
  return multiply(delta,G.normaliseRotation(q));
 }
 function matrix(q){const[x,y,z,w]=G.normaliseRotation(q);return[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)]}
 function cssMatrix(q){const m=matrix(q);return'matrix3d('+[m[0],-m[1],m[2],0,-m[3],m[4],-m[5],0,m[6],-m[7],m[8],0,0,0,0,1].join(',')+')'}
 const IDLE_VELOCITY=Object.freeze([.12,.18,.04]);
 function advance(q,velocity,seconds){const v=G.normaliseVelocity(velocity),speed=Math.hypot(...v),dt=Math.max(0,Math.min(1,Number(seconds)||0));if(!speed||!dt)return G.normaliseRotation(q);const angle=speed*dt/2;return multiply([...v.map(x=>x/speed*Math.sin(angle)),Math.cos(angle)],q)}
 function angularVelocity(before,after,seconds){let delta=multiply(after,[-before[0],-before[1],-before[2],before[3]]);if(delta[3]<0)delta=delta.map(x=>-x);const length=Math.hypot(...delta.slice(0,3));if(length<1e-9)return[0,0,0];const rate=2*Math.atan2(length,delta[3])/Math.max(.008,Math.min(.15,seconds||.016));return G.normaliseVelocity(delta.slice(0,3).map(x=>x/length*rate))}
 function attach(target,options){
  const doc=target.ownerDocument,view=doc.defaultView;let pointer=null,previous=null,disposed=false,lastTime=0,lastMove=0,velocity=[0,0,0];
  const enabled=()=>!disposed&&options.enabled();
  const getVelocity=()=>G.normaliseVelocity(options.velocity?options.velocity():velocity);
  const setVelocity=v=>{velocity=G.normaliseVelocity(v);options.spin?.(velocity)};
  const clock=e=>Number.isFinite(e?.timeStamp)?e.timeStamp:Date.now();
  function finish(cancel=false,event){if(pointer===null)return;const id=pointer;pointer=null;previous=null;target.classList.remove('dragging');if(cancel||(event&&clock(event)-lastMove>180))setVelocity([0,0,0]);try{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id)}catch{}options.commit()}
  function down(e){if(!enabled()||pointer!==null||e.button!==0||e.isPrimary===false||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;e.preventDefault();pointer=e.pointerId;previous=project(e.clientX,e.clientY,target.getBoundingClientRect());lastTime=lastMove=clock(e);setVelocity([0,0,0]);target.classList.add('dragging');target.focus({preventScroll:true});try{target.setPointerCapture?.(pointer)}catch{}}
  function move(e){if(e.pointerId!==pointer)return;if(!enabled()){finish(true);return}if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;e.preventDefault();const next=project(e.clientX,e.clientY,target.getBoundingClientRect());const before=options.rotation(),after=turn(before,previous,next),now=clock(e);setVelocity(angularVelocity(before,after,(now-lastTime)/1000));options.change(after);previous=next;lastTime=lastMove=now}
  function up(e){if(e.pointerId===pointer)finish(e.type==='pointercancel',e)}
  function cancel(e){if(e.pointerId===pointer)finish(true,e)}
  function visibility(){if(doc.hidden)finish(true)}
  function key(e){if(!enabled()||e.altKey||e.ctrlKey||e.metaKey)return;const steps={ArrowLeft:[0,-1,0],ArrowRight:[0,1,0],ArrowUp:[-1,0,0],ArrowDown:[1,0,0]},axis=steps[e.key];if(!axis)return;e.preventDefault();const a=Math.PI/24;options.change(multiply([...axis.map(x=>x*Math.sin(a)),Math.cos(a)],options.rotation()));setVelocity(axis.map(x=>x*1.2));options.commit()}
  const blur=()=>finish(true);
  const subscriptions=[[target,'pointerdown',down],[doc,'pointermove',move],[doc,'pointerup',up],[doc,'pointercancel',cancel],[target,'lostpointercapture',up],[target,'keydown',key],[doc,'visibilitychange',visibility],[view,'blur',blur]];
  for(const[node,event,handler]of subscriptions)node?.addEventListener(event,handler);
  return{tick(seconds){if(!enabled()||pointer!==null||!Number.isFinite(seconds)||seconds<=0)return false;let spin=getVelocity();if(Math.hypot(...spin)<.01){spin=[...IDLE_VELOCITY];setVelocity(spin)}options.change(advance(options.rotation(),spin,seconds));return true},dispose(){if(disposed)return;finish(true);disposed=true;for(const[node,event,handler]of subscriptions)node?.removeEventListener(event,handler)}};
 }
 const api=Object.freeze({multiply,project,turn,matrix,cssMatrix,advance,angularVelocity,IDLE_VELOCITY,attach});scope.AppleOrbit=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
