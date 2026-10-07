import * as THREE from 'three';

// The same actual 3D product is used for the journey and gallery.
export function buildAssets(scene,renderer){
  const lighting=new THREE.Scene();lighting.background=new THREE.Color('#3b3341');
  const panels=[];
  for(const [xyz,size,color,strength] of [
    [[-4,4,5],[2,6,.1],'#e9dce7',3],
    [[4,3,-1],[1,5,.1],'#d5bbd6',3],
    [[0,6,0],[5,.1,5],'#f7ddca',2],
  ]){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(strength)}));
    panel.position.set(...xyz);lighting.add(panel);panels.push(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(lighting,.04);
  scene.environment=env.texture;scene.environmentIntensity=.8;
  panels.forEach(p=>{p.geometry.dispose();p.material.dispose();});pmrem.dispose();
  const c=document.createElement('canvas');c.width=1536;c.height=1024;const ctx=c.getContext('2d');
  ctx.fillStyle='#241b25';ctx.fillRect(0,0,1536,1024);ctx.textAlign='center';ctx.strokeStyle='#c8aa79';ctx.lineWidth=3;
  for(const a of [-.52,.52]){ctx.beginPath();ctx.ellipse(768,280,54,110,a,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#eee4db';ctx.font='130px "Cormorant Garamond"';ctx.fillText('neréa',768,596);
  ctx.font='22px Manrope';ctx.fillText('S E A   M O S S',768,711);
  ctx.fillStyle='#baabae';ctx.font='14px Manrope';ctx.fillText('THE DAILY RITUAL',768,831);
  ctx.font='12px Manrope';ctx.fillText('60 CAPSULES · CONCEPT EDITION',768,889);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const bottle=new THREE.Group();scene.add(bottle);
  const profile=[[0,0],[.58,0],[.7,.05],[.735,.14],[.74,.3],[.74,1.89],[.73,2.02],[.69,2.09],[.69,2.17],[0,2.17]].map(p=>new THREE.Vector2(...p));
  bottle.add(new THREE.Mesh(new THREE.LatheGeometry(profile,96),new THREE.MeshPhysicalMaterial({color:'#241b25',roughness:.32,metalness:.12,clearcoat:.6,clearcoatRoughness:.25})));
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.742,.742,1.77,96,1,true),new THREE.MeshPhysicalMaterial({map:texture,roughness:.39,metalness:.12,clearcoat:.35,emissiveMap:texture,emissive:'#fff',emissiveIntensity:.08}));
  label.position.y=1.09;label.rotation.y=Math.PI;bottle.add(label);
  const lidMaterial=new THREE.MeshStandardMaterial({color:'#29242d',roughness:.48,metalness:.15});
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.762,.762,.34,96),lidMaterial);lid.position.y=2.21;bottle.add(lid);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.751,.014,8,96),lidMaterial);rim.rotation.x=Math.PI/2;rim.position.y=2.39;bottle.add(rim);
  const dummy=new THREE.Object3D(),ribs=new THREE.InstancedMesh(new THREE.BoxGeometry(.004,.28,.007),lidMaterial,160);
  for(let i=0;i<160;i++){const a=i/160*Math.PI*2;dummy.position.set(Math.sin(a)*.764,2.21,Math.cos(a)*.764);dummy.rotation.y=a;dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);}bottle.add(ribs);
  bottle.traverse(o=>{if(o.material){o.material.transparent=true;}});
  const capsule=new THREE.Group();scene.add(capsule);
  const curve=new THREE.CatmullRomCurve3([[0,.89],[.15,.86],[.29,.76],[.36,.61],[.375,.42],[.375,0]].map(p=>new THREE.Vector3(...p,0)));
  const geometry=new THREE.LatheGeometry(curve.getPoints(42).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),64);
  const membrane=new THREE.MeshPhysicalMaterial({color:'#e8d2ea',roughness:.1,metalness:.2,clearcoat:1,iridescence:.4,transparent:true,opacity:.48,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,envMapIntensity:1.4});
  const topHalf=new THREE.Group(),bottomHalf=new THREE.Group();
  for(const half of [topHalf,bottomHalf]){
    half.add(new THREE.Mesh(geometry,membrane));
    const edge=new THREE.Mesh(new THREE.TorusGeometry(.375,.009,8,80),new THREE.MeshStandardMaterial({color:'#edc9de',metalness:.4,roughness:.15,transparent:true,opacity:.75}));edge.rotation.x=Math.PI/2;half.add(edge);
  }
  bottomHalf.rotation.z=Math.PI;capsule.add(topHalf,bottomHalf);
  let seed=1817;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.014,0),new THREE.MeshStandardMaterial({color:'#b7a99a',roughness:.72}),160);
  for(let i=0;i<160;i++){dummy.position.set((random()-.5)*.47,(random()-.5)*.83,(random()-.5)*.47);dummy.scale.set(.45+random(),.7+random(),.5+random());dummy.rotation.set(random()*3,random()*3,0);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}capsule.add(grains);
  const sculpture=new THREE.Group();scene.add(sculpture);
  const gold=new THREE.MeshStandardMaterial({color:'#d8b377',metalness:.88,roughness:.22,emissive:'#a77a3d',emissiveIntensity:.16});
  for(const a of [-.52,.52]){const leaf=new THREE.Group();leaf.rotation.z=a;for(let i=0;i<8;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1-i*.065,.015,8,96),gold);r.scale.set(.52,1.25,1);r.position.z=i*.065;leaf.add(r);}sculpture.add(leaf);}
  const particlesGeo=new THREE.BufferGeometry(),positions=new Float32Array(90*3);
  for(let i=0;i<90;i++)positions.set([(random()-.5)*12,(random()-.5)*8,random()*-4],i*3);
  particlesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:'#edd7ef',size:.018,transparent:true,opacity:.35,depthWrite:false}));scene.add(particles);
  return {bottle,capsule,topHalf,bottomHalf,grains,sculpture,particles,ready:Promise.resolve(),dispose(){env.dispose();texture.dispose();}};
}
