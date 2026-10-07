import * as THREE from 'three';

// Authored flowing surfaces: a closed marine ribbon with a changing section and twist.
function tideRibbon(radius,width,turns=1,phase=0){
 const positions=[],uv=[],indices=[],N=220,M=14;
 const center=t=>new THREE.Vector3(Math.cos(t)*(radius+Math.sin(t*3+phase)*.13),Math.sin(t)*(radius+Math.sin(t*3+phase)*.13),Math.sin(t*3+phase)*.25);
 for(let i=0;i<=N;i++){
  const t=i/N*Math.PI*2,p=center(t),tangent=center(t+.002).sub(center(t-.002)).normalize();
  const normal=new THREE.Vector3(Math.cos(t),Math.sin(t),0),across=new THREE.Vector3().crossVectors(tangent,normal).normalize();
  const twist=t*turns+phase,axis=normal.multiplyScalar(Math.cos(twist)).addScaledVector(across,Math.sin(twist));
  for(let j=0;j<=M;j++){const q=(j/M-.5)*width*(.82+.18*Math.cos(t*3));const v=p.clone().addScaledVector(axis,q);positions.push(...v.toArray());uv.push(i/N,j/M);}
 }
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const k=i*(M+1)+j;indices.push(k,k+M+1,k+1,k+1,k+M+1,k+M+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function buildChapterArt(scene,bottle){
 const capsule=new THREE.Group();scene.add(capsule);
 const profile=[];for(let i=0;i<=22;i++){const t=i/22*Math.PI/2;profile.push(new THREE.Vector2(.34*Math.sin(t),.97-.34*(1-Math.cos(t))));}profile.push(new THREE.Vector2(.34,0),new THREE.Vector2(.316,0),new THREE.Vector2(.316,.63));for(let i=21;i>=0;i--){const t=i/22*Math.PI/2;profile.push(new THREE.Vector2(.316*Math.sin(t),.95-.32*(1-Math.cos(t))));}
 const shellGeo=new THREE.LatheGeometry(profile,64);
 const shellMat=new THREE.MeshPhysicalMaterial({color:'#e9d9d4',roughness:.18,metalness:.27,clearcoat:1,iridescence:.55,iridescenceThicknessRange:[190,350],side:THREE.DoubleSide});
 const glassMat=new THREE.MeshPhysicalMaterial({color:'#99bdbb',roughness:.11,metalness:.18,clearcoat:1,transmission:.38,thickness:.08,iridescence:.75,iridescenceThicknessRange:[220,420],side:THREE.DoubleSide});
 const topHalf=new THREE.Group(),bottomHalf=new THREE.Group();topHalf.add(new THREE.Mesh(shellGeo,shellMat));bottomHalf.add(new THREE.Mesh(shellGeo,glassMat));bottomHalf.rotation.z=Math.PI;capsule.add(topHalf,bottomHalf);
 const gold=new THREE.MeshPhysicalMaterial({color:'#e3be86',metalness:.8,roughness:.18,clearcoat:1,side:THREE.DoubleSide});
 for(const half of [topHalf,bottomHalf]){const lip=new THREE.Mesh(new THREE.TorusGeometry(.326,.009,8,64),gold);lip.rotation.x=Math.PI/2;half.add(lip);}
 const engraving=new THREE.Mesh(new THREE.TorusGeometry(.21,.004,8,64),gold);engraving.rotation.x=Math.PI/2;engraving.position.y=.87;topHalf.add(engraving);
 const seed=new THREE.Group();capsule.add(seed);
 const core=new THREE.Mesh(new THREE.SphereGeometry(.16,32,24),new THREE.MeshPhysicalMaterial({color:'#efcc8d',metalness:.58,roughness:.13,clearcoat:1,emissive:'#b18649',emissiveIntensity:.3}));seed.add(core);
 for(let i=0;i<3;i++){const ribbon=new THREE.Mesh(tideRibbon(.33+i*.06,.115,1,i*.7),i===1?glassMat:gold);ribbon.rotation.set(i*.9,i*.6,i*.4);seed.add(ribbon);}
 const orbit=new THREE.Group();capsule.add(orbit);const gems=[];
 const gemGeo=new THREE.SphereGeometry(.045,16,12),gemMat=new THREE.MeshPhysicalMaterial({color:'#e9d7ca',metalness:.28,roughness:.16,clearcoat:1,iridescence:1,iridescenceThicknessRange:[160,460]});
 for(let i=0;i<15;i++){const gem=new THREE.Mesh(gemGeo,gemMat);const t=i/15*Math.PI*2;gem.position.set(Math.cos(t)*(.70+(i%3)*.14),Math.sin(t)*(.48+(i%3)*.11),Math.sin(t*2)*.3);gem.scale.setScalar(.6+(i%4)*.22);orbit.add(gem);gems.push(gem);}
 const halo=new THREE.Group();capsule.add(halo);
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.9+i*.15,.0028,5,160),gold);ring.rotation.set(.18+i*.26,.24+i*.30,0);halo.add(ring);}
 let settle=.6;
 function updateCapsule(time,opening,selection,dt,still){
  const goal=selection===0?.95:selection===1?1.38:.18;settle=still?goal:THREE.MathUtils.lerp(settle,goal,1-Math.exp(-4*dt));
  topHalf.position.set(-settle*.16,.04+settle*.65,0);topHalf.rotation.z=-settle*.12;
  bottomHalf.position.set(settle*.16,-settle*.65,0);bottomHalf.rotation.z=Math.PI+settle*.12;
  seed.rotation.set(time*.08,time*.16,.22);seed.scale.setScalar(.55+settle*.6);
  orbit.rotation.z=time*.07;orbit.scale.setScalar(.65+settle*.35);halo.rotation.y=Math.sin(time*.1)*.2;halo.scale.setScalar(.9+settle*.12);
  capsule.rotation.y=.1+Math.sin(time*.12)*.1;
 }
 const sculpture=new THREE.Group();scene.add(sculpture);
 const tidal=new THREE.Group();sculpture.add(tidal);
 const colors=['#dfb4af','#cfbce2','#b9d6d0'];
 for(let i=0;i<3;i++){
  const material=new THREE.MeshPhysicalMaterial({color:colors[i],metalness:.74,roughness:.17,clearcoat:1,clearcoatRoughness:.12,iridescence:.85,iridescenceThicknessRange:[180+i*60,450+i*70],side:THREE.DoubleSide});
  const ribbon=new THREE.Mesh(tideRibbon(1.05+i*.20,.32+i*.025,1,i*1.7),material);ribbon.rotation.set(.12+i*.20,-.1+i*.16,i*.38);tidal.add(ribbon);
 }
 const heroBottle=bottle.clone(true);heroBottle.scale.setScalar(.58);heroBottle.position.set(0,-.73,.12);heroBottle.rotation.z=-.08;sculpture.add(heroBottle);
 const droplets=new THREE.Group();sculpture.add(droplets);
 for(let i=0;i<14;i++){const t=i/14*Math.PI*2,g=new THREE.Mesh(new THREE.SphereGeometry(.06+(i%3)*.025,16,12),gemMat);g.position.set(Math.cos(t)*1.95,Math.sin(t)*1.5,Math.sin(t*2)*.6);droplets.add(g);}
 function updateFlow(time){tidal.rotation.set(.1+Math.sin(time*.13)*.045,.18+Math.sin(time*.11)*.12,Math.sin(time*.08)*.06);droplets.rotation.z=time*.024;heroBottle.position.y=-.73+Math.sin(time*.35)*.045;}
 return {capsule,topHalf,bottomHalf,grains:orbit,marineForm:seed,updateCapsule,sculpture,updateFlow};
}
