import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';

const stages = ['start', 'mid-zoom', 'covered', 'ocean'];
const panels = await Promise.all(stages.map(async (stage, i) => ({
  input: await sharp(`artifacts/moving-cloud-${stage}.png`).resize(640, 360).toBuffer(),
  left: (i % 2) * 640,
  top: Math.floor(i / 2) * 360,
})));
await sharp({create: {width: 1280, height: 720, channels: 3, background: '#211d36'}})
  .composite(panels)
  .jpeg({quality: 92})
  .toFile('artifacts/moving-cloud-sequence.jpg');
