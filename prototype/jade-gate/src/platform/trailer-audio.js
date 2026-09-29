import { TRAILER_VOICE, TRAILER_DURATION } from '../content/trailer.js';

// One context owns the score, effects, voice and clock, including pause/resume.
export class TrailerAudio {
  constructor() { this.context = null; this.buffers = new Map(); this.nodes = []; this.muted = false; }
  async prepare(language) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('audio-unavailable');
    this.context ||= new AudioContext();
    await this.context.resume();
    this.output ||= this.context.createGain();
    if (!this.connected) { this.output.connect(this.context.destination); this.connected = true; }
    this.output.gain.value = this.muted ? 0 : .8;
    await Promise.all(TRAILER_VOICE.map(async cue => {
      const key = `${language}-${cue.file}`;
      if (this.buffers.has(key)) return;
      const response = await fetch(`assets/trailer/${key}.wav`);
      if (!response.ok) throw new Error('voice-unavailable');
      this.buffers.set(key, await this.context.decodeAudioData(await response.arrayBuffer()));
    }));
  }
  mute(value) { this.muted = value; if (this.output) this.output.gain.setTargetAtTime(value ? 0 : .8, this.context.currentTime, .015); }
  start(language) {
    this.stop();
    const ctx = this.context;
    this.origin = ctx.currentTime + .08;
    const master = ctx.createGain(), limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.ratio.value = 8;
    master.connect(limiter); limiter.connect(this.output);
    master.gain.setValueAtTime(1, this.origin);
    master.gain.setValueAtTime(1, this.origin + 9.65);
    master.gain.linearRampToValueAtTime(0, this.origin + TRAILER_DURATION);
    this.mix = master; this.limiter = limiter;
    const tone = (at, frequency, duration, level, type = 'sine', endFrequency = frequency) => {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, this.origin + at);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, this.origin + at + duration);
      gain.gain.setValueAtTime(0, this.origin + at);
      gain.gain.linearRampToValueAtTime(level, this.origin + at + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, this.origin + at + duration);
      oscillator.connect(gain); gain.connect(master);
      oscillator.start(this.origin + at); oscillator.stop(this.origin + at + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      this.nodes.push(oscillator);
    };
    // Pentatonic plucks, low strings, rising percussion and a final bronze chord.
    [73.42,110,146.83].forEach(f => tone(0, f, 9.8, .026, 'triangle'));
    const notes = [293.66,440,523.25,587.33,440,349.23,293.66,261.63];
    for (let i = 0; i < 24; i++) {
      const at = i * .32 + .08;
      tone(at, notes[(i * 3 + Math.floor(i / 8)) % notes.length], .6, .045, 'triangle');
      if (i % 2 === 0) tone(at, 105, .22, .17, 'sine', 36);
    }
    for (const at of [0,2.15,4.2,5.15,5.65,6.5,8]) {
      tone(at, 125, .5, .22, 'sine', 38);
      this.noise(at, at === 8 ? 1.7 : .36, .085, master);
    }
    this.noise(4.65, .48, .12, master);
    [146.83,293.66,440,587.33].forEach(f => tone(8, f, 1.95, .058, 'triangle'));
    for (const cue of TRAILER_VOICE) {
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = this.buffers.get(`${language}-${cue.file}`);
      source.playbackRate.value = Math.max(1, source.buffer.duration / (cue.end - cue.start));
      gain.gain.value = .95; source.connect(gain); gain.connect(master);
      source.start(this.origin + cue.start); source.stop(this.origin + cue.end);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      this.nodes.push(source);
    }
  }
  noise(at, duration, level, destination) {
    const ctx = this.context, buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0); let seed = 1729;
    for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741824 - 1; }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.Q.value = .6;
    filter.frequency.setValueAtTime(300, this.origin + at);
    filter.frequency.exponentialRampToValueAtTime(3800, this.origin + at + duration * .5);
    gain.gain.setValueAtTime(0, this.origin + at);
    gain.gain.linearRampToValueAtTime(level, this.origin + at + duration * .3);
    gain.gain.linearRampToValueAtTime(0, this.origin + at + duration);
    source.connect(filter); filter.connect(gain); gain.connect(destination);
    source.start(this.origin + at); source.stop(this.origin + at + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    this.nodes.push(source);
  }
  get time() { return Math.max(0, this.context.currentTime - this.origin); }
  pause() { return this.context?.suspend(); }
  resume() { return this.context?.resume(); }
  stop() {
    for (const node of this.nodes) { try { node.stop(); } catch {} node.disconnect(); }
    this.nodes = []; this.mix?.disconnect(); this.limiter?.disconnect();
  }
  dispose() { this.stop(); return this.context?.close(); }
}
