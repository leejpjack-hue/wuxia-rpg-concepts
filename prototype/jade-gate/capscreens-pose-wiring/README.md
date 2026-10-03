# Generated character pose wiring — 4 October 2026

## Reproduction and cause

Main at `2ee33b8` included 23 complete ready sprites and 92 separate duel PNGs from PR #106. Of these, 91 pose files had no manifest entry. Combat selected the legacy `<hero>-duel-poses.png` atlas; Zhao Min selected only the earlier wind-up and idle-as-focus overrides. Other hidden cinematic opening/guard shots selected opaque gallery keys.

## Correction

- Registered all 92 native poses with square RGBA contracts, source commit, hashes and approval.
- Set all four `poseFiles` for the 20 hidden heroes plus Gu Dasao, Qin Liangyu and Bao Sanniang.
- Connected all 23 reviewed ready sprites through `cinematicArt` for opening/guard/reduced-motion and story rival art identity.
- Preload approved native pose/still assets. Fully overridden old atlases no longer preload; partial sets retain their atlas fallback.
- Asset checks now reject unregistered pose filenames and approved PNGs that combat does not select.
- Added integration instructions and marked the character audit/prompts as integrated. Original audit pixels remain historical; scene requests remain separate.

No game PNG bytes were modified. The four JPGs here are contact sheets for review, not gameplay screenshots. `wired-characters.json` records every selected file.

## Visual review

Inspected all 115 supplied images on four contact sheets: complete figures/equipment and transparent backgrounds. Reviewed the actual local duel renderer in the default narrow browser viewport:

- Wu Yong normal strike uses `wu-yong-duel-strike.png`, full frame at 100% × 100%, complete figure visible.
- Act V Zhao Min rival special close-up uses `zhao-min-duel-focus.png`; face remains visible.
- Gu Dasao technique impact uses her new special pose; Qin Liangyu uses her transparent ready sprite without a black rectangle. Prepare view also reviewed.
- Game page reloaded at port 8766 with the updated preloading configuration; no missing-illustration message. Duel browser console has no errors.

Screenshots were inspected inline in the browser tool output; durable local proof is saved below.

## Verification

- `npm test`: 288 passed, 0 failed. Real film-timeline coverage checks both hero attacks and story rival counters for every supplied character, including normal/special contact and completion exactly once.
- `npm run check`: passed; 263 manifest images, 3 action sheets validated.
- `git diff --check`: passed.

Evidence: `test-output.txt`, `check-output.txt`, `wired-characters.json`, `assets-review-1.jpg` through `assets-review-4.jpg`.
