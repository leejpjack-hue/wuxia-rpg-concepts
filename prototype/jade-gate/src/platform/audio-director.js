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
      bus.on("state:changed", ({ current, boss }) =>
        backend.setMusicMode(
          current === "playing"
            ? boss
              ? "boss"
              : "battle"
            : { menu: "select", dialogue: "upgrade", waystation: "select" }[
                current
              ] || current,
        ),
      ),
      bus.on("settings:changed", (settings) => {
        this.settings = settings;
        backend.setAudioSettings(settings);
      }),
      bus.on("boss:phase", () => backend.playSfx("finisher")),
      bus.on("combat:evade", () => backend.playSfx("dodge")),
    ];
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
