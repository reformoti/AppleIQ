'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../cinema-details.js'),E=require('../genius-ending.js'),Art=require('../scene-art.js');
// A van parked for the opening three seconds has no wheel or world movement.
for(const t of [0,.5,1,2.9,3])assert.deepEqual(E.ambulanceMotion(t),E.ambulanceMotion(0));
let last=E.ambulanceMotion(3);
for(let t=3.1;t<=9;t+=.1){const f=E.ambulanceMotion(t);assert.ok(f.x>last.x);assert.equal(f.wheelAngle,f.travel/40);assert.ok(f.y>f.curbY+40);assert.ok(f.buildingBottom<f.curbY);last=f}
assert.deepEqual(E.ambulanceMotion(0,true),E.ambulanceMotion(8,true));
let depth=0;const events=[],gradient={addColorStop(){}};
const c=new Proxy({globalAlpha:1,save(){depth++},restore(){assert.ok(depth>0);depth--},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient}, {
 get:(o,k)=>k in o?o[k]:(...a)=>{events.push({kind:k,args:a,fill:o.fillStyle});for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k))},
 set:(o,k,v)=>(o[k]=v,true)
});
C.street(c,2);const houses=events.filter(e=>e.kind==='roundRect'&&e.fill==='#15202b');
assert.equal(houses.length,8);assert.ok(houses.every(e=>e.args[1]+e.args[3]<=665),'all buildings end before the sidewalk');
events.length=0;Art.hospital(c,3,false,()=>{});
assert.ok(events.some(e=>e.kind==='roundRect'&&e.args[0]===330&&e.args[2]===510),'a single hospital bed has normal length');
assert.ok(!events.some(e=>e.kind==='ellipse'&&e.args[0]===1258),'no old distant bed wheel survives');
const original=globalThis.AppleCinema,actors=[];
globalThis.AppleCinema={...C,character(...args){actors.push(args[4]);return C.character(...args)}};
try{const canvas={width:1600,height:900,getBoundingClientRect:()=>({width:1600,height:900})};
 E.draw(c,canvas,29,true);assert.deepEqual(actors.map(o=>o.kind),['guest','partner'],'father and mother use distinct models');
 actors.length=0;E.draw(c,canvas,33,true);assert.ok(actors.every(o=>!o.walk),'parents stop walking during the call');assert.equal(actors.find(o=>o.phone).kind,'partner');
}finally{globalThis.AppleCinema=original}
const table=Art.WARM_LAYOUT.table,actor=Art.WARM_LAYOUT.actor;
const scale=Math.min(actor.w/863,actor.h/1300),visibleLeft=actor.x+(actor.w-863*scale)/2+863*.27*scale;
assert.ok(visibleLeft>table.x+table.w+60,'the table stays away from the character silhouette');
const ui=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.ok(!/href="visual-polish\.css/.test(ui),'restore the original interface styles');
const story=fs.readFileSync(require.resolve('../story.js'),'utf8');assert.ok(story.includes('genius-hill-v448.webp'));assert.ok(story.includes('Під попелом ще тліє моя іскра…'));
assert.ok(fs.statSync(require.resolve('../assets/genius-hill-v448.webp')).size>10000);
assert.equal(depth,0);console.log('Passed: mother/father models, stationary road and parked wheels, travel-linked wheel rotation, short hospital bed, table clearance, old UI and new inscription asset.');
