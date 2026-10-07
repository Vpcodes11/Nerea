import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
import {copyFile} from 'node:fs/promises';
const source='C:/Users/Trade/.codex/generated_images/01a1156f-20ca-7ae3-af6c-b108beaac0e8/exec-ae55427f-f40c-46f7-baef-373f79882b5f.png';
await copyFile(source,'artifacts/cloud-bank-source.png');
await sharp(source).resize({width:1024}).webp({quality:90,alphaQuality:100}).toFile('public/textures/cloud-bank.webp');
console.log(await sharp('public/textures/cloud-bank.webp').metadata());
