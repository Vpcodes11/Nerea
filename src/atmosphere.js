import * as THREE from 'three';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {buildCloudCurtain} from './cloud-curtain.js';

// Reference smoke mask, rebuilt as a spatial sea of independently moving wisps.
export function buildAtmosphere(scene,renderer,sharedLoader){
 const loader=sharedLoader||new KTX2Loader().setTranscoderPath('/basis/').setWorkerLimit(1).detectSupport(renderer);
 const curtain=buildCloudCurtain(scene);
 let disposed=false,texture,viewCamera;
 const ready=new Promise((resolve,reject)=>loader.load('/textures/reference-smoke.ktx2',t=>{texture=t;if(disposed)t.dispose();else{material.uniforms.cloudMask.value=t;curtain.setTexture(t);}resolve();},undefined,reject));
 let seed=541;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const puffs=[];
 // Uneven foreground drifts leave an open channel toward the product.
 // Their different heights avoid a flat ceiling across the horizon.
 for(let i=0;i<110;i++){
   const side=random()<.5?-1:1,z=4-random()*15,x=side*(2.6+random()*6);
   puffs.push({x,y:-2.2+random()*2.7,z,size:2.0+random()*2.1,aspect:1.1+random()*.65,phase:random()*6.28,kind:0});
 }
 for(let i=0;i<96;i++)puffs.push({x:(random()-.5)*50,y:-1.9+random()*2.2,z:-13-random()*60,size:3.5+random()*4.2,aspect:1.2+random()*.55,phase:random()*6.28,kind:1});
 // Asymmetric masses, separated in depth, keep clouds present around the whole
 // opening without tracing an artificial arch around the jar.
 const banks=[[-6.6,2.2,-8,5.1,24],[7.6,3.0,-13,6.5,26],[-9,5.6,-21,8.2,24],[10,6.4,-28,10,24],[-1.8,7.8,-40,11,22],[-6,.4,-14,6.5,22],[8,-.1,-18,7.6,24]];
 for(const [x,y,z,size,count] of banks)for(let i=0;i<count;i++)puffs.push({x:x+(random()-.5)*size*1.2,y:y+(random()-.5)*size*.65,z:z+(random()-.5)*size*.9,size:size*(.38+random()*.35),aspect:1.15+random()*.7,phase:random()*6.28,kind:2});
 puffs.sort((a,b)=>a.z-b.z);
 const plane=new THREE.PlaneGeometry(1,1),geometry=new THREE.InstancedBufferGeometry();geometry.index=plane.index;geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;geometry.instanceCount=puffs.length;
 geometry.setAttribute('puffCenter',new THREE.InstancedBufferAttribute(new Float32Array(puffs.flatMap(p=>[p.x,p.y,p.z])),3));
 geometry.setAttribute('puffShape',new THREE.InstancedBufferAttribute(new Float32Array(puffs.flatMap(p=>[p.size,p.phase,p.kind,p.aspect])),4));
 const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,uniforms:{cloudMask:{value:null},time:{value:0},day:{value:0},opacity:{value:0},color:{value:new THREE.Color()},depth:{value:null},resolution:{value:new THREE.Vector2()},near:{value:.08},far:{value:200},useDepth:{value:0}},
 vertexShader:`attribute vec3 puffCenter;attribute vec4 puffShape;
 uniform float time;varying vec2 vUv;varying float eyeDepth;varying vec3 worldCenter;varying float cloudKind;varying float fadeOffset;
 void main(){vUv=uv;cloudKind=puffShape.z;fadeOffset=sin(puffShape.y)*.85;vec3 center=puffCenter+vec3(sin(time*.035+puffShape.y)*.20,cos(time*.022+puffShape.y)*.07,0.);
 float angle=sin(puffShape.y)*.22+time*.002;mat2 turn=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));vec2 q=turn*(position.xy*vec2(puffShape.w,1.))*puffShape.x;
 vec4 view=modelViewMatrix*vec4(center,1.);
 if(cloudKind<.5){worldCenter=center+vec3(-q.x,q.y*.866,-q.y*.5);view=modelViewMatrix*vec4(worldCenter,1.);}else{worldCenter=center+vec3(0.,q.y,0.);view.xy+=q;}
 eyeDepth=-view.z;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`uniform sampler2D cloudMask,depth;uniform vec3 color;uniform float opacity,day,near,far,useDepth;uniform vec2 resolution;
 varying vec2 vUv;varying float eyeDepth;varying vec3 worldCenter;varying float cloudKind;varying float fadeOffset;
 #include <packing>
 void main(){float mask=texture2D(cloudMask,vUv).r;float a=max(0.,mask-.07)*opacity;
 if(useDepth>.5){float d=-perspectiveDepthToViewZ(texture2D(depth,gl_FragCoord.xy/resolution).r,near,far);a*=smoothstep(0.,1.2,d-eyeDepth);}
 a*=smoothstep(.35,1.9,eyeDepth);
 float fadeY=worldCenter.y+fadeOffset*(1.-day*.65);
 if(cloudKind<.5)a*=.68*(1.-smoothstep(mix(-1.8,-1.6,day),mix(2.0,.65,day),fadeY));
 else if(cloudKind<1.5)a*=.55*(1.-smoothstep(mix(-.6,-.8,day),mix(2.2,.6,day),fadeY));
 else a*=.27;
 if(a<.002)discard;
 float light=smoothstep(.8,6.5,distance(worldCenter,vec3(1.15,.1,0.)));
 float edge=texture2D(cloudMask,vUv+vec2(-.018,.026)).r-mask;
 float silver=clamp(.77+edge*2.2+vUv.y*.13,.52,1.08);
 vec3 shade=mix(color*vec3(.44,.47,.60),color*.88,light)*silver;
 if(cloudKind>1.5)shade*=mix(vec3(.55,.59,.76),vec3(.64,.65,.70),day);
 gl_FragColor=vec4(shade,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=8;scene.add(mesh);
 mesh.onBeforeRender=(_r,_s,c)=>{material.uniforms.useDepth.value=c===viewCamera?1:0;};
 const nightColor=new THREE.Color('#bbc0ce'),dawnColor=new THREE.Color('#e1d9ce');
 return {ready,setDepth(t,w,h,camera){viewCamera=camera;const u=material.uniforms;u.depth.value=t;u.resolution.value.set(w,h);u.near.value=camera.near;u.far.value=camera.far;},captureDepth(hide){curtain.captureDepth(hide);if(hide){mesh.userData.visible=mesh.visible;mesh.visible=false;}else mesh.visible=mesh.userData.visible;},update(time,under,day,camera,progress=0){material.uniforms.time.value=time;material.uniforms.day.value=day;material.uniforms.opacity.value=.72*Math.max(0,1-under*1.8);material.uniforms.color.value.copy(nightColor).lerp(dawnColor,day);mesh.visible=under<.56;curtain.update(progress,time,camera.aspect,camera);},dispose(){disposed=true;curtain.dispose();scene.remove(mesh);geometry.dispose();material.dispose();texture?.dispose();if(!sharedLoader)loader.dispose();}};
}
