# Psychometric Profiling App (React + FastAPI + TabNet)

A full-stack psychometric profiling web application that converts student questionnaire responses into four dimensional **quotient scores** (IQ/CQ, EQ, SQ, AQ), classifies students into one of **seven psychometric profiles** using a **TabNet** deep learning neural network, explains predictions using local neural feature attention masks, and delivers personalized growth actions.

---

## 1. Tech Stack & Repository Architecture

- **Backend:** Python 3.10 / 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2 with SQLite, pandas, openpyxl, numpy, scikit-learn, PyTorch (CPU), `pytorch-tabnet`.
- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, custom pure SVG chart components (zero chart libraries, offline-ready).
- **Single Source of Truth:** `config/questions.json`, `config/profiles.json`, `config/recommendations.json`.

```
project/
  config/                      questions.json, profiles.json, recommendations.json
  data/                        responses.xlsx goes here; data/README.md explains format
  artifacts/                   trained model, norms, metrics, distributions, reports (git-ignored)
  backend/
    app/
      main.py                  FastAPI app, CORS, routers, state initialization
      api/                     questionnaire.py, predict.py, scoring.py, model_info.py, health.py, profiles.py
      core/                    config.py, schemas.py, db.py, models_db.py
      services/                recommend.py, worked_example.py, warnings.py
    ml/
      config_loader.py         Loads and validates JSON configs
      encode.py                Text answers -> numeric scores & quality checks
      scoring.py               Item normalisation, quotient scores, population norms, z-scores, levels
      labelling.py             Nearest-prototype Euclidean distance & borderline margin
      train.py                 CLI: python -m backend.ml.train (--demo | --xlsx data/responses.xlsx)
      predict.py               Artifact loader, inference & TabNet feature masks
      metrics.py               Evaluation metrics, confusion matrix, distributions, CV
    tests/                     Unit & API test suite
  frontend/
    src/
      pages/                   AssessmentPage.tsx, ScoringPage.tsx, ModelPage.tsx
      components/              charts/ (BarChart, GroupedBarChart, Histogram, LineChart, Heatmap), QuestionField.tsx, Navigation.tsx
      api/                     client.ts, types.ts
  scripts/
    make_demo_xlsx.py          Generates 210 synthetic benchmark responses
    generate_page_previews.py  Generates standalone preview HTML files
  README.md
```

---

## 2. Quick Start Guide

### Prerequisites
- Python 3.10 or 3.11 installed
- Node.js 18+ and npm installed

---

### Step 1: Install Dependencies

#### Windows (PowerShell)
```powershell
# 1. Install Backend Dependencies
pip install -r requirements.txt

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

#### macOS / Linux (Bash)
```bash
# 1. Install Backend Dependencies
pip install -r requirements.txt

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

### Step 2: Model Training

#### Option A: Train on Synthetic Demo Data
Generates ~200 benchmark responses covering all 7 profiles and trains the TabNet classifier:
```powershell
# Windows / macOS / Linux
python -m backend.ml.train --demo
```

#### Option B: Train on Real Google Form Responses
Drop your exported Excel file into `data/responses.xlsx` and run:
```powershell
# Windows / macOS / Linux
python -m backend.ml.train --xlsx data/responses.xlsx
```

*Note: Training computes quotient population norms ($\mu, \sigma$), fits TabNet with fixed hyperparameters, and exports all 10 artifact files into `artifacts/`.*

---

### Step 3: Run the Application

#### Running from `backend/` directory (`D:\FYP\backend`)
If you want to run directly from the backend directory using your virtual environment:

```powershell
cd D:\FYP\backend

# Activate your virtual environment (if not already active)
.\fyp\Scripts\Activate.ps1

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000

# Or train the model from D:\FYP\backend:
python -m ml.train --demo
# or with custom Excel responses:
python -m ml.train --xlsx data/responses.xlsx

# Or run tests from D:\FYP\backend:
pytest tests
# or
python -m unittest discover tests
```

#### Running from Project Root (`D:\FYP`)
```powershell
# From D:\FYP
uvicorn backend.app.main:app --reload --port 8000

# Or with python:
python -m uvicorn backend.app.main:app --reload --port 8000

# Train the model:
python -m backend.ml.train --demo
# or
python -m backend.ml.train --xlsx data/responses.xlsx

# Run tests:
pytest backend/tests
```
- API Base URL: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

#### Start the Frontend (React + Vite)
In a separate terminal window:
```powershell
# Windows / macOS / Linux
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 3. Running the Test Suite

### Backend Tests
Covers text encoding, fuzzy header matching, multi-select rules, quotient normalisation, z-scores, prototype labelling, and API endpoints:
```powershell
# Windows / macOS / Linux
python -m unittest discover backend/tests
# Or with pytest:
pytest backend/tests
```

### Frontend Tests
Runs Vitest component tests verifying SVG chart bar and cell counts:
```powershell
# Windows / macOS / Linux
cd frontend
npm test
```

---

## 4. Application Pages & Features

1. **Assessment (`/`):**
   - **Consent Stage:** Purpose, strict privacy disclosures, voluntary participation, and informed consent gating.
   - **Stepper Questions:** All 38 survey questions organized in logical sections with progress bar, validation, and answer retention.
   - **Results & Growth:** Predicted archetype, classification probabilities, quotient score bars with population norm markers, top 5 neural explanation items, and personalized action cards.
2. **Scoring & Mapping (`/scoring`):**
   - Step-by-step methodology explanation.
   - Items per quotient distribution chart.
   - Searchable and filterable table across all 38 questions (quotients, components, reversal tags, rules).
   - Mathematical formulas and reference population norms.
   - Full 7-prototype vector coordinates.
   - Worked example walkthrough computed from production scoring code.
3. **Model Info (`/model`):**
   - Demographic notice and honest methodological disclosures.
   - Reference sample distribution charts (profiles, quotient tiers, histograms, demographics).
   - TabNet fixed architecture documentation.
   - Held-out test performance metrics (Accuracy, Macro/Weighted F1, Balanced Accuracy, Cohen's Kappa, MCC, ROC-AUC).
   - Per-class breakdown and confusion matrix heatmap.
   - Global feature importance and training loss / validation accuracy learning curves.

