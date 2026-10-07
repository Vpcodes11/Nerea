import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// An authored shore specimen: forked wrack attached to rocks at the tidal edge.
export function buildCoastalGarden(scene, stoneMaterial) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Coastal bladderwrack garden';
  scene.add(rootGroup);
  const geometries = new Set(), materials = new Set(), plants = [];
  let seed = 21749, disposed = false, depthHidden = false, portraitWasVisible = true, portraitLoaded = false;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const ownGeometry = g => { geometries.add(g); return g; };
  const ownMaterial = m => { materials.add(m); return m; };
  const clock = {value: 0};

  const leafMaterial = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: '#d8d7ce', roughness: .60, metalness: .015,
    clearcoat: .17, clearcoatRoughness: .48, side: THREE.DoubleSide,
    vertexColors: true
  }));
  leafMaterial.onBeforeCompile = shader => {
    shader.uniforms.shoreTime = clock;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float shoreTime;\nattribute float shoreFlex;\nvarying vec2 shoreUV;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nshoreUV=uv;\ntransformed.z+=sin(shoreTime*.31+position.y*1.8+position.x*.8)*.055*shoreFlex;\ntransformed.x+=sin(shoreTime*.23+position.y*1.4)*.025*shoreFlex;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 shoreUV;')
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat grain=sin(shoreUV.y*115.+sin(shoreUV.x*47.)*2.5)*sin(shoreUV.x*63.)*.027;\nfloat midrib=exp(-pow((shoreUV.x-.5)*35.,2.));\nfloat edge=pow(abs(shoreUV.x-.5)*2.,6.);\ndiffuseColor.rgb*=1.+grain-midrib*.12-edge*.07;');
  };
  const vesicleMaterial = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: '#ada591', roughness: .49, metalness: .015,
    clearcoat: .25, clearcoatRoughness: .39, vertexColors: true
  }));
  vesicleMaterial.onBeforeCompile = shader => {
    shader.uniforms.shoreTime = clock;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float shoreTime;\nattribute float shoreFlex;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z+=sin(shoreTime*.31+position.y*1.8+position.x*.8)*.055*shoreFlex;\ntransformed.x+=sin(shoreTime*.23+position.y*1.4)*.025*shoreFlex;');
  };

  // The support rocks sit mostly below the water; the blades grow from their crest.
  const rockGeometry = ownGeometry(mergeVertices(new THREE.IcosahedronGeometry(1, 3)));
  const rp = rockGeometry.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i);
    const n = 1 + Math.sin(x*5.3+z*3.1)*Math.cos(y*4.1)*.105 + Math.sin(z*10.4-y*5.7)*.036;
    rp.setXYZ(i, x*n, y*n, z*n);
  }
  rockGeometry.computeVertexNormals();
  const rockMaterial = ownMaterial(stoneMaterial?.clone() || new THREE.MeshStandardMaterial({roughness:.92}));
  rockMaterial.color.set('#999389');
  rockMaterial.roughness = .88;
  const rockSpecs = [
    [[3.65,-1.13,-22.6],[1.65,.92,1.30],.22],
    [[5.03,-1.20,-23.75],[1.09,.72,.98],-.61],
    [[2.48,-1.18,-20.95],[.91,.63,.79],1.08]
  ];
  rockSpecs.forEach(([position,scale,rotation]) => {
    const rock = new THREE.Mesh(rockGeometry,rockMaterial);
    rock.position.set(...position); rock.scale.set(...scale);
    rock.rotation.set(.10,rotation,-.07);
    rock.castShadow = rock.receiveShadow = true;
    rootGroup.add(rock);
  });

  const palette = ['#706f53','#646950','#7c7556','#5c6350','#8b8264'].map(c => new THREE.Color(c));
  const vesicleGeometry = new THREE.SphereGeometry(1,10,7);
  const up = new THREE.Vector3(0,1,0), matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();

  function makePlant(x,y,z,height,lean,phase,colourIndex) {
    const plant = new THREE.Group();
    plant.position.set(x,y,z);
    plant.rotation.y = phase;
    const blades = [], vesicles = [];
    const colour = palette[colourIndex].clone();
    function branch(start, angle, length, width, depth, twist) {
      const end = start.clone().add(new THREE.Vector3(Math.sin(angle)*length,Math.cos(angle)*length,(random()-.5)*length*.66));
      const a = start.clone().lerp(end,.30), b = start.clone().lerp(end,.75);
      a.x += Math.cos(angle)*length*.18; b.z += length*.28;
      b.x -= Math.cos(angle)*length*.16;
      const curve = new THREE.CubicBezierCurve3(start,a,b,end);
      const positions=[],uvs=[],colours=[],flex=[],indices=[];
      const along = 12, across = 4;
      for(let i=0;i<=along;i++) {
        const t=i/along, center=curve.getPoint(t), tangent=curve.getTangent(t);
        const rotation=twist+Math.sin(t*Math.PI)*.68+t*.60+Math.sin(t*10+phase)*.15;
        const facing=new THREE.Vector3(Math.sin(rotation),.05,Math.cos(rotation));
        const side=new THREE.Vector3().crossVectors(tangent,facing).normalize();
        const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
        const tip=depth===0 ? Math.pow(Math.max(.018,Math.sin(Math.PI*(t*.93+.025))),.45) : .7+.3*Math.sin(t*Math.PI);
        const spread=width*tip*(.77+.23*Math.sin(t*8+phase));
        for(let j=0;j<=across;j++) {
          const s=j/across*2-1;
          const edgeRipple=Math.sin(t*22+phase+s*2)*.007*length*Math.pow(Math.abs(s),3);
          const point=center.clone().addScaledVector(side,s*spread).addScaledVector(normal,(1-s*s)*.006+edgeRipple);
          positions.push(point.x,point.y,point.z);uvs.push(j/across,t);
          const pigment=colour.clone().multiplyScalar(.94+random()*.12);
          colours.push(pigment.r,pigment.g,pigment.b);flex.push(Math.max(0,point.y)*.70);
        }
      }
      for(let i=0;i<along;i++)for(let j=0;j<across;j++){
        const n=i*(across+1)+j;indices.push(n,n+1,n+across+1,n+1,n+across+2,n+across+1);
      }
      const blade=new THREE.BufferGeometry();
      blade.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      blade.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(positions.length),3));
      blade.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
      blade.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
      blade.setAttribute('shoreFlex',new THREE.Float32BufferAttribute(flex,1));
      blade.setIndex(indices);blade.computeVertexNormals();blades.push(blade);
      // Paired air vesicles are part of the wrack itself, at the blade's midrib.
      if(depth===1 && length>.27 && random()>.34) {
        const center=curve.getPoint(.36),tangent=curve.getTangent(.36);
        const acrossVector=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,0,1)).normalize();
        for(const sign of [-1,1]) {
          const point=center.clone().addScaledVector(acrossVector,sign*width*.60);
          point.z+=.022;
          const radius=width*.27;
          quaternion.setFromUnitVectors(up,tangent);
          matrix.compose(point,quaternion,new THREE.Vector3(radius,radius*1.30,radius*.78));
          const bladder=vesicleGeometry.clone().applyMatrix4(matrix), count=bladder.attributes.position.count;
          const colorValues=[],weights=[];
          for(let k=0;k<count;k++){colorValues.push(colour.r,colour.g,colour.b);weights.push(Math.max(0,point.y)*.70);}
          bladder.setAttribute('color',new THREE.Float32BufferAttribute(colorValues,3));
          bladder.setAttribute('shoreFlex',new THREE.Float32BufferAttribute(weights,1));vesicles.push(bladder);
        }
      }
      if(depth>0)for(const direction of [-1,1]) {
        branch(end,angle+direction*(.31+random()*.25),length*(.65+random()*.16),width*.74,depth-1,twist+direction*(.35+random()*.22));
      }
    }
    branch(new THREE.Vector3(),lean,height*.40,.038*height,3,phase*.8);
    const geometry=ownGeometry(mergeGeometries(blades));blades.forEach(g=>g.dispose());
    const leaves=new THREE.Mesh(geometry,leafMaterial);leaves.castShadow=leaves.receiveShadow=true;plant.add(leaves);
    if(vesicles.length){const vg=ownGeometry(mergeGeometries(vesicles));vesicles.forEach(g=>g.dispose());const bladders=new THREE.Mesh(vg,vesicleMaterial);bladders.castShadow=true;plant.add(bladders);}
    rootGroup.add(plant);plants.push({plant,phase,lean});
  }
  // An open, asymmetric silhouette: taller towards the distant shore, swept low at the front.
  makePlant(3.47,-.28,-22.48,2.12,-.42,-.46,0);
  makePlant(4.05,-.30,-22.72,1.91,.64,.59,1);
  makePlant(3.05,-.36,-22.1,1.51,-.86,-.34,2);
  makePlant(4.55,-.46,-23.05,1.39,.90,.72,3);
  makePlant(2.70,-.56,-21.32,1.03,-1.03,-.67,4);
  makePlant(5.08,-.65,-23.55,.96,.87,.83,1);
  vesicleGeometry.dispose();

  plants.forEach(({plant})=>plant.scale.setScalar(.60));
  // One original specimen portrait, curved in space; fine wrack remains behind it.
  const portraitGeometry = ownGeometry(new THREE.PlaneGeometry(3.5,2.6,28,24));
  const pp = portraitGeometry.attributes.position;
  for(let i=0;i<pp.count;i++) {
    const x=pp.getX(i),y=pp.getY(i);
    pp.setZ(i,Math.cos(x/3.5*Math.PI)*.14+Math.sin((y+1.3)/2.6*Math.PI)*.055);
  }
  portraitGeometry.computeVertexNormals();
  const portraitMaterial = ownMaterial(new THREE.MeshBasicMaterial({
    color:'#ddd9cf',alphaTest:.08,side:THREE.DoubleSide,fog:true,
    transparent:false,depthWrite:true
  }));
  const bendPortrait=shader=>{
    shader.uniforms.shoreTime=clock;
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nuniform float shoreTime;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat shoreWeight=clamp((position.y+1.3)/2.6,0.,1.);\ntransformed.x+=sin(shoreTime*.19+position.y*1.1)*.025*shoreWeight;\ntransformed.z+=sin(shoreTime*.17+position.x*.8)*.022*shoreWeight;');
  };
  portraitMaterial.onBeforeCompile=bendPortrait;
  const portrait = new THREE.Mesh(portraitGeometry,portraitMaterial);
  portrait.name='Original coastal wrack specimen';
  portrait.position.set(3.7,1.02,-21.9);
  portrait.visible=false;
  rootGroup.add(portrait);
  // Preserve alpha-shaped occlusion in the atmosphere's separate depth target.
  const depthScene = new THREE.Scene();
  const portraitDepthMaterial = ownMaterial(new THREE.MeshDepthMaterial({
    alphaTest:.08,side:THREE.DoubleSide,colorWrite:false,depthWrite:true
  }));
  portraitDepthMaterial.onBeforeCompile=bendPortrait;
  const portraitDepthMesh = new THREE.Mesh(portraitGeometry,portraitDepthMaterial);
  portraitDepthMesh.matrixAutoUpdate=false;
  depthScene.add(portraitDepthMesh);
  const releasePortraitTexture=t=>{t.dispose();t.image?.close?.();};
  let portraitTexture;
  const ready = new Promise((resolve,reject)=>{
    portraitTexture=new THREE.TextureLoader().load('/textures/coastal-wrack.webp',texture=>{
      if(disposed){releasePortraitTexture(texture);resolve();return;}
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=4;
      portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;
      portraitDepthMaterial.map=texture;portraitDepthMaterial.needsUpdate=true;
      portraitLoaded=true;
      portraitWasVisible=true;portrait.visible=!depthHidden;
      resolve();
    },undefined,()=>reject(new Error('Unable to load the coastal wrack specimen.')));
  });
  ready.catch(()=>{});

  return {
    rootGroup,
    ready,
    readyPromise:ready,
    captureDepth(hide) {
      if(hide&&!depthHidden){portraitWasVisible=portrait.visible;portrait.visible=false;depthHidden=true;}
      else if(!hide&&depthHidden){portrait.visible=portraitWasVisible;depthHidden=false;}
    },
    renderDepth(renderer,camera) {
      if(disposed||!portraitLoaded||!rootGroup.visible||!(depthHidden?portraitWasVisible:portrait.visible))return;
      portrait.updateWorldMatrix(true,false);
      portraitDepthMesh.matrix.copy(portrait.matrixWorld);
      const previousAutoClear=renderer.autoClear;
      renderer.autoClear=false;
      try{renderer.render(depthScene,camera);}finally{renderer.autoClear=previousAutoClear;}
    },
    update(time,under,day,camera) {
      if(disposed)return;
      clock.value=time;
      const phone=innerWidth<700;
      rootGroup.position.x=phone?-.8:0;
      portrait.scale.setScalar(phone?.82:1);
      portrait.position.y=phone?.786:1.02;
      rootGroup.visible=under<.32 && day>.32 && camera.position.z<-4 && camera.position.z>-29;
      plants.forEach(({plant,phase})=>{plant.rotation.z=Math.sin(time*.19+phase)*.014;plant.rotation.x=Math.sin(time*.16+phase*2)*.012;});
    },
    dispose() {
      if(disposed)return;disposed=true;
      rootGroup.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
      depthScene.clear();
      if(portraitTexture)releasePortraitTexture(portraitTexture);
    }
  };
}
