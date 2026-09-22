# Generation prompt — modeler handoff · Hu Sanniang (扈三娘)

- **Purpose:** the strictest A–G sheet for 3D blockout, rigging, and materials
- **Method:** reference-locked plates → human correction → manual composite; never a one-shot multi-character sheet

## Creative target

Design for men aged 20–30 who respond to mastery, danger, readable combat roles, and aspirational young-adult heroes. Earn appeal through confident posture, athletic anatomy, credible equipment, restrained detail, and a strong gameplay silhouette—not gore, sexualization, visual noise, or copied modern adaptations. This is a fresh interpretation of a public-domain literary figure.

## Non-negotiable identity

- **Character:** Hu Sanniang (扈三娘)
- **Physique:** young adult woman, about 20, agile combat athlete; long mobile limbs, strong hips and shoulders, elegant without pin-up distortion.
- **Art direction:** clean anime-gufeng translated into a serious classical combat RPG.
- **Only primary focal object:** Sun-and-Moon Dual Sabers / 日月双刀, matched blades that dominate the silhouette.
- **Quiet supporting language:** capture lasso stowed flat on the back and one jade fastening motif; crimson, charcoal, warm ivory, and restrained jade.
- **Attitude:** predatory lateral footwork, blade edges clear, poised to cross-cut.
- **Material truth:** saber steel / rigid; leather grips / flexible; layered silk / soft; jade clasp / hard.
- **Reject:** no cute idol expression, no lingerie armor, no high heels, no magical ribbon replacing the lasso, no oversized breasts, no sci-fi; no chibi, teen, soft idol lighting, fake calligraphy, logos, UI screenshots, modern clothing, or modern copyrighted adaptation likeness.

## Plate set

1. Generate and approve the **front A-pose** with a neutral 70–85 mm-equivalent lens and both feet on one baseline.
2. Feed that approved plate back as the identity reference for **left side** and **true back**. Do not let the model redesign unseen areas: describe closures and carry points first.
3. Generate the **hero pose last**, preserving the exact build and equipment.
4. Create the silhouette by manually filling the approved hero pose solid black; do not prompt for a decorative shadow.
5. Draw or photograph material samples separately; do not use generated labels.

## Copy-ready plate prompt

```text
3D-modeler-ready [FRONT / LEFT SIDE / TRUE BACK / HERO] plate, one full-body figure only: Hu Sanniang (扈三娘). young adult woman, about 20, agile combat athlete; long mobile limbs, strong hips and shoulders, elegant without pin-up distortion. clean anime-gufeng translated into a serious classical combat RPG. Exact identity reference lock: identical face, anatomy, costume pattern pieces, seams, closures, colors, damage, and equipment dimensions in every plate. Primary focal object only: Sun-and-Moon Dual Sabers / 日月双刀, matched blades that dominate the silhouette. Supporting language kept quiet: capture lasso stowed flat on the back and one jade fastening motif; crimson, charcoal, warm ivory, and restrained jade. Physically credible construction and weight distribution. predatory lateral footwork, blade edges clear, poised to cross-cut. Materials: saber steel / rigid; leather grips / flexible; layered silk / soft; jade clasp / hard. Flat #f3ead7 background, neutral exposure, complete feet and equipment, generous clear margin, no cast shadow for orthographic plates, no lettering or graphic layout. Adult combat appeal for ages 20–30: mastery, danger, restraint, and readable power.

Negative prompt: no cute idol expression, no lingerie armor, no high heels, no magical ribbon replacing the lasso, no oversized breasts, no sci-fi; identity drift, alternate outfit, extra props, extra fingers, floating straps, fused layers, impossible scabbard, hidden feet, cropped weapon, perspective distortion, scenery, VFX, fake calligraphy, watermark, logo.
```

## Handoff checklist

- [ ] Silhouette reads at 128 px and contains exactly one dominant focal object.
- [ ] Front/side/back share height, landmarks, and weapon measurements.
- [ ] Every layer has an attachment, closure, thickness, and deformation rule.
- [ ] The weapon has grip diameter, total length, edge direction, and carry position.
- [ ] Callouts identify `saber steel / rigid; leather grips / flexible; layered silk / soft; jade clasp / hard`.
- [ ] Face and body read about 20, neither teen nor middle-aged.
- [ ] A new three-quarter reconstruction matches without invention.
