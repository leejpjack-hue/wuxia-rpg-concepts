# Local proof — scene restoration

Base: `origin/main` at `b081de3`. Branch: `codex/restore-stage-scenes`.

`test-output.txt`: all 208 platform/domain/presentation tests pass. Includes a complete party traversal through the south spur and every east choke point to the distant Warden, without clipping ground or walls; new per-act assets; read-only route overview; and restored character fallback.

`check-output.txt`: JavaScript syntax, all 55 images, both assets for all 15 heroes and the three archived action sheets validate. `git diff --check` passes.

Browser verification on `http://127.0.0.1:8765/` used Quick Play with Zhao Yun, Lu Zhishen and Hu Sanniang. All three acts launch with distinct ground art. Stage II shows the new moonlit bamboo ground, Stage III shows the new stone terrace, and Stage I restores the natural forest. Full gameplay frames were inspected. Zhao Yun and Hu Sanniang display their original sprites, Lu Zhishen retains his sheet. All visible images loaded; the browser reported no warning/error logs. Pause/menu and chapter switching work. The route canvas measures 494 × 98.8 CSS pixels (5:1), avoiding the global arena canvas ratio. Japanese labels render correctly.

Separate mountain blocker generation failed twice due to network errors. The implementation uses the existing blocker artwork's lower rock detail through CSS, with no missing file or placeholder asset. No PR or deployment was created in this slice.
