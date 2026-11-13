'use strict';
((scope)=>{
 const G=scope.AppleProgression||(typeof require==='function'?require('./progression.js'):null);
 const RIVALS=Object.freeze([
 ['galileo','Галілео Галілей',125,'beard'],['archimedes','Архімед',135,'robe'],['faraday','Майкл Фарадей',145,'sidepart'],['curie','Марія Кюрі',155,'bun'],['maxwell','Джеймс Максвелл',165,'beard'],['turing','Алан Тюрінг',175,'sidepart'],['newton','Ісаак Ньютон',190,'curls'],['tesla','Нікола Тесла',210,'tesla'],['einstein','Альберт Ейнштейн',230,'einstein'],['leonardo','Леонардо да Вінчі',250,'cap']
 ].map(([id,name,iq,look],i)=>Object.freeze({id,name,iq,look,index:i})));
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),num=(x,f,a,b)=>Number.isFinite(x)?clamp(x,a,b):f;
 const config=index=>({enemyHP:120+index*18,spinDrain:1.7+index*.18,spinDamage:1.62/(1+index*.12),shotDamage:13,time:40+index,shotHP:90+index*20,damage:18+index*2,enemySpeed:290+index*18,interval:1.65-index*.095,spread:index<3?1:index<7?3:5});
 function newFight(index,round=1){const cfg=config(index);return{version:1,index,round,time:0,hp:100,enemyHP:round===1?cfg.enemyHP:cfg.shotHP,result:'active',angle:0,spinEnergy:0,spinRate:0,player:{x:180,y:340},enemy:{x:820,y:280},shots:[],enemyShots:[],cooldown:0,attackIn:1.5,warning:0,target:{x:180,y:340},invulnerable:0,flash:0,hitFlash:0,damageText:0}}
 function validFight(f,index){return f&&f.version===1&&f.index===index&&[1,2].includes(f.round)&&['active','win','loss'].includes(f.result)&&[f.hp,f.enemyHP,f.time].every(Number.isFinite)&&f.hp>=0&&f.hp<=100&&f.enemyHP>=0&&f.time>=0&&f.time<=100}
 function normalise(p){if(p.endingPath!=='genius')return null;let a=p.geniusArena;if(!a||typeof a!=='object')a=p.geniusArena={next:0,status:'ready',fight:null};a.next=Number.isInteger(a.next)?clamp(a.next,0,10):0;a.status=['ready','recovery','complete'].includes(a.status)?a.status:'ready';if(a.next===10)a.status='complete';if(a.status==='recovery')a.next=0;
  if(!validFight(a.fight,a.next)||a.status!=='ready'||a.next===10)a.fight=null;
  if(a.fight){const f=a.fight,cfg=config(f.index),fresh=newFight(f.index,f.round);f.hp=num(f.hp,100,0,100);f.enemyHP=num(f.enemyHP,0,0,f.round===1?cfg.enemyHP:cfg.shotHP);for(const k of ['angle','spinEnergy','spinRate','cooldown','attackIn','warning','invulnerable','flash','hitFlash','damageText'])f[k]=num(f[k],fresh[k],k==='angle'?-1e9:0,k==='angle'?1e9:100);for(const k of ['player','enemy','target']){const o=f[k]||{};f[k]={x:num(o.x,fresh[k].x,20,980),y:num(o.y,fresh[k].y,20,580)}}for(const k of ['shots','enemyShots'])f[k]=Array.isArray(f[k])?f[k].filter(s=>s&&[s.x,s.y,s.vx,s.vy,s.life].every(Number.isFinite)).slice(0,100).map(s=>({x:clamp(s.x,-80,1080),y:clamp(s.y,-80,680),vx:clamp(s.vx,-900,900),vy:clamp(s.vy,-900,900),life:clamp(s.life,0,5)})):[];}
  if(p.phase==='genius-battle'&&!a.fight)p.phase='genius-hub';return a
 }
 const available=p=>p.endingPath==='genius'&&p.geniusArena?.status==='ready'&&p.geniusArena.next<10;
 function start(p){normalise(p);if(!available(p)||p.geniusArena.fight||!['mind','genius-hub'].includes(p.phase))return false;p.geniusArena.fight=newFight(p.geniusArena.next);p.phase='genius-battle';p.eventTime=0;return true}
 function spin(f,radians){if(f?.round!==1||f.result!=='active'||!Number.isFinite(radians))return false;const delta=clamp(radians,-.8,.8);f.angle+=delta;f.spinEnergy=Math.min(1.6,f.spinEnergy+Math.abs(delta));return true}
 function projectile(from,to,speed){const dx=to.x-from.x,dy=to.y-from.y,n=Math.hypot(dx,dy)||1;return{x:from.x,y:from.y,vx:dx/n*speed,vy:dy/n*speed,life:4}}
 function leadTarget(f){const flight=Math.hypot(f.enemy.x-f.player.x,f.enemy.y-f.player.y)/780,t=f.time+flight;return{x:820+Math.sin(t*.9)*32,y:280+Math.sin(t*(.8+f.index*.05))*110}}
 function shoot(f,target){if(f?.round!==2||f.result!=='active'||f.cooldown>0||!target||![target.x,target.y].every(Number.isFinite))return false;f.shots.push(projectile(f.player,target,780));f.cooldown=.22;return true}
 function segmentDistance(x,y,X,Y,p){const dx=X-x,dy=Y-y,t=clamp(((p.x-x)*dx+(p.y-y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x+dx*t-p.x,y+dy*t-p.y)}
 function moveShots(list,dt,target,radius,onHit){return list.filter(s=>{const x=s.x,y=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(segmentDistance(x,y,s.x,s.y,target)<radius){onHit();return false}return s.life>0&&s.x>-70&&s.x<1070&&s.y>-70&&s.y<670})}
 function burst(f,cfg){const base=Math.atan2(f.target.y-f.enemy.y,f.target.x-f.enemy.x);for(let i=0;i<cfg.spread;i++){const a=base+(i-(cfg.spread-1)/2)*.17;f.enemyShots.push({x:f.enemy.x,y:f.enemy.y,vx:Math.cos(a)*cfg.enemySpeed,vy:Math.sin(a)*cfg.enemySpeed,life:4})}f.attackIn=cfg.interval;f.warning=0}
 function step(f,seconds,input={}){if(!f||f.result!=='active')return f?.result;const total=num(seconds,0,0,.1),cfg=config(f.index);let left=total;while(left>1e-8&&f.result==='active'){const dt=Math.min(left,1/120);left-=dt;f.time+=dt;f.flash=Math.max(0,f.flash-dt);f.hitFlash=Math.max(0,f.hitFlash-dt);f.invulnerable=Math.max(0,f.invulnerable-dt);f.cooldown=Math.max(0,f.cooldown-dt);
   if(f.round===1){if(input.spin)spin(f,Math.sign(input.spin)*15*dt);const used=Math.min(f.spinEnergy,24*dt);f.spinEnergy-=used;const rate=dt?used/dt/(Math.PI*2):0;f.spinRate+=(rate-f.spinRate)*Math.min(1,dt*8);const damage=used*cfg.spinDamage;f.enemyHP=Math.max(0,f.enemyHP-damage);if(damage>0){f.flash=.12;f.damageText=damage/dt}f.hp=Math.max(0,f.hp-dt*cfg.spinDrain)}
   else{let dx=num(input.x,0,-1,1),dy=num(input.y,0,-1,1),length=Math.max(1,Math.hypot(dx,dy));f.player.x=clamp(f.player.x+dx/length*280*dt,42,490);f.player.y=clamp(f.player.y+dy/length*280*dt,52,548);f.enemy.x=820+Math.sin(f.time*.9)*32;f.enemy.y=280+Math.sin(f.time*(.8+f.index*.05))*110;if(input.firing)shoot(f,input.aim||f.enemy);
    f.attackIn-=dt;if(f.attackIn<=.4&&f.warning===0){f.warning=.4;f.target={...f.player}}if(f.warning>0)f.warning=Math.max(.00001,f.warning-dt);if(f.attackIn<=0)burst(f,cfg);
    f.shots=moveShots(f.shots,dt,f.enemy,46,()=>{f.enemyHP=Math.max(0,f.enemyHP-cfg.shotDamage);f.flash=.18;f.damageText=cfg.shotDamage});f.enemyShots=moveShots(f.enemyShots,dt,f.player,29,()=>{if(f.invulnerable>0)return;f.hp=Math.max(0,f.hp-cfg.damage);f.invulnerable=.7;f.hitFlash=.2});
   }
   if(f.hp<=0||f.time>=(f.round===1?cfg.time:65))f.result='loss';else if(f.enemyHP<=0)f.result='win';
  }return f.result
 }
 function advance(p){const a=normalise(p),f=a?.fight;if(p.phase!=='genius-battle'||!f||f.result!=='win'||f.round!==1)return false;a.fight=newFight(a.next,2);return true}
 function victory(p){const a=normalise(p),f=a?.fight;if(p.phase!=='genius-battle'||!f||f.result!=='win'||f.round!==2)return false;G.recordIQ(p,Math.max(p.iq,RIVALS[a.next].iq));a.next++;a.fight=null;a.status=a.next===10?'complete':'ready';p.phase=a.status==='complete'?'genius-end':'genius-hub';p.eventTime=0;return true}
 function lose(p,forfeit=false){const a=normalise(p);if(p.phase!=='genius-battle'||!a?.fight||(!forfeit&&a.fight.result!=='loss'))return false;p.iq=80;p.phase='genius-loss';p.eventTime=0;p.retake=false;p.retakeUnlocked=false;a.next=0;a.status='recovery';a.fight=null;return true}
 function recover(p){const a=normalise(p);if(a?.status!=='recovery'||p.iq<100)return false;a.status='ready';a.next=0;a.fight=null;return true}
 const api=Object.freeze({RIVALS,config,newFight,normalise,available,start,spin,shoot,leadTarget,step,advance,victory,lose,recover,segmentDistance});scope.AppleGenius=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
