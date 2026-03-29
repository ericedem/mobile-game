// Story content - area names, narratives, and dialogue

const AREA_NAMES = [
  "Village Outskirts",
  "Darkwood Forest",
  "Goblin Caves",
  "The Bone Marsh",
  "Howling Peaks",
  "The Arcane Ruins",
  "Iron Fortress",
  "Dragon's Lair",
  "The Shadow Realm",
  "Demon Gate",
];

// Returns area name, cycling with escalating titles for areas beyond 10
function getAreaName(area) {
  if (area <= AREA_NAMES.length) return AREA_NAMES[area - 1];
  const cycle = Math.floor((area - 1) / AREA_NAMES.length);
  const base = AREA_NAMES[(area - 1) % AREA_NAMES.length];
  const prefix = ['', 'Cursed ', 'Abyssal ', 'Eternal '][Math.min(cycle, 3)];
  return prefix + base;
}

const STORY = {
  intro: [
    "The night sky burns red above your village.",
    "Monsters have poured through the eastern gate, slaughtering everything in their path.",
    "The village elder presses a rusty sword into your hands.",
    "\"You're all we have left. Push them back... or there will be nothing left to save.\"",
    "You grip the blade and step into the darkness.",
  ],

  // Story beats when entering each area
  areas: {
    1: {
      title: "Village Outskirts",
      lines: [
        "The fields outside the village walls are crawling with creatures.",
        "You can still hear screams behind you. There's no turning back.",
      ]
    },
    2: {
      title: "Darkwood Forest",
      lines: [
        "The monsters came from the forest. The trees here are twisted and wrong.",
        "A traveling merchant has set up camp at the tree line.",
        "\"Dangerous road ahead, friend. But I've got supplies if you've got coin.\"",
      ]
    },
    3: {
      title: "Goblin Caves",
      lines: [
        "Deep beneath the forest, you find a network of tunnels.",
        "This is where the smaller creatures were breeding. The stench is unbearable.",
        "You hear drums echoing from deeper within...",
      ]
    },
    4: {
      title: "The Bone Marsh",
      lines: [
        "Beyond the caves, the land turns soft and dead.",
        "Skeletons rise from the mud, animated by a dark force you can feel in your bones.",
        "Something powerful is raising the dead here.",
      ]
    },
    5: {
      title: "Howling Peaks",
      lines: [
        "The mountain pass is the only way forward.",
        "Wolves and worse hunt in packs along the narrow trails.",
        "From the summit, you can see a dark tower in the distance. That must be the source.",
      ]
    },
    6: {
      title: "The Arcane Ruins",
      lines: [
        "An ancient city, now crawling with dark mages who channel forbidden magic.",
        "The air crackles with energy. Your skin prickles.",
        "\"Turn back, mortal,\" a voice echoes. \"You are not welcome here.\"",
      ]
    },
    7: {
      title: "Iron Fortress",
      lines: [
        "The orc war camp blocks the road to the dark tower.",
        "Massive walls of scrap metal and bone surround their stronghold.",
        "You'll have to fight through their army to reach the tower beyond.",
      ]
    },
    8: {
      title: "Dragon's Lair",
      lines: [
        "The mountain trembles. Scorch marks cover every surface.",
        "A dragon has made its nest here, guarding the path to the Shadow Realm.",
        "The heat is almost unbearable. You press on.",
      ]
    },
    9: {
      title: "The Shadow Realm",
      lines: [
        "Reality itself bends and twists. The sky is black, the ground shifts beneath you.",
        "This is the space between worlds, where the monsters first crossed over.",
        "You can feel the Demon Gate ahead. One final push.",
      ]
    },
    10: {
      title: "Demon Gate",
      lines: [
        "The source of it all. A massive portal tears open the sky.",
        "The Demon Lord stands before it, commanding the horde.",
        "\"A single human? You've come all this way to die?\"",
        "You raise your sword. This ends now.",
      ]
    },
  },

  // Generic lines for areas beyond 10 (the cycle continues)
  cycle: [
    "The gate was not the end. Beyond it lies another world, darker than the last.",
    "The monsters here are stronger, twisted by deeper magic.",
    "But you are stronger too. You press forward.",
  ],

  // Victory epilogue after defeating area 10
  epilogue: [
    "The Demon Lord falls. The gate shudders and begins to close.",
    "But through the shrinking portal, you see more. Endless worlds. Endless monsters.",
    "The gate doesn't close. It stabilizes.",
    "Your fight is far from over.",
  ],
};

// Get story lines for entering an area
function getAreaStory(area) {
  if (STORY.areas[area]) {
    return STORY.areas[area];
  }
  return {
    title: getAreaName(area),
    lines: STORY.cycle
  };
}
