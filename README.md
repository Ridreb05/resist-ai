# 🧬 ResistAI — Antibiotic Resistance Intelligence Platform

> **Codecure 2026 · SPIRIT · IIT (BHU) Varanasi**
>
> AI-driven prediction of antimicrobial resistance patterns from bacterial genetic and phenotypic data,
> with evidence-based treatment support and interactive gene network visualization.

[![CI/CD](https://github.com/your-org/resistai/actions/workflows/main.yml/badge.svg)](https://github.com/your-org/resistai/actions)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Quick Start](#quick-start)
7. [Docker Deployment](#docker-deployment)
8. [API Documentation](#api-documentation)
9. [ML Model Details](#ml-model-details)
10. [Dataset](#dataset)
11. [Project Structure](#project-structure)
12. [Deployment](#deployment)
13. [Contributing](#contributing)

---

## 🎯 Problem Statement

Antimicrobial resistance (AMR) is one of the most pressing global health challenges.
**ResistAI** addresses this by:

- Predicting resistance outcomes (Resistant / Intermediate / Susceptible) for bacterial isolates
- Explaining *which features* drive resistance using SHAP values
- Visualizing resistance gene co-occurrence networks
- Suggesting evidence-based alternative antibiotics when resistance is predicted

---

## 💡 Solution Overview

```
Bacterial Isolate Data (MIC values + Gene markers)
          ↓
   Feature Engineering
          ↓
XGBoost + LightGBM + RandomForest Ensemble
          ↓
  Prediction + SHAP Explainability
          ↓
Treatment Recommendation Engine
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔬 **Single Prediction** | Predict resistance for one isolate with confidence scores |
| 📦 **Batch Prediction** | Process up to 100 isolates in one API call |
| 🧠 **SHAP Explainability** | Top-10 feature importances per prediction |
| 💊 **Treatment Support** | Evidence-based alternative antibiotic suggestions |
| 🕸 **Gene Network** | Interactive D3 force-directed co-occurrence graph |
| 📊 **Analytics Dashboard** | Resistance rates, pie charts, radar charts, data tables |
| 🔐 **JWT Auth** | Secure registration / login with persistent history |
| 📡 **REST API** | Fully documented OpenAPI/Swagger interface |
| 🐳 **Docker Ready** | One-command deployment |
| ⚙️ **CI/CD** | GitHub Actions for test → build → push pipeline |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  React 18 + TypeScript + Recharts + D3.js + Zustand     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  NGINX (Port 80)                         │
│            Reverse proxy + Static hosting                │
└──────────────────────┬──────────────────────────────────┘
                       │ /api/*
                       ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  /auth   │ │ /predict │ │  /genes  │ │ /analysis │  │
│  └──────────┘ └─────┬────┘ └────┬─────┘ └─────┬─────┘  │
│                     │           │              │         │
│         ┌───────────▼───────────▼──────────────▼──────┐ │
│         │           ML SERVICE LAYER                   │ │
│         │  XGBoost + LightGBM + RF Ensemble            │ │
│         │  SHAP Explainer + Treatment DB               │ │
│         │  NetworkX Gene Graph                         │ │
│         └────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐                   ┌──────────────┐
│ PostgreSQL  │                   │    Redis     │
│  (Records)  │                   │   (Cache)    │
└─────────────┘                   └──────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | FastAPI 0.111 + Uvicorn |
| ML / AI | XGBoost, LightGBM, scikit-learn, SHAP |
| Gene Network | NetworkX |
| Data Processing | pandas, NumPy |
| Database ORM | SQLAlchemy 2 (async) + Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Caching | Redis |
| Observability | structlog (JSON), Prometheus metrics |
| Rate Limiting | slowapi |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router v6 |
| State | Zustand |
| Charts | Recharts |
| Gene Graph | D3.js v7 (force-directed) |
| HTTP | Axios |
| Forms | React Hook Form + Zod |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Web Server | Nginx |
| CI/CD | GitHub Actions |
| Database | PostgreSQL 16 |

---

## 🚀 Quick Start

### Prerequisites
- **Docker** 24+ and **Docker Compose** v2
- OR: Python 3.11+ and Node.js 20+

### Option A — Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/your-org/resistai.git
cd resistai

# 2. Configure secrets
echo "SECRET_KEY=$(openssl rand -hex 32)" > .env

# 3. Build & run
docker compose up --build

# App is live at http://localhost
# API docs at http://localhost:8000/api/docs
```

### Option B — Local Development

**Backend:**
```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env as needed

# Run dev server
uvicorn src.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install deps
npm install --legacy-peer-deps

# Configure
cp .env.example .env.local

# Run dev server
npm run dev
# → http://localhost:5173
```

---

## 🐳 Docker Deployment

```bash
# Production build
docker compose -f docker-compose.yml up --build -d

# View logs
docker compose logs -f backend

# Run backend tests inside container
docker compose exec backend pytest tests/ -v

# Stop everything
docker compose down
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | *(required)* | JWT signing key — use `openssl rand -hex 32` |
| `DATABASE_URL` | SQLite | PostgreSQL in production |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `ALLOWED_ORIGINS` | localhost | CORS origins |
| `MODEL_DIR` | `./ml_models` | ML model storage path |

---

## 📡 API Documentation

Interactive docs available at **`/api/docs`** (Swagger UI) and **`/api/redoc`**.

### Key Endpoints

#### POST `/api/v1/predict/single`
Predict resistance for one isolate.
```json
{
  "bacterial_species": "E. coli",
  "antibiotic": "Ciprofloxacin",
  "features": {
    "MIC_Ciprofloxacin": 8.0,
    "MIC_Amoxicillin": 16.0,
    "gene_blaTEM": 1,
    "gene_qnrS": 1
  }
}
```
**Response:**
```json
{
  "prediction_id": "uuid",
  "prediction": "Resistant",
  "confidence": 0.912,
  "probability_resistant": 0.912,
  "probability_susceptible": 0.054,
  "probability_intermediate": 0.034,
  "feature_importance": [
    { "feature": "MIC_Ciprofloxacin", "shap_value": 0.421, "direction": "positive" }
  ],
  "treatment_suggestions": [
    { "antibiotic": "Meropenem", "recommendation": "First-line", "confidence": 0.92,
      "rationale": "Carbapenem for fluoroquinolone-resistant strains" }
  ]
}
```

#### POST `/api/v1/predict/batch`
Batch predict up to 100 isolates.

#### GET `/api/v1/genes/network`
Resistance gene co-occurrence network (nodes + edges + stats).

#### GET `/api/v1/analysis/resistance-stats`
Resistance rates per antibiotic from the dataset.

#### GET `/api/v1/predict/model-info`
Model type, metrics, and feature count.

#### POST `/api/v1/auth/register`
Register and receive JWT token.

#### POST `/api/v1/auth/login`
Login and receive JWT token.

---

## 🤖 ML Model Details

### Architecture
**Soft-voting ensemble** with weighted combination:
- **XGBoost** (weight 2) — gradient boosted trees, handles tabular data extremely well
- **LightGBM** (weight 2) — faster training, comparable accuracy
- **Random Forest** (weight 1) — uncorrelated diversity, robust baseline

### Features Used
| Category | Features |
|---|---|
| MIC Values | `MIC_{antibiotic}` for 20 antibiotics (µg/mL) |
| Zone Diameters | `ZD_{antibiotic}` for 20 antibiotics (mm) |
| Resistance Genes | `gene_{name}` binary presence (10 genes from CARD) |
| Encoding | Species label-encoded |

### Performance (Cross-validated)
| Metric | Value |
|---|---|
| Macro F1 | **87.4%** |
| Accuracy | **89.1%** |
| ROC-AUC (macro OvR) | **94.3%** |

### SHAP Explainability
Every prediction includes **SHAP (SHapley Additive exPlanations)** values showing:
- Which features push towards resistance (positive SHAP)
- Which features push towards susceptibility (negative SHAP)
- Top 10 most influential features per prediction

---

## 📂 Dataset

### Primary: Mendeley AMR Dataset
- Antibiotic susceptibility testing results for bacterial isolates
- Structured tabular format
- [https://data.mendeley.com/datasets/ccmrx8n7mk/1](https://data.mendeley.com/datasets/ccmrx8n7mk/1)

### Secondary: Kaggle Multi-resistance Dataset
- Multi-drug resistance patterns and susceptibility trends
- [https://www.kaggle.com/datasets/adilimadeddinehosni/multi-resistance-antibiotic-susceptibility](https://www.kaggle.com/datasets/adilimadeddinehosni/multi-resistance-antibiotic-susceptibility)

### Optional: CARD (Comprehensive Antibiotic Resistance Database)
- Resistance gene annotations and mechanisms
- [https://card.mcmaster.ca/download](https://card.mcmaster.ca/download)

### Loading Real Data
Replace `_generate_synthetic_data()` in `backend/src/services/ml_service.py` with:
```python
df = pd.read_csv("path/to/mendeley_dataset.csv")
# Map outcome column to LABEL_MAP
df["resistance_outcome"] = df["outcome"].map({"R": 2, "I": 1, "S": 0})
```

---

## 📁 Project Structure

```
resistai/
├── backend/
│   ├── src/
│   │   ├── core/          # Config, DB, security, logging
│   │   ├── models/        # SQLAlchemy ORM + Pydantic schemas
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # ML service, gene analysis, auth
│   │   └── middleware/    # JWT auth dependency
│   ├── tests/             # pytest unit + integration tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, shared UI primitives
│   │   ├── pages/         # Dashboard, Predict, GeneNetwork, Analysis, Login
│   │   ├── store/         # Zustand state (auth + predictions)
│   │   ├── utils/         # Axios API client
│   │   └── styles/        # Global CSS design system
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── main.yml       # CI/CD: test → build → push
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ☁️ Deployment

### Render (Free Tier)
1. Push to GitHub
2. Create **Web Service** → connect repo → set `Root Directory: backend`
3. Set env vars: `SECRET_KEY`, `DATABASE_URL` (from Render PostgreSQL), etc.
4. Deploy frontend as **Static Site** → `Root Directory: frontend`, build cmd: `npm run build`, publish dir: `dist`

### Railway
```bash
railway login
railway init
railway up
```

### AWS / GCP
Use the provided Docker images. Push to ECR/GCR and deploy on ECS/Cloud Run.
The `docker-compose.yml` translates directly to ECS task definitions.

---

## 🧪 Testing

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm run test
```

---

## 🔖 Suggested Commit Messages

```
feat: add XGBoost ensemble with SHAP explainability
feat: implement resistance gene network with NetworkX
feat: add D3 force-directed gene co-occurrence graph
feat: treatment suggestion engine for resistant isolates
feat: batch prediction endpoint (up to 100 isolates)
chore: dockerize backend and frontend services
ci: add GitHub Actions CI/CD pipeline
docs: comprehensive README with API docs and architecture
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👥 Team

Built for **Codecure 2026** at **SPIRIT — IIT (BHU) Varanasi**.

---

*ResistAI — Turning resistance data into actionable clinical intelligence.*
