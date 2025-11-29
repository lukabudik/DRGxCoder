"""FastAPI main application"""

from typing import List
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.models import (
    ClinicalInput,
    PredictionResponse,
    CaseResponse,
    CaseDetailResponse,
    PaginatedCases,
    PaginatedPredictions,
    PredictionListItem,
    CodeSearchResult,
    CodeDetailResponse,
    FeedbackInput,
    HealthResponse,
    DiagnosisCode,
)
from app.database import (
    connect_db,
    disconnect_db,
    find_or_create_patient,
    create_case,
    get_case,
    list_cases,
    create_prediction,
    get_prediction,
    list_predictions,
    submit_prediction_feedback,
    search_codes,
    get_code_by_code,
    get_predictions_by_code,
)
from app.services import predict_diagnosis
from app.parsers import parse_medical_xml
from app.utils import calculate_age
from app.core.config import settings


# ===== LIFESPAN =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting AutoCode AI API...")
    await connect_db()
    yield
    # Shutdown
    logger.info("Shutting down...")
    await disconnect_db()


# ===== APP INITIALIZATION =====

app = FastAPI(
    title="AutoCode AI API",
    description="Automatic ICD-10 diagnosis code prediction using LLM",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== ROUTES =====

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "database": "connected",
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "database": "connected",
    }


# ===== PREDICTION =====

@app.post("/api/predict/xml")
async def create_prediction_from_xml(xml_content: str = Body(..., media_type="text/plain")):
    """
    Create prediction from XML file
    
    Expects raw XML content as text/plain in request body
    
    1. Parses XML to extract demographics and clinical data
    2. Finds or creates patient
    3. Creates case linked to patient
    4. Runs 2-step prediction pipeline with patient context
    5. Saves prediction
    """
    try:
        logger.info("Received XML upload")
        
        # Step 1: Parse XML
        parsed = await parse_medical_xml(xml_content)
        logger.info(f"Parsed XML for patient: {parsed.first_name} {parsed.last_name}")
        
        # Step 2: Find or create patient
        patient = await find_or_create_patient(
            birth_number=parsed.birth_number,
            first_name=parsed.first_name,
            last_name=parsed.last_name,
            date_of_birth=parsed.date_of_birth,
            sex=parsed.sex,
            country_of_residence=parsed.country_of_residence,
        )
        
        # Calculate patient age
        patient_age = calculate_age(patient.dateOfBirth)
        logger.info(f"Patient: {patient.id}, Age: {patient_age}, Sex: {patient.sex}")
        
        # Step 3: Create case linked to patient
        case_id = await create_case(
            patient_id=patient.id,
            pac_id=parsed.pac_id,
            hospital_patient_id=parsed.patient_id,
            clinical_text=parsed.clinical_text,
            biochemistry=parsed.biochemistry,
            hematology=parsed.hematology,
            microbiology=parsed.microbiology,
            medication=parsed.medication,
            raw_xml=parsed.raw_xml,
        )
        
        # Step 4: Run prediction with patient context
        result = await predict_diagnosis(
            clinical_text=parsed.clinical_text,
            patient_age=patient_age,
            patient_sex=patient.sex,
            pac_id=parsed.pac_id,
            biochemistry=parsed.biochemistry,
            hematology=parsed.hematology,
            microbiology=parsed.microbiology,
            medication=parsed.medication,
        )
        
        # Step 5: Save prediction
        main_diag = result["step2"]["main_diagnosis"]
        secondary_diags = result["step2"].get("secondary_diagnoses", [])
        
        prediction_id = await create_prediction(
            case_id=case_id,
            selected_codes=result["step1"]["selected_codes"],
            step1_reasoning=result["step1"]["reasoning"],
            main_code=main_diag["code"],
            main_name=main_diag["name"],
            main_confidence=main_diag["confidence"],
            main_reasoning=main_diag.get("reasoning"),
            secondary_codes=secondary_diags,
            model_used=result["model_used"],
            processing_time=result["processing_time"],
        )
        
        # Get prediction with created_at
        pred = await get_prediction(prediction_id)
        
        return PredictionResponse(
            prediction_id=prediction_id,
            case_id=case_id,
            selected_codes=result["step1"]["selected_codes"],
            step1_reasoning=result["step1"]["reasoning"],
            main_diagnosis=DiagnosisCode(**main_diag),
            secondary_diagnoses=[DiagnosisCode(**d) for d in secondary_diags],
            model_used=result["model_used"],
            processing_time=result["processing_time"],
            created_at=pred.createdAt,
        )
        
    except ValueError as e:
        logger.error(f"XML parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid XML: {str(e)}")
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict", response_model=PredictionResponse)
async def create_prediction_endpoint(input: ClinicalInput):
    """
    Create new prediction from structured input (legacy/testing)
    
    Note: Use /api/predict/xml for production XML uploads
    """
    try:
        # For legacy/testing: create dummy patient if needed
        # In production, this endpoint might be deprecated
        logger.warning("Using legacy /api/predict endpoint - consider using /api/predict/xml")
        
        # Create minimal patient (no demographics)
        from datetime import datetime
        patient = await find_or_create_patient(
            birth_number=input.pac_id or "UNKNOWN",
            first_name="Unknown",
            last_name="Patient",
            date_of_birth=datetime(1970, 1, 1),
            sex="U",
        )
        
        # Create case
        case_id = await create_case(
            patient_id=patient.id,
            clinical_text=input.clinical_text,
            pac_id=input.pac_id,
            biochemistry=input.biochemistry,
            hematology=input.hematology,
            microbiology=input.microbiology,
            medication=input.medication,
        )
        
        # Run prediction (without patient context)
        result = await predict_diagnosis(
            clinical_text=input.clinical_text,
            pac_id=input.pac_id,
            biochemistry=input.biochemistry,
            hematology=input.hematology,
            microbiology=input.microbiology,
            medication=input.medication,
        )
        
        # Save prediction
        main_diag = result["step2"]["main_diagnosis"]
        secondary_diags = result["step2"].get("secondary_diagnoses", [])
        
        prediction_id = await create_prediction(
            case_id=case_id,
            selected_codes=result["step1"]["selected_codes"],
            step1_reasoning=result["step1"]["reasoning"],
            main_code=main_diag["code"],
            main_name=main_diag["name"],
            main_confidence=main_diag["confidence"],
            main_reasoning=main_diag.get("reasoning"),
            secondary_codes=secondary_diags,
            model_used=result["model_used"],
            processing_time=result["processing_time"],
        )
        
        # Get prediction with created_at
        pred = await get_prediction(prediction_id)
        
        return PredictionResponse(
            prediction_id=prediction_id,
            case_id=case_id,
            selected_codes=result["step1"]["selected_codes"],
            step1_reasoning=result["step1"]["reasoning"],
            main_diagnosis=DiagnosisCode(**main_diag),
            secondary_diagnoses=[DiagnosisCode(**d) for d in secondary_diags],
            model_used=result["model_used"],
            processing_time=result["processing_time"],
            created_at=pred.createdAt,
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== CASES =====

@app.get("/api/cases", response_model=PaginatedCases)
async def get_cases(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
):
    """List all cases with pagination and search"""
    try:
        result = await list_cases(page=page, limit=limit, search=search)
        
        cases = [
            CaseResponse(
                id=case.id,
                pac_id=case.pacId,
                clinical_text=case.clinicalText,
                biochemistry=case.biochemistry,
                hematology=case.hematology,
                microbiology=case.microbiology,
                medication=case.medication,
                created_at=case.createdAt,
                predictions_count=len(case.predictions),
            )
            for case in result["cases"]
        ]
        
        return PaginatedCases(
            cases=cases,
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
        
    except Exception as e:
        logger.error(f"Error listing cases: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cases/{case_id}", response_model=CaseDetailResponse)
async def get_case_detail(case_id: str):
    """Get case with all predictions"""
    try:
        case = await get_case(case_id)
        
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        predictions = [
            PredictionResponse(
                prediction_id=pred.id,
                case_id=case.id,
                selected_codes=pred.selectedCodes,
                step1_reasoning=pred.step1Reasoning or "",
                main_diagnosis=DiagnosisCode(
                    code=pred.mainCode,
                    name=pred.mainName,
                    confidence=pred.mainConfidence,
                    reasoning=pred.mainReasoning,
                ),
                secondary_diagnoses=[DiagnosisCode(**d) for d in pred.secondaryCodes],
                model_used=pred.modelUsed,
                processing_time=pred.processingTime,
                created_at=pred.createdAt,
            )
            for pred in case.predictions
        ]
        
        return CaseDetailResponse(
            id=case.id,
            pac_id=case.pacId,
            clinical_text=case.clinicalText,
            biochemistry=case.biochemistry,
            hematology=case.hematology,
            microbiology=case.microbiology,
            medication=case.medication,
            created_at=case.createdAt,
            predictions_count=len(predictions),
            predictions=predictions,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting case: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== PREDICTIONS =====

@app.get("/api/predictions", response_model=PaginatedPredictions)
async def get_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    case_id: str = Query(None),
    validated: bool = Query(None),
):
    """List predictions with filters"""
    try:
        result = await list_predictions(
            page=page,
            limit=limit,
            case_id=case_id,
            validated=validated,
        )
        
        predictions = [
            PredictionListItem(
                id=pred.id,
                case_id=pred.caseId,
                pac_id=pred.case.pacId if pred.case else None,
                main_code=pred.mainCode,
                main_name=pred.mainName,
                main_confidence=pred.mainConfidence,
                validated=pred.validated,
                created_at=pred.createdAt,
            )
            for pred in result["predictions"]
        ]
        
        return PaginatedPredictions(
            predictions=predictions,
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
        
    except Exception as e:
        logger.error(f"Error listing predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predictions/{prediction_id}", response_model=PredictionResponse)
async def get_prediction_detail(prediction_id: str):
    """Get prediction details"""
    try:
        pred = await get_prediction(prediction_id)
        
        if not pred:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        return PredictionResponse(
            prediction_id=pred.id,
            case_id=pred.caseId,
            selected_codes=pred.selectedCodes,
            step1_reasoning=pred.step1Reasoning or "",
            main_diagnosis=DiagnosisCode(
                code=pred.mainCode,
                name=pred.mainName,
                confidence=pred.mainConfidence,
                reasoning=pred.mainReasoning,
            ),
            secondary_diagnoses=[DiagnosisCode(**d) for d in pred.secondaryCodes],
            model_used=pred.modelUsed,
            processing_time=pred.processingTime,
            created_at=pred.createdAt,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predictions/{prediction_id}/feedback")
async def submit_feedback_endpoint(
    prediction_id: str,
    feedback: FeedbackInput,
):
    """
    Submit feedback on a prediction
    
    - approved: Coder agrees with prediction, no changes needed
    - rejected: Coder made corrections to improve accuracy
    - Both can include optional comments and rating
    """
    try:
        # Validate feedback type
        if feedback.feedback_type not in ["approved", "rejected"]:
            raise HTTPException(400, "feedback_type must be 'approved' or 'rejected'")
        
        # Build corrections object if rejected
        corrections = None
        if feedback.feedback_type == "rejected":
            corrections = {
                "corrected_main": {
                    "code": feedback.corrected_main_code,
                    "name": feedback.corrected_main_name,
                } if feedback.corrected_main_code else None,
                "corrected_secondary": [c.dict() for c in feedback.corrected_secondary] if feedback.corrected_secondary else [],
            }
        
        pred = await submit_prediction_feedback(
            prediction_id=prediction_id,
            validated_by=feedback.validated_by,
            feedback_type=feedback.feedback_type,
            corrections=corrections,
            feedback_comment=feedback.feedback_comment,
        )
        
        return {
            "id": pred.id,
            "validated": pred.validated,
            "feedback_type": pred.feedbackType,
            "validated_by": pred.validatedBy,
            "validated_at": pred.validatedAt,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== CODE SEARCH =====

@app.get("/api/codes/search", response_model=List[CodeSearchResult])
async def search_diagnosis_codes(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Search diagnosis codes"""
    try:
        codes = await search_codes(query=q, limit=limit)
        
        return [
            CodeSearchResult(
                code=code["code"],
                name=code["name"],
                chapter=code["chapter"],
                category=code["category"],
            )
            for code in codes
        ]
        
    except Exception as e:
        logger.error(f"Error searching codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/codes/{code}", response_model=CodeDetailResponse)
async def get_code_details(
    code: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get diagnosis code details with all predictions that use this code
    
    Shows where this code appears as either main or secondary diagnosis
    """
    try:
        # Get code details
        code_obj = await get_code_by_code(code)
        if not code_obj:
            raise HTTPException(status_code=404, detail="Diagnosis code not found")
        
        # Get all predictions using this code
        result = await get_predictions_by_code(code, page=page, limit=limit)
        
        predictions = [
            PredictionListItem(
                id=pred.id,
                case_id=pred.caseId,
                pac_id=pred.case.pacId if pred.case else None,
                main_code=pred.mainCode,
                main_name=pred.mainName,
                main_confidence=pred.mainConfidence,
                validated=pred.validated,
                created_at=pred.createdAt,
            )
            for pred in result["predictions"]
        ]
        
        return CodeDetailResponse(
            code=code_obj.code,
            name=code_obj.name,
            chapter=code_obj.chapter,
            category=code_obj.category,
            usage_count=result["total"],
            predictions=predictions,
            total_predictions=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting code details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
