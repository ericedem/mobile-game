const TOTAL_QUESTIONS = 12;

const dom = {
  menuScreen: document.getElementById('menu-screen'),
  gameScreen: document.getElementById('game-screen'),
  resultsScreen: document.getElementById('results-screen'),
  tableButtons: document.getElementById('table-buttons'),
  tablePicker: document.getElementById('table-picker'),
  advancedInfo: document.getElementById('advanced-info'),
  modePractice: document.getElementById('mode-practice'),
  modeAdvanced: document.getElementById('mode-advanced'),
  startBtn: document.getElementById('start-btn'),
  selectionLabel: document.getElementById('selection-label'),
  progressFill: document.getElementById('progress-fill'),
  scoreDisplay: document.getElementById('score-display'),
  remainingDisplay: document.getElementById('remaining-display'),
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
let gameMode = 'practice';
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let totalAnswered = 0;
let streak = 0;
let bestStreak = 0;
let startTime = 0;
let missed = [];
let retriesNeeded = 0;
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
  dom.modePractice.addEventListener('click', () => setMode('practice'));
  dom.modeAdvanced.addEventListener('click', () => setMode('advanced'));
}

function setMode(mode) {
  gameMode = mode;
  dom.modePractice.classList.toggle('selected', mode === 'practice');
  dom.modeAdvanced.classList.toggle('selected', mode === 'advanced');

  if (mode === 'advanced') {
    dom.tablePicker.classList.add('hidden');
    dom.advancedInfo.classList.remove('hidden');
    dom.startBtn.disabled = false;
    dom.selectionLabel.textContent = '144 questions — wrong answers repeat';
  } else {
    dom.tablePicker.classList.remove('hidden');
    dom.advancedInfo.classList.add('hidden');
    if (!selectedTable) {
      dom.startBtn.disabled = true;
      dom.selectionLabel.textContent = 'Select a table above';
    }
  }
}

function selectTable(n) {
  selectedTable = n;
  dom.tableButtons.querySelectorAll('.table-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i + 1 === n);
  });
  dom.startBtn.disabled = false;
  dom.selectionLabel.textContent = `${n} × 1 through ${n} × 12`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuestions() {
  if (gameMode === 'advanced') {
    const pairs = [];
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        pairs.push({ a, b, answer: a * b });
      }
    }
    return shuffle(pairs);
  }
  const pairs = [];
  for (let i = 1; i <= 12; i++) {
    pairs.push({ a: selectedTable, b: i, answer: selectedTable * i });
  }
  return shuffle(pairs).slice(0, TOTAL_QUESTIONS);
}

function generateChoices(correct) {
  const choices = new Set([correct]);
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = correct + offset;
    if (wrong > 0 && wrong !== correct) choices.add(wrong);
  }
  return shuffle([...choices]);
}

function getTotalQuestions() {
  return questions.length;
}

function startGame() {
  questions = generateQuestions();
  currentIndex = 0;
  correctCount = 0;
  totalAnswered = 0;
  streak = 0;
  bestStreak = 0;
  missed = [];
  retriesNeeded = 0;
  startTime = Date.now();

  dom.menuScreen.classList.add('hidden');
  dom.resultsScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');

  showQuestion();
}

function showQuestion() {
  waiting = false;
  const q = questions[currentIndex];
  const total = getTotalQuestions();

  dom.progressFill.style.width = ((currentIndex / total) * 100) + '%';
  dom.scoreDisplay.textContent = `${correctCount} / ${totalAnswered}`;
  dom.remainingDisplay.textContent = gameMode === 'advanced' ? `${total - currentIndex} left` : '';
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
    totalAnswered++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
  } else {
    btn.classList.add('wrong');
    totalAnswered++;
    streak = 0;
    missed.push({ a: q.a, b: q.b, answer: q.answer, chosen });
    buttons.forEach(b => {
      if (parseInt(b.textContent) === q.answer) b.classList.add('correct');
    });

    if (gameMode === 'advanced') {
      questions.push({ a: q.a, b: q.b, answer: q.answer });
      retriesNeeded++;
    }
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex >= getTotalQuestions()) {
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

  const initialTotal = gameMode === 'advanced' ? 144 : TOTAL_QUESTIONS;
  const firstPassCorrect = initialTotal - missed.length;
  const pct = Math.round((firstPassCorrect / initialTotal) * 100);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  let grade, gradeColor;
  if (pct === 100) { grade = 'Perfect!'; gradeColor = '#7c4dff'; }
  else if (pct >= 90) { grade = 'Great!'; gradeColor = '#4caf50'; }
  else if (pct >= 70) { grade = 'Good'; gradeColor = '#f0a030'; }
  else if (pct >= 50) { grade = 'Keep Trying'; gradeColor = '#e09050'; }
  else { grade = 'Practice More'; gradeColor = '#e05050'; }

  dom.resultsGrade.textContent = grade;
  dom.resultsGrade.style.color = gradeColor;

  if (gameMode === 'advanced') {
    dom.resultsScore.textContent = `${firstPassCorrect} of ${initialTotal} on first try (${pct}%)`;
    if (retriesNeeded > 0) {
      dom.resultsStreak.textContent = `${retriesNeeded} retries needed · Best streak: ${bestStreak}`;
    } else {
      dom.resultsStreak.textContent = bestStreak >= 2 ? `Best streak: ${bestStreak}` : '';
    }
  } else {
    dom.resultsScore.textContent = `${correctCount} out of ${TOTAL_QUESTIONS} correct (${pct}%)`;
    dom.resultsStreak.textContent = bestStreak >= 2 ? `Best streak: ${bestStreak}` : '';
  }

  dom.resultsTime.textContent = `Completed in ${elapsed}s`;

  if (gameMode === 'practice' && pct === 100) {
    mastered[selectedTable] = true;
    localStorage.setItem('mathFlashMastered', JSON.stringify(mastered));
    dom.tableButtons.querySelectorAll('.table-btn').forEach((btn, i) => {
      if (mastered[i + 1]) btn.classList.add('mastered');
    });
  }

  // Deduplicate missed list (advanced mode can have repeats)
  const uniqueMissed = [];
  const seen = new Set();
  for (const m of missed) {
    const key = `${m.a}x${m.b}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMissed.push(m);
    }
  }

  if (uniqueMissed.length > 0) {
    dom.missedSection.classList.remove('hidden');
    dom.missedList.innerHTML = '';
    for (const m of uniqueMissed) {
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
