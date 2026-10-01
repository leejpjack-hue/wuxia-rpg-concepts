import test from "node:test";
import assert from "node:assert/strict";
import {
  loadSheetManifest,
  loadSheet,
  sampleAnim,
  applySheetFrame,
  clearSheetFrame,
  sheetGrid,
  drawFrame,
  drawAnimFrame,
} from "../src/platform/sheet-anim.js";
import assetManifest from "../docs/asset-manifest.json" with { type: "json" };

const FRAME00 = {
  id: "zhao-yun-sheet",
  file: "assets/zhao-yun-sheet.png",
  frameW: 512,
  frameH: 512,
  anims: {
    idle: { frames: [[0, 0], [1, 0]], fps: 6, loop: true },
    walk: { frames: [[0, 1], [1, 1], [2, 1], [3, 1]], fps: 10, loop: true },
    attack: { frames: [[0, 2], [1, 2], [2, 2]], fps: 12, loop: false },
  },
};

test("loadSheetManifest returns null when sheet row is missing (legacy still)", () => {
  assert.equal(loadSheetManifest(assetManifest, "gu-dasao"), null);
  assert.equal(loadSheetManifest([], "zhao-yun"), null);
  assert.equal(loadSheetManifest(null, "zhao-yun"), null);
  assert.equal(loadSheetManifest([FRAME00], ""), null);
});

test("wired FRAME-00 sheets resolve from the live manifest", () => {
  for (const heroId of ["lu-zhishen"]) {
    const sheet = loadSheetManifest(assetManifest, heroId);
    assert.equal(sheet.id, `${heroId}-sheet`);
    assert.equal(sheet.file, `assets/${heroId}-sheet.png`);
    assert.equal(sheet.frameW, 512);
    assert.equal(sheet.frameH, 512);
    assert.equal(sheet.anims.idle.frames.length, 2);
    assert.equal(sheet.anims.walk.frames.length, 4);
    assert.equal(sheet.anims.attack.frames.length, 3);
    assert.equal(sheet.anims.attack.loop, false);
    assert.deepEqual(sheetGrid(sheet), { cols: 4, rows: 3 });
    assert.deepEqual(
      Object.keys(sheet).sort(),
      ["anims", "duelPoses", "file", "frameH", "frameW", "id", "method", "prompt"],
    );
  }
});

test("loadSheetManifest finds FRAME-00 sibling row by ${heroId}-sheet", () => {
  const sheet = loadSheetManifest([FRAME00, { id: "zhao-yun", file: "x" }], "zhao-yun");
  assert.equal(sheet.id, "zhao-yun-sheet");
  assert.equal(sheet.frameW, 512);
  assert.ok(sheet.anims.walk);
});

test("loadSheetManifest rejects incomplete sheet rows", () => {
  assert.equal(
    loadSheetManifest([{ id: "zhao-yun-sheet", file: "a.png" }], "zhao-yun"),
    null,
  );
  assert.equal(
    loadSheetManifest(
      [{ id: "zhao-yun-sheet", file: "a.png", frameW: 512, frameH: 512 }],
      "zhao-yun",
    ),
    null,
  );
});

test("sampleAnim walks the loop and clamps non-loop attack", () => {
  assert.deepEqual(sampleAnim(FRAME00.anims.walk, 0), { col: 0, row: 1 });
  assert.deepEqual(sampleAnim(FRAME00.anims.walk, 0.1), { col: 1, row: 1 }); // 10fps
  assert.deepEqual(sampleAnim(FRAME00.anims.walk, 0.35), { col: 3, row: 1 });
  assert.deepEqual(sampleAnim(FRAME00.anims.walk, 0.4), { col: 0, row: 1 }); // wrap
  assert.deepEqual(sampleAnim(FRAME00.anims.idle, 1 / 6), { col: 1, row: 0 });
  assert.deepEqual(sampleAnim(FRAME00.anims.attack, 0), { col: 0, row: 2 });
  assert.deepEqual(sampleAnim(FRAME00.anims.attack, 10), { col: 2, row: 2 }); // clamp
});

test("sampleAnim no-ops on missing anim / empty frames", () => {
  assert.equal(sampleAnim(null, 0), null);
  assert.equal(sampleAnim({}, 0), null);
  assert.equal(sampleAnim({ frames: [] }, 0), null);
});

test("sheetGrid derives cols×rows from anim frames", () => {
  assert.deepEqual(sheetGrid(FRAME00), { cols: 4, rows: 3 });
});

test("applySheetFrame paints background crop; clearSheetFrame restores still", () => {
  const style = {};
  const classes = new Set();
  const node = {
    dataset: {},
    style,
    src: "assets/zhao-yun-sprite.png",
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    getAttribute: (k) => (k === "src" ? node.src : null),
    setAttribute: (k, v) => {
      if (k === "src") node.src = v;
    },
  };
  const cell = sampleAnim(FRAME00.anims.walk, 0.1);
  assert.equal(applySheetFrame(node, FRAME00, cell), true);
  assert.ok(classes.has("sheet-anim"));
  assert.equal(node.dataset.stillSrc, "assets/zhao-yun-sprite.png");
  assert.match(node.style.backgroundImage, /zhao-yun-sheet\.png/);
  assert.equal(node.style.backgroundSize, "400% 300%");
  // col 1 of 4 → 33.333...%
  assert.ok(Math.abs(parseFloat(node.style.backgroundPosition) - 100 / 3) < 0.01);
  assert.equal(applySheetFrame(null, FRAME00, cell), false);
  assert.equal(applySheetFrame(node, null, cell), false);

  clearSheetFrame(node);
  assert.ok(!classes.has("sheet-anim"));
  assert.equal(node.style.backgroundImage, "");
  assert.equal(node.src, "assets/zhao-yun-sprite.png");
  assert.equal(node.dataset.stillSrc, undefined);
});

test("drawFrame canvas helper blits one cell (optional FRAME-02 surface)", () => {
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };
  const image = {};
  assert.equal(drawFrame(ctx, image, FRAME00, { col: 2, row: 1 }, 10, 20, 64, 64), true);
  assert.deepEqual(calls[0], [image, 1024, 512, 512, 512, 10, 20, 64, 64]);
  assert.equal(drawFrame(null, image, FRAME00, { col: 0, row: 0 }), false);
});

test("loadSheet skips missing or incomplete rows without loading", async () => {
  const store = { load: () => assert.fail("missing sheet must not load") };
  assert.equal(await loadSheet(store, [], "zhao-yun"), null);
  assert.equal(await loadSheet(store, null, "zhao-yun"), null);
  assert.equal(await loadSheet(store, [FRAME00], ""), null);
  assert.equal(await loadSheet(store, [{ id: FRAME00.id }], "zhao-yun"), null);
});

test("loadSheet loads the PNG by extensionless sibling id", async () => {
  const image = {};
  const ids = [];
  const store = { load: async (id) => { ids.push(id); return image; } };
  assert.deepEqual(await loadSheet(store, [FRAME00], "zhao-yun"), { image, sheet: FRAME00 });
  assert.deepEqual(ids, ["zhao-yun-sheet"]);
});

test("loadSheet returns null on rejected, thrown or empty image loads", async () => {
  for (const store of [
    { load: async () => { throw new Error("missing PNG"); } },
    { load: () => { throw new Error("image creation failed"); } },
    { load: async () => null },
    null,
  ]) {
    assert.equal(await loadSheet(store, [FRAME00], "zhao-yun"), null);
  }
});

test("drawAnimFrame samples walk time and wraps with a destination", () => {
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };
  const image = {};
  const dest = { x: 10, y: 20, width: 64, height: 96 };
  assert.equal(drawAnimFrame(ctx, image, FRAME00, "walk", 0.35, dest), true);
  assert.equal(drawAnimFrame(ctx, image, FRAME00, "walk", 0.4), true);
  assert.deepEqual(calls, [
    [image, 1536, 512, 512, 512, 10, 20, 64, 96],
    [image, 0, 512, 512, 512, 0, 0, 512, 512],
  ]);
});

test("drawAnimFrame samples attack objects and clamps at the final frame", () => {
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };
  const image = {};
  assert.equal(drawAnimFrame(ctx, image, FRAME00, FRAME00.anims.attack, 0.1), true);
  assert.equal(drawAnimFrame(ctx, image, FRAME00, "attack", 10), true);
  assert.deepEqual(calls, [
    [image, 512, 1024, 512, 512, 0, 0, 512, 512],
    [image, 1024, 1024, 512, 512, 0, 0, 512, 512],
  ]);
});

test("drawAnimFrame no-ops on missing animation, image or sheet", () => {
  const ctx = { drawImage: () => assert.fail("missing input must not draw") };
  assert.equal(drawAnimFrame(ctx, {}, FRAME00, "missing", 0), false);
  assert.equal(drawAnimFrame(ctx, {}, FRAME00, { frames: [] }, 0), false);
  assert.equal(drawAnimFrame(ctx, null, FRAME00, "walk", 0), false);
  assert.equal(drawAnimFrame(ctx, {}, null, "walk", 0), false);
});
