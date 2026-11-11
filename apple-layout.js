'use strict';
((scope)=>{
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function place(point,bounds,scale,offset={x:0,y:0}){const padX=Math.min(.45,scale*1.25/bounds.width),padY=Math.min(.45,scale*1.4/bounds.height);return{x:clamp((point.x-offset.x)/bounds.width,padX,1-padX),y:clamp((point.y-offset.y)/bounds.height,padY,1-padY)}}
 function hit(objects,x,y){let found=-1,best=Infinity;objects.forEach((o,i)=>{const distance=Math.hypot(x-o.x,y-o.y);if(distance<o.scale*1.35&&distance<best){best=distance;found=i}});return found}
 function attach(target,options){const doc=target.ownerDocument,view=doc.defaultView;let pointer=null,index=0,offset={x:0,y:0},scale=50,disposed=false;
  const enabled=()=>!disposed&&options.enabled();
  function finish(){if(pointer===null)return;const id=pointer;pointer=null;target.classList.remove('placing');try{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id)}catch{}options.commit()}
  function down(e){if(!enabled()||e.button!==0||pointer!==null||e.isPrimary===false)return;const b=target.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,objects=options.objects(b.width,b.height),picked=hit(objects,x,y);if(picked<0)return;e.preventDefault();pointer=e.pointerId;index=picked;scale=objects[index].scale;offset={x:x-objects[index].x,y:y-objects[index].y};target.classList.add('placing');target.focus({preventScroll:true});try{target.setPointerCapture?.(pointer)}catch{}}
  function move(e){if(e.pointerId!==pointer)return;if(!enabled()){finish();return}if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;e.preventDefault();const b=target.getBoundingClientRect();options.change(index,place({x:e.clientX-b.left,y:e.clientY-b.top},b,scale,offset))}
  function up(e){if(e.pointerId===pointer)finish()}
  function key(e){if(!enabled()||e.altKey||e.ctrlKey||e.metaKey)return;const b=target.getBoundingClientRect(),objects=options.objects(b.width,b.height);if(e.key==='Tab')return;if(e.key==='['||e.key===']'){e.preventDefault();index=(index+(e.key===']'?1:objects.length-1))%objects.length;return}const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!direction)return;e.preventDefault();const o=objects[index]||objects[0];options.change(index,place({x:o.x+direction[0]*12,y:o.y+direction[1]*12},b,o.scale));options.commit()}
  const blur=()=>finish(),visibility=()=>{if(doc.hidden)finish()},subscriptions=[[target,'pointerdown',down],[doc,'pointermove',move],[doc,'pointerup',up],[doc,'pointercancel',up],[target,'lostpointercapture',up],[target,'keydown',key],[view,'blur',blur],[doc,'visibilitychange',visibility]];
  for(const[node,name,handler]of subscriptions)node?.addEventListener(name,handler);
  return{selected:()=>index,dispose(){if(disposed)return;finish();disposed=true;for(const[node,name,handler]of subscriptions)node?.removeEventListener(name,handler)}};
 }
 const api=Object.freeze({place,hit,attach});scope.AppleLayout=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
