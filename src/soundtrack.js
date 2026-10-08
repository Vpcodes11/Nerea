// Original generative score. Playback begins only when the visitor opts in.
let context, master, room, colour, surfLevel, timer;
let nextPhrase = 0, phrase = 0, wanted = false, volume = .45, scene = 0;
const progression = [
  { bass: 73.42, notes: [146.83, 174.61, 220, 261.63, 329.63] },
  { bass: 58.27, notes: [116.54, 174.61, 220, 293.66, 349.23] },
  { bass: 65.41, notes: [130.81, 174.61, 220, 261.63, 329.63] },
  { bass: 65.41, notes: [130.81, 196, 261.63, 293.66, 392] }
];

function voice(frequency, at, length, gain, pan, type = 'sine', detune = 0, wet = .22) {
  const osc = context.createOscillator(), envelope = context.createGain(), stereo = context.createStereoPanner();
  osc.type = type; osc.frequency.value = frequency; osc.detune.value = detune; stereo.pan.value = pan;
  const attack = type === 'triangle' ? 2.8 : .035;
  envelope.gain.setValueAtTime(.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(gain, .0002), at + attack);
  envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
  osc.connect(envelope); envelope.connect(stereo); stereo.connect(colour);
  if (wet) {
    const send = context.createGain(); send.gain.value = wet;
    stereo.connect(send); send.connect(room);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); stereo.disconnect(); send.disconnect(); };
  } else osc.onended = () => { osc.disconnect(); envelope.disconnect(); stereo.disconnect(); };
  osc.start(at); osc.stop(at + length + .05);
}

function schedule() {
  if (!wanted || !context || context.state !== 'running') return;
  if (nextPhrase < context.currentTime - 1) nextPhrase = context.currentTime + .08;
  while (nextPhrase < context.currentTime + .7) {
    const chord = progression[phrase % progression.length];
    voice(chord.bass, nextPhrase, 16.8, .052, 0, 'sine', 0, .08);
    chord.notes.slice(1).forEach((note, index) => {
      voice(note, nextPhrase, 18.5, .014, (index - 1.5) * .35, 'triangle', -3.5, .18);
      voice(note, nextPhrase + .12, 18.3, .012, (1.5 - index) * .35, 'triangle', 3.5, .18);
    });
    const motif = [4, 2, 3, 1, 2];
    [1.4, 4.9, 8.2, 11.9, 14.4].forEach((offset, index) => {
      voice(chord.notes[motif[index]] * (index === 3 ? 2 : 1), nextPhrase + offset, 4.2,
        index === 0 ? .026 : .017, index % 2 ? .45 : -.45, 'sine', 0, .35);
    });
    nextPhrase += 16; phrase++;
  }
}

function initialize() {
  context = new (window.AudioContext || window.webkitAudioContext)();
  master = context.createGain(); master.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -19; limiter.knee.value = 12; limiter.ratio.value = 3;
  master.connect(limiter); limiter.connect(context.destination);
  colour = context.createBiquadFilter(); colour.type = 'lowpass'; colour.frequency.value = 1450; colour.Q.value = .18;
  colour.connect(master);

  // A short stereo room gives depth without a long, costly convolution.
  room = context.createConvolver();
  const impulse = context.createBuffer(2, Math.floor(context.sampleRate * 1.35), context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * .20;
  }
  room.buffer = impulse;
  const wet = context.createGain(); wet.gain.value = .22; room.connect(wet); wet.connect(master);

  const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const surf = context.createBufferSource(), surfFilter = context.createBiquadFilter();
  surf.buffer = noise; surf.loop = true; surfFilter.type = 'lowpass'; surfFilter.frequency.value = 290;
  surfLevel = context.createGain(); surfLevel.gain.value = .025;
  const tide = context.createOscillator(), tideDepth = context.createGain();
  tide.type = 'sine'; tide.frequency.value = .075; tideDepth.gain.value = .012;
  tide.connect(tideDepth); tideDepth.connect(surfLevel.gain);
  surf.connect(surfFilter); surfFilter.connect(surfLevel); surfLevel.connect(master);
  surf.start(); tide.start();
  nextPhrase = context.currentTime + .08; setMusicScene(scene);
  timer = setInterval(schedule, 500);
}

export function setMusicScene(index) {
  scene = Math.max(0, Math.min(3, index));
  if (!context) return;
  const now = context.currentTime;
  colour.frequency.setTargetAtTime([1050, 1650, 740, 1250][scene], now, 1.5);
  surfLevel.gain.setTargetAtTime([.017, .033, .009, .024][scene], now, 2);
}

export async function setMusic(enabled) {
  wanted = enabled;
  try {
    if (enabled) {
      if (!context) initialize();
      await context.resume();
      if (wanted) {
        if (nextPhrase < context.currentTime) nextPhrase = context.currentTime + .08;
        schedule(); master.gain.setTargetAtTime(volume, context.currentTime, .7);
      }
    } else if (context) master.gain.setTargetAtTime(0, context.currentTime, .18);
  } catch { wanted = false; }
  return wanted;
}

export function setMusicVolume(value) {
  volume = Math.max(0, Math.min(1, value));
  if (context && wanted) master.gain.setTargetAtTime(volume, context.currentTime, .1);
}

document.addEventListener('visibilitychange', () => {
  if (!context) return;
  if (document.hidden) context.suspend();
  else if (wanted) context.resume().then(schedule).catch(() => {});
});
window.addEventListener('pagehide', () => { clearInterval(timer); context?.close(); });
