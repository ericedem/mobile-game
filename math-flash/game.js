const TOTAL_QUESTIONS = 12;

const dom = {
  menuScreen: document.getElementById('menu-screen'),
  gameScreen: document.getElementById('game-screen'),
  resultsScreen: document.getElementById('results-screen'),
  tableButtons: document.getElementById('table-buttons'),
  startBtn: document.getElementById('start-btn'),
  selectionLabel: document.getElementById('selection-label'),
  progressFill: document.getElementById('progress-fill'),
  scoreDisplay: document.getElementById('score-display'),
  streakDisplay: document.getElementById('streak-display'),
  problem: document.getElementById('problem'),
  choices: document.getElementById('choices'),
  resultsGrade: document.getElementById('results-grade'),
  resultsScore: document.getElementById('results-score'),
  resultsTime: document.getElementById('results-time'),
  resultsStreak: document.getElementById('results-streak'),
  missedSection: document.getElementById('missed-section'),
  missedList: document.getElementById('missed-list'),
  retryBtn: document.getElementById('retry-btn'),
  menuBtn: document.getElementById('menu-btn'),
};

let selectedTable = null;
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let streak = 0;
let bestStreak = 0;
let startTime = 0;
let missed = [];
let waiting = false;

const mastered = JSON.parse(localStorage.getItem('mathFlashMastered') || '{}');

function init() {
  for (let n = 1; n <= 12; n++) {
    const btn = document.createElement('button');
    btn.className = 'table-btn' + (mastered[n] ? ' mastered' : '');
    btn.textContent = n;
    btn.addEventListener('click', () => selectTable(n));
    dom.tableButtons.appendChild(btn);
  }

  dom.startBtn.addEventListener('click', startGame);
  dom.retryBtn.addEventListener('click', startGame);
  dom.menuBtn.addEventListener('click', showMenu);
}

function selectTable(n) {
  selectedTable = n;
  dom.tableButtons.querySelectorAll('.table-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i + 1 === n);
  });
  dom.startBtn.disabled = false;
  dom.selectionLabel.textContent = `${n} × 1 through ${n} × 12`;
}

function generateQuestions() {
  const pairs = [];
  for (let i = 1; i <= 12; i++) {
    pairs.push({ a: selectedTable, b: i, answer: selectedTable * i });
  }
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.slice(0, TOTAL_QUESTIONS);
}

function generateChoices(correct) {
  const choices = new Set([correct]);
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = correct + offset;
    if (wrong > 0 && wrong !== correct) choices.add(wrong);
  }
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame() {
  questions = generateQuestions();
  currentIndex = 0;
  correctCount = 0;
  streak = 0;
  bestStreak = 0;
  missed = [];
  startTime = Date.now();

  dom.menuScreen.classList.add('hidden');
  dom.resultsScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');

  showQuestion();
}

function showQuestion() {
  waiting = false;
  const q = questions[currentIndex];

  dom.progressFill.style.width = ((currentIndex / TOTAL_QUESTIONS) * 100) + '%';
  dom.scoreDisplay.textContent = `${correctCount} / ${currentIndex}`;
  dom.streakDisplay.textContent = streak >= 2 ? `${streak} streak` : '';

  dom.problem.textContent = `${q.a} × ${q.b}`;
  dom.problem.classList.add('fade-in');
  setTimeout(() => dom.problem.classList.remove('fade-in'), 300);

  const choices = generateChoices(q.answer);
  dom.choices.innerHTML = '';
  for (const val of choices) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = val;
    btn.addEventListener('click', () => handleAnswer(btn, val, q));
    dom.choices.appendChild(btn);
  }
}

function handleAnswer(btn, chosen, q) {
  if (waiting) return;
  waiting = true;

  const buttons = dom.choices.querySelectorAll('.choice-btn');
  buttons.forEach(b => b.disabled = true);

  if (chosen === q.answer) {
    btn.classList.add('correct');
    correctCount++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
  } else {
    btn.classList.add('wrong');
    streak = 0;
    missed.push({ a: q.a, b: q.b, answer: q.answer, chosen });
    buttons.forEach(b => {
      if (parseInt(b.textContent) === q.answer) b.classList.add('correct');
    });
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex >= TOTAL_QUESTIONS) {
      showResults();
    } else {
      showQuestion();
    }
  }, chosen === q.answer ? 400 : 900);
}

function showResults() {
  dom.gameScreen.classList.add('hidden');
  dom.resultsScreen.classList.remove('hidden');
  dom.progressFill.style.width = '100%';

  const pct = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  let grade, gradeColor;
  if (pct === 100) { grade = 'Perfect!'; gradeColor = '#7c4dff'; }
  else if (pct >= 90) { grade = 'Great!'; gradeColor = '#4caf50'; }
  else if (pct >= 70) { grade = 'Good'; gradeColor = '#f0a030'; }
  else if (pct >= 50) { grade = 'Keep Trying'; gradeColor = '#e09050'; }
  else { grade = 'Practice More'; gradeColor = '#e05050'; }

  dom.resultsGrade.textContent = grade;
  dom.resultsGrade.style.color = gradeColor;
  dom.resultsScore.textContent = `${correctCount} out of ${TOTAL_QUESTIONS} correct (${pct}%)`;
  dom.resultsTime.textContent = `Completed in ${elapsed}s`;
  dom.resultsStreak.textContent = bestStreak >= 2 ? `Best streak: ${bestStreak}` : '';

  if (pct === 100) {
    mastered[selectedTable] = true;
    localStorage.setItem('mathFlashMastered', JSON.stringify(mastered));
    dom.tableButtons.querySelectorAll('.table-btn').forEach((btn, i) => {
      if (mastered[i + 1]) btn.classList.add('mastered');
    });
  }

  if (missed.length > 0) {
    dom.missedSection.classList.remove('hidden');
    dom.missedList.innerHTML = '';
    for (const m of missed) {
      const item = document.createElement('div');
      item.className = 'missed-item';
      item.innerHTML = `
        <span>${m.a} × ${m.b} = <s>${m.chosen}</s></span>
        <span class="correct-answer">${m.answer}</span>
      `;
      dom.missedList.appendChild(item);
    }
  } else {
    dom.missedSection.classList.add('hidden');
  }
}

function showMenu() {
  dom.gameScreen.classList.add('hidden');
  dom.resultsScreen.classList.add('hidden');
  dom.menuScreen.classList.remove('hidden');
}

init();
