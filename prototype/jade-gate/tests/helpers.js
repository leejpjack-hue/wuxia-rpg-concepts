import { SaveStore } from "../src/platform/save-store.js";
import { GameSession } from "../src/domain/session.js";
import { createCardCombat } from "../src/domain/card-combat.js";
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
    intent = game.combat.intent();
  return game.g.duel.tea && p.hp < p.maxHp - 35
    ? "tea"
    : p.flow >= p.cost
      ? "technique"
      : ["heavy", "guard"].includes(intent.kind)
        ? "guard"
        : "attack";
}
export function clearEncounter(game) {
  let guard = 0;
  while (["exploring", "playing"].includes(game.mode) && guard++ < 400) {
    if (game.mode === "exploring") {
      if (!game.beginDuel(0)) throw new Error("nothing to duel");
    } else if (!game.combat.act(duelPolicy(game)))
      throw new Error("duel policy stalled");
  }
  if (game.mode === "defeat") throw new Error("duel policy lost the encounter");
  return game.mode;
}
export function completeCampaign(game) {
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game);
  game.chooseDiscipline("vitality");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.advanceDialogue(true);
}
