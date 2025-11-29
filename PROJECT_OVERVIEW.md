# DRGxCoder - AI-Powered ICD-10 Diagnosis Code Prediction

## What Is This?

DRGxCoder is an AI system that helps medical coders assign ICD-10 diagnosis codes to patient cases. It analyzes clinical data (medical history, lab results, medications) and predicts the most relevant diagnosis codes, saving time and improving accuracy.

## How It Works

### Input
Medical coders provide comprehensive patient data:
- **Clinical text**: Medical history, symptoms, procedures, outcomes
- **Lab results**: Biochemistry, hematology, microbiology
- **Medications**: Current and administered drugs

### AI Prediction Process (2-Step Pipeline)

**Step 1: Code Filtering** (~30s)
- System shows all 2,063 high-level ICD-10 codes (e.g., I50, J96, N17)
- AI selects 5-15 potentially relevant code categories
- Example: For a heart failure patient → selects I50 (heart failure), I48 (atrial fibrillation), N17 (kidney failure)

**Step 2: Specific Diagnosis** (~90s)
- AI expands selected codes to show all subcodes
- Predicts one **main diagnosis** + multiple **secondary diagnoses**
- Each prediction includes confidence score and medical reasoning
- Example output: I501 (Left ventricular failure) - 95% confidence

Total processing time: ~2 minutes per case

### Human Feedback Loop
Medical coders review AI predictions and can:
- **Approve**: Prediction is correct (optionally add comment)
- **Reject**: Make corrections by adding/removing/modifying codes (optionally add comment)
- All feedback is stored for future model improvements

## Current State

### ✅ Backend Complete (FastAPI + PostgreSQL)

**Technology Stack:**
- FastAPI (Python web framework)
- PostgreSQL database with Prisma ORM
- Google Gemini 3 Pro LLM
- 38,769 ICD-10 diagnosis codes loaded

**API Endpoints:**
1. `POST /api/predict` - Generate prediction from clinical data
2. `GET /api/cases` - List all patient cases (paginated)
3. `GET /api/cases/:id` - Get specific case with predictions
4. `GET /api/predictions` - List all predictions
5. `GET /api/predictions/:id` - Get specific prediction details
6. `POST /api/predictions/:id/feedback` - Submit approval/corrections
7. `GET /api/codes/search` - Search diagnosis codes
8. `GET /api/codes/:code` - Get code details + all cases using it
9. `GET /health` - Health check

**Database Schema:**
- `DiagnosisCode` - 38,769 ICD-10 codes with names and categories
- `PatientCase` - Clinical data for each patient
- `Prediction` - AI predictions with reasoning, confidence, and human feedback

**Features:**
- Complete 2-step prediction pipeline
- Human validation and correction tracking
- Bidirectional navigation: Cases→Codes and Codes→Cases
- Feedback system for continuous improvement

### 🔨 Frontend (Next.js) - To Be Built

The frontend will provide:
1. **Submission Form** - Enter clinical data and trigger predictions
2. **Results View** - Display main + secondary diagnoses with confidence scores
3. **Feedback Interface** - Approve or edit predictions with comments
4. **Code Search** - Search ICD-10 codes and view usage statistics
5. **Case Management** - Browse and review past cases and predictions

## Performance

- **Accuracy**: High-quality predictions with detailed medical reasoning
- **Speed**: ~2 minutes per prediction
- **Scale**: Handles 38,769 ICD-10 codes
- **Tested**: Successfully predicted diagnosis for complex multi-morbidity cases

## Next Steps

1. Build Next.js frontend
2. Test with full patient dataset (48 cases)
3. Deploy to production
4. Gather user feedback from medical coders
5. Iterate on AI model based on correction data
