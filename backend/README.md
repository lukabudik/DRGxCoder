# AutoCode AI - Backend

FastAPI backend for automatic ICD-10 diagnosis code prediction.

## Setup

### 1. Install Dependencies
```bash
uv sync
```

### 2. Configure Environment
Copy `.env` file with:
- `DATABASE_URL` - Supabase connection string
- `DIRECT_URL` - Direct database URL
- `OPENROUTER_API_KEY` - LLM API key
- `DEFAULT_LLM_MODEL` - Model name (google/gemini-3-pro-preview)

### 3. ONE-TIME: Load Diagnosis Codes
Run once to populate database with 38,769 ICD-10 codes:
```bash
uv run python scripts/load_diagnosis_codes.py
```

This reads from `data/diagnosis_codes.csv` and loads into database.

### 4. Start Server
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs on: http://localhost:8000

API Docs: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── services.py      # LLM client + 2-step prediction
│   ├── database.py      # Prisma operations
│   ├── models.py        # Pydantic schemas
│   └── core/
│       └── config.py    # Settings
├── prisma/
│   └── schema.prisma    # Database schema
├── data/
│   ├── diagnosis_codes.csv     # 38k ICD-10 codes
│   └── patient_cases.json      # Test cases
└── scripts/
    └── load_diagnosis_codes.py # ONE-TIME setup script
```

## API Endpoints

### Prediction
- **POST /api/predict** - Create prediction (saves case + prediction to DB)

### Cases
- **GET /api/cases** - List cases (paginated, searchable)
- **GET /api/cases/:id** - Get case with predictions

### Predictions
- **GET /api/predictions** - List predictions (filtered)
- **GET /api/predictions/:id** - Get prediction details
- **PATCH /api/predictions/:id/validate** - Validate prediction

### Utilities
- **GET /api/codes/search** - Search diagnosis codes
- **GET /health** - Health check

## How It Works

### 2-Step Prediction Pipeline

**Step 1: Top-Level Code Selection**
- Shows LLM all 2,063 3-character codes (A00, I21, etc.)
- LLM selects 5-15 relevant codes
- Returns: `["I46", "G93", "N17", ...]`

**Step 2: Detailed Prediction**
- Expands selected codes to ~50-100 subcodes
- LLM predicts main + secondary diagnoses
- Returns: Specific codes with confidence scores

**Processing Time**: ~30-60 seconds per case

## Database Tables

**DiagnosisCode** - 38,769 ICD-10 diagnosis codes
- Loaded once from CSV
- Used for code lookup and search

**PatientCase** - Clinical data
- Created on each prediction request
- Contains clinical text + lab results

**Prediction** - Prediction results
- Linked to PatientCase (one-to-many)
- Contains selected codes, main/secondary diagnoses
- Tracks validation status

## Development

Check database state:
```bash
uv run prisma studio
```

View logs:
```bash
# Logs printed to console when server runs
```

## Deployment

Backend can be deployed to:
- Vercel (serverless)
- Railway
- Render
- Any platform supporting Python + FastAPI

## Notes

- All predictions automatically saved to database
- No manual scripts needed - everything via API
- Frontend calls `/api/predict` - backend handles rest
- Database uses Supabase PostgreSQL
- LLM uses OpenRouter with Gemini 3 Pro
