import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for(const [size,file] of [['desktop','poster-desktop.jpg'],['mobile','poster-mobile.jpg']])await sharp(`artifacts/tide-poster-${size}.png`).jpeg({quality:92}).toFile(`public/${file}`);
for(const file of ['tide-clouds-desktop','tide-clouds-ocean','tide-capsule-desktop','tide-flow-desktop','tide-capsule-phone','tide-flow-phone','tide-clouds-phone'])await sharp(`artifacts/${file}.png`).jpeg({quality:92}).toFile(`artifacts/${file}.jpg`);
