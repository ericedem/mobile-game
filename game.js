// Game state
const state = {
  floor: 1,
  player: {
    hp: 100,
    maxHp: 100,
    atk: 15,
    heals: 3,
    maxHeals: 3
  },
  monster: null,
  inBattle: false
};

// DOM refs
const screens = {
  title: document.getElementById('title-screen'),
  battle: document.getElementById('battle-screen'),
  victory: document.getElementById('victory-screen'),
  gameover: document.getElementById('gameover-screen')
};

const ui = {
  playerHpBar: document.getElementById('player-hp-bar'),
  playerHpText: document.getElementById('player-hp-text'),
  monsterHpBar: document.getElementById('monster-hp-bar'),
  monsterHpText: document.getElementById('monster-hp-text'),
  monsterName: document.getElementById('monster-name'),
  floorNum: document.getElementById('floor-num'),
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
  gameoverText: document.getElementById('gameover-text')
};

// Screen management
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// HP bar updates
function updatePlayerHp() {
  const pct = Math.max(0, state.player.hp / state.player.maxHp * 100);
  ui.playerHpBar.style.width = pct + '%';
  ui.playerHpBar.classList.toggle('low', pct < 25);
  ui.playerHpText.textContent = `${state.player.hp} / ${state.player.maxHp}`;
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

  // Keep only last 20 entries
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

// Calculate damage with some variance
function calcDamage(base) {
  const variance = 0.2;
  const mult = 1 + (Math.random() * 2 - 1) * variance;
  return Math.max(1, Math.round(base * mult));
}

// Start new battle
function startBattle() {
  state.monster = getMonsterForFloor(state.floor);
  state.inBattle = true;

  ui.monsterName.textContent = state.monster.name;
  ui.floorNum.textContent = state.floor;
  ui.healCount.textContent = `(${state.player.heals})`;
  ui.battleLog.innerHTML = '';
  ui.monsterContainer.classList.remove('dying');

  updatePlayerHp();
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

  const dmg = calcDamage(state.player.atk);
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
  const dmg = calcDamage(state.monster.atk);
  state.player.hp = Math.max(0, state.player.hp - dmg);

  playDamageFlash();
  showDamageNumber(dmg, 'player-dmg');
  updatePlayerHp();
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
  updatePlayerHp();
  ui.healCount.textContent = `(${state.player.heals})`;
  log(`You heal for ${healAmt} HP!`, 'heal');

  setTimeout(() => monsterAttack(), 500);
}

// Monster defeated
function monsterDefeated() {
  state.inBattle = false;
  ui.monsterContainer.classList.add('dying');

  // Rewards: small heal + stat boost every few floors
  const hpRestore = Math.round(state.player.maxHp * 0.2);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + hpRestore);

  // Every 3 floors, power up
  let rewardText = `You recover ${hpRestore} HP.`;
  if (state.floor % 3 === 0) {
    state.player.maxHp += 15;
    state.player.atk += 3;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 15);
    rewardText += `\nLevel up! Max HP +15, ATK +3`;
  }
  // Restore a heal charge every 2 floors
  if (state.floor % 2 === 0 && state.player.heals < state.player.maxHeals) {
    state.player.heals++;
    rewardText += `\nHeal potion restored!`;
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
  ui.gameoverText.textContent = `You were defeated on Floor ${state.floor} by ${state.monster.name}.`;
  setTimeout(() => showScreen('gameover'), 500);
}

// Reset game
function resetGame() {
  state.floor = 1;
  state.player.hp = 100;
  state.player.maxHp = 100;
  state.player.atk = 15;
  state.player.heals = 3;
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

document.getElementById('next-btn').addEventListener('click', () => {
  state.floor++;
  startBattle();
});

document.getElementById('retry-btn').addEventListener('click', () => {
  resetGame();
});
