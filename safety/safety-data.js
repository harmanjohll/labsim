/* Lab Safety – data */
var SAFETY_DATA = {
  hazards: [
    {
      id: 'flammable', name: 'Flammable',
      symbol: '\u{1F525}', color: '#e74c3c', bg: '#fdecea',
      meaning: 'Substance can easily catch fire or ignite when exposed to heat, sparks, or open flames.',
      examples: 'Ethanol, methanol, acetone, hydrogen gas.',
      precautions: ['Keep away from open flames and heat sources', 'Use in a well-ventilated area', 'Store in a cool, dry place', 'Keep containers tightly sealed']
    },
    {
      id: 'corrosive', name: 'Corrosive',
      symbol: '\u{1F9EA}', color: '#8e44ad', bg: '#f5eef8',
      meaning: 'Substance can cause severe burns to skin, eyes, or destroy metals on contact.',
      examples: 'Concentrated sulfuric acid, sodium hydroxide, hydrochloric acid.',
      precautions: ['Wear chemical-resistant gloves and safety goggles', 'Use a fume cupboard for concentrated acids', 'Add acid to water, never water to acid', 'Rinse splashes immediately with plenty of water']
    },
    {
      id: 'toxic', name: 'Toxic',
      symbol: '\u2620\uFE0F', color: '#1a1a2e', bg: '#f0f0f5',
      meaning: 'Substance can cause serious illness or death if swallowed, inhaled, or absorbed through skin.',
      examples: 'Lead compounds, chlorine gas, mercury salts, bromine.',
      precautions: ['Work in a fume cupboard', 'Wear appropriate PPE (gloves, goggles, lab coat)', 'Never taste or directly smell chemicals', 'Wash hands thoroughly after handling']
    },
    {
      id: 'irritant', name: 'Irritant / Harmful',
      symbol: '\u26A0\uFE0F', color: '#d35400', bg: '#fef5e7',
      meaning: 'Substance may cause irritation to skin, eyes, or respiratory system, or is harmful if swallowed.',
      examples: 'Dilute acids, copper sulfate solution, calcium chloride.',
      precautions: ['Wear safety goggles at all times', 'Avoid skin contact — wear gloves if prolonged', 'Wash hands after use', 'Do not eat or drink in the laboratory']
    },
    {
      id: 'oxidising', name: 'Oxidising',
      symbol: '\u{1F4A5}', color: '#e67e22', bg: '#fef9e7',
      meaning: 'Substance can cause or intensify fire by providing oxygen. May cause other materials to burn more vigorously.',
      examples: 'Hydrogen peroxide, potassium permanganate, potassium manganate(VII).',
      precautions: ['Keep away from flammable and combustible materials', 'Do not mix with reducing agents', 'Store separately from other chemicals', 'Wear safety goggles and gloves']
    },
    {
      id: 'gas-pressure', name: 'Gas Under Pressure',
      symbol: '\u{1F4A8}', color: '#2980b9', bg: '#ebf5fb',
      meaning: 'Container holds gas under pressure. May explode if heated. Compressed or liquefied gas may cause burns or frostbite.',
      examples: 'Gas cylinders (oxygen, nitrogen, carbon dioxide), aerosol cans.',
      precautions: ['Store upright and secured', 'Keep away from heat sources', 'Do not puncture or incinerate containers', 'Handle with care to avoid dropping']
    },
    {
      id: 'environmental', name: 'Environmental Hazard',
      symbol: '\u{1F333}', color: '#27ae60', bg: '#eafaf1',
      meaning: 'Substance is toxic to aquatic life and may cause long-lasting damage to the environment.',
      examples: 'Pesticides, heavy metal salts, some organic solvents.',
      precautions: ['Do not pour down the drain', 'Dispose of in designated chemical waste containers', 'Prevent spills into waterways', 'Use minimum quantities needed']
    },
    {
      id: 'health-hazard', name: 'Serious Health Hazard',
      symbol: '\u{1F3E5}', color: '#c0392b', bg: '#fdedec',
      meaning: 'Substance may cause cancer, genetic defects, organ damage, or respiratory sensitisation with prolonged or repeated exposure.',
      examples: 'Formaldehyde, benzene, asbestos fibres.',
      precautions: ['Minimise exposure time', 'Use extraction/fume cupboard', 'Wear full PPE', 'Follow COSHH guidelines strictly']
    },
    {
      id: 'explosive', name: 'Explosive',
      symbol: '\u{1F4A3}', color: '#e74c3c', bg: '#fdecea',
      meaning: 'Substance may explode due to heat, shock, friction, or detonation.',
      examples: 'Ammonium nitrate (in bulk), some peroxides.',
      precautions: ['Handle with extreme care', 'Do not expose to heat, sparks, or friction', 'Store in designated explosive-proof cabinets', 'Use behind safety screens']
    }
  ],

  quizQuestions: [
    { q: 'What is the first thing you should do when you enter a laboratory?', opts: ['Start the experiment immediately', 'Locate the nearest fire exit and safety equipment', 'Put on a lab coat only', 'Sit down and wait'], answer: 1, explain: 'Always familiarise yourself with emergency exits, fire extinguisher, eyewash station, and first aid kit locations.' },
    { q: 'If concentrated acid splashes on your skin, you should:', opts: ['Wipe it off with a paper towel', 'Rinse immediately with plenty of cold running water', 'Apply a neutralising base', 'Ignore it if it is a small splash'], answer: 1, explain: 'Rinse with water for at least 20 minutes. Never try to neutralise — the exothermic reaction would cause more damage.' },
    { q: 'Why should you never eat or drink in a laboratory?', opts: ['It is untidy', 'Chemicals could contaminate food and enter your body', 'It distracts from the experiment', 'The teacher will be annoyed'], answer: 1, explain: 'Toxic substances can transfer to food, drinks, or your mouth via contaminated hands or surfaces.' },
    { q: 'When heating a liquid in a test tube, you should point the opening:', opts: ['Towards yourself', 'Towards your lab partner', 'Away from all people', 'Directly upwards'], answer: 2, explain: 'Liquids can suddenly boil and eject (bumping). Always point the tube away from everyone.' },
    { q: 'The corrosive hazard symbol warns that a substance:', opts: ['Is flammable', 'Can cause severe burns to skin or eyes', 'Is poisonous if inhaled', 'Is harmful to the environment'], answer: 1, explain: 'Corrosive substances destroy living tissue on contact. Wear gloves, goggles, and a lab coat.' },
    { q: 'What type of fire extinguisher should you use on an electrical fire?', opts: ['Water', 'Foam', 'CO\u2082 (carbon dioxide)', 'Wet chemical'], answer: 2, explain: 'CO\u2082 extinguishers are safe for electrical fires as they do not conduct electricity. Never use water.' },
    { q: 'When diluting concentrated acid, you should always:', opts: ['Add water to acid', 'Add acid to water', 'Mix them simultaneously', 'Heat the acid first'], answer: 1, explain: 'Adding acid to water dissipates the exothermic heat safely. Adding water to acid can cause violent boiling and spattering.' },
    { q: 'Long hair in the laboratory should be:', opts: ['Left untied for comfort', 'Tied back or covered', 'Cut short before entering', 'It does not matter'], answer: 1, explain: 'Loose hair can catch fire from Bunsen burners or become trapped in equipment.' },
    { q: 'A Bunsen burner flame should be set to which colour when not actively heating?', opts: ['Blue (roaring)', 'Yellow (safety/luminous)', 'It should be turned off', 'Orange'], answer: 1, explain: 'The yellow safety flame is visible and prevents accidental burns. The blue flame is nearly invisible.' },
    { q: 'What should you do if you break a glass beaker?', opts: ['Pick up the pieces with your hands', 'Leave it for someone else', 'Tell the teacher and use a dustpan and brush', 'Step over it carefully'], answer: 2, explain: 'Inform your teacher immediately. Use a dustpan and brush — never bare hands — and dispose of glass in the designated broken-glass bin.' },
    { q: 'Which of these is NOT appropriate eye protection in a chemistry lab?', opts: ['Chemical splash goggles', 'Safety spectacles with side shields', 'Regular prescription glasses', 'A full face shield'], answer: 2, explain: 'Regular glasses do not seal around the eyes and cannot stop chemical splashes from the sides or below.' },
    { q: 'When smelling a chemical, you should:', opts: ['Lean over and inhale deeply', 'Waft the vapour towards your nose with your hand', 'Hold the container to your nose', 'Never smell any chemical'], answer: 1, explain: 'Wafting allows you to detect odours safely without inhaling concentrated vapour directly.' },
    { q: 'Spilled chemicals on the bench should be:', opts: ['Left to evaporate', 'Wiped up immediately following the appropriate procedure', 'Covered with paper', 'Washed down the sink'], answer: 1, explain: 'Clean spills promptly using the correct method (absorbent, neutraliser, or water) and report to the teacher.' },
    { q: 'The purpose of a fume cupboard is to:', opts: ['Keep chemicals warm', 'Protect experiments from contamination', 'Remove harmful vapours and gases from the breathing zone', 'Store chemicals safely'], answer: 2, explain: 'A fume cupboard draws air away from the user and extracts toxic fumes through ventilation.' },
    { q: 'At the end of an experiment, you should:', opts: ['Leave apparatus for the next class', 'Wash your hands and clean your workspace', 'Rush out of the laboratory', 'Stack all equipment in the sink'], answer: 1, explain: 'Clean your work area, return chemicals, wash apparatus, and wash your hands before leaving.' }
  ],

  riskAssessments: {
    titration: {
      name: 'Acid-Base Titration',
      hazards: [
        { hazard: 'Acid solution (e.g. HCl)', risk: 'Irritation to skin and eyes', precaution: 'Wear safety goggles and gloves; rinse splashes with water' },
        { hazard: 'Base solution (e.g. NaOH)', risk: 'Corrosive burns to skin', precaution: 'Wear safety goggles; handle carefully; rinse immediately if spilt' },
        { hazard: 'Glassware (burette, pipette)', risk: 'Cuts from broken glass', precaution: 'Check for cracks before use; handle with care; dispose of broken glass safely' },
        { hazard: 'Indicator solution', risk: 'Staining of skin and clothes', precaution: 'Wear a lab coat; wash stains promptly' }
      ]
    },
    qa: {
      name: 'Qualitative Analysis',
      hazards: [
        { hazard: 'NaOH solution', risk: 'Corrosive burns', precaution: 'Wear goggles and gloves; add dropwise' },
        { hazard: 'NH\u2083 solution (ammonia)', risk: 'Irritating fumes', precaution: 'Use in well-ventilated area; avoid inhaling' },
        { hazard: 'Unknown salt solutions', risk: 'Possible toxic/irritant effects', precaution: 'Treat all unknowns as potentially harmful; wear PPE' },
        { hazard: 'Bunsen burner (flame test)', risk: 'Burns from flame', precaution: 'Tie back hair; keep flame on safety when not in use' }
      ]
    },
    electrolysis: {
      name: 'Electrolysis',
      hazards: [
        { hazard: 'D.C. power supply', risk: 'Electric shock', precaution: 'Do not touch electrodes when power is on; check connections' },
        { hazard: 'Chlorine gas (from brine)', risk: 'Toxic if inhaled', precaution: 'Use a fume cupboard or well-ventilated area; keep quantities small' },
        { hazard: 'Sulfuric acid electrolyte', risk: 'Corrosive to skin', precaution: 'Wear goggles and gloves; dilute solutions are less hazardous' },
        { hazard: 'Hydrogen gas produced', risk: 'Flammable / explosive', precaution: 'No naked flames nearby; ensure ventilation' }
      ]
    },
    'food-tests': {
      name: 'Food Tests',
      hazards: [
        { hazard: "Benedict's solution (contains CuSO\u2084)", risk: 'Irritant to eyes and skin', precaution: 'Wear goggles; wash splashes immediately' },
        { hazard: 'Hot water bath', risk: 'Scalding from hot water', precaution: 'Use tongs to handle tubes; do not overfill bath' },
        { hazard: 'Iodine solution', risk: 'Staining; irritant', precaution: 'Wear gloves and lab coat; rinse stains quickly' },
        { hazard: 'NaOH (Biuret test)', risk: 'Corrosive', precaution: 'Handle carefully; wear goggles; rinse splashes' }
      ]
    },
    pendulum: {
      name: 'Pendulum & Oscillations',
      hazards: [
        { hazard: 'Heavy pendulum bob', risk: 'Injury if dropped on foot', precaution: 'Handle carefully; do not swing excessively' },
        { hazard: 'Retort stand/clamp', risk: 'Toppling over if unbalanced', precaution: 'Use a heavy base; position stand on stable surface' },
        { hazard: 'Swinging pendulum', risk: 'Impact injury', precaution: 'Stand clear of the swing path; use small angles (<15\u00b0)' }
      ]
    },
    'ohms-law': {
      name: "Ohm's Law",
      hazards: [
        { hazard: 'Power supply / battery', risk: 'Electric shock; short circuit', precaution: 'Use low voltage (<12V); connect circuit before switching on' },
        { hazard: 'Resistor wire', risk: 'Burns from overheating', precaution: 'Switch off between readings; do not touch wire when current flows' },
        { hazard: 'Connecting leads', risk: 'Tripping; short circuits', precaution: 'Keep leads tidy; check for exposed/frayed wires' }
      ]
    },
    lenses: {
      name: 'Lenses & Light',
      hazards: [
        { hazard: 'Glass lens', risk: 'Breakage causing cuts', precaution: 'Handle carefully; report cracked lenses immediately' },
        { hazard: 'Bright light source', risk: 'Eye damage from direct viewing', precaution: 'Never look directly into the light source; use a screen' },
        { hazard: 'Optical bench', risk: 'Pinching fingers in track', precaution: 'Slide components gently; keep fingers clear of edges' }
      ]
    },
    osmosis: {
      name: 'Osmosis',
      hazards: [
        { hazard: 'Scalpel / cork borer', risk: 'Cuts to fingers', precaution: 'Cut on a white tile away from body; use cork borer with care' },
        { hazard: 'Sucrose solutions', risk: 'Slippery floor if spilt', precaution: 'Wipe spills immediately; work over a tray' },
        { hazard: 'Glassware (beakers)', risk: 'Breakage', precaution: 'Handle carefully; dispose of broken glass safely' }
      ]
    }
  }
};
