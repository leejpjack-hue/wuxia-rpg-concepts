# Asset Requirements — Expansion Batch (for the art designer)

Date: 2026-10-01 · Game: Blades of the Four (`prototype/jade-gate`)
Context: the features below shipped with temporary/derived art or CSS-glyph stand-ins.

Implementation notes for this generation pass:
- **Current delivery: 36 of 36 generated.** See `ASSET-GENERATION-STATUS.md` for inventory. Optional turnaround/judgement/codex-paper/wander remain outside this required batch.
- Story protagonists are Zhao Yun, Lu Zhishen and Hu Sanniang only. All other roster identities are Story rivals; a spared Venom Adept becomes available for Quick Play, never a fourth Story protagonist.
- The required batch has 36 files: Venom Adept portrait/sprite, nine signature icons, eleven special motifs, six oath emblems, three weather overlays, merchant portrait and four Act IV materials. Optional turnarounds, judgement icons, paper and wander banners are outside this batch.
- Icons keep the built-in generator's larger native resolution and are displayed at 32–38px; 256/512 sizes below are minimum contracts. No upscaled placeholders or alpha flattening.
- The manifest records the complete prompts and `{minWidth, minHeight, square, alpha}` contract for generated overlays and sprites. Run both `npm test` and `npm run check` before a handoff.
- Full prompt set: `prompts/expansion-assets.json` plus the two `prompts/venom-adept*.txt` files. Generated files are copied into `assets/`, never referenced only from a generator cache.
Everything the designer replaces should keep the same **file name, format and
minimum dimensions** so `npm run check` (asset contract in `scripts/check.mjs`)
keeps passing. Style: painterly wuxia concept art consistent with the existing
roster portraits (dark charcoal `#10191b` background, portrait 2:3, no text).

## 1. New hero — the Venom Adept (recruit via the elite judgement)

| File | Status today | Required |
|---|---|---|
| `assets/venom-adept.png` | **GENERATED** — original 1024×1536 portrait | Portrait 2:3 PNG, ≥900×1400; opaque charcoal background. Adult female assassin, muted green-grey travel wraps, venom rings on her fingers, calm watchful stance. |
| `assets/venom-adept-sprite.png` | **GENERATED** — original 1254×1254 transparent sprite | Square RGBA PNG ≥1024×1024, transparent alpha, facing right, compact ready stance, readable at ~140px tall. |
| `assets/venom-adept-turnaround.png` | missing (optional) | 16:9 front/side/back sheet like the other heroes, if she stays in the roster long-term. |

Prompt sketch for the portrait: *“Hero card portrait for the spared Venom Adept
recruit: adult female assassin in muted green-grey travel wraps, venom rings on
her fingers, calm watchful pose, dark charcoal background, portrait 2:3,
painterly wuxia concept style consistent with the roster.”*

## 2. Signature actions (fifth duel action, key 5)

Shipped as **text buttons** only. Wanted: a small icon per archetype (or per
hero if budget allows), used on the button and in the codex.

| Archetype | Heroes | Icon idea |
|---|---|---|
| counter | Zhao Yun, Qin Liangyu | crossed guard-and-cut |
| focusGuard | Lu Zhishen | bellowing monk bell |
| bleedCut | Hu Sanniang, Gu Dasao, Venom Adept | sabre with a red drip |
| execute | Lü Bu, Yang Zhi | heavy halberd over a kneeling foe |
| charged | Guan Yu, Bao Sanniang | wound-up spear, motion arcs |
| cleanse | Mu Guiying | banner signal |
| drainStrike | Wu Song, Sun Shangxiang | pinning grip / bowstring |
| doubleSig | Liang Hongyu, Dian Wei | twin blades |
| vanish | Nie Yinniang | dissolving silhouette |

Format: 256×256 RGBA PNG, transparent, named `assets/sig-{archetype}.png`
(or `sig-{heroId}.png` for hero-specific sets). Current UI runs without them.

## 3. Enemy special attacks (focus gauge)

Shipped with **no VFX art** — the telegraph is text (`SPECIAL — …`) plus the
focus gauge. Wanted: one telegraph frame per special, shown when focus fills
(canvas overlay, same layer as existing arrow aim lines):

`assets/special-{kind}.png` — 512×512 RGBA: `guard, archer, bandit,
venom-adept, pugilist, ashen-priest, shadow-assassin, skiff-archer, warden,
night-heron, canglan-monk` (specials table in `src/content/expansion.js`).
Style: glowing intent motif over the rival (e.g. Warden's *Gatebreaker* — a
shattering gate arch; Night Heron's *Silken Requiem* — resonating zither rings).

## 4. Oath bonds

Chip art for the six pairs (list in `src/content/expansion.js` `OATHS`):
`assets/oath-{id}.png`, 256×256 RGBA — two interlocking emblems per pair
(e.g. Changshan Vow: sword + green dragon crest). Used on the party HUD and
the assist flash.

## 5. Weather

Shipped as a text chip. Wanted: `assets/weather-{rain,night,fog}.png`
(transparent 1024×1024 tiling overlay for the roam stage) plus optional
64×64 chip icons. Rain: diagonal streaks; Night: cool vignette; Fog: soft
frontal mist band.

## 6. Merchant + judgement

- `assets/merchant.png` — portrait 2:3 ≥900×1400 for the pass-merchant modal
  (currently text-only). A wandering peddler with a shoulder pole of crates.
- Optional `assets/judgement-{spare,execute}.png` 512×512 RGBA icons for the
  spare/finish choice buttons.

## 7. Codex

Uses existing roster/rival art. Optional: `assets/codex-paper.png` — a paper
texture background (1024×1024, tileable) behind the codex modal.

## 7b. Act IV — the Imperial Meridian Citadel (finale)

Shipped reusing existing art; all of the below are wanted replacements:

- `assets/meridian-citadel.png` — the Act IV roam plate (generated and wired). Imperial blood-moon forecourt: red-lacquered
  pillars, white marble stairs, qi vortex spirals on the walls. Landscape
  plate sized like `mount-canglan.png`.
- `assets/jade-sentinel-sprite.png` — Jade Sentinel sprite (generated and wired). Imperial guard in jade-lacquered lamellar with
  a moon-gate halberd. Transparent square ≥1024.
- `assets/meridian-acolyte-sprite.png` — Meridian Acolyte sprite (generated and wired). Robed qi-channeler with swirling vortex sleeves.
  Transparent square ≥1024.
- `assets/sovereign-sprite.png` — The Ashen Sovereign boss sprite (**GENERATED** — original transparent square). Blood-moon regalia, multiple weapon forms hinted on
  the back. Transparent square ≥1024, readable at boss scale.

## 8. Endless wander

Optional: `assets/wander-banner.png` (16:9) for the mode's menu card and the
defeat screen (“The jianghu stretches beyond the maps…”).

---

### Contract reminders
- Portraits: 2:3, ≥900×1400 PNG (RGBA). Sprites: square ≥1024, true alpha.
- Keep file names identical; drop-in replacement only.
- After replacing, run `npm run check` inside `prototype/jade-gate` — it
  validates the manifest, sizes, and sprite-grid rules.
- Add new files to `docs/asset-manifest.json` (id, file, method, prompt).

## Card-duel action images — follow-up

See [DUEL-ACTION-ASSETS.md](DUEL-ACTION-ASSETS.md) for the character pose list, including the failed Zhao Yun / Hu Sanniang requests, the cancelled Guan Yu retry, and the remaining deferred images. No new action PNGs were generated in this pass. The earlier 36-file expansion batch is a separate delivered batch.

## 9. Hedge maze pass (open field)

Shipped with procedural painting (blocker-texture wall tiles on the effects
canvas, flat tone fallback). All of the below are wanted replacements:

- `assets/maze-wall-{act}.png` — one tileable wall texture per act (jade-gate
  bamboo hedge, bamboo-crossing river reed, mount-canglan terrace stone,
  meridian-citadel imperial wall). Square, tileable on all edges; drawn at
  320×320 world units per tile. Replaces the current blocker-texture pattern.
- `assets/shrine-lantern.png` — wayside shrine sprite (lit and extinguished
  variants, or one sprite + dimming handled in code). Stone lantern with a
  warm amber glow, transparent square ≥512. Currently drawn procedurally on
  the effects canvas.
- `assets/route-map-frame.png` (optional) — decorative frame for the taller
  11:4 route map canvas.

### Notes
- The maze layout itself is seeded per run (runId + act) and regenerates
  identically from checkpoints; only the wall/shrine art is a drop-in concern.
