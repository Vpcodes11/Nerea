import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original flattened, forked fronds: a sculptural study of marine growth.
export function buildMarineForm(){
  const group=new THREE.Group(),parts=[],veins=[];
  let seed=1913;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  function frond(start,angle,length,width,depth,z){
    const end=start.clone().add(new THREE.Vector3(Math.sin(angle)*length,Math.cos(angle)*length,z));
    const mid=start.clone().lerp(end,.5);mid.x+=Math.sin(angle*3+z)*.045;mid.z+=.045;
    const curve=new THREE.QuadraticBezierCurve3(start,mid,end),vertices=[],uvs=[],indices=[],across=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1);
    for(let i=0;i<=14;i++){
      const t=i/14,center=curve.getPoint(t),tangent=curve.getTangent(t);across.crossVectors(tangent,forward).normalize();
      const spread=width*(.72+.28*Math.sin(t*Math.PI))*(1-t*.20);
      for(let j=0;j<5;j++){
        const side=j/4*2-1,p=center.clone().addScaledVector(across,side*spread);
        p.z+=Math.cos(side*Math.PI/2)*.018+Math.sin(t*7+angle)*.015*side;
        vertices.push(p.x,p.y,p.z);uvs.push(j/4,t);
      }
    }
    for(let i=0;i<14;i++)for(let j=0;j<4;j++){const n=i*5+j;indices.push(n,n+1,n+5,n+1,n+6,n+5);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();parts.push(geometry);
    veins.push(new THREE.TubeGeometry(curve,12,.0025,4,false));
    if(depth)for(const side of [-1,1])frond(end,angle+side*(.38+random()*.18),length*.69,width*.75,depth-1,(random()-.5)*.08);
  }
  for(const angle of [-.56,-.18,.20,.59])frond(new THREE.Vector3(0,-.33,0),angle,.24,.044,3,(random()-.5)*.1);
  const geometry=mergeGeometries(parts),veinGeometry=mergeGeometries(veins);parts.forEach(g=>g.dispose());veins.forEach(g=>g.dispose());
  const material=new THREE.MeshPhysicalMaterial({color:'#758f72',roughness:.38,metalness:.03,clearcoat:.55,clearcoatRoughness:.3,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 frondPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nfrondPoint=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 frondPoint;').replace('#include <color_fragment>','#include <color_fragment>\nfloat marbling=sin(frondPoint.y*42.+sin(frondPoint.x*25.)*2.)*.08;diffuseColor.rgb*=.93+marbling;');
  };
  group.add(new THREE.Mesh(geometry,material),new THREE.Mesh(veinGeometry,new THREE.MeshStandardMaterial({color:'#afbd92',roughness:.48})));
  group.rotation.set(.1,-.18,-.15);return group;
}
