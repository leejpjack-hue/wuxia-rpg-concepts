import { HEROES } from "../content/heroes.js";
import { translate } from "../locales/i18n.js";
import { curioById, techniqueCost } from "../content/curios.js";
import { WEATHERS, oathFor } from "../content/expansion.js";
import { SPAWN_MARKERS, VIEWPORT, WORLD, smoothCamera, worldToScreen } from "../domain/ground.js";
import { roamScene } from "../content/roam-scenes.js";
import { BLOCKER_ART } from "./blocker-art.js";
import { routeMapModel, paintRouteMap } from "./route-map.js";
import { isCollisionDebugOn, paintCollisionDebug } from "./collision-debug.js";
import { expansionArtAvailable } from "../content/expansion-art.js";
import assetManifest from "../../docs/asset-manifest.json" with { type: "json" };
// FRAME-02 stub — Codex replaces via #19; see src/platform/sheet-anim.js header.
import {
  loadSheetManifest,
  sampleAnim,
  applySheetFrame,
  clearSheetFrame,
} from "../platform/sheet-anim.js";
const KEYS = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};


/** Arena roaming scene: d-pad/keyboard movement drives the domain roam step. */
export class RoamView {
  constructor(session, document, onGesture = () => {}) {
    this.session = session;
    this.t = text => translate(text, session.profile.settings.language);
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.onGesture = onGesture;
    this.keys = new Set();
    this.actions = [];
    this.context = this.$("roam-effects")?.getContext("2d");
    this.sprites = new Map();
    this.followers = new Map();
    this.wallPattern = null;
    this.blockerArt = BLOCKER_ART.map(prop => {
      const node = document.createElement("div");
      node.className = "roam-thicket";
      node.style.setProperty("--flip", prop.flip);
      node.style.setProperty("--tilt", `${prop.tilt}deg`);
      node.setAttribute("aria-hidden", "true");
      this.$("roam-arena").appendChild(node);
      return node;
    });
    this.spawnMarkers = SPAWN_MARKERS.map(() => {
      const node = document.createElement("div");
      node.className = "roam-spawn-marker";
      node.setAttribute("aria-hidden", "true");
      this.$("roam-arena").appendChild(node);
      return node;
    });
    this.frame = 0;
    this.last = 0;
    this.animTime = 0;
    this.sheetByHero = new Map();
    this.followerPrev = new Map();
    /** Soft camera top-left; reset when explore/hero changes in sync(). */
    this.cam = null;
    this.camHeroId = null;
    this.camRoam = null;
    this.dt = 0;
    this.manifest = assetManifest;
    const view = document.defaultView;
    this.debugCollision = isCollisionDebugOn(view?.location?.search ?? "");
    this.request = view?.requestAnimationFrame?.bind(view) || null;
    this.cancel = view?.cancelAnimationFrame?.bind(view) || null;
    this.keydown = (event) => {
      if (event.repeat || event.altKey || event.metaKey || event.ctrlKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      const action = {KeyJ:"strike", Digit1:"strike", Space:"dodge", KeyK:"dodge", KeyE:"technique", Digit3:"technique", KeyC:"sneak"}[event.code];
      if (action && session.mode === "exploring") { event.preventDefault(); this.onGesture(); this.actions.push(action); }
      if (event.code === "Escape" && session.mode === "exploring") {
        event.preventDefault();
        session.pause();
        return;
      }
      const move = KEYS[event.code];
      if (move && session.mode === "exploring") {
        event.preventDefault();
        this.onGesture();
        this.keys.add(move);
      }
    };
    this.keyup = (event) => {
      const move = KEYS[event.code];
      if (move) this.keys.delete(move);
    };
    document.addEventListener("keydown", this.keydown);
    document.addEventListener("keyup", this.keyup);
    this.$("roam-pause").onclick = () => {
      this.onGesture();
      session.pause();
    };
    this.$("roam-hero").onerror = () => {
      this.$("roam-hero").hidden = true;
    };
    this.moveButtons = [];
    for (const button of document.querySelectorAll("[data-move]")) {
      const move = button.dataset.move;
      const press = (event) => {
        event.preventDefault();
        this.onGesture();
        this.keys.add(move);
        button.setPointerCapture?.(event.pointerId);
      };
      const release = () => this.keys.delete(move);
      button.addEventListener("pointerdown", press);
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
        button.addEventListener(name, release);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
      this.moveButtons.push(button);
    }
    this.clearKeys = () => { this.keys.clear(); this.actions = []; };
    view?.addEventListener("blur", this.clearKeys);
    document.addEventListener("visibilitychange", this.clearKeys);
    for (const button of document.querySelectorAll("[data-roam-action]")) button.onclick = () => {
      this.onGesture(); this.actions.push(button.dataset.roamAction);
    };
    this.off = [session.bus.on("settings:changed", () => this.sync()), session.bus.on("state:changed", () => { this.clearKeys(); this.sync(); }),
      session.bus.on("roam:rival-defeated", () => this.sync())];
    this.sync();
    // Bind once: requestAnimationFrame must not receive an unbound method.
    this.tick = (now) => this.loop(now);
    if (this.request) this.frame = this.request(this.tick);
  }
  axes() {
    return {
      actions: this.actions.splice(0),
      dx: (this.keys.has("right") ? 1 : 0) - (this.keys.has("left") ? 1 : 0),
      dy: (this.keys.has("down") ? 1 : 0) - (this.keys.has("up") ? 1 : 0),
    };
  }
  loop(now) {
    this.frame = this.request(this.tick);
    const dt = Math.min(0.1, (now - this.last) / 1000 || 0);
    this.last = now;
    this.dt = dt;
    this.animTime += dt;
    if (this.session.mode === "exploring" && !this.document.hidden)
      this.session.step(dt, this.axes());
    this.draw();
  }
  place(node, x, y, cam = { x: 0, y: 0 }) {
    const screen = worldToScreen(x, y, cam);
    node.style.zIndex = Math.round(y);
    node.style.left = `${(screen.x / VIEWPORT.width) * 100}%`;
    node.style.top = `${(screen.y / VIEWPORT.height) * 100}%`;
  }
  /** The scene owns crop/scale; camera movement never stretches art to WORLD. */
  applyCamera(cam) {
    const arena = this.$("roam-arena");
    if (!arena) return;
    const scene = roamScene(this.session?.act?.id);
    const file = `assets/${scene.art}.png`;
    if (arena.dataset.stage !== file) {
      arena.dataset.stage = file;
      arena.dataset.scene = this.session?.act?.id || "jade-gate";
      arena.style.backgroundImage = `url("${file}")`;
      arena.style.setProperty?.("--blocker-art", `url("assets/${scene.blocker}.png")`);
    }
    const px = cam.x / (scene.tileWidth - VIEWPORT.width) * 100;
    const py = (cam.y + scene.topCrop) / (scene.artHeight - VIEWPORT.height) * 100;
    // The taller maze world scrolls past one plate's height: tile both axes.
    arena.style.backgroundRepeat = "repeat";
    arena.style.backgroundSize = `${scene.tileWidth / VIEWPORT.width * 100}% ${scene.artHeight / VIEWPORT.height * 100}%`;
    arena.style.backgroundPosition = `${px}% ${py}%`;
  }
  sync() {
    const { session } = this;
    const active = session.mode === "exploring";
    this.$("roam").hidden = !active;
    if (!active || !session.g?.roam) return;
    const g = session.g;
    // New explore (createRoam) or hero swap → snap soft cam next draw.
    if (this.camRoam !== g.roam || this.camHeroId !== g.p?.id) {
      this.cam = null;
      this.camRoam = g.roam;
      this.camHeroId = g.p?.id ?? null;
    }
    this.$("roam-chapter").textContent = this.t(`ACT ${session.act.number} · ${session.act.name.toUpperCase()}`);
    this.$("roam-objective").textContent = this.t(session.encounter.title);
    this.$("roam-score").textContent = this.t(g.score);
    const left = g.roam.field.length;
    this.$("roam-remaining").textContent = this.t(`${left} ${left === 1 ? "RIVAL" : "RIVALS"} ON THE PASS`);
    const carried = g.curios || [];
    const chips = this.$("roam-curios");
    const chipsHtml = carried.map((id) => {
      const curio = curioById(id);
      return curio ? `<span class="curio-chip" title="${curio.name}: ${curio.description}">${curio.icon}</span>` : "";
    }).join("");
    if (chips && chips.dataset.curios !== carried.join(",")) {
      chips.dataset.curios = carried.join(",");
      chips.innerHTML = chipsHtml;
    }
    const hero = this.$("roam-hero"),
      src = `assets/${g.p.id}-sprite.png`;
    // Keep a visible fallback if a future sprite fails to load.
    this.heroToken?.remove();
    this.heroToken = null;
    hero.hidden = false;
    if (hero.dataset) hero.dataset.stillSrc = src;
    hero.onerror = () => {
      const shown = hero.getAttribute("src");
      if (shown !== src && shown !== hero.dataset?.stillSrc) return;
      clearSheetFrame(hero);
      hero.hidden = true;
      const token = this.document.createElement("div");
      token.className = "roam-token";
      token.style.borderColor = g.p.color;
      token.style.backgroundImage = `url("assets/${g.p.id}.png")`;
      token.style.backgroundPosition = g.p.artFocus || "32% 30%";
      this.$("roam-arena").appendChild(token);
      this.heroToken = token;
      this.draw();
    };
    // Still path when no sheet; sheet mode is applied each draw().
    if (!this.sheetFor(g.p.id)) {
      clearSheetFrame(hero);
      if (hero.getAttribute("src") !== src) hero.src = src;
    } else if (hero.getAttribute("src") !== src && !hero.classList?.contains?.("sheet-anim")) {
      hero.src = src;
    }
    hero.alt = this.t(g.p.name);
    for (const [id, node] of this.sprites)
      if (!g.roam.field.some((enemy) => enemy.id === id)) {
        node.remove();
        this.sprites.delete(id);
      }
    for (const enemy of g.roam.field) {
      let node = this.sprites.get(enemy.id);
      if (!node) {
        node = this.document.createElement("img");
        node.className = "roam-rival";
        node.alt = this.t(enemy.name);
        node.draggable = false;
        node.onerror = () => {
          node.hidden = true;
        };
        node.src = `assets/${enemy.art}.png`;
        this.$("roam-arena").appendChild(node);
        this.sprites.set(enemy.id, node);
      }
      node.alt = this.t(enemy.name);
      node.hidden = false;
    }
    for (const [id, node] of this.followers)
      if (!(g.roam.followers || []).some((follower) => follower.id === id)) {
        node.remove();
        this.followers.delete(id);
      }
    for (const follower of g.roam.followers || []) {
      let node = this.followers.get(follower.id);
      if (!node) {
        node = this.document.createElement("img");
        node.className = "roam-follower";
        node.draggable = false;
        node.onerror = () => {
          node.hidden = true;
        };
        const still = `assets/${follower.id}-sprite.png`;
        node.src = still;
        if (node.dataset) node.dataset.stillSrc = still;
        this.$("roam-arena").appendChild(node);
        this.followers.set(follower.id, node);
      }
      node.alt = follower.id;
      node.hidden = false;
      if (node.dataset) node.dataset.stillSrc = `assets/${follower.id}-sprite.png`;
      // WU-PARTY-07: followers face with the lead (belt-and-suspenders with domain dx).
      node.style.setProperty("--face", g.p.dx < 0 ? "-1" : "1");
    }
    this.draw();
    this.$("roam").focus({ preventScroll: true });
  }
  /** Lead vitals are live; cosmetic followers always display catalog health. */
  drawPartyHud(g) {
    const members = [g.p, ...(g.party?.followers || []).map(id => {
      const hero = HEROES.find(hero => hero.id === id);
      return { id: hero.id, name: hero.name, hp: hero.hp, maxHp: hero.hp };
    })];
    const hud = this.$("roam-health");
    const roster = members.map(member => member.id).join(",");
    // WU-PLAY-01: brief one-shot pulse on follower chips after a won duel.
    if (g.roam?.swapCue) {
      const elapsed = (g.time || 0) - (g.roam.swapCueAt || 0);
      if (elapsed > 6) g.roam.swapCue = false;
    }
    const cue = !!(g.roam?.swapCue) && (g.roam.contact ?? -1) < 0;
    if (hud.dataset.roster !== roster) {
      hud.replaceChildren();
      this.partyChips = members.map((member, index) => {
        const chip = this.document.createElement("div");
        chip.className = index === 0
          ? "party-hp-chip lead"
          : `party-hp-chip swap-ready${cue ? " swap-cue" : ""}`;
        chip.dataset.partyRole = index === 0 ? "lead" : "follower";
        chip.dataset.heroId = member.id;
        const name = this.document.createElement("strong");
        name.className = "chip-name";
        const hp = this.document.createElement("span");
        hp.className = "chip-hp";
        chip.appendChild(name);
        chip.appendChild(hp);
        // PARTY-03: tap a follower chip between encounters to promote them.
        if (index > 0) {
          if (typeof chip.setAttribute === "function") chip.setAttribute("role", "button");
          chip.tabIndex = 0;
          chip.title = this.t("Tap to take the lead");
          chip.onclick = (event) => {
            event?.preventDefault?.();
            this.onGesture?.();
            this.session.swapLead(member.id);
          };
        } else {
          // Dismiss the post-duel swap cue without swapping.
          chip.onclick = (event) => {
            event?.preventDefault?.();
            if (this.session.g?.roam?.swapCue) {
              this.session.g.roam.swapCue = false;
              this.onGesture?.();
            }
          };
        }
        hud.appendChild(chip);
        return { name, hp, el: chip };
      });
      hud.dataset.roster = roster;
    }
    members.forEach((member, index) => {
      const chip = this.partyChips[index];
      const name = this.t(member.name);
      // Composure rides the lead chip; weather rides the heading chip.
      const composure = index === 0 && member.rattled
        ? this.t(" · Rattled")
        : index === 0 && member.composure
          ? this.t(` · Composure ${Math.floor(member.composure)}/100`)
          : "";
      const vitals = index === 0
        ? this.t(`${Math.ceil(member.hp)} / ${member.maxHp} HEALTH · ${Math.floor(g.p.flow)} FLOW`) + (g.roam.sneaking ? this.t(" · SNEAKING") : "") + composure
        : `${member.hp} / ${member.maxHp} ${this.t("HEALTH")}`;
      if (chip.name.textContent !== name) chip.name.textContent = name;
      if (chip.hp.textContent !== vitals) chip.hp.textContent = vitals;
      const el = chip.el || hud.children[index];
      if (el) {
        el.className = index === 0
          ? "party-hp-chip lead"
          : `party-hp-chip swap-ready${cue ? " swap-cue" : ""}`;
      }
    });
    // Weather chip: run-seeded, static per run.
    const weatherChip = this.$("roam-weather");
    const weather = g.weather || WEATHERS[0];
    if (weatherChip && weatherChip.dataset.weather !== weather.id) {
      weatherChip.dataset.weather = weather.id;
      weatherChip.textContent = `${weather.cn} ${this.t(weather.name)}`.replace(/^(.) \1.+$/, "$1");
      if (weather.note) weatherChip.title = this.t(weather.note);
    }
    if (typeof hud.classList?.toggle === "function")
      hud.classList.toggle("swap-cue-active", cue);
    else
      hud.className = cue ? "roam-party-hud swap-cue-active" : "roam-party-hud";
  }
  draw() {
    const g = this.session.g;
    if (!g?.roam) return;
    // Soft follow: deadzone hold + lerp toward cameraFocus ideal; followers share cam.
    const cam = smoothCamera(this.cam, g.p, this.dt);
    this.cam = cam;
    this.applyCamera(cam);
    const weatherOverlay = this.$("roam-weather-overlay");
    if (weatherOverlay) {
      const id = g.weather?.id || "clear";
      weatherOverlay.hidden = id === "clear" || !expansionArtAvailable(`weather-${id}`);
      weatherOverlay.dataset.weather = id;
      weatherOverlay.style.backgroundImage = weatherOverlay.hidden ? "none" : `url("assets/weather-${id}.png")`;
    }
    const oathChip = this.$("roam-oath");
    if (oathChip) {
      const oath = oathFor([g.p.id, ...(g.party?.followers || [])]);
      oathChip.hidden = !oath || !expansionArtAvailable(`oath-${oath.id}`);
      if (!oathChip.hidden && oathChip.dataset.oath !== oath.id) {
        const icon = this.document.createElement("img");
        icon.src = `assets/oath-${oath.id}.png`; icon.alt = "";
        const label = this.document.createElement("span");
        label.textContent = this.t(oath.name);
        oathChip.replaceChildren(icon, label); oathChip.dataset.oath = oath.id;
      } else if (!oathChip.hidden) oathChip.children[1].textContent = this.t(oath.name);
    }
    // The maze replaces the painted-stone props: thicket art and spawn marks
    // would float inside hedges, so they step aside for the labyrinth.
    const inMaze = !!g.roam.maze;
    SPAWN_MARKERS.forEach((marker, index) => {
      const node = this.spawnMarkers[index];
      node.hidden = inMaze;
      this.place(node, marker.x, marker.y, cam);
    });
    BLOCKER_ART.forEach((prop, index) => {
      const node = this.blockerArt[index];
      node.hidden = inMaze;
      this.place(node, prop.x, prop.y, cam);
      node.style.width = `${prop.size / VIEWPORT.width * 100}%`;
      node.style.height = `${prop.size / VIEWPORT.height * 100}%`;
    });
    const routeCanvas = this.$("roam-route-map");
    if (routeCanvas) {
      paintRouteMap(routeCanvas.getContext("2d"), routeMapModel(g, cam), routeCanvas.width, routeCanvas.height);
      routeCanvas.setAttribute("aria-label", this.t("Route map") + ": " + this.t(`${g.roam.field.length} ${g.roam.field.length === 1 ? "RIVAL" : "RIVALS"} ON THE PASS`));
    }
    this.drawPartyHud(g);
    const sneak = this.$("roam-sneak");
    if (sneak) sneak.setAttribute("aria-pressed", String(!!g.roam.sneaking));
    for (const button of this.document.querySelectorAll("[data-roam-action]")) {
      const action = button.dataset.roamAction;
      button.disabled = this.session.mode !== "exploring" || (action === "dodge" ? g.roam.dodgeCD > 0 : action !== "sneak" && g.roam.strikeCD > 0 || action === "technique" && g.p.flow < techniqueCost(g.p, g.curios));
    }
    const heroNode = this.heroToken || this.$("roam-hero");
    heroNode.style.opacity = g.roam.sneaking ? 0.62 : 1;
    this.place(heroNode, g.p.x, g.p.y, cam);
    if (!this.heroToken) {
      this.$("roam-hero").style.setProperty("--face", g.p.dx < 0 ? "-1" : "1");
      // Lead: walk while axes drive movement (g.p.moving); else idle or still.
      this.applyActorSheet(this.$("roam-hero"), g.p.id, !!g.p.moving);
    }
    for (const follower of g.roam.followers || []) {
      const node = this.followers.get(follower.id);
      if (!node) continue;
      this.place(node, follower.x, follower.y, cam);
      node.style.setProperty("--face", g.p.dx < 0 ? "-1" : "1");
      node.style.opacity = g.roam.sneaking ? 0.5 : 0.92;
      // Followers stay still sprites unless ${id}-sheet exists in the manifest.
      this.applyActorSheet(node, follower.id, this.followerMoved(follower));
    }
    this.drawEffects(g, cam);
    for (const enemy of g.roam.field) {
      const node = this.sprites.get(enemy.id);
      if (node) {
        this.place(node, enemy.x, enemy.y, cam);
        // First blood reads on the sprite: the duel will open in your favor.
        if (node.dataset.firstBlood !== String(!!enemy.firstBlood)) {
          node.dataset.firstBlood = String(!!enemy.firstBlood);
          node.classList.toggle("first-blood", !!enemy.firstBlood);
        }
      }
    }
  }
  drawEffects(g, cam = { x: 0, y: 0 }) {
    const c = this.context; if (!c) return;
    const to = (x, y) => worldToScreen(x, y, cam);
    c.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    if (g.roam.maze) this.drawMazeWalls(c, g.roam.maze, cam);
    this.drawShrines(c, g, to);
    for (const actor of [g.p, ...(g.roam.followers || []), ...g.roam.field]) {
      const p = to(actor.x, actor.y);
      c.fillStyle = '#06141088'; c.beginPath(); c.ellipse(p.x, p.y, 32, 9, 0, 0, Math.PI*2); c.fill();
    }
    for (const e of g.roam.field) if (e.ranged) {
      const p = to(e.x, e.y);
      c.fillStyle = '#100e12'; c.fillRect(p.x-32, p.y-150, 64, 6);
      c.fillStyle = '#efbd79'; c.fillRect(p.x-32, p.y-150, 64*e.hp/e.maxHp, 6);
      if (e.aim) {
        const a = to(e.aim.x, e.aim.y);
        c.setLineDash([12,10]); c.lineWidth=3; c.strokeStyle='#ffb466aa'; c.beginPath();
        c.moveTo(p.x, p.y-40); c.lineTo(a.x, a.y-40); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(a.x, a.y, 28, 0, Math.PI*2); c.stroke();
      }
    }
    if (g.roam.pillar) {
      const {x, y, time} = g.roam.pillar;
      const p = to(x, y);
      c.save(); c.setLineDash([12, 7]); c.strokeStyle = time < .4 ? '#ff6868' : '#e6b46a';
      c.lineWidth = time < .4 ? 7 : 4; c.beginPath(); c.arc(p.x, p.y, 55, 0, Math.PI*2); c.stroke();
      c.setLineDash([]); c.fillStyle = '#2a100f66'; c.beginPath(); c.arc(p.x, p.y, 55, 0, Math.PI*2); c.fill(); c.restore();
    }
    for (const s of g.roam.shots) {
      const p = to(s.x, s.y);
      c.save(); c.translate(p.x, p.y-40); c.rotate(Math.atan2(s.vy, s.vx));
      c.strokeStyle='#fff0bb'; c.lineWidth=3; c.beginPath(); c.moveTo(-32,0);c.lineTo(10,0);c.lineTo(2,-5);c.moveTo(10,0);c.lineTo(2,5);c.stroke(); c.restore();
    }
    for (const e of g.roam.effects) {
      const p = to(e.x, e.y);
      c.save(); c.globalAlpha=Math.min(1,e.life*3); c.strokeStyle=g.p.color; c.lineWidth=e.kind==='technique'?9:4;
      if (['strike','technique'].includes(e.kind)) { c.beginPath(); c.arc(p.x, p.y-40, (.6-e.life)*220+30, -2.5, .7); c.stroke(); }
      if (e.text) { c.fillStyle=e.kind==='hurt'?'#ffafa4':'#fff2c5';c.font='bold 30px Georgia';c.textAlign='center';c.fillText(this.t(e.text), p.x, p.y-115-(.55-e.life)*70); }
      c.restore();
    }
    if (this.debugCollision) paintCollisionDebug(c, cam);
  }
  /** Hedge walls: visible tiles painted with the act's blocker texture (flat
   *  tone until it loads), a pale cap so the rows read as standing hedges. */
  drawMazeWalls(c, maze, cam) {
    const T = maze.tile;
    const i0 = Math.max(0, Math.floor((cam.x - maze.ox) / T) - 1);
    const i1 = Math.min(maze.tw - 1, Math.floor((cam.x + VIEWPORT.width - maze.ox) / T) + 1);
    const j0 = Math.max(0, Math.floor((cam.y - maze.oy) / T) - 1);
    const j1 = Math.min(maze.th - 1, Math.floor((cam.y + VIEWPORT.height - maze.oy) / T) + 1);
    const pattern = this.wallPatternFor(c);
    c.save();
    c.translate(-cam.x, -cam.y);
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        if (!maze.isWallTile(i, j)) continue;
        const x = maze.ox + i * T, y = maze.oy + j * T;
        c.fillStyle = pattern || "#2c4234";
        c.fillRect(x, y, T, T);
        c.fillStyle = "#41603f";
        c.fillRect(x, y, T, 10);
      }
    c.restore();
  }
  /** Blocker-art pattern for the current act's hedges (loaded once). */
  wallPatternFor(c) {
    const blocker = roamScene(this.session?.act?.id).blocker;
    if (this.wallPattern?.blocker === blocker) return this.wallPattern.pattern;
    if (this.wallPattern?.loading === blocker) return null;
    const entry = { blocker, loading: blocker, pattern: null };
    this.wallPattern = entry;
    const image = this.document.createElement("img");
    image.onload = () => {
      entry.pattern = c.createPattern(image, "repeat");
      delete entry.loading;
    };
    image.src = `assets/${blocker}.png`;
    return null;
  }
  /** Wayside shrines: a stone lantern whose light dies once the rest is used. */
  drawShrines(c, g, to) {
    for (const shrine of g.roam.shrines || []) {
      const p = to(shrine.x, shrine.y);
      if (p.x < -120 || p.x > VIEWPORT.width + 120 || p.y < -120 || p.y > VIEWPORT.height + 120) continue;
      c.save();
      c.globalAlpha = shrine.used ? 0.45 : 1;
      if (!shrine.used) {
        const glow = 26 + Math.sin(this.animTime * 3) * 6;
        const grad = c.createRadialGradient(p.x, p.y - 36, 4, p.x, p.y - 36, glow);
        grad.addColorStop(0, "#ffd98acc");
        grad.addColorStop(1, "#ffd98a00");
        c.fillStyle = grad;
        c.beginPath(); c.arc(p.x, p.y - 36, glow, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = "#57584f";
      c.fillRect(p.x - 14, p.y - 26, 28, 26);
      c.fillStyle = shrine.used ? "#3f4038" : "#ffd98a";
      c.fillRect(p.x - 9, p.y - 46, 18, 20);
      c.restore();
    }
  }
  /** Cached FRAME-00 sheet row for heroId, or null (legacy still). */
  sheetFor(heroId) {
    if (this.sheetByHero.has(heroId)) return this.sheetByHero.get(heroId);
    const sheet = loadSheetManifest(this.manifest, heroId);
    this.sheetByHero.set(heroId, sheet);
    return sheet;
  }
  /** Detect follower locomotion from position deltas (no domain flag). */
  followerMoved(follower) {
    const prev = this.followerPrev.get(follower.id);
    this.followerPrev.set(follower.id, { x: follower.x, y: follower.y });
    if (!prev) return false;
    return Math.hypot(follower.x - prev.x, follower.y - prev.y) > 0.5;
  }
  /**
   * Sample walk while moving; when stopped pin a single still cell (no looping idle).
   * WU-FRAME-09: standing = frozen frame; animate walk / attack film only.
   * Missing sheet record → clearSheetFrame (no crash).
   */
  applyActorSheet(node, heroId, moving) {
    if (!node) return;
    node.classList?.toggle?.("original-walk", ["zhao-yun", "hu-sanniang"].includes(heroId) && moving);
    const sheet = this.sheetFor(heroId);
    if (!sheet?.anims) {
      clearSheetFrame(node);
      return;
    }
    if (moving && sheet.anims.walk) {
      const cell = sampleAnim(sheet.anims.walk, this.animTime);
      if (cell) applySheetFrame(node, sheet, cell);
      else clearSheetFrame(node);
      return;
    }
    // Standing: frozen still — first idle cell or [0,0]; never advance idle loop.
    const first = sheet.anims.idle?.frames?.[0];
    const still = first?.length >= 2 ? { col: first[0], row: first[1] } : { col: 0, row: 0 };
    applySheetFrame(node, sheet, still);
  }
  dispose() {
    if (this.cancel && this.frame) this.cancel(this.frame);
    this.off.forEach((off) => off());
    this.blockerArt.forEach((node) => node.remove());
    this.spawnMarkers.forEach((node) => node.remove());
    this.document.defaultView?.removeEventListener("blur", this.clearKeys);
    this.document.removeEventListener("visibilitychange", this.clearKeys);
    this.document.removeEventListener("keydown", this.keydown);
    this.document.removeEventListener("keyup", this.keyup);
  }
}
