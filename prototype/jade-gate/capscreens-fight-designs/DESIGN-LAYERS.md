# Vanguard layers — smallest diff

## What already exists

`#138` / `#139` already composite Gate Vanguard as separate images: `bg.png` (empty gate), `hero-{beat}.png`, `rival-{beat}.png`, and `fx-impact.png`. The preview stacks `#layer-bg`, `#layer-hero`, `#layer-rival`, `#layer-fx`. Those wide beats can change the hero without redrawing the gate.

`#140` then cut some beats to full paintings (`pose-windup-coil`, `pose-feint-smear`, `pose-exchange-smear`, `pose-impact-slash`, `pose-impact-recoil`, `pose-follow-overshoot`, plus `angle-low` / `angle-ots`). Both fighters are baked into those pictures, and each picture is held, so a 12fps sample mostly compares a frame to itself.

## Smallest change

Keep the 8-shot camera list and the same stack. Replace full-painting swaps with a cast manifest: each timed frame is `{ bg, hero pose, rival pose, fx }`, and pose files are looked up by character id.

- Wide beats reuse `bg.png` and the existing cutouts, plus new transparent in-betweens on that same gate.
- Wind-up, the reverse, and the blade close-up get their own empty backgrounds, because those shots are different angles. Characters for those angles are their own layers.
- White and black impact frames stay full-frame. They are exposure flashes, not a scene to recast.
- Default hero id is `zhao-yun`. A debug query `?hero=lu-zhishen` points the hero role at Lu Zhishen stand-in layers. Backgrounds stay. That switch is not the default view.
- In-betweens advance on a 12fps clock during the action (a repeat tick is the “on 2s” hold). Impact still holds the slash for the hit-stop.

No new compositor. No change to baked mode or the other four fights.
