// audio.js — Procedural Wuxia Sound & Music Engine for Blades of the Four
// Generates authentic traditional Chinese instruments (Guzheng, Xiao flute, Tanggu war drums, Luo gongs, Temple bells)
// and interactive procedural background music using the Web Audio API without any external dependencies.

let ctx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let filterNode = null;
let windNode = null;
let windGain = null;

let soundEnabled = true;
let musicEnabled = true;
let currentMode = 'select'; // 'select' | 'battle' | 'boss' | 'upgrade' | 'victory' | 'defeat' | 'paused'
let schedulerTimer = null;
let currentStep = 0;
let nextNoteTime = 0;
let tempo = 72; // BPM
let initialized = false;

// Pentatonic Scale (宮 商 角 徵 羽 in D / B minor)
// D3, E3, F#3, A3, B3, D4, E4, F#4, A4, B4, D5, E5, F#5
const PENTATONIC = [
  146.83, 164.81, 185.00, 220.00, 246.94,
  293.66, 329.63, 369.99, 440.00, 493.88,
  587.33, 659.25, 739.99
];

// Initialize Audio Context & Graph
export function initAudio() {
  if (ctx && ctx.state !== 'closed') {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();

    // Master filter for pause/muffle effect
    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(20000, ctx.currentTime);

    // Master volume
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(soundEnabled ? 0.75 : 0, ctx.currentTime);

    // SFX bus
    sfxGain = ctx.createGain();
    sfxGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Music bus
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(musicEnabled ? 0.6 : 0, ctx.currentTime);

    sfxGain.connect(filterNode);
    musicGain.connect(filterNode);
    filterNode.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start mountain wind background bed
    startWindAtmosphere();

    // Start music sequencer
    startMusicSequencer();
    initialized = true;
    return ctx;
  } catch (e) {
    console.warn('AudioContext initialization failed:', e);
    return null;
  }
}

// Procedural Mountain Wind (ambient noise generator)
function startWindAtmosphere() {
  if (!ctx || windNode) return;
  try {
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    windNode = ctx.createBufferSource();
    windNode.buffer = noiseBuffer;
    windNode.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    // Modulate wind filter frequency slowly with LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    lfoGain.gain.setValueAtTime(160, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();

    windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.15, ctx.currentTime);

    windNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(musicGain);
    windNode.start();
  } catch (e) {
    // Graceful fallback if buffer creation fails
  }
}

// ---------------------------------------------------------------------------
// Traditional Instrument Synthesizers
// ---------------------------------------------------------------------------

// 1. Chinese Guzheng / Pipa (Plucked Silk String Synthesis)
export function playGuzheng(freq, time = null, duration = 1.2, velocity = 0.8, bend = 0) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Harmonics: blend sawtooth and triangle for rich string timbre
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    if (bend !== 0) {
      // Traditional finger bend / vibrato
      osc.frequency.linearRampToValueAtTime(freq * (1 + bend), t + duration * 0.4);
    }

    // Dynamic lowpass filter envelope: bright pluck that dampens quickly
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(5000, freq * 8), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 1.2), t + Math.min(duration, 0.6));
    filter.Q.setValueAtTime(2.2, t);

    // Pluck amplitude envelope
    const peak = 0.35 * velocity;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {}
}

// 2. Chinese Pipa (Rapid Strum / Pluck)
export function playPipa(freq, time = null, duration = 0.4, velocity = 0.7) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.5, t);
    filter.Q.setValueAtTime(3.0, t);

    const peak = 0.28 * velocity;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {}
}

// 3. Chinese Bamboo Flute (Xiao / Dizi)
export function playXiaoFlute(freq, time = null, duration = 1.4, velocity = 0.7, slideTo = null) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.985, t);
    // Smooth finger slide onto note
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);

    if (slideTo) {
      osc.frequency.setValueAtTime(freq, t + duration * 0.5);
      osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration * 0.9);
    }

    // Vibrato
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(4.8, t);
    vibratoGain.gain.setValueAtTime(freq * 0.012, t);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(t + 0.15);
    vibrato.stop(t + duration);

    // Warm resonant body
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, t);

    // Breath envelope: gradual rise, emotional swell, gentle release
    const peak = 0.22 * velocity;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.12);
    gain.gain.setValueAtTime(peak * 0.9, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {}
}

// 4. Chinese War Drum (Tanggu 堂鼓)
export function playTanggu(time = null, velocity = 1.0, pitch = 1.0) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    // 1. Membrane fundamental punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = 165 * pitch;
    const endFreq = 48 * pitch;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.09);

    const oscPeak = 0.55 * velocity;
    oscGain.gain.setValueAtTime(oscPeak, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(oscGain);
    oscGain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // 2. Wood shell slap transient
    const noise = ctx.createBufferSource();
    const len = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    noise.buffer = buf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(140 * pitch, t);
    noiseFilter.Q.setValueAtTime(2.5, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * velocity, t);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(musicGain);
    noise.start(t);
  } catch (e) {}
}

// 5. Chinese Gong / Luo (銅鑼)
export function playLuoGong(time = null, velocity = 0.8, pitch = 1.0) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const partials = [180, 276, 385, 542, 730].map(f => f * pitch);
    const gongGain = ctx.createGain();
    gongGain.gain.setValueAtTime(0.3 * velocity, t);
    gongGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    partials.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t);
      // Slight pitch bend characteristic of Chinese gongs
      osc.frequency.exponentialRampToValueAtTime(f * 0.94, t + 0.5);

      pGain.gain.setValueAtTime(1 / (idx + 1), t);
      osc.connect(pGain);
      pGain.connect(gongGain);
      osc.start(t);
      osc.stop(t + 2.2);
    });

    gongGain.connect(musicGain);
  } catch (e) {}
}

// 6. Temple Bell / Qing (梵鐘 · 磬)
export function playTempleBell(freq = 220, time = null, duration = 3.0, velocity = 0.8) {
  if (!ctx || !soundEnabled) return;
  const t = time ?? ctx.currentTime;

  try {
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0.35 * velocity, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Inharmonic bronze bell ratios
    const ratios = [1.0, 1.414, 1.732, 2.3, 2.9];
    ratios.forEach((r, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * r, t);

      const pGain = ctx.createGain();
      pGain.gain.setValueAtTime(0.8 / (idx + 1), t);
      pGain.gain.exponentialRampToValueAtTime(0.001, t + duration * (1 - idx * 0.15));

      osc.connect(pGain);
      pGain.connect(bellGain);
      osc.start(t);
      osc.stop(t + duration);
    });

    bellGain.connect(sfxGain);
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// Interactive Procedural Music Sequencer
// ---------------------------------------------------------------------------

// Musical Phrases (Scale index references into PENTATONIC: 0..12)
const MELODIES = {
  select: [
    // Meditative, solitary mountain pass theme
    [0, 2, 4, 7],     // Bar 1: D3, F#3, B3, F#4
    [9, 7, 4, 2],     // Bar 2: B4, F#4, B3, F#3
    [4, 7, 9, 11],    // Bar 3: B3, F#4, B4, E5
    [11, 9, 7, 4]     // Bar 4: E5, B4, F#4, B3
  ],
  battle: [
    // High-tempo martial combat ostinato
    [2, 2, 4, 2, 7, 4, 2, 4],
    [9, 7, 9, 11, 9, 7, 4, 2],
    [4, 4, 7, 4, 9, 7, 4, 2],
    [11, 11, 9, 7, 4, 2, 4, 7]
  ],
  boss: [
    // Urgent, clashing duel against the Ashen Warden
    [0, 2, 4, 7, 9, 7, 4, 2],
    [4, 7, 9, 11, 12, 11, 9, 7],
    [2, 4, 7, 9, 11, 9, 7, 4],
    [12, 11, 9, 7, 4, 2, 0, 2]
  ]
};

function startMusicSequencer() {
  if (schedulerTimer) return;
  nextNoteTime = ctx ? ctx.currentTime + 0.1 : 0;
  currentStep = 0;

  schedulerTimer = setInterval(() => {
    if (!ctx || !musicEnabled || !soundEnabled) return;
    const lookahead = 0.12; // Schedule notes up to 120ms in advance
    while (nextNoteTime < ctx.currentTime + lookahead) {
      scheduleStep(currentStep, nextNoteTime);
      advanceStep();
    }
  }, 40);
}

function advanceStep() {
  const secondsPerBeat = 60.0 / tempo;
  // Step length: 16th notes in combat, 8th notes in select
  const stepFraction = currentMode === 'select' ? 0.5 : 0.25;
  nextNoteTime += secondsPerBeat * stepFraction;
  currentStep = (currentStep + 1) % 64;
}

function scheduleStep(step, time) {
  if (currentMode === 'paused' || currentMode === 'victory' || currentMode === 'defeat') return;

  const bar = Math.floor(step / 16) % 4;
  const beatInBar = Math.floor((step % 16) / 4);
  const subStep = step % 4;

  if (currentMode === 'select') {
    // Ambient Mode: gentle Guzheng plucks + sparse Dizi flute
    if (step % 4 === 0) {
      const melodyBar = MELODIES.select[bar];
      const noteIdx = melodyBar[beatInBar % melodyBar.length];
      const freq = PENTATONIC[noteIdx] || PENTATONIC[0];
      playGuzheng(freq, time, 1.4, 0.65, Math.sin(step) * 0.05);

      // Low drone note on the downbeat of each bar
      if (beatInBar === 0) {
        playGuzheng(PENTATONIC[0] * 0.5, time, 2.5, 0.8);
      }
    }

    // Occasional breathy Xiao flute melody
    if (step % 16 === 8 && bar % 2 === 1) {
      const fluteFreq = PENTATONIC[7 + (bar % 3)];
      playXiaoFlute(fluteFreq, time, 1.8, 0.55, PENTATONIC[4 + (bar % 3)]);
    }
    return;
  }

  if (currentMode === 'battle') {
    // Combat Mode: 116 BPM, driving Tanggu drums + Pipa ostinato
    // Downbeats: Heavy war drum
    if (subStep === 0) {
      playTanggu(time, beatInBar === 0 ? 0.95 : 0.65, beatInBar === 0 ? 0.95 : 1.15);
    }
    // Syncopated drum fill on beat 3 and 4
    if ((beatInBar === 2 && subStep === 2) || (beatInBar === 3 && subStep === 3)) {
      playTanggu(time, 0.45, 1.35);
    }

    // Pipa fast rhythmic strum
    if (step % 2 === 0) {
      const phrase = MELODIES.battle[bar];
      const noteIdx = phrase[Math.floor(step / 2) % phrase.length];
      playPipa(PENTATONIC[noteIdx] || PENTATONIC[2], time, 0.32, 0.55);
    }

    // Lead Xiao flute melody on long phrases
    if (step % 16 === 0) {
      const leadFreq = PENTATONIC[5 + (bar % 4)];
      playXiaoFlute(leadFreq, time, 1.1, 0.65);
    }

    // Luo gong hit on bar 0 start
    if (step === 0 && bar === 0) {
      playLuoGong(time, 0.5, 1.2);
    }
    return;
  }

  if (currentMode === 'boss') {
    // Boss Duel Mode: 134 BPM, aggressive war drums, intense polyrhythms, urgent flute
    // Relentless drum pulse
    if (subStep === 0 || subStep === 2) {
      playTanggu(time, subStep === 0 ? 0.9 : 0.55, subStep === 0 ? 0.85 : 1.25);
    }
    // High drum tension rolls on final bar
    if (bar === 3 && subStep === 1) {
      playTanggu(time, 0.4, 1.45);
    }

    // Urgent Guzheng & Pipa rapid arpeggios
    const bossPhrase = MELODIES.boss[bar];
    const nIdx = bossPhrase[step % bossPhrase.length];
    playGuzheng(PENTATONIC[nIdx] || PENTATONIC[4], time, 0.45, 0.75);

    // Piercing flute cries
    if (step % 8 === 0) {
      const bossFluteFreq = PENTATONIC[7 + (step % 5)];
      playXiaoFlute(bossFluteFreq, time, 0.8, 0.75, PENTATONIC[5]);
    }

    // Dramatic Gong crashes every 2 bars
    if (step % 32 === 0) {
      playLuoGong(time, 0.85, 0.95);
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
      case 'strike': {
        // Weapon swing whoosh: pitch-swept filtered noise + blade shimmer
        const combo = typeof param === 'number' ? param : 1;
        const baseFreq = 420 + combo * 80;

        // Air whoosh
        const noise = ctx.createBufferSource();
        const len = Math.floor(ctx.sampleRate * 0.14);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
        noise.buffer = buf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(baseFreq * 2.2, t);
        bp.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.13);
        bp.Q.setValueAtTime(3.2, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.38 + combo * 0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(sfxGain);
        noise.start(t);

        // Subtle metallic blade edge ring
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * 1.5, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t + 0.08);
        oGain.gain.setValueAtTime(0.12, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case 'hit': {
        // Steel contact impact + bone thud
        const isBoss = param === 'boss' || param === true;
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isBoss ? 280 : 380, t);
        osc.frequency.exponentialRampToValueAtTime(isBoss ? 55 : 75, t + 0.12);

        oGain.gain.setValueAtTime(isBoss ? 0.55 : 0.38, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.14);

        // Metallic spark ping
        const ping = ctx.createOscillator();
        const pGain = ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(1250, t);
        ping.frequency.exponentialRampToValueAtTime(320, t + 0.09);
        pGain.gain.setValueAtTime(0.22, t);
        pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        ping.connect(pGain);
        pGain.connect(sfxGain);
        ping.start(t);
        ping.stop(t + 0.1);
        break;
      }

      case 'finisher': {
        // Combo finisher: heavy metal clash + resonant bronze ring
        playTempleBell(320, t, 1.4, 0.9);
        const sub = ctx.createOscillator();
        const sGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(180, t);
        sub.frequency.exponentialRampToValueAtTime(38, t + 0.22);
        sGain.gain.setValueAtTime(0.65, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        sub.connect(sGain);
        sGain.connect(sfxGain);
        sub.start(t);
        sub.stop(t + 0.26);
        break;
      }

      case 'dodge': {
        // Ethereal wind glide / afterimage
        const noise = ctx.createBufferSource();
        const len = Math.floor(ctx.sampleRate * 0.22);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
        noise.buffer = buf;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1400, t);
        lp.frequency.exponentialRampToValueAtTime(180, t + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(lp);
        lp.connect(gain);
        gain.connect(sfxGain);
        noise.start(t);

        // Whistle
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
        oGain.gain.setValueAtTime(0.15, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.19);
        break;
      }

      case 'special': {
        // Character-specific signature techniques
        const heroId = param;
        if (heroId === 'zhao-yun') {
          // Azure Line: piercing dragon spear rush + sonic boom
          playGuzheng(587.33, t, 1.2, 0.9, 0.25);
          const sweep = ctx.createOscillator();
          const sGain = ctx.createGain();
          sweep.type = 'sawtooth';
          sweep.frequency.setValueAtTime(180, t);
          sweep.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
          sweep.frequency.exponentialRampToValueAtTime(80, t + 0.45);
          sGain.gain.setValueAtTime(0.45, t);
          sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          sweep.connect(sGain);
          sGain.connect(sfxGain);
          sweep.start(t);
          sweep.stop(t + 0.52);
        } else if (heroId === 'lu-zhishen') {
          // Temple Bell: immense bronze shockwave and earth rumble
          playTempleBell(110, t, 2.8, 1.0);
          playTanggu(t, 1.0, 0.7);
        } else if (heroId === 'hu-sanniang') {
          // Crimson Waltz: rapid triple scissor cuts + wind flutter
          playSfx('strike', 2);
          setTimeout(() => playSfx('strike', 3), 90);
          setTimeout(() => playSfx('finisher'), 190);
        } else {
          // Lü Bu / Skybreaker: thunderous cleave + shattering impact
          playLuoGong(t, 1.0, 0.85);
          playTanggu(t, 1.0, 0.75);
          playTempleBell(165, t, 2.0, 0.9);
        }
        break;
      }

      case 'arrow_shoot': {
        // Bowstring snap + whistle
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
        oGain.gain.setValueAtTime(0.25, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }

      case 'arrow_hit': {
        // Wood impact thud
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        oGain.gain.setValueAtTime(0.3, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case 'heal': {
        // Jade drop chime: ascending pentatonic notes
        const notes = [PENTATONIC[4], PENTATONIC[7], PENTATONIC[9], PENTATONIC[11]];
        notes.forEach((f, i) => {
          setTimeout(() => {
            playGuzheng(f, null, 0.8, 0.6, 0.05);
          }, i * 65);
        });
        break;
      }

      case 'hurt': {
        // Heavy impact thud + ear ringing
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
        oGain.gain.setValueAtTime(0.42, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      }

      case 'enemy_windup': {
        // Rising tension pulse
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(380, t + 0.4);
        oGain.gain.setValueAtTime(0.01, t);
        oGain.gain.linearRampToValueAtTime(0.18, t + 0.35);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }

      case 'upgrade': {
        // Mystical resonant chime on boon selection
        playTempleBell(440, t, 1.8, 0.7);
        playGuzheng(PENTATONIC[9], t + 0.1, 1.5, 0.7);
        break;
      }

      case 'ui_click': {
        // Crisp bamboo / wood clapper
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
        oGain.gain.setValueAtTime(0.15, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(oGain);
        oGain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'victory': {
        // Triumphant wuxia war gong + ascending flourish
        playLuoGong(t, 1.0, 1.0);
        playTempleBell(293.66, t + 0.2, 3.0, 0.9);
        const victoryNotes = [PENTATONIC[4], PENTATONIC[7], PENTATONIC[9], PENTATONIC[11], PENTATONIC[12]];
        victoryNotes.forEach((f, i) => {
          setTimeout(() => playGuzheng(f, null, 1.8, 0.8), 250 + i * 140);
        });
        break;
      }

      case 'defeat': {
        // Mournful low temple bell fading into wind
        playTempleBell(146.83, t, 3.5, 0.85);
        setTimeout(() => playTempleBell(110, null, 3.0, 0.7), 600);
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

  if (mode === 'select') {
    tempo = 72;
    if (filterNode && ctx) filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
    if (musicGain && ctx && musicEnabled) musicGain.gain.setTargetAtTime(0.65, ctx.currentTime, 0.3);
  } else if (mode === 'battle') {
    tempo = 116;
    if (filterNode && ctx) filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
    if (musicGain && ctx && musicEnabled) musicGain.gain.setTargetAtTime(0.75, ctx.currentTime, 0.2);
  } else if (mode === 'boss') {
    tempo = 134;
    if (filterNode && ctx) filterNode.frequency.setTargetAtTime(20000, ctx.currentTime, 0.2);
    if (musicGain && ctx && musicEnabled) musicGain.gain.setTargetAtTime(0.85, ctx.currentTime, 0.2);
    // Dramatic gong crash to start the boss encounter
    playLuoGong(null, 1.0, 0.9);
  } else if (mode === 'upgrade') {
    if (filterNode && ctx) filterNode.frequency.setTargetAtTime(4500, ctx.currentTime, 0.3);
    if (musicGain && ctx && musicEnabled) musicGain.gain.setTargetAtTime(0.45, ctx.currentTime, 0.3);
  } else if (mode === 'paused') {
    // Muffle music through lowpass filter when paused
    if (filterNode && ctx) filterNode.frequency.setTargetAtTime(700, ctx.currentTime, 0.15);
  } else if (mode === 'victory') {
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(0.2, ctx.currentTime, 0.4);
    playSfx('victory');
  } else if (mode === 'defeat') {
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.4);
    playSfx('defeat');
  }
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

export function toggleSound() {
  initAudio();
  soundEnabled = !soundEnabled;
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(soundEnabled ? 0.75 : 0, ctx.currentTime);
  }
  if (soundEnabled) {
    playSfx('ui_click');
  }
  return soundEnabled;
}

export function toggleMusic() {
  initAudio();
  musicEnabled = !musicEnabled;
  if (musicGain && ctx) {
    musicGain.gain.setValueAtTime(musicEnabled ? 0.65 : 0, ctx.currentTime);
  }
  return musicEnabled;
}

// Fallback tone for legacy compatibility
export function tone(freq = 280, len = 0.07, type = 'sine', volume = 0.05) {
  if (!ctx || !soundEnabled) return;
  try {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), ctx.currentTime + len);
    a.gain.setValueAtTime(volume, ctx.currentTime);
    a.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    o.connect(a);
    a.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + len);
  } catch (e) {}
}
