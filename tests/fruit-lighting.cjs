'use strict';
const assert=require('node:assert/strict'),F=require('../fruit-renderer.js');
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)},sum=v=>v.reduce((a,b)=>a+b,0);
const red=[.75,.035,.055],light=unit([-.6,.85,1.3]),dark=light.map(x=>-x);
const bright=F.shadeSurface(light,[0,0,0],0,red,1),shaded=F.shadeSurface(dark,[0,0,0],0,red,1);
assert.ok(sum(bright)>sum(shaded)*2,'key-facing surface must be brighter than its shaded side');
const highlight=unit(light.map((x,i)=>x+(i===2?1:0)));
assert.ok(sum(F.shadeSurface(highlight,[0,0,0],0,red,1))>sum(F.shadeSurface(highlight,[0,0,0],0,red,.1)),'polished apple must reflect a stronger highlight');
for(const kind of [0,1,2])for(const n of [light,dark,[0,1,0],[0,0,1]])for(const color of [red,[.02,.8,.3],[.3,.02,.8]])assert.ok(F.shadeSurface(n,[.3,.4,.5],kind,color,1).every(x=>Number.isFinite(x)&&x>=0&&x<=1));
const shadow=F.shadowFootprint({x:100,y:80,scale:50});assert.ok(shadow.x>100&&shadow.y>80);assert.ok(shadow.rx>shadow.ry*3);
assert.ok(F.shadowOpacity(0,0)>F.shadowOpacity(.5,0));assert.equal(F.shadowOpacity(1,0),0);assert.equal(F.shadowOpacity(1.1,0),0);
// Verify real fallback pixels contain both a lit body and a translucent cast shadow.
let image;const context={createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:i=>image=i};
const canvas={dataset:{},getBoundingClientRect:()=>({width:240,height:240}),getContext:kind=>kind==='2d'?context:null};
const renderer=F.create(canvas);renderer.draw({qualityLevel:42,appleCount:1,direction:'diagonal',rainbow:false},.4,1000);
let lit=0,softShadow=0;for(let i=0;i<image.data.length;i+=4){const [r,g,b,a]=image.data.slice(i,i+4);if(a===255&&r>80)lit++;if(a>5&&a<255&&r<25&&g<25&&b<30)softShadow++}
assert.ok(lit>100,'body lighting must reach the pixel buffer');assert.ok(softShadow>100,'shadow must have a soft translucent edge');renderer.dispose();
console.log('Passed: directional light/shade contrast, polish highlights, finite rainbow colors, soft shadow falloff and actual fallback pixels.');
