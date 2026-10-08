# NERÉA

An original ocean-inspired brand concept with a continuous Three.js world, product gallery, demo shopping bag, and three journal articles.

See [AWWWARDS_REVIEW.md](AWWWARDS_REVIEW.md) for the current aesthetic assessment, captured evidence and improvement priorities.

## Run

Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

## Current experience

The camera passes a dark jar placed among the supplied reference's actual mountain peaks and drifting clouds, crosses muted dawn water beside a grounded coastal wrack garden, descends into a quiet stone canyon with an exploded capsule installation, then rises back above the ocean. The opening imports Organimo's mountain mesh and its two diffuse atlases, replacing the previous generic boulder. Its material follows the reference's baked diffuse and blurred HDR environment shading. The rock is rotated and uniformly scaled for NERÉA's camera route; the page retains its own jar, typography and layout. The desktop opening uses the reference's perspective relationship, then blends into the wider lens for the other chapters. Water appears during the passage into the coast, so its plane does not cut through the opening cliff. Warm product light, a cool rim light and broader environment reflections shape the jar. Pointer movement shifts the camera more strongly on desktop, with a smaller response on phones. The coastal chapter uses an original generated wrack portrait on a curved surface, supported by authored 3D fronds, small air vesicles and shoreline rocks. An editorial composition places the copy to the left of the specimen. It replaces the pink tree, glass sphere, shell, stepping stones and floating outcrops.

The final chapter reveals an original iridescent tidal ribbon sculpture surrounding the NERÉA jar. Capsule stories open the shells, expand the golden tide seed, and bring the composition back into balance.

The cloud treatment follows the supplied Organimo reference: 372 layered smoke-mask wisps, comprising 110 tilted foreground wisps, 96 low distant wisps and 166 elevated wisps in seven asymmetric banks. Varying horizontal proportions and individual height fades break up the low clouds' straight shoulder; elevated banks extend into the upper sky without a sea-level cutoff. Blue-grey directional shading, slow drift and scene depth give the clouds soft edges around rocks; the wrack portrait writes its alpha-shaped silhouette into the cloud depth pass. These are textured planes placed in the 3D scene, rather than ray-marched volumetric clouds. The reference smoke mask is bundled locally.

The opening sky also uses a 4K tone-mapped panorama from Poly Haven's [Kloppenheim 07 (Pure Sky)](https://polyhaven.com/a/kloppenheim_07_puresky), by Greg Zaal and Jarod Guest, under CC0. It supplies distant cloud detail behind the moving wisps, then fades into the authored dawn and underwater skies. The earlier generated cloud cutout, dusk panorama and ray-marched mist implementations are archived and unused.

The first scroll transition keeps the camera moving from the start: it gradually approaches the jar and cliff, arcs past them and continues toward the coast. Clouds gather throughout that visible journey and become fully opaque only near the end (.88–.94), then part as the camera reaches the coastal chapter at progress 1. The curtain shares the reference smoke mask, reverses directly with scroll, and stays out of water reflections and depth captures. Only the short opaque interval is bounded for fast scrolls; the visible zoom follows the normal scroll smoothing. Fully hidden copy is inert; reduced motion uses stable chapter compositions.

The four chapters total 475 viewport heights. Capsule details switch in place with buttons and keyboard controls. Camera framing adapts to desktop, phone and short phone screens. Rendering uses spatial culling, shared meshes, instanced coral and cached desktop shadows; the phone uses smaller rock meshes in the later chapters. The reference mountain and cloud mask share one compressed-texture loader. Calm water reuses its reflection between updates at up to 30 Hz, refreshing as the camera travels or turns. The cloud depth pass excludes transparent light rays, bubbles and points. Capsule and finale art update only while visible. System and manual reduced motion hold stable compositions. Sound is locally synthesized and starts off.

Desktop/mobile fallback posters and the product studio image are captured from the rendered scenes. Initialization failure, timeout and context loss reveal the poster; test with `/?view=static`. The animation-frame loop sleeps when hidden, inactive or holding a reduced-motion composition, and wakes for relevant layout, navigation and preference changes. Navigation releases the renderer and resources.

All runtime assets and fonts are local. Routes: `/`, `/product`, `/journal`, `/journal/<story-slug>`. Hosting must send unknown paths to index.html; Netlify configuration is included. See ASSET_PLAN.md for credits and QA.md for verification.

The demo bag supports pack and quantity changes with sample prices. No orders or payments are processed.
