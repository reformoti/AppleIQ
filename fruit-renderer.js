'use strict';
// Процедурна геометрія та освітлення; зовнішні моделі й текстури не потрібні.
((scope)=>{
  const G=scope.AppleProgression||(typeof require==='function'?require('./progression.js'):null);
  const Orbit=scope.AppleOrbit||(typeof require==='function'?require('./rotation-controls.js'):null);
  const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  function svg(p,index=0){
    const form=G.appleForm(p),points=[];
    for(let i=0;i<G.sides(p);i++){
      const a=-Math.PI/4+i*TAU/G.sides(p),cs=Math.cos(a),sn=Math.sin(a);
      const x=100+cs*76*(1-form*sn*.14);
      const y=100+sn*76+form*(sn<0?24*Math.exp(-((cs/.3)**2))-8*(1-Math.exp(-((cs/.3)**2))):-10*Math.exp(-((cs/.26)**2)));
      points.push(x.toFixed(2)+','+y.toFixed(2));
    }
    const stemY=24+24*form;
    return `<svg viewBox="0 0 200 210" aria-hidden="true"><defs><linearGradient id="fruit-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d02a36"/><stop offset="1" stop-color="#8a111b"/></linearGradient></defs><polygon points="${points.join(' ')}" fill="url(#fruit-${index})"/>${G.hasStem(p)?`<path class="fruit-stem" d="M100 ${stemY+2} Q99 ${stemY-13} 109 ${stemY-22}" fill="none" stroke="#856044" stroke-width="5" stroke-linecap="round"/>${form?`<path class="fruit-leaf" opacity="${form}" d="M106 ${stemY-12} Q124 ${stemY-35} 140 ${stemY-23} Q132 ${stemY-4} 106 ${stemY-12}" fill="#4e6c38"/>`:''}`:''}</svg>`;
  }
  function normal(v){const length=Math.hypot(...v)||1;return v.map(x=>x/length)}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  const minus=(a,b)=>a.map((x,i)=>x-b[i]);
  function surface(v,u,depth){
    const sn=Math.sin(v),r=sn*(.92+.13*Math.cos(v))*(1+.035*Math.cos(u*5)*sn);
    return[r*Math.cos(u),Math.cos(v)-.16*Math.exp(-v*v*14)+.045*Math.exp(-((Math.PI-v)**2)*14),r*Math.sin(u)*depth];
  }
  function surfaceNormal(v,u,depth){
    const e=.001,du=minus(surface(v,u+e,depth),surface(v,u-e,depth));
    const dv=minus(surface(Math.min(Math.PI-.00001,v+e),u,depth),surface(Math.max(.00001,v-e),u,depth));
    return normal(cross(du,dv));
  }
  function createGeometry(level,low=false){
    level=clamp(Math.round(level),1,10);const depth=level/10;
    const latitude=low?12+level*2:12+level*3,longitude=low?24+level*3:24+level*4,data=[];
    const vertex=(position,n,kind)=>data.push(...position,...n,kind);
    const quad=(p,n,kind)=>{for(const i of[0,1,2,0,2,3])vertex(p[i],n[i],kind)};
    for(let j=0;j<latitude;j++)for(let i=0;i<longitude;i++){
      const params=[[j,i],[j,i+1],[j+1,i+1],[j+1,i]].map(([a,b])=>[.0001+a*(Math.PI-.0002)/latitude,b*TAU/longitude]);
      quad(params.map(([v,u])=>surface(v,u,depth)),params.map(([v,u])=>surfaceNormal(v,u,depth)),0);
    }
    const stemPoint=(t,u)=>[.025+t*.13+.036*Math.cos(u),.84+t*.35,.036*Math.sin(u)*depth];
    for(let j=0;j<8;j++)for(let i=0;i<12;i++){
      const params=[[j,i],[j+1,i],[j+1,i+1],[j,i+1]].map(([a,b])=>[a/8,b*TAU/12]);
      quad(params.map(([t,u])=>stemPoint(t,u)),params.map(([,u])=>normal([Math.cos(u),-.13,Math.sin(u)/depth])),1);
    }
    const leafPoint=(t,w)=>[.13+t*.57,1.08+.15*Math.sin(t*Math.PI)+w*.045,(.02+w*.16*Math.sin(t*Math.PI))*depth];
    for(let j=0;j<16;j++)for(const side of[-1,1]){
      const pts=[leafPoint(j/16,0),leafPoint((j+1)/16,0),leafPoint((j+1)/16,side),leafPoint(j/16,side)];
      const n=normal(cross(minus(pts[1],pts[0]),minus(pts[2],pts[0])));quad(pts,[n,n,n,n],2);
    }
    return new Float32Array(data);
  }
  function matrixMultiply(a,b){const out=[];for(let col=0;col<3;col++)for(let row=0;row<3;row++)out[col*3+row]=a[row]*b[col*3]+a[3+row]*b[col*3+1]+a[6+row]*b[col*3+2];return out}
  function rotation(direction,angle){
    let axis=[0,0,1];if(direction==='clockwise')angle=-angle;
    if(direction==='horizontal')axis=[0,1,0];else if(direction==='vertical')axis=[1,0,0];else if(direction==='diagonal')axis=normal([1,1,0]);
    const[x,y,z]=axis,c=Math.cos(angle),s=Math.sin(angle),t=1-c;
    const r=[c+x*x*t,y*x*t+z*s,z*x*t-y*s,x*y*t-z*s,c+y*y*t,z*y*t+x*s,x*z*t+y*s,y*z*t-x*s,c+z*z*t];
    const a=-.15,ct=Math.cos(a),st=Math.sin(a);return matrixMultiply([1,0,0,0,ct,st,0,-st,ct],r);
  }
  function modelRotation(p,angle,index=0){return p.direction==='free'?matrixMultiply(Orbit.matrix(p.freeRotation),rotation('clockwise',0)):rotation(p.direction,angle+index*.23)}
  function transform(m,p){return[m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]]}
  function layout(width,height,count){
    const columns=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/columns),cell=Math.min(count===1?200:140,width/(columns+.4),height/(rows+.2));
    return Array.from({length:count},(_,i)=>{const row=Math.floor(i/columns),n=Math.min(columns,count-row*columns);return{x:width/2+(i%columns-(n-1)/2)*cell,y:height/2+(row-(rows-1)/2)*cell+cell*.04,scale:cell*.38}});
  }
  function bodyColor(p,now,index){if(!p.rainbow)return[.75,.035,.055];const h=(now/10000+index*.11)%1,k=n=>(n+h*6)%6;return[5,3,1].map(n=>.78*(1-.88*Math.max(0,Math.min(k(n),4-k(n),1))))}
  const vertexSource=`
    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute float a_kind;
    uniform mat3 u_rotation;
    uniform vec2 u_scale;
    uniform vec2 u_offset;
    varying vec3 v_position;
    varying vec3 v_normal;
    varying float v_kind;
    void main(){
      vec3 p=u_rotation*a_position;
      v_position=p;v_normal=u_rotation*a_normal;v_kind=a_kind;
      float perspective=4.5/(4.5-p.z);
      gl_Position=vec4(u_offset+p.xy*u_scale*perspective,-p.z*.25,1.0);
    }`;
  const fragmentSource=`
    precision mediump float;
    uniform vec3 u_body;
    uniform float u_polish;
    varying vec3 v_position;
    varying vec3 v_normal;
    varying float v_kind;
    void main(){
      vec3 n=normalize(v_normal);if(!gl_FrontFacing)n=-n;
      vec3 light=normalize(vec3(-.6,.85,1.3));
      vec3 view=normalize(vec3(-v_position.xy*.12,4.5-v_position.z));
      float diffuse=max(0.0,dot(n,light));
      float shine=pow(max(0.0,dot(n,normalize(light+view))),mix(16.0,85.0,u_polish));
      float rim=pow(1.0-max(0.0,dot(n,view)),3.0);
      vec3 base=v_kind<.5?u_body:v_kind<1.5?vec3(.29,.16,.075):vec3(.19,.38,.08);
      float skin=sin(v_position.y*160.0+v_position.x*71.0)*sin(v_position.x*129.0+v_position.z*117.0)*.006*u_polish;
      vec3 color=base*(.25+.88*diffuse)+vec3(.04,.05,.065)*rim;
      if(v_kind<.5)color+=vec3(1.0,.89,.81)*shine*(.16+.74*u_polish)+skin;
      else color+=vec3(.15,.15,.1)*shine*.35;
      gl_FragColor=vec4(color,1.0);
    }`;
  function webglRenderer(canvas,gl){
    let program,buffer,uniforms,level=-1,lost=false,disposed=false;
    function init(){
      function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
      const vs=shader(gl.VERTEX_SHADER,vertexSource),fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const[name,size,offset]of[['a_position',3,0],['a_normal',3,12],['a_kind',1,24]]){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,28,offset)}
      uniforms=Object.fromEntries(['rotation','scale','offset','body','polish'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);level=-1;lost=false;
    }
    let vertexCount=0;init();canvas.dataset.renderer='webgl';
    const onLost=e=>{e.preventDefault();lost=true},onRestored=()=>{if(!disposed)init()};
    canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
    return{draw(p,angle,now){
      if(disposed||lost)return;const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;
      const dpr=Math.min(scope.devicePixelRatio||1,2),w=Math.round(b.width*dpr),h=Math.round(b.height*dpr);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      const current=Math.round(G.appleVolume(p)*10);if(current!==level){const data=createGeometry(current);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);vertexCount=data.length/7;level=current}
      gl.uniform1f(uniforms.polish,G.appleVolume(p));
      layout(b.width,b.height,p.appleCount).forEach((o,i)=>{
        gl.uniformMatrix3fv(uniforms.rotation,false,new Float32Array(modelRotation(p,angle,i)));
        gl.uniform2f(uniforms.scale,o.scale*2/b.width,o.scale*2/b.height);gl.uniform2f(uniforms.offset,o.x*2/b.width-1,1-o.y*2/b.height);
        gl.uniform3fv(uniforms.body,new Float32Array(bodyColor(p,now,i)));gl.drawArrays(gl.TRIANGLES,0,vertexCount);
      });
    },dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext()}};
  }
  function canvasRenderer(canvas){
    const c=canvas.getContext('2d');canvas.dataset.renderer='canvas';
    let level=-1,vertices,indices,projected,image,depthBuffer,last=-Infinity,disposed=false;
    const light=normal([-.6,.85,1.3]),half=normal([light[0],light[1],light[2]+1]);
    function prepare(current){
      const data=createGeometry(current,true),unique=[],lookup=new Map(),triangles=[];
      for(let i=0;i<data.length;i+=7){const vertex=data.slice(i,i+7),key=vertex.join(',');let index=lookup.get(key);if(index===undefined){index=unique.length/7;lookup.set(key,index);unique.push(...vertex)}triangles.push(index)}
      vertices=new Float32Array(unique);indices=new Uint32Array(triangles);projected=new Float32Array(unique.length/7*8);level=current;
    }
    return{draw(p,angle,now){
      if(disposed||!c||now-last<1000/(p.appleCount>3?24:40))return;last=now;
      const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;
      const dpr=Math.min(scope.devicePixelRatio||1,1.5),w=Math.round(b.width*dpr),h=Math.round(b.height*dpr);
      if(canvas.width!==w||canvas.height!==h||!image){canvas.width=w;canvas.height=h;image=c.createImageData(w,h);depthBuffer=new Float32Array(w*h)}
      image.data.fill(0);depthBuffer.fill(-Infinity);const pixels=image.data,current=Math.round(G.appleVolume(p)*10);if(level!==current)prepare(current);
      layout(b.width,b.height,p.appleCount).forEach((o,index)=>{
        const r=modelRotation(p,angle,index),body=bodyColor(p,now,index);
        for(let i=0,k=0;i<vertices.length;i+=7,k+=8){
          const v=transform(r,[vertices[i],vertices[i+1],vertices[i+2]]);let n=transform(r,[vertices[i+3],vertices[i+4],vertices[i+5]]);const kind=vertices[i+6];
          if(kind>=1.5&&n[2]<0)n=n.map(x=>-x);
          const diffuse=Math.max(0,n[0]*light[0]+n[1]*light[1]+n[2]*light[2]);
          const shine=Math.pow(Math.max(0,n[0]*half[0]+n[1]*half[1]+n[2]*half[2]),16+level*6),base=kind<.5?body:kind<1.5?[.29,.16,.075]:[.19,.38,.08];
          const perspective=4.5/(4.5-v[2]);projected[k]=(o.x+v[0]*o.scale*perspective)*dpr;projected[k+1]=(o.y-v[1]*o.scale*perspective)*dpr;projected[k+2]=v[2];
          for(let channel=0;channel<3;channel++)projected[k+3+channel]=clamp(base[channel]*(.25+.88*diffuse)+(kind<.5?shine*(.16+.074*level)*[1,.89,.81][channel]:shine*.03))*255;
          projected[k+6]=n[2];projected[k+7]=kind;
        }
        for(let at=0;at<indices.length;at+=3){
          const a=indices[at]*8,b=indices[at+1]*8,d=indices[at+2]*8;
          if(projected[a+7]<1.5&&projected[a+6]+projected[b+6]+projected[d+6]<0)continue;
          const ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[d],cy=projected[d+1];
          const denominator=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(denominator)<.00001)continue;
          const left=Math.max(0,Math.floor(Math.min(ax,bx,cx))),right=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx))),top=Math.max(0,Math.floor(Math.min(ay,by,cy))),bottom=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
          const sx=(by-cy)/denominator,sy=(cx-bx)/denominator,tx=(cy-ay)/denominator,ty=(ax-cx)/denominator;
          for(let y=top;y<=bottom;y++){
            let u=sx*(left+.5-cx)+sy*(y+.5-cy),v=tx*(left+.5-cx)+ty*(y+.5-cy);
            for(let x=left;x<=right;x++,u+=sx,v+=tx){const q=1-u-v;if(u<-.00001||v<-.00001||q<-.00001)continue;const position=y*w+x,z=u*projected[a+2]+v*projected[b+2]+q*projected[d+2];if(z<depthBuffer[position])continue;depthBuffer[position]=z;const pixel=position*4;for(let channel=0;channel<3;channel++)pixels[pixel+channel]=u*projected[a+3+channel]+v*projected[b+3+channel]+q*projected[d+3+channel];pixels[pixel+3]=255}
          }
        }
      });c.putImageData(image,0,0);
    },dispose(){disposed=true;vertices=null;indices=null;image=null;depthBuffer=null}};
  }
  function create(canvas){
    let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})}catch{}
    return gl?webglRenderer(canvas,gl):canvasRenderer(canvas);
  }
  const api=Object.freeze({svg,create,createGeometry,rotation,modelRotation,transform});scope.AppleFruit=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
