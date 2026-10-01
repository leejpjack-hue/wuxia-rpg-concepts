# Duel action pose verification — 2026-10-01 (HKT)

## Generated this batch (15, Lu Zhishen skipped)
All non-Lu character duel-pose atlases from `docs/DUEL-ACTION-ASSETS.md` / `prompts/duel-action-poses.json`:

zhao-yun, hu-sanniang, lu-bu, guan-yu, wu-song, mu-guiying, liang-hongyu, nie-yinniang, sun-shangxiang, gu-dasao, qin-liangyu, bao-sanniang, dian-wei, yang-zhi, venom-adept

- Model: Codex CLI `gpt-6.1-sol` @ high, built-in `image_gen` (workspace-write + network)
- Contract: 1254×1254 RGBA 2×2 atlases, `runtimeApproved: true`, duelPoses windup/strike/focus/special
- Soft QA note: some atlases still cross cell midlines (weapons/fabric); identity + alpha + four poses OK

## Evidence
- Contact sheet: `contact-sheet-all-15.png`
- Crosshair QA samples: `qa-zhao-yun.png`, `qa-hu-sanniang.png`, `qa-lu-bu.png`, `qa-guan-yu.png`, `qa-venom-adept.png`
- Browser review page: `preview.html`
- `npm test`: PASS, 251 tests (`tests.txt`)
- `npm run check`: PASS, 106 images / 16 heroes (`check.txt`)

Lu Zhishen remains on existing approved sheet frames (no new PNG).
