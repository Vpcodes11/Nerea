// Verify real compressed models, culling budgets and teardown without a GPU.
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
globalThis.innerWidth=1440;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),fillRect(){},fillStyle:''})})};
THREE.TextureLoader.prototype.load=function(url,onLoad){const texture=new THREE.Texture({complete:true});queueMicrotask(()=>onLoad?.(texture));return texture;};
GLTFLoader.prototype.loadAsync=async function(url){const bytes=await fs.readFile(`public${url}`);return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
const {buildMarineWorld}=await import('../src/marine-world.js');
const scene=new THREE.Scene(),world=buildMarineWorld(scene,{});
await world.useScannedRock('/models/ocean-crag.glb');
const camera=new THREE.PerspectiveCamera(42,1440/900,.08,100);
const samples=[];
for(const width of [1440,390]){
  innerWidth=width;camera.aspect=width/(width<700?844:900);camera.updateProjectionMatrix();
  for(const z of [-24.5,-42.5]){
    camera.position.set(-.5,-3.1,z);camera.lookAt(.6,-3.7,z-7.5);camera.updateMatrixWorld();world.update(5,1,1,camera);scene.updateMatrixWorld(true);
    const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    let triangles=0,calls=0;
    scene.traverseVisible(o=>{if(o.isMesh&&frustum.intersectsObject(o)){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);calls++;}});
    samples.push({width,z,marineTriangles:triangles,marineCalls:calls});
  }
}
world.dispose();
if(scene.children.length)throw new Error('Marine roots remain after disposal');
await fs.writeFile('artifacts/model-marine-performance-report.json',JSON.stringify({samples,allRootsRemoved:true},null,2));
console.log(JSON.stringify({samples,allRootsRemoved:true},null,2));
