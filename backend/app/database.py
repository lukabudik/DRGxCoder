"""Database operations using Prisma"""

from typing import List, Dict, Optional
from prisma import Prisma
from loguru import logger


# Global Prisma client
db = Prisma()


async def connect_db():
    """Connect to database"""
    if not db.is_connected():
        await db.connect()
        logger.info("Database connected")


async def disconnect_db():
    """Disconnect from database"""
    if db.is_connected():
        await db.disconnect()
        logger.info("Database disconnected")


# ===== DIAGNOSIS CODES =====

async def get_all_three_char_codes() -> List[Dict]:
    """Get all 3-character top-level ICD-10 codes (A00, I21, etc.)"""
    codes = await db.diagnosiscode.find_many()
    
    three_char = []
    for code in codes:
        if len(code.code) == 3 and '.' not in code.code:
            three_char.append({
                "code": code.code,
                "name": code.name,
                "chapter": code.chapter,
                "category": code.category or "General"
            })
    
    logger.info(f"Loaded {len(three_char)} 3-char codes")
    return three_char


async def get_codes_by_prefix(prefixes: List[str]) -> List[Dict]:
    """
    Get all codes that start with given prefixes
    Args:
        prefixes: List of 3-char codes like ["I46", "G93"]
    """
    all_codes = []
    
    for prefix in prefixes:
        codes = await db.diagnosiscode.find_many(
            where={"code": {"startswith": prefix}}
        )
        for code in codes:
            all_codes.append({
                "code": code.code,
                "name": code.name,
                "category": code.category or "General",
                "parent": prefix
            })
    
    logger.info(f"Loaded {len(all_codes)} codes for prefixes: {prefixes}")
    return all_codes


async def get_code_by_code(code: str):
    """Get a specific diagnosis code by its code"""
    code_obj = await db.diagnosiscode.find_first(
        where={"code": code}
    )
    return code_obj


async def search_codes(query: str, limit: int = 50) -> List[Dict]:
    """Search diagnosis codes by query string"""
    codes = await db.diagnosiscode.find_many(
        where={
            "OR": [
                {"code": {"contains": query}},
                {"name": {"contains": query}},
            ]
        },
        take=limit,
        order={"code": "asc"}
    )
    
    return [
        {
            "code": code.code,
            "name": code.name,
            "chapter": code.chapter,
            "category": code.category
        }
        for code in codes
    ]


async def get_predictions_by_code(code: str, page: int = 1, limit: int = 20):
    """Get all predictions that use a specific diagnosis code (main or secondary)"""
    skip = (page - 1) * limit
    
    # Search in both mainCode and secondaryCodes JSON
    # For mainCode it's direct match
    # For secondaryCodes we need to search in the JSON array
    predictions = await db.prediction.find_many(
        where={
            "OR": [
                {"mainCode": code},
                {"secondaryCodes": {"string_contains": f'"{code}"'}},  # Search in JSON
            ]
        },
        skip=skip,
        take=limit,
        order={"createdAt": "desc"},
        include={"case": True}
    )
    
    total = await db.prediction.count(
        where={
            "OR": [
                {"mainCode": code},
                {"secondaryCodes": {"string_contains": f'"{code}"'}},
            ]
        }
    )
    
    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


# ===== PATIENT CASES =====

async def create_case(
    clinical_text: str,
    pac_id: Optional[str] = None,
    biochemistry: Optional[str] = None,
    hematology: Optional[str] = None,
    microbiology: Optional[str] = None,
    medication: Optional[str] = None,
) -> str:
    """Create a new patient case, returns case ID"""
    case = await db.patientcase.create(
        data={
            "pacId": pac_id,
            "clinicalText": clinical_text,
            "biochemistry": biochemistry,
            "hematology": hematology,
            "microbiology": microbiology,
            "medication": medication,
        }
    )
    logger.info(f"Created case: {case.id}")
    return case.id


async def get_case(case_id: str):
    """Get case by ID with predictions"""
    case = await db.patientcase.find_unique(
        where={"id": case_id},
        include={"predictions": True}
    )
    return case


async def list_cases(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None
):
    """List cases with pagination and search"""
    skip = (page - 1) * limit
    
    where = {}
    if search:
        where = {
            "OR": [
                {"pacId": {"contains": search, "mode": "insensitive"}},
                {"clinicalText": {"contains": search, "mode": "insensitive"}},
            ]
        }
    
    cases = await db.patientcase.find_many(
        where=where,
        skip=skip,
        take=limit,
        order={"createdAt": "desc"},
        include={"predictions": True}
    )
    
    total = await db.patientcase.count(where=where)
    
    return {
        "cases": cases,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


# ===== PREDICTIONS =====

async def create_prediction(
    case_id: str,
    selected_codes: List[str],
    step1_reasoning: str,
    main_code: str,
    main_name: str,
    main_confidence: float,
    main_reasoning: str,
    secondary_codes: List[Dict],
    model_used: str,
    processing_time: int,
) -> str:
    """Create a new prediction, returns prediction ID"""
    import json
    
    prediction = await db.prediction.create(
        data={
            "caseId": case_id,
            "selectedCodes": json.dumps(selected_codes),  # Convert list to JSON string
            "step1Reasoning": step1_reasoning,
            "mainCode": main_code,
            "mainName": main_name,
            "mainConfidence": main_confidence,
            "mainReasoning": main_reasoning,
            "secondaryCodes": json.dumps(secondary_codes),  # Convert list to JSON string
            "modelUsed": model_used,
            "processingTime": processing_time,
        }
    )
    logger.info(f"Created prediction: {prediction.id}")
    return prediction.id


async def get_prediction(prediction_id: str):
    """Get prediction by ID with case data"""
    prediction = await db.prediction.find_unique(
        where={"id": prediction_id},
        include={"case": True}
    )
    return prediction


async def list_predictions(
    page: int = 1,
    limit: int = 20,
    case_id: Optional[str] = None,
    validated: Optional[bool] = None,
):
    """List predictions with pagination and filters"""
    skip = (page - 1) * limit
    
    where = {}
    if case_id:
        where["caseId"] = case_id
    if validated is not None:
        where["validated"] = validated
    
    predictions = await db.prediction.find_many(
        where=where,
        skip=skip,
        take=limit,
        order={"createdAt": "desc"},
        include={"case": True}
    )
    
    total = await db.prediction.count(where=where)
    
    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


async def submit_prediction_feedback(
    prediction_id: str,
    validated_by: str,
    feedback_type: str,
    corrections: Optional[Dict] = None,
    feedback_comment: Optional[str] = None,
):
    """Submit feedback on a prediction (approve or reject with corrections)"""
    from datetime import datetime
    import json
    
    update_data = {
        "validated": True,
        "validatedAt": datetime.utcnow(),
        "validatedBy": validated_by,
        "feedbackType": feedback_type,
        "feedbackComment": feedback_comment,
    }
    
    # Only set corrections if provided (allow null for approved)
    if corrections is not None:
        update_data["corrections"] = json.dumps(corrections)
    
    prediction = await db.prediction.update(
        where={"id": prediction_id},
        data=update_data
    )
    logger.info(f"Feedback submitted for prediction {prediction_id}: {feedback_type}")
    return prediction
