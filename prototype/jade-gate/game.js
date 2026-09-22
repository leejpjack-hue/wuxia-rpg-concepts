// Browser composition root. Domain modules do not import this file or browser APIs.
import * as synth from "./audio.js";
import { GameSession } from "./src/domain/session.js";
import { SaveStore } from "./src/platform/save-store.js";
import { AssetStore } from "./src/platform/assets.js";
import { AudioDirector } from "./src/platform/audio-director.js";
import { InputController } from "./src/platform/input.js";
import { GameView } from "./src/presentation/view.js";
import { createRenderer } from "./src/presentation/renderer.js";
import { FixedClock } from "./src/engine/clock.js";
let storage = null;
try {
  storage = window.localStorage;
} catch {}
const store = new SaveStore(storage),
  session = new GameSession(store),
  assets = new AssetStore();
if (!store.hadSettings)
  session.profile.settings.reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
const audio = new AudioDirector(session.bus, synth, session.profile.settings);
const view = new GameView(session, document, () => audio.unlock());
const canvas = document.getElementById("arena"),
  context = canvas.getContext("2d");
const renderer = createRenderer(assets.images),
  clock = new FixedClock();
const input = new InputController({
  window,
  document,
  canvas,
  onPause: () => session.pause(),
  onGesture: () => audio.unlock(),
  isPlaying: () => session.mode === "playing",
  onAim: (x, y) => {
    session.g.p.facing = Math.atan2(y - session.g.p.y, x - session.g.p.x);
  },
});
const offState = session.bus.on("state:changed", () => {
  input.clear();
  clock.reset();
});
let frame = 0,
  previous = performance.now(),
  disposed = false;
function tick(now) {
  if (disposed) return;
  const elapsed = Math.max(0, (now - previous) / 1000);
  previous = now;
  if (session.mode === "playing")
    clock.advance(elapsed, (dt) => session.step(dt, input.read()));
  else clock.reset();
  if (session.g) {
    renderer.draw(context, session.g, session.profile.settings.reducedMotion);
    view.hud(session.mode === "playing" ? Math.min(elapsed, 0.1) : 0);
  }
  frame = requestAnimationFrame(tick);
}
function hidden() {
  if (document.hidden) {
    input.clear();
    if (session.mode === "playing") session.pause();
    audio.hidden();
  }
  previous = performance.now();
  clock.reset();
}
function gesture() {
  audio.unlock();
}
function pagehide(event) {
  if (event.persisted) {
    input.clear();
    if (session.mode === "playing") session.pause();
    audio.hidden();
    clock.reset();
    return;
  }
  disposed = true;
  cancelAnimationFrame(frame);
  offState();
  input.dispose();
  view.dispose();
  session.dispose();
  audio.dispose();
  document.removeEventListener("visibilitychange", hidden);
  window.removeEventListener("pointerdown", gesture);
}
document.addEventListener("visibilitychange", hidden);
window.addEventListener("pointerdown", gesture);
window.addEventListener("pagehide", pagehide);
async function prepare() {
  const status = document.getElementById("load-status"),
    retry = document.getElementById("retry-assets");
  retry.hidden = true;
  status.textContent = "Loading the mountain pass…";
  try {
    await assets.preload();
    view.setReady(true);
    status.textContent = "";
  } catch (error) {
    status.textContent = `${error.message}. Check the asset files, then retry.`;
    retry.hidden = false;
  }
}
document.getElementById("retry-assets").onclick = prepare;
frame = requestAnimationFrame(tick);
await prepare();
