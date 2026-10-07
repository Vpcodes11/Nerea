import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for(const [size,file] of [['desktop','poster-desktop.jpg'],['mobile','poster-mobile.jpg']])await sharp(`artifacts/cloud-cove-poster-${size}.png`).jpeg({quality:93}).toFile(`public/${file}`);
for(const file of ['cloud-cove-desktop','cloud-cove-phone','cloud-cove-transition'])await sharp(`artifacts/${file}.png`).jpeg({quality:93}).toFile(`artifacts/${file}.jpg`);
