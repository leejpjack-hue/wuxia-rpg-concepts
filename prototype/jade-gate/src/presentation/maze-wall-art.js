import { VIEWPORT } from '../domain/ground.js';

/** One irregular prop per collision tile, anchored in world space while the camera pans. */
export function paintMazeWalls(c, maze, cam, image, filter = 'none', crop = null) {
  const T = maze.tile;
  const i0 = Math.max(0, Math.floor((cam.x - maze.ox) / T) - 1);
  const i1 = Math.min(maze.tw - 1, Math.floor((cam.x + VIEWPORT.width - maze.ox) / T) + 1);
  const j0 = Math.max(0, Math.floor((cam.y - maze.oy) / T) - 1);
  const j1 = Math.min(maze.th - 1, Math.floor((cam.y + VIEWPORT.height - maze.oy) / T) + 1);
  c.save();
  c.translate(-cam.x, -cam.y);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (!maze.isWallTile(i, j)) continue;
    const x = maze.ox + (i + .5) * T, y = maze.oy + (j + .5) * T;
    c.save();
    c.translate(x, y);
    // Keep an organic base and contact shadow; no rectangular fill or bright tile cap.
    c.fillStyle = '#08130fb3';
    c.beginPath(); c.ellipse(0, T * .05, T * .46, T * .43, 0, 0, Math.PI * 2); c.fill();
    if (image) {
      const flip = (i * 7 + j * 3) % 2 ? -1 : 1;
      const ratio = (crop ? crop[2] * image.naturalWidth / (crop[3] * image.naturalHeight) : image.naturalWidth / image.naturalHeight) || 1;
      const size = T * 1.12;
      const w = ratio >= 1 ? size : size * ratio;
      const h = ratio >= 1 ? size / ratio : size;
      c.scale(flip, 1);
      c.filter = filter;
      if (crop) {
        // Existing granite-and-pine detail matches the stone acts. Clip its opaque
        // ground plate to a rough boulder silhouette rather than a square tile.
        c.beginPath();
        for (let n = 0; n < 16; n++) {
          const angle = n / 16 * Math.PI * 2;
          const radius = size * (.44 + .035 * Math.sin(n * 5 + i + j));
          const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
          if (!n) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath(); c.clip();
        const [sx, sy, sw, sh] = crop;
        c.drawImage(image, sx * image.naturalWidth, sy * image.naturalHeight,
          sw * image.naturalWidth, sh * image.naturalHeight, -w / 2, -h / 2, w, h);
      } else c.drawImage(image, -w / 2, -h / 2, w, h);
    }
    c.restore();
  }
  c.restore();
}
