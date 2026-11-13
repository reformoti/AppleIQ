'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../progression.js'),B=require('../genius-battle.js'),E=require('../genius-ending.js'),S=require('../save-store.js'),C=require('../cloud-core.js');
const base=()=>G.normalise({version:1,iq:230,phase:'genius-hub',step:5,filmTime:36,potential:123456,advanced:true,discovered:true,thoughtSeen:true,quietDaySeen:true,qualityLevel:42,appleCount:9,eventTime:0,endingPath:'genius',ultimateStatus:'passed',geniusArena:{next:9,status:'ready',fight:null}});
let p=base();assert.equal(E.begin(p),false);B.start(p);p.geniusArena.fight.result='win';B.advance(p);p.geniusArena.fight.result='win';assert.equal(B.victory(p),true);assert.equal(p.phase,'genius-end');assert.equal(p.eventTime,0);assert.equal(p.iq,250);assert.equal(p.potential,123456);
const completed=JSON.parse(JSON.stringify(p));
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite '+String(k))},set:(o,k,v)=>{o[k]=v;return true}});
for(const [width,height] of [[1200,680],[390,650]])for(const reduced of [true,false]){
  const canvas={width,height,getBoundingClientRect:()=>({width,height})};
  for(let t=0;t<=E.DURATION;t+=.25)E.draw(context,canvas,t,reduced,{thought:{complete:true,naturalWidth:1100,naturalHeight:1300},suit:{complete:true,naturalWidth:850,naturalHeight:1300},...Object.fromEntries(['actOne','actTwo','actThree','hill'].map(k=>[k,{complete:true,naturalWidth:k==='hill'?1672:896,naturalHeight:k==='hill'?941:1200}]))});
  E.draw(context,canvas,10,reduced,{}); // Missing assets do not interrupt the story.
}
assert.equal(E.at(NaN).time,0);assert.equal(E.at(60).id,'years');assert.equal(E.at(74).id,'warm');assert.equal(E.at(88).id,'act-one');assert.equal(E.at(E.DURATION).finished,true);
function harness(saved){
  const nodes=new Map(),values=new Map([[S.STORY,JSON.stringify(saved)]]),frames=new Map(),events=new Map(),classes=new Set();let frame=0,root,track=-1,gain=1;
  const classList={add:n=>classes.add(n),remove:n=>classes.delete(n),toggle:(n,v)=>v?classes.add(n):classes.delete(n),contains:n=>classes.has(n)};
  function get(s){if(!nodes.has(s))nodes.set(s,{style:{},hidden:false,classList,setAttribute(){},focus(){},append(){},remove(){},querySelector:get,querySelectorAll:()=>[],getContext:()=>context,getBoundingClientRect:()=>({width:1200,height:680})});return nodes.get(s)}
  const doc={hidden:false,body:{classList,append:n=>root=n},createElement:()=>get('root'),querySelector:get,querySelectorAll:()=>[],addEventListener(){}};
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const win={AppleProgression:G,AppleGenius:B,AppleGeniusEnding:E,AppleSaveStore:{read:k=>S.read(k,storage),write:(k,v)=>S.write(k,v,storage)},AppleGeniusUI:{hub:(root,p,h)=>events.set('hub',h)},AppleAudio:{setTrack:id=>track=id,setGain:value=>gain=value},AppleFruit:{svg:()=>'',create:()=>({draw(){},dispose(){}})},addEventListener:(n,f)=>events.set(n,f),removeEventListener:(n,f)=>{if(events.get(n)===f)events.delete(n)}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../story.js'),'utf8'),{window:win,document:doc,localStorage:storage,Image:class{},requestAnimationFrame:f=>{frames.set(++frame,f);return frame},cancelAnimationFrame:id=>frames.delete(id),clearTimeout(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,Date,Math,Intl});
  return {track:()=>track,gain:()=>gain,restore:()=>win.AppleStory.restore(),get,doc,classes,events,storage,frames,p:()=>JSON.parse(storage.getItem(S.STORY)),html:()=>root.innerHTML,tick:t=>{const work=[...frames.values()];frames.clear();work.forEach(f=>f(t))}};
}
let h=harness(completed);assert.equal(h.restore(),true);assert.ok(h.html().includes('genius-ending-canvas'));assert.equal(h.frames.size,1);
for(let t=1000;t<=18000;t+=1000)h.tick(t);assert.ok(h.p().eventTime>14&&h.p().eventTime<23);
let snapshot=C.collect(h.storage);assert.equal(C.validate(snapshot),snapshot);h=harness(JSON.parse(snapshot.entries[S.STORY]));h.restore();const restored=h.p().eventTime;h.tick(20000);assert.equal(h.p().eventTime,restored);
h.doc.hidden=true;h.tick(21000);h.tick(23000);assert.equal(h.p().eventTime,restored);h.doc.hidden=false;h.classes.add('settings-open');h.tick(24000);h.tick(26000);assert.equal(h.p().eventTime,restored);h.classes.delete('settings-open');
h.get('#genius-ending-skip').onclick();assert.equal(h.p().eventTime,E.HILL_START);assert.equal(h.frames.size,1);for(let t=30000;t<=46000;t+=1000)h.tick(t);assert.equal(h.p().eventTime,E.DURATION);assert.equal(h.p().geniusEndingSeen,true);assert.equal(h.get('#genius-ending-finale').hidden,false);assert.equal(h.frames.size,1);assert.equal(h.p().potential,123456);
const final=h.p();h=harness(final);h.restore();assert.equal(h.get('#genius-ending-finale').hidden,false);h.get('#genius-ending-replay').onclick();assert.equal(h.p().eventTime,0);assert.equal(h.frames.size,1);h.get('#genius-ending-back').onclick();assert.equal(h.p().phase,'mind');assert.equal(h.p().geniusEndingSeen,true);assert.equal(h.events.has('resize'),false);h.get('#genius-toggle').onclick();assert.ok(h.events.has('hub'));h.events.get('hub').ending();assert.equal(h.p().phase,'genius-end');assert.equal(h.p().eventTime,0);
const old={...completed,phase:'mind'};delete old.geniusEndingSeen;h=harness(old);h.restore();assert.equal(h.p().phase,'genius-end');h=harness({...old,geniusEndingSeen:true});h.restore();assert.ok(h.html().includes('training-object-stage'));assert.equal(h.p().phase,'mind');
assert.equal(E.begin({...completed,geniusEndingSeen:true}),false);assert.equal(E.begin({...completed,geniusEndingSeen:true},true),true);
console.log('Passed: last-boss transition, completed-save migration, original character drawing, mobile/reduced-motion coordinates, missing-image fallback, mid-scene/cloud restore, hidden/settings pause, skip, replay, retained progress and frame/listener cleanup.');

// Three supplied images run in the requested order, followed by a hard cut and an endless epilogue.
assert.deepEqual(E.chapters.slice(-5).map(s=>s.id),['act-one','act-two','act-three','blackout','hill']);
for(const [t,caption] of [[89,'Может это и к лучшему?'],[95,'Кто я после этого?'],[102,'. . .'],[108,'Где я свернул не туда?'],[116,'Чего я добился?'],[125,'']])assert.equal(E.at(t).caption,caption);
assert.equal(E.music(88).id,5);assert.equal(E.music(136.99).id,5);assert.equal(E.music(137).id,7);assert.equal(E.music(137).gain,0);assert.equal(E.music(143).gain,.5);assert.equal(E.music(147).gain,1);assert.notEqual(E.dotAlpha(1,0),E.dotAlpha(1,1));
for(const t of [108,130,137,143,147]){h=harness({...completed,eventTime:t});h.restore();assert.equal(h.p().eventTime,t);assert.equal(h.track(),E.music(t).id);assert.equal(h.gain(),E.music(t).gain);const snapshot=C.collect(h.storage);C.validate(snapshot);assert.equal(JSON.parse(snapshot.entries[S.STORY]).eventTime,t)}
h=harness({...completed,eventTime:147});h.restore();h.tick(1000);h.tick(2000);assert.equal(h.frames.size,1);assert.equal(h.p().eventTime,147);h.get('#genius-ending-back').onclick();assert.equal(h.frames.size,1); // the training loop replaces the epilogue loop
console.log('Passed: act order and exact dialogue, wave dots, blackout music switch, synchronized gain, long-scene/cloud restore and persistent epilogue animation.');
