# Zhao Yun x Guan Yu - full 30 s (zhao-guan-30s)
play.mp4 : 1920x1080, 24 fps, 720 frames = exactly 30.000 s, no audio, no subtitles, no mouse cursor
(frames are `<canvas>` element screenshots, so no OS cursor can be in them).
index.html : the same animation, live in a browser (loops). `?f=N` shows frame N, `?manual=1` waits for `window.__render(N)`.
Re-render: `python3 build.py` (joins src/*.js into index.html) then `python3 render30.py <outdir> 0-719` and
`ffmpeg -framerate 24 -i <outdir>/f%03d.png -c:v libx264 -pix_fmt yuv420p -crf 17 play.mp4`.

## Art used
ONLY origin/main prototype/jade-gate/assets/fight/ep1-vanguard art (assets/originals, untouched). No PR #144 art, nothing redrawn.
Guan Yu = red-plume-helmet set only (approach/feint/exchange/follow/aftermath). Purple-caped rival plates are not used.
assets/sprites_raw = plain bbox crops of the originals (they carried a pink/magenta rim from the cut-out).
assets/sprites     = same crops, DE-FRINGED: colour of the 2-3 px edge band replaced by nearby interior colour, alpha tightened,
                     interior alpha 255 (solid, opaque). Edge-pixel magenta ratio went from 4-20 % to <1 % (checked numerically + by eye at 2x).
Floor-slab pieces / floor tiles are cropped from the same bg.jpg floor texture (procedural shapes, no new art).
Hole-in-wall = the existing gate arch + a jagged dark rim + cracks drawn on top of bg.jpg.

## Timeline (video time; after the 3-frame beat impact the world clock runs 3 frames behind video)
0.0-5.0   Camera dollies back from a tight front-side framing (zoom 1.38->1.06, tracking the pair as it drifts left). SIX clear strike/guard exchanges
          (0.40 Zhao / 1.20 Guan / 2.00 Zhao / 2.75 Guan / 3.50 both / 4.15 Zhao), then the last heavy Guan overhead strike (4.85).
5.0-5.5   Last strike blows debris at the lens: a dark chunk grows to fill the frame; its outline = the hole outline.
5.5-6.4   Hard cut (match cut) to the broken hole in the gate wall, camera pulls back out of it, dust + falling bits, fighters walk back in.
6.4-9.4   (prompt 18-21 s) Guan counter: dash, spinning guandao sweeps (full green-gold rings), parried at 6.75 -> low sweep, Zhao ducks (squash)
          -> hook combo, Zhao knocked back, flung, rolls (2 turns) and slides, gets up.
9.4-9.9   Zhao gathers, then a big silver pressure strike smashes a floor slab beside him (slab splits into 10 pieces that fly + bounce).
10.0-11.5 Fast full 360 deg orbit around the pair (2.5D: positions/scale/flip + parallax bg; hard cuts to angle-low at 10.40 and angle-ots at 11.00).
12.0-18.0 The previous 6 s beat (unchanged choreography): exchange -> low plate -> OTS rush -> 3-frame exposure impact (frames 338-340) -> blast to wall,
          debris/dust, camera retreat -> Guan rebounds (green-gold arc), Zhao sidesteps, lateral truck.
18.0-24.0 Continuation: close 3-strike exchange -> low plate -> Guan big sweep, Zhao hops back -> both gather (silver vs green-gold, slow push-in)
          -> head-on lunge + clash (22.7) -> OTS plate -> Guan crouches to leap.
24.0-27.0 Guan leaping thrust (stands in for the leaping side kick), Zhao guards and slides back, Guan spin, Zhao dives under, uppercut-equivalent launches Guan
          (tumbles), Guan lands boots/staff on Zhao's raised guard and springs off, both fly across the street (camera rises, spirals with roll, one low plate
          cut, then dives), Zhao lands first (27.0).
27.0-29.7 Sides are swapped here (plates mirrored: Guan left, Zhao right). Whip sweep vs duck, belly thrust, guard + butt-push, sidestep + two blows,
          Guan spin-thrust, Zhao stomp (floor cracks + lifting tiles), OTS plate, both charge.
29.708    FINAL HEAD-ON CLASH: 3-frame exposure at frames 713-715 (29.708-29.792 s), then pressure rings, wall pieces collapsing behind, big dark debris crossing
          in front, last frame 719 (30.000 s) is mid-motion with camera snapping out to a wide of both.

## Honest limits
- Characters are WHOLE-SPRITE plates swapped on twos (12 fps pose changes). There are no animated limbs: punches/kicks of the prompt become sword thrusts,
  guandao sweeps, guards. "Leaping side kick" = guandao thrust from a jump; "uppercut" = rising silver arc + launch.
- Camera is 2.5D (zoom/pan/roll, sprite scale + flip), not a true 3D orbit. During the orbit the card sprites are squashed/flipped and the background is
  panned/mirrored, so it reads as a spin but is faked. The angle-low / angle-ots shots are the two original plates (zoomed, some mirrored).
- Flight, tumbling, rolling are rotation/translation of one flat sprite. Knock-down uses the standing-aftermath plate rotated.
- Mirrored sprites in the last section: asymmetries (weapon hand) are flipped.
- Wall "collapse" and slab shatter are procedural polygons/crops, not simulated. Hole in wall is a drawn rim on the existing arch.
- Zhao is smaller in the wide shots (sprites are ~640 px tall at scale 0.62); close-ups are only the two original plates.
- World clock after the beat impact (frame 341+) is 3 frames behind video clock (hit-stop), so times quoted above are +/- 0.125 s.
- Guan has no red/black pressure: his effect colour is green-gold, Zhao's is cool white/silver (matching the earlier beat).
