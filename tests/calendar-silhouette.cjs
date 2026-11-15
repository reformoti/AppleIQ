'use strict';
const assert=require('node:assert/strict'),C=require('../cinema-details.js');
for(const t of [0,21,22,22.3,22.75])assert.equal(C.cycleEpilogue(t).alpha,0);
let lastX=-Infinity;for(let t=22.75;t<=25.5;t+=.005){const f=C.cycleEpilogue(t);assert.ok(f.alpha>=0&&f.alpha<=.18);assert.ok(f.planeX>=lastX,'flight moves left to right');lastX=f.planeX;assert.ok(f.planeRight<f.right.x-150,'cut occurs well before the right tower');if(f.planeRight>f.left.x&&f.planeX-47<f.left.x+f.left.w)assert.ok(f.planeY+27<f.left.y,'flight clears the left roof')}
assert.equal(C.cycleEpilogue(25.5).end,25.5);assert.deepEqual(C.cycleEpilogue(100),C.cycleEpilogue(25.5));assert.equal(C.cycleEpilogue(NaN).alpha,0);
let depth=0;const calls=[],c=new Proxy({globalAlpha:1,save(){depth++},restore(){assert.ok(depth>0);depth--}},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));calls.push([k,...args])},set:(o,k,v)=>(o[k]=v,true)});
for(const [w,h]of [[1440,900],[390,844]])for(const reduced of [false,true])for(const t of [22,23,24.1,25.49]){C.cycleSkyline(c,w,h,t,reduced);assert.equal(depth,0)}
const planeTranslate=(t,reduced)=>{calls.length=0;C.cycleSkyline(c,390,844,t,reduced);return calls.filter(x=>x[0]==='translate').at(-1).slice(1)};
assert.deepEqual(planeTranslate(23,true),planeTranslate(25,true));assert.ok(planeTranslate(23,false)[0]<planeTranslate(25,false)[0]);const phoneY=planeTranslate(25,false)[1],fit=390/1600;assert.ok(phoneY<=210);assert.ok((844-900*fit)/2+(phoneY+27)*fit<844*.43,'plane remains above the date');
console.log('Passed: subtle final-date reveal, left-to-right flight, rooftop clearance, cut before arrival, capped restored time and reduced/mobile rendering.');
