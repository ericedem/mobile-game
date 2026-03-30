// Game data definitions and pure logic functions
// Shared between game.js (browser) and tests (Node)

const RESOURCES = {
  food:         { name: 'Food',         color: '#8bc34a', perClick: 1 },
  wood:         { name: 'Wood',         color: '#8B5E3C', perClick: 1 },
  stone:        { name: 'Stone',        color: '#999',    perClick: 1 },
  coal:         { name: 'Coal',         color: '#555',    perClick: 1 },
  iron_ore:     { name: 'Iron Ore',     color: '#b05030', perClick: 1 },
  copper_ore:   { name: 'Copper Ore',   color: '#c07040', perClick: 1 },
  lithium:      { name: 'Lithium',      color: '#b0e0ff', perClick: 0 },
  iron_bar:     { name: 'Iron Bar',     color: '#aab0b8', perClick: 0 },
  copper_bar:   { name: 'Copper Bar',   color: '#d4884a', perClick: 0 },
  copper_wire:  { name: 'Copper Wire',  color: '#e09050', perClick: 0 },
  circuit:      { name: 'Circuit',      color: '#4caf50', perClick: 0 },
  power:        { name: 'Power',        color: '#ffeb3b', perClick: 0 },
  auto_miner:   { name: 'Auto Miner',   color: '#607d8b', perClick: 0 },
  battery:      { name: 'Battery',      color: '#66bb6a', perClick: 0 },
  search_drone: { name: 'Search Drone', color: '#80deea', perClick: 0 },
};

const EXPLORE_OPTIONS = [
  { id: 'food',       name: 'Forage for Food',    time: 1500,  yield: [4, 8] },
  { id: 'wood',       name: 'Search for Wood',    time: 1500,  yield: [6, 12] },
  { id: 'stone',      name: 'Search for Stone',   time: 2000,  yield: [5, 10], requiresTool: 'axe' },
  { id: 'coal',       name: 'Search for Coal',    time: 3000,  yield: [4, 8],  requiresTool: 'pickaxe' },
  { id: 'iron_ore',   name: 'Search for Iron',    time: 4000,  yield: [3, 6],  requiresTool: 'pickaxe' },
  { id: 'copper_ore', name: 'Search for Copper',  time: 4000,  yield: [3, 6],  requiresTool: 'pickaxe' },
  { id: 'lithium',    name: 'Search for Lithium', time: 5000,  yield: [2, 4],  requiresItem: 'auto_miner' },
];

const MINE_TIMES = {
  food:       { base: 1500 },
  wood:       { base: 2000, withTool: { axe: 1000 } },
  stone:      { base: 2000 },
  coal:       { base: 2500 },
  iron_ore:   { base: 3000 },
  copper_ore: { base: 3000 },
  lithium:    { base: 4000 },
};

const TOOLS = [
  { id: 'axe',     name: 'Wooden Axe',     desc: 'Mine wood faster, workers faster, unlock stone', cost: { food: 20 }, unlockRequires: 'wood' },
  { id: 'pickaxe', name: 'Stone Pickaxe',   desc: 'Unlock coal, iron, and copper deposits',  cost: { stone: 5, wood: 5 }, unlockRequires: 'stone' },
];

const WORKERS = [
  {
    id: 'field_worker',
    name: 'Field Worker',
    desc: 'Continuously farms food',
    cost: { wood: 5, food: 3 },
    input: {},
    output: 'food',
    outputQty: 3,
    interval: 8000,
    max: 2,
    unlockCost: { food: 10 },
    unlockDesc: 'Unlock Field Workers',
  },
  {
    id: 'woodcutter',
    name: 'Woodcutter',
    desc: 'Continuously gathers wood (consumes food)',
    cost: { wood: 3, food: 5 },
    input: { food: 1 },
    output: 'wood',
    outputQty: 2,
    interval: 7000,
    max: 2,
    requiresTool: 'axe',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    desc: 'Searches for wood and stone deposits (consumes food)',
    cost: { food: 5 },
    input: { food: 1 },
    output: null,
    exploreTargets: ['wood', 'stone'],
    interval: 10000,
    requiresTool: 'axe',
  },
];

const WORKER_UPGRADES = [
  {
    id: 'stone_tools',
    name: 'Stone Tools',
    desc: 'Equip all workers with stone tools — workers work 50% faster',
    cost: { stone: 15 },
    unlockRequires: 'stone',
  },
];

const HANDCRAFT_RECIPES = [
  { id: 'auto_miner',   name: 'Craft Auto Miner',   input: { coal: 5, iron_bar: 3, copper_bar: 3, circuit: 1 }, output: 'auto_miner',   outputQty: 1, unlockRequires: 'circuit' },
  { id: 'search_drone', name: 'Craft Search Drone',  input: { battery: 1, circuit: 1, copper_wire: 2 },         output: 'search_drone', outputQty: 1, unlockRequires: 'battery' },
];

const CRAFTS = [
  {
    id: 'furnace',
    name: 'Stone Furnace',
    desc: 'Smelt ores into bars',
    cost: { stone: 10 },
    unlockRequires: 'stone',
  },
  {
    id: 'factory',
    name: 'Factory',
    desc: 'Produce wire, circuits, and advanced items',
    cost: { stone: 15, iron_bar: 5, copper_bar: 5 },
    unlockRequires: 'copper_bar',
  },
  {
    id: 'power_plant',
    name: 'Coal Power Plant',
    desc: 'Continuously convert coal into power',
    cost: { circuit: 5, copper_wire: 10, copper_bar: 5, iron_bar: 5 },
    unlockRequires: 'circuit',
  },
];

const UPGRADES = [
  {
    id: 'electric_furnace',
    name: 'Electric Furnace',
    desc: 'Upgrade a furnace to use power instead of coal',
    cost: { circuit: 2, copper_wire: 4 },
    target: 'furnace',
    unlockRequires: 'power',
  },
  {
    id: 'electric_factory',
    name: 'Electric Factory',
    desc: 'Upgrade a factory to use power instead of coal',
    cost: { circuit: 3, copper_wire: 6 },
    target: 'factory',
    unlockRequires: 'power',
  },
];

const POWER_RECIPES = [
  { id: 'power', name: 'Generate Power', input: { coal: 2 }, output: 'power', outputQty: 5, time: 4000 },
];

const FACTORY_RECIPES = [
  { id: 'copper_wire', name: 'Make Copper Wire', input: { copper_bar: 1 },                                            output: 'copper_wire', time: 2000 },
  { id: 'circuit',     name: 'Make Circuit',     input: { copper_wire: 3, iron_bar: 1, coal: 1 },                     output: 'circuit',     time: 5000 },
  { id: 'battery',     name: 'Make Battery',     input: { power: 2, lithium: 1, copper_bar: 1, iron_bar: 1, circuit: 1 }, output: 'battery', time: 6000 },
];

const SMELT_RECIPES = [
  { id: 'iron_bar',   name: 'Smelt Iron Bar',   input: { iron_ore: 1, coal: 1 },   output: 'iron_bar',   time: 3000 },
  { id: 'copper_bar', name: 'Smelt Copper Bar',  input: { copper_ore: 1, coal: 1 }, output: 'copper_bar', time: 3000 },
];

const ELECTRIC_SMELT_RECIPES = [
  { id: 'iron_bar_e',   name: 'Smelt Iron Bar',   input: { iron_ore: 1, power: 1 },   output: 'iron_bar',   time: 2000 },
  { id: 'copper_bar_e', name: 'Smelt Copper Bar',  input: { copper_ore: 1, power: 1 }, output: 'copper_bar', time: 2000 },
];

const ELECTRIC_FACTORY_RECIPES = [
  { id: 'copper_wire_e', name: 'Make Copper Wire', input: { copper_bar: 1 },                                              output: 'copper_wire', time: 1500 },
  { id: 'circuit_e',     name: 'Make Circuit',     input: { copper_wire: 3, iron_bar: 1, power: 1 },                      output: 'circuit',     time: 3500 },
  { id: 'battery_e',     name: 'Make Battery',     input: { power: 3, lithium: 1, copper_bar: 1, iron_bar: 1, circuit: 1 }, output: 'battery',   time: 4000 },
];

// --- Pure helper functions ---

function createInitialState() {
  const s = {
    resources: {},
    deposits: {},
    discovered: {},
    tools: {},
    structures: {},
    furnaces: [],
    factories: [],
    power_plants: [],
    searches: {},
    mining: {},
    workers: [],
    unlockedWorkers: {},  // worker_id: true — tracks which worker types have been unlocked
    stoneTools: false,
    activeAction: null,   // { type: 'mine'|'search', id: string } — current auto-repeat action
    auto_miners: [],
    drones: [],
    revealed: {},
  };
  for (const id of Object.keys(RESOURCES)) {
    s.resources[id] = 0;
    s.deposits[id] = 0;
    s.discovered[id] = false;
    if (RESOURCES[id].perClick > 0) {
      s.mining[id] = { active: false, startTime: 0, duration: 0 };
    }
  }
  for (const opt of EXPLORE_OPTIONS) {
    s.searches[opt.id] = { active: false, startTime: 0, duration: 0 };
  }
  for (const tool of TOOLS) {
    s.tools[tool.id] = false;
  }
  return s;
}

function canAfford(state, cost) {
  for (const [r, n] of Object.entries(cost)) {
    if ((state.resources[r] || 0) < n) return false;
  }
  return true;
}

function consumeResources(state, cost) {
  if (!canAfford(state, cost)) return false;
  for (const [r, n] of Object.entries(cost)) state.resources[r] -= n;
  return true;
}

function getMineTime(state, id) {
  const mt = MINE_TIMES[id];
  if (!mt) return 2000;
  if (mt.withTool) {
    for (const [toolId, time] of Object.entries(mt.withTool)) {
      if (state.tools[toolId]) return time;
    }
  }
  return mt.base;
}

function getWorkerInterval(state, workerDef) {
  let interval = workerDef.interval;
  if (state.tools.axe) interval = Math.floor(interval * 0.5);
  if (state.stoneTools) interval = Math.floor(interval * 0.5);
  return interval;
}

// Export for Node.js tests, no-op in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RESOURCES, EXPLORE_OPTIONS, MINE_TIMES, TOOLS, WORKERS, WORKER_UPGRADES,
    HANDCRAFT_RECIPES, CRAFTS, UPGRADES, POWER_RECIPES, FACTORY_RECIPES,
    SMELT_RECIPES, ELECTRIC_SMELT_RECIPES, ELECTRIC_FACTORY_RECIPES,
    createInitialState, canAfford, consumeResources, getMineTime, getWorkerInterval,
  };
}
