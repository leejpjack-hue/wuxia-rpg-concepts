# Expansion image generation status

1 October 2026. Built-in image generation produced 8 of 36 required images. After repeated service network failures and stalled requests, the user asked to skip the failed generations for now. No API/CLI fallback was used.

Generated assets are registered in `asset-manifest.json` and copied into `assets/`. Transparent sprites and icons keep their native alpha; charcoal portraits and the scene keep native opaque RGB PNGs. The Sovereign retains `warden-sprite.png`; unavailable signature/special/oath/weather art stays hidden and text controls remain usable.

| Required asset | Status |
|---|---|
| `assets/venom-adept.png` | generated |
| `assets/venom-adept-sprite.png` | generated |
| `assets/sig-counter.png` | generated |
| `assets/sig-focusGuard.png` | deferred |
| `assets/sig-bleedCut.png` | generated |
| `assets/sig-execute.png` | deferred |
| `assets/sig-charged.png` | deferred |
| `assets/sig-cleanse.png` | deferred |
| `assets/sig-drainStrike.png` | deferred |
| `assets/sig-doubleSig.png` | deferred |
| `assets/sig-vanish.png` | deferred |
| `assets/special-guard.png` | deferred |
| `assets/special-archer.png` | deferred |
| `assets/special-bandit.png` | deferred |
| `assets/special-venom-adept.png` | deferred |
| `assets/special-pugilist.png` | deferred |
| `assets/special-ashen-priest.png` | deferred |
| `assets/special-shadow-assassin.png` | deferred |
| `assets/special-skiff-archer.png` | deferred |
| `assets/special-warden.png` | deferred |
| `assets/special-night-heron.png` | deferred |
| `assets/special-canglan-monk.png` | deferred |
| `assets/oath-changshan-vow.png` | deferred |
| `assets/oath-ridge-brothers.png` | deferred |
| `assets/oath-twin-moons.png` | deferred |
| `assets/oath-war-sisters.png` | deferred |
| `assets/oath-silent-strings.png` | deferred |
| `assets/oath-garrison-wall.png` | deferred |
| `assets/weather-rain.png` | deferred |
| `assets/weather-night.png` | deferred |
| `assets/weather-fog.png` | deferred |
| `assets/merchant.png` | generated |
| `assets/meridian-citadel.png` | generated |
| `assets/jade-sentinel-sprite.png` | generated |
| `assets/meridian-acolyte-sprite.png` | generated |
| `assets/sovereign-sprite.png` | deferred |

The exact prompt for every deferred asset is saved in `prompts/expansion-assets.json`. Venom Adept prompts are in `prompts/venom-adept*.txt`. Optional turnaround, judgement, codex paper and wander banner are outside the required batch. `asset-generation-status.json` is the machine-readable inventory.
