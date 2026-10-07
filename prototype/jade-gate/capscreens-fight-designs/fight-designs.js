const ROOT = "../assets/animation/";
const CUTOUT = "../assets/fight/ep1-vanguard/";

/** Directed cuts. ease 0 is a hard cut. Focal x/y are percent of the plate. */
const CAMERAS = {
  standoff: { zoom: 1.04, x: 50, y: 48, ease: 0, label: "wide hold", ms: 860 },
  windup: { zoom: 1.2, x: 48, y: 48, ease: 520, label: "wide ¾", ms: 980 },
  charge: { zoom: 1.62, x: 38, y: 46, ease: 220, label: "push-in", ms: 320 },
  impact: { zoom: 2.5, x: 50, y: 44, ease: 0, label: "tip-clash CU", ms: 760 },
  pass: { zoom: 1.85, x: 50, y: 46, ease: 0, label: "pass flash", ms: 150 },
  hold: { zoom: 1.62, x: 52, y: 48, ease: 0, label: "hold flash", ms: 170 },
  aftermath: { zoom: 1.36, x: 50, y: 50, ease: 780, label: "medium-wide", ms: 1680 },
};

const ORDER = ["standoff", "windup", "charge", "impact", "pass", "hold", "aftermath"];
const LAYER_BEATS = ["windup", "charge", "impact", "aftermath"];
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
    layeredFocus: { impact: { x: 50, y: 46 } },
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
let beat = "windup";
let playing = false;
let timer = 0;
let insertTimer = 0;

function rel(path) {
  return `${ROOT}${path}`;
}

function beatPath(item, name) {
  if (name === "standoff") return `shot/${item.stem}.png`;
  return `fight/${item.stem}-${name}.png`;
}

function cameraFor(name) {
  const layeredFocus = layered && design.cutout ? design.layeredFocus?.[name] : null;
  return { ...CAMERAS[name], ...(design.focus?.[name] || {}), ...(layeredFocus || {}) };
}

function activeOrder() {
  return layered && design.cutout ? LAYER_BEATS : ORDER;
}

function applyCamera(name) {
  const cam = cameraFor(name);
  const stage = $("stage");
  const camera = $("camera");
  stage.dataset.cut = cam.ease === 0 ? "hard" : "ease";
  camera.style.setProperty("--cam-ms", `${cam.ease}ms`);
  camera.style.setProperty("--cam-x", `${cam.x}%`);
  camera.style.setProperty("--cam-y", `${cam.y}%`);
  camera.style.setProperty("--cam-z", String(cam.zoom));
  return cam;
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
  stage.dataset.source = "layered";
  $("plate").hidden = true;
  $("layers").hidden = false;
  $("layer-bg").src = `${CUTOUT}bg.png`;
  $("layer-hero").src = `${CUTOUT}hero-${name}.png`;
  $("layer-hero").alt = `${design.title}, Zhao Yun with a jian, ${read}`;
  $("layer-rival").src = `${CUTOUT}rival-${name}.png`;
  $("layer-rival").alt = `${design.title}, vanguard, ${read}`;
  const fx = $("layer-fx");
  const files = [`bg.png`, `hero-${name}.png`, `rival-${name}.png`];
  if (name === "impact") {
    fx.src = `${CUTOUT}fx-impact.png`;
    fx.hidden = false;
    files.push("fx-impact.png");
  } else {
    fx.hidden = true;
  }
  $("cam-read").textContent = `${read} · layered`;
  $("status").textContent = `${design.title} · layered · ${read} · ${CUTOUT} (${files.join(", ")}) · Art Dir PASS_WITH_NOTES`;
}

function show(name, { fx = false } = {}) {
  beat = name;
  const cam = applyCamera(name);
  const read = `${name} · ${cam.label}`;
  $("stage").dataset.beat = name;
  for (const button of document.querySelectorAll("[data-beat]")) {
    button.setAttribute("aria-pressed", button.dataset.beat === name ? "true" : "false");
  }
  if (layered && design.cutout && LAYER_BEATS.includes(name)) showLayers(name, read);
  else showBaked(name, read);
  if (name === "impact" && fx) hit();
  else clearHit();
}

function restart(node, className) {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function clearHit() {
  clearTimeout(insertTimer);
  $("stage").classList.remove("quake");
  $("flash").classList.remove("on");
  $("impact-frame").classList.remove("boom");
  $("insert").classList.remove("flash");
  $("insert").hidden = true;
}

function hit() {
  clearHit();
  restart($("stage"), "quake");
  restart($("flash"), "on");
  restart($("impact-frame"), "boom");
  if (!design.insert || (layered && design.cutout)) return;
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
  show(layered ? "windup" : "standoff");
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
  for (const name of LAYER_BEATS) {
    for (const who of ["hero", "rival"]) {
      const image = new Image();
      image.src = `${CUTOUT}${who}-${name}.png`;
    }
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
  const beats = $("beats");
  for (const name of ORDER) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.beat = name;
    button.textContent = LABELS[name];
    button.onclick = () => {
      stop();
      show(name, { fx: true });
    };
    beats.append(button);
  }
  $("play").onclick = () => play();
  $("mode").onclick = () => {
    if (!design.cutout) return;
    stop();
    layered = !layered;
    syncMode();
    const next = layered && !LAYER_BEATS.includes(beat) ? "windup" : beat;
    show(next);
  };
  $("layer-bg").onerror = () => {
    if ($("stage").dataset.source !== "layered") return;
    showBaked(beat, $("cam-read").textContent.replace(" · layered", ""));
    $("status").textContent += " · cutout missing, baked fallback";
  };
  syncMode();
  show("windup");
}

mount();
