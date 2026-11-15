(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AppleIQAchievementData=api;})(typeof window==='undefined'?globalThis:window,function(){'use strict';
 const definitions=Object.freeze([
  {id:'secret-160',title:'Поза шкалою',description:'Знайди прихований результат 160 IQ.'},
  {id:'secret-67',title:'Мінусова геніальність',description:'Знайди прихований результат −67 IQ.'},
  {id:'calendar-secret',title:'Між двома датами',description:'Поміть прихований силует наприкінці календаря 09.11.'},
  {id:'ending-happy',title:'Звичайне щастя',description:'Дійди до фіналу Happy End.'},
  {id:'ending-bad',title:'Ціна помилки',description:'Дійди до Bad End після останньої перевірки.'},
  {id:'ending-genius',title:'Ціна геніальності',description:'Заверши кінцівку генія й дістанься епілогу на пагорбі.'},
  {id:'ending-secret-160',title:'За межею нескінченності',description:'Заверши першу секретну кінцівку.'},
  {id:'ending-secret-67',title:'Володар 6–7',description:'Заверши космічну кінцівку −67 IQ.'},
  {id:'both-iq-secrets',title:'Дві сторони неможливого',description:'Знайди обидві секретні гілки IQ-тесту.'},
  {id:'all-endings',title:'Усі долі маленького Джо',description:'Відкрий усі п’ять кінцівок гри.'}
 ].map(Object.freeze));
 const endingIds=Object.freeze(['ending-happy','ending-bad','ending-genius','ending-secret-160','ending-secret-67']);
 function secrets(test){const r=test?.responses,complete=test?.completed===true||test?.index===20;if(!complete||!Array.isArray(r)||r.length!==20)return{first:false,cosmic:false};const first=!test.pendingRetake&&!(test.round>0)&&r.every((v,i)=>v===[0,2,1,3,4][i%5]),cosmic=r.slice(0,10).every(v=>Number.isInteger(v)&&v>=0&&v<6)&&[2,3,2,3,2,3].every((v,i)=>r[i+4]===v)&&r.slice(10).every((v,i)=>v===(i%2?6:5));return{first,cosmic}}
 function conditions(state={}){const s=state.story||{},secret=secrets(state.test),ending=state.ending,t=Number(s.eventTime)||0;return[secret.first||s.phase==='bad-end',secret.cosmic||s.phase==='cosmic-end',state.calendarSecret===true||s.phase==='cycle'&&t>=25,ending==='happy'||s.phase==='happy-end'&&t>=64,ending==='bad'||s.phase==='vegetable'&&s.ultimateStatus==='failed'&&t>=20,ending==='genius'||s.geniusEndingSeen===true||s.phase==='genius-end'&&t>=147,ending==='secret-160',ending==='secret-67',false,false]}
 function aggregates(unlocked){const ids=new Set(unlocked);return[...(ids.has('secret-160')&&ids.has('secret-67')?['both-iq-secrets']:[]),...(endingIds.every(id=>ids.has(id))?['all-endings']:[])]}
 return Object.freeze({definitions,endingIds,secrets,conditions,aggregates});
});
