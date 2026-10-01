import { SaveStore } from "../src/platform/save-store.js";
import { GameSession } from "../src/domain/session.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { techniqueCost } from "../src/content/curios.js";
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
  };
}
/** Shipped configuration: roaming encounters that hand off to card duels. */
export function session(storage = memoryStorage()) {
  return new GameSession(new SaveStore(storage), {
    combatFactory: createCardCombat,
  });
}
/** Archived real-time combat factory; tests drive `game.combat` directly. */
export function rtSession(storage = memoryStorage()) {
  return new GameSession(new SaveStore(storage));
}
export function duelPolicy(game) {
  const p = game.g.p,
    d = game.g.duel,
    intent = game.combat.intent();
  // Tea doubles as the cleanse for bleed and poison.
  const afflicted = d.status && (d.status.hero.bleed || d.status.hero.poison);
  if (d.tea && (afflicted || p.hp < p.maxHp - 35))
    return "tea";
  if (intent.special)
    return p.flow >= techniqueCost(p, game.g.curios) ? "technique" : "guard";
  return p.flow >= techniqueCost(p, game.g.curios)
      ? "technique"
      : ["heavy", "guard"].includes(intent.kind)
        ? "guard"
        : "attack";
}
export function engageRival(game) {
  const enemy = game.g.roam.field[0];
  if (!enemy.ranged) return game.beginDuel(0);
  Object.assign(game.g.p, { x: enemy.x + 80, y: enemy.y });
  game.roam.act(game.g.p.flow >= game.g.p.cost ? "technique" : "strike");
  for (let i = 0; i < 50 && game.mode === "exploring"; i++) game.step(1 / 60, {});
  return true;
}
export function clearEncounter(game) {
  let guard = 0;
  while (["exploring", "playing"].includes(game.mode) && guard++ < 400) {
    if (game.mode === "exploring") {
      if (!engageRival(game)) throw new Error("nothing to duel");
    } else if (!game.combat.act(duelPolicy(game)))
      throw new Error("duel policy stalled");
  }
  if (game.mode === "defeat") throw new Error("duel policy lost the encounter");
  return game.mode;
}
export function completeCampaign(game) {
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  playCampaign(game);
}
/** Resolve map scenes: curio drafts, events, then a picked node of the row. */
export function walkMap(game, pick = (nodes) => nodes[0]) {
  let guard = 0;
  while (game.mode === "map" && guard++ < 40) {
    const map = game.g.map;
    if (map.judgement) {
      game.resolveJudgement(true);
      continue;
    }
    if (map.pendingCurios.length) {
      game.chooseCurio(map.pendingCurios[0]);
      continue;
    }
    if (map.shop) {
      game.leaveShop();
      continue;
    }
    if (map.event) {
      game.resolveEvent(0);
      continue;
    }
    const nodes = game.act.map.rows[map.row].filter((node) => !map.cleared.includes(node));
    if (!nodes.length) throw new Error("map row has no open nodes");
    game.chooseNode(pick(nodes));
  }
  if (game.mode === "map") throw new Error("map walk stalled");
  return game.mode;
}
/** Full campaign driver: dialogues, combat nodes, disciplines, map choices. */
export function playCampaign(game, pick) {
  let guard = 0;
  while (!["waystation", "victory", "defeat", "menu"].includes(game.mode) && guard++ < 400) {
    if (game.mode === "dialogue") game.advanceDialogue(true);
    else if (game.mode === "exploring" || game.mode === "playing") clearEncounter(game);
    else if (game.mode === "upgrade") game.chooseDiscipline("power");
    else if (game.mode === "map") walkMap(game, pick);
  }
  return game.mode;
}

/** Quick Play party of 3: lead + two distinct followers (cosmetic only). */
export function quickParty(lead, followerA, followerB) {
  const pool = ["zhao-yun", "hu-sanniang", "lu-zhishen", "guan-yu", "wu-song", "nie-yinniang"];
  const followers = [];
  for (const id of [followerA, followerB, ...pool]) {
    if (!id || id === lead || followers.includes(id)) continue;
    followers.push(id);
    if (followers.length === 2) break;
  }
  if (followers.length !== 2) throw new Error("quickParty needs two distinct followers");
  return { lead, followers };
}
