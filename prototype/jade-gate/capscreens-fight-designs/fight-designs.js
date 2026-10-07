const ROOT = "../assets/animation/";

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
  return { ...CAMERAS[name], ...(design.focus?.[name] || {}) };
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
  const read = `${name} · ${cam.label}`;
  $("cam-read").textContent = read;
  return { cam, read };
}

function show(name, { fx = false } = {}) {
  const path = beatPath(design, name);
  const { read } = applyCamera(name);
  $("plate").src = rel(path);
  $("plate").alt = `${design.title}, ${read}`;
  $("stage").dataset.beat = name;
  for (const button of document.querySelectorAll("[data-beat]")) {
    button.setAttribute("aria-pressed", button.dataset.beat === name ? "true" : "false");
  }
  const extra = name === "impact" && design.insert ? ` · flash ${rel(design.insert)}` : "";
  $("status").textContent = `${design.title} · ${read} · ${rel(path)}${extra}`;
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
  if (index >= ORDER.length) {
    stop();
    show("aftermath");
    $("status").textContent += " · Sequence complete";
    return;
  }
  const name = ORDER[index];
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
  for (const card of document.querySelectorAll(".card")) {
    card.setAttribute("aria-pressed", card.dataset.id === design.id ? "true" : "false");
  }
  if (design.insert) $("insert").src = rel(design.insert);
  show("standoff");
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
  show("standoff");
}

mount();
