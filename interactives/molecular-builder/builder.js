/* ======================================================
   Molecular Builder – SciSim Interactive  v2
   2D molecular editor with VSEPR geometry, wedge/dash bonds,
   click-and-drag bonding, and auto-layout
   ====================================================== */

(function () {
  "use strict";

  /* ===== Atom database ===== */
  const ATOMS = [
    { symbol: "H",  name: "Hydrogen",   valence: 1, mass: 1.008,  radius: 25, color: "#d0d0d0", text: "#333",  covalentR: 31  },
    { symbol: "C",  name: "Carbon",     valence: 4, mass: 12.011, radius: 30, color: "#333333", text: "#fff",  covalentR: 76  },
    { symbol: "N",  name: "Nitrogen",   valence: 3, mass: 14.007, radius: 28, color: "#3050d0", text: "#fff",  covalentR: 71  },
    { symbol: "O",  name: "Oxygen",     valence: 2, mass: 15.999, radius: 27, color: "#d03030", text: "#fff",  covalentR: 66  },
    { symbol: "F",  name: "Fluorine",   valence: 1, mass: 18.998, radius: 24, color: "#10b020", text: "#fff",  covalentR: 57  },
    { symbol: "S",  name: "Sulfur",     valence: 2, mass: 32.06,  radius: 30, color: "#c4a800", text: "#fff",  covalentR: 105 },
    { symbol: "Cl", name: "Chlorine",   valence: 1, mass: 35.45,  radius: 28, color: "#06d6a0", text: "#fff",  covalentR: 102 },
    { symbol: "Br", name: "Bromine",    valence: 1, mass: 79.904, radius: 29, color: "#a52a2a", text: "#fff",  covalentR: 120 },
    { symbol: "P",  name: "Phosphorus", valence: 3, mass: 30.974, radius: 28, color: "#ff8c00", text: "#fff",  covalentR: 107 },
  ];

  const BOND_LENGTH = 70;      // default px between atom centres
  const BOND_HIT_DIST = 10;    // click tolerance for bond selection

  /* ===== Interaction modes ===== */
  const MODE = { BOND: "bond", MOVE: "move", DELETE: "delete" };

  /* ===== State ===== */
  let atoms = [];           // { id, symbol, x, y, data, lonePairs }
  let bonds = [];           // { from, to, order, stereo:"none"|"wedge"|"dash" }
  let nextId = 1;
  let mode = MODE.BOND;
  let selectedElement = ATOMS[1];  // Carbon default
  let selectedBondOrder = 1;

  // Interaction transients
  let dragging = null;      // { atom, ox, oy, startX, startY, moved }
  let hoveredAtom = null;
  let hoveredBond = null;
  let linkPreview = null;   // { fromAtom, mx, my, snapAtom }
  let ghostDrag = null;     // palette→canvas drag

  /* ===== DOM ===== */
  const canvas = document.getElementById("mol-canvas");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("canvas-hint");
  const paletteEl = document.getElementById("palette-atoms");
  const infoFormula = document.getElementById("info-formula");
  const infoMass = document.getElementById("info-mass");
  const infoBonds = document.getElementById("info-bonds");
  const infoWarnings = document.getElementById("info-warnings");
  const infoAtoms = document.getElementById("info-atoms");
  const infoGeometry = document.getElementById("info-geometry");
  const presetEl = document.getElementById("preset-buttons");

  /* ===== Palette ===== */
  ATOMS.forEach(a => {
    const el = document.createElement("div");
    el.className = "palette-atom" + (a.symbol === selectedElement.symbol ? " selected" : "");
    el.style.setProperty("--atom-color", a.color);
    el.style.setProperty("--atom-bg", a.color + "18");
    el.innerHTML = `<span class="symbol">${a.symbol}</span><span class="valence">${a.valence}</span>`;
    el.title = `${a.name} (valence ${a.valence})`;

    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      // Select this element
      selectedElement = a;
      document.querySelectorAll(".palette-atom").forEach(p => p.classList.remove("selected"));
      el.classList.add("selected");

      // Start ghost drag to canvas
      ghostDrag = { data: a, x: e.clientX, y: e.clientY };
      document.addEventListener("pointermove", onGhostMove);
      document.addEventListener("pointerup", onGhostUp);
    });

    paletteEl.appendChild(el);
  });

  function onGhostMove(e) {
    if (!ghostDrag) return;
    ghostDrag.x = e.clientX;
    ghostDrag.y = e.clientY;
    draw();
  }

  function onGhostUp(e) {
    if (!ghostDrag) return;
    document.removeEventListener("pointermove", onGhostMove);
    document.removeEventListener("pointerup", onGhostUp);
    const pos = clientToCanvas(e.clientX, e.clientY);
    const rect = canvas.getBoundingClientRect();
    const inCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (inCanvas) {
      addAtom(ghostDrag.data, pos.x, pos.y);
      updateInfo();
    }
    ghostDrag = null;
    draw();
  }

  /* ===== Mode / tool buttons ===== */
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.querySelectorAll(".bond-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedBondOrder = parseInt(btn.dataset.bond);
      document.querySelectorAll(".bond-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.getElementById("btn-clear").addEventListener("click", () => {
    atoms = []; bonds = []; nextId = 1;
    updateInfo(); draw();
  });

  document.getElementById("btn-clean").addEventListener("click", () => {
    cleanGeometry();
    draw();
  });

  /* ===== Coordinate helpers ===== */
  function clientToCanvas(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (cx - rect.left) * (canvas.width / rect.width) / dpr,
      y: (cy - rect.top) * (canvas.height / rect.height) / dpr,
    };
  }

  function canvasCoords(e) {
    return clientToCanvas(e.clientX, e.clientY);
  }

  /* ===== Canvas sizing ===== */
  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = wrap.clientWidth * dpr;
    canvas.height = wrap.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ===== Atom / bond helpers ===== */
  function addAtom(data, x, y) {
    const a = { id: nextId++, symbol: data.symbol, x, y, data };
    atoms.push(a);
    return a;
  }

  function getAtomAt(x, y) {
    // Search in reverse so top-drawn atoms are hit first
    for (let i = atoms.length - 1; i >= 0; i--) {
      const a = atoms[i];
      const dx = a.x - x, dy = a.y - y;
      if (dx * dx + dy * dy < a.data.radius * a.data.radius) return a;
    }
    return null;
  }

  function getBondAt(x, y) {
    for (const b of bonds) {
      const a1 = atomById(b.from), a2 = atomById(b.to);
      if (!a1 || !a2) continue;
      if (ptSegDist(x, y, a1.x, a1.y, a2.x, a2.y) < BOND_HIT_DIST) return b;
    }
    return null;
  }

  function atomById(id) { return atoms.find(a => a.id === id); }

  function ptSegDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function findBond(id1, id2) {
    return bonds.find(b => (b.from === id1 && b.to === id2) || (b.from === id2 && b.to === id1));
  }

  function bondOrderSum(atomId) {
    let s = 0;
    for (const b of bonds) {
      if (b.from === atomId || b.to === atomId) s += b.order;
    }
    return s;
  }

  function neighbours(atomId) {
    const ns = [];
    for (const b of bonds) {
      if (b.from === atomId) ns.push({ atom: atomById(b.to), bond: b });
      else if (b.to === atomId) ns.push({ atom: atomById(b.from), bond: b });
    }
    return ns;
  }

  function freeValence(atom) {
    return atom.data.valence - bondOrderSum(atom.id);
  }

  /* ============================================================
     VSEPR Geometry Engine
     Computes ideal angles for atoms in 2D projection
     ============================================================ */

  // Given an atom and its existing neighbour angles, compute the next
  // ideal angle for placing a new substituent.
  function nextBondAngle(atom) {
    const nbrs = neighbours(atom.id);
    if (nbrs.length === 0) return -Math.PI / 6; // default: 30° above horizontal (like ChemDraw)

    // Collect angles of existing neighbours
    const angles = nbrs.map(n => Math.atan2(n.atom.y - atom.y, n.atom.x - atom.x));

    // Desired total steric number for this atom
    const lonePairs = computeLonePairs(atom);
    const stericN = nbrs.length + lonePairs + 1; // +1 for the new bond

    // VSEPR ideal separations
    const idealSep = idealAngleSeparation(stericN);

    // Find the largest gap among existing angles, place new bond in its middle
    if (angles.length === 1) {
      // One existing bond: place new one at idealSep from it
      return angles[0] + idealSep;
    }

    // Sort and find largest angular gap
    angles.sort((a, b) => a - b);
    let bestGap = -1, bestMid = 0;
    for (let i = 0; i < angles.length; i++) {
      const a1 = angles[i];
      const a2 = angles[(i + 1) % angles.length];
      let gap = a2 - a1;
      if (i === angles.length - 1) gap += Math.PI * 2;
      if (gap > bestGap) {
        bestGap = gap;
        bestMid = a1 + gap / 2;
      }
    }
    return bestMid;
  }

  function computeLonePairs(atom) {
    const used = bondOrderSum(atom.id);
    // Simple lone pair model: (valence electrons - bonding electrons) / 2
    const valElectrons = { H: 1, C: 4, N: 5, O: 6, F: 7, S: 6, Cl: 7, Br: 7, P: 5 };
    const ve = valElectrons[atom.symbol] || 4;
    return Math.max(0, Math.floor((ve - used) / 2));
  }

  function idealAngleSeparation(stericN) {
    // Returns ideal angle between substituents for given steric number
    switch (stericN) {
      case 1: return Math.PI;          // doesn't matter
      case 2: return Math.PI;          // linear 180°
      case 3: return 2 * Math.PI / 3;  // trigonal planar 120°
      case 4: return 109.5 * Math.PI / 180; // tetrahedral
      case 5: return 90 * Math.PI / 180;    // trig bipyramidal (approx)
      case 6: return 90 * Math.PI / 180;    // octahedral
      default: return 2 * Math.PI / stericN;
    }
  }

  // Molecular geometry label for display
  function geometryLabel(atom) {
    const nbrs = neighbours(atom.id);
    const lp = computeLonePairs(atom);
    const bn = nbrs.length;
    const sn = bn + lp;
    if (bn <= 1) return "";

    const labels = {
      "2-0": "Linear",
      "2-1": "Bent",
      "2-2": "Bent",
      "3-0": "Trigonal planar",
      "3-1": "Trigonal pyramidal",
      "4-0": "Tetrahedral",
      "4-1": "See-saw",
      "4-2": "Square planar",
      "1-0": "Terminal",
      "1-1": "Terminal",
      "1-2": "Terminal",
      "1-3": "Terminal",
    };
    return labels[bn + "-" + lp] || (sn + " steric");
  }

  /* ===== Auto-layout: Clean Geometry =====
     Recalculates positions using BFS from the heaviest atom,
     placing neighbours at correct VSEPR angles. */

  function cleanGeometry() {
    if (atoms.length === 0) return;

    // Find a good root: heaviest atom, or atom with most bonds
    const root = atoms.reduce((best, a) => {
      const score = neighbours(a.id).length * 100 + a.data.mass;
      return score > (best._score || 0) ? Object.assign(a, { _score: score }) : best;
    }, atoms[0]);

    const visited = new Set();
    const queue = [root.id];
    visited.add(root.id);

    // Centre root
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    root.x = cw / 2;
    root.y = ch / 2;

    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = atomById(currentId);
      const nbrs = neighbours(currentId);

      // Collect already-placed and unplaced neighbours
      const placed = [], unplaced = [];
      for (const n of nbrs) {
        if (visited.has(n.atom.id)) placed.push(n);
        else unplaced.push(n);
      }

      if (unplaced.length === 0) continue;

      const lp = computeLonePairs(current);
      const totalPositions = nbrs.length + lp;

      // Reference angle: if we have a placed parent, start opposite to it
      let refAngle;
      if (placed.length > 0) {
        const parent = placed[0].atom;
        refAngle = Math.atan2(current.y - parent.y, current.x - parent.x);
      } else {
        refAngle = -Math.PI / 6; // default angle
      }

      // Compute evenly-spaced slots
      const sep = 2 * Math.PI / Math.max(totalPositions, 2);
      const slots = [];
      for (let i = 0; i < totalPositions; i++) {
        slots.push(refAngle + sep * i);
      }

      // Remove slots occupied by already-placed neighbours
      const usedSlots = new Set();
      for (const p of placed) {
        const ang = Math.atan2(p.atom.y - current.y, p.atom.x - current.x);
        let bestIdx = 0, bestDiff = Infinity;
        for (let i = 0; i < slots.length; i++) {
          if (usedSlots.has(i)) continue;
          const diff = Math.abs(angleDiff(ang, slots[i]));
          if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
        }
        usedSlots.add(bestIdx);
      }

      // Also reserve slots for lone pairs (put them in remaining slots first)
      const freeSlots = [];
      for (let i = 0; i < slots.length; i++) {
        if (!usedSlots.has(i)) freeSlots.push(slots[i]);
      }

      // Assign lone pair slots first (take slots closest to "above")
      const lpSlots = [];
      const bondSlots = [];
      for (let i = 0; i < freeSlots.length; i++) {
        if (i < lp) lpSlots.push(freeSlots[i]);
        else bondSlots.push(freeSlots[i]);
      }

      // Place unplaced neighbours
      for (let i = 0; i < unplaced.length && i < bondSlots.length; i++) {
        const n = unplaced[i];
        const angle = bondSlots[i];
        const len = bondLength(current, n.atom);
        n.atom.x = current.x + Math.cos(angle) * len;
        n.atom.y = current.y + Math.sin(angle) * len;
        visited.add(n.atom.id);
        queue.push(n.atom.id);
      }
    }

    // Handle disconnected fragments
    for (const a of atoms) {
      if (!visited.has(a.id)) {
        visited.add(a.id);
      }
    }

    updateInfo();
  }

  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  function bondLength(a1, a2) {
    // Scale bond length based on covalent radii
    const sum = a1.data.covalentR + a2.data.covalentR;
    return Math.max(55, Math.min(90, sum * 0.55));
  }

  /* ============================================================
     Canvas Interaction
     Bond mode: click atom → drag to atom = bond
                click atom → drag to empty = new bonded atom
                click empty = place new atom
     Move mode: drag atom to reposition
     Delete mode: click atom/bond to remove
     ============================================================ */

  canvas.addEventListener("pointerdown", e => {
    const { x, y } = canvasCoords(e);
    const atom = getAtomAt(x, y);
    const bond = atom ? null : getBondAt(x, y);

    if (mode === MODE.DELETE) {
      if (atom) {
        atoms = atoms.filter(a => a.id !== atom.id);
        bonds = bonds.filter(b => b.from !== atom.id && b.to !== atom.id);
      } else if (bond) {
        bonds = bonds.filter(b => b !== bond);
      }
      updateInfo(); draw();
      return;
    }

    if (mode === MODE.MOVE) {
      if (atom) {
        dragging = { atom, ox: x - atom.x, oy: y - atom.y, startX: atom.x, startY: atom.y, moved: false };
        canvas.setPointerCapture(e.pointerId);
      }
      return;
    }

    // MODE.BOND
    if (atom) {
      // Start bond-draw from this atom
      linkPreview = { fromAtom: atom, mx: x, my: y, snapAtom: null };
      canvas.setPointerCapture(e.pointerId);
    } else if (bond) {
      // Click on existing bond: cycle order or stereo
      if (e.shiftKey) {
        // Cycle stereo: none → wedge → dash → none
        const stereos = ["none", "wedge", "dash"];
        const idx = stereos.indexOf(bond.stereo || "none");
        bond.stereo = stereos[(idx + 1) % stereos.length];
      } else {
        bond.order = bond.order >= 3 ? 1 : bond.order + 1;
      }
      updateInfo(); draw();
    } else {
      // Click on empty canvas: place new atom
      addAtom(selectedElement, x, y);
      updateInfo(); draw();
    }
  });

  canvas.addEventListener("pointermove", e => {
    const { x, y } = canvasCoords(e);

    if (dragging) {
      dragging.atom.x = x - dragging.ox;
      dragging.atom.y = y - dragging.oy;
      dragging.moved = true;
      draw();
      return;
    }

    if (linkPreview) {
      linkPreview.mx = x;
      linkPreview.my = y;
      // Snap to nearby atom
      linkPreview.snapAtom = null;
      for (const a of atoms) {
        if (a.id === linkPreview.fromAtom.id) continue;
        const dx = a.x - x, dy = a.y - y;
        if (dx * dx + dy * dy < a.data.radius * a.data.radius * 1.5) {
          linkPreview.snapAtom = a;
          break;
        }
      }
      draw();
      return;
    }

    // Hover
    const prev = hoveredAtom;
    const prevB = hoveredBond;
    hoveredAtom = getAtomAt(x, y);
    hoveredBond = hoveredAtom ? null : getBondAt(x, y);
    if (hoveredAtom !== prev || hoveredBond !== prevB) draw();

    canvas.style.cursor =
      mode === MODE.DELETE ? "crosshair" :
      mode === MODE.MOVE ? (hoveredAtom ? "grab" : "default") :
      (hoveredAtom ? "pointer" : (hoveredBond ? "pointer" : "crosshair"));
  });

  canvas.addEventListener("pointerup", e => {
    const { x, y } = canvasCoords(e);

    if (dragging) {
      dragging = null;
      draw();
      return;
    }

    if (linkPreview) {
      const from = linkPreview.fromAtom;
      if (linkPreview.snapAtom) {
        // Bond to existing atom
        const to = linkPreview.snapAtom;
        const existing = findBond(from.id, to.id);
        if (existing) {
          existing.order = existing.order >= 3 ? 1 : existing.order + 1;
        } else {
          bonds.push({ from: from.id, to: to.id, order: selectedBondOrder, stereo: "none" });
        }
      } else {
        // Dragged into empty space: check if actually moved enough
        const dist = Math.hypot(x - from.x, y - from.y);
        if (dist > 20) {
          // Place new atom at the drag endpoint, bonded to source
          // Snap to ideal angle if close
          let angle = Math.atan2(y - from.y, x - from.x);
          angle = snapToIdealAngle(from, angle);
          const len = bondLength(from, { data: selectedElement });
          const nx = from.x + Math.cos(angle) * len;
          const ny = from.y + Math.sin(angle) * len;
          const newAtom = addAtom(selectedElement, nx, ny);
          bonds.push({ from: from.id, to: newAtom.id, order: selectedBondOrder, stereo: "none" });
        }
      }
      linkPreview = null;
      updateInfo(); draw();
      return;
    }
  });

  // Double-click: cycle bond order or add H
  canvas.addEventListener("dblclick", e => {
    const { x, y } = canvasCoords(e);
    const bond = getBondAt(x, y);
    if (bond) {
      bond.order = bond.order >= 3 ? 1 : bond.order + 1;
      updateInfo(); draw();
      return;
    }
    const atom = getAtomAt(x, y);
    if (atom) {
      // Fill remaining valence with hydrogens
      autoFillH(atom);
      updateInfo(); draw();
    }
  });

  /* ===== Angle snapping ===== */
  function snapToIdealAngle(atom, rawAngle) {
    const nbrs = neighbours(atom.id);
    if (nbrs.length === 0) {
      // Snap to 30° increments (like ChemDraw)
      const snap30 = Math.round(rawAngle / (Math.PI / 6)) * (Math.PI / 6);
      if (Math.abs(angleDiff(rawAngle, snap30)) < 0.15) return snap30;
      return rawAngle;
    }

    // Compute ideal placement angles
    const lp = computeLonePairs(atom);
    const totalPositions = nbrs.length + lp + 1;
    const existingAngles = nbrs.map(n => Math.atan2(n.atom.y - atom.y, n.atom.x - atom.x));

    // Try to snap to VSEPR ideal
    const idealAngle = nextBondAngle(atom);
    if (Math.abs(angleDiff(rawAngle, idealAngle)) < 0.4) return idealAngle;

    // Snap to 30° grid
    const snap30 = Math.round(rawAngle / (Math.PI / 6)) * (Math.PI / 6);
    if (Math.abs(angleDiff(rawAngle, snap30)) < 0.15) return snap30;

    return rawAngle;
  }

  /* ===== Auto-fill hydrogens ===== */
  function autoFillH(atom) {
    const free = freeValence(atom);
    if (free <= 0) return;
    for (let i = 0; i < free; i++) {
      const angle = nextBondAngle(atom);
      const len = bondLength(atom, { data: ATOMS[0] });
      const h = addAtom(ATOMS[0], atom.x + Math.cos(angle) * len, atom.y + Math.sin(angle) * len);
      bonds.push({ from: atom.id, to: h.id, order: 1, stereo: "none" });
    }
  }

  /* ============================================================
     Drawing
     ============================================================ */

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    drawGrid(w, h);

    // Bonds
    for (const b of bonds) {
      const a1 = atomById(b.from), a2 = atomById(b.to);
      if (!a1 || !a2) continue;
      drawBond(a1, a2, b.order, b.stereo || "none", b === hoveredBond);
    }

    // Link preview
    if (linkPreview) {
      const from = linkPreview.fromAtom;
      let tx = linkPreview.mx, ty = linkPreview.my;
      if (linkPreview.snapAtom) {
        tx = linkPreview.snapAtom.x;
        ty = linkPreview.snapAtom.y;
      }
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#4361ee";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();

      // Preview atom circle at endpoint (if not snapping)
      if (!linkPreview.snapAtom) {
        let angle = Math.atan2(ty - from.y, tx - from.x);
        angle = snapToIdealAngle(from, angle);
        const len = bondLength(from, { data: selectedElement });
        const px = from.x + Math.cos(angle) * len;
        const py = from.y + Math.sin(angle) * len;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(px, py, selectedElement.radius, 0, Math.PI * 2);
        ctx.fillStyle = selectedElement.color;
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = selectedElement.text;
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(selectedElement.symbol, px, py);
        ctx.restore();
      }
    }

    // Atoms
    for (const a of atoms) {
      drawAtom(a, a === hoveredAtom);
    }

    // Ghost drag
    if (ghostDrag) {
      const pos = clientToCanvas(ghostDrag.x, ghostDrag.y);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ghostDrag.data.radius, 0, Math.PI * 2);
      ctx.fillStyle = ghostDrag.data.color;
      ctx.fill();
      ctx.fillStyle = ghostDrag.data.text;
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ghostDrag.data.symbol, pos.x, pos.y);
      ctx.restore();
    }

    hint.style.display = atoms.length === 0 && !ghostDrag ? "block" : "none";
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = "rgba(150,150,150,0.06)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
  }

  function drawBond(a1, a2, order, stereo, highlighted) {
    const dx = a2.x - a1.x, dy = a2.y - a1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    // Unit vectors
    const ux = dx / len, uy = dy / len;   // along bond
    const nx = -uy, ny = ux;              // perpendicular

    // Shorten bonds so they don't overlap atom circles
    const r1 = a1.data.radius * 0.7;
    const r2 = a2.data.radius * 0.7;
    const x1 = a1.x + ux * r1, y1 = a1.y + uy * r1;
    const x2 = a2.x - ux * r2, y2 = a2.y - uy * r2;

    ctx.lineCap = "round";

    if (stereo === "wedge") {
      drawWedgeBond(x1, y1, x2, y2, nx, ny, highlighted);
      return;
    }
    if (stereo === "dash") {
      drawDashBond(x1, y1, x2, y2, nx, ny, highlighted);
      return;
    }

    // Normal bonds
    const color = highlighted ? "#4361ee" : "#555";
    const w = highlighted ? 3 : 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = w;

    const gap = 4;
    if (order === 1) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (order === 2) {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x1 + nx * gap * s, y1 + ny * gap * s);
        ctx.lineTo(x2 + nx * gap * s, y2 + ny * gap * s);
        ctx.stroke();
      }
    } else if (order === 3) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x1 + nx * gap * 1.5 * s, y1 + ny * gap * 1.5 * s);
        ctx.lineTo(x2 + nx * gap * 1.5 * s, y2 + ny * gap * 1.5 * s);
        ctx.stroke();
      }
    }
  }

  function drawWedgeBond(x1, y1, x2, y2, nx, ny, highlighted) {
    // Filled triangle: narrow at x1, wide at x2
    const halfW = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 + nx * halfW, y2 + ny * halfW);
    ctx.lineTo(x2 - nx * halfW, y2 - ny * halfW);
    ctx.closePath();
    ctx.fillStyle = highlighted ? "#4361ee" : "#555";
    ctx.fill();
  }

  function drawDashBond(x1, y1, x2, y2, nx, ny, highlighted) {
    // Dashed wedge: series of lines getting wider
    const steps = 8;
    const maxW = 6;
    ctx.strokeStyle = highlighted ? "#4361ee" : "#555";
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      const hw = maxW * t;
      ctx.beginPath();
      ctx.moveTo(cx + nx * hw, cy + ny * hw);
      ctx.lineTo(cx - nx * hw, cy - ny * hw);
      ctx.stroke();
    }
  }

  function drawAtom(atom, hovered) {
    const r = atom.data.radius;
    const bc = bondOrderSum(atom.id);
    const over = bc > atom.data.valence;

    // Shadow
    ctx.beginPath();
    ctx.arc(atom.x, atom.y + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fill();

    // Body gradient
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(atom.x - r * 0.25, atom.y - r * 0.25, r * 0.1, atom.x, atom.y, r);
    grad.addColorStop(0, lighten(atom.data.color, 55));
    grad.addColorStop(1, atom.data.color);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = over ? "#ef476f" : (hovered ? "#4361ee" : darken(atom.data.color, 20));
    ctx.lineWidth = over ? 3 : (hovered ? 3 : 1.5);
    ctx.stroke();

    // Over-valence warning ring
    if (over) {
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239,71,111,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Symbol
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 2;
    ctx.fillStyle = atom.data.text;
    ctx.font = `bold ${Math.round(r * 0.7)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(atom.symbol, atom.x, atom.y);
    ctx.restore();

    // Free valence indicator
    const free = atom.data.valence - bc;
    if (atoms.length > 1 || bonds.length > 0) {
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (over) {
        ctx.fillStyle = "#ef476f";
        ctx.fillText("!" + bc + "/" + atom.data.valence, atom.x, atom.y + r + 11);
      } else if (free === 0) {
        ctx.fillStyle = "#06d6a0";
        ctx.fillText("\u2713", atom.x, atom.y + r + 11);
      } else {
        ctx.fillStyle = "rgba(100,100,100,0.5)";
        ctx.fillText(free + " free", atom.x, atom.y + r + 11);
      }
    }
  }

  function lighten(hex, amt) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  function darken(hex, amt) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - amt);
    const g = Math.max(0, ((n >> 8) & 0xff) - amt);
    const b = Math.max(0, (n & 0xff) - amt);
    return `rgb(${r},${g},${b})`;
  }

  /* ===== Info panel ===== */
  function updateInfo() {
    if (atoms.length === 0) {
      infoFormula.textContent = "—";
      infoMass.textContent = "—";
      infoBonds.textContent = "—";
      infoWarnings.textContent = "None";
      infoWarnings.style.color = "";
      infoAtoms.textContent = "—";
      if (infoGeometry) infoGeometry.textContent = "—";
      return;
    }

    // Formula – Hill system
    const counts = {};
    atoms.forEach(a => counts[a.symbol] = (counts[a.symbol] || 0) + 1);
    const order = [];
    if (counts.C) { order.push("C"); if (counts.H) order.push("H"); }
    Object.keys(counts).sort().forEach(s => { if (!order.includes(s)) order.push(s); });
    infoFormula.textContent = order.map(s => s + (counts[s] > 1 ? subscript(counts[s]) : "")).join("");

    // Mass
    let mass = 0;
    atoms.forEach(a => mass += a.data.mass);
    infoMass.textContent = mass.toFixed(3) + " g/mol";

    // Bond summary
    let totalOrder = 0;
    bonds.forEach(b => totalOrder += b.order);
    const singles = bonds.filter(b => b.order === 1).length;
    const doubles = bonds.filter(b => b.order === 2).length;
    const triples = bonds.filter(b => b.order === 3).length;
    let bondStr = bonds.length + " bonds";
    const parts = [];
    if (singles) parts.push(singles + " single");
    if (doubles) parts.push(doubles + " double");
    if (triples) parts.push(triples + " triple");
    if (parts.length) bondStr += " (" + parts.join(", ") + ")";
    infoBonds.textContent = bondStr;

    // Warnings
    const warnings = [];
    atoms.forEach(a => {
      const bc = bondOrderSum(a.id);
      if (bc > a.data.valence) {
        warnings.push(a.symbol + "#" + a.id + ": " + bc + "/" + a.data.valence + " exceeded");
      }
    });
    infoWarnings.textContent = warnings.length ? warnings.join("; ") : "None";
    infoWarnings.style.color = warnings.length ? "var(--color-danger)" : "var(--color-success)";

    // Atom list with geometry
    const atomInfo = atoms.filter(a => neighbours(a.id).length >= 2).map(a => {
      const geo = geometryLabel(a);
      return geo ? a.symbol + "#" + a.id + ": " + geo : null;
    }).filter(Boolean);
    infoAtoms.textContent = atomInfo.length ? atomInfo.join(", ") : "All terminal/single-bond";

    // Geometry summary
    if (infoGeometry) {
      const centralAtoms = atoms.filter(a => neighbours(a.id).length >= 2);
      if (centralAtoms.length === 0) {
        infoGeometry.textContent = "—";
      } else {
        infoGeometry.textContent = centralAtoms.map(a => {
          const lp = computeLonePairs(a);
          const bn = neighbours(a.id).length;
          return a.symbol + ": " + geometryLabel(a) +
            " (" + bn + " bonds" + (lp ? ", " + lp + " lp" : "") + ")";
        }).join("\n");
      }
    }
  }

  function subscript(n) {
    const subs = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089";
    return String(n).split("").map(d => subs[parseInt(d)]).join("");
  }

  /* ===== Presets with correct geometry ===== */
  const PRESETS = [
    {
      name: "Water (H\u2082O)",
      build(cx, cy) {
        // O-H bond angle: 104.5°
        const o = addAtom(ATOMS[3], cx, cy);
        const halfAngle = 104.5 / 2 * Math.PI / 180;
        const len = bondLength(ATOMS[3], ATOMS[0]);
        const h1 = addAtom(ATOMS[0], cx - Math.sin(halfAngle) * len, cy + Math.cos(halfAngle) * len);
        const h2 = addAtom(ATOMS[0], cx + Math.sin(halfAngle) * len, cy + Math.cos(halfAngle) * len);
        bonds.push({ from: o.id, to: h1.id, order: 1, stereo: "none" });
        bonds.push({ from: o.id, to: h2.id, order: 1, stereo: "none" });
      }
    },
    {
      name: "Methane (CH\u2084)",
      build(cx, cy) {
        // Tetrahedral 2D projection: two in-plane, one wedge up, one dash back
        const c = addAtom(ATOMS[1], cx, cy);
        const len = bondLength(ATOMS[1], ATOMS[0]);
        // Two in-plane at ~109.5° separation
        const h1 = addAtom(ATOMS[0], cx - len * Math.sin(Math.PI / 6), cy + len * Math.cos(Math.PI / 6));
        const h2 = addAtom(ATOMS[0], cx + len * Math.sin(Math.PI / 6), cy + len * Math.cos(Math.PI / 6));
        // One going up (wedge)
        const h3 = addAtom(ATOMS[0], cx, cy - len);
        // One going back (dash) — slightly offset for visibility
        const h4 = addAtom(ATOMS[0], cx, cy + len * 0.4);
        bonds.push({ from: c.id, to: h1.id, order: 1, stereo: "none" });
        bonds.push({ from: c.id, to: h2.id, order: 1, stereo: "none" });
        bonds.push({ from: c.id, to: h3.id, order: 1, stereo: "wedge" });
        bonds.push({ from: c.id, to: h4.id, order: 1, stereo: "dash" });
      }
    },
    {
      name: "CO\u2082",
      build(cx, cy) {
        // Linear: 180°
        const c = addAtom(ATOMS[1], cx, cy);
        const len = bondLength(ATOMS[1], ATOMS[3]);
        const o1 = addAtom(ATOMS[3], cx - len, cy);
        const o2 = addAtom(ATOMS[3], cx + len, cy);
        bonds.push({ from: c.id, to: o1.id, order: 2, stereo: "none" });
        bonds.push({ from: c.id, to: o2.id, order: 2, stereo: "none" });
      }
    },
    {
      name: "Ethanol (C\u2082H\u2085OH)",
      build(cx, cy) {
        const len_cc = bondLength(ATOMS[1], ATOMS[1]);
        const len_co = bondLength(ATOMS[1], ATOMS[3]);
        const len_ch = bondLength(ATOMS[1], ATOMS[0]);
        const len_oh = bondLength(ATOMS[3], ATOMS[0]);

        // Backbone: C-C-O zigzag
        const c1 = addAtom(ATOMS[1], cx - len_cc * 0.5, cy);
        const c2 = addAtom(ATOMS[1], cx + len_cc * 0.5, cy);
        const o = addAtom(ATOMS[3], cx + len_cc * 0.5 + len_co * Math.cos(-Math.PI / 6), cy + len_co * Math.sin(-Math.PI / 6));

        bonds.push({ from: c1.id, to: c2.id, order: 1, stereo: "none" });
        bonds.push({ from: c2.id, to: o.id, order: 1, stereo: "none" });

        // H on O
        const oh = addAtom(ATOMS[0], o.x + len_oh * Math.cos(Math.PI / 4), o.y + len_oh * Math.sin(Math.PI / 4));
        bonds.push({ from: o.id, to: oh.id, order: 1, stereo: "none" });

        // 3 H on C1 (tetrahedral-ish)
        const angles1 = [Math.PI, -Math.PI / 2, Math.PI + Math.PI / 3];
        for (const ang of angles1) {
          const h = addAtom(ATOMS[0], c1.x + Math.cos(ang) * len_ch, c1.y + Math.sin(ang) * len_ch);
          bonds.push({ from: c1.id, to: h.id, order: 1, stereo: "none" });
        }

        // 2 H on C2
        const angles2 = [-Math.PI / 2, Math.PI / 2 + Math.PI / 6];
        for (const ang of angles2) {
          const h = addAtom(ATOMS[0], c2.x + Math.cos(ang) * len_ch, c2.y + Math.sin(ang) * len_ch);
          bonds.push({ from: c2.id, to: h.id, order: 1, stereo: "none" });
        }
      }
    },
    {
      name: "Nitrogen (N\u2082)",
      build(cx, cy) {
        const len = bondLength(ATOMS[2], ATOMS[2]);
        const n1 = addAtom(ATOMS[2], cx - len / 2, cy);
        const n2 = addAtom(ATOMS[2], cx + len / 2, cy);
        bonds.push({ from: n1.id, to: n2.id, order: 3, stereo: "none" });
      }
    },
    {
      name: "Ammonia (NH\u2083)",
      build(cx, cy) {
        // Trigonal pyramidal: 107° angles (2D projection)
        const n = addAtom(ATOMS[2], cx, cy);
        const len = bondLength(ATOMS[2], ATOMS[0]);
        const sep = 107 * Math.PI / 180;
        const start = Math.PI / 2 + sep / 2; // splay downward
        for (let i = 0; i < 3; i++) {
          const angle = start + (i - 1) * sep;
          const h = addAtom(ATOMS[0], cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
          bonds.push({ from: n.id, to: h.id, order: 1, stereo: "none" });
        }
      }
    },
    {
      name: "Benzene (C\u2086H\u2086)",
      build(cx, cy) {
        const ringR = 65;
        const cs = [];
        for (let i = 0; i < 6; i++) {
          const angle = -Math.PI / 2 + i * Math.PI / 3;
          cs.push(addAtom(ATOMS[1], cx + Math.cos(angle) * ringR, cy + Math.sin(angle) * ringR));
        }
        for (let i = 0; i < 6; i++) {
          const order = (i % 2 === 0) ? 2 : 1; // alternating
          bonds.push({ from: cs[i].id, to: cs[(i + 1) % 6].id, order, stereo: "none" });
        }
        // Hydrogens
        const len_ch = bondLength(ATOMS[1], ATOMS[0]);
        for (let i = 0; i < 6; i++) {
          const angle = -Math.PI / 2 + i * Math.PI / 3;
          const h = addAtom(ATOMS[0], cx + Math.cos(angle) * (ringR + len_ch), cy + Math.sin(angle) * (ringR + len_ch));
          bonds.push({ from: cs[i].id, to: h.id, order: 1, stereo: "none" });
        }
      }
    },
    {
      name: "Ethene (C\u2082H\u2084)",
      build(cx, cy) {
        const len_cc = bondLength(ATOMS[1], ATOMS[1]);
        const len_ch = bondLength(ATOMS[1], ATOMS[0]);
        // Trigonal planar: 120° around each C
        const c1 = addAtom(ATOMS[1], cx - len_cc / 2, cy);
        const c2 = addAtom(ATOMS[1], cx + len_cc / 2, cy);
        bonds.push({ from: c1.id, to: c2.id, order: 2, stereo: "none" });

        // H on C1 at ±120° from the C-C bond direction (pointing left)
        const h1a = addAtom(ATOMS[0], c1.x + Math.cos(Math.PI - Math.PI / 3) * len_ch, c1.y + Math.sin(Math.PI - Math.PI / 3) * len_ch);
        const h1b = addAtom(ATOMS[0], c1.x + Math.cos(Math.PI + Math.PI / 3) * len_ch, c1.y + Math.sin(Math.PI + Math.PI / 3) * len_ch);
        bonds.push({ from: c1.id, to: h1a.id, order: 1, stereo: "none" });
        bonds.push({ from: c1.id, to: h1b.id, order: 1, stereo: "none" });

        // H on C2 at ±120° from C-C bond direction (pointing right)
        const h2a = addAtom(ATOMS[0], c2.x + Math.cos(-Math.PI / 3) * len_ch, c2.y + Math.sin(-Math.PI / 3) * len_ch);
        const h2b = addAtom(ATOMS[0], c2.x + Math.cos(Math.PI / 3) * len_ch, c2.y + Math.sin(Math.PI / 3) * len_ch);
        bonds.push({ from: c2.id, to: h2a.id, order: 1, stereo: "none" });
        bonds.push({ from: c2.id, to: h2b.id, order: 1, stereo: "none" });
      }
    },
  ];

  PRESETS.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      atoms = []; bonds = []; nextId = 1;
      const dpr = window.devicePixelRatio || 1;
      const cx = (canvas.width / dpr) / 2;
      const cy = (canvas.height / dpr) / 2;
      p.build(cx, cy);
      updateInfo(); draw();
    });
    presetEl.appendChild(btn);
  });

  /* ===== Keyboard shortcuts ===== */
  document.addEventListener("keydown", e => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (hoveredAtom) {
        atoms = atoms.filter(a => a.id !== hoveredAtom.id);
        bonds = bonds.filter(b => b.from !== hoveredAtom.id && b.to !== hoveredAtom.id);
        hoveredAtom = null;
        updateInfo(); draw();
      } else if (hoveredBond) {
        bonds = bonds.filter(b => b !== hoveredBond);
        hoveredBond = null;
        updateInfo(); draw();
      }
      return;
    }

    if (e.key === "1") { selectedBondOrder = 1; syncBondButtons(); }
    if (e.key === "2") { selectedBondOrder = 2; syncBondButtons(); }
    if (e.key === "3") { selectedBondOrder = 3; syncBondButtons(); }

    if (e.key === "b" || e.key === "B") setMode(MODE.BOND);
    if (e.key === "v" || e.key === "V") setMode(MODE.MOVE);
    if (e.key === "x" || e.key === "X") setMode(MODE.DELETE);

    if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.metaKey) {
      // Fill all atoms with H
      atoms.filter(a => freeValence(a) > 0).forEach(a => autoFillH(a));
      updateInfo(); draw();
    }

    if (e.key === "l" || e.key === "L") {
      cleanGeometry(); draw();
    }
  });

  function setMode(m) {
    mode = m;
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === m));
  }

  function syncBondButtons() {
    document.querySelectorAll(".bond-btn").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.bond) === selectedBondOrder);
    });
  }

  /* ===== Init ===== */
  draw();
})();
