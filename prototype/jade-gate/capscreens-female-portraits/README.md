# Female portrait framing — 4 October 2026

Reproduced the cropped selection portraits in the running game. Landscape key art placed Diaochan, Yang Yuhuan and Empress Yixiu left of center, and Wang Xifeng right of center; a uniform center crop clipped their bodies. Zhen Huan's static duel card requested `assets/zhen-huan.png`, which does not exist.

The hero data now declares reviewed selection crop positions for all ten new women. A shared portrait descriptor resolves the actual filename and keeps selection offsets separate from centered transparent duel artwork. Dialogue uses the same approved body for these heroes.

## Browser evidence

- `selection-wide.jpg`: corrected portraits at the default 1280px preview width.
- `selection-five-columns.jpg`: all ten women in the 1600px, five-column layout; full heads visible.
- `selection-narrow.jpg`: Diaochan, Wang Xifeng, Yang Yuhuan and Zhen Huan at 390px phone width.
- `zhen-huan-duel.jpg`: actual Quick Play duel against an Ashen swordsman; Zhen Huan's ready body displays.
- `zhen-huan-duel-narrow.jpg`: same duel at 390px; full character remains visible.

Read-only browser checks confirmed `hero-image` is loaded, visible, uses `assets/zhen-huan-sprite.png`, and is centered with `contain`. All selection images loaded; the game browser reported no console errors. Temporary viewport overrides were reset.

## Local checks

- `npm test`: **299 passed, 0 failed** (`test-output.txt`). Includes actual DuelView render checks for every hidden hero, existing-file validation for every roster hero, and crop/body separation regression coverage.
- `npm run check`: **passed** — 263 images and 3 action sheets (`check-output.txt`).
- `git diff --check`: **passed**.

Local preview: <http://127.0.0.1:8766/>. No image regeneration was needed.
