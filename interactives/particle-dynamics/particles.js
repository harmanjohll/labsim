/* ======================================================
   Particle Dynamics – SciSim Interactive
   2D particle simulation with Lennard-Jones potential,
   real substance data, and authentic phase transitions
   ====================================================== */

(function () {
  "use strict";

  /* ---------- Substance Database ---------- */
  const SUBSTANCES = [
    { name: "Neon",    formula: "Ne",      mass: 20,  epsilon: 0.3, sigma: 8,  melt: 25,   boil: 27,   color: "#ff6b6b" },
    { name: "Argon",   formula: "Ar",      mass: 40,  epsilon: 1.0, sigma: 9,  melt: 84,   boil: 87,   color: "#64b5f6" },
    { name: "Water",   formula: "H\u2082O", mass: 18,  epsilon: 2.8, sigma: 8,  melt: 273,  boil: 373,  color: "#42a5f5" },
    { name: "Ethanol", formula: "C\u2082H\u2085OH", mass: 46, epsilon: 2.2, sigma: 11, melt: 159, boil: 352, color: "#81c784" },
    { name: "Iron",    formula: "Fe",      mass: 56,  epsilon: 8.0, sigma: 7,  melt: 1811, boil: 3134, color: "#b0bec5" },
    { name: "Mercury", formula: "Hg",      mass: 201, epsilon: 3.5, sigma: 9,  melt: 234,  boil: 630,  color: "#cfd8dc" },
    { name: "Nitrogen",formula: "N\u2082",  mass: 28,  epsilon: 0.8, sigma: 10, melt: 63,   boil: 77,   color: "#ce93d8" },
    { name: "Oxygen",  formula: "O\u2082",  mass: 32,  epsilon: 0.9, sigma: 10, melt: 54,   boil: 90,   color: "#ef5350" },
  ];

  /* ---------- Constants ---------- */
  const WALL_COLOUR = "rgba(100,140,255,0.4)";
  const GRAVITY_STRENGTH = 0.08;
  const DT = 0.4;                       // integration timestep
  const SPATIAL_CELL_FACTOR = 3;         // cellSize = SPATIAL_CELL_FACTOR * sigma

  /* ---------- State ---------- */
  let particles = [];
  let running = true;
  let temperature = 300;
  let targetCount = 80;
  let containerPct = 100;
  let substanceIdx = 2;                  // default: Water
  let gravityOn = false;
  let colourMode = "speed";
  let wallHits = 0;
  let lastPressureTime = 0;
  let pressure = 0;
  let animFrameId;

  function substance() { return SUBSTANCES[substanceIdx]; }
  function currentPhase() {
    const s = substance();
    if (temperature < s.melt) return "solid";
    if (temperature < s.boil) return "liquid";
    return "gas";
  }

  /* ---------- DOM ---------- */
  const canvas = document.getElementById("sim-canvas");
  const ctx = canvas.getContext("2d");
  const distCanvas = document.getElementById("dist-canvas");
  const distCtx = distCanvas.getContext("2d");

  const sliderTemp  = document.getElementById("slider-temp");
  const sliderCount = document.getElementById("slider-count");
  const sliderSize  = document.getElementById("slider-size");
  const tempValue   = document.getElementById("temp-value");
  const countValue  = document.getElementById("count-value");
  const sizeValue   = document.getElementById("size-value");
  const readPressure = document.getElementById("read-pressure");
  const readSpeed    = document.getElementById("read-speed");
  const readKE       = document.getElementById("read-ke");
  const readPhase    = document.getElementById("read-phase");
  const btnPlay  = document.getElementById("btn-play");
  const btnReset = document.getElementById("btn-reset");

  /* --- Substance radio group (already in HTML with name="substance") --- */

  /* ---------- Temperature slider range ---------- */
  function updateTempSlider() {
    const s = substance();
    const lo = Math.max(10, Math.floor(s.melt * 0.3));
    const hi = Math.ceil(s.boil * 1.3);
    sliderTemp.min = lo;
    sliderTemp.max = hi;
    // Update the labels beneath the slider
    const labels = sliderTemp.parentElement.querySelector(".slider-labels");
    if (labels) {
      labels.innerHTML = "<span>" + lo + " K</span><span>" + hi + " K</span>";
    }
    // Clamp temperature
    if (temperature < lo) temperature = lo;
    if (temperature > hi) temperature = hi;
    sliderTemp.value = temperature;
    tempValue.textContent = temperature;
  }

  /* ---------- Container geometry ---------- */
  function getContainer() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cw = w * containerPct / 100;
    const ch = h * containerPct / 100;
    return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
  }

  /* ---------- Speed helpers ---------- */
  function speedFromTemp() {
    return Math.sqrt(temperature / substance().mass) * 2.5;
  }

  /* ---------- Spatial Hash ---------- */
  let hashCellSize = 30;
  let hashCols = 1;
  let hashRows = 1;
  let hashMap = new Map();

  function buildSpatialHash(c) {
    const s = substance();
    hashCellSize = s.sigma * SPATIAL_CELL_FACTOR;
    hashCols = Math.ceil(c.w / hashCellSize) + 1;
    hashRows = Math.ceil(c.h / hashCellSize) + 1;
    hashMap.clear();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const col = Math.floor((p.x - c.x) / hashCellSize);
      const row = Math.floor((p.y - c.y) / hashCellSize);
      const key = row * hashCols + col;
      let bucket = hashMap.get(key);
      if (!bucket) { bucket = []; hashMap.set(key, bucket); }
      bucket.push(i);
    }
  }

  function getNeighbourIndices(pi, c) {
    const p = particles[pi];
    const col = Math.floor((p.x - c.x) / hashCellSize);
    const row = Math.floor((p.y - c.y) / hashCellSize);
    const result = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const key = (row + dr) * hashCols + (col + dc);
        const bucket = hashMap.get(key);
        if (bucket) {
          for (let k = 0; k < bucket.length; k++) {
            const j = bucket[k];
            if (j > pi) result.push(j);
          }
        }
      }
    }
    return result;
  }

  /* ---------- Particle creation ---------- */
  function createParticle(c) {
    if (!c) c = getContainer();
    const s = substance();
    const r = s.sigma * 0.5;
    const speed = speedFromTemp();
    const angle = Math.random() * Math.PI * 2;
    const factor = 0.3 + Math.random() * 1.4;
    return {
      x: c.x + r + Math.random() * (c.w - 2 * r),
      y: c.y + r + Math.random() * (c.h - 2 * r),
      vx: Math.cos(angle) * speed * factor,
      vy: Math.sin(angle) * speed * factor,
      ax: 0, ay: 0,
    };
  }

  function createLatticeParticles(c) {
    const s = substance();
    const spacing = s.sigma * 1.05;
    const r = s.sigma * 0.5;
    const positions = [];

    // hexagonal lattice centered in container
    const cols = Math.floor((c.w - 2 * r) / spacing);
    const rowH = spacing * Math.sqrt(3) / 2;
    const rows = Math.floor((c.h - 2 * r) / rowH);

    // Calculate total positions available
    const totalSlots = cols * rows;
    const needed = Math.min(targetCount, totalSlots);

    // Center the lattice
    const latticeW = (cols - 1) * spacing;
    const latticeH = (rows - 1) * rowH;
    const offX = c.x + (c.w - latticeW) / 2;
    const offY = c.y + (c.h - latticeH) / 2;

    for (let row = 0; row < rows && positions.length < needed; row++) {
      const shift = (row % 2 === 1) ? spacing * 0.5 : 0;
      for (let col = 0; col < cols && positions.length < needed; col++) {
        positions.push({
          x: offX + col * spacing + shift,
          y: offY + row * rowH,
        });
      }
    }

    // Assign small random velocities (vibration)
    const vibAmp = speedFromTemp() * 0.15;
    const result = [];
    for (let i = 0; i < positions.length; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = vibAmp * (0.5 + Math.random() * 0.5);
      result.push({
        x: positions[i].x,
        y: positions[i].y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        ax: 0, ay: 0,
        eqX: positions[i].x,
        eqY: positions[i].y,
      });
    }
    return result;
  }

  function initParticles() {
    const c = getContainer();
    const phase = currentPhase();

    if (phase === "solid") {
      particles = createLatticeParticles(c);
    } else {
      particles = [];
      for (let i = 0; i < targetCount; i++) {
        particles.push(createParticle(c));
      }
    }
    wallHits = 0;
    pressure = 0;
    lastPressureTime = performance.now();
  }

  /* ---------- Physics step ---------- */
  function step() {
    const c = getContainer();
    const s = substance();
    const phase = currentPhase();
    const eps = s.epsilon;
    const sig = s.sigma;
    const cutoff = sig * 3;
    const cutoff2 = cutoff * cutoff;
    const particleR = sig * 0.4;
    const targetSpeed = speedFromTemp();

    // Thermostat coupling depends on phase
    const coupling = phase === "gas" ? 0.04 : phase === "liquid" ? 0.015 : 0.008;

    // Reset accelerations
    for (let i = 0; i < particles.length; i++) {
      particles[i].ax = 0;
      particles[i].ay = 0;
    }

    // Build spatial hash
    buildSpatialHash(c);

    // Lennard-Jones forces via spatial hash
    for (let i = 0; i < particles.length; i++) {
      const pi = particles[i];
      const neighbours = getNeighbourIndices(i, c);
      for (let k = 0; k < neighbours.length; k++) {
        const j = neighbours[k];
        const pj = particles[j];
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < cutoff2 && r2 > 0.01) {
          const r = Math.sqrt(r2);
          const sr = sig / r;
          const sr6 = sr * sr * sr * sr * sr * sr;
          const sr12 = sr6 * sr6;
          // F = 24 * eps * (2*sr^13 - sr^7) / r  =>  F/r for unit vector
          const fOverR = 24 * eps * (2 * sr12 - sr6) / r2;
          const fx = fOverR * dx;
          const fy = fOverR * dy;
          pi.ax += fx / s.mass;
          pi.ay += fy / s.mass;
          pj.ax -= fx / s.mass;
          pj.ay -= fy / s.mass;
        }
      }
    }

    // Solid lattice anchor force: harmonic spring to equilibrium position
    if (phase === "solid") {
      const kSpring = 0.005 * eps;
      for (const p of particles) {
        if (p.eqX !== undefined) {
          p.ax += kSpring * (p.eqX - p.x) / s.mass;
          p.ay += kSpring * (p.eqY - p.y) / s.mass;
        }
      }
    }

    // Integrate (Velocity Verlet style, simplified)
    for (const p of particles) {
      // Gravity
      if (gravityOn) {
        p.ay += GRAVITY_STRENGTH;
      }

      // Update velocity
      p.vx += p.ax * DT;
      p.vy += p.ay * DT;

      // Thermostat: Berendsen
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 0.01) {
        const ratio = targetSpeed / speed;
        const scale = 1 + (ratio - 1) * coupling;
        p.vx *= scale;
        p.vy *= scale;
      }

      // Limit max speed in solid to prevent lattice breakup
      if (phase === "solid") {
        const maxSolidSpeed = targetSpeed * 3;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSolidSpeed) {
          p.vx *= maxSolidSpeed / sp;
          p.vy *= maxSolidSpeed / sp;
        }
      }

      // Update position
      p.x += p.vx * DT;
      p.y += p.vy * DT;

      // Wall collisions
      if (p.x - particleR < c.x) {
        p.x = c.x + particleR;
        p.vx = Math.abs(p.vx) * 0.8;
        wallHits++;
      }
      if (p.x + particleR > c.x + c.w) {
        p.x = c.x + c.w - particleR;
        p.vx = -Math.abs(p.vx) * 0.8;
        wallHits++;
      }
      if (p.y - particleR < c.y) {
        p.y = c.y + particleR;
        p.vy = Math.abs(p.vy) * 0.8;
        wallHits++;
      }
      if (p.y + particleR > c.y + c.h) {
        p.y = c.y + c.h - particleR;
        p.vy = -Math.abs(p.vy) * 0.8;
        wallHits++;
      }
    }

    // Pressure calculation
    const now = performance.now();
    if (now - lastPressureTime > 500) {
      const dt = (now - lastPressureTime) / 1000;
      const perimeter = 2 * (c.w + c.h);
      pressure = (wallHits / dt) * s.mass * 0.1 / Math.max(perimeter, 1);
      wallHits = 0;
      lastPressureTime = now;
    }
  }

  /* ---------- Drawing ---------- */
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const c = getContainer();
    const s = substance();
    const phase = currentPhase();
    const sig = s.sigma;
    const particleR = sig * 0.4;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);

    // Container
    ctx.strokeStyle = WALL_COLOUR;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = "rgba(30,40,80,0.3)";
    ctx.fillRect(c.x, c.y, c.w, c.h);

    // Bond lines
    if (phase === "solid" || phase === "liquid") {
      const bondDist = phase === "solid" ? sig * 1.5 : sig * 1.2;
      const bondDist2 = bondDist * bondDist;
      const alpha = phase === "solid" ? 0.3 : 0.1;
      ctx.strokeStyle = s.color.replace(")", "," + alpha + ")").replace("rgb", "rgba");
      if (ctx.strokeStyle === s.color) {
        // Fallback: hex color
        ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
      }
      ctx.lineWidth = phase === "solid" ? 1.0 : 0.5;

      // Use spatial hash for efficient neighbour lookup
      buildSpatialHash(c);
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        const col = Math.floor((pi.x - c.x) / hashCellSize);
        const row = Math.floor((pi.y - c.y) / hashCellSize);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const key = (row + dr) * hashCols + (col + dc);
            const bucket = hashMap.get(key);
            if (!bucket) continue;
            for (let k = 0; k < bucket.length; k++) {
              const j = bucket[k];
              if (j <= i) continue;
              const pj = particles[j];
              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              if (dx * dx + dy * dy < bondDist2) {
                ctx.beginPath();
                ctx.moveTo(pi.x, pi.y);
                ctx.lineTo(pj.x, pj.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // Particles
    const maxSpeed = speedFromTemp() * 2.5;
    const glowExtra = phase === "gas" ? 4 : 2;
    const trailFactor = phase === "solid" ? 0.4 : phase === "liquid" ? 1.0 : 1.5;

    for (const p of particles) {
      const speed = Math.hypot(p.vx, p.vy);
      const colour = getParticleColour(speed, maxSpeed, s);

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleR + glowExtra, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(colour, 0.15);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleR, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();

      // Velocity trail
      if (speed > 0.1) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * trailFactor, p.y - p.vy * trailFactor);
        ctx.strokeStyle = hexToRgba(colour, 0.25);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    updateReadouts();
  }

  function hexToRgba(hex, alpha) {
    if (hex.startsWith("rgba")) {
      // Already rgba — replace alpha
      return hex.replace(/,\s*[\d.]+\)$/, "," + alpha + ")");
    }
    if (hex.startsWith("rgb(")) {
      return hex.replace("rgb(", "rgba(").replace(")", "," + alpha + ")");
    }
    // hex
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function getParticleColour(speed, maxSpeed, s) {
    if (colourMode === "uniform") return s.color;
    const t = Math.min(speed / Math.max(maxSpeed, 0.1), 1);
    if (colourMode === "energy") {
      const ke = t * t;
      if (ke < 0.25) return "rgba(59,130,246,1)";
      if (ke < 0.5)  return "rgba(6,214,160,1)";
      if (ke < 0.75) return "rgba(245,158,11,1)";
      return "rgba(239,71,111,1)";
    }
    // Speed mode
    if (t < 0.25) return "rgba(59,130,246,1)";
    if (t < 0.5)  return "rgba(6,214,160,1)";
    if (t < 0.75) return "rgba(245,158,11,1)";
    return "rgba(239,71,111,1)";
  }

  /* ---------- Readouts ---------- */
  function updateReadouts() {
    readPressure.textContent = pressure.toFixed(1) + " au";

    let totalSpeed = 0, totalKE = 0;
    const m = substance().mass;
    for (const p of particles) {
      const sp = Math.hypot(p.vx, p.vy);
      totalSpeed += sp;
      totalKE += 0.5 * m * sp * sp;
    }
    const n = particles.length || 1;
    readSpeed.textContent = (totalSpeed / n).toFixed(1) + " u/s";
    readKE.textContent = (totalKE / n).toFixed(1) + " au";

    const s = substance();
    const phase = currentPhase();
    if (phase === "solid") {
      readPhase.textContent = "Solid (below " + s.melt + " K)";
    } else if (phase === "liquid") {
      readPhase.textContent = "Liquid (" + s.melt + "–" + s.boil + " K)";
    } else {
      readPhase.textContent = "Gas (above " + s.boil + " K)";
    }
  }

  /* ---------- Speed distribution chart ---------- */
  function drawDistribution() {
    const dpr = window.devicePixelRatio || 1;
    const cw = distCanvas.width / dpr;
    const ch = distCanvas.height / dpr;
    distCtx.clearRect(0, 0, cw, ch);

    distCtx.fillStyle = getComputedStyle(document.body).getPropertyValue("--color-surface-alt") || "#f5f5f5";
    distCtx.fillRect(0, 0, cw, ch);

    if (particles.length === 0) return;

    const speeds = particles.map(p => Math.hypot(p.vx, p.vy));
    const maxSpeed = Math.max(...speeds, 1);
    const bins = 20;
    const binWidth = maxSpeed / bins;
    const hist = new Array(bins).fill(0);
    for (const sp of speeds) {
      const idx = Math.min(Math.floor(sp / binWidth), bins - 1);
      hist[idx]++;
    }
    const maxCount = Math.max(...hist, 1);

    const margin = { top: 10, right: 10, bottom: 25, left: 10 };
    const plotW = cw - margin.left - margin.right;
    const plotH = ch - margin.top - margin.bottom;
    const barW = plotW / bins;

    for (let i = 0; i < bins; i++) {
      const barH = (hist[i] / maxCount) * plotH;
      const x = margin.left + i * barW;
      const y = margin.top + plotH - barH;
      const t = i / bins;
      distCtx.fillStyle = t < 0.25 ? "rgba(59,130,246,0.6)"
        : t < 0.5 ? "rgba(6,214,160,0.6)"
        : t < 0.75 ? "rgba(245,158,11,0.6)"
        : "rgba(239,71,111,0.6)";
      distCtx.fillRect(x, y, barW - 1, barH);
    }

    // Theoretical MB curve
    const m = substance().mass;
    const kT = temperature * 0.01;
    distCtx.beginPath();
    distCtx.strokeStyle = "rgba(255,255,255,0.5)";
    distCtx.lineWidth = 1.5;
    distCtx.setLineDash([4, 3]);

    let mbMax = 0;
    const mbPoints = [];
    for (let i = 0; i <= 100; i++) {
      const v = (i / 100) * maxSpeed;
      const fv = (m / kT) * v * Math.exp(-m * v * v / (2 * kT));
      mbPoints.push(fv);
      if (fv > mbMax) mbMax = fv;
    }
    for (let i = 0; i <= 100; i++) {
      const x = margin.left + (i / 100) * plotW;
      const y = margin.top + plotH - (mbPoints[i] / Math.max(mbMax, 0.001)) * plotH * 0.9;
      if (i === 0) distCtx.moveTo(x, y); else distCtx.lineTo(x, y);
    }
    distCtx.stroke();
    distCtx.setLineDash([]);

    distCtx.fillStyle = "rgba(150,150,150,0.7)";
    distCtx.font = "9px Inter, sans-serif";
    distCtx.textAlign = "center";
    distCtx.fillText("Speed \u2192", cw / 2, ch - 3);
    distCtx.textAlign = "left";
    distCtx.fillText("Count", 2, margin.top + 8);
  }

  /* ---------- Controls ---------- */
  sliderTemp.addEventListener("input", () => {
    temperature = parseInt(sliderTemp.value);
    tempValue.textContent = temperature;
    // If phase changed, we may need to re-init for solid lattice
    handlePhaseChange();
  });
  sliderCount.addEventListener("input", () => {
    targetCount = parseInt(sliderCount.value);
    countValue.textContent = targetCount;
    adjustParticleCount();
  });
  sliderSize.addEventListener("input", () => {
    containerPct = parseInt(sliderSize.value);
    sizeValue.textContent = containerPct;
    clampParticlesToContainer();
  });

  let lastPhase = null;
  function handlePhaseChange() {
    const phase = currentPhase();
    if (lastPhase !== null && lastPhase !== phase) {
      // Transition into solid -> reinit as lattice
      if (phase === "solid") {
        initParticles();
      } else if (lastPhase === "solid") {
        // Leaving solid: clear equilibrium positions
        for (const p of particles) {
          delete p.eqX;
          delete p.eqY;
        }
      }
    }
    lastPhase = phase;
  }

  // Map substance radio values to indices
  const substanceNameMap = {};
  SUBSTANCES.forEach((s, i) => { substanceNameMap[s.name.toLowerCase()] = i; });

  document.querySelectorAll('input[name="substance"]').forEach(r => {
    r.addEventListener("change", () => {
      substanceIdx = substanceNameMap[r.value] != null ? substanceNameMap[r.value] : 2;
      updateTempSlider();
      const s = substance();
      temperature = Math.round((s.melt + s.boil) / 2);
      updateTempSlider();
      lastPhase = null;
      initParticles();
    });
  });
  document.querySelectorAll('input[name="colour"]').forEach(r => {
    r.addEventListener("change", () => { colourMode = r.value; });
  });
  document.getElementById("toggle-gravity").addEventListener("change", function () {
    gravityOn = this.checked;
  });

  btnPlay.addEventListener("click", () => {
    running = !running;
    btnPlay.textContent = running ? "Pause" : "Play";
    if (running) loop();
  });
  btnReset.addEventListener("click", () => {
    const s = substance();
    temperature = Math.round((s.melt + s.boil) / 2);
    updateTempSlider();
    targetCount = 80; sliderCount.value = 80; countValue.textContent = 80;
    containerPct = 100; sliderSize.value = 100; sizeValue.textContent = 100;
    gravityOn = false;
    document.getElementById("toggle-gravity").checked = false;
    lastPhase = null;
    initParticles();
  });

  function adjustParticleCount() {
    const c = getContainer();
    if (currentPhase() === "solid") {
      initParticles();
      return;
    }
    while (particles.length < targetCount) {
      particles.push(createParticle(c));
    }
    while (particles.length > targetCount) {
      particles.pop();
    }
  }

  function clampParticlesToContainer() {
    const c = getContainer();
    const s = substance();
    const r = s.sigma * 0.4;
    for (const p of particles) {
      p.x = Math.max(c.x + r, Math.min(c.x + c.w - r, p.x));
      p.y = Math.max(c.y + r, Math.min(c.y + c.h - r, p.y));
    }
  }

  /* ---------- Canvas sizing ---------- */
  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = wrap.clientWidth * dpr;
    canvas.height = wrap.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const distWrap = distCanvas.parentElement;
    distCanvas.width = distWrap.clientWidth * dpr;
    distCanvas.height = 160 * dpr;
    distCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ---------- Animation loop ---------- */
  let distTimer = 0;
  function loop() {
    if (!running) return;
    step();
    draw();
    distTimer++;
    if (distTimer % 10 === 0) drawDistribution();
    animFrameId = requestAnimationFrame(loop);
  }

  /* ---------- Init ---------- */
  updateTempSlider();
  // Set initial temperature to middle of substance range
  temperature = Math.round((substance().melt + substance().boil) / 2);
  updateTempSlider();
  lastPhase = currentPhase();
  initParticles();
  loop();

})();
