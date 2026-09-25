# Generation prompt — modeler handoff · Mu Guiying (穆桂英)

- **Purpose:** the strictest A–G sheet for 3D blockout, rigging, and materials
- **Method:** reference-locked plates → human correction → manual composite; never a one-shot multi-character sheet
- **Reference grammar:** `characters/hu-sanniang/stitch-v4/PROMPT.md` (Codex fine-tune branch)

## Creative target

Design for men aged 20–30 who respond to mastery, danger, readable combat roles, and aspirational young-adult heroes. Earn appeal through confident posture, athletic anatomy, credible equipment, restrained detail, and a strong gameplay silhouette—not gore, sexualization, visual noise, or copied modern adaptations. This is a fresh interpretation of a public-domain literary figure (Yang family general).

## Non-negotiable identity

- **Character:** Mu Guiying (穆桂英)
- **Physique:** young adult woman, about 20, cavalry-trained combat athlete; long powerful legs, strong core and shoulders, commanding without pin-up distortion.
- **Art direction:** clean anime-gufeng translated into a serious classical combat RPG.
- **Only primary focal object:** Pear-Blossom Spear / 梨花枪 — one long spear that owns the silhouette (blade + tassel readable at thumbnail).
- **Quiet supporting language:** light cavalry lamellar on torso only; one phoenix/plum motif on belt or vambrace; crimson, charcoal, warm ivory, muted gold.
- **Attitude:** forward-driving spear line, planted rear foot, ready to thrust-and-sweep.
- **Material truth:** spear steel / rigid; hardwood shaft / stiff; silk tassel / soft; leather grips / flexible; lamellar / hard.
- **Reject:** no cute idol expression, no lingerie armor, no high heels, no floating ribbons as weapons, no oversized breasts, no sci-fi; no remake of Hu Sanniang / Zhao Yun / Lu Zhishen / Lü Bu; no chibi, teen, soft idol lighting, fake calligraphy, logos, UI, modern clothing, or modern copyrighted adaptation likeness.

## Plate set

1. Generate and approve the **front A-pose** with a neutral 70–85 mm-equivalent lens and both feet on one baseline.
2. Feed that approved plate back as the identity reference for **left side** and **true back**. Describe spear carry, closures, and belt first.
3. Generate the **hero pose last**, preserving the exact build and equipment.
4. Create the silhouette by manually filling the approved hero pose solid black; do not prompt for a decorative shadow.
5. Draw or photograph material samples separately; do not use generated labels.

## Copy-ready plate prompt

```text
3D-modeler-ready [FRONT / LEFT SIDE / TRUE BACK / HERO] plate, one full-body figure only: Mu Guiying (穆桂英). young adult woman, about 20, cavalry-trained combat athlete; long powerful legs, strong core and shoulders, commanding without pin-up distortion. clean anime-gufeng translated into a serious classical combat RPG. Exact identity reference lock: identical face, anatomy, costume pattern pieces, seams, closures, colors, damage, and equipment dimensions in every plate. Primary focal object only: Pear-Blossom Spear / 梨花枪, one long spear that dominates the silhouette. Supporting language kept quiet: light cavalry lamellar on torso only; one phoenix/plum motif on belt or vambrace; crimson, charcoal, warm ivory, muted gold. Physically credible construction and weight distribution. forward-driving spear line, planted rear foot, ready to thrust-and-sweep. Materials: spear steel / rigid; hardwood shaft / stiff; silk tassel / soft; leather grips / flexible; lamellar / hard. Flat #f3ead7 background, neutral exposure, complete feet and equipment, generous clear margin, no cast shadow for orthographic plates, no lettering or graphic layout. Adult combat appeal for ages 20–30: mastery, danger, restraint, and readable power.

Negative prompt: no cute idol expression, no lingerie armor, no high heels, no floating ribbons as weapons, no oversized breasts, no sci-fi; identity drift, alternate outfit, extra props, extra fingers, floating straps, fused layers, impossible scabbard, hidden feet, cropped weapon, perspective distortion, scenery, VFX, fake calligraphy, watermark, logo; no Hu Sanniang remake.
```

## Handoff checklist

- [ ] Silhouette reads at 128 px and contains exactly one dominant focal object (spear).
- [ ] Front/side/back share height, landmarks, and weapon measurements.
- [ ] Every layer has an attachment, closure, thickness, and deformation rule.
- [ ] The spear has grip zones, total length, tip direction, and carry position.
- [ ] Callouts identify `spear steel / rigid; hardwood shaft / stiff; silk tassel / soft; leather grips / flexible; lamellar / hard`.
- [ ] Face and body read about 20, neither teen nor middle-aged.
- [ ] A new three-quarter reconstruction matches without invention.
