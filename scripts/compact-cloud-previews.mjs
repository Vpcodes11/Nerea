import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
import {readFile,writeFile} from 'node:fs/promises';
for(const file of ['public/poster-desktop.jpg','public/poster-mobile.jpg','artifacts/nerea-clouds-hero.jpg','artifacts/nerea-clouds-ocean.jpg','artifacts/nerea-clouds-phone.jpg']){
  const input=await readFile(file);await writeFile(file,await sharp(input).jpeg({quality:90}).toBuffer());
}
