# WU-CAM-11 — Restore Jack bamboo roam art (natural grass/tree)

Proof pack for wiring Art Dir natural WORLD plate over the rejected maze roam look.

**Story:** WU-CAM-11 / #82  
**Base tip:** `8b950fda`  
**Plate:** `assets/bamboo-roam.png` (2560×1440) from Art Dir handoff  
`/workspace/deliverables/wu-cam-11-bamboo-roam-2026-10-01/` · Jev PASS_WITH_NOTES (jev-1.13.0)

WORLD geometry / soft camera / blockers / spawn unchanged. Act unlocks and duel arenas untouched. `bamboo-maze.png` remains in tree/preload but is **not** the live roam backdrop.

## Ordered capscreens

| # | File | Beat |
|---|------|------|
| 1 | `01-bamboo-roam-origin.png` | Roam origin — natural bamboo grove plate (`ROAM_BACKDROP=bamboo-roam`) |
| 2 | `02-bamboo-roam-scrolled.png` | Soft camera scrolled into WORLD (backgroundPosition moved; blockers/spawn readable) |
| 3 | `03-bamboo-roam-full-ui.png` | Full UI — party HUD + d-pad + roam stage on natural plate |

## History mood refs (not final ship plate)

- Jack preferred sense: `assets/bamboo-river.png` @ `58f148f5`
- Rejected maze wire: `70a819a5` / #67 hardcoded `ROAM_BACKDROP = assets/bamboo-maze.png`

## Verify

```bash
cd prototype/jade-gate
npm test
npm run check
```
