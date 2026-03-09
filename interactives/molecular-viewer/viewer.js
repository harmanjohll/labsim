(function () {
  "use strict";

  /* =========================================================================
     ELEMENT DATABASE  (CPK colors, van der Waals radii pm, covalent radii pm)
     ========================================================================= */
  var ELEMENTS = {
    H:  { color: "#FFFFFF", vdw: 120, cov: 31,  name: "Hydrogen" },
    He: { color: "#D9FFFF", vdw: 140, cov: 28,  name: "Helium" },
    C:  { color: "#909090", vdw: 170, cov: 76,  name: "Carbon" },
    N:  { color: "#3050F8", vdw: 155, cov: 71,  name: "Nitrogen" },
    O:  { color: "#FF0D0D", vdw: 152, cov: 66,  name: "Oxygen" },
    F:  { color: "#90E050", vdw: 147, cov: 57,  name: "Fluorine" },
    Na: { color: "#AB5CF2", vdw: 227, cov: 166, name: "Sodium" },
    P:  { color: "#FF8000", vdw: 180, cov: 107, name: "Phosphorus" },
    S:  { color: "#FFFF30", vdw: 180, cov: 105, name: "Sulfur" },
    Cl: { color: "#1FF01F", vdw: 175, cov: 102, name: "Chlorine" },
    K:  { color: "#8F40D4", vdw: 275, cov: 203, name: "Potassium" },
    Ca: { color: "#3DFF00", vdw: 231, cov: 176, name: "Calcium" },
    Fe: { color: "#E06633", vdw: 204, cov: 132, name: "Iron" },
    Br: { color: "#A62929", vdw: 185, cov: 120, name: "Bromine" },
    I:  { color: "#940094", vdw: 198, cov: 139, name: "Iodine" }
  };

  /* =========================================================================
     COLOR UTILITIES
     ========================================================================= */
  function parseHex(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) { hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]; }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function toHex(r, g, b) {
    function ch(v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? "0" + s : s;
    }
    return "#" + ch(r) + ch(g) + ch(b);
  }

  function lighten(hex, amt) {
    var c = parseHex(hex);
    return toHex(c.r + (255 - c.r) * amt, c.g + (255 - c.g) * amt, c.b + (255 - c.b) * amt);
  }

  function darken(hex, amt) {
    var c = parseHex(hex);
    return toHex(c.r * (1 - amt), c.g * (1 - amt), c.b * (1 - amt));
  }

  function getLuminance(hex) {
    var c = parseHex(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  /* =========================================================================
     PRESET MOLECULES
     Coordinates in Angstroms, centered at origin. Real bond geometries.
     ========================================================================= */
  var PRESETS = [];

  function addPreset(name, formula, atoms, bonds) {
    PRESETS.push({ name: name, formula: formula, atoms: atoms, bonds: bonds });
  }

  function At(el, x, y, z) { return { el: el, x: x, y: y, z: z }; }
  function Bd(a, b, order) { return { a: a, b: b, order: order || 1 }; }

  /* ----- 1. Water (H2O) — bent, 104.5 deg, O-H = 0.9584 A ----- */
  addPreset("Water", "H\u2082O", [
    At("O",  0.0000,  0.0000,  0.0000),
    At("H",  0.7572,  0.5865,  0.0000),
    At("H", -0.7572,  0.5865,  0.0000)
  ], [Bd(0,1), Bd(0,2)]);

  /* ----- 2. Methane (CH4) — tetrahedral, C-H = 1.089 A ----- */
  addPreset("Methane", "CH\u2084", [
    At("C",  0.0000,  0.0000,  0.0000),
    At("H",  0.6276,  0.6276,  0.6276),
    At("H", -0.6276, -0.6276,  0.6276),
    At("H", -0.6276,  0.6276, -0.6276),
    At("H",  0.6276, -0.6276, -0.6276)
  ], [Bd(0,1), Bd(0,2), Bd(0,3), Bd(0,4)]);

  /* ----- 3. Ammonia (NH3) — trigonal pyramidal ----- */
  addPreset("Ammonia", "NH\u2083", [
    At("N",  0.0000,  0.0000,  0.1173),
    At("H",  0.0000,  0.9377, -0.2735),
    At("H",  0.8121, -0.4689, -0.2735),
    At("H", -0.8121, -0.4689, -0.2735)
  ], [Bd(0,1), Bd(0,2), Bd(0,3)]);

  /* ----- 4. Carbon Dioxide (CO2) — linear, C=O = 1.16 A ----- */
  addPreset("Carbon Dioxide", "CO\u2082", [
    At("C",  0.0000,  0.0000,  0.0000),
    At("O", -1.1600,  0.0000,  0.0000),
    At("O",  1.1600,  0.0000,  0.0000)
  ], [Bd(0,1,2), Bd(0,2,2)]);

  /* ----- 5. Hydrogen (H2) — H-H = 0.74 A ----- */
  addPreset("Hydrogen", "H\u2082", [
    At("H", -0.3700,  0.0000,  0.0000),
    At("H",  0.3700,  0.0000,  0.0000)
  ], [Bd(0,1)]);

  /* ----- 6. Oxygen (O2) — O=O = 1.208 A ----- */
  addPreset("Oxygen", "O\u2082", [
    At("O", -0.6040,  0.0000,  0.0000),
    At("O",  0.6040,  0.0000,  0.0000)
  ], [Bd(0,1,2)]);

  /* ----- 7. Nitrogen (N2) — N triple N = 1.098 A ----- */
  addPreset("Nitrogen", "N\u2082", [
    At("N", -0.5490,  0.0000,  0.0000),
    At("N",  0.5490,  0.0000,  0.0000)
  ], [Bd(0,1,3)]);

  /* ----- 8. Hydrogen Chloride (HCl) — H-Cl = 1.275 A ----- */
  addPreset("Hydrogen Chloride", "HCl", [
    At("H", -0.6375,  0.0000,  0.0000),
    At("Cl", 0.6375,  0.0000,  0.0000)
  ], [Bd(0,1)]);

  /* ----- 9. Ethanol (C2H5OH) — staggered, all H atoms ----- */
  addPreset("Ethanol", "C\u2082H\u2085OH", [
    At("C", -0.6610, -0.3160,  0.0000),   // 0  C1 (methyl)
    At("C",  0.6610,  0.3160,  0.0000),   // 1  C2
    At("O",  1.7000, -0.5600,  0.4070),   // 2  O
    At("H",  2.5600, -0.1200,  0.3700),   // 3  HO
    At("H", -0.5950, -0.9530,  0.8880),   // 4  H
    At("H", -0.5950, -0.9530, -0.8880),   // 5  H
    At("H", -1.5270,  0.3520,  0.0000),   // 6  H
    At("H",  0.6620,  0.9640,  0.8840),   // 7  H
    At("H",  0.6620,  0.9640, -0.8840)    // 8  H
  ], [Bd(0,1), Bd(1,2), Bd(2,3), Bd(0,4), Bd(0,5), Bd(0,6), Bd(1,7), Bd(1,8)]);

  /* ----- 10. Methanol (CH3OH) ----- */
  addPreset("Methanol", "CH\u2083OH", [
    At("C",  0.0000,  0.0000,  0.0000),   // 0
    At("O",  1.4270,  0.0000,  0.0000),   // 1
    At("H",  1.7700,  0.8920,  0.0000),   // 2  HO
    At("H", -0.3900,  1.0200,  0.0000),   // 3
    At("H", -0.3900, -0.5100,  0.8830),   // 4
    At("H", -0.3900, -0.5100, -0.8830)    // 5
  ], [Bd(0,1), Bd(1,2), Bd(0,3), Bd(0,4), Bd(0,5)]);

  /* ----- 11. Formaldehyde (CH2O) — planar ----- */
  addPreset("Formaldehyde", "CH\u2082O", [
    At("C",  0.0000,  0.0000,  0.0000),
    At("O",  0.0000,  1.2030,  0.0000),
    At("H",  0.9340, -0.5800,  0.0000),
    At("H", -0.9340, -0.5800,  0.0000)
  ], [Bd(0,1,2), Bd(0,2), Bd(0,3)]);

  /* ----- 12. Acetic Acid (CH3COOH) ----- */
  addPreset("Acetic Acid", "CH\u2083COOH", [
    At("C", -0.7620,  0.0000,  0.0000),   // 0  methyl C
    At("C",  0.7620,  0.0000,  0.0000),   // 1  carboxyl C
    At("O",  1.3400,  1.0700,  0.0000),   // 2  =O
    At("O",  1.3400, -1.0700,  0.0000),   // 3  -OH
    At("H",  2.3100, -1.0700,  0.0000),   // 4  HO
    At("H", -1.1500,  0.5100,  0.8900),   // 5
    At("H", -1.1500,  0.5100, -0.8900),   // 6
    At("H", -1.1500, -1.0200,  0.0000)    // 7
  ], [Bd(0,1), Bd(1,2,2), Bd(1,3), Bd(3,4), Bd(0,5), Bd(0,6), Bd(0,7)]);

  /* ----- 13. Ethylene (C2H4) — planar, double bond ----- */
  addPreset("Ethylene", "C\u2082H\u2084", [
    At("C", -0.6650,  0.0000,  0.0000),
    At("C",  0.6650,  0.0000,  0.0000),
    At("H", -1.2340,  0.9270,  0.0000),
    At("H", -1.2340, -0.9270,  0.0000),
    At("H",  1.2340,  0.9270,  0.0000),
    At("H",  1.2340, -0.9270,  0.0000)
  ], [Bd(0,1,2), Bd(0,2), Bd(0,3), Bd(1,4), Bd(1,5)]);

  /* ----- 14. Acetylene (C2H2) — linear, triple bond ----- */
  addPreset("Acetylene", "C\u2082H\u2082", [
    At("C", -0.6010,  0.0000,  0.0000),
    At("C",  0.6010,  0.0000,  0.0000),
    At("H", -1.6650,  0.0000,  0.0000),
    At("H",  1.6650,  0.0000,  0.0000)
  ], [Bd(0,1,3), Bd(0,2), Bd(1,3)]);

  /* ----- 15. Benzene (C6H6) — planar hexagonal ----- */
  (function () {
    var atoms = [], bonds = [];
    var rC = 1.3970, rH = 2.4820;
    var i, angle;
    for (i = 0; i < 6; i++) {
      angle = Math.PI / 6 + i * Math.PI / 3;
      atoms.push(At("C", rC * Math.cos(angle), rC * Math.sin(angle), 0));
    }
    for (i = 0; i < 6; i++) {
      angle = Math.PI / 6 + i * Math.PI / 3;
      atoms.push(At("H", rH * Math.cos(angle), rH * Math.sin(angle), 0));
    }
    for (i = 0; i < 6; i++) {
      bonds.push(Bd(i, (i + 1) % 6, (i % 2 === 0) ? 2 : 1));
      bonds.push(Bd(i, i + 6));
    }
    addPreset("Benzene", "C\u2086H\u2086", atoms, bonds);
  })();

  /* ----- 16. Glucose (C6H12O6) — beta-D-glucopyranose chair ----- */
  addPreset("Glucose", "C\u2086H\u2081\u2082O\u2086", [
    At("C",  1.2000,  0.2400,  0.2800),   // 0  C1
    At("C",  0.3500,  1.4000, -0.2000),   // 1  C2
    At("C", -1.1200,  1.0600,  0.0500),   // 2  C3
    At("C", -1.4700, -0.3600, -0.3600),   // 3  C4
    At("C", -0.5300, -1.3600,  0.2700),   // 4  C5
    At("O",  0.8300, -0.9600, -0.1000),   // 5  O5 ring
    At("C", -0.8700, -2.7800, -0.1700),   // 6  C6
    At("O",  2.5200,  0.4900, -0.1300),   // 7  O1
    At("O",  0.7100,  2.6400,  0.3900),   // 8  O2
    At("O", -1.9100,  1.9800, -0.6500),   // 9  O3
    At("O", -2.7900, -0.6500,  0.0500),   // 10 O4
    At("O", -0.0500, -3.6600,  0.5700),   // 11 O6
    At("H",  1.1500,  0.2600,  1.3800),   // 12 H-C1
    At("H",  0.4700,  1.4900, -1.2900),   // 13 H-C2
    At("H", -1.2200,  1.1000,  1.1400),   // 14 H-C3
    At("H", -1.3700, -0.4100, -1.4600),   // 15 H-C4
    At("H", -0.6300, -1.3100,  1.3700),   // 16 H-C5
    At("H", -0.6900, -2.8600, -1.2500),   // 17 H-C6a
    At("H", -1.9300, -3.0100,  0.0100),   // 18 H-C6b
    At("H",  3.0900, -0.2000,  0.2600),   // 19 HO1
    At("H",  0.1600,  3.3100, -0.0500),   // 20 HO2
    At("H", -1.6200,  2.8700, -0.4200),   // 21 HO3
    At("H", -3.3300,  0.0600, -0.3300),   // 22 HO4
    At("H", -0.3100, -4.5500,  0.3000)    // 23 HO6
  ], [
    Bd(0,1), Bd(1,2), Bd(2,3), Bd(3,4), Bd(4,5), Bd(5,0),
    Bd(4,6), Bd(0,7), Bd(1,8), Bd(2,9), Bd(3,10), Bd(6,11),
    Bd(0,12), Bd(1,13), Bd(2,14), Bd(3,15), Bd(4,16),
    Bd(6,17), Bd(6,18),
    Bd(7,19), Bd(8,20), Bd(9,21), Bd(10,22), Bd(11,23)
  ]);

  /* ----- 17. Propane (C3H8) ----- */
  addPreset("Propane", "C\u2083H\u2088", [
    At("C",  0.0000,  0.5900,  0.0000),   // 0  C2
    At("C", -1.2680, -0.2560,  0.0000),   // 1  C1
    At("C",  1.2680, -0.2560,  0.0000),   // 2  C3
    At("H",  0.0000,  1.2300,  0.8880),   // 3
    At("H",  0.0000,  1.2300, -0.8880),   // 4
    At("H", -1.2680, -0.8980,  0.8880),   // 5
    At("H", -1.2680, -0.8980, -0.8880),   // 6
    At("H", -2.1720,  0.3580,  0.0000),   // 7
    At("H",  1.2680, -0.8980,  0.8880),   // 8
    At("H",  1.2680, -0.8980, -0.8880),   // 9
    At("H",  2.1720,  0.3580,  0.0000)    // 10
  ], [
    Bd(0,1), Bd(0,2), Bd(0,3), Bd(0,4),
    Bd(1,5), Bd(1,6), Bd(1,7),
    Bd(2,8), Bd(2,9), Bd(2,10)
  ]);

  /* ----- 18. Butane (C4H10) — anti conformation ----- */
  addPreset("Butane", "C\u2084H\u2081\u2080", [
    At("C", -1.9450, -0.3540,  0.0000),   // 0  C1
    At("C", -0.6510,  0.4560,  0.0000),   // 1  C2
    At("C",  0.6510, -0.4560,  0.0000),   // 2  C3
    At("C",  1.9450,  0.3540,  0.0000),   // 3  C4
    At("H", -2.8180,  0.3060,  0.0000),   // 4
    At("H", -1.9900, -0.9900,  0.8900),   // 5
    At("H", -1.9900, -0.9900, -0.8900),   // 6
    At("H", -0.6500,  1.0980,  0.8870),   // 7
    At("H", -0.6500,  1.0980, -0.8870),   // 8
    At("H",  0.6500, -1.0980,  0.8870),   // 9
    At("H",  0.6500, -1.0980, -0.8870),   // 10
    At("H",  2.8180, -0.3060,  0.0000),   // 11
    At("H",  1.9900,  0.9900,  0.8900),   // 12
    At("H",  1.9900,  0.9900, -0.8900)    // 13
  ], [
    Bd(0,1), Bd(1,2), Bd(2,3),
    Bd(0,4), Bd(0,5), Bd(0,6),
    Bd(1,7), Bd(1,8),
    Bd(2,9), Bd(2,10),
    Bd(3,11), Bd(3,12), Bd(3,13)
  ]);

  /* ----- 19. Sodium Chloride (NaCl) ----- */
  addPreset("Sodium Chloride", "NaCl", [
    At("Na", -1.1800,  0.0000,  0.0000),
    At("Cl",  1.1800,  0.0000,  0.0000)
  ], [Bd(0,1)]);

  /* ----- 20. Sulfuric Acid (H2SO4) — tetrahedral around S ----- */
  addPreset("Sulfuric Acid", "H\u2082SO\u2084", [
    At("S",  0.0000,  0.0000,  0.0000),   // 0
    At("O",  1.2300,  0.7200,  0.0000),   // 1  =O
    At("O", -1.2300,  0.7200,  0.0000),   // 2  =O
    At("O",  0.7200, -1.0500,  0.6000),   // 3  -OH
    At("O", -0.7200, -1.0500, -0.6000),   // 4  -OH
    At("H",  1.4800, -1.2800,  1.1700),   // 5
    At("H", -1.4800, -1.2800, -1.1700)    // 6
  ], [Bd(0,1,2), Bd(0,2,2), Bd(0,3), Bd(0,4), Bd(3,5), Bd(4,6)]);

  /* ----- 21. Phosphoric Acid (H3PO4) — tetrahedral around P ----- */
  addPreset("Phosphoric Acid", "H\u2083PO\u2084", [
    At("P",  0.0000,  0.0000,  0.0000),   // 0
    At("O",  1.4600,  0.0000,  0.0000),   // 1  =O
    At("O", -0.6900,  1.2800,  0.0000),   // 2  -OH
    At("O", -0.6900, -0.6400,  1.1100),   // 3  -OH
    At("O", -0.6900, -0.6400, -1.1100),   // 4  -OH
    At("H", -0.6900,  2.1000,  0.5000),   // 5
    At("H", -0.6900, -0.1000,  1.9300),   // 6
    At("H", -0.6900, -0.1000, -1.9300)    // 7
  ], [Bd(0,1,2), Bd(0,2), Bd(0,3), Bd(0,4), Bd(2,5), Bd(3,6), Bd(4,7)]);

  /* ----- 22. Hydrogen Peroxide (H2O2) — dihedral ~111.5 deg ----- */
  addPreset("Hydrogen Peroxide", "H\u2082O\u2082", [
    At("O", -0.7370,  0.0000, -0.0850),
    At("O",  0.7370,  0.0000, -0.0850),
    At("H", -1.0600,  0.7700,  0.3400),
    At("H",  1.0600, -0.7700,  0.3400)
  ], [Bd(0,1), Bd(0,2), Bd(1,3)]);

  /* ----- 23. Carbon Monoxide (CO) — C triple O = 1.128 A ----- */
  addPreset("Carbon Monoxide", "CO", [
    At("C", -0.5640,  0.0000,  0.0000),
    At("O",  0.5640,  0.0000,  0.0000)
  ], [Bd(0,1,3)]);

  /* ----- 24. Nitric Acid (HNO3) — planar ----- */
  addPreset("Nitric Acid", "HNO\u2083", [
    At("N",  0.0000,  0.0000,  0.0000),   // 0
    At("O",  1.2060,  0.0000,  0.0000),   // 1  =O (partial)
    At("O", -0.5500,  1.1200,  0.0000),   // 2  =O (partial)
    At("O", -0.8300, -1.0000,  0.0000),   // 3  -OH
    At("H", -0.3200, -1.8300,  0.0000)    // 4
  ], [Bd(0,1,2), Bd(0,2,2), Bd(0,3), Bd(3,4)]);

  /* ----- 25. Glycine (NH2CH2COOH) ----- */
  addPreset("Glycine", "C\u2082H\u2085NO\u2082", [
    At("N", -1.2440,  0.7110,  0.0340),   // 0  NH2
    At("C",  0.0000, -0.0320, -0.0370),   // 1  C-alpha
    At("C",  1.2930,  0.7860,  0.0170),   // 2  C=O
    At("O",  1.2880,  2.0100,  0.0900),   // 3  =O
    At("O",  2.3920,  0.0400, -0.0450),   // 4  -OH
    At("H",  3.2000,  0.5800, -0.0100),   // 5  HO
    At("H", -0.0500, -0.6870,  0.8400),   // 6  H-alpha
    At("H", -0.0500, -0.6870, -0.9140),   // 7  H-alpha
    At("H", -1.2100,  1.3270,  0.8400),   // 8  HN
    At("H", -2.0900,  0.1600,  0.0340)    // 9  HN
  ], [
    Bd(0,1), Bd(1,2), Bd(2,3,2), Bd(2,4), Bd(4,5),
    Bd(1,6), Bd(1,7), Bd(0,8), Bd(0,9)
  ]);

  /* ----- 26. Alanine (CH3CH(NH2)COOH) ----- */
  addPreset("Alanine", "C\u2083H\u2087NO\u2082", [
    At("N", -0.6760,  1.3400, -0.3000),   // 0  NH2
    At("C", -0.5830,  0.0000,  0.2800),   // 1  C-alpha
    At("C",  0.8500, -0.5800,  0.0100),   // 2  C=O
    At("O",  0.9300, -1.7200, -0.4300),   // 3  =O
    At("O",  1.9200,  0.1800,  0.3200),   // 4  -OH
    At("C", -1.6800, -0.9000, -0.2900),   // 5  CH3
    At("H",  2.7400, -0.2700,  0.1300),   // 6  HO
    At("H", -0.7800,  0.0700,  1.3600),   // 7  H-alpha
    At("H", -0.0300,  2.0000,  0.1100),   // 8  HN
    At("H", -1.5900,  1.7200, -0.1500),   // 9  HN
    At("H", -1.5400, -1.9200,  0.0800),   // 10 H-CH3
    At("H", -2.6700, -0.5200, -0.0300),   // 11 H-CH3
    At("H", -1.5900, -0.9200, -1.3800)    // 12 H-CH3
  ], [
    Bd(0,1), Bd(1,2), Bd(2,3,2), Bd(2,4), Bd(1,5),
    Bd(4,6), Bd(1,7), Bd(0,8), Bd(0,9),
    Bd(5,10), Bd(5,11), Bd(5,12)
  ]);

  /* ----- 27. Urea CO(NH2)2 — planar ----- */
  addPreset("Urea", "CH\u2084N\u2082O", [
    At("C",  0.0000,  0.0000,  0.0000),   // 0
    At("O",  0.0000,  1.2500,  0.0000),   // 1  =O
    At("N",  1.1500, -0.6500,  0.0000),   // 2  NH2
    At("N", -1.1500, -0.6500,  0.0000),   // 3  NH2
    At("H",  1.1700, -1.6500,  0.0000),   // 4
    At("H",  2.0300, -0.1700,  0.0000),   // 5
    At("H", -1.1700, -1.6500,  0.0000),   // 6
    At("H", -2.0300, -0.1700,  0.0000)    // 7
  ], [Bd(0,1,2), Bd(0,2), Bd(0,3), Bd(2,4), Bd(2,5), Bd(3,6), Bd(3,7)]);

  /* ----- 28. ATP backbone (adenine + ribose + triphosphate, simplified) ----- */
  addPreset("ATP (simplified)", "C\u2081\u2080H\u2081\u2086N\u2085O\u2081\u2083P\u2083", [
    // Adenine 6-membered ring
    At("N",  4.2000,  1.4000,  0.0000),   // 0  N1
    At("C",  3.0000,  2.0500,  0.0000),   // 1  C2
    At("N",  1.8000,  1.4000,  0.0000),   // 2  N3
    At("C",  1.8000,  0.0500,  0.0000),   // 3  C4
    At("C",  3.0500, -0.5500,  0.0000),   // 4  C5
    At("C",  4.2000,  0.1000,  0.0000),   // 5  C6
    At("N",  5.3500, -0.5600,  0.0000),   // 6  NH2 on C6
    // 5-membered ring
    At("N",  2.8000, -1.8500,  0.0000),   // 7  N7
    At("C",  1.4800, -1.8000,  0.0000),   // 8  C8
    At("N",  0.8500, -0.6500,  0.0000),   // 9  N9
    // Ribose
    At("C", -0.5000, -0.4000,  0.4000),   // 10 C1'
    At("C", -1.2000, -1.5500, -0.2000),   // 11 C2'
    At("C", -2.5500, -0.9500,  0.2000),   // 12 C3'
    At("C", -2.2000,  0.4000, -0.4000),   // 13 C4'
    At("O", -0.9000,  0.7500, -0.2000),   // 14 O4' ring
    At("C", -3.0500,  1.5000,  0.2000),   // 15 C5'
    At("O", -1.0000, -2.7500,  0.5000),   // 16 O2' OH
    At("O", -3.7000, -1.6000, -0.3000),   // 17 O3' OH
    // Triphosphate
    At("O", -4.4000,  1.2000, -0.2000),   // 18 O5'
    At("P", -5.6500,  2.1000,  0.1000),   // 19 P-alpha
    At("O", -5.4000,  3.5000,  0.5000),   // 20
    At("O", -6.3000,  1.3500,  1.2000),   // 21
    At("O", -6.7000,  2.1000, -1.0500),   // 22 bridge
    At("P", -8.1000,  2.7000, -1.2000),   // 23 P-beta
    At("O", -8.0000,  4.1000, -0.7000),   // 24
    At("O", -8.5000,  2.6000, -2.6500),   // 25
    At("O", -9.2000,  1.9000, -0.3000),   // 26 bridge
    At("P",-10.6000,  2.5000, -0.5000),   // 27 P-gamma
    At("O",-10.5000,  3.9500, -0.2000),   // 28
    At("O",-11.4000,  1.8000,  0.5000),   // 29
    At("O",-11.2000,  2.3000, -1.9000),   // 30
    // Key hydrogens
    At("H",  3.0000,  3.1000,  0.0000),   // 31 H-C2
    At("H",  1.0000, -2.7500,  0.0000),   // 32 H-C8
    At("H",  5.3500, -1.5600,  0.0000),   // 33 HN6
    At("H",  6.2000, -0.0500,  0.0000),   // 34 HN6
    At("H", -0.6500, -0.3500,  1.4900),   // 35 H-C1'
    At("H", -1.1000, -1.7000, -1.2800),   // 36 H-C2'
    At("H", -0.1500, -2.9500,  1.0000),   // 37 HO2'
    At("H", -2.6000, -0.8500,  1.2900),   // 38 H-C3'
    At("H", -3.8000, -2.5000,  0.0000),   // 39 HO3'
    At("H", -2.3000,  0.3500, -1.4900),   // 40 H-C4'
    At("H", -2.9000,  2.4800, -0.2500),   // 41 H-C5'a
    At("H", -2.9500,  1.5500,  1.2900)    // 42 H-C5'b
  ], [
    // Adenine
    Bd(0,1,2), Bd(1,2), Bd(2,3), Bd(3,4,2), Bd(4,5), Bd(5,0),
    Bd(5,6), Bd(4,7), Bd(7,8,2), Bd(8,9), Bd(9,3),
    // Ribose
    Bd(9,10), Bd(10,11), Bd(11,12), Bd(12,13), Bd(13,14), Bd(14,10),
    Bd(13,15), Bd(11,16), Bd(12,17),
    // Triphosphate
    Bd(15,18), Bd(18,19), Bd(19,20,2), Bd(19,21), Bd(19,22),
    Bd(22,23), Bd(23,24,2), Bd(23,25), Bd(23,26),
    Bd(26,27), Bd(27,28,2), Bd(27,29), Bd(27,30),
    // Hydrogens
    Bd(1,31), Bd(8,32), Bd(6,33), Bd(6,34),
    Bd(10,35), Bd(11,36), Bd(16,37), Bd(12,38), Bd(17,39),
    Bd(13,40), Bd(15,41), Bd(15,42)
  ]);

  /* ----- 29. Caffeine (C8H10N4O2) ----- */
  addPreset("Caffeine", "C\u2088H\u2081\u2080N\u2084O\u2082", [
    // 6-membered ring (pyrimidine)
    At("C",  1.2200,  1.2000,  0.0000),   // 0  C2
    At("N",  0.0000,  1.8100,  0.0000),   // 1  N1
    At("C", -1.2000,  1.0500,  0.0000),   // 2  C6
    At("C", -1.2000, -0.4000,  0.0000),   // 3  C5
    At("C",  0.0000, -1.0000,  0.0000),   // 4  C4
    At("N",  1.2000, -0.2000,  0.0000),   // 5  N3
    // 5-membered ring (imidazole)
    At("N", -2.1000, -1.3500,  0.0000),   // 6  N7
    At("C", -1.3500, -2.4500,  0.0000),   // 7  C8
    At("N", -0.0500, -2.3000,  0.0000),   // 8  N9
    // Oxygens
    At("O", -2.3000,  1.6000,  0.0000),   // 9  O on C6
    At("O",  2.3000,  1.8000,  0.0000),   // 10 O on C2
    // Methyl groups
    At("C",  0.0000,  3.2600,  0.0000),   // 11 N1-CH3
    At("C",  2.4000, -0.8500,  0.0000),   // 12 N3-CH3
    At("C", -3.5400, -1.3500,  0.0000),   // 13 N7-CH3
    // H on C8
    At("H", -1.7600, -3.4500,  0.0000),   // 14
    // N1-CH3 hydrogens
    At("H",  1.0200,  3.6200,  0.0000),   // 15
    At("H", -0.5100,  3.6200,  0.8900),   // 16
    At("H", -0.5100,  3.6200, -0.8900),   // 17
    // N3-CH3 hydrogens
    At("H",  3.2700, -0.2000,  0.0000),   // 18
    At("H",  2.4500, -1.4900,  0.8900),   // 19
    At("H",  2.4500, -1.4900, -0.8900),   // 20
    // N7-CH3 hydrogens
    At("H", -3.9200, -0.3400,  0.0000),   // 21
    At("H", -3.9200, -1.8700,  0.8900),   // 22
    At("H", -3.9200, -1.8700, -0.8900)    // 23
  ], [
    Bd(0,1), Bd(1,2), Bd(2,3,2), Bd(3,4), Bd(4,5), Bd(5,0),
    Bd(3,6), Bd(6,7), Bd(7,8,2), Bd(8,4),
    Bd(2,9,2), Bd(0,10,2),
    Bd(1,11), Bd(5,12), Bd(6,13),
    Bd(7,14),
    Bd(11,15), Bd(11,16), Bd(11,17),
    Bd(12,18), Bd(12,19), Bd(12,20),
    Bd(13,21), Bd(13,22), Bd(13,23)
  ]);

  /* ----- 30. Aspirin (C9H8O4) — acetylsalicylic acid ----- */
  (function () {
    var atoms = [], bonds = [];
    var rC = 1.3970, rH = 2.4820;
    var i, angle;
    // Benzene ring: C0-C5
    for (i = 0; i < 6; i++) {
      angle = Math.PI / 6 + i * Math.PI / 3;
      atoms.push(At("C", rC * Math.cos(angle), rC * Math.sin(angle), 0));
    }
    // Alternating single/double for Kekule
    for (i = 0; i < 6; i++) {
      bonds.push(Bd(i, (i + 1) % 6, (i % 2 === 0) ? 2 : 1));
    }

    // Carboxylic acid on C0
    atoms.push(At("C",  2.6000,  1.1000,  0.0000));   // 6  carboxyl C
    atoms.push(At("O",  2.5500,  2.3000,  0.0000));   // 7  =O
    atoms.push(At("O",  3.7000,  0.4000,  0.0000));   // 8  -OH
    atoms.push(At("H",  4.5000,  0.9000,  0.0000));   // 9  HO
    bonds.push(Bd(0,6)); bonds.push(Bd(6,7,2)); bonds.push(Bd(6,8)); bonds.push(Bd(8,9));

    // Acetyloxy on C1 (ortho)
    atoms.push(At("O",  1.9000, -1.7500,  0.0000));   // 10 ester O
    atoms.push(At("C",  1.7000, -3.0500,  0.0000));   // 11 acetyl C
    atoms.push(At("O",  0.6000, -3.6000,  0.0000));   // 12 =O acetyl
    atoms.push(At("C",  2.9500, -3.8500,  0.0000));   // 13 CH3
    bonds.push(Bd(1,10)); bonds.push(Bd(10,11)); bonds.push(Bd(11,12,2)); bonds.push(Bd(11,13));

    // CH3 hydrogens
    atoms.push(At("H",  3.8500, -3.2500,  0.0000));   // 14
    atoms.push(At("H",  2.9500, -4.5000,  0.8900));   // 15
    atoms.push(At("H",  2.9500, -4.5000, -0.8900));   // 16
    bonds.push(Bd(13,14)); bonds.push(Bd(13,15)); bonds.push(Bd(13,16));

    // Ring H on unsubstituted carbons: C2, C3, C4, C5
    atoms.push(At("H", rH * Math.cos(Math.PI/6 + 2*Math.PI/3), rH * Math.sin(Math.PI/6 + 2*Math.PI/3), 0));  // 17 H-C2
    atoms.push(At("H", rH * Math.cos(Math.PI/6 + 3*Math.PI/3), rH * Math.sin(Math.PI/6 + 3*Math.PI/3), 0));  // 18 H-C3
    atoms.push(At("H", rH * Math.cos(Math.PI/6 + 4*Math.PI/3), rH * Math.sin(Math.PI/6 + 4*Math.PI/3), 0));  // 19 H-C4
    atoms.push(At("H", rH * Math.cos(Math.PI/6 + 5*Math.PI/3), rH * Math.sin(Math.PI/6 + 5*Math.PI/3), 0));  // 20 H-C5
    bonds.push(Bd(2,17)); bonds.push(Bd(3,18)); bonds.push(Bd(4,19)); bonds.push(Bd(5,20));

    addPreset("Aspirin", "C\u2089H\u2088O\u2084", atoms, bonds);
  })();

  /* =========================================================================
     CANVAS & DOM REFERENCES
     ========================================================================= */
  var canvas = document.getElementById("mol3d-canvas");
  var ctx = canvas.getContext("2d");
  var hintEl = document.getElementById("viewer-hint");
  var infoName = document.getElementById("info-name");
  var infoFormula = document.getElementById("info-formula");
  var infoAtoms = document.getElementById("info-atoms");
  var infoBonds = document.getElementById("info-bonds");
  var presetList = document.getElementById("preset-list");
  var btnReset = document.getElementById("btn-reset-view");
  var chkLabels = document.getElementById("toggle-labels");
  var chkSpin = document.getElementById("toggle-spin");

  /* =========================================================================
     STATE
     ========================================================================= */
  /* Orientation quaternion — initialised to match old rotX=0.3, rotY=0.5 */
  var orientation = (function () {
    var qy = quatFromAxisAngle(0, 1, 0, 0.5);
    var qx = quatFromAxisAngle(1, 0, 0, 0.3);
    return quatNormalize(quatMultiply(qx, qy));
  })();
  var defaultOrientation = orientation.slice();
  var panX = 0, panY = 0;
  var zoom = 100;
  var renderStyle = "ball-stick";
  var bgColor = "#0a0a1a";
  var showLabels = true;
  var autoSpin = false;
  var dragging = false;
  var shiftHeld = false;
  var currentMol = null;
  var FOV = 800;

  /* =========================================================================
     CANVAS SIZING
     ========================================================================= */
  function resizeCanvas() {
    var parent = canvas.parentElement;
    var dpr = window.devicePixelRatio || 1;
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentMol) { autoFitZoom(); }
  }
  window.addEventListener("resize", resizeCanvas);

  /* =========================================================================
     3D MATH — QUATERNION ROTATION
     ========================================================================= */

  /* Quaternion represented as [w, x, y, z] where w is scalar part */

  function quatFromAxisAngle(ax, ay, az, angle) {
    var halfA = angle * 0.5;
    var s = Math.sin(halfA);
    var len = Math.sqrt(ax * ax + ay * ay + az * az);
    if (len < 1e-12) { return [1, 0, 0, 0]; }
    var inv = s / len;
    return [Math.cos(halfA), ax * inv, ay * inv, az * inv];
  }

  function quatMultiply(a, b) {
    return [
      a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3],
      a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2],
      a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1],
      a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0]
    ];
  }

  function quatNormalize(q) {
    var len = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
    if (len < 1e-12) { return [1, 0, 0, 0]; }
    var inv = 1 / len;
    return [q[0]*inv, q[1]*inv, q[2]*inv, q[3]*inv];
  }

  function quatRotatePoint(px, py, pz, q) {
    /* p' = q * p * q^-1   (for unit quaternion, q^-1 = conjugate)
       Expanded to avoid constructing intermediate quaternions. */
    var qw = q[0], qx = q[1], qy = q[2], qz = q[3];

    /* t = 2 * cross(q.xyz, p) */
    var tx = 2 * (qy * pz - qz * py);
    var ty = 2 * (qz * px - qx * pz);
    var tz = 2 * (qx * py - qy * px);

    /* p' = p + qw * t + cross(q.xyz, t) */
    return {
      x: px + qw * tx + (qy * tz - qz * ty),
      y: py + qw * ty + (qz * tx - qx * tz),
      z: pz + qw * tz + (qx * ty - qy * tx)
    };
  }

  function project(x, y, z) {
    var scale = FOV / (FOV + z);
    return {
      sx: x * scale + panX,
      sy: y * scale + panY,
      scale: scale,
      z: z
    };
  }

  /* =========================================================================
     AUTO-FIT ZOOM
     ========================================================================= */
  function autoFitZoom() {
    if (!currentMol) { return; }
    var atoms = currentMol.atoms;
    var maxR = 0;
    for (var i = 0; i < atoms.length; i++) {
      var a = atoms[i];
      var dist = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      var vdwA = (ELEMENTS[a.el] ? ELEMENTS[a.el].vdw : 150) / 100;
      var r = dist + vdwA;
      if (r > maxR) { maxR = r; }
    }
    if (maxR < 0.5) { maxR = 0.5; }
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    var minDim = Math.min(w, h);
    zoom = (minDim * 0.35) / maxR;
    zoom = Math.max(20, Math.min(800, zoom));
  }

  /* =========================================================================
     LOAD MOLECULE
     ========================================================================= */
  function loadMolecule(preset) {
    // Center the molecule
    var cx = 0, cy = 0, cz = 0;
    var n = preset.atoms.length;
    var i;
    for (i = 0; i < n; i++) {
      cx += preset.atoms[i].x;
      cy += preset.atoms[i].y;
      cz += preset.atoms[i].z;
    }
    cx /= n; cy /= n; cz /= n;

    currentMol = {
      name: preset.name,
      formula: preset.formula,
      atoms: [],
      bonds: preset.bonds
    };
    for (i = 0; i < n; i++) {
      var a = preset.atoms[i];
      currentMol.atoms.push({ el: a.el, x: a.x - cx, y: a.y - cy, z: a.z - cz });
    }

    orientation = defaultOrientation.slice();
    panX = 0;
    panY = 0;
    autoFitZoom();

    infoName.textContent = preset.name;
    infoFormula.textContent = preset.formula;
    infoAtoms.textContent = n;
    infoBonds.textContent = preset.bonds.length;

    if (hintEl) { hintEl.style.display = "none"; }
  }

  /* =========================================================================
     RENDERING
     ========================================================================= */
  function render() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    var cx = w / 2;
    var cy = h / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    if (!currentMol) { return; }

    var atoms = currentMol.atoms;
    var bonds = currentMol.bonds;
    var i;

    // Transform all atoms to screen space
    var transformed = [];
    for (i = 0; i < atoms.length; i++) {
      var a = atoms[i];
      var r = quatRotatePoint(a.x * zoom, a.y * zoom, a.z * zoom, orientation);
      var p = project(r.x, r.y, r.z);
      var elData = ELEMENTS[a.el] || { color: "#CCCCCC", vdw: 150, cov: 70 };
      transformed.push({
        idx: i,
        el: a.el,
        sx: cx + p.sx,
        sy: cy + p.sy,
        z: p.z,
        scale: p.scale,
        color: elData.color,
        vdw: elData.vdw,
        cov: elData.cov
      });
    }

    // Build render list for painter's algorithm
    var renderItems = [];

    // Compute atom screen radius
    function atomRadius(t) {
      if (renderStyle === "space-fill") { return (t.vdw / 100) * zoom * t.scale * 0.40; }
      if (renderStyle === "stick") { return 4 * t.scale; }
      return (t.cov / 100) * zoom * t.scale * 0.35;
    }

    // Add bonds (unless space-fill)
    if (renderStyle !== "space-fill") {
      for (i = 0; i < bonds.length; i++) {
        var bond = bonds[i];
        var ta = transformed[bond.a];
        var tb = transformed[bond.b];
        renderItems.push({
          type: "bond",
          ta: ta,
          tb: tb,
          order: bond.order || 1,
          z: (ta.z + tb.z) / 2
        });
      }
    }

    // Add atoms
    for (i = 0; i < transformed.length; i++) {
      renderItems.push({
        type: "atom",
        t: transformed[i],
        z: transformed[i].z
      });
    }

    // Sort by z descending (farthest first)
    renderItems.sort(function (a, b) { return b.z - a.z; });

    // Determine z range for depth shading
    var minZ = Infinity, maxZ = -Infinity;
    for (i = 0; i < transformed.length; i++) {
      if (transformed[i].z < minZ) { minZ = transformed[i].z; }
      if (transformed[i].z > maxZ) { maxZ = transformed[i].z; }
    }
    var zRange = maxZ - minZ;
    if (zRange < 1) { zRange = 1; }

    // Draw all items
    for (i = 0; i < renderItems.length; i++) {
      var item = renderItems[i];
      if (item.type === "bond") {
        drawBond(ctx, item.ta, item.tb, item.order, zRange, minZ, cx, cy);
      } else {
        var t = item.t;
        var rad = atomRadius(t);
        var depthFactor = 0.55 + 0.45 * ((t.z - minZ) / zRange);
        drawAtom(ctx, t.sx, t.sy, rad, t.color, t.el, depthFactor);
      }
    }
  }

  function drawAtom(ctx, sx, sy, rad, color, el, depthFactor) {
    if (rad < 0.5) { return; }
    var baseColor = darken(color, 1 - depthFactor);
    var highlightColor = lighten(baseColor, 0.6);
    var shadowColor = darken(baseColor, 0.55);

    var grad = ctx.createRadialGradient(
      sx - rad * 0.3, sy - rad * 0.3, rad * 0.05,
      sx, sy, rad
    );
    grad.addColorStop(0, highlightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, shadowColor);

    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Label
    if (showLabels && rad > 5) {
      var lum = getLuminance(baseColor);
      ctx.fillStyle = lum > 0.5 ? "#000000" : "#FFFFFF";
      var fontSize = Math.max(8, Math.min(rad * 0.9, 16));
      ctx.font = "bold " + fontSize + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el, sx, sy);
    }
  }

  function drawBond(ctx, ta, tb, order, zRange, minZ) {
    var dx = tb.sx - ta.sx;
    var dy = tb.sy - ta.sy;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) { return; }

    var px = -dy / len;
    var py = dx / len;

    var mx = (ta.sx + tb.sx) / 2;
    var my = (ta.sy + tb.sy) / 2;

    var avgScale = (ta.scale + tb.scale) / 2;
    var baseWidth = renderStyle === "stick" ? 4 * avgScale : 3 * avgScale;

    // Half-bond coloring (darkened element colors)
    var colorA = darken(ta.color, 0.2);
    var colorB = darken(tb.color, 0.2);

    // Depth dimming
    var avgZ = (ta.z + tb.z) / 2;
    var depthFactor = 0.55 + 0.45 * ((avgZ - minZ) / zRange);
    colorA = darken(colorA, 1 - depthFactor);
    colorB = darken(colorB, 1 - depthFactor);

    var offsets;
    if (order === 1) {
      offsets = [0];
    } else if (order === 2) {
      offsets = [-2.5, 2.5];
    } else {
      offsets = [-3.5, 0, 3.5];
    }

    var w = order > 1 ? baseWidth * 0.6 : baseWidth;
    ctx.lineCap = "round";

    for (var o = 0; o < offsets.length; o++) {
      var ox = px * offsets[o] * avgScale;
      var oy = py * offsets[o] * avgScale;

      ctx.beginPath();
      ctx.moveTo(ta.sx + ox, ta.sy + oy);
      ctx.lineTo(mx + ox, my + oy);
      ctx.strokeStyle = colorA;
      ctx.lineWidth = w;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mx + ox, my + oy);
      ctx.lineTo(tb.sx + ox, tb.sy + oy);
      ctx.strokeStyle = colorB;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  }

  /* =========================================================================
     MOUSE / TOUCH INTERACTION
     ========================================================================= */
  var lastX = 0, lastY = 0;
  canvas.style.cursor = "grab";

  canvas.addEventListener("mousedown", function (e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    shiftHeld = e.shiftKey;
    canvas.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", function (e) {
    if (!dragging) { return; }
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    shiftHeld = e.shiftKey;

    if (shiftHeld) {
      panX += dx;
      panY += dy;
    } else {
      /* Build an incremental rotation quaternion from the drag delta.
         Horizontal drag → rotate around screen-space Y axis.
         Vertical drag   → rotate around screen-space X axis.
         The axis is perpendicular to the drag direction in screen space. */
      var angle = Math.sqrt(dx * dx + dy * dy) * 0.008;
      if (angle > 1e-6) {
        /* Axis in screen space: perpendicular to (dx, dy) is (dy, -dx, 0)
           but for intuitive "turntable" feel we use (0,1,0) for dx
           and (1,0,0) for dy, combined as a single rotation. */
        var qDelta = quatFromAxisAngle(dy, dx, 0, angle);
        orientation = quatNormalize(quatMultiply(qDelta, orientation));
      }
    }
  });

  window.addEventListener("mouseup", function () {
    dragging = false;
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoom *= 1.08;
    } else {
      zoom *= 0.92;
    }
    zoom = Math.max(20, Math.min(800, zoom));
  }, { passive: false });

  // Touch support
  var touchStartDist = 0;
  var touchStartZoom = 0;

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      dragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      var tdx = e.touches[0].clientX - e.touches[1].clientX;
      var tdy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.sqrt(tdx * tdx + tdy * tdy);
      touchStartZoom = zoom;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
      var dx = e.touches[0].clientX - lastX;
      var dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      var angle = Math.sqrt(dx * dx + dy * dy) * 0.008;
      if (angle > 1e-6) {
        var qDelta = quatFromAxisAngle(dy, dx, 0, angle);
        orientation = quatNormalize(quatMultiply(qDelta, orientation));
      }
    } else if (e.touches.length === 2) {
      var tdx = e.touches[0].clientX - e.touches[1].clientX;
      var tdy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (touchStartDist > 0) {
        zoom = touchStartZoom * (dist / touchStartDist);
        zoom = Math.max(20, Math.min(800, zoom));
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", function (e) {
    if (e.touches.length === 0) {
      dragging = false;
    }
  });

  /* =========================================================================
     CONTROLS
     ========================================================================= */
  var styleRadios = document.querySelectorAll('input[name="style"]');
  for (var si = 0; si < styleRadios.length; si++) {
    (function (radio) {
      radio.addEventListener("change", function () { renderStyle = radio.value; });
    })(styleRadios[si]);
  }

  var bgRadios = document.querySelectorAll('input[name="bg"]');
  for (var bi = 0; bi < bgRadios.length; bi++) {
    (function (radio) {
      radio.addEventListener("change", function () {
        bgColor = radio.value === "dark" ? "#0a0a1a" : "#f0f0f0";
      });
    })(bgRadios[bi]);
  }

  chkLabels.addEventListener("change", function () { showLabels = this.checked; });
  chkSpin.addEventListener("change", function () { autoSpin = this.checked; });

  btnReset.addEventListener("click", function () {
    orientation = defaultOrientation.slice();
    panX = 0;
    panY = 0;
    autoFitZoom();
  });

  /* =========================================================================
     PRESET BUTTONS
     ========================================================================= */
  var activeBtn = null;
  for (var pi = 0; pi < PRESETS.length; pi++) {
    (function (idx) {
      var btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = PRESETS[idx].name;
      btn.addEventListener("click", function () {
        if (activeBtn) { activeBtn.classList.remove("active"); }
        btn.classList.add("active");
        activeBtn = btn;
        loadMolecule(PRESETS[idx]);
      });
      presetList.appendChild(btn);
    })(pi);
  }

  /* =========================================================================
     ANIMATION LOOP
     ========================================================================= */
  function tick() {
    if (autoSpin && !dragging) {
      var qSpin = quatFromAxisAngle(0, 1, 0, 0.006);
      orientation = quatNormalize(quatMultiply(qSpin, orientation));
    }
    render();
    requestAnimationFrame(tick);
  }

  /* =========================================================================
     INIT
     ========================================================================= */
  resizeCanvas();
  if (PRESETS.length > 0) {
    var firstBtn = presetList.querySelector("button");
    if (firstBtn) {
      firstBtn.classList.add("active");
      activeBtn = firstBtn;
    }
    loadMolecule(PRESETS[0]);
  }
  tick();

})();
