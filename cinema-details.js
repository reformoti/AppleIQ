'use strict';
((scope)=>{
 const Actor=scope.AppleCharacterModel||(typeof require==='function'?require('./character-model.js'):null);
 const SceneArt=scope.AppleSceneArt||(typeof require==='function'?require('./scene-art.js'):null);
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},TAU=Math.PI*2;
 const box=(c,x,y,w,h,color,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()},line=(c,x,y,X,Y,color,w=2)=>{c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()},oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill()},text=(c,s,x,y,size=15,color='#b9b2a4')=>{c.font=size+'px Arial';c.textAlign='left';c.fillStyle=color;c.fillText(s,x,y)};
 function halo(c,x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#00000000');box(c,x-r,y-r,r*2,r*2,g)}
 const LIGHT_STOPS=[
  [0,[32,36,50],[20,24,35],[8,16,32],[27,39,58],0],
  [5,[41,43,58],[25,29,39],[26,34,57],[98,76,94],.04],
  [7,[112,103,92],[75,70,65],[113,151,174],[237,180,130],.75],
  [10,[111,123,126],[76,79,77],[112,167,195],[202,225,224],1],
  [15,[122,121,108],[87,81,69],[120,168,189],[232,215,171],.95],
  [17,[107,87,77],[68,53,50],[120,109,146],[237,152,100],.55],
  [19,[49,46,61],[29,29,40],[42,47,78],[117,79,100],.08],
  [21,[32,36,50],[20,24,35],[8,16,32],[27,39,58],0],
  [24,[32,36,50],[20,24,35],[8,16,32],[27,39,58],0]
 ];
 function lightAt(hour=12){const h=((Number.isFinite(hour)?hour:12)%24+24)%24,i=LIGHT_STOPS.findIndex(s=>s[0]>h),a=LIGHT_STOPS[Math.max(0,i-1)],b=LIGHT_STOPS[i<0?LIGHT_STOPS.length-1:i],f=ease((h-a[0])/(b[0]-a[0]||1)),color=k=>'rgb('+a[k].map((v,j)=>Math.round(v+(b[k][j]-v)*f)).join(',')+')';return{hour:h,wall:color(1),floor:color(2),skyTop:color(3),skyBottom:color(4),sun:a[5]+(b[5]-a[5])*f,night:h<6||h>=20}}
 function cycleLight(panel,time){const phase=((Number.isFinite(time)?time:0)%3.6+3.6)%3.6/3.6;return lightAt(panel===0?5.3+3.1*ease(phase/.85):panel===1?10.5+phase:17+5*ease(phase/.85))}
 function windowLight(c,x,y,w,h,hour=12,t=0,reduced=false){if(SceneArt)return SceneArt.windowView(c,x,y,w,h,hour,t,reduced);const light=lightAt(hour),sun=light.hour>6&&light.hour<19;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const sky=c.createLinearGradient(x,y,x,y+h);sky.addColorStop(0,light.skyTop);sky.addColorStop(1,light.skyBottom);box(c,x,y,w,h,sky);
  if(sun){const arc=clamp((light.hour-6)/13),sx=x+w*(.13+.74*arc),sy=y+h*(.86-.62*Math.sin(arc*Math.PI));halo(c,sx,sy,w*.35,'#ffe5ad35');oval(c,sx,sy,w*.085,w*.085,'#ffe5b6')}else if(light.night){oval(c,x+w*.76,y+h*.24,w*.065,w*.065,'#d8d9c1');for(let i=0;i<11;i++)oval(c,x+(.06+(i*37%89)/100)*w,y+(.08+(i*19%64)/100)*h,1,1,'#c0d3dfaa')}
  if(!light.night){const drift=reduced?0:Math.sin(t*.12)*w*.045;for(let i=0;i<3;i++)oval(c,x+w*(.2+i*.3)+drift,y+h*(.29+i%2*.17),w*.19,h*.025,'#f8ece052')}
  for(let i=0;i<7;i++){const bh=h*(.12+(i*13%19)/100);box(c,x+i*w/6,y+h-bh,w/6+1,bh,light.night?'#101b2c':'#647e8390');if(light.night)box(c,x+i*w/6+w*.06,y+h-bh+h*.07,w*.025,h*.025,'#d3ad6955')}
  for(let i=0;i<4;i++){const tx=x+w*(.1+i*.27),base=y+h,r=w*.032;line(c,tx,base,tx,base-h*.16,light.night?'#0b1521':'#455f67',Math.max(1,w*.009));oval(c,tx,base-h*.19,r*1.6,r*2.1,light.night?'#122332':'#4d6e73')};line(c,x,y+h*.97,x+w,y+h*.97,light.night?'#172634':'#82928a',h*.035);c.restore();line(c,x+w*.5,y,x+w*.5,y+h,light.night?'#3a4050':'#8d9694',Math.max(3,w*.014));line(c,x,y+h*.51,x+w,y+h*.51,light.night?'#3a4050':'#8d9694',Math.max(3,w*.014));return light
 }
 function lightSpill(c,light,x,y,w,h,width=1600,height=900){c.save();if(light.sun>.02){c.fillStyle='rgba(255,216,155,'+(light.sun*.105)+')';c.beginPath();c.moveTo(x,y+h);c.lineTo(x+w,y+h);c.lineTo(Math.min(width,x+w*.7),height);c.lineTo(Math.max(0,x-w*1.8),height);c.closePath();c.fill();const glow=c.createRadialGradient(x+w*.5,y+h*.4,1,x+w*.5,y+h*.4,w*1.8);glow.addColorStop(0,'rgba(255,221,178,'+light.sun*.13+')');glow.addColorStop(1,'#00000000');box(c,0,0,width,height,glow)}else{halo(c,x+w*.6,y+h*.4,w*1.4,'#8cafd413');halo(c,width*.91,height*.5,width*.16,'#e6bd701c')}c.restore()}
 function clock(c,x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);oval(c,2,3,42,42,'#00000035');oval(c,0,0,41,41,'#77746d');oval(c,0,0,36,36,'#c4c0ae');for(let i=0;i<12;i++){const a=i*TAU/12;line(c,Math.sin(a)*29,-Math.cos(a)*29,Math.sin(a)*33,-Math.cos(a)*33,'#51545a',i%3?1:2)}const a=t*.06;line(c,0,0,Math.sin(a)*26,-Math.cos(a)*26,'#a76a62',1.2);line(c,0,0,-15,-11,'#4a4d54',3);line(c,0,0,17,12,'#4a4d54',2);oval(c,0,0,3,3,'#4a4d54');c.restore()}
 function books(c,x,y,w=150,h=68){const colors=['#6d786b','#7a5b52','#565e73','#927f60','#516d70'];box(c,x-7,y+h,w+14,9,'#3a3331',2);let cursor=x;for(let i=0;cursor<x+w-10;i++){const width=11+i*7%12,height=h-8-i*11%20;box(c,cursor,y+h-height,width,height,colors[i%colors.length],1);line(c,cursor+2,y+h-height+9,cursor+width-2,y+h-height+9,'#d5c5a35c',1);line(c,cursor+2,y+h-7,cursor+width-2,y+h-7,'#d5c5a344',1);cursor+=width+3}}
 function plant(c,x,y,t,s=1,reduced=false){c.save();c.translate(x,y);c.scale(s,s);floorShadow(c,0,3,48,10,.32);material(c,-28,-51,56,48,'#9b7c60','#51463f',6);material(c,-33,-57,66,12,'#b19776','#6c5746',3);oval(c,0,-54,27,4,'#292c27');for(let i=0;i<7;i++){const px=(i-3)*13+(reduced?0:Math.sin(t*.7+i)*2.4),py=-90-(i*19%78);c.strokeStyle='#6b8062';c.lineWidth=2.3;c.beginPath();c.moveTo(0,-55);c.quadraticCurveTo(px*.3,py+40,px,py);c.stroke();for(const side of [-1,1]){c.save();c.translate(px,py+(side===1?7:-5));c.rotate(side*.28);c.fillStyle=side<0?'#7c9470':'#506d57';c.beginPath();c.moveTo(0,0);c.bezierCurveTo(side*9,-12,side*24,-10,side*30,-4);c.bezierCurveTo(side*20,6,side*7,9,0,0);c.fill();c.strokeStyle='#b0b88b45';c.lineWidth=.8;c.beginPath();c.moveTo(1,0);c.quadraticCurveTo(side*14,-1,side*27,-4);c.stroke();c.restore()}}line(c,-21,-41,-21,-13,'#d6b58723',1);line(c,-20,-5,20,-5,'#231f2428',1);c.restore()}
 function paper(c,x,y,w=90,h=55,color='#bdb29a'){box(c,x+3,y+4,w,h,'#00000024',2);box(c,x,y,w,h,color,2);for(let i=0;i<4;i++){const yy=y+h*(.22+i*.18);line(c,x+w*.1,yy,x+w*(i%2?.7:.87),yy,'#777b7555',Math.min(1,h*.06))}}
 function frame(c,x,y,w,h,label){box(c,x+4,y+4,w,h,'#00000025',3);box(c,x,y,w,h,'#756b5f',3);box(c,x+6,y+6,w-12,h-12,'#b2a78f');line(c,x+12,y+h-16,x+w-12,y+h-16,'#6f796a',2);text(c,label,x+12,y+h/2,Math.min(17,w/9),'#595e5a')}
 function material(c,x,y,w,h,top,bottom,r=0){if(scope.AppleVisualSettings?.enabled('lighting')===false){box(c,x,y,w,h,top,r);return}const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,top);g.addColorStop(1,bottom);box(c,x,y,w,h,g,r)}
 function floorShadow(c,x,y,rx,ry,alpha=.3){if(scope.AppleVisualSettings?.enabled('shadows')===false)return;c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,rx*.05,0,0,rx);g.addColorStop(0,'rgba(3,5,10,'+alpha+')');g.addColorStop(.55,'rgba(3,5,10,'+alpha*.4+')');g.addColorStop(1,'#03050a00');oval(c,0,0,rx,rx,g);c.restore()}
 // Room structure and contact shadows are painted before furniture and actors.
 function roomBackdrop(c,bedroom=true,t=0){c.save();const wall=c.createLinearGradient(0,0,0,680);wall.addColorStop(0,'#03050c30');wall.addColorStop(.45,'#fff0d705');wall.addColorStop(1,'#03050c25');box(c,0,0,1600,680,wall);const corner=c.createLinearGradient(0,0,1600,0);corner.addColorStop(0,'#02040a28');corner.addColorStop(.18,'#02040a00');corner.addColorStop(.83,'#02040a00');corner.addColorStop(1,'#02040a22');box(c,0,0,1600,680,corner);
  material(c,0,670,1600,12,'#71665944','#171a23bb');line(c,0,670,1600,670,'#b2a58925',1);line(c,0,683,1600,683,'#03050b66',2);material(c,0,684,1600,216,'#03050a00','#03050a38');
  for(let row=0;row<4;row++){const y=695+row*row*13;line(c,0,y,1600,y,'#ae977917',.7);for(let i=0;i<9;i++){const x=i*207+(row%2)*90;line(c,x,y,x+3,y+18+row*13,'#00000019',.8);line(c,x+23,y+5,x+76,y+6,'#c8b38d0c',.6)}}
  if(bedroom){floorShadow(c,1265,766,320,35,.45);floorShadow(c,495,734,310,24,.32);floorShadow(c,318,711,65,12,.4);floorShadow(c,517,755,93,15,.3);floorShadow(c,68,826,49,9,.3)}else{floorShadow(c,845,714,290,21,.35);floorShadow(c,822,748,88,14,.28)}c.restore()
 }
 // Materials stay inside the existing furniture footprints; faces are drawn afterwards.
 function bedroomSurfaces(c,variant='story'){
  material(c,1060,655,440,96,'#4b4754','#2c2c36',9);line(c,1068,749,1490,749,'#11151d80',3);material(c,1076,750,15,24,'#3b3740','#191c25',2);material(c,1462,750,16,24,'#3b3740','#191c25',2);
  material(c,1050,592,455,67,'#85838c','#565866',14);line(c,1065,649,1490,649,'#d9cfbd20',1.4);line(c,1058,658,1495,658,'#181e2b77',2);
  floorShadow(c,1138,635,83,11,.35);material(c,1070,600,100,44,'#bcb0a5','#87808a',12);c.save();c.beginPath();c.roundRect(1074,604,92,36,9);c.clip();c.strokeStyle='#dacebb45';c.lineWidth=.7;c.beginPath();c.moveTo(1082,607);c.quadraticCurveTo(1075,622,1081,637);c.stroke();c.beginPath();c.moveTo(1156,606);c.quadraticCurveTo(1164,622,1157,638);c.stroke();c.restore();
  material(c,1176,606,316,76,'#656e7e','#414858',8);c.save();c.beginPath();c.roundRect(1176,606,316,76,8);c.clip();for(let i=0;i<4;i++){c.strokeStyle=i%2?'#151d2f22':'#e7e0ce17';c.lineWidth=i%2?4:1.3;c.beginPath();c.moveTo(1182+i*72,611);c.bezierCurveTo(1188+i*72,632,1211+i*72,646,1207+i*72,679);c.stroke()}c.restore();line(c,1182,610,1481,610,'#ced4d42c',1);line(c,1183,680,1485,680,'#19233255',1);
  material(c,220,545,525,26,'#9a8063','#5b493c',4);line(c,227,547,738,547,'#e3c99b55',1);line(c,224,568,742,568,'#211f254d',2);for(let i=0;i<4;i++)line(c,247+i*118,555,297+i*118,556,'#442c2224',.7);material(c,244,571,17,152,'#5b4c41','#302e32');material(c,698,571,17,152,'#5b4c41','#302e32');line(c,246,578,246,717,'#cfb88d21',1);line(c,700,578,700,717,'#cfb88d21',1);
  // Bezel edge and a quiet reflected highlight leave the screen text untouched.
  const x=variant==='genius'?380:300,y=variant==='genius'?365:330,w=variant==='genius'?240:350,h=variant==='genius'?165:205;line(c,x+6,y+2,x+w-6,y+2,'#b1bac622',1);line(c,x+2,y+6,x+2,y+h-5,'#bec5ce16',1);
 }
 function room(c,kind,t=0,reduced=false,variant='story'){const bedroom=kind==='bedroom',happy=kind==='happy-school',deskY=happy?480:515;if(bedroom)bedroomSurfaces(c,variant);interior(c,bedroom,t,reduced);
  for(let i=0;i<5;i++)line(c,0,704+i*40,1600,704+i*40,bedroom?'#b6a7850b':'#c8c2b70a',1);
  if(bedroom){clock(c,865,130,t,.7);books(c,755,240,158,72);books(c,755,342,158,59);line(c,748,220,748,415,'#423b36',7);line(c,922,220,922,415,'#423b36',7);frame(c,340,165,147,112,'Джо');paper(c,variant==='genius'?630:585,variant==='genius'?526:524,variant==='genius'?50:90,variant==='genius'?14:17);if(variant==='genius')keyboard(c,420,533,160,10);else keyboard(c,345,532,195,13);line(c,685,525,703,540,'#a29779',3);box(c,1415,495,112,18,'#635047',3);line(c,1460,495,1460,421,'#7d6b58',4);box(c,1420,389,80,50,'#d2b58c',7);halo(c,1460,435,185,'#eac17b10');oval(c,1170,805,330,37,'#68554322');plant(c,68,824,t,.6,reduced);box(c,1419,488,35,6,'#6e7b76',1);line(c,1422,491,1451,491,'#d4c7a957',1);material(c,1500,474,17,21,'#a49582','#655f58',3);oval(c,1508.5,475,7,2,'#393b3c');line(c,1427,513,1435,532,'#24252c',3);line(c,1512,513,1506,530,'#24252c',3);if(variant==='genius'){halo(c,1250,300,430,'#94b4dc0b');halo(c,1455,436,170,'#f5bc7910')}
   // Window reflections, curtain folds and passing clouds stay behind the actors.
   for(let i=0;i<4;i++)line(c,978+i*6,156,978+i*6,440,'#aaa6ab14',1);line(c,1019,189,1140,270,'#d4dce31c',3);line(c,1180,315,1308,398,'#d4dce30d',9);const cloud=reduced?0:Math.sin(t*.04)*26;for(let i=0;i<3;i++)oval(c,1065+i*72+cloud,245+i*38,38,4,'#b7c2cf0d');
  }else{clock(c,1220,169,t,.8);frame(c,1048,242,244,132,'РОЗКЛАД ЗАНЯТЬ');for(let i=0;i<4;i++)line(c,1071,289+i*17,1265-i%2*47,289+i*17,'#717d7155',2);books(c,70,555,216,68);box(c,58,548,241,14,'#655a4d',2);box(c,58,632,241,12,'#655a4d',2);text(c,'a² + b² = c²',115,436,24,happy?'#c7c3a0':'#a3b0a7');text(c,'E = mc²',115,469,21,'#a3b0a766');paper(c,615,deskY-6,68,6);keyboard(c,704,deskY-11,222,11);box(c,937,deskY-13,32,13,'#7b5d50',2);for(let i=0;i<4;i++)line(c,943+i*5,deskY-14,942+i*5,deskY-36-i%2*8,'#b6a57e',2);plant(c,1345,740,t,.65,reduced);text(c,'маленький Джо',730,deskY+19,11,'#aca48a');}
 }
 function interior(c,bedroom,t,reduced){
  // Small, anchored props sit behind actors and share the existing room light.
  for(let i=0;i<19;i++){const x=35+i*83,y=710+(i*29%145);line(c,x,y,x+35+i%3*8,y+1,'#c6af9020',.8)}
  box(c,188,333,20,31,'#b5b0a067',3);box(c,193,339,10,16,'#d9d0b575',2);box(c,193,646,27,22,'#9e9f9666',3);for(const x of [201,211]){oval(c,x,653,1.1,1.8,'#303540');oval(c,x,660,1.1,1.8,'#303540')}
  if(bedroom){
   material(c,593,572,84,119,'#514036','#2e292b',3);for(let i=0;i<3;i++){material(c,598,580+i*34,74,27,'#75604b','#4a3d35',2);line(c,602,582+i*34,667,582+i*34,'#ceb58a24',.8);line(c,626,592+i*34,646,592+i*34,'#211f24',3);line(c,627,591+i*34,645,591+i*34,'#ac9b7b',1)}
   c.save();c.strokeStyle='#161e2566';c.lineWidth=2;c.beginPath();c.moveTo(319,577);c.bezierCurveTo(321,557,398,556,421,548);c.stroke();c.restore();box(c,284,577,72,129,'#242b32',5);line(c,291,584,291,692,'#77818b3d',2);oval(c,341,595,2.2,2.2,'#83a595');for(let i=0;i<5;i++)line(c,307,652+i*6,339,652+i*6,'#68747a55',1);line(c,319,577,335,561,'#252b32',2);
   box(c,1074,465,202,74,'#6a727457',5);for(let i=0;i<12;i++)line(c,1082+i*16,474,1082+i*16,530,'#afb2aa55',4);line(c,1275,503,1297,503,'#9b9d91',3);
   for(let i=0;i<4;i++){line(c,978+i*5,165,978+i*5+(reduced?0:Math.sin(t*.5+i)*1.4),436,'#c3afb323',1);line(c,1337+i*5,163,1337+i*5,435,'#c3afb323',1)}
   for(let i=0;i<4;i++)line(c,269+i*12,526,269+i*12,538,'#68543a33',.8);oval(c,1100,779,120,8,'#11151b20');
   paper(c,268,524,52,17,'#b9ac91');box(c,714,519,18,26,'#8c6c55',2);for(let i=0;i<3;i++)line(c,719+i*3,518,717+i*3,500+i%2*5,'#b1a17b',1.4);
  }else{
   box(c,439,428,121,81,'#8e989143',5);for(let i=0;i<8;i++)line(c,447+i*15,437,447+i*15,500,'#c2c7b455',4);line(c,560,470,571,470,'#bcc0ae',3);
   box(c,206,326,46,8,'#a9a78a',2);box(c,261,329,22,4,'#e8e0cc',1);for(let i=0;i<4;i++)line(c,225+i*35,196,246+i*35,198,'#a1b4a914',1);
   for(let i=0;i<3;i++)paper(c,492,224+i*34,55,27,['#c3b991','#acbca6','#bbaaa5'][i]);line(c,490,217,550,217,'#777568',2);
   box(c,1126,600,37,92,'#30383d',4);line(c,1145,608,1145,681,'#78878533',2);oval(c,1145,615,2,2,'#adb895');
  }
 }
 function keyboard(c,x,y,w=210,h=15){box(c,x-2,y-2,w+4,h+4,'#171d25',3);for(let row=0;row<3;row++)for(let i=0;i<14;i++)box(c,x+2+i*(w-4)/14,y+1+row*(h-2)/3,(w-9)/14-1,(h-4)/3-1,'#707984',.5)}
 function person(c,t,shirt,skin,headY=-203){line(c,-27,-116,-28,-83,'#00000018',2);line(c,26,-115,27,-79,'#ffffff18',1.2);line(c,-22,-68,22,-68,'#e4d5b733',1);for(let i=0;i<3;i++)oval(c,1,-131+i*20,1.2,1.2,'#ded5bf60');line(c,-23,-84,-13,-88,'#00000024',1);line(c,18,-91,27,-87,'#ffffff20',1)}
 // Shared faces keep expressions readable at scene scale, with a clean chin.
 function face(c,t,o={}){return Actor.face(c,t,o)}
 // Two-bone legs connect the hips to feet; the swing foot lifts while the other plants.
 function gait(t,{walk=false,seated=false,cheer=false,sad=false,phone=false,reduced=false}={}){
  t=Number.isFinite(t)?Math.max(0,t):0;const phase=reduced?0:t*8.5,moving=!!walk&&!seated&&!reduced;
  const legs=[-1,1].map((side,i)=>{const p=phase+i*Math.PI,hip={x:side*14,y:-78};let foot,knee;
   if(seated){knee={x:side*32,y:-37};foot={x:side*38,y:-7}}
   else{foot={x:side*18+(moving?Math.sin(p)*14:0),y:-7-(moving?Math.max(0,Math.cos(p))*11:0)};if(!moving)knee={x:side*16,y:-42};else{const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.hypot(dx,dy),a=(38*38-36*36+d*d)/(2*d),h=Math.sqrt(Math.max(0,38*38-a*a));knee={x:hip.x+dx*a/d+dy*h/d,y:hip.y+dy*a/d-dx*h/d}}}
   return{hip,knee,foot,lift:moving?Math.max(0,Math.cos(p)):0}
  });
  const arms=[-1,1].map((side,i)=>{const swing=moving?Math.sin(phase+(i+1)*Math.PI)*16:0,shoulder={x:side*28,y:-144};let elbow={x:side*38+swing*.5,y:-121},hand={x:side*46+swing,y:seated?-119:-96};if(cheer){elbow={x:side*50,y:-164};hand={x:side*(48+(reduced?0:Math.sin(t*5)*3)),y:-193}}if(side===1&&(sad||phone)){elbow={x:43,y:-145};hand={x:phone?36:32,y:phone?-201:-179}}return{shoulder,elbow,hand}});
  return{legs,arms,bob:moving?-Math.abs(Math.sin(phase))*2:reduced?0:Math.sin(t*1.6)*.4}
 }
 function character(c,x,y,t,o={}){return Actor.character(c,x,y,t,o,gait)}
 function sleepingBody(c,x,y){material(c,x+27,y-13,230,48,'#687486','#414b5e',11);c.save();c.beginPath();c.roundRect(x+27,y-13,230,48,11);c.clip();for(let i=0;i<3;i++){c.strokeStyle=i%2?'#17233b28':'#e2e4dd1d';c.lineWidth=i%2?3:1.1;c.beginPath();c.moveTo(x+56+i*61,y-9);c.bezierCurveTo(x+61+i*61,y+7,x+80+i*61,y+13,x+75+i*61,y+32);c.stroke()}c.restore()}
 function restingFace(c,x,y,t=0,sleeping=true){c.save();c.translate(x,y);c.scale(.84,.84);face(c,t,{headY:0,mood:sleeping?'sleep':'neutral',reduced:true});c.restore()}
 const blink=(t,seed=0)=>((t+seed)%4.7<.12?.15:1);
 function breathe(c,t,reduced=false){c.translate(0,reduced?0:Math.sin(t*1.7)*.8)}
 function street(c,t,reduced=false){for(let i=0;i<8;i++){const x=i*225;box(c,x,150+(i%3)*37,185,515-(i%3)*37,'#15202b');for(let row=0;row<5;row++)for(let col=0;col<3;col++)box(c,x+24+col*50,220+(i%3)*37+row*77,23,37,(row+col+i)%3?'#a5a08712':'#c8aa761c')}
  box(c,0,700,1600,18,'#60656b');for(let i=0;i<12;i++){const x=i*180-(reduced?0:t*60)%180;box(c,x,805,90,5,'#afaa7d44',1)}for(let i=0;i<3;i++){const x=670+i*390;line(c,x,700,x,370,'#535d67',5);box(c,x-30,361,60,10,'#c5b08e');halo(c,x,380,130,'#ebc98b12')}
 }
 function ward(c,t,reduced=false){
  const iv=960;line(c,iv,750,iv,245,'#b9c6c6',5);line(c,iv-39,249,iv+39,249,'#b9c6c6',4);
  box(c,iv-26,265,55,91,'#b3c2bf',8);box(c,iv-18,304,39,43,'#d5ddcf77',3);
  line(c,iv+1,356,iv+1,565,'#d3ded3aa',1.5);line(c,iv+1,565,790,610,'#d3ded3aa',1.5);
  for(const x of [354,828]){oval(c,x,782,16,16,'#26333c');oval(c,x,782,6,6,'#8b9695');line(c,x,764,x,772,'#9faaa7',5)}
  line(c,460,676,797,676,'#d3ded788',5);for(let i=0;i<4;i++)line(c,475+i*100,644,475+i*100,676,'#d3ded766',3);
  box(c,330,163,100,124,'#b4b5a9',3);paper(c,338,172,84,104,'#d3ccaf');
  for(let i=0;i<3;i++)line(c,348,220+i*15,411,220+i*15,'#82948144',1);
  c.save();c.beginPath();c.rect(140,401,141,96);c.clip();box(c,140,401,141,96,'#263c42');
  for(let i=0;i<7;i++){line(c,140+i*23,401,140+i*23,497,'#6b9e8a16',1);line(c,140,401+i*16,281,401+i*16,'#6b9e8a16',1)}
  c.strokeStyle='#9ec9a9';c.lineWidth=1.5;c.beginPath();for(let x=140;x<=281;x++){const phase=((x-140)*.07-(reduced?0:t*2))%TAU,pulse=Math.exp(-Math.pow(Math.sin(phase/2)*8,2))*Math.cos(phase*4)*24,y=454-pulse;x===140?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();c.restore();
  text(c,'маленький Джо',563,741,10,'#aab8b1');text(c,'ПАЛАТА 03',817,121,16,'#d7ded6');paper(c,558,710,80,20);plant(c,1495,785,t,.45,reduced)
 }

 function warm(c,t,reduced=false){for(let i=0;i<13;i++){const x=430+i*40;line(c,x,788,x+19,790,'#e1bb6a12',1)}for(let i=0;i<6;i++)line(c,1150+i*46,571,1150+i*46,649,'#c7a56c22',1);box(c,40,557,430,114,'#6d513e',6);for(let i=0;i<3;i++){box(c,58+i*136,575,112,78,'#7d5d43',4);oval(c,111+i*136,613,3,3,'#b59465')}books(c,72,491,170,65);paper(c,272,538,107,17);plant(c,100,790,t,.85,reduced);clock(c,1420,103,t,.68);frame(c,535,170,108,87,'ДІМ');for(let i=0;i<5;i++)line(c,1152+i*51,514,1154+i*51,656,'#d1b68a12',1);halo(c,1050,373,240,'#f5ce8b09');for(let i=0;i<4;i++)line(c,159+i*7,148,159+i*7,477,'#d6ad7d2d',2);SceneArt?.warmRoom(c,t,reduced)}
 function tree(c,x,y,s=1,t=0){if(SceneArt)return SceneArt.tree(c,x,y,s,t);c.save();c.translate(x,y);c.scale(s,s);oval(c,6,8,90,13,'#222b2822');const bark=c.createLinearGradient(-14,0,17,0);bark.addColorStop(0,'#42443d');bark.addColorStop(.6,'#686654');bark.addColorStop(1,'#44473e');box(c,-9,-185,20,184,bark,5);for(let i=0;i<7;i++){const angle=-2.6+i*.34,length=75+i%3*18;line(c,0,-105-i*9,Math.cos(angle)*length,-170+Math.sin(angle)*length,'#555447',6-i%2)}for(let i=0;i<80;i++){const a=i*2.399963,r=Math.sqrt((i+.5)/80),dx=Math.cos(a)*100*r,dy=-193+Math.sin(a)*79*r,wind=Math.sin(t*.7+dx*.015)*Math.max(0,-dy-100)*.012;oval(c,dx+wind,dy,15+i%4*2,10+i%3*3,['#4b6450','#597459','#687f5d','#788c67','#80926b'][i%5])}for(let i=0;i<5;i++)line(c,-4+i*3,-120+i*9,-3+i*3,-15,'#a19b721f',1);c.restore()}
 // A fleeting silhouette behind the final calendar date; the flight ends short of the skyline.
 const CYCLE_END=25.5;
 function cycleEpilogue(time){const t=Number.isFinite(time)?Math.max(0,Math.min(CYCLE_END,time)):0,p=clamp((t-22.75)/(CYCLE_END-22.75));return{end:CYCLE_END,alpha:ease((t-22.75)/1.8)*.18,planeX:70+p*880,planeY:345,planeRight:70+p*880+52,left:{x:265,y:425,w:155,h:475},right:{x:1190,y:300,w:165,h:600}}}
 function cycleSkyline(c,width,height,time,reduced=false){const f=cycleEpilogue(time);if(f.alpha<=0)return f;const fit=Math.min(width/1600,height/900);c.save();c.translate((width-1600*fit)/2,(height-900*fit)/2);c.scale(fit,fit);c.beginPath();c.rect(0,0,1600,900);c.clip();c.globalAlpha*=f.alpha;
  for(const b of [f.left,f.right]){box(c,b.x,b.y,b.w,b.h,'#8b96a5');box(c,b.x+7,b.y+7,b.w-14,b.h-7,'#68727f');line(c,b.x+7,b.y,b.x+b.w-7,b.y,'#b0b7bf',2);for(let i=0;i<8;i++)line(c,b.x+12+i*(b.w-24)/7,b.y+10,b.x+12+i*(b.w-24)/7,900,'#a8b2c04d',1);for(let y=b.y+21;y<890;y+=17)line(c,b.x+10,y,b.x+b.w-10,y,'#bdc6d333',1)}
  line(c,1273,300,1273,257,'#8b96a5',2);box(c,1265,297,16,4,'#9da7b5',1);
  c.save();const planeY=Math.min(width<height?210:f.planeY,(height*.43-(height-900*fit)/2)/fit-45);c.translate(reduced?510:f.planeX,planeY);c.fillStyle='#b2bdca';c.beginPath();c.moveTo(-47,-3);c.lineTo(-26,-3);c.lineTo(-37,-16);c.lineTo(-29,-16);c.lineTo(-11,-4);c.lineTo(8,-4);c.lineTo(-8,-29);c.lineTo(1,-29);c.lineTo(31,-4);c.lineTo(43,-3);c.quadraticCurveTo(60,0,43,4);c.lineTo(25,5);c.lineTo(-2,27);c.lineTo(-10,27);c.lineTo(5,5);c.lineTo(-28,4);c.lineTo(-39,13);c.lineTo(-46,13);c.lineTo(-40,3);c.closePath();c.fill();line(c,33,-2,40,-2,'#4b5664',1);c.restore();c.restore();return f
 }
 function rasterRatio(width,height,ratio=1){const area=Math.max(1,width)*Math.max(1,height);return Math.min(Math.max(1,Number.isFinite(ratio)?ratio:1),2,Math.sqrt(12000000/area))}
 function flowers(c,x,y,count=12){for(let i=0;i<count;i++){const X=x+i*19,Y=y+(i*13%17);line(c,X,Y,X-3,Y-22,'#617755',2);oval(c,X-3,Y-25,5,4,['#bca086','#ceb391','#b68a7c'][i%3])}}
 function happy(c,id,t,reduced=false){
  if(id==='school'){if(SceneArt)SceneArt.room(c,{t,hour:11,reduced,happy:true});else room(c,'happy-school',t,reduced);text(c,'Пишаємося тобою, Джо!',170,386,18,'#d6c7a2')}
  if(id==='university'){for(let y=292;y<610;y+=26)for(let x=283;x<1310;x+=76)line(c,x+(y%52?0:35),y,x+65+(y%52?0:35),y,'#8a796515',1);box(c,350,530,125,66,'#625f58',3);text(c,'ВСТУП',374,568,19,'#d5c6a6');flowers(c,20,723,16);flowers(c,1270,733,15);paper(c,1135,566,80,46,'#cdbf9d');}
  if(id==='love'){line(c,1370,713,1370,403,'#4f5754',6);box(c,1348,386,45,34,'#d5be95',5);halo(c,1370,410,130,'#edcc8b16');flowers(c,80,850,20);oval(c,1280,626,170,27,'#a7b8ab22');for(let i=0;i<4;i++)line(c,1170+i*48,625,1198+i*48,625,'#c9d2b333',1);}
  if(id==='work'){books(c,70,300,193,83);books(c,70,423,193,67);clock(c,790,119,t,.7);frame(c,385,218,157,109,'КОМАНДА');paper(c,409,547,109,21);box(c,917,522,34,34,'#cec3aa',5);c.strokeStyle='#cec3aa';c.lineWidth=4;c.beginPath();c.arc(957,539,9,-Math.PI/2,Math.PI/2);c.stroke();for(let i=0;i<3;i++)line(c,925+i*6,514,927+i*6,502-(reduced?0:Math.sin(t+i)*3),'#e8d5ae33',1.5);}
  if(id==='wedding'){for(let i=0;i<15;i++){const x=120+i*98,y=135+Math.sin(i/14*Math.PI)*55;oval(c,x,y,3,4,'#e6d2a3');line(c,x-49,y-8,x,y-6,'#817b6955',1)}flowers(c,340,850,12);flowers(c,1060,850,12);box(c,635,715,35,27,'#ab9380',4);oval(c,650,709,24,14,'#d1b6a1');}
  if(id==='home'){box(c,301,654,59,12,'#6e6860',3);line(c,330,666,330,765,'#675c52',5);box(c,299,613,64,42,'#6f7e7b',8);text(c,'Джо',309,641,14,'#d4c8aa');for(let i=0;i<10;i++){line(c,20+i*32,761,20+i*32,680,'#b0aa8a',7);line(c,1270+i*32,756,1270+i*32,677,'#b0aa8a',7)}flowers(c,22,857,14);}
  if(id==='family'){books(c,40,515,150,74);frame(c,500,191,115,90,'ДЖО');frame(c,640,191,115,90,'РАЗОМ');box(c,1190,817,34,28,'#9c6d5b',3);box(c,1232,833,27,27,'#718778',3);box(c,1264,810,24,22,'#b99d6e',3);box(c,1300,841,75,14,'#776a5c',3);oval(c,1315,860,10,10,'#464e50');oval(c,1362,860,10,10,'#464e50');clock(c,967,267,t,.6);}
  SceneArt?.landscape(c,id,t,reduced);
 }
 function cycle(c,panel,t,reduced=false){clock(c,panel===1?465:80,135,t,.45);if(panel===1){text(c,'ПОНЕДІЛОК',80,365,12,'#c0c0aa');books(c,15,583,92,43)}else{books(c,32,450,133,50);frame(c,54,205,100,72,'Джо');line(c,245,180,365,280,'#c5d4de11',3);box(c,433,706,46,62,'#435062',9);line(c,441,706,441,694,'#758190',3);if(panel===2&&!reduced)for(let i=0;i<11;i++){const x=237+i*13,y=173+(i*27+t*29)%145;line(c,x,y,x-3,y+12,'#98b2c226',1)}}}
 function years(c,t,reduced=false){line(c,430,624,1170,624,'#737e7b55',2);for(let i=0;i<3;i++){const x=480+i*320,active=ease((t-i*1.3)/1.3);oval(c,x,624,6,6,active>.5?'#c6ba99':'#4b5657');text(c,(i+1)+'-й рік',x-30,666,17,'#8b9791');c.save();c.globalAlpha=.12+active*.12;c.translate(x-65,235-(reduced?0:Math.sin(t*.5+i)*4));box(c,3,6,130,112,'#a5a89b',5);box(c,0,0,130,112,'#d0c6a9',5);box(c,0,0,130,23,'#8c6d62',3);for(let y=0;y<3;y++)for(let x=0;x<5;x++)box(c,16+x*21,38+y*21,8,8,'#606e6e55',1);c.restore()}}
 function camera(c,t,duration=8,reduced=false,focusX=800,focusY=450){if(reduced)return;const p=ease(t/duration),z=1+.065*p;c.translate(800,450);c.scale(z,z);c.translate(-800-(focusX-800)*p,-450-(focusY-450)*p)}
 function finish(c,t,reduced=false,warm=false){c.save();const g=c.createRadialGradient(800,390,230,800,450,1000);g.addColorStop(0,'#00000000');g.addColorStop(.7,'#00000008');g.addColorStop(1,'#00000065');box(c,0,0,1600,900,g);if(!reduced)for(let i=0;i<16;i++){const x=(i*113+Math.sin(t*.15+i)*13+1600)%1600,y=(i*71-t*(2+i%3)+1800)%900;oval(c,x,y,1+i%2*.3,1+i%2*.3,warm?'#ffe0a517':'#d0d6df12')}c.restore()}
 const api=Object.freeze({rasterRatio,material,floorShadow,roomBackdrop,bedroomSurfaces,cycleEpilogue,cycleSkyline,face,gait,character,sleepingBody,restingFace,interior,lightAt,cycleLight,windowLight,lightSpill,room,keyboard,person,blink,breathe,clock,books,plant,street,ward,warm,happy,cycle,years,tree,camera,finish});scope.AppleCinema=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
