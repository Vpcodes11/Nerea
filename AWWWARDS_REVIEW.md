# NERÉA — Awwwards readiness review

Reviewed 8 October 2026 against project commit `06330d7`.

**Verdict: a strong immersive prototype, but I would not submit this version for Site of the Day yet.** The opening has scale and atmosphere. The later chapters, content and supporting pages need the same level of attention, and the award version needs a more independent creative identity.

This is an independent design assessment, not an official Awwwards score or a prediction of jury voting.

## What was checked

- All four desktop chapters, the opening camera/cloud transition and capsule selections.
- Product gallery, journal index, an article and the shopping bag.
- Phone layouts at 390 × 844, including the opening, capsule, finale, product options and bag.
- Opening and capsule at 320 × 568; keyboard capsule navigation and the manual reduced-motion control.
- Source asset loading, asset provenance, metadata and the production build.

The 390px opening had no horizontal overflow. Product pack selection updated the displayed price, adding the selected pack opened the correct bag, and removing it restored the empty bag. Keyboard navigation selected the next capsule tab. No warnings or errors were captured in the inspected browser session. The production build passed; Vite reported its large-chunk advisory for Three.js.

These checks used a local Chromium browser with phone-sized viewports. They do not establish real-phone performance, Safari compatibility, deployed network speed or Core Web Vitals. No Lighthouse score is claimed.

## The award standard

Awwwards currently weights Design at 40%, Usability at 30%, Creativity at 20% and Content at 10%. Site of the Day is competitive; a particular score does not guarantee selection. [Official evaluation system](https://www.awwwards.com/about-evaluation/).

The supplied reference, Organimo, won Site of the Day on 5 April 2024 with an overall score of 7.78. Its official entry highlights product information, a benefits experience and product-page scrolling alongside the WebGL journey. My inference is that matching the complete experience is a more useful benchmark than matching its opening composition alone. [Organimo award entry](https://www.awwwards.com/sites/organimo).

## What is already working

- The large cliff, dark jar and layered clouds create a strong opening composition.
- The camera now advances with scrolling while clouds gather, cover the scene and reveal the coast. This is the strongest transition.
- The serif/sans typography pairing and restrained navigation give the interface a coherent foundation.
- The product and journal routes work, and the demo bag is clearly presented as a concept experience.
- Keyboard tabs, reduced motion and fallback posters provide useful foundations for broader usability testing.

## Improvements in priority order

| Priority | Finding | Recommended change | Completion test |
| --- | --- | --- | --- |
| 1 | The opening relies heavily on the reference's identity. The actual Organimo mountain mesh, diffuse atlases, environment texture and smoke mask are bundled and documented. | Preserve the desired monumental scale and cloud density while developing NERÉA's own setting, silhouette and visual signature. Use original or appropriately licensed production assets. | The experience is recognizably NERÉA without its wordmark, and asset provenance supports the intended release. |
| 2 | The capsule and finale emphasize decorative shells, ribbons, spheres and orbits. The interaction changes the sculpture but gives the visitor little new understanding. | Give each chapter a clear purpose in an ocean-to-daily-ritual story. Design one distinctive interaction whose result carries into the finale. Keep concept storytelling truthful; do not invent formulation, sourcing or health claims. | A visitor can explain what each chapter contributed and remember a specific interaction after leaving. |
| 3 | Visual quality varies between chapters. The coast is flattened by haze; the capsule's surfaces and thin orbital details feel less convincing; the finale repeats the orbit motif. | Unify lighting and material treatment. Improve foreground/middle/background separation, surface detail, reflections and product readability. Give the finale a clear resolution. | The four chapters feel like one directed world, with an equally convincing still frame at every endpoint. |
| 4 | Inner pages are clean but less distinctive than the opening. The label detail reuses a cropped bottle render; journal artwork is limited and the inspected article is a short text-only essay. | Create dedicated product macro views and editorial imagery, strengthen the stories, and carry the site's visual character through gallery, article and bag transitions. | Every route offers content and imagery worth exploring independently of the homepage. |
| 5 | Phone compositions fit, but the small interface compromises comfort. Motion/sound labels measured 6px; inactive chapter links measured about 14 × 31px; the menu button measured 24 × 28px. Some footer controls are faint over the bright finale. | Increase readable control text and touch areas, strengthen contrast across all scene colors and check focus visibility. A roughly 44px touch area is a practical design target, not a claim about an award threshold. | Controls are easy to read and use on physical phones without precision tapping; focus remains visible in every chapter. |
| 6 | Scene readiness waits for assets used later in the journey. Both rock detail levels load before the reference mountain, followed by its environment map. The environment file alone is 3.55 MiB; the high-detail scanned rock is 3.15 MiB. | Prioritize opening assets, progressively load later chapters, select an appropriate model tier and reduce heavy texture payloads. Then measure the deployed build on representative phones and connections. | A convincing opening arrives quickly, camera movement stays responsive, and measured loading/frame-time results support release. |

## Scene-by-scene assessment

**Opening:** strongest composition. Keep the camera travel and cloud reveal. The next creative step is independent art direction while retaining the scale and density already requested.

**Coast:** the seaweed portrait and heavy atmospheric veil weaken the sense of a continuous physical world. Improve depth separation and the relationship between the specimen, shoreline and water. The existing generated portrait is documented as bladderwrack; clarify its role as marine inspiration rather than implying it depicts a verified product ingredient.

**Capsule:** the split form is readable, including on narrow screens, but its inner sculpture and copy are primarily decorative. A stronger discovery should connect the interaction to the brand story. Thin dotted orbits and similar glossy surfaces also need a more deliberate finish.

**Finale:** the jar surrounded by metallic ribbons provides a recognizable endpoint, but visually repeats the capsule's orbiting forms. Resolve something introduced earlier so the final call to action feels earned.

**Product and journal:** useful foundations. Dedicated photography/rendering, richer editorial layouts and specific content would raise the perceived completeness of the experience. A concept presentation can remain a concept; it needs a confident, coherent reason for every page.

## Recommended next pass

1. Define the independent NERÉA visual identity and write a one-sentence purpose for each chapter.
2. Redesign the capsule/finale as a connected story, then bring the coast and materials to the same finish as the opening.
3. Add dedicated product and editorial assets, enlarge phone controls, then measure the deployed experience on real devices.

Reassess award readiness after those changes. An additional small polish pass on the opening alone would leave the largest gaps unresolved.

## Captured evidence

| Desktop | Phone |
| --- | --- |
| [Opening](artifacts/award-audit-opening.png) | [Opening, 390px](artifacts/award-audit-phone-opening.png) |
| [Coast](artifacts/award-audit-coast.png) | [Opening, 320px](artifacts/award-audit-compact-opening.png) |
| [Capsule](artifacts/award-audit-capsule.png) | [Capsule, 390px](artifacts/award-audit-phone-capsule.png) |
| [Finale](artifacts/award-audit-finale.png) | [Finale, 390px](artifacts/award-audit-phone-finale.png) |
| [Product](artifacts/award-audit-product.png) | [Product, 390px](artifacts/award-audit-phone-product.png) |
| [Journal](artifacts/award-audit-journal.png) · [Article](artifacts/award-audit-article.png) | [Capsule, 320px](artifacts/award-audit-compact-capsule.png) |
