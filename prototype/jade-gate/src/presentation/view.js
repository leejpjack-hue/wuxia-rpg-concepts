import { HEROES } from "../content/heroes.js";
import { UPGRADES } from "../content/disciplines.js";
import { ACTS, CULTIVATIONS, actById } from "../content/campaign.js";
import { cultivationCost } from "../domain/progression.js";
export class GameView {
  constructor(session, document, onGesture = () => {}) {
    this.session = session;
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.heroId = HEROES[0].id;
    this.runMode = "campaign";
    this.ready = false;
    this.noticeTime = 0;
    this.onGesture = onGesture;
    this.$("heroes").innerHTML = HEROES.map(
      (hero, index) =>
        `<button class="hero-card" data-hero="${hero.id}" aria-pressed="false" aria-label="Choose ${hero.name}"><img src="assets/${hero.id}.png" alt="${hero.name} concept art"><span class="card-number">0${index + 1} / ${hero.cn}</span><span class="card-check">✓</span><div class="card-copy"><small>${hero.title}</small><h2>${hero.name}</h2><p>${hero.weapon}</p><div class="stats">${hero.style.toUpperCase()}</div><span class="lock-note"></span></div></button>`,
    ).join("");
    for (const button of document.querySelectorAll("[data-hero]"))
      button.onclick = () => {
        this.onGesture();
        this.heroId = button.dataset.hero;
        this.refreshMenu();
        session.bus.emit("audio:sfx", { type: "ui_click" });
      };
    for (const button of document.querySelectorAll("[data-mode]"))
      button.onclick = () => {
        this.runMode = button.dataset.mode;
        if (
          this.runMode === "campaign" &&
          !session.profile.unlockedHeroes.includes(this.heroId)
        )
          this.heroId = HEROES[0].id;
        this.refreshMenu();
      };
    this.$("start").onclick = () =>
      this.perform(() => session.start(this.heroId, this.runMode));
    this.$("continue").onclick = () =>
      this.perform(() => session.continueCheckpoint());
    this.$("pause").onclick = () => session.pause();
    for (const [id, key] of [
      ["sound", "sound"],
      ["music", "music"],
      ["motion", "reducedMotion"],
    ])
      this.$(id).onclick = () =>
        this.perform(() =>
          session.setSetting(key, !session.profile.settings[key]),
        );
    for (const key of ["masterVolume", "musicVolume", "sfxVolume"])
      this.$(key).oninput = (event) =>
        this.perform(() => session.setSetting(key, Number(event.target.value)));
    this.$("overlay").addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const buttons = [
          ...this.$("overlay").querySelectorAll("button:not(:disabled)"),
        ],
        first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    this.off = [
      session.bus.on("state:changed", () => this.render()),
      session.bus.on("dialogue:changed", () => this.render()),
      session.bus.on("profile:changed", () => {
        this.settings();
        this.refreshMenu();
        if (session.mode === "waystation") this.render();
      }),
      session.bus.on("notice", ({ text }) => this.notice(text)),
      session.bus.on("boss:phase", ({ name }) => this.notice(name)),
    ];
    this.render();
  }
  perform(fn) {
    this.onGesture();
    try {
      fn();
    } catch (error) {
      this.$("save-status").textContent = error.message;
    }
  }
  settings() {
    const s = this.session.profile.settings;
    for (const id of ["sound", "music"]) {
      this.$(id).textContent =
        `${id === "sound" ? "Sound" : "Music"} ${s[id] ? "on" : "off"}`;
      this.$(id).setAttribute("aria-pressed", String(s[id]));
    }
    this.$("motion").textContent = s.reducedMotion
      ? "Motion reduced"
      : "Motion on";
    this.$("motion").setAttribute("aria-pressed", String(s.reducedMotion));
    for (const key of ["masterVolume", "musicVolume", "sfxVolume"])
      this.$(key).value = s[key];
    this.$("save-status").textContent = this.session.store.warning;
  }
  refreshMenu() {
    const profile = this.session.profile,
      hero = HEROES.find((h) => h.id === this.heroId);
    for (const button of this.document.querySelectorAll("[data-hero]")) {
      const selected = button.dataset.hero === this.heroId,
        locked =
          this.runMode === "campaign" &&
          !profile.unlockedHeroes.includes(button.dataset.hero);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = locked;
      button.querySelector(".lock-note").textContent = locked
        ? "Unlock in Act III · try in Quick play"
        : "";
    }
    for (const button of this.document.querySelectorAll("[data-mode]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mode === this.runMode),
      );
    this.$("hero-description").textContent = hero.description;
    const record = profile.records[this.heroId];
    this.$("record").textContent = record
      ? `Personal best: ${record.best} renown · ${record.wins} victories`
      : "A new legend awaits. Your best run is saved on this device.";
    this.$("start").disabled = !this.ready;
    this.$("start").textContent = this.ready
      ? this.runMode === "campaign"
        ? "Begin the journey →"
        : "Enter quick play →"
      : "Preparing your journey…";
    this.$("continue").hidden = !profile.checkpoint;
    this.$("continue").disabled = !this.ready;
    this.$("journey-summary").textContent =
      this.runMode === "campaign"
        ? `Campaign · ${profile.wallet} Renown · checkpoint saves between encounters`
        : "Quick play · all four heroes · no permanent cultivation bonuses";
    this.$("campaign-route").innerHTML = ACTS.map(
      (act) =>
        `<span class="route-act ${profile.completedActs.includes(act.id) ? "complete" : ""}"><b>0${act.number}</b> ${act.name}<small>${profile.completedActs.includes(act.id) ? "Reclaimed" : act.available ? "Playable" : "In development"}</small></span>`,
    ).join("");
  }
  setReady(value) {
    this.ready = value;
    this.refreshMenu();
  }
  notice(text) {
    this.$("banner").textContent = text;
    this.$("banner").classList.add("show");
    this.noticeTime = 2.5;
  }
  modal(kicker, title, copy) {
    this.$("overlay").hidden = false;
    this.$("modal-kicker").textContent = kicker;
    this.$("modal-title").textContent = title;
    this.$("modal-copy").textContent = copy;
    this.$("choices").innerHTML = "";
    this.$("modal-actions").innerHTML = "";
  }
  button(
    label,
    fn,
    { primary = false, disabled = false, parent = "modal-actions" } = {},
  ) {
    const button = this.document.createElement("button");
    button.textContent = label;
    button.disabled = disabled;
    if (primary) button.className = "primary";
    button.onclick = () => this.perform(fn);
    this.$(parent).append(button);
    return button;
  }
  render() {
    const session = this.session,
      g = session.g,
      mode = session.mode;
    this.$("selection").hidden = mode !== "menu";
    this.$("play").hidden = mode === "menu";
    this.$("overlay").hidden = true;
    // Modal scenes own focus and block background controls until dismissed.
    this.$("selection").inert = false;
    this.$("play").inert = false;
    this.settings();
    this.refreshMenu();
    if (g) {
      this.$("hud-portrait").src = `assets/${g.p.id}.png`;
      this.$("hero-name").textContent = g.p.name;
      this.$("skill-name").textContent = g.p.skill;
      this.hud(0);
    }
    if (mode === "playing") {
      this.$("arena").focus();
      return;
    }
    if (mode === "menu") return;
    if (mode === "dialogue") {
      const d = session.dialogue,
        line = d.lines[d.index];
      this.modal(
        `${session.act.name} · ${d.index + 1} / ${d.lines.length}`,
        line.speaker,
        line.text,
      );
      this.button(
        d.index === d.lines.length - 1
          ? d.key === "warden-fall"
            ? "Enter the tea house"
            : "Draw your blade"
          : "Continue",
        () => session.advanceDialogue(),
        { primary: true },
      );
      this.button("Skip conversation", () => session.advanceDialogue(true));
    } else if (mode === "paused") {
      this.modal(
        "A MOMENT OF STILLNESS",
        "The mountain can wait.",
        "The journey is paused. Campaign Continue returns to the last encounter checkpoint.",
      );
      this.button("Resume journey", () => session.resume(), { primary: true });
      this.button("Return to roster", () => session.menu());
    } else if (mode === "upgrade") {
      this.modal(
        `ENCOUNTER ${g.wave} COMPLETE`,
        "A lesson earned.",
        "Choose a discipline for this run. The next encounter restores 22 health and 20 Flow.",
      );
      for (const item of UPGRADES) {
        const b = this.button(
          `${item.name} — ${item.description}`,
          () => session.chooseDiscipline(item.id),
          { parent: "choices" },
        );
        b.className = "upgrade";
      }
    } else if (mode === "waystation") {
      this.modal(
        "THE TEA HOUSE · 草庵茶肆",
        "Rest between the storms.",
        `${session.profile.wallet} Renown available. Cultivation and weapon honing apply on your next campaign run. Your checkpoint is saved here.`,
      );
      for (const item of CULTIVATIONS) {
        const { rank, cost, maxed } = cultivationCost(session.profile, item.id);
        const b = this.button(
          `${item.name} ${rank}/${item.maxRank} · ${maxed ? "Mastered" : cost + " Renown"} · ${item.description}`,
          () => session.buy(item.id),
          {
            disabled: maxed || cost > session.profile.wallet,
            parent: "choices",
          },
        );
        b.className = "upgrade";
      }
      const next = actById(session.act.next);
      this.button(
        next?.available
          ? `Travel to ${next.name}`
          : `${next?.name || "The journey"} · in development`,
        () => session.start(g.p.id, "campaign", next.id),
        { primary: true, disabled: !next?.available },
      );
      this.button("Return to roster", () => session.menu());
    } else {
      const won = mode === "victory";
      this.modal(
        won ? "THE OATH ENDURES" : "EVERY LEGEND BEGINS AGAIN",
        won ? "The gate is yours." : "Rise, and try again.",
        `${g.p.name} · ${g.score} renown · ${g.totalKills} foes defeated · ${Math.floor(g.time / 60)}m ${Math.floor(g.time % 60)}s.`,
      );
      this.button(
        "Walk the path again",
        () => session.start(g.p.id, g.runMode, g.actId),
        { primary: true },
      );
      this.button("Choose another hero", () => session.menu());
    }
    this.$("play").inert = true;
    this.$("selection").inert = true;
    this.$("overlay").querySelector("button:not(:disabled)")?.focus();
  }
  hud(dt) {
    const g = this.session.g;
    if (!g) return;
    const p = g.p;
    this.$("hp-text").textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    this.$("hp-bar").style.width = `${(100 * p.hp) / p.maxHp}%`;
    this.$("flow-text").textContent = `${Math.floor(p.flow)} / 100`;
    this.$("flow-bar").style.width = `${p.flow}%`;
    this.$("score").textContent = g.score;
    this.$("chapter").textContent =
      `ACT ${this.session.act.number} · ENCOUNTER ${g.wave} / ${this.session.act.encounters.length}`;
    this.$("objective").textContent = this.session.encounter.title;
    this.$("combat-tip").textContent = this.session.encounter.tip;
    this.$("kills").textContent =
      `${g.enemies.length} enemies remain · ${p.combo} hit chain · ${g.totalKills} defeated`;
    for (const [id, cd] of [
      ["attack", p.attackCD],
      ["dodge", p.dodgeCD],
    ])
      this.$(`${id}-status`).textContent =
        cd > 0 ? `${cd.toFixed(1)}s` : "READY";
    this.$("special-status").textContent =
      p.specialCD > 0 ? `${p.specialCD.toFixed(1)}s` : `${p.cost} FLOW`;
    this.$("special").style.borderColor =
      p.flow >= p.cost && p.specialCD === 0 ? "#ceb88b" : "";
    const boss = g.enemies.find((e) => e.type === "boss");
    this.$("boss-hud").hidden = !boss;
    if (boss) {
      this.$("boss-name").textContent =
        `${boss.name} · PHASE ${boss.phase + 1}`;
      this.$("boss-bar").style.width = `${(100 * boss.hp) / boss.maxHp}%`;
    }
    if (this.noticeTime > 0) {
      this.noticeTime -= dt;
      if (this.noticeTime <= 0) this.$("banner").classList.remove("show");
    }
  }
  dispose() {
    this.off.forEach((off) => off());
  }
}
