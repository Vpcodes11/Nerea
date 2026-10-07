import * as THREE from 'three';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

// A light mist texture softens the base of the denser cloud sprites.
function mistTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;
  const context=canvas.getContext('2d');
  for(let i=0;i<18;i++){
    const x=16+i*5.7,y=27+Math.sin(i*1.73)*9,r=12+Math.sin(i*.87)*5;
    const gradient=context.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,'rgba(255,255,255,.22)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    context.fillStyle=gradient;context.fillRect(x-r,y-r,r*2,r*2);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function buildAtmosphere(scene) {
  let cloud;
  const ready=new Promise((resolve,reject)=>{cloud=new THREE.TextureLoader().load('/textures/cloud-bank.webp',resolve,undefined,reject);});
  cloud.colorSpace=THREE.SRGBColorSpace;
  const mirrored=cloud.clone();mirrored.repeat.x=-1;mirrored.offset.x=1;
  const vapor=mistTexture(),textures=[cloud,mirrored,vapor],geometry=new THREE.PlaneGeometry(1,1),layers=[];
  let disposed=false;ready.then(()=>{if(disposed){cloud.dispose();cloud.image?.close?.();}},()=>{});
  const night=new THREE.Color('#f0c9df'),dawn=new THREE.Color('#fff2ed');
  function layer(x,y,z,width,height,opacity,kind='cloud') {
    const material=new THREE.MeshBasicMaterial({map:kind==='mist'?vapor:textures[layers.length%2],color:night,transparent:true,opacity,depthWrite:false,fog:false,side:THREE.DoubleSide,forceSinglePass:true});
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float cloudHeight;').replace('#include <begin_vertex>','#include <begin_vertex>\ncloudHeight=(modelMatrix*vec4(transformed,1.)).y;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float cloudHeight;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=smoothstep(-.85,-.30,cloudHeight);'+(kind==='cloud'?'\ndiffuseColor.a*=smoothstep(0.,.045,vMapUv.x)*smoothstep(0.,.045,1.-vMapUv.x)*smoothstep(0.,.06,vMapUv.y)*smoothstep(0.,.06,1.-vMapUv.y);':''));
    };
    material.customProgramCacheKey=()=>kind;
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(width,height,1);scene.add(mesh);
    layers.push({mesh,x,y,z,opacity,kind,phase:layers.length*1.73});
  }
  // Tall banks frame the sky; distant low clouds soften the hard horizon.
  layer(-18,10,-25,25,7,.43);layer(20,12,-32,31,8,.42);
  layer(-31,12,-57,50,12,.42);layer(28,14,-72,58,13,.40);
  layer(-25,1.5,-44,44,4.5,.80);layer(17,1.6,-48,42,4.5,.78);
  layer(-8,.7,-14,14,2.5,.68);layer(9,.6,-18,16,2.7,.72);
  layer(-19,3.7,-31,25,5,.58);layer(20,4.2,-41,28,6,.58);
  // Low, separate pockets wrap the crag and drift past the camera.
  layer(-2.7,-.55,1.8,5.8,2.2,.48,'mist');layer(3.3,-.45,1.2,5.8,2.4,.55,'mist');
  layer(-4.5,-.20,-2.8,8,2.6,.62,'mist');layer(4.9,-.05,-5.7,9,2.7,.58,'mist');
  layer(-7,.1,-8.7,12,3,.57,'mist');layer(7,.15,-11.7,12,3,.57,'mist');
  // The blush ocean carries cloud banks between the floating outcrops.
  layer(-11,1.9,-28,17,5.5,.74);layer(12,2.2,-35,19,6,.73);
  layer(-20,2.8,-59,32,7,.82);layer(20,3.2,-68,36,8,.78);
  layer(-4,.15,-23,9,2.4,.40,'mist');layer(6,.2,-29,10,2.8,.42,'mist');
  layer(-2.9,-.15,.2,6,2.4,.45);layer(3.8,-.05,-1.9,7,2.6,.48);
  const facing=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
  return {
    ready,
    update(time,under,day,camera){
      // Cylindrical billboards stay upright as the camera tilts into the ocean.
      camera.getWorldDirection(direction);facing.setFromAxisAngle(up,Math.atan2(-direction.x,-direction.z));
      layers.forEach(({mesh,x,y,z,opacity,kind,phase},i)=>{
        mesh.position.x=x+Math.sin(time*.025+phase)*(kind==='mist'?.45:1.2);
        mesh.position.y=y+Math.sin(time*.04+phase)*.06;
        mesh.quaternion.copy(facing);
        const distance=camera.position.distanceTo(mesh.position),behind=z>camera.position.z+2;
        const submerged=1-smooth(.02,.68,under),nearFade=smooth(1.2,3.5,distance);
        mesh.material.opacity=opacity*submerged*nearFade/(1+distance*.004)*(kind==='mist'?1-day*.20:1);
        mesh.material.color.copy(night).lerp(dawn,day);
        mesh.visible=!behind&&mesh.material.opacity>.005&&!(innerWidth<700&&i<10&&i%3===2);
      });
    },
    dispose(){disposed=true;layers.forEach(({mesh})=>{scene.remove(mesh);mesh.material.dispose();});geometry.dispose();textures.forEach(t=>t.dispose());}
  };
}
