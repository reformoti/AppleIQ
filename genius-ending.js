'use strict';
((scope)=>{
  const DURATION=147, ACT_START=88, BLACKOUT=137, HILL_START=139;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const chapters=Object.freeze([
    [0,8,'sleep','ПІСЛЯ ОСТАННЬОЇ БИТВИ','Усі десять суперників позаду. Маленький Джо спить у своїй кімнаті.'],
    [8,15,'regret','УСЕРЕДИНІ','Що я накоїв?'],
    [15,23,'meaning','УСЕРЕДИНІ','У чому сенс мого існування?'],
    [23,32,'visitors','КІМНАТА','До кімнати заходять рідні. Він не прокидається.'],
    [32,40,'help','ВИКЛИК','Вони кличуть його на ім’я. Потім викликають швидку.'],
    [40,49,'ambulance','ДОРОГА ДО ЛІКАРНІ','Приїхала швидка. Маленького Джо забрали до лікарні.'],
    [49,60,'hospital','ЛІКАРНЯ','Дні змінюють один одного. Він залишається в лікарні.'],
    [60,66,'years','ЧАС','Минуло три роки.'],
    [66,74,'return','ЗНОВУ ВСЕРЕДИНІ','Камера знову наближається до його думок.'],
    [74,88,'warm','ТИША','Усередині — затишна кімната з теплим світлом. І хтось, хто поправляє краватку.'],
    [88,107,'act-one','',''],
    [107,123,'act-two','',''],
    [123,137,'act-three','',''],
    [137,139,'blackout','',''],
    [139,147,'hill','','']
  ].map(([start,end,id,label,caption])=>Object.freeze({start,end,id,label,caption})));
  function at(time){const t=clamp(Number.isFinite(time)?time:0,0,DURATION),chapter=chapters.find(s=>t<s.end)||chapters[chapters.length-1],local=t-chapter.start;let caption=chapter.caption;
    if(chapter.id==='act-one')caption=local<6?'Може, це й на краще?':local<12?'Хто я після цього?':'. . .';
    if(chapter.id==='act-two')caption=local<8?'Де я звернув не туди?':'Чого я досяг?';
    return {...chapter,caption,time:t,local,finished:t>=DURATION}}
  function music(time){return time<BLACKOUT?{id:5,gain:1}:{id:7,gain:ease((time-HILL_START)/8)}}
  function dotAlpha(time,index){return .08+.92*Math.pow((1+Math.cos(time*3.2-index*1.05))/2,2)}
  function begin(p,replay=false){if(p.endingPath!=='genius'||p.geniusArena?.status!=='complete'||p.geniusArena.next!==10||p.geniusEndingSeen&&!replay)return false;p.phase='genius-end';p.eventTime=0;return true}
  const rect=(c,x,y,w,h,color,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
  const line=(c,x,y,X,Y,color,w=3)=>{c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()};
  const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
  const text=(c,s,x,y,size=24,color='#e4d9cb')=>{c.fillStyle=color;c.font=`${size}px Arial`;c.textAlign='center';c.fillText(s,x,y)};
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');rect(c,x-r,y-r,r*2,r*2,g)}
  function sleeper(c,x,y){oval(c,x,y,28,27,'#cba988');oval(c,x-7,y-15,23,13,'#3c3029');line(c,x-14,y,x-5,y,'#6c4e46',2);line(c,x+4,y,x+13,y,'#6c4e46',2);rect(c,x+27,y-13,230,45,'#505766',10)}
  function person(c,x,y,color='#707e87',phone=false,t=0,reduced=false){y-=reduced?0:Math.sin(t*1.6)*.6;oval(c,x,y,40,9,'#00000030');line(c,x-13,y-80,x-18,y-5,'#353b48',20);line(c,x+13,y-80,x+19,y-5,'#353b48',20);rect(c,x-34,y-168,68,103,color,17);line(c,x-27,y-149,x-48,y-98,color,15);line(c,x+27,y-149,x+(phone?42:48),y-(phone?193:98),color,15);oval(c,x,y-204,30,36,'#cba988');oval(c,x-3,y-224,31,16,'#443934');oval(c,x-10,y-204,2,3,'#403329');oval(c,x+10,y-204,2,3,'#403329');line(c,x-8,y-188,x+8,y-188,'#875c4b',2);c.save();c.translate(x,y);scope.AppleCinema?.person(c,t,color,'#cba988',-204);c.restore();if(phone)rect(c,x+33,y-212,16,32,'#191e29',3)}
  function bedroom(c,t,visitors=false,phone=false,reduced=false){rect(c,0,0,1600,900,'#242632');rect(c,0,680,1600,220,'#1b1d25');rect(c,995,160,340,270,'#141923',8);rect(c,1007,172,316,246,'#152030',3);oval(c,1250,220,28,28,'#afafa0');line(c,1160,172,1160,418,'#313643',7);line(c,1007,289,1323,289,'#313643',7);rect(c,30,250,155,430,'#13151d',4);rect(c,46,268,120,405,visitors?'#16151d':'#403d43',4);rect(c,1060,620,440,130,'#3e3c47',12);rect(c,1050,592,455,67,'#646374',15);rect(c,1070,600,100,44,'#a19a9c',12);sleeper(c,1148,609);rect(c,1487,528,20,224,'#33343f',4);rect(c,220,545,525,26,'#726052',5);rect(c,244,568,17,155,'#403936');rect(c,698,568,17,155,'#403936');rect(c,380,365,240,165,'#111419',8);text(c,'250 IQ',500,460,38,'#a2a9b7');rect(c,420,530,160,12,'#343b45',4);if(visitors){const a=ease(t/4);person(c,mix(110,920,a),770,'#7b8271',false,t,reduced);person(c,mix(30,690,a),790,'#796c79',phone,t,reduced)}scope.AppleCinema?.room(c,'bedroom',t,reduced);glow(c,1250,300,560,'#7585b00c')}
  function hospital(c,t,reduced=false){rect(c,0,0,1600,900,'#515e66');rect(c,0,660,1600,240,'#363f48');rect(c,1140,125,320,325,'#aabdc5',5);rect(c,1155,140,290,295,'#70899a');line(c,1300,140,1300,435,'#c5d0cd',9);rect(c,360,610,920,100,'#c2c6bf',13);rect(c,330,590,950,55,'#e1dbcd',14);rect(c,342,640,18,135,'#a2a9ab',5);rect(c,1250,570,18,205,'#a2a9ab',5);rect(c,360,590,130,43,'#e5ddcd',16);c.save();c.translate(-760,0);sleeper(c,1148,609);c.restore();rect(c,510,597,730,47,'#8eabb4',12);rect(c,120,380,180,140,'#212e36',9);rect(c,130,390,160,120,'#283e44',4);line(c,210,520,210,730,'#9faeb0',8);line(c,160,730,260,730,'#9faeb0',6);const points=[[145,460],[165,460],[180,446],[193,478],[208,427],[219,467],[233,454],[275,454]];for(let i=1;i<points.length;i++)line(c,...points[i-1],...points[i],'#93b9a4',2);rect(c,810,160,160,150,'#d6d0bf',5);text(c,'ДЕНЬ',890,200,18,'#64747a');text(c,String(1+Math.floor(t/2)),890,270,44,'#64747a');rect(c,880,705,110,25,'#69777e',8);rect(c,894,730,14,70,'#454e55');rect(c,964,730,14,70,'#454e55');scope.AppleCinema?.ward(c,t,reduced);glow(c,1300,280,440,'#ccdce51a')}
  function ambulance(c,t,reduced){rect(c,0,0,1600,900,'#171f2d');rect(c,0,700,1600,200,'#242b35');scope.AppleCinema?.street(c,t,reduced);rect(c,100,220,490,480,'#3c434e',5);rect(c,250,500,120,200,'#191e29',5);for(let i=0;i<4;i++)rect(c,140+i*115,300,65,110,'#c6b08b55',3);const x=mix(620,1570,ease((t-3)/6));c.save();c.translate(x,680);rect(c,-180,-205,380,205,'#d7d9d3',16);rect(c,200,-150,145,150,'#c5ccc9',20);rect(c,220,-133,100,72,'#40556a',5);oval(c,270,-106,14,16,'#9caeae');line(c,270,-87,291,-69,'#607781',14);line(c,234,-124,262,-116,'#b7cbcf22',3);rect(c,-180,-75,510,25,'#8f514f');rect(c,-15,-155,28,85,'#92504e',3);rect(c,-43,-127,85,28,'#92504e',3);for(const dx of [-90,250]){oval(c,dx,0,40,40,'#19202a');oval(c,dx,0,21,21,'#6e7981');line(c,dx-Math.cos(t*4)*15,-Math.sin(t*4)*15,dx+Math.cos(t*4)*15,Math.sin(t*4)*15,'#b0b9b9',2)}rect(c,50,-222,88,17,'#6d9aaa',4);if(!reduced)glow(c,95,-217,110,'#81a2c124');c.restore()}
  function warm(c,t,reduced=false){rect(c,0,0,1600,900,'#5a493c');rect(c,0,650,1600,250,'#362c27');line(c,0,650,1600,650,'#98734e',4);for(let i=0;i<6;i++)line(c,0,700+i*40,1600,700+i*40,'#70513940',2);rect(c,160,150,320,320,'#ba9569',8);rect(c,176,166,288,288,'#383a48');oval(c,380,250,40,40,'#c9ab78');line(c,320,166,320,454,'#b48a60',8);line(c,176,310,464,310,'#b48a60',8);rect(c,150,130,32,365,'#806448',8);rect(c,460,130,32,365,'#806448',8);rect(c,1130,490,310,190,'#84634a',23);rect(c,1110,530,55,175,'#73563f',15);rect(c,1405,530,55,175,'#73563f',15);oval(c,825,783,430,72,'#826a4c');line(c,1050,710,1050,325,'#977a53',7);rect(c,992,285,116,95,'#d9b274',15);oval(c,1050,710,68,12,'#534330');glow(c,1045,375,540,'#edb75c39');rect(c,580,675,170,80,'#6f513b',10);rect(c,622,640,52,35,'#c3a67e',7);rect(c,1370,140,140,195,'#bd9365',5);rect(c,1384,154,112,167,'#7d755b');oval(c,1440,235,33,33,'#b8a06f');scope.AppleCinema?.warm(c,t,reduced);for(let i=0;i<16;i++)oval(c,120+i*91,145+(i*137)%460,1,1,'#ddbd8118')}
  function character(c,img,x,y,w,h,alpha=1){if(!img?.complete||!img.naturalWidth)return;c.save();c.globalAlpha=clamp(alpha);const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;c.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);c.restore()}
  function portrait(c,img,t,duration,reduced,reverse=false){rect(c,0,0,1600,900,'#000');const p=ease(t/duration),z=reduced?1:mix(reverse?1.12:1,reverse?1.03:1.13,p);c.save();c.translate(800+(reduced?0:mix(-16,16,p)),450+(z-1)*430+(reduced?0:mix(8,-8,p)));c.scale(z,z);c.rotate(reduced?0:mix(-.003,.003,p));character(c,img,-320,-430,640,860);c.restore();if(t<1)rect(c,0,0,1600,900,`rgba(0,0,0,${1-ease(t)})`)}
  function dots(c,t,x,y,size=55){for(let i=0;i<3;i++){c.save();c.globalAlpha=dotAlpha(t,i);text(c,'.',x+i*30,y,size,'#d8d4cd');c.restore()}}
  // Deform only the tree crown; the trunk, man and inscription stay anchored.
  function hill(c,img,t,reduced){rect(c,0,0,1600,900,'#191610');if(!img?.complete||!img.naturalWidth)return;
    const iw=img.naturalWidth,ih=img.naturalHeight,sy=ih/900,sx=iw/1600;
    c.drawImage(img,0,0,iw,ih,0,0,1600,900);
    if(!reduced){c.save();c.beginPath();c.moveTo(0,0);c.lineTo(1040,0);c.lineTo(1090,350);c.lineTo(730,485);c.lineTo(0,490);c.closePath();c.clip();
      for(let y=0;y<492;y+=6){const weight=1-ease(y/510),offset=Math.sin(t*.7+y*.008)*2.5*weight;c.drawImage(img,0,y*sy,iw,Math.min(7*sy,ih-y*sy),offset,y,1600,7)}c.restore();
      for(let i=0;i<7;i++){const phase=(t/32+i/7)%1,x=-80+phase*1760,y=180+i*19+Math.sin(phase*Math.PI*2+i)*35,wing=Math.sin(t*5+i)*5,size=5+i%3;c.strokeStyle='#3e3930';c.lineWidth=1.5;c.beginPath();c.moveTo(x-size,y-wing);c.quadraticCurveTo(x-size/2,y-3,x,y);c.quadraticCurveTo(x+size/2,y-3,x+size,y-wing);c.stroke()}}
    if(t<8)rect(c,0,0,1600,900,`rgba(0,0,0,${1-ease(t/8)})`)
  }
  function draw(c,canvas,time,reduced=false,images={},ambientTime=0){const scene=at(time),b=canvas.getBoundingClientRect(),dpr=Math.min(scope.devicePixelRatio||1,1.5);canvas.width===Math.round(b.width*dpr)&&canvas.height===Math.round(b.height*dpr)||(canvas.width=Math.round(b.width*dpr),canvas.height=Math.round(b.height*dpr));c.setTransform(dpr,0,0,dpr,0,0);rect(c,0,0,b.width,b.height,'#000');const portraitFrame=b.width<b.height&&scene.id.startsWith('act-');const fit=Math.min(b.width/(portraitFrame?700:1600),b.height/900);c.save();c.translate((b.width-1600*fit)/2,(b.height-900*fit)/2);c.scale(fit,fit);c.beginPath();c.rect(0,0,1600,900);c.clip();const t=scene.local;
    if(scene.id==='sleep'||scene.id==='visitors'||scene.id==='help'){const zoom=scene.id==='sleep'?mix(1,12,ease((t-2)/6)):scene.id==='visitors'?mix(12,1,ease(t/4)):1;const z=reduced?1:zoom;c.save();c.translate(800,450);c.scale(z,z);c.translate(-(1148-348*(12-z)/(11*z)),-(609-159*(12-z)/(11*z)));bedroom(c,t,scene.id!=='sleep',scene.id==='help',reduced);c.restore();if(scene.id==='sleep'&&t>6)rect(c,0,0,1600,900,`rgba(0,0,0,${ease((t-6)/2)})`);if(scene.id==='visitors'&&t<1)rect(c,0,0,1600,900,`rgba(0,0,0,${1-ease(t)})`)}
    else if(scene.id==='regret'||scene.id==='meaning'){rect(c,0,0,1600,900,'#000');character(c,images.thought,505,100,590,705,scene.id==='regret'?ease(t/2):1);glow(c,800,810,380,'#87839109')}
    else if(scene.id==='ambulance')ambulance(c,t,reduced);
    else if(scene.id==='hospital'){c.save();scope.AppleCinema?.camera(c,t,11,reduced,760,470);hospital(c,t,reduced);c.restore();}
    else if(scene.id==='years'){rect(c,0,0,1600,900,'#08090c');scope.AppleCinema?.years(c,t,reduced);text(c,'ТРИ РОКИ ПОТОМУ',800,460,48,'#c7c4bf')}
    else if(scene.id==='return'){const z=reduced?1:mix(1,17,ease(t/8));c.save();c.translate(800,450);c.scale(z,z);c.translate(-(388+412*(17-z)/(16*z)),-(609-159*(17-z)/(16*z)));hospital(c,11,reduced);c.restore();rect(c,0,0,1600,900,`rgba(0,0,0,${ease((t-5)/3)})`)}
    else if(scene.id==='warm'){c.save();scope.AppleCinema?.camera(c,t,14,reduced);warm(c,t,reduced);character(c,images.suit,615,130,370,650,ease(t/2));if(t<2)rect(c,0,0,1600,900,`rgba(0,0,0,${1-ease(t/2)})`);if(t>12.5)rect(c,0,0,1600,900,`rgba(0,0,0,${ease((t-12.5)/1.5)})`);c.restore()}
    else if(scene.id==='act-one')portrait(c,images.actOne,t,19,reduced);
    else if(scene.id==='act-two')portrait(c,images.actTwo,t,16,reduced,true);
    else if(scene.id==='act-three'){portrait(c,images.actThree,t,14,reduced);if(t>=4){c.save();c.globalAlpha=ease((t-4)/2);rect(c,0,335,1600,200,'#0009');text(c,'END',755,457,66,'#d8d4cd');dots(c,t,855,457,66);c.restore()}}
    else if(scene.id==='hill')hill(c,images.hill,t+ambientTime,reduced);
    else rect(c,0,0,1600,900,'#000');
    if(!['blackout','hill'].includes(scene.id))scope.AppleCinema?.finish(c,time,reduced,scene.id==='warm');if(scene.start>0&&scene.start<74&&!['regret','meaning','visitors'].includes(scene.id)&&t<.7)rect(c,0,0,1600,900,`rgba(0,0,0,${(1-ease(t/.7))*.8})`);c.restore();return scene
  }
  const api=Object.freeze({DURATION,ACT_START,BLACKOUT,HILL_START,chapters,at,music,dotAlpha,begin,draw});scope.AppleGeniusEnding=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
