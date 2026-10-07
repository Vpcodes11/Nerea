import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original modular marine forms. Shared meshes keep the long journey inexpensive.
export function buildLandscape(scene, { rockGeometries, stoneMaterial, stoneNormal, stoneColor, random, canvas }) {
  const mobile = innerWidth < 700;
  const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  const textures = [], animatedPlants = [], fish = [];
  let rockIndex = 0;
  function rock(parent, position, scale, material = stoneMaterial) {
    const m = new THREE.Mesh(rockGeometries[rockIndex++ % 4], material);
    m.position.set(...position); m.scale.set(...scale);
    m.rotation.set(random() * .3, random() * 6, random() * .25); parent.add(m); return m;
  }
  const rocks = new THREE.Group(); scene.add(rocks);
  // A tall broken pedestal, with near rocks that the camera passes on departure.
  rock(rocks, [1.7, -.7, -.4], [2.1, 1.25, 1.4]);
  rock(rocks, [2.75, .35, .65], [.75, 1.75, .72]);
  rock(rocks, [.15, -.05, .9], [.85, 1.2, .9]);
  rock(rocks, [1.5, -.7, 1.9], [1.4, .6, .6]);
  rock(rocks, [3.6, -.9, 1.4], [1.8, 1.6, 1.7]);
  rock(rocks, [-5.5, -.8, 4.8], [2.7, 3.6, 1.6]);
  rock(rocks, [6.1, -.7, 4.5], [2.4, 3.7, 2]);
  rock(rocks, [-4.9, -.1, -2], [1.4, 2.4, 1.2]);
  const floating = new THREE.Group(); scene.add(floating);
  for (const [p, s] of [ [[-5.5,5,-10],[1.2,1.5,.85]], [[4.5,5.1,-16],[1.25,1.8,1]], [[-3.2,3.8,-20],[.7,1.1,.7]], [[6,2.2,-22],[.5,.9,.6]] ]) rock(floating,p,s);
  const slabs = new THREE.MeshStandardMaterial({ color:'#b6a4b7', map:stoneMaterial.map, normalMap:stoneNormal, roughness:.58, metalness:.08 });
  slabs.onBeforeCompile=stoneMaterial.onBeforeCompile;
  for(let i=0;i<13;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(1.3,.24,.72,3,1,2),slabs);
    m.position.set(Math.sin(i*.7)*1.3,-.42,-5-i*1.35);m.rotation.y=Math.sin(i*2)*.32;floating.add(m);
  }
  // Two scallop halves with radial folds and an iridescent pearl.
  const shell = new THREE.Group(); scene.add(shell); shell.position.set(3,.05,-14);
  const vertices=[],indices=[];
  for(let r=0;r<=28;r++)for(let j=0;j<=64;j++){
    const radius=r/28, theta=(j/64-.5)*2.9, fold=Math.cos(theta*23)*.035*radius;
    vertices.push(Math.sin(theta)*radius, Math.cos(theta)*radius-.25, Math.sin(radius*Math.PI)*.18+fold);
  }
  for(let r=0;r<28;r++)for(let j=0;j<64;j++){const a=r*65+j,b=a+65;indices.push(a,b,a+1,a+1,b,b+1);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));sg.setIndex(indices);sg.computeVertexNormals();
  const shellMaterial=new THREE.MeshPhysicalMaterial({color:'#f3d1ca',roughness:.28,metalness:.08,clearcoat:1,side:THREE.DoubleSide,iridescence:.6,iridescenceIOR:1.3});
  const shellUpper=new THREE.Mesh(sg,shellMaterial),shellLower=new THREE.Mesh(sg,shellMaterial);
  shellUpper.rotation.x=-.8;shellLower.rotation.x=-2.4;shellLower.position.y=-.06;shell.add(shellUpper,shellLower);
  const pearl=new THREE.Mesh(new THREE.SphereGeometry(.29,32,20),new THREE.MeshPhysicalMaterial({color:'#f5e8de',roughness:.12,metalness:.2,clearcoat:1,iridescence:.4}));pearl.position.set(0,.24,.2);shell.add(pearl);shell.scale.setScalar(1.5);

  const mistCanvas=canvas(512,128),mc=mistCanvas.getContext('2d');
  for(let i=0;i<70;i++){const x=random()*512,y=35+random()*58,r=15+random()*65,g=mc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.1)');g.addColorStop(1,'rgba(255,255,255,0)');mc.fillStyle=g;mc.fillRect(x-r,y-r,r*2,r*2);}
  mc.globalCompositeOperation='destination-in';
  const maskX=mc.createLinearGradient(0,0,512,0);maskX.addColorStop(0,'transparent');maskX.addColorStop(.2,'white');maskX.addColorStop(.8,'white');maskX.addColorStop(1,'transparent');mc.fillStyle=maskX;mc.fillRect(0,0,512,128);
  const maskY=mc.createLinearGradient(0,0,0,128);maskY.addColorStop(0,'transparent');maskY.addColorStop(.4,'white');maskY.addColorStop(.6,'white');maskY.addColorStop(1,'transparent');mc.fillStyle=maskY;mc.fillRect(0,0,512,128);
  const mt=new THREE.CanvasTexture(mistCanvas);textures.push(mt);
  const mist=new THREE.Group();scene.add(mist);
  for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(23,3.5),new THREE.MeshBasicMaterial({map:mt,color:'#c5b2c3',transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));m.position.set((i%2-.5)*3,.5,-4-i*3);m.renderOrder=4;mist.add(m);}

  // Three coral families: hollow sponges, folded lobes, and branching sea fans.
  const coralMaterial=new THREE.MeshStandardMaterial({roughness:.7,normalMap:stoneNormal,normalScale:new THREE.Vector2(.15,.15)});
  const geometries=[];
  const tubeProfile=[new THREE.Vector2(.105,0),new THREE.Vector2(.086,.25),new THREE.Vector2(.093,.75),new THREE.Vector2(.10,.8),new THREE.Vector2(.07,.8),new THREE.Vector2(.065,.67)];
  geometries.push(new THREE.LatheGeometry(tubeProfile,12));
  const lobe=new THREE.SphereGeometry(.35,16,12),lp=lobe.attributes.position;
  for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),z=lp.getZ(i);const n=1+Math.sin(x*28+z*16)*.13+Math.sin(y*32-x*9)*.12;lp.setXYZ(i,x*n,y*n*.65,z*n);}lobe.computeVertexNormals();geometries.push(lobe);
  function fanGeometry(){
    const parts=[];
    function branch(start,dir,length,radius,depth){
      const end=start.clone().addScaledVector(dir,length),mid=start.clone().lerp(end,.5);mid.z+=.045*Math.sin(end.x*9);
      const curve=new THREE.QuadraticBezierCurve3(start,mid,end);parts.push(new THREE.TubeGeometry(curve,4,radius,5,false));
      if(depth){for(const sign of [-1,1]){const nd=dir.clone();nd.x+=sign*(.26+random()*.17);nd.y=.8;nd.normalize();branch(end,nd,length*.72,radius*.69,depth-1);}}
    }
    branch(new THREE.Vector3(),new THREE.Vector3(0,1,0),.27,.026,mobile?4:5);
    const result=mergeGeometries(parts);parts.forEach(p=>p.dispose());return result;
  }
  geometries.push(fanGeometry());
  const palette=['#d496aa','#b278b9','#ac8dca','#d7b2bd','#986fa2'];
  function corals(parent,centers,count){
    for(let family=0;family<3;family++){
      const n=Math.ceil(count/(family===2?4:1)),instances=new THREE.InstancedMesh(geometries[family],coralMaterial,n);
      for(let i=0;i<n;i++){
        const c=centers[i%centers.length],h=.6+random()*1.1;
        dummy.position.set(c[0]+(random()-.5)*2,c[1],c[2]+(random()-.5)*1.7);
        dummy.rotation.set((random()-.5)*.35,random()*6,(random()-.5)*.35);
        dummy.scale.set(family===0?.65+random()*.6:h,h,family===2?.65:h);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);
        instances.setColorAt(i,new THREE.Color(palette[(i+family)%palette.length]));
      }
      parent.add(instances);
    }
  }
  const plantTime={value:0};
  const seaweedMaterial=new THREE.MeshStandardMaterial({color:'#96a976',roughness:.62,side:THREE.DoubleSide});
  seaweedMaterial.onBeforeCompile=shader=>{shader.uniforms.plantTime=plantTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float plantTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(position.y*2.5+plantTime*.55)*.045*pow(max(position.y,0.),2.);');};
  function plant(parent,x,y,z,scale=1){
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);
    for(let i=0;i<(mobile?5:8);i++){
      const geo=new THREE.PlaneGeometry(.32,1.7,6,20),p=geo.attributes.position;
      for(let j=0;j<p.count;j++){const h=p.getY(j)+.85,v=h/1.7,x0=p.getX(j);p.setXYZ(j,x0*(.4+Math.sin(v*Math.PI)*.8+Math.sin(v*45)*.16)+Math.sin(h*3+i)*.10*v,h,Math.sin(h*4+i)*.13*v);}
      geo.computeVertexNormals();const leaf=new THREE.Mesh(geo,seaweedMaterial);leaf.rotation.set((random()-.5)*.35,i*.8,(random()-.5)*.6);g.add(leaf);
    }
    animatedPlants.push(g);return g;
  }
  const reef=new THREE.Group();reef.position.set(-1,-.68,-24);scene.add(reef);
  rock(reef,[0,-.35,0],[2.9,.6,1.45]);
  corals(reef,[[-1.6,.1,.2],[1.2,.1,.3],[.2,.08,-.6]],mobile?30:60);
  for(let i=0;i<7;i++)plant(reef,(i-3)*.53,.08,-.45-Math.cos(i)*.25,.85+random()*.45);

  const deep=new THREE.Group();scene.add(deep);
  const deepStone=stoneMaterial.clone();deepStone.color.set('#8f819f');
  deepStone.onBeforeCompile=stoneMaterial.onBeforeCompile;
  const centers=[];
  for(let i=0;i<10;i++){
    const z=-28-i*4.1, bend=Math.sin(i*.75)*1.2;
    for(const side of [-1,1]){
      const x=side*(7.1+random()*.6)+bend;
      rock(deep,[x,-3.7,z],[2.2+random(),2.7+random()*.8,2.8],deepStone);
      rock(deep,[x-side*.65,-5.4,z+1],[1.8, .75,1.8],deepStone);
      centers.push([side*(3.5+random()*.7)+bend,-5.55,z+1]);
    }
  }
  corals(deep,centers,mobile?110:260);
  for(let i=0;i<12;i++){const c=centers[i];plant(deep,c[0],c[1],c[2],.5+random()*.4);}
  // Stone spires break the passage silhouette without obstructing the reading area.
  for(let i=0;i<8;i++)rock(deep,[(i%2?1:-1)*3.8,-4.2,-30-i*4],[.25,1.4+random(),.35],deepStone);
  const bedGeo=new THREE.PlaneGeometry(35,68,35,68);bedGeo.rotateX(-Math.PI/2);
  const bp=bedGeo.attributes.position;for(let i=0;i<bp.count;i++)bp.setY(i,Math.sin(bp.getX(i)*.7+bp.getZ(i)*.3)*.10+Math.cos(bp.getZ(i)*.6)*.08);bedGeo.computeVertexNormals();
  const causticTime={value:0},bedMaterial=stoneMaterial.clone();bedMaterial.color.set('#b0a1b2');bedMaterial.normalScale.set(.15,.15);
  bedMaterial.onBeforeCompile=shader=>{
    shader.uniforms.causticTime=causticTime;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 bedPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nbedPosition=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 bedPosition;uniform float causticTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat c=pow(max(0.,sin(bedPosition.x*2.6+sin(bedPosition.z*2.+causticTime*.25))*cos(bedPosition.z*3.4-causticTime*.19)),14.);totalEmissiveRadiance+=vec3(.3,.23,.4)*c;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',stoneColor);
  };
  const bed=new THREE.Mesh(bedGeo,bedMaterial);bed.position.set(0,-5.8,-46);deep.add(bed);
  const rayCanvas=canvas(64,256),rc=rayCanvas.getContext('2d'),rg=rc.createLinearGradient(0,0,64,0);rg.addColorStop(0,'transparent');rg.addColorStop(.5,'rgba(230,210,255,.5)');rg.addColorStop(1,'transparent');rc.fillStyle=rg;rc.fillRect(0,0,64,256);
  const rayTexture=new THREE.CanvasTexture(rayCanvas);textures.push(rayTexture);
  for(let i=0;i<9;i++){const ray=new THREE.Mesh(new THREE.PlaneGeometry(.7+random()*.8,7),new THREE.MeshBasicMaterial({map:rayTexture,color:'#b898db',transparent:true,opacity:.08,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));ray.position.set((i%3-1)*3,-3,-29-i*4);ray.rotation.z=-.28;deep.add(ray);}

  const capsule=new THREE.Group();capsule.position.set(.9,-3.35,-31);scene.add(capsule);
  const profile=[[0,.85],[.12,.82],[.23,.74],[.30,.62],[.32,.46],[.32,0]].map(p=>new THREE.Vector3(...p,0));
  const curve=new THREE.CatmullRomCurve3(profile,false,'centripetal');
  const capsuleMaterial=new THREE.MeshPhysicalMaterial({color:'#d7c6e5',roughness:.16,metalness:.09,clearcoat:1,side:THREE.DoubleSide,transparent:true,opacity:.86,iridescence:.3});
  const cg=new THREE.LatheGeometry(curve.getPoints(48).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),64);
  const topHalf=new THREE.Mesh(cg,capsuleMaterial),bottomHalf=new THREE.Mesh(cg,capsuleMaterial);bottomHalf.rotation.z=Math.PI;capsule.add(topHalf,bottomHalf);capsule.scale.setScalar(2.15);
  const grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.025,1),new THREE.MeshStandardMaterial({color:'#b4be95',roughness:.8}),90);
  for(let i=0;i<90;i++){dummy.position.set((random()-.5)*.33,(random()-.5)*.7,(random()-.5)*.33);dummy.rotation.set(random()*3,random()*3,0);dummy.scale.setScalar(.7+random());dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}capsule.add(grains);

  const featureOrbs=[];
  const orbMaterial=new THREE.MeshPhysicalMaterial({color:'#bca9d5',roughness:.08,metalness:.1,transparent:true,opacity:.22,clearcoat:1,envMapIntensity:1.8,depthWrite:false});
  for(let i=0;i<3;i++){
    const orb=new THREE.Group();orb.position.set([-1.6,1.5,-1][i],-3.3,[-37,-44,-51][i]);deep.add(orb);
    const globe=new THREE.Mesh(new THREE.SphereGeometry(.78,40,24),orbMaterial);orb.add(globe);
    const inner=new THREE.Group();orb.add(inner);
    if(i===0){const m=new THREE.Mesh(geometries[2],new THREE.MeshStandardMaterial({color:'#d5a0b4',roughness:.5}));m.position.y=-.48;m.scale.setScalar(1.12);inner.add(m);}
    if(i===1){const m=new THREE.Mesh(cg,capsuleMaterial);m.rotation.z=-.4;m.position.y=-.3;m.scale.setScalar(.7);inner.add(m);}
    if(i===2){for(const angle of [-.52,.52]){const m=new THREE.Mesh(new THREE.TorusGeometry(.28,.015,8,64),new THREE.MeshStandardMaterial({color:'#d6bb84',metalness:.86,roughness:.23}));m.scale.set(.6,1.3,1);m.rotation.z=angle;inner.add(m);}}
    featureOrbs.push(orb);
  }
  // NERÉA's own intersecting-leaf mark becomes the closing sculpture.
  const sculpture=new THREE.Group();sculpture.position.set(0,-4.05,-64);scene.add(sculpture);
  const gold=new THREE.MeshStandardMaterial({color:'#c3b183',roughness:.23,metalness:.88,transparent:true});
  for(const angle of [-.52,.52]){
    const leaf=new THREE.Group();leaf.rotation.z=angle;
    for(let i=0;i<9;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1-i*.058,.018,8,96),gold);ring.scale.set(.56,1.28,1);ring.position.z=i*.045;leaf.add(ring);}sculpture.add(leaf);
  }
  sculpture.scale.setScalar(1.45);
  rock(deep,[0,-5.65,-64],[2.1,.25,1.1],deepStone);

  // Stylized original fish with tapered bodies and fluttering translucent fins.
  const fishMaterial=new THREE.MeshPhysicalMaterial({color:'#dba789',roughness:.36,metalness:.12,side:THREE.DoubleSide,clearcoat:.6});
  for(let i=0;i<(mobile?2:4);i++){
    const g=new THREE.Group(),bodyGeometry=new THREE.SphereGeometry(.24,24,16),pos=bodyGeometry.attributes.position;
    for(let j=0;j<pos.count;j++){const x=pos.getX(j),taper=1-Math.max(0,-x)*1.6;pos.setXYZ(j,x*2.3,pos.getY(j)*taper*.7,pos.getZ(j)*taper*.55);}bodyGeometry.computeVertexNormals();
    const body=new THREE.Mesh(bodyGeometry,fishMaterial);g.add(body);
    const finGeo=new THREE.BufferGeometry(),fv=[],fi=[];
    for(let j=0;j<=14;j++){const f=j/14;fv.push(-.48,0,0,-.68-Math.sin(f*Math.PI)*.25,(f-.5)*.62,Math.sin(f*12)*.025);if(j<14){const a=j*2;fi.push(a,a+1,a+3,a,a+3,a+2);}}finGeo.setAttribute('position',new THREE.Float32BufferAttribute(fv,3));finGeo.setIndex(fi);finGeo.computeVertexNormals();
    const tail=new THREE.Mesh(finGeo,fishMaterial);g.add(tail);
    for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),new THREE.MeshBasicMaterial({color:'#40364c'}));eye.position.set(.4,.035,side*.07);g.add(eye);}
    scene.add(g);fish.push({group:g,tail,phase:i*2.2});
  }
  const bubbleMaterial=new THREE.MeshPhysicalMaterial({color:'#d4c0ec',roughness:.08,metalness:.1,transparent:true,opacity:.2,clearcoat:1,depthWrite:false});
  const bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,10,8),bubbleMaterial,mobile?32:70),bubbleSeeds=[];scene.add(bubbles);
  for(let i=0;i<bubbles.count;i++)bubbleSeeds.push({x:(random()-.5)*9,y:random()*5.5-5.8,z:-27-random()*40,scale:.3+random()*1.5});
  const specksGeo=new THREE.BufferGeometry(),specks=new Float32Array((mobile?180:450)*3);
  for(let i=0;i<specks.length/3;i++)specks.set([(random()-.5)*15,-.9-random()*5,-25-random()*44],i*3);
  specksGeo.setAttribute('position',new THREE.BufferAttribute(specks,3));const particles=new THREE.Points(specksGeo,new THREE.PointsMaterial({size:.013,color:'#d9c7f0',transparent:true,opacity:.48,depthWrite:false}));deep.add(particles);
  return {rocks,floating,shell,mist,reef,deep,capsule,topHalf,bottomHalf,grains,featureOrbs,sculpture,sculptureMaterial:gold,bubbles,bubbleSeeds,dummy,causticTime,fish,
    update(time,under,day=1){
      plantTime.value=time;causticTime.value=time;
      shell.rotation.set(.1+Math.sin(time*.18)*.03,-.3,-.12);shell.position.y=.05+Math.sin(time*.23)*.045;
      floating.rotation.y=Math.sin(time*.12)*.008;
      featureOrbs.forEach((o,i)=>{o.rotation.y=Math.sin(time*.18+i)*.14;o.position.y=-3.3+Math.sin(time*.3+i)*.045;});
      sculpture.rotation.y=Math.sin(time*.13)*.09;
      mist.children.forEach((m,i)=>{m.position.x=(i%2-.5)*3+Math.sin(time*.06+i)*.4;m.material.opacity=(i<3?.85:.25)*(1-under)*(1-day*.35);});
      fish.forEach(({group,tail,phase},i)=>{group.visible=day>.5;group.position.set((i%2?1:-1)*(5+Math.sin(time*.10+phase)*1.2),.4+Math.sin(time*.15+phase)*.4,-17-i*2);group.scale.setScalar(.7);group.rotation.y=Math.cos(time*.10+phase)>0?0:Math.PI;tail.rotation.y=Math.sin(time*2+phase)*.3;});
    },
    dispose(){textures.forEach(t=>t.dispose());}
  };
}
