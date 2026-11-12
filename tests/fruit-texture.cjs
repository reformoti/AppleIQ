'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../progression.js'),Orbit=require('../rotation-controls.js');
const source=fs.readFileSync(require.resolve('../fruit-renderer.js'),'utf8');
function harness(loaded,gpu=false){
 const uniforms=new Map();let frame;
 const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,getUniformLocation:(p,name)=>name,uniform1f:(name,value)=>uniforms.set(name,value),getExtension:()=>null},{get:(o,k)=>k in o?o[k]:()=>({})});
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>frame=Uint8ClampedArray.from(image.data)};
 const window={AppleProgression:G,AppleOrbit:Orbit,document:{createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray([15,210,160,255])})})})}};
 window.Image=class{constructor(){this.naturalWidth=1;this.naturalHeight=1}set src(v){if(loaded)this.onload()}};
 vm.runInNewContext(source,{window,Uint8ClampedArray,Uint8Array,Float32Array,Uint32Array,Math,Map,Set});
 const canvas={dataset:{},getContext:kind=>kind==='webgl'?(gpu?gl:null):context,getBoundingClientRect:()=>({width:100,height:100}),addEventListener(){},removeEventListener(){}};
 const renderer=window.AppleFruit.create(canvas);let now=0;
 return{draw(level){renderer.draw({qualityLevel:level,appleCount:1,direction:'clockwise',rainbow:false},.4,now+=1000);return gpu?uniforms.get('u_skinReady'):frame},dispose:()=>renderer.dispose()};
}
for(const gpu of [false,true]){
 const loaded=harness(true,gpu),missing=harness(false,gpu);
 for(let level=33;level<=41;level++){
  const a=loaded.draw(level),b=missing.draw(level);
  if(gpu){assert.equal(a,0);assert.equal(b,0)}else assert.deepEqual(a,b,'partial 3D upgrades must stay smooth even when the texture is loaded');
 }
 const textured=loaded.draw(42),untextured=missing.draw(42);
 if(gpu){assert.equal(textured,1);assert.equal(untextured,0)}else assert.notDeepEqual(textured,untextured,'10/10 must actually apply texture to the rendered pixels');
 // Same renderer unlocks immediately and also handles a lower-level draw without leaking the skin.
 if(gpu)assert.equal(loaded.draw(41),0);else assert.deepEqual(loaded.draw(41),missing.draw(41));
 loaded.dispose();missing.dispose();
}
console.log('Passed: smooth 3D levels 1–9, texture at 10/10, missing-texture fallback and live threshold changes in WebGL and actual Canvas pixels.');
