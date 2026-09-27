import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { HERO_IDS } from "../src/content/heroes.js";
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
for (const asset of manifest) {
  const data = readFileSync(join(root, asset.file));
  if (data.subarray(1, 4).toString() !== "PNG")
    throw new Error(`Invalid PNG: ${asset.file}`);
}
// A playable hero needs both assets: a portrait and an alpha sprite.
// Validate headers so concept sheets cannot quietly ship as character art.
const listed = new Set(manifest.map((asset) => asset.id));
for (const heroId of HERO_IDS) {
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
console.log(
  `Checked all JavaScript modules, ${manifest.length} images and both assets for ${HERO_IDS.length} heroes.`,
);
