# Verification — 7 October 2026

## Continuous camera zoom through clouds

This revision supersedes the camera hold and curtain timing in the previous cloud-transition section.

- Restored visible camera travel from the first scroll: a continuous early dolly eases into the existing left arc, reaching the coast at progress 1. The camera no longer waits for full coverage to move. First-scene framing and the actual reference cliff are preserved.
- Clouds gather from .10 through .88 and fully cover the viewport only at .88–.94, then clear by 1. First copy fades .32–.68; second copy appears .955–1. Chapter-two links land on the clear coastal scene. Soft feathering removes hard boundaries at the curtain's texture edges.
- Normal scroll smoothing is restored through the visible zoom. The rate bound applies only inside the final opaque interval and its entry, in either direction. Reduced motion explicitly bypasses the curtain and retains exact chapter compositions.
- Production build passes. Desktop native scroll verified the camera at approximately z=8.00 at .20, z=5.25 at .40 and z=.05 at .65, compared with z=9.15 at the opening. Visible close-ups precede full coverage. Full coverage checked at .92 with all copy at opacity zero, followed by a clear coast at 1. Reverse scroll returned from the coast through coverage and back to the close-up at .40. The manual motion toggle retained a clear coast at its stable progress-1 composition.
- Phone 390 × 844 verified an early zoom at .20 (camera z=11.92 versus its opening z=13.30), late full coverage around .90 and a clear chapter-link destination at 1. No horizontal overflow or checked browser console warnings/errors. Observed around 60fps in this browser; physical devices can differ.
- Current captures: artifacts/moving-cloud-start.png, moving-cloud-early-zoom.png, moving-cloud-mid-zoom.png, moving-cloud-approach.png, moving-cloud-covered.png, moving-cloud-ocean.png, moving-cloud-phone-zoom.png and moving-cloud-phone-covered.png.

## First chapter cloud transition

- A dedicated screen-filling curtain uses the existing reference smoke mask. Ten sweeping cloud masses blend into an opaque textured interior from progress .50–.76, then clear around the center to reveal the coast. No extra image downloads, texture loaders or ray marching are introduced. The idle opening hides the curtain pass entirely.
- First chapter camera travel now runs from .50–.74, entirely inside full coverage. Opening framing and the actual reference cliff are preserved. First copy fades before coverage; second copy starts appearing at .86 and is fully readable by .98. Hidden copy is inert and cannot leak through the focus opacity rule.
- Progress is bounded through this bank in both directions, including fast jumps. Source review simulated 0→3 and 3→0 at the capped 50ms frame step: both pass through at least five fully covered frames. Reduced motion snaps to stable chapter endpoints and omits the sweep.
- Production build passes. Native desktop scroll checked the incoming bank at .36, full coverage at .6156, the reveal at .8878 and the clear coast at 1.1278. Reverse scroll returned through full coverage at .5678, then reached the original opening. All chapter copy had opacity zero inside the bank.
- Phone 390 × 844 checked: full coverage at .5593 and clear coast at 1.0796, with no horizontal overflow. Observed around 60fps in this browser; physical devices can differ. No console warnings/errors in the checked session. Curtain resources are disposed with the atmosphere, borrow its mask and are excluded from depth captures and reflection cameras.
- Chapter-two link navigation also reached full coverage at .6026 with all copy hidden. The manual motion toggle held progress at 1.0000 with unchanged camera/metrics between observations; re-enabling motion restored the reversible journey. The final idle opening uses the original 19 draw calls, with no extra curtain pass.
- Proof captures: artifacts/cloud-wipe-start.png, cloud-wipe-enter.png, cloud-wipe-covered.png, cloud-wipe-reveal.png, cloud-wipe-ocean.png, cloud-wipe-reverse.png and the phone captures. Opening fallback posters remain accurate because the opening composition is unchanged.

## Current reference cliff revision

This section supersedes earlier small-plinth opening descriptions and opening performance figures.

- Replaced the generic opening boulder and three foreground shards with the Organimo reference's actual mountain mesh, including its carved steps and surrounding peaks. Source geometry is unchanged: 33,894 vertices and 64,383 triangles. Both original 2048px diffuse atlases and the original space-v11 HDR environment are bundled in public/reference-rock; ownership/provenance is recorded in SOURCE.json.
- The cliff's material follows the reference raw atlas color plus .5 rough HDR contribution, without standard direct lights, purple tint, fog or ACES on the rock. A shared Basis loader handles the smoke and mountain atlases. Material/environment resources and late loading are guarded on route disposal.
- Desktop opening lens uses the reference 100mm focal length / 100 film gauge calculation (31.418° vertical FOV at 1280 × 720), with its shallow view angle. The cliff is rotated into this world's forward route, scaled uniformly and placed to match the large foreground framing. The NERÉA jar remains original and sits within the peaks. Phone framing and the product studio retain their own lens.
- Water stays hidden in the initial cliff composition and fades in during travel, preserving the cliff below the frame. Other chapter compositions retain their previous route/lens after the transition.
- Production build and reference shader compile pass. Fresh checked browser logs contain no errors or warnings. Desktop 1280 × 720, phone 390 × 844 and short phone 320 × 568 reviewed; no horizontal overflow, headline/controls fit. Opening observed around 60 fps in this browser, roughly 214K desktop / 150K phone triangles with the exact source geometry; physical devices can differ.
- Native scrolling passed the enlarged cliff at progress .51 near (-.74, 1.90, 5.22). The coast remained readable with the specimen and water restored. Home → product removed its canvas, and returning rebuilt the scene without warnings/errors. Static view showed zero canvases and a loaded 1280px refreshed poster. Current screenshots: artifacts/reference-cliff-desktop.jpg and reference-cliff-phone.jpg. Matching static fallback posters refreshed from this revision.

## Latest opening composition and performance

This section supersedes the cloud counts and performance observations in earlier revisions below.

- Replaced the repetitive 543-wisp arch/belt with 372 spatial wisps: 110 foreground, 96 distant and 166 elevated. Asymmetric banks, varied horizontal proportions and individual height fades retain broad opening coverage with less repetition. Cooler shading uses the mask gradient for light variation. Cloud planes now render once per frame rather than separate front/back passes.
- Reduced the central plinth and foreground shards, restrained the jar lean, and seated its curved bottom lip against ray intersections with the actual scanned surface. A narrower right aside and more headline margin keep copy clear of the rock.
- Calm water reuses reflection renders between refreshes at up to 30 Hz. Camera movement and captures refresh immediately. The cloud depth pass includes depth-writing meshes, excluding points and translucent rays/bubbles. Hidden capsule/flow animation and temporary frame allocations are removed.
- Animation callbacks stop when hidden, inactive or motion is reduced. Native motion-toggle checks showed an unchanged camera/metrics between reduced-motion observations; chapter links and capsule selection still redraw. Re-enabling motion resumes the scene.
- Production build passes. At the checked 1080 × 810 desktop opening, reuse frames observed 26 draw calls / 229,482 triangles; reflection frames observed 36 calls / 341,170 triangles. Settled browser readings were around 60 fps. These are conditional per-frame counts, not a claim of a global percentage speedup or physical-device performance.
- Phone 390 × 844 and short phone 320 × 568 reviewed: no horizontal overflow, canvas fills the viewport, product/headline/controls fit. The checked phone opening observed 24 calls / 81,482 triangles on reuse frames and 37 calls / 123,202 triangles on reflection frames.
- Native wheel travel through the cloud field reached progress .53 near (-1.56, 2.39, 4.15), with continuous perspective and reflection refreshes. The coastal specimen remains alpha-occluded and its story readable. No console errors/warnings in the checked session.
- Matching desktop/mobile static posters refreshed. Static view checked with zero canvases and loaded 1280px desktop / 390px phone images. Current proof: artifacts/optimized-arrival-desktop.jpg and artifacts/optimized-arrival-phone.jpg.

## Latest immersive opening

- Fixed the sea-level height cutoff that kept all clouds below the upper sky. The opening now combines 315 lower/distant wisps with 228 elevated wisps in seven banks, plus a local 4K photographic cloud canopy. Upper banks have no sea-height fade.
- Reduced the foreground rock height, moved and tilted the jar, and refined warm key/cool rim lighting and the softbox environment. Relaxed headline tracking and adjusted desktop/phone composition.
- Stronger desktop pointer parallax and subtle idle camera motion verified. Native scrolling moved the camera into the cloud field at progress .52, around (-1.49, 2.39, 4.48); the route remains spatial and continuous.
- Moved readability fades to the fixed world layer so they remain continuous as chapter frames scroll away. Coastal cutout depth and underwater fades remain supported.
- Production build passes. The latest inspected browser console has no errors or warnings. Settled desktop opening observed around 60 fps and 342K triangles in this browser, with occasional 30 fps during concurrent preview activity; physical devices can differ.
- Reviewed at 1080 × 810 (matching the supplied screenshot), 390 × 844 and 320 × 568. No horizontal overflow; the jar, headline and controls remain visible. Manual reduced motion holds a stable camera pose and cloud time. Phone opening observed about 124K triangles.
- Scroll transition rechecked after moving the shading to the fixed world layer: the horizontal edge caused by the departing chapter frame is removed. The coastal chapter remains readable and its specimen stays properly occluded against clouds.
- Desktop/mobile fallback posters refreshed from the new cloud composition. Static mode shows zero canvases and a loaded portrait poster. New proof: artifacts/cloud-cove-desktop.jpg, cloud-cove-phone.jpg and cloud-cove-transition.jpg.

## Latest coastal redesign

This section supersedes the earlier ocean and cloud visual checks below.

- Removed the pink tree/sphere, pearl shell, wooden steps and suspended rocks from the ocean chapter. Replaced them with original detailed wrack artwork on a gently curved surface, supporting 3D fronds and grounded shoreline stones, a warm dawn palette, softer water reflections and a new editorial story.
- Added a dedicated opening cloud volume: 180 close tilted wisps surround the crag from the first composition; 135 distant wisps continue the atmosphere along the shore. Alpha-shaped portrait depth prevents distant clouds from drawing over the leaves. Height fades keep coastal mist below the canopy.
- Desktop 1280 × 720, phone 390 × 844 and short phone 320 × 568 reviewed. No horizontal overflow in checked views. Phone framing keeps the specimen above the story; a soft foreground fade improves text contrast. Navigation colors adapt to the lighter coast.
- Manual reduced motion holds the camera and specimen animation. Latest settled coastal checks observed about 60 fps and 110K triangles in this browser; physical devices can differ.
- Production build passes. Latest checked browser console has no errors or warnings. Vite retains its generic advisory for the large Three.js library chunk.
- Original transparent artwork and exact prompt are recorded in COASTAL_ASSET.md. Local WebP is 608,770 bytes; its 1448 × 1086 alpha channel is preserved.
- Matching desktop/phone opening posters refreshed. Static mode verified with zero canvases and a successfully loaded portrait poster. Final visual checks are saved as artifacts/coastal-opening-desktop.jpg, coastal-origin-desktop.jpg and coastal-origin-phone.jpg.



This report describes the current connected 3D revision. It supersedes the earlier image-backplate prototype.



- Production build passes. Three.js is lazy-loaded: 547.51 KB / 138.68 KB gzip, with Vite's generic 500 KB chunk advisory. UI and addons are separate chunks.

- Real spatial camera route verified with native wheel input and chapter links. An intermediate dive pose at progress 1.6 moved the camera to approximately (1.01, 0.05, -15.98); reverse scrolling returns through the same environment.

- Desktop 1280 × 720, phone 390 × 844 and short phone 320 × 568 reviewed. Capsule and final sculpture have separate phone framing. No horizontal overflow in checked views.

- Keyboard End selects the third capsule detail with one exposed panel. Manual reduced motion holds stable camera poses. System preference is supported in code; OS settings were not separately emulated.

- Matching desktop/mobile posters and product studio image exported from current geometry. Static mode verified at 320 × 568: zero canvases, loaded portrait poster and all three detail panels visible.

- Product ocean gallery loads the new poster. Add/remove demo bag checked; bag returned to empty. Pack pricing, demo checkout and journal routes passed earlier and are unchanged.

- Leaving the homepage removes its canvas; returning creates the new scene. A fresh production tab and homepage → product → homepage navigation show no console errors or warnings after repairing premature texture uploads.

- High and low detail ocean rock GLBs pass glTF validation with zero errors and warnings; model reports and source metadata are saved locally.

- Observed roughly 60 fps in settled checked views. Desktop reef around 298K triangles; short phone reef around 133K and final around 187K. These are this browser's measurements, not guarantees for physical devices.

- Rendering pauses when hidden or past the journey. Initialization timeout, renderer failure and context loss have poster fallback handlers; unsupported GPU hardware and forced context loss were not tested separately.



Saved visual checks: artifacts/nerea-3d-hero.jpg, nerea-3d-ocean.jpg, nerea-3d-underwater.jpg and nerea-3d-phone-final.jpg.



NERÉA is a fictional concept. No live payments or orders are connected.



## Archived cloud-sprite revision (superseded)



- Added 24 spatial cloud/mist layers using one shared 1024 × 409 cloud texture, a mirrored variant and a small procedural vapor texture. Cloud WebP preserves transparency and is about 104 KB.

- Reviewed night hero and pink ocean on desktop and the hero/reef on 390 × 844 phone. No horizontal overflow in these checked views.

- Clouds reflect in the water, drift gently, retain depth occlusion against the rocks and fade out during the underwater dive. Soft shader fades remove hard sprite edges and soften the sea-level intersection.

- Manual reduced motion holds the cloud drift still. Cloud resources and late texture loads are released on route teardown.

- Production build passes. No browser console errors or warnings during checked views. Observed around 60 fps in settled desktop/phone checks; performance varies with concurrent GPU previews.

- Desktop and phone fallback posters refreshed. New screenshots: artifacts/nerea-clouds-hero.jpg, nerea-clouds-ocean.jpg and nerea-clouds-phone.jpg.



## Archived photographic atmosphere and capsule revision (superseded)

- Replaced repeated generated cloud cards with two local CC0 photographed sky panoramas. Added a soft horizon blend and four low coastal mist volumes, rendered from a shared 64³ density field with scene-depth occlusion. Mist freezes with reduced motion and fades during the dive.
- Rebuilt the capsule with slim thick-walled pearl and sage halves, fine joining lips, a small leaf mark, contained granules, and original forked ribbon fronds. Revised all three stories and synchronized the shell/frond animation to the selected story.
- Desktop 1280 × 720, phone 390 × 844 and short phone 320 × 568 reviewed. Capsule remains above mobile copy; no horizontal overflow. Keyboard End reveals only the third panel; Home returns to the first. Closed and open model states visually reviewed.
- Chapter links now use the existing navigation handler without rebuilding the scene. Manual reduced motion holds stable camera and density drift.
- Production build passes. Latest settled desktop capsule observed around 340K triangles and phone around 176K; observed 60 fps in these checks, with occasional 30 fps in sky views while multiple GPU previews were active. These are local browser observations.
- Desktop/phone fallback posters refreshed from the new atmosphere. New proof images: artifacts/nerea-natural-clouds-hero.jpg, nerea-natural-clouds-ocean.jpg, capsule-redesign-desktop.jpg and capsule-redesign-phone.jpg.

- Final 4K photographed sources converted locally. Static mode verified again: zero canvases, portrait poster loaded, all three detail stories exposed. Homepage → product removes its canvas; return restores the scene. Latest browser log inspection shows no errors or warnings. Final screenshots use the *-final.jpg suffix.


## Current revision — reference cloud sea and new chapter art

This section supersedes the earlier cloud, photographic-sky and capsule visual checks above.

- Recreated the reference's cloud treatment with its compressed smoke mask and 285 moving spatial wisps. The previously generated cumulus sprite, photographic skies and ray-marched mist are not loaded. Clouds soften against opaque scene depth, reflect in the water, pause with reduced motion and fade during the dive.
- Entirely new capsule installation: pearlescent/sea-glass halves, an original folded golden tide seed, fine orbital rings and mineral droplets. Three rewritten stories change the composition. Replaced the final gold emblem with twisting iridescent tidal ribbons around the jar; the camera rises from the canyon to the cloud-covered ocean.
- Desktop 1280 × 720, phone 390 × 844 and short phone 320 × 568 visually checked. Expanded capsule clears mobile copy. No horizontal overflow in checked views. Short-phone final heading has extra clearance above its description.
- Keyboard End exposes only the third capsule story; Home returns to the first. Manual reduced motion holds the camera and animation. Source supports the system preference.
- Latest browser console shows no errors/warnings during checked views. Settled local views observed about 60 fps, with desktop hero around 376K triangles and short-phone capsule around 141K. Performance varies by device.
- Production build passes with Vite's generic large-Three.js-chunk advisory. Cloud and model readiness gate the first frame; stale loads and renderer resources are released on teardown.

- Matching desktop/mobile cloud posters refreshed. Static mode confirmed zero canvases and all three new story panels. Final proof images: artifacts/tide-clouds-desktop.jpg, tide-clouds-ocean.jpg, tide-capsule-desktop.jpg, tide-flow-desktop.jpg and phone counterparts.
