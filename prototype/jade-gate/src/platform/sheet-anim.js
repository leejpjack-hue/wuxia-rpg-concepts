/**
 * WU-FRAME-02 stub (owned by Codex on #19) — minimal SheetAnim helper so
 * WU-FRAME-03 (#20) can ship self-contained. Codex: absorb / replace this
 * module when landing the real loader; keep the exported names stable or
 * update roam-view.js in the same change.
 *
 * Contract: sibling manifest row id `${heroId}-sheet` with frameW/frameH/anims
 * (see docs/character-image-requirements.md Action spritesheet). Missing
 * record → null / no-op (legacy still <img>).
 */

/** Infer sheet grid from the highest [col,row] used in anims (FRAME-00 = 4×3). */
export function sheetGrid(sheet) {
  let cols = 1;
  let rows = 1;
  for (const anim of Object.values(sheet?.anims || {})) {
    for (const frame of anim?.frames || []) {
      const col = frame?.[0] ?? 0;
      const row = frame?.[1] ?? 0;
      cols = Math.max(cols, col + 1);
      rows = Math.max(rows, row + 1);
    }
  }
  return { cols, rows };
}

/** Lookup `${heroId}-sheet` in a flat asset-manifest array. */
export function loadSheetManifest(manifestRows, heroId) {
  if (!heroId || !Array.isArray(manifestRows)) return null;
  const id = `${heroId}-sheet`;
  const row = manifestRows.find((entry) => entry?.id === id);
  if (!row?.file || !(row.frameW > 0) || !(row.frameH > 0) || !row.anims) return null;
  return row;
}

/**
 * Sample a FRAME-00 anim at tSeconds → { col, row }.
 * loop:true (default) wraps; loop:false clamps to the last frame.
 */
export function sampleAnim(anim, tSeconds = 0) {
  const frames = anim?.frames;
  if (!frames?.length) return null;
  const fps = anim.fps > 0 ? anim.fps : 1;
  const n = frames.length;
  let index = Math.floor(Math.max(0, tSeconds) * fps);
  if (anim.loop === false) index = Math.min(index, n - 1);
  else index = ((index % n) + n) % n;
  const cell = frames[index];
  if (!cell || cell.length < 2) return null;
  return { col: cell[0], row: cell[1] };
}

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function setSrc(node, src) {
  if (!node || src == null) return;
  if (typeof node.setAttribute === "function") node.setAttribute("src", src);
  if ("src" in node) node.src = src;
}

function getSrc(node) {
  if (!node) return "";
  if (typeof node.getAttribute === "function") {
    const attr = node.getAttribute("src");
    if (attr != null) return attr;
  }
  return node.src || "";
}

/**
 * Crop one sheet cell onto a DOM node via CSS background.
 * Choice (FRAME-03): keep the <img> element; swap src to a transparent 1×1
 * pixel and paint the sheet with background-image / background-size /
 * background-position so #roam-hero height (27%) and facing scaleX stay intact.
 * Still path restores dataset.stillSrc (or clearSheetFrame).
 */
export function applySheetFrame(node, sheet, cell) {
  if (!node || !sheet?.file || !cell) return false;
  const { cols, rows } = sheetGrid(sheet);
  const { col, row } = cell;
  node.classList?.add?.("sheet-anim");
  const current = getSrc(node);
  if (current && !current.startsWith("data:") && node.dataset) {
    if (!node.dataset.stillSrc) node.dataset.stillSrc = current;
  }
  if (getSrc(node) !== TRANSPARENT_PIXEL) setSrc(node, TRANSPARENT_PIXEL);
  const x = cols <= 1 ? 0 : (col / (cols - 1)) * 100;
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
  node.style.backgroundImage = `url("${sheet.file}")`;
  node.style.backgroundRepeat = "no-repeat";
  node.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
  node.style.backgroundPosition = `${x}% ${y}%`;
  return true;
}

/** Restore legacy still <img> (clear sheet background + class). */
export function clearSheetFrame(node) {
  if (!node) return false;
  node.classList?.remove?.("sheet-anim");
  if (node.style) {
    node.style.backgroundImage = "";
    node.style.backgroundRepeat = "";
    node.style.backgroundSize = "";
    node.style.backgroundPosition = "";
  }
  const still = node.dataset?.stillSrc;
  if (still) {
    setSrc(node, still);
    delete node.dataset.stillSrc;
  }
  return true;
}

/**
 * Optional canvas blit (FRAME-02 surface). Roam uses the CSS path; strike film
 * may prefer this later.
 */
export function drawFrame(ctx, image, sheet, cell, dx = 0, dy = 0, dw, dh) {
  if (!ctx || !image || !sheet || !cell) return false;
  const fw = sheet.frameW;
  const fh = sheet.frameH;
  if (!(fw > 0) || !(fh > 0)) return false;
  ctx.drawImage(
    image,
    cell.col * fw,
    cell.row * fh,
    fw,
    fh,
    dx,
    dy,
    dw ?? fw,
    dh ?? fh,
  );
  return true;
}
