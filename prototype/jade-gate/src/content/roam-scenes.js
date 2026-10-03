/** Art and camera contract: one repeatable ground plate per playable act.
 * Keep horizons outside exploration; duel arenas may use landscape paintings. */
export const ROAM_SCENES = {
  "jade-gate": {
    art: "bamboo-maze-natural", blocker: "bamboo-thicket-blocker",
    tileWidth: 2560, artHeight: 1720, topCrop: 260,
  },
  "bamboo-crossing": {
    art: "bamboo-crossing-ground", blocker: "bamboo-thicket-blocker",
    blockerFilter: "brightness(.52) saturate(.65) hue-rotate(16deg)",
    tileWidth: 5120, artHeight: 2880, topCrop: 350,
  },
  "mount-canglan": {
    art: "canglan-terrace-ground", blocker: "granite-pine-blocker",
    tileWidth: 4096, artHeight: 2880, topCrop: 300,
  },
  "meridian-citadel": {
    art: "meridian-citadel", blocker: "granite-pine-blocker",
    blockerFilter: "brightness(.78) saturate(.75)",
    tileWidth: 4096, artHeight: 2880, topCrop: 550,
  },
  // Act V placeholder plate: the citadel painting tinted toward a cold
  // otherworld dawn until the rift-street ground art lands (ASSET-REQUIREMENTS §10).
  "otherworld": {
    art: "meridian-citadel", blocker: "granite-pine-blocker",
    blockerFilter: "brightness(.6) saturate(.6) hue-rotate(-24deg)",
    tileWidth: 4096, artHeight: 2880, topCrop: 460,
  },
};
export const roamScene = actId => ROAM_SCENES[actId] || ROAM_SCENES["jade-gate"];
