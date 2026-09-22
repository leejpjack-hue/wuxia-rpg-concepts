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
    this.profile = store.load();
    this.machine = new StateMachine();
    this.g = null;
    this.combat = null;
    this.dialogue = null;
    this.disposers = [
      bus.on("combat:cleared", () => this.clearEncounter()),
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
    this.bus.emit("state:changed", {
      ...event,
      boss: !!this.encounter?.bossId,
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
    if (runMode === "campaign") this.beginDialogue("arrival");
    else this.transition("playing");
    this.bus.emit("audio:sfx", { type: "ui_click" });
  }
  prepareEncounter() {
    const g = this.g;
    g.wave = g.encounterIndex + 1;
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
    this.combat = createCombat(g, this.bus, { seed: 1337 + g.encounterIndex });
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
    if (key === "warden-fall") {
      this.checkpoint("waystation");
      this.transition("waystation");
    } else {
      this.checkpoint("combat");
      this.transition("playing");
      this.bus.emit("notice", { text: this.encounter.title });
    }
    return true;
  }
  step(dt, input) {
    if (this.mode === "playing") this.combat.step(dt, input);
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
    if (this.g.runMode === "campaign" && this.encounter.bossId === "warden")
      this.beginDialogue("warden-intro");
    else {
      this.checkpoint("combat");
      this.transition("playing");
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
      this.checkpoint("warden-fall");
      this.beginDialogue("warden-fall");
      this.bus.emit("audio:sfx", { type: "victory" });
    } else this.transition(won ? "victory" : "defeat");
  }
  pause() {
    if (this.mode === "playing") this.transition("paused");
    else if (this.mode === "paused") this.resume();
  }
  resume() {
    if (this.mode === "paused") this.transition("playing");
  }
  menu() {
    if (this.mode === "menu") return;
    if (this.mode === "playing") this.pause();
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
    });
    Object.assign(this.g.p, cp.player);
    this.prepareEncounter();
    if (["arrival", "warden-intro", "warden-fall"].includes(cp.stage))
      this.beginDialogue(cp.stage);
    else if (cp.stage === "waystation") this.transition("waystation");
    else if (cp.stage === "upgrade") {
      // Menu-to-upgrade restoration uses a validated encounter entry, without simulating a frame.
      this.transition("playing");
      this.g.enemies = [];
      this.g.encounterDone = true;
      this.transition("upgrade");
    } else this.transition("playing");
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
