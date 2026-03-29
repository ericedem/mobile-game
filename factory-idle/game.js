// Resource definitions
const RESOURCES = {
  stone:       { name: 'Stone',       color: '#999',    perClick: 1 },
  coal:        { name: 'Coal',        color: '#555',    perClick: 1 },
  iron_ore:    { name: 'Iron Ore',    color: '#b05030', perClick: 1 },
  copper_ore:  { name: 'Copper Ore',  color: '#c07040', perClick: 1 },
  iron_bar:    { name: 'Iron Bar',    color: '#aab0b8', perClick: 0 },
  copper_bar:  { name: 'Copper Bar',  color: '#d4884a', perClick: 0 },
  copper_wire: { name: 'Copper Wire', color: '#e09050', perClick: 0 },
  circuit:     { name: 'Circuit',     color: '#4caf50', perClick: 0 },
};

// Explore options — timed searches that yield mineable deposits
const EXPLORE_OPTIONS = [
  { id: 'stone',      name: 'Search for Stone',  time: 2000,  yield: [5, 10] },
  { id: 'coal',       name: 'Search for Coal',   time: 3000,  yield: [4, 8]  },
  { id: 'iron_ore',   name: 'Search for Iron',   time: 4000,  yield: [3, 6]  },
  { id: 'copper_ore', name: 'Search for Copper',  time: 4000,  yield: [3, 6]  },
];

// Hand-crafting recipes (instant, no machine needed)
const HANDCRAFT_RECIPES = [
  {
    id: 'copper_wire',
    name: 'Craft Copper Wire',
    input: { copper_bar: 1 },
    output: 'copper_wire',
    outputQty: 2,
    unlockRequires: 'copper_bar',
  },
];

// Craftable structures
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
    desc: 'Produce circuits and advanced items',
    cost: { stone: 15, iron_bar: 5, copper_bar: 5 },
    unlockRequires: 'copper_wire',
  },
];

// Factory recipes (timed, like furnaces but in factories)
const FACTORY_RECIPES = [
  { id: 'circuit', name: 'Make Circuit', input: { copper_wire: 3, iron_bar: 1, coal: 1 }, output: 'circuit', time: 5000 },
];

// Smelt recipes
const SMELT_RECIPES = [
  { id: 'iron_bar',   name: 'Smelt Iron Bar',   input: { iron_ore: 1, coal: 1 },   output: 'iron_bar',   time: 3000 },
  { id: 'copper_bar', name: 'Smelt Copper Bar',  input: { copper_ore: 1, coal: 1 }, output: 'copper_bar', time: 3000 },
];

// Game state
const state = {
  resources: {},       // resource_id: count
  deposits: {},        // resource_id: amount available to mine
  discovered: {},      // resource_id: true/false (ever found)
  structures: {},      // structure_id: count
  furnaces: [],        // array of { active, recipe, startTime, duration }
  factories: [],       // array of { active, recipe, startTime, duration }
  searches: {},        // resource_id: { active, startTime, duration } — active search timers
};

// Initialize
for (const id of Object.keys(RESOURCES)) {
  state.resources[id] = 0;
  state.deposits[id] = 0;
  state.discovered[id] = false;
}
for (const opt of EXPLORE_OPTIONS) {
  state.searches[opt.id] = { active: false, startTime: 0, duration: 0 };
}

// DOM refs
const dom = {
  resourcesList: document.getElementById('resources-list'),
  exploreButtons: document.getElementById('explore-buttons'),
  minePanel: document.getElementById('mine-panel'),
  mineButtons: document.getElementById('mine-buttons'),
  craftPanel: document.getElementById('craft-panel'),
  craftButtons: document.getElementById('craft-buttons'),
  handcraftPanel: document.getElementById('handcraft-panel'),
  handcraftButtons: document.getElementById('handcraft-buttons'),
  smeltPanel: document.getElementById('smelt-panel'),
  smeltButtons: document.getElementById('smelt-buttons'),
  furnaceSlots: document.getElementById('furnace-slots'),
  factoryPanel: document.getElementById('factory-panel'),
  factoryButtons: document.getElementById('factory-buttons'),
  factorySlots: document.getElementById('factory-slots'),
  messageLog: document.getElementById('message-log'),
};

// --- Message log ---
function showMessage(text, type = '') {
  const el = document.createElement('div');
  el.className = 'message' + (type ? ` msg-${type}` : '');
  el.textContent = text;
  dom.messageLog.appendChild(el);
  setTimeout(() => el.remove(), 2400);
  while (dom.messageLog.children.length > 3) {
    dom.messageLog.removeChild(dom.messageLog.firstChild);
  }
}

// --- Float number on tap ---
function showFloat(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-number';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// --- Render resources ---
function renderResources() {
  dom.resourcesList.innerHTML = '';
  let anyDiscovered = false;
  for (const [id, def] of Object.entries(RESOURCES)) {
    if (!state.discovered[id]) continue;
    anyDiscovered = true;
    const badge = document.createElement('div');
    badge.className = 'resource-badge';
    const depositInfo = def.perClick > 0 ? `<span class="resource-deposit" id="res-deposit-${id}">${state.deposits[id]} in deposit</span>` : '';
    badge.innerHTML = `
      <div class="resource-icon" style="background:${def.color}"></div>
      <div class="resource-info">
        <span class="resource-name">${def.name}</span>
        ${depositInfo}
      </div>
      <span class="resource-count" id="res-count-${id}">${state.resources[id]}</span>
    `;
    dom.resourcesList.appendChild(badge);
  }
  if (!anyDiscovered) {
    dom.resourcesList.innerHTML = '<span style="color:#555;font-size:0.85rem;">No resources discovered yet. Search to find some!</span>';
  }
}

function updateResourceCount(id) {
  const el = document.getElementById(`res-count-${id}`);
  if (el) el.textContent = state.resources[id];
  const depEl = document.getElementById(`res-deposit-${id}`);
  if (depEl) depEl.textContent = `${state.deposits[id]} in deposit`;
}

// ========== EXPLORE SYSTEM ==========

function renderExplore() {
  dom.exploreButtons.innerHTML = '';
  for (const opt of EXPLORE_OPTIONS) {
    const search = state.searches[opt.id];

    const wrapper = document.createElement('div');
    wrapper.className = 'explore-wrapper';
    wrapper.id = `explore-wrapper-${opt.id}`;

    const btn = document.createElement('button');
    btn.className = 'game-btn explore-btn';
    btn.id = `explore-btn-${opt.id}`;
    btn.disabled = search.active;
    btn.innerHTML = `
      <span class="btn-label">${opt.name}</span>
      <span class="btn-cost">${(opt.time / 1000).toFixed(0)}s search</span>
    `;
    btn.addEventListener('click', () => startSearch(opt));

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container explore-bar-container';
    barContainer.id = `explore-bar-container-${opt.id}`;
    barContainer.style.display = search.active ? 'block' : 'none';

    const bar = document.createElement('div');
    bar.className = 'bar explore-bar';
    bar.id = `explore-bar-${opt.id}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);
    wrapper.appendChild(btn);
    wrapper.appendChild(barContainer);
    dom.exploreButtons.appendChild(wrapper);
  }
}

function startSearch(opt) {
  const search = state.searches[opt.id];
  if (search.active) return;

  search.active = true;
  search.startTime = Date.now();
  search.duration = opt.time;

  // Disable button, show progress bar
  const btn = document.getElementById(`explore-btn-${opt.id}`);
  if (btn) btn.disabled = true;
  const barContainer = document.getElementById(`explore-bar-container-${opt.id}`);
  if (barContainer) barContainer.style.display = 'block';

  if (!searchTickRunning) {
    searchTickRunning = true;
    requestAnimationFrame(searchTick);
  }
}

let searchTickRunning = false;

function searchTick() {
  let anyActive = false;

  for (const opt of EXPLORE_OPTIONS) {
    const search = state.searches[opt.id];
    if (!search.active) continue;

    const elapsed = Date.now() - search.startTime;
    const pct = Math.min(100, (elapsed / search.duration) * 100);

    const bar = document.getElementById(`explore-bar-${opt.id}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= search.duration) {
      // Search complete — add to deposits
      const [minYield, maxYield] = opt.yield;
      const amount = minYield + Math.floor(Math.random() * (maxYield - minYield + 1));
      state.deposits[opt.id] += amount;
      state.discovered[opt.id] = true;

      search.active = false;
      showMessage(`Found ${amount} ${RESOURCES[opt.id].name}!`, 'discover');

      // Reset bar
      if (bar) bar.style.width = '0%';
      const barContainer = document.getElementById(`explore-bar-container-${opt.id}`);
      if (barContainer) barContainer.style.display = 'none';
      const btn = document.getElementById(`explore-btn-${opt.id}`);
      if (btn) btn.disabled = false;

      renderResources();
      renderMine();
      renderCraft();
    } else {
      anyActive = true;
    }
  }

  if (anyActive) {
    requestAnimationFrame(searchTick);
  } else {
    searchTickRunning = false;
  }
}

// ========== MINE SYSTEM ==========

function renderMine() {
  const mineable = Object.entries(RESOURCES).filter(([id, def]) =>
    state.discovered[id] && def.perClick > 0
  );

  if (mineable.length === 0) {
    dom.minePanel.classList.add('hidden');
    return;
  }
  dom.minePanel.classList.remove('hidden');
  dom.mineButtons.innerHTML = '';

  for (const [id, def] of mineable) {
    const btn = document.createElement('button');
    btn.className = 'game-btn mine-btn';
    btn.id = `mine-btn-${id}`;
    btn.disabled = state.deposits[id] <= 0;
    btn.innerHTML = `
      <div class="btn-icon" style="background:${def.color}"></div>
      <span class="btn-label">Mine ${def.name}</span>
      <span class="btn-cost">${state.deposits[id]} remaining</span>
      <div class="mine-flash"></div>
    `;
    btn.addEventListener('click', (e) => mine(id, def, e));
    dom.mineButtons.appendChild(btn);
  }
}

function mine(id, def, event) {
  if (state.deposits[id] <= 0) return;

  state.deposits[id] -= def.perClick;
  state.resources[id] += def.perClick;
  updateResourceCount(id);
  updateCraftButtons();
  updateHandcraftButtons();
  updateSmeltButtons();
  updateFactoryButtons();

  // Update mine button
  const btn = document.getElementById(`mine-btn-${id}`);
  if (btn) {
    const costSpan = btn.querySelector('.btn-cost');
    if (costSpan) costSpan.textContent = `${state.deposits[id]} remaining`;
    btn.disabled = state.deposits[id] <= 0;
  }

  // Float number
  const rect = event.currentTarget.getBoundingClientRect();
  showFloat(`+${def.perClick}`, rect.left + rect.width / 2 - 10, rect.top - 10);
}

// ========== CRAFT SYSTEM ==========

function renderCraft() {
  let anyVisible = false;

  dom.craftButtons.innerHTML = '';
  for (const craft of CRAFTS) {
    if (craft.unlockRequires && !state.discovered[craft.unlockRequires]) continue;
    anyVisible = true;

    const btn = document.createElement('button');
    btn.className = 'game-btn craft-btn';
    const owned = state.structures[craft.id] || 0;
    btn.innerHTML = `
      <span class="btn-label">${craft.name}</span>
      <span class="btn-cost">${formatCost(craft.cost)}</span>
      ${owned > 0 ? `<span class="btn-cost">Owned: ${owned}</span>` : ''}
    `;
    btn.disabled = !canAfford(craft.cost);
    btn.addEventListener('click', () => buildCraft(craft));
    dom.craftButtons.appendChild(btn);
  }

  if (anyVisible) {
    dom.craftPanel.classList.remove('hidden');
  } else {
    dom.craftPanel.classList.add('hidden');
  }
}

function canAfford(cost) {
  for (const [r, n] of Object.entries(cost)) {
    if ((state.resources[r] || 0) < n) return false;
  }
  return true;
}

// Format cost with red/green per-resource coloring
function formatCost(cost, separator) {
  return Object.entries(cost)
    .map(([r, n]) => {
      const have = state.resources[r] || 0;
      const cls = have >= n ? 'cost-ok' : 'cost-missing';
      return `<span class="${cls}">${n} ${RESOURCES[r].name} (${have})</span>`;
    })
    .join(separator || ', ');
}

function buildCraft(craft) {
  if (!canAfford(craft.cost)) return;
  for (const [r, n] of Object.entries(craft.cost)) {
    state.resources[r] -= n;
  }
  state.structures[craft.id] = (state.structures[craft.id] || 0) + 1;
  if (craft.id === 'furnace') {
    state.furnaces.push({ active: false, recipe: null, startTime: 0, duration: 0 });
  }
  if (craft.id === 'factory') {
    state.factories.push({ active: false, recipe: null, startTime: 0, duration: 0 });
  }
  showMessage(`Built ${craft.name}! (${state.structures[craft.id]} total)`, 'success');
  renderAll();
}

function updateCraftButtons() {
  const buttons = dom.craftButtons.querySelectorAll('.craft-btn');
  let i = 0;
  for (const craft of CRAFTS) {
    if (craft.unlockRequires && !state.discovered[craft.unlockRequires]) continue;
    if (buttons[i]) {
      buttons[i].disabled = !canAfford(craft.cost);
      const costSpan = buttons[i].querySelector('.btn-cost');
      if (costSpan) costSpan.innerHTML = formatCost(craft.cost);
    }
    i++;
  }
}

// ========== SMELT SYSTEM ==========

function renderSmelt() {
  if (!state.structures.furnace) {
    dom.smeltPanel.classList.add('hidden');
    return;
  }
  dom.smeltPanel.classList.remove('hidden');

  renderSmeltButtons();
  renderFurnaceSlots();
}

function renderSmeltButtons() {
  dom.smeltButtons.innerHTML = '';

  const idle = getIdleFurnaceCount();

  for (const recipe of SMELT_RECIPES) {
    const inputResources = Object.keys(recipe.input);
    const allDiscovered = inputResources.every(r => state.discovered[r]);
    if (!allDiscovered) continue;

    const btn = document.createElement('button');
    btn.className = 'game-btn smelt-btn';
    btn.dataset.recipeId = recipe.id;
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}</span>
      <span class="btn-cost">${formatCost(recipe.input, ' + ')}</span>
      <span class="btn-cost">${idle} furnace${idle !== 1 ? 's' : ''} available</span>
    `;
    btn.disabled = !canAfford(recipe.input) || idle === 0;
    btn.addEventListener('click', () => startSmelt(recipe));
    dom.smeltButtons.appendChild(btn);
  }
}

function updateSmeltButtons() {
  const idle = getIdleFurnaceCount();
  const buttons = dom.smeltButtons.querySelectorAll('.smelt-btn');
  buttons.forEach(btn => {
    const recipe = SMELT_RECIPES.find(r => r.id === btn.dataset.recipeId);
    if (recipe) {
      btn.disabled = !canAfford(recipe.input) || idle === 0;
      const costSpans = btn.querySelectorAll('.btn-cost');
      if (costSpans[0]) costSpans[0].innerHTML = formatCost(recipe.input, ' + ');
      if (costSpans[1]) costSpans[1].textContent = `${idle} furnace${idle !== 1 ? 's' : ''} available`;
    }
  });
}

function getIdleFurnaceCount() {
  return state.furnaces.filter(f => !f.active).length;
}

// --- Furnace slots display ---
function renderFurnaceSlots() {
  dom.furnaceSlots.innerHTML = '';
  for (let i = 0; i < state.furnaces.length; i++) {
    const f = state.furnaces[i];
    const slot = document.createElement('div');
    slot.className = 'furnace-slot' + (f.active ? ' active' : '');
    slot.id = `furnace-slot-${i}`;

    const label = document.createElement('div');
    label.className = 'furnace-slot-label';
    label.textContent = `Furnace ${i + 1}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `furnace-status-${i}`;
    statusText.textContent = f.active ? `Smelting ${RESOURCES[f.recipe.output].name}...` : 'Idle';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.id = `furnace-bar-${i}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);

    const header = document.createElement('div');
    header.className = 'furnace-slot-header';
    header.appendChild(label);
    header.appendChild(statusText);

    slot.appendChild(header);
    slot.appendChild(barContainer);
    dom.furnaceSlots.appendChild(slot);
  }
}

// --- Smelting ---
function startSmelt(recipe) {
  const furnaceIndex = state.furnaces.findIndex(f => !f.active);
  if (furnaceIndex === -1) return;
  if (!canAfford(recipe.input)) return;

  // Consume inputs
  for (const [r, n] of Object.entries(recipe.input)) {
    state.resources[r] -= n;
  }

  const furnace = state.furnaces[furnaceIndex];
  furnace.active = true;
  furnace.recipe = recipe;
  furnace.startTime = Date.now();
  furnace.duration = recipe.time;

  renderResources();
  updateCraftButtons();
  updateSmeltButtons();

  // Update slot UI
  const slot = document.getElementById(`furnace-slot-${furnaceIndex}`);
  if (slot) slot.classList.add('active');
  const statusEl = document.getElementById(`furnace-status-${furnaceIndex}`);
  if (statusEl) statusEl.textContent = `Smelting ${RESOURCES[recipe.output].name}...`;

  if (!furnaceTickRunning) {
    furnaceTickRunning = true;
    requestAnimationFrame(furnaceTick);
  }
}

let furnaceTickRunning = false;

function furnaceTick() {
  let anyActive = false;

  for (let i = 0; i < state.furnaces.length; i++) {
    const f = state.furnaces[i];
    if (!f.active) continue;

    const elapsed = Date.now() - f.startTime;
    const pct = Math.min(100, (elapsed / f.duration) * 100);

    const bar = document.getElementById(`furnace-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= f.duration) {
      state.resources[f.recipe.output] += 1;
      state.discovered[f.recipe.output] = true;

      showMessage(`Furnace ${i + 1}: Smelted 1 ${RESOURCES[f.recipe.output].name}!`, 'success');

      f.active = false;
      f.recipe = null;

      if (bar) bar.style.width = '0%';
      const slot = document.getElementById(`furnace-slot-${i}`);
      if (slot) slot.classList.remove('active');
      const statusEl = document.getElementById(`furnace-status-${i}`);
      if (statusEl) statusEl.textContent = 'Idle';

      renderResources();
      renderHandcraft();
      renderCraft();
      updateSmeltButtons();
      updateFactoryButtons();
    } else {
      anyActive = true;
    }
  }

  if (anyActive) {
    requestAnimationFrame(furnaceTick);
  } else {
    furnaceTickRunning = false;
  }
}

// ========== HANDCRAFT SYSTEM ==========

function renderHandcraft() {
  let anyVisible = false;

  dom.handcraftButtons.innerHTML = '';
  for (const recipe of HANDCRAFT_RECIPES) {
    if (recipe.unlockRequires && !state.discovered[recipe.unlockRequires]) continue;
    anyVisible = true;

    const btn = document.createElement('button');
    btn.className = 'game-btn handcraft-btn';
    btn.dataset.recipeId = recipe.id;
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}</span>
      <span class="btn-cost">${formatCost(recipe.input, ' + ')} → ${recipe.outputQty} ${RESOURCES[recipe.output].name}</span>
    `;
    btn.disabled = !canAfford(recipe.input);
    btn.addEventListener('click', (e) => handcraft(recipe, e));
    dom.handcraftButtons.appendChild(btn);
  }

  if (anyVisible) {
    dom.handcraftPanel.classList.remove('hidden');
  } else {
    dom.handcraftPanel.classList.add('hidden');
  }
}

function handcraft(recipe, event) {
  if (!canAfford(recipe.input)) return;

  for (const [r, n] of Object.entries(recipe.input)) {
    state.resources[r] -= n;
  }
  state.resources[recipe.output] += recipe.outputQty;
  state.discovered[recipe.output] = true;

  showMessage(`Crafted ${recipe.outputQty} ${RESOURCES[recipe.output].name}!`, 'success');

  // Float number
  if (event) {
    const rect = event.currentTarget.getBoundingClientRect();
    showFloat(`+${recipe.outputQty}`, rect.left + rect.width / 2 - 10, rect.top - 10);
  }

  renderResources();
  updateHandcraftButtons();
  updateCraftButtons();
  updateSmeltButtons();
  updateFactoryButtons();
}

function updateHandcraftButtons() {
  const buttons = dom.handcraftButtons.querySelectorAll('.handcraft-btn');
  buttons.forEach(btn => {
    const recipe = HANDCRAFT_RECIPES.find(r => r.id === btn.dataset.recipeId);
    if (recipe) {
      btn.disabled = !canAfford(recipe.input);
      const costSpan = btn.querySelector('.btn-cost');
      if (costSpan) costSpan.innerHTML = `${formatCost(recipe.input, ' + ')} → ${recipe.outputQty} ${RESOURCES[recipe.output].name}`;
    }
  });
}

// ========== FACTORY SYSTEM ==========

function renderFactory() {
  if (!state.structures.factory) {
    dom.factoryPanel.classList.add('hidden');
    return;
  }
  dom.factoryPanel.classList.remove('hidden');

  renderFactoryButtons();
  renderFactorySlots();
}

function renderFactoryButtons() {
  dom.factoryButtons.innerHTML = '';
  const idle = getIdleFactoryCount();

  for (const recipe of FACTORY_RECIPES) {
    const inputResources = Object.keys(recipe.input);
    const allDiscovered = inputResources.every(r => state.discovered[r]);
    if (!allDiscovered) continue;

    const btn = document.createElement('button');
    btn.className = 'game-btn factory-recipe-btn';
    btn.dataset.recipeId = recipe.id;
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}</span>
      <span class="btn-cost">${formatCost(recipe.input, ' + ')}</span>
      <span class="btn-cost">${idle} factor${idle !== 1 ? 'ies' : 'y'} available</span>
    `;
    btn.disabled = !canAfford(recipe.input) || idle === 0;
    btn.addEventListener('click', () => startFactory(recipe));
    dom.factoryButtons.appendChild(btn);
  }
}

function updateFactoryButtons() {
  const idle = getIdleFactoryCount();
  const buttons = dom.factoryButtons.querySelectorAll('.factory-recipe-btn');
  buttons.forEach(btn => {
    const recipe = FACTORY_RECIPES.find(r => r.id === btn.dataset.recipeId);
    if (recipe) {
      btn.disabled = !canAfford(recipe.input) || idle === 0;
      const costSpans = btn.querySelectorAll('.btn-cost');
      if (costSpans[0]) costSpans[0].innerHTML = formatCost(recipe.input, ' + ');
      if (costSpans[1]) costSpans[1].textContent = `${idle} factor${idle !== 1 ? 'ies' : 'y'} available`;
    }
  });
}

function getIdleFactoryCount() {
  return state.factories.filter(f => !f.active).length;
}

function renderFactorySlots() {
  dom.factorySlots.innerHTML = '';
  for (let i = 0; i < state.factories.length; i++) {
    const f = state.factories[i];
    const slot = document.createElement('div');
    slot.className = 'furnace-slot' + (f.active ? ' active' : '');
    slot.id = `factory-slot-${i}`;

    const label = document.createElement('div');
    label.className = 'furnace-slot-label';
    label.textContent = `Factory ${i + 1}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `factory-status-${i}`;
    statusText.textContent = f.active ? `Making ${RESOURCES[f.recipe.output].name}...` : 'Idle';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = 'bar factory-bar-fill';
    bar.id = `factory-bar-${i}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);

    const header = document.createElement('div');
    header.className = 'furnace-slot-header';
    header.appendChild(label);
    header.appendChild(statusText);

    slot.appendChild(header);
    slot.appendChild(barContainer);
    dom.factorySlots.appendChild(slot);
  }
}

function startFactory(recipe) {
  const factoryIndex = state.factories.findIndex(f => !f.active);
  if (factoryIndex === -1) return;
  if (!canAfford(recipe.input)) return;

  for (const [r, n] of Object.entries(recipe.input)) {
    state.resources[r] -= n;
  }

  const factory = state.factories[factoryIndex];
  factory.active = true;
  factory.recipe = recipe;
  factory.startTime = Date.now();
  factory.duration = recipe.time;

  renderResources();
  updateCraftButtons();
  updateSmeltButtons();
  updateHandcraftButtons();
  updateFactoryButtons();

  const slot = document.getElementById(`factory-slot-${factoryIndex}`);
  if (slot) slot.classList.add('active');
  const statusEl = document.getElementById(`factory-status-${factoryIndex}`);
  if (statusEl) statusEl.textContent = `Making ${RESOURCES[recipe.output].name}...`;

  if (!factoryTickRunning) {
    factoryTickRunning = true;
    requestAnimationFrame(factoryTick);
  }
}

let factoryTickRunning = false;

function factoryTick() {
  let anyActive = false;

  for (let i = 0; i < state.factories.length; i++) {
    const f = state.factories[i];
    if (!f.active) continue;

    const elapsed = Date.now() - f.startTime;
    const pct = Math.min(100, (elapsed / f.duration) * 100);

    const bar = document.getElementById(`factory-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= f.duration) {
      state.resources[f.recipe.output] += 1;
      state.discovered[f.recipe.output] = true;

      showMessage(`Factory ${i + 1}: Made 1 ${RESOURCES[f.recipe.output].name}!`, 'success');

      f.active = false;
      f.recipe = null;

      if (bar) bar.style.width = '0%';
      const slot = document.getElementById(`factory-slot-${i}`);
      if (slot) slot.classList.remove('active');
      const statusEl = document.getElementById(`factory-status-${i}`);
      if (statusEl) statusEl.textContent = 'Idle';

      renderResources();
      updateFactoryButtons();
    } else {
      anyActive = true;
    }
  }

  if (anyActive) {
    requestAnimationFrame(factoryTick);
  } else {
    factoryTickRunning = false;
  }
}

// ========== RENDER ALL ==========

function renderAll() {
  renderResources();
  renderExplore();
  renderMine();
  renderCraft();
  renderHandcraft();
  renderSmelt();
  renderFactory();
}

// Init
renderAll();
