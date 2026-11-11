'use strict';
const assert=require('node:assert/strict'),G=require('../progression.js'),F=require('../fruit-renderer.js');
for(const advanced of [false,true])for(const rainbow of [false,true]){
 const state=G.normalise({iq:80,advanced,rainbow,qualityLevel:42,speedLevel:4,appleCount:1,potential:0,directions:['clockwise','diagonal'],direction:'diagonal'}),one=G.income(state);
 assert.equal(G.incomePerApple(state),one);
 for(let count=1;count<=9;count++){const p={...state,appleCount:count};assert.equal(G.income(p),one*count);assert.equal(G.incomePerApple(p),one)}
}
const p=G.normalise({iq:40,advanced:true,qualityLevel:42,appleCount:1,potential:1000000}),before=G.income(p);
assert.equal(G.buy(p,'count'),true);assert.equal(p.appleCount,2);assert.equal(p.potential,0);assert.equal(G.income(p),before*2);
const restored=G.normalise(JSON.parse(JSON.stringify(p)));assert.equal(G.income(restored),before*2);
const rainbow={rainbow:true,cinematic:true,appleCount:9},color=t=>F.bodyColor(rainbow,t,0);
assert.deepEqual(color(0),color(6000));assert.notDeepEqual(color(0),color(1000));
assert.ok(color(0)[0]>color(0)[1]*5);assert.ok(color(2000)[1]>color(2000)[0]*5);assert.ok(color(4000)[2]>color(4000)[0]*5);
assert.equal(new Set(Array.from({length:9},(_,i)=>F.bodyColor(rainbow,0,i).join(','))).size,9);
assert.deepEqual(F.bodyColor({...rainbow,rainbow:false},3000,4),[.75,.035,.055]);
console.log('Passed: every apple earns IQ, count purchase doubles income, saved count retains earnings, six-second rainbow cycle and nine separate color phases.');
