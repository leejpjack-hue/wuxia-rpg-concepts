import { signatureById } from "./expansion.js";
import manifest from "../../docs/asset-manifest.json" with { type: "json" };
export const expansionArtAvailable = id => manifest.some(row => row.id === id);

export const SIGNATURE_ARCHETYPES = ["counter", "focusGuard", "bleedCut", "execute", "charged", "cleanse", "drainStrike", "doubleSig", "vanish"];
export const SPECIAL_ART_KINDS = ["guard", "archer", "bandit", "venom-adept", "pugilist", "ashen-priest", "shadow-assassin", "skiff-archer", "warden", "night-heron", "canglan-monk"];
export const signatureArtFor = heroId => {
  const signature = signatureById(heroId);
  return signature ? `sig-${signature.archetype}` : null;
};
export function specialArtFor(enemy) {
  if (enemy?.kind?.startsWith("hero-")) return signatureArtFor(enemy.heroId);
  if (SPECIAL_ART_KINDS.includes(enemy?.kind)) return `special-${enemy.kind}`;
  return { "lu-bu-rival": "sig-execute", "jade-sentinel": "special-warden",
    "meridian-acolyte": "special-ashen-priest", sovereign: "special-warden" }[enemy?.kind] || null;
}
