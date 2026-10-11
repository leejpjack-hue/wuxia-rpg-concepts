# Zhao Yun vs Guan Yu — 30 s fight demo

Standalone local page. It is not linked from the game. Open it on its own; nothing here is deployed.

## Open

From this folder, double-click `index.html`, or serve it with no install:

```
python3 -m http.server
```

Paths are relative. The page needs no network and no build step. `index.html` already contains the joined script.

- `index.html?f=N` draws frame N and stops (N is 0–719, 24 fps, 30.000 s).
- `index.html?manual=1` loads and waits. In the console, `window.__render(N)` draws frame N.

`play_small.mp4` is the 1920×1080, 24 fps, 30 s preview (no audio). The repo has no `.gitattributes`, Git LFS, or file-size rule that blocks it, and 14 MB is under GitHub’s limit, so the file is in this folder.

`python3 build.py` rewrites `index.html` from `src/` and `assets/sprites/meta.json`. That step is optional.

## Timeline

Video time. After the beat impact the world clock runs 3 frames behind the video, so the times below are about ±0.125 s.

| Time | What happens |
| --- | --- |
| 0.0–5.0 | Camera dollies back (zoom 1.38→1.06). Six strike/guard exchanges (0.40 Zhao, 1.20 Guan, 2.00 Zhao, 2.75 Guan, 3.50 both, 4.15 Zhao), then Guan’s overhead at 4.85. |
| 5.0–5.5 | Debris blows at the lens and fills the frame. Its outline is the hole outline. |
| 5.5–6.4 | Match cut to the hole in the gate. Camera pulls out through dust; the fighters walk back in. |
| 6.4–9.4 | Guan counter: dash, spinning guandao sweeps, parry at 6.75, low sweep, Zhao ducks, hook combo, knockback, two-turn roll, slide, get up. |
| 9.4–9.9 | Zhao’s silver strike splits a floor slab into pieces that fly and bounce. |
| 10.0–11.5 | Fast 360° orbit (2.5D). Hard cuts to `angle-low` at 10.40 and `angle-ots` at 11.00. |
| 12.0–18.0 | The earlier 6 s beat: exchange, low plate, over-the-shoulder rush, 3-frame impact (frames 338–340), blast to the wall, Guan rebounds, Zhao sidesteps, camera trucks. |
| 18.0–24.0 | Close 3-strike exchange, low plate, Guan sweep and Zhao hops back, both gather, head-on clash at 22.7, over-the-shoulder plate, Guan crouches to leap. |
| 24.0–27.0 | Guan leaping thrust, Zhao guards and slides, Guan spins, Zhao dives and launches him, Guan springs off the guard, both cross the street. Zhao lands at 27.0. |
| 27.0–29.7 | Sides swapped (plates mirrored: Guan left, Zhao right). Whip vs duck, belly thrust, guard and butt-push, sidestep and two blows, Guan spin-thrust, Zhao stomp (floor cracks), over-the-shoulder, both charge. |
| 29.708–30.000 | Final clash. 3-frame exposure on frames 713–715, then pressure rings and debris. Frame 719 is still mid-motion, camera snapped out to a wide of both. |

## Limits

- Poses are whole-sprite swaps on twos (about 12 fps). There are no animated limbs. A leaping side kick is a jumping guandao thrust; an uppercut is a rising silver arc plus a launch.
- The camera is 2.5D: zoom, pan, roll, sprite scale, and flip. The orbit squashes and flips the cards and pans or mirrors the background. `angle-low` and `angle-ots` are the two original plates, zoomed and sometimes mirrored.
- Flight, tumbling, and rolling rotate or move one flat sprite. Knock-down is the standing aftermath plate, rotated.
- The last section mirrors the sprites, so weapon-hand asymmetry flips.
- The wall collapse and the slab shatter are drawn polygons and crops. The hole is a rim drawn on the existing arch.
- Zhao is smaller in the wides (sprites about 640 px tall at scale 0.62). Close-ups use only the two original plates.
- Guan’s effect colour is green-gold. Zhao’s is cool white/silver.

## Art

Sprites are de-fringed crops of `prototype/jade-gate/assets/fight/ep1-vanguard` on `main`. Guan Yu uses the red-plume helmet set only (approach, feint, exchange, follow, aftermath). The edge band was recolored from nearby interior pixels and alpha was tightened so the magenta cut-out rim is gone. Floor pieces are crops of the same floor texture. Backgrounds are `assets/bg/bg.jpg`, `angle-low.jpg`, and `angle-ots.jpg`. They are not byte-identical to the png plates in the game folder, so they are copied here. The original plates are not duplicated.
