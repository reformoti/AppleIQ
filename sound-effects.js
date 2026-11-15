'use strict';
((scope)=>{
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 // Scene seconds, rather than wall-clock timers, keep Foley aligned with the film.
 function score(phase,iq=10){const events=[],patterns=[];const once=(time,kind,pan=0)=>events.push({time,kind,pan}),repeat=(start,end,period,kind,pan=0)=>patterns.push({start,end,period,kind,pan}),steps=(start,end,period=.45)=>repeat(start,end,period,'step');
  if(phase==='film'){steps(13.05,16.5,.29);steps(19.15,23.35);steps(28.65,31.9);once(13,'door',.7);once(19,'door',-.6);once(23.5,'cloth');once(32,'cloth');repeat(24.2,26.5,.23,'key',-.35);repeat(.4,16,1,'clock',-.6)}
  if(phase==='school'){if(iq<40){steps(13.05,16.5,.29);once(13,'door',.7)}else if(iq>=80)steps(9.1,12.9,.5);steps(17.1,19.9);once(20,'cloth');repeat(.4,16,1,'clock',-.6)}
  if(phase==='quiet-day'){steps(.15,5.9,.5);steps(12.1,15.9);steps(24.1,27.9);once(12,'door',-.6);once(16.1,'notification',.25);repeat(18,19.5,.24,'key',-.3);once(28,'cloth');repeat(.8,11,5.8,'bird',.5)}
  if(phase==='sleep')once(.15,'cloth');
  if(phase==='cycle'){repeat(22/36,22.01,22/36,'paper',.3);repeat(.95,21,.58,'step',-.4)}
  if(phase==='resolve'){steps(5.1,8.9);once(9,'cloth')}
  if(phase==='genius-end'){once(23.05,'door',-.65);steps(23.25,26.8,.4);once(32.2,'cloth');repeat(36.1,36.7,.2,'key',.25);once(37,'phone');repeat(49.2,59.9,1.2,'monitor',-.6);repeat(66.2,73.8,1.2,'monitor',-.6);once(60.2,'paper');once(62,'paper');once(64,'paper');once(75,'cloth');once(123.08,'wood',.15);repeat(142,Infinity,7.4,'bird',-.5)}
  if(phase==='happy-end'){steps(8.1,12.1,.5);steps(15.1,18.9,.5);repeat(1,6.7,.27,'clap');repeat(22.4,27,.19,'key',.3);repeat(29.5,33,.33,'clap');once(36.3,'door',-.55);repeat(16,21,4.7,'bird',.5);repeat(50,58,5.7,'bird',-.6)}
  if(phase==='cosmic-end'){once(.25,'notification',.1);once(3.6,'cloth')}
  if(phase==='genius-loss'){once(6,'cloth');repeat(13.4,25,1,'clock',-.6)}
  // The two musical Easter eggs keep their original, track-synchronised soundtracks.
  return{events,patterns};
 }
 function cues(phase,from,to,iq=10){if(!Number.isFinite(from)||!Number.isFinite(to)||to<from||to-from>.4)return[];const plan=score(phase,iq),out=plan.events.filter(e=>e.time>from&&e.time<=to);for(const p of plan.patterns){const i=Math.max(0,Math.floor((from-p.start)/p.period)+1),time=p.start+i*p.period;if(time<=to&&time<p.end)out.push({time,kind:p.kind,pan:p.kind==='step'?(i%2?-.13:.13):p.pan})}return out.sort((a,b)=>a.time-b.time)}
 function ambience(phase,t){if(phase==='genius-end'){if(t>=40&&t<49)return['traffic','siren'];if(t>=49&&t<60||t>=66&&t<74)return['hospital'];if(t>=139)return['wind'];if(t<8||t>=23&&t<40||t>=74&&t<88)return['room'];return[]}
  if(phase==='happy-end'){if(t>=15&&t<22||t>=36&&t<43||t>=49&&t<58)return['wind'];return t<58?['room']:[]}
  if(phase==='cosmic-end')return t<6?['room']:[];if(phase==='quiet-day')return[t<12?'wind':'room'];if(['film','school','sleep','cycle','resolve','genius-loss'].includes(phase))return['room'];return[]}
 function create(host){const doc=host.document;let context,master,compressor,noise,volume=.2,muted=false,paused=false,phase='',cursor=null,room=new Map();const voices=new Set(),last=new Map();
  const blocked=()=>paused||muted||volume===0||doc?.hidden===true||doc?.body?.classList.contains('settings-open');
  function unlock(){if(blocked())return;try{if(!context){const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();compressor=context.createDynamicsCompressor();compressor.threshold.value=-20;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.12;master.connect(compressor);compressor.connect(context.destination);master.gain.value=volume*.6;noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const a=noise.getChannelData(0);let seed=67;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=(seed/4294967296*2-1)*.75}}if(context.state==='suspended')context.resume()?.catch?.(()=>{})}catch{}}
  function retire(v,stop=false){if(!voices.delete(v))return;for(const s of v.sources){s.onended=null;if(stop)try{s.stop()}catch{}}for(const n of v.nodes)try{n.disconnect()}catch{}}
  function stopVoices(){for(const v of [...voices])retire(v,true);room.clear()}
  function route(source,g,pan=0,filter=null){const nodes=[source,g];let tail=g;source.connect(filter||g);if(filter){filter.connect(g);nodes.push(filter)}if(context.createStereoPanner){const p=context.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);nodes.push(p);tail=p}tail.connect(master);const v={sources:[source],nodes};voices.add(v);source.onended=()=>retire(v);return v}
  function envelope(g,start,duration,level){g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(level,start+.006);g.gain.exponentialRampToValueAtTime(.0001,start+duration);g.gain.setValueAtTime(0,start+duration+.01)}
  function tone(a,b,duration,level,type='sine',pan=0,delay=0){const start=context.currentTime+delay,s=context.createOscillator(),g=context.createGain();s.type=type;s.frequency.setValueAtTime(a,start);s.frequency.exponentialRampToValueAtTime(Math.max(1,b),start+duration);envelope(g,start,duration,level);route(s,g,pan);s.start(start);s.stop(start+duration+.02)}
  function hiss(duration,level,cutoff=900,pan=0,delay=0){const start=context.currentTime+delay,s=context.createBufferSource(),g=context.createGain(),f=context.createBiquadFilter();s.buffer=noise;f.type='lowpass';f.frequency.value=cutoff;envelope(g,start,duration,level);route(s,g,pan,f);s.start(start);s.stop(start+duration+.02)}
  function play(kind,pan=0){if(blocked()||!context||context.state!=='running')return false;const now=context.currentTime;if(now-(last.get(kind)??-Infinity)<(kind==='key'?.075:.09))return false;last.set(kind,now);
   if(kind==='step'){tone(112,58,.15,.16,'sine',pan);hiss(.085,.13,520,pan)}
   else if(kind==='wood'){tone(185,62,.42,.24,'triangle',pan);hiss(.14,.23,1500,pan);tone(260,100,.19,.1,'sine',pan,.12);hiss(.09,.1,700,pan,.27)}
   else if(kind==='door'){hiss(.32,.12,650,pan);tone(225,125,.26,.035,'triangle',pan);tone(105,65,.12,.12,'sine',pan,.23)}
   else if(kind==='cloth')hiss(.42,.09,1500,pan);
   else if(kind==='paper')hiss(.14,.08,2400,pan);
   else if(kind==='key'){hiss(.032,.09,2100,pan);tone(520,260,.025,.025,'triangle',pan)}
   else if(kind==='clock'){hiss(.018,.045,1600,pan);tone(840,600,.025,.018,'sine',pan)}
   else if(kind==='monitor')tone(860,860,.12,.065,'sine',pan);
   else if(kind==='bird'){tone(1800,2500,.12,.055,'sine',pan);tone(2550,1950,.13,.045,'sine',pan,.14);tone(2200,2850,.1,.035,'sine',pan,.32)}
   else if(kind==='notification'||kind==='phone'){tone(kind==='phone'?440:660,kind==='phone'?440:660,.17,.075,'sine',pan);tone(kind==='phone'?550:880,kind==='phone'?550:880,.22,.06,'sine',pan,.17)}
   else if(kind==='clap')hiss(.1,.12,1700,pan);
   else if(kind==='throw')hiss(.12,.12,1200,pan);
   else if(kind==='hit'){tone(135,65,.12,.15,'sine',pan);hiss(.07,.12,1200,pan)}
   else if(kind==='win'){tone(440,440,.15,.08,'sine',pan);tone(660,660,.23,.07,'sine',pan,.14)}
   else if(kind==='ui')tone(720,520,.035,.055,'sine',pan);
   return true;
  }
  function startLoop(kind,t){const s=kind==='wind'||kind==='traffic'?context.createBufferSource():context.createOscillator(),g=context.createGain(),f=context.createBiquadFilter();const noisy=kind==='wind'||kind==='traffic';if(noisy){s.buffer=noise;s.loop=true;f.type='lowpass';f.frequency.value=kind==='wind'?450:220}else{s.type='sine';s.frequency.value=kind==='siren'?760:kind==='hospital'?100:65;f.type='lowpass';f.frequency.value=1300}g.gain.value=0;const v=route(s,g,kind==='siren'?.3:0,f);v.kind=kind;v.g=g;v.source=s;v.started=context.currentTime;s.start();room.set(kind,v);adjustLoop(v,t)}
  function adjustLoop(v,t){const age=context.currentTime-v.started,fade=clamp(age/.5),level=v.kind==='wind'?.065*(.8+.2*Math.sin(t*.55)):v.kind==='traffic'?.09:v.kind==='siren'?.1*(.8+.2*Math.sin(t*1.8)):.018;v.g.gain.setTargetAtTime(level*fade,context.currentTime,.08);if(v.kind==='siren')v.source.frequency.setTargetAtTime(760+210*Math.sin((t-40)*Math.PI*1.4),context.currentTime,.035)}
  function syncLoops(wanted,t){for(const [kind,v]of room)if(!wanted.includes(kind)){retire(v,true);room.delete(kind)}for(const kind of wanted){if(!room.has(kind))startLoop(kind,t);else adjustLoop(room.get(kind),t)}}
  function update(next,time,iq=10){if(!Number.isFinite(time))return;const fresh=phase!==next||cursor===null||time<cursor;if(fresh){stopVoices();phase=next;cursor=time-.001}if(blocked()){stopVoices();cursor=time;return}if(context?.state==='running'){syncLoops(ambience(next,time),time);for(const cue of cues(next,cursor,time,iq))play(cue.kind,cue.pan)}cursor=time}
  function preferences(p){volume=Number.isFinite(p?.volume)?clamp(p.volume):volume;muted=p?.muted===true;if(master)master.gain.setTargetAtTime(muted?0:volume*.6,context.currentTime,.025);if(muted||volume===0)stopVoices()}
  function stop(){stopVoices();phase='';cursor=null;paused=false;last.clear()}
  function pause(value){paused=value===true;if(paused)stopVoices()}
  const click=e=>{unlock();if(e.target?.closest?.('button,[role="button"]'))play('ui')},visibility=()=>{if(doc.hidden)stopVoices()};doc?.addEventListener('pointerdown',unlock);doc?.addEventListener('keydown',unlock);doc?.addEventListener('click',click);doc?.addEventListener('visibilitychange',visibility);host.addEventListener?.('pagehide',stop);
  return Object.freeze({update,play,unlock,preferences,pause,stop,dispose(){stop();doc?.removeEventListener('pointerdown',unlock);doc?.removeEventListener('keydown',unlock);doc?.removeEventListener('click',click);doc?.removeEventListener('visibilitychange',visibility);host.removeEventListener?.('pagehide',stop);context?.close()?.catch?.(()=>{})}})
 }
 const api={score,cues,ambience,create};if(scope.document)scope.AppleSFX=create(scope);if(typeof module!=='undefined')module.exports=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);
