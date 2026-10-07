import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';

const stages = ['start', 'covered', 'ocean'];
const panels = await Promise.all(stages.map(async stage => ({
  input: await sharp(`artifacts/cloud-wipe-${stage}.png`).resize(640, 360).toBuffer(),
  left: stages.indexOf(stage) * 640,
  top: 0,
})));
await sharp({create: {width: 1920, height: 360, channels: 3, background: '#211d36'}})
  .composite(panels)
  .jpeg({quality: 92})
  .toFile('artifacts/cloud-wipe-sequence.jpg');
