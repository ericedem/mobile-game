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
  furnace: {
    active: false,
    recipe: null,
    startTime: 0,
    duration: 0,
  },
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
  furnaceStatus: document.getElementById('furnace-status'),
  furnaceProgressBar: document.getElementById('furnace-progress-bar'),
  furnaceStatusText: document.getElementById('furnace-status-text'),
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
  showMessage(`Built ${craft.name}!`, 'success');
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
    // Only show recipes for discovered ores
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
    btn.disabled = !canAfford(recipe.input) || state.furnace.active;
    btn.addEventListener('click', () => startSmelt(recipe));
    dom.smeltButtons.appendChild(btn);
  }
}

function updateSmeltButtons() {
  const buttons = dom.smeltButtons.querySelectorAll('.smelt-btn');
  buttons.forEach(btn => {
    const recipe = SMELT_RECIPES.find(r => r.id === btn.dataset.recipeId);
    if (recipe) {
      btn.disabled = !canAfford(recipe.input) || state.furnace.active;
    }
  });
}

// --- Smelting ---
function startSmelt(recipe) {
  if (state.furnace.active) return;
  if (!canAfford(recipe.input)) return;

  // Consume inputs
  for (const [r, n] of Object.entries(recipe.input)) {
    state.resources[r] -= n;
  }
  renderResources();
  updateCraftButtons();
  updateSmeltButtons();

  state.furnace.active = true;
  state.furnace.recipe = recipe;
  state.furnace.startTime = Date.now();
  state.furnace.duration = recipe.time;

  dom.furnaceStatus.classList.remove('hidden');
  dom.furnaceStatusText.textContent = `Smelting ${RESOURCES[recipe.output].name}...`;

  // Disable smelt buttons while active
  dom.smeltButtons.querySelectorAll('.smelt-btn').forEach(b => b.disabled = true);

  updateFurnaceProgress();
}

function updateFurnaceProgress() {
  if (!state.furnace.active) return;

  const elapsed = Date.now() - state.furnace.startTime;
  const pct = Math.min(100, (elapsed / state.furnace.duration) * 100);
  dom.furnaceProgressBar.style.width = pct + '%';

  if (elapsed >= state.furnace.duration) {
    // Done
    const recipe = state.furnace.recipe;
    state.resources[recipe.output] += 1;
    state.discovered[recipe.output] = true;

    state.furnace.active = false;
    state.furnace.recipe = null;

    showMessage(`Smelted 1 ${RESOURCES[recipe.output].name}!`, 'success');
    dom.furnaceStatusText.textContent = 'Idle';
    dom.furnaceProgressBar.style.width = '0%';

    renderResources();
    updateSmeltButtons();
    return;
  }

  requestAnimationFrame(updateFurnaceProgress);
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
