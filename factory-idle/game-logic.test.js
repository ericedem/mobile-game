const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  RESOURCES, EXPLORE_OPTIONS, MINE_TIMES, TOOLS, WORKERS, WORKER_UPGRADES,
  HANDCRAFT_RECIPES, CRAFTS, UPGRADES, POWER_RECIPES, FACTORY_RECIPES,
  SMELT_RECIPES, ELECTRIC_SMELT_RECIPES, ELECTRIC_FACTORY_RECIPES,
  createInitialState, canAfford, consumeResources, getMineTime, getWorkerInterval,
} = require('./game-logic.js');

// ========== Data integrity tests ==========

describe('RESOURCES', () => {
  it('has all expected resources', () => {
    const expected = [
      'food', 'wood', 'stone', 'coal', 'iron_ore', 'copper_ore', 'lithium',
      'iron_bar', 'copper_bar', 'copper_wire', 'circuit', 'power',
      'auto_miner', 'battery', 'search_drone',
    ];
    assert.deepStrictEqual(Object.keys(RESOURCES), expected);
  });

  it('every resource has name, color, and perClick', () => {
    for (const [id, def] of Object.entries(RESOURCES)) {
      assert.ok(def.name, `${id} missing name`);
      assert.ok(def.color, `${id} missing color`);
      assert.ok(typeof def.perClick === 'number', `${id} missing perClick`);
    }
  });

  it('mineable resources have perClick > 0', () => {
    const mineable = ['food', 'wood', 'stone', 'coal', 'iron_ore', 'copper_ore'];
    for (const id of mineable) {
      assert.ok(RESOURCES[id].perClick > 0, `${id} should be mineable`);
    }
  });

  it('crafted resources have perClick === 0', () => {
    const crafted = ['iron_bar', 'copper_bar', 'copper_wire', 'circuit', 'power', 'auto_miner', 'battery', 'search_drone'];
    for (const id of crafted) {
      assert.strictEqual(RESOURCES[id].perClick, 0, `${id} should not be mineable`);
    }
  });
});

describe('EXPLORE_OPTIONS', () => {
  it('food and wood have no requirements', () => {
    const food = EXPLORE_OPTIONS.find(o => o.id === 'food');
    const wood = EXPLORE_OPTIONS.find(o => o.id === 'wood');
    assert.ok(!food.requiresTool && !food.requiresItem, 'food should have no requirements');
    assert.ok(!wood.requiresTool && !wood.requiresItem, 'wood should have no requirements');
  });

  it('stone requires axe', () => {
    const stone = EXPLORE_OPTIONS.find(o => o.id === 'stone');
    assert.strictEqual(stone.requiresTool, 'axe');
  });

  it('coal, iron, copper require pickaxe', () => {
    for (const id of ['coal', 'iron_ore', 'copper_ore']) {
      const opt = EXPLORE_OPTIONS.find(o => o.id === id);
      assert.strictEqual(opt.requiresTool, 'pickaxe', `${id} should require pickaxe`);
    }
  });

  it('lithium requires auto_miner', () => {
    const lithium = EXPLORE_OPTIONS.find(o => o.id === 'lithium');
    assert.strictEqual(lithium.requiresItem, 'auto_miner');
  });

  it('all yields are [min, max] arrays with min <= max', () => {
    for (const opt of EXPLORE_OPTIONS) {
      assert.strictEqual(opt.yield.length, 2, `${opt.id} yield should be [min, max]`);
      assert.ok(opt.yield[0] <= opt.yield[1], `${opt.id} yield min should be <= max`);
    }
  });
});

describe('TOOLS', () => {
  it('axe costs only wood', () => {
    const axe = TOOLS.find(t => t.id === 'axe');
    assert.deepStrictEqual(Object.keys(axe.cost), ['wood']);
  });

  it('pickaxe costs stone and wood', () => {
    const pick = TOOLS.find(t => t.id === 'pickaxe');
    assert.deepStrictEqual(new Set(Object.keys(pick.cost)), new Set(['stone', 'wood']));
  });
});

describe('WORKERS', () => {
  it('field worker has no input cost', () => {
    const fw = WORKERS.find(w => w.id === 'field_worker');
    assert.deepStrictEqual(fw.input, {});
  });

  it('woodcutter and explorer consume food', () => {
    const wc = WORKERS.find(w => w.id === 'woodcutter');
    const ex = WORKERS.find(w => w.id === 'explorer');
    assert.deepStrictEqual(wc.input, { food: 1 });
    assert.deepStrictEqual(ex.input, { food: 1 });
  });

  it('all workers have positive intervals', () => {
    for (const w of WORKERS) {
      assert.ok(w.interval > 0, `${w.id} should have positive interval`);
    }
  });

  it('field worker produces food, woodcutter produces wood', () => {
    const fw = WORKERS.find(w => w.id === 'field_worker');
    const wc = WORKERS.find(w => w.id === 'woodcutter');
    assert.strictEqual(fw.output, 'food');
    assert.strictEqual(wc.output, 'wood');
  });

  it('explorer has no direct output but has explore targets', () => {
    const ex = WORKERS.find(w => w.id === 'explorer');
    assert.strictEqual(ex.output, null);
    assert.ok(ex.exploreTargets.length > 0);
  });
});

describe('WORKER_UPGRADES', () => {
  it('stone tools has no additional stone cost beyond the upgrade cost', () => {
    const st = WORKER_UPGRADES.find(u => u.id === 'stone_tools');
    assert.deepStrictEqual(st.cost, { stone: 15 });
  });
});

describe('Recipe consistency', () => {
  it('all smelt recipe inputs reference valid resources', () => {
    for (const r of [...SMELT_RECIPES, ...ELECTRIC_SMELT_RECIPES]) {
      for (const key of Object.keys(r.input)) {
        assert.ok(RESOURCES[key], `smelt recipe "${r.id}" references unknown resource "${key}"`);
      }
      assert.ok(RESOURCES[r.output], `smelt recipe "${r.id}" outputs unknown resource "${r.output}"`);
    }
  });

  it('all factory recipe inputs reference valid resources', () => {
    for (const r of [...FACTORY_RECIPES, ...ELECTRIC_FACTORY_RECIPES]) {
      for (const key of Object.keys(r.input)) {
        assert.ok(RESOURCES[key], `factory recipe "${r.id}" references unknown resource "${key}"`);
      }
      assert.ok(RESOURCES[r.output], `factory recipe "${r.id}" outputs unknown resource "${r.output}"`);
    }
  });

  it('all craft costs reference valid resources', () => {
    for (const c of CRAFTS) {
      for (const key of Object.keys(c.cost)) {
        assert.ok(RESOURCES[key], `craft "${c.id}" references unknown resource "${key}"`);
      }
    }
  });

  it('all handcraft inputs/outputs reference valid resources', () => {
    for (const r of HANDCRAFT_RECIPES) {
      for (const key of Object.keys(r.input)) {
        assert.ok(RESOURCES[key], `handcraft "${r.id}" references unknown resource "${key}"`);
      }
      assert.ok(RESOURCES[r.output], `handcraft "${r.id}" outputs unknown resource "${r.output}"`);
    }
  });

  it('all upgrade costs reference valid resources', () => {
    for (const u of UPGRADES) {
      for (const key of Object.keys(u.cost)) {
        assert.ok(RESOURCES[key], `upgrade "${u.id}" references unknown resource "${key}"`);
      }
    }
  });

  it('electric recipes are faster than regular recipes', () => {
    for (let i = 0; i < SMELT_RECIPES.length; i++) {
      assert.ok(ELECTRIC_SMELT_RECIPES[i].time < SMELT_RECIPES[i].time,
        `electric smelt "${ELECTRIC_SMELT_RECIPES[i].id}" should be faster`);
    }
    for (let i = 0; i < FACTORY_RECIPES.length; i++) {
      assert.ok(ELECTRIC_FACTORY_RECIPES[i].time < FACTORY_RECIPES[i].time,
        `electric factory "${ELECTRIC_FACTORY_RECIPES[i].id}" should be faster`);
    }
  });

  it('electric smelt recipes use power instead of coal', () => {
    for (const r of ELECTRIC_SMELT_RECIPES) {
      assert.ok(r.input.power, `${r.id} should use power`);
      assert.ok(!r.input.coal, `${r.id} should not use coal`);
    }
  });
});

// ========== createInitialState tests ==========

describe('createInitialState', () => {
  it('initializes all resources to 0', () => {
    const s = createInitialState();
    for (const id of Object.keys(RESOURCES)) {
      assert.strictEqual(s.resources[id], 0);
    }
  });

  it('initializes all deposits to 0', () => {
    const s = createInitialState();
    for (const id of Object.keys(RESOURCES)) {
      assert.strictEqual(s.deposits[id], 0);
    }
  });

  it('initializes all discovered to false', () => {
    const s = createInitialState();
    for (const id of Object.keys(RESOURCES)) {
      assert.strictEqual(s.discovered[id], false);
    }
  });

  it('initializes all tools to false', () => {
    const s = createInitialState();
    for (const tool of TOOLS) {
      assert.strictEqual(s.tools[tool.id], false);
    }
  });

  it('creates mining entries only for mineable resources', () => {
    const s = createInitialState();
    for (const [id, def] of Object.entries(RESOURCES)) {
      if (def.perClick > 0) {
        assert.ok(s.mining[id], `${id} should have mining entry`);
      } else {
        assert.ok(!s.mining[id], `${id} should not have mining entry`);
      }
    }
  });

  it('creates search entries for all explore options', () => {
    const s = createInitialState();
    for (const opt of EXPLORE_OPTIONS) {
      assert.ok(s.searches[opt.id], `${opt.id} should have search entry`);
    }
  });

  it('returns independent state objects', () => {
    const s1 = createInitialState();
    const s2 = createInitialState();
    s1.resources.food = 99;
    assert.strictEqual(s2.resources.food, 0);
  });
});

// ========== canAfford tests ==========

describe('canAfford', () => {
  it('returns true when resources are sufficient', () => {
    const s = createInitialState();
    s.resources.wood = 10;
    assert.ok(canAfford(s, { wood: 10 }));
  });

  it('returns false when resources are insufficient', () => {
    const s = createInitialState();
    s.resources.wood = 5;
    assert.ok(!canAfford(s, { wood: 10 }));
  });

  it('returns true for empty cost', () => {
    const s = createInitialState();
    assert.ok(canAfford(s, {}));
  });

  it('checks all resources in cost', () => {
    const s = createInitialState();
    s.resources.wood = 10;
    s.resources.stone = 0;
    assert.ok(!canAfford(s, { wood: 5, stone: 5 }));
  });

  it('returns true when resources exactly match cost', () => {
    const s = createInitialState();
    s.resources.food = 3;
    s.resources.wood = 5;
    assert.ok(canAfford(s, { food: 3, wood: 5 }));
  });
});

// ========== consumeResources tests ==========

describe('consumeResources', () => {
  it('deducts resources and returns true when affordable', () => {
    const s = createInitialState();
    s.resources.wood = 15;
    s.resources.stone = 10;
    assert.ok(consumeResources(s, { wood: 10, stone: 5 }));
    assert.strictEqual(s.resources.wood, 5);
    assert.strictEqual(s.resources.stone, 5);
  });

  it('returns false and does not deduct when unaffordable', () => {
    const s = createInitialState();
    s.resources.wood = 5;
    assert.ok(!consumeResources(s, { wood: 10 }));
    assert.strictEqual(s.resources.wood, 5);
  });

  it('handles empty cost', () => {
    const s = createInitialState();
    assert.ok(consumeResources(s, {}));
  });
});

// ========== getMineTime tests ==========

describe('getMineTime', () => {
  it('returns base time without tools', () => {
    const s = createInitialState();
    assert.strictEqual(getMineTime(s, 'wood'), 2000);
    assert.strictEqual(getMineTime(s, 'stone'), 2000);
    assert.strictEqual(getMineTime(s, 'food'), 1500);
  });

  it('returns faster time with axe for wood', () => {
    const s = createInitialState();
    s.tools.axe = true;
    assert.strictEqual(getMineTime(s, 'wood'), 1000);
  });

  it('axe does not affect other resources', () => {
    const s = createInitialState();
    s.tools.axe = true;
    assert.strictEqual(getMineTime(s, 'stone'), 2000);
    assert.strictEqual(getMineTime(s, 'coal'), 2500);
  });

  it('returns default 2000 for unknown resource', () => {
    const s = createInitialState();
    assert.strictEqual(getMineTime(s, 'unknown'), 2000);
  });
});

// ========== getWorkerInterval tests ==========

describe('getWorkerInterval', () => {
  const fieldWorker = WORKERS.find(w => w.id === 'field_worker');
  const woodcutter = WORKERS.find(w => w.id === 'woodcutter');

  it('returns base interval without tools', () => {
    const s = createInitialState();
    assert.strictEqual(getWorkerInterval(s, fieldWorker), 8000);
    assert.strictEqual(getWorkerInterval(s, woodcutter), 7000);
  });

  it('halves interval with axe', () => {
    const s = createInitialState();
    s.tools.axe = true;
    assert.strictEqual(getWorkerInterval(s, fieldWorker), 4000);
    assert.strictEqual(getWorkerInterval(s, woodcutter), 3500);
  });

  it('halves interval with stone tools', () => {
    const s = createInitialState();
    s.stoneTools = true;
    assert.strictEqual(getWorkerInterval(s, fieldWorker), 4000);
  });

  it('stacks axe and stone tools for 4x speed', () => {
    const s = createInitialState();
    s.tools.axe = true;
    s.stoneTools = true;
    assert.strictEqual(getWorkerInterval(s, fieldWorker), 2000);
    assert.strictEqual(getWorkerInterval(s, woodcutter), 1750);
  });
});

// ========== Game progression tests ==========

describe('game progression', () => {
  it('can afford axe after gathering 10 wood', () => {
    const s = createInitialState();
    const axe = TOOLS.find(t => t.id === 'axe');
    s.resources.wood = 10;
    assert.ok(canAfford(s, axe.cost));
  });

  it('can hire field worker with wood and food', () => {
    const s = createInitialState();
    const fw = WORKERS.find(w => w.id === 'field_worker');
    s.resources.wood = 5;
    s.resources.food = 3;
    assert.ok(canAfford(s, fw.cost));
    assert.ok(consumeResources(s, fw.cost));
    assert.strictEqual(s.resources.wood, 0);
    assert.strictEqual(s.resources.food, 0);
  });

  it('can build furnace after getting 10 stone', () => {
    const s = createInitialState();
    const furnace = CRAFTS.find(c => c.id === 'furnace');
    s.resources.stone = 10;
    assert.ok(consumeResources(s, furnace.cost));
    assert.strictEqual(s.resources.stone, 0);
  });

  it('power plant recipe produces more power than coal consumed', () => {
    const recipe = POWER_RECIPES[0];
    const coalIn = recipe.input.coal;
    const powerOut = recipe.outputQty;
    assert.ok(powerOut > coalIn, 'power plant should produce more power than coal consumed');
  });
});
