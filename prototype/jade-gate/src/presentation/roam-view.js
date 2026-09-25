/**
 * Presentation controller for the pass roaming view.
 * Handles DOM sprites, d-pad / keyboard input, and requestAnimationFrame stepping.
 */
export class RoamView {
  constructor(session, doc = document, gesture = () => {}) {
    this.session = session;
    this.doc = doc;
    this.gesture = gesture;
    this.el = doc.getElementById("roam");
    this.heroEl = doc.getElementById("roam-hero");
    this.arenaEl = doc.getElementById("roam-arena");
    this.keys = new Set();
    this.animId = null;

    this.onKeyDown = (e) => {
      if (session.mode !== "playing" || this.session.combat?.duel) return;
      this.keys.add(e.code);
    };
    this.onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    doc.addEventListener("keydown", this.onKeyDown);
    doc.addEventListener("keyup", this.onKeyUp);
  }

  dispose() {
    this.doc.removeEventListener("keydown", this.onKeyDown);
    this.doc.removeEventListener("keyup", this.onKeyUp);
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
