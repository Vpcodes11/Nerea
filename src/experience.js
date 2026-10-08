import * as THREE from 'three';
import {Water} from 'three/addons/objects/Water.js';
import {buildAssets} from './world-assets.js';
import {buildMarineWorld} from './marine-world.js';
import {progressAt} from './journey-progress.js';

const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},mix=(a,b,t)=>a+(b-a)*t;
export function createWorld(container,onReady,onFallback,onProgress=()=>{}){
  const params=new URLSearchParams(location.search),studio=params.has('studio'),mobile=()=>innerWidth<700;
  if(studio)container.classList.add('studio-world');
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:studio});}catch{onFallback();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1:1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.info.autoReset=false;
  renderer.shadowMap.enabled=!mobile();renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.domElement.setAttribute('aria-label','NERÉA: a continuous 3D camera journey from a cloudy night crag through a misty tidal garden, an unfolded capsule canyon, and a tidal ribbon sculpture');container.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.08,200);
  scene.fog=new THREE.FogExp2('#352d4c',.035);
  const worldFog=scene.fog;
  const assets=buildAssets(scene,renderer),marine=studio?null:buildMarineWorld(scene,renderer);
  const depthTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{depthTexture:new THREE.DepthTexture(innerWidth,innerHeight,THREE.UnsignedIntType)});
  const depthMaterial=new THREE.MeshDepthMaterial();depthMaterial.colorWrite=false;
  const ambient=new THREE.HemisphereLight('#e8d8ee','#3b294f',1.5);scene.add(ambient);
  const key=new THREE.DirectionalLight('#f4d0d7',3);key.position.set(-5,8,6);key.castShadow=!mobile();key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.normalBias=.035;scene.add(key);
  const rim=new THREE.DirectionalLight('#b8bee7',2);rim.position.set(6,5,-5);scene.add(rim);
  const productLight=new THREE.PointLight('#e6cfbd',25,16,2);productLight.position.set(-2,4,4);scene.add(productLight);
  const moonRim=new THREE.PointLight('#bccde7',32,14,2);moonRim.position.set(3.8,4.2,-2);scene.add(moonRim);
  const coastLight=new THREE.PointLight('#f4dab1',25,18,2);coastLight.position.set(1,5,-17);scene.add(coastLight);
  const capsuleLight=new THREE.PointLight('#ebf0d9',13,10,2);capsuleLight.position.set(0,-1.4,-29);scene.add(capsuleLight);
  const flowLight=new THREE.PointLight('#ffdec9',24,15,2);flowLight.position.set(0,4,-47);scene.add(flowLight);
  const flowRim=new THREE.PointLight('#bfeae8',16,12,2);flowRim.position.set(4,2,-51);scene.add(flowRim);
  assets.bottle.position.set(1.15,.42,0);assets.bottle.rotation.set(.018,-.10,-.065);assets.bottle.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material){o.material.transparent=false;o.material.opacity=1;}}});
  assets.capsule.position.set(1,-3.5,-32);assets.capsule.scale.setScalar(1.75);assets.capsule.rotation.z=-.72;
  assets.sculpture.position.set(1,1.2,-50);assets.sculpture.scale.setScalar(1.55);
  let skyTexture;
  const skyReady=new Promise((resolve,reject)=>{skyTexture=new THREE.TextureLoader().load('/textures/night-sky.webp',t=>{if(destroyed)t.dispose();resolve();},undefined,reject);});
  skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.wrapS=THREE.RepeatWrapping;
  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{day:{value:0},under:{value:0},nightClouds:{value:skyTexture},horizon:{value:new THREE.Color('#211d36')}},
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vP;uniform float day,under;uniform vec3 horizon;uniform sampler2D nightClouds;
      void main(){vec3 p=normalize(vP);float h=p.y;
      vec2 uv=vec2(atan(p.z,p.x)/6.2831853+.75,asin(clamp(p.y,-1.,1.))/3.14159265+.60);
      vec3 night=mix(vec3(.008,.009,.028),vec3(.001,.003,.009),smoothstep(0.,.8,h));
      vec3 photographedClouds=texture2D(nightClouds,uv).rgb*vec3(.065,.055,.085);
      night=mix(night,photographedClouds,.78);
      vec3 dusk=mix(vec3(.55,.43,.40),vec3(.25,.28,.36),smoothstep(0.,.8,h));
      vec3 deep=mix(vec3(.008,.022,.032),vec3(.045,.085,.11),smoothstep(-.5,1.,h));
      vec3 air=mix(horizon,mix(night,dusk,day),smoothstep(-.015,.095,h));
      gl_FragColor=vec4(mix(air,deep,under),1.);
      #include <colorspace_fragment>
      }`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(140,32,20),skyMaterial);scene.add(sky);
  let seed=920;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;const starPositions=new Float32Array(700*3);
  for(let i=0;i<700;i++){const theta=random()*Math.PI*2,phi=random()*Math.PI*.5,r=100;starPositions.set([Math.cos(theta)*Math.cos(phi)*r,Math.sin(phi)*r,Math.sin(theta)*Math.cos(phi)*r],i*3);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starPositions,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#d9d2e3',size:.10,transparent:true,opacity:.65,fog:false,depthWrite:false}));scene.add(stars);
  const waterNormals=new THREE.TextureLoader().load('/textures/water-normal.jpg');waterNormals.wrapS=waterNormals.wrapT=THREE.RepeatWrapping;
  const water=new Water(new THREE.PlaneGeometry(350,350),{textureWidth:mobile()?384:640,textureHeight:mobile()?384:640,waterNormals,sunDirection:new THREE.Vector3(-.4,.35,-1).normalize(),sunColor:'#f0c8ad',waterColor:'#65536d',distortionScale:2.2,fog:true});water.rotation.x=-Math.PI/2;water.position.set(0,-.85,-50);scene.add(water);
  const renderWaterReflection=water.onBeforeRender,reflectionPosition=new THREE.Vector3(),reflectionRotation=new THREE.Quaternion();
  let reflectionAt=-Infinity,reflectionAspect=0,forceReflection=false,reflectionCalls=0;
  // Calm water can reuse a reflection between frames; travel and pointer movement refresh immediately.
  water.onBeforeRender=function(render,world,viewCamera){
    const now=performance.now(),moving=reflectionPosition.distanceToSquared(viewCamera.position)>.000004||reflectionRotation.angleTo(viewCamera.quaternion)>.0005||reflectionAspect!==viewCamera.aspect;
    if(forceReflection||moving||now-reflectionAt>=1000/30){
      const before=render.info.render.calls;renderWaterReflection.call(this,render,world,viewCamera);reflectionCalls+=render.info.render.calls-before;
      reflectionPosition.copy(viewCamera.position);reflectionRotation.copy(viewCamera.quaternion);reflectionAspect=viewCamera.aspect;reflectionAt=now;
    }else water.material.uniforms.eye.value.copy(viewCamera.position);
  };
  water.material.uniforms.size.value=1.8;
  // Rougher surface, softer reflections: the coast should read as water, not glass.
  water.material.uniforms.distortionScale.value=3.8;
  water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.12;');
  water.material.uniforms.nereaDay={value:0};
  water.material.fragmentShader='uniform float nereaDay;\n'+water.material.fragmentShader.replace('vec3 outgoingLight = albedo;','vec3 outgoingLight = albedo * mix(.42,1.,nereaDay);');
  const ceilingMaterial=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0},opacity:{value:0}},
    vertexShader:'varying vec3 p;varying float distanceToEye;void main(){p=position;vec4 view=modelViewMatrix*vec4(position,1.);distanceToEye=length(view.xyz);gl_Position=projectionMatrix*view;}',
    fragmentShader:'varying vec3 p;varying float distanceToEye;uniform float time,opacity;void main(){float a=sin(p.x*1.2+p.y*2.4+sin(p.y*1.6-time*.15)*1.8+time*.12);float b=sin(p.y*3.5-p.x*.7-time*.18);float c=pow(max(0.,a*b),7.);gl_FragColor=vec4(.80,.58,.87,(.025+c*.07)*opacity*exp(-distanceToEye*.04));}'});
  const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(120,120,1,1),ceilingMaterial);ceiling.rotation.x=-Math.PI/2;ceiling.position.set(0,-.84,-40);scene.add(ceiling);
  const chapters=[...document.querySelectorAll('.chapter')],frames=chapters.map(c=>c.querySelector('.chapter-frame'));
  let offsets=[],destroyed=false,contextLost=false,assetsReady=studio,active=true,raf=null,previous=0,time=0,selection=0,opening=.55,signature='',progress=0;
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>preference.matches||document.body.classList.contains('reduce-motion');
  let pointer={x:0,y:0},targetPointer={x:0,y:0},capsuleWasVisible=false;
  const layout=()=>{offsets=chapters.map(c=>({top:c.offsetTop,height:c.offsetHeight}));signature='';};layout();progress=progressAt(scrollY,offsets);
  const pose=new THREE.Vector3(),target=new THREE.Vector3(),nextPose=new THREE.Vector3(),nextTarget=new THREE.Vector3(),bufferSize=new THREE.Vector2();
  const nightFog=new THREE.Color('#211d36'),dayFog=new THREE.Color('#c2beb7'),deepFog=new THREE.Color('#253943'),fogColor=new THREE.Color(),dayWater=new THREE.Color('#798b88');
  // The depth prepass needs solid occluders only, not transparent rays, bubbles or points.
  const depthLayer=1;scene.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.every(m=>m.depthWrite))o.layers.enable(depthLayer);}});
  function suspend(){if(raf!==null)cancelAnimationFrame(raf);raf=null;previous=0;}
  function wake(){if(!destroyed&&!contextLost&&active&&assetsReady&&!document.hidden&&raf===null)raf=requestAnimationFrame(draw);}
  // The opening camera advances with every scroll. A gentler early dolly keeps
  // the cliff zoom visible; the arc continues through the thickening cloud bank.
  function route(p){
    const index=Math.min(3,Math.floor(p)),local=p-index,t=index===0?.55*smooth(local)+.45*smooth((local-.55)/.45):smooth((local-.32)/.68),v=index+t;
    const m=mobile(),short=innerHeight<650;const shots=[[[.85,1.675,m?13.3:9.152],[m?.55:.833,m?.45:1.299,m?0:.402]],[[m?1:0,1.85,m?-10.8:-11],[m?2.7:1.2,m?(short?-1.7:-.95):.7,-22]],[[m?1:-.5,-3.1,m?-20.5:-24.5],[m?1:.6,m?(short?-5.5:-4.9):-3.7,-32]],[[m?1:-.4,2.3,m?-38.8:-42.5],[m?1:.6,m?(short?-.25:.05):1.2,-50]]];
    const next=Math.min(index+1,3);pose.fromArray(shots[index][0]).lerp(nextPose.fromArray(shots[next][0]),t);target.fromArray(shots[index][1]).lerp(nextTarget.fromArray(shots[next][1]),t);
    // An arc past the left side of the product crag creates foreground occlusion.
    if(index===0){pose.x-=Math.sin(t*Math.PI)*2.8;pose.y+=Math.sin(t*Math.PI)*.3;target.x-=Math.sin(t*Math.PI)*.8;}
    if(index===1){pose.x+=Math.sin(t*Math.PI)*1.3;target.y-=Math.sin(t*Math.PI)*.5;}
    return {index,local,t,v};
  }
  function draw(ms=0){
    raf=null;if(destroyed||contextLost||!active||!assetsReady||document.hidden){previous=0;return;}const elapsed=previous?(ms-previous)/1000:1/60,dt=Math.min(elapsed,.05);previous=ms;
    const still=reduced(),desired=progressAt(scrollY,offsets);
    if(still)progress=Math.floor(desired);
    else{
      const nextProgress=mix(progress,desired,1-Math.exp(-7*dt));
      // Follow scroll freely during the visible zoom. Only the final opaque
      // interval is bounded so fast jumps still cross the bank in both directions.
      if(progress<.88&&nextProgress>.88)progress=.88;
      else if(progress>.94&&nextProgress<.94)progress=.94;
      else if(progress>=.88&&progress<=.94)progress+=THREE.MathUtils.clamp(nextProgress-progress,-dt*.4,dt*.4);
      else progress=nextProgress;
    }
    const {index,local,t,v}=route(progress);const sig=[index,selection,innerWidth,innerHeight].join(':');if(still&&sig===signature)return;signature=still?sig:'';if(!still)time+=dt;
    const openingFov=studio||mobile()?42:THREE.MathUtils.radToDeg(2*Math.atan(.5/Math.max(camera.aspect,1))),frameFov=mix(openingFov,42,smooth(v/.85));if(Math.abs(camera.fov-frameFov)>.0001){camera.fov=frameFov;camera.updateProjectionMatrix();}
    scene.fog=worldFog;
    pointer.x=mix(pointer.x,targetPointer.x,1-Math.exp(-4*dt));pointer.y=mix(pointer.y,targetPointer.y,1-Math.exp(-4*dt));
    camera.position.copy(pose);camera.position.x+=still?0:pointer.x*(mobile()?.18:.50);camera.position.y+=still?0:pointer.y*(mobile()?.10:.22);camera.lookAt(target);
    if(!still){const breath=1-smooth(v/.85);camera.position.x+=Math.sin(time*.18)*.08*breath;camera.position.y+=Math.sin(time*.22)*.035*breath;camera.lookAt(target);}
    const day=smooth(v/.85),under=smooth((-.65-camera.position.y)/1.2);
    const cloudCover=still?0:smooth((progress-.80)/.08)*(1-smooth((progress-1.10)/.40));
    container.classList.toggle('in-cloud',!still&&progress>.62&&progress<1);
    container.style.setProperty('--arrival-shade',String((1-smooth(v/.85))*(1-cloudCover)));
    container.style.setProperty('--shore-shade',String(smooth(v/.85)*(1-smooth((v-1.05)/.6))*(1-cloudCover)));
    sky.position.copy(camera.position);skyMaterial.uniforms.day.value=day;skyMaterial.uniforms.under.value=under;
    fogColor.copy(nightFog).lerp(dayFog,day).lerp(deepFog,under);scene.fog.color.copy(fogColor);skyMaterial.uniforms.horizon.value.copy(fogColor);scene.fog.density=mix(.026,.014,day)+under*.032;
    ambient.color.set(under>.4?'#b9d7d6':'#f1e9d9');ambient.intensity=mix(1.0,1.7,day)-under*.25;
    key.color.set(under>.4?'#ecddc4':'#eddcc2');key.intensity=mix(2.7,2.5,day);rim.intensity=mix(1.5,2.4,under);rim.color.set(under>.4?'#8bbdc4':'#b8bee7');stars.material.opacity=(1-day)*.6;
    water.visible=under<.5&&!studio&&v>.45;water.material.uniforms.alpha.value=smooth((v-.45)/.25);water.material.uniforms.time.value=time*.23;water.material.uniforms.nereaDay.value=day;water.material.uniforms.waterColor.value.set('#202035').lerp(dayWater,day);water.material.uniforms.sunColor.value.set('#efd6b7').multiplyScalar(.15+day*.9);
    ceiling.visible=under>.03&&!studio;ceilingMaterial.uniforms.time.value=time;ceilingMaterial.uniforms.opacity.value=under*.8;
    assets.bottle.visible=v<.95||studio;assets.capsule.visible=v>1.55&&v<2.88;assets.sculpture.visible=v>2.55;assets.particles.visible=false;
    assets.capsule.scale.setScalar(mobile()?(innerHeight<650?.82:.98):1.30);assets.sculpture.scale.setScalar(mobile()?(innerHeight<650?.96:1.15):1.50);
    const targetOpening=selection===1?.035:selection===2?.32:.58;opening=still?targetOpening:mix(opening,targetOpening,1-Math.exp(-4*dt));
    if(assets.capsule.visible)assets.updateCapsule(still?0:time,opening,selection,dt,still||!capsuleWasVisible);capsuleWasVisible=assets.capsule.visible;
    if(assets.sculpture.visible)assets.updateFlow(still?0:time);
    marine?.update(still?0:time,under,day,camera,still?0:progress);
    frames.forEach((frame,i)=>{
      const l=progress-i;
      if(i===1){const shift=`${Math.max(0,scrollY-(offsets[i].top+offsets[i].height-innerHeight))}px`;if(frame.style.getPropertyValue('--frame-offset')!==shift)frame.style.setProperty('--frame-offset',shift);}
      const entrance=i===1?smooth((progress-1.18)/.34):1;
      const exit=i===1?1-smooth((l-.80)/.18):i===3?1:1-smooth((l-.32)/.38);
      const opacity=still?1:i===0?1-smooth((progress-.32)/.36):i>1&&progress<1?0:entrance*exit;
      frame.style.setProperty('--copy-opacity',opacity);
      frame.inert=!still&&opacity<.002;
      // Keep focused copy from appearing through the opaque bank. Focus remains
      // available once its chapter has been revealed.
      frame.classList.toggle('cloud-concealed',!still&&(i===0?progress>=.68&&progress<1.5:progress<1.18));
    });
    if(studio){sky.visible=stars.visible=water.visible=ceiling.visible=false;scene.background=new THREE.Color('#ddd4dd');scene.fog=null;assets.capsule.visible=assets.sculpture.visible=false;assets.bottle.position.set(0,-1.65,0);assets.bottle.scale.setScalar(1.35);assets.bottle.rotation.set(.025,-.05,-.10);camera.position.set(0,0,8);camera.lookAt(0,0,0);}
    renderer.info.reset();reflectionCalls=0;forceReflection=still;let depthCalls=0;
    if(marine&&under<.65){
      marine.captureCloudDepth(true);const wasWater=water.visible,wasStars=stars.visible;water.visible=stars.visible=sky.visible=false;
      const cameraLayers=camera.layers.mask;camera.layers.set(depthLayer);
      scene.overrideMaterial=depthMaterial;renderer.setRenderTarget(depthTarget);renderer.render(scene,camera);scene.overrideMaterial=null;camera.layers.mask=cameraLayers;
      marine.renderCutoutDepth(renderer,camera);renderer.setRenderTarget(null);
      water.visible=wasWater;stars.visible=wasStars;sky.visible=true;marine.captureCloudDepth(false);
      renderer.getDrawingBufferSize(bufferSize);marine.setCloudDepth(depthTarget.depthTexture,bufferSize.x,bufferSize.y,camera);depthCalls=renderer.info.render.calls;
    }
    renderer.render(scene,camera);container.dataset.progress=progress.toFixed(4);container.dataset.cloudCover=cloudCover.toFixed(3);container.dataset.chapter=Math.min(3,Math.floor(v+.001));container.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');container.dataset.triangles=renderer.info.render.triangles;container.dataset.fps=(1/elapsed).toFixed(0);container.dataset.renderCalls=renderer.info.render.calls;container.dataset.depthCalls=depthCalls;container.dataset.reflectionCalls=reflectionCalls;
    if(!still)wake();
  }
  const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1:1.5));renderer.setSize(innerWidth,innerHeight);depthTarget.setSize(innerWidth,innerHeight);reflectionAt=-Infinity;layout();wake();};
  const move=e=>targetPointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};
  const motionChange=()=>{signature='';previous=0;wake();},visibility=()=>{if(document.hidden)suspend();else wake();};
  const motionObserver=new MutationObserver(motionChange);motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const lost=e=>{e.preventDefault();contextLost=true;active=false;suspend();container.classList.add('lost');onFallback();};
  addEventListener('resize',resize);addEventListener('scroll',wake,{passive:true});addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',motionChange);renderer.domElement.addEventListener('webglcontextlost',lost);wake();
  const ready=Promise.all([marine?marine.useScannedRock('/models/ocean-crag.glb').then(()=>{if(!destroyed)onProgress(62,'Gathering the clouds');return marine.useReferenceMountain();}).then(()=>{if(!destroyed)onProgress(94,'Finding the light');}):Promise.resolve(),skyReady]);ready.then(()=>{if(!destroyed&&!contextLost){marine?.seatProduct(assets.bottle);assetsReady=true;signature='';renderer.shadowMap.needsUpdate=true;onReady();}}).catch(()=>{if(!destroyed){active=false;container.classList.add('lost');onFallback();}});
  ready.then(wake,()=>{});
  return {setActive(v){if(active===v)return;active=v;if(v)wake();else suspend();},refreshLayout(){layout();wake();},inspect(i){selection=i;signature='';wake();},capture(){forceReflection=true;renderer.render(scene,camera);forceReflection=false;return renderer.domElement.toDataURL('image/png');},destroy(){destroyed=true;suspend();removeEventListener('resize',resize);removeEventListener('scroll',wake);removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motionChange);motionObserver.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());water.material.uniforms.mirrorSampler.value.dispose();waterNormals.dispose();skyTexture.dispose();key.shadow.dispose();depthTarget.dispose();depthMaterial.dispose();assets.dispose();marine?.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
