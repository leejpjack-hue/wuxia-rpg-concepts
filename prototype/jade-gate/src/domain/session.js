import { StateMachine } from "../engine/state-machine.js";
import { campaignHeroUnlocked } from "./unlocks.js";
import { EventBus } from "../engine/events.js";
import { HEROES } from "../content/heroes.js";
import { UPGRADES, applyUpgrade } from "../content/disciplines.js";
import { ACTS, BOSSES, CULTIVATIONS, actById } from "../content/campaign.js";
import { dialogueFor } from "../content/dialogue.js";
import { validateContent } from "../content/validate.js";
import { CURIOS, CURIO_IDS, curioById, EVENTS, techniqueCost } from "../content/curios.js";
import { makePlayer } from "./player.js";
import { createEnemies } from "./encounters.js";
import { createCombat } from "./combat.js";
import { createRoam, isRanged } from "./roam.js";
import {
  applyCultivation,
  awardResult,
  hasPerk,
  strikeNode,
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
      bus.on("roam:rival-defeated", () => {
        if (this.mode === "exploring" && !this.g.roam.field.length) {
          this.g.encounterDone = true;
          this.clearEncounter();
        }
      }),
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
    this.roam?.clearInput();
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

  normalizeParty(heroId, party) {
    const followers = Array.isArray(party?.followers) ? party.followers : null;
    if (!party || party.lead !== heroId || !followers || followers.length !== 2)
      throw new Error("Quick play needs a party of exactly three distinct heroes.");
    const ids = [party.lead, ...followers];
    if (new Set(ids).size !== 3)
      throw new Error("Quick play party heroes must be distinct.");
    for (const id of ids) {
      if (!HEROES.some((hero) => hero.id === id))
        throw new Error("This hero or act is not available in this build.");
    }
    return { lead: party.lead, followers: [...followers] };
  }
  createRun(hero, act, runMode, party = null) {
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
      curios: [],
      party: party ? { lead: party.lead, followers: [...party.followers] } : { lead: hero.id, followers: [] },
      // Campaign-only branching map; null in Quick play (linear encounters).
      map: runMode === "campaign" && act.map ? { row: 0, cleared: [], pendingCurios: [], event: null } : null,
    };
    this.prepareEncounter();
  }
  start(heroId, runMode = "campaign", actId = "jade-gate", party = null) {
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
    if (runMode === "campaign" && hero.quickPlayOnly && !campaignHeroUnlocked(this.profile, heroId))
      throw new Error("This hero is available in Quick play only.");
    if (runMode === "campaign" && !campaignHeroUnlocked(this.profile, heroId))
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
    const resolvedParty =
      runMode === "quickplay" ? this.normalizeParty(heroId, party) : { lead: heroId, followers: [] };
    this.createRun(hero, act, runMode, resolvedParty);
    if (runMode === "quickplay") {
      this.profile.lastQuickParty = resolvedParty;
      this.save();
    }
    if (runMode === "campaign") {
      const arrivalKey = act.id === "bamboo-crossing" ? "bamboo-arrival" : act.id === "mount-canglan" ? "canglan-arrival" : "arrival";
      this.beginDialogue(arrivalKey);
    } else {
      this.transition("exploring");
      // WU-PLAY-01: one-line demo beat toast on Quick Play roam entry.
      if (resolvedParty.followers.length)
        this.bus.emit("notice", {
          text: "Pick 3 → roam bamboo → duel → tap follower chip to swap → next rival",
        });
    }
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
      curios: [...g.curios],
      map: g.map ? { row: g.map.row, cleared: [...g.map.cleared] } : null,
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
  /** Row bookkeeping after a node resolves; single-node rows auto-march. */
  advanceRow() {
    const map = this.g.map;
    map.row++;
    this.arriveAtRow();
    return true;
  }
  arriveAtRow() {
    const map = this.g.map;
    const rows = this.act.map.rows;
    if (map.row >= rows.length) return false;
    if (!map.pendingCurios.length && !map.event && rows[map.row].length === 1) {
      this.selectNode(rows[map.row][0]);
      return true;
    }
    if (this.mode !== "map") {
      this.checkpoint("map");
      this.transition("map");
    } else
      this.bus.emit("state:changed", {
        previous: "map", current: "map", boss: false, dialogueKey: null, stage: "map",
        runMode: this.g.runMode, actId: this.g.actId, encounterIndex: this.g.encounterIndex,
      });
    return true;
  }
  nodeInfo(node) {
    const [type, encounterId] = node.split(":");
    return { type, encounterId, encounter: this.act.encounters.find((e) => e.id === encounterId) };
  }
  selectNode(node) {
    const info = this.nodeInfo(node);
    if (!info.encounter) return false;
    this.g.map.current = node;
    this.g.encounterIndex = this.act.encounters.indexOf(info.encounter);
    this.prepareEncounter();
    if (info.encounter.bossId) {
      const introKey = info.encounter.bossId === "warden" ? "warden-intro" : `${info.encounter.bossId}-intro`;
      this.beginDialogue(introKey);
    } else {
      this.checkpoint("combat");
      this.transition("exploring");
      this.bus.emit("notice", { text: this.encounter.title });
    }
    return true;
  }
  chooseNode(node) {
    if (this.mode !== "map" || !this.g.map) return false;
    const rows = this.act.map.rows;
    if (!rows[this.g.map.row]?.includes(node)) return false;
    if (!this.g.map.cleared.includes(node)) this.g.map.cleared.push(node);
    if (node.startsWith("rest:")) {
      const healed = Math.min(30, this.g.p.maxHp - this.g.p.hp);
      this.g.p.hp += healed;
      this.g.p.flow = Math.min(100, this.g.p.flow + 10);
      this.bus.emit("notice", { text: `Roadside rest: +${healed} health, +10 Flow` });
      this.bus.emit("audio:sfx", { type: "heal" });
      this.advanceRow();
      return true;
    }
    if (node.startsWith("event:")) {
      this.g.map.event = node.slice(6);
      this.arriveAtRow();
      return true;
    }
    return this.selectNode(node);
  }
  resolveEvent(choiceIndex) {
    const map = this.g.map;
    const event = map.event && EVENTS[map.event];
    if (this.mode !== "map" || !event) return false;
    const choice = event.choices[choiceIndex] || event.choices[0];
    if (choice.heal) {
      const healed = Math.min(choice.heal, this.g.p.maxHp - this.g.p.hp);
      this.g.p.hp += healed;
      this.bus.emit("notice", { text: `The travelers' gift restores ${healed} health.` });
      this.bus.emit("audio:sfx", { type: "heal" });
    }
    if (choice.hurt) {
      this.g.p.hp = Math.max(1, this.g.p.hp - choice.hurt);
      this.bus.emit("notice", { text: `A needle trap bites for ${choice.hurt}.` });
    }
    if (choice.curio && !map.pendingCurios.length)
      map.pendingCurios = this.draftCurios(1);
    map.event = null;
    this.advanceRow();
    return true;
  }
  chooseCurio(id) {
    const map = this.g.map;
    if (this.mode !== "map" || !map?.pendingCurios.includes(id)) return false;
    // Pick one of the draft; the unchosen curios are lost with the fallen.
    map.pendingCurios = [];
    this.g.curios.push(id);
    this.checkpoint("map");
    this.bus.emit("audio:sfx", { type: "upgrade" });
    // The row was already advanced; auto-march only when the way is now clear.
    this.arriveAtRow();
    return true;
  }
  /** Promote a follower to lead only between encounters (not mid-duel / mid-contact). */
  swapLead(heroId) {
    if (this.mode !== "exploring" || !this.g?.roam || !this.g.party) return false;
    // Hard reject mid-contact handoff (duel is mode "playing"; g.duel may linger after a win).
    if (this.g.roam.contact >= 0) return false;
    const party = this.g.party;
    if (!Array.isArray(party.followers) || !party.followers.includes(heroId)) return false;
    if (heroId === party.lead || heroId === this.g.p.id) return false;
    const hero = HEROES.find((h) => h.id === heroId);
    if (!hero) return false;

    const prev = this.g.p;
    const prevId = prev.id;
    const next = makePlayer(hero);
    // Keep pass position/facing; carry run modifiers that live on the lead body.
    Object.assign(next, {
      x: prev.x,
      y: prev.y,
      dx: prev.dx || 1,
      dy: prev.dy || 0,
      power: prev.power,
      flowBonus: prev.flowBonus,
      cost: prev.cost,
      teaPots: prev.teaPots,
      flow: prev.flow,
    });
    const followers = [prevId, ...party.followers.filter((id) => id !== heroId)];
    this.g.party = { lead: heroId, followers };
    this.g.p = next;

    const roam = this.g.roam;
    const byId = new Map((roam.followers || []).map((f) => [f.id, f]));
    const promoted = byId.get(heroId);
    roam.followers = followers.map((id, index) => {
      if (id === prevId && promoted)
        return { id, x: promoted.x, y: promoted.y, dx: promoted.dx || 1 };
      const existing = byId.get(id);
      if (existing) return { id, x: existing.x, y: existing.y, dx: existing.dx || 1 };
      return { id, x: next.x - 48 * (index + 1), y: next.y + 12 * (index + 1), dx: next.dx || 1 };
    });
    // Reseed trail behind the new lead so followers do not yank across the courtyard.
    const seedTrail = [];
    for (let i = 16; i >= 0; i--) seedTrail.push({ x: next.x - 12 * i, y: next.y });
    roam.trail = seedTrail;
    roam.sneakMaster = next.id === "nie-yinniang";
    if (!roam.sneakMaster) roam.sneaking = false;
    roam.swapCue = false;

    this.bus.emit("notice", { text: `${hero.name} takes the lead` });
    this.bus.emit("audio:sfx", { type: "ui_click" });
    this.bus.emit("state:changed", {
      previous: this.mode,
      current: this.mode,
      boss: !!this.encounter?.bossId,
      dialogueKey: null,
      stage: this.mode,
      runMode: this.g.runMode,
      actId: this.g.actId,
      encounterIndex: this.g.encounterIndex,
    });
    return true;
  }
  beginDuel(index = this.g?.roam?.contact ?? -1) {

    if (this.mode !== "exploring" || !this.g?.roam) return false;
    const field = this.g.roam.field;
    if (index < 0 || index >= field.length || isRanged(field[index].kind)) return false;
    this.g.roam.shots = [];
    this.g.roam.swapCue = false;
    for (const rival of field) { rival.windup = 0; rival.aim = null; rival.cooldown = Math.max(1, rival.cooldown); }
    this.g.roam.contact = index;
    const enemy = field[index];
    // First blood on the pass or a sneak contact: the duel opens with a reel.
    const ambush = !!(enemy.firstBlood || this.g.roam.sneaking);
    this.g.roam.sneaking = false;
    this.combat.begin?.(enemy.kind, enemy.id, ambush);
    this.transition("playing");
    this.bus.emit("audio:sfx", { type: "ui_click" });
    this.bus.emit("notice", { text: ambush ? `${enemy.name} reels from your ambush` : `${enemy.name} bars your way` });
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
    this.g.encounterDone = false;
    this.transition("exploring");
    // WU-PLAY-01: between-encounter soft invite to swap lead via follower HUD chip.
    const canSwap = !!(this.g.party?.followers?.length);
    if (canSwap) {
      this.g.roam.swapCue = true;
      this.g.roam.swapCueAt = this.g.time || 0;
    }
    this.bus.emit("notice", {
      text: canSwap
        ? "Tap a follower chip to swap lead before the next rival"
        : `${left} ${left === 1 ? "rival" : "rivals"} remain${left === 1 ? "s" : ""} on the pass`,
    });
  }
  clearEncounter() {
    if (!["playing", "exploring"].includes(this.mode)) return;
    if (this.g.map?.current) {
      if (!this.g.map.cleared.includes(this.g.map.current))
        this.g.map.cleared.push(this.g.map.current);
      if (this.g.map.current.startsWith("elite:"))
        this.g.map.pendingCurios = this.draftCurios();
    }
    if (this.g.runMode === "campaign") {
      for (const heroId of this.encounter.unlocks || []) {
        if (this.profile.unlockedHeroes.includes(heroId)) continue;
        this.profile.earnedHeroes.push(heroId);
        this.profile.unlockedHeroes.push(heroId);
        this.bus.emit("notice", { text: `${HEROES.find(h => h.id === heroId).name} joins your campaign roster!` });
      }
    }
    if (this.g.encounterIndex === this.act.encounters.length - 1) {
      this.finish(true);
      return;
    }
    this.checkpoint("upgrade");
    this.transition("upgrade");
    this.bus.emit("audio:sfx", { type: "upgrade" });
  }
  /** Seeded draft of three unowned curios, deterministic within a run. */
  draftCurios(count = hasPerk(this.profile, "phoenix-eye") ? 4 : 3) {
    const owned = new Set(this.g.curios);
    let seed = 0;
    for (const char of this.g.runId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
    seed = (seed + this.g.map.row * 977) >>> 0;
    const pool = CURIOS.filter((curio) => !owned.has(curio.id));
    const picks = [];
    for (let i = 0; i < count && pool.length; i++) {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      picks.push(pool.splice(seed % pool.length, 1)[0].id);
    }
    return picks;
  }
  chooseDiscipline(id) {
    if (this.mode !== "upgrade") return false;
    if (!UPGRADES.some((item) => item.id === id))
      throw new Error("Unknown discipline.");
    applyUpgrade(this.g.p, id);
    this.g.p.hp = Math.min(this.g.p.maxHp, this.g.p.hp + 22);
    this.g.p.flow = Math.min(100, this.g.p.flow + 20);
    if (this.g.map) {
      this.g.map.event = null;
      this.advanceRow();
      this.bus.emit("audio:sfx", { type: "ui_click" });
      return true;
    }
    this.g.encounterIndex++;
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
    if (!["playing", "exploring"].includes(this.mode)) return;
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
    if (this.mode === "playing" || this.mode === "exploring") this.pause();
    this.dialogue = null;
    this.transition("menu");
  }
  continueCheckpoint() {
    if (this.mode !== "menu") return false;
    const cp = this.profile.checkpoint;
    if (!cp) return false;
    const hero = HEROES.find((h) => h.id === cp.heroId),
      act = actById(cp.actId);
    if (!hero || !campaignHeroUnlocked(this.profile, hero.id) || !act?.available) return false;
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
    if (this.g.map && cp.map) {
      this.g.map.row = Math.max(0, Math.min(cp.map.row, this.act.map.rows.length - 1));
      this.g.map.cleared = cp.map.cleared.filter((node) =>
        this.act.map.rows.some((row) => row.includes(node)));
      this.g.curios = cp.curios.filter((id) => CURIO_IDS.includes(id));
      const node = this.act.map.rows[this.g.map.row]?.find((entry) =>
        entry.endsWith(`:${this.act.encounters[this.g.encounterIndex]?.id}`));
      if (node) this.g.map.current = node;
    }
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
      "canglan-arrival",
      "lu-bu-rival-intro",
      "lu-bu-rival-fall",
    ];
    if (dialogueStages.includes(cp.stage))
      this.beginDialogue(cp.stage);
    else if (cp.stage === "map" && this.g.map) this.arriveAtRow();
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
    const bought = strikeNode(this.profile, id);
    if (bought) {
      this.save();
      this.bus.emit("audio:sfx", { type: "upgrade" });
    }
    return bought;
  }
  setSetting(key, value) {
    if (!Object.hasOwn(this.profile.settings, key))
      throw new Error("Unknown setting");
    if (key === "language") {
      if (!["ja", "en"].includes(value)) return;
    } else if (key.endsWith("Volume")) value = Math.max(0, Math.min(1, Number(value)));
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
