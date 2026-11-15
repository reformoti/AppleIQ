'use strict';
const assert=require('node:assert/strict'),C=require('../cinema-details.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(let t=0;t<8;t+=.013){const p=C.gait(t,{walk:true});assert.ok(p.legs.some(l=>l.lift===0),'one foot always supports the body');for(const leg of p.legs){assert.ok(leg.foot.y<=-7);close(distance(leg.hip,leg.knee),38);close(distance(leg.knee,leg.foot),36);if(leg.lift===0)close(leg.foot.y,-7)}for(const arm of p.arms)assert.ok(arm.hand.y>-130,'walking hands stay below the face');const period=C.gait(t+2*Math.PI/8.5,{walk:true});for(let i=0;i<2;i++){close(p.legs[i].foot.x,period.legs[i].foot.x);close(p.legs[i].foot.y,period.legs[i].foot.y)}const leftFoot=p.legs[0].foot.x+18,leftHand=p.arms[0].hand.x+46;assert.ok(leftFoot*leftHand<=1e-8,'same-side arm and leg swing in opposite directions')}
assert.deepEqual(C.gait(0,{walk:true,reduced:true}),C.gait(7,{walk:true,reduced:true}));for(const leg of C.gait(0).legs)assert.ok(Math.abs(leg.knee.x)<=18,'standing legs remain straight');assert.ok(C.gait(1,{seated:true,walk:true}).legs.every(l=>Math.abs(l.foot.x)===38));assert.ok(C.gait(1,{phone:true}).arms[1].hand.y<-190);
let depth=0;const gradient={addColorStop(){}},calls=[];
const ctx=new Proxy({globalAlpha:1,save(){depth++},restore(){assert.ok(depth>0);depth--},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push([k,...a]);for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite '+String(k))},set:(o,k,v)=>(o[k]=v,true)});
for(const kind of ['hero','guest','partner','kid'])for(const mood of ['neutral','smile','sad','laugh','shock','sleep'])for(const reduced of [false,true])for(const walk of [false,true]){C.character(ctx,110,310,2,{kind,mood,walk,reduced,scale:.47});assert.equal(depth,0)}
C.restingFace(ctx,180,200,2);assert.equal(depth,0);assert.ok(calls.length>20000);
// A laughing mouth is a small crescent, never a dark ellipse covering the chin.
calls.length=0;C.face(ctx,2,{headY:0,mood:'laugh'});assert.ok(!calls.some(([method,x,y,rx,ry])=>method==='ellipse'&&y>=12&&rx>=7&&ry>=7));
console.log('Passed: two-bone walk cycle, planted feet, opposite arm swing, straight idle legs, seated/phone poses, reduced motion and every redesigned face.');
