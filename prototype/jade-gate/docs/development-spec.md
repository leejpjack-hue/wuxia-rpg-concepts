# Blades of the Four: development specification

## Product promise

A short, replayable wuxia action RPG where a chosen legend reclaims a mountain gate through timing, movement and weapon mastery. Target audience: adults aged 20–30 who enjoy martial-arts fantasy. Zhao Yun, Lu Zhishen, Hu Sanniang and Lü Bu retain distinct identities; audience age is not a requirement to change every character's age or gender.

## Implemented slice

Choose hero → defeat five guards → select one discipline → defeat seven mixed guards/archers → select another discipline → face the Ashen Warden with four soldiers → receive a result and saved best score. Each attack has a cooldown, a directional arc and weapon reach. Dodge briefly grants invulnerability. Successful hits generate Flow. The three-hit chain finisher increases strike damage. Defeated enemies periodically drop health. Normal hits interrupt guards; boss windups require a technique to interrupt.

| Hero | HP | Damage | Reach | Attack interval | Technique |
|---|---:|---:|---:|---:|---|
| Zhao Yun | 120 | 27 | 142 | 0.39 s | Directional rush, piercing line damage |
| Lu Zhishen | 165 | 32 | 118 | 0.55 s | Radial shockwave, knockback and long stun |
| Hu Sanniang | 105 | 19 | 103 | 0.25 s | Fast radial burst, short dodge cooldown |
| Lü Bu | 140 | 40 | 157 | 0.62 s | Wide, heavy directional cleave |

Numbers are initial tuning values, not final balance. Movement and hit positions use a 1280×720 ground plane. Canvas scales responsively while the simulation remains in logical coordinates. Actor sprites sort by ground Y. Rendered sprite bounds do not define combat collision.

## Art deliverables

The `assets` folder contains 16 generated PNGs: four character portraits, four transparent gameplay sprites, four turnaround/material/equipment sheets, three enemy sprites and the courtyard. The full prompt set is recorded in `asset-manifest.json`. Art is generated through the built-in image_gen tool. The gallery displays all images at their source paths.

The sheets are concept references. Some generated side/back geometry and weapon details vary between views; resolve those against the approved portrait before modeling. Single-pose sprites are transformed by code, not skeletal animation clips. No 3D model or rig is claimed as delivered.

## Proposed art-to-3D workflow

1. Approve one portrait per hero. In a paint editor, reconcile facial identity, armor seams, garment overlaps, hand grip and weapon proportions across the reference sheet.
2. In Blender, establish human scale and orthographic reference planes. Block out body, layered clothing and a separate weapon object. Keep silhouettes readable at the current combat camera distance. This is a proposed production workflow, not an automated image-to-mesh conversion.
3. Retopologize and unwrap. Initial project budgets: 25–40k triangles per hero, one 2K body material set, one 1K weapon set; lower budgets for ordinary enemies. Validate these budgets on the target device before expanding the roster.
4. Build an armature and skin the mesh. Keep weapon attachment sockets separate. Author idle, walk, run, three strikes, dodge, technique, hit and death. Verify shoulder, elbow and cloth deformation from the combat view.
5. Export the character and animation to glTF/GLB, then import and review the materials, skeleton and clips in Godot. Godot documents its supported 3D scene formats and import configuration in its [3D asset pipeline documentation](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/index.html).
6. Recreate the ground-plane controller, hit arcs, telegraph timing, Flow and upgrades in a Godot test arena before adding world exploration. Keep the current browser prototype as a behavior reference.

## Next implementation milestones

- Animation milestone: build and rig Zhao Yun first; implement animation-driven strike timing and readable directional locomotion.
- RPG milestone: add a village hub, one quest giver, dialogue choices, equipment slots and a saveable quest state.
- Encounter milestone: replace the single arena with three connected spaces and distinct boss patterns.
- Content milestone: complete the other hero rigs and weapons against the working animation/export pipeline.

## Acceptance criteria

A run can start with each hero, enemies can damage the player, dodge prevents damage during its window, a technique spends Flow and deals damage, upgrades persist across the run, a boss appears only in the final encounter, and both win and loss routes permit retry. Pause must stop simulation and held inputs must clear when focus is lost. The entire game and its art must load from the local folder without remote requests.
