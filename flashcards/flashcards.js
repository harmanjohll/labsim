/* ============================================================
   Flashcards – Logic
   Spaced-repetition-lite with session tracking
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  var deckListEl   = document.getElementById('deck-list');
  var progressWrap = document.getElementById('fc-progress');
  var progressBar  = document.getElementById('fc-progress-bar');
  var progressText = document.getElementById('fc-progress-text');
  var placeholder  = document.getElementById('placeholder');
  var cardWrap     = document.getElementById('fc-card');
  var cardInner    = document.getElementById('fc-card-inner');
  var catFront     = document.getElementById('card-category');
  var catBack      = document.getElementById('card-category-back');
  var questionEl   = document.getElementById('card-question');
  var answerEl     = document.getElementById('card-answer');
  var ratingWrap   = document.getElementById('fc-rating');
  var summaryWrap  = document.getElementById('fc-summary');
  var sumTotal     = document.getElementById('sum-total');
  var sumEasy      = document.getElementById('sum-easy');
  var sumOk        = document.getElementById('sum-ok');
  var sumHard      = document.getElementById('sum-hard');
  var btnReviewHard = document.getElementById('btn-review-hard');
  var btnNewDeck   = document.getElementById('btn-new-deck');
  var statStudied  = document.getElementById('stat-studied');
  var statStreak   = document.getElementById('stat-streak');

  /* ---------- State ---------- */
  var state = {
    activeDeckId: null,
    queue: [],
    currentIndex: 0,
    flipped: false,
    ratings: { hard: 0, ok: 0, easy: 0 },
    hardCards: [],
    totalStudied: 0,
    streak: 0
  };

  /* ---------- Persistence ---------- */
  var STORAGE_KEY = 'labsim_flashcards';

  function loadStats() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        state.totalStudied = data.totalStudied || 0;
        state.streak = data.streak || 0;
      }
    } catch (e) { /* ignore */ }
    updateStats();
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        totalStudied: state.totalStudied,
        streak: state.streak
      }));
    } catch (e) { /* ignore */ }
  }

  function updateStats() {
    statStudied.textContent = state.totalStudied;
    statStreak.textContent = state.streak;
  }

  /* ---------- Build deck list ---------- */
  function buildDeckList() {
    deckListEl.innerHTML = '';
    FLASHCARD_DECKS.forEach(function (deck) {
      var btn = document.createElement('button');
      btn.className = 'deck-item';
      btn.setAttribute('data-deck', deck.id);
      btn.innerHTML =
        '<span class="deck-icon">' + deck.icon + '</span>' +
        '<span class="deck-name">' + deck.name + '</span>' +
        '<span class="deck-count">' + deck.cards.length + '</span>';
      btn.addEventListener('click', function () { selectDeck(deck.id); });
      deckListEl.appendChild(btn);
    });
  }

  /* ---------- Select deck ---------- */
  function selectDeck(id) {
    var deck = FLASHCARD_DECKS.filter(function (d) { return d.id === id; })[0];
    if (!deck) return;

    state.activeDeckId = id;
    state.ratings = { hard: 0, ok: 0, easy: 0 };
    state.hardCards = [];
    state.currentIndex = 0;
    state.flipped = false;

    /* Shuffle cards */
    state.queue = shuffle(deck.cards.slice());

    /* Highlight active deck in sidebar */
    var items = deckListEl.querySelectorAll('.deck-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-deck') === id);
    }

    showCard();
    if (typeof LabAudio !== 'undefined') LabAudio.click();
  }

  /* ---------- Shuffle (Fisher-Yates) ---------- */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /* ---------- Show card ---------- */
  function showCard() {
    if (state.currentIndex >= state.queue.length) {
      showSummary();
      return;
    }

    var card = state.queue[state.currentIndex];
    var deck = FLASHCARD_DECKS.filter(function (d) { return d.id === state.activeDeckId; })[0];
    var label = deck ? deck.name : '';

    catFront.textContent = label;
    catBack.textContent = label;
    questionEl.textContent = card.q;
    answerEl.textContent = card.a;

    /* Reset flip */
    state.flipped = false;
    cardWrap.classList.remove('flipped');

    /* Show card, hide others */
    placeholder.hidden = true;
    summaryWrap.hidden = true;
    cardWrap.hidden = false;
    ratingWrap.hidden = true;
    progressWrap.hidden = false;

    /* Entrance animation */
    cardWrap.classList.remove('entering');
    void cardWrap.offsetWidth; /* reflow */
    cardWrap.classList.add('entering');

    updateProgress();
  }

  /* ---------- Flip ---------- */
  function flipCard() {
    if (!state.activeDeckId || state.currentIndex >= state.queue.length) return;
    if (state.flipped) return;

    state.flipped = true;
    cardWrap.classList.add('flipped');
    ratingWrap.hidden = false;
    if (typeof LabAudio !== 'undefined') LabAudio.click();
  }

  /* ---------- Rate ---------- */
  function rateCard(rating) {
    var card = state.queue[state.currentIndex];

    state.ratings[rating]++;
    state.totalStudied++;

    if (rating === 'hard') {
      state.streak = 0;
      state.hardCards.push(card);
    } else {
      state.streak++;
    }

    if (typeof LabAudio !== 'undefined') {
      if (rating === 'easy') LabAudio.success();
      else LabAudio.click();
    }

    state.currentIndex++;
    saveStats();
    updateStats();
    showCard();
  }

  /* ---------- Progress ---------- */
  function updateProgress() {
    var total = state.queue.length;
    var current = state.currentIndex + 1;
    progressText.textContent = current + ' / ' + total;

    /* Ensure progress fill element exists */
    var fill = progressBar.querySelector('.fc-progress-fill');
    if (!fill) {
      fill = document.createElement('div');
      fill.className = 'fc-progress-fill';
      progressBar.appendChild(fill);
    }
    fill.style.width = ((current / total) * 100) + '%';
  }

  /* ---------- Summary ---------- */
  function showSummary() {
    cardWrap.hidden = true;
    ratingWrap.hidden = true;
    progressWrap.hidden = true;
    summaryWrap.hidden = false;

    var total = state.ratings.hard + state.ratings.ok + state.ratings.easy;
    sumTotal.textContent = total;
    sumEasy.textContent = state.ratings.easy;
    sumOk.textContent = state.ratings.ok;
    sumHard.textContent = state.ratings.hard;

    btnReviewHard.style.display = state.hardCards.length > 0 ? '' : 'none';

    if (typeof LabAudio !== 'undefined') LabAudio.success();
  }

  /* ---------- Review hard cards ---------- */
  function reviewHard() {
    if (state.hardCards.length === 0) return;
    state.queue = shuffle(state.hardCards.slice());
    state.hardCards = [];
    state.currentIndex = 0;
    state.ratings = { hard: 0, ok: 0, easy: 0 };
    showCard();
  }

  /* ---------- Back to deck picker ---------- */
  function backToPicker() {
    state.activeDeckId = null;
    state.queue = [];
    state.currentIndex = 0;

    cardWrap.hidden = true;
    ratingWrap.hidden = true;
    progressWrap.hidden = true;
    summaryWrap.hidden = true;
    placeholder.hidden = false;

    var items = deckListEl.querySelectorAll('.deck-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('active');
    }
  }

  /* ---------- Event listeners ---------- */
  cardWrap.addEventListener('click', function () { flipCard(); });

  var rateButtons = ratingWrap.querySelectorAll('.fc-rate');
  for (var i = 0; i < rateButtons.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        rateCard(btn.getAttribute('data-rating'));
      });
    })(rateButtons[i]);
  }

  btnReviewHard.addEventListener('click', reviewHard);
  btnNewDeck.addEventListener('click', backToPicker);

  /* Keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!state.flipped && state.activeDeckId && state.currentIndex < state.queue.length) {
          flipCard();
        }
        break;
      case '1':
        if (state.flipped) rateCard('hard');
        break;
      case '2':
        if (state.flipped) rateCard('ok');
        break;
      case '3':
        if (state.flipped) rateCard('easy');
        break;
    }
  });

  /* ---------- Init ---------- */
  buildDeckList();
  loadStats();
})();
