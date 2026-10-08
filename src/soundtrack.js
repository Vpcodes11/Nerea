// Original generative score: suspended chords, sparse bells and a breathing surf bed.
let context, master, timer, nextBar = 0, bar = 0, wanted = false, volume = .45;
const chords = [[146.83,220,261.63,329.63],[130.81,196,246.94,293.66],[174.61,220,261.63,349.23],[130.81,196,261.63,329.63]];
let room;
function tone(frequency, at, duration, level, pan, bell = false) {
  const oscillator = context.createOscillator(), envelope = context.createGain(), stereo = context.createStereoPanner();
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(level, at + (bell ? .025 : 3));
  envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
  stereo.pan.value = pan; oscillator.connect(envelope); envelope.connect(stereo); stereo.connect(master); stereo.connect(room);
  oscillator.start(at); oscillator.stop(at + duration + .05);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); stereo.disconnect(); };
}
function schedule() {
  if (!wanted || !context || context.state !== 'running') return;
  if (nextBar < context.currentTime - 1) nextBar = context.currentTime + .08;
  while (nextBar < context.currentTime + 1) {
    const chord = chords[bar % chords.length];
    chord.forEach((f,i) => tone(f, nextBar, 19, .035, (i-1.5)*.35));
    [0, 6, 11].forEach((offset,i) => tone(chord[(bar+i)%4]*2, nextBar+offset, 6, .025, i%2 ? .45 : -.45, true));
    nextBar += 16; bar++;
  }
}
function initialize() {
  context = new (window.AudioContext || window.webkitAudioContext)();
  master = context.createGain(); master.gain.value = 0;
  const limiter = context.createDynamicsCompressor(); limiter.threshold.value = -16; limiter.ratio.value = 4;
  master.connect(limiter); limiter.connect(context.destination);
  room = context.createConvolver();
  const impulse = context.createBuffer(2, context.sampleRate*3, context.sampleRate);
  for(let c=0;c<2;c++){const channel=impulse.getChannelData(c);for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*Math.pow(1-i/channel.length,3)*.28;}
  room.buffer=impulse; const wet=context.createGain(); wet.gain.value=.3;room.connect(wet);wet.connect(master);
  const buffer=context.createBuffer(1,context.sampleRate*12,context.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.02)/1.02;data[i]=last*2;}
  const surf=context.createBufferSource(),filter=context.createBiquadFilter(),swell=context.createGain();
  surf.buffer=buffer;surf.loop=true;filter.type='lowpass';filter.frequency.value=580;swell.gain.value=.13;
  const tide=context.createOscillator(),depth=context.createGain();tide.frequency.value=.085;depth.gain.value=.055;
  tide.connect(depth);depth.connect(swell.gain);surf.connect(filter);filter.connect(swell);swell.connect(master);surf.start();tide.start();
  nextBar=context.currentTime+.08;timer=setInterval(schedule,500);
}
export async function setMusic(enabled) {
  wanted=enabled;
  try {
    if(enabled){if(!context)initialize();await context.resume();if(wanted){if(nextBar < context.currentTime)nextBar=context.currentTime+.08;schedule();master.gain.setTargetAtTime(volume,context.currentTime,.7);}}
    else if(context)master.gain.setTargetAtTime(0,context.currentTime,.15);
  } catch { wanted=false; }
  return wanted;
}
export function setMusicVolume(value){volume=Math.max(0,Math.min(1,value));if(context&&wanted)master.gain.setTargetAtTime(volume,context.currentTime,.1);}
document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend();else if(wanted)context.resume().then(schedule).catch(()=>{});});
window.addEventListener('pagehide',()=>{clearInterval(timer);context?.close();});
