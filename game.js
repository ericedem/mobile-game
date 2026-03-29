// Game state
const state = {
  area: 1,
  player: {
    level: 1,
    xp: 0,
    gold: 0,
    hp: 100,
    maxHp: 100,
    baseAtk: 15,
    baseDef: 0,
    baseMaxHp: 100,
    heals: 3,
    maxHeals: 3,
    equipment: { weapon: null, armor: null, accessory: null }
  },
  monster: null,
  inBattle: false
};

// Computed player stats (base + equipment)
function getPlayerAtk() {
  let atk = state.player.baseAtk;
  const w = state.player.equipment.weapon;
  if (w) atk += w.atk;
  return atk;
}

function getPlayerDef() {
  let def = state.player.baseDef;
  const a = state.player.equipment.armor;
  if (a) def += a.def;
  return def;
}

function getPlayerMaxHp() {
  let hp = state.player.baseMaxHp;
  const c = state.player.equipment.accessory;
  if (c) hp += c.maxHp;
  return hp;
}

// DOM refs
const screens = {
  title: document.getElementById('title-screen'),
  battle: document.getElementById('battle-screen'),
  victory: document.getElementById('victory-screen'),
  shop: document.getElementById('shop-screen'),
  gameover: document.getElementById('gameover-screen')
};

const ui = {
  playerName: document.getElementById('player-name'),
  playerHpBar: document.getElementById('player-hp-bar'),
  playerHpText: document.getElementById('player-hp-text'),
  playerXpBar: document.getElementById('player-xp-bar'),
  playerXpText: document.getElementById('player-xp-text'),
  monsterHpBar: document.getElementById('monster-hp-bar'),
  monsterHpText: document.getElementById('monster-hp-text'),
  monsterName: document.getElementById('monster-name'),
  areaNum: document.getElementById('area-num'),
  goldDisplay: document.getElementById('gold-display'),
  battleLog: document.getElementById('battle-log'),
  monsterCanvas: document.getElementById('monster-canvas'),
  monsterContainer: document.getElementById('monster-container'),
  damageFlash: document.getElementById('damage-flash'),
  slashEffect: document.getElementById('slash-effect'),
  healCount: document.getElementById('heal-count'),
  attackBtn: document.getElementById('attack-btn'),
  healBtn: document.getElementById('heal-btn'),
  victoryText: document.getElementById('victory-text'),
  victoryReward: document.getElementById('victory-reward'),
  gameoverText: document.getElementById('gameover-text'),
  shopGoldAmount: document.getElementById('shop-gold-amount'),
  shopItems: document.getElementById('shop-items'),
  shopNextArea: document.getElementById('shop-next-area'),
  equippedList: document.getElementById('equipped-list')
};

// Screen management
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// Update HUD
function updateHud() {
  const maxHp = getPlayerMaxHp();
  state.player.maxHp = maxHp;
  if (state.player.hp > maxHp) state.player.hp = maxHp;

  const hpPct = Math.max(0, state.player.hp / maxHp * 100);
  ui.playerHpBar.style.width = hpPct + '%';
  ui.playerHpBar.classList.toggle('low', hpPct < 25);
  ui.playerHpText.textContent = `${state.player.hp} / ${maxHp}`;

  const xpNeeded = xpForLevel(state.player.level);
  const xpPct = Math.min(100, state.player.xp / xpNeeded * 100);
  ui.playerXpBar.style.width = xpPct + '%';
  ui.playerXpText.textContent = `XP ${state.player.xp} / ${xpNeeded}`;

  ui.playerName.textContent = `Hero Lv.${state.player.level}`;
  ui.areaNum.textContent = state.area;
  ui.goldDisplay.textContent = `${state.player.gold}g`;
  ui.healCount.textContent = `(${state.player.heals})`;
}

function updateMonsterHp() {
  const pct = Math.max(0, state.monster.hp / state.monster.maxHp * 100);
  ui.monsterHpBar.style.width = pct + '%';
  ui.monsterHpText.textContent = `${state.monster.hp} / ${state.monster.maxHp}`;
}

// Battle log
function log(text, type = '') {
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (type ? ` log-${type}` : '');
  entry.textContent = text;
  ui.battleLog.appendChild(entry);
  ui.battleLog.scrollTop = ui.battleLog.scrollHeight;
  while (ui.battleLog.children.length > 20) {
    ui.battleLog.removeChild(ui.battleLog.firstChild);
  }
}

// Draw monster on canvas
function drawMonster() {
  const ctx = ui.monsterCanvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 200);
  if (state.monster) {
    state.monster.draw(ctx, 200, 200);
  }
}

// Floating damage number
function showDamageNumber(amount, type) {
  const el = document.createElement('div');
  el.className = `damage-number ${type}`;
  el.textContent = type === 'heal-num' ? `+${amount}` : `-${amount}`;
  const arena = document.getElementById('arena');
  const rect = arena.getBoundingClientRect();
  el.style.left = (rect.width / 2 - 20 + (Math.random() * 40 - 20)) + 'px';
  el.style.top = (rect.height / 2 - 20) + 'px';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Effects
function playSlash() {
  ui.slashEffect.classList.remove('active');
  void ui.slashEffect.offsetWidth;
  ui.slashEffect.classList.add('active');
}

function playHit() {
  ui.monsterContainer.classList.remove('hit');
  void ui.monsterContainer.offsetWidth;
  ui.monsterContainer.classList.add('hit');
}

function playDamageFlash() {
  ui.damageFlash.classList.remove('flash');
  void ui.damageFlash.offsetWidth;
  ui.damageFlash.classList.add('flash');
}

// Calculate damage with variance and defense
function calcDamage(base, def) {
  const variance = 0.2;
  const mult = 1 + (Math.random() * 2 - 1) * variance;
  const raw = Math.round(base * mult);
  return Math.max(1, raw - (def || 0));
}

// XP and leveling
function grantXp(amount) {
  state.player.xp += amount;
  let leveled = false;
  while (state.player.xp >= xpForLevel(state.player.level)) {
    state.player.xp -= xpForLevel(state.player.level);
    state.player.level++;
    const gains = levelUpStats();
    state.player.baseMaxHp += gains.maxHp;
    state.player.baseAtk += gains.atk;
    state.player.maxHp = getPlayerMaxHp();
    state.player.hp = state.player.maxHp; // Full heal on level up
    leveled = true;
  }
  return leveled;
}

// Start new battle in current area
function startBattle() {
  state.monster = getMonsterForArea(state.area);
  state.inBattle = true;

  ui.monsterName.textContent = state.monster.name;
  ui.battleLog.innerHTML = '';
  ui.monsterContainer.classList.remove('dying');

  updateHud();
  updateMonsterHp();
  drawMonster();
  setControls(true);

  showScreen('battle');
  log(`A ${state.monster.name} appears!`, 'info');
}

// Enable/disable controls
function setControls(enabled) {
  ui.attackBtn.disabled = !enabled;
  ui.healBtn.disabled = !enabled || state.player.heals <= 0;
}

// Player attacks monster
function playerAttack() {
  if (!state.inBattle) return;
  setControls(false);

  const dmg = calcDamage(getPlayerAtk(), 0);
  state.monster.hp = Math.max(0, state.monster.hp - dmg);

  playSlash();
  setTimeout(() => {
    playHit();
    showDamageNumber(dmg, 'player-dmg');
    updateMonsterHp();
    log(`You strike for ${dmg} damage!`, 'damage');

    if (state.monster.hp <= 0) {
      monsterDefeated();
    } else {
      setTimeout(() => monsterAttack(), 500);
    }
  }, 150);
}

// Monster attacks player
function monsterAttack() {
  const dmg = calcDamage(state.monster.atk, getPlayerDef());
  state.player.hp = Math.max(0, state.player.hp - dmg);

  playDamageFlash();
  showDamageNumber(dmg, 'player-dmg');
  updateHud();
  log(`${state.monster.name} hits you for ${dmg}!`, 'damage');

  if (state.player.hp <= 0) {
    gameOver();
  } else {
    setControls(true);
  }
}

// Player heals
function playerHeal() {
  if (!state.inBattle || state.player.heals <= 0) return;
  setControls(false);

  state.player.heals--;
  const healAmt = Math.round(state.player.maxHp * 0.35);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);

  showDamageNumber(healAmt, 'heal-num');
  updateHud();
  log(`You heal for ${healAmt} HP!`, 'heal');

  setTimeout(() => monsterAttack(), 500);
}

// Monster defeated
function monsterDefeated() {
  state.inBattle = false;
  ui.monsterContainer.classList.add('dying');

  const xpGain = state.monster.xp;
  const goldGain = state.monster.gold;
  state.player.gold += goldGain;
  const leveled = grantXp(xpGain);

  let rewardText = `+${xpGain} XP, +${goldGain} gold`;
  if (leveled) {
    rewardText += `\nLevel Up! You are now Lv.${state.player.level}!`;
  }

  setTimeout(() => {
    ui.victoryText.textContent = `${state.monster.name} Defeated!`;
    ui.victoryReward.textContent = rewardText;
    showScreen('victory');
  }, 700);
}

// Game over
function gameOver() {
  state.inBattle = false;
  ui.gameoverText.textContent = `You were defeated in Area ${state.area} by ${state.monster.name}.\nYou reached Lv.${state.player.level}.`;
  setTimeout(() => showScreen('gameover'), 500);
}

// Shop
function openShop() {
  const nextArea = state.area + 1;
  ui.shopGoldAmount.textContent = state.player.gold;
  ui.shopNextArea.textContent = nextArea;
  renderShop();
  showScreen('shop');
}

function renderShop() {
  ui.shopGoldAmount.textContent = state.player.gold;

  // Equipped items display
  const eq = state.player.equipment;
  ui.equippedList.innerHTML = '';
  const slots = [
    { key: 'weapon', label: 'Weapon', stat: eq.weapon ? `ATK +${eq.weapon.atk}` : 'None' },
    { key: 'armor', label: 'Armor', stat: eq.armor ? `DEF +${eq.armor.def}` : 'None' },
    { key: 'accessory', label: 'Accessory', stat: eq.accessory ? `HP +${eq.accessory.maxHp}` : 'None' },
  ];
  for (const s of slots) {
    const div = document.createElement('div');
    div.className = 'equipped-slot';
    const item = eq[s.key];
    div.innerHTML = `<span class="slot-label">${s.label}:</span> <span class="slot-item">${item ? item.name : 'Empty'}</span> <span class="slot-stat">${s.stat}</span>`;
    ui.equippedList.appendChild(div);
  }

  // Shop items
  ui.shopItems.innerHTML = '';

  // Equipment section
  const equipHeader = document.createElement('h3');
  equipHeader.textContent = 'Equipment';
  ui.shopItems.appendChild(equipHeader);

  const items = getShopItems(state.area + 1);
  for (const item of items) {
    const owned = eq[item.slot] && eq[item.slot].id === item.id;
    const currentEquip = eq[item.slot];
    let comparison = '';
    if (item.slot === 'weapon') {
      const diff = item.atk - (currentEquip ? currentEquip.atk : 0);
      comparison = diff > 0 ? `ATK +${diff}` : diff === 0 ? 'Equipped' : `ATK ${diff}`;
    } else if (item.slot === 'armor') {
      const diff = item.def - (currentEquip ? currentEquip.def : 0);
      comparison = diff > 0 ? `DEF +${diff}` : diff === 0 ? 'Equipped' : `DEF ${diff}`;
    } else if (item.slot === 'accessory') {
      const diff = item.maxHp - (currentEquip ? currentEquip.maxHp : 0);
      comparison = diff > 0 ? `HP +${diff}` : diff === 0 ? 'Equipped' : `HP ${diff}`;
    }

    const div = document.createElement('div');
    div.className = 'shop-item' + (owned ? ' owned' : '');
    const canAfford = state.player.gold >= item.cost && !owned;
    const isDowngrade = currentEquip && !owned && (
      (item.slot === 'weapon' && item.atk <= currentEquip.atk) ||
      (item.slot === 'armor' && item.def <= currentEquip.def) ||
      (item.slot === 'accessory' && item.maxHp <= currentEquip.maxHp)
    );

    div.innerHTML = `
      <div class="shop-item-info">
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-stat ${isDowngrade ? 'downgrade' : ''}">${comparison}</span>
      </div>
      <button class="btn shop-buy-btn ${owned ? 'owned' : ''}" ${!canAfford ? 'disabled' : ''}>
        ${owned ? 'Owned' : `${item.cost}g`}
      </button>
    `;

    if (canAfford) {
      div.querySelector('button').addEventListener('click', () => {
        state.player.gold -= item.cost;
        state.player.equipment[item.slot] = item;
        state.player.maxHp = getPlayerMaxHp();
        if (state.player.hp > state.player.maxHp) state.player.hp = state.player.maxHp;
        renderShop();
      });
    }

    ui.shopItems.appendChild(div);
  }

  // Consumables section
  const conHeader = document.createElement('h3');
  conHeader.textContent = 'Consumables';
  ui.shopItems.appendChild(conHeader);

  const consumables = getShopConsumables(state.area + 1);
  for (const con of consumables) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const canAfford = state.player.gold >= con.cost;

    div.innerHTML = `
      <div class="shop-item-info">
        <span class="shop-item-name">${con.name}</span>
        <span class="shop-item-stat">+${con.heals} potion${con.heals > 1 ? 's' : ''}</span>
      </div>
      <button class="btn shop-buy-btn" ${!canAfford ? 'disabled' : ''}>
        ${con.cost}g
      </button>
    `;

    if (canAfford) {
      div.querySelector('button').addEventListener('click', () => {
        state.player.gold -= con.cost;
        state.player.heals += con.heals;
        if (state.player.heals > state.player.maxHeals + 5) {
          state.player.heals = state.player.maxHeals + 5;
        }
        renderShop();
      });
    }

    ui.shopItems.appendChild(div);
  }
}

// Reset game
function resetGame() {
  state.area = 1;
  state.player.level = 1;
  state.player.xp = 0;
  state.player.gold = 0;
  state.player.hp = 100;
  state.player.baseMaxHp = 100;
  state.player.maxHp = 100;
  state.player.baseAtk = 15;
  state.player.baseDef = 0;
  state.player.heals = 3;
  state.player.maxHeals = 3;
  state.player.equipment = { weapon: null, armor: null, accessory: null };
  startBattle();
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', () => {
  resetGame();
});

ui.attackBtn.addEventListener('click', () => {
  playerAttack();
});

ui.healBtn.addEventListener('click', () => {
  playerHeal();
});

// Fight again in same area
document.getElementById('next-btn').addEventListener('click', () => {
  startBattle();
});

// Move to next area (via shop)
document.getElementById('next-area-btn').addEventListener('click', () => {
  openShop();
});

// Leave shop, enter next area
document.getElementById('shop-leave-btn').addEventListener('click', () => {
  state.area++;
  // Full heal when entering new area
  state.player.maxHp = getPlayerMaxHp();
  state.player.hp = state.player.maxHp;
  startBattle();
});

document.getElementById('retry-btn').addEventListener('click', () => {
  resetGame();
});
