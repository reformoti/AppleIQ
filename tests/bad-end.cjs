const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const Secret=require('../bad-ending.js'),G=require('../progression.js'),T=require('../test-tasks.js');
const combo=Array.from({length:20},(_,i)=>[0,2,1,3,4][i%5]);
assert.equal(Secret.matches(combo,true),true);assert.equal(Secret.matches(combo,false),false);
for(let i=0;i<20;i++){const wrong=[...combo];wrong[i]=(wrong[i]+1)%6;assert.equal(Secret.matches(wrong,true),false)}
assert.equal(Secret.matches(combo.slice(0,19),true),false);assert.equal(Secret.matches([...combo,0],true),false);assert.equal(Secret.matches(combo.map(String),true),false);
assert.equal(Secret.risingIQ(-1),160);
for(const [time,iq]of [[0,160],[1.99,160],[2,161],[3.99,161],[4,162],[5.5,163],[6.7,164],[7.6,165]])assert.equal(Secret.frame(time).iq,iq);
assert.ok(Secret.frame(12).iq<200);assert.ok(Secret.frame(18).iq>500);assert.equal(Secret.frame(22).iq,'∞');assert.equal(Secret.frame(3.6).shade,1);
const motion=Secret.distortion(6);assert.notEqual(motion.scaleX,1);assert.notEqual(motion.x,0);assert.ok(Math.abs(Secret.distortion(6,true).x)<Math.abs(motion.x));assert.equal(Secret.frame(20).ready,false);
const end=Secret.frame(24);for(const name of['hero','apples','shade','title'])assert.equal(end[name],1);assert.equal(end.ready,true);
for(const [time,fade,showVideo,videoTime]of [[28,0,false,0],[30,0,false,0],[32.5,.5,false,0],[35,1,true,0],[38,1,true,3],[42,1,true,7]]){const o=Secret.outro(time,42);assert.equal(o.fade,fade);assert.equal(o.showVideo,showVideo);assert.equal(o.videoTime,videoTime)}
assert.deepEqual(Secret.outro(100,NaN),{fade:0,showVideo:false,videoTime:0});
function classes(){const values=new Set();return{add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v),toggle:(v,on)=>on?values.add(v):values.delete(v)}}
function appHarness(saved=null,restore=false,finished=false){
 const store=new Map(saved?[['apple-iq-protocol-02',JSON.stringify(saved)]]:[]),nodes=new Map(),intervals=new Map(),calls=[],tracks=[],events=new Map();let id=0;if(finished)store.set('apple-iq-ended-01','1');const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 function get(s){if(!nodes.has(s))nodes.set(s,{style:{},classList:classes(),hidden:false,innerHTML:'',textContent:'',focus(){},setAttribute(){}});return nodes.get(s)}
 const options=Array.from({length:6},(_,i)=>({dataset:{choice:String(i)},classList:classes(),setAttribute(){}}));
 const doc={hidden:false,body:get('body'),querySelector:get,querySelectorAll:s=>s==='[data-choice]'?options:[],addEventListener(){}};
 const win={AppleBadEnd:Secret,AppleTest:T,AppleStory:{restore:()=>restore,testRound:()=>1,scoreRetake:()=>10,begin:iq=>calls.push(['normal',iq]),beginBadEnd:()=>calls.push(['secret']),finishRetake:iq=>calls.push(['retake',iq])},AppleAudio:{setTrack:n=>tracks.push(n)},addEventListener:(n,f)=>events.set(n,f)};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),{window:win,document:doc,localStorage:storage,setInterval:(f,ms)=>{intervals.set(++id,{f,ms});return id},clearInterval:id=>intervals.delete(id),Date,Math,Number,JSON});
 return{get,doc,calls,tracks,store,storage,events,win,state:()=>JSON.parse(store.get('apple-iq-protocol-02')),answer:a=>{options[a].onclick();get('#next').onclick()},countdown:()=>[...intervals.values()].at(-1).f()};
}
let h=appHarness();combo.forEach(h.answer);assert.equal(h.state().resultIQ,160);assert.equal(h.state().secretEnding,true);assert.ok(h.get('#content').innerHTML.includes('160<span>IQ'));
h.countdown();h.doc.hidden=true;h.countdown();h.doc.hidden=false;h.doc.body.classList.add('settings-open');h.countdown();h.doc.body.classList.remove('settings-open');assert.deepEqual(h.calls,[]);for(let i=0;i<3;i++)h.countdown();assert.deepEqual(h.calls,[]);assert.equal(h.get('#countdown').textContent,1);h.countdown();assert.deepEqual(h.calls,[['secret']]);assert.ok(!h.tracks.includes(1));
const secretSave=h.state();h=appHarness(secretSave);assert.ok(h.get('#content').innerHTML.includes('160<span>IQ'));for(let i=0;i<4;i++)h.countdown();assert.deepEqual(h.calls,[]);h.countdown();assert.deepEqual(h.calls,[['secret']]);
h=appHarness(secretSave,true);assert.deepEqual(h.calls,[]);assert.equal(h.get('#content').innerHTML,'');
// Завершення стирає саме ігровий прогрес, а pagehide не записує старий тест назад.
h=appHarness(secretSave);h.store.set('apple-iq-story-01','old');h.store.set('appleiq-audio-01','keep');Secret.exit(null,{replace(){}},h.storage);h.events.get('pagehide')();assert.equal(h.store.has('apple-iq-protocol-02'),false);assert.equal(h.store.has('apple-iq-story-01'),false);assert.equal(h.store.get('appleiq-audio-01'),'keep');
h=appHarness(secretSave);h.win.AppleStory.isRestarting=()=>true;h.store.delete('apple-iq-protocol-02');h.events.get('pagehide')();assert.equal(h.store.has('apple-iq-protocol-02'),false);
h=appHarness(secretSave,false,true);assert.ok(h.get('#counter').innerHTML.startsWith('01 '));assert.equal(h.store.has('apple-iq-ended-01'),false);h.answer(0);assert.equal(h.state().index,1);assert.equal(h.state().pendingRetake,false);
const wrong=[...combo];wrong[19]=5;h=appHarness();wrong.forEach(h.answer);assert.ok(h.state().resultIQ>=8&&h.state().resultIQ<=12);assert.ok(h.get('#content').innerHTML.includes('id="countdown">5</span>'));for(let i=0;i<4;i++)h.countdown();assert.deepEqual(h.calls,[]);h.countdown();assert.equal(h.calls[0][0],'normal');
h=appHarness({format:'matrix-03',index:0,responses:Array(20).fill(null),elapsed:0,completed:false,pendingRetake:true,round:1});combo.forEach(h.answer);assert.equal(h.state().secretEnding,false);assert.equal(h.state().resultIQ,10);for(let i=0;i<4;i++)h.countdown();assert.deepEqual(h.calls,[]);h.countdown();assert.deepEqual(h.calls,[['retake',10]]);
function storyHarness(saved=null){
 const store=new Map(saved?[['apple-iq-story-01',JSON.stringify(saved)]]:[]),nodes=new Map(),frames=new Map(),tracks=[],draws=[],exits=[],endListeners=new Set(),trackOptions=[];let id=0,disposed=0,audioTime=0,audioDuration=42,audioPaused=false;
 const c=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 function node(){return{style:{},classList:classes(),hidden:false,append(){},remove(){},setAttribute(){},focus(){},querySelector:get,querySelectorAll:()=>[],getBoundingClientRect:()=>({width:1360,height:936}),getContext:()=>c,readyState:1,duration:7,currentTime:0,paused:true,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}}}
 function get(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)}
 const win={AppleProgression:G,AppleBadEnd:Secret,AppleAudio:{setTrack:(n,options)=>{tracks.push(n);trackOptions.push(options)},getPosition:()=>audioTime,getPlayback:()=>({time:audioTime,duration:audioDuration,paused:audioPaused}),onEnded:(id,listener)=>{endListeners.add(listener);return()=>endListeners.delete(listener)}},AppleFruit:{create:()=>({draw:(p,a)=>draws.push({p,a}),dispose:()=>disposed++})},location:{replace:u=>exits.push(u),reload:()=>exits.push('reload')},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../story.js'),'utf8'),{window:win,document:{hidden:false,body:node(),querySelector:get,querySelectorAll:()=>[],createElement:node,addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id),clearTimeout(){},setTimeout(){return 1},matchMedia:()=>({matches:false}),devicePixelRatio:1,Date,Math,Intl});
 return{api:win.AppleStory,get,tracks,trackOptions,draws,exits,frames,endListeners,finishTrack:()=>[...endListeners].forEach(f=>f()),setAudioTime:t=>audioTime=t,setAudioPaused:p=>audioPaused=p,p:()=>JSON.parse(store.get('apple-iq-story-01')),tick:time=>{const work=[...frames.values()];frames.clear();work.forEach(f=>f(time))}};
}
let s=storyHarness();s.api.beginBadEnd();assert.equal(s.p().iq,160);assert.equal(s.p().phase,'bad-end');assert.deepEqual(s.tracks,[3]);
for(let time=1000;time<=26000;time+=1000)s.tick(time);
assert.equal(s.get('.bad-shade').style.opacity,1);assert.equal(s.get('.bad-hero').style.opacity,1);assert.deepEqual(s.exits,[]);assert.equal(s.p().eventTime,24);assert.ok(s.draws.every(x=>x.p.appleCount===9&&x.p.rainbow===true&&x.p.cinematic===true));assert.ok(s.draws.at(-1).a>150);
s.setAudioTime(17.2);s.tick(28001);assert.equal(s.p().badAudioTime,17.2);const finalSave=s.p();
s.setAudioTime(32.5);s.tick(29000);assert.equal(s.get('.bad-scene-layer').style.opacity,.5);assert.equal(s.get('#bad-outro').hidden,true);
s.setAudioTime(35);s.tick(30000);assert.equal(s.get('.bad-scene-layer').style.opacity,0);assert.equal(s.get('#bad-outro').hidden,false);assert.equal(s.get('#bad-outro').currentTime,0);assert.equal(s.get('#bad-outro').paused,false);assert.deepEqual(s.exits,[]);
s.setAudioTime(38);s.tick(31000);assert.equal(s.get('#bad-outro').currentTime,3);s.setAudioPaused(true);s.tick(32000);assert.equal(s.get('#bad-outro').paused,true);s=storyHarness(finalSave);assert.equal(s.api.restore(),true);assert.deepEqual(s.tracks,[3]);s.tick(1000);assert.deepEqual(s.exits,[]);assert.equal(s.trackOptions[0].startAt,17.2);s.finishTrack();assert.deepEqual(s.exits,['reload']);assert.equal(s.endListeners.size,0);assert.equal(s.tracks.at(-1),0);assert.equal(s.frames.size,0);
// Одна загальна гучність успадковує старе налаштування першого треку.
const audioNodes=new Map();let audioVolume=0,audioInstance;
function audioNode(){return{classList:classes(),setAttribute(){},addEventListener(){},append(){},querySelector:s=>{if(!audioNodes.has(s))audioNodes.set(s,audioNode());return audioNodes.get(s)},showModal(){},close(){}}}
const preferences=new Map([['appleiq-audio-01',JSON.stringify({volumes:[.33,.07],muted:true})]]),aw={addEventListener(){}};
class FakeAudio{constructor(){audioInstance=this;this.events=new Map();this.currentTime=0;this.duration=30}set volume(v){audioVolume=v}set muted(v){}pause(){}load(){}play(){return Promise.resolve()}removeAttribute(){}addEventListener(name,listener){this.events.set(name,listener)}emit(name){this.events.get(name)?.()}}
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),{window:aw,document:{hidden:false,baseURI:'https://example.test/',body:audioNode(),createElement:audioNode,querySelector:()=>null,addEventListener(){}},Audio:FakeAudio,URL,localStorage:{getItem:k=>preferences.get(k)||null,setItem:(k,v)=>preferences.set(k,v)}});
aw.AppleAudio.setTrack(3);assert.equal(aw.AppleAudio.getTrack(),3);assert.equal(audioVolume,.33);assert.deepEqual(JSON.parse(preferences.get('appleiq-audio-01')),{volume:.33,muted:true});
assert.equal(audioInstance.loop,false);let ended=0;const off=aw.AppleAudio.onEnded(3,()=>ended++);
// Ні час сцени, ні помилка файлу не завершують пасхалку.
audioInstance.emit('error');assert.equal(ended,0);audioInstance.emit('ended');assert.equal(ended,1);off();audioInstance.emit('ended');assert.equal(ended,1);
aw.AppleAudio.setTrack(1);assert.equal(audioInstance.loop,true);audioInstance.emit('ended');assert.equal(ended,1);
aw.AppleAudio.setTrack(3,{startAt:17.2});audioInstance.emit('loadedmetadata');assert.equal(audioInstance.currentTime,17.2);assert.equal(aw.AppleAudio.getPosition(),17.2);
const Fruit=require('../fruit-renderer.js');assert.ok(Fruit.createGeometry(10,false,true).length>Fruit.createGeometry(10).length*2);assert.ok(Fruit.createGeometry(10,true,true).length>Fruit.createGeometry(10,true).length);
console.log('Passed: exact first-test code, 160 result, normal/retake exclusions, five-second result countdown and pauses, hidden scene, gradual 22-second IQ growth, 8-second silence, distortion, high-quality rainbow apples, fresh first test after ending, audio-position restore, last-12-second fade, last-7-second video sync/pause, actual track-end restart, non-looping track 3 and master-volume migration.');
