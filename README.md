# LabSim

Interactive science practical simulations for learners preparing for laboratory work.

Built for the Singapore secondary / JC context (GCE O-Level and A-Level sciences), but applicable to any high school science curriculum.

## Practicals

### Chemistry
- **Acid-Base Titration** — Full procedure with guided steps: rinsing, pipetting, indicator selection, endpoint detection, concordant result checking, and calculations.
- **Qualitative Analysis** — Data-driven cation/anion identification engine covering Cu²⁺, Fe²⁺, Fe³⁺, Zn²⁺, Ca²⁺, Al³⁺, Pb²⁺ with NaOH, NH₃, flame tests, and anion confirmatory tests.

### Physics (coming soon)
- Lenses & Light
- Electrical Circuits
- Pendulum & Oscillations

### Biology (coming soon)
- Food Tests

## Project Structure

```
labsim/
├── index.html                              # Landing page
├── shared/
│   └── design-system.css                   # Shared design tokens & components
├── chemistry/
│   ├── titration/
│   │   ├── index.html                      # Titration practical
│   │   ├── titration.css
│   │   └── titration.js
│   └── qualitative-analysis/
│       ├── index.html                      # QA practical
│       ├── qa.css
│       ├── qa.js
│       └── chemistry-data.js               # Reaction database
```

## Running Locally

These are static HTML files. Serve them with any HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .
```

Then open `http://localhost:8000` in your browser.

> **Note:** ES modules and linked CSS require HTTP serving. Opening `index.html` directly via `file://` may not load cross-file resources in some browsers.

## Design Principles

1. **Procedural knowledge first** — Simulations model the full lab procedure, not just the outcome. Students learn *how* to perform each step and *why* it matters.
2. **Data-driven chemistry** — Reaction data is separated from rendering logic, making it trivial to add new unknowns or fix errors.
3. **Guided mode** — Step-by-step walkthroughs explain technique and rationale before students explore freely.
4. **Assessment-ready** — Concordant result checking, calculation workspaces, and identification verification provide feedback on student work.
