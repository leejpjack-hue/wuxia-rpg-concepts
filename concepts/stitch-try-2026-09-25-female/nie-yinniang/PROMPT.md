# Generation prompt — modeler handoff · Nie Yinniang (聂隐娘)

- **Purpose:** the strictest A–G sheet for 3D blockout, rigging, and materials
- **Method:** reference-locked plates → human correction → manual composite; never a one-shot multi-character sheet
- **Reference grammar:** `characters/hu-sanniang/stitch-v4/PROMPT.md` (Codex fine-tune branch)

## Creative target

Design for men aged 20–30 who respond to mastery, danger, readable combat roles, and aspirational young-adult heroes. Earn appeal through confident posture, athletic anatomy, credible equipment, restrained detail, and a strong gameplay silhouette—not gore, sexualization, visual noise, or copied modern adaptations. Fresh PD interpretation of the Tang assassin from 《聂隐娘》.

## Non-negotiable identity

- **Character:** Nie Yinniang (聂隐娘)
- **Physique:** young adult woman, about 20, assassin-assassin athlete; compact explosive frame, long forearms, light feet, elegant without pin-up distortion.
- **Art direction:** clean anime-gufeng translated into a serious classical combat RPG (lean ink-night mood OK).
- **Only primary focal object:** Concealed short sword / 短剑 — one blade that owns the silhouette (drawn or mid-draw).
- **Quiet supporting language:** dark traveler cloak; one leather wrist wrap; night charcoal, cold steel, muted indigo, warm ivory trim.
- **Attitude:** coiled stillness, weight on balls of feet, blade edge catching light — strike from silence.
- **Material truth:** sword steel / rigid; leather scabbard / flexible; cloak wool / soft; metal fittings / hard.
- **Reject:** no cute idol, no lingerie armor, no high heels, no oversized breasts, no sci-fi, no magical mist replacing the blade; no Hu Sanniang remake; no chibi, teen, soft idol lighting, fake calligraphy, logos, UI, modern clothing, modern copyrighted likeness.

## Plate set

1. Front A-pose, 70–85 mm-equivalent, both feet on one baseline.
2. Approved plate → left side + true back; describe scabbard hang, cloak clasp, wrap knots first.
3. Hero pose last (mid-draw or thrust).
4. Manual solid-black silhouette from approved hero pose.
5. Material samples separate.

## Copy-ready plate prompt

```text
3D-modeler-ready [FRONT / LEFT SIDE / TRUE BACK / HERO] plate, one full-body figure only: Nie Yinniang (聂隐娘). young adult woman, about 20, blade-assassin athlete; compact explosive frame, long forearms, light feet, elegant without pin-up distortion. clean anime-gufeng translated into a serious classical combat RPG with lean ink-night mood. Exact identity reference lock: identical face, anatomy, costume pattern pieces, seams, closures, colors, damage, and equipment dimensions in every plate. Primary focal object only: concealed short sword / 短剑 that dominates the silhouette. Supporting language kept quiet: dark traveler cloak; one leather wrist wrap; night charcoal, cold steel, muted indigo, warm ivory trim. Physically credible construction and weight distribution. coiled stillness, weight on balls of feet, blade edge catching light. Materials: sword steel / rigid; leather scabbard / flexible; cloak wool / soft; metal fittings / hard. Flat #f3ead7 background, neutral exposure, complete feet and equipment, generous clear margin, no cast shadow for orthographic plates, no lettering or graphic layout. Adult combat appeal for ages 20–30: mastery, danger, restraint, and readable power.

Negative prompt: no cute idol expression, no lingerie armor, no high heels, no oversized breasts, no sci-fi, no magical mist replacing the blade; identity drift, alternate outfit, extra props, extra fingers, floating straps, fused layers, impossible scabbard, hidden feet, cropped weapon, perspective distortion, scenery, VFX, fake calligraphy, watermark, logo; no Hu Sanniang remake.
```

## Handoff checklist

- [ ] Silhouette at 128 px reads the short sword as the one dominant focus.
- [ ] Front/side/back share height, landmarks, weapon measurements.
- [ ] Callouts: `sword steel / rigid; leather scabbard / flexible; cloak wool / soft; metal fittings / hard`.
- [ ] Age reads ~20.
- [ ] Three-quarter reconstruction matches without invention.
