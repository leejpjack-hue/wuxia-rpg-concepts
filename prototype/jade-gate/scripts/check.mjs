import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url).pathname;
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
console.log(
  `Checked all JavaScript modules and ${manifest.length} generated images.`,
);
