# Blades of the Four — playable vertical-slice specification

## Product promise

**Blades of the Four** is a single-player, combat-first wuxia action RPG for an adult 20–30 audience. The player swaps between legendary young heroes, reads enemy intent, builds **Flow**, and spends it on a character-defining technique. The tone is dangerous, stylish, and heroic rather than cute or grimly nihilistic.

### Vertical-slice success criteria

1. A new player understands movement, light attack, dodge, and Flow within 60 seconds.
2. Each hero is recognizable at gameplay distance through physique, color, weapon, and one signature move.
3. A five-minute arena run has a clear beginning, escalation, boss beat, and result.
4. Keyboard, pointer, and touch controls remain playable at 1280×720 and mobile landscape.
5. The slice runs locally without accounts, network calls, or installation.

## Core loop

`Choose hero → enter encounter → read telegraph → dodge/parry → counterattack → build Flow → use signature → choose a boon → boss → results`

The first production milestone is one compact mountain-pass arena, three two-minute encounters, four playable heroes, three common enemy archetypes, and Lü Bu as the rival boss. Story is delivered in short in-engine exchanges; romance and open-world systems are explicitly deferred.

## Combat contract

| System | Vertical-slice rule |
|---|---|
| Movement | Responsive 8-way movement; acceleration under 100 ms; no stamina cost. |
| Light attack | Three-hit chain, soft target-facing, hit stop, clear recovery. |
| Heavy/signature | Spends full Flow; unique silhouette and crowd-control function per hero. |
| Dodge | Brief invulnerability, visible afterimage, short cooldown instead of stamina. |
| Enemy tells | Pale wind-up → blood-red danger frame → impact. Never hide a tell under VFX. |
| Flow | Built by hits and close dodges; decays only outside combat. |
| Defeat | Immediate retry; retain tutorial knowledge, not combat power. |

### Hero kits

| Hero | Read | Light chain | Full-Flow signature | Playstyle |
|---|---|---|---|---|
| Zhao Yun | Lean, silver/white/red, Qinggang Jian | Fast forward cuts | **Azure Line** — piercing dash through marked foes | Precise all-rounder |
| Lu Zhishen | Broad, ochre/ink, monk’s spade | Wide, weighty sweeps | **Temple Bell** — ground shockwave and guard break | Crowd control |
| Hu Sanniang | Agile, crimson/jade, dual sabers | Mobile alternating cuts | **Moon Snare** — pull, cross-cut, disengage | High-risk mobility |
| Lü Bu | Heavy, black/gold/crimson, twin feathers | Long halberd arcs | **Sky Splitter** — delayed lane-cleave | Rival/power unlock |

## Encounter slice

- **Wave 1 — Read:** three bandits with staggered melee tells.
- **Wave 2 — Move:** two melee bandits plus an archer lane telegraph.
- **Wave 3 — Master:** elite guard whose armor must be broken by a signature.
- **Boss — Lü Bu:** two phases; wide halberd arcs, feather-led silhouette, no particle clutter over tells.
- **Boon choice:** after waves 1 and 2, choose one of three plain-language modifiers such as `+1 dash charge`, `last chain hit launches`, or `Flow no longer decays`.

## Art and audio direction

- Preserve the three character moods as accents, but unify the game with ink-black UI, paper neutrals, blood-red danger, jade success, and steel highlights.
- Build gameplay models from aligned front/side/back sheets, not hero art. At camera distance, prioritize body mass, weapon arc, cape/ribbon timing, and the one focal object.
- Target stylized PBR: 20–35k triangles per hero for the first slice, one 2K body atlas plus one 1K weapon atlas, two LODs, and a shared humanoid skeleton where anatomy allows.
- Use restrained percussion, xiao/dizi colors, low strings, weapon transients, and a distinct pre-impact cue. Do not use faux-Asian UI loops or constant orchestral saturation.

## Recommended tools and workflow

| Stage | Recommended tool | Deliverable | Exit gate |
|---|---|---|---|
| Prompt + reference | Existing prompt packs; optional Midjourney/Flux/Imagen for ideation | 6–12 silhouettes, canonical front, palette/motif board | One focal object; role reads at 128 px |
| Paint correction | Krita or Photoshop | Human-corrected front/side/back, face, weapon, material callouts | No AI cousin panels; carry logic works |
| Blockout | Blender | Scale-locked body and weapon blockout | Silhouette matches all orthos |
| Character sculpt | Blender or ZBrush | High-poly anatomy, cloth, armor separations | Anatomy and deformation review |
| Retopo + UV | Blender | Game mesh, UVs, LOD0/LOD1/LOD2 | Budget and clean deformation loops |
| Materials | Substance 3D Painter or ArmorPaint | PBR texture sets | Steel/cloth/leather read under neutral light |
| Rig + animation | Blender + Rokoko/Mixamo only as a starting point | Shared rig, locomotion, attacks, hit reacts | Root motion and weapon contacts reviewed by hand |
| Engine | Godot 4.x | PC-first vertical slice | Stable 60 fps on target mid-range hardware |
| Planning | GitHub Issues/Projects + Markdown ADRs | Backlog, acceptance criteria, decision log | Every task links to a playable outcome |
| Audio | Reaper + licensed/original libraries | Layered cues and mix snapshots | Tells remain audible in full mix |

**Why Godot:** the slice needs quick iteration, clean source control, lightweight exports, and no server dependency. Unreal is a valid later choice if the project prioritizes high-end rendering and has a larger technical-art team; do not switch engines during the vertical slice.

## Production workflow

1. **Lock design:** approve this combat contract, camera, target platform, and one arena greybox.
2. **Validate in 2D:** use the repository browser prototype to tune movement, hit timing, Flow gain, readability, and onboarding before 3D production.
3. **Build one hero end-to-end:** Zhao Yun only—from corrected orthos through rig and final in-engine attack chain. This exposes the full pipeline cheaply.
4. **Build enemy kit:** one shared bandit rig, melee and ranged variants, deterministic telegraphs, and pooled hit effects.
5. **Prove encounter:** wave director, boon choice, boss placeholder, result screen, keyboard/gamepad support.
6. **Scale the roster:** produce Lu Zhishen and Hu Sanniang; keep Lü Bu boss-first. Reuse systems, never blindly reuse silhouette or timing.
7. **Polish and test:** hit stop, camera impulse, audio layering, accessibility, performance capture, and external playtests.

### Eight-week prototype plan

- **Weeks 1–2:** combat greybox, camera, input map, target dummy, automated smoke scene.
- **Weeks 3–4:** Zhao kit, two enemies, Flow/signature, HUD, first playtest.
- **Weeks 5–6:** wave director, boons, Lü Bu boss greybox, gamepad and accessibility pass.
- **Weeks 7–8:** art/audio integration, optimization, onboarding, build packaging, ten-player test.

## Technical architecture

- `GameState`: run state, score, wave, pause, reset.
- `Actor`: health, team, hurtbox, status, movement contract.
- `Ability`: data-driven startup/active/recovery, damage, impulse, Flow cost/gain.
- `EnemyBrain`: finite states—approach, wind-up, attack, recover, stunned.
- `EncounterDirector`: wave definitions and completion signals.
- `Presentation`: pooled VFX, camera shake, hit stop, audio events; never owns damage logic.
- `Input`: action map abstracted from keyboard/gamepad/touch.

Keep combat values in resources/data rather than animation scripts. Record balance-relevant events in a lightweight debug log. Add deterministic unit tests for damage, invulnerability, Flow, wave completion, and reset behavior.

## Accessibility and safety

- Remappable controls, gamepad parity, reduced camera shake, reduced flashes, subtitle sizing, and color-independent enemy tells.
- Pause during boon choices; never require rapid tapping; offer 0.75× combat speed.
- Use public-domain literary characters, but verify that every *specific visual asset, recording, font, and modern adaptation reference* is licensed for commercial use before shipping.

## Current repository prototype

`prototype/` is a zero-build 2D combat toy for validating the core loop. It intentionally uses abstract arena actors plus the existing concept sheets as selection portraits; it is not the final art or engine architecture. Run `python3 -m http.server 8000` from the repository root and open `http://localhost:8000/prototype/`.
