import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for(const [size,file] of [['desktop','poster-desktop.jpg'],['mobile','poster-mobile.jpg']])await sharp(`artifacts/coastal-poster-${size}.png`).jpeg({quality:92}).toFile(`public/${file}`);
for(const file of ['coastal-origin-desktop','coastal-opening-desktop'])await sharp(`artifacts/${file}.png`).jpeg({quality:93}).toFile(`artifacts/${file}.jpg`);
