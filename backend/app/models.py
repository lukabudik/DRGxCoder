"""Pydantic models for API"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ===== REQUEST MODELS =====

class ClinicalInput(BaseModel):
    """Input for prediction"""
    pac_id: Optional[str] = None
    clinical_text: str = Field(..., min_length=10)
    biochemistry: Optional[str] = None
    hematology: Optional[str] = None
    microbiology: Optional[str] = None
    medication: Optional[str] = None


class CorrectedCode(BaseModel):
    """A single code correction"""
    action: str = Field(..., description="'added', 'removed', or 'modified'")
    code: str
    name: Optional[str] = None  # Optional for "removed" action
    original_code: Optional[str] = None  # For "modified" action


class FeedbackInput(BaseModel):
    """Input for prediction feedback"""
    validated_by: str = Field(..., min_length=1)
    feedback_type: str = Field(..., description="'approved' or 'rejected'")
    
    # Optional corrections (for rejected predictions)
    corrected_main_code: Optional[str] = None
    corrected_main_name: Optional[str] = None
    corrected_secondary: Optional[List[CorrectedCode]] = []
    
    # Optional single comment for entire feedback (approved or rejected)
    feedback_comment: Optional[str] = None


# ===== RESPONSE MODELS =====

class DiagnosisCode(BaseModel):
    """Single diagnosis code"""
    code: str
    name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class Step1Result(BaseModel):
    """Step 1 results"""
    selected_codes: List[str]
    reasoning: str


class Step2Result(BaseModel):
    """Step 2 results"""
    main_diagnosis: DiagnosisCode
    secondary_diagnoses: List[DiagnosisCode] = []


class PredictionResponse(BaseModel):
    """Complete prediction response"""
    prediction_id: str
    case_id: str
    
    # Step 1
    selected_codes: List[str]
    step1_reasoning: str
    
    # Step 2
    main_diagnosis: DiagnosisCode
    secondary_diagnoses: List[DiagnosisCode]
    
    # Metadata
    model_used: str
    processing_time: int  # milliseconds
    created_at: datetime


class CaseResponse(BaseModel):
    """Patient case response"""
    id: str
    pac_id: Optional[str]
    clinical_text: str
    biochemistry: Optional[str]
    hematology: Optional[str]
    microbiology: Optional[str]
    medication: Optional[str]
    created_at: datetime
    predictions_count: int


class CaseDetailResponse(CaseResponse):
    """Case with predictions"""
    predictions: List[PredictionResponse]


class PaginatedCases(BaseModel):
    """Paginated cases"""
    cases: List[CaseResponse]
    total: int
    page: int
    pages: int


class PredictionListItem(BaseModel):
    """Prediction in list view"""
    id: str
    case_id: str
    pac_id: Optional[str]
    main_code: str
    main_name: str
    main_confidence: float
    validated: bool
    created_at: datetime


class PaginatedPredictions(BaseModel):
    """Paginated predictions"""
    predictions: List[PredictionListItem]
    total: int
    page: int
    pages: int


class CodeSearchResult(BaseModel):
    """Search result for diagnosis codes"""
    code: str
    name: str
    chapter: str
    category: Optional[str]


class CodeDetailResponse(BaseModel):
    """Detailed code information with usage statistics"""
    code: str
    name: str
    chapter: str
    category: Optional[str]
    usage_count: int  # How many times this code appears
    predictions: List[PredictionListItem]
    total_predictions: int
    page: int
    pages: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database: str
