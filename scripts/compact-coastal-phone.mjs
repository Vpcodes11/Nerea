import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
await sharp('artifacts/coastal-origin-phone.png').jpeg({quality:93}).toFile('artifacts/coastal-origin-phone.jpg');
