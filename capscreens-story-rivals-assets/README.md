# Story rivals and expansion asset evidence

1 October 2026. Based on latest remote main `f831ae8`.

- `tests.txt`: 228 tests passed, zero failed. Includes all thirteen non-protagonist identities appearing as illustrated Story rivals, shared roaming/duel rosters, three protagonists clearing all four acts with earned cultivation, legacy-save protections, and generated/deferred art inventory checks.
- `check.txt`: JavaScript syntax and 63 manifest images validated, including both assets for all sixteen heroes and all three existing animation sheets.
- `image-check.txt`: Read-only PNG inspection of all eight new/replaced assets. All generated sprites/icons have genuine alpha extrema 0..255. Portraits and the scene retain the generator's opaque RGB PNG format.
- `diff-check.txt`: empty output indicates `git diff --check` passed.

Browser verification through the Codex in-app browser at http://localhost:8766/:

1. Japanese Story selection shows exactly Zhao Yun, Lu Zhishen and Hu Sanniang; Quick Play retains its fifteen freely selectable heroes, plus Venom Adept after the existing recruitment condition.
2. Starting Story and skipping arrival dialogue opens exploration with Guan Yu and Gu Dasao. Their visible sprite sources are the corresponding original hero sprites. A gameplay frame was inspected inline; the browser error log was empty.
3. Reloaded menu shows sixteen legends and retains the valid Zhao Yun checkpoint.
4. Gallery includes the Venom Adept portrait/sprite and the six additional assets, with Japanese labels for the expansion group and new artwork.

Eight of the 36 required images are generated. The user explicitly asked to skip the failed image generation for now after repeated network errors and stalled built-in requests. No API fallback was used. `prototype/jade-gate/docs/ASSET-GENERATION-STATUS.md` lists all 28 deferred assets and their saved prompt locations. The Sovereign keeps its existing Warden art. Unavailable decorative art is gated by manifest presence.

Port 8765 belongs to another checkout. It was left running; port 8766 serves this workspace's updated prototype.

No PR opened or handed off. This directory contains the local-proof option permitted by AGENTS.md; browser frames were inspected inline rather than archived as image files.
