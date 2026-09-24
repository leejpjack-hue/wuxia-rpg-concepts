/**
 * Maps story and gameplay state transitions to procedural audio modes:
 * - select: menu, tea house waystation, arrival story dialogue
 * - battle: standard combat encounters
 * - boss: boss encounters and pre-boss confrontation dialogue
 * - upgrade: between-encounter discipline/boon choices
 * - victory: quick-play victory or campaign boss resolution dialogue
 * - defeat: combat loss
 * - paused: combat pause
 */
export function resolveMusicMode(event) {
  if (!event) return "select";
  const { current, boss, dialogueKey, stage } = event;

  if (current === "playing") {
    return boss ? "boss" : "battle";
  }

  if (current === "dialogue") {
    const key = dialogueKey || stage;
    if (key === "warden-fall" || key === "heron-fall" || key?.endsWith("-fall")) return "victory";
    if (key === "warden-intro" || key === "heron-intro" || key?.endsWith("-intro")) return "boss";
    if (key === "arrival" || key === "bamboo-arrival" || key?.endsWith("-arrival")) return "select";
    return "select";
  }

  if (current === "menu" || current === "waystation") {
    return "select";
  }

  if (current === "upgrade") {
    return "upgrade";
  }

  if (current === "paused") {
    return "paused";
  }

  if (current === "victory") {
    return "victory";
  }

  if (current === "defeat") {
    return "defeat";
  }

  return current || "select";
}

/** Maps domain events to an injected synth backend; no combat code imports Web Audio. */
export class AudioDirector {
  constructor(bus, backend, settings) {
    this.backend = backend;
    this.settings = settings;
    this.lastWarning = -Infinity;
    this.now = () => Date.now();
    backend.setAudioSettings(settings);
    this.off = [
      bus.on("audio:sfx", ({ type, param }) => {
        if (type === "enemy_windup") {
          const now = this.now();
          if (now - this.lastWarning < 120) return;
          this.lastWarning = now;
        }
        backend.playSfx(type, param);
      }),
      bus.on("state:changed", (event) => {
        backend.setMusicMode(resolveMusicMode(event));
      }),
      bus.on("settings:changed", (settings) => {
        this.settings = settings;
        backend.setAudioSettings(settings);
      }),
      bus.on("boss:phase", () => backend.playSfx("finisher")),
      bus.on("combat:evade", () => backend.playSfx("dodge")),
    ];
  }
  static resolveMusicMode(event) {
    return resolveMusicMode(event);
  }
  resolveMusicMode(event) {
    return resolveMusicMode(event);
  }
  unlock() {
    if (this.backend.audioStatus().state !== "running") {
      this.backend.resumeAudio();
      this.backend.setAudioSettings(this.settings);
    }
  }
  hidden() {
    this.backend.suspendAudio();
  }
  dispose() {
    this.off.forEach((off) => off());
    return this.backend.disposeAudio();
  }
}
