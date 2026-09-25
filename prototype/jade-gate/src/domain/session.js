import { StateMachine } from "../engine/state-machine.js";
import { EventBus } from "../engine/events.js";
import { HEROES } from "../content/heroes.js";
import { UPGRADES, applyUpgrade } from "../content/disciplines.js";
import { ACTS, BOSSES, CULTIVATIONS, actById } from "../content/campaign.js";
import { dialogueFor } from "../content/dialogue.js";
import { validateContent } from "../content/validate.js";
import { makePlayer } from "./player.js";
import { createEnemies } from "./encounters.js";
import { createCombat } from "./combat.js";
import { createRoam } from "./roam.js";
import {
  applyCultivation,
  awardResult,
  purchaseCultivation,
} from "./progression.js";
let sequence = 0;
export class GameSession {
  constructor(
    store,
    {
      bus = new EventBus(),
      runId = () => `${Date.now().toString(36)}-${++sequence}`,
      combatFactory = createCombat,
    } = {},
  ) {
    validateContent({
      heroes: HEROES,
      acts: ACTS,
      bosses: BOSSES,
      disciplines: UPGRADES,
      cultivations: CULTIVATIONS,
    });
    this.store = store;
    this.bus = bus;
    this.makeRunId = runId;
    this.combatFactory = combatFactory;
    this.profile = store.load();
    this.machine = new StateMachine();
    this.g = null;
    this.combat = null;
    this.roam = null;
    this.dialogue = null;
    this.pausedFrom = null;
    this.disposers = [
      bus.on("roam:contact", () => this.beginDuel()),
      bus.on("duel:won", () => this.endDuel()),
      bus.on("combat:defeat", () => this.finish(false)),
    ];
  }
  get mode() {
    return this.machine.value;
  }
  get act() {
    return actById(this.g?.actId || "jade-gate");
  }
  get encounter() {
    return this.act.encounters[this.g?.encounterIndex || 0];
  }
  get hero() {
    return HEROES.find((h) => h.id === this.g?.p.id);
  }
  save() {
    this.store.save(this.profile);
    this.bus.emit("profile:changed");
  }
  transition(next) {
    const event = this.machine.transition(next);
    this.combat?.clearInput();
    if (this.g) this.g.mode = next;
    const dialogueKey = this.dialogue?.key || null;
    const stage =
      dialogueKey ||
      (next === "playing"
        ? this.encounter?.bossId
          ? "boss"
          : "battle"
        : next);
    this.bus.emit("state:changed", {
      ...event,
      boss: !!this.encounter?.bossId,
      dialogueKey,
      stage,
      runMode: this.g?.runMode || null,
      actId: this.g?.actId || null,
      encounterIndex: this.g?.encounterIndex ?? null,
    });
  }
  createRun(hero, act, runMode) {
    const p = makePlayer(hero);
    if (runMode === "campaign") applyCultivation(p, this.profile);
    this.g = {
      mode: this.mode,
      runId: this.makeRunId(),
      runMode,
      actId: act.id,
      hazards: [...(act.hazards || [])],
      shallows: act.hazards?.includes("shallows") || false,
      encounterIndex: 0,
      wave: 1,
      p,
      enemies: [],
      effects: [],
      shots: [],
      pickups: [],
      score: 0,
      time: 0,
      waveTime: 0,
      totalKills: 0,
      shake: 0,
      hitStop: 0,
      encounterDone: false,
    };
    this.prepareEncounter();
  }
  start(heroId, runMode = "campaign", actId = "jade-gate") {
    if (!["menu", "defeat", "victory", "waystation"].includes(this.mode))
      throw new Error("Return to the menu before starting a new run.");
    if (!["campaign", "quickplay"].includes(runMode))
      throw new Error("Unknown game mode.");
    const hero = HEROES.find((h) => h.id === heroId),
      act = actById(actId);
    if (!hero || !act?.available)
      throw new Error("This hero or act is not available in this build.");
    if (act.bossId && BOSSES[act.bossId]?.planned && act.available)
      throw new Error("Cannot launch unbuilt boss.");
    if (runMode === "campaign" && !this.profile.unlockedHeroes.includes(heroId))
      throw new Error(
        "Defeat Lü Bu in Act III to unlock him in the campaign. Use Quick play to try him now.",
      );
    const previous = ACTS.find((item) => item.next === actId);
    if (
      runMode === "campaign" &&
      previous &&
      !this.profile.completedActs.includes(previous.id)
    )
      throw new Error("Complete the preceding act first.");
    this.createRun(hero, act, runMode);
    if (runMode === "campaign") {
      const arrivalKey = act.id === "bamboo-crossing" ? "bamboo-arrival" : "arrival";
      this.beginDialogue(arrivalKey);
    } else this.transition("exploring");
    this.bus.emit("audio:sfx", { type: "ui_click" });
  }
  prepareEncounter() {
    const g = this.g;
    g.wave = g.encounterIndex + 1;
    g.hazards = [
      ...new Set([
        ...(this.act.hazards || []),
        ...(this.encounter?.hazards || []),
      ]),
    ];
    g.shallows = g.hazards.includes("shallows");
    g.enemies = createEnemies(this.encounter, g.encounterIndex);
    g.shots = [];
    g.pickups = [];
    g.effects = [];
    g.waveTime = 0;
    g.encounterDone = false;
    g.hitStop = 0;
    g.p.x = 640;
    g.p.y = 500;
    for (const key of [
      "attackCD",
      "dodgeCD",
      "specialCD",
      "invulnerable",
      "dash",
      "attackAnim",
      "perfectWindow",
      "chainTime",
      "comboTime",
    ])
      g.p[key] = 0;
    g.p.chain = 0;
    g.p.combo = 0;
    this.combat = this.combatFactory(g, this.bus, {
      seed: 1337 + g.encounterIndex,
      encounter: this.encounter,
    });
    // Rivals wait on the pass; each duel starts when the hero walks into one.
    g.duel = null;
    this.roam = createRoam(g, this.bus, { encounter: this.encounter });
  }
  checkpoint(stage) {
    if (this.g.runMode !== "campaign") return;
    const g = this.g,
      p = g.p;
    this.profile.checkpoint = {
      stage,
      runId: g.runId,
      heroId: p.id,
      actId: g.actId,
      encounterIndex: g.encounterIndex,
      player: Object.fromEntries(
        [
          "hp",
          "maxHp",
          "flow",
          "power",
          "flowBonus",
          "cost",
          "kills",
          "damageTaken",
        ].map((key) => [key, p[key]]),
      ),
      score: g.score,
      time: g.time,
      totalKills: g.totalKills,
      turns: g.turns || 0,
    };
    this.save();
  }
  beginDialogue(key) {
    this.dialogue = { key, index: 0, lines: dialogueFor(key, this.hero) };
    this.checkpoint(key);
    this.transition("dialogue");
  }
  advanceDialogue(skip = false) {
    if (this.mode !== "dialogue") return false;
    if (!skip && ++this.dialogue.index < this.dialogue.lines.length) {
      this.bus.emit("dialogue:changed");
      return true;
    }
    const key = this.dialogue.key;
    this.dialogue = null;
    if (
      key === "warden-fall" ||
      key === "night-heron-fall" ||
      key === "heron-fall" ||
      key.endsWith("-fall")
    ) {
      this.checkpoint("waystation");
      this.transition("waystation");
    } else {
      this.checkpoint("combat");
      this.transition("exploring");
      this.bus.emit("notice", { text: this.encounter.title });
    }
    return true;
  }
  step(dt, input) {
    if (this.mode === "playing") this.combat.step(dt, input);
    else if (this.mode === "exploring") this.roam?.step(dt, input);
  }
  beginDuel(index = this.g?.roam?.contact ?? -1) {
    if (this.mode !== "exploring" || !this.g?.roam) return false;
    const field = this.g.roam.field;
    if (index < 0 || index >= field.length) return false;
    this.g.roam.contact = index;
    const enemy = field[index];
    this.combat.begin?.(enemy.kind, enemy.id);
    this.transition("playing");
    this.bus.emit("audio:sfx", { type: "ui_click" });
    this.bus.emit("notice", { text: `${enemy.name} bars your way` });
    return true;
  }
  endDuel() {
    if (this.mode !== "playing" || !this.g?.roam) return;
    if (!this.roam.removeContacted()) return;
    if (!this.g.roam.field.length) {
      this.clearEncounter();
      return;
    }
    const left = this.g.roam.field.length;
    this.transition("exploring");
    this.bus.emit("notice", {
      text: `${left} ${left === 1 ? "rival" : "rivals"} remain${left === 1 ? "s" : ""} on the pass`,
    });
  }
  clearEncounter() {
    if (this.mode !== "playing") return;
    if (this.g.encounterIndex === this.act.encounters.length - 1) {
      this.finish(true);
      return;
    }
    this.checkpoint("upgrade");
    this.transition("upgrade");
    this.bus.emit("audio:sfx", { type: "upgrade" });
  }
  chooseDiscipline(id) {
    if (this.mode !== "upgrade") return false;
    if (!UPGRADES.some((item) => item.id === id))
      throw new Error("Unknown discipline.");
    applyUpgrade(this.g.p, id);
    this.g.encounterIndex++;
    this.g.p.hp = Math.min(this.g.p.maxHp, this.g.p.hp + 22);
    this.g.p.flow = Math.min(100, this.g.p.flow + 20);
    this.prepareEncounter();
    if (this.g.runMode === "campaign" && this.encounter.bossId) {
      if (BOSSES[this.encounter.bossId]?.planned)
        throw new Error(`Cannot launch unbuilt boss: ${this.encounter.bossId}`);
      const introKey = this.encounter.bossId === "warden" ? "warden-intro" : `${this.encounter.bossId}-intro`;
      this.beginDialogue(introKey);
    } else {
      this.checkpoint("combat");
      this.transition("exploring");
      this.bus.emit("notice", { text: this.encounter.title });
    }
    this.bus.emit("audio:sfx", { type: "ui_click" });
    return true;
  }
  finish(won) {
    if (this.mode !== "playing") return;
    if (won) this.g.score += Math.max(0, Math.round(this.g.p.hp * 3));
    awardResult(this.profile, this.g, won, this.act);
    this.save();
    if (won && this.g.runMode === "campaign") {
      // Store reward and post-boss checkpoint together before exposing the next scene.
      const dialogueKey = this.encounter?.bossId === "warden" || this.act.bossId === "warden"
        ? "warden-fall"
        : `${this.act.bossId}-fall`;
      this.checkpoint(dialogueKey);
      this.beginDialogue(dialogueKey);
      this.bus.emit("audio:sfx", { type: "victory" });
    } else this.transition(won ? "victory" : "defeat");
  }
  pause() {
    if (this.mode === "playing" || this.mode === "exploring") {
      this.pausedFrom = this.mode;
      this.transition("paused");
    } else if (this.mode === "paused") this.resume();
  }
  resume() {
    if (this.mode === "paused") this.transition(this.pausedFrom || "playing");
  }
  menu() {
    if (this.mode === "menu") return;
    if (this.mode === "playing" || this.mode === "paused") this.pause();
    this.dialogue = null;
    this.transition("menu");
  }
  continueCheckpoint() {
    if (this.mode !== "menu") return false;
    const cp = this.profile.checkpoint;
    if (!cp) return false;
    const hero = HEROES.find((h) => h.id === cp.heroId),
      act = actById(cp.actId);
    if (!hero || !act?.available) return false;
    this.createRun(hero, act, "campaign");
    Object.assign(this.g, {
      runId: cp.runId,
      encounterIndex: cp.encounterIndex,
      score: cp.score,
      time: cp.time,
      totalKills: cp.totalKills,
      turns: cp.turns || 0,
    });
    Object.assign(this.g.p, cp.player);
    this.prepareEncounter();
    const dialogueStages = [
      "arrival",
      "warden-intro",
      "warden-fall",
      "bamboo-arrival",
      "night-heron-intro",
      "night-heron-fall",
      "heron-intro",
      "heron-fall",
    ];
    if (dialogueStages.includes(cp.stage))
      this.beginDialogue(cp.stage);
    else if (cp.stage === "waystation") this.transition("waystation");
    else if (cp.stage === "upgrade") {
      // Menu-to-upgrade restoration uses a validated encounter entry, without simulating a frame.
      this.transition("exploring");
      this.g.encounterDone = true;
      this.transition("upgrade");
    } else this.transition("exploring");
    return true;
  }
  buy(id) {
    if (this.mode !== "waystation") return false;
    const bought = purchaseCultivation(this.profile, id);
    if (bought) {
      this.save();
      this.bus.emit("audio:sfx", { type: "upgrade" });
    }
    return bought;
  }
  setSetting(key, value) {
    if (!Object.hasOwn(this.profile.settings, key))
      throw new Error("Unknown setting");
    if (key.endsWith("Volume")) value = Math.max(0, Math.min(1, Number(value)));
    else value = !!value;
    if (typeof value === "number" && !Number.isFinite(value)) return;
    this.profile.settings[key] = value;
    this.save();
    this.bus.emit("settings:changed", this.profile.settings);
  }
  dispose() {
    this.disposers.forEach((off) => off());
    this.bus.clear();
  }
}
