// Resource definitions
const RESOURCES = {
  stone:      { name: 'Stone',      color: '#999',    perClick: 1 },
  coal:       { name: 'Coal',       color: '#555',    perClick: 1 },
  iron_ore:   { name: 'Iron Ore',   color: '#b05030', perClick: 1 },
  copper_ore: { name: 'Copper Ore', color: '#c07040', perClick: 1 },
  iron_bar:   { name: 'Iron Bar',   color: '#aab0b8', perClick: 0 },
  copper_bar: { name: 'Copper Bar', color: '#d4884a', perClick: 0 },
};

// Explore options — what the player can search for
const EXPLORE_OPTIONS = [
  { id: 'stone',      name: 'Search for Stone',      chance: 0.8 },
  { id: 'coal',       name: 'Search for Coal',        chance: 0.6 },
  { id: 'iron_ore',   name: 'Search for Iron',        chance: 0.5 },
  { id: 'copper_ore', name: 'Search for Copper',      chance: 0.5 },
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
];

// Smelt recipes
const SMELT_RECIPES = [
  { id: 'iron_bar',   name: 'Smelt Iron Bar',   input: { iron_ore: 1, coal: 1 },   output: 'iron_bar',   time: 3000 },
  { id: 'copper_bar', name: 'Smelt Copper Bar',  input: { copper_ore: 1, coal: 1 }, output: 'copper_bar', time: 3000 },
];

// Game state
const state = {
  resources: {},       // resource_id: count
  discovered: {},      // resource_id: true/false
  structures: {},      // structure_id: count
  furnaces: [],        // array of { active, recipe, startTime, duration }
};

// Initialize resources to 0
for (const id of Object.keys(RESOURCES)) {
  state.resources[id] = 0;
  state.discovered[id] = false;
}

// DOM refs
const dom = {
  resourcesList: document.getElementById('resources-list'),
  exploreButtons: document.getElementById('explore-buttons'),
  minePanel: document.getElementById('mine-panel'),
  mineButtons: document.getElementById('mine-buttons'),
  craftPanel: document.getElementById('craft-panel'),
  craftButtons: document.getElementById('craft-buttons'),
  smeltPanel: document.getElementById('smelt-panel'),
  smeltButtons: document.getElementById('smelt-buttons'),
  furnaceSlots: document.getElementById('furnace-slots'),
  messageLog: document.getElementById('message-log'),
};

// --- Message log ---
function showMessage(text, type = '') {
  const el = document.createElement('div');
  el.className = 'message' + (type ? ` msg-${type}` : '');
  el.textContent = text;
  dom.messageLog.appendChild(el);
  setTimeout(() => el.remove(), 2400);
  // Keep max 3 messages
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
    badge.innerHTML = `
      <div class="resource-icon" style="background:${def.color}"></div>
      <span class="resource-name">${def.name}</span>
      <span class="resource-count" id="res-count-${id}">${state.resources[id]}</span>
    `;
    dom.resourcesList.appendChild(badge);
  }
  if (!anyDiscovered) {
    dom.resourcesList.innerHTML = '<span style="color:#555;font-size:0.85rem;">No resources discovered yet. Explore to find some!</span>';
  }
}

function updateResourceCount(id) {
  const el = document.getElementById(`res-count-${id}`);
  if (el) el.textContent = state.resources[id];
}

// --- Render explore buttons ---
function renderExplore() {
  dom.exploreButtons.innerHTML = '';
  let anyToExplore = false;
  for (const opt of EXPLORE_OPTIONS) {
    if (state.discovered[opt.id]) continue;
    anyToExplore = true;
    const btn = document.createElement('button');
    btn.className = 'game-btn explore-btn';
    btn.innerHTML = `<span class="btn-label">${opt.name}</span>`;
    btn.addEventListener('click', () => explore(opt));
    dom.exploreButtons.appendChild(btn);
  }
  if (!anyToExplore) {
    dom.exploreButtons.innerHTML = '<span style="color:#555;font-size:0.85rem;">All resources discovered!</span>';
  }
}

// --- Explore action ---
function explore(opt) {
  if (Math.random() < opt.chance) {
    state.discovered[opt.id] = true;
    showMessage(`Discovered a ${RESOURCES[opt.id].name} deposit!`, 'discover');
    renderAll();
  } else {
    showMessage(`Searched but found nothing... try again.`, 'fail');
  }
}

// --- Render mine buttons ---
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
    btn.innerHTML = `
      <div class="btn-icon" style="background:${def.color}"></div>
      <span class="btn-label">${def.name}</span>
      <span class="btn-cost">+${def.perClick} per tap</span>
      <div class="mine-flash"></div>
    `;
    btn.addEventListener('click', (e) => mine(id, def, e));
    dom.mineButtons.appendChild(btn);
  }
}

// --- Mine action ---
function mine(id, def, event) {
  state.resources[id] += def.perClick;
  updateResourceCount(id);
  updateCraftButtons();
  updateSmeltButtons();

  // Float number
  const rect = event.currentTarget.getBoundingClientRect();
  showFloat(`+${def.perClick}`, rect.left + rect.width / 2 - 10, rect.top - 10);
}

// --- Render craft buttons ---
function renderCraft() {
  let anyVisible = false;

  dom.craftButtons.innerHTML = '';
  for (const craft of CRAFTS) {
    // Only show if the unlock resource is discovered
    if (craft.unlockRequires && !state.discovered[craft.unlockRequires]) continue;
    anyVisible = true;

    const btn = document.createElement('button');
    btn.className = 'game-btn craft-btn';
    const costText = Object.entries(craft.cost)
      .map(([r, n]) => `${n} ${RESOURCES[r].name}`)
      .join(', ');
    const owned = state.structures[craft.id] || 0;
    btn.innerHTML = `
      <span class="btn-label">${craft.name}</span>
      <span class="btn-cost">${costText}</span>
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

function buildCraft(craft) {
  if (!canAfford(craft.cost)) return;
  for (const [r, n] of Object.entries(craft.cost)) {
    state.resources[r] -= n;
  }
  state.structures[craft.id] = (state.structures[craft.id] || 0) + 1;
  // Add a new furnace slot
  if (craft.id === 'furnace') {
    state.furnaces.push({ active: false, recipe: null, startTime: 0, duration: 0 });
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
    }
    i++;
  }
}

// --- Render smelt panel ---
function renderSmelt() {
  if (!state.structures.furnace) {
    dom.smeltPanel.classList.add('hidden');
    return;
  }
  dom.smeltPanel.classList.remove('hidden');
  dom.smeltButtons.innerHTML = '';

  for (const recipe of SMELT_RECIPES) {
    const inputResources = Object.keys(recipe.input);
    const allDiscovered = inputResources.every(r => state.discovered[r]);
    if (!allDiscovered) continue;

    const btn = document.createElement('button');
    btn.className = 'game-btn smelt-btn';
    btn.dataset.recipeId = recipe.id;
    const costText = Object.entries(recipe.input)
      .map(([r, n]) => `${n} ${RESOURCES[r].name}`)
      .join(' + ');
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}</span>
      <span class="btn-cost">${costText}</span>
    `;
    btn.disabled = !canAfford(recipe.input) || getIdleFurnaceCount() === 0;
    btn.addEventListener('click', () => startSmelt(recipe));
    dom.smeltButtons.appendChild(btn);
  }

  renderFurnaceSlots();
}

function updateSmeltButtons() {
  const buttons = dom.smeltButtons.querySelectorAll('.smelt-btn');
  buttons.forEach(btn => {
    const recipe = SMELT_RECIPES.find(r => r.id === btn.dataset.recipeId);
    if (recipe) {
      btn.disabled = !canAfford(recipe.input) || getIdleFurnaceCount() === 0;
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
  // Find an idle furnace
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

  // Start tick loop if not already running
  if (!furnaceTickRunning) {
    furnaceTickRunning = true;
    requestAnimationFrame(furnaceTick);
  }
}

// Single animation loop that updates all furnaces
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
      // Done smelting
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
      updateSmeltButtons();
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

// --- Render all ---
function renderAll() {
  renderResources();
  renderExplore();
  renderMine();
  renderCraft();
  renderSmelt();
}

// Init
renderAll();
