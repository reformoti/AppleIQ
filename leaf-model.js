'use strict';
// Спільна форма та жилкування листка для WebGL, Canvas і SVG.
((scope)=>{
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x)},BASE=Object.freeze([.15,.34,.055]);
 function width(t){t=clamp(t);const tooth=1-Math.abs(((t*16)%1)*2-1);return .195*Math.pow(Math.max(0,Math.sin(t*Math.PI)),.88)*(1-.12*t)*(1-.055*tooth)}
 function centerY(t){return 1.065+.18*t+.07*Math.sin(t*Math.PI)-.05*t**5}
 function point(t,w,depth=1){t=clamp(t);w=clamp(w,-1,1);const arc=Math.sin(t*Math.PI),half=width(t);return[.125+.64*t,centerY(t)+w*half*.88,(.025+.075*arc+w*half*.42+.035*(1-w*w)*arc+.012*Math.sin(t*Math.PI*5)*w*w*arc)*depth]}
 function normal(t,w,depth=1){const e=.0001,t0=clamp(t,e,1-e),a=point(t0+e,w,depth),b=point(t0-e,w,depth),c=point(t0,clamp(w+e,-1,1),depth),d=point(t0,clamp(w-e,-1,1),depth),u=a.map((v,i)=>v-b[i]),v=c.map((x,i)=>x-d[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);return length>1e-10?n.map(x=>x/length):[0,0,1]}
 function uv(p){const t=clamp((p[0]-.125)/.64);return[t,clamp((p[1]-centerY(t))/Math.max(.00001,width(t)*.88),-1,1)]}
 const nearest=x=>Math.abs((x+.5-Math.floor(x+.5))-.5);
 function material(t,w){t=clamp(t);w=clamp(w,-1,1);const edge=Math.abs(w),rib=1-smooth(.014,.052,edge),q=t*9-edge*.78+.045*Math.sin(w*12+t*35),side=(1-smooth(.015,.065,nearest(q)))*smooth(.04,.13,t)*(1-smooth(.9,.98,t))*(1-rib),fine=(1-smooth(.022,.075,Math.min(nearest(t*42+w*7+.12*Math.sin(w*19)),nearest(w*24-t*13+.1*Math.sin(t*53)))))*smooth(.08,.2,edge),patch=.5+.5*Math.sin(t*16+w*5)*Math.sin(w*9-t*3),grain=Math.sin(t*143+Math.sin(w*31))*Math.sin(w*189+t*47),rim=smooth(.75,1,edge),vein=clamp(rib*.72+side*.42+fine*.13);
  return[.105+patch*.035+grain*.008+rim*.025,.265+patch*.1+grain*.013+rim*.035,.032+patch*.025+rim*.008].map((v,i)=>v*(1-vein)+[.36,.49,.14][i]*vein)
 }
 function svg(index,y,opacity=1){const at=(t,w)=>{const r=width(t)/.195*12*w;return[106+48*t+r*.4,y-10-22*t+r*.9]},fmt=p=>p.map(v=>v.toFixed(2)).join(' '),points=[];for(let i=0;i<=64;i++)points.push(at(i/64,-1));for(let i=64;i>=0;i--)points.push(at(i/64,1));const outline='M'+points.map(fmt).join('L')+'Z';let veins='';for(let i=1;i<=8;i++)for(const side of[-1,1]){const t=i/10,a=at(t,0),b=at(Math.min(.97,t+.075),side*.94),m=[a[0]*.48+b[0]*.52,a[1]*.65+b[1]*.35];veins+=`<path d="M${fmt(a)}Q${fmt(m)} ${fmt(b)}"/>`;for(let j=1;j<=2;j++){const z=j/3,c=[a[0]*(1-z)+b[0]*z,a[1]*(1-z)+b[1]*z],d=at(Math.min(.98,t+.075+.025*j),side*(z+.12));veins+=`<path opacity=".45" d="M${fmt(c)}L${fmt(d)}"/>`}}
  return`<g class="fruit-leaf" opacity="${opacity}"><defs><linearGradient id="leaf-color-${index}" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#264e16"/><stop offset=".48" stop-color="#527c29"/><stop offset="1" stop-color="#365d18"/></linearGradient><clipPath id="leaf-clip-${index}"><path d="${outline}"/></clipPath></defs><path d="${outline}" fill="url(#leaf-color-${index})" stroke="#6d8b3c" stroke-width=".35"/><g clip-path="url(#leaf-clip-${index})" fill="none" stroke="#a7ba6b" stroke-width=".3" opacity=".65">${veins}<path d="M106 ${y-10}Q129 ${y-18} 154 ${y-32}" stroke-width=".7"/></g><path d="M102 ${y-7}Q104 ${y-8} 108 ${y-11}" fill="none" stroke="#6b7e3b" stroke-width="1.2"/></g>`
 }
 const glsl=`
 float leafWidth(float t){float tooth=1.-abs(fract(t*16.)*2.-1.);return .195*pow(max(0.,sin(t*3.14159265)),.88)*(1.-.12*t)*(1.-.055*tooth);}
 vec2 leafUV(vec3 p){float t=clamp((p.x-.125)/.64,0.,1.);float y=1.065+.18*t+.07*sin(t*3.14159265)-.05*pow(t,5.);return vec2(t,clamp((p.y-y)/max(.00001,leafWidth(t)*.88),-1.,1.));}
 float veinDistance(float x){return abs(fract(x+.5)-.5);}
 vec3 leafMaterial(vec2 uv){float t=uv.x,w=uv.y,edge=abs(w),rib=1.-smoothstep(.014,.052,edge);float q=t*9.-edge*.78+.045*sin(w*12.+t*35.);float side=(1.-smoothstep(.015,.065,veinDistance(q)))*smoothstep(.04,.13,t)*(1.-smoothstep(.9,.98,t))*(1.-rib);float fine=(1.-smoothstep(.022,.075,min(veinDistance(t*42.+w*7.+.12*sin(w*19.)),veinDistance(w*24.-t*13.+.1*sin(t*53.)))))*smoothstep(.08,.2,edge);float patch=.5+.5*sin(t*16.+w*5.)*sin(w*9.-t*3.),grain=sin(t*143.+sin(w*31.))*sin(w*189.+t*47.),rim=smoothstep(.75,1.,edge),vein=clamp(rib*.72+side*.42+fine*.13,0.,1.);return mix(vec3(.105+patch*.035+grain*.008+rim*.025,.265+patch*.1+grain*.013+rim*.035,.032+patch*.025+rim*.008),vec3(.36,.49,.14),vein);}
 `;
 const api=Object.freeze({BASE,width,centerY,point,normal,uv,material,svg,glsl});scope.AppleLeaf=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
