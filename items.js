// Equipment and shop item definitions
// Items are unlocked progressively as the player reaches higher areas

const EQUIPMENT = {
  weapon: [
    { id: 'w1', name: 'Iron Sword',      slot: 'weapon', atk: 5,  cost: 30,  area: 1 },
    { id: 'w2', name: 'Steel Blade',     slot: 'weapon', atk: 10, cost: 80,  area: 2 },
    { id: 'w3', name: 'War Axe',         slot: 'weapon', atk: 18, cost: 180, area: 3 },
    { id: 'w4', name: 'Enchanted Saber', slot: 'weapon', atk: 28, cost: 350, area: 5 },
    { id: 'w5', name: 'Dragon Fang',     slot: 'weapon', atk: 40, cost: 600, area: 7 },
    { id: 'w6', name: 'Demon Slayer',    slot: 'weapon', atk: 55, cost: 1000, area: 9 },
  ],
  armor: [
    { id: 'a1', name: 'Leather Vest',    slot: 'armor', def: 3,  cost: 25,  area: 1 },
    { id: 'a2', name: 'Chain Mail',      slot: 'armor', def: 6,  cost: 70,  area: 2 },
    { id: 'a3', name: 'Plate Armor',     slot: 'armor', def: 12, cost: 160, area: 3 },
    { id: 'a4', name: 'Mithril Armor',   slot: 'armor', def: 20, cost: 320, area: 5 },
    { id: 'a5', name: 'Dragon Scale',    slot: 'armor', def: 30, cost: 550, area: 7 },
    { id: 'a6', name: 'Void Plate',      slot: 'armor', def: 42, cost: 900, area: 9 },
  ],
  accessory: [
    { id: 'c1', name: 'Health Ring',      slot: 'accessory', maxHp: 20,  cost: 35,  area: 1 },
    { id: 'c2', name: 'Vigor Pendant',    slot: 'accessory', maxHp: 50,  cost: 100, area: 2 },
    { id: 'c3', name: 'Life Amulet',      slot: 'accessory', maxHp: 100, cost: 250, area: 4 },
    { id: 'c4', name: 'Soul Crystal',     slot: 'accessory', maxHp: 180, cost: 500, area: 6 },
    { id: 'c5', name: 'Immortal Heart',   slot: 'accessory', maxHp: 300, cost: 850, area: 8 },
  ]
};

// Consumables available at shop
const CONSUMABLES = [
  { id: 'potion',      name: 'Heal Potion',     cost: 15,  heals: 1, area: 1 },
  { id: 'potion_pack', name: 'Potion Pack (3)',  cost: 40,  heals: 3, area: 2 },
];

// Get all shop items available for a given area
function getShopItems(area) {
  const items = [];
  for (const slot of Object.values(EQUIPMENT)) {
    for (const item of slot) {
      if (item.area <= area) {
        items.push(item);
      }
    }
  }
  return items;
}

function getShopConsumables(area) {
  return CONSUMABLES.filter(c => c.area <= area);
}

// XP required for a given level
function xpForLevel(level) {
  return Math.round(30 * Math.pow(level, 1.5));
}

// Stats gained per level up
function levelUpStats() {
  return { maxHp: 10, atk: 2 };
}
