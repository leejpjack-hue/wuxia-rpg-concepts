const ROOT = "../assets/animation/";
const ORDER = ["standoff", "windup", "charge", "impact", "pass", "hold", "aftermath"];
const HOLD = {
  standoff: 1100,
  windup: 720,
  charge: 220,
  impact: 620,
  pass: 640,
  hold: 980,
  aftermath: 1700,
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
  { id: "vanguard", title: "Gate Vanguard Clash", stem: "ep1-vanguard-s05" },
  { id: "warden", title: "Warden Staff Break", stem: "ep1-warden-s05" },
  { id: "heron", title: "Heron Silk vs Staff", stem: "ep1-heron-s04" },
  { id: "lubu", title: "Lu Bu Terrace Duel", stem: "ep1-lubu-s03" },
  {
    id: "finale",
    title: "Cloud Bridge Finale",
    stem: "ep2-final-s01",
    insert: "insert/ep1-final-duel-insert-four-weapons.png",
  },
];

const $ = (id) => document.getElementById(id);
let design = DESIGNS[0];
let beat = "standoff";
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

function sequenceOf(item) {
  return ORDER.filter((name) => name !== "standoff" || item.standoff !== false);
}

function show(name, { fx = false } = {}) {
  beat = name;
  const path = beatPath(design, name);
  $("plate").src = rel(path);
  $("plate").alt = `${design.title}, ${LABELS[name]}`;
  $("stage").dataset.beat = name;
  for (const button of document.querySelectorAll("[data-beat]")) {
    button.setAttribute("aria-pressed", button.dataset.beat === name ? "true" : "false");
  }
  const extra = name === "impact" && design.insert ? ` · flash ${rel(design.insert)}` : "";
  $("status").textContent = `${design.title} · ${LABELS[name]} · ${rel(path)}${extra}`;
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
  const beats = sequenceOf(design);
  if (index >= beats.length) {
    stop();
    show(beats[beats.length - 1]);
    $("status").textContent += " · Sequence complete";
    return;
  }
  const name = beats[index];
  show(name, { fx: true });
  timer = setTimeout(() => stepFrom(index + 1), HOLD[name]);
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
  const insert = $("insert");
  if (design.insert) insert.src = rel(design.insert);
  show("standoff");
}

function preload(item) {
  for (const name of sequenceOf(item)) {
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
