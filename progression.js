'use strict';
// Усі суми зберігаються в тисячних частках IQ, щоб покупки не втрачали точність.
((scope)=>{
const DIRECTIONS=[{id:'clockwise',label:'За годинниковою',cost:0},{id:'reverse',label:'Проти годинникової',cost:2500},{id:'horizontal',label:'Ліворуч / праворуч',cost:8000},{id:'vertical',label:'Вгору / вниз',cost:15000},{id:'diagonal',label:'По діагоналі',cost:30000}];
const integer=(v,max)=>Number.isInteger(v)&&v>=0?Math.min(v,max):0;
function normalise(p){p.speedLevel=integer(p.speedLevel,80);p.qualityLevel=integer(p.qualityLevel,32);p.appleCount=Math.max(1,integer(p.appleCount,9));p.directions=Array.isArray(p.directions)?[...new Set(['clockwise',...p.directions.filter(id=>DIRECTIONS.some(d=>d.id===id))])]:['clockwise'];p.direction=p.directions.includes(p.direction)?p.direction:'clockwise';p.rainbow=p.rainbow===true;p.retakeUnlocked=p.retakeUnlocked===true;p.advanced=p.advanced===true;p.discovered=p.discovered===true;p.thoughtSeen=p.thoughtSeen===true;p.retake=p.retake===true;p.potential=Number.isFinite(p.potential)&&p.potential>=0?Math.min(p.potential,1e15):0;return p}
const sides=p=>Math.min(360,4+p.qualityLevel*(p.qualityLevel+1)/2);
const appleForm=p=>Math.max(0,Math.min(1,(p.qualityLevel-27)/5));
const speed=p=>1+p.speedLevel*.1;
function price(p,type,id){if(type==='speed')return p.speedLevel>=80?null:p.speedLevel<2?30:Math.round(30*Math.pow(1.6,p.speedLevel-1));if(type==='quality')return p.qualityLevel>=32?null:Math.round(150*Math.pow(1.24,p.qualityLevel));if(type==='count')return p.appleCount>=9?null:Math.round(1e6*Math.pow(5,p.appleCount-1));if(type==='color')return p.rainbow?null:1e7;if(type==='retake')return p.retakeUnlocked?null:25000;if(type==='direction'){const d=DIRECTIONS.find(d=>d.id===id);return !d||p.directions.includes(id)?null:d.cost}return null}
function income(p){const base=p.advanced?50:2.5;return base*speed(p)*(1+(sides(p)-4)/90+appleForm(p)*3)*p.appleCount*(1+(p.directions.length-1)*.05)*(p.rainbow?3:1)}
function canBuy(p,type,id){const cost=price(p,type,id);return cost!==null&&p.potential+1e-7>=cost&&(p.advanced||type==='speed'&&p.speedLevel<2)}
function buy(p,type,id){if(!canBuy(p,type,id))return false;const cost=price(p,type,id);p.potential=Math.max(0,p.potential-cost);if(type==='speed')p.speedLevel++;if(type==='quality')p.qualityLevel++;if(type==='count')p.appleCount++;if(type==='color')p.rainbow=true;if(type==='retake')p.retakeUnlocked=true;if(type==='direction'){p.directions.push(id);p.direction=id}return true}
function retakeIQ(p,seed){return Math.min(250,8+seed%5+Math.floor((sides(p)-4)/6)+p.speedLevel*2+Math.round(appleForm(p)*15)+(p.appleCount-1)*3+(p.directions.length-1)*2)}
const api={DIRECTIONS,normalise,sides,appleForm,speed,price,income,canBuy,buy,retakeIQ};scope.AppleProgression=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
