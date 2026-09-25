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
    this.document = document;
    this.$ = (id) => document.getElementById(id);
    this.onGesture = onGesture;
    this.keys = new Set();
    this.actions = [];
    this.context = this.$("roam-effects")?.getContext("2d");
    this.sprites = new Map();
    this.frame = 0;
    this.last = 0;
    const view = document.defaultView;
    this.request = view?.requestAnimationFrame?.bind(view) || null;
    this.cancel = view?.cancelAnimationFrame?.bind(view) || null;
    this.keydown = (event) => {
      if (event.repeat || event.altKey || event.metaKey || event.ctrlKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      const action = {KeyJ:"strike", Digit1:"strike", Space:"dodge", KeyK:"dodge", KeyE:"technique", Digit3:"technique"}[event.code];
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
    this.off = [session.bus.on("state:changed", () => { this.clearKeys(); this.sync(); }),
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
    if (this.session.mode === "exploring" && !this.document.hidden)
      this.session.step(dt, this.axes());
    this.draw();
  }
  place(node, x, y) {
    node.style.zIndex = Math.round(y);
    node.style.left = `${(x / 1280) * 100}%`;
    node.style.top = `${(y / 720) * 100}%`;
  }
  sync() {
    const { session } = this;
    const active = session.mode === "exploring";
    this.$("roam").hidden = !active;
    if (!active || !session.g?.roam) return;
    const g = session.g;
    this.$("roam-chapter").textContent = `ACT ${session.act.number} · ${session.act.name.toUpperCase()}`;
    this.$("roam-objective").textContent = session.encounter.title;
    this.$("roam-score").textContent = g.score;
    const left = g.roam.field.length;
    this.$("roam-remaining").textContent = `${left} ${left === 1 ? "RIVAL" : "RIVALS"} ON THE PASS`;
    const hero = this.$("roam-hero"),
      src = `assets/${g.p.id}-sprite.png`;
    hero.hidden = false;
    if (hero.getAttribute("src") !== src) hero.src = src;
    hero.alt = g.p.name;
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
        node.alt = enemy.name;
        node.draggable = false;
        node.onerror = () => {
          node.hidden = true;
        };
        node.src = `assets/${enemy.art}.png`;
        this.$("roam-arena").appendChild(node);
        this.sprites.set(enemy.id, node);
      }
      node.hidden = false;
    }
    this.draw();
    this.$("roam").focus({ preventScroll: true });
  }
  draw() {
    const g = this.session.g;
    if (!g?.roam) return;
    const health = `${Math.ceil(g.p.hp)} / ${g.p.maxHp} HEALTH · ${Math.floor(g.p.flow)} FLOW`;
    if (this.$("roam-health").textContent !== health) this.$("roam-health").textContent = health;
    for (const button of this.document.querySelectorAll("[data-roam-action]")) {
      const action = button.dataset.roamAction;
      button.disabled = this.session.mode !== "exploring" || (action === "dodge" ? g.roam.dodgeCD > 0 : g.roam.strikeCD > 0 || action === "technique" && g.p.flow < g.p.cost);
    }
    this.place(this.$("roam-hero"), g.p.x, g.p.y);
    this.$("roam-hero").style.setProperty("--face", g.p.dx < 0 ? "-1" : "1");
    this.drawEffects(g);
    for (const enemy of g.roam.field) {
      const node = this.sprites.get(enemy.id);
      if (node) this.place(node, enemy.x, enemy.y);
    }
  }
  drawEffects(g) {
    const c = this.context; if (!c) return;
    c.clearRect(0,0,1280,720);
    for (const actor of [g.p, ...g.roam.field]) {
      c.fillStyle = '#06141088'; c.beginPath(); c.ellipse(actor.x,actor.y,32,9,0,0,Math.PI*2); c.fill();
    }
    for (const e of g.roam.field) if (e.ranged) {
      c.fillStyle = '#100e12'; c.fillRect(e.x-32,e.y-150,64,6);
      c.fillStyle = '#efbd79'; c.fillRect(e.x-32,e.y-150,64*e.hp/e.maxHp,6);
      if (e.aim) {
        c.setLineDash([12,10]); c.lineWidth=3; c.strokeStyle='#ffb466aa'; c.beginPath();
        c.moveTo(e.x,e.y-40); c.lineTo(e.aim.x,e.aim.y-40); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(e.aim.x,e.aim.y,28,0,Math.PI*2); c.stroke();
      }
    }
    for (const s of g.roam.shots) {
      c.save(); c.translate(s.x,s.y-40); c.rotate(Math.atan2(s.vy,s.vx));
      c.strokeStyle='#fff0bb'; c.lineWidth=3; c.beginPath(); c.moveTo(-32,0);c.lineTo(10,0);c.lineTo(2,-5);c.moveTo(10,0);c.lineTo(2,5);c.stroke(); c.restore();
    }
    for (const e of g.roam.effects) {
      c.save(); c.globalAlpha=Math.min(1,e.life*3); c.strokeStyle=g.p.color; c.lineWidth=e.kind==='technique'?9:4;
      if (['strike','technique'].includes(e.kind)) { c.beginPath(); c.arc(e.x,e.y-40,(.6-e.life)*220+30,-2.5,.7); c.stroke(); }
      if (e.text) { c.fillStyle=e.kind==='hurt'?'#ffafa4':'#fff2c5';c.font='bold 30px Georgia';c.textAlign='center';c.fillText(e.text,e.x,e.y-115-(.55-e.life)*70); }
      c.restore();
    }
  }
  dispose() {
    if (this.cancel && this.frame) this.cancel(this.frame);
    this.off.forEach((off) => off());
    this.document.defaultView?.removeEventListener("blur", this.clearKeys);
    this.document.removeEventListener("visibilitychange", this.clearKeys);
    this.document.removeEventListener("keydown", this.keydown);
    this.document.removeEventListener("keyup", this.keyup);
  }
}
