# Generation prompt — modeler handoff · Zhao Yun (赵云)

- **Purpose:** the strictest A–G sheet for 3D blockout, rigging, and materials
- **Method:** reference-locked plates → human correction → manual composite; never a one-shot multi-character sheet

## Creative target

Design for men aged 20–30 who respond to mastery, danger, readable combat roles, and aspirational young-adult heroes. Earn appeal through confident posture, athletic anatomy, credible equipment, restrained detail, and a strong gameplay silhouette—not gore, sexualization, visual noise, or copied modern adaptations. This is a fresh interpretation of a public-domain literary figure.

## Non-negotiable identity

- **Character:** Zhao Yun (赵云)
- **Physique:** young adult, about 20, lean athletic swordsman; long clean leg-to-torso ratio and compact shoulders.
- **Art direction:** hard-stylized classical wuxia combat RPG.
- **Only primary focal object:** Qinggang Jian (青釭剑), drawn and held in both combat and hero views.
- **Quiet supporting language:** simplified dragon pauldrons and a short white cape; silver, warm white, ink, and one restrained blood-red accent.
- **Attitude:** calm forward pressure, blade line leading the eye.
- **Material truth:** tempered steel blade / rigid; lamellar armor / rigid; woven cape / soft; leather suspension / flexible.
- **Reject:** no spear, no spear-tip callout, no second sword identity, no middle-aged general, no European plate, no sci-fi glow; no chibi, teen, soft idol lighting, fake calligraphy, logos, UI screenshots, modern clothing, or modern copyrighted adaptation likeness.

## Plate set

1. Generate and approve the **front A-pose** with a neutral 70–85 mm-equivalent lens and both feet on one baseline.
2. Feed that approved plate back as the identity reference for **left side** and **true back**. Do not let the model redesign unseen areas: describe closures and carry points first.
3. Generate the **hero pose last**, preserving the exact build and equipment.
4. Create the silhouette by manually filling the approved hero pose solid black; do not prompt for a decorative shadow.
5. Draw or photograph material samples separately; do not use generated labels.

## Copy-ready plate prompt

```text
3D-modeler-ready [FRONT / LEFT SIDE / TRUE BACK / HERO] plate, one full-body figure only: Zhao Yun (赵云). young adult, about 20, lean athletic swordsman; long clean leg-to-torso ratio and compact shoulders. hard-stylized classical wuxia combat RPG. Exact identity reference lock: identical face, anatomy, costume pattern pieces, seams, closures, colors, damage, and equipment dimensions in every plate. Primary focal object only: Qinggang Jian (青釭剑), drawn and held in both combat and hero views. Supporting language kept quiet: simplified dragon pauldrons and a short white cape; silver, warm white, ink, and one restrained blood-red accent. Physically credible construction and weight distribution. calm forward pressure, blade line leading the eye. Materials: tempered steel blade / rigid; lamellar armor / rigid; woven cape / soft; leather suspension / flexible. Flat #f3ead7 background, neutral exposure, complete feet and equipment, generous clear margin, no cast shadow for orthographic plates, no lettering or graphic layout. Adult combat appeal for ages 20–30: mastery, danger, restraint, and readable power.

Negative prompt: no spear, no spear-tip callout, no second sword identity, no middle-aged general, no European plate, no sci-fi glow; identity drift, alternate outfit, extra props, extra fingers, floating straps, fused layers, impossible scabbard, hidden feet, cropped weapon, perspective distortion, scenery, VFX, fake calligraphy, watermark, logo.
```

## Handoff checklist

- [ ] Silhouette reads at 128 px and contains exactly one dominant focal object.
- [ ] Front/side/back share height, landmarks, and weapon measurements.
- [ ] Every layer has an attachment, closure, thickness, and deformation rule.
- [ ] The weapon has grip diameter, total length, edge direction, and carry position.
- [ ] Callouts identify `tempered steel blade / rigid; lamellar armor / rigid; woven cape / soft; leather suspension / flexible`.
- [ ] Face and body read about 20, neither teen nor middle-aged.
- [ ] A new three-quarter reconstruction matches without invention.
