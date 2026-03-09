/* ======================================================
   3D Molecular Viewer – SciSim Interactive
   Pure canvas 2D with perspective projection.
   Mouse drag to rotate, scroll to zoom, shift+drag to pan.
   ====================================================== */

(function () {
  "use strict";

  /* ---------- Element data (CPK colours, van der Waals radii in pm) ---------- */
  const ELEMENTS = {
    H:  { color: "#ffffff", vdw: 120, cov: 31,  mass: 1.008,  name: "Hydrogen"   },
    He: { color: "#d9ffff", vdw: 140, cov: 28,  mass: 4.003,  name: "Helium"     },
    C:  { color: "#909090", vdw: 170, cov: 76,  mass: 12.011, name: "Carbon"     },
    N:  { color: "#3050f8", vdw: 155, cov: 71,  mass: 14.007, name: "Nitrogen"   },
    O:  { color: "#ff0d0d", vdw: 152, cov: 66,  mass: 15.999, name: "Oxygen"     },
    F:  { color: "#90e050", vdw: 147, cov: 57,  mass: 18.998, name: "Fluorine"   },
    Na: { color: "#ab5cf2", vdw: 227, cov: 166, mass: 22.990, name: "Sodium"     },
    Cl: { color: "#1ff01f", vdw: 175, cov: 102, mass: 35.45,  name: "Chlorine"   },
    S:  { color: "#ffff30", vdw: 180, cov: 105, mass: 32.06,  name: "Sulfur"     },
    P:  { color: "#ff8000", vdw: 180, cov: 107, mass: 30.974, name: "Phosphorus" },
    Br: { color: "#a62929", vdw: 185, cov: 120, mass: 79.904, name: "Bromine"    },
    I:  { color: "#940094", vdw: 198, cov: 139, mass: 126.90, name: "Iodine"     },
    Fe: { color: "#e06633", vdw: 200, cov: 132, mass: 55.845, name: "Iron"       },
    Ca: { color: "#3dff00", vdw: 231, cov: 176, mass: 40.078, name: "Calcium"    },
    K:  { color: "#8f40d4", vdw: 275, cov: 203, mass: 39.098, name: "Potassium"  },
  };

  /* ---------- Preset molecules with 3D coordinates ---------- */
  // Coordinates are in Angstroms. Each atom: [element, x, y, z]
  // Each bond: [atomIndex1, atomIndex2, order]
  const PRESETS = [
    {
      name: "Water", formula: "H\u2082O",
      atoms: [
        ["O", 0, 0, 0],
        ["H", 0.757, 0.587, 0],
        ["H", -0.757, 0.587, 0],
      ],
      bonds: [[0,1,1],[0,2,1]],
    },
    {
      name: "Methane", formula: "CH\u2084",
      atoms: [
        ["C", 0, 0, 0],
        ["H", 0.629, 0.629, 0.629],
        ["H", -0.629, -0.629, 0.629],
        ["H", -0.629, 0.629, -0.629],
        ["H", 0.629, -0.629, -0.629],
      ],
      bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]],
    },
    {
      name: "Ammonia", formula: "NH\u2083",
      atoms: [
        ["N", 0, 0, 0.116],
        ["H", 0, 0.939, -0.271],
        ["H", 0.813, -0.470, -0.271],
        ["H", -0.813, -0.470, -0.271],
      ],
      bonds: [[0,1,1],[0,2,1],[0,3,1]],
    },
    {
      name: "Carbon Dioxide", formula: "CO\u2082",
      atoms: [
        ["C", 0, 0, 0],
        ["O", -1.16, 0, 0],
        ["O", 1.16, 0, 0],
      ],
      bonds: [[0,1,2],[0,2,2]],
    },
    {
      name: "Ethanol", formula: "C\u2082H\u2085OH",
      atoms: [
        ["C", -0.748, -0.015, 0.024],
        ["C", 0.748, 0.015, -0.024],
        ["O", 1.267, 0.015, 1.310],
        ["H", -1.146, -0.988, -0.270],
        ["H", -1.146, 0.730, -0.670],
        ["H", -1.095, 0.225, 1.020],
        ["H", 1.146, 0.988, -0.401],
        ["H", 1.095, -0.730, -0.670],
        ["H", 2.225, 0.040, 1.280],
      ],
      bonds: [[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[1,6,1],[1,7,1],[2,8,1]],
    },
    {
      name: "Benzene", formula: "C\u2086H\u2086",
      atoms: [
        ["C", 1.21, 0.70, 0], ["C", 1.21, -0.70, 0],
        ["C", 0, -1.40, 0],   ["C", -1.21, -0.70, 0],
        ["C", -1.21, 0.70, 0], ["C", 0, 1.40, 0],
        ["H", 2.15, 1.24, 0], ["H", 2.15, -1.24, 0],
        ["H", 0, -2.48, 0],   ["H", -2.15, -1.24, 0],
        ["H", -2.15, 1.24, 0], ["H", 0, 2.48, 0],
      ],
      bonds: [
        [0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],
        [0,6,1],[1,7,1],[2,8,1],[3,9,1],[4,10,1],[5,11,1],
      ],
    },
    {
      name: "Acetic Acid", formula: "CH\u2083COOH",
      atoms: [
        ["C", 0, 0, 0],
        ["C", 1.52, 0, 0],
        ["O", 2.08, 1.08, 0.30],
        ["O", 2.08, -1.08, -0.30],
        ["H", -0.36, 1.01, 0.18],
        ["H", -0.36, -0.52, 0.90],
        ["H", -0.36, -0.49, -0.92],
        ["H", 3.04, -1.08, -0.25],
      ],
      bonds: [[0,1,1],[1,2,2],[1,3,1],[0,4,1],[0,5,1],[0,6,1],[3,7,1]],
    },
    {
      name: "Hydrogen Peroxide", formula: "H\u2082O\u2082",
      atoms: [
        ["O", 0, 0, 0],
        ["O", 1.47, 0, 0],
        ["H", -0.39, 0.91, 0],
        ["H", 1.86, -0.36, 0.87],
      ],
      bonds: [[0,1,1],[0,2,1],[1,3,1]],
    },
    {
      name: "Hydrochloric Acid", formula: "HCl",
      atoms: [
        ["H", 0, 0, 0],
        ["Cl", 1.27, 0, 0],
      ],
      bonds: [[0,1,1]],
    },
    {
      name: "Formaldehyde", formula: "CH\u2082O",
      atoms: [
        ["C", 0, 0, 0],
        ["O", 0, 1.21, 0],
        ["H", 0.94, -0.54, 0],
        ["H", -0.94, -0.54, 0],
      ],
      bonds: [[0,1,2],[0,2,1],[0,3,1]],
    },
    {
      name: "Ethylene", formula: "C\u2082H\u2084",
      atoms: [
        ["C", -0.665, 0, 0],
        ["C", 0.665, 0, 0],
        ["H", -1.23, 0.93, 0],
        ["H", -1.23, -0.93, 0],
        ["H", 1.23, 0.93, 0],
        ["H", 1.23, -0.93, 0],
      ],
      bonds: [[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],
    },
    {
      name: "Acetylene", formula: "C\u2082H\u2082",
      atoms: [
        ["C", -0.60, 0, 0],
        ["C", 0.60, 0, 0],
        ["H", -1.66, 0, 0],
        ["H", 1.66, 0, 0],
      ],
      bonds: [[0,1,3],[0,2,1],[1,3,1]],
    },
    {
      name: "Phosphoric Acid", formula: "H\u2083PO\u2084",
      atoms: [
        ["P", 0, 0, 0],
        ["O", 1.46, 0, 0],
        ["O", -0.69, 1.28, 0],
        ["O", -0.69, -0.64, 1.11],
        ["O", -0.69, -0.64, -1.11],
        ["H", -0.69, 2.10, 0.50],
        ["H", -0.69, -0.10, 1.93],
        ["H", -0.69, -0.10, -1.93],
      ],
      bonds: [[0,1,2],[0,2,1],[0,3,1],[0,4,1],[2,5,1],[3,6,1],[4,7,1]],
    },
    {
      name: "Sodium Chloride", formula: "NaCl",
      atoms: [
        ["Na", 0, 0, 0],
        ["Cl", 2.36, 0, 0],
      ],
      bonds: [[0,1,1]],
    },
    {
      name: "Sulfuric Acid", formula: "H\u2082SO\u2084",
      atoms: [
        ["S", 0, 0, 0],
        ["O", 1.43, 0.40, 0],
        ["O", -1.43, 0.40, 0],
        ["O", 0, -0.80, 1.24],
        ["O", 0, -0.80, -1.24],
        ["H", 0.65, -0.80, 1.80],
        ["H", -0.65, -0.80, -1.80],
      ],
      bonds: [[0,1,2],[0,2,2],[0,3,1],[0,4,1],[3,5,1],[4,6,1]],
    },
  ];

  /* ---------- Render state ---------- */
  let currentMol = null;    // { name, formula, atoms:[{el,x,y,z}], bonds:[{a,b,order}] }
  let rotX = -0.3;
  let rotY = 0.5;
  let zoom = 150;           // pixels per Angstrom
  let panX = 0, panY = 0;
  let renderStyle = "ball-stick";
  let showLabels = true;
  let autoSpin = false;
  let bgColor = "dark";

  /* ---------- DOM ---------- */
  const canvas = document.getElementById("mol3d-canvas");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("viewer-hint");
  const infoName = document.getElementById("info-name");
  const infoFormula = document.getElementById("info-formula");
  const infoAtoms = document.getElementById("info-atoms");
  const infoBonds = document.getElementById("info-bonds");
  const presetList = document.getElementById("preset-list");

  /* ---------- Build preset buttons ---------- */
  PRESETS.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = p.name + " (" + p.formula + ")";
    btn.addEventListener("click", () => loadPreset(idx));
    presetList.appendChild(btn);
  });

  /* ---------- Load a preset ---------- */
  function loadPreset(idx) {
    const p = PRESETS[idx];
    currentMol = {
      name: p.name,
      formula: p.formula,
      atoms: p.atoms.map(a => ({ el: a[0], x: a[1], y: a[2], z: a[3] })),
      bonds: p.bonds.map(b => ({ a: b[0], b: b[1], order: b[2] })),
    };
    // Center the molecule
    centerMolecule();
    // Update UI
    hint.style.display = "none";
    updateInfo();
    // Highlight button
    presetList.querySelectorAll(".preset-btn").forEach((b, i) => {
      b.classList.toggle("active", i === idx);
    });
    // Reset view
    rotX = -0.3;
    rotY = 0.5;
    panX = 0;
    panY = 0;
    autoFitZoom();
  }

  function centerMolecule() {
    if (!currentMol) return;
    const atoms = currentMol.atoms;
    let cx = 0, cy = 0, cz = 0;
    for (const a of atoms) { cx += a.x; cy += a.y; cz += a.z; }
    const n = atoms.length;
    cx /= n; cy /= n; cz /= n;
    for (const a of atoms) { a.x -= cx; a.y -= cy; a.z -= cz; }
  }

  function autoFitZoom() {
    if (!currentMol) return;
    let maxR = 0;
    for (const a of currentMol.atoms) {
      const r = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      const vdw = (ELEMENTS[a.el] ? ELEMENTS[a.el].vdw : 150) / 100;
      if (r + vdw > maxR) maxR = r + vdw;
    }
    const dpr = window.devicePixelRatio || 1;
    const minDim = Math.min(canvas.width / dpr, canvas.height / dpr);
    zoom = (minDim * 0.35) / Math.max(maxR, 1);
  }

  function updateInfo() {
    if (!currentMol) return;
    infoName.textContent = currentMol.name;
    infoFormula.textContent = currentMol.formula;
    infoAtoms.textContent = currentMol.atoms.length;
    infoBonds.textContent = currentMol.bonds.length;
  }

  /* ---------- 3D math ---------- */
  function rotatePoint(x, y, z, rx, ry) {
    // Rotate around Y axis
    let x1 = x * Math.cos(ry) + z * Math.sin(ry);
    let z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    // Rotate around X axis
    let y1 = y * Math.cos(rx) - z1 * Math.sin(rx);
    let z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    return { x: x1, y: y1, z: z2 };
  }

  function project(x, y, z) {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const fov = 800;
    const scale = fov / (fov + z * zoom);
    return {
      sx: cw / 2 + panX + x * zoom * scale,
      sy: ch / 2 + panY + y * zoom * scale,
      scale: scale,
      z: z,
    };
  }

  /* ---------- Drawing ---------- */
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    // Background
    if (bgColor === "dark") {
      ctx.fillStyle = "#0a0a1a";
    } else {
      ctx.fillStyle = "#f0f0f0";
    }
    ctx.fillRect(0, 0, cw, ch);

    if (!currentMol) return;

    // Transform all atoms
    const transformed = currentMol.atoms.map(a => {
      const r = rotatePoint(a.x, a.y, a.z, rotX, rotY);
      const p = project(r.x, r.y, r.z);
      return { el: a.el, ...r, ...p };
    });

    // Depth sort: collect all drawable items and sort by z (back to front)
    const items = [];

    // Bonds
    for (const bond of currentMol.bonds) {
      const a = transformed[bond.a];
      const b = transformed[bond.b];
      const midZ = (a.z + b.z) / 2;
      items.push({ type: "bond", a, b, order: bond.order, z: midZ });
    }

    // Atoms
    for (let i = 0; i < transformed.length; i++) {
      const t = transformed[i];
      items.push({ type: "atom", atom: t, idx: i, z: t.z });
    }

    // Sort back to front (higher z = further from camera = draw first)
    items.sort((a, b) => b.z - a.z);

    // Draw
    for (const item of items) {
      if (item.type === "bond") {
        drawBond(item.a, item.b, item.order);
      } else {
        drawAtom(item.atom);
      }
    }
  }

  function getAtomRadius(el, scale) {
    const data = ELEMENTS[el] || { vdw: 150, cov: 75 };
    if (renderStyle === "space-fill") {
      return (data.vdw / 100) * zoom * scale * 0.45;
    } else if (renderStyle === "stick") {
      return 4 * scale;
    } else {
      // ball-stick
      return (data.cov / 100) * zoom * scale * 0.35;
    }
  }

  function drawAtom(t) {
    const data = ELEMENTS[t.el] || { color: "#888888", vdw: 150 };
    const r = getAtomRadius(t.el, t.scale);

    // Shadow / depth cue
    const shadowAlpha = 0.15 * t.scale;
    ctx.beginPath();
    ctx.arc(t.sx + 1, t.sy + 1, r + 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + shadowAlpha + ")";
    ctx.fill();

    // Main sphere (gradient for 3D look)
    const grad = ctx.createRadialGradient(
      t.sx - r * 0.3, t.sy - r * 0.3, r * 0.1,
      t.sx, t.sy, r
    );
    const baseColor = data.color;
    grad.addColorStop(0, lighten(baseColor, 60));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, darken(baseColor, 40));

    ctx.beginPath();
    ctx.arc(t.sx, t.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline
    ctx.strokeStyle = darken(baseColor, 30);
    ctx.lineWidth = 0.5 * t.scale;
    ctx.stroke();

    // Label
    if (showLabels && r > 6) {
      const fontSize = Math.max(8, Math.min(14, r * 0.9));
      ctx.font = "bold " + fontSize + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Contrast text
      const lum = getLuminance(baseColor);
      ctx.fillStyle = lum > 0.5 ? "#222" : "#fff";
      ctx.fillText(t.el, t.sx, t.sy + 0.5);
    }
  }

  function drawBond(a, b, order) {
    const bondWidth = renderStyle === "stick" ? 4 : 3;
    const w = bondWidth * Math.min(a.scale, b.scale);
    const bondColor = bgColor === "dark" ? "rgba(180,180,180," : "rgba(80,80,80,";
    const alpha = Math.min(a.scale, b.scale) * 0.9;

    if (order === 1) {
      drawSingleBond(a, b, w, bondColor + alpha + ")");
    } else if (order === 2) {
      drawMultiBond(a, b, w, bondColor + alpha + ")", 2);
    } else if (order === 3) {
      drawMultiBond(a, b, w, bondColor + alpha + ")", 3);
    }
  }

  function drawSingleBond(a, b, w, color) {
    // Half-bond coloring: each half in the color of its atom
    const mx = (a.sx + b.sx) / 2;
    const my = (a.sy + b.sy) / 2;
    const elA = ELEMENTS[a.el] || { color: "#888" };
    const elB = ELEMENTS[b.el] || { color: "#888" };

    ctx.lineWidth = w;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(mx, my);
    ctx.strokeStyle = darken(elA.color, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(b.sx, b.sy);
    ctx.strokeStyle = darken(elB.color, 20);
    ctx.stroke();
  }

  function drawMultiBond(a, b, w, color, count) {
    const dx = b.sx - a.sx;
    const dy = b.sy - a.sy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const spacing = w * 1.8;

    const offsets = [];
    if (count === 2) {
      offsets.push(-spacing / 2, spacing / 2);
    } else {
      offsets.push(-spacing, 0, spacing);
    }

    for (const off of offsets) {
      const ox = nx * off;
      const oy = ny * off;
      drawSingleBond(
        { sx: a.sx + ox, sy: a.sy + oy, el: a.el, scale: a.scale },
        { sx: b.sx + ox, sy: b.sy + oy, el: b.el, scale: b.scale },
        w * 0.7, color
      );
    }
  }

  /* ---------- Color utilities ---------- */
  function parseHex(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  function toHex(r, g, b) {
    const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return "#" + h(r) + h(g) + h(b);
  }
  function lighten(hex, amt) {
    const c = parseHex(hex);
    return toHex(c.r + amt, c.g + amt, c.b + amt);
  }
  function darken(hex, amt) {
    const c = parseHex(hex);
    return toHex(c.r - amt, c.g - amt, c.b - amt);
  }
  function getLuminance(hex) {
    const c = parseHex(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  /* ---------- Mouse interaction ---------- */
  let isDragging = false;
  let lastMX = 0, lastMY = 0;
  let isShift = false;

  canvas.addEventListener("mousedown", e => {
    isDragging = true;
    lastMX = e.clientX;
    lastMY = e.clientY;
    isShift = e.shiftKey;
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - lastMX;
    const dy = e.clientY - lastMY;
    lastMX = e.clientX;
    lastMY = e.clientY;

    if (isShift || e.shiftKey) {
      // Pan
      panX += dx;
      panY += dy;
    } else {
      // Rotate
      rotY += dx * 0.008;
      rotX += dy * 0.008;
    }
  });

  canvas.addEventListener("mouseup", () => { isDragging = false; });
  canvas.addEventListener("mouseleave", () => { isDragging = false; });

  // Touch support
  let lastTouchDist = 0;
  let lastTouchX = 0, lastTouchY = 0;
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      if (lastTouchDist > 0) {
        zoom *= dist / lastTouchDist;
        zoom = Math.max(20, Math.min(600, zoom));
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  canvas.addEventListener("touchend", e => {
    isDragging = false;
    lastTouchDist = 0;
  });

  // Scroll to zoom
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    zoom *= factor;
    zoom = Math.max(20, Math.min(600, zoom));
  }, { passive: false });

  /* ---------- Controls ---------- */
  document.querySelectorAll('input[name="style"]').forEach(r => {
    r.addEventListener("change", () => { renderStyle = r.value; });
  });
  document.getElementById("toggle-labels").addEventListener("change", function () {
    showLabels = this.checked;
  });
  document.getElementById("toggle-spin").addEventListener("change", function () {
    autoSpin = this.checked;
  });
  document.querySelectorAll('input[name="bg"]').forEach(r => {
    r.addEventListener("change", () => { bgColor = r.value; });
  });
  document.getElementById("btn-reset-view").addEventListener("click", () => {
    rotX = -0.3;
    rotY = 0.5;
    panX = 0;
    panY = 0;
    autoFitZoom();
  });

  /* ---------- Canvas sizing ---------- */
  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = wrap.clientWidth * dpr;
    canvas.height = wrap.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentMol) autoFitZoom();
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ---------- Animation loop ---------- */
  function loop() {
    if (autoSpin && !isDragging) {
      rotY += 0.006;
    }
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // Load first preset by default
  loadPreset(0);

})();
