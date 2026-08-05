# Karnaugh Map (K-Map) Solver Web Application

A production-grade, highly aesthetic, mathematically rigorous **Karnaugh Map (K-Map) Solver Web Application** built with **FastAPI**, **SymPy**, **React**, **Tailwind CSS**, and **Framer Motion**.

Supporting 2, 3, 4, and 5-variable Boolean expressions, interactive cell-toggling on K-Map matrices, Gray Code wrap-around grouping visualization, step-by-step educational explanations, full truth tables, and mathematical logic verification.

---

## Key Features

- **Multi-Variable Support**: Solves 2-variable ($2\times2$), 3-variable ($2\times4$), 4-variable ($4\times4$), and 5-variable (Dual $4\times4$ 3D subgrids) K-Maps.
- **Interactive Matrix**: Click any cell directly on the matrix to toggle between `0`, `1`, and `X` (don't care) with live re-solving.
- **Wrap-Around Adjacency Engine**: Detects 2D torus edge wrap-arounds, 4-corner groups (e.g. minterms 0, 2, 8, 10), and multi-subgrid 5-variable adjacencies.
- **Dual Formalisms**: Generates both **Sum-of-Products (SOP)** and **Product-of-Sums (POS)** minimal representations along with LaTeX math formulas.
- **SymPy Mathematical Verification**: Cross-verifies every computed expression against Python's `SymPy.SOPform` for absolute truth guarantee.
- **Step-by-Step Educational Breakdown**: Displays 5 structured educational steps explaining Gray Code placement, Prime Implicant discovery, and Essential Prime Implicant (EPI) selection.
- **Export & Persistence**: Copy simplified expressions, copy LaTeX, load preset problems (Full Adder, BCD, Corner Wrap-Around), and persist calculation history locally.
- **Client-Side Fallback Engine**: Seamless operation even if the backend service is offline.

---

## Tech Stack

### Backend
- **FastAPI** (Python 3.9+)
- **Uvicorn** (ASGI Web Server)
- **Pydantic v2** (Data Validation & Schemas)
- **SymPy** (Symbolic Logic Verification)

### Frontend
- **React 18** + **JSX** (Vite Build System)
- **React Router v6**
- **Tailwind CSS** (Custom Dark Mode & Glassmorphism Theme)
- **Framer Motion** (Smooth Animations)
- **Axios** (API Client)
- **Lucide React** (Modern Icons)

---

## Project Structure

```
kmaps/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, CORS, routes & exception handler
│   │   ├── config.py                   # App configuration settings
│   │   ├── schemas/
│   │   │   └── kmap.py                 # Pydantic request/response schemas
│   │   ├── algorithms/
│   │   │   ├── gray_code.py            # Gray Code generator & matrix coordinate mapping
│   │   │   ├── kmap_generator.py       # Matrix grid layout generator (2, 3, 4, 5 vars)
│   │   │   ├── grouping.py             # Torus wrap-around group detection, PIs & EPIs
│   │   │   ├── simplifier.py           # Literal term formulation & SymPy verification
│   │   │   └── truth_table.py          # Truth table generator
│   │   ├── services/
│   │   │   └── solver_service.py       # Unified solver orchestration
│   │   └── routers/
│   │       ├── solve.py                # POST /api/solve
│   │       ├── truth_table.py          # POST /api/truth-table
│   │       ├── kmap.py                 # POST /api/kmap
│   │       └── examples.py             # GET /api/examples
│   ├── tests/
│   │   ├── test_kmap.py                # Algorithm unit tests
│   │   └── test_api.py                 # Endpoint integration tests
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx              # Header & navigation
    │   │   ├── Hero.jsx                # Landing hero section
    │   │   ├── SolverForm.jsx          # Inputs, variable selector & presets
    │   │   ├── KMapGrid.jsx            # Interactive matrix layout
    │   │   ├── KMapCell.jsx            # Animated matrix cell
    │   │   ├── GroupLegend.jsx         # Prime Implicant color legend
    │   │   ├── ExpressionCard.jsx      # Minimal SOP/POS & LaTeX export
    │   │   ├── TruthTable.jsx          # Interactive truth table
    │   │   ├── StepsCard.jsx           # Step-by-step breakdown cards
    │   │   ├── HistoryPanel.jsx        # Saved history calculations
    │   │   ├── Footer.jsx              # Footer
    │   │   └── LoadingSpinner.jsx      # Loading overlay
    │   ├── pages/
    │   │   ├── Home.jsx                # Landing page
    │   │   ├── Solver.jsx              # Interactive studio page
    │   │   └── About.jsx               # Theory & documentation guide
    │   ├── services/
    │   │   └── api.js                  # Axios API client + fallback engine
    │   ├── hooks/
    │   │   ├── useKMapSolver.js        # Solver state & cell toggle logic
    │   │   └── useHistory.js           # LocalStorage persistence
    │   ├── styles/
    │   │   └── index.css               # Design system tokens & utility classes
    │   ├── App.jsx                     # Root application wrapper
    │   └── main.jsx                    # React entry point
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Quick Start / Local Installation

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run Uvicorn server
uvicorn app.main:app --reload --port 8000
```

Backend Swagger Documentation will be available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install Node dependencies
npm install

# Launch development server
npm run dev
```

Frontend application will open at: `http://localhost:3000`

---

## Running Backend Unit Tests

To run pytest suite for algorithm correctness and API endpoint verification:

```bash
cd backend
python -m pytest
```

---

## API Endpoints Summary

- `POST /api/solve` - Solves K-Map reduction, returns minimal expression, group overlays, matrix grid, truth table, and steps.
- `POST /api/truth-table` - Returns full $2^N$ row truth table.
- `POST /api/kmap` - Returns matrix grid layout with Gray code labels.
- `GET /api/examples` - Returns preset sample problems.
- `GET /api/health` - System health check.

---

## License

MIT License. Designed for educational & professional digital logic engineering.
