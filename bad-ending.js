'use strict';
// Прихована гілка першого проходження. Варіанти всередині гри мають індекси 0–5.
((scope)=>{
 const PATTERN=Object.freeze([0,2,1,3,4]),DURATION=24;
 const REACTIONS=Object.freeze(['ВАУ!','ЯК У НЬОГО ЦЕ ВИЙШЛО?!','ВІН ЗАНАДТО КРУТИЙ!','Я ХОЧУ БУТИ ЙОГО ДРУЖИНОЮ!']);
 function matches(responses,firstPass){return firstPass===true&&Array.isArray(responses)&&responses.length===20&&responses.every((answer,i)=>answer===PATTERN[i%PATTERN.length])}
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
 // Неспішний початок: 160, 161 через 2 с, 162 через 4 с; прискорення триває до 22 с.
 function risingIQ(t){if(t<2)return 160;const steps=[2,4,5.5,6.7,7.6,8.3,8.8,9.2,9.55,9.85];if(t<10)return 160+steps.filter(at=>t>=at).length;if(t<22)return 170+Math.floor(4*(Math.exp((t-10)*.62)-1));return '∞'}
 function distortion(time,reduced=false){const t=Math.max(0,Number(time)||0),power=smooth(t/5)*(reduced?.15:1),burst=Math.sin(t*2.7)>.55?1:.35;return{x:(Math.sin(t*71)+Math.cos(t*113))*5*power,y:(Math.sin(t*93)*4+Math.sin(t*1.8)*5)*power,angle:Math.sin(t*39)*2.2*power,scaleX:1+Math.sin(t*31)*.075*power+burst*.025*power,scaleY:1-Math.sin(t*31)*.06*power,skew:Math.sin(t*57)*3.4*burst*power,glitch:power*burst}}
 function frame(time){const t=Math.max(0,Math.min(DURATION,Number(time)||0));return{iq:risingIQ(t),hero:smooth((t-2.5)/1.2),apples:smooth((t-5)/1.6),shade:smooth((t-3)/.6),title:smooth((t-23)/1),ready:t>=21,reaction:t<4?'':t<6?REACTIONS[0]:t<8?REACTIONS[1]:t<10?REACTIONS[2]:t<14?REACTIONS[3]:''}}
 function outro(time,duration){if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(time))return{fade:0,showVideo:false,videoTime:0};const remaining=Math.max(0,duration-time);return{fade:smooth((12-remaining)/5),showVideo:remaining<=7,videoTime:Math.max(0,Math.min(7,7-remaining))}}
 const RESET_KEY='apple-iq-ended-01',SAVE_KEYS=['apple-iq-protocol-02','apple-iq-story-01'].flatMap(k=>[k,k+'-backup-01',k+'-corrupt-01']);
 function needsReset(storage){try{return storage?.getItem(RESET_KEY)==='1'}catch{return false}}
 function consumeReset(storage){if(!needsReset(storage))return false;try{SAVE_KEYS.forEach(key=>storage.removeItem(key));storage.removeItem(RESET_KEY)}catch{}return true}
 function clearProgress(storage){for(const key of SAVE_KEYS)try{storage?.removeItem(key)}catch{}try{storage?.setItem(RESET_KEY,'1')}catch{}scope.AppleSaveStore?.markCleared()}
 function restart(audio,location,storage){clearProgress(storage);audio?.setTrack(0);location.reload()}
 function exit(audio,location,storage){clearProgress(storage);audio?.setTrack(0);location.replace('https://www.google.com/')}
 const api=Object.freeze({matches,frame,risingIQ,distortion,outro,needsReset,consumeReset,clearProgress,restart,REACTIONS,DURATION,exit});scope.AppleBadEnd=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
