import { translate, localizeDocument } from "../locales/i18n.js";
import { campaignHeroUnlocked } from "../domain/unlocks.js";
import { HEROES } from "../content/heroes.js";
import { UPGRADES } from "../content/disciplines.js";
import { ACTS, CULTIVATIONS, actById } from "../content/campaign.js";
import { meridianState } from "../domain/progression.js";
import { VESSELS, MERIDIAN_NODES, nodeById } from "../content/meridians.js";
import { curioById, EVENTS, CURIOS as CURIOS_LIST } from "../content/curios.js";
import { JUDGEMENT, SHOP_STOCK, shopItemById, signatureById } from "../content/expansion.js";
import { DUEL_ENEMIES } from "../content/duels.js";
import { signatureArtFor, expansionArtAvailable } from "../content/expansion-art.js";
import { createSpeaker, portraitFor } from "../platform/speech.js";
export class GameView {
  constructor(session, document, onGesture = () => {}) {
    this.session = session;
    this.t = text => translate(text, session.profile.settings.language);
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    // The JavaScript speaker: dialogue lines read aloud, female-first, one
    // stable voice per speaker.
    this.speech = createSpeaker({ synthesis: document.defaultView?.speechSynthesis || null });
    this.spokenKey = "";
    this.heroId = HEROES[0].id;
    this.partyIds = [];
    this.runMode = "campaign";
    this.quickAct = "jade-gate";
    this.ready = false;
    this.noticeTime = 0;
    this.onGesture = onGesture;
    const roster = HEROES.filter((hero) => !hero.hidden && (!hero.recruitedOnly || session.profile.recruits?.includes(hero.id)));
    this.$("heroes").innerHTML = roster.map(
      (hero, index) =>
        `<button class="hero-card" data-hero="${hero.id}" aria-pressed="false" aria-label="Choose ${hero.name}"><img src="${hero.keyArt || `assets/${hero.id}.png`}" alt="${hero.name} character art" style="object-position: ${hero.artFocus || "50% 18%"}"><span class="card-number">${String(index + 1).padStart(2, "0")} / ${hero.cn}</span><span class="card-check">✓</span><span class="lead-chip" hidden>Lead</span><span class="follower-chip" hidden></span><div class="card-copy"><small>${hero.title}</small><h2>${hero.name}</h2><p>${hero.weapon}</p><div class="stats">${hero.style.toUpperCase()}</div><span class="lock-note"></span><p class="card-biography" hidden></p></div></button>`,
    ).join("");
    for (const button of document.querySelectorAll("[data-hero]"))
      button.onclick = () => {
        this.onGesture();
        const id = button.dataset.hero;
        if (this.runMode === "quickplay") {
          const index = this.partyIds.indexOf(id);
          if (index > 0) {
            // Tap a selected follower to set lead before start (WU-PARTY-06).
            this.partyIds.splice(index, 1);
            this.partyIds.unshift(id);
          } else if (index === 0) {
            this.partyIds.splice(0, 1);
          } else if (this.partyIds.length < 3) {
            this.partyIds.push(id);
          }
          this.heroId = this.partyIds[0] || HEROES[0].id;
        } else {
          this.heroId = id;
        }
        this.refreshMenu();
        session.bus.emit("audio:sfx", { type: "ui_click" });
      };
    for (const button of document.querySelectorAll("[data-mode]"))
      button.onclick = () => {
        const next = button.dataset.mode;
        if (next !== this.runMode) {
          this.partyIds = next === "quickplay" ? this.rememberedParty() : [];
          if (this.partyIds[0]) this.heroId = this.partyIds[0];
        }
        this.runMode = next;
        if (
          this.runMode === "campaign" &&
          !campaignHeroUnlocked(session.profile, this.heroId)
        )
          this.heroId = HEROES[0].id;
        this.refreshMenu();
      };
    this.$("language").onchange = event => this.perform(() => session.setSetting("language", event.target.value));
    this.$("quick-act").onchange = event => { this.quickAct = event.target.value; };
    this.$("start").onclick = () =>
      this.perform(() =>
        session.start(
          this.runMode === "quickplay" ? this.partyIds[0] : this.heroId,
          this.runMode,
          this.runMode === "quickplay" ? this.quickAct : "jade-gate",
          this.runMode === "quickplay"
            ? { lead: this.partyIds[0], followers: this.partyIds.slice(1) }
            : undefined,
        ),
      );
    this.$("continue").onclick = () =>
      this.perform(() => session.continueCheckpoint());
    this.$("open-codex").onclick = () => {
      this.onGesture();
      this.codexOpen = true;
      this.render();
    };
    this.$("start-wander").onclick = () =>
      this.perform(() => {
        const party = this.partyIds.length === 3
          ? { lead: this.partyIds[0], followers: this.partyIds.slice(1) }
          : null;
        session.startWander(party);
      });
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
  rememberedParty() {
    const party = this.session.profile.lastQuickParty;
    return party ? [party.lead, ...party.followers] : [];
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
    // Sound off mid-scene stops the spoken line; it re-reads on the next line.
    if (!s.sound) this.speech.cancel();
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
      const selected =
        this.runMode === "quickplay"
          ? this.partyIds.includes(button.dataset.hero)
          : button.dataset.hero === this.heroId,
        locked =
          this.runMode === "campaign" &&
          !campaignHeroUnlocked(profile, button.dataset.hero);
      const cardHero = HEROES.find(h => h.id === button.dataset.hero);
      button.hidden = this.runMode === "campaign" && locked;
      button.setAttribute("aria-label", this.t(`Choose ${cardHero.name}`));
      button.querySelector("img").alt = this.t(`${cardHero.name} character art`);
      for (const [selector, value] of [[".card-copy small", cardHero.title], ["h2", cardHero.name], [".card-copy p", cardHero.weapon], [".stats", cardHero.style]])
        button.querySelector(selector).textContent = this.t(value);
      const biography = button.querySelector(".card-biography");
      const showBio =
        this.runMode === "quickplay"
          ? selected && button.dataset.hero === this.partyIds[0]
          : selected;
      biography.hidden = !showBio;
      biography.textContent = showBio ? this.t(cardHero.description) : "";
      button.classList.toggle("selected", selected);
      const partyIndex =
        this.runMode === "quickplay" ? this.partyIds.indexOf(button.dataset.hero) : -1;
      button.classList.toggle("party-lead", partyIndex === 0);
      button.classList.toggle("party-follower", partyIndex > 0);
      const leadChip = button.querySelector(".lead-chip");
      if (leadChip) {
        leadChip.hidden = partyIndex !== 0;
        leadChip.textContent = this.t("LEAD");
      }
      const followerChip = button.querySelector(".follower-chip");
      if (followerChip) {
        followerChip.hidden = partyIndex < 1;
        followerChip.textContent =
          partyIndex === 1 ? this.t("Follower 1") : partyIndex === 2 ? this.t("Follower 2") : "";
      }
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = locked;
      button.querySelector(".lock-note").textContent = this.t(locked ? "Story rival · playable in Quick Play" : "");
    }
    for (const button of this.document.querySelectorAll("[data-mode]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mode === this.runMode),
      );
    this.$("quick-act-picker").hidden = this.runMode !== "quickplay";
    this.$("quick-act").value = this.quickAct;
    if (this.runMode === "quickplay") {
      this.$("selected-hero-name").textContent = this.partyIds.length
        ? `${this.t("Lead")}: ${this.t(hero.name)}`
        : this.t("Select 3 heroes");
      this.$("hero-description").textContent = this.partyIds.length
        ? this.t(hero.description)
        : this.t("Choose exactly three distinct heroes. Tap a selected follower to set the lead before start; followers are cosmetic on the pass.");
    } else {
      this.$("selected-hero-name").textContent = this.t(hero.name);
      this.$("hero-description").textContent = this.t(hero.description);
    }
    const record = profile.records[this.heroId];
    this.$("record").textContent = this.t(record
      ? `Personal best: ${record.best} renown · ${record.wins} victories`
      : "A new legend awaits. Your best run is saved on this device.");
    const partyReady = this.runMode !== "quickplay" || this.partyIds.length === 3;
    this.$("start").disabled = !this.ready || !partyReady;
    this.$("start").textContent = this.t(this.ready
      ? this.runMode === "campaign"
        ? "Begin the journey →"
        : partyReady
          ? "Enter quick play →"
          : `Select ${3 - this.partyIds.length} more`
      : "Preparing your journey…");
    this.$("continue").hidden = this.runMode !== "campaign" || !profile.checkpoint || !campaignHeroUnlocked(profile, profile.checkpoint.heroId);
    this.$("continue").disabled = !this.ready;
    this.$("journey-summary").textContent =
      this.runMode === "campaign"
        ? this.t(`Campaign · ${profile.wallet} Renown · checkpoint saves between encounters`)
        : `${this.t("Pick 3 → roam bamboo → duel → tap follower chip to swap → next rival")} · ${this.partyIds.length}/3`;
    if (this.$("open-codex")) {
      const codex = profile.codex || { heroes: {}, rivals: {}, curios: {} };
      const total = HEROES.filter((hero) => !hero.hidden).length + Object.keys(DUEL_ENEMIES).length + 12;
      const seen = Object.keys(codex.heroes || {}).length +
        Object.keys(codex.rivals || {}).length + Object.keys(codex.curios || {}).length;
      this.$("open-codex").textContent = `${this.t("Codex")} ${seen}/${total}`;
    }
    if (this.$("start-wander")) {
      const unlocked = (profile.completedActs || []).includes("mount-canglan");
      this.$("start-wander").disabled = !unlocked || !this.ready;
      this.$("start-wander").textContent = unlocked
        ? `${this.t("Jianghu Wander")} · ${this.t("Best: stage {n}").replace("{n}", profile.wander?.bestStage || 0)}`
        : this.t("Reclaim Act III to unlock the endless wander.");
    }
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
    const portrait = this.$("dialogue-portrait");
    if (portrait) portrait.hidden = true;
  }
  /** Dialogue scene dressing: the speaker's card and their spoken line. */
  speakScene(line) {
    const session = this.session;
    const portrait = this.$("dialogue-portrait");
    const artId = portraitFor(line.speaker, {
      heroes: HEROES,
      rivals: DUEL_ENEMIES,
      fallback: session.hero?.id || HEROES[0].id,
    });
    if (portrait) {
      const img = portrait.querySelector("img");
      const caption = portrait.querySelector("figcaption");
      if (img && caption) {
        img.src = `assets/${artId}.png`;
        img.alt = this.t(line.speaker);
        caption.textContent = this.t(line.speaker);
        portrait.hidden = false;
      } else portrait.hidden = true;
    }
    // Read the line as shown (translated), once per line and language.
    const settings = session.profile.settings;
    const key = `${session.dialogue?.key}:${session.dialogue?.index}:${settings.language}`;
    if (!settings.sound || key === this.spokenKey) return;
    this.spokenKey = key;
    this.speech.speak(this.t(line.text), line.speaker, settings.language);
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
    if (map.judgement) {
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        "Spare or finish",
        `${map.judgement.name} kneels among the fallen. Your call is remembered.`,
      );
      const spare = this.button(
        "Spare — the people will remember",
        () => session.resolveJudgement(true),
        { parent: "choices", primary: true },
      );
      spare.className = "upgrade";
      const finish = this.button(
        `Finish — the Banner nods (+${JUDGEMENT.executeScoreBonus} Renown)`,
        () => session.resolveJudgement(false),
        { parent: "choices" },
      );
      finish.className = "upgrade";
    } else if (map.shop) {
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        "The pass merchant",
        `${g.score} Renown to spend. ${carried ? `Carried curios: ${this.t(carried)}. ` : ""}The road is long.`,
      );
      const portrait = this.document.createElement("img");
      portrait.src = "assets/merchant.png"; portrait.alt = this.t("The pass merchant");
      portrait.className = "merchant-portrait";
      this.$("choices").appendChild(portrait);
      for (const entry of map.shop.stock) {
        const item = shopItemById(entry.id);
        const bought = map.shop.bought.includes(entry.id);
        const b = this.button(
          `${this.t(item.name)} — ${this.t(item.description)} · ${bought ? this.t("Mastered") : entry.price + " " + this.t("Renown")}`,
          () => session.buyShopItem(entry.id),
          { disabled: bought || g.score < entry.price, parent: "choices" },
        );
        b.className = "upgrade";
      }
      this.button("Leave the merchant", () => session.leaveShop(), { primary: true });
    } else if (map.pendingCurios.length) {
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
    } else if (g.openField) {
      // Open field: every rival is already deployed on the pass, so there are
      // no nodes to march. This scene is a wayside stop — always exitable.
      this.modal(
        `ACT ${session.act.number} · ${this.t(session.act.name.toUpperCase())}`,
        "Wayside on the open pass",
        carried
          ? `The pass stretches on. Carried curios: ${this.t(carried)}`
          : "The pass stretches on. Rivals hold their ground ahead.",
      );
      this.button("Return to the pass", () => session.resumeOpenField(), { primary: true });
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
        else if (node.startsWith("shop:"))
          label = this.t("The pass merchant · wares for run renown");
        else label = this.t(info.encounter.title);
        const b = this.button(label, () => session.chooseNode(node), {
          parent: "choices",
          primary: !!info.encounter?.bossId,
        });
        b.className = "upgrade";
      }
    }
  }
  /** The codex: legends, rivals and curios recorded so far. */
  renderCodex() {
    const session = this.session;
    const codex = session.profile.codex || { heroes: {}, rivals: {}, curios: {} };
    this.modal("CODEX · 図鑑", "Records of the jianghu", "Entries are recorded as you meet them on the pass.");
    const groups = [
      ["Legends", HEROES.map((hero) => ({
        known: !!codex.heroes[hero.id],
        name: hero.name, cn: hero.cn, art: `${hero.id}`,
        line: hero.title, signatureArt: signatureArtFor(hero.id),
      }))],
      ["Rivals", Object.entries(DUEL_ENEMIES).map(([kind, def]) => ({
        known: !!codex.rivals[kind],
        name: def.name, cn: "", art: def.art,
        line: def.title,
      }))],
      ["Curios", [],],
    ];
    for (const curio of CURIOS_LIST) {
      groups[2][1].push({
        known: !!codex.curios[curio.id],
        name: curio.name, cn: curio.cn, art: null,
        line: curio.description,
      });
    }
    for (const [title, entries] of groups) {
      const heading = this.document.createElement("p");
      heading.className = "vessel-heading";
      const known = entries.filter((entry) => entry.known).length;
      heading.textContent = `${this.t(title)} · ${known}/${entries.length} ${this.t("recorded")}`;
      this.$("choices").appendChild(heading);
      for (const entry of entries) {
        if (!entry.known) continue;
        const b = this.button(
          `${entry.cn ? entry.cn + " " : ""}${entry.name} — ${entry.line}`,
          () => {},
          { disabled: true, parent: "choices" },
        );
        b.className = "upgrade codex-entry";
        if (entry.signatureArt && expansionArtAvailable(entry.signatureArt)) {
          const icon = this.document.createElement("img");
          icon.src = `assets/${entry.signatureArt}.png`; icon.alt = ""; icon.className = "action-icon";
          b.appendChild(icon);
        }
      }
    }
    this.button("Close", () => { this.codexOpen = false; this.render(); }, { primary: true });
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
      if (this.codexOpen) this.renderCodex();
      else this.$("overlay").hidden = true;
      if (!wasMenu && this.ready && !this.codexOpen) this.$("start").focus();
      return;
    }
    this.speech.cancel();
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
      this.speakScene(line);
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
        (session.encounter.unlockStory && session.g.runMode === "campaign")
          ? `${this.t(session.encounter.unlockStory)} ${this.t("Choose a discipline for this run. The next encounter restores 22 health and 20 Flow.")}`
          : "Choose a discipline for this run. The next encounter restores 22 health and 20 Flow.",
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
        `${session.profile.wallet} Renown available. Strike acupoints along the meridian map — points and cavities apply on your next campaign run. Your checkpoint is saved here.`,
      );
      for (const vessel of VESSELS) {
        const heading = this.document.createElement("p");
        heading.className = "vessel-heading";
        heading.textContent = `${this.t(vessel.name)} ${vessel.cn} · ${this.t(`+${vessel.amount} ${vessel.unit} per point`)}`;
        this.$("choices").appendChild(heading);
        for (const node of MERIDIAN_NODES.filter((item) => item.vessel === vessel.id)) {
          const state = meridianState(session.profile, node.id);
          const b = this.button(
            state.struck
              ? `✓ ${node.point}`
              : state.locked
                ? `${node.point} · ${this.t("requires")} ${node.requires.map((need) => nodeById(need).point).join(" + ")}`
                : `${node.point} · ${node.cost} ${this.t("Renown")}`,
            () => session.buy(node.id),
            { disabled: state.struck || state.locked || !state.affordable, parent: "choices" },
          );
          b.className = "upgrade";
        }
      }
      const crossHeading = this.document.createElement("p");
      crossHeading.className = "vessel-heading";
      crossHeading.textContent = this.t("Crossing cavities · gated perks");
      this.$("choices").appendChild(crossHeading);
      for (const node of MERIDIAN_NODES.filter((item) => item.vessel === "cross")) {
        const state = meridianState(session.profile, node.id);
        const b = this.button(
          state.struck
            ? `✓ ${node.point}`
            : state.locked
              ? `${node.point} · ${this.t("requires")} ${node.requires.map((need) => nodeById(need).point).join(" + ")}`
              : `${node.point} · ${this.t(node.effect)} · ${node.cost} ${this.t("Renown")}`,
          () => session.buy(node.id),
          { disabled: state.struck || state.locked || !state.affordable, parent: "choices" },
        );
        b.className = "upgrade";
      }
      const next = actById(session.act.next);
      if (!session.act.next) {
        // The finale: no further act, the oath stands fulfilled.
        this.button(
          "THE OATH IS FULFILLED — the jianghu is yours",
          () => session.menu(),
          { primary: true, disabled: true },
        );
      } else {
        this.button(
          next?.available
            ? `Travel to ${next.name}`
            : `${next?.name || "The journey"} · in development`,
          () => session.start(g.p.id, "campaign", next.id),
          { primary: true, disabled: !next?.available },
        );
      }
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
        () => session.start(g.p.id, g.runMode, g.actId, g.party),
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
