# Generation prompt — modeler handoff · Liang Hongyu (梁红玉)

- **Purpose:** the strictest A–G sheet for 3D blockout, rigging, and materials
- **Method:** reference-locked plates → human correction → manual composite; never a one-shot multi-character sheet
- **Reference grammar:** `characters/hu-sanniang/stitch-v4/PROMPT.md` (Codex fine-tune branch)

## Creative target

Design for men aged 20–30 who respond to mastery, danger, readable combat roles, and aspirational young-adult heroes. Earn appeal through confident posture, athletic anatomy, credible equipment, restrained detail, and a strong gameplay silhouette—not gore, sexualization, visual noise, or copied modern adaptations. Fresh PD interpretation of the Song-era general famed at Huangtiandang.

## Non-negotiable identity

- **Character:** Liang Hongyu (梁红玉)
- **Physique:** young adult woman, about 20, drum-corps commander build; strong shoulders and forearms, stable hips, athletic without pin-up distortion.
- **Art direction:** clean anime-gufeng translated into a serious classical combat RPG.
- **Only primary focal object:** Matched battle sabers / 双刀 — two short sabers that dominate the silhouette (drum is secondary, quiet).
- **Quiet supporting language:** war drum + beaters stowed or grounded behind her (never equal primary); naval-officer sash; deep red, charcoal, warm ivory, brass.
- **Attitude:** wide stance, sabers crossed or mid-parry, issuing tempo — commander who still cuts.
- **Material truth:** saber steel / rigid; leather grips / flexible; lacquered drum / hard; cloth sash / soft; brass fittings / hard.
- **Reject:** no cute idol, no lingerie armor, no high heels, no oversized breasts, no sci-fi; no Hu Sanniang remake; no chibi, teen, soft idol lighting, fake calligraphy, logos, UI, modern clothing, modern copyrighted likeness.

## Plate set

1. Front A-pose, 70–85 mm-equivalent, both feet on one baseline.
2. Approved plate → left side + true back; describe saber scabbards, sash knot, drum carry first.
3. Hero pose last.
4. Manual solid-black silhouette from approved hero pose.
5. Material samples separate — no generated labels.

## Copy-ready plate prompt

```text
3D-modeler-ready [FRONT / LEFT SIDE / TRUE BACK / HERO] plate, one full-body figure only: Liang Hongyu (梁红玉). young adult woman, about 20, drum-corps commander build; strong shoulders and forearms, stable hips, athletic without pin-up distortion. clean anime-gufeng translated into a serious classical combat RPG. Exact identity reference lock: identical face, anatomy, costume pattern pieces, seams, closures, colors, damage, and equipment dimensions in every plate. Primary focal object only: matched battle sabers / 双刀 that dominate the silhouette. Supporting language kept quiet: war drum + beaters stowed or grounded behind her, naval-officer sash; deep red, charcoal, warm ivory, brass. Physically credible construction and weight distribution. wide stance, sabers crossed or mid-parry, issuing tempo. Materials: saber steel / rigid; leather grips / flexible; lacquered drum / hard; cloth sash / soft; brass fittings / hard. Flat #f3ead7 background, neutral exposure, complete feet and equipment, generous clear margin, no cast shadow for orthographic plates, no lettering or graphic layout. Adult combat appeal for ages 20–30: mastery, danger, restraint, and readable power.

Negative prompt: no cute idol expression, no lingerie armor, no high heels, no oversized breasts, no sci-fi; identity drift, alternate outfit, extra props, extra fingers, floating straps, fused layers, impossible scabbard, hidden feet, cropped weapon, perspective distortion, scenery, VFX, fake calligraphy, watermark, logo; drum must not outrank sabers; no Hu Sanniang remake.
```

## Handoff checklist

- [ ] Silhouette at 128 px reads sabers as the one dominant focus.
- [ ] Front/side/back share height, landmarks, weapon measurements.
- [ ] Drum is clearly secondary if present.
- [ ] Callouts: `saber steel / rigid; leather grips / flexible; lacquered drum / hard; cloth sash / soft; brass fittings / hard`.
- [ ] Age reads ~20.
- [ ] Three-quarter reconstruction matches without invention.
