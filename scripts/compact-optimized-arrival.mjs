import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for (const size of ['desktop','phone']) {
  await sharp(`artifacts/optimized-arrival-${size}.png`).jpeg({quality:93}).toFile(`artifacts/optimized-arrival-${size}.jpg`);
}
for (const [size,file] of [['desktop','poster-desktop.jpg'],['mobile','poster-mobile.jpg']]) {
  await sharp(`artifacts/optimized-arrival-poster-${size}.png`).jpeg({quality:93}).toFile(`public/${file}`);
}
