# Rival special cinematic verification — 2026-10-03

Right-side specials now use a dedicated charge close-up followed by a mirrored weapon strike and impact hold. The rival owns the technique name, calligraphy seal, color, emblem and sound cues, independently of the player's selected hero. Approved action atlases change wind-up, focus and special poses. Costume-specific bosses retain their own sprites when a matching atlas is unavailable.

## Recorded checks

- `npm test`: 272 passed, zero failed. Full output: `tests.txt`.
- `npm run check`: JavaScript modules, 111 PNG images, both assets for all 16 heroes and three action sheets passed. Full output: `check.txt`.
- `git diff --check`: passed; `diff-check.txt` is empty because there were no whitespace errors.
- Behavior tests cover all five player actions preceding a rival special, identity/color/title changes, pose changes, charge timing, impact hold, one completion, cancellation, no-incoming replies, reduced motion and boss costume fallback.
- Browser: the shared production film completed a Zhao Yun / Guan Yu exchange and reported Sequence complete without console errors. Frozen focus and strike frames showed Guan Yu's own poses, green effects and Spring-Autumn Cleave title.
- Browser: the Lü Bu boss kept `lu-bu-rival-sprite.png`, its purple theme and localized Skyfall Halberd title. Guard impact retained the hero's block reaction.
- Browser: inspected Japanese and English titles; both fit beside the rival at desktop size.
- Browser: inspected Lu Zhishen and boss Lü Bu at 390 × 844. Corrected the charge camera's vertical origin, sized close-up actors by film height, and shifted narrow-screen framing so faces remain visible beside the emblem.
- Browser: reduced motion returned `zoom: none`, `flash: none`, and `enemyMotion: none` at impact. Viewport override was reset after verification.
- Visual frames were captured inline during this session. The review page reproduces these frames with the production `DuelCinematic`, using the actual manifest and CSS.

Game: http://127.0.0.1:8766/

Review: http://127.0.0.1:8766/capscreens-duel-action-poses/preview.html

Select a rival, keep Rival special checked, then use Play sequence or Rival special close-up / Rival strike / Rival impact. The review page is silent; gameplay routes the charge, special and impact cues through the existing audio director.

No new images were generated. Rival assets without approved action atlases receive the cinematic camera and motion effects using their existing transparent sprite.
