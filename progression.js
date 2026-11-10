'use strict';
// Усі суми зберігаються в тисячних частках IQ, щоб покупки не втрачали точність.
((scope)=>{
const DIRECTIONS=[{id:'clockwise',label:'За годинниковою',cost:0,bonus:1},{id:'reverse',label:'Проти годинникової',cost:2500,bonus:1.25},{id:'horizontal',label:'Ліворуч / праворуч',cost:8000,bonus:1.6},{id:'vertical',label:'Вгору / вниз',cost:15000,bonus:2},{id:'diagonal',label:'По діагоналі',cost:30000,bonus:2.5}];
const integer=(v,max)=>Number.isInteger(v)&&v>=0?Math.min(v,max):0;
const IQ_THRESHOLDS=Object.freeze([40,80,100]);
const iqTier=iq=>IQ_THRESHOLDS.filter(threshold=>iq>=threshold).length;
const iqMultiplier=p=>1+(Number.isFinite(p.iq)?Math.max(0,Math.min(250,p.iq)):0)/100;
const retakeCost=p=>25000*2**Math.max(integer(p.retakeTier,3),iqTier(p.iq));
function recordIQ(p,iq){p.iq=Math.max(8,Math.min(250,Math.round(iq)));p.retakeTier=Math.max(integer(p.retakeTier,3),iqTier(p.iq))}
function normalise(p){p.quietDaySeen=p.quietDaySeen===true;p.retakeTier=Math.max(integer(p.retakeTier,3),iqTier(p.iq));p.retakeCount=integer(p.retakeCount,1000000);p.baseIQ=Number.isInteger(p.baseIQ)&&p.baseIQ>=8&&p.baseIQ<=12?p.baseIQ:p.iq>=8&&p.iq<=12?p.iq:10;p.speedLevel=integer(p.speedLevel,80);p.qualityLevel=integer(p.qualityLevel,42);p.appleCount=Math.max(1,integer(p.appleCount,9));p.directions=Array.isArray(p.directions)?[...new Set(['clockwise',...p.directions.filter(id=>DIRECTIONS.some(d=>d.id===id))])]:['clockwise'];p.direction=p.directions.includes(p.direction)?p.direction:'clockwise';p.rainbow=p.rainbow===true;p.retakeUnlocked=p.retakeUnlocked===true&&p.retake!==true;p.advanced=p.advanced===true;p.discovered=p.discovered===true;p.thoughtSeen=p.thoughtSeen===true;p.retake=p.retake===true;p.potential=Number.isFinite(p.potential)&&p.potential>=0?Math.min(p.potential,1e15):0;return p}
const sides=p=>Math.min(360,4+p.qualityLevel*(p.qualityLevel+1)/2);
const appleForm=p=>Math.max(0,Math.min(1,(p.qualityLevel-27)/5));
const appleVolume=p=>Math.max(0,Math.min(1,(p.qualityLevel-32)/10));
const hasStem=p=>sides(p)===360;
const directionMultiplier=p=>p.directions.includes(p.direction)?DIRECTIONS.find(d=>d.id===p.direction)?.bonus||1:1;
const speed=p=>1+p.speedLevel*.1;
function price(p,type,id){if(type==='speed')return p.speedLevel>=80?null:p.speedLevel<2?30:Math.round(30*Math.pow(1.6,p.speedLevel-1));if(type==='quality')return p.qualityLevel>=42?null:Math.round(150*Math.pow(1.24,p.qualityLevel));if(type==='count')return p.appleCount>=9?null:Math.round(1e6*Math.pow(5,p.appleCount-1));if(type==='color')return p.rainbow?null:1e7;if(type==='retake')return p.retakeUnlocked||p.retake?null:retakeCost(p);if(type==='direction'){const d=DIRECTIONS.find(d=>d.id===id);return !d||p.directions.includes(id)?null:d.cost}return null}
function income(p){const base=p.advanced?50:2.5;return base*speed(p)*(1+(sides(p)-4)/90+appleForm(p)*3+appleVolume(p)*5)*p.appleCount*directionMultiplier(p)*(p.rainbow?3:1)*iqMultiplier(p)}
function canBuy(p,type,id){const cost=price(p,type,id);return cost!==null&&p.potential+1e-7>=cost&&(p.advanced||type==='speed'&&p.speedLevel<2)}
function buy(p,type,id){if(!canBuy(p,type,id))return false;const cost=price(p,type,id);p.potential=Math.max(0,p.potential-cost);if(type==='speed')p.speedLevel++;if(type==='quality')p.qualityLevel++;if(type==='count')p.appleCount++;if(type==='color')p.rainbow=true;if(type==='retake')p.retakeUnlocked=true;if(type==='direction'){p.directions.push(id);p.direction=id}return true}
function startRetake(p){if(!p.retakeUnlocked||p.retake||!p.advanced||p.phase!=='mind'||p.step!==5)return false;p.retakeUnlocked=false;p.retake=true;return true}
function retakeIQ(p,correct){return Math.min(250,p.baseIQ+Math.max(0,Math.min(20,Math.floor(Number(correct)||0)))*5)}
function schoolReaction(iq){return iq<40?'laugh':iq<80?'quiet':'friends'}
const api={DIRECTIONS,IQ_THRESHOLDS,normalise,sides,appleForm,appleVolume,hasStem,directionMultiplier,speed,price,income,iqMultiplier,retakeCost,recordIQ,canBuy,buy,startRetake,retakeIQ,schoolReaction};scope.AppleProgression=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
