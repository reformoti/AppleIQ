'use strict';
// З кожним завершеним повторним тестом відкриваються ще дві закономірні матриці.
((scope)=>{
const grid=(marks,size=3)=>({kind:'grid',marks:[...new Set(marks)].sort((a,b)=>a-b),size,turn:0});
const bar=(angle,position=1,markers=1)=>({kind:'bar',angle,position,markers});
const orbit=(points,rings=1)=>({kind:'orbit',points,turn:0,rings});
const union=(a,b)=>[...new Set([...a,...b])];
const intersection=(a,b)=>a.filter(x=>b.includes(x));
const xor=(a,b)=>union(a,b).filter(x=>a.includes(x)!==b.includes(x));
const count=round=>Math.min(20,Math.max(0,Math.floor(Number(round)||0))*2);
function signature(p){if(p.kind==='grid')return `g:${p.size}:${p.marks.join(',')}`;if(p.kind==='bar'){const a=(p.angle%360+360)%360;return `b:${a%180}:${a>=180?2-p.position:p.position}:${p.markers}`}return `o:${p.points}:${p.rings}`}
function setRule(rows,operation,size=3){return(r,c)=>grid(c===2?operation(rows[r][0],rows[r][1]):rows[r][c],size)}
const rules=[
(r,c)=>grid([r*3+c]),
(r,c)=>bar(r*45,c),
(r,c)=>grid(Array.from({length:r+c+1},(_,i)=>i)),
(r,c)=>orbit(1<<((r+c)%8)),
(r,c)=>grid([0,1,4].map(m=>((Math.floor(m/3)+r)%3)*3+(m%3+c)%3)),
(r,c)=>bar((r+c)*45,(r+c)%3),
setRule([[[0],[1]],[[3],[4]],[[6],[7]]],union),
(r,c)=>orbit((1<<r)|(1<<(c+4))),
setRule([[[0,1,4],[1,4,5]],[[2,4,6],[4,6,7]],[[0,5,8],[3,5,8]]],intersection),
setRule([[[0,1],[1,2]],[[3,4],[4,5]],[[6,7],[7,8]]],xor),
(r,c)=>grid([0,1,5].map(m=>((Math.floor(m/4)+r)%4)*4+(m%4+c)%4),4),
(r,c)=>orbit((1<<((r+c)%8))|(1<<((r+c+3)%8)),r+1),
setRule([[[0,3,4],[1,4,7]],[[2,5,8],[0,5,6]],[[1,3,7],[3,4,8]]],xor),
(r,c)=>bar((r*2+c)*45,c,r+1),
setRule([[[0,4,8],[1,5,9]],[[2,6,10],[3,7,11]],[[4,8,12],[5,9,13]]],union,4),
setRule([[[0,1,4,5],[1,2,5,6]],[[4,5,8,9],[5,6,9,10]],[[8,9,12,13],[9,10,13,14]]],intersection,4),
(r,c)=>orbit(((1<<(r+1))-1) << (c*2),r+1),
setRule([[[0,2,5,7],[2,4,7,9]],[[1,3,6,8],[3,5,8,10]],[[4,6,9,11],[6,8,11,13]]],xor,4),
(r,c)=>grid(Array.from({length:r+2},(_,i)=>(i*5+c*3+r)%16),4),
setRule([[[0,1,4,6,10],[1,3,6,9,10]],[[2,4,7,8,13],[4,5,8,12,13]],[[0,5,9,11,15],[0,3,9,12,15]]],xor,4)
];
function distractor(p,attempt){if(p.kind==='grid'){const marks=new Set(p.marks),bit=(attempt*5+3)%(p.size*p.size);marks.has(bit)?marks.delete(bit):marks.add(bit);return grid([...marks],p.size)}if(p.kind==='bar')return bar(p.angle+(Math.floor(attempt/3)+1)*45,(p.position+attempt)%3,attempt>8?p.markers%3+1:p.markers);return orbit(p.points^(1<<(attempt%8)),p.rings)}
function logicalTask(index){const rule=rules[index];if(!rule)throw new RangeError('Невідоме завдання');const expected=rule(2,2),options=[expected];for(let attempt=0;options.length<6;attempt++){const p=distractor(expected,attempt);if(!options.some(o=>signature(o)===signature(p)))options.push(p)}const correct=(index*5+2)%6;[options[0],options[correct]]=[options[correct],options[0]];return{cells:Array.from({length:9},(_,i)=>i===8?null:rule(Math.floor(i/3),i%3)),options,correct}}
const logical=rules.map((_,i)=>logicalTask(i));
function task(ambiguous,index,round){return index<count(round)?logical[index]:ambiguous[index]}
function correctCount(responses,round){return responses.slice(0,count(round)).reduce((n,a,i)=>n+Number(a===logical[i].correct),0)}
const api=Object.freeze({count,logicalTask,task,correctCount,signature});scope.AppleTest=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
