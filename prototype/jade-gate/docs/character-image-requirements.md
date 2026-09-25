# Character image requirements

A playable hero needs **two distinct approved PNGs** with the same face, costume, colors and weapon:

| Asset | Filename | Canvas | Used in |
|---|---|---|---|
| Full-body key art | `assets/<hero-id>.png` | Portrait 2:3, at least 900×1400, opaque | Roster, card duel, gallery |
| Gameplay sprite | `assets/<hero-id>-sprite.png` | Square, at least 1024×1024, RGBA with real transparency | Courtyard, strike film, gallery |

A concept sheet, turnaround or collage is **not** either asset. Save a modeling sheet separately as `assets/<hero-id>-turnaround.png` only after its front, side and back views agree. The gallery lists approved sprites and turnarounds separately.

## Art direction

- One clearly adult Chinese wuxia character per frame, with a face and silhouette recognizable at roster-card and roughly 140-pixel gameplay size. Keep the full weapon, both feet and an 8% margin inside the canvas; do not crop at the image edge.
- Use a painterly realistic style consistent with the existing heroes. Choose one primary weapon and a restrained color motif from the character's game definition. Face, proportions, outfit details and equipment must match across key art and sprite.
- Portrait: one full-body three-quarter combat pose on flat dark charcoal `#10191b`; no background scene, words, UI, callouts or inset views.
- Sprite: one grounded ready pose from a slightly elevated three-quarter view facing right; actual transparent pixels outside the character, no dark fill, ground, shadow, glow or labels. Keep feet near the bottom of the character so they anchor to the courtyard.
- Adult women can wear Chinese-inspired short layered battle skirts or cropped cross-collar martial tops. Pair them with stable footwear and combat-ready construction appropriate to their role. Use varied shapes and colors so the women do not all look alike. Avoid youthful styling, lingerie armor, impossible heels or copied adaptation likenesses.
- Inspect the result for extra hands, duplicated blades, missing feet, cropped weapons, inaccurate weapon type and alpha halos. Regenerate incorrect images rather than cropping a concept sheet into a card.

## Copy-ready prompts

**Key art:** “Full-body portrait 2:3 key art of [adult hero, identity, face, build, colors], wearing [specific layered Chinese combat outfit], wielding exactly [weapon count and type]. One grounded three-quarter combat pose, full boots and weapon visible with 8% margin. Premium painterly realistic wuxia RPG style. Flat dark charcoal background. No collage, inset views, text, scenery, extra figures, extra limbs, duplicate weapon, border or watermark.”

**Sprite:** “Using the approved key art as the only identity reference, create a square transparent RGBA game sprite of the **same** adult hero. Preserve face, hair, outfit, colors and weapon. Full body and entire equipment, elevated three-quarter view facing right, grounded ready stance, 8% margin, readable at 140 px. Actual transparent background, no ground or cast shadow, text, extra figure or border.”

Generate and approve key art first. Use it as the reference for the sprite, then visually inspect both at original size and in the running game. Keep image-generation provenance and the final prompt in `docs/asset-manifest.json`.

## Integration checklist

1. Add the hero to `src/content/heroes.js` with a unique lowercase hyphenated `id`, gameplay values, and an adult character description. Add matching `HERO_TECHNIQUES` data in `src/content/duels.js`.
2. Save **both** PNGs under the exact filenames above. Add both manifest records. Remove any `artFocus` offset that was only needed to crop a concept sheet.
3. Run `npm run check`; it verifies the manifest entry, format and basic dimensions for every hero. Inspect the alpha visually because a PNG header alone cannot prove clean transparency.
4. Run `npm test`. In the browser, choose the hero and verify portrait in the roster and duel, transparent body in the courtyard and strike film, no missing-image notice, and a complete weapon and boots at narrow and wide widths.
5. If a turnaround is actually approved, add its ID to `TURNAROUND_HEROES` in `core.js`; sprite gallery membership derives from the playable hero roster.
