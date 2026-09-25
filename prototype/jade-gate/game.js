// Card RPG composition root: turns advance only through explicit player commands.
import * as synth from "./audio.js";
import { GameSession } from "./src/domain/session.js";
import { createCardCombat } from "./src/domain/card-combat.js";
import { SaveStore } from "./src/platform/save-store.js";
import { AssetStore } from "./src/platform/assets.js";
import { AudioDirector } from "./src/platform/audio-director.js";
import { GameView } from "./src/presentation/view.js";
import { DuelView } from "./src/presentation/duel-view.js";
import { RoamView } from "./src/presentation/roam-view.js";
import { HERO_IDS } from "./src/content/heroes.js";

let storage = null;
try { storage = window.localStorage; } catch {}
const store = new SaveStore(storage);
const session = new GameSession(store, { combatFactory: createCardCombat });
if (!store.hadSettings)
  session.profile.settings.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const audio = new AudioDirector(session.bus, synth, session.profile.settings);
function gesture() {
  try { audio.unlock(); } catch {
    document.getElementById("app-status").textContent = "Audio is unavailable in this browser. You can still play the full game.";
  }
}
const view = new GameView(session, document, gesture);
const duel = new DuelView(session, document, gesture);
const roam = new RoamView(session, document, gesture);
const assets = new AssetStore();
const art = [
  ...HERO_IDS,
  ...HERO_IDS.map((id) => `${id}-sprite`),
  "arena",
  "bamboo-ambush",
  "guard-sprite",
  "archer-sprite",
  "warden-sprite",
];
view.setReady(true);
async function prepare() {
  const status = document.getElementById("load-status"), retry = document.getElementById("retry-assets");
  retry.hidden = true;
  const results = await Promise.allSettled(art.map((id) => assets.load(id)));
  const missing = results.filter((r) => r.status === "rejected").length;
  status.textContent = missing ? `${missing} illustrations could not load. The card duel is still playable.` : "";
  retry.hidden = !missing;
}
document.getElementById("retry-assets").onclick = prepare;
function hidden() {
  if (document.hidden) {
    if (["playing", "exploring"].includes(session.mode)) session.pause();
    audio.hidden();
  }
}
function pagehide(event) {
  if (event.persisted) { hidden(); return; }
  view.dispose();
  duel.dispose();
  roam.dispose();
  audio.dispose();
  session.dispose();
  document.removeEventListener("visibilitychange", hidden);
}
document.addEventListener("visibilitychange", hidden);
window.addEventListener("pagehide", pagehide);
await prepare();
