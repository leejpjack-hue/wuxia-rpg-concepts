import { scheduleWindow } from "./src/platform/audio-schedule.js";
// audio.js — Procedural Rock Music & Sound Engine for Blades of the Four
// Synthesizes heavy driving rock music: distorted electric guitar power chords,
// singing lead guitar riffs, punchy rock bass, and a full rock drum kit
// (punchy kick, cracking snare, metallic hi-hats, crash cymbals)
// using the Web Audio API without any external dependencies.

let ctx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let filterNode = null;
let ampNode = null;
let humNode = null;
let ampGain = null;

let soundEnabled = true;
let musicEnabled = true;
let currentMode = "select"; // 'select' | 'battle' | 'boss' | 'upgrade' | 'victory' | 'defeat' | 'paused'
let schedulerTimer = null;
let currentStep = 0;
let nextNoteTime = 0;
let tempo = 96; // BPM (select: 96, battle: 138, boss: 158, upgrade: 104)
let initialized = false;
let masterVolume = 0.75,
  musicVolume = 0.65,
  sfxVolume = 0.85;

const delayedCues = new Set();
function scheduleCue(callback, delay) {
  const timer = setTimeout(() => {
    delayedCues.delete(timer);
    if (ctx && ctx.state !== "closed") callback();
  }, delay);
  delayedCues.add(timer);
  return timer;
}
function clearCues() {
  for (const timer of delayedCues) clearTimeout(timer);
  delayedCues.clear();
}

// ---------------------------------------------------------------------------
// Rock Pitch Reference Frequencies (E Minor / Blues Rock Scale)
// ---------------------------------------------------------------------------
const PITCHES = {
  // Low Bass Roots
  E1: 41.2,
  F1: 43.65,
  G1: 49.0,
  A1: 55.0,
  Bb1: 58.27,
  B1: 61.74,
  C2: 65.41,
  D2: 73.42,
  // Guitar Roots / Power Chords
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  // Lead Guitar Register
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
};

// Tube-style asymmetric soft-clipping distortion curve
let distortionCurve = null;
function getDistortionCurve() {
  if (!distortionCurve) {
    const samples = 2048;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(14 * x * 0.55) * 0.82 + Math.sin(x * Math.PI) * 0.18;
    }
    distortionCurve = curve;
  }
  return distortionCurve;
}

// ---------------------------------------------------------------------------
// Audio Graph Initialization & Lifecycle
// ---------------------------------------------------------------------------

export function initAudio() {
  if (ctx && ctx.state !== "closed") {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();

    // Master filter for pause / scene muffling
    filterNode = ctx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(20000, ctx.currentTime);

    // Master volume
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(
      soundEnabled ? masterVolume : 0,
      ctx.currentTime,
    );

    // SFX bus
    sfxGain = ctx.createGain();
    sfxGain.gain.setValueAtTime(sfxVolume, ctx.currentTime);

    // Music bus
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(
      musicEnabled ? musicVolume : 0,
      ctx.currentTime,
    );

    sfxGain.connect(filterNode);
    musicGain.connect(filterNode);
    filterNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start analog tube amp room atmosphere
    startRockAtmosphere();

    // Start rock music sequencer
    startMusicSequencer();
    initialized = true;
    return ctx;
  } catch (e) {
    console.warn("AudioContext initialization failed:", e);
    return null;
  }
}

// Procedural Analog Amp Bed (subtle room presence & 60Hz transformer warmth)
function startRockAtmosphere() {
  if (!ctx || ampNode) return;
  try {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      output[i] = last * 0.35;
    }

    ampNode = ctx.createBufferSource();
    ampNode.buffer = noiseBuffer;
    ampNode.loop = true;

    const ampFilter = ctx.createBiquadFilter();
    ampFilter.type = "bandpass";
    ampFilter.frequency.setValueAtTime(180, ctx.currentTime);
    ampFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const hum = ctx.createOscillator();
    humNode = hum;
    hum.type = "sine";
    hum.frequency.setValueAtTime(60, ctx.currentTime);
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.012, ctx.currentTime);
    hum.connect(humGain);

    ampGain = ctx.createGain();
    ampGain.gain.setValueAtTime(0.035, ctx.currentTime);

    ampNode.connect(ampFilter);
    ampFilter.connect(ampGain);
    humGain.connect(ampGain);
    ampGain.connect(musicGain);

    ampNode.start();
    hum.start();
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// Rock Instrument Synthesizers
// ---------------------------------------------------------------------------

// 1. Distorted Electric Guitar Power Chords (Root + 5th + Octave with Amp Cabinet)
export function playPowerChord(
  rootFreq,
  time = null,
  duration = 0.5,
  velocity = 0.8,
  mute = false,
) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const fifthFreq = rootFreq * 1.498307;
    const octFreq = rootFreq * 2;

    const oscRoot = ctx.createOscillator();
    const oscFifth = ctx.createOscillator();
    const oscOct = ctx.createOscillator();
    const preGain = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const cabinet = ctx.createBiquadFilter();
    const midEq = ctx.createBiquadFilter();
    const postGain = ctx.createGain();

    oscRoot.type = "sawtooth";
    oscRoot.frequency.setValueAtTime(rootFreq, t);

    oscFifth.type = "sawtooth";
    oscFifth.frequency.setValueAtTime(fifthFreq, t);
    oscFifth.detune.setValueAtTime(-4, t);

    oscOct.type = "sawtooth";
    oscOct.frequency.setValueAtTime(octFreq, t);
    oscOct.detune.setValueAtTime(4, t);

    // Pre-distortion gain drives the waveshaper into saturation
    preGain.gain.setValueAtTime(0.35 * velocity, t);

    shaper.curve = getDistortionCurve();
    shaper.oversample = "2x";

    // Amp Cabinet simulation: steep rolloff above 4.2 kHz removes fizzy digital treble
    cabinet.type = "lowpass";
    cabinet.frequency.setValueAtTime(mute ? 2200 : 4200, t);
    cabinet.Q.setValueAtTime(1.4, t);

    // Midrange punch EQ
    midEq.type = "peaking";
    midEq.frequency.setValueAtTime(1400, t);
    midEq.gain.setValueAtTime(3.5, t);

    // Amplitude envelope
    postGain.gain.setValueAtTime(0.001, t);
    if (mute) {
      // Palm-muted chug
      postGain.gain.linearRampToValueAtTime(0.48 * velocity, t + 0.005);
      postGain.gain.exponentialRampToValueAtTime(
        0.001,
        t + Math.min(duration, 0.13),
      );
    } else {
      // Sustained ringing power chord
      postGain.gain.linearRampToValueAtTime(0.42 * velocity, t + 0.008);
      postGain.gain.setValueAtTime(0.34 * velocity, t + duration * 0.5);
      postGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    }

    oscRoot.connect(preGain);
    oscFifth.connect(preGain);
    oscOct.connect(preGain);
    preGain.connect(shaper);
    shaper.connect(cabinet);
    cabinet.connect(midEq);
    midEq.connect(postGain);
    postGain.connect(musicGain);

    const stopTime = t + (mute ? Math.min(duration, 0.15) : duration);
    oscRoot.start(t);
    oscFifth.start(t);
    oscOct.start(t);
    oscRoot.stop(stopTime);
    oscFifth.stop(stopTime);
    oscOct.stop(stopTime);
  } catch (e) {}
}

// 2. Singing Lead Electric Guitar (Dual detuned sawtooths, vibrato, pitch bends)
export function playLeadGuitar(
  freq,
  time = null,
  duration = 0.4,
  velocity = 0.75,
  bend = 0,
) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const preGain = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const presence = ctx.createBiquadFilter();
    const cabinet = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-5, t);
    osc2.detune.setValueAtTime(6, t);

    // Pitch bend (expressive rock string bend)
    if (bend !== 0) {
      const targetFreq = freq * Math.pow(2, bend / 12);
      osc1.frequency.setValueAtTime(freq, t + duration * 0.1);
      osc1.frequency.exponentialRampToValueAtTime(
        targetFreq,
        t + duration * 0.45,
      );
      osc2.frequency.setValueAtTime(freq, t + duration * 0.1);
      osc2.frequency.exponentialRampToValueAtTime(
        targetFreq,
        t + duration * 0.45,
      );
    }

    // Rock vibrato LFO
    const vibrato = ctx.createOscillator();
    const vGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(5.8, t);
    vGain.gain.setValueAtTime(freq * 0.016, t);
    vibrato.connect(vGain);
    vGain.connect(osc1.frequency);
    vGain.connect(osc2.frequency);
    vibrato.start(t + Math.min(0.08, duration * 0.25));
    vibrato.stop(t + duration);

    preGain.gain.setValueAtTime(0.4 * velocity, t);
    shaper.curve = getDistortionCurve();
    shaper.oversample = "2x";

    presence.type = "peaking";
    presence.frequency.setValueAtTime(2400, t);
    presence.gain.setValueAtTime(4.5, t);

    cabinet.type = "lowpass";
    cabinet.frequency.setValueAtTime(4600, t);

    const peak = 0.38 * velocity;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.006);
    gain.gain.setValueAtTime(peak * 0.88, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(preGain);
    osc2.connect(preGain);
    preGain.connect(shaper);
    shaper.connect(presence);
    presence.connect(cabinet);
    cabinet.connect(gain);
    gain.connect(musicGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  } catch (e) {}
}

// 3. Punchy Rock Bass Guitar (Sub-fundamental + Pick Transient Attack)
export function playBassGuitar(
  freq,
  time = null,
  duration = 0.3,
  velocity = 0.85,
) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const oscSub = ctx.createOscillator();
    const oscPick = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscSub.type = "sine";
    oscSub.frequency.setValueAtTime(freq, t);

    oscPick.type = "sawtooth";
    oscPick.frequency.setValueAtTime(freq, t);

    // Pick snap filter envelope: bright pluck settling to deep thud
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(340, t + 0.045);
    filter.Q.setValueAtTime(2.2, t);

    const peak = 0.44 * velocity;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.005);
    gain.gain.setValueAtTime(peak * 0.8, t + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    oscSub.connect(filter);
    oscPick.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    oscSub.start(t);
    oscPick.start(t);
    oscSub.stop(t + duration);
    oscPick.stop(t + duration);
  } catch (e) {}
}

// 4. Punchy Rock Kick Drum (Fast pitch-drop + Beater click transient)
export function playRockKick(time = null, velocity = 1.0) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    // 1. Low-end sweep
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(175, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.055);

    const peak = 0.85 * velocity;
    oscGain.gain.setValueAtTime(peak, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(oscGain);
    oscGain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // 2. Wooden beater slap click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "triangle";
    click.frequency.setValueAtTime(600, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.02);
    clickGain.gain.setValueAtTime(0.3 * velocity, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    click.connect(clickGain);
    clickGain.connect(musicGain);
    click.start(t);
    click.stop(t + 0.025);
  } catch (e) {}
}

// 5. Cracking Rock Snare Drum (Snappy tone + High-frequency snare wire burst)
export function playRockSnare(time = null, velocity = 0.9) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    // 1. Drum body tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(215, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.04);
    oscGain.gain.setValueAtTime(0.48 * velocity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // 2. Snare wire rattle noise
    const len = Math.floor(ctx.sampleRate * 0.16);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(1200, t);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(3400, t);
    bp.Q.setValueAtTime(1.2, t);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.55 * velocity, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(nGain);
    nGain.connect(musicGain);
    noise.start(t);
  } catch (e) {}
}

// 6. Crisp Metallic Hi-Hats (Closed & Open)
export function playHiHat(time = null, open = false, velocity = 0.6) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const duration = open ? 0.28 : 0.045;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * (open ? 0.35 : 0.18)));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(7500, t);
    hp.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    const peak = (open ? 0.32 : 0.22) * velocity;
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(musicGain);
    noise.start(t);
  } catch (e) {}
}

// 7. Explosive Rock Crash Cymbal
export function playCrashCymbal(time = null, velocity = 0.8) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const duration = 1.5;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(6200, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.48 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(musicGain);
    noise.start(t);
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// Backward-Compatibility Instrument Aliases
// (Ensures legacy test suites and callers seamlessly map to rock equivalents)
// ---------------------------------------------------------------------------

export function playGuzheng(
  freq,
  time = null,
  duration = 1.2,
  velocity = 0.8,
  bend = 0,
) {
  playPowerChord(freq, time, duration, velocity, false);
}

export function playPipa(freq, time = null, duration = 0.4, velocity = 0.7) {
  playLeadGuitar(freq, time, duration, velocity, 0);
}

export function playXiaoFlute(
  freq,
  time = null,
  duration = 1.4,
  velocity = 0.7,
  slideTo = null,
) {
  playLeadGuitar(freq, time, duration, velocity, slideTo ? 2 : 0);
}

export function playTanggu(time = null, velocity = 1.0, pitch = 1.0) {
  playRockKick(time, velocity);
}

export function playLuoGong(time = null, velocity = 0.8, pitch = 1.0) {
  playCrashCymbal(time, velocity);
}

export function playTempleBell(
  freq = 220,
  time = null,
  duration = 3.0,
  velocity = 0.8,
) {
  playPowerChord(freq, time, duration, velocity, false);
}

// ---------------------------------------------------------------------------
// Procedural Rock Sequencer
// ---------------------------------------------------------------------------

function startMusicSequencer() {
  if (schedulerTimer) return;
  nextNoteTime = ctx ? ctx.currentTime + 0.1 : 0;
  currentStep = 0;

  schedulerTimer = setInterval(() => {
    if (!ctx || ctx.state !== "running" || !musicEnabled || !soundEnabled)
      return;
    const stepDuration =
      (60 / tempo) * (currentMode === "select" || currentMode === "upgrade" ? 0.5 : 0.25);
    const window = scheduleWindow(nextNoteTime, ctx.currentTime, stepDuration);
    for (const time of window.times) {
      scheduleStep(currentStep, time, stepDuration);
      currentStep = (currentStep + 1) % 64;
    }
    nextNoteTime = window.next;
  }, 40);
}

function scheduleStep(step, time, stepDuration) {
  if (
    currentMode === "paused" ||
    currentMode === "victory" ||
    currentMode === "defeat"
  )
    return;

  // -------------------------------------------------------------------------
  // 1. SELECT MODE: Moody Heavy Grunge / Desert Rock Groove (96 BPM)
  // -------------------------------------------------------------------------
  if (currentMode === "select" || currentMode === "waystation") {
    // 8 steps per bar (8th notes), 4 bars = 32 steps
    const bar = Math.floor(step / 8) % 4;
    const stepInBar = step % 8;

    // Drums
    if (step === 0 && bar === 0) {
      playCrashCymbal(time, 0.75);
    }
    if (stepInBar === 0) {
      playRockKick(time, 0.95);
    } else if (stepInBar === 3) {
      playRockKick(time, 0.7);
    } else if (stepInBar === 4) {
      playRockKick(time, 0.85);
    }

    if (stepInBar === 2 || stepInBar === 6) {
      playRockSnare(time, 0.9);
    } else if (bar === 3 && stepInBar === 7) {
      playRockSnare(time, 0.65);
    }

    if (stepInBar === 7) {
      playHiHat(time, true, 0.65);
    } else {
      playHiHat(time, false, 0.55);
    }

    // Bassline
    const bassPatterns = [
      [PITCHES.E2, PITCHES.E2, PITCHES.G2, PITCHES.E2, PITCHES.A2, PITCHES.G2, PITCHES.E2, PITCHES.D2],
      [PITCHES.E2, PITCHES.E2, PITCHES.G2, PITCHES.E2, PITCHES.D2, PITCHES.D2, PITCHES.E2, PITCHES.G2],
      [PITCHES.C3, PITCHES.C3, PITCHES.C3, PITCHES.C3, PITCHES.D3, PITCHES.D3, PITCHES.D3, PITCHES.D3],
      [PITCHES.E2, PITCHES.G2, PITCHES.A2, PITCHES.Bb2, PITCHES.B2, PITCHES.A2, PITCHES.G2, PITCHES.E2],
    ];
    const bassFreq = bassPatterns[bar][stepInBar];
    playBassGuitar(bassFreq, time, stepDuration * 0.9, 0.85);

    // Rhythm Guitar Power Chords
    if (bar === 0) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 1.2, 0.75, false);
      if (stepInBar === 4 || stepInBar === 5) playPowerChord(PITCHES.E2, time, 0.2, 0.55, true);
    } else if (bar === 1) {
      if (stepInBar === 0) playPowerChord(PITCHES.G2, time, 0.75, 0.7, false);
      if (stepInBar === 4) playPowerChord(PITCHES.A2, time, 0.75, 0.75, false);
    } else if (bar === 2) {
      if (stepInBar === 0) playPowerChord(PITCHES.C3, time, 0.75, 0.7, false);
      if (stepInBar === 4) playPowerChord(PITCHES.D3, time, 0.75, 0.75, false);
    } else if (bar === 3) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 0.85, 0.8, false);
      // Lead guitar turnaround blues lick
      if (stepInBar === 2) playLeadGuitar(PITCHES.G4, time, 0.25, 0.7, 0);
      if (stepInBar === 4) playLeadGuitar(PITCHES.A4, time, 0.45, 0.8, 2);
      if (stepInBar === 6) playLeadGuitar(PITCHES.E4, time, 0.65, 0.85, 0);
    }
    return;
  }

  // -------------------------------------------------------------------------
  // 2. UPGRADE MODE: Atmospheric Rock Ballad Progression (104 BPM)
  // -------------------------------------------------------------------------
  if (currentMode === "upgrade") {
    const bar = Math.floor(step / 8) % 4;
    const stepInBar = step % 8;

    if (stepInBar === 0) {
      playRockKick(time, 0.75);
      const chordRoots = [PITCHES.E2, PITCHES.C3, PITCHES.G2, PITCHES.D3];
      playPowerChord(chordRoots[bar], time, 1.6, 0.7, false);
    } else if (stepInBar === 4) {
      playRockSnare(time, 0.6);
    }
    playHiHat(time, false, 0.4);

    const bassRoots = [PITCHES.E2, PITCHES.C2, PITCHES.G2, PITCHES.D2];
    playBassGuitar(bassRoots[bar], time, stepDuration * 0.9, 0.75);
    return;
  }

  // -------------------------------------------------------------------------
  // 3. BATTLE MODE: Driving Hard Rock / Arena Anthem (138 BPM)
  // -------------------------------------------------------------------------
  if (currentMode === "battle") {
    // 16 steps per bar (16th notes), 4 bars = 64 steps
    const bar = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;
    const beatInBar = Math.floor(stepInBar / 4);
    const subStep = stepInBar % 4;

    // Cymbals
    if (step === 0 && bar === 0) playCrashCymbal(time, 0.85);
    if (stepInBar === 0 && bar === 2) playCrashCymbal(time, 0.75);

    // Snare Drum
    if (bar === 3 && stepInBar >= 10) {
      // Snare roll fill on turnaround
      playRockSnare(time, 0.75 + (stepInBar - 10) * 0.04);
    } else if ((beatInBar === 1 || beatInBar === 3) && subStep === 0) {
      playRockSnare(time, 0.95);
    }

    // Kick Drum
    if (bar === 3 && stepInBar >= 10) {
      if (subStep === 0) playRockKick(time, 0.85);
    } else {
      if (beatInBar === 0 && subStep === 0) playRockKick(time, 1.0);
      if (beatInBar === 0 && subStep === 2) playRockKick(time, 0.85);
      if (beatInBar === 2 && subStep === 0) playRockKick(time, 0.95);
      if (beatInBar === 2 && subStep === 3) playRockKick(time, 0.75);
    }

    // Hi-Hats (driving 8th notes)
    if (subStep === 0 || subStep === 2) {
      if (beatInBar === 3 && subStep === 2 && bar !== 3) {
        playHiHat(time, true, 0.7);
      } else {
        playHiHat(time, false, 0.6);
      }
    }

    // Bass Guitar (pumping 8th notes)
    if (subStep === 0 || subStep === 2) {
      let bFreq = PITCHES.E2;
      if (bar === 1) {
        bFreq = beatInBar < 2 ? PITCHES.G2 : PITCHES.A2;
      } else if (bar === 2) {
        bFreq = beatInBar < 2 ? PITCHES.C3 : PITCHES.D3;
      } else if (bar === 3) {
        const fillPitches = [
          PITCHES.E2, PITCHES.E2, PITCHES.G2, PITCHES.G2,
          PITCHES.A2, PITCHES.B2, PITCHES.D3, PITCHES.E3,
        ];
        bFreq = fillPitches[Math.floor(stepInBar / 2)] || PITCHES.E2;
      }
      playBassGuitar(bFreq, time, stepDuration * 1.8, 0.9);
    }

    // Rhythm Power Chords
    if (bar === 0) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 0.45, 0.85, false);
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 6)
        playPowerChord(PITCHES.E2, time, 0.12, 0.65, true);
      if (stepInBar === 8) playPowerChord(PITCHES.E2, time, 0.35, 0.75, false);
      if (stepInBar === 10 || stepInBar === 12)
        playPowerChord(PITCHES.E2, time, 0.12, 0.65, true);
      if (stepInBar === 14) playPowerChord(PITCHES.G2, time, 0.25, 0.75, false);
    } else if (bar === 1) {
      if (stepInBar === 0) playPowerChord(PITCHES.G2, time, 0.35, 0.8, false);
      if (stepInBar === 4) playPowerChord(PITCHES.G2, time, 0.12, 0.65, true);
      if (stepInBar === 8) playPowerChord(PITCHES.A2, time, 0.45, 0.85, false);
      if (stepInBar === 12) playPowerChord(PITCHES.A2, time, 0.12, 0.65, true);
      if (stepInBar === 14) playPowerChord(PITCHES.G2, time, 0.25, 0.75, false);
      // Lead guitar lick
      if (stepInBar === 8) playLeadGuitar(PITCHES.E4, time, 0.18, 0.75, 0);
      if (stepInBar === 10) playLeadGuitar(PITCHES.G4, time, 0.18, 0.8, 0);
      if (stepInBar === 12) playLeadGuitar(PITCHES.A4, time, 0.45, 0.9, 2);
    } else if (bar === 2) {
      if (stepInBar === 0) playPowerChord(PITCHES.C3, time, 0.45, 0.85, false);
      if (stepInBar === 4) playPowerChord(PITCHES.C3, time, 0.12, 0.65, true);
      if (stepInBar === 8) playPowerChord(PITCHES.D3, time, 0.45, 0.85, false);
      if (stepInBar === 12) playPowerChord(PITCHES.D3, time, 0.12, 0.65, true);
    } else if (bar === 3) {
      if (stepInBar === 0) playPowerChord(PITCHES.E3, time, 0.6, 0.9, false);
      // Searing lead guitar lick over the turnaround
      if (stepInBar === 2) playLeadGuitar(PITCHES.B4, time, 0.18, 0.8, 0);
      if (stepInBar === 4) playLeadGuitar(PITCHES.D5, time, 0.18, 0.85, 0);
      if (stepInBar === 6) playLeadGuitar(PITCHES.E5, time, 0.22, 0.9, 0);
      if (stepInBar === 8) playLeadGuitar(PITCHES.G5, time, 0.22, 0.95, 0);
      if (stepInBar === 10) playLeadGuitar(PITCHES.E5, time, 0.65, 1.0, 0);
    }
    return;
  }

  // -------------------------------------------------------------------------
  // 4. BOSS MODE: High-Octane Speed Metal / Thrash Combat (158 BPM)
  // -------------------------------------------------------------------------
  if (currentMode === "boss") {
    const bar = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;
    const beatInBar = Math.floor(stepInBar / 4);
    const subStep = stepInBar % 4;

    // Crash Cymbals
    if (step === 0 && bar === 0) playCrashCymbal(time, 0.95);
    if (stepInBar === 0 && bar === 2) playCrashCymbal(time, 0.9);
    if (bar === 3 && stepInBar === 14) playCrashCymbal(time, 0.85);

    // Double-Bass Kick Frenzy (16th-note relentless barrage)
    if (subStep === 0) playRockKick(time, 0.95);
    else if (subStep === 1) playRockKick(time, 0.72);
    else if (subStep === 2) playRockKick(time, 0.88);
    else if (subStep === 3) playRockKick(time, 0.72);

    // Snare Drum
    if ((beatInBar === 1 || beatInBar === 3) && subStep === 0) {
      playRockSnare(time, 1.0);
    } else if (subStep === 2) {
      playRockSnare(time, 0.35); // Ghost snare
    }

    // Sizzling Open Hi-Hat
    if (subStep === 0 || subStep === 2) {
      playHiHat(time, true, 0.65);
    }

    // Galloping 16th-Note Metal Bass
    let metalBassFreq = PITCHES.E1;
    if (bar === 0) {
      metalBassFreq = stepInBar >= 12 ? PITCHES.F1 : PITCHES.E1;
    } else if (bar === 1) {
      metalBassFreq = stepInBar >= 8 ? PITCHES.Bb1 : PITCHES.E1;
    } else if (bar === 2) {
      metalBassFreq = [PITCHES.C2, PITCHES.B1, PITCHES.Bb1, PITCHES.A1][beatInBar];
    } else if (bar === 3) {
      metalBassFreq = stepInBar >= 8 ? PITCHES.G1 : PITCHES.E1;
    }
    playBassGuitar(metalBassFreq, time, stepDuration * 0.9, subStep === 0 ? 0.9 : 0.7);

    // Thrash Metal Power Chords
    if (bar === 0) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 0.25, 0.9, false);
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10)
        playPowerChord(PITCHES.E2, time, 0.08, 0.75, true);
      if (stepInBar === 12) playPowerChord(PITCHES.F2, time, 0.22, 0.9, false);
    } else if (bar === 1) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 0.25, 0.9, false);
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 6)
        playPowerChord(PITCHES.E2, time, 0.08, 0.75, true);
      if (stepInBar === 8) playPowerChord(PITCHES.Bb2, time, 0.22, 0.9, false); // Tritone stab!
      if (stepInBar === 12) playPowerChord(PITCHES.A2, time, 0.22, 0.88, false);
      // Screaming lead solo fill
      if (stepInBar === 8) playLeadGuitar(PITCHES.Bb4, time, 0.12, 0.85, 0);
      if (stepInBar === 10) playLeadGuitar(PITCHES.B4, time, 0.12, 0.85, 0);
      if (stepInBar === 12) playLeadGuitar(PITCHES.D5, time, 0.14, 0.9, 0);
      if (stepInBar === 14) playLeadGuitar(PITCHES.E5, time, 0.35, 1.0, 2);
    } else if (bar === 2) {
      if (stepInBar === 0) playPowerChord(PITCHES.C3, time, 0.2, 0.85, false);
      if (stepInBar === 4) playPowerChord(PITCHES.B2, time, 0.2, 0.85, false);
      if (stepInBar === 8) playPowerChord(PITCHES.Bb2, time, 0.2, 0.85, false);
      if (stepInBar === 12) playPowerChord(PITCHES.A2, time, 0.2, 0.85, false);
    } else if (bar === 3) {
      if (stepInBar === 0) playPowerChord(PITCHES.E2, time, 0.25, 0.9, false);
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 6)
        playPowerChord(PITCHES.E2, time, 0.08, 0.75, true);
      if (stepInBar === 8) playPowerChord(PITCHES.G2, time, 0.22, 0.9, false);
      if (stepInBar === 12) playPowerChord(PITCHES.B2, time, 0.22, 0.9, false);
      // High screaming solo climax
      if (stepInBar === 8) playLeadGuitar(PITCHES.E5, time, 0.14, 0.9, 0);
      if (stepInBar === 10) playLeadGuitar(PITCHES.G5, time, 0.14, 0.95, 0);
      if (stepInBar === 12) playLeadGuitar(PITCHES.A5, time, 0.5, 1.0, 2);
    }
  }
}

// ---------------------------------------------------------------------------
// High-Impact Procedural Sound Effects (SFX)
// ---------------------------------------------------------------------------

export function playSfx(type, param = null) {
  if (!ctx || !soundEnabled) return;
  const t = ctx.currentTime;

  try {
    switch (type) {
      case "strike": {
        // Weapon swing: overdriven guitar pick-scrape + whoosh transient
        const combo = typeof param === "number" ? param : 1;
        const baseFreq = 480 + combo * 90;

        const noise = ctx.createBufferSource();
        const len = Math.floor(ctx.sampleRate * 0.12);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
        }
        noise.buffer = buf;

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(baseFreq * 2.4, t);
        bp.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.11);
        bp.Q.setValueAtTime(3.4, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.42 + combo * 0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(sfxGain);
        noise.start(t);

        // Electric guitar pick scrape ping
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(baseFreq * 1.6, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.08);
        oGain.gain.setValueAtTime(0.18, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case "hit": {
        // Steel contact impact + punchy rock transient
        const isBoss = param === "boss" || param === true;
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(isBoss ? 280 : 380, t);
        osc.frequency.exponentialRampToValueAtTime(isBoss ? 55 : 75, t + 0.12);

        oGain.gain.setValueAtTime(isBoss ? 0.6 : 0.42, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.14);

        // Metallic spark ping
        const ping = ctx.createOscillator();
        const pGain = ctx.createGain();
        ping.type = "sine";
        ping.frequency.setValueAtTime(1350, t);
        ping.frequency.exponentialRampToValueAtTime(340, t + 0.09);
        pGain.gain.setValueAtTime(0.24, t);
        pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        ping.connect(pGain);
        pGain.connect(sfxGain);
        ping.start(t);
        ping.stop(t + 0.1);
        break;
      }

      case "finisher": {
        // Massive rock power chord impact + crash cymbal + sub bass boom
        playCrashCymbal(t, 0.95);
        playPowerChord(PITCHES.E2, t, 1.2, 0.95, false);

        const sub = ctx.createOscillator();
        const sGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(190, t);
        sub.frequency.exponentialRampToValueAtTime(36, t + 0.24);
        sGain.gain.setValueAtTime(0.7, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        sub.connect(sGain);
        sGain.connect(sfxGain);
        sub.start(t);
        sub.stop(t + 0.27);
        break;
      }

      case "dodge": {
        // Quick wind glide + whammy flutter
        const noise = ctx.createBufferSource();
        const len = Math.floor(ctx.sampleRate * 0.18);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
        }
        noise.buffer = buf;

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(1600, t);
        lp.frequency.exponentialRampToValueAtTime(220, t + 0.16);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        noise.connect(lp);
        lp.connect(gain);
        gain.connect(sfxGain);
        noise.start(t);

        // Whammy dive
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, t);
        osc.frequency.exponentialRampToValueAtTime(240, t + 0.15);
        oGain.gain.setValueAtTime(0.18, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.17);
        break;
      }

      case "special": {
        const heroId = param;
        if (heroId === "zhao-yun") {
          // Dragon spear rush: high-gain shred sweep + punch
          playLeadGuitar(PITCHES.E5, t, 0.8, 1.0, 2);
          const sweep = ctx.createOscillator();
          const sGain = ctx.createGain();
          sweep.type = "sawtooth";
          sweep.frequency.setValueAtTime(160, t);
          sweep.frequency.exponentialRampToValueAtTime(1400, t + 0.18);
          sweep.frequency.exponentialRampToValueAtTime(75, t + 0.42);
          sGain.gain.setValueAtTime(0.5, t);
          sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
          sweep.connect(sGain);
          sGain.connect(sfxGain);
          sweep.start(t);
          sweep.stop(t + 0.5);
        } else if (heroId === "lu-zhishen") {
          // Iron monk: massive distorted power chord slam + sub kick
          playPowerChord(PITCHES.E2, t, 1.8, 1.0, false);
          playRockKick(t, 1.0);
        } else if (heroId === "hu-sanniang") {
          // Twin blades: rapid twin guitar stabs + crash
          playSfx("strike", 2);
          scheduleCue(() => playSfx("strike", 3), 85);
          scheduleCue(() => playSfx("finisher"), 180);
        } else {
          // Lü Bu / Skybreaker: Marshall full-stack power chord + explosion
          playCrashCymbal(t, 1.0);
          playPowerChord(PITCHES.E2, t, 2.0, 1.0, false);
          playRockKick(t, 1.0);
        }
        break;
      }

      case "arrow_shoot": {
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(720, t);
        osc.frequency.exponentialRampToValueAtTime(190, t + 0.08);
        oGain.gain.setValueAtTime(0.26, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }

      case "arrow_hit": {
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        oGain.gain.setValueAtTime(0.32, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case "heal": {
        // Ascending harmonic chime lick
        const notes = [PITCHES.E4, PITCHES.G4, PITCHES.B4, PITCHES.E5];
        notes.forEach((f, i) => {
          scheduleCue(() => {
            playLeadGuitar(f, null, 0.6, 0.65, 0);
          }, i * 65);
        });
        break;
      }

      case "hurt": {
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.18);
        oGain.gain.setValueAtTime(0.44, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      }

      case "enemy_windup": {
        // Rising overdriven feedback pitch swell
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(480, t + 0.4);
        oGain.gain.setValueAtTime(0.01, t);
        oGain.gain.linearRampToValueAtTime(0.19, t + 0.35);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }

      case "upgrade": {
        playPowerChord(PITCHES.E2, t, 1.5, 0.8, false);
        playLeadGuitar(PITCHES.E5, t + 0.08, 1.2, 0.85, 0);
        break;
      }

      case "ui_click": {
        // Crisp drumstick rimshot tap
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(560, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.04);
        oGain.gain.setValueAtTime(0.18, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case "victory": {
        // Triumphant stadium rock victory fanfare!
        playCrashCymbal(t, 1.0);
        playRockKick(t, 1.0);
        playPowerChord(PITCHES.E2, t, 0.35, 0.9, false);

        scheduleCue(() => {
          playPowerChord(PITCHES.G2, null, 0.35, 0.9, false);
          playRockSnare(null, 0.85);
        }, 220);

        scheduleCue(() => {
          playPowerChord(PITCHES.A2, null, 0.35, 0.95, false);
          playRockSnare(null, 0.85);
        }, 440);

        scheduleCue(() => {
          playCrashCymbal(null, 1.0);
          playRockKick(null, 1.0);
          playPowerChord(PITCHES.E3, null, 2.5, 1.0, false);
        }, 660);

        // Blazing victory lead lick
        const lickNotes = [
          [PITCHES.E4, 0],
          [PITCHES.G4, 0],
          [PITCHES.A4, 0],
          [PITCHES.B4, 0],
          [PITCHES.D5, 0],
          [PITCHES.E5, 2],
        ];
        lickNotes.forEach(([f, b], idx) => {
          scheduleCue(() => {
            playLeadGuitar(f, null, idx === 5 ? 1.4 : 0.16, 0.9, b);
          }, 850 + idx * 130);
        });
        break;
      }

      case "defeat": {
        // Heavy distorted dissonance dive-bomb into sub rumble
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(82, t);
        osc.frequency.exponentialRampToValueAtTime(26, t + 2.2);

        oGain.gain.setValueAtTime(0.55, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 2.5);
        playCrashCymbal(t, 0.7);
        break;
      }
    }
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// Music State Controller
// ---------------------------------------------------------------------------

export function setMusicMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  clearCues();
  if (ctx) nextNoteTime = ctx.currentTime + 0.03;

  if (mode === "select" || mode === "waystation") {
    tempo = 96;
    if (filterNode && ctx)
      filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
  } else if (mode === "battle") {
    tempo = 138;
    if (filterNode && ctx)
      filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
  } else if (mode === "boss") {
    tempo = 158;
    if (filterNode && ctx)
      filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
    // Opening crash cymbal for boss duel
    playCrashCymbal(null, 1.0);
  } else if (mode === "upgrade") {
    tempo = 104;
    if (filterNode && ctx)
      filterNode.frequency.setTargetAtTime(4500, ctx.currentTime, 0.3);
  } else if (mode === "paused") {
    // Muffle music through lowpass filter when paused (behind club door effect)
    if (filterNode && ctx)
      filterNode.frequency.setTargetAtTime(700, ctx.currentTime, 0.15);
  } else if (mode === "victory") {
    playSfx("victory");
  } else if (mode === "defeat") {
    playSfx("defeat");
  }
  applyMix();
}

// ---------------------------------------------------------------------------
// Audio Settings & Toggles
// ---------------------------------------------------------------------------

export function isSoundEnabled() {
  return soundEnabled;
}

export function isMusicEnabled() {
  return musicEnabled;
}

function applyMix() {
  if (!ctx) return;
  const intensity =
    {
      select: 0.95,
      waystation: 0.95,
      battle: 1.15,
      boss: 1.3,
      upgrade: 0.75,
      paused: 0.45,
      victory: 0.35,
      defeat: 0.25,
    }[currentMode] ?? 1;

  masterGain?.gain.setTargetAtTime(
    soundEnabled ? masterVolume : 0,
    ctx.currentTime,
    0.04,
  );
  sfxGain?.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.04);
  musicGain?.gain.setTargetAtTime(
    musicEnabled ? Math.min(1, musicVolume * intensity) : 0,
    ctx.currentTime,
    0.12,
  );
}

export function setAudioSettings(settings) {
  soundEnabled = settings.sound ?? soundEnabled;
  musicEnabled = settings.music ?? musicEnabled;
  for (const [key, value] of Object.entries(settings)) {
    if (!Number.isFinite(value)) continue;
    const v = Math.max(0, Math.min(1, value));
    if (key === "masterVolume") masterVolume = v;
    if (key === "musicVolume") musicVolume = v;
    if (key === "sfxVolume") sfxVolume = v;
  }
  if (ctx) nextNoteTime = ctx.currentTime + 0.03;
  applyMix();
}

export function toggleSound() {
  setAudioSettings({ sound: !soundEnabled });
  return soundEnabled;
}

export function toggleMusic() {
  setAudioSettings({ music: !musicEnabled });
  return musicEnabled;
}

export function suspendAudio() {
  clearCues();
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  return ctx?.suspend().catch(() => {});
}

export function resumeAudio() {
  const context = initAudio();
  if (context) {
    nextNoteTime = context.currentTime + 0.05;
    startMusicSequencer();
    applyMix();
  }
  return context;
}

export async function disposeAudio() {
  clearCues();
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = null;
  try {
    ampNode?.stop();
    humNode?.stop();
  } catch {}
  const old = ctx;
  ctx = null;
  ampNode = null;
  humNode = null;
  ampGain = null;
  masterGain = null;
  sfxGain = null;
  musicGain = null;
  filterNode = null;
  initialized = false;
  if (old && old.state !== "closed") await old.close();
}

export function audioStatus() {
  return {
    initialized,
    state: ctx?.state || "unavailable",
    currentMode,
    soundEnabled,
    musicEnabled,
  };
}

// Fallback tone for legacy compatibility
export function tone(freq = 280, len = 0.07, type = "sine", volume = 0.05) {
  if (!ctx || !soundEnabled) return;
  try {
    const o = ctx.createOscillator(),
      a = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(40, freq * 0.55),
      ctx.currentTime + len,
    );
    a.gain.setValueAtTime(volume, ctx.currentTime);
    a.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    o.connect(a);
    a.connect(sfxGain);
    o.start();
    o.stop(ctx.currentTime + len);
  } catch (e) {}
}
