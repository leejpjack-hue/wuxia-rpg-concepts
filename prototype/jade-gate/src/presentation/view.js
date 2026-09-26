import { translate, localizeDocument } from "../locales/i18n.js";
import { HEROES } from "../content/heroes.js";
import { UPGRADES } from "../content/disciplines.js";
import { ACTS, CULTIVATIONS, actById } from "../content/campaign.js";
import { cultivationCost } from "../domain/progression.js";
import { curioById, EVENTS } from "../content/curios.js";
export class GameView {
  constructor(session, document, onGesture = () => {}) {
    this.session = session;
    this.t = text => translate(text, session.profile.settings.language);
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.heroId = HEROES[0].id;
    this.runMode = "campaign";
    this.ready = false;
    this.noticeTime = 0;
    this.onGesture = onGesture;
    this.$("heroes").innerHTML = HEROES.map(
      (hero, index) =>
        `<button class="hero-card" data-hero="${hero.id}" aria-pressed="false" aria-label="Choose ${hero.name}"><img src="assets/${hero.id}.png" alt="${hero.name} character art" style="object-position: ${hero.artFocus || "50% 18%"}"><span class="card-number">0${index + 1} / ${hero.cn}</span><span class="card-check">✓</span><div class="card-copy"><small>${hero.title}</small><h2>${hero.name}</h2><p>${hero.weapon}</p><div class="stats">${hero.style.toUpperCase()}</div><span class="lock-note"></span><p class="card-biography" hidden></p></div></button>`,
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
          (!session.profile.unlockedHeroes.includes(this.heroId) || HEROES.find(h => h.id === this.heroId)?.quickPlayOnly)
        )
          this.heroId = HEROES[0].id;
        this.refreshMenu();
      };
    this.$("language").onchange = event => this.perform(() => session.setSetting("language", event.target.value));
    this.$("start").onclick = () =>
      this.perform(() => session.start(this.heroId, this.runMode));
    this.$("continue").onclick = () =>
      this.perform(() => session.continueCheckpoint());
    for (const id of ["pause", "roam-pause"])
      this.$(id).onclick = () => session.pause();
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
        const languageChanged = this.language !== session.profile.settings.language;
        this.settings();
        this.refreshMenu();
        if (languageChanged || session.mode === "waystation") this.render();
      }),
      session.bus.on("notice", ({ text }) => this.notice(text)),
      session.bus.on("boss:phase", ({ name }) => this.notice(name)),
    ];
    this.settings();
    this.render();
  }
  perform(fn) {
    try {
      this.onGesture();
      this.$("app-status").textContent = "";
      fn();
    } catch (error) {
      this.$("app-status").textContent = this.t(error.message);
    }
  }
  settings() {
    const s = this.session.profile.settings;
    this.language = s.language;
    this.$("language").value = s.language;
    localizeDocument(this.document, s.language);
    this.document.body.classList.toggle("reduced-motion", s.reducedMotion);
    for (const id of ["sound", "music"]) {
      this.$(id).textContent =
        this.t(`${id === "sound" ? "Sound" : "Music"} ${s[id] ? "on" : "off"}`);
      this.$(id).setAttribute("aria-pressed", String(s[id]));
    }
    this.$("motion").textContent = this.t(s.reducedMotion ? "Motion reduced" : "Motion on");
    this.$("motion").setAttribute("aria-pressed", String(s.reducedMotion));
    for (const key of ["masterVolume", "musicVolume", "sfxVolume"])
      this.$(key).value = s[key];
    this.$("save-status").textContent = this.t(this.session.store.warning);
  }
  refreshMenu() {
    const profile = this.session.profile,
      hero = HEROES.find((h) => h.id === this.heroId);
    for (const button of this.document.querySelectorAll("[data-hero]")) {
      const selected = button.dataset.hero === this.heroId,
        locked =
          this.runMode === "campaign" &&
          !profile.unlockedHeroes.includes(button.dataset.hero);
      const cardHero = HEROES.find(h => h.id === button.dataset.hero);
      button.hidden = this.runMode === "campaign" && !!cardHero.quickPlayOnly;
      button.setAttribute("aria-label", this.t(`Choose ${cardHero.name}`));
      button.querySelector("img").alt = this.t(`${cardHero.name} character art`);
      for (const [selector, value] of [[".card-copy small", cardHero.title], ["h2", cardHero.name], [".card-copy p", cardHero.weapon], [".stats", cardHero.style]])
        button.querySelector(selector).textContent = this.t(value);
      const biography = button.querySelector(".card-biography");
      biography.hidden = !selected;
      biography.textContent = selected ? this.t(cardHero.description) : "";
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = locked;
      button.querySelector(".lock-note").textContent = this.t(locked ? "Unlock in Act III · try in Quick play" : cardHero.quickPlayOnly ? "Quick play only" : "");
    }
    for (const button of this.document.querySelectorAll("[data-mode]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mode === this.runMode),
      );
    this.$("selected-hero-name").textContent = this.t(hero.name);
    this.$("hero-description").textContent = this.t(hero.description);
    const record = profile.records[this.heroId];
    this.$("record").textContent = this.t(record
      ? `Personal best: ${record.best} renown · ${record.wins} victories`
      : "A new legend awaits. Your best run is saved on this device.");
    this.$("start").disabled = !this.ready;
    this.$("start").textContent = this.t(this.ready
      ? this.runMode === "campaign"
        ? "Begin the journey →"
        : "Enter quick play →"
      : "Preparing your journey…");
    this.$("continue").hidden = this.runMode !== "campaign" || !profile.checkpoint;
    this.$("continue").disabled = !this.ready;
    this.$("journey-summary").textContent =
      this.t(this.runMode === "campaign"
        ? `Campaign · ${profile.wallet} Renown · checkpoint saves between encounters`
        : "Quick play · all nine heroes · no permanent cultivation bonuses");
    this.$("campaign-route").innerHTML = ACTS.map(
      (act) =>
        `<span class="route-act ${profile.completedActs.includes(act.id) ? "complete" : ""}"><b>0${act.number}</b> ${this.t(act.name)}<small>${this.t(profile.completedActs.includes(act.id) ? "Reclaimed" : act.available ? "Playable" : "In development")}</small></span>`,
    ).join("");
  }
  setReady(value) {
    this.ready = value;
    this.refreshMenu();
  }
  notice(text) {
    clearTimeout(this.noticeTimer);
    this.$("banner").textContent = this.t(text);
    this.$("banner").classList.add("show");
    this.noticeTime = 2.5;
    // The banner lives outside the scene mains now, so clear it ourselves.
    this.noticeTimer = setTimeout(() => {
      this.$("banner").classList.remove("show");
      this.$("banner").textContent = "";
    }, 2600);
  }
  modal(kicker, title, copy) {
    this.$("overlay").hidden = false;
    this.$("modal-kicker").textContent = this.t(kicker);
    this.$("modal-title").textContent = this.t(title);
    this.$("modal-copy").textContent = this.t(copy);
    this.$("choices").innerHTML = "";
    this.$("modal-actions").innerHTML = "";
  }
  button(
    text,
    onClick,
    { primary = false, disabled = false, parent = "modal-actions" } = {},
  ) {
    const btn = this.document.createElement("button");
    btn.textContent = this.t(text);
    btn.disabled = disabled;
    if (primary) btn.classList.add("primary");
    btn.onclick = () => this.perform(onClick);
    this.$(parent).appendChild(btn);
    return btn;
  }
  /** The pass forks: curio drafts and events resolve here, then node choices. */
  renderMap(g) {
    const session = this.session;
    const map = g.map;
    const carried = (g.curios || [])
      .map((id) => curioById(id))
      .filter(Boolean)
      .map((curio) => `${curio.icon} ${curio.name}`)
      .join(" · ");
    if (map.pendingCurios.length) {
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        "A curio recovered",
        map.pendingCurios.length > 1
          ? "The fallen carried curios. Choose one to carry for the rest of the run."
          : "A sealed box from the wayside. Take the curio within.",
      );
      for (const id of map.pendingCurios) {
        const curio = curioById(id);
        const b = this.button(
          `${this.t(curio.name)} ${curio.icon} — ${this.t(curio.description)}`,
          () => session.chooseCurio(id),
          { parent: "choices", primary: true },
        );
        b.className = "upgrade";
      }
    } else if (map.event && EVENTS[map.event]) {
      const event = EVENTS[map.event];
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        event.title,
        event.text,
      );
      event.choices.forEach((choice, index) => {
        const b = this.button(
          `${this.t(choice.label)} — ${this.t(choice.description)}`,
          () => session.resolveEvent(index),
          { parent: "choices", primary: index === 0 },
        );
        b.className = "upgrade";
      });
    } else {
      const rows = session.act.map.rows;
      const nodes = rows[map.row] || [];
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        "The pass forks ahead",
        carried
          ? `Choose your next step. Carried curios: ${this.t(carried)}`
          : "Choose your next step along the pass.",
      );
      for (const node of nodes) {
        if (map.cleared.includes(node)) continue;
        const info = session.nodeInfo(node);
        let label;
        if (node.startsWith("rest:"))
          label = "Roadside rest · 路旁 — restore 30 health and 10 Flow";
        else if (node.startsWith("event:"))
          label = `${this.t(EVENTS[info.encounterId]?.title || "Travelers by the wayside")}${this.t(" · event")}`;
        else if (info.encounter?.bossId)
          label = `${this.t(info.encounter.title)}${this.t(" · BOSS")}`;
        else if (info.encounter?.elite)
          label = `${this.t(info.encounter.title)}${this.t(" · ELITE · recovers a curio")}`;
        else if (node.startsWith("ambush:"))
          label = `${this.t(info.encounter.title)}${this.t(" · archer ambush")}`;
        else label = this.t(info.encounter.title);
        const b = this.button(label, () => session.chooseNode(node), {
          parent: "choices",
          primary: !!info.encounter?.bossId,
        });
        b.className = "upgrade";
      }
    }
  }
  render() {
    const session = this.session,
      mode = session.mode,
      g = session.g;
    const wasMenu = this.lastMode === "menu";
    this.lastMode = mode;
    this.$("selection").hidden = mode !== "menu";
    this.$("roam").hidden = mode !== "exploring";
    this.$("play").hidden = mode !== "playing";
    this.$("overlay").hidden =
      mode === "menu" || mode === "playing" || mode === "exploring";
    this.$("roam").inert = mode !== "exploring";
    this.$("play").inert = mode !== "playing";
    this.$("selection").inert = mode !== "menu";
    if (mode === "menu") {
      this.refreshMenu();
      if (!wasMenu && this.ready) this.$("start").focus();
      return;
    }
    if (mode === "playing") {
      this.$("play").focus({ preventScroll: true });
      this.$("play").scrollIntoView({ block: "start" });
      return;
    }
    if (mode === "dialogue") {
      const d = session.dialogue,
        line = d.lines[d.index];
      this.modal(
        `${this.t(session.act.name)} · ${d.index + 1} / ${d.lines.length}`,
        line.speaker,
        line.text,
      );
      this.button(
        d.index === d.lines.length - 1
          ? (d.key === "warden-fall" || d.key === "heron-fall" || d.key?.endsWith("-fall"))
            ? "Enter the tea house"
            : "Draw your blade"
          : "Continue",
        () => session.advanceDialogue(),
        { primary: true },
      );
      this.button("Skip conversation", () => session.advanceDialogue(true));
    } else if (mode === "map") {
      this.renderMap(g);
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
          `${this.t(item.name)} — ${this.t(item.description)}`,
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
          `${this.t(item.name)} ${rank}/${item.maxRank} · ${this.t(maxed ? "Mastered" : cost + " Renown")} · ${this.t(item.description)}`,
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
    } else if (mode === "victory" || mode === "defeat") {
      const won = mode === "victory";
      this.modal(
        won ? "THE OATH ENDURES" : "EVERY LEGEND BEGINS AGAIN",
        won ? "The gate is yours." : "Rise, and try again.",
        `${g.p.name} · ${g.score} renown · ${g.totalKills} foes defeated · ${g.turns || 0} turns.`,
      );
      this.button(
        "Walk the path again",
        () => session.start(g.p.id, g.runMode, g.actId),
        { primary: true },
      );
      this.button("Choose another hero", () => session.menu());
    }
    this.$("overlay").querySelector("button:not(:disabled)")?.focus();
  }
  dispose() {
    clearTimeout(this.noticeTimer);
    this.off.forEach((off) => off());
  }
}
