/* ============================================================
   Nature of Science – Data definitions
   Topics: Variables, Errors, Fair Testing, Planning
   ============================================================ */
var NOS_DATA = {

  /* ---- 1. Variables ---- */
  variables: {
    intro: 'In every experiment there are three types of variable. Identifying them correctly is the first step to a fair test.',
    types: [
      { id: 'iv', name: 'Independent Variable', short: 'IV', color: '#4361ee', bg: '#eef1fd',
        definition: 'The variable you deliberately change in each experiment.',
        tip: 'Ask: "What am I choosing to vary?"' },
      { id: 'dv', name: 'Dependent Variable', short: 'DV', color: '#06d6a0', bg: '#e6faf3',
        definition: 'The variable you measure or observe as a result.',
        tip: 'Ask: "What am I measuring?"' },
      { id: 'cv', name: 'Control Variable', short: 'CV', color: '#f77f00', bg: '#fff3e0',
        definition: 'Variables kept the same to ensure a fair test.',
        tip: 'Ask: "What must stay the same?"' }
    ],
    exercises: [
      { scenario: 'Investigating how pendulum length affects the period of oscillation.',
        iv: 'Length of the pendulum', dv: 'Period (time for one oscillation)', cvs: ['Mass of bob', 'Angle of release', 'Number of oscillations counted'] },
      { scenario: 'Investigating how concentration of sucrose affects osmosis in potato cylinders.',
        iv: 'Concentration of sucrose solution', dv: 'Change in mass of potato cylinder', cvs: ['Size of potato cylinder', 'Volume of solution', 'Time left in solution', 'Temperature'] },
      { scenario: 'Investigating how resistance changes with length of a wire.',
        iv: 'Length of the wire', dv: 'Resistance (or current at fixed voltage)', cvs: ['Wire material', 'Wire thickness (diameter)', 'Temperature'] },
      { scenario: 'Testing which food sample contains the most reducing sugar.',
        iv: 'Type of food sample', dv: 'Colour change with Benedict\'s solution', cvs: ['Volume of Benedict\'s solution', 'Volume/mass of food sample', 'Heating time', 'Temperature of water bath'] },
      { scenario: 'Investigating the effect of acid concentration on the rate of reaction with marble chips.',
        iv: 'Concentration of acid', dv: 'Volume of gas collected (or mass loss) per unit time', cvs: ['Mass of marble chips', 'Surface area of chips', 'Volume of acid', 'Temperature'] },
      { scenario: 'Determining the focal length of a converging lens using object and image distances.',
        iv: 'Object distance (u)', dv: 'Image distance (v)', cvs: ['Same lens (focal length)', 'Same screen', 'Room lighting'] }
    ]
  },

  /* ---- 2. Errors & Accuracy ---- */
  errors: {
    intro: 'Understanding errors helps you evaluate how trustworthy your results are.',
    concepts: [
      { id: 'accuracy', name: 'Accuracy', icon: '\uD83C\uDFAF',
        definition: 'How close a measured value is to the true or accepted value.',
        example: 'If the true mass is 5.00 g and you measure 4.98 g, that is accurate.' },
      { id: 'precision', name: 'Precision', icon: '\uD83D\uDD2C',
        definition: 'How close repeated measurements are to each other (reproducibility).',
        example: 'Getting 4.98 g, 4.97 g, 4.99 g is precise, even if the true value is 5.20 g.' },
      { id: 'systematic', name: 'Systematic Error', icon: '\u27A1\uFE0F',
        definition: 'An error that shifts all readings in the same direction. Affects accuracy.',
        example: 'A balance that reads 0.02 g too high: every mass is 0.02 g too high.' },
      { id: 'random', name: 'Random Error', icon: '\uD83C\uDFB2',
        definition: 'Unpredictable variation between readings. Affects precision.',
        example: 'Slightly different reaction times when starting/stopping a stopwatch.' },
      { id: 'zero', name: 'Zero Error', icon: '0\uFE0F\u20E3',
        definition: 'When an instrument does not read zero when it should.',
        example: 'A ruler worn at the 0 mark, or a balance that reads 0.03 g with nothing on it.' },
      { id: 'parallax', name: 'Parallax Error', icon: '\uD83D\uDC41\uFE0F',
        definition: 'Error caused by reading a scale from the wrong angle.',
        example: 'Reading a burette at eye level vs from below gives different values.' }
    ],
    quiz: [
      { q: 'A student measures the boiling point of water five times and gets: 99.8, 99.7, 99.9, 99.8, 99.8 °C. The true value is 100.0 °C. Are the results accurate, precise, or both?',
        opts: ['Accurate only', 'Precise only', 'Both accurate and precise', 'Neither'],
        answer: 2, explain: 'The readings are close together (precise) AND close to 100.0 °C (accurate).' },
      { q: 'A balance always reads 0.5 g too high. What type of error is this?',
        opts: ['Random error', 'Systematic error', 'Parallax error', 'Human error'],
        answer: 1, explain: 'It shifts every reading by the same amount in the same direction — systematic.' },
      { q: 'Which of these reduces random error?',
        opts: ['Calibrating the instrument', 'Repeating measurements and calculating a mean', 'Using a different method', 'Reading at eye level'],
        answer: 1, explain: 'Repeating and averaging cancels out random fluctuations.' },
      { q: 'A student reads a burette from below the meniscus. This causes:',
        opts: ['Systematic error', 'Random error', 'Parallax error', 'Zero error'],
        answer: 2, explain: 'Reading from the wrong angle is a parallax error.' },
      { q: 'How can you reduce systematic errors?',
        opts: ['Take more readings', 'Calibrate instruments before use', 'Use a bigger sample', 'Work faster'],
        answer: 1, explain: 'Calibration corrects for consistent bias in the instrument.' }
    ]
  },

  /* ---- 3. Fair Testing ---- */
  fairTest: {
    intro: 'A fair test changes only one variable at a time. This is the foundation of reliable experimental science.',
    principles: [
      { name: 'Change one variable', desc: 'Only alter the independent variable between trials.' },
      { name: 'Measure the outcome', desc: 'Observe or measure the dependent variable consistently.' },
      { name: 'Control everything else', desc: 'Keep all other conditions (control variables) constant.' },
      { name: 'Repeat for reliability', desc: 'Take at least 3 repeat readings and calculate the mean.' },
      { name: 'Use appropriate equipment', desc: 'Choose instruments with suitable range and resolution.' }
    ],
    scenarios: [
      { description: 'A student wants to find out if temperature affects the rate of an enzyme reaction. They test at 20°C, 30°C, 40°C, 50°C and 60°C. At 40°C they accidentally use twice the amount of enzyme.',
        flaw: 'At 40°C the amount of enzyme was not controlled — two variables changed at once.',
        fix: 'Use the same volume and concentration of enzyme at every temperature.' },
      { description: 'A student investigates how the length of a wire affects its resistance. They measure resistance for 5 different lengths but use a thin wire for the first 3 readings and a thicker wire for the last 2.',
        flaw: 'Wire thickness (a control variable) was changed partway through.',
        fix: 'Use the same wire (material and diameter) for all lengths.' },
      { description: 'A student does an osmosis experiment but only places one potato cylinder in each concentration. Some results look unusual.',
        flaw: 'No repeat readings — cannot identify anomalies or calculate a reliable mean.',
        fix: 'Use at least 3 potato cylinders per concentration and average the results.' }
    ]
  },

  /* ---- 4. Planning an Investigation ---- */
  planning: {
    intro: 'A good plan is the blueprint for a successful experiment. Use RIMMER as a checklist.',
    steps: [
      { letter: 'R', word: 'Research question', desc: 'State clearly what you are investigating. Include the IV and DV.' },
      { letter: 'I', word: 'Independent variable', desc: 'What will you change? List at least 5 values you will test.' },
      { letter: 'M', word: 'Measured (dependent) variable', desc: 'What will you measure? State the instrument and units.' },
      { letter: 'M', word: 'Method (procedure)', desc: 'Write step-by-step instructions another person could follow.' },
      { letter: 'E', word: 'Equipment list', desc: 'List all apparatus, quantities, and concentrations needed.' },
      { letter: 'R', word: 'Risk assessment', desc: 'Identify hazards, risks, and precautions for safety.' }
    ],
    practicalLinks: [
      { name: 'Titration', id: 'titration', rq: 'What volume of NaOH neutralises 25.0 cm³ of HCl?' },
      { name: 'Osmosis', id: 'osmosis', rq: 'How does sucrose concentration affect the mass of potato cylinders?' },
      { name: 'Pendulum', id: 'pendulum', rq: 'How does pendulum length affect the period of oscillation?' },
      { name: 'Ohm\'s Law', id: 'ohms-law', rq: 'How does the current through a resistor vary with potential difference?' },
      { name: 'Lenses', id: 'lenses', rq: 'How are object distance and image distance related for a converging lens?' },
      { name: 'Electrolysis', id: 'electrolysis', rq: 'What products form at the electrodes during electrolysis of copper sulfate?' }
    ]
  },

  /* ---- 5. Evaluation Phrases (word bank) ---- */
  evaluation: {
    strengths: [
      'Repeated readings were taken and a mean calculated',
      'Control variables were kept constant',
      'A suitable range of IV values was used',
      'Appropriate equipment was selected',
      'Results show a clear trend/pattern'
    ],
    weaknesses: [
      'Only one trial was done — no repeats',
      'An anomalous result was not identified or excluded',
      'A control variable was not kept constant',
      'The range of IV values was too narrow',
      'The instrument resolution was too low'
    ],
    improvements: [
      'Take at least 3 repeats and average',
      'Circle and re-do anomalous results',
      'Use more precise equipment (e.g. burette instead of measuring cylinder)',
      'Increase the range of IV values tested',
      'Carry out a control experiment for comparison'
    ]
  }
};
