import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
import {readFile,writeFile} from 'node:fs/promises';
const files=['public/poster-desktop.jpg','public/poster-mobile.jpg','public/product-render.jpg','artifacts/nerea-3d-hero.jpg','artifacts/nerea-3d-ocean.jpg','artifacts/nerea-3d-underwater.jpg','artifacts/nerea-3d-phone-final.jpg'];
for(const file of files){const input=await readFile(file);await writeFile(file,await sharp(input).jpeg({quality:90}).toBuffer());console.log(file);}
