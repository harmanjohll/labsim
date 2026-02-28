/* ============================================================
   Rates of Reaction – Simulation
   Canvas: conical flask + gas syringe, reaction animation
   ============================================================ */
(function () {
  'use strict';

  var D = RATES_DATA;

  /* --- DOM --- */
  var canvas   = document.getElementById('canvas');
  var ctx      = canvas.getContext('2d');
  var graph    = document.getElementById('graph');
  var gctx     = graph.getContext('2d');
  var selConc  = document.getElementById('sel-conc');
  var selChips = document.getElementById('sel-chips');
  var btnStart = document.getElementById('btn-start');
  var btnReset = document.getElementById('btn-reset');
  var timerEl  = document.getElementById('timer');
  var dataBody = document.getElementById('data-body');
  var rateCalc = document.getElementById('rate-calc');
  var rateValue = document.getElementById('rate-value');
  var procList = document.getElementById('procedure-list');

  /* --- State --- */
  var state = {
    running: false,
    elapsed: 0,
    concentration: 1.0,
    chipSize: 'large',
    gasVolume: 0,
    bubbles: [],
    readings: [],
    allRuns: [],     /* [{conc, readings}] */
    nextReadingAt: 0,
    animId: null,
    lastFrame: 0
  };

  /* --- Init UI --- */
  document.getElementById('equation').textContent = D.equation;

  D.concentrations.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c.value;
    opt.textContent = c.label;
    selConc.appendChild(opt);
  });
  selConc.value = '1';

  D.steps.forEach(function (s) {
    var li = document.createElement('li');
    li.textContent = s.instruction;
    li.id = 'step-' + s.id;
    procList.appendChild(li);
  });

  buildTable();

  /* --- Model --- */
  function getK() {
    var conc = state.concentration;
    var chipMult = 1.0;
    var chip = D.chipSizes.filter(function (c) { return c.id === state.chipSize; })[0];
    if (chip) chipMult = chip.surfaceMultiplier;
    return D.baseK * conc * chipMult;
  }

  function gasAtTime(t) {
    var k = getK();
    return D.maxGas * (1 - Math.exp(-k * t));
  }

  /* --- Table --- */
  function buildTable() {
    dataBody.innerHTML = '';
    D.timePoints.forEach(function (t) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + t + '</td><td class="vol-cell" id="vol-' + t + '">—</td>';
      dataBody.appendChild(tr);
    });
  }

  function recordReading(time, vol) {
    var cell = document.getElementById('vol-' + time);
    if (cell) {
      cell.textContent = vol.toFixed(1);
      cell.style.background = 'rgba(67, 97, 238, 0.08)';
    }
    state.readings.push({ time: time, vol: vol });
  }

  /* --- Canvas drawing --- */
  var W = canvas.width, H = canvas.height;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Bench surface */
    ctx.fillStyle = '#2a2b3d';
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = '#4a4b62';
    ctx.fillRect(0, H - 52, W, 3);

    drawFlask();
    drawSyringe();
    drawTube();
    drawBubbles();
  }

  function drawFlask() {
    var fx = 160, fy = H - 52; /* base of flask */

    /* Flask body - conical shape */
    ctx.beginPath();
    ctx.moveTo(fx - 50, fy);
    ctx.lineTo(fx - 12, fy - 110);
    ctx.lineTo(fx - 12, fy - 130);
    ctx.lineTo(fx + 12, fy - 130);
    ctx.lineTo(fx + 12, fy - 110);
    ctx.lineTo(fx + 50, fy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(235, 240, 250, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 170, 195, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Liquid in flask */
    var concObj = D.concentrations.filter(function (c) { return c.value === state.concentration; })[0];
    var liqColor = concObj ? concObj.color : 'rgba(180,210,255,0.35)';
    var liqH = 70; /* height of liquid */
    var liqY = fy - liqH;
    var liqRatio = liqH / 110;
    var liqHalfW = 50 * (1 - liqRatio) + 12 * liqRatio;

    ctx.beginPath();
    ctx.moveTo(fx - liqHalfW, liqY);
    ctx.lineTo(fx - 50, fy);
    ctx.lineTo(fx + 50, fy);
    ctx.lineTo(fx + liqHalfW, liqY);
    ctx.closePath();
    ctx.fillStyle = liqColor;
    ctx.fill();

    /* Chips in flask */
    if (state.running || state.elapsed > 0) {
      drawChips(fx, fy - 20);
    }

    /* Bung */
    if (state.running || state.elapsed > 0) {
      ctx.fillStyle = '#6b5b45';
      ctx.fillRect(fx - 14, fy - 134, 28, 8);
    }
  }

  function drawChips(cx, cy) {
    var chipCount = state.chipSize === 'powder' ? 12 : (state.chipSize === 'small' ? 6 : 3);
    var chipSize = state.chipSize === 'powder' ? 3 : (state.chipSize === 'small' ? 6 : 10);

    ctx.fillStyle = '#d4d0c8';
    for (var i = 0; i < chipCount; i++) {
      var x = cx - 20 + (i * 40 / chipCount) + Math.sin(i * 2.5) * 8;
      var y = cy + Math.cos(i * 1.7) * 6;
      ctx.beginPath();
      ctx.arc(x, y, chipSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#aaa89e';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  function drawTube() {
    /* Delivery tube from flask neck to syringe */
    ctx.strokeStyle = 'rgba(160, 170, 195, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(172, H - 186);
    ctx.quadraticCurveTo(200, H - 200, 300, H - 200);
    ctx.lineTo(340, H - 200);
    ctx.stroke();

    /* Inner tube */
    ctx.strokeStyle = 'rgba(200, 210, 230, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(172, H - 186);
    ctx.quadraticCurveTo(200, H - 200, 300, H - 200);
    ctx.lineTo(340, H - 200);
    ctx.stroke();
  }

  function drawSyringe() {
    var sx = 400, sy = H - 200;
    var maxLen = 120;
    var plungerLen = (state.gasVolume / D.maxGas) * maxLen;

    /* Barrel */
    ctx.fillStyle = 'rgba(235, 240, 250, 0.1)';
    ctx.strokeStyle = 'rgba(160, 170, 195, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(sx - 60, sy - 15, maxLen + 20, 30);
    ctx.fill();
    ctx.stroke();

    /* Graduation marks */
    ctx.fillStyle = 'rgba(160, 170, 195, 0.4)';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var v = 0; v <= D.maxGas; v += 10) {
      var mx = sx - 55 + (v / D.maxGas) * maxLen;
      ctx.fillRect(mx, sy - 14, 0.5, 4);
      if (v % 20 === 0) {
        ctx.fillText(v, mx, sy - 17);
      }
    }

    /* Plunger */
    ctx.fillStyle = '#5c5f6e';
    var plungerX = sx - 55 + plungerLen;
    ctx.fillRect(plungerX, sy - 12, 4, 24);

    /* Plunger handle */
    ctx.fillRect(plungerX + 4, sy - 8, maxLen - plungerLen + 15, 2);
    ctx.fillRect(plungerX + maxLen - plungerLen + 15, sy - 14, 4, 28);

    /* Gas in syringe */
    if (state.gasVolume > 0) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.08)';
      ctx.fillRect(sx - 55, sy - 12, plungerLen, 24);
    }

    /* Label */
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Gas syringe (cm\u00B3)', sx - 55, sy + 28);

    /* Volume readout */
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(state.gasVolume.toFixed(1) + ' cm\u00B3', sx + maxLen - 35, sy + 28);
  }

  function drawBubbles() {
    ctx.fillStyle = 'rgba(220, 230, 250, 0.6)';
    for (var i = 0; i < state.bubbles.length; i++) {
      var b = state.bubbles[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* --- Bubbles --- */
  function spawnBubble() {
    var rate = getK() * state.concentration;
    if (Math.random() > rate * 2) return;
    state.bubbles.push({
      x: 140 + Math.random() * 40,
      y: H - 90 + Math.random() * 20,
      r: 1.5 + Math.random() * 2.5,
      vy: -0.5 - Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.3
    });
  }

  function updateBubbles(dt) {
    for (var i = state.bubbles.length - 1; i >= 0; i--) {
      var b = state.bubbles[i];
      b.y += b.vy * dt * 60;
      b.x += b.vx * dt * 60;
      b.x += Math.sin(b.y * 0.1) * 0.2;
      if (b.y < H - 250) {
        state.bubbles.splice(i, 1);
      }
    }
  }

  /* --- Animation loop --- */
  function animate(timestamp) {
    if (!state.running) return;

    var dt = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0.016;
    dt = Math.min(dt, 0.05);
    state.lastFrame = timestamp;

    /* Speed up: 1 real second = 4 simulated seconds */
    var simDt = dt * 4;
    state.elapsed += simDt;

    /* Update gas volume */
    state.gasVolume = gasAtTime(state.elapsed);

    /* Spawn bubbles when reaction is active */
    var completion = state.gasVolume / D.maxGas;
    if (completion < 0.98) {
      spawnBubble();
      if (completion < 0.5) spawnBubble(); /* faster early */
    }
    updateBubbles(dt);

    /* Record at time points */
    while (state.nextReadingAt < D.timePoints.length && state.elapsed >= D.timePoints[state.nextReadingAt]) {
      var t = D.timePoints[state.nextReadingAt];
      recordReading(t, gasAtTime(t));
      state.nextReadingAt++;
      if (typeof LabAudio !== 'undefined') LabAudio.click();
    }

    /* Timer display */
    timerEl.textContent = Math.floor(state.elapsed) + ' s';

    /* Check completion */
    if (state.elapsed >= 120) {
      finishRun();
      return;
    }

    draw();
    drawGraph();
    state.animId = requestAnimationFrame(animate);
  }

  /* --- Start / Reset --- */
  function startReaction() {
    if (state.running) return;

    state.concentration = parseFloat(selConc.value);
    state.chipSize = selChips.value;
    state.elapsed = 0;
    state.gasVolume = 0;
    state.bubbles = [];
    state.readings = [];
    state.nextReadingAt = 0;
    state.lastFrame = 0;
    state.running = true;

    buildTable();
    rateCalc.hidden = true;
    btnStart.disabled = true;
    selConc.disabled = true;
    selChips.disabled = true;

    highlightStep('pour');
    toast('Reaction started — recording readings every 10 seconds');

    state.animId = requestAnimationFrame(animate);
  }

  function finishRun() {
    state.running = false;
    cancelAnimationFrame(state.animId);

    /* Fill any remaining readings */
    while (state.nextReadingAt < D.timePoints.length) {
      var t = D.timePoints[state.nextReadingAt];
      recordReading(t, gasAtTime(t));
      state.nextReadingAt++;
    }

    state.gasVolume = gasAtTime(120);
    draw();
    drawGraph();

    /* Calculate initial rate (first 10 s) */
    var initRate = (gasAtTime(10) - gasAtTime(0)) / 10;
    rateValue.textContent = initRate.toFixed(2) + ' cm\u00B3/s';
    rateCalc.hidden = false;

    /* Store run */
    state.allRuns.push({ conc: state.concentration, chip: state.chipSize, readings: state.readings.slice() });

    btnStart.disabled = false;
    selConc.disabled = false;
    selChips.disabled = false;

    highlightStep('repeat');
    toast('Run complete! Change concentration and repeat, or view your graph.', 'success');

    if (typeof LabAudio !== 'undefined') LabAudio.success();
    if (typeof LabProgress !== 'undefined') LabProgress.markComplete('rates-of-reaction');

    /* Export buttons */
    var exportArea = document.getElementById('export-area');
    exportArea.innerHTML = '';
    if (typeof LabExport !== 'undefined') {
      LabExport.addExportButtons(exportArea, {
        canvas: graph,
        filename: 'rates-graph.png',
        table: document.getElementById('data-table'),
        csvFilename: 'rates-data.csv'
      });
    }
  }

  function resetAll() {
    state.running = false;
    cancelAnimationFrame(state.animId);
    state.elapsed = 0;
    state.gasVolume = 0;
    state.bubbles = [];
    state.readings = [];
    state.allRuns = [];
    state.nextReadingAt = 0;

    btnStart.disabled = false;
    selConc.disabled = false;
    selChips.disabled = false;
    timerEl.textContent = '0 s';
    rateCalc.hidden = true;

    buildTable();
    draw();
    clearGraph();
    highlightStep('measure');
  }

  btnStart.addEventListener('click', startReaction);
  btnReset.addEventListener('click', resetAll);

  /* --- Graph --- */
  var GW = graph.width, GH = graph.height;

  function drawGraph() {
    gctx.clearRect(0, 0, GW, GH);

    var pad = { top: 20, right: 15, bottom: 35, left: 45 };
    var plotW = GW - pad.left - pad.right;
    var plotH = GH - pad.top - pad.bottom;

    /* Axes */
    gctx.strokeStyle = '#ccc';
    gctx.lineWidth = 1;
    gctx.beginPath();
    gctx.moveTo(pad.left, pad.top);
    gctx.lineTo(pad.left, pad.top + plotH);
    gctx.lineTo(pad.left + plotW, pad.top + plotH);
    gctx.stroke();

    /* Labels */
    gctx.fillStyle = '#666';
    gctx.font = '10px Inter, sans-serif';
    gctx.textAlign = 'center';
    gctx.fillText('Time / s', pad.left + plotW / 2, GH - 5);
    gctx.save();
    gctx.translate(12, pad.top + plotH / 2);
    gctx.rotate(-Math.PI / 2);
    gctx.fillText('Volume CO\u2082 / cm\u00B3', 0, 0);
    gctx.restore();

    /* Tick marks */
    gctx.font = '9px Inter, sans-serif';
    gctx.textAlign = 'center';
    for (var t = 0; t <= 120; t += 30) {
      var tx = pad.left + (t / 120) * plotW;
      gctx.fillText(t, tx, pad.top + plotH + 14);
      gctx.strokeStyle = '#eee';
      gctx.beginPath();
      gctx.moveTo(tx, pad.top);
      gctx.lineTo(tx, pad.top + plotH);
      gctx.stroke();
    }
    gctx.textAlign = 'right';
    for (var v = 0; v <= D.maxGas; v += 10) {
      var vy = pad.top + plotH - (v / D.maxGas) * plotH;
      gctx.fillText(v, pad.left - 6, vy + 3);
    }

    /* Plot all runs */
    var colors = ['#4361ee', '#06d6a0', '#f77f00', '#ef476f'];
    for (var r = 0; r < state.allRuns.length; r++) {
      plotLine(state.allRuns[r].readings, colors[r % colors.length], pad, plotW, plotH);
    }

    /* Plot current run in progress */
    if (state.running && state.readings.length > 0) {
      plotLine(state.readings, colors[state.allRuns.length % colors.length], pad, plotW, plotH);
    }
  }

  function plotLine(readings, color, pad, plotW, plotH) {
    if (readings.length < 1) return;
    gctx.strokeStyle = color;
    gctx.lineWidth = 2;
    gctx.beginPath();
    for (var i = 0; i < readings.length; i++) {
      var x = pad.left + (readings[i].time / 120) * plotW;
      var y = pad.top + plotH - (readings[i].vol / D.maxGas) * plotH;
      if (i === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
    }
    gctx.stroke();

    /* Points */
    gctx.fillStyle = color;
    for (var j = 0; j < readings.length; j++) {
      var px = pad.left + (readings[j].time / 120) * plotW;
      var py = pad.top + plotH - (readings[j].vol / D.maxGas) * plotH;
      gctx.beginPath();
      gctx.arc(px, py, 3, 0, Math.PI * 2);
      gctx.fill();
    }
  }

  function clearGraph() {
    gctx.clearRect(0, 0, GW, GH);
  }

  /* --- Procedure steps --- */
  function highlightStep(id) {
    var items = procList.querySelectorAll('li');
    var found = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === 'step-' + id) {
        items[i].className = 'active';
        found = true;
      } else if (!found) {
        items[i].className = 'done';
      } else {
        items[i].className = '';
      }
    }
  }

  /* --- Toast --- */
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    if (typeof LabAudio !== 'undefined') {
      if (type === 'success') LabAudio.success();
      else if (type === 'warn') LabAudio.warn();
      else LabAudio.click();
    }
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
  }

  /* --- Init --- */
  highlightStep('measure');
  draw();
  if (typeof LabProgress !== 'undefined') LabProgress.markVisited('rates-of-reaction');
})();
