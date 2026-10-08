import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A hand-shaped seaweed herbarium, built from individual cut blades instead of an image plane.
export function buildCoastalGarden(scene, stoneMaterial) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Tidal herbarium';
  scene.add(rootGroup);
  const geometries = new Set(), materials = new Set(), specimens = [];
  let seed = 38471, disposed = false;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const keepGeometry = geometry => (geometries.add(geometry), geometry);
  const keepMaterial = material => (materials.add(material), material);
  const stone = keepMaterial(stoneMaterial?.clone() || new THREE.MeshStandardMaterial());
  stone.color.set('#5d6460');
  stone.roughness = .98;
  const stoneGeometry = keepGeometry(new THREE.IcosahedronGeometry(1, 3));
  const position = stoneGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const grain = 1 + Math.sin(x * 8.1 + z * 4.7) * .06 + Math.sin(y * 13.4 - z * 7.3) * .025;
    position.setXYZ(i, x * grain, y * grain, z * grain);
  }
  stoneGeometry.computeVertexNormals();
  for (const [xyz, scale, yaw] of [
    [[3.45,-1.14,-22.5],[1.56,.68,1.1],-.3],
    [[4.72,-1.27,-23.35],[1.10,.43,.95],.7],
    [[2.48,-1.39,-21.12],[.74,.39,.70],1.1]
  ]) {
    const rock = new THREE.Mesh(stoneGeometry, stone);
    rock.position.set(...xyz); rock.scale.set(...scale); rock.rotation.y = yaw;
    rock.castShadow = rock.receiveShadow = true;
    rootGroup.add(rock);
  }

  const pigments = ['#625f42','#767052','#4d5d53','#898064','#575942'];
  const bladeMaterial = keepMaterial(new THREE.MeshStandardMaterial({
    vertexColors:true, side:THREE.DoubleSide, roughness:.83, metalness:.025
  }));
  const stemMaterial = keepMaterial(new THREE.MeshStandardMaterial({color:'#454b3c',roughness:.92}));
  const holdfastMaterial = keepMaterial(new THREE.MeshStandardMaterial({color:'#3b453b',roughness:.95}));
  const bladderMaterial = keepMaterial(new THREE.MeshStandardMaterial({color:'#8e825d',roughness:.68}));
  const bladderGeometry = keepGeometry(new THREE.SphereGeometry(1,8,6));

  function specimen(origin, length, lean, spread, pigment, phase) {
    const group = new THREE.Group();
    group.position.set(...origin);
    rootGroup.add(group);
    const bladePieces = [];
    const color = new THREE.Color(pigments[pigment]);
    const branch = (start, direction, height, width, depth) => {
      const end = start.clone().add(new THREE.Vector3(
        Math.sin(direction) * height,
        Math.cos(direction) * height,
        (random()-.5) * height * .38
      ));
      const control = start.clone().lerp(end,.55);
      control.x += Math.cos(direction) * height * .13;
      control.z += .14 * height;
      const curve = new THREE.QuadraticBezierCurve3(start,control,end);
      const stem = new THREE.Mesh(keepGeometry(new THREE.TubeGeometry(curve,7,Math.max(.007,width*.13),4,false)),stemMaterial);
      group.add(stem);
      const points=[], colors=[], indices=[];
      const rows=12, columns=4;
      for(let i=0;i<=rows;i++) {
        const t=i/rows, center=curve.getPoint(t), tangent=curve.getTangent(t);
        const side=new THREE.Vector3(tangent.y,-tangent.x,.12).normalize();
        const breadth=width*Math.pow(Math.sin(Math.PI*t),.7)*(1+.12*Math.sin(t*24+phase));
        for(let j=0;j<=columns;j++) {
          const u=j/columns*2-1;
          const cut=(Math.sin(t*31+phase*3+u*5)+Math.sin(t*53-u*3))*.012;
          const fold=Math.sin(t*10+phase+u*2)*breadth*.17;
          const p=center.clone().addScaledVector(side,u*(breadth+cut));
          p.z+=fold+Math.abs(u)*breadth*.16;
          points.push(p.x,p.y,p.z);
          const shade=color.clone().multiplyScalar(.73 + .25*(1-Math.abs(u)) + .09*Math.sin(t*17+phase));
          colors.push(shade.r,shade.g,shade.b);
        }
      }
      for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
        const n=i*(columns+1)+j;indices.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);
      }
      const blade=new THREE.BufferGeometry();
      blade.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
      blade.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      blade.setIndex(indices);blade.computeVertexNormals();bladePieces.push(blade);
      if(depth>0) {
        for(const sign of [-1,1]) {
          const fork = end.clone().addScaledVector(new THREE.Vector3(Math.sin(direction),Math.cos(direction),0),-.07*height);
          branch(fork,direction+sign*(.30+random()*.28),height*(.68+random()*.16),width*(.67+random()*.13),depth-1);
        }
        if(depth===1 && random()>.25)for(const sideSign of [-1,1]) {
          const bead=new THREE.Mesh(bladderGeometry,bladderMaterial);
          const at=curve.getPoint(.69);
          bead.position.copy(at);bead.position.x+=sideSign*width*.52;
          bead.scale.set(width*.29,width*.36,width*.21);
          group.add(bead);
        }
      }
    };
    const anchor=new THREE.Mesh(keepGeometry(new THREE.IcosahedronGeometry(.15,1)),holdfastMaterial);
    anchor.scale.set(1,.55,.8);group.add(anchor);
    branch(new THREE.Vector3(),lean,length*.42,.045*length,2);
    const joined=keepGeometry(mergeGeometries(bladePieces));
    bladePieces.forEach(piece=>piece.dispose());
    const frond=new THREE.Mesh(joined,bladeMaterial);
    frond.castShadow=frond.receiveShadow=true;
    group.add(frond);
    specimens.push({group,phase});
  }
  // The irregular stems produce a single asymmetric silhouette with visible negative space.
  specimen([3.35,-.62,-22.45],2.25,-.40,1.2,0,.4);
  specimen([3.85,-.61,-22.63],2.67,.12,1.2,1,1.1);
  specimen([4.38,-.68,-22.89],2.12,.51,1.2,3,2.2);
  specimen([3.02,-.68,-21.97],1.67,-.81,1.2,2,1.7);
  specimen([4.93,-.82,-23.28],1.41,.86,1.2,4,2.7);
  specimen([3.65,-.78,-22.16],1.22,-.16,1.2,0,3.1);
  specimens.forEach(({group})=>group.scale.setScalar(1.26));

  return {
    rootGroup,
    ready: Promise.resolve(),
    captureDepth(){},
    renderDepth(){},
    update(time,under,day,camera){
      if(disposed)return;
      rootGroup.position.x=innerWidth<700?-.8:0;
      rootGroup.visible=under<.32&&day>.32&&camera.position.z<-4&&camera.position.z>-29;
      specimens.forEach(({group,phase})=>{group.rotation.z=Math.sin(time*.19+phase)*.012;group.rotation.x=Math.sin(time*.13+phase)*.01;});
    },
    dispose(){
      if(disposed)return;disposed=true;rootGroup.removeFromParent();
      geometries.forEach(geometry=>geometry.dispose());
      materials.forEach(material=>material.dispose());
    }
  };
}
