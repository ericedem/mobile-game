// Data definitions and pure functions loaded from game-logic.js (shared with tests)

// Game state
const state = createInitialState();

// DOM refs
const dom = {
  resourcesList: document.getElementById('resources-list'),
  exploreButtons: document.getElementById('explore-buttons'),
  minePanel: document.getElementById('mine-panel'),
  mineButtons: document.getElementById('mine-buttons'),
  toolsPanel: document.getElementById('tools-panel'),
  toolsButtons: document.getElementById('tools-buttons'),
  workerPanel: document.getElementById('worker-panel'),
  workerRows: document.getElementById('worker-rows'),
  workerUpgradeButtons: document.getElementById('worker-upgrade-buttons'),
  autoMinerPanel: document.getElementById('auto-miner-panel'),
  autoMinerButtons: document.getElementById('auto-miner-buttons'),
  autoMinerSlots: document.getElementById('auto-miner-slots'),
  dronePanel: document.getElementById('drone-panel'),
  droneButtons: document.getElementById('drone-buttons'),
  droneSlots: document.getElementById('drone-slots'),
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
  powerPanel: document.getElementById('power-panel'),
  powerButtons: document.getElementById('power-buttons'),
  powerSlots: document.getElementById('power-slots'),
  upgradePanel: document.getElementById('upgrade-panel'),
  upgradeButtons: document.getElementById('upgrade-buttons'),
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
// Track which resource badges exist to avoid full rebuilds
const resourceBadges = {};

function renderResources() {
  for (const [id, def] of Object.entries(RESOURCES)) {
    if (!state.discovered[id]) continue;

    // Remove the "no resources" placeholder if present
    const placeholder = dom.resourcesList.querySelector('.res-placeholder');
    if (placeholder) placeholder.remove();

    if (resourceBadges[id]) {
      // Badge exists — just update values
      updateResourceCount(id);
      continue;
    }

    // Create new badge
    const badge = document.createElement('div');
    badge.className = 'resource-badge';
    badge.id = `res-badge-${id}`;
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
    resourceBadges[id] = true;
  }

  // Show placeholder only if nothing discovered
  if (!Object.values(state.discovered).some(d => d) && !dom.resourcesList.querySelector('.res-placeholder')) {
    dom.resourcesList.innerHTML = '<span class="res-placeholder" style="color:#555;font-size:0.85rem;grid-column:1/-1;">No resources discovered yet. Search to find some!</span>';
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
    // Hide options that require a tool or item the player doesn't have
    if (opt.requiresTool && !state.tools[opt.requiresTool]) continue;
    if (opt.requiresItem && !state.discovered[opt.requiresItem]) continue;

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
    // bar always visible — width handles progress

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

      if (bar) bar.style.width = '0%';
      const btn = document.getElementById(`explore-btn-${opt.id}`);
      if (btn) btn.disabled = false;

      renderResources();
      renderMine();
      renderTools();
      renderWorkers();
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

function getMineTime(id) {
  const mt = MINE_TIMES[id];
  if (!mt) return 2000;
  if (mt.withTool) {
    for (const [toolId, time] of Object.entries(mt.withTool)) {
      if (state.tools[toolId]) return time;
    }
  }
  return mt.base;
}

function renderMine() {
  const mineable = Object.entries(RESOURCES).filter(([id, def]) =>
    state.discovered[id] && def.perClick > 0
  );

  if (mineable.length === 0) {
    dom.minePanel.classList.add('hidden');
    return;
  }
  showPanel(dom.minePanel);
  dom.mineButtons.innerHTML = '';

  for (const [id, def] of mineable) {
    const mining = state.mining[id];
    const mineTime = getMineTime(id);

    const wrapper = document.createElement('div');
    wrapper.className = 'mine-wrapper';
    wrapper.id = `mine-wrapper-${id}`;

    const btn = document.createElement('button');
    btn.className = 'game-btn mine-btn';
    btn.id = `mine-btn-${id}`;
    btn.disabled = state.deposits[id] <= 0 || mining.active;
    btn.innerHTML = `
      <div class="btn-icon" style="background:${def.color}"></div>
      <span class="btn-label">Mine ${def.name}</span>
      <span class="btn-cost">${state.deposits[id]} remaining · ${(mineTime / 1000).toFixed(1)}s</span>
    `;
    btn.addEventListener('click', () => startMine(id, def));

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container mine-bar-container';
    barContainer.id = `mine-bar-container-${id}`;
    // bar always visible — width handles progress

    const bar = document.createElement('div');
    bar.className = 'bar mine-bar';
    bar.id = `mine-bar-${id}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);
    wrapper.appendChild(btn);
    wrapper.appendChild(barContainer);
    dom.mineButtons.appendChild(wrapper);
  }
}

function startMine(id, def) {
  const mining = state.mining[id];
  if (mining.active || state.deposits[id] <= 0) return;

  mining.active = true;
  mining.startTime = Date.now();
  mining.duration = getMineTime(id);

  const btn = document.getElementById(`mine-btn-${id}`);
  if (btn) btn.disabled = true;
  if (!mineTickRunning) {
    mineTickRunning = true;
    requestAnimationFrame(mineTick);
  }
}

let mineTickRunning = false;

function mineTick() {
  let anyActive = false;

  for (const [id, def] of Object.entries(RESOURCES)) {
    if (!def.perClick) continue;
    const mining = state.mining[id];
    if (!mining || !mining.active) continue;

    const elapsed = Date.now() - mining.startTime;
    const pct = Math.min(100, (elapsed / mining.duration) * 100);

    const bar = document.getElementById(`mine-bar-${id}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= mining.duration) {
      // Mining complete
      state.deposits[id] -= def.perClick;
      state.resources[id] += def.perClick;
      mining.active = false;

      if (bar) bar.style.width = '0%';

      updateResourceCount(id);
      updateCraftButtons();
      updateToolButtons();
      updateHandcraftButtons();
      updateSmeltButtons();
      updateFactoryButtons();

      // Update mine button
      const btn = document.getElementById(`mine-btn-${id}`);
      if (btn) {
        const mineTime = getMineTime(id);
        const costSpan = btn.querySelector('.btn-cost');
        if (costSpan) costSpan.textContent = `${state.deposits[id]} remaining · ${(mineTime / 1000).toFixed(1)}s`;
        btn.disabled = state.deposits[id] <= 0;
      }
    } else {
      anyActive = true;
    }
  }

  if (anyActive) {
    requestAnimationFrame(mineTick);
  } else {
    mineTickRunning = false;
  }
}

// ========== TOOLS SYSTEM ==========

function renderTools() {
  let anyVisible = false;

  dom.toolsButtons.innerHTML = '';
  for (const tool of TOOLS) {
    if (tool.unlockRequires && !state.discovered[tool.unlockRequires]) continue;
    if (state.tools[tool.id]) continue; // already crafted
    anyVisible = true;

    const btn = document.createElement('button');
    btn.className = 'game-btn tool-btn';
    btn.dataset.toolId = tool.id;
    btn.innerHTML = `
      <span class="btn-label">${tool.name}</span>
      <span class="btn-cost">${formatCost(tool.cost)}</span>
      <span class="btn-desc">${tool.desc}</span>
    `;
    btn.disabled = !canAfford(tool.cost);
    btn.addEventListener('click', () => craftTool(tool));
    dom.toolsButtons.appendChild(btn);
  }

  if (anyVisible) {
    showPanel(dom.toolsPanel);
  } else {
    dom.toolsPanel.classList.add('hidden');
  }
}

function craftTool(tool) {
  if (state.tools[tool.id]) return;
  if (!consumeResources(tool.cost)) return;
  state.tools[tool.id] = true;

  showMessage(`Crafted ${tool.name}!`, 'success');
  renderAll();
}

function updateToolButtons() {
  const buttons = dom.toolsButtons.querySelectorAll('.tool-btn');
  buttons.forEach(btn => {
    const tool = TOOLS.find(t => t.id === btn.dataset.toolId);
    if (tool) {
      btn.disabled = !canAfford(tool.cost);
      const costSpan = btn.querySelector('.btn-cost');
      if (costSpan) costSpan.innerHTML = formatCost(tool.cost);
    }
  });
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
    showPanel(dom.craftPanel);
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

function consumeResources(cost) {
  if (!canAfford(cost)) return false;
  for (const [r, n] of Object.entries(cost)) state.resources[r] -= n;
  return true;
}

function buildCraft(craft) {
  if (!consumeResources(craft.cost)) return;
  state.structures[craft.id] = (state.structures[craft.id] || 0) + 1;
  if (craft.id === 'furnace') {
    state.furnaces.push({ active: false, recipe: null, startTime: 0, duration: 0, electric: false });
  }
  if (craft.id === 'factory') {
    state.factories.push({ active: false, recipe: null, startTime: 0, duration: 0, electric: false });
  }
  if (craft.id === 'power_plant') {
    state.power_plants.push({ active: false, recipe: null, startTime: 0, duration: 0 });
    // Start auto-loop if not running
    if (!powerTickRunning) {
      powerTickRunning = true;
      requestAnimationFrame(powerTick);
    }
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
  showPanel(dom.smeltPanel);

  renderSmeltButtons();
  renderFurnaceSlots();
}

function getSmeltRecipes() {
  // Show normal recipes if any non-electric furnaces are idle, electric recipes if any electric furnaces are idle
  const recipes = [];
  const hasIdleNormal = state.furnaces.some(f => !f.active && !f.electric);
  const hasIdleElectric = state.furnaces.some(f => !f.active && f.electric);

  if (hasIdleNormal) {
    for (const r of SMELT_RECIPES) recipes.push({ ...r, electric: false });
  }
  if (hasIdleElectric) {
    for (const r of ELECTRIC_SMELT_RECIPES) recipes.push({ ...r, electric: true });
  }
  // If no idle furnaces, show normal recipes (will be disabled)
  if (!hasIdleNormal && !hasIdleElectric) {
    for (const r of SMELT_RECIPES) recipes.push({ ...r, electric: false });
  }
  return recipes;
}

function renderSmeltButtons() {
  dom.smeltButtons.innerHTML = '';

  const idleNormal = state.furnaces.filter(f => !f.active && !f.electric).length;
  const idleElectric = state.furnaces.filter(f => !f.active && f.electric).length;
  const recipes = getSmeltRecipes();

  for (const recipe of recipes) {
    const inputResources = Object.keys(recipe.input);
    const allDiscovered = inputResources.every(r => state.discovered[r]);
    if (!allDiscovered) continue;

    const idle = recipe.electric ? idleElectric : idleNormal;
    const label = recipe.electric ? 'electric furnace' : 'furnace';
    const btn = document.createElement('button');
    btn.className = 'game-btn smelt-btn' + (recipe.electric ? ' electric' : '');
    btn.dataset.recipeId = recipe.id;
    btn.dataset.electric = recipe.electric ? '1' : '0';
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}${recipe.electric ? ' ⚡' : ''}</span>
      <span class="btn-cost">${formatCost(recipe.input, ' + ')}</span>
      <span class="btn-cost">${idle} ${label}${idle !== 1 ? 's' : ''} available</span>
    `;
    btn.disabled = !canAfford(recipe.input) || idle === 0;
    btn.addEventListener('click', () => startSmelt(recipe, recipe.electric));
    dom.smeltButtons.appendChild(btn);
  }
}

function updateSmeltButtons() {
  // Re-render smelt buttons since available recipe set can change when furnaces become idle
  renderSmeltButtons();
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
    label.textContent = f.electric ? `⚡ Electric Furnace ${i + 1}` : `Furnace ${i + 1}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `furnace-status-${i}`;
    statusText.textContent = f.active ? `Smelting ${RESOURCES[f.recipe.output].name}...` : 'Idle';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = f.electric ? 'bar electric-bar-fill' : 'bar';
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
function startSmelt(recipe, electric = false) {
  const furnaceIndex = state.furnaces.findIndex(f => !f.active && f.electric === electric);
  if (furnaceIndex === -1) return;
  if (!consumeResources(recipe.input)) return;

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
      renderUpgrade();
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
    showPanel(dom.handcraftPanel);
  } else {
    dom.handcraftPanel.classList.add('hidden');
  }
}

function handcraft(recipe, event) {
  if (!consumeResources(recipe.input)) return;
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
  showPanel(dom.factoryPanel);

  renderFactoryButtons();
  renderFactorySlots();
}

function getFactoryRecipes() {
  const recipes = [];
  const hasIdleNormal = state.factories.some(f => !f.active && !f.electric);
  const hasIdleElectric = state.factories.some(f => !f.active && f.electric);

  if (hasIdleNormal) {
    for (const r of FACTORY_RECIPES) recipes.push({ ...r, electric: false });
  }
  if (hasIdleElectric) {
    for (const r of ELECTRIC_FACTORY_RECIPES) recipes.push({ ...r, electric: true });
  }
  if (!hasIdleNormal && !hasIdleElectric) {
    for (const r of FACTORY_RECIPES) recipes.push({ ...r, electric: false });
  }
  return recipes;
}

function renderFactoryButtons() {
  dom.factoryButtons.innerHTML = '';
  const idleNormal = state.factories.filter(f => !f.active && !f.electric).length;
  const idleElectric = state.factories.filter(f => !f.active && f.electric).length;
  const recipes = getFactoryRecipes();

  for (const recipe of recipes) {
    const inputResources = Object.keys(recipe.input);
    const allDiscovered = inputResources.every(r => state.discovered[r]);
    if (!allDiscovered) continue;

    const idle = recipe.electric ? idleElectric : idleNormal;
    const label = recipe.electric ? 'electric factor' : 'factor';
    const btn = document.createElement('button');
    btn.className = 'game-btn factory-recipe-btn' + (recipe.electric ? ' electric' : '');
    btn.dataset.recipeId = recipe.id;
    btn.dataset.electric = recipe.electric ? '1' : '0';
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[recipe.output].color}"></div>
      <span class="btn-label">${recipe.name}${recipe.electric ? ' ⚡' : ''}</span>
      <span class="btn-cost">${formatCost(recipe.input, ' + ')}</span>
      <span class="btn-cost">${idle} ${label}${idle !== 1 ? 'ies' : 'y'} available</span>
    `;
    btn.disabled = !canAfford(recipe.input) || idle === 0;
    btn.addEventListener('click', () => startFactory(recipe, recipe.electric));
    dom.factoryButtons.appendChild(btn);
  }
}

function updateFactoryButtons() {
  renderFactoryButtons();
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
    label.textContent = f.electric ? `⚡ Electric Factory ${i + 1}` : `Factory ${i + 1}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `factory-status-${i}`;
    statusText.textContent = f.active ? `Making ${RESOURCES[f.recipe.output].name}...` : 'Idle';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = f.electric ? 'bar electric-bar-fill' : 'bar factory-bar-fill';
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

function startFactory(recipe, electric = false) {
  const factoryIndex = state.factories.findIndex(f => !f.active && f.electric === electric);
  if (factoryIndex === -1) return;
  if (!consumeResources(recipe.input)) return;

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
      renderCraft();
      renderHandcraft();
      renderUpgrade();
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

// ========== POWER PLANT SYSTEM ==========

function renderPower() {
  if (!state.structures.power_plant) {
    dom.powerPanel.classList.add('hidden');
    return;
  }
  showPanel(dom.powerPanel);

  // Show recipe info (no start button — plants auto-run)
  const recipe = POWER_RECIPES[0];
  dom.powerButtons.innerHTML = `
    <div style="font-size:0.8rem;color:#888;margin-bottom:4px;">
      Each plant continuously converts ${formatCost(recipe.input, ' + ')} → ${recipe.outputQty} ${RESOURCES[recipe.output].name} every ${(recipe.time / 1000).toFixed(0)}s
    </div>
  `;

  renderPowerSlots();

  // Start the auto-loop if not already running
  if (!powerTickRunning && state.power_plants.length > 0) {
    powerTickRunning = true;
    requestAnimationFrame(powerTick);
  }
}

function renderPowerSlots() {
  dom.powerSlots.innerHTML = '';
  for (let i = 0; i < state.power_plants.length; i++) {
    const p = state.power_plants[i];
    const slot = document.createElement('div');
    slot.className = 'furnace-slot' + (p.active ? ' active' : '');
    slot.id = `power-slot-${i}`;

    const label = document.createElement('div');
    label.className = 'furnace-slot-label';
    label.textContent = `Coal Power Plant ${i + 1}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `power-status-${i}`;
    statusText.textContent = p.active ? 'Generating power...' : 'Waiting for coal...';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = 'bar power-bar-fill';
    bar.id = `power-bar-${i}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);

    const header = document.createElement('div');
    header.className = 'furnace-slot-header';
    header.appendChild(label);
    header.appendChild(statusText);

    slot.appendChild(header);
    slot.appendChild(barContainer);
    dom.powerSlots.appendChild(slot);
  }
}

let powerTickRunning = false;

function powerTick() {
  let anyPlant = state.power_plants.length > 0;
  if (!anyPlant) { powerTickRunning = false; return; }

  const recipe = POWER_RECIPES[0];

  for (let i = 0; i < state.power_plants.length; i++) {
    const p = state.power_plants[i];

    // Try to start idle plants
    if (!p.active) {
      if (canAfford(recipe.input)) {
        for (const [r, n] of Object.entries(recipe.input)) {
          state.resources[r] -= n;
        }
        p.active = true;
        p.recipe = recipe;
        p.startTime = Date.now();
        p.duration = recipe.time;

        renderResources();

        const slot = document.getElementById(`power-slot-${i}`);
        if (slot) slot.classList.add('active');
        const statusEl = document.getElementById(`power-status-${i}`);
        if (statusEl) statusEl.textContent = 'Generating power...';
      }
      continue;
    }

    // Update active plants
    const elapsed = Date.now() - p.startTime;
    const pct = Math.min(100, (elapsed / p.duration) * 100);

    const bar = document.getElementById(`power-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= p.duration) {
      const qty = p.recipe.outputQty;
      state.resources[p.recipe.output] += qty;
      state.discovered[p.recipe.output] = true;

      p.active = false;
      p.recipe = null;

      if (bar) bar.style.width = '0%';

      // Immediately try to start next cycle
      if (canAfford(recipe.input)) {
        for (const [r, n] of Object.entries(recipe.input)) {
          state.resources[r] -= n;
        }
        p.active = true;
        p.recipe = recipe;
        p.startTime = Date.now();
        p.duration = recipe.time;

        const statusEl = document.getElementById(`power-status-${i}`);
        if (statusEl) statusEl.textContent = 'Generating power...';
      } else {
        const slot = document.getElementById(`power-slot-${i}`);
        if (slot) slot.classList.remove('active');
        const statusEl = document.getElementById(`power-status-${i}`);
        if (statusEl) statusEl.textContent = 'Waiting for coal...';
      }

      renderResources();
      updateSmeltButtons();
      updateFactoryButtons();
      renderUpgrade();
    }
  }

  requestAnimationFrame(powerTick);
}

// ========== UPGRADE / RETROFIT SYSTEM ==========

function renderUpgrade() {
  let anyVisible = false;

  dom.upgradeButtons.innerHTML = '';
  for (const upgrade of UPGRADES) {
    if (upgrade.unlockRequires && !state.discovered[upgrade.unlockRequires]) continue;

    // Count non-electric slots of the target type
    let upgradeableCount = 0;
    if (upgrade.target === 'furnace') {
      upgradeableCount = state.furnaces.filter(f => !f.electric && !f.active).length;
    } else if (upgrade.target === 'factory') {
      upgradeableCount = state.factories.filter(f => !f.electric && !f.active).length;
    }

    if (upgradeableCount === 0 && !canAfford(upgrade.cost)) continue;
    anyVisible = true;

    const btn = document.createElement('button');
    btn.className = 'game-btn upgrade-btn';
    btn.innerHTML = `
      <span class="btn-label">${upgrade.name} ⚡</span>
      <span class="btn-cost">${formatCost(upgrade.cost)}</span>
      <span class="btn-cost">${upgradeableCount} available to upgrade</span>
    `;
    btn.disabled = !canAfford(upgrade.cost) || upgradeableCount === 0;
    btn.addEventListener('click', () => applyUpgrade(upgrade));
    dom.upgradeButtons.appendChild(btn);
  }

  if (anyVisible) {
    showPanel(dom.upgradePanel);
  } else {
    dom.upgradePanel.classList.add('hidden');
  }
}

function applyUpgrade(upgrade) {
  let slotIndex = -1;
  if (upgrade.target === 'furnace') {
    slotIndex = state.furnaces.findIndex(f => !f.electric && !f.active);
    if (slotIndex === -1) return;
  } else if (upgrade.target === 'factory') {
    slotIndex = state.factories.findIndex(f => !f.electric && !f.active);
    if (slotIndex === -1) return;
  }

  if (!consumeResources(upgrade.cost)) return;

  // Apply upgrade
  if (upgrade.target === 'furnace') {
    state.furnaces[slotIndex].electric = true;
    showMessage(`Upgraded Furnace ${slotIndex + 1} to Electric!`, 'success');
  } else if (upgrade.target === 'factory') {
    state.factories[slotIndex].electric = true;
    showMessage(`Upgraded Factory ${slotIndex + 1} to Electric!`, 'success');
  }

  renderAll();
}

// ========== WORKER SYSTEM ==========

function renderWorkers() {
  if (!state.discovered.food && !state.discovered.wood) {
    dom.workerPanel.classList.add('hidden');
    return;
  }
  showPanel(dom.workerPanel);

  // Build one row per worker type: [Hire btn] [mini worker boxes...]
  dom.workerRows.innerHTML = '';
  for (const w of WORKERS) {
    const row = document.createElement('div');
    row.className = 'worker-row';

    const btn = document.createElement('button');
    btn.className = 'game-btn worker-btn';
    btn.dataset.workerId = w.id;
    btn.innerHTML = `
      <span class="btn-label">${w.name}</span>
      <span class="btn-cost">${formatCost(w.cost)}</span>
    `;
    btn.disabled = !canAfford(w.cost);
    btn.addEventListener('click', () => hireWorker(w));
    row.appendChild(btn);

    // Mini boxes for hired workers of this type
    const boxes = document.createElement('div');
    boxes.className = 'worker-boxes';
    const workers = state.workers.filter(sw => sw.type === w.id);
    workers.forEach((sw, j) => {
      const idx = state.workers.indexOf(sw);
      const box = document.createElement('div');
      box.className = 'worker-box' + (sw.active ? ' active' : '');
      box.id = `worker-slot-${idx}`;

      const icon = document.createElement('div');
      icon.className = 'worker-box-icon';
      icon.style.background = w.id === 'field_worker' ? '#4caf50' : w.id === 'woodcutter' ? '#8B5E3C' : '#536dfe';
      icon.textContent = w.id === 'field_worker' ? 'F' : w.id === 'woodcutter' ? 'W' : 'E';

      const bar = document.createElement('div');
      bar.className = 'worker-box-bar';
      const fill = document.createElement('div');
      fill.className = 'worker-box-fill';
      fill.id = `worker-bar-${idx}`;
      fill.style.width = '0%';
      bar.appendChild(fill);

      box.appendChild(icon);
      box.appendChild(bar);
      boxes.appendChild(box);
    });
    row.appendChild(boxes);
    dom.workerRows.appendChild(row);
  }

  // Worker upgrades
  dom.workerUpgradeButtons.innerHTML = '';
  for (const u of WORKER_UPGRADES) {
    if (u.unlockRequires && !state.discovered[u.unlockRequires]) continue;
    if (u.id === 'stone_tools' && state.stoneTools) continue;

    const btn = document.createElement('button');
    btn.className = 'game-btn upgrade-btn';
    btn.innerHTML = `
      <span class="btn-label">${u.name}</span>
      <span class="btn-cost">${formatCost(u.cost)}</span>
      <span class="btn-desc">${u.desc}</span>
    `;
    btn.disabled = !canAfford(u.cost);
    btn.addEventListener('click', () => applyWorkerUpgrade(u));
    dom.workerUpgradeButtons.appendChild(btn);
  }
}

function updateWorkerButtons() {
  const buttons = dom.workerRows.querySelectorAll('.worker-btn');
  buttons.forEach(btn => {
    const w = WORKERS.find(d => d.id === btn.dataset.workerId);
    if (w) {
      btn.disabled = !canAfford(w.cost);
      const costSpan = btn.querySelector('.btn-cost');
      if (costSpan) costSpan.innerHTML = formatCost(w.cost);
    }
  });
}

function hireWorker(workerDef) {
  if (!consumeResources(workerDef.cost)) return;

  state.workers.push({
    type: workerDef.id,
    active: true,
    lastTick: Date.now(),
  });

  showMessage(`Hired ${workerDef.name}!`, 'success');
  renderAll();

  if (!workerTickRunning) {
    workerTickRunning = true;
    requestAnimationFrame(workerTick);
  }
}

function applyWorkerUpgrade(upgrade) {
  if (!consumeResources(upgrade.cost)) return;

  if (upgrade.id === 'stone_tools') {
    state.stoneTools = true;
    showMessage('Workers equipped with stone tools! 50% faster.', 'success');
  }
  renderAll();
}

function getWorkerInterval(workerDef) {
  let interval = workerDef.interval;
  if (state.tools.axe) interval = Math.floor(interval * 0.5);
  if (state.stoneTools) interval = Math.floor(interval * 0.5);
  return interval;
}


let workerTickRunning = false;

function workerTick() {
  if (state.workers.length === 0) { workerTickRunning = false; return; }

  for (let i = 0; i < state.workers.length; i++) {
    const w = state.workers[i];
    const def = WORKERS.find(d => d.id === w.type);
    if (!def) continue;

    const interval = getWorkerInterval(def);

    // Build input cost for this cycle
    const input = { ...def.input };

    // Check if we can afford the input
    const box = document.getElementById(`worker-slot-${i}`);
    if (!w.active) {
      if (canAfford(input)) {
        w.active = true;
        w.lastTick = Date.now();
        if (box) box.classList.add('active');
      }
      continue;
    }

    const elapsed = Date.now() - w.lastTick;
    const pct = Math.min(100, (elapsed / interval) * 100);

    const bar = document.getElementById(`worker-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= interval) {
      // Consume inputs
      if (!canAfford(input)) {
        w.active = false;
        if (bar) bar.style.width = '0%';
        if (box) box.classList.remove('active');
        continue;
      }

      for (const [r, n] of Object.entries(input)) {
        state.resources[r] -= n;
      }

      // Produce output
      if (def.output) {
        state.resources[def.output] += def.outputQty;
        state.discovered[def.output] = true;
      } else if (def.exploreTargets) {
        // Explorer: add deposits to a random target
        const target = def.exploreTargets[Math.floor(Math.random() * def.exploreTargets.length)];
        const amount = 2 + Math.floor(Math.random() * 4);
        state.deposits[target] += amount;
        state.discovered[target] = true;
      }

      w.lastTick = Date.now();
      renderResources();
      renderMine();
    }
  }

  requestAnimationFrame(workerTick);
}

// ========== AUTO MINER SYSTEM ==========

const AUTO_MINER_ITERATIONS = 15;
const AUTO_MINER_INTERVAL = 3000; // ms between each auto-mine

function renderAutoMiners() {
  if (!state.discovered.auto_miner) {
    dom.autoMinerPanel.classList.add('hidden');
    return;
  }
  showPanel(dom.autoMinerPanel);

  // Deploy buttons
  dom.autoMinerButtons.innerHTML = '';
  const deployable = Object.entries(RESOURCES).filter(([id]) =>
    state.deposits[id] > 0 && MINE_TIMES[id]
  );

  for (const [id, def] of deployable) {
    const btn = document.createElement('button');
    btn.className = 'game-btn auto-miner-btn';
    btn.innerHTML = `
      <div class="btn-icon" style="background:${def.color}"></div>
      <span class="btn-label">Deploy on ${def.name}</span>
      <span class="btn-cost">Uses 1 Auto Miner · ${AUTO_MINER_ITERATIONS} units · ${state.deposits[id]} in deposit</span>
    `;
    btn.disabled = state.resources.auto_miner < 1 || state.deposits[id] <= 0;
    btn.addEventListener('click', () => deployAutoMiner(id));
    dom.autoMinerButtons.appendChild(btn);
  }
  if (deployable.length === 0) {
    dom.autoMinerButtons.innerHTML = '<span style="color:#555;font-size:0.8rem;">No deposits available to mine</span>';
  }

  // Active slots
  renderAutoMinerSlots();
}

function deployAutoMiner(resourceId) {
  if (state.resources.auto_miner < 1 || state.deposits[resourceId] <= 0) return;

  state.resources.auto_miner -= 1;
  const iterations = Math.min(AUTO_MINER_ITERATIONS, state.deposits[resourceId]);
  state.auto_miners.push({
    active: true,
    resourceId,
    startTime: Date.now(),
    interval: AUTO_MINER_INTERVAL,
    remaining: iterations,
    total: iterations,
    lastTick: Date.now(),
  });

  showMessage(`Deployed Auto Miner on ${RESOURCES[resourceId].name}!`, 'success');
  renderResources();
  renderAutoMiners();
  updateHandcraftButtons();

  if (!autoMinerTickRunning) {
    autoMinerTickRunning = true;
    requestAnimationFrame(autoMinerTick);
  }
}

function renderAutoMinerSlots() {
  dom.autoMinerSlots.innerHTML = '';
  for (let i = 0; i < state.auto_miners.length; i++) {
    const m = state.auto_miners[i];
    if (!m.active) continue;

    const slot = document.createElement('div');
    slot.className = 'furnace-slot active';
    slot.id = `auto-miner-slot-${i}`;

    const label = document.createElement('div');
    label.className = 'furnace-slot-label';
    label.textContent = `Auto Miner: ${RESOURCES[m.resourceId].name}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `auto-miner-status-${i}`;
    statusText.textContent = `${m.remaining}/${m.total} remaining`;

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = 'bar auto-miner-bar-fill';
    bar.id = `auto-miner-bar-${i}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);

    const header = document.createElement('div');
    header.className = 'furnace-slot-header';
    header.appendChild(label);
    header.appendChild(statusText);

    slot.appendChild(header);
    slot.appendChild(barContainer);
    dom.autoMinerSlots.appendChild(slot);
  }
}

let autoMinerTickRunning = false;

function autoMinerTick() {
  let anyActive = false;

  for (let i = 0; i < state.auto_miners.length; i++) {
    const m = state.auto_miners[i];
    if (!m.active) continue;

    const elapsed = Date.now() - m.lastTick;
    const pct = Math.min(100, (elapsed / m.interval) * 100);

    const bar = document.getElementById(`auto-miner-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= m.interval) {
      // Mine one unit
      if (state.deposits[m.resourceId] > 0) {
        state.deposits[m.resourceId] -= 1;
        state.resources[m.resourceId] += 1;
        m.remaining -= 1;
        m.lastTick = Date.now();

        updateResourceCount(m.resourceId);
        updateCraftButtons();
        updateToolButtons();
        updateSmeltButtons();
        updateFactoryButtons();
      }

      if (m.remaining <= 0 || state.deposits[m.resourceId] <= 0) {
        m.active = false;
        showMessage(`Auto Miner finished: ${RESOURCES[m.resourceId].name}`, 'success');
        renderAutoMiners();
        renderMine();
      } else {
        const statusEl = document.getElementById(`auto-miner-status-${i}`);
        if (statusEl) statusEl.textContent = `${m.remaining}/${m.total} remaining`;
      }
    }

    if (m.active) anyActive = true;
  }

  if (anyActive) {
    requestAnimationFrame(autoMinerTick);
  } else {
    autoMinerTickRunning = false;
    // Clean up finished miners
    state.auto_miners = state.auto_miners.filter(m => m.active);
    renderAutoMiners();
  }
}

// ========== SEARCH DRONE SYSTEM ==========

const DRONE_ITERATIONS = 8;

function renderDrones() {
  if (!state.discovered.search_drone) {
    dom.dronePanel.classList.add('hidden');
    return;
  }
  showPanel(dom.dronePanel);

  dom.droneButtons.innerHTML = '';
  for (const opt of EXPLORE_OPTIONS) {
    if (opt.requiresTool && !state.tools[opt.requiresTool]) continue;
    if (opt.requiresItem && !state.discovered[opt.requiresItem]) continue;

    const btn = document.createElement('button');
    btn.className = 'game-btn drone-btn';
    btn.innerHTML = `
      <div class="btn-icon" style="background:${RESOURCES[opt.id].color}"></div>
      <span class="btn-label">Drone: ${opt.name}</span>
      <span class="btn-cost">Uses 1 Search Drone · ${DRONE_ITERATIONS} searches · ${(opt.time / 1000).toFixed(0)}s each</span>
    `;
    btn.disabled = state.resources.search_drone < 1;
    btn.addEventListener('click', () => deployDrone(opt));
    dom.droneButtons.appendChild(btn);
  }

  renderDroneSlots();
}

function deployDrone(opt) {
  if (state.resources.search_drone < 1) return;

  state.resources.search_drone -= 1;
  state.drones.push({
    active: true,
    optId: opt.id,
    startTime: Date.now(),
    interval: opt.time,
    remaining: DRONE_ITERATIONS,
    total: DRONE_ITERATIONS,
    lastTick: Date.now(),
  });

  showMessage(`Deployed Search Drone for ${RESOURCES[opt.id].name}!`, 'success');
  renderResources();
  renderDrones();
  updateHandcraftButtons();

  if (!droneTickRunning) {
    droneTickRunning = true;
    requestAnimationFrame(droneTick);
  }
}

function renderDroneSlots() {
  dom.droneSlots.innerHTML = '';
  for (let i = 0; i < state.drones.length; i++) {
    const d = state.drones[i];
    if (!d.active) continue;

    const slot = document.createElement('div');
    slot.className = 'furnace-slot active';
    slot.id = `drone-slot-${i}`;

    const label = document.createElement('div');
    label.className = 'furnace-slot-label';
    label.textContent = `Drone: ${RESOURCES[d.optId].name}`;

    const statusText = document.createElement('span');
    statusText.className = 'furnace-slot-status';
    statusText.id = `drone-status-${i}`;
    statusText.textContent = `${d.remaining}/${d.total} searches left`;

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container furnace-bar';

    const bar = document.createElement('div');
    bar.className = 'bar drone-bar-fill';
    bar.id = `drone-bar-${i}`;
    bar.style.width = '0%';

    barContainer.appendChild(bar);

    const header = document.createElement('div');
    header.className = 'furnace-slot-header';
    header.appendChild(label);
    header.appendChild(statusText);

    slot.appendChild(header);
    slot.appendChild(barContainer);
    dom.droneSlots.appendChild(slot);
  }
}

let droneTickRunning = false;

function droneTick() {
  let anyActive = false;

  for (let i = 0; i < state.drones.length; i++) {
    const d = state.drones[i];
    if (!d.active) continue;

    const elapsed = Date.now() - d.lastTick;
    const pct = Math.min(100, (elapsed / d.interval) * 100);

    const bar = document.getElementById(`drone-bar-${i}`);
    if (bar) bar.style.width = pct + '%';

    if (elapsed >= d.interval) {
      // Complete one search
      const opt = EXPLORE_OPTIONS.find(o => o.id === d.optId);
      if (opt) {
        const [minYield, maxYield] = opt.yield;
        const amount = minYield + Math.floor(Math.random() * (maxYield - minYield + 1));
        state.deposits[d.optId] += amount;
        state.discovered[d.optId] = true;
        showMessage(`Drone found ${amount} ${RESOURCES[d.optId].name}!`, 'discover');
        renderResources();
        renderMine();
        renderAutoMiners();
      }

      d.remaining -= 1;
      d.lastTick = Date.now();

      if (d.remaining <= 0) {
        d.active = false;
        showMessage(`Search Drone finished: ${RESOURCES[d.optId].name}`, 'success');
        renderDrones();
      } else {
        const statusEl = document.getElementById(`drone-status-${i}`);
        if (statusEl) statusEl.textContent = `${d.remaining}/${d.total} searches left`;
      }
    }

    if (d.active) anyActive = true;
  }

  if (anyActive) {
    requestAnimationFrame(droneTick);
  } else {
    droneTickRunning = false;
    state.drones = state.drones.filter(d => d.active);
    renderDrones();
  }
}

// ========== ACCORDION SYSTEM ==========

function showPanel(panel) {
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    if (!state.revealed[panel.id]) {
      state.revealed[panel.id] = true;
      panel.classList.add('panel-reveal');
      panel.addEventListener('animationend', () => panel.classList.remove('panel-reveal'), { once: true });
    }
  }
}

// ========== RENDER ALL ==========

function renderAll() {
  renderResources();
  renderExplore();
  renderMine();
  renderTools();
  renderWorkers();
  renderAutoMiners();
  renderDrones();
  renderCraft();
  renderHandcraft();
  renderSmelt();
  renderFactory();
  renderPower();
  renderUpgrade();
}

// Init
renderAll();
// Start worker tick if there are workers
if (state.workers.length > 0 && !workerTickRunning) {
  workerTickRunning = true;
  requestAnimationFrame(workerTick);
}

// Poll button affordability every 200ms so UI never goes stale
setInterval(() => {
  updateWorkerButtons();
  updateToolButtons();
  updateCraftButtons();
  updateSmeltButtons();
}, 200);
