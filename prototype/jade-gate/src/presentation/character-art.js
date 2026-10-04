/** Portrait descriptor: { src, fit, position }. Key-art crops belong to the
 * selection portrait; transparent duel bodies never inherit those offsets. */
export function characterArt(hero, surface = "selection") {
  if (surface === "duel" && hero.cinematicArt)
    return { src: hero.cinematicArt, fit: "contain", position: "50% 50%" };
  return {
    src: hero.keyArt || `assets/${hero.id}.png`,
    fit: "cover",
    position: hero.keyArtFocus || hero.artFocus || (surface === "duel" ? "50% 0%" : "50% 18%"),
  };
}
