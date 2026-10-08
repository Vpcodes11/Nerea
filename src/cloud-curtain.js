import * as THREE from 'three';

// A screen-filling pass through cloud that clears at the coastal chapter.
// The borrowed smoke texture is owned and disposed by the spatial atmosphere.
export function buildCloudCurtain(scene) {
  let disposed = false;
  let mainCamera;
  let depthVisible;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    cloudMask: {value: null},
    progress: {value: 0},
    time: {value: 0},
    aspect: {value: 1},
    cameraVisible: {value: 1},
    night: {value: new THREE.Color('#9894a6')},
    dawn: {value: new THREE.Color('#e3dad7')},
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    forceSinglePass: true,
    fog: false,
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0., 1.);
      }
    `,
    fragmentShader: `
      uniform sampler2D cloudMask;
      uniform float progress, time, aspect, cameraVisible;
      uniform vec3 night, dawn;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                   mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
      }
      float puff(vec2 center, float size, float angle, vec2 travel,
                 float arrival, float departure, float phase) {
        center += travel * (1. - arrival + departure * 1.15);
        center += vec2(sin(time * .031 + phase), cos(time * .027 + phase)) * .008;
        vec2 q = (vUv - center) * vec2(aspect, 1.);
        float c = cos(angle), s = sin(angle);
        q = mat2(c, -s, s, c) * q / size + .5;
        vec2 feather = smoothstep(vec2(0.), vec2(.08), q)
          * (1. - smoothstep(vec2(.92), vec2(1.), q));
        float mask = texture2D(cloudMask, clamp(q, 0., 1.)).r;
        return smoothstep(.015, .58, mask) * feather.x * feather.y;
      }

      void main() {
        if (cameraVisible < .5 || progress <= .10 || progress >= 1.) discard;
        float arrival = smoothstep(.10, .88, progress);
        float departure = smoothstep(.94, 1.00, progress);
        float life = smoothstep(.10, .76, progress) * (1. - departure);
        float drift = time * .004;
        // Ten distinct, overlapping masses sweep in from both sides and below.
        // Shapes keep their proportions on portrait and wide screens.
        float a = puff(vec2(.08, .20), 1.38, -.25, vec2(-.98, -.38), arrival, departure, .3);
        float b = puff(vec2(.25, .69), 1.24, .52, vec2(-.80, .48), arrival, departure, 1.1);
        float c = puff(vec2(.44, .15), 1.16, -.67, vec2(-.30, -.96), arrival, departure, 2.3);
        float d = puff(vec2(.73, .27), 1.42, .38, vec2(1.08, -.50), arrival, departure, 3.7);
        float e = puff(vec2(.94, .70), 1.34, -.48, vec2(1.0, .37), arrival, departure, 5.2);
        float f = puff(vec2(.56, .87), 1.17, .81, vec2(.36, .97), arrival, departure, 6.1);
        float g = puff(vec2(.29, .42), .92, .18, vec2(-.94, -.19), arrival, departure, 2.7);
        float h = puff(vec2(.63, .48), 1.03, -.36, vec2(.97, .16), arrival, departure, 4.6);
        float i = puff(vec2(.85, .06), 1.19, .69, vec2(.70, -.84), arrival, departure, 1.8);
        float j = puff(vec2(.06, .97), 1.31, -.83, vec2(-.76, .70), arrival, departure, 5.9);
        float density = a + b + c + d + e + f + g + h + i + j;
        float texturedAlpha = (1. - exp(-density * 1.9)) * life;

        // An opaque, textured interior guarantees no world pixels leak through
        // at the end of the approach, including the corners of ultrawide views.
        float interior = smoothstep(.80, .88, progress) * (1. - departure);
        float radius = length((vUv - vec2(.5)) * vec2(aspect, 1.));
        float opening = departure;
        float clearCenter = 1. - smoothstep(opening * 1.3 - .15, opening * 1.3 + .18, radius);
        interior *= 1. - clearCenter * smoothstep(.94, .99, progress);
        float alpha = max(texturedAlpha, interior);
        if (alpha < .002) discard;

        // Two broad samples retain cloudy variation when we are inside the
        // bank; fine procedural variation softens the repeated sprite shapes.
        vec2 interiorUv = (vUv - .5) * vec2(min(aspect, 1.7), 1.) * .48 + .5;
        float broad = texture2D(cloudMask, clamp(interiorUv + vec2(drift, -drift) * .1, .04, .96)).r;
        float detail = texture2D(cloudMask, clamp(vec2(1. - interiorUv.y, interiorUv.x) + vec2(-.06, .09), .04, .96)).r;
        vec2 grainUv = vUv * vec2(aspect, 1.) * 5. + vec2(drift, -drift * .6);
        float grain = noise(grainUv) * .67 + noise(grainUv * 2.13) * .33;
        float depthShade = clamp(.57 + broad * .25 + detail * .13 + grain * .09, .52, 1.0);
        float relief = (a + c + e + g + i) / max(density, .001);
        depthShade *= mix(.82, 1.03, relief);
        vec3 cloudColor = mix(night, dawn, smoothstep(.48, 1.40, progress));
        cloudColor *= depthShade;
        cloudColor += vec3(.045, .039, .043) * smoothstep(.3, .95, broad) * (1. - grain * .4);
        gl_FragColor = vec4(cloudColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'First chapter cloud curtain';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1000;
  mesh.visible = false;
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    uniforms.cameraVisible.value = !mainCamera || camera === mainCamera ? 1 : 0;
  };
  scene.add(mesh);

  return {
    setTexture(texture) {
      if (!disposed) uniforms.cloudMask.value = texture;
    },
    update(progress, time, aspect = 1, camera) {
      if (disposed) return;
      if (camera) mainCamera = camera;
      uniforms.progress.value = THREE.MathUtils.clamp(progress, 0, 1);
      uniforms.time.value = time;
      uniforms.aspect.value = Math.max(.25, aspect);
      mesh.visible = Boolean(uniforms.cloudMask.value) && progress > .10 && progress < 1;
    },
    captureDepth(hide) {
      if (hide) {
        depthVisible = mesh.visible;
        mesh.visible = false;
      } else if (depthVisible !== undefined) {
        mesh.visible = depthVisible;
        depthVisible = undefined;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
