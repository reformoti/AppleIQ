'use strict';
((scope)=>{
 const KEY='appleiq-audio-01',labels=Object.freeze({shake:'Тряска яблук',water:'Краплі води',shadows:'Тіні',colors:'Зміна кольорів',lighting:'Освітлення'}),keys=Object.keys(labels);
 let revision=0;let effects=Object.fromEntries(keys.map(k=>[k,true]));
 function read(){try{return JSON.parse((scope.AppleSaveStore?scope.AppleSaveStore.read(KEY):scope.localStorage?.getItem(KEY))||'null')||{}}catch{return{}}}
 function classes(){const list=scope.document?.body?.classList;if(list)for(const k of keys)list[effects[k]?'remove':'add']('effects-no-'+k)}
 function load(){revision++;const saved=read().effects;effects=Object.fromEntries(keys.map(k=>[k,saved?.[k]!==false]));classes()}
 function save(){const p=read(),valid=n=>Number.isFinite(n)&&n>=0&&n<=1,volume=valid(p.volume)?p.volume:Array.isArray(p.volumes)&&valid(p.volumes[0])?p.volumes[0]:.2,text=JSON.stringify({volume,muted:p.muted===true,effects:{...effects}});try{if(scope.AppleSaveStore)return scope.AppleSaveStore.write(KEY,text);scope.localStorage?.setItem(KEY,text);return true}catch{return false}}
 function set(key,on){if(!keys.includes(key)||typeof on!=='boolean')return false;effects[key]=on;revision++;classes();save();return true}
 function apply(p){if(keys.every(k=>effects[k]))return p;return{...p,shakeLevel:effects.shake?p.shakeLevel:0,waterLevel:effects.water?p.waterLevel:0,renderShadows:effects.shadows,renderColors:effects.colors,renderLighting:effects.lighting}}
 function markup(){return '<details class="visual-options"><summary>Оптимізація</summary><p>Вимикай ефекти, щоб зменшити навантаження. Покупки й бонуси IQ зберігаються.</p>'+keys.map(k=>'<div class="visual-option"><span>'+labels[k]+'</span><div role="group" aria-label="'+labels[k]+'">'+[true,false].map(on=>'<button type="button" id="effect-'+k+'-'+(on?'on':'off')+'" aria-pressed="'+(effects[k]===on)+'">'+(on?'Увімк.':'Вимк.')+'</button>').join('')+'</div></div>').join('')+'</details>'}
 function mount(dialog){for(const k of keys)for(const on of [true,false]){const button=dialog.querySelector('#effect-'+k+'-'+(on?'on':'off'));if(button)button.onclick=()=>{set(k,on);for(const state of [true,false])dialog.querySelector('#effect-'+k+'-'+(state?'on':'off'))?.setAttribute('aria-pressed',String(effects[k]===state))}}}
 load();const api=Object.freeze({get:()=>({...effects}),revision:()=>revision,enabled:key=>effects[key]!==false,set,apply,markup,mount,load});scope.AppleVisualSettings=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
