'use strict';
((scope)=>{
 const G=scope.AppleProgression||(typeof require==='function'?require('./progression.js'):null);
 const constraints=Object.freeze([[2,1000,97],[3,777,101],[5,555,103],[7,333,107]].map(Object.freeze));
 function power(base,exponent,modulus){let b=BigInt(base),e=BigInt(exponent),m=BigInt(modulus),r=1n;while(e){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n}return Number(r)}
 let answer=0,step=1;for(const [base,exp,mod]of constraints){const residue=power(base,exp,mod);while(answer%mod!==residue)answer+=step;step*=mod}
 const offsets=[0,1,-1,97,-97,101,-101,103,-103,107,-107,9797,-9797,10403,-10403,11021,-11021,10000,-10000,77777];
 const options=Object.freeze(offsets.map(n=>answer+n).sort((a,b)=>a-b));
 const TASK=Object.freeze({constraints,options,correct:options.indexOf(answer),reward:20});
 function eligible(p){return p.appleCount===9&&p.advanced&&p.phase==='mind'&&p.step===5&&p.ultimateStatus==='ready'}
 function start(p){if(!eligible(p))return false;p.phase='ultimate';p.eventTime=0;return true}
 function choose(p,index){if(p.phase!=='ultimate'||p.ultimateStatus!=='ready'||!Number.isInteger(index)||index<0||index>=20)return false;p.ultimateChoice=index;return true}
 function submit(p){if(p.phase!=='ultimate'||p.ultimateStatus!=='ready'||!Number.isInteger(p.ultimateChoice)||p.ultimateChoice<0||p.ultimateChoice>=20)return false;p.eventTime=0;p.retake=false;p.retakeUnlocked=false;if(p.ultimateChoice===TASK.correct){p.ultimateStatus='passed';G.recordIQ(p,p.iq+TASK.reward);p.phase='ultimate-win'}else{p.ultimateStatus='failed';p.iq=-1;p.potential=-1000;p.phase='vegetable'}return true}
 function choosePath(p,path){if(p.phase!=='ultimate-win'||p.ultimateStatus!=='passed'||!['happy','genius'].includes(path))return false;p.endingPath=path;p.eventTime=0;p.step=5;if(path==='happy'){G.recordIQ(p,Math.max(125,p.iq));p.phase='happy-end'}else p.phase='mind';return true}
 const api=Object.freeze({TASK,power,eligible,start,choose,submit,choosePath});scope.AppleUltimate=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
