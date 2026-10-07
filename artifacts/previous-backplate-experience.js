import * as THREE from 'three';
import {buildAssets} from './world-assets.js';
import {progressAt} from './journey-progress.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
export function createWorld(container,onReady,onFallback){
  const studio=new URLSearchParams(location.search).has('studio');
  if(studio)container.classList.add('studio-world');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:studio});}catch{onFallback();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.domElement.setAttribute('aria-label','Animated NERÉA jar and opening capsule against original cinematic ocean artwork');container.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100),assets=buildAssets(scene,renderer);
  scene.add(new THREE.HemisphereLight('#ece3ed','#372134',2));
  const key=new THREE.DirectionalLight('#efcdd4',3);key.position.set(-4,7,5);scene.add(key);
  const rim=new THREE.DirectionalLight('#cebded',4);rim.position.set(4,3,-2);scene.add(rim);
  const chapters=[...document.querySelectorAll('.chapter')],frames=chapters.map(c=>c.querySelector('.chapter-frame'));
  const plates=[...container.querySelectorAll('.scenic-plate')];
  const textures=[],loader=new THREE.TextureLoader();
  let disposed=false;
  const loadArtwork=plates.map(plate=>loader.loadAsync(plate.src).then(texture=>{if(disposed){texture.dispose();return null;}texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;}));
  loadArtwork.push(loader.loadAsync('/scenery/pink-mobile.webp').then(texture=>{if(disposed){texture.dispose();return null;}texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;}));
  const backdropMaterial=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,
    uniforms:{night:{value:null},pink:{value:null},violet:{value:null},pinkMobile:{value:null},weights:{value:new THREE.Vector3(1,0,0)},aspect:{value:innerWidth/innerHeight},time:{value:0},zoom:{value:1.025},pointer:{value:new THREE.Vector2()}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D night,pink,violet,pinkMobile;uniform vec3 weights;uniform float aspect,time,zoom;uniform vec2 pointer;
      vec2 cover(float anchor,float source){vec2 s=aspect>source?vec2(1.,source/aspect):vec2(aspect/source,1.);vec2 center=vec2(.5, .5);center.x=s.x*.5+anchor*(1.-s.x);return (vUv-.5)*s/zoom+center+pointer*.001;}
      void main(){vec2 n=cover(aspect<1.? .64:.5,1672./941.),p=cover(.5,aspect<1.?941./1672.:1672./941.),v=cover(aspect<1.? .54:.5,1672./941.);
        float ocean=(1.-smoothstep(.45,.53,p.y))*smoothstep(.13,.36,p.x)*(1.-smoothstep(.73,.91,p.x));
        p.x+=sin(p.y*155.+sin(p.x*38.)*2.+time*.55)*.0007*ocean;
        p.y+=sin(p.y*110.+p.x*26.-time*.4)*.0003*ocean;
        v.x+=sin(v.y*45.+time*.23)*.0003*smoothstep(.75,1.,v.y);
        vec3 pinkColor=aspect<1.?texture2D(pinkMobile,p).rgb:texture2D(pink,p).rgb;
        vec3 c=texture2D(night,n).rgb*weights.x+pinkColor*weights.y+texture2D(violet,v).rgb*weights.z;
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`
  });
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),backdropMaterial);backdrop.frustumCulled=false;backdrop.renderOrder=-100;backdrop.visible=false;scene.add(backdrop);
  const artworkReady=Promise.all(loadArtwork).then(maps=>{if(disposed||maps.some(m=>!m))return;['night','pink','violet','pinkMobile'].forEach((key,i)=>backdropMaterial.uniforms[key].value=maps[i]);backdrop.visible=true;signature='';}).catch(()=>{});
  let offsets=[],selection=0,active=true,destroyed=false,raf,previous=0,time=0,signature='',pointer={x:0,y:0},targetPointer={x:0,y:0};
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>preference.matches||document.body.classList.contains('reduce-motion');
  const layout=()=>{offsets=chapters.map(c=>({top:c.offsetTop,height:c.offsetHeight}));signature='';};layout();
  let progress=progressAt(scrollY,offsets),opening=.45;
  function draw(ms=0){
    if(destroyed)return;raf=requestAnimationFrame(draw);
    const dt=previous?Math.min((ms-previous)/1000,.05):1/60;previous=ms;
    if(!active||document.hidden)return;
    const still=reduced(),desired=progressAt(scrollY,offsets);
    progress=still?desired:mix(progress,desired,1-Math.exp(-9*dt));
    const idx=Math.min(3,Math.floor(progress)),local=progress-idx;
    const transition=still?0:smooth((local-.45)/.55),visual=still?idx:idx+transition;
    const weights=[0,0,0];weights[idx===0?0:idx===1?1:2]=1;
    if(idx<2){weights[idx]*=1-transition;weights[idx+1]+=transition;}
    const mobile=innerWidth<700,aspect=innerWidth/innerHeight;
    plates.forEach((plate,i)=>{plate.style.opacity=weights[i];plate.style.transform=still?'none':`scale(${1.025+transition*.025}) translate(${pointer.x*-.45}%,${pointer.y*-.3}%)`;});
    frames.forEach((f,i)=>{const l=progress-i;f.style.setProperty('--copy-opacity',still||l<0||i===3?1:1-smooth((l-.28)/.35));});
    const sig=[idx,selection,innerWidth,innerHeight].join(':');if(still&&sig===signature)return;signature=still?sig:'';
    if(!still)time+=dt;
    pointer.x=mix(pointer.x,targetPointer.x,1-Math.exp(-4*dt));pointer.y=mix(pointer.y,targetPointer.y,1-Math.exp(-4*dt));
    backdropMaterial.uniforms.weights.value.set(...weights);backdropMaterial.uniforms.time.value=still?0:time;backdropMaterial.uniforms.aspect.value=aspect;backdropMaterial.uniforms.zoom.value=still?1:1.025+transition*.025;backdropMaterial.uniforms.pointer.value.set(still?0:pointer.x,still?0:pointer.y);
    camera.position.set(still?0:pointer.x*.08,still?0:pointer.y*.05,9);camera.lookAt(0,0,0);
    const height=2*9*Math.tan(35*Math.PI/360),width=height*aspect;
    const jar=assets.bottle;jar.visible=visual<1;
    jar.traverse(o=>{if(o.material)o.material.opacity=1-transition;});
    const jarHeight=height*(mobile?.32:.39),scale=jarHeight/2.4;
    const baseY=height*(mobile?.035:.055);
    jar.scale.setScalar(scale);jar.position.set(width*(mobile?.085:.155),baseY,0);
    jar.rotation.set(.025,-.1+(still?0:Math.sin(time*.16)*.018),.12-transition*.14);
    jar.position.y+=transition*height*.17;jar.scale.multiplyScalar(1+transition*.2);
    const capsule=assets.capsule;capsule.visible=visual>1.7&&visual<3;
    capsule.scale.setScalar(height*(mobile?.14:.19));capsule.position.set(width*(mobile?0:.08),height*(mobile?.12:.035),0);capsule.rotation.set(.03,still?0:Math.sin(time*.15)*.045,.55);
    capsule.scale.multiplyScalar(smooth((visual-1.7)/.3)*(1-smooth((visual-2.6)/.4)));
    const targetOpening=selection===1?.2:selection===2?.85:.63;
    opening=still?targetOpening:mix(opening,targetOpening,1-Math.exp(-4*dt));
    assets.topHalf.position.set(-opening*.12,.06+opening*.65,0);assets.topHalf.rotation.z=-opening*.16;
    assets.bottomHalf.position.set(opening*.12,-.06-opening*.65,0);assets.bottomHalf.rotation.z=Math.PI-opening*.12;
    assets.grains.scale.set(1,1+opening*.75,1);assets.grains.rotation.y=still?0:time*.065;
    const sculpture=assets.sculpture;sculpture.visible=visual>=2.7;sculpture.scale.setScalar(height*(mobile?.16:.18));sculpture.position.set(width*(mobile?0:.13),height*(mobile?.13:.12),0);sculpture.rotation.y=still?.12:.12+Math.sin(time*.17)*.08;
    if(visual<3)sculpture.scale.multiplyScalar(smooth((visual-2.6)/.4));
    assets.particles.visible=visual>1.6;assets.particles.position.y=still?0:(time*.016)%2;
    if(studio){plates.forEach(p=>p.style.opacity=0);backdrop.visible=false;scene.background=new THREE.Color('#e3dfe7');jar.visible=true;jar.traverse(o=>{if(o.material)o.material.opacity=1;});capsule.visible=sculpture.visible=assets.particles.visible=false;jar.position.set(0,-1.8,0);jar.scale.setScalar(1.45);jar.rotation.set(.035,-.05,-.12);camera.position.set(0,0,9);camera.lookAt(0,0,0);}
    renderer.render(scene,camera);container.dataset.chapter=idx;container.dataset.progress=progress.toFixed(4);container.dataset.triangles=renderer.info.render.triangles;
  }
  const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));layout();};
  const move=e=>{targetPointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};};
  const lose=e=>{e.preventDefault();active=false;container.classList.add('lost');onFallback();};
  addEventListener('resize',resize);addEventListener('pointermove',move,{passive:true});renderer.domElement.addEventListener('webglcontextlost',lose);
  draw();
  const ready=Promise.all(plates.map(p=>p.complete?Promise.resolve():new Promise(resolve=>{p.addEventListener('load',resolve,{once:true});p.addEventListener('error',resolve,{once:true});})));
  Promise.all([ready,artworkReady]).then(()=>{if(!destroyed&&!container.classList.contains('lost'))onReady();});
  return {setActive(v){active=v;},refreshLayout:layout,inspect(i){selection=i;signature='';},capture(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},destroy(){destroyed=disposed=true;cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('pointermove',move);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());assets.dispose();renderer.dispose();}};
}
