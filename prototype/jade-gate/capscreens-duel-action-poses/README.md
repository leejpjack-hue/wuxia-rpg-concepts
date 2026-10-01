# Duel action pose verification — 2026-10-01

- `npm test`: PASS, 250 tests, zero failures. Full output: `tests.txt`.
- `npm run check`: PASS, 91 images and 16 hero asset pairs. Full output: `check.txt`.
- `git diff --check`: PASS.
- Browser review at `http://localhost:8766/capscreens-duel-action-poses/preview.html`: distinct Lu Zhishen normal and special impact cells rendered; rival special cell rendered with its counterstrike effect. Narrow browser viewport inspected. Browser error log empty.
- Inline browser captures recorded in the task. Use the review page controls to reproduce frozen impact and counterstrike frames.

No new image was generated. Zhao Yun and Hu Sanniang generation failed with network errors; Guan Yu retry was cancelled following the user request; remaining artwork deferred. Only Lu Zhishen currently has approved pose artwork. See `../docs/DUEL-ACTION-ASSETS.md` for the complete status list and retry contract.

Changes remain local on `codex/duel-action-poses`; no PR or deployment was made.
