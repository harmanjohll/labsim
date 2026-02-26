/* ============================================================
   Titration Practical — Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Constants ──
  const BURETTE_MAX = 50.00;
  const PIPETTE_VOL = 25.0;
  const CONCORDANT_THRESHOLD = 0.10; // cm³

  // ── Indicator Data ──
  const INDICATORS = {
    MO: {
      name: 'Methyl Orange',
      acidColor: '#ef4444',
      baseColor: '#fde047',
      nearEndpoint: '#f59e0b',
    },
    PH: {
      name: 'Phenolphthalein',
      acidColor: 'rgba(220, 230, 245, 0.5)',
      baseColor: '#ec4899',
      nearEndpoint: '#fbcfe8',
    },
    TB: {
      name: 'Thymol Blue',
      acidColor: '#fde047',
      baseColor: '#3b82f6',
      nearEndpoint: '#86efac',
    },
  };

  // ── Guided Steps ──
  const STEPS = [
    {
      id: 'rinse-burette',
      title: 'Rinse the burette',
      desc: 'Rinse the burette with a small amount of the base solution (FA1).',
      why: 'Rinsing with the solution it will contain (not water) prevents dilution of the base, which would cause systematic error in your titre values.',
      actions: [{ label: 'Rinse with FA1', id: 'do-rinse-burette' }],
    },
    {
      id: 'fill-burette',
      title: 'Fill the burette',
      desc: 'Fill the burette with base solution to the 0.00 cm³ mark, then top up to remove any air bubbles below the tap.',
      why: 'The burette must be filled completely so that you can record an accurate initial reading. Air bubbles below the stopcock will give a false volume.',
      actions: [{ label: 'Fill Burette', id: 'do-fill-burette' }],
    },
    {
      id: 'rinse-pipette',
      title: 'Rinse the pipette',
      desc: 'Rinse the pipette with the acid solution FA2.',
      why: 'Same principle as the burette: residual water would dilute FA2 and cause an inaccurate volume of acid to be transferred.',
      actions: [{ label: 'Rinse with FA2', id: 'do-rinse-pipette' }],
    },
    {
      id: 'draw-pipette',
      title: 'Draw 25.0 cm³ of FA2',
      desc: 'Using the pipette filler, draw exactly 25.0 cm³ of the acid FA2 from the beaker.',
      why: 'The pipette delivers a precise fixed volume. Read the bottom of the meniscus at the calibration mark, with your eye at the same level to avoid parallax error.',
      actions: [{ label: 'Draw 25.0 cm³', id: 'do-draw-pipette' }],
    },
    {
      id: 'transfer',
      title: 'Transfer to conical flask',
      desc: 'Transfer the acid from the pipette into the conical flask. Touch the tip to the inner wall and allow it to drain — do not blow out the last drop.',
      why: 'The pipette is calibrated to deliver its stated volume when drained by gravity. Blowing out the residual drop would deliver more than 25.0 cm³.',
      actions: [{ label: 'Transfer to Flask', id: 'do-transfer' }],
    },
    {
      id: 'add-indicator',
      title: 'Add 2–3 drops of indicator',
      desc: 'Choose an indicator and add 2–3 drops to the acid in the conical flask.',
      why: 'The indicator changes colour at (or near) the equivalence point, allowing you to detect when neutralisation is complete. Use only 2–3 drops — too much indicator can affect the titre.',
      actions: [], // dynamically populated
    },
    {
      id: 'place-flask',
      title: 'Place flask under burette',
      desc: 'Place a white tile on the bench below the burette, then place the conical flask on top of it.',
      why: 'The white tile provides contrast so that you can detect the first permanent colour change more easily — especially important near the endpoint.',
      actions: [{ label: 'Place Flask', id: 'do-place-flask' }],
    },
    {
      id: 'record-initial',
      title: 'Record initial burette reading',
      desc: 'Read the burette scale at the bottom of the meniscus and record the initial reading.',
      why: 'Always read at the bottom of the meniscus with your eye level at the liquid surface. Recording the initial reading before dispensing is essential for calculating the titre.',
      actions: [{ label: 'Log Initial Reading', id: 'do-log-initial' }],
    },
    {
      id: 'titrate',
      title: 'Titrate',
      desc: 'Open the stopcock to add base to the flask. Use fast flow initially, then slow to drops near the endpoint. Swirl continuously.',
      why: 'Swirling ensures thorough mixing so the indicator responds uniformly. Near the endpoint, a brief colour flash appears then disappears on swirling — switch to half-drops at this point.',
      actions: [],
    },
    {
      id: 'record-final',
      title: 'Record final burette reading',
      desc: 'The endpoint has been reached — the colour change is now permanent. Record the final burette reading.',
      why: 'The titre (volume of base added) = final reading − initial reading. Record to 2 decimal places (nearest 0.05 cm³).',
      actions: [{ label: 'Log Final Reading', id: 'do-log-final' }],
    },
    {
      id: 'repeat',
      title: 'Repeat for concordant results',
      desc: 'Reset the flask and repeat the titration until you obtain at least two titre values that agree within 0.10 cm³.',
      why: 'Concordant results demonstrate reliability and precision. Only concordant titres are averaged for the final calculation. The rough titration gives you an estimate of where the endpoint lies.',
      actions: [{ label: 'Start Next Titration', id: 'do-repeat' }],
    },
  ];

  // ── State ──
  const state = {
    step: 0,
    guideOpen: true,
    buretteRinsed: false,
    buretteFilled: false,
    buretteVolume: 0, // volume of liquid in burette (0 = empty, 50 = full)
    pipetteRinsed: false,
    pipetteFilled: false,
    flaskFilled: false,
    indicatorType: null,
    indicatorAdded: false,
    flaskPlaced: false,
    initialReading: null,
    endpointReached: false,
    titrating: false,
    run: 0, // 0=rough, 1,2,3
    results: [], // [{initial, final, titre}]
    acidConc: 0.10,
    baseConc: 0.10,
    endpointVol: 0,
  };

  // ── DOM References ──
  const $ = id => document.getElementById(id);
  const dom = {
    stepsBar: $('steps-bar'),
    guidePanel: $('guide-panel'),
    guideTitle: $('guide-title'),
    guideDesc: $('guide-desc'),
    guideWhy: $('guide-why'),
    guideActions: $('guide-actions'),
    workbench: $('workbench'),
    beaker: $('beaker'),
    beakerLiquid: $('beaker-liquid'),
    pipette: $('pipette'),
    pipetteLiquid: $('pipette-liquid'),
    pipetteBulgeLiquid: $('pipette-bulge-liquid'),
    flask: $('flask'),
    flaskLiquid: $('flask-liquid'),
    indicator: $('indicator'),
    standAssembly: $('stand-assembly'),
    burette: $('burette'),
    buretteLiquid: $('burette-liquid'),
    buretteReading: $('burette-reading'),
    buretteControls: $('burette-controls'),
    buretteDrip: $('burette-drip'),
    stopcockHandle: $('stopcock-handle'),
    whiteTile: $('white-tile'),
    flaskZone: $('flask-zone'),
    btnFast: $('btn-fast'),
    btnSlow: $('btn-slow'),
    btnDrop: $('btn-drop'),
    btnSwirl: $('btn-swirl'),
    btnLogInitial: $('btn-log-initial'),
    btnLogFinal: $('btn-log-final'),
    btnTopup: $('btn-topup'),
    btnReset: $('btn-reset'),
    btnToggleGuide: $('btn-toggle-guide'),
    acidSlider: $('acid-conc-slider'),
    acidDisplay: $('acid-conc-display'),
    baseSelect: $('base-select'),
    concordantMsg: $('concordant-msg'),
    calcWorkspace: $('calc-workspace'),
  };

  // ── Initialization ──
  computeEndpoint();
  renderStepsBar();
  updateGuide();
  updateVisuals();
  positionFlaskZone();

  // ── Configuration Handlers ──
  dom.acidSlider.addEventListener('input', () => {
    state.acidConc = parseFloat(dom.acidSlider.value);
    dom.acidDisplay.textContent = state.acidConc.toFixed(3) + ' M';
    computeEndpoint();
  });
  dom.baseSelect.addEventListener('change', () => {
    state.baseConc = parseFloat(dom.baseSelect.value);
    computeEndpoint();
  });

  function computeEndpoint() {
    state.endpointVol = (state.acidConc * PIPETTE_VOL) / state.baseConc;
    state.endpointReached = false;
  }

  // ── Step Bar ──
  function renderStepsBar() {
    dom.stepsBar.innerHTML = '';
    STEPS.forEach((s, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'step-connector' + (i <= state.step ? ' completed' : '');
        dom.stepsBar.appendChild(conn);
      }
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      if (i < state.step) dot.classList.add('completed');
      if (i === state.step) dot.classList.add('active');
      dot.textContent = i + 1;
      dot.title = s.title;
      dom.stepsBar.appendChild(dot);
    });
    // Scroll active step into view
    const active = dom.stepsBar.querySelector('.step-dot.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  // ── Guide Panel ──
  function updateGuide() {
    const step = STEPS[state.step];
    if (!step) return;

    dom.guideTitle.textContent = `Step ${state.step + 1}: ${step.title}`;
    dom.guideDesc.textContent = step.desc;

    if (step.why) {
      dom.guideWhy.textContent = step.why;
      dom.guideWhy.style.display = '';
    } else {
      dom.guideWhy.style.display = 'none';
    }

    // Actions
    dom.guideActions.innerHTML = '';

    if (step.id === 'add-indicator') {
      // Show indicator choices
      Object.entries(INDICATORS).forEach(([key, ind]) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost btn-sm';
        btn.textContent = ind.name;
        btn.addEventListener('click', () => selectIndicator(key));
        dom.guideActions.appendChild(btn);
      });
    } else if (step.id === 'titrate') {
      // No actions in guide — use the burette controls
      const note = document.createElement('span');
      note.className = 'text-sm text-muted';
      note.textContent = 'Use the burette controls below the workbench.';
      dom.guideActions.appendChild(note);
    } else {
      step.actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.textContent = a.label;
        btn.addEventListener('click', () => handleAction(a.id));
        dom.guideActions.appendChild(btn);
      });
    }
  }

  function advanceStep() {
    if (state.step < STEPS.length - 1) {
      state.step++;
      renderStepsBar();
      updateGuide();
    }
  }

  // ── Action Handlers ──
  function handleAction(actionId) {
    switch (actionId) {
      case 'do-rinse-burette':
        state.buretteRinsed = true;
        advanceStep();
        break;

      case 'do-fill-burette':
        state.buretteFilled = true;
        state.buretteVolume = BURETTE_MAX;
        updateVisuals();
        advanceStep();
        break;

      case 'do-rinse-pipette':
        state.pipetteRinsed = true;
        advanceStep();
        break;

      case 'do-draw-pipette':
        state.pipetteFilled = true;
        dom.pipetteLiquid.style.height = '90%';
        dom.pipetteBulgeLiquid.style.height = '100%';
        advanceStep();
        break;

      case 'do-transfer':
        state.pipetteFilled = false;
        state.flaskFilled = true;
        dom.pipetteLiquid.style.height = '0';
        dom.pipetteBulgeLiquid.style.height = '0';
        dom.flaskLiquid.style.height = '30%';
        dom.flaskLiquid.style.backgroundColor = 'rgba(180, 210, 255, 0.4)';
        advanceStep();
        break;

      case 'do-place-flask':
        placeFlask();
        advanceStep();
        break;

      case 'do-log-initial':
        logInitialReading();
        break;

      case 'do-log-final':
        logFinalReading();
        break;

      case 'do-repeat':
        startNextTitration();
        break;
    }
  }

  // ── Indicator Selection ──
  function selectIndicator(type) {
    state.indicatorType = type;
    state.indicatorAdded = true;
    const ind = INDICATORS[type];
    dom.flaskLiquid.style.backgroundColor = ind.acidColor;
    dom.indicator.querySelector('.indicator-label').textContent = ind.name.split(' ')[0];
    advanceStep();
  }

  // ── Flask Placement ──
  function positionFlaskZone() {
    const bur = dom.burette;
    const zone = dom.flaskZone;
    const stand = dom.standAssembly;
    const base = stand.querySelector('.retort-base');
    zone.style.bottom = (base.offsetHeight + 2) + 'px';
    zone.style.left = (bur.offsetLeft + bur.offsetWidth / 2 - 40) + 'px';
  }

  function placeFlask() {
    state.flaskPlaced = true;
    const stand = dom.standAssembly;
    const bur = dom.burette;
    const base = stand.querySelector('.retort-base');

    // Show white tile
    dom.whiteTile.style.display = '';
    dom.whiteTile.style.position = 'absolute';
    dom.whiteTile.style.bottom = (base.offsetHeight + 2) + 'px';
    dom.whiteTile.style.left = (bur.offsetLeft + bur.offsetWidth / 2 - 45) + 'px';
    dom.whiteTile.style.zIndex = '5';

    // Move flask into stand assembly
    dom.flask.classList.add('placed');
    stand.appendChild(dom.flask);
    dom.flask.style.bottom = (base.offsetHeight + 14) + 'px';
    dom.flask.style.left = (bur.offsetLeft + bur.offsetWidth / 2 - 38) + 'px';

    // Hide zone, show controls
    dom.flaskZone.style.display = 'none';
    dom.buretteControls.style.display = '';
    updateBuretteDisplay();
  }

  function unplaceFlask() {
    state.flaskPlaced = false;
    dom.flask.classList.remove('placed');
    // Move back to workbench
    dom.workbench.appendChild(dom.flask);
    dom.flask.style.bottom = '';
    dom.flask.style.left = '';
    dom.flask.style.position = '';
    dom.whiteTile.style.display = 'none';
    dom.buretteControls.style.display = 'none';
  }

  // ── Burette Logic ──
  let flowInterval = null;

  function getBuretteReading() {
    return BURETTE_MAX - state.buretteVolume;
  }

  function updateBuretteDisplay() {
    dom.buretteReading.textContent = getBuretteReading().toFixed(2) + ' cm³';
  }

  function updateVisuals() {
    // Burette liquid height
    dom.buretteLiquid.style.height = (state.buretteVolume / BURETTE_MAX * 100) + '%';
    updateBuretteDisplay();
  }

  function dispense(vol) {
    if (state.initialReading === null) return;
    if (state.endpointReached) return;
    const amt = Math.min(vol, state.buretteVolume);
    if (amt <= 0) return;

    state.buretteVolume -= amt;
    updateVisuals();
    checkEndpoint();

    // Drip animation
    triggerDrip();
  }

  function triggerDrip() {
    dom.buretteDrip.classList.remove('falling');
    void dom.buretteDrip.offsetWidth; // reflow
    dom.buretteDrip.style.opacity = '1';
    dom.buretteDrip.classList.add('falling');
    setTimeout(() => {
      dom.buretteDrip.classList.remove('falling');
      dom.buretteDrip.style.opacity = '0';
    }, 400);
  }

  function checkEndpoint() {
    if (!state.indicatorType) return;
    const delivered = (state.initialReading !== null)
      ? (BURETTE_MAX - state.initialReading) - (BURETTE_MAX - (state.buretteVolume + (BURETTE_MAX - state.initialReading - (BURETTE_MAX - state.buretteVolume))))
      : 0;

    // Simpler: delivered = initialBuretteVolume - currentBuretteVolume
    const initialVol = state.initialReading; // this stores the buretteVolume at time of logging
    const deliveredVol = initialVol - state.buretteVolume;
    const ind = INDICATORS[state.indicatorType];

    // Near endpoint: flash color briefly
    const ratio = deliveredVol / state.endpointVol;
    if (ratio > 0.85 && ratio < 1.0) {
      dom.flaskLiquid.style.backgroundColor = ind.nearEndpoint;
      setTimeout(() => {
        if (!state.endpointReached) {
          dom.flaskLiquid.style.backgroundColor = ind.acidColor;
        }
      }, 300);
    }

    // Endpoint reached
    if (deliveredVol >= state.endpointVol && !state.endpointReached) {
      state.endpointReached = true;
      dom.flaskLiquid.style.backgroundColor = ind.baseColor;
      stopFlow();
      enableFlowButtons(false);

      // Auto advance to record final
      if (state.step === 8) { // titrate step
        advanceStep();
      }
    }

    // Increase flask liquid height slightly as base is added
    const fillRatio = Math.min(deliveredVol / 30, 1);
    dom.flaskLiquid.style.height = (30 + fillRatio * 25) + '%';
  }

  function startFlow(rate) {
    stopFlow();
    dispense(rate);
    flowInterval = setInterval(() => dispense(rate), 180);
  }

  function stopFlow() {
    if (flowInterval) {
      clearInterval(flowInterval);
      flowInterval = null;
    }
  }

  function enableFlowButtons(enabled) {
    [dom.btnFast, dom.btnSlow, dom.btnDrop].forEach(b => {
      b.disabled = !enabled;
    });
  }

  // Fast flow
  dom.btnFast.addEventListener('mousedown', () => startFlow(0.50));
  dom.btnFast.addEventListener('touchstart', (e) => { e.preventDefault(); startFlow(0.50); });
  ['mouseup', 'mouseleave'].forEach(evt => dom.btnFast.addEventListener(evt, stopFlow));
  ['touchend', 'touchcancel'].forEach(evt => dom.btnFast.addEventListener(evt, stopFlow));

  // Slow flow
  dom.btnSlow.addEventListener('mousedown', () => startFlow(0.10));
  dom.btnSlow.addEventListener('touchstart', (e) => { e.preventDefault(); startFlow(0.10); });
  ['mouseup', 'mouseleave'].forEach(evt => dom.btnSlow.addEventListener(evt, stopFlow));
  ['touchend', 'touchcancel'].forEach(evt => dom.btnSlow.addEventListener(evt, stopFlow));

  // Half drop
  dom.btnDrop.addEventListener('click', () => dispense(0.05));

  // Swirl
  dom.btnSwirl.addEventListener('click', () => {
    dom.flask.classList.remove('swirling');
    void dom.flask.offsetWidth;
    dom.flask.classList.add('swirling');
    setTimeout(() => dom.flask.classList.remove('swirling'), 400);
  });

  // Top up
  let topupInterval = null;
  function topUp(vol) {
    const amt = Math.min(vol, BURETTE_MAX - state.buretteVolume);
    if (amt <= 0) return;
    state.buretteVolume += amt;
    updateVisuals();
  }
  dom.btnTopup.addEventListener('mousedown', () => {
    topUp(0.5);
    topupInterval = setInterval(() => topUp(0.5), 150);
  });
  ['mouseup', 'mouseleave'].forEach(evt =>
    dom.btnTopup.addEventListener(evt, () => { clearInterval(topupInterval); })
  );

  // Log initial reading
  dom.btnLogInitial.addEventListener('click', () => handleAction('do-log-initial'));

  function logInitialReading() {
    state.initialReading = state.buretteVolume;
    const reading = getBuretteReading();
    const inputId = `initial-${state.run}`;
    const input = document.getElementById(inputId);
    if (input) input.value = reading.toFixed(2);

    enableFlowButtons(true);

    if (state.step === 7) advanceStep(); // advance from record-initial to titrate
  }

  // Log final reading
  dom.btnLogFinal.addEventListener('click', () => handleAction('do-log-final'));

  function logFinalReading() {
    const finalReading = getBuretteReading();
    const initialReading = parseFloat(document.getElementById(`initial-${state.run}`)?.value || '0');
    const titre = finalReading - initialReading;

    const finalInput = document.getElementById(`final-${state.run}`);
    const titreInput = document.getElementById(`titre-${state.run}`);
    if (finalInput) finalInput.value = finalReading.toFixed(2);
    if (titreInput) titreInput.value = titre.toFixed(2);

    state.results.push({ initial: initialReading, final: finalReading, titre: titre, run: state.run });

    enableFlowButtons(false);
    checkConcordance();

    if (state.step === 9) advanceStep(); // advance to repeat step
  }

  // ── Concordance Check ──
  function checkConcordance() {
    if (state.results.length < 2) {
      dom.concordantMsg.style.display = 'none';
      return;
    }

    // Check all non-rough titres
    const accurateTitres = state.results.filter(r => r.run > 0).map(r => r.titre);
    let concordantPair = null;

    for (let i = 0; i < accurateTitres.length; i++) {
      for (let j = i + 1; j < accurateTitres.length; j++) {
        if (Math.abs(accurateTitres[i] - accurateTitres[j]) <= CONCORDANT_THRESHOLD) {
          concordantPair = [accurateTitres[i], accurateTitres[j]];
        }
      }
    }

    dom.concordantMsg.style.display = '';
    if (concordantPair) {
      const avg = (concordantPair[0] + concordantPair[1]) / 2;
      dom.concordantMsg.className = 'concordant-msg success';
      dom.concordantMsg.innerHTML = `Concordant results found: ${concordantPair[0].toFixed(2)} and ${concordantPair[1].toFixed(2)} cm³ (within ${CONCORDANT_THRESHOLD} cm³).<br>Average titre = <strong>${avg.toFixed(2)} cm³</strong>`;
      showCalculations(avg);

      // Highlight concordant cells
      highlightConcordant(concordantPair);
    } else {
      dom.concordantMsg.className = 'concordant-msg info';
      dom.concordantMsg.textContent = 'No concordant results yet. Keep titrating for results within ' + CONCORDANT_THRESHOLD + ' cm³ of each other.';
    }
  }

  function highlightConcordant(pair) {
    // Remove existing highlights
    document.querySelectorAll('.data-table td.concordant').forEach(td => td.classList.remove('concordant'));

    state.results.forEach(r => {
      if (pair.includes(r.titre)) {
        const cells = [
          document.getElementById(`final-${r.run}`)?.parentElement,
          document.getElementById(`initial-${r.run}`)?.parentElement,
          document.getElementById(`titre-${r.run}`)?.parentElement,
        ];
        cells.forEach(c => { if (c) c.classList.add('concordant'); });
      }
    });
  }

  // ── Calculations ──
  function showCalculations(avgTitre) {
    const molesBase = (state.baseConc * avgTitre) / 1000;
    const molesAcid = molesBase; // 1:1 for NaOH + HCl
    const calcConc = (molesAcid / (PIPETTE_VOL / 1000));

    dom.calcWorkspace.innerHTML = `
      <span class="calc-label">Average titre (concordant)</span>
      <div class="calc-line">${avgTitre.toFixed(2)} cm³</div>

      <span class="calc-label">Moles of base (NaOH) added</span>
      <div class="calc-line">n = c × V = ${state.baseConc.toFixed(2)} × ${avgTitre.toFixed(2)}/1000</div>
      <div class="calc-line">= ${molesBase.toFixed(6)} mol</div>

      <span class="calc-label">Mole ratio NaOH : acid = 1 : 1</span>
      <div class="calc-line">Moles of acid = ${molesAcid.toFixed(6)} mol</div>

      <span class="calc-label">Concentration of FA2</span>
      <div class="calc-line">c = n / V = ${molesAcid.toFixed(6)} / ${(PIPETTE_VOL / 1000).toFixed(4)}</div>
      <div class="calc-result">Concentration of FA2 = ${calcConc.toFixed(4)} mol dm⁻³</div>
    `;
  }

  // ── Repeat / Next Titration ──
  function startNextTitration() {
    if (state.run >= 3) {
      dom.guideTitle.textContent = 'All titrations complete';
      dom.guideDesc.textContent = 'You have completed all four titrations. Check your data table and calculations.';
      dom.guideActions.innerHTML = '';
      return;
    }

    state.run++;
    state.pipetteFilled = false;
    state.flaskFilled = false;
    state.indicatorAdded = false;
    state.flaskPlaced = false;
    state.initialReading = null;
    state.endpointReached = false;
    state.endpointVol = (state.acidConc * PIPETTE_VOL) / state.baseConc;

    // Reset flask visual
    dom.flaskLiquid.style.height = '0';
    dom.flaskLiquid.style.backgroundColor = 'transparent';
    unplaceFlask();
    enableFlowButtons(false);

    // Jump back to rinse-pipette step (burette stays filled)
    state.step = 2; // rinse pipette
    renderStepsBar();
    updateGuide();
  }

  // ── Full Reset ──
  dom.btnReset.addEventListener('click', () => {
    stopFlow();

    // Reset state
    Object.assign(state, {
      step: 0,
      buretteRinsed: false,
      buretteFilled: false,
      buretteVolume: 0,
      pipetteRinsed: false,
      pipetteFilled: false,
      flaskFilled: false,
      indicatorType: null,
      indicatorAdded: false,
      flaskPlaced: false,
      initialReading: null,
      endpointReached: false,
      titrating: false,
      run: 0,
      results: [],
    });
    computeEndpoint();

    // Reset visuals
    dom.pipetteLiquid.style.height = '0';
    dom.pipetteBulgeLiquid.style.height = '0';
    dom.flaskLiquid.style.height = '0';
    dom.flaskLiquid.style.backgroundColor = 'transparent';
    dom.indicator.querySelector('.indicator-label').textContent = 'Indicator';
    unplaceFlask();
    enableFlowButtons(false);
    dom.buretteControls.style.display = 'none';
    dom.beakerLiquid.style.height = '75%';

    // Reset data table
    for (let i = 0; i < 4; i++) {
      ['final', 'initial', 'titre'].forEach(prefix => {
        const input = document.getElementById(`${prefix}-${i}`);
        if (input) { input.value = ''; input.parentElement?.classList.remove('concordant'); }
      });
    }
    dom.concordantMsg.style.display = 'none';
    dom.calcWorkspace.innerHTML = '<p class="text-sm text-muted">Complete at least two concordant titrations to begin calculations.</p>';

    updateVisuals();
    renderStepsBar();
    updateGuide();
    positionFlaskZone();
    dom.flaskZone.style.display = 'none';
  });

  // ── Guide Toggle ──
  dom.btnToggleGuide.addEventListener('click', () => {
    state.guideOpen = !state.guideOpen;
    dom.guidePanel.style.display = state.guideOpen ? '' : 'none';
  });

  // ── Apparatus Click Interaction ──
  // For non-guided free interaction, clicking apparatus triggers context actions
  dom.workbench.addEventListener('click', (e) => {
    const item = e.target.closest('[data-item]');
    if (!item) return;

    const type = item.dataset.item;

    // Quick interaction: clicking flask when it's at home and conditions met → place it
    if (type === 'flask' && !state.flaskPlaced && state.indicatorAdded) {
      placeFlask();
      if (state.step === 6) advanceStep();
      return;
    }

    // Clicking burette → show flask zone if flask not placed
    if (type === 'burette' && !state.flaskPlaced && state.indicatorAdded) {
      dom.flaskZone.style.display = '';
      positionFlaskZone();
    }
  });

  // Flask zone click
  dom.flaskZone.addEventListener('click', () => {
    if (state.indicatorAdded && !state.flaskPlaced) {
      placeFlask();
      if (state.step === 6) advanceStep();
    }
  });

  // ── Window Resize ──
  window.addEventListener('resize', () => {
    if (!state.flaskPlaced) positionFlaskZone();
  });
});
