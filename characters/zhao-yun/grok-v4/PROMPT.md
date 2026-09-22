# Generation prompt — production sheet · Zhao Yun (赵云)

- **Purpose:** production reference; do not ask one generation to invent every angle
- **Canvas:** 16:9 sheet only after separately approved plates are composited

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

## Canonical plate prompt

Replace `[VIEW]` with `front neutral A-pose`, `exact left side neutral pose`, `true back neutral A-pose`, or `three-quarter combat pose`. Generate each view separately, using the approved front image as the identity reference.

```text
Single production character plate on a flat warm-paper background, no layout decoration, no text. [VIEW] of Zhao Yun (赵云); young adult, about 20, lean athletic swordsman; long clean leg-to-torso ratio and compact shoulders; hard-stylized classical wuxia combat RPG. Preserve exactly the same face, hairline, body proportions, garment seams, fasteners, colors, weapon dimensions, and wear pattern across every view. Only primary focal object: Qinggang Jian (青釭剑), drawn and held in both combat and hero views. Quiet support: simplified dragon pauldrons and a short white cape; silver, warm white, ink, and one restrained blood-red accent. Neutral orthographic lens for construction views, complete figure and equipment inside frame, even neutral studio light, minimal cast shadow, no perspective exaggeration. Materials must read distinctly: tempered steel blade / rigid; lamellar armor / rigid; woven cape / soft; leather suspension / flexible. Fresh public-domain interpretation for an adult 20–30 combat-game audience.

Negative prompt: no spear, no spear-tip callout, no second sword identity, no middle-aged general, no European plate, no sci-fi glow; different person, cousin face, changed costume, changed weapon, asymmetry migration, dramatic crop, foreshortening in orthographic views, action VFX, scenery, labels, fake writing, watermark, logo.
```

## Composite specification

Build the final sheet by hand in this fixed order: **A)** true flat-black silhouette of the hero pose, **B)** front, **C)** side, **D)** true back, **E)** smaller hero pose, **F)** three construction callouts, **G)** shared height bar. Align eyes, floor, and scale across B–D. Label only known facts: `tempered steel blade / rigid; lamellar armor / rigid; woven cape / soft; leather suspension / flexible`. Keep the focal object highest in contrast; all typography is added during compositing, never generated.

## Consistency gate

Overlay B–D at 50% opacity. Reject if head height, shoulders, waist, knees, weapon length, attachment points, or costume topology drift. A modeler must be able to reconstruct a new three-quarter view without guessing.
