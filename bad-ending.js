'use strict';
// Прихована гілка першого проходження. Варіанти всередині гри мають індекси 0–5.
((scope)=>{
 const PATTERN=Object.freeze([0,2,1,3,4]),DURATION=24;
 const REACTIONS=Object.freeze(['ВАУ!','ЯК У НЬОГО ЦЕ ВИЙШЛО?!','ВІН ЗАНАДТО КРУТИЙ!','Я ХОЧУ БУТИ ЙОГО ДРУЖИНОЮ!']);
 function matches(responses,firstPass){return firstPass===true&&Array.isArray(responses)&&responses.length===20&&responses.every((answer,i)=>answer===PATTERN[i%PATTERN.length])}
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
 // Перші кроки: +1 одразу після п’ятисекундного показу 160, далі через 1, 0.5, 0.25… с.
 function risingIQ(t){if(t<0)return 160;if(t<1.984375)return 161+Math.floor(-Math.log2(1-t/2)+1e-9);if(t<10)return Math.floor(168+64*(Math.exp((t-1.984375)*1.8)-1));return '∞'}
 function distortion(time,reduced=false){const t=Math.max(0,Number(time)||0),power=smooth(t/5)*(reduced?.15:1),burst=Math.sin(t*2.7)>.55?1:.35;return{x:(Math.sin(t*71)+Math.cos(t*113))*3*power,y:Math.sin(t*93)*3*power,angle:Math.sin(t*39)*1.8*power,scaleX:1+Math.sin(t*31)*.055*power+burst*.025*power,scaleY:1-Math.sin(t*31)*.045*power,skew:Math.sin(t*57)*2.4*burst*power,glitch:power*burst}}
 function frame(time){const t=Math.max(0,Math.min(DURATION,Number(time)||0));return{iq:risingIQ(t),hero:smooth((t-3)/1.2),apples:smooth((t-5)/1.6),shade:smooth((t-13)/5),title:smooth((t-18)/2),ready:t>=21,reaction:t<4?'':t<6?REACTIONS[0]:t<8?REACTIONS[1]:t<10?REACTIONS[2]:t<14?REACTIONS[3]:''}}
 function outro(time,duration){if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(time))return{fade:0,showVideo:false,videoTime:0};const remaining=Math.max(0,duration-time);return{fade:smooth((12-remaining)/5),showVideo:remaining<=7,videoTime:Math.max(0,Math.min(7,7-remaining))}}
 function exit(audio,location){audio?.setTrack(0);location.replace('https://www.google.com/')}
 const api=Object.freeze({matches,frame,risingIQ,distortion,outro,REACTIONS,DURATION,exit});scope.AppleBadEnd=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
