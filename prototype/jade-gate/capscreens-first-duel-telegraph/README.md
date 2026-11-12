# First-duel telegraph — capscreens

Proof that the shipped rival telegraph sits on the choice. The first duel shows the rival's next move and the exact damage from `combat.intent()` before an action. No public hosted URL was verified on 12 Nov 2026.

Local path:

```bash
cd prototype/jade-gate
npm test
npm run check
python3 serve.py   # http://127.0.0.1:8765
```

| # | File | What it shows |
|---|------|----------------|
| 1 | `01-before-choice.png` | Fresh first duel, Japanese default, tutor still up. Gold readout: 武器攻撃 · ダメージ12, directly above the action buttons. Hero health 120/120. |
| 2 | `02-after-guard.png` | Guard resolves the same 12 through the existing rule (80% blocked). Health 118/120, journal 「武器攻撃：2ダメージ」, next engine telegraph 強攻撃 · ダメージ22. |
| 3 | `03-reduced-motion-before.png` | Menu shows 演出：控えめ. Same opening telegraph, ダメージ12, health 120/120. Tutor and 予告編 link still present. |
| 4 | `04-reduced-motion-after-guard.png` | Reduced motion still commits Guard as 2 damage. Health 118/120, journal 2ダメージ, next telegraph ダメージ22. |

Damage numbers are the engine's. The box is paint: contrast, placement above the buttons, and a larger first-duel size. Reduced motion does not change the turn or the damage.
