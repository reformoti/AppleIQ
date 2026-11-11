const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const Secret=require('../bad-ending.js'),G=require('../progression.js'),T=require('../test-tasks.js');
const combo=Array.from({length:20},(_,i)=>[0,2,1,3,4][i%5]);
assert.equal(Secret.matches(combo,true),true);assert.equal(Secret.matches(combo,false),false);
for(let i=0;i<20;i++){const wrong=[...combo];wrong[i]=(wrong[i]+1)%6;assert.equal(Secret.matches(wrong,true),false)}
assert.equal(Secret.matches(combo.slice(0,19),true),false);assert.equal(Secret.matches([...combo,0],true),false);assert.equal(Secret.matches(combo.map(String),true),false);
assert.equal(Secret.frame(0).iq,160);assert.equal(Secret.frame(4).iq,'∞');assert.equal(Secret.frame(20).ready,false);
const end=Secret.frame(24);for(const name of['hero','apples','shade','title'])assert.equal(end[name],1);assert.equal(end.ready,true);
function classes(){const values=new Set();return{add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v),toggle:(v,on)=>on?values.add(v):values.delete(v)}}
function appHarness(saved=null,restore=false){
 const store=new Map(saved?[['apple-iq-protocol-02',JSON.stringify(saved)]]:[]),nodes=new Map(),intervals=new Map(),calls=[],tracks=[];let id=0;
 function get(s){if(!nodes.has(s))nodes.set(s,{style:{},classList:classes(),hidden:false,innerHTML:'',textContent:'',focus(){},setAttribute(){}});return nodes.get(s)}
 const options=Array.from({length:6},(_,i)=>({dataset:{choice:String(i)},classList:classes(),setAttribute(){}}));
 const doc={hidden:false,body:get('body'),querySelector:get,querySelectorAll:s=>s==='[data-choice]'?options:[],addEventListener(){}};
 const win={AppleBadEnd:Secret,AppleTest:T,AppleStory:{restore:()=>restore,testRound:()=>1,scoreRetake:()=>10,begin:iq=>calls.push(['normal',iq]),beginBadEnd:()=>calls.push(['secret']),finishRetake:iq=>calls.push(['retake',iq])},AppleAudio:{setTrack:n=>tracks.push(n)},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),{window:win,document:doc,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setInterval:(f,ms)=>{intervals.set(++id,{f,ms});return id},clearInterval:id=>intervals.delete(id),Date,Math,Number,JSON});
 return{get,doc,calls,tracks,state:()=>JSON.parse(store.get('apple-iq-protocol-02')),answer:a=>{options[a].onclick();get('#next').onclick()},countdown:()=>[...intervals.values()].at(-1).f()};
}
let h=appHarness();combo.forEach(h.answer);assert.equal(h.state().resultIQ,160);assert.equal(h.state().secretEnding,true);assert.ok(h.get('#content').innerHTML.includes('160<span>IQ'));
h.countdown();h.doc.hidden=true;h.countdown();h.doc.hidden=false;h.doc.body.classList.add('settings-open');h.countdown();h.doc.body.classList.remove('settings-open');assert.deepEqual(h.calls,[]);h.countdown();h.countdown();assert.deepEqual(h.calls,[['secret']]);assert.ok(!h.tracks.includes(1));
const secretSave=h.state();h=appHarness(secretSave);assert.ok(h.get('#content').innerHTML.includes('160<span>IQ'));for(let i=0;i<3;i++)h.countdown();assert.deepEqual(h.calls,[['secret']]);
h=appHarness(secretSave,true);assert.deepEqual(h.calls,[]);assert.equal(h.get('#content').innerHTML,'');
const wrong=[...combo];wrong[19]=5;h=appHarness();wrong.forEach(h.answer);assert.ok(h.state().resultIQ>=8&&h.state().resultIQ<=12);for(let i=0;i<10;i++)h.countdown();assert.equal(h.calls[0][0],'normal');
h=appHarness({format:'matrix-03',index:0,responses:Array(20).fill(null),elapsed:0,completed:false,pendingRetake:true,round:1});combo.forEach(h.answer);assert.equal(h.state().secretEnding,false);assert.equal(h.state().resultIQ,10);for(let i=0;i<10;i++)h.countdown();assert.deepEqual(h.calls,[['retake',10]]);
function storyHarness(saved=null){
 const store=new Map(saved?[['apple-iq-story-01',JSON.stringify(saved)]]:[]),nodes=new Map(),frames=new Map(),tracks=[],draws=[],exits=[];let id=0,disposed=0;
 const c=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 function node(){return{style:{},classList:classes(),hidden:false,append(){},remove(){},setAttribute(){},focus(){},querySelector:get,querySelectorAll:()=>[],getBoundingClientRect:()=>({width:1360,height:936}),getContext:()=>c}}
 function get(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)}
 const win={AppleProgression:G,AppleBadEnd:Secret,AppleAudio:{setTrack:n=>tracks.push(n)},AppleFruit:{create:()=>({draw:(p,a)=>draws.push({p,a}),dispose:()=>disposed++})},location:{replace:u=>exits.push(u)},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../story.js'),'utf8'),{window:win,document:{hidden:false,body:node(),querySelector:get,querySelectorAll:()=>[],createElement:node,addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},requestAnimationFrame:f=>{frames.set(++id,f);return id},cancelAnimationFrame:id=>frames.delete(id),clearTimeout(){},setTimeout(){return 1},matchMedia:()=>({matches:false}),devicePixelRatio:1,Date,Math,Intl});
 return{api:win.AppleStory,get,tracks,draws,exits,frames,p:()=>JSON.parse(store.get('apple-iq-story-01')),tick:time=>{const work=[...frames.values()];frames.clear();work.forEach(f=>f(time))}};
}
let s=storyHarness();s.api.beginBadEnd();assert.equal(s.p().iq,160);assert.equal(s.p().phase,'bad-end');assert.deepEqual(s.tracks,[3]);
for(let time=1000;time<=26000;time+=1000)s.tick(time);
assert.equal(s.get('.bad-shade').style.opacity,1);assert.equal(s.get('.bad-hero').style.opacity,1);assert.equal(s.get('#bad-next').hidden,false);assert.equal(s.p().eventTime,24);assert.ok(s.draws.every(x=>x.p.appleCount===9));assert.ok(s.draws.at(-1).a>150);
const finalSave=s.p();s=storyHarness(finalSave);assert.equal(s.api.restore(),true);assert.deepEqual(s.tracks,[3]);s.tick(1000);assert.equal(s.get('#bad-next').hidden,false);s.get('#bad-next').onclick();assert.deepEqual(s.exits,['about:blank']);assert.equal(s.tracks.at(-1),0);assert.equal(s.frames.size,0);
// Додавання третьої гучності зберігає користувацькі значення перших двох.
const audioNodes=new Map();let audioVolume=0;
function audioNode(){return{classList:classes(),setAttribute(){},addEventListener(){},append(){},querySelector:s=>{if(!audioNodes.has(s))audioNodes.set(s,audioNode());return audioNodes.get(s)},showModal(){},close(){}}}
const preferences=new Map([['appleiq-audio-01',JSON.stringify({volumes:[.33,.07],muted:true})]]),aw={addEventListener(){}};
class FakeAudio{set volume(v){audioVolume=v}set muted(v){}pause(){}load(){}play(){return Promise.resolve()}removeAttribute(){}addEventListener(){}}
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),{window:aw,document:{hidden:false,baseURI:'https://example.test/',body:audioNode(),createElement:audioNode,querySelector:()=>null,addEventListener(){}},Audio:FakeAudio,URL,localStorage:{getItem:k=>preferences.get(k)||null,setItem:(k,v)=>preferences.set(k,v)}});
aw.AppleAudio.setTrack(3);assert.equal(aw.AppleAudio.getTrack(),3);assert.equal(audioVolume,.2);assert.deepEqual(JSON.parse(preferences.get('appleiq-audio-01')).volumes,[.33,.07,.2]);
console.log('Passed: exact first-test code, 160 result, normal/retake exclusions, countdown pauses, hidden scene, nine fast apples, ending restore, exit and track-3 migration.');
