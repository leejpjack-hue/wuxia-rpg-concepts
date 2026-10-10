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

About 18.4 seconds. Zhao Yun stays screen-left and the vanguard screen-right, on the courtyard stones at close range. The body arc between two poses is interpolated every frame. A pose change is a crossfade with skew and blur, then a hit-stop freezes that pose. Zhao’s four fight drawings are `motion-guard`, `motion-wind`, `motion-lunge`, and `motion-cut` — crisp keyed cutouts, not the grey-fringed `wc` plates.

| Beat | Time | Size | Angle | Move |
| --- | --- | --- | --- | --- |
| approach | 2.4s | wide | frontal | slow track across the arena |
| windup | 1.8s | close-up | low, on Zhao Yun | push-in through the coil |
| feint | 2.0s | medium two-shot | frontal | push-in |
| ots | 1.6s | medium two-shot | frontal, rival lead | drift |
| exchange | 1.9s | medium two-shot | frontal | whip-pan into the strike |
| impact | 1.5s | close two-shot | frontal, stone | punch-in, then hit-stop |
| counter | 1.9s | medium two-shot | frontal, rival leads | push from the rival |
| reprise | 2.0s | close two-shot | frontal, stone floor | punch-in, second hit-stop |
| follow | 1.6s | medium to wide | frontal | pull-back |
| aftermath | 1.7s | wide | frontal | settle |

Layered playback reads `vanguard-phrase.mjs`. Feet stay on the marks in `vanguard-place.mjs`. The gate background stays `bg.png`. The coil uses `bg-low.png`. White and black impact frames stay full-frame flashes, then the cut pose is held. A warm light follows Zhao’s lead shoulder. `?hero=lu-zhishen` points the hero role at Lu Zhishen’s stand-in and does not change the backgrounds or the foot marks. The default view is Zhao Yun. The Layered / Baked control falls back to the v1 plates.

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
