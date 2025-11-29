"""Prediction services - 2-step LLM pipeline"""

from typing import Dict, List
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger
import json

from app.core.config import settings
from app.database import get_all_three_char_codes, get_codes_by_prefix


# ===== LLM CLIENT =====

class LLMClient:
    """OpenRouter client using OpenAI SDK"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.model = settings.DEFAULT_LLM_MODEL
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def generate_json(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 8000,
    ) -> Dict:
        """Generate JSON response from LLM"""
        try:
            logger.info(f"Calling LLM: {self.model}")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            
            content = response.choices[0].message.content
            logger.info(f"Received response ({len(content)} chars)")
            
            if not content or content.strip() == "":
                raise ValueError("Empty response from LLM")
            
            return json.loads(content)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            logger.error(f"Response was: {content[:500]}")
            raise ValueError(f"Invalid JSON from LLM: {e}")
        except Exception as e:
            logger.error(f"LLM error: {e}")
            raise


# Global LLM client
llm = LLMClient()


# ===== STEP 1: TOP-LEVEL CODE SELECTION =====

async def step1_select_codes(
    clinical_text: str,
    biochemistry: str = None,
    hematology: str = None,
    microbiology: str = None,
    medication: str = None,
) -> Dict:
    """
    Step 1: Show LLM all 3-char codes (A00, I21, etc.) and select relevant ones
    
    Returns:
        {
            "selected_codes": ["I46", "G93", "N17", ...],
            "reasoning": "explanation"
        }
    """
    
    # Get all 3-char codes
    all_codes = await get_all_three_char_codes()
    
    # Build prompt
    codes_text = "\n".join([f"- {c['code']}: {c['name']}" for c in all_codes])
    
    prompt = f"""# Task
Analyze the clinical case and select the TOP-LEVEL ICD-10 codes (3-character codes) that are relevant.

# Available Top-Level Codes
{codes_text}

# Clinical Assessment
{clinical_text}
"""
    
    if biochemistry:
        prompt += f"\n# Biochemistry Results\n{biochemistry}\n"
    
    if hematology:
        prompt += f"\n# Hematology Results\n{hematology}\n"
    
    if microbiology:
        prompt += f"\n# Microbiology Results\n{microbiology}\n"
    
    if medication:
        prompt += f"\n# Medications\n{medication}\n"
    
    prompt += """
# Instructions
1. Identify the PRIMARY and SECONDARY diagnoses mentioned in the clinical text
2. Select 5-15 TOP-LEVEL codes that match these diagnoses
3. Choose the most specific codes available
4. Provide brief reasoning

# Output Format (JSON)
{
    "selected_codes": ["I21", "I50", "J18", "N17", "G93"],
    "reasoning": "Patient has acute MI (I21), heart failure (I50), pneumonia (J18), acute kidney injury (N17), and brain edema (G93)"
}
"""
    
    system_prompt = """You are a medical coding expert. Your task is to select the relevant TOP-LEVEL ICD-10 codes (3-character codes) for the given clinical case.
Focus on the PRIMARY and SECONDARY diagnoses mentioned in the clinical text.
Select 5-15 codes that are most relevant. Be specific but comprehensive."""
    
    response = await llm.generate_json(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.3,
        max_tokens=8000,
    )
    
    if "selected_codes" not in response:
        raise ValueError("LLM response missing 'selected_codes' field")
    
    logger.info(f"Step 1: Selected {len(response['selected_codes'])} codes: {response['selected_codes']}")
    
    return response


# ===== STEP 2: DETAILED CODE PREDICTION =====

async def step2_predict_codes(
    clinical_text: str,
    selected_codes: List[str],
    biochemistry: str = None,
    hematology: str = None,
    microbiology: str = None,
    medication: str = None,
) -> Dict:
    """
    Step 2: Expand selected codes to subcodes and predict specific diagnoses
    
    Returns:
        {
            "main_diagnosis": {
                "code": "I460",
                "name": "...",
                "confidence": 0.95,
                "reasoning": "..."
            },
            "secondary_diagnoses": [...]
        }
    """
    
    # Get all subcodes for selected codes
    expanded_codes = await get_codes_by_prefix(selected_codes)
    
    # Group by category for better prompt organization
    from collections import defaultdict
    by_category = defaultdict(list)
    for code in expanded_codes:
        category = code.get("category", "General")
        by_category[category].append(f"- {code['code']}: {code['name']}")
    
    # Format codes
    codes_text = ""
    for category, code_list in sorted(by_category.items()):
        codes_text += f"\n## {category}\n"
        for code_str in code_list[:50]:  # Limit per category
            codes_text += f"{code_str}\n"
    
    prompt = f"""# Task
Based on the clinical data, assign the MAIN diagnosis code and SECONDARY diagnosis codes.

# Available Codes
{codes_text}

# Complete Clinical Data

## Clinical Assessment
{clinical_text}
"""
    
    if biochemistry:
        prompt += f"\n## Biochemistry\n{biochemistry[:3000]}\n"
    
    if hematology:
        prompt += f"\n## Hematology\n{hematology[:2000]}\n"
    
    if microbiology:
        prompt += f"\n## Microbiology\n{microbiology[:2000]}\n"
    
    if medication:
        prompt += f"\n## Medication\n{medication[:1000]}\n"
    
    prompt += """
# Coding Rules
1. **Main diagnosis**: The PRIMARY reason for hospitalization/treatment
2. **Secondary diagnoses**: Relevant comorbidities or complications (max 5)
3. Choose the MOST SPECIFIC code available
4. Provide confidence score (0.0-1.0) for each code
5. Provide brief reasoning for each selection

# Output Format (JSON)
{
    "main_diagnosis": {
        "code": "I460",
        "name": "Srdeční zástava s úspěšnou resuscitací",
        "confidence": 0.95,
        "reasoning": "Patient presented with cardiac arrest, elevated troponin"
    },
    "secondary_diagnoses": [
        {
            "code": "G931",
            "name": "Anoxické poškození mozku",
            "confidence": 0.87,
            "reasoning": "CT showed anoxic brain damage"
        }
    ]
}
"""
    
    system_prompt = """You are a professional medical coder assigning ICD-10 diagnosis codes.
Your task is to select the MOST SPECIFIC and ACCURATE codes from the provided list.
Always choose the main diagnosis (primary reason for hospitalization) and relevant secondary diagnoses."""
    
    response = await llm.generate_json(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.2,
        max_tokens=8000,
    )
    
    if "main_diagnosis" not in response:
        raise ValueError("LLM response missing 'main_diagnosis' field")
    
    main = response["main_diagnosis"]
    secondary = response.get("secondary_diagnoses", [])
    
    logger.info(f"Step 2: Main={main.get('code')}, Secondary={len(secondary)}")
    
    return response


# ===== COMPLETE PREDICTION PIPELINE =====

async def predict_diagnosis(
    clinical_text: str,
    pac_id: str = None,
    biochemistry: str = None,
    hematology: str = None,
    microbiology: str = None,
    medication: str = None,
) -> Dict:
    """
    Complete 2-step prediction pipeline
    
    Returns full prediction result with timing
    """
    import time
    
    start = time.time()
    
    # Step 1: Select top-level codes
    step1_result = await step1_select_codes(
        clinical_text, biochemistry, hematology, microbiology, medication
    )
    
    step1_time = int((time.time() - start) * 1000)
    
    # Step 2: Predict specific codes
    step2_start = time.time()
    step2_result = await step2_predict_codes(
        clinical_text,
        step1_result["selected_codes"],
        biochemistry, hematology, microbiology, medication
    )
    
    step2_time = int((time.time() - step2_start) * 1000)
    total_time = int((time.time() - start) * 1000)
    
    return {
        "step1": step1_result,
        "step2": step2_result,
        "processing_time": total_time,
        "step1_time": step1_time,
        "step2_time": step2_time,
        "model_used": settings.DEFAULT_LLM_MODEL,
    }
