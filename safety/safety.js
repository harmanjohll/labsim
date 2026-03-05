/* Lab Safety – interactive logic */
document.addEventListener('DOMContentLoaded', function () {
  var DATA = window.SAFETY_DATA;
  var $ = function (id) { return document.getElementById(id); };

  /* ── Tabs ── */
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.tab-content');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(function (p) { p.classList.remove('active'); p.hidden = true; });
      t.classList.add('active');
      t.setAttribute('aria-selected', 'true');
      var panel = $('tab-' + t.getAttribute('data-tab'));
      panel.classList.add('active');
      panel.hidden = false;
      if (typeof LabAudio !== 'undefined') LabAudio.click();
    });
  });

  /* ══════════════════════════════════════
     HAZARD SYMBOLS
     ══════════════════════════════════════ */
  var hazardGrid = $('hazard-grid');
  DATA.hazards.forEach(function (h) {
    var card = document.createElement('div');
    card.className = 'hazard-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', h.name);
    card.innerHTML = '<span class="hazard-icon">' + h.symbol + '</span>'
      + '<span class="hazard-name">' + h.name + '</span>';
    card.addEventListener('click', function () { showHazardDetail(h, card); });
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showHazardDetail(h, card); } });
    hazardGrid.appendChild(card);
  });

  function showHazardDetail(h, card) {
    document.querySelectorAll('.hazard-card').forEach(function (c) { c.classList.remove('selected'); });
    card.classList.add('selected');
    $('detail-icon').textContent = h.symbol;
    $('detail-name').textContent = h.name;
    $('detail-tag').textContent = h.id.toUpperCase();
    $('detail-tag').style.background = h.bg;
    $('detail-tag').style.color = h.color;
    $('detail-meaning').textContent = h.meaning;
    $('detail-examples').textContent = h.examples;
    var ul = $('detail-precautions');
    ul.innerHTML = '';
    h.precautions.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p;
      ul.appendChild(li);
    });
    $('hazard-detail').hidden = false;
    $('hazard-detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (typeof LabAudio !== 'undefined') LabAudio.click();
  }

  /* Match game */
  function buildMatchGame() {
    var game = $('match-game');
    game.innerHTML = '';
    $('match-score').hidden = true;
    var shuffled = DATA.hazards.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 6);
    var names = shuffled.map(function (h) { return h.name; }).sort(function () { return Math.random() - 0.5; });

    shuffled.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'match-row';
      row.setAttribute('data-answer', h.name);
      var icon = document.createElement('span');
      icon.className = 'match-icon';
      icon.textContent = h.symbol;
      var sel = document.createElement('select');
      sel.innerHTML = '<option value="">— Select name —</option>';
      names.forEach(function (n) {
        sel.innerHTML += '<option value="' + n + '">' + n + '</option>';
      });
      row.appendChild(icon);
      row.appendChild(sel);
      game.appendChild(row);
    });
  }
  buildMatchGame();

  $('match-game').addEventListener('change', function (e) {
    var rows = $('match-game').querySelectorAll('.match-row');

    /* Prevent duplicate selections: disable options already chosen in other selects */
    var selects = $('match-game').querySelectorAll('select');
    var chosen = [];
    selects.forEach(function (s) { if (s.value) chosen.push(s.value); });
    selects.forEach(function (s) {
      var opts = s.querySelectorAll('option');
      opts.forEach(function (opt) {
        if (!opt.value) return; // skip placeholder
        opt.disabled = (opt.value !== s.value && chosen.indexOf(opt.value) !== -1);
      });
    });

    // check if all filled
    var allFilled = true;
    rows.forEach(function (r) { if (!r.querySelector('select').value) allFilled = false; });
    if (!allFilled) return;

    var correct = 0;
    rows.forEach(function (r) {
      var answer = r.getAttribute('data-answer');
      var chosen = r.querySelector('select').value;
      r.classList.remove('correct', 'wrong');
      if (chosen === answer) { r.classList.add('correct'); correct++; }
      else { r.classList.add('wrong'); }
    });
    $('match-score').hidden = false;
    $('match-result').textContent = correct + ' / ' + rows.length + ' correct';
    if (correct === rows.length) {
      toast('Perfect score on hazard matching!', 'success');
    }
  });

  $('btn-match-retry').addEventListener('click', buildMatchGame);

  /* ══════════════════════════════════════
     SAFETY QUIZ
     ══════════════════════════════════════ */
  var quiz = { index: 0, score: 0, answers: [], locked: false };

  function showQuestion() {
    var q = DATA.quizQuestions[quiz.index];
    $('quiz-counter').textContent = 'Question ' + (quiz.index + 1) + ' of ' + DATA.quizQuestions.length;
    $('quiz-progress-bar').style.width = (quiz.index / DATA.quizQuestions.length * 100) + '%';
    $('quiz-question').textContent = q.q;
    $('quiz-feedback').hidden = true;
    $('btn-quiz-next').hidden = true;
    quiz.locked = false;

    var opts = $('quiz-options');
    opts.innerHTML = '';
    q.opts.forEach(function (o, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = o;
      btn.addEventListener('click', function () { selectAnswer(i); });
      opts.appendChild(btn);
    });

    $('quiz-card').hidden = false;
    $('quiz-results').hidden = true;
  }

  function selectAnswer(idx) {
    if (quiz.locked) return;
    quiz.locked = true;
    var q = DATA.quizQuestions[quiz.index];
    var btns = $('quiz-options').querySelectorAll('.quiz-option');
    btns.forEach(function (b) { b.classList.add('locked'); });

    btns[idx].classList.add('selected');
    var isCorrect = idx === q.answer;
    if (isCorrect) {
      btns[idx].classList.add('correct');
      quiz.score++;
      $('quiz-feedback').className = 'quiz-feedback correct-fb';
      $('quiz-feedback-text').textContent = 'Correct! ' + q.explain;
      if (typeof LabAudio !== 'undefined') LabAudio.success();
    } else {
      btns[idx].classList.add('wrong');
      btns[q.answer].classList.add('correct');
      $('quiz-feedback').className = 'quiz-feedback wrong-fb';
      $('quiz-feedback-text').textContent = 'Not quite. ' + q.explain;
      if (typeof LabAudio !== 'undefined') LabAudio.warn();
    }
    quiz.answers.push({ qIndex: quiz.index, chosen: idx, correct: isCorrect });
    $('quiz-feedback').hidden = false;
    $('btn-quiz-next').hidden = false;
  }

  $('btn-quiz-next').addEventListener('click', function () {
    quiz.index++;
    if (quiz.index < DATA.quizQuestions.length) {
      showQuestion();
    } else {
      showQuizResults();
    }
  });

  function showQuizResults() {
    $('quiz-card').hidden = true;
    $('quiz-results').hidden = false;
    $('quiz-progress-bar').style.width = '100%';

    var pct = Math.round(quiz.score / DATA.quizQuestions.length * 100);
    $('quiz-score-pct').textContent = pct + '%';
    var ring = $('quiz-score-ring');
    ring.className = 'quiz-score-ring' + (pct >= 70 ? ' high' : '');

    if (pct >= 90) $('quiz-score-text').textContent = 'Excellent! You have a strong understanding of lab safety.';
    else if (pct >= 70) $('quiz-score-text').textContent = 'Good work! Review the questions you missed.';
    else if (pct >= 50) $('quiz-score-text').textContent = 'You know some basics, but should revise further before entering the lab.';
    else $('quiz-score-text').textContent = 'You need more preparation. Review all safety rules carefully.';

    var bd = $('quiz-breakdown');
    bd.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'quiz-breakdown-row';
    row.innerHTML = '<span>Correct</span><span style="color:var(--color-success);font-weight:600;">' + quiz.score + '</span>';
    bd.appendChild(row);
    var row2 = document.createElement('div');
    row2.className = 'quiz-breakdown-row';
    row2.innerHTML = '<span>Incorrect</span><span style="color:var(--color-danger);font-weight:600;">' + (DATA.quizQuestions.length - quiz.score) + '</span>';
    bd.appendChild(row2);
  }

  $('btn-quiz-retry').addEventListener('click', function () {
    quiz.index = 0; quiz.score = 0; quiz.answers = [];
    showQuestion();
  });

  showQuestion();

  /* ══════════════════════════════════════
     RISK ASSESSMENT
     ══════════════════════════════════════ */
  $('risk-practical').addEventListener('change', function () {
    var key = this.value;
    if (!key) { $('risk-builder').hidden = true; return; }
    var ra = DATA.riskAssessments[key];
    if (!ra) return;
    $('risk-builder').hidden = false;
    $('risk-result').hidden = true;

    var tbody = $('risk-tbody');
    tbody.innerHTML = '';
    ra.hazards.forEach(function (h, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + h.hazard + '</td>'
        + '<td><textarea data-field="risk" data-idx="' + i + '" placeholder="What could go wrong?"></textarea></td>'
        + '<td><textarea data-field="precaution" data-idx="' + i + '" placeholder="How to prevent it?"></textarea></td>'
        + '<td class="cell-check" id="check-' + i + '">—</td>';
      tbody.appendChild(tr);
    });
  });

  $('btn-check-risk').addEventListener('click', function () {
    var key = $('risk-practical').value;
    var ra = DATA.riskAssessments[key];
    if (!ra) return;

    var totalCorrect = 0;
    ra.hazards.forEach(function (h, i) {
      var riskTA = document.querySelector('[data-field="risk"][data-idx="' + i + '"]');
      var precTA = document.querySelector('[data-field="precaution"][data-idx="' + i + '"]');
      var cell = $('check-' + i);

      var riskVal = riskTA.value.trim().toLowerCase();
      var precVal = precTA.value.trim().toLowerCase();

      // simple keyword matching
      var riskWords = h.risk.toLowerCase().split(/\s+/);
      var precWords = h.precaution.toLowerCase().split(/\s+/);
      var riskMatch = riskWords.some(function (w) { return w.length > 3 && riskVal.indexOf(w) !== -1; });
      var precMatch = precWords.some(function (w) { return w.length > 3 && precVal.indexOf(w) !== -1; });

      if (riskVal.length < 5 || precVal.length < 5) {
        cell.textContent = '\u2717';
        cell.className = 'cell-check miss';
      } else if (riskMatch && precMatch) {
        cell.textContent = '\u2713';
        cell.className = 'cell-check ok';
        totalCorrect++;
      } else if (riskMatch || precMatch) {
        cell.textContent = '~';
        cell.className = 'cell-check miss';
        totalCorrect += 0.5;
      } else {
        // give credit for effort if enough text
        if (riskVal.length > 15 && precVal.length > 15) {
          cell.textContent = '~';
          cell.className = 'cell-check miss';
          totalCorrect += 0.5;
        } else {
          cell.textContent = '\u2717';
          cell.className = 'cell-check miss';
        }
      }
    });

    var pct = Math.round(totalCorrect / ra.hazards.length * 100);
    var result = $('risk-result');
    result.hidden = false;
    if (pct >= 70) {
      result.className = 'risk-result good';
      result.textContent = 'Good risk assessment! (' + pct + '%) You identified the key hazards and precautions.';
      toast('Well done!', 'success');
    } else {
      result.className = 'risk-result needs-work';
      result.textContent = 'Needs improvement (' + pct + '%). Try to be more specific about the risks and precautions. Use keywords from the hazard description.';
    }
  });

  /* ── Reset ── */
  $('btn-reset').addEventListener('click', function () {
    quiz.index = 0; quiz.score = 0; quiz.answers = [];
    showQuestion();
    buildMatchGame();
    $('risk-practical').value = '';
    $('risk-builder').hidden = true;
    $('hazard-detail').hidden = true;
    document.querySelectorAll('.hazard-card').forEach(function (c) { c.classList.remove('selected'); });
    tabs[0].click();
    toast('Reset complete.', 'info');
  });

  /* ── Toast ── */
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = msg;
    $('toast-container').appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
    if (typeof LabAudio !== 'undefined') {
      if (type === 'success') LabAudio.success();
      else if (type === 'warn') LabAudio.warn();
    }
  }
});
