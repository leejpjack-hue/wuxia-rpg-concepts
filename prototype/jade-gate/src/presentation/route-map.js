import { BLOCKERS, GROUND, WORLD, VIEWPORT } from "../domain/ground.js";

/** Snapshot only: the map cannot move actors or change combat/progression. */
export function routeMapModel(g, cam = { x: 0, y: 0 }) {
  const point = p => ({ x: p.x / WORLD.width, y: p.y / WORLD.height });
  const rect = r => ({ ...point(r), w: r.w / WORLD.width, h: r.h / WORLD.height });
  return {
    ground: rect({ x: GROUND.frontLeft, y: GROUND.top, w: GROUND.frontRight - GROUND.frontLeft, h: GROUND.bottom - GROUND.top }),
    // The hedge maze supplies its own walls; classic passes keep the stone blockers.
    walls: (g.roam.maze?.rects || BLOCKERS).map(rect),
    shrines: (g.roam.shrines || []).map(shrine => ({ ...point(shrine), used: !!shrine.used })),
    player: point(g.p),
    followers: (g.roam.followers || []).map(point),
    rivals: g.roam.field.map(enemy => ({ ...point(enemy), boss: !!enemy.boss })),
    camera: rect({ ...cam, w: VIEWPORT.width, h: VIEWPORT.height }),
  };
}

export function paintRouteMap(context, model, width, height) {
  if (!context) return;
  const pad = 10, w = width - pad * 2, h = height - pad * 2;
  const x = value => pad + value * w, y = value => pad + value * h;
  const box = r => [x(r.x), y(r.y), r.w * w, r.h * h];
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#071410"; context.fillRect(0, 0, width, height);
  context.fillStyle = "#243a32"; context.fillRect(...box(model.ground));
  context.fillStyle = "#819682";
  for (const wall of model.walls) context.fillRect(...box(wall));
  // Wayside shrines: amber when their incense still burns, ash-grey once used.
  for (const shrine of model.shrines) {
    context.fillStyle = shrine.used ? "#6b6f66" : "#ffca6e";
    context.beginPath();
    context.moveTo(x(shrine.x), y(shrine.y) - 4);
    context.lineTo(x(shrine.x) + 4, y(shrine.y));
    context.lineTo(x(shrine.x), y(shrine.y) + 4);
    context.lineTo(x(shrine.x) - 4, y(shrine.y));
    context.closePath(); context.fill();
  }
  context.strokeStyle = "#d8c28a"; context.lineWidth = 1;
  context.strokeRect(...box(model.camera));
  context.fillStyle = "#ed8f75";
  for (const rival of model.rivals) {
    const radius = rival.boss ? 5 : 3;
    context.beginPath(); context.moveTo(x(rival.x), y(rival.y) - radius);
    context.lineTo(x(rival.x) + radius, y(rival.y) + radius);
    context.lineTo(x(rival.x) - radius, y(rival.y) + radius);
    context.closePath(); context.fill();
  }
  context.fillStyle = "#79c5dc";
  for (const follower of model.followers) context.fillRect(x(follower.x) - 2, y(follower.y) - 2, 4, 4);
  context.fillStyle = "#fff3cf";
  context.beginPath(); context.arc(x(model.player.x), y(model.player.y), 4, 0, Math.PI * 2); context.fill();
}
