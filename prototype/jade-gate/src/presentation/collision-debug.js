import { BLOCKERS, WORLD, VIEWPORT, worldToScreen } from "../domain/ground.js";
import { isDebugFlag } from "../platform/debug-flag.js";

/** True when collision debug overlay should paint (query flag only). */
export function isCollisionDebugOn(search) {
  return isDebugFlag(search);
}

/**
 * Stroke WORLD bounds, CAM-02 blocker AABBs, and the camera/viewport rect
 * in screen space. Does not invent collision — reads the same BLOCKERS.
 */
export function paintCollisionDebug(ctx, cam, opts = {}) {
  if (!ctx || !cam) return;
  const world = opts.world ?? WORLD;
  const viewport = opts.viewport ?? VIEWPORT;
  const blockers = opts.blockers ?? BLOCKERS;

  const strokeWorldRect = (wx, wy, w, h, color) => {
    const tl = worldToScreen(wx, wy, cam);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(tl.x, tl.y, w, h);
    ctx.restore();
  };

  strokeWorldRect(0, 0, world.width, world.height, "#44aaff");
  for (const b of blockers) strokeWorldRect(b.x, b.y, b.w, b.h, "#ff6644");

  // Camera view in world is [cam, cam+viewport]; on this canvas that is the frame.
  ctx.save();
  ctx.strokeStyle = "#ffee44";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(1, 1, viewport.width - 2, viewport.height - 2);
  ctx.restore();
}
