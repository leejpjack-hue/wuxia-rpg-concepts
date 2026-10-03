import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { DUEL_ENEMIES } from "../src/content/duels.js";
import { HEROES } from "../src/content/heroes.js";
import { OATHS } from "../src/content/expansion.js";
import { signatureArtFor, specialArtFor, expansionArtAvailable, SPECIAL_ART_KINDS } from "../src/content/expansion-art.js";
const manifest = JSON.parse(readFileSync(new URL("../docs/asset-manifest.json", import.meta.url)));
const status = JSON.parse(readFileSync(new URL("../docs/asset-generation-status.json", import.meta.url)));
const inventory = new Set(status.map(row => row.id));

test("every opponent including named Story rivals has a registered sprite on disk", () => {
  for (const [kind, enemy] of Object.entries(DUEL_ENEMIES)) {
    const row = manifest.find(row => row.id === enemy.art);
    assert(row, `${kind} has unregistered art ${enemy.art}`);
    assert(existsSync(new URL(`../${row.file}`, import.meta.url)), `${kind} has a missing sprite`);
  }
});

test("required expansion inventory distinguishes generated assets from user-deferred art", () => {
  assert.equal(status.length, 36);
  assert.equal(inventory.size, 36);
  for (const asset of status) {
    assert.equal(expansionArtAvailable(asset.id), asset.status === "generated", asset.id);
    assert.equal(existsSync(new URL(`../${asset.file}`, import.meta.url)), asset.status === "generated", asset.id);
    if (asset.status === "generated") {
      const row = manifest.find(row => row.id === asset.id);
      assert(row.prompt.length > 50, `${asset.id} lacks its production prompt`);
      assert(row.contract, `${asset.id} lacks its image contract`);
    }
  }
  assert.equal(expansionArtAvailable(null), false);
});

test("hero signatures, special motifs, oaths and weather map to the required filenames", () => {
  for (const hero of HEROES.filter(hero => !hero.hidden)) assert(inventory.has(signatureArtFor(hero.id)), hero.id);
  for (const kind of SPECIAL_ART_KINDS) assert(inventory.has(specialArtFor({ kind })), kind);
  for (const oath of OATHS) assert(inventory.has(`oath-${oath.id}`), oath.id);
  for (const weather of ["rain", "night", "fog"]) assert(inventory.has(`weather-${weather}`));
  assert.equal(specialArtFor({ kind: "hero-guan-yu", heroId: "guan-yu" }), "sig-charged");
  assert.equal(specialArtFor({ kind: "unknown" }), null);
});
