/* Flashcards – deck definitions */
var FLASHCARD_DECKS = [
  {
    id: 'apparatus', name: 'Lab Apparatus', icon: '\u2697\uFE0F', subject: 'general',
    cards: [
      { q: 'What is a burette used for?', a: 'Measuring and dispensing precise, variable volumes of liquid (typically 0\u201350 cm\u00b3).' },
      { q: 'What is a pipette used for?', a: 'Transferring a fixed, accurate volume of liquid (e.g. 25.0 cm\u00b3).' },
      { q: 'What is a volumetric flask used for?', a: 'Preparing a standard solution of an accurately known concentration.' },
      { q: 'What is a measuring cylinder used for?', a: 'Measuring approximate volumes of liquid (less accurate than a burette).' },
      { q: 'What does a Bunsen burner provide?', a: 'A controllable gas flame for heating. Blue = hot/roaring; yellow = cool/safety.' },
      { q: 'What is a retort stand used for?', a: 'Supporting apparatus (clamps, bosses) at the required height.' },
      { q: 'What is a conical (Erlenmeyer) flask used for?', a: 'Swirling solutions during titrations; the sloped sides prevent splashing.' },
      { q: 'What is a beaker used for?', a: 'Holding, mixing, or heating liquids. Not for accurate measurement.' },
      { q: 'What is a test tube rack used for?', a: 'Holding multiple test tubes upright during reactions or observations.' },
      { q: 'What is a white tile used for in titration?', a: 'Placed under the flask to see the indicator colour change more clearly.' }
    ]
  },
  {
    id: 'chem-formulae', name: 'Chemical Formulae', icon: '\u269B\uFE0F', subject: 'chemistry',
    cards: [
      { q: 'Formula of sulfuric acid?', a: 'H\u2082SO\u2084' },
      { q: 'Formula of hydrochloric acid?', a: 'HCl' },
      { q: 'Formula of sodium hydroxide?', a: 'NaOH' },
      { q: 'Formula of copper(II) sulfate?', a: 'CuSO\u2084' },
      { q: 'Formula of calcium carbonate?', a: 'CaCO\u2083' },
      { q: 'Formula of ammonia?', a: 'NH\u2083' },
      { q: 'Formula of carbon dioxide?', a: 'CO\u2082' },
      { q: 'Formula of sodium chloride?', a: 'NaCl' },
      { q: 'Formula of iron(III) chloride?', a: 'FeCl\u2083' },
      { q: 'Formula of zinc sulfate?', a: 'ZnSO\u2084' },
      { q: 'Formula of lead(II) bromide?', a: 'PbBr\u2082' },
      { q: 'Formula of potassium permanganate?', a: 'KMnO\u2084' }
    ]
  },
  {
    id: 'qa-tests', name: 'QA Test Results', icon: '\u{1F9EA}', subject: 'chemistry',
    cards: [
      { q: 'NaOH + Cu\u00b2\u207a gives what precipitate?', a: 'Blue precipitate (insoluble in excess).' },
      { q: 'NaOH + Fe\u00b2\u207a gives what precipitate?', a: 'Green (dirty green) precipitate (insoluble in excess).' },
      { q: 'NaOH + Fe\u00b3\u207a gives what precipitate?', a: 'Red-brown precipitate (insoluble in excess).' },
      { q: 'NaOH + Zn\u00b2\u207a gives what precipitate?', a: 'White precipitate, soluble in excess (forms zincate).' },
      { q: 'NaOH + Al\u00b3\u207a gives what precipitate?', a: 'White precipitate, soluble in excess (forms aluminate).' },
      { q: 'NH\u2083 + Cu\u00b2\u207a in excess gives what?', a: 'Deep blue solution (tetraamminecopper(II)).' },
      { q: 'How do you test for Cl\u207b ions?', a: 'Add dilute HNO\u2083, then AgNO\u2083. White precipitate of AgCl forms.' },
      { q: 'How do you test for SO\u2084\u00b2\u207b ions?', a: 'Add dilute HCl, then BaCl\u2082. White precipitate of BaSO\u2084 forms.' },
      { q: 'How do you test for CO\u2083\u00b2\u207b ions?', a: 'Add dilute acid. Effervescence; gas turns limewater milky (CO\u2082).' },
      { q: 'What colour is the flame test for Na\u207a?', a: 'Strong yellow/orange flame.' },
      { q: 'What colour is the flame test for K\u207a?', a: 'Lilac/purple flame.' },
      { q: 'What colour is the flame test for Cu\u00b2\u207a?', a: 'Blue-green flame.' }
    ]
  },
  {
    id: 'food-tests', name: 'Food Tests', icon: '\u{1F34E}', subject: 'biology',
    cards: [
      { q: 'Which reagent tests for starch?', a: 'Iodine solution. Positive: brown \u2192 blue-black.' },
      { q: 'Which reagent tests for reducing sugars?', a: "Benedict's solution + heating. Positive: blue \u2192 green/yellow/orange/brick-red." },
      { q: 'Which reagents test for protein (Biuret test)?', a: 'NaOH then CuSO\u2084. Positive: blue \u2192 purple/violet.' },
      { q: 'How do you test for lipids (fats)?', a: 'Emulsion test: dissolve in ethanol, add water. Positive: cloudy white emulsion.' },
      { q: 'Why must you heat the sample in the Benedict\u2019s test?', a: 'The reaction requires thermal energy to reduce Cu\u00b2\u207a to Cu\u2082O.' },
      { q: 'Name a food that contains all four macronutrients.', a: 'Milk (protein, lipid, reducing sugar/lactose, and traces of starch in whole milk).' }
    ]
  },
  {
    id: 'physics-units', name: 'Physics Units & Equations', icon: '\u{1F4D0}', subject: 'physics',
    cards: [
      { q: 'Unit of resistance?', a: 'Ohm (\u03A9)' },
      { q: 'Ohm\u2019s Law equation?', a: 'V = IR (Voltage = Current \u00d7 Resistance)' },
      { q: 'Period of a pendulum equation?', a: 'T = 2\u03c0\u221a(L/g)' },
      { q: 'Lens equation?', a: '1/f = 1/v + 1/u' },
      { q: 'What does the gradient of a V-I graph represent?', a: 'Resistance (R = V/I or R = gradient if V on y-axis).' },
      { q: 'What does the gradient of T\u00b2 vs L give you?', a: '4\u03c0\u00b2/g. Rearranging: g = 4\u03c0\u00b2 / gradient.' },
      { q: 'Unit of current?', a: 'Ampere (A)' },
      { q: 'Unit of potential difference?', a: 'Volt (V)' },
      { q: 'Unit of focal length?', a: 'Metres (m) or centimetres (cm)' },
      { q: 'What does magnification mean?', a: 'The ratio of image size to object size: m = v/u = image height / object height.' }
    ]
  },
  {
    id: 'electrolysis', name: 'Electrolysis', icon: '\u26A1', subject: 'chemistry',
    cards: [
      { q: 'What is electrolysis?', a: 'The decomposition of a compound using electricity (D.C. current through an electrolyte).' },
      { q: 'What happens at the cathode?', a: 'Reduction \u2014 positive ions (cations) gain electrons. Metal deposited or H\u2082 gas.' },
      { q: 'What happens at the anode?', a: 'Oxidation \u2014 negative ions (anions) lose electrons. Non-metal produced or metal dissolves.' },
      { q: 'Products of electrolysing dilute H\u2082SO\u2084 with carbon electrodes?', a: 'Cathode: Hydrogen (H\u2082). Anode: Oxygen (O\u2082). Ratio 2:1.' },
      { q: 'Products of electrolysing CuSO\u2084 with carbon electrodes?', a: 'Cathode: Copper (Cu deposit). Anode: Oxygen (O\u2082).' },
      { q: 'Products of electrolysing CuSO\u2084 with copper electrodes?', a: 'Cathode: Cu deposited. Anode: Cu dissolves. Copper purification.' },
      { q: 'Products of electrolysing brine (conc. NaCl)?', a: 'Cathode: Hydrogen. Anode: Chlorine (Cl\u2082).' },
      { q: 'Why must PbBr\u2082 be molten for electrolysis?', a: 'Ionic compounds only conduct when ions are free to move \u2014 either molten or dissolved.' }
    ]
  },
  {
    id: 'osmosis', name: 'Osmosis & Cells', icon: '\u{1F52C}', subject: 'biology',
    cards: [
      { q: 'Define osmosis.', a: 'Net movement of water molecules from a region of higher water potential to lower water potential through a partially permeable membrane.' },
      { q: 'What is a hypertonic solution?', a: 'A solution with lower water potential (higher solute concentration) than the cell.' },
      { q: 'What happens to a plant cell in a hypertonic solution?', a: 'Plasmolysis \u2014 cell membrane pulls away from cell wall as water leaves.' },
      { q: 'What happens to an animal cell in a hypotonic solution?', a: 'It swells and may burst (lysis/cytolysis).' },
      { q: 'What is the isotonic point?', a: 'Where water potential inside and outside the cell are equal \u2014 no net water movement.' },
      { q: 'How do you calculate % change in mass?', a: '(Final mass \u2212 Initial mass) / Initial mass \u00d7 100' }
    ]
  },
  {
    id: 'hazard-symbols', name: 'Hazard Symbols', icon: '\u26A0\uFE0F', subject: 'safety',
    cards: [
      { q: 'What does the corrosive symbol mean?', a: 'Substance causes severe burns to skin, eyes, or destroys metals.' },
      { q: 'What does the flammable symbol mean?', a: 'Substance catches fire easily when exposed to heat, sparks, or flame.' },
      { q: 'What does the toxic (skull & crossbones) symbol mean?', a: 'Substance can cause death or serious illness via ingestion, inhalation, or skin absorption.' },
      { q: 'What does the oxidising symbol mean?', a: 'Substance can cause or intensify fire by releasing oxygen.' },
      { q: 'What does the irritant/harmful symbol mean?', a: 'Substance may cause irritation to skin, eyes, or respiratory system.' },
      { q: 'What does the environmental hazard symbol mean?', a: 'Substance is toxic to aquatic organisms and may cause lasting environmental damage.' }
    ]
  }
];
