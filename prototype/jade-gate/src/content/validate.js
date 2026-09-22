export function validateContent({
  heroes,
  acts,
  bosses,
  disciplines,
  cultivations,
}) {
  const unique = (items, label) => {
    const ids = items.map((item) => item.id);
    if (
      ids.some((id) => typeof id !== "string" || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new Error(`Invalid or duplicate ${label} IDs`);
  };
  unique(heroes, "hero");
  unique(acts, "act");
  unique(disciplines, "discipline");
  unique(cultivations, "cultivation");
  for (const hero of heroes)
    for (const field of ["hp", "speed", "damage", "reach", "rate"])
      if (!(hero[field] > 0)) throw new Error(`Invalid ${hero.id}.${field}`);
  for (const act of acts) {
    if (
      !bosses[act.bossId] ||
      (act.next && !acts.some((item) => item.id === act.next))
    )
      throw new Error(`Broken campaign reference: ${act.id}`);
    if (act.unlocks.some((id) => !heroes.some((hero) => hero.id === id)))
      throw new Error(`Unknown unlock: ${act.id}`);
    if (!act.available) continue;
    if (!act.arena || !act.encounters.length || bosses[act.bossId].planned)
      throw new Error(`Incomplete playable act: ${act.id}`);
    unique(act.encounters, "encounter");
    for (const encounter of act.encounters) {
      if (
        !encounter.enemies.length ||
        encounter.enemies.some(
          (type) => !["guard", "archer", "boss"].includes(type),
        )
      )
        throw new Error(`Invalid enemies: ${encounter.id}`);
      if (encounter.bossId && !bosses[encounter.bossId]?.phases)
        throw new Error(`Unimplemented boss: ${encounter.bossId}`);
    }
  }
  return true;
}
