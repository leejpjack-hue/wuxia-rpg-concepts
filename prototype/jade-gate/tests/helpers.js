import { SaveStore } from "../src/platform/save-store.js";
import { GameSession } from "../src/domain/session.js";
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
  };
}
export function session(storage = memoryStorage()) {
  return new GameSession(new SaveStore(storage));
}
export function clearEncounter(game) {
  game.g.enemies = [];
  game.g.hitStop = 0;
  game.step(1 / 60, { keys: new Set(), actions: [] });
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
