const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const T=require('../test-tasks.js'),G=require('../progression.js');
for(let i=0;i<20;i++){
  const q=T.logicalTask(i);
  assert.equal(q.cells.length,9);assert.equal(q.cells[8],null);
  assert.equal(new Set(q.options.map(T.signature)).size,6);
  for(const p of [...q.cells.filter(Boolean),...q.options]){
    if(p.kind==='grid')assert.ok(p.marks.every(x=>x>=0&&x<p.size*p.size));
    if(p.kind==='orbit')assert.ok(p.points>=0&&p.points<256);
  }
}
// Перевірки очікуваних фігур незалежно від генератора варіантів.
assert.deepEqual(T.logicalTask(0).options[T.logicalTask(0).correct].marks,[8]);
assert.deepEqual(T.logicalTask(2).options[T.logicalTask(2).correct].marks,[0,1,2,3,4]);
assert.deepEqual(T.logicalTask(9).options[T.logicalTask(9).correct].marks,[6,8]);
assert.deepEqual(T.logicalTask(19).options[T.logicalTask(19).correct].marks,[3,5,11,12]);
const good=Array.from({length:20},(_,i)=>T.logicalTask(i).correct);
const wrong=good.map(x=>(x+1)%6);
for(let round=0;round<=12;round++){
  const n=Math.min(20,round*2),p=G.normalise({iq:10,potential:0});
  assert.equal(T.count(round),n);assert.equal(T.correctCount(good,round),n);
  assert.equal(T.correctCount(wrong,round),0);
  assert.equal(G.retakeIQ(p,T.correctCount(good,round)),10+n*5);
  assert.equal(G.retakeIQ(p,T.correctCount(wrong,round)),10);
  const rest=good.map((a,i)=>i>=n?(a+1)%6:a);
  assert.equal(T.correctCount(rest,round),n);
  const ambiguous=Array.from({length:20},()=>({ambiguous:true}));
  for(let i=0;i<20;i++)assert.equal(T.task(ambiguous,i,round).correct!==undefined,i<n);
}
for(const [iq,reaction] of [[8,'laugh'],[39,'laugh'],[40,'quiet'],[79,'quiet'],[80,'friends'],[99,'friends'],[100,'friends'],[250,'friends']])assert.equal(G.schoolReaction(iq),reaction);
function storyHarness(saved){
  const store=new Map([['apple-iq-story-01',JSON.stringify(saved)]]),nodes=new Map(),frames=new Map(),events=new Map();let frameId=0;
  const c=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  function get(s){if(s==='canvas')s='#school-canvas';if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)}
  function node(){const classes=new Set();return{style:{},hidden:false,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},append(){},remove(){},setAttribute(){},focus(){},querySelector:get,querySelectorAll:()=>[],getBoundingClientRect:()=>({width:1363,height:936}),getContext:()=>c,addEventListener(type,f){this[type]=f}}}
  const win={AppleProgression:G,AppleAudio:{setTrack(){}},addEventListener:(e,f)=>events.set(e,f),dispatchEvent:e=>events.get(e.type)?.(e)};
  const context={window:win,document:{hidden:false,body:node(),querySelector:get,querySelectorAll:()=>[],createElement:type=>{const n=node();if(type==='aside')nodes.set('aside',n);return n},addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},matchMedia:()=>({matches:false}),devicePixelRatio:1,requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId},cancelAnimationFrame:id=>frames.delete(id),clearTimeout(){},setTimeout(){return 1},CustomEvent:class{constructor(type){this.type=type}},Date,Math,Intl};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../story.js'),'utf8'),context);
  return{api:win.AppleStory,get,events,p:()=>JSON.parse(store.get('apple-iq-story-01')),tick(t){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(t))}};
}
const saved={version:1,iq:10,phase:'mind',step:5,filmTime:36,eventTime:0,potential:42000,speedLevel:6,qualityLevel:7,appleCount:2,advanced:true,discovered:true,thoughtSeen:true,retakeUnlocked:true,retake:true};
let h=storyHarness(saved);assert.equal(h.api.restore(),false);assert.equal(h.api.testRound(),1);
h.api.finishRetake(20);let p=h.p();assert.equal(p.retakeCount,1);assert.equal(p.baseIQ,10);assert.equal(p.phase,'school');assert.equal(p.iq,20);assert.equal(p.potential,42000);assert.equal(p.qualityLevel,7);
h.api.finishRetake(30);assert.equal(h.p().retakeCount,1);assert.equal(h.p().iq,20);
h.tick(1000);h.tick(2000);
h=storyHarness(h.p());assert.equal(h.api.restore(),true);assert.equal(h.api.testRound(),2);h.get('#school-skip').onclick();assert.equal(h.p().phase,'mind');assert.equal(h.p().potential,42000);
h.get('#transform-toggle').onclick();assert.ok(!h.get('aside').innerHTML?.includes('<p>'));
assert.ok(h.get('aside').innerHTML.includes('Активувати · 25,00 IQ'));
// Повторна оплата потрібна навіть після незмінного результату.
const startState=h.p();assert.equal(G.buy(startState,'retake'),true);assert.equal(startState.potential,17000);
h=storyHarness(startState);assert.equal(h.api.restore(),true);h.get('#transform-toggle').onclick();h.get('#start-retake').click();assert.equal(h.p().retake,true);assert.equal(h.p().retakeCount,1);assert.equal(h.api.testRound(),2);
h=storyHarness(h.p());assert.equal(h.api.restore(),false);assert.equal(h.api.testRound(),2);h.api.finishRetake(30);assert.equal(h.p().retakeCount,2);assert.equal(h.p().phase,'school');


// Множник основного IQ діє поверх усіх покращень, включно з першим розділом.
for(const iq of [8,10,39,40,79,80,99,100,110,250]){
 const basic=G.normalise({iq,advanced:true,potential:0});
 assert.ok(Math.abs(G.iqMultiplier(basic)-(1+iq/100))<1e-12);
 assert.ok(Math.abs(G.income(basic)-50*(1+iq/100))<1e-9);
 const upgraded=G.normalise({iq,speedLevel:8,qualityLevel:11,appleCount:3,directions:['clockwise','reverse'],rainbow:true,advanced:true,potential:0});
 const withoutIQ={...upgraded,iq:0};
 assert.ok(Math.abs(G.income(upgraded)/G.income(withoutIQ)-G.iqMultiplier(upgraded))<1e-12);
 assert.ok(Math.abs(G.income({...basic,advanced:false})-2.5*(1+iq/100))<1e-9);
}
// Купівля дає одну спробу; початок і відновлення не списують її повторно.
let economy=G.normalise({iq:10,advanced:true,phase:'mind',step:5,potential:24999});
assert.equal(G.price(economy,'retake'),25000);
const insufficient={...economy};assert.equal(G.buy(economy,'retake'),false);assert.deepEqual(economy,insufficient);
economy.potential=25000;assert.equal(G.buy(economy,'retake'),true);assert.equal(economy.potential,0);
assert.equal(G.buy(economy,'retake'),false);assert.equal(G.price(economy,'retake'),null);
economy=G.normalise(JSON.parse(JSON.stringify(economy)));assert.equal(economy.retakeUnlocked,true);
assert.equal(G.startRetake(economy),true);assert.equal(economy.retakeUnlocked,false);assert.equal(G.startRetake(economy),false);
economy=G.normalise(JSON.parse(JSON.stringify(economy)));assert.equal(economy.retake,true);assert.equal(economy.potential,0);assert.equal(G.price(economy,'retake'),null);
economy.retake=false;assert.equal(G.price(economy,'retake'),25000);
// Ціна змінюється лише на нових порогах і не скидається після гіршої спроби.
for(const [iq,price] of [[20,25000],[39,25000],[40,50000],[40,50000],[79,50000],[80,100000],[99,100000],[100,200000],[100,200000],[30,200000],[80,200000],[110,200000]]){
 G.recordIQ(economy,iq);assert.equal(G.retakeCost(economy),price);assert.equal(G.price(economy,'retake'),price);
 economy=G.normalise(JSON.parse(JSON.stringify(economy)));assert.equal(G.retakeCost(economy),price);
}
const jump=G.normalise({iq:10});G.recordIQ(jump,100);assert.equal(G.retakeCost(jump),200000);
// Сумісність: стара оплачена активація лишається однією активацією.
const old=G.normalise({...saved,retake:false,retakeUnlocked:true,iq:80});assert.equal(old.retakeUnlocked,true);assert.equal(G.retakeCost(old),100000);assert.equal(G.startRetake(old),true);old.retake=false;assert.equal(G.price(old,'retake'),100000);
assert.equal(G.normalise({...saved,retake:true,retakeUnlocked:true}).retakeUnlocked,false);
// Навіть незмінний чи гірший IQ щоразу запускає сцену, зберігаючи покупки.
let repeated={...saved,retake:true,retakeUnlocked:false,retakeCount:0,iq:20,baseIQ:10};
for(const iq of [20,20,40,40,80,80,100,20]){
 h=storyHarness(repeated);assert.equal(h.api.restore(),false);const count=h.p()?.retakeCount||repeated.retakeCount;
 h.api.finishRetake(iq);const finished=h.p();assert.equal(finished.phase,'school');assert.equal(finished.eventTime,0);assert.equal(finished.iq,iq);assert.equal(finished.retakeCount,count+1);assert.equal(finished.retakeUnlocked,false);assert.equal(finished.qualityLevel,7);
 h.api.finishRetake(iq);assert.equal(h.p().retakeCount,count+1);
 // Відновлення посеред сцени та її завершення не відкриває безкоштовної спроби.
 h=storyHarness(finished);assert.equal(h.api.restore(),true);h.get('#school-skip').onclick();repeated={...h.p(),retake:true};assert.equal(repeated.retakeUnlocked,false);
}
console.log('Passed: matrices, scoring, IQ farm bonus, recurring fees, all threshold boundaries, unchanged/worse results, every-result scenes, reloads and legacy activation.');
