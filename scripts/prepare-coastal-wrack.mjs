import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
await sharp('artifacts/coastal-wrack-source.png').webp({quality:95,alphaQuality:100}).toFile('public/textures/coastal-wrack.webp');
console.log(await sharp('public/textures/coastal-wrack.webp').metadata());
