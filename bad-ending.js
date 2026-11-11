'use strict';
// Прихована гілка першого проходження. Варіанти всередині гри мають індекси 0–5.
((scope)=>{
 const PATTERN=Object.freeze([0,2,1,3,4]),DURATION=24;
 const REACTIONS=Object.freeze(['ВАУ!','ЯК У НЬОГО ЦЕ ВИЙШЛО?!','ВІН ЗАНАДТО КРУТИЙ!','Я ХОЧУ БУТИ ЙОГО ДРУЖИНОЮ!']);
 function matches(responses,firstPass){return firstPass===true&&Array.isArray(responses)&&responses.length===20&&responses.every((answer,i)=>answer===PATTERN[i%PATTERN.length])}
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
 function frame(time){const t=Math.max(0,Math.min(DURATION,Number(time)||0));return{iq:t<1?160:t<4?160+Math.floor((t-1)*960):'∞',hero:smooth((t-3)/1.2),apples:smooth((t-5)/1.6),shade:smooth((t-13)/5),title:smooth((t-18)/2),ready:t>=21,reaction:t<4?'':t<6?REACTIONS[0]:t<8?REACTIONS[1]:t<10?REACTIONS[2]:t<14?REACTIONS[3]:''}}
 function exit(audio,location){audio?.setTrack(0);location.replace('about:blank')}
 const api=Object.freeze({matches,frame,REACTIONS,DURATION,exit});scope.AppleBadEnd=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
