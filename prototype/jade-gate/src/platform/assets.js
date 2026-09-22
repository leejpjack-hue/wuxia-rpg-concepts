export const REQUIRED_ART = [
  "arena",
  "zhao-yun-sprite",
  "lu-zhishen-sprite",
  "hu-sanniang-sprite",
  "lu-bu-sprite",
  "guard-sprite",
  "archer-sprite",
  "warden-sprite",
];
export class AssetStore {
  constructor(makeImage = () => new Image()) {
    this.images = {};
    this.makeImage = makeImage;
    this.pending = new Map();
  }
  load(id) {
    if (this.images[id]) return Promise.resolve(this.images[id]);
    if (this.pending.has(id)) return this.pending.get(id);
    const promise = new Promise((resolve, reject) => {
      const image = this.makeImage();
      image.onload = () => {
        this.images[id] = image;
        resolve(image);
      };
      image.onerror = () =>
        reject(new Error(`Could not load assets/${id}.png`));
      image.src = `assets/${id}.png`;
    }).finally(() => this.pending.delete(id));
    this.pending.set(id, promise);
    return promise;
  }
  async preload(ids = REQUIRED_ART) {
    await Promise.all(ids.map((id) => this.load(id)));
    return this.images;
  }
}
