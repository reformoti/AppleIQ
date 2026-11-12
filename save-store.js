'use strict';
((scope)=>{
 const TEST='apple-iq-protocol-02',STORY='apple-iq-story-01',AUDIO='appleiq-audio-01',RESET='apple-iq-ended-01',MAX=2*1024*1024;
 const KEYS=Object.freeze([TEST,STORY,AUDIO]),PHASES=['film','mind','sleep','cycle','resolve','school','quiet-day','bad-end','ultimate','ultimate-win','happy-end','vegetable','genius-hub','genius-battle','genius-loss'];
 const backupKey=k=>k+'-backup-01',corruptKey=k=>k+'-corrupt-01',object=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,number=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 let restoring=false;
 let status={state:'empty',savedAt:null},bannerTimer;const listeners=new Set();
 function valid(key,p){if(!object(p))return false;
  if(key===TEST)return int(p.index,0,20)&&Array.isArray(p.responses)&&p.responses.length===20&&p.responses.every(v=>v===null||int(v,0,5))&&number(p.elapsed,0,1e15)&&(p.round===undefined||int(p.round,0,1e6))&&(p.pendingRetake===undefined||typeof p.pendingRetake==='boolean')&&(p.format===undefined||typeof p.format==='string'&&p.format.length<=80);
  if(key===AUDIO)return (number(p.volume,0,1)||Array.isArray(p.volumes)&&[2,3].includes(p.volumes.length)&&p.volumes.every(v=>number(v,0,1)))&&(p.muted===undefined||typeof p.muted==='boolean');
  if(key!==STORY)return false;const failed=p.iq===-1&&p.ultimateStatus==='failed'&&p.phase==='vegetable';
  if(p.version!==1||!PHASES.includes(p.phase)||!int(p.step,0,5)||!int(p.iq,8,250)&&!failed||!number(p.filmTime,0,36)||!number(p.potential,0,1e30)&&!(failed&&p.potential===-1000))return false;
  const bounds={qualityLevel:42,speedLevel:80,appleCount:9,shakeLevel:24,imaginationLevel:24,focusLevel:16,synergyLevel:12,lightLevel:3,shadowLevel:3,waterLevel:3,retakeCount:1e6};for(const[k,max]of Object.entries(bounds))if(p[k]!==undefined&&!int(p[k],k==='appleCount'?1:0,max))return false;
  if(p.eventTime!==undefined&&!number(p.eventTime,0,100))return false;
  if(p.geniusArena!==undefined){const a=p.geniusArena;if(!object(a)||!int(a.next,0,10)||!['ready','recovery','complete'].includes(a.status))return false;if(a.fight!==null&&a.fight!==undefined){const f=a.fight;if(!object(f)||f.version!==1||!int(f.index,0,9)||![1,2].includes(f.round)||!['active','win','loss'].includes(f.result)||!number(f.hp,0,100)||!number(f.enemyHP,0,5000)||!number(f.time,0,100))return false;for(const k of ['shots','enemyShots'])if(f[k]!==undefined&&(!Array.isArray(f[k])||f[k].length>100||!f[k].every(s=>object(s)&&['x','y','vx','vy','life'].every(n=>number(s[n],-1e9,1e9)))))return false}}
  return true
 }
 function parse(key,text){if(!KEYS.includes(key)||typeof text!=='string'||text.length>MAX)return null;try{const p=JSON.parse(text);return valid(key,p)?p:null}catch{return null}}
 function checksum(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return(hash>>>0).toString(16).padStart(8,'0')}
 function copy(key,text,pending=false,previousChecksum=null){return{version:1,key,data:text,checksum:checksum(text),savedAt:Date.now(),pending,previousChecksum}}
 function readCopy(key,storage){try{const raw=storage.getItem(backupKey(key));if(!raw||raw.length>MAX+4096)return null;const b=JSON.parse(raw);return b&&b.version===1&&b.key===key&&typeof b.data==='string'&&b.checksum===checksum(b.data)&&parse(key,b.data)&&number(b.savedAt,0,1e15)?b:null}catch{return null}}
 function message(s=status){return s.state==='recovered'?'Прогрес відновлено з резервної копії.':s.state==='error'?'Не вдалося зберегти прогрес у браузері.':s.state==='backup-error'?'Прогрес збережено. Резервну копію не вдалося оновити.':s.state==='saved'?'Прогрес збережено.':'Нова гра. Автозбереження увімкнено.'}
 function setStatus(state,savedAt=null){const changed=status.state!==state;status={state,savedAt};for(const f of listeners)try{f({...status})}catch{}if(!scope.document?.body)return;let node=scope.document.querySelector('#save-state-banner');if(['error','backup-error','recovered'].includes(state)){if(!node){node=scope.document.createElement('div');node.id='save-state-banner';node.setAttribute('role',state==='recovered'?'status':'alert');scope.document.body.append(node)}if(changed||!node.textContent)node.textContent=message();node.dataset.state=state;clearTimeout(bannerTimer);if(state==='recovered')bannerTimer=setTimeout(()=>node.remove(),7000)}else if(node&&node.dataset.state!=='recovered')node.remove()}
 function resetPending(storage){try{return storage.getItem(RESET)==='1'}catch{return false}}
 function read(key,storage=scope.localStorage){if(!KEYS.includes(key))return null;if(key!==AUDIO&&resetPending(storage))return null;let raw=null;try{raw=storage.getItem(key)}catch{setStatus('error');return null}const b=readCopy(key,storage),primary=parse(key,raw);
  if(primary&&!(b?.pending&&b.data!==raw&&b.previousChecksum===checksum(raw))){if(!b||b.data!==raw)try{storage.setItem(backupKey(key),JSON.stringify(copy(key,raw)))}catch{if(key!==AUDIO)setStatus('backup-error')}if(key!==AUDIO&&status.state==='empty')setStatus('saved',b?.savedAt||Date.now());return raw}
  if(raw!==null)try{storage.setItem(corruptKey(key),raw.slice(0,100000))}catch{}
  if(b){try{storage.setItem(key,b.data);if(b.pending)storage.setItem(backupKey(key),JSON.stringify({...b,pending:false}))}catch{}if(key!==AUDIO)setStatus('recovered',b.savedAt);return b.data}
  if(raw!==null&&key!==AUDIO)setStatus('error');return null
 }
 function write(key,text,storage=scope.localStorage){if(restoring)return false;if(!KEYS.includes(key)||!parse(key,text))return false;if(key!==AUDIO&&resetPending(storage))return false;let primary=false,backup=false,previousChecksum=null;try{const previous=storage.getItem(key);if(previous!==null)previousChecksum=checksum(previous)}catch{}try{storage.setItem(key,text);primary=true}catch{}try{storage.setItem(backupKey(key),JSON.stringify(copy(key,text,!primary,previousChecksum)));backup=true}catch{}if(primary&&!backup&&readCopy(key,storage)?.pending)try{storage.removeItem(backupKey(key))}catch{}if(key!==AUDIO)setStatus(primary&&backup?'saved':primary?'backup-error':backup?'recovered':'error',primary||backup?Date.now():null);return primary||backup}
 function markCleared(){clearTimeout(bannerTimer);scope.document?.querySelector('#save-state-banner')?.remove();setStatus('empty')}
 const api=Object.freeze({KEYS,TEST,STORY,AUDIO,MAX,backupKey,corruptKey,valid,parse,checksum,read,write,readCopy,markCleared,beginRestore:()=>{restoring=true},endRestore:()=>{restoring=false},isRestoring:()=>restoring,getStatus:()=>({...status}),message,subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}});scope.AppleSaveStore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
