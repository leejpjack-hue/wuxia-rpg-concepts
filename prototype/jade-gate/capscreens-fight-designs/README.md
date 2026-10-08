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

Ten seconds. Zhao Yun stays screen-left and the vanguard screen-right. Wides keep the gate readable. The blade close-up is its own plate, with a small spark in the painting, not a full-frame white burst.

| Beat | Time | Size | Angle | Move |
| --- | --- | --- | --- | --- |
| approach | 1.7s | wide | frontal | slow track across the arena |
| windup | 1.0s | close-up | low, on Zhao Yun | hard cut, hold |
| feint | 1.2s | medium two-shot | frontal | push-in |
| ots | 1.2s | over-the-shoulder | behind Yun, rival facing camera | hard cut |
| exchange | 1.0s | medium two-shot | frontal | whip-pan into the strike |
| impact | 1.6s | close-up | frontal, blades and hands | hold and a gentle shake |
| follow | 1.4s | medium to wide | frontal | pull-back |
| aftermath | 0.9s | wide | frontal | settle |

`approach`, `feint`, `exchange`, `follow`, and `aftermath` composite `bg.png`, `hero-{beat}.png`, and `rival-{beat}.png`. The rival cutouts are the same man in every one of those beats: dark iron lamellar, closed helmet, narrow visor, short crimson tassel, and the polearm stays in his hands on screen-right. `windup` uses `angle-low.png`, `ots` uses `angle-ots.png`, and `impact` uses `angle-blades.png`. The Layered / Baked control falls back to the v1 plates.

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
