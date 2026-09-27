import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const output = resolve(fileURLToPath(new URL("../../", import.meta.url)));

test("Pages output routes its root to the RPG and keeps legacy portraits inside the output", () => {
  const redirects = readFileSync(resolve(output, "_redirects"), "utf8");
  assert.match(redirects, /^\/ \/jade-gate\/ 302\s*$/m);
  assert(existsSync(resolve(output, "jade-gate/index.html")));

  const legacy = readFileSync(resolve(output, "game.js"), "utf8");
  const portraitPaths = [...legacy.matchAll(/image:'([^']+)'/g)].map((match) => match[1]);
  assert.equal(portraitPaths.length, 4);
  for (const portrait of portraitPaths) {
    const asset = resolve(output, portrait);
    assert(asset.startsWith(`${output}/`), `${portrait} escapes Pages output`);
    assert(existsSync(asset), `${portrait} is missing from Pages output`);
  }
});
