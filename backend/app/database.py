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


async def validate_codes(codes: List[str]) -> List[Dict]:
    """
    Validate if codes exist in database and return official names
    
    Args:
        codes: List of diagnosis codes to validate
        
    Returns:
        List of dicts with: {code, valid, name, error}
    """
    results = []
    
    for code in codes:
        db_code = await db.diagnosiscode.find_unique(
            where={"code": code}
        )
        
        if db_code:
            results.append({
                "code": code,
                "valid": True,
                "name": db_code.name,
                "error": None
            })
        else:
            results.append({
                "code": code,
                "valid": False,
                "name": None,
                "error": "Code not found in database"
            })
            logger.warning(f"Invalid code: {code}")
    
    return results


async def enrich_code(code: str) -> Dict:
    """
    Get official name for a diagnosis code from database
    
    Args:
        code: Diagnosis code
        
    Returns:
        Dict with code and name, or None if not found
    """
    db_code = await db.diagnosiscode.find_unique(
        where={"code": code}
    )
    
    if db_code:
        return {"code": db_code.code, "name": db_code.name}
    else:
        logger.warning(f"Code not found in DB: {code}")
        return None


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


# ===== PATIENTS =====

async def find_or_create_patient(
    birth_number: str,
    first_name: str,
    last_name: str,
    date_of_birth,  # datetime
    sex: str,
    country_of_residence: Optional[str] = None,
):
    """
    Find existing patient by birth number or create new one
    Returns: Patient object
    """
    # Try to find existing patient by birth number (unique identifier)
    patient = await db.patient.find_unique(
        where={"birthNumber": birth_number}
    )
    
    if patient:
        logger.info(f"Found existing patient: {patient.id} ({patient.firstName} {patient.lastName})")
        
        # Update demographics if they've changed (rare, but possible for typos/corrections)
        needs_update = False
        update_data = {}
        
        if patient.firstName != first_name:
            update_data["firstName"] = first_name
            needs_update = True
        if patient.lastName != last_name:
            update_data["lastName"] = last_name
            needs_update = True
        if patient.dateOfBirth != date_of_birth:
            update_data["dateOfBirth"] = date_of_birth
            needs_update = True
        if patient.sex != sex:
            update_data["sex"] = sex
            needs_update = True
        if country_of_residence and patient.countryOfResidence != country_of_residence:
            update_data["countryOfResidence"] = country_of_residence
            needs_update = True
        
        if needs_update:
            patient = await db.patient.update(
                where={"id": patient.id},
                data=update_data
            )
            logger.info(f"Updated patient demographics: {patient.id}")
        
        return patient
    
    # Create new patient
    patient = await db.patient.create(
        data={
            "birthNumber": birth_number,
            "firstName": first_name,
            "lastName": last_name,
            "dateOfBirth": date_of_birth,
            "sex": sex,
            "countryOfResidence": country_of_residence,
        }
    )
    logger.info(f"Created new patient: {patient.id} ({first_name} {last_name})")
    return patient


async def get_patient(patient_id: str):
    """Get patient by ID with all their cases"""
    patient = await db.patient.find_unique(
        where={"id": patient_id},
        include={"cases": True}
    )
    return patient


async def get_patient_by_birth_number(birth_number: str):
    """Get patient by birth number"""
    patient = await db.patient.find_unique(
        where={"birthNumber": birth_number},
        include={"cases": True}
    )
    return patient


# ===== PATIENT CASES =====

async def create_case(
    patient_id: str,
    clinical_text: str,
    pac_id: Optional[str] = None,
    hospital_patient_id: Optional[str] = None,
    admission_date = None,
    discharge_date = None,
    biochemistry: Optional[str] = None,
    hematology: Optional[str] = None,
    microbiology: Optional[str] = None,
    medication: Optional[str] = None,
    raw_xml: Optional[str] = None,
) -> str:
    """Create a new patient case, returns case ID"""
    case = await db.patientcase.create(
        data={
            "patientId": patient_id,
            "pacId": pac_id,
            "hospitalPatientId": hospital_patient_id,
            "admissionDate": admission_date,
            "dischargeDate": discharge_date,
            "clinicalText": clinical_text,
            "biochemistry": biochemistry,
            "hematology": hematology,
            "microbiology": microbiology,
            "medication": medication,
            "rawXml": raw_xml,
        }
    )
    logger.info(f"Created case: {case.id} for patient: {patient_id}")
    return case.id


async def get_case(case_id: str):
    """Get case by ID with patient and predictions"""
    case = await db.patientcase.find_unique(
        where={"id": case_id},
        include={
            "patient": True,
            "predictions": True
        }
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
                {"patient": {
                    "OR": [
                        {"firstName": {"contains": search, "mode": "insensitive"}},
                        {"lastName": {"contains": search, "mode": "insensitive"}},
                        {"birthNumber": {"contains": search}},
                    ]
                }},
            ]
        }
    
    cases = await db.patientcase.find_many(
        where=where,
        skip=skip,
        take=limit,
        order={"createdAt": "desc"},
        include={
            "patient": True,
            "predictions": True
        }
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
    status: str = "completed",  # Default to completed for backward compatibility
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
            "status": status,
        }
    )
    logger.info(f"Created prediction: {prediction.id} with status: {status}")
    return prediction.id


async def get_prediction(prediction_id: str):
    """Get prediction by ID with full nested case and patient data"""
    prediction = await db.prediction.find_unique(
        where={"id": prediction_id},
        include={
            "case": {
                "include": {
                    "patient": True
                }
            }
        }
    )
    return prediction


async def list_predictions(
    page: int = 1,
    limit: int = 20,
    case_id: Optional[str] = None,
    validated: Optional[bool] = None,
):
    """List predictions with pagination and filters - includes nested case and patient data"""
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
        include={
            "case": {
                "include": {
                    "patient": True
                }
            }
        }
    )
    
    total = await db.prediction.count(where=where)
    
    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


async def update_prediction_status(prediction_id: str, status: str):
    """Update prediction status (processing, completed, failed)"""
    prediction = await db.prediction.update(
        where={"id": prediction_id},
        data={"status": status}
    )
    logger.info(f"Updated prediction {prediction_id} status to: {status}")
    return prediction


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
