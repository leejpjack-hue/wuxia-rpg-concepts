# Character image requirements

A playable hero needs **two distinct approved PNGs** with the same face, costume, colors and weapon. An action spritesheet is also supported (required for walk/attack heroes once FRAME-01+ ships):

| Asset | Filename | Canvas | Used in |
|---|---|---|---|
| Full-body key art | `assets/<hero-id>.png` | Portrait 2:3, at least 900×1400, opaque | Roster, card duel, gallery |
| Gameplay sprite | `assets/<hero-id>-sprite.png` | Square, at least 1024×1024, RGBA with real transparency | Courtyard, strike film, gallery |
| Action sheet | `assets/<hero-id>-sheet.png` | One spritesheet PNG; cell **512×512** RGBA preferred (**256×256** allowed for light pilots); whole sheet = `cols × rows × cell` | Roam walk cycle; strike film attack frames (CSS transform of still sprite remains fallback) |

A concept sheet, turnaround or collage is **not** either asset. Save a modeling sheet separately as `assets/<hero-id>-turnaround.png` only after its front, side and back views agree. The gallery lists approved sprites and turnarounds separately.

## Art direction

- One clearly adult Chinese wuxia character per frame, with a face and silhouette recognizable at roster-card and roughly 140-pixel gameplay size. Keep the full weapon, both feet and an 8% margin inside the canvas; do not crop at the image edge.
- Use a painterly realistic style consistent with the existing heroes. Choose one primary weapon and a restrained color motif from the character's game definition. Face, proportions, outfit details and equipment must match across key art and sprite.
- Portrait: one full-body three-quarter combat pose on flat dark charcoal `#10191b`; no background scene, words, UI, callouts or inset views.
- Sprite: one grounded ready pose from a slightly elevated three-quarter view facing right; actual transparent pixels outside the character, no dark fill, ground, shadow, glow or labels. Keep feet near the bottom of the character so they anchor to the courtyard.
- Adult women can wear Chinese-inspired short layered battle skirts or cropped cross-collar martial tops. Pair them with stable footwear and combat-ready construction appropriate to their role. Use varied shapes and colors so the women do not all look alike. Avoid youthful styling, lingerie armor, impossible heels or copied adaptation likenesses.
- Inspect the result for extra hands, duplicated blades, missing feet, cropped weapons, inaccurate weapon type and alpha halos. Regenerate incorrect images rather than cropping a concept sheet into a card.

## Copy-ready prompts

**Key art:** “Full-body portrait 2:3 key art of [adult hero, identity, face, build, colors], wearing [specific layered Chinese combat outfit], wielding exactly [weapon count and type]. One grounded three-quarter combat pose, full boots and weapon visible with 8% margin. Premium painterly realistic wuxia RPG style. Flat dark charcoal background. No collage, inset views, text, scenery, extra figures, extra limbs, duplicate weapon, border or watermark.”

**Sprite:** “Using the approved key art as the only identity reference, create a square transparent RGBA game sprite of the **same** adult hero. Preserve face, hair, outfit, colors and weapon. Full body and entire equipment, elevated three-quarter view facing right, grounded ready stance, 8% margin, readable at 140 px. Actual transparent background, no ground or cast shadow, text, extra figure or border.”

Generate and approve key art first. Use it as the reference for the sprite, then visually inspect both at original size and in the running game. Keep image-generation provenance and the final prompt in `docs/asset-manifest.json`.

## Integration checklist

1. Add the hero to `src/content/heroes.js` with a unique lowercase hyphenated `id`, gameplay values, and an adult character description. Add matching `HERO_TECHNIQUES` data in `src/content/duels.js`.
2. Save **both** PNGs under the exact filenames above. Add both manifest records. Remove any `artFocus` offset that was only needed to crop a concept sheet.
3. Run `npm run check`; it verifies the manifest entry, format and basic dimensions for every hero. Inspect the alpha visually because a PNG header alone cannot prove clean transparency.
4. Run `npm test`. In the browser, choose the hero and verify portrait in the roster and duel, transparent body in the courtyard and strike film, no missing-image notice, and a complete weapon and boots at narrow and wide widths.
5. If a turnaround is actually approved, add its ID to `TURNAROUND_HEROES` in `core.js`; sprite gallery membership derives from the playable hero roster.

## Action spritesheet (WU-FRAME-00)

**Signed 2026-09-30.** Docs-only contract. Keeps existing key + idle sprite. No batch art tonight. Pilot = WU-FRAME-01 Zhao Yun.

A playable hero that supports roam walk and cinematic strike frames also needs a **third** approved PNG:

| Asset | Filename | Canvas | Used in |
|---|---|---|---|
| Action sheet | `assets/<hero-id>-sheet.png` | One spritesheet PNG; cell **512×512** RGBA preferred (**256×256** allowed for light pilots); whole sheet = `cols × rows × cell` | Roam walk cycle; strike film attack frames (CSS transform of still sprite remains fallback) |

Key art (`assets/<id>.png`) and legacy idle sprite (`assets/<id>-sprite.png`) stay required and unchanged. Do **not** crop concept sheets or turnarounds into sheet cells.

### Layout (locked)

- **Cell size:** `512×512` RGBA (preferred) or `256×256` RGBA. All cells on one sheet share one size. No padding between cells (tight grid).
- **Grid:** **3 rows × 4 columns** (12 cells). Unused cells stay fully transparent.
  - **Row 0 — idle:** frames 0–1 used (2 frames); cells 2–3 unused.
  - **Row 1 — walk:** frames 0–3 used (4 frames).
  - **Row 2 — attack:** frames 0–2 used (3 frames); cell 3 unused.
- **Facing:** every frame faces **right** (same as idle sprite).
- **Feet:** character feet sit near the **bottom** of each cell (same vertical anchor across all frames so the figure does not hop). Leave ~8% margin at top/sides; no ground plane, cast shadow, glow, text, UI, or extra figures.
- **Identity:** same face, costume, colors, and primary weapon as the approved key + idle sprite. Painterly realistic wuxia; one primary weapon only.

### Minimum animations v1

| Anim | Frames | Loop | fps (guidance) | Consumer |
|---|---|---|---|---|
| `idle` | 2 | yes | ~6 | Roam standing; optional micro-breath |
| `walk` | 4 | yes | ~10 | Roam movement |
| `attack` | 3 | no (play once) | ~12 | Strike film before CSS fallback |

### Manifest

`docs/asset-manifest.json` is a flat array. The action sheet is a **sibling** record, not nested under the key-art entry. `anims` live on the sheet row. Frame indices are `[col, row]` zero-based:

```json
{
  "id": "<hero-id>-sheet",
  "file": "assets/<hero-id>-sheet.png",
  "frameW": 512,
  "frameH": 512,
  "anims": {
    "idle":   { "frames": [[0,0], [1,0]], "fps": 6, "loop": true },
    "walk":   { "frames": [[0,1], [1,1], [2,1], [3,1]], "fps": 10, "loop": true },
    "attack": { "frames": [[0,2], [1,2], [2,2]], "fps": 12, "loop": false }
  },
  "method": "…",
  "prompt": "…"
}
```

If the sheet uses 256² cells, set `frameW`/`frameH` to `256`. Roam **must** read `anims.walk` on that sibling record when it is present; cinematic strike **must** prefer `anims.attack` frames, then fall back to transforming the idle sprite. Missing sheet record = legacy still behavior (no crash).

### Copy-ready sheet prompt (guidance)

“Using the approved key art and idle sprite as the only identity references, create a single spritesheet PNG: 3 rows × 4 columns of [512 or 256]px square RGBA cells. Row0 idle×2, row1 walk×4, row2 attack×3; unused cells empty transparent. Same adult hero, face right, feet near cell bottom, full weapon visible, no ground/shadow/text/UI. Painterly realistic Chinese wuxia. Transparent outside the character.”

### Integration checklist (add)

6. Save `assets/<hero-id>-sheet.png` on the locked grid; add a sibling manifest record (`id` `<hero-id>-sheet`) with `anims` on that row.
7. Run `npm run check` once sheet rules exist; until then, Art Dir QA via visual Read of every cell + Jack/PO spot-check.
8. In browser: roam shows walk cycle while moving; strike film plays attack frames once; idle sprite still works if sheet omitted.

### Out of scope (this contract)

- No 3D / skeletal rigs / Godot import (deferred).
- No extra anims (run, hit, death, face-left) until a later WU-FRAME story.
- No batch art production under WU-FRAME-00 — pilot is **WU-FRAME-01 Zhao Yun** only.


## Card-only cinematic poses

Card duels additionally support `<hero-id>-duel-poses.png`, an approved 2×2 RGBA atlas with wind-up, strike, focus and special cells. This is separate from the 4×3 walking sheet. The exact contract, failed generation list and saved prompts are in [DUEL-ACTION-ASSETS.md](DUEL-ACTION-ASSETS.md). Keep the original walking art and costume-specific boss identity intact. Only reviewed images receive `runtimeApproved: true`.

### Reviewed irregular atlases and walk-only artwork

Card artwork whose figures do not fit equal cells can supply `atlasSize: [actualWidth,actualHeight]` and four `poseRects` values `[x,y,width,height]`. Bounds must isolate complete figures without including a neighboring figure. Overlapping figures cannot be rescued with a larger crop; exclude them and record the fallback in `reviewNote`. The renderer keeps source proportions.

A separate reviewed `<hero-id>-walk` record may contain only `anims.walk` with four coordinates in reading order `[[0,0],[1,0],[0,1],[1,1]]`. Supply either a cell-safe 2×2 atlas or a `frameFiles` array of four separate full-frame PNG paths. Separate PNGs display whole, without cropping; all four must have matching square RGBA canvas dimensions, character scale, feet baseline, facing, costume, and weapon grip. Register each PNG as a reviewed `role:"walk-frame"` asset so it preloads. Roaming prefers this record over the legacy `<hero-id>-sheet`, requires `runtimeApproved:true`, and restores the existing standing sprite when movement stops. See [ART-CORRECTIONS.md](ART-CORRECTIONS.md) for Zhao Yun's supplied sequence and provenance.

### Separate cinematic PNGs (4 October 2026)

Saving a pose PNG alone does not select it in combat. For each approved `assets/<id>-duel-windup.png`, `-duel-strike.png`, `-duel-focus.png` and `-duel-special.png`:

1. Register a sibling manifest asset with its exact file path, `role: "duel-pose"`, `runtimeApproved: true`, source/provenance and a square-alpha contract (at least 1024px). Review complete limbs, consistent identity and actual transparency first. The role includes the approved image in game preloading; ready sprites use `role: "sprite"`.
2. Add the file to the existing `<id>-duel-poses` row's `poseFiles` object under `windup`, `strike`, `focus` or `special`. Partial sets are supported; other beats retain atlas crops. Native files display whole, so never apply the old `poseRects` to them.
3. Set the hero's `cinematicArt` to the reviewed `assets/<id>-sprite.png` for transparent opening, guard and reduced-motion shots. Gallery/selection key art has its own path.
4. Run `npm test` and `npm run check`. The check rejects unregistered pose filenames or approved images that combat does not select. Reload the local page to reload JSON/modules, then inspect both hero and rival normal/special beats in `capscreens-duel-action-poses/preview.html`.

The 23-character batch imported in PR #106 now uses all 92 individual poses. Walking requires its own frame sequence; these four attack poses are card-cinematic artwork.
