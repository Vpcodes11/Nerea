import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

// Reproduce the reference's baked UDIM color plus a fully blurred HDR contribution.
// The original rock shader has no direct lights, fog, tone mapping, or color conversion.
export async function createReferenceMountainMaterial(renderer, atlas1, atlas2, isDisposed = () => false) {
  const generator = new THREE.PMREMGenerator(renderer);
  generator.compileEquirectangularShader();
  let hdr, environment;
  try {
    hdr = await new HDRLoader().loadAsync('/reference-rock/space-v11.hdr');
    if (isDisposed()) return null;
    environment = generator.fromEquirectangular(hdr);
  } catch (error) {
    environment?.dispose();
    throw error;
  } finally {
    hdr?.dispose();
    generator.dispose();
  }

  for (const atlas of [atlas1, atlas2]) {
    atlas.colorSpace = THREE.NoColorSpace;
    atlas.flipY = false;
    atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping;
    atlas.needsUpdate = true;
  }

  const image = environment.texture.image;
  const maxMip = Math.log2(image.height) - 2;
  const material = new THREE.ShaderMaterial({
    name: 'Reference mountain diffuse and environment',
    defines: {
      ENVMAP_TYPE_CUBE_UV: '',
      CUBEUV_TEXEL_WIDTH: (1 / image.width).toPrecision(16),
      CUBEUV_TEXEL_HEIGHT: (1 / image.height).toPrecision(16),
      CUBEUV_MAX_MIP: maxMip.toFixed(1)
    },
    uniforms: {
      referenceAtlas1: { value: atlas1 },
      referenceAtlas2: { value: atlas2 },
      referenceEnvironment: { value: environment.texture },
      // This world turns the source mountain and camera by PI around Y.
      referenceEnvironmentRotation: {
        value: new THREE.Matrix3().set(-1, 0, 0, 0, 1, 0, 0, 0, -1)
      }
    },
    vertexShader: `
      varying vec2 referenceUv;
      varying vec3 referenceViewNormal;
      void main() {
        referenceUv = uv;
        referenceViewNormal = normalMatrix * normal;
        float s = sin(0.7), c = cos(0.7);
        referenceViewNormal.xy = mat2(c, -s, s, c) * referenceViewNormal.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #include <common>
      #include <cube_uv_reflection_fragment>
      uniform sampler2D referenceAtlas1;
      uniform sampler2D referenceAtlas2;
      uniform sampler2D referenceEnvironment;
      uniform mat3 referenceEnvironmentRotation;
      varying vec2 referenceUv;
      varying vec3 referenceViewNormal;
      void main() {
        vec3 bakedColor = referenceUv.x < 1.0
          ? texture2D(referenceAtlas1, referenceUv).rgb
          : texture2D(referenceAtlas2, referenceUv - vec2(1.0, 0.0)).rgb;
        vec3 worldNormal = inverseTransformDirection(normalize(referenceViewNormal), viewMatrix);
        worldNormal = referenceEnvironmentRotation * worldNormal;
        vec3 environmentLight = textureCubeUV(referenceEnvironment, worldNormal, 1.0).rgb;
        gl_FragColor = vec4(min(bakedColor + environmentLight * 0.5, vec3(1.0)), 1.0);
      }
    `,
    lights: false,
    fog: false,
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    transparent: false
  });

  let disposed = false;
  return {
    material,
    dispose() {
      if (disposed) return;
      disposed = true;
      material.dispose();
      environment.dispose();
    }
  };
}
