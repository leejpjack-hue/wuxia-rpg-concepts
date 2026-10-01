# Expansion image generation status

1 October 2026. Built-in image generation (Codex GPT-6.1-Sol / high) produced 36 of 36 required images. Remaining deferred: 0.

Generated assets are registered in `asset-manifest.json` and copied into `assets/`. Transparent sprites and icons keep their native alpha; charcoal portraits and the scene keep native opaque RGB PNGs.

| Required asset | Status |
|---|---|
| `assets/venom-adept.png` | generated |
| `assets/venom-adept-sprite.png` | generated |
| `assets/sig-counter.png` | generated |
| `assets/sig-focusGuard.png` | generated |
| `assets/sig-bleedCut.png` | generated |
| `assets/sig-execute.png` | generated |
| `assets/sig-charged.png` | generated |
| `assets/sig-cleanse.png` | generated |
| `assets/sig-drainStrike.png` | generated |
| `assets/sig-doubleSig.png` | generated |
| `assets/sig-vanish.png` | generated |
| `assets/special-guard.png` | generated |
| `assets/special-archer.png` | generated |
| `assets/special-bandit.png` | generated |
| `assets/special-venom-adept.png` | generated |
| `assets/special-pugilist.png` | generated |
| `assets/special-ashen-priest.png` | generated |
| `assets/special-shadow-assassin.png` | generated |
| `assets/special-skiff-archer.png` | generated |
| `assets/special-warden.png` | generated |
| `assets/special-night-heron.png` | generated |
| `assets/special-canglan-monk.png` | generated |
| `assets/oath-changshan-vow.png` | generated |
| `assets/oath-ridge-brothers.png` | generated |
| `assets/oath-twin-moons.png` | generated |
| `assets/oath-war-sisters.png` | generated |
| `assets/oath-silent-strings.png` | generated |
| `assets/oath-garrison-wall.png` | generated |
| `assets/weather-rain.png` | generated |
| `assets/weather-night.png` | generated |
| `assets/weather-fog.png` | generated |
| `assets/merchant.png` | generated |
| `assets/meridian-citadel.png` | generated |
| `assets/jade-sentinel-sprite.png` | generated |
| `assets/meridian-acolyte-sprite.png` | generated |
| `assets/sovereign-sprite.png` | generated |

The exact prompt for every asset is saved in `prompts/expansion-assets.json`. Venom Adept prompts are in `prompts/venom-adept*.txt`. Optional turnaround, judgement, codex paper and wander banner are outside the required batch. `asset-generation-status.json` is the machine-readable inventory.
