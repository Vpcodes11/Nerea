import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {buildAtmosphere} from './atmosphere.js';
import {buildCoastalGarden} from './coastal-garden.js';
import {createReferenceMountainMaterial} from './reference-mountain-material.js';

// A single spatial set. The camera travels through these objects; nothing is a scenic backplate.
export function buildMarineWorld(scene, renderer) {
  let seed=8107; const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const textures=[],ownedMaterials=[],rocks=[],plants=[],bubbles=[],roots=[],loadPromises=[],scannedGeometries=[];
  let disposed=false;
  const addObject=o=>{scene.add(o);roots.push(o);};
  const releaseTexture=t=>{t.dispose();t.image?.close?.();};
  const loader=new THREE.TextureLoader(),dummy=new THREE.Object3D();
  function loadTexture(url){let texture;loadPromises.push(new Promise((resolve,reject)=>{texture=loader.load(url,t=>{if(disposed)releaseTexture(t);resolve(t);},undefined,()=>reject(new Error(`Unable to load ocean texture: ${url}`)));}));return texture;}
  const stoneMap=loadTexture('/textures/stone-color.jpg');stoneMap.colorSpace=THREE.SRGBColorSpace;
  const normal=loadTexture('/textures/stone-normal.jpg'),roughness=loadTexture('/textures/stone-roughness.jpg');
  [stoneMap,normal,roughness].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.3,1.3);t.anisotropy=4;textures.push(t);});
  const stone=new THREE.MeshStandardMaterial({map:stoneMap,normalMap:normal,roughnessMap:roughness,color:'#a59cab',roughness:.92,normalScale:new THREE.Vector2(.65,.65)});ownedMaterials.push(stone);
  const geometries=[];
  for(let k=0;k<4;k++){
    const g=mergeVertices(new THREE.IcosahedronGeometry(1,3)),p=g.attributes.position;
    const phases=[random()*6,random()*6,random()*6];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const n=1+.18*Math.sin(x*4.7+phases[0])*Math.cos(y*3.3-z*2)+.10*Math.sin(y*8.1+z*3+phases[1])+.055*Math.cos(x*15+z*11+phases[2]);
      p.setXYZ(i,x*n,y*n,z*n);
    }g.computeVertexNormals();geometries.push(g);
  }
  function rock(position,scale,rotation=0){const m=new THREE.Mesh(geometries[rocks.length%4],stone);m.position.set(...position);m.scale.set(...scale);m.rotation.set(random()*.15,rotation,random()*.18);m.castShadow=m.receiveShadow=true;addObject(m);rocks.push(m);return m;}
  // Product plinth, with foreground shards at independent distances.
  rock([1.15,-.52,-.10],[1.28,1.08,1.05],.1);
  rock([1.75,-.80,.65],[.46,.78,.48],2.2);
  rock([.30,-1.05,.80],[.56,.56,.45],.6);
  rock([1.4,-1.25,1.55],[.92,.50,.62],1.4);
  rock([-6.9,-.4,2.6],[1.7,3.0,1.3],.8);
  rock([7.2,-.2,1.4],[1.8,3.4,1.5],2.5);
  rock([-4.3,-1.3,-6],[1.5,1.3,1.6],1.8);
  rock([5.8,-1.2,-9],[2.3,2.2,2.0],.2);
  // Sculptural outcrops over the surface, and the corridor below it.
  rock([-14,-1.45,-30],[2.0,1.05,2.8],1.1);
  rock([7.1,-1.10,-26],[2.8,1.40,3.0],2.8);
  rock([-7.8,-1.2,-30],[2.4,1.8,2.8],.8);
  rock([8.2,-1.2,-33],[2.1,2.0,2.2],1.7);
  for(let i=0;i<7;i++)for(const side of [-1,1]){
    const z=-29-i*5.0,x=side*(6.1+random());
    rock([x,-4.1,z],[1.8+random()*.6,2.2+random(),2.2+random()],i*.8);
    rock([x-side*.7,-6.1,z+1],[1.9,.9,2.1],i*.4);
  }
  function tubeGeometry(){
    const profile=[];for(let j=0;j<=14;j++){const h=j/14;profile.push(new THREE.Vector2(.12*(.8+.2*Math.sin(h*5))+h*h*.035,h));}
    profile.push(new THREE.Vector2(.105,1),new THREE.Vector2(.09,.93),new THREE.Vector2(.07,.25));
    const g=new THREE.LatheGeometry(profile,12),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const h=p.getY(i);p.setX(i,p.getX(i)+Math.sin(h*2.5)*.13);p.setZ(i,p.getZ(i)+Math.sin(h*3.7)*.055);p.setY(i,h+Math.sin(Math.atan2(p.getX(i),p.getZ(i))*3)*.03*h*h);}g.computeVertexNormals();return g;
  }
  function branchingGeometry(){
    const parts=[];
    function branch(start,direction,length,radius,depth){
      const end=start.clone().addScaledVector(direction,length),middle=start.clone().lerp(end,.5);middle.z+=Math.sin(end.x*7)*.04;
      parts.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start,middle,end),3,radius,5,false));
      if(depth)for(const side of [-1,1]){const next=direction.clone();next.x+=side*(.35+random()*.15);next.z+=(random()-.5)*.25;next.y=.8;branch(end,next.normalize(),length*.69,radius*.63,depth-1);}
    }branch(new THREE.Vector3(),new THREE.Vector3(0,1,0),.4,.055,4);
    const result=mergeGeometries(parts);parts.forEach(g=>g.dispose());return result;
  }
  function foldedGeometry(){
    const g=new THREE.SphereGeometry(.42,24,16),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+.16*Math.sin(x*24+z*17)+.12*Math.sin(y*30-x*8);p.setXYZ(i,x*n,y*n*.55,z*n);}g.computeVertexNormals();return g;
  }
  const coralGeometries=[tubeGeometry(),branchingGeometry(),foldedGeometry()],palette=['#a4747e','#949a89','#b7a398','#627f86','#b8a5aa'];
  const coralMaterial=new THREE.MeshStandardMaterial({roughness:.6,normalMap:normal,normalScale:new THREE.Vector2(.12,.12)});ownedMaterials.push(coralMaterial);
  const coral=new THREE.Group();addObject(coral);
  const coralBatches=[];
  const centers=[];for(let i=0;i<8;i++)for(const side of [-1,1])centers.push([side*(3.8+random()*.4),-6.25,-28-i*4.5]);
  for(let family=0;family<3;family++){
    const count=family===1?40:110,bands=Array.from({length:4},()=>[]);
    // Preserve the authored random sequence, transforms and colors exactly.
    for(let i=0;i<count;i++){const centerIndex=i%centers.length,c=centers[centerIndex],size=.45+random()*(family===0?.55:1.1);dummy.position.set(c[0]+(random()-.5)*2,c[1],c[2]+(random()-.5)*2);dummy.rotation.set((random()-.5)*.4,random()*6,(random()-.5)*.35);dummy.scale.set(size,size*(family===0?1.25:1),size);dummy.updateMatrix();bands[Math.floor(centerIndex/4)].push({matrix:dummy.matrix.clone(),color:new THREE.Color(palette[i%5])});}
    for(const band of bands){const instances=new THREE.InstancedMesh(coralGeometries[family],coralMaterial,band.length);band.forEach((item,i)=>{instances.setMatrixAt(i,item.matrix);instances.setColorAt(i,item.color);});instances.computeBoundingBox();instances.computeBoundingSphere();coral.add(instances);coralBatches.push(instances);}
  }
  const globeMaterial=new THREE.MeshPhysicalMaterial({color:'#c9d9d8',roughness:.07,metalness:.12,transparent:true,opacity:.18,clearcoat:1,depthWrite:false});ownedMaterials.push(globeMaterial);
  const plantTime={value:0},plantMaterial=new THREE.MeshStandardMaterial({color:'#718d80',roughness:.55,side:THREE.DoubleSide});ownedMaterials.push(plantMaterial);
  plantMaterial.onBeforeCompile=shader=>{shader.uniforms.plantTime=plantTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float plantTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(position.y*2.5+plantTime*.5)*.04*position.y*position.y;');};
  for(let i=0;i<16;i++){
    const c=centers[i],plant=new THREE.Group();plant.position.set(c[0],c[1],c[2]);addObject(plant);plants.push(plant);
    for(let j=0;j<5;j++){
      const g=new THREE.PlaneGeometry(.28,1.7,4,16),p=g.attributes.position;
      for(let k=0;k<p.count;k++){const h=p.getY(k)+.85;p.setXYZ(k,p.getX(k)*(.4+Math.sin(h/1.7*Math.PI)*.9)+Math.sin(h*3+j)*h*.07,h,Math.cos(h*5+j)*h*.06);}g.computeVertexNormals();const leaf=new THREE.Mesh(g,plantMaterial);leaf.rotation.set((random()-.5)*.5,j*1.2,(random()-.5)*.6);plant.add(leaf);
    }
  }
  const bedGeo=new THREE.PlaneGeometry(45,80,32,60);bedGeo.rotateX(-Math.PI/2);const bp=bedGeo.attributes.position;for(let i=0;i<bp.count;i++)bp.setY(i,Math.sin(bp.getX(i)*.4+bp.getZ(i)*.6)*.10);bedGeo.computeVertexNormals();
  const bedMat=stone.clone();bedMat.color.set('#c4baca');bedMat.normalScale.set(.25,.25);ownedMaterials.push(bedMat);
  for(const name of ['map','normalMap','roughnessMap']){bedMat[name]=stone[name].clone();bedMat[name].repeat.set(12,24);textures.push(bedMat[name]);}
  const causticTime={value:0};bedMat.onBeforeCompile=shader=>{shader.uniforms.causticTime=causticTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 bedPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nbedPosition=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 bedPosition;uniform float causticTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat c=pow(max(0.,sin(bedPosition.x*2.5+sin(bedPosition.z*2.+causticTime*.22))*cos(bedPosition.z*3.6-causticTime*.18)),12.);totalEmissiveRadiance+=vec3(.08,.12,.13)*c;');};
  const bed=new THREE.Mesh(bedGeo,bedMat);bed.position.set(0,-6.45,-46);bed.receiveShadow=true;addObject(bed);
  const bedShader=bedMat.onBeforeCompile;bedMat.onBeforeCompile=shader=>{bedShader(shader);shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat sandLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(sandLuma),diffuseColor.rgb,.14);');};

  const coastalGarden=buildCoastalGarden(scene,stone);

  const mountainAtlasLoader=new KTX2Loader().setTranscoderPath('/basis/').setWorkerLimit(1).detectSupport(renderer);
  const atmosphere=buildAtmosphere(scene,renderer,mountainAtlasLoader);
  // Light volumes sit in the passage, with real occlusion by nearer rocks.
  const rayCanvas=document.createElement('canvas');rayCanvas.width=32;rayCanvas.height=256;const rc=rayCanvas.getContext('2d');const rg=rc.createLinearGradient(0,0,32,0);rg.addColorStop(0,'transparent');rg.addColorStop(.5,'rgba(255,255,255,.28)');rg.addColorStop(1,'transparent');rc.fillStyle=rg;rc.fillRect(0,0,32,256);const rayTexture=new THREE.CanvasTexture(rayCanvas);textures.push(rayTexture);
  const rays=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.1,10),new THREE.MeshBasicMaterial({map:rayTexture,color:'#c4e0dc',transparent:true,opacity:.23,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true}));m.position.set((i%3-1)*3,-3,-28-i*3.6);m.rotation.z=-.35;addObject(m);rays.push(m);}
  const bubbleGeometry=new THREE.SphereGeometry(.055,10,8),bubbleMaterial=globeMaterial.clone();bubbleMaterial.opacity=.32;ownedMaterials.push(bubbleMaterial);
  const bubbleMesh=new THREE.InstancedMesh(bubbleGeometry,bubbleMaterial,65);addObject(bubbleMesh);for(let i=0;i<65;i++)bubbles.push({x:(random()-.5)*11,y:random()*5.5-6,z:-25-random()*33,s:.35+random()*1.3});
  const specks=new Float32Array(320*3);for(let i=0;i<320;i++)specks.set([(random()-.5)*18,-random()*6.2,-22-random()*40],i*3);const speckGeo=new THREE.BufferGeometry();speckGeo.setAttribute('position',new THREE.BufferAttribute(specks,3));const particles=new THREE.Points(speckGeo,new THREE.PointsMaterial({color:'#e4cfe9',size:.017,transparent:true,opacity:.35,depthWrite:false}));addObject(particles);
  const ready=Promise.all([...loadPromises,atmosphere.ready,coastalGarden.ready]);ready.catch(()=>{});
  let highScan,lowScan,referenceMountain=false,referenceMountainResources;
  function releaseGLTF(gltf){const gs=new Set(),ms=new Set(),ts=new Set();gltf.scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ms.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)ts.add(t);});});});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(releaseTexture);}
  function prepareScan(gltf){if(disposed){releaseGLTF(gltf);return null;}let source;gltf.scene.traverse(o=>{if(o.isMesh&&!source)source=o;});if(!source){releaseGLTF(gltf);throw new Error('Ocean scan contains no mesh.');}const geo=source.geometry.clone();
    // Meshopt's normalized integer attributes must be expanded before changing the shape.
    for(const name of ['position','normal','tangent']){const a=geo.getAttribute(name);if(!a)continue;const values=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++){values[i*a.itemSize]=a.getX(i);values[i*a.itemSize+1]=a.getY(i);values[i*a.itemSize+2]=a.getZ(i);if(a.itemSize===4)values[i*4+3]=a.getW(i);}geo.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize));}
    geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new THREE.Vector3()),size=geo.boundingBox.getSize(new THREE.Vector3());geo.translate(-center.x,-center.y,-center.z);geo.scale(2/size.x,2/size.y,2/size.z);geo.computeBoundingSphere();source.material.color.set('#b4aac6');source.material.roughness=.85;source.material.normalScale?.set(.7,.7);source.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat stoneLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(stoneLuma),diffuseColor.rgb,.20);');};ownedMaterials.push(source.material);Object.values(source.material).forEach(t=>{if(t?.isTexture)textures.push(t);});scannedGeometries.push(geo);gltf.scene.traverse(o=>o.geometry?.dispose());return {geometry:geo,material:source.material};}
  function applyScan(r,scan){if(scan){r.geometry=scan.geometry;r.material=scan.material;}}
  function useScannedRock(url){const gltfLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);return Promise.all([ready,gltfLoader.loadAsync(url).then(prepareScan),gltfLoader.loadAsync('/models/ocean-crag-lod.glb').then(prepareScan).catch(()=>null)]).then(([,high,low])=>{if(disposed)return;highScan=high;lowScan=low||high;rocks.forEach((r,i)=>{if(i<6||i===8||i===9)applyScan(r,highScan);else applyScan(r,lowScan);});});}
  async function useReferenceMountain(){
    const [gltf,atlas1,atlas2]=await Promise.all([
      new GLTFLoader().loadAsync('/reference-rock/mountain.glb'),
      mountainAtlasLoader.loadAsync('/reference-rock/mount_diffuse.1001.ktx2'),
      mountainAtlasLoader.loadAsync('/reference-rock/mount_diffuse.1002.ktx2')
    ]);
    if(disposed){releaseGLTF(gltf);atlas1.dispose();atlas2.dispose();return;}
    let source;gltf.scene.traverse(o=>{if(o.isMesh&&!source)source=o;});
    const geometry=source.geometry.clone();scannedGeometries.push(geometry);releaseGLTF(gltf);
    for(const atlas of [atlas1,atlas2]){atlas.colorSpace=THREE.SRGBColorSpace;atlas.flipY=false;atlas.wrapS=atlas.wrapT=THREE.ClampToEdgeWrapping;atlas.anisotropy=4;textures.push(atlas);}
    referenceMountainResources=await createReferenceMountainMaterial(renderer,atlas1,atlas2,()=>disposed);
    if(disposed||!referenceMountainResources){referenceMountainResources?.dispose();return;}
    const material=referenceMountainResources.material;
    ownedMaterials.push(material);referenceMountain=true;
    rocks[0].geometry=geometry;rocks[0].material=material;
    // The source camera faces negative Z; this world travels toward negative Z.
    rocks[0].position.set(1.23,-3.18,0);rocks[0].rotation.set(0,Math.PI,0);rocks[0].scale.setScalar(1.90);
    rocks.slice(1,4).forEach(r=>r.visible=false);
  }
  // Seat the tilted base on the scanned surface instead of guessing its height.
  function seatProduct(product){
    if(referenceMountain){product.position.set(1.25,.52,.89);product.scale.set(.99,.86,1.00);product.rotation.set(.035,-.10,.20);product.updateMatrixWorld(true);return;}
    rocks.slice(0,4).forEach(r=>r.updateMatrixWorld(true));product.updateMatrixWorld(true);
    const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),point=new THREE.Vector3();let rise=-Infinity;
    for(let i=0;i<17;i++){
      const angle=(i-1)/16*Math.PI*2,radius=i===0?0:.56;
      point.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius).applyMatrix4(product.matrixWorld);
      ray.set(new THREE.Vector3(point.x,6,point.z),down);
      const hit=ray.intersectObjects(rocks.slice(0,4),false)[0];
      if(hit)rise=Math.max(rise,hit.point.y-point.y);
    }
    // Let the irregular scanned peak meet the curved bottom lip visibly.
    if(Number.isFinite(rise)){product.position.y+=rise-.075;product.updateMatrixWorld(true);}
  }
  return {rocks,ready,useScannedRock,useReferenceMountain,seatProduct,setCloudDepth:atmosphere.setDepth,renderCutoutDepth(renderer,camera){coastalGarden.renderDepth?.(renderer,camera);},captureCloudDepth(hide){atmosphere.captureDepth(hide);coastalGarden.captureDepth?.(hide);},
    update(time,under,day,camera,progress=0){plantTime.value=causticTime.value=time;coastalGarden.update(time,under,day,camera);
      const submerged=under>.02,smallScreen=innerWidth<700,reach=smallScreen?18:26;
      const inDepthRange=(min,max)=>min<=camera.position.z+3&&max>=camera.position.z-reach;
      bed.visible=submerged;coral.visible=submerged&&camera.position.y>-.5;coralBatches.forEach(batch=>batch.visible=batch.boundingBox.min.z<=camera.position.z-2&&batch.boundingBox.max.z>=camera.position.z-reach);
      plants.forEach(plant=>plant.visible=submerged&&camera.position.y>-.5&&inDepthRange(plant.position.z-1,plant.position.z+1));
      atmosphere.update(time,under,day,camera,progress);rocks.forEach((r,i)=>{if(i>=6&&i<=13)r.visible=day>.65;if(i===8||i===10)r.visible=submerged;if(i>=12)r.visible=submerged&&inDepthRange(r.position.z-r.scale.z,r.position.z+r.scale.z);if((i>0&&i<6)||[14,15,18,19].includes(i))applyScan(r,smallScreen?lowScan:highScan);if(i>=6)r.castShadow=false;});
      rays.forEach(m=>m.visible=submerged&&inDepthRange(m.position.z-1,m.position.z+1));bubbleMesh.visible=particles.visible=submerged;
      if(submerged){for(let i=0;i<bubbles.length;i++){const b=bubbles[i];dummy.position.set(b.x,b.y+(time*.12+i*.3)%5.2,b.z);dummy.scale.setScalar(b.s);dummy.rotation.set(0,0,0);dummy.updateMatrix();bubbleMesh.setMatrixAt(i,dummy.matrix);}bubbleMesh.instanceMatrix.needsUpdate=true;bubbleMesh.computeBoundingSphere();}
    },dispose(){if(disposed)return;disposed=true;referenceMountainResources?.dispose();mountainAtlasLoader.dispose();atmosphere.dispose();coastalGarden.dispose();const gs=new Set([...geometries,...coralGeometries,...scannedGeometries]),ms=new Set(ownedMaterials),ts=new Set(textures);roots.forEach(root=>{root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ms.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)ts.add(t);});});});root.removeFromParent();});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(releaseTexture);}
  };
}
