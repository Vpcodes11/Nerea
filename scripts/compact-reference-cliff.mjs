import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
for (const size of ['desktop', 'phone']) {
  await sharp(`artifacts/reference-cliff-${size}.png`).jpeg({quality:93}).toFile(`artifacts/reference-cliff-${size}.jpg`);
}
for (const size of ['desktop', 'mobile']) {
  await sharp(`artifacts/reference-cliff-poster-${size}.png`).jpeg({quality:93}).toFile(`public/poster-${size}.jpg`);
}
