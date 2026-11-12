/** Which first-run lesson is on screen, or null when the tutor stays quiet. */
export function tutorLesson(settings, mode) {
  if (!settings || settings.tutorSkipped) return null;
  if (mode === "exploring" && !settings.tutorSeenMove) return "move";
  if (mode === "playing" && !settings.tutorSeenDuel) return "duel";
  return null;
}

/** Pass movement, then the four shipped duel actions. Skip hides both forever. */
export class FirstRunTutor {
  constructor(session, document) {
    this.session = session;
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.openedPad = false;
    const mark = (key) => () => session.setSetting(key, true);
    this.$("tutor-move-done").onclick = mark("tutorSeenMove");
    this.$("tutor-skip-move").onclick = mark("tutorSkipped");
    this.$("tutor-duel-done").onclick = mark("tutorSeenDuel");
    this.$("tutor-skip-duel").onclick = mark("tutorSkipped");
    this.off = [
      session.bus.on("state:changed", () => this.sync()),
      session.bus.on("settings:changed", () => this.sync()),
    ];
    this.sync();
  }
  sync() {
    const lesson = tutorLesson(this.session.profile.settings, this.session.mode);
    this.$("tutor-move").hidden = lesson !== "move";
    this.$("tutor-duel").hidden = lesson !== "duel";
    if (lesson === "move" && !this.openedPad) {
      const menu = this.$("roam-menu");
      if (menu) menu.open = true;
      this.openedPad = true;
    }
  }
  dispose() {
    this.off.forEach((off) => off());
  }
}
