'use strict';
const assert=require('node:assert/strict'),G=require('../progression.js'),Orbit=require('../rotation-controls.js');
const base=()=>G.normalise({iq:100,phase:'mind',step:5,advanced:true,qualityLevel:42,speedLevel:10,appleCount:3,directions:['clockwise','free'],direction:'free',rainbow:false,lightLevel:3,shadowLevel:3,waterLevel:3,potential:0});
const red=base(),colored={...red,rainbow:true};assert.equal(G.colorMultiplier(colored),8);assert.equal(G.income(colored)/G.income(red),8);
const old=G.normalise({iq:10,potential:0});for(const u of G.LATE_UPGRADES)assert.equal(old[u.id+'Level'],0);assert.deepEqual(old.freeVelocity,[0,0,0]);
for(const invalid of [null,[],[NaN,0,0],[Infinity,0,0],['1',2,3]])assert.deepEqual(G.normaliseVelocity(invalid),[0,0,0]);assert.ok(Math.hypot(...G.normaliseVelocity([80,80,80]))<=8+1e-10);
let p={...colored,appleCount:9,ultimateStatus:'passed'},seconds=0,levels=0,maxPrice=0;
for(const u of G.LATE_UPGRADES){assert.equal(G.canBuy({...p,qualityLevel:41,potential:1e29},u.id),false);let lastCost=0;for(let n=0;n<u.max;n++){const cost=G.price(p,u.id),income=G.income(p);assert.ok(cost>lastCost);seconds+=cost/income;maxPrice=Math.max(maxPrice,cost);p.potential=cost*2;assert.equal(G.buy(p,u.id),true);assert.ok(Math.abs(G.income(p)/income-u.boost)<1e-9);assert.equal(G.normalise(JSON.parse(JSON.stringify(p)))[u.id+'Level'],n+1);lastCost=cost;levels++}assert.equal(G.price(p,u.id),null);assert.equal(G.buy(p,u.id),false)}
assert.equal(levels,52);assert.ok(seconds<30*60,'all new ranks should be reachable in under 30 minutes for the max-form nine-apple reference build');assert.ok(maxPrice<1e30);assert.equal(G.normalise({...p,potential:maxPrice}).potential,maxPrice);assert.equal(G.income({...p,ultimateStatus:'failed'}),0);
function eventNode(){const handlers=new Map();return{handlers,addEventListener:(e,f)=>handlers.set(e,f),removeEventListener:(e,f)=>{if(handlers.get(e)===f)handlers.delete(e)},fire:(e,value={})=>handlers.get(e)?.({type:e,preventDefault(){},...value})}}
const doc=eventNode(),view=eventNode(),target=eventNode();doc.defaultView=view;doc.hidden=false;target.ownerDocument=doc;target.classList={add(){},remove(){}};target.focus=()=>{};target.getBoundingClientRect=()=>({left:0,top:0,width:200,height:200});target.setPointerCapture=()=>{};target.hasPointerCapture=()=>false;
let q=[0,0,0,1],velocity=[0,0,0],enabled=true,committed=0;
const controller=Orbit.attach(target,{enabled:()=>enabled&&!doc.hidden,rotation:()=>q,change:next=>q=next,velocity:()=>velocity,spin:v=>velocity=v,commit:()=>committed++});
assert.equal(controller.tick(.1),true);assert.notDeepEqual(q,[0,0,0,1]);assert.deepEqual(velocity,[...Orbit.IDLE_VELOCITY]);
target.fire('pointerdown',{pointerId:1,button:0,clientX:100,clientY:100,timeStamp:1000});const held=[...q];assert.equal(controller.tick(.1),false);assert.deepEqual(q,held);
doc.fire('pointermove',{pointerId:1,clientX:160,clientY:120,timeStamp:1050});doc.fire('pointerup',{pointerId:1,timeStamp:1060});const released=[...q],spin=[...velocity];assert.ok(Math.hypot(...spin)>1);assert.equal(committed,1);
for(let i=0;i<100;i++)controller.tick(.016);assert.notDeepEqual(q,released);assert.deepEqual(velocity,spin);assert.ok(Math.abs(Math.hypot(...q)-1)<1e-12);
const save=G.normalise({freeRotation:q,freeVelocity:velocity});assert.deepEqual(save.freeVelocity,spin);const resumed=Orbit.advance(save.freeRotation,save.freeVelocity,.1);assert.notDeepEqual(resumed,save.freeRotation);
enabled=false;const paused=[...q];controller.tick(.5);assert.deepEqual(q,paused);enabled=true;
target.fire('pointerdown',{pointerId:2,button:0,clientX:100,clientY:100,timeStamp:2000});doc.fire('pointermove',{pointerId:2,clientX:130,clientY:100,timeStamp:2050});doc.fire('pointerup',{pointerId:2,timeStamp:2400});assert.deepEqual(velocity,[0,0,0]);controller.tick(.1);assert.deepEqual(velocity,[...Orbit.IDLE_VELOCITY]);
controller.dispose();assert.equal(target.handlers.size,0);assert.equal(doc.handlers.size,0);assert.equal(view.handlers.size,0);
console.log('Passed: rainbow x8, 52 reachable late upgrades, old-save migration, idle rotation, release momentum at fixed speed, hold-to-stop, paused motion, velocity persistence and listener cleanup.');
