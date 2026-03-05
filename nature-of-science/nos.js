/* ============================================================
   Nature of Science – Logic
   ============================================================ */
(function () {
  'use strict';

  var data = NOS_DATA;

  /* ---------- Section switching ---------- */
  var navButtons = document.querySelectorAll('.nos-nav-item');
  var sections = {
    'variables':  document.getElementById('sec-variables'),
    'errors':     document.getElementById('sec-errors'),
    'fair-test':  document.getElementById('sec-fair-test'),
    'planning':   document.getElementById('sec-planning'),
    'evaluation': document.getElementById('sec-evaluation')
  };

  function showSection(id) {
    for (var key in sections) {
      sections[key].hidden = (key !== id);
    }
    for (var i = 0; i < navButtons.length; i++) {
      navButtons[i].classList.toggle('active', navButtons[i].getAttribute('data-section') === id);
    }
    if (typeof LabAudio !== 'undefined') LabAudio.click();
  }

  for (var i = 0; i < navButtons.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        showSection(btn.getAttribute('data-section'));
      });
    })(navButtons[i]);
  }

  /* ========================================================
     1. VARIABLES
     ======================================================== */
  (function () {
    document.getElementById('variables-intro').textContent = data.variables.intro;

    /* Variable type cards */
    var cardsEl = document.getElementById('var-cards');
    data.variables.types.forEach(function (v) {
      var card = document.createElement('div');
      card.className = 'var-card';
      card.style.background = v.bg;
      card.style.borderColor = v.color;
      card.innerHTML =
        '<span class="var-card-badge" style="background:' + v.color + ';color:#fff;">' + v.short + '</span>' +
        '<h4>' + v.name + '</h4>' +
        '<p>' + v.definition + '</p>' +
        '<div class="var-tip">' + v.tip + '</div>';
      cardsEl.appendChild(card);
    });

    /* Exercise */
    var exercises = data.variables.exercises;
    var exIdx = 0;

    var scenarioEl = document.getElementById('var-scenario');
    var inputIV = document.getElementById('input-iv');
    var inputDV = document.getElementById('input-dv');
    var inputCV = document.getElementById('input-cv');
    var feedbackEl = document.getElementById('var-feedback');
    var progressEl = document.getElementById('var-progress');

    function loadExercise() {
      var ex = exercises[exIdx];
      scenarioEl.textContent = ex.scenario;
      inputIV.value = '';
      inputDV.value = '';
      inputCV.value = '';
      inputIV.className = 'nos-input';
      inputDV.className = 'nos-input';
      inputCV.className = 'nos-input';
      feedbackEl.hidden = true;
      progressEl.textContent = 'Scenario ' + (exIdx + 1) + ' of ' + exercises.length;
    }

    function keywordsMatch(input, expected) {
      var inp = input.toLowerCase().trim();
      if (!inp) return false;
      var words = expected.toLowerCase().split(/\s+/);
      var hits = 0;
      for (var i = 0; i < words.length; i++) {
        if (words[i].length > 3 && inp.indexOf(words[i]) !== -1) hits++;
      }
      return hits >= 2 || inp.indexOf(expected.toLowerCase()) !== -1;
    }

    document.getElementById('btn-check-vars').addEventListener('click', function () {
      var ex = exercises[exIdx];
      var ivOk = keywordsMatch(inputIV.value, ex.iv);
      var dvOk = keywordsMatch(inputDV.value, ex.dv);
      var cvOk = false;
      var cvInput = inputCV.value.toLowerCase();
      for (var i = 0; i < ex.cvs.length; i++) {
        if (keywordsMatch(cvInput, ex.cvs[i])) { cvOk = true; break; }
      }

      inputIV.className = 'nos-input ' + (ivOk ? 'correct' : 'incorrect');
      inputDV.className = 'nos-input ' + (dvOk ? 'correct' : 'incorrect');
      inputCV.className = 'nos-input ' + (cvOk ? 'correct' : 'incorrect');

      var allOk = ivOk && dvOk && cvOk;
      feedbackEl.hidden = false;
      feedbackEl.className = 'exercise-feedback ' + (allOk ? 'correct' : 'incorrect');

      if (allOk) {
        feedbackEl.innerHTML = '<strong>Correct!</strong> Well done.';
        if (typeof LabAudio !== 'undefined') LabAudio.success();
      } else {
        feedbackEl.innerHTML =
          '<strong>Not quite — here are the answers:</strong>' +
          '<br><b>IV:</b> ' + ex.iv +
          '<br><b>DV:</b> ' + ex.dv +
          '<br><b>CVs:</b> ' + ex.cvs.join(', ');
        if (typeof LabAudio !== 'undefined') LabAudio.warn();
      }
    });

    document.getElementById('btn-next-var').addEventListener('click', function () {
      exIdx = (exIdx + 1) % exercises.length;
      if (exIdx === 0) {
        feedbackEl.hidden = false;
        feedbackEl.className = 'exercise-feedback correct';
        feedbackEl.innerHTML = '<strong>Well done!</strong> You\'ve completed all scenarios. Starting again from the first.';
        if (typeof LabAudio !== 'undefined') LabAudio.success();
      }
      loadExercise();
    });

    loadExercise();
  })();

  /* ========================================================
     2. ERRORS & ACCURACY
     ======================================================== */
  (function () {
    document.getElementById('errors-intro').textContent = data.errors.intro;

    /* Concept cards */
    var gridEl = document.getElementById('error-concepts');
    data.errors.concepts.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'concept-card';
      card.innerHTML =
        '<div class="concept-icon">' + c.icon + '</div>' +
        '<h4>' + c.name + '</h4>' +
        '<div class="concept-def">' + c.definition + '</div>' +
        '<div class="concept-eg">' + c.example + '</div>';
      gridEl.appendChild(card);
    });

    /* Quiz */
    var quiz = data.errors.quiz;
    var qIdx = 0;
    var score = 0;
    var answered = 0;

    var questionEl = document.getElementById('err-question');
    var optionsEl = document.getElementById('err-options');
    var feedbackEl = document.getElementById('err-feedback');
    var scoreEl = document.getElementById('err-score');

    function loadQuizQ() {
      var q = quiz[qIdx];
      questionEl.textContent = q.q;
      optionsEl.innerHTML = '';
      feedbackEl.hidden = true;

      q.opts.forEach(function (opt, idx) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', function () { answerQuiz(idx); });
        optionsEl.appendChild(btn);
      });

      scoreEl.textContent = 'Score: ' + score + ' / ' + answered;
    }

    function answerQuiz(chosen) {
      var q = quiz[qIdx];
      var opts = optionsEl.querySelectorAll('.quiz-option');

      /* Lock all */
      for (var i = 0; i < opts.length; i++) {
        opts[i].classList.add('locked');
        if (i === q.answer) opts[i].classList.add('correct');
      }

      var isCorrect = chosen === q.answer;
      if (!isCorrect) opts[chosen].classList.add('wrong');

      answered++;
      if (isCorrect) score++;

      feedbackEl.hidden = false;
      feedbackEl.className = 'quiz-feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
      feedbackEl.textContent = (isCorrect ? 'Correct! ' : 'Incorrect. ') + q.explain;
      scoreEl.textContent = 'Score: ' + score + ' / ' + answered;

      if (typeof LabAudio !== 'undefined') {
        if (isCorrect) LabAudio.success(); else LabAudio.warn();
      }
    }

    document.getElementById('btn-next-err').addEventListener('click', function () {
      qIdx = (qIdx + 1) % quiz.length;
      /* Reset score when cycling back to the first question */
      if (qIdx === 0) {
        score = 0;
        answered = 0;
      }
      loadQuizQ();
    });

    loadQuizQ();
  })();

  /* ========================================================
     3. FAIR TESTING
     ======================================================== */
  (function () {
    document.getElementById('fair-intro').textContent = data.fairTest.intro;

    /* Principles */
    var prinEl = document.getElementById('fair-principles');
    data.fairTest.principles.forEach(function (p, idx) {
      var card = document.createElement('div');
      card.className = 'principle-card';
      card.innerHTML =
        '<span class="principle-num">' + (idx + 1) + '</span>' +
        '<div><h4>' + p.name + '</h4><p>' + p.desc + '</p></div>';
      prinEl.appendChild(card);
    });

    /* Spot the flaw */
    var scenarios = data.fairTest.scenarios;
    var sIdx = 0;

    var textEl = document.getElementById('fair-text');
    var answerEl = document.getElementById('fair-answer');
    var flawEl = document.getElementById('fair-flaw');
    var fixEl = document.getElementById('fair-fix');

    function loadScenario() {
      var s = scenarios[sIdx];
      textEl.textContent = s.description;
      answerEl.hidden = true;
    }

    document.getElementById('btn-reveal-flaw').addEventListener('click', function () {
      var s = scenarios[sIdx];
      flawEl.textContent = s.flaw;
      fixEl.textContent = s.fix;
      answerEl.hidden = false;
      if (typeof LabAudio !== 'undefined') LabAudio.click();
    });

    document.getElementById('btn-next-flaw').addEventListener('click', function () {
      sIdx = (sIdx + 1) % scenarios.length;
      loadScenario();
    });

    loadScenario();
  })();

  /* ========================================================
     4. PLANNING
     ======================================================== */
  (function () {
    document.getElementById('planning-intro').textContent = data.planning.intro;

    /* RIMMER steps */
    var rimmerEl = document.getElementById('rimmer-steps');
    data.planning.steps.forEach(function (s) {
      var step = document.createElement('div');
      step.className = 'rimmer-step';
      step.innerHTML =
        '<span class="rimmer-letter">' + s.letter + '</span>' +
        '<div><h4>' + s.word + '</h4><p>' + s.desc + '</p></div>';
      rimmerEl.appendChild(step);
    });

    /* Plan builder select */
    var selectEl = document.getElementById('plan-practical');
    var rqWrap = document.getElementById('plan-rq');
    var rqText = document.getElementById('plan-rq-text');

    data.planning.practicalLinks.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      selectEl.appendChild(opt);
    });

    selectEl.addEventListener('change', function () {
      var id = selectEl.value;
      if (!id) { rqWrap.hidden = true; return; }
      var match = data.planning.practicalLinks.filter(function (p) { return p.id === id; })[0];
      if (match) {
        rqText.textContent = match.rq;
        rqWrap.hidden = false;
      }
    });
  })();

  /* ========================================================
     5. EVALUATION
     ======================================================== */
  (function () {
    /* Populate word-bank columns */
    function populateList(elId, items) {
      var ul = document.getElementById(elId);
      items.forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
    }
    populateList('eval-strengths', data.evaluation.strengths);
    populateList('eval-weaknesses', data.evaluation.weaknesses);
    populateList('eval-improvements', data.evaluation.improvements);

    /* Sorting exercise */
    var allPhrases = [];
    data.evaluation.strengths.forEach(function (t) { allPhrases.push({ text: t, cat: 'strengths' }); });
    data.evaluation.weaknesses.forEach(function (t) { allPhrases.push({ text: t, cat: 'weaknesses' }); });
    data.evaluation.improvements.forEach(function (t) { allPhrases.push({ text: t, cat: 'improvements' }); });

    /* Shuffle */
    for (var i = allPhrases.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = allPhrases[i];
      allPhrases[i] = allPhrases[j];
      allPhrases[j] = tmp;
    }

    /* Take a subset (9 phrases: 3 from each) */
    var subset = [];
    var counts = { strengths: 0, weaknesses: 0, improvements: 0 };
    for (var k = 0; k < allPhrases.length && subset.length < 9; k++) {
      if (counts[allPhrases[k].cat] < 3) {
        subset.push(allPhrases[k]);
        counts[allPhrases[k].cat]++;
      }
    }
    /* Re-shuffle subset */
    for (var m = subset.length - 1; m > 0; m--) {
      var n = Math.floor(Math.random() * (m + 1));
      var t = subset[m];
      subset[m] = subset[n];
      subset[n] = t;
    }

    var scrambleEl = document.getElementById('eval-scramble');
    var selectedChip = null;
    var placements = []; /* {idx, cat} */

    subset.forEach(function (item, idx) {
      var chip = document.createElement('span');
      chip.className = 'eval-chip';
      chip.textContent = item.text;
      chip.setAttribute('data-idx', idx);
      chip.addEventListener('click', function () {
        if (chip.classList.contains('placed')) return;
        /* Deselect others */
        var chips = scrambleEl.querySelectorAll('.eval-chip');
        for (var c = 0; c < chips.length; c++) chips[c].classList.remove('selected');
        chip.classList.add('selected');
        selectedChip = idx;
      });
      scrambleEl.appendChild(chip);
    });

    /* Target click */
    var targets = document.querySelectorAll('.eval-target');
    for (var ti = 0; ti < targets.length; ti++) {
      (function (target) {
        target.addEventListener('click', function () {
          if (selectedChip === null) return;
          var cat = target.getAttribute('data-cat');
          var itemsEl = target.querySelector('.eval-target-items');

          /* Place chip */
          var placedIdx = selectedChip;
          var pill = document.createElement('div');
          pill.className = 'eval-placed-item';
          pill.textContent = subset[placedIdx].text;
          pill.setAttribute('data-idx', placedIdx);
          pill.setAttribute('data-actual', subset[placedIdx].cat);
          pill.setAttribute('data-placed', cat);

          /* Click placed pill to undo */
          pill.style.cursor = 'pointer';
          pill.addEventListener('click', function () {
            pill.remove();
            /* Remove from placements */
            for (var r = placements.length - 1; r >= 0; r--) {
              if (placements[r].idx === placedIdx) { placements.splice(r, 1); break; }
            }
            /* Restore chip in pool */
            var chipEl = scrambleEl.querySelector('[data-idx="' + placedIdx + '"]');
            if (chipEl) chipEl.classList.remove('placed');
            if (typeof LabAudio !== 'undefined') LabAudio.click();
          });

          itemsEl.appendChild(pill);

          placements.push({ idx: placedIdx, cat: cat });

          /* Mark chip as placed */
          var chipEl = scrambleEl.querySelector('[data-idx="' + selectedChip + '"]');
          if (chipEl) {
            chipEl.classList.remove('selected');
            chipEl.classList.add('placed');
          }
          selectedChip = null;

          if (typeof LabAudio !== 'undefined') LabAudio.click();
        });
      })(targets[ti]);
    }

    /* Check answers */
    document.getElementById('btn-check-eval').addEventListener('click', function () {
      var correct = 0;
      var placed = document.querySelectorAll('.eval-placed-item');
      for (var p = 0; p < placed.length; p++) {
        var actual = placed[p].getAttribute('data-actual');
        var chosen = placed[p].getAttribute('data-placed');
        if (actual === chosen) {
          placed[p].classList.add('correct-item');
          correct++;
        } else {
          placed[p].classList.add('wrong-item');
        }
      }

      var resultEl = document.getElementById('eval-result');
      resultEl.hidden = false;
      var total = placed.length;
      if (total === 0) {
        resultEl.className = 'eval-result partial';
        resultEl.textContent = 'Place some phrases first!';
      } else {
        var pct = Math.round((correct / total) * 100);
        resultEl.className = 'eval-result ' + (pct >= 80 ? 'good' : 'partial');
        resultEl.textContent = correct + ' / ' + total + ' correct (' + pct + '%)';
      }

      if (typeof LabAudio !== 'undefined') {
        if (correct === total && total > 0) LabAudio.success(); else LabAudio.warn();
      }
    });
  })();

})();
