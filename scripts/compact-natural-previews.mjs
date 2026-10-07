import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for(const [name,file] of [['desktop','poster-desktop.jpg'],['mobile','poster-mobile.jpg']])await sharp(`artifacts/natural-poster-${name}.png`).jpeg({quality:92}).toFile(`public/${file}`);
await sharp('artifacts/nerea-natural-clouds-hero-final.png').jpeg({quality:92}).toFile('artifacts/nerea-natural-clouds-hero-final.jpg');
for(const file of ['nerea-natural-clouds-ocean','capsule-redesign-desktop','capsule-redesign-phone'])await sharp(`artifacts/${file}.jpg`).jpeg({quality:92}).toFile(`artifacts/${file}-final.jpg`);
