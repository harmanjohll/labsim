/* ============================================================
   Qualitative Analysis Practical — Logic
   Uses CHEMISTRY_DATA from chemistry-data.js (loaded first)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const data = window.CHEMISTRY_DATA;
  const NUM_TUBES = 5;

  // ── State ──
  const state = {
    unknownKey: null,       // e.g. 'FB6'
    unknownData: null,      // reference to CHEMISTRY_DATA.unknowns[key]
    selectedReagent: null,  // reagent key: 'NaOH', 'NH3', etc.
    selectedTube: null,     // tube index 1–5
    tubeContents: {},       // { 1: [{reagent, amount}], 2: [...] }
    tubeHasSample: {},      // { 1: true, ... }
    observations: [],       // [{tube, procedure, observation}]
  };

  // ── DOM ──
  const $ = id => document.getElementById(id);
  const dom = {
    unknownSelect: $('unknown-select'),
    confirmBtn: $('btn-confirm-unknown'),
    unknownChooser: $('unknown-chooser'),
    unknownInfo: $('unknown-info'),
    unknownBadge: $('unknown-badge'),
    unknownHint: $('unknown-hint'),
    rackTubes: $('rack-tubes'),
    reagentShelf: $('reagent-shelf'),
    actionPanel: $('action-panel'),
    btnDrops: $('btn-add-drops'),
    btnExcess: $('btn-add-excess'),
    btnTransfer: $('btn-transfer'),
    btnFlameTest: $('btn-flame-test'),
    bunsen: $('bunsen'),
    bunsenFlame: $('bunsen-flame'),
    sink: $('sink'),
    washBar: $('wash-bar'),
    btnWash: $('btn-wash'),
    obsTbody: $('obs-tbody'),
    obsEmpty: $('obs-empty'),
    flameOverlay: $('flame-overlay'),
    flameVisual: $('flame-visual'),
    flameText: $('flame-text'),
    btnCloseFlame: $('btn-close-flame'),
    idCation: $('id-cation'),
    idAnion: $('id-anion'),
    btnCheckId: $('btn-check-id'),
    idResult: $('id-result'),
    btnReset: $('btn-reset'),
    btnToggleGuide: $('btn-toggle-guide'),
    guidePanel: $('guide-panel'),
    workbench: $('workbench'),
  };

  // ── Reagent definitions ──
  const REAGENTS = [
    { key: 'NaOH',  label: 'NaOH',  sub: '(aq)' },
    { key: 'NH3',   label: 'NH₃',   sub: '(aq)' },
    { key: 'HNO3',  label: 'HNO₃',  sub: '(aq)' },
    { key: 'AgNO3', label: 'AgNO₃', sub: '(aq)' },
    { key: 'BaCl2', label: 'BaCl₂', sub: '(aq)' },
  ];

  // ── Initialise UI ──
  buildUnknownSelect();
  buildTestTubes();
  buildReagentBottles();

  // ── Unknown Selection ──
  function buildUnknownSelect() {
    Object.keys(data.unknowns).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key; // don't reveal formula!
      dom.unknownSelect.appendChild(opt);
    });
  }

  dom.unknownSelect.addEventListener('change', () => {
    dom.confirmBtn.disabled = !dom.unknownSelect.value;
  });

  dom.confirmBtn.addEventListener('click', () => {
    const key = dom.unknownSelect.value;
    if (!key) return;
    state.unknownKey = key;
    state.unknownData = data.unknowns[key];

    dom.unknownChooser.style.display = 'none';
    dom.unknownInfo.style.display = '';
    dom.unknownBadge.textContent = key;

    // Show colour hint
    const colorName = state.unknownData.colorName;
    dom.unknownHint.textContent = colorName === 'colourless'
      ? 'The solution is colourless. Identify the cation and anion.'
      : `The solution is ${colorName}. Identify the cation and anion.`;

    dom.washBar.style.display = '';
    dom.btnCheckId.disabled = false;

    addObservation('—', `${key} solution observed.`,
      colorName === 'colourless'
        ? 'Colourless solution.'
        : `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} solution.`
    );
  });


  // ── Test Tubes ──
  function buildTestTubes() {
    dom.rackTubes.innerHTML = '';
    for (let i = 1; i <= NUM_TUBES; i++) {
      const slot = document.createElement('div');
      slot.className = 'tube-slot';

      const label = document.createElement('div');
      label.className = 'tube-label';
      label.id = `tube-label-${i}`;

      const tube = document.createElement('div');
      tube.className = 'test-tube';
      tube.dataset.tube = i;

      const liquid = document.createElement('div');
      liquid.className = 'tube-liquid';
      liquid.id = `tube-liquid-${i}`;

      const ppt = document.createElement('div');
      ppt.className = 'ppt-layer';
      ppt.id = `tube-ppt-${i}`;

      tube.appendChild(liquid);
      tube.appendChild(ppt);
      slot.appendChild(label);
      slot.appendChild(tube);
      dom.rackTubes.appendChild(slot);

      // Click handler
      tube.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTube(i);
      });
    }
  }

  function selectTube(idx) {
    // Deselect all
    document.querySelectorAll('.test-tube').forEach(t => t.classList.remove('selected'));
    state.selectedTube = idx;
    document.querySelector(`.test-tube[data-tube="${idx}"]`).classList.add('selected');

    if (state.selectedReagent) {
      showActionPanel(idx);
    }
  }

  function deselectAll() {
    document.querySelectorAll('.test-tube').forEach(t => t.classList.remove('selected'));
    document.querySelectorAll('.reagent-bottle').forEach(b => b.classList.remove('selected'));
    state.selectedTube = null;
    state.selectedReagent = null;
    hideActionPanel();
  }


  // ── Reagent Bottles ──
  function buildReagentBottles() {
    dom.reagentShelf.innerHTML = '';

    // Unknown sample bottle
    const unknownSlot = createBottle('Unknown', state.unknownKey || '?', '');
    unknownSlot.querySelector('.reagent-bottle').id = 'bottle-unknown';
    dom.reagentShelf.appendChild(unknownSlot);

    // Reagent bottles
    REAGENTS.forEach(r => {
      const slot = createBottle(r.key, r.label, r.sub);
      dom.reagentShelf.appendChild(slot);
    });
  }

  function createBottle(key, label, sub) {
    const slot = document.createElement('div');
    slot.className = 'reagent-slot';

    const bottle = document.createElement('div');
    bottle.className = 'reagent-bottle';
    bottle.dataset.reagent = key;

    const cap = document.createElement('div');
    cap.className = 'bottle-cap';

    const lbl = document.createElement('span');
    lbl.className = 'bottle-label';
    lbl.innerHTML = label + (sub ? `<br><span style="font-weight:400;opacity:0.7;">${sub}</span>` : '');

    bottle.appendChild(cap);
    bottle.appendChild(lbl);
    slot.appendChild(bottle);

    bottle.addEventListener('click', (e) => {
      e.stopPropagation();
      selectReagent(key);
    });

    return slot;
  }

  function selectReagent(key) {
    if (!state.unknownKey) return;
    document.querySelectorAll('.reagent-bottle').forEach(b => b.classList.remove('selected'));
    state.selectedReagent = key;
    const bottle = document.querySelector(`.reagent-bottle[data-reagent="${key}"]`);
    if (bottle) bottle.classList.add('selected');

    if (state.selectedTube) {
      showActionPanel(state.selectedTube);
    }
  }


  // ── Action Panel ──
  function showActionPanel(tubeIdx) {
    const reagent = state.selectedReagent;
    if (!reagent) return;

    // Position above the test tube
    const tube = document.querySelector(`.test-tube[data-tube="${tubeIdx}"]`);
    const tubeRect = tube.getBoundingClientRect();
    const wbRect = dom.workbench.getBoundingClientRect();

    dom.actionPanel.style.left = (tubeRect.left - wbRect.left - 50) + 'px';
    dom.actionPanel.style.top = (tubeRect.top - wbRect.top - 120) + 'px';
    dom.actionPanel.style.display = 'flex';

    // What buttons to show
    dom.btnTransfer.style.display = (reagent === 'Unknown') ? '' : 'none';
    dom.btnDrops.style.display = (reagent !== 'Unknown') ? '' : 'none';
    dom.btnExcess.style.display =
      (reagent !== 'Unknown' && reagent !== 'HNO3' && reagent !== 'AgNO3' && reagent !== 'BaCl2') ? '' : 'none';
    dom.btnFlameTest.style.display = 'none';
  }

  function hideActionPanel() {
    dom.actionPanel.style.display = 'none';
  }


  // ── Chemistry Application ──
  dom.btnTransfer.addEventListener('click', () => {
    const tube = state.selectedTube;
    if (!tube || !state.unknownKey) return;
    transferSample(tube);
    hideActionPanel();
    deselectAll();
  });

  dom.btnDrops.addEventListener('click', () => {
    const tube = state.selectedTube;
    const reagent = state.selectedReagent;
    if (!tube || !reagent) return;
    applyReagent(tube, reagent, 'few');
    hideActionPanel();
    deselectAll();
  });

  dom.btnExcess.addEventListener('click', () => {
    const tube = state.selectedTube;
    const reagent = state.selectedReagent;
    if (!tube || !reagent) return;
    applyReagent(tube, reagent, 'excess');
    hideActionPanel();
    deselectAll();
  });

  function transferSample(tubeIdx) {
    if (!state.tubeContents[tubeIdx]) state.tubeContents[tubeIdx] = [];
    state.tubeHasSample[tubeIdx] = true;

    const liquid = document.getElementById(`tube-liquid-${tubeIdx}`);
    const label = document.getElementById(`tube-label-${tubeIdx}`);
    liquid.style.height = '25%';
    liquid.style.background = state.unknownData.solutionColor;
    if (label) label.textContent = state.unknownKey;

    addObservation(`TT${tubeIdx}`,
      `About 1 cm³ of ${state.unknownKey} placed in TT${tubeIdx}.`,
      state.unknownData.colorName === 'colourless'
        ? 'Colourless solution.'
        : `${state.unknownData.colorName.charAt(0).toUpperCase() + state.unknownData.colorName.slice(1)} solution.`
    );
  }

  function applyReagent(tubeIdx, reagentKey, amount) {
    if (!state.tubeHasSample[tubeIdx]) {
      // Can't add reagent to empty tube
      return;
    }
    if (!state.tubeContents[tubeIdx]) state.tubeContents[tubeIdx] = [];
    state.tubeContents[tubeIdx].push({ reagent: reagentKey, amount });

    const cation = state.unknownData.cation;
    const anion = state.unknownData.anion;
    const history = state.tubeContents[tubeIdx];

    let result = null;
    let procedure = '';
    const reagentDisplay = data.reagentNames[reagentKey] || reagentKey;

    if (amount === 'few') {
      procedure = `1–2 drops of ${reagentDisplay} added to ${state.unknownKey} in TT${tubeIdx}.`;
    } else {
      procedure = `Excess ${reagentDisplay} added to ${state.unknownKey} in TT${tubeIdx}.`;
    }

    // ── Cation tests (NaOH / NH3) ──
    if (reagentKey === 'NaOH' || reagentKey === 'NH3') {
      const testKey = `${reagentKey}_${amount}`;
      const cationData = data.cationTests[cation];
      if (cationData && cationData[testKey]) {
        result = cationData[testKey];
      }
    }

    // ── Anion tests (AgNO3 / BaCl2 after HNO3) ──
    if (reagentKey === 'AgNO3' || reagentKey === 'BaCl2') {
      const hasHNO3 = history.some(h => h.reagent === 'HNO3');
      if (hasHNO3) {
        const anionData = data.anionTests[anion];
        if (anionData && anionData[reagentKey]) {
          result = anionData[reagentKey];
        }
      } else {
        result = { observation: 'No HNO₃ added first — acidify the solution before testing.' };
      }
    }

    // ── HNO3 (acidification step) ──
    if (reagentKey === 'HNO3') {
      result = { observation: 'Solution acidified with dilute HNO₃(aq).' };
    }

    // ── Update visuals ──
    const liquid = document.getElementById(`tube-liquid-${tubeIdx}`);
    const ppt = document.getElementById(`tube-ppt-${tubeIdx}`);

    if (result) {
      if (result.ppt) {
        ppt.style.opacity = '1';
        ppt.style.height = '14px';
        ppt.style.background = result.pptColor || '#f0f2f5';
      } else {
        ppt.style.opacity = '0';
        ppt.style.height = '0';
      }
      if (result.solutionColor) {
        liquid.style.background = result.solutionColor;
      }
      // Increase liquid level when adding excess
      if (amount === 'excess') {
        liquid.style.height = '65%';
      } else if (liquid.style.height === '25%' || liquid.style.height === '') {
        liquid.style.height = '40%';
      }

      addObservation(`TT${tubeIdx}`, procedure, result.observation || 'No visible change.');
    } else {
      addObservation(`TT${tubeIdx}`, procedure, 'No visible change.');
    }
  }


  // ── Flame Test ──
  dom.bunsen.addEventListener('click', () => {
    if (!state.unknownKey) return;
    performFlameTest();
  });

  function performFlameTest() {
    const cation = state.unknownData.cation;
    const cationData = data.cationTests[cation];
    const flameData = cationData?.flame;

    dom.bunsenFlame.classList.add('lit');

    if (flameData) {
      dom.flameVisual.style.background = `radial-gradient(ellipse, ${flameData.flameColor} 0%, ${flameData.flameColor}88 40%, transparent 70%)`;
      dom.flameText.textContent = flameData.observation;
      addObservation('Flame', `Nichrome wire dipped in ${state.unknownKey}, held in Bunsen flame.`, flameData.observation);
    } else {
      dom.flameVisual.style.background = 'radial-gradient(ellipse, #3b82f6 0%, #60a5fa 40%, transparent 70%)';
      dom.flameText.textContent = 'No distinctive flame colour observed (normal blue flame).';
      addObservation('Flame', `Nichrome wire dipped in ${state.unknownKey}, held in Bunsen flame.`, 'No distinctive flame colour observed.');
    }

    dom.flameOverlay.style.display = '';
  }

  dom.btnCloseFlame.addEventListener('click', () => {
    dom.flameOverlay.style.display = 'none';
    dom.bunsenFlame.classList.remove('lit');
  });


  // ── Observations Table ──
  function addObservation(tube, procedure, observation) {
    state.observations.push({ tube, procedure, observation });
    dom.obsEmpty.style.display = 'none';

    const row = document.createElement('tr');
    row.className = 'animate-fade-in';
    row.innerHTML = `
      <td>${tube}</td>
      <td>${procedure}</td>
      <td>${observation}</td>
    `;
    dom.obsTbody.appendChild(row);

    // Scroll to bottom
    const scrollContainer = dom.obsTbody.closest('.qa-obs-scroll');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }


  // ── Wash / Sink ──
  dom.sink.addEventListener('click', () => {
    dom.washBar.style.display = '';
  });

  dom.btnWash.addEventListener('click', () => {
    washTubes();
  });

  function washTubes() {
    for (let i = 1; i <= NUM_TUBES; i++) {
      const liquid = document.getElementById(`tube-liquid-${i}`);
      const ppt = document.getElementById(`tube-ppt-${i}`);
      const label = document.getElementById(`tube-label-${i}`);
      if (liquid) { liquid.style.height = '0'; liquid.style.background = 'transparent'; }
      if (ppt) { ppt.style.opacity = '0'; ppt.style.height = '0'; }
      if (label) label.textContent = '';
    }
    state.tubeContents = {};
    state.tubeHasSample = {};
    addObservation('All', 'All test tubes washed and dried.', '—');
  }


  // ── Identification Check ──
  dom.btnCheckId.addEventListener('click', () => {
    if (!state.unknownKey) return;
    checkIdentification();
  });

  function checkIdentification() {
    const cationInput = dom.idCation.value.trim();
    const anionInput = dom.idAnion.value.trim();

    if (!cationInput && !anionInput) return;

    const actualCation = state.unknownData.cation;
    const actualAnion = state.unknownData.anion;

    // Flexible matching
    const cationCorrect = matchIon(cationInput, actualCation);
    const anionCorrect = matchIon(anionInput, actualAnion);

    dom.idResult.style.display = '';

    if (cationCorrect && anionCorrect) {
      dom.idResult.className = 'mt-2 id-result-correct';
      dom.idResult.innerHTML = `Correct! The unknown is <strong>${state.unknownData.formula}</strong> (${formatIon(actualCation)} + ${formatIon(actualAnion)}).`;
    } else {
      let msg = '';
      if (cationCorrect) msg += 'Cation is correct. ';
      else if (cationInput) msg += `Cation is incorrect (you said "${cationInput}"). `;
      if (anionCorrect) msg += 'Anion is correct. ';
      else if (anionInput) msg += `Anion is incorrect (you said "${anionInput}"). `;
      msg += 'Try again — review your observations.';
      dom.idResult.className = 'mt-2 id-result-incorrect';
      dom.idResult.textContent = msg;
    }
  }

  function matchIon(input, actual) {
    if (!input) return false;
    const clean = input.toLowerCase().replace(/\s+/g, '').replace(/[²³⁺⁻₂₃₄]/g, (c) => {
      const map = { '²': '2', '³': '3', '⁺': '+', '⁻': '-', '₂': '2', '₃': '3', '₄': '4' };
      return map[c] || c;
    });
    const actualClean = actual.toLowerCase().replace(/\s+/g, '');
    return clean === actualClean || clean === actualClean.replace(/[+-]/g, '');
  }

  function formatIon(ion) {
    return ion.replace('2+', '²⁺').replace('3+', '³⁺').replace('2-', '²⁻').replace('-', '⁻');
  }


  // ── Reset ──
  dom.btnReset.addEventListener('click', () => {
    // Reset state
    Object.assign(state, {
      unknownKey: null,
      unknownData: null,
      selectedReagent: null,
      selectedTube: null,
      tubeContents: {},
      tubeHasSample: {},
      observations: [],
    });

    // Reset UI
    dom.unknownChooser.style.display = '';
    dom.unknownInfo.style.display = 'none';
    dom.unknownSelect.value = '';
    dom.confirmBtn.disabled = true;

    // Reset tubes
    for (let i = 1; i <= NUM_TUBES; i++) {
      const liquid = document.getElementById(`tube-liquid-${i}`);
      const ppt = document.getElementById(`tube-ppt-${i}`);
      const label = document.getElementById(`tube-label-${i}`);
      if (liquid) { liquid.style.height = '0'; liquid.style.background = 'transparent'; }
      if (ppt) { ppt.style.opacity = '0'; ppt.style.height = '0'; }
      if (label) label.textContent = '';
    }

    deselectAll();
    hideActionPanel();
    dom.obsTbody.innerHTML = '';
    dom.obsEmpty.style.display = '';
    dom.washBar.style.display = 'none';
    dom.flameOverlay.style.display = 'none';
    dom.bunsenFlame.classList.remove('lit');
    dom.idCation.value = '';
    dom.idAnion.value = '';
    dom.btnCheckId.disabled = true;
    dom.idResult.style.display = 'none';

    // Rebuild bottles (to reset unknown bottle label)
    buildReagentBottles();
  });


  // ── Guide Toggle ──
  dom.btnToggleGuide.addEventListener('click', () => {
    const visible = dom.guidePanel.style.display !== 'none';
    dom.guidePanel.style.display = visible ? 'none' : '';
  });


  // ── Global click to deselect ──
  dom.workbench.addEventListener('click', (e) => {
    if (!e.target.closest('.test-tube') &&
        !e.target.closest('.reagent-bottle') &&
        !e.target.closest('.action-panel') &&
        !e.target.closest('.bunsen-assembly') &&
        !e.target.closest('.sink-assembly')) {
      deselectAll();
    }
  });
});
