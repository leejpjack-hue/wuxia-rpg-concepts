# Fight designs — v1 animatic, Vanguard layered exchange

Directed camera on the existing animation-pack plates. Gate Vanguard Clash also composites cutouts over the gate plate. The other four fights stay on the baked plates.

Zhao Yun’s weapon is a **jian**.

## Baked grammar

The four fights without cutouts, and Vanguard when the toggle is set to baked plates:

1. **wind-up** — wide ¾ hold
2. **charge** — short push-in tracking the attacker
3. **impact** — hard cut to a tip-clash close-up, with the existing shake, white flash, and speed lines
4. **aftermath** — pull out to a medium-wide hold

Baked playback also opens on the shot standoff when that plate exists, and flashes pass and hold between impact and aftermath.

## Vanguard shot list

About 16.6 seconds, eight drawings a second. Zhao Yun stays screen-left and the vanguard screen-right, on the courtyard stones at close range. Every frame is its own cutout (`d000`…): the sword, the guandao, the hair, and the cloth are drawn, not rotated on a held plate. In-betweens are warped from the neighboring drawing only, so two poses are never shown at once. No impact flash, no hit-stop, no smear ghost.

| Beat | Time | What moves |
| --- | --- | --- |
| approach | 2.4s | both weigh in and step |
| windup | 2.4s | Zhao coils, Guan raises the guandao |
| feint | 2.4s | Zhao’s first cut |
| ots | 1.0s | Guan’s parry |
| exchange | 1.8s | Guan sweeps |
| impact | 1.3s | the bind on the stones |
| counter | 1.5s | Zhao presses |
| reprise | 1.8s | the second cut |
| follow | 1.3s | both recover |
| aftermath | 1.0s | both settle |

Layered playback reads `vanguard-phrase.mjs` and the drawings in `vanguard-draw.mjs`. Feet stay on the marks in `vanguard-place.mjs`. The gate background stays `bg.png` for the whole phrase. `?hero=lu-zhishen` points the hero role at Lu Zhishen’s stand-in and does not change the backgrounds or the foot marks. The default view is Zhao Yun. The Layered / Baked control falls back to the v1 plates.

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
