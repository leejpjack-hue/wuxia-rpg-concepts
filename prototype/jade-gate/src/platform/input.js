const MOVEMENT = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyJ",
];
const ACTIONS = {
  KeyK: "dodge",
  Space: "dodge",
  KeyL: "technique",
  KeyE: "technique",
};
export class InputController {
  constructor({
    window,
    document,
    canvas,
    onPause,
    onGesture,
    onAim,
    isPlaying,
  }) {
    this.keys = new Set();
    this.actions = [];
    this.off = [];
    const listen = (node, event, fn, options) => {
      node.addEventListener(event, fn, options);
      this.off.push(() => node.removeEventListener(event, fn, options));
    };
    listen(window, "keydown", (event) => {
      onGesture();
      if (event.code === "Escape") {
        if (!event.repeat) onPause();
        return;
      }
      if (!isPlaying()) return;
      // Leave native button/range keyboard activation to the browser.
      if (["BUTTON", "INPUT", "SELECT"].includes(event.target.tagName)) return;
      if (MOVEMENT.includes(event.code) || ACTIONS[event.code])
        event.preventDefault();
      if (MOVEMENT.includes(event.code)) this.keys.add(event.code);
      if (!event.repeat && ACTIONS[event.code])
        this.actions.push(ACTIONS[event.code]);
    });
    listen(window, "keyup", (event) => this.keys.delete(event.code));
    listen(window, "blur", () => {
      this.clear();
      if (isPlaying()) onPause();
    });
    listen(canvas, "pointerdown", (event) => {
      onGesture();
      if (!isPlaying()) return;
      const r = canvas.getBoundingClientRect();
      onAim(
        ((event.clientX - r.left) / r.width) * 1280,
        ((event.clientY - r.top) / r.height) * 720,
      );
      this.actions.push("strike");
      canvas.focus();
    });
    for (const [id, action] of [
      ["attack", "strike"],
      ["dodge", "dodge"],
      ["special", "technique"],
    ]) {
      const button = document.getElementById(id);
      listen(button, "click", (event) => {
        if (event.detail === 0 && isPlaying()) {
          onGesture();
          this.actions.push(action);
          canvas.focus();
        }
      });
      listen(button, "pointerdown", (event) => {
        event.preventDefault();
        onGesture();
        if (!isPlaying()) return;
        this.actions.push(action);
        if (action === "strike") this.keys.add("KeyJ");
        button.setPointerCapture(event.pointerId);
      });
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
        listen(button, event, () => {
          if (action === "strike") this.keys.delete("KeyJ");
        });
    }
    for (const button of document.querySelectorAll("[data-move]")) {
      listen(button, "pointerdown", (event) => {
        event.preventDefault();
        onGesture();
        if (!isPlaying()) return;
        this.keys.add(button.dataset.move);
        button.setPointerCapture(event.pointerId);
      });
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
        listen(button, event, () => this.keys.delete(button.dataset.move));
    }
  }
  read() {
    return { keys: new Set(this.keys), actions: this.actions.splice(0) };
  }
  clear() {
    this.keys.clear();
    this.actions = [];
  }
  dispose() {
    this.clear();
    this.off.forEach((off) => off());
  }
}
