import { activeHero, castFiles, resolveFrame } from "./vanguard-layers.mjs";
import { footStyle, fxStyle, layoutFor } from "./vanguard-place.mjs";
import { lifeScale, poseAt } from "./vanguard-phrase.mjs";
import { SHOTS, sampleCamera } from "./vanguard-shots.mjs";

const ROOT = "../assets/animation/";
const CUTOUT = "../assets/fight/ep1-vanguard/";

/** Directed cuts. ease 0 is a hard cut. Focal x/y are percent of the plate. */
const CAMERAS = {
  standoff: { zoom: 1.08, x: 50, y: 50, ease: 900, easeName: "track", label: "wide hold", ms: 1200, from: { zoom: 1.02, x: 46, y: 52 } },
  windup: { zoom: 1.26, x: 44, y: 46, ease: 900, easeName: "push", label: "wide ¾ push", ms: 1500, from: { zoom: 1.08, x: 50, y: 50 } },
  charge: { zoom: 1.7, x: 36, y: 46, ease: 280, easeName: "whip", label: "push-in", ms: 640, from: { zoom: 1.22, x: 48, y: 48 } },
  impact: { zoom: 2.45, x: 50, y: 44, ease: 0, label: "tip-clash CU", ms: 920 },
  pass: { zoom: 1.8, x: 56, y: 46, ease: 0, label: "pass flash", ms: 220 },
  hold: { zoom: 1.5, x: 52, y: 48, ease: 0, label: "hold", ms: 480 },
  aftermath: { zoom: 1.14, x: 50, y: 52, ease: 1100, easeName: "pull", label: "medium-wide", ms: 2100, from: { zoom: 1.4, x: 50, y: 48 } },
};

const ORDER = ["standoff", "windup", "charge", "impact", "pass", "hold", "aftermath"];
/** Layered Vanguard shot list. Yun stays screen-left, the vanguard screen-right. */
const LAYER_BEATS = SHOTS.map((shot) => shot.id);
const LAYER_LABELS = Object.fromEntries(SHOTS.map((shot) => [shot.id, shot.title]));
const EASE = {
  track: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  push: "cubic-bezier(0.22, 0.7, 0.2, 1)",
  whip: "cubic-bezier(0.55, 0.05, 0.25, 1)",
  pull: "cubic-bezier(0.16, 0.84, 0.3, 1)",
  cut: "linear",
};
const LABELS = {
  standoff: "Standoff",
  windup: "Wind-up",
  charge: "Charge",
  impact: "Impact",
  pass: "Pass",
  hold: "Hold",
  aftermath: "Aftermath",
};

const DESIGNS = [
  {
    id: "vanguard",
    title: "Gate Vanguard Clash",
    stem: "ep1-vanguard-s05",
    cutout: true,
    focus: { charge: { x: 34, y: 46 }, impact: { x: 50, y: 40 } },
  },
  {
    id: "warden",
    title: "Warden Staff Break",
    stem: "ep1-warden-s05",
    focus: { charge: { x: 38, y: 48 }, impact: { x: 50, y: 50 } },
  },
  {
    id: "heron",
    title: "Heron Silk vs Staff",
    stem: "ep1-heron-s04",
    focus: { charge: { x: 40, y: 46 }, impact: { x: 50, y: 46 } },
  },
  {
    id: "lubu",
    title: "Lu Bu Terrace Duel",
    stem: "ep1-lubu-s03",
    focus: { charge: { x: 36, y: 46 }, impact: { x: 46, y: 46 } },
  },
  {
    id: "finale",
    title: "Cloud Bridge Finale",
    stem: "ep2-final-s01",
    insert: "insert/ep1-final-duel-insert-four-weapons.png",
    focus: { charge: { x: 42, y: 46 }, impact: { x: 50, y: 44 } },
  },
];

const $ = (id) => document.getElementById(id);
let design = DESIGNS[0];
let layered = true;
let beat = "approach";
let playing = false;
let timer = 0;
let insertTimer = 0;
let camToken = 0;
let bodyToken = 0;
let swapKey = "";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroId = activeHero(new URLSearchParams(location.search).get("hero"));

function rel(path) {
  return `${ROOT}${path}`;
}

function beatPath(item, name) {
  if (name === "standoff") return `shot/${item.stem}.png`;
  return `fight/${item.stem}-${name}.png`;
}

function cameraFor(name) {
  if (layered && design.cutout) {
    const shot = SHOTS.find((item) => item.id === name);
    if (shot) return shot;
  }
  return { ...CAMERAS[name], ...(design.focus?.[name] || {}) };
}

function activeOrder() {
  return layered && design.cutout ? LAYER_BEATS : ORDER;
}

function writeCam(camera, frame) {
  camera.style.setProperty("--cam-x", `${frame.x}%`);
  camera.style.setProperty("--cam-y", `${frame.y}%`);
  camera.style.setProperty("--cam-z", String(frame.zoom));
}

function applyCamera(name) {
  const cam = cameraFor(name);
  const stage = $("stage");
  const camera = $("camera");
  const token = ++camToken;
  stage.dataset.move = cam.easeName || "";
  camera.style.setProperty("--cam-ease", EASE[cam.easeName] || EASE.push);
  if (cam.camera) {
    stage.dataset.cut = "hard";
    camera.style.setProperty("--cam-ms", "0ms");
    writeCam(camera, sampleCamera(cam, 0));
    return cam;
  }
  if (!cam.from) {
    stage.dataset.cut = cam.ease ? "ease" : "hard";
    camera.style.setProperty("--cam-ms", `${cam.ease || 0}ms`);
    writeCam(camera, cam);
    return cam;
  }
  const start = { ...cam, ...cam.from };
  stage.dataset.cut = "hard";
  camera.style.setProperty("--cam-ms", "0ms");
  writeCam(camera, start);
  requestAnimationFrame(() => {
    if (token !== camToken) return;
    requestAnimationFrame(() => {
      if (token !== camToken) return;
      stage.dataset.cut = "ease";
      camera.style.setProperty("--cam-ms", `${cam.ease}ms`);
      writeCam(camera, cam);
    });
  });
  return cam;
}

function idleLife(who, now, name) {
  const t = now / 1000;
  const quiet = name === "aftermath" || name === "approach";
  const slow = quiet ? 0.7 : 1;
  const amp = quiet ? 0.6 : 1;
  if (who === "hero") {
    return {
      y: Math.sin(t * 2.05 * slow) * 2.4 * amp,
      rot: Math.sin(t * 1.25 * slow) * 0.4 * amp,
    };
  }
  return {
    y: Math.sin(t * 1.9 * slow + 2.15) * 2.2 * amp,
    rot: Math.sin(t * 1.1 * slow + 1.35) * 0.45 * amp,
  };
}

function parallaxShift() {
  const camera = $("camera");
  const width = camera.offsetWidth;
  const height = camera.offsetHeight;
  if (!width || !height) return { x: 0, y: 0 };
  const origin = getComputedStyle(camera).transformOrigin.split(" ");
  return {
    x: (parseFloat(origin[0]) / width - 0.5) * 70,
    y: (parseFloat(origin[1]) / height - 0.5) * 32,
  };
}

function writePose(el, pose) {
  if (!el) return;
  const x = pose.x || 0;
  const y = pose.y || 0;
  const rot = pose.rot || 0;
  const sx = pose.sx || 1;
  const sy = pose.sy || 1;
  const skew = pose.skew || 0;
  el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) skewX(${skew.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  const filters = [];
  if (pose.blur) filters.push(`blur(${pose.blur.toFixed(2)}px)`);
  if (pose.contrast) filters.push(`contrast(${pose.contrast})`);
  if (pose.brightness) filters.push(`brightness(${pose.brightness})`);
  el.style.filter = filters.join(" ");
}

function setCues(name, elapsed, dur) {
  const glint = $("glint");
  const glintOn = (name === "windup" && elapsed > dur - 200) || (name === "feint" && elapsed < 200);
  if (glint) {
    glint.hidden = !glintOn;
    glint.className = glintOn ? `glint ${name}` : "glint";
  }
  const punch = $("punch");
  if (punch) {
    punch.hidden = true;
    punch.className = "punch";
  }
}

function endBody() {
  bodyToken += 1;
  swapKey = "";
  for (const id of ["layer-hero", "layer-rival", "plate"]) {
    const el = $(id);
    if (!el) continue;
    el.style.transform = "";
    el.style.filter = "";
  }
  setCues("", 0, 1);
}

function relOf(src) {
  const mark = "ep1-vanguard/";
  const i = src.indexOf(mark);
  return i < 0 ? src : src.slice(i + mark.length);
}

function bindSeat(el) {
  if (!el || el.dataset.seatBound) return;
  el.dataset.seatBound = "1";
  el.addEventListener("load", () => {
    if (el._seat) el._seat();
  });
}

/** Plant a cropped sprite on the beat's foot mark. Left/bottom survive writePose. */
function seat(el, shadow, src, slot) {
  if (!el) return;
  if (!slot || !src) {
    el.hidden = true;
    el.classList.remove("placed");
    if (shadow) shadow.hidden = true;
    return;
  }
  el.hidden = false;
  el.classList.add("placed");
  bindSeat(el);
  const apply = () => {
    const rel = relOf(src);
    const parent = el.parentElement;
    const pw = parent?.clientWidth || 0;
    const ph = parent?.clientHeight || 0;
    const ready = el.complete && el.naturalWidth > 0 && el.src.includes(rel.split("/").pop());
    const box = footStyle(
      rel,
      slot,
      ready ? pw : 0,
      ready ? ph : 0,
      ready ? el.naturalWidth : 0,
      ready ? el.naturalHeight : 0,
    );
    el.style.inset = "auto";
    el.style.top = "auto";
    el.style.right = "auto";
    el.style.width = "auto";
    el.style.maxWidth = "none";
    el.style.height = box.height;
    el.style.bottom = box.bottom;
    el.style.left = box.left;
    el.style.transformOrigin = box.origin;
  };
  el._seat = apply;
  apply();
  if (shadow) {
    shadow.hidden = false;
    shadow.style.left = `${slot.x}%`;
    shadow.style.bottom = `${(100 - slot.foot).toFixed(2)}%`;
    shadow.style.width = `${Math.max(10, slot.h * 0.28).toFixed(2)}%`;
  }
}

/** Slash sits between the two blades, not across the empty gate. */
function seatFx(fx, frame, layout) {
  if (!fx) return;
  const both = frame?.fx && layout?.hero && layout?.rival;
  fx.classList.remove("full");
  if (!both) {
    fx.hidden = true;
    fx.classList.remove("bridged");
    return;
  }
  const box = fxStyle(layout);
  if (!box) {
    fx.hidden = true;
    fx.classList.remove("bridged");
    return;
  }
  fx.hidden = false;
  fx.classList.add("bridged");
  fx.style.inset = "auto";
  fx.style.right = "auto";
  fx.style.bottom = "auto";
  fx.style.left = box.left;
  fx.style.top = box.top;
  fx.style.width = box.width;
  fx.style.height = box.height;
  fx.style.transform = "translate(-50%, -50%)";
  fx.style.objectFit = "fill";
}

function seatFrame(name, elapsed, dur, frame) {
  const hero = $("layer-hero");
  const rival = $("layer-rival");
  const shadowHero = $("shadow-hero");
  const shadowRival = $("shadow-rival");
  if (!frame || frame.flash) {
    if (shadowHero) shadowHero.hidden = true;
    if (shadowRival) shadowRival.hidden = true;
    return;
  }
  const layout = layoutFor(name, elapsed, dur, {
    hero: frame.heroPose,
    rival: frame.rivalPose,
  });
  seat(hero, shadowHero, frame.hero, layout?.hero);
  seat(rival, shadowRival, frame.rival, layout?.rival);
  if (hero) hero.style.zIndex = name === "ots" ? "3" : "";
  if (rival) rival.style.zIndex = name === "ots" ? "2" : "";
  seatFx($("layer-fx"), frame, layout);
}

function applyResolved(frame, read) {
  if (!frame) return;
  const key = [frame.flash, frame.bg, frame.hero, frame.rival, frame.fx].join("|");
  if (key === swapKey) return;
  swapKey = key;
  const plate = $("plate");
  const fx = $("layer-fx");
  if (frame.flash) {
    $("layers").hidden = true;
    plate.hidden = false;
    if (plate.getAttribute("src") !== frame.flash) plate.src = frame.flash;
    plate.alt = `${design.title}, impact flash, ${read}`;
    fx.hidden = true;
    $("status").textContent = `${design.title} · layered · ${read} · ${frame.heroId} · ${frame.flash}`;
    return;
  }
  plate.hidden = true;
  plate.style.transform = "";
  plate.style.filter = "";
  $("layers").hidden = false;
  $("layer-bg").src = frame.bg;
  const hero = $("layer-hero");
  hero.hidden = !frame.hero;
  if (frame.hero) {
    hero.src = frame.hero;
    hero.alt = `${design.title}, ${frame.heroId}, ${read}`;
  }
  const rival = $("layer-rival");
  rival.hidden = !frame.rival;
  if (frame.rival) {
    rival.src = frame.rival;
    rival.alt = `${design.title}, vanguard, ${read}`;
  }
  fx.hidden = !frame.fx;
  fx.classList.remove("full");
  if (frame.fx) fx.src = frame.fx;
  $("status").textContent = `${design.title} · layered · ${read} · ${frame.heroId} · ${frame.phase || frame.pose}`;
}

function beginBody(name, cam, read) {
  endBody();
  if (!layered || !design.cutout || !LAYER_BEATS.includes(name)) return;
  const token = bodyToken;
  const started = performance.now();
  const dur = cam.ms || 1000;
  const poseRead = read || `${name} · ${cam.label}`;
  let hitArmed = false;
  const tick = (now) => {
    if (token !== bodyToken) return;
    const elapsed = now - started;
    const frame = resolveFrame(name, elapsed, heroId);
    applyResolved(frame, poseRead);
    seatFrame(name, elapsed, dur, frame);
    if (cam.camera) writeCam($("camera"), sampleCamera(cam, Math.min(elapsed, dur)));
    $("stage").dataset.phase = frame?.phase || "";
    if (frame?.phase === "stop") {
      if (!hitArmed && !reduceMotion.matches) {
        hitArmed = true;
        restart($("stage"), "quake-bump");
      }
    } else hitArmed = false;
    if (!reduceMotion.matches && frame && !frame.flash) {
      setCues(name, elapsed, dur);
      const shift = parallaxShift();
      const scale = lifeScale(frame.phase);
      for (const who of ["hero", "rival"]) {
        const life = idleLife(who, now, name);
        life.y *= scale;
        life.rot *= scale;
        writePose($(`layer-${who}`), poseAt(frame, who, life, shift));
      }
    }
    requestAnimationFrame(tick);
  };
  const opening = resolveFrame(name, 0, heroId);
  applyResolved(opening, poseRead);
  seatFrame(name, 0, dur, opening);
  requestAnimationFrame(tick);
}

function syncMode() {
  const button = $("mode");
  const available = !!design.cutout;
  button.hidden = !available;
  if (!available) layered = false;
  button.textContent = layered ? "Layered cutouts" : "Baked plates";
  button.setAttribute("aria-pressed", layered ? "true" : "false");
}

function showBaked(name, read) {
  const path = beatPath(design, name);
  const stage = $("stage");
  stage.dataset.source = "baked";
  $("layers").hidden = true;
  $("layer-fx").hidden = true;
  const plate = $("plate");
  plate.hidden = false;
  plate.src = rel(path);
  plate.alt = `${design.title}, ${read}`;
  const fallback = design.cutout && layered ? "baked fallback · " : "baked · ";
  const extra = name === "impact" && design.insert ? ` · flash ${rel(design.insert)}` : "";
  $("cam-read").textContent = read;
  $("status").textContent = `${design.title} · ${fallback}${read} · ${rel(path)}${extra}`;
}

function showLayers(name, read) {
  const stage = $("stage");
  const cam = cameraFor(name);
  stage.dataset.source = "layered";
  const fx = $("layer-fx");
  fx.hidden = true;
  $("cam-read").textContent = `${read} · layered`;
  const opening = resolveFrame(name, 0, heroId);
  applyResolved(opening, read);
  if (opening) {
    seatFrame(name, 0, cam.ms || 1000, opening);
    return;
  }
  if (cam.file) {
    $("layers").hidden = true;
    const plate = $("plate");
    plate.hidden = false;
    plate.src = `${CUTOUT}${cam.file}`;
    plate.alt = `${design.title}, Zhao Yun with a jian, ${read}`;
    $("status").textContent = `${design.title} · layered · ${read} · ${CUTOUT}${cam.file}`;
    return;
  }
  $("plate").hidden = true;
  $("layers").hidden = false;
  $("layer-bg").src = `${CUTOUT}bg.png`;
  $("layer-hero").src = `${CUTOUT}hero-${name}.png`;
  $("layer-hero").alt = `${design.title}, Zhao Yun with a jian, ${read}`;
  $("layer-rival").src = `${CUTOUT}rival-${name}.png`;
  $("layer-rival").alt = `${design.title}, vanguard, ${read}`;
  const files = [`bg.png`, `hero-${name}.png`, `rival-${name}.png`];
  $("status").textContent = `${design.title} · layered · ${read} · ${CUTOUT} (${files.join(", ")})`;
}

function show(name, { fx = false } = {}) {
  beat = name;
  const cam = applyCamera(name);
  const read = `${name} · ${cam.label}`;
  $("stage").dataset.beat = name;
  for (const button of document.querySelectorAll("[data-beat]")) {
    button.setAttribute("aria-pressed", button.dataset.beat === name ? "true" : "false");
  }
  if (layered && design.cutout && LAYER_BEATS.includes(name)) {
    showLayers(name, read);
    beginBody(name, cam, read);
  } else {
    showBaked(name, read);
    endBody();
  }
  if (cam.shake && fx) hit(cam);
  else if (name === "impact" && fx) hit(cam);
  else clearHit();
}

function restart(node, className) {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function clearHit() {
  clearTimeout(insertTimer);
  $("stage").classList.remove("quake", "quake-soft", "quake-bump");
  $("flash").classList.remove("on");
  $("impact-frame").classList.remove("boom");
  $("insert").classList.remove("flash");
  $("insert").hidden = true;
}

function hit(cam) {
  clearHit();
  if (layered && design.cutout) {
    if (cam && cam.shake) restart($("stage"), "quake-bump");
    return;
  }
  restart($("stage"), "quake");
  restart($("flash"), "on");
  restart($("impact-frame"), "boom");
  if (!design.insert) return;
  const insert = $("insert");
  insert.src = rel(design.insert);
  insert.hidden = false;
  restart(insert, "flash");
  insertTimer = setTimeout(() => {
    insert.classList.remove("flash");
    insert.hidden = true;
  }, 220);
}

function stop() {
  playing = false;
  clearTimeout(timer);
  $("play").textContent = "Play";
  $("play").setAttribute("aria-pressed", "false");
}

function stepFrom(index) {
  const order = activeOrder();
  if (index >= order.length) {
    stop();
    show(order[order.length - 1]);
    $("status").textContent += " · Sequence complete";
    return;
  }
  const name = order[index];
  show(name, { fx: true });
  timer = setTimeout(() => stepFrom(index + 1), cameraFor(name).ms);
}

function play() {
  stop();
  playing = true;
  $("play").textContent = "Playing";
  $("play").setAttribute("aria-pressed", "true");
  stepFrom(0);
}

function select(next) {
  stop();
  clearHit();
  design = next;
  layered = !!next.cutout;
  syncMode();
  for (const card of document.querySelectorAll(".card")) {
    card.setAttribute("aria-pressed", card.dataset.id === design.id ? "true" : "false");
  }
  if (design.insert) $("insert").src = rel(design.insert);
  renderBeats();
  show(layered ? "approach" : "standoff");
}

function renderBeats() {
  const beats = $("beats");
  beats.replaceChildren();
  const order = activeOrder();
  const labels = layered && design.cutout ? LAYER_LABELS : LABELS;
  for (const name of order) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.beat = name;
    button.textContent = labels[name];
    button.onclick = () => {
      stop();
      show(name, { fx: true });
    };
    beats.append(button);
  }
}

function preload(item) {
  for (const name of ORDER) {
    const image = new Image();
    image.src = rel(beatPath(item, name));
  }
  if (item.insert) {
    const image = new Image();
    image.src = rel(item.insert);
  }
  if (!item.cutout) return;
  for (const file of ["bg.png", "fx-impact.png"]) {
    const image = new Image();
    image.src = `${CUTOUT}${file}`;
  }
  for (const src of castFiles(heroId)) {
    const image = new Image();
    image.src = src;
  }
}

function mount() {
  const cards = $("cards");
  for (const item of DESIGNS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.id = item.id;
    button.setAttribute("aria-pressed", item === design ? "true" : "false");
    const img = document.createElement("img");
    img.src = rel(beatPath(item, "impact"));
    img.alt = "";
    const label = document.createElement("span");
    label.textContent = item.title;
    button.append(img, label);
    button.onclick = () => select(item);
    cards.append(button);
    preload(item);
  }
  renderBeats();
  $("play").onclick = () => play();
  $("mode").onclick = () => {
    if (!design.cutout) return;
    stop();
    layered = !layered;
    syncMode();
    renderBeats();
    const order = activeOrder();
    show(order.includes(beat) ? beat : order[0]);
  };
  $("layer-bg").onerror = () => {
    if ($("stage").dataset.source !== "layered") return;
    showBaked(beat, $("cam-read").textContent.replace(" · layered", ""));
    $("status").textContent += " · cutout missing, baked fallback";
  };
  reduceMotion.addEventListener("change", () => {
    if (layered && design.cutout && LAYER_BEATS.includes(beat)) {
      beginBody(beat, cameraFor(beat), `${beat} · ${cameraFor(beat).label}`);
    } else endBody();
  });
  syncMode();
  show("approach");
}

mount();
