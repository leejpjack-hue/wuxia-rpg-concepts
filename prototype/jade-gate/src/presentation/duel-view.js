/**
 * Presentation controller for the 2-card turn-based duel view.
 * Handles action buttons (Strike, Guard, Technique, Tea), meters, and intent previews.
 */
export class DuelView {
  constructor(session, doc = document, gesture = () => {}) {
    this.session = session;
    this.doc = doc;
    this.gesture = gesture;
    this.el = doc.getElementById("play");

    this.onKeyDown = (e) => {
      if (session.mode !== "playing" || !session.combat?.duel) return;
      if (e.key === "1") session.combat.strike();
      else if (e.key === "2") session.combat.guard();
      else if (e.key === "3") session.combat.technique();
      else if (e.key === "4") session.combat.tea();
    };

    doc.addEventListener("keydown", this.onKeyDown);
  }

  dispose() {
    this.doc.removeEventListener("keydown", this.onKeyDown);
  }
}
