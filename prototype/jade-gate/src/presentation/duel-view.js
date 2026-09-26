import { translate } from "../locales/i18n.js";
import { DuelCinematic } from "./duel-cinematic.js";
import { HERO_TECHNIQUES } from "../content/duels.js";

export class DuelView {
  constructor(session, document, onGesture = () => {}) {
    this.session = session;
    this.t = text => translate(text, session.profile.settings.language);
    this.language = session.profile.settings.language;
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.onGesture = onGesture;
    this.busy = false;
    this.cinematic = new DuelCinematic(document, this.$("duel-table"), cue => session.bus.emit("audio:sfx", cue), text => this.t(text));
    for (const button of document.querySelectorAll("[data-action]"))
      button.onclick = () => this.act(button.dataset.action);
    for (const id of ["hero-image", "enemy-image"])
      this.$(id).onerror = () => { this.$(id).hidden = true; };
    this.keydown = (event) => {
      if (event.repeat || event.altKey || event.metaKey || event.ctrlKey ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.key === "Escape" && ["playing", "paused"].includes(session.mode)) {
        event.preventDefault();
        session.pause();
      } else if (session.mode === "playing") {
        const action = { "1": "attack", "2": "guard", "3": "technique", "4": "tea" }[event.key];
        if (action) { event.preventDefault(); this.act(action); }
      }
    };
    document.addEventListener("keydown", this.keydown);
    this.off = [
      session.bus.on("settings:changed", settings => {
        if (this.language !== settings.language) {
          this.language = settings.language;
          this.cinematic.cancel(); this.busy = false;
          this.render();
        }
      }),
      session.bus.on("card:changed", () => this.render()),
      session.bus.on("state:changed", () => {
        this.cinematic.cancel();
        this.busy = false;
        this.$("duel-table").className = "duel-table";
        this.render();
      }),
    ];
    this.render();
  }
  act(action) {
    if (this.busy || this.session.mode !== "playing") return;
    this.onGesture();
    this.busy = true;
    try {
      const result = this.session.combat.preview(action);
      if (!result) { this.busy = false; this.render(); return; }
      this.render();
      this.$("duel-table").scrollIntoView({ block: "center", behavior: "instant" });
      const combat = this.session.combat;
      const reduced = this.session.profile.settings.reducedMotion;
      this.cinematic.play(action, this.session.g.p, this.session.g.enemies[0], result, reduced, () => {
        this.busy = false;
        if (this.session.mode === "playing" && this.session.combat === combat) combat.act(action, { silent: true });
        this.render();
      });
    } catch (error) {
      this.cinematic.cancel(); this.busy = false;
      this.$("app-status").textContent = this.t(error.message);
      this.render();
    }
  }

  image(id, art, name, focus) {
    const img = this.$(id), path = `assets/${art}.png`;
    if (img.getAttribute("src") !== path) { img.hidden = false; img.src = path; }
    img.alt = this.t(name);
    img.style.objectPosition = focus || "";
  }
  meter(id, value, max) {
    this.$(`${id}-bar`).style.width = `${Math.max(0, Math.min(100, value / max * 100))}%`;
    const meter = this.$(`${id}-meter`);
    meter.setAttribute("aria-valuenow", Math.ceil(value));
    meter.setAttribute("aria-valuemin", 0);
    meter.setAttribute("aria-valuemax", max);
  }
  render() {
    const { g, mode } = this.session;
    if (!g?.duel) return;
    const p = g.p, d = g.duel, enemy = g.enemies[0];
    this.$("chapter").textContent = this.t(`ACT ${this.session.act.number} · ${this.session.act.name.toUpperCase()}`);
    this.$("objective").textContent = this.t(this.session.encounter.title);
    this.$("score").textContent = this.t(g.score);
    this.$("encounter-track").replaceChildren(...this.session.act.encounters.map((encounter, index) => {
      const step = this.document.createElement("span");
      step.textContent = `${index < g.encounterIndex ? "✓" : "0" + (index + 1)} · ${this.t(encounter.title)}`;
      step.className = index === g.encounterIndex ? "current" : index < g.encounterIndex ? "complete" : "";
      if (index === g.encounterIndex) step.setAttribute("aria-current", "step");
      return step;
    }));
    this.$("hero-name").textContent = this.t(p.name);
    this.$("hero-symbol").textContent = this.t(p.cn);
    this.$("hero-title").textContent = this.t(p.title);
    this.$("hero-card").style.setProperty("--fighter-color", p.color);
    this.image("hero-image", p.id, p.name, p.artFocus);
    this.$("hero-health").textContent = this.t(`${Math.ceil(p.hp)} / ${p.maxHp}`);
    this.$("hero-flow").textContent = this.t(`${Math.floor(p.flow)} / 100`);
    this.meter("hero-health", p.hp, p.maxHp);
    this.meter("hero-flow", p.flow, 100);
    this.$("round-number").textContent = this.t(`TURN ${d.round}`);
    this.$("duel-number").textContent = this.t(`DUEL ${Math.min(d.defeated + 1, d.total)} / ${d.total}`);
    if (enemy) {
      this.$("enemy-name").textContent = this.t(enemy.name);
      this.$("enemy-title").textContent = this.t(enemy.title);
      this.$("enemy-phase").textContent = this.t(enemy.type === "boss" ? `STANCE ${enemy.phase + 1}` : "灰旗");
      this.image("enemy-image", enemy.art, enemy.name);
      this.$("enemy-health").textContent = this.t(`${enemy.hp} / ${enemy.maxHp}`);
      this.meter("enemy-health", enemy.hp, enemy.maxHp);
      const intent = this.session.combat.intent();
      this.$("enemy-intent").textContent = this.t(intent.name + (intent.damage ? ` · ${intent.damage} damage` : ""));
      this.$("intent-detail").textContent = this.t(intent.description);
      this.$("enemy-card").dataset.intent = intent.kind;
      this.$("attack-detail").textContent = this.t(`${Math.round(p.damage * p.power * (intent.kind === "guard" ? 0.5 : 1))} damage · +${12 + p.flowBonus} Flow`);
    }
    const technique = HERO_TECHNIQUES[p.id];
    this.$("technique-name").textContent = this.t(p.skill);
    this.$("technique-detail").textContent = this.t(`${Math.round(p.damage * p.power * technique.multiplier)} damage · ${p.cost} Flow`);
    this.$("technique-help").textContent = `${this.t(p.skill)}: ${this.t(technique.description)} ${this.t("All techniques pierce guard.")}`;
    this.$("tea-detail").textContent = this.t(`Recover 30 health · ${d.tea} left this encounter`);
    for (const button of this.document.querySelectorAll("[data-action]")) {
      button.disabled = this.busy || mode !== "playing" ||
        (button.dataset.action === "technique" && p.flow < p.cost) ||
        (button.dataset.action === "tea" && (d.tea < 1 || p.hp >= p.maxHp));
    }
    this.$("turn-status").textContent = this.t(this.busy ? "Blades meet…" : d.log[0] || "Your turn. Take your time.");
    this.$("journal-count").textContent = this.t(`${g.turns} turns taken`);
    this.$("battle-log").replaceChildren(...d.log.map((text) => {
      const li = this.document.createElement("li"); li.textContent = this.t(text); return li;
    }));
  }
  dispose() {
    this.cinematic.cancel();
    this.off.forEach((off) => off());
    this.document.removeEventListener("keydown", this.keydown);
  }
}
