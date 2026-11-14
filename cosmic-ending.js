'use strict';
((scope)=>{
 const CODE=Object.freeze([2,3,2,3,2,3]),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},TAU=Math.PI*2;
 function unlocked(responses,index=10){return index>=10&&Array.isArray(responses)&&responses.length===20&&responses.slice(0,10).every(v=>Number.isInteger(v)&&v>=0&&v<6)&&CODE.every((v,i)=>responses[i+4]===v)}
 function validResponses(responses){return Array.isArray(responses)&&responses.length===20&&responses.every((v,i)=>v===null||Number.isInteger(v)&&v>=0&&(v<6||v===6&&unlocked(responses,i)))}
 function matches(responses){return validResponses(responses)&&unlocked(responses)&&responses.every((v,i)=>v!==null&&(i<10||v===(i%2===0?5:6)))}
 function iq(time){const t=Math.max(0,Number(time)||0);if(t<2)return-67;if(t<8)return-67-Math.floor((t-2)*3);if(t<24)return-85-Math.floor(12*(Math.exp((t-8)*.35)-1));return'−∞'}
 function frame(time,duration=NaN,reduced=false){const t=Math.max(0,Number.isFinite(time)?time:0),known=Number.isFinite(duration)&&duration>0,left=known?duration-t:Infinity;
  const stage=left<=1?'black':left<=5?'final':left<=7?'white':'edit',beat=reduced?0:Math.pow(Math.max(0,Math.sin(t*TAU*1.5)),12);
  return{time:t,iq:iq(t),hero:ease((t-3.5)/2),reveal:ease((t-5.5)/3.5),transform:ease((t-10)/5),shade:ease((t-5.5)/3.5),hands:ease((t-21)/1),wave:reduced?0:Math.sin((t-21)*TAU*.9),beat,stage,finalAlpha:stage==='final'?ease((5-left)/.65):0,preFade:known?ease((9-left)/2):0,gain:known?1-ease((7-left)/7):1,remaining:left}
 }
 const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)},oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fill()},text=(c,s,x,y,size=36,color='#eee')=>{c.font=size+'px Arial';c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y)};
 function image(c,img,x,y,w,h,alpha=1,screen=false,crop=null){if(!img?.complete||!img.naturalWidth)return;c.save();c.globalAlpha=clamp(alpha);if(screen)c.globalCompositeOperation='screen';const sw=crop?.[2]||img.naturalWidth,sh=crop?.[3]||img.naturalHeight,s=Math.min(w/sw,h/sh),W=sw*s,H=sh*s;c.drawImage(img,crop?.[0]||0,crop?.[1]||0,sw,sh,x+(w-W)/2,y+(h-H)/2,W,H);c.restore()}
 function galaxy(c,x,y,r,t,hue){c.save();c.translate(x,y);c.rotate(t*.14);const glow=c.createRadialGradient(0,0,1,0,0,r);glow.addColorStop(0,'#f8dfca99');glow.addColorStop(.12,`hsla(${hue},70%,70%,.4)`);glow.addColorStop(1,`hsla(${hue},70%,40%,0)`);oval(c,0,0,r,r*.6,glow);for(let arm=0;arm<3;arm++){c.beginPath();for(let i=1;i<35;i++){const a=i*.17+arm*TAU/3,rad=r*i/35,x=Math.cos(a)*rad,y=Math.sin(a)*rad*.45;i===1?c.moveTo(x,y):c.lineTo(x,y)}c.strokeStyle=`hsla(${hue},60%,74%,.25)`;c.lineWidth=2;c.stroke()}oval(c,0,0,r*.07,r*.04,'#fbe7ca');c.restore()}
 function universe(c,t,reduced,images,beat){const a=reduced?0:t,sky=c.createRadialGradient(800,410,40,800,450,980);sky.addColorStop(0,'#090411');sky.addColorStop(.6,'#04030a');sky.addColorStop(1,'#000');box(c,0,0,1600,900,sky);
  for(let layer=0;layer<3;layer++)for(let i=0;i<65;i++){const phase=i*2.39996+layer,orbit=120+Math.sqrt(i/65)*(650+layer*80),speed=.018+layer*.011,x=800+Math.cos(phase+a*speed)*orbit,y=450+Math.sin(phase+a*speed)*orbit*.61,r=(i%7===0?1.9:.7)+layer*.35;c.globalAlpha=.15+(1+Math.sin(a*.4+i))*.12;oval(c,x,y,r,r,i%5?'#d5e2ff':'#f9d5ef');if(i%23===0){c.fillStyle='#dcecff40';c.fillRect(x-7,y-.5,14,1);c.fillRect(x-.5,y-7,1,14)}}c.globalAlpha=1;
  for(let i=0;i<5;i++){const phase=i*TAU/5+a*.07,radius=520+Math.sin(i)*80;galaxy(c,800+Math.cos(phase)*radius,450+Math.sin(phase)*320,70+i%3*26,a+i*2,230+i*23)}
  c.save();c.translate(800+Math.cos(a*.095)*470,250+Math.sin(a*.095)*100);c.rotate(reduced?0:Math.sin(a*.12)*.12);image(c,images.hole,-390,-215,780,430,.28+.06*beat,true);c.restore();
  if(!reduced)for(let i=0;i<5;i++){const phase=(a*.13+i*.23)%1;c.strokeStyle='#899ad323';c.lineWidth=1;c.beginPath();c.moveTo(1450-phase*1800,70+i*145);c.lineTo(1510-phase*1800,45+i*145);c.stroke()}
 }
 function draw(c,canvas,time,duration,reduced=false,images={}){const f=frame(time,duration,reduced),b=canvas.getBoundingClientRect(),dpr=Math.min(scope.devicePixelRatio||1,1.5);if(canvas.width!==Math.round(b.width*dpr)||canvas.height!==Math.round(b.height*dpr)){canvas.width=Math.round(b.width*dpr);canvas.height=Math.round(b.height*dpr)}c.setTransform(dpr,0,0,dpr,0,0);box(c,0,0,b.width,b.height,'#000');
  if(f.stage==='black')return f;
  if(f.stage==='white'){box(c,0,0,b.width,b.height,reduced?'#b7b7bf':'#fff');return f}
  const fit=Math.min(b.width/1600,b.height/900);c.save();c.translate((b.width-1600*fit)/2,(b.height-900*fit)/2);c.scale(fit,fit);c.beginPath();c.rect(0,0,1600,900);c.clip();
  if(f.stage==='final'){box(c,0,0,1600,900,reduced?'#b7b7bf':'#fff');image(c,images.final,0,0,1600,900,f.finalAlpha);if(f.finalAlpha>.3){c.save();c.globalAlpha=f.finalAlpha;box(c,0,848,1600,52,'#0000008c');text(c,'володар 6–7',800,879,Math.max(20,10/fit),'#e0d9e8');c.restore()}c.restore();return f}
  universe(c,time,reduced,images,f.beat);box(c,0,0,1600,900,'#00000078');if(f.shade<1&&images.classroom){c.save();c.globalAlpha=1-f.shade;images.classroom(c,time,f);c.restore()}
  c.save();const drift=reduced?0:Math.sin(time*.45)*10,zoom=1+f.beat*.025;c.translate(800+drift,460);c.scale(zoom,zoom);c.rotate(reduced?0:Math.sin(time*.8)*.008);
  const r=f.reveal;image(c,images.human,-102+( -550+102)*r,40+(-380-40)*r,240+860*r,210+550*r,f.hero*(1-f.transform));
  if(f.transform>0){if(!reduced){c.save();c.globalCompositeOperation='screen';c.filter='sepia(1) saturate(4) hue-rotate(210deg)';image(c,images.face,-325+f.beat*12,-325,650,710,f.transform*.2,true);c.restore()}image(c,images.face,-320,-325,640,710,f.transform,true)}c.restore();
  if(f.hands>0){const wave=f.wave*42;for(const [side,img,label]of[[-1,images.left,'6'],[1,images.right,'7']]){c.save();c.translate(800+side*510,550+side*wave);c.rotate(reduced?0:side*(.05+f.wave*.08));image(c,img,-310,-170,620,340,f.hands,true,images[side<0?'leftCrop':'rightCrop']);c.restore();c.save();c.globalAlpha=f.hands;const active=(side<0?f.wave:-f.wave)>0;text(c,label,800+side*510,300+side*wave,active?160:145,active?'#faf2ff':'#bab1d9');c.restore()}c.save();c.globalAlpha=f.hands*.85;text(c,'СІКС — СЕВЕН',800,815,25,'#e1d6ef');c.restore()}
  c.save();c.globalAlpha=f.shade;const score=typeof f.iq==='number'?String(f.iq).replace('-','−'):f.iq;text(c,score,800,85,77,'#f1eaf9');text(c,'IQ',800,118,19,'#928aab');c.restore();
  const vignette=c.createRadialGradient(800,450,250,800,450,1000);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000b0');box(c,0,0,1600,900,vignette);if(f.preFade>0)box(c,0,0,1600,900,`rgba(0,0,0,${f.preFade*.93})`);c.restore();return f
 }
 const api=Object.freeze({CODE,unlocked,validResponses,matches,iq,frame,draw});scope.AppleCosmicEnd=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
