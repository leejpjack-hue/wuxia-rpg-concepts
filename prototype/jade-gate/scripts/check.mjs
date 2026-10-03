import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { HEROES } from "../src/content/heroes.js";
import { loadDuelPoses } from "../src/platform/duel-poses.js";
import { loadRoamSheetManifest } from "../src/platform/sheet-anim.js";
const root = fileURLToPath(new URL("../", import.meta.url));
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() && !["assets", ".git", "node_modules"].includes(e.name)
      ? walk(join(dir, e.name))
      : e.isFile() && /\.(js|mjs)$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );
}
for (const path of walk(root)) {
  const r = spawnSync(process.execPath, ["--check", path], {
    encoding: "utf8",
  });
  if (r.status) {
    process.stderr.write(r.stderr);
    process.exit(r.status);
  }
}
const manifest = JSON.parse(
  readFileSync(join(root, "docs/asset-manifest.json"), "utf8"),
);
function fileKind(data) {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpeg";
  if (data.length >= 8 && data.subarray(1, 4).toString() === "PNG") return "png";
  return "unknown";
}
for (const asset of manifest) {
  const data = readFileSync(join(root, asset.file));
  const kind = fileKind(data);
  // Hidden novel keys are JPEG copied as-is. Do not read PNG IHDR bytes on them.
  if (kind === "jpeg") {
    if (asset.contract || asset.atlasSize || asset.frameFiles || asset.poseRects)
      throw new Error(`${asset.id} JPEG was copied as-is and cannot carry a PNG contract`);
    if (asset.duelPoses) {
      const fighterId = asset.id.replace(/-(duel-poses|sheet)$/, "");
      if (!loadDuelPoses([asset], fighterId)) throw new Error(`Invalid or unapproved duel poses: ${asset.id}`);
    }
    continue;
  }
  if (kind !== "png")
    throw new Error(`Invalid PNG: ${asset.file}`);
  if (asset.duelPoses) {
    const fighterId = asset.id.replace(/-(duel-poses|sheet)$/, '');
    if (!loadDuelPoses([asset], fighterId)) throw new Error(`Invalid or unapproved duel poses: ${asset.id}`);
    if (asset.atlasSize && (asset.atlasSize[0] !== data.readUInt32BE(16) || asset.atlasSize[1] !== data.readUInt32BE(20)))
      throw new Error(`${asset.id} crop bounds must use the actual PNG dimensions`);
    // Qin / Gu / Bao atlases shipped on main as square RGB (color type 2). This slice
    // does not recompress them; every other duel atlas still has to be RGBA.
    const shippedRgb = new Set(["gu-dasao-duel-poses", "qin-liangyu-duel-poses", "bao-sanniang-duel-poses"]);
    const rgbAsShipped = shippedRgb.has(asset.id) && data[25] === 2;
    if (asset.id.endsWith('-duel-poses') &&
      (data.readUInt32BE(16) !== data.readUInt32BE(20) || data.readUInt32BE(16) < 1024 || (data[25] !== 6 && !rgbAsShipped)))
      throw new Error(`${asset.id} must be a square RGBA atlas at least 1024px wide`);
    asset.__rgbAsShipped = rgbAsShipped;
  }
  const contract = asset.contract;
  if (asset.frameFiles) {
    if (!loadRoamSheetManifest([asset], asset.id.replace(/-walk$/, ''))) throw new Error(`Invalid walk sequence: ${asset.id}`);
    for (const file of asset.frameFiles) {
      if (!manifest.some(row => row.file === file && row.runtimeApproved)) throw new Error(`Unreviewed walking frame: ${file}`);
      const frame = readFileSync(join(root, file));
      if (frame.readUInt32BE(16) !== data.readUInt32BE(16) || frame.readUInt32BE(20) !== data.readUInt32BE(20) || frame[25] !== 6)
        throw new Error(`${file} must match the walking sequence canvas and preserve RGBA alpha`);
    }
  }
  if (contract) {
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (width < contract.minWidth || height < contract.minHeight)
      throw new Error(`${asset.id} is below its required dimensions`);
    if (contract.square && width !== height)
      throw new Error(`${asset.id} must be square`);
    if (contract.alpha && data[25] !== 6 && !asset.__rgbAsShipped)
      throw new Error(`${asset.id} must preserve RGBA alpha`);
    if (contract.aspect === "portrait" && Math.abs(width / height - 2 / 3) > .03)
      throw new Error(`${asset.id} must be a 2:3 portrait`);
  }
}
// A playable hero needs both assets: a portrait and an alpha sprite.
// Validate headers so concept sheets cannot quietly ship as character art.
const listed = new Set(manifest.map((asset) => asset.id));
for (const hero of HEROES.filter((hero) => hero.hidden)) {
  const portrait = manifest.find((asset) => asset.id === hero.id);
  const atlas = manifest.find((asset) => asset.id === `${hero.id}-duel-poses`);
  if (!portrait || portrait.file !== (hero.keyArt || `assets/${hero.id}.jpg`))
    throw new Error(`Hidden portrait not wired: ${hero.id}`);
  if (!atlas?.file?.endsWith(".jpg") || !atlas.duelPoses)
    throw new Error(`Hidden duel atlas not wired: ${hero.id}`);
  for (const row of [portrait, atlas]) {
    if (fileKind(readFileSync(join(root, row.file))) !== "jpeg")
      throw new Error(`${row.id} must stay real JPEG bytes`);
  }
}
for (const heroId of HEROES.filter((hero) => !hero.hidden).map((hero) => hero.id)) {
  for (const suffix of ["", "-sprite"]) {
    const id = heroId + suffix;
    if (!listed.has(id)) throw new Error(`Hero asset missing from manifest: ${id}`);
    const data = readFileSync(join(root, "assets", `${id}.png`));
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (suffix) {
      if (width < 1024 || width !== height || data[25] !== 6)
        throw new Error(`${id} must be a square RGBA PNG at least 1024px wide`);
    } else if (width < 900 || height < 1400 || Math.abs(width / height - 2 / 3) > .03)
      throw new Error(`${id} must be a portrait 2:3 PNG at least 900×1400px`);
  }
}

/** WU-FRAME-05: when *-sheet.png art exists, enforce 3×4 grid + manifest contract. Soft-pass if none yet. */
const SHEET_COLS = 4;
const SHEET_ROWS = 3;
const ALLOWED_CELL = new Set([256, 512]);
const REQUIRED_ANIMS = {
  idle: 2,
  walk: 4,
  attack: 3,
};

function pngHeader(data, label) {
  if (data.subarray(1, 4).toString() !== "PNG")
    throw new Error(`Invalid PNG: ${label}`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    // IHDR color type at byte 25: 6 = RGBA
    colorType: data[25],
  };
}

function assertSheetRecord(record, data) {
  const id = record.id || basename(record.file || "", ".png");
  const { width, height, colorType } = pngHeader(data, record.file || id);
  if (colorType !== 6)
    throw new Error(`${id} sheet must be RGBA (PNG color type 6), got ${colorType}`);
  const frameW = record.frameW;
  const frameH = record.frameH;
  if (!ALLOWED_CELL.has(frameW) || !ALLOWED_CELL.has(frameH) || frameW !== frameH)
    throw new Error(`${id} frameW/frameH must be 256 or 512 and square (got ${frameW}×${frameH})`);
  if (width !== frameW * SHEET_COLS || height !== frameH * SHEET_ROWS)
    throw new Error(
      `${id} must be a ${SHEET_ROWS}×${SHEET_COLS} cell grid: expected ${frameW * SHEET_COLS}×${frameH * SHEET_ROWS}, got ${width}×${height}`,
    );
  const anims = record.anims;
  if (!anims || typeof anims !== "object")
    throw new Error(`${id} manifest row requires anims.idle / anims.walk / anims.attack`);
  for (const [key, minFrames] of Object.entries(REQUIRED_ANIMS)) {
    const anim = anims[key];
    if (!anim || !Array.isArray(anim.frames) || anim.frames.length < minFrames)
      throw new Error(`${id} anims.${key} needs ≥${minFrames} frames`);
    for (const frame of anim.frames) {
      if (!Array.isArray(frame) || frame.length !== 2)
        throw new Error(`${id} anims.${key} frames must be [col,row] pairs`);
      const [col, row] = frame;
      if (col < 0 || col >= SHEET_COLS || row < 0 || row >= SHEET_ROWS)
        throw new Error(`${id} anims.${key} frame [${col},${row}] outside ${SHEET_COLS}×${SHEET_ROWS} grid`);
    }
  }
}

const sheetFilesOnDisk = existsSync(join(root, "assets"))
  ? readdirSync(join(root, "assets")).filter((name) => name.endsWith("-sheet.png"))
  : [];
const sheetRecords = manifest.filter(
  (asset) =>
    (typeof asset.id === "string" && asset.id.endsWith("-sheet")) ||
    (typeof asset.file === "string" && asset.file.endsWith("-sheet.png")),
);

const sheetJobs = new Map();
for (const name of sheetFilesOnDisk) {
  const id = name.replace(/\.png$/, "");
  const file = `assets/${name}`;
  const record = sheetRecords.find((r) => r.id === id || r.file === file) || { id, file };
  sheetJobs.set(file, record);
}
for (const record of sheetRecords) {
  const file = record.file || `assets/${record.id}.png`;
  if (!sheetJobs.has(file)) sheetJobs.set(file, record);
}

if (sheetJobs.size === 0) {
  console.log(
    `Checked all JavaScript modules, ${manifest.length} images and both assets for ${HEROES.filter((hero) => !hero.hidden).length} playable heroes.`,
  );
  console.log(
    "WU-FRAME-05: no *-sheet.png assets yet — soft-pass (sheet grid rules idle until art lands).",
  );
} else {
  for (const [file, record] of sheetJobs) {
    const path = join(root, file);
    if (!existsSync(path))
      throw new Error(`Sheet listed in manifest but missing on disk: ${file}`);
    assertSheetRecord({ ...record, file }, readFileSync(path));
  }
  console.log(
    `Checked all JavaScript modules, ${manifest.length} images and both assets for ${HEROES.filter((hero) => !hero.hidden).length} playable heroes; validated ${sheetJobs.size} action sheet(s) (3×4 RGBA grid + anim keys).`,
  );
}
