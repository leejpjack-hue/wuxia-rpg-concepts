# Zhao Min generated art import — 3 October 2026

Two user shares supply native 1254×1254 RGBA originals:

- https://chatgpt.com/s/m_6ac108d917348191bad512d5cf77ec3f contains four ready-stance variants. All were inspected; image 1 is copied byte-for-byte to `assets/zhao-min-sprite.png`.
- https://chatgpt.com/s/m_6ac10d1407748191a3b654aaeb645331 contains one complete raised-knee wind-up, copied byte-for-byte to `assets/zhao-min-duel-windup.png`.

## Data contract

Both PNGs are reviewed square transparent assets. Manifest source URLs, hashes, approval and contracts identify each import. No crop, resize, matting or image regeneration was performed.

Hero `cinematicArt` supplies the transparent ready sprite independently of gallery `keyArt`; cinematic cast resolves it by art identity for the Act V boss. Optional `poseFiles` on the existing atlas select the native wind-up and ready/focus PNGs without atlas cropping. Other contact beats retain the old atlas. **STRIKE and SPECIAL still need replacement**; no new walking sequence was registered.

## Visual review

Used the actual local renderers at port 8766:

- `capscreens-art-corrections/preview.html`: Zhao Min, Stand. Complete boots and silhouette visible at exploration scale without a rectangular background.
- `capscreens-duel-action-poses/preview.html`: Zhao Min as hero and Act V story rival, Technique, Rival wind-up. Complete supporting boot and raised leg visible; DOM background uses the new single image at 100% × 100%.
- Hero Special focus initially cropped off the head: the left camera zoom was anchored at 60% stage height. Corrected to 15%, matching the rival close-up. Recaptured hero and rival focus; both faces remain visible. Lower-body framing in a close-up is intentional.
- Lu Zhishen Special focus remains readable with the same camera correction. Browser console has no errors.

Screenshots were inspected in the browser tool output. These are reviewed gameplay states, not constructed images. Durable local proof follows.

## Verification

- `npm test`: **286 passed, 0 failed**. Regression coverage includes transparent opening/guard stills on both sides and reduced motion, native pose switching, retained atlas contact beats and rejection of unreviewed overrides.
- `npm run check`: passed, **172 images**.
- `git diff --check`: passed.
- Installed PNG hashes match their downloaded originals. Existing duel atlas and gallery key are unchanged.

Proof: `test-output.txt`, `check-output.txt` and `asset-proof.json`. The art audit retains its original before-images and identifies the two remaining contact requests.
