# Art corrections verification — 2026-10-02

- `npm test`: 265 passed, 0 failed. Full output in `tests.txt`.
- `npm run check`: all JavaScript modules and 111 image assets passed, including three legacy action sheets. Output in `check.txt`.
- `git diff --check`: passed.
- Original-file verification: all five supplied PNGs copied byte-for-byte. Hashes in `supplied-assets.txt`.
- Browser: real Story startup reached exploration with the new preload list. No errors reported in the art preview.
- Browser: real exploration renderer preview selected complete Zhao Yun walking frames 1 and 3 using separate full PNGs at `100% 100%`, with no atlas crop. Stand restored `assets/zhao-yun-sprite.png` and cleared animation styles. Lu Zhishen continued to use his legacy 4×3 walking sheet.
- Browser: Stages III and IV showed complete transparent granite/pine props. Citadel lighting remained darker. Inline gameplay frames were captured during the session.
- Behavior tests cover all four frame paths, looping, original standing restoration, malformed sequences, and whole-prop stone-stage rendering.

Preview: `http://127.0.0.1:8766/capscreens-art-corrections/preview.html`.
Card preview: `http://127.0.0.1:8766/capscreens-duel-action-poses/preview.html`.

Earlier image-generation failures are recorded in `../docs/ART-CORRECTIONS.md`. The user supplied the walking and rock replacements; replacement duel artwork remains deferred because the current card attacks were accepted.
