/* ============================================================
   Rates of Reaction – Data
   Gas syringe method: HCl + marble chips (CaCO3)
   ============================================================ */
var RATES_DATA = {
  title: 'Rates of Reaction',
  subtitle: 'Investigating how concentration affects the rate of reaction between hydrochloric acid and marble chips',

  equation: 'CaCO\u2083(s) + 2HCl(aq) \u2192 CaCl\u2082(aq) + H\u2082O(l) + CO\u2082(g)',

  concentrations: [
    { label: '0.5 M HCl', value: 0.5, color: 'rgba(180,220,255,0.35)' },
    { label: '1.0 M HCl', value: 1.0, color: 'rgba(150,200,255,0.45)' },
    { label: '1.5 M HCl', value: 1.5, color: 'rgba(120,180,255,0.55)' },
    { label: '2.0 M HCl', value: 2.0, color: 'rgba(90,160,255,0.65)' }
  ],

  /* Maximum gas volume (cm³) and base rate parameters */
  maxGas: 60,           /* cm³ CO₂ at completion */
  chipMass: 2.0,        /* g of marble chips */
  acidVolume: 50,       /* cm³ */

  /* Rate model: V(t) = Vmax * (1 - e^(-k*t))
     k scales with concentration */
  baseK: 0.02,          /* rate constant for 1.0 M */

  steps: [
    { id: 'measure', title: 'Measure acid', instruction: 'Measure 50 cm\u00B3 of hydrochloric acid using a measuring cylinder.' },
    { id: 'weigh', title: 'Weigh chips', instruction: 'Weigh 2.0 g of marble chips (calcium carbonate) on a balance.' },
    { id: 'setup', title: 'Set up apparatus', instruction: 'Place the conical flask on the bench. Connect the gas syringe via the delivery tube.' },
    { id: 'pour', title: 'Add acid & start', instruction: 'Pour the acid into the flask, add the chips, quickly fit the bung, and start the timer.' },
    { id: 'record', title: 'Record readings', instruction: 'Record the gas syringe volume every 10 seconds for 2 minutes.' },
    { id: 'repeat', title: 'Repeat', instruction: 'Repeat with the next concentration. Use fresh chips and the same mass each time.' }
  ],

  timePoints: [0, 10, 20, 30, 40, 50, 60, 80, 100, 120],

  chipSizes: [
    { id: 'large', label: 'Large chips', surfaceMultiplier: 1.0 },
    { id: 'small', label: 'Small chips', surfaceMultiplier: 1.8 },
    { id: 'powder', label: 'Powder', surfaceMultiplier: 3.0 }
  ]
};
