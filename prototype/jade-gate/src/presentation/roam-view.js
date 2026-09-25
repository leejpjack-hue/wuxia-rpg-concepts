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
    this.sprites = new Map();
    this.frame = 0;
    this.last = 0;
    const view = document.defaultView;
    this.request = view?.requestAnimationFrame?.bind(view) || null;
    this.cancel = view?.cancelAnimationFrame?.bind(view) || null;
    this.keydown = (event) => {
      if (event.repeat || event.altKey || event.metaKey || event.ctrlKey) return;
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
    this.off = [session.bus.on("state:changed", () => this.sync())];
    this.sync();
    // Bind once: requestAnimationFrame must not receive an unbound method.
    this.tick = (now) => this.loop(now);
    if (this.request) this.frame = this.request(this.tick);
  }
  axes() {
    return {
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
    this.place(this.$("roam-hero"), g.p.x, g.p.y);
    this.$("roam-hero").style.setProperty("--face", g.p.dx < 0 ? "-1" : "1");
    for (const enemy of g.roam.field) {
      const node = this.sprites.get(enemy.id);
      if (node) this.place(node, enemy.x, enemy.y);
    }
  }
  dispose() {
    if (this.cancel && this.frame) this.cancel(this.frame);
    this.off.forEach((off) => off());
    this.document.removeEventListener("keydown", this.keydown);
    this.document.removeEventListener("keyup", this.keyup);
  }
}
