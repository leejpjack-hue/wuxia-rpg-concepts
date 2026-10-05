# Animation image request pack / 兩集動畫素材清單

Prepared 5 October 2026 from `animation.js` at commit **5f1ca74**. GitHub was fetched before this review; local main matched the fetched main. This is a generation plan, not generated artwork or a change to the animation player.

Open [the searchable prompt catalog](index.html), [Episode 1 list](ep1-list.md), or [Episode 2 list](ep2-list.md). Download [all prompts as ZIP](all-prompts.zip). Every request has its own complete English prompt, reference filenames, proposed output filename, and motion notes. The JSON inventory is [requests.json](requests.json); the exact source-shot mapping is [shot-map.csv](shot-map.csv).

## What was reviewed

- Episode 1, **破帝**: 23:30, 16 scenes, 78 camera shots.
- Episode 2, **裂口 · 廿賢殿**: 19:00, 13 scenes, 50 camera shots.
- The source timeline, all 37 referenced character ready sprites, and saved animation captures covering close-ups, fights, the village and the final reveal.
- This review did not replay every second of both episodes. The coverage map comes from the complete exported timeline, including automatically derived shots.

## Why the present images feel wrong

1. **Close-ups are enlarged full-body art.** The player enlarges portraits to roughly 260–440% and estimates the head from alpha coverage. A spear, crown or hair plume can become the highest opaque point; an opaque PNG includes the background in the scan, and JPEGs fall back to a guessed center. These are not reliable eye anchors. A new purpose-drawn close-up also needs an explicit eye anchor when it is integrated.
2. **Changing position does not change angle.** Moving a portrait left/right or horizontally flipping a rival cannot produce a new three-quarter face, profile, back view or correct foreshortening. Reverse shots need actual drawings from the required camera.
3. **Fight phases reuse the same art.** Impact, pass, hold and aftermath currently reuse strike/wind-up images. This makes sliding figures and repeated attack poses. Each fight in this pack has seven distinct drawings with an explicit nonlethal or final outcome.
4. **Six backdrops serve 29 scenes.** A bamboo map stands in for a village and street; an outdoor maze stands in for an interior screen labyrinth; a mountain courtyard stands in for a bridge. The pack provides 25 location/light plates.
5. **Identity changes between asset families.** Several gallery JPEGs and ready sprites have different clothing and face treatment. Zhao Min is a clear example: white-jacket portrait versus black/ivory martial ready body. The pack proposes the reviewed ready sprite as the animation costume reference and a newly approved face portrait as the face reference.

## Contents — 389 individual image requests

| Type | Requests | Purpose |
|---|---:|---|
| Identity portraits | 39 | 37 existing cast members, plus the missing sister flashback and village master |
| Environment plates | 25 | Correct place, eye-level perspective and lighting |
| Existing shot keyframes | 128 | One mapped request for every existing camera shot |
| Speaking / blinking variants | 90 | Open mouth and closed eyes for each of 45 close-up bases |
| Additional fight phases | 84 | Six new phases for each of 14 fight bases; 98 fight keyframes including standoffs |
| Proposed story inserts | 22 | Missing story actions and objects, tied to existing narrative beats |
| Jade reference | 1 | One matching design for both pendant halves |

These are **keyframes for limited animation**, not 42 minutes of fully animated footage. Smooth action still needs in-between drawings, timing, compositing and sound/lip synchronization. A face with three states gives simple speech/blinks; it does not provide phoneme-complete lip sync. Do the first batch below before generating the whole inventory.

## First batch — prove one conversation and one fight

Generate in this order. Use the links as copyable request sheets.

1. [Zhao Yun identity](prompts/id-zhao-yun.txt) and [Zhao Min identity](prompts/id-zhao-min.txt). Approve the faces before continuing.
2. [Cloud bridge plate](prompts/bg-bridge.txt).
3. [Zhao Min bridge close-up](prompts/ep2-causeway-s01.txt), [speaking variant](prompts/ep2-causeway-s01-talk.txt), and [blink](prompts/ep2-causeway-s01-blink.txt).
4. [Zhao Yun reverse close-up](prompts/ep2-causeway-s04.txt).
5. [Bridge standoff](prompts/ep2-causeway-s05.txt), [wind-up](prompts/ep2-causeway-s05-windup.txt), [charge](prompts/ep2-causeway-s05-charge.txt), [impact](prompts/ep2-causeway-s05-impact.txt), [pass](prompts/ep2-causeway-s05-pass.txt), [hold](prompts/ep2-causeway-s05-hold.txt), [aftermath](prompts/ep2-causeway-s05-aftermath.txt).

This is a **14-image pilot**. The final frame must show Zhao Yun surviving the lost opening exchange. Once these images match, continue with the other identities and scenes. `P0` means visually urgent, not independent of the references listed on the request.

## Decisions to lock before spending generation time

These are proposed animation continuity choices, not silent changes to the game or script.

| Conflict | Default used in these prompts | Approval / alternative |
|---|---|---|
| Zhao Yun's script repeatedly says Qinggang sword; ready/attack art shows a spear | Preserve face and silver/white/jade costume; use **one straight jian** for this animation | If you prefer the spear, update the script and all weapon/contact prompts together before generation |
| Gallery images and ready sprites differ | Ready sprite controls costume; approved new identity portrait controls face | Do not mix both outfits within a scene |
| Zhao Min is the lost sister in this particular story | Adult bridge keeper retains current ready outfit; flashback sister gets modest village clothing | Flashback design is new and must be approved; preserve familial resemblance, not the adult battle outfit |
| Night Heron's narration uses female pronouns, while the sprite alone is ambiguous | Preserve the approved blindfolded musician identity; no invented visible eyes | Confirm the character design/pronouns together before regenerating this identity |
| Crossing narration mentions a drum heroine, while cast is Wu Song / Sun Shangxiang / Qin Liangyu | Follow the actual cast IDs | If the intended heroine is Liang Hongyu, revise the cast mapping first |
| Kuang Zhong / 匡忠 spelling, “懿妃” mapped to `empress-yixiu`, Lin Daiyu's hoe versus fan, and other literary prop differences | Preserve source IDs and reviewed outfit/weapon references; flag narration for editorial review | A generation model should not resolve identity or naming ambiguity for you |
| Source ending and “twenty” lore | Follow the actual episode story, including the brother/sister reveal | This is the game's fictional adaptation, not a claim about the historical or literary people |

## How to generate / 生成方法

1. **Open a request and attach the listed references.** `existing` means the reference exists in the game folder. `generate-and-approve-first` is a dependency, not an existing file. Paths in prompts do not make an image model read your computer: attach the files manually.
2. **Approve one face per character.** `identity/id-*.png` is the canonical front face. Compare eyebrows, eyes, nose, jaw, hairline, age, ornaments and asymmetry. If the source sprite is too small to resolve a feature, treat the result as a proposed design and approve it explicitly before continuing.
3. **Generate the scene plate**, then the shot base. For each shot attach the approved identity portrait, original ready sprite for costume, and approved background. For group shots keep references clearly named by character; never rely on the order of unnamed attachments.
4. **Generate variants as edits of the approved base.** For mouth/blink frames attach the base close-up. Change only mouth or eyelids. For fights attach the standoff plus the same identity references. One request produces one image; do not ask for a contact sheet and crop it afterward.
5. **Save with the proposed filename.** All new runtime candidates are under `assets/animation/`. The pack itself lives under `docs/`; no existing game art needs to be overwritten. Keep original generated files and record the exact prompt and reference version.
6. **Review before the next batch.** Reject drift now rather than generating dozens of variants from an incorrect face. Return the approved files with their names intact so the player can be wired to them.

## Export and framing contract

- Shot keyframes, expressions, combat frames and backgrounds: **2560×1440, 16:9, opaque PNG**. If the generator cannot produce this exact size, choose its closest landscape output, retain overscan, then export to the same final 16:9 canvas without stretching. All variants of one shot must have the same final dimensions.
- Identity and prop references: **1536×1536**, one subject/reference composition, no labels. These are production references, not runtime close-ups to enlarge.
- Leave the lower 16% quiet for subtitles; do not bake subtitles, names, UI, letterbox bars or generated writing into the art. Put readable decree text into HTML later.
- Close-ups show full hair crown and chin with eyes around the upper third. A reverse shot has a newly drawn angle; never “fix” it with a mirror flip that changes jewelry or sword hands.
- Use consistent lens, horizon and light within each shot family. During a fight keep both actors' feet on one ground plane. A change from front to back view requires a new pose drawing.
- For layered parallax, derive foreground/character cutouts from an approved composition with actual alpha and export a matching clean plate. Keep the original canvas size and anchors. Do not independently recenter cutouts or regenerate the face during background removal. The primary inventory supplies full-frame drawings; layer extraction is an additional compositing step.

## Motion handoff — making the drawings move

- **Conversation:** use the closed-mouth base, small open-mouth variant and blink; breathing should be subtle. Add more mouth shapes only when there is recorded dialogue to synchronize. Avoid periodic mouth motion during silence.
- **Combat:** seven phases are planning poses. The existing phase durations are 3.0 / 2.0 / 0.7 / 0.4 / 1.4 / 2.4 / 2.8 seconds. Do not spread seven still frames evenly over that duration. Add in-betweens for charge, contact and recovery; hold anticipation and aftermath deliberately. An impact flash is brief and follows the chosen accessibility setting.
- **In-between prompt:** “Using attached approved keyframe A and B, draw exactly one intermediate frame at [25%, 50%, or 75%] of the movement from A to B. Preserve the fixed camera, character identities, costume, weapon length, lighting and floor. Follow the specified joint and weapon arcs; do not dissolve or blend the bodies. Keep A's original canvas registration. Draw one frame only, no montage.” Generate each position separately; review motion direction and overlap before continuing.
- **Long narration:** the current 42:30 runtime contains long holds. Use the 22 inserts and reaction cuts to cover story information. More stills alone will not make a 20-second held portrait feel like an animated performance.
- **Player integration remains necessary:** the current player looks for old portrait/sprite/duel filenames. Files under the new folder will not load automatically. Bind requests using `episode + scene + shotIndex`, load expressions/phase frames, and replace guessed face scanning with approved anchor data.

Suggested future asset record (all coordinates are normalized **source-image** coordinates, not CSS object-position values):

```json
{
  "episode": "ep2", "scene": "causeway", "shotIndex": 1,
  "file": "assets/animation/shot/ep2-causeway-s01.png",
  "characterId": "zhao-min", "lookDirection": "screen-left",
  "eyeAnchor": {"x": 0.62, "y": 0.33},
  "canvas": {"width": 2560, "height": 1440},
  "approved": false,
  "expressionFiles": {
    "talk": "assets/animation/expression/ep2-causeway-s01-talk.png",
    "blink": "assets/animation/expression/ep2-causeway-s01-blink.png"
  }
}
```

The anchor above is an example target, **not a measurement of generated art**. Measure it on the approved result. Record full-body foot anchors separately for character layers.

## Acceptance checklist

- Same face, age, hairstyle, clothing, dominant hand and weapon across adjacent frames.
- No clipping, floating feet, anatomy errors, black “transparent” rectangles or pasted-image lighting.
- Camera direction and eye-line match the partner, with no unexplained axis crossing.
- Mouth/blink frame overlays the base without head or background jitter.
- The jade fracture matches from the village handover to the reunion.
- Guan Yu, Night Heron, Lu Bu and Zhao Min survive their specified defeats; only the final Sovereign event uses ink dissolution.
- The sister recognition and farewell remain family scenes.

## Rebuilding and coverage

`source-storyboard.json` is a frozen export of `EPISODES` with `shotsOf(scene)` already resolved. `build-pack.py` generates the request files and enforces 128 mapped shots, unique request IDs, real existing-reference paths and valid dependency paths. If the script changes, export the new timeline and review the scene descriptions and conflict decisions before rebuilding. Do not blindly preserve shot numbers across a rewritten episode.
