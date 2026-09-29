# Ten-second trailer verification — 2026-09-29

Scope: standalone HTML/CSS/JavaScript trailer, linked from the game menu. Five timed scenes: pass, legends, card clash, journey, title. Japanese default, English option. Recorded synthetic narration, synchronized captions, an original procedural score and strike effects. No campaign writes.

Validation:
- `npm test`: PASS, 136 tests (including timeline boundaries and both sets of PCM voice assets).
- `npm run check`: PASS, all JavaScript and 40 existing game images verified.
- `git diff --check`: PASS.
- Browser: Japanese playback ends at `00:10 / 00:10`; all images load; no browser errors.
- Browser: English playback, mute/unmute, pause at the duel, resume through the final card, and replay verified. Paused timer stayed at 00:04 across checks.
- Screenshots captured at the user's current narrow browser width; no horizontal overflow in controls.

Evidence:
- `duel-ja.jpg`: Japanese card-duel scene, paused at four seconds.
- `title-en.jpg`: English final card at ten seconds, Replay available.

Voice source and regeneration steps: `prototype/jade-gate/assets/trailer/README.md`. Narration is locally synthesized, not a recorded voice-actor performance. Browser playback and audio decoding were verified; subjective speaker/headphone mix remains a listening review.
