# WU-FRAME-09 — Zhao idle must be still (animate walk/attack only)

Proof pack for pinning sheet-wired leads to a frozen still cell when standing.

**Story:** WU-FRAME-09 / #83  
**Base tip:** `90997ca2`  
**Design:** `RoamView.applyActorSheet` — walk while moving; when stopped pin first idle cell (`[0,0]`) and **never** sample looping idle with advancing `animTime`. Manifest `idle.loop: false` for Zhao / Lu / Hu (frames kept ≥2 for check.mjs grid contract). Attack strike film unchanged.

## Ordered capscreens

| # | File | Beat |
|---|------|------|
| 1 | `01-zhao-idle-still.png` | Standing Zhao still cell (`0% 0%`) |
| 1b | `01b-zhao-idle-still-roam.png` | Same still in roam stage |
| 2 | `02-zhao-walk-cycle.png` | Walk cycle mid-move (non-still cell) |
| 3 | `03-zhao-attack-film.png` | Attack film plays once on strike |
| 3b | `03b-zhao-attack-film-crop.png` | Strike-film crop |

## Idle still proof (≥1s)

`idle-still-proof.json`: `bgPos` stayed `0% 0%` from `animTime=0` through `animTime≈1.17` while `moving=false`. Pre-fix looping idle would have flipped to `[1,0]` at `1/6s`.

## Verify

```bash
cd prototype/jade-gate
npm test
npm run check
```

Act unlocks untouched. No sheet remake. No bamboo backdrop work.
