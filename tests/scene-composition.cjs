'use strict';
const assert=require('node:assert/strict'),C=require('../cinema-details.js'),E=require('../genius-ending.js');
// High-density scenes stay sharp without allocating an unbounded 4K/8K buffer.
for(const [w,h] of [[390,844],[844,390],[1920,1080],[3840,2160],[7680,4320]]){
 const r=C.rasterRatio(w,h,3);assert.ok(r>0&&r<=2);assert.ok(w*h*r*r<=12000001);
}
assert.equal(C.rasterRatio(390,844,3),2);assert.equal(C.rasterRatio(1920,1080,1),1);assert.equal(C.rasterRatio(390,844,NaN),1);
let calls=[],depth=0;const gradient={addColorStop(){}};
const ctx=new Proxy({save(){depth++},restore(){assert.ok(depth>0);depth--},createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push({kind:k,a,stroke:o.strokeStyle,fill:o.fillStyle});for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k))},set:(o,k,v)=>(o[k]=v,true)});
for(const [kind,variant,desk] of [['bedroom','story',545],['bedroom','genius',545],['school','story',515],['happy-school','story',480]]){
 calls=[];C.room(ctx,kind,4,false,variant);assert.equal(depth,0);
 const sheets=calls.filter(x=>x.kind==='roundRect'&&['#bdb29a','#b9ac91','#c3b991','#acbca6','#bbaaa5'].includes(x.fill));
 for(const sheet of sheets){const [x,y,w,h]=sheet.a,lines=calls.filter(l=>['moveTo','lineTo'].includes(l.kind)&&l.stroke==='#777b7555'&&l.a[0]>=x&&l.a[0]<=x+w&&l.a[1]>=y&&l.a[1]<=y+h);assert.equal(lines.length,8,'all four paper lines stay inside each sheet');if(y>450){assert.ok(y+h<=desk,'stationery rests on the desk');if(kind==='bedroom')assert.ok(x>=220&&x+w<=745,'paper stays within desk edges')}}
 if(kind==='bedroom')assert.ok(calls.some(x=>x.kind==='roundRect'&&x.a[0]===714&&x.a[1]+x.a[3]===desk),'pencil holder sits on the table');
 else assert.ok(calls.some(x=>x.kind==='roundRect'&&x.a[0]===702&&x.a[1]===desk-13),'keyboard follows the scene desk height');
}
// Furniture is rendered before moving visitors, including while crossing the desk.
const original=globalThis.AppleCinema;globalThis.AppleCinema={...C,character(...args){calls.push({kind:'actor'});return C.character(...args)},room(...args){calls.push({kind:'decor'});return C.room(...args)}};
try{for(const t of [25,26,27,29,34,36]){calls=[];E.draw(ctx,{width:1600,height:900,getBoundingClientRect:()=>({width:1600,height:900})},t,true);const decor=calls.findIndex(x=>x.kind==='decor'),faces=calls.map((x,i)=>x.kind==='actor'?i:-1).filter(i=>i>=0);assert.ok(decor>=0&&faces.length===2);assert.ok(faces.every(i=>i>decor),'decor cannot cover visitors');assert.equal(depth,0)}}finally{globalThis.AppleCinema=original}
console.log('Passed: desk prop bounds, contained paper lines, visitor layering, bounded high-DPI rendering.');
