/* ============================================================
   Dashboard – Logic
   ============================================================ */
(function () {
  'use strict';

  /* All practicals in the platform */
  var PRACTICALS = [
    { id: 'titration', name: 'Acid-Base Titration', subject: 'Chemistry', url: '../chemistry/titration/index.html' },
    { id: 'qualitative-analysis', name: 'Qualitative Analysis', subject: 'Chemistry', url: '../chemistry/qualitative-analysis/index.html' },
    { id: 'electrolysis', name: 'Electrolysis', subject: 'Chemistry', url: '../chemistry/electrolysis/index.html' },
    { id: 'rates-of-reaction', name: 'Rates of Reaction', subject: 'Chemistry', url: '../chemistry/rates-of-reaction/index.html' },
    { id: 'salts', name: 'Preparation of Salts', subject: 'Chemistry', url: '../chemistry/salts/index.html' },
    { id: 'pendulum', name: 'Pendulum & Oscillations', subject: 'Physics', url: '../physics/pendulum/index.html' },
    { id: 'ohms-law', name: "Ohm's Law", subject: 'Physics', url: '../physics/ohms-law/index.html' },
    { id: 'lenses', name: 'Lenses & Light', subject: 'Physics', url: '../physics/lenses/index.html' },
    { id: 'waves', name: 'Waves & Ripple Tank', subject: 'Physics', url: '../physics/waves/index.html' },
    { id: 'specific-heat', name: 'Specific Heat Capacity', subject: 'Physics', url: '../physics/specific-heat/index.html' },
    { id: 'food-tests', name: 'Food Tests', subject: 'Biology', url: '../biology/food-tests/index.html' },
    { id: 'osmosis', name: 'Osmosis', subject: 'Biology', url: '../biology/osmosis/index.html' },
    { id: 'enzyme-activity', name: 'Enzyme Activity', subject: 'Biology', url: '../biology/enzyme-activity/index.html' },
    { id: 'microscopy', name: 'Microscopy & Cell Drawing', subject: 'Biology', url: '../biology/microscopy/index.html' }
  ];

  var subjectColors = {
    'Chemistry': { tag: 'tag-chem', color: '#4361ee' },
    'Physics': { tag: 'tag-phys', color: '#f77f00' },
    'Biology': { tag: 'tag-bio', color: '#06d6a0' }
  };

  /* --- Build practicals grid --- */
  var gridEl = document.getElementById('dash-grid');
  var ids = [];

  PRACTICALS.forEach(function (p) {
    ids.push(p.id);
    var progress = (typeof LabProgress !== 'undefined') ? LabProgress.get(p.id) : null;

    var statusClass = 'not-started';
    var statusIcon = '';
    var meta = 'Not started';
    var scoreText = '';

    if (progress) {
      if (progress.completed) {
        statusClass = 'completed';
        statusIcon = '\u2713';
        meta = 'Completed';
        if (progress.bestScore !== undefined) {
          scoreText = progress.bestScore + '%';
        }
        if (progress.attempts > 1) {
          meta += ' (' + progress.attempts + ' attempts)';
        }
      } else if (progress.visited) {
        statusClass = 'visited';
        statusIcon = '\u25CF';
        meta = 'In progress';
      }
    }

    var card = document.createElement('a');
    card.href = p.url;
    card.className = 'dash-card';
    card.innerHTML =
      '<span class="dash-card-status ' + statusClass + '">' + statusIcon + '</span>' +
      '<div class="dash-card-info">' +
        '<div class="dash-card-name">' + p.name + '</div>' +
        '<div class="dash-card-meta">' + p.subject + ' \u00B7 ' + meta + '</div>' +
      '</div>' +
      (scoreText ? '<span class="dash-card-score">' + scoreText + '</span>' : '');

    gridEl.appendChild(card);
  });

  /* --- Summary stats --- */
  function updateSummary() {
    if (typeof LabProgress === 'undefined') return;

    var summary = LabProgress.getSummary(ids);
    document.getElementById('stat-completed').textContent = summary.completed;
    document.getElementById('stat-total').textContent = 'of ' + summary.total + ' practicals';
    document.getElementById('stat-avg-score').textContent = summary.averageScore > 0 ? summary.averageScore + '%' : '\u2014';
    document.getElementById('dash-progress-fill').style.width = summary.percentComplete + '%';

    /* Flashcard stats */
    try {
      var fcRaw = localStorage.getItem('labsim_flashcards');
      if (fcRaw) {
        var fc = JSON.parse(fcRaw);
        document.getElementById('stat-fc-studied').textContent = fc.totalStudied || 0;
        document.getElementById('stat-streak').textContent = fc.streak || 0;
        document.getElementById('tool-fc').textContent = (fc.totalStudied || 0) + ' cards studied';
      }
    } catch (e) { /* ignore */ }
  }

  updateSummary();

  /* --- Reset --- */
  document.getElementById('btn-reset-progress').addEventListener('click', function () {
    if (confirm('Reset all progress? This cannot be undone.')) {
      if (typeof LabProgress !== 'undefined') LabProgress.reset();
      try {
        localStorage.removeItem('labsim_flashcards');
      } catch (e) { /* ignore */ }
      window.location.reload();
    }
  });
})();
