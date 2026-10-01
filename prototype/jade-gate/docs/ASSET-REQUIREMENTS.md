# Asset Requirements — Expansion Batch (for the art designer)

Date: 2026-10-01 · Game: Blades of the Four (`prototype/jade-gate`)
Context: the features below shipped with temporary/derived art or CSS-glyph stand-ins.
Everything the designer replaces should keep the same **file name, format and
minimum dimensions** so `npm run check` (asset contract in `scripts/check.mjs`)
keeps passing. Style: painterly wuxia concept art consistent with the existing
roster portraits (dark charcoal `#10191b` background, portrait 2:3, no text).

## 1. New hero — the Venom Adept (recruit via the elite judgement)

| File | Status today | Required |
|---|---|---|
| `assets/venom-adept.png` | **PLACEHOLDER** — archer-sprite upscaled onto a 900×1400 charcoal card | Portrait 2:3 PNG, ≥900×1400, RGBA. Adult female assassin, muted green-grey travel wraps, venom rings on her fingers, calm watchful stance. |
| `assets/venom-adept-sprite.png` | **PLACEHOLDER** — resized archer sprite | Square RGBA PNG ≥1024×1024, transparent alpha, facing right, compact ready stance, readable at ~140px tall. |
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

- `assets/meridian-citadel.png` — the Act IV roam plate (currently the Jade
  Gate courtyard `arena.png`). Imperial blood-moon forecourt: red-lacquered
  pillars, white marble stairs, qi vortex spirals on the walls. Landscape
  plate sized like `mount-canglan.png`.
- `assets/jade-sentinel-sprite.png` — Jade Sentinel sprite (currently
  `canglan-monk-sprite.png`). Imperial guard in jade-lacquered lamellar with
  a moon-gate halberd. Transparent square ≥1024.
- `assets/meridian-acolyte-sprite.png` — Meridian Acolyte sprite (currently
  `guard-sprite.png`). Robed qi-channeler with swirling vortex sleeves.
  Transparent square ≥1024.
- `assets/sovereign-sprite.png` — The Ashen Sovereign boss sprite (currently
  `warden-sprite.png`). Blood-moon regalia, multiple weapon forms hinted on
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
