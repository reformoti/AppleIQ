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
 function attach(target,options){
  const doc=target.ownerDocument,view=doc.defaultView;let pointer=null,previous=null,disposed=false;
  const enabled=()=>!disposed&&options.enabled();
  function finish(){if(pointer===null)return;const id=pointer;pointer=null;previous=null;target.classList.remove('dragging');try{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id)}catch{}options.commit()}
  function down(e){if(!enabled()||pointer!==null||e.button!==0||e.isPrimary===false||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;e.preventDefault();pointer=e.pointerId;previous=project(e.clientX,e.clientY,target.getBoundingClientRect());target.classList.add('dragging');target.focus({preventScroll:true});try{target.setPointerCapture?.(pointer)}catch{}}
  function move(e){if(e.pointerId!==pointer)return;if(!enabled()){finish();return}if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;e.preventDefault();const next=project(e.clientX,e.clientY,target.getBoundingClientRect());options.change(turn(options.rotation(),previous,next));previous=next}
  function up(e){if(e.pointerId===pointer)finish()}
  function visibility(){if(doc.hidden)finish()}
  function key(e){if(!enabled()||e.altKey||e.ctrlKey||e.metaKey)return;const steps={ArrowLeft:[0,-1,0],ArrowRight:[0,1,0],ArrowUp:[-1,0,0],ArrowDown:[1,0,0]},axis=steps[e.key];if(!axis)return;e.preventDefault();const a=Math.PI/24;options.change(multiply([...axis.map(x=>x*Math.sin(a)),Math.cos(a)],options.rotation()));options.commit()}
  const subscriptions=[[target,'pointerdown',down],[doc,'pointermove',move],[doc,'pointerup',up],[doc,'pointercancel',up],[target,'lostpointercapture',up],[target,'keydown',key],[doc,'visibilitychange',visibility],[view,'blur',finish]];
  for(const[node,event,handler]of subscriptions)node?.addEventListener(event,handler);
  return{dispose(){if(disposed)return;finish();disposed=true;for(const[node,event,handler]of subscriptions)node?.removeEventListener(event,handler)}};
 }
 const api=Object.freeze({multiply,project,turn,matrix,cssMatrix,attach});scope.AppleOrbit=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
