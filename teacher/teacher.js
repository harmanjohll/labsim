/* ============================================================
   Teacher Dashboard – Logic
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'labsim_teacher';

  var PRACTICALS = [
    { id: 'titration', name: 'Titration', subject: 'Chemistry' },
    { id: 'qualitative-analysis', name: 'Qual. Analysis', subject: 'Chemistry' },
    { id: 'electrolysis', name: 'Electrolysis', subject: 'Chemistry' },
    { id: 'rates-of-reaction', name: 'Rates of Rxn', subject: 'Chemistry' },
    { id: 'salts', name: 'Salts', subject: 'Chemistry' },
    { id: 'gas-tests', name: 'Gas Tests', subject: 'Chemistry' },
    { id: 'chromatography', name: 'Chromatography', subject: 'Chemistry' },
    { id: 'pendulum', name: 'Pendulum', subject: 'Physics' },
    { id: 'ohms-law', name: "Ohm's Law", subject: 'Physics' },
    { id: 'lenses', name: 'Lenses', subject: 'Physics' },
    { id: 'waves', name: 'Waves', subject: 'Physics' },
    { id: 'specific-heat', name: 'SHC', subject: 'Physics' },
    { id: 'density', name: 'Density', subject: 'Physics' },
    { id: 'electromagnets', name: 'Electromagnets', subject: 'Physics' },
    { id: 'food-tests', name: 'Food Tests', subject: 'Biology' },
    { id: 'osmosis', name: 'Osmosis', subject: 'Biology' },
    { id: 'enzyme-activity', name: 'Enzyme Activity', subject: 'Biology' },
    { id: 'microscopy', name: 'Microscopy', subject: 'Biology' },
    { id: 'photosynthesis', name: 'Photosynthesis', subject: 'Biology' },
    { id: 'diffusion', name: 'Diffusion', subject: 'Biology' }
  ];

  var practicalIds = PRACTICALS.map(function (p) { return p.id; });

  /* --- Data model --- */
  var classData = { students: [] };

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) classData = JSON.parse(raw);
    } catch (e) { classData = { students: [] }; }
    if (!classData.students) classData.students = [];
  }

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(classData)); } catch (e) { /* ignore */ }
  }

  /* Student shape: { name, progress: { [practicalId]: { visited, completed, bestScore, attempts } } } */

  function addStudent(name) {
    if (!name || !name.trim()) return;
    classData.students.push({ name: name.trim(), progress: {} });
    saveData();
    renderAll();
  }

  function removeStudent(index) {
    classData.students.splice(index, 1);
    saveData();
    renderAll();
  }

  /* --- Demo data generator --- */
  function generateDemoData() {
    var names = [
      'Alice Chen', 'Ben Okafor', 'Charlotte Reyes', 'David Kim',
      'Emma Johnson', 'Fatima Al-Hassan', 'George Patel', 'Hannah O\'Brien',
      'Isaac Nakamura', 'Jade Williams', 'Kai Eriksson', 'Liam Murphy',
      'Mia Santos', 'Noah Johansson', 'Olivia Brown', 'Priya Sharma'
    ];

    classData.students = names.map(function (name) {
      var progress = {};
      practicalIds.forEach(function (id) {
        var r = Math.random();
        if (r < 0.3) {
          /* not started */
        } else if (r < 0.5) {
          progress[id] = { visited: true, completed: false };
        } else {
          var score = Math.floor(Math.random() * 60) + 40;
          progress[id] = {
            visited: true,
            completed: true,
            bestScore: score,
            attempts: Math.floor(Math.random() * 3) + 1
          };
        }
      });
      return { name: name, progress: progress };
    });

    saveData();
    renderAll();
  }

  /* --- Stats --- */
  function computeStats() {
    var students = classData.students;
    var n = students.length;
    if (n === 0) return { students: 0, avgCompletion: 0, avgScore: 0, needsHelp: 0 };

    var totalCompletion = 0;
    var totalScore = 0;
    var scoredStudents = 0;
    var needsHelp = 0;

    students.forEach(function (s) {
      var completed = 0;
      var scoreSum = 0;
      var scored = 0;

      practicalIds.forEach(function (id) {
        var p = s.progress[id];
        if (p && p.completed) {
          completed++;
          if (p.bestScore !== undefined) {
            scoreSum += p.bestScore;
            scored++;
          }
        }
      });

      var pct = (completed / practicalIds.length) * 100;
      totalCompletion += pct;

      if (scored > 0) {
        var avg = scoreSum / scored;
        totalScore += avg;
        scoredStudents++;
        if (avg < 50) needsHelp++;
      }
    });

    return {
      students: n,
      avgCompletion: Math.round(totalCompletion / n),
      avgScore: scoredStudents > 0 ? Math.round(totalScore / scoredStudents) : 0,
      needsHelp: needsHelp
    };
  }

  /* --- Render --- */
  function renderAll() {
    renderStats();
    renderHeatmap();
    renderBreakdown();
    renderStudentList();
  }

  function renderStats() {
    var stats = computeStats();
    document.getElementById('t-stat-students').textContent = stats.students;
    document.getElementById('t-stat-avg-completion').textContent = stats.avgCompletion + '%';
    document.getElementById('t-stat-avg-score').textContent = stats.avgScore > 0 ? stats.avgScore + '%' : '\u2014';
    document.getElementById('t-stat-needs-help').textContent = stats.needsHelp;
  }

  function renderHeatmap() {
    var thead = document.getElementById('heatmap-head');
    var tbody = document.getElementById('heatmap-body');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (classData.students.length === 0) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = practicalIds.length + 1;
      emptyCell.className = 'empty-state';
      emptyCell.textContent = 'Add students to see the heatmap.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }

    /* Header row */
    var headerRow = document.createElement('tr');
    var cornerTh = document.createElement('th');
    cornerTh.textContent = 'Student';
    headerRow.appendChild(cornerTh);

    PRACTICALS.forEach(function (p) {
      var th = document.createElement('th');
      th.className = 'rotate-header';
      th.textContent = p.name;
      th.title = p.subject + ': ' + p.name;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    /* Student rows */
    classData.students.forEach(function (student) {
      var tr = document.createElement('tr');
      var nameTd = document.createElement('td');
      nameTd.textContent = student.name;
      tr.appendChild(nameTd);

      practicalIds.forEach(function (id) {
        var td = document.createElement('td');
        var cell = document.createElement('span');
        cell.className = 'hm-cell';

        var p = student.progress[id];
        if (!p) {
          cell.className += ' hm-not-started';
          cell.title = 'Not started';
        } else if (p.completed) {
          var score = p.bestScore || 0;
          if (score >= 70) {
            cell.className += ' hm-completed-high';
          } else if (score >= 50) {
            cell.className += ' hm-completed';
          } else {
            cell.className += ' hm-completed-low';
          }
          cell.title = 'Completed: ' + score + '%';
        } else if (p.visited) {
          cell.className += ' hm-visited';
          cell.title = 'In progress';
        }

        /* Click cell to show detail toast */
        (function (studentName, practicalId, progress) {
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', function () {
            var prac = PRACTICALS.filter(function (p) { return p.id === practicalId; })[0];
            var pracName = prac ? prac.name : practicalId;
            var detail;
            if (!progress) {
              detail = studentName + ' has not started ' + pracName + '.';
            } else if (progress.completed) {
              detail = studentName + ' completed ' + pracName + ' — Score: ' + (progress.bestScore || 0) + '%';
            } else {
              detail = studentName + ' has started ' + pracName + ' but not completed it.';
            }
            alert(detail);
          });
        })(student.name, id, p);

        td.appendChild(cell);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function renderBreakdown() {
    var grid = document.getElementById('breakdown-grid');
    grid.innerHTML = '';

    var students = classData.students;
    if (students.length === 0) return;

    PRACTICALS.forEach(function (prac) {
      var completed = 0;
      var totalScore = 0;
      var scored = 0;

      students.forEach(function (s) {
        var p = s.progress[prac.id];
        if (p && p.completed) {
          completed++;
          if (p.bestScore !== undefined) {
            totalScore += p.bestScore;
            scored++;
          }
        }
      });

      var pct = Math.round((completed / students.length) * 100);
      var avgScore = scored > 0 ? Math.round(totalScore / scored) : 0;
      var fillClass = pct >= 70 ? 'high' : (pct >= 40 ? 'mid' : 'low');

      var card = document.createElement('div');
      card.className = 'breakdown-card';
      card.innerHTML =
        '<div class="breakdown-name" title="' + prac.name + '">' + prac.name + '</div>' +
        '<div class="breakdown-bar"><div class="breakdown-bar-fill ' + fillClass + '" style="width:' + pct + '%"></div></div>' +
        '<div class="breakdown-meta">' +
          '<span>' + completed + '/' + students.length + ' done</span>' +
          '<span>' + (avgScore > 0 ? 'Avg: ' + avgScore + '%' : '') + '</span>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  function renderStudentList() {
    var list = document.getElementById('student-list');
    list.innerHTML = '';

    if (classData.students.length === 0) {
      list.innerHTML = '<div class="empty-state">No students added yet.</div>';
      return;
    }

    classData.students.forEach(function (student, index) {
      var completed = 0;
      var totalScore = 0;
      var scored = 0;

      practicalIds.forEach(function (id) {
        var p = student.progress[id];
        if (p && p.completed) {
          completed++;
          if (p.bestScore !== undefined) {
            totalScore += p.bestScore;
            scored++;
          }
        }
      });

      var pct = Math.round((completed / practicalIds.length) * 100);
      var avgScore = scored > 0 ? Math.round(totalScore / scored) : 0;

      var row = document.createElement('div');
      row.className = 'student-row';
      row.innerHTML =
        '<span class="student-name">' + escapeHtml(student.name) + '</span>' +
        '<div class="student-bar"><div class="student-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="student-pct">' + pct + '%</span>' +
        '<span class="student-score">' + (avgScore > 0 ? avgScore + '%' : '\u2014') + '</span>' +
        '<button class="student-remove" data-index="' + index + '" title="Remove student">\u00D7</button>';

      list.appendChild(row);
    });

    /* Remove buttons */
    list.querySelectorAll('.student-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        if (confirm('Remove ' + classData.students[idx].name + '?')) {
          removeStudent(idx);
        }
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --- Export --- */
  function csvEscape(val) {
    var s = String(val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function exportCSV() {
    var rows = [];
    var header = [csvEscape('Student')];
    PRACTICALS.forEach(function (p) { header.push(csvEscape(p.name + ' (Status)')); header.push(csvEscape(p.name + ' (Score)')); });
    rows.push(header.join(','));

    classData.students.forEach(function (s) {
      var row = [csvEscape(s.name)];
      practicalIds.forEach(function (id) {
        var p = s.progress[id];
        if (!p) {
          row.push('Not Started', '');
        } else if (p.completed) {
          row.push('Completed', p.bestScore !== undefined ? p.bestScore : '');
        } else {
          row.push('In Progress', '');
        }
      });
      rows.push(row.join(','));
    });

    downloadFile('labsim-class-data.csv', rows.join('\n'), 'text/csv');
  }

  function exportJSON() {
    var json = JSON.stringify(classData, null, 2);
    downloadFile('labsim-class-data.json', json, 'application/json');
  }

  function downloadFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* --- Import progress codes --- */
  function importCodes() {
    var code = prompt('Paste a student progress code (JSON):');
    if (!code) return;
    try {
      var data = JSON.parse(code);
      if (data.name && data.progress) {
        classData.students.push(data);
        saveData();
        renderAll();
      } else if (data.students) {
        /* bulk import */
        data.students.forEach(function (s) {
          if (s.name) classData.students.push(s);
        });
        saveData();
        renderAll();
      } else {
        alert('Invalid format. Expected { name, progress } or { students: [...] }');
      }
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  }

  /* --- Event listeners --- */
  document.getElementById('btn-add-student').addEventListener('click', function () {
    var input = document.getElementById('student-name-input');
    addStudent(input.value);
    input.value = '';
    input.focus();
  });

  document.getElementById('student-name-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      addStudent(this.value);
      this.value = '';
    }
  });

  document.getElementById('btn-demo-data').addEventListener('click', function () {
    if (classData.students.length > 0 && !confirm('This will replace existing data. Continue?')) return;
    generateDemoData();
  });

  document.getElementById('btn-import-codes').addEventListener('click', importCodes);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);

  /* --- Init --- */
  loadData();
  renderAll();
})();
