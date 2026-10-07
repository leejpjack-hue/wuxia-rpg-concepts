# Fight designs — v1 animatic, v2 Vanguard cutouts

Directed camera on the existing animation-pack plates. Gate Vanguard Clash can also composite the Art Director v2 cutouts. The other four fights stay on the baked plates.

Zhao Yun’s weapon in the copy is a **jian**. The camera crops and cuts. It does not redraw a spear, staff, or any other baked pixel.

Art Dir marked the Vanguard cutouts **PASS_WITH_NOTES** (upscale and fringe).

## Grammar

Each fight, same compositor:

1. **wind-up** — wide ¾ hold
2. **charge** — short push-in tracking the attacker
3. **impact** — hard cut to a tip-clash close-up, with the existing shake, white flash, and speed lines
4. **aftermath** — pull out to a medium-wide hold

Baked playback also opens on the shot standoff when that plate exists, and flashes pass and hold between impact and aftermath.

## Vanguard layers

`assets/fight/ep1-vanguard/`, bottom to top: `bg.png`, `hero-{beat}.png`, `rival-{beat}.png`, and `fx-impact.png` on impact only. The review page defaults to this stack for Gate Vanguard Clash. The Layered / Baked control falls back to the v1 plates. Beats without a cutout (standoff, pass, hold) use the baked plate.

## The five designs

1. **Gate Vanguard Clash** — `ep1-vanguard-s05`, plus the v2 cutout stack above
2. **Warden Staff Break** — `ep1-warden-s05` (baked)
3. **Heron Silk vs Staff** — `ep1-heron-s04` (baked)
4. **Lu Bu Terrace Duel** — `ep1-lubu-s03` (baked)
5. **Cloud Bridge Finale** — `ep2-final-s01` (baked), plus a short flash of `insert/ep1-final-duel-insert-four-weapons.png` on impact only

## Open the preview

From `prototype/jade-gate`:

`http://127.0.0.1:8766/capscreens-fight-designs/preview.html`

Plain HTML, CSS, and JS. It does not import the game.

Contact sheet of the five impact beats: `contact-sheet-5-designs.png`.
