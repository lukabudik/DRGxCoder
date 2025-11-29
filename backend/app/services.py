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
    
    prompt = f"""# Dostupné kódy nejvyšší úrovně (3-znakové kódy MKN-10)
{codes_text}

# Klinické hodnocení
{clinical_text}
"""
    
    if biochemistry:
        prompt += f"\n# Biochemie\n{biochemistry}\n"
    
    if hematology:
        prompt += f"\n# Hematologie\n{hematology}\n"
    
    if microbiology:
        prompt += f"\n# Mikrobiologie\n{microbiology}\n"
    
    if medication:
        prompt += f"\n# Medikace\n{medication}\n"
    
    prompt += """
# Tvůj úkol
1. Zamysli se hluboce nad pacientovými daty (klinický text, biochemie, hematologie, mikrobiologie, medikace)
2. Identifikuj HLAVNÍ diagnózu (primární důvod hospitalizace) a VEDLEJŠÍ diagnózy
3. Vyber 5-15 kódů nejvyšší úrovně (3-znakové), které odpovídají těmto diagnózám
4. Zaměř se na nejspecifičtější dostupné kódy
5. Uveď stručné zdůvodnění výběru

# Výstupní formát (JSON)
{
    "selected_codes": ["I21", "I50", "J18", "N17", "G93"],
    "reasoning": "Pacient má akutní infarkt myokardu (I21), srdeční selhání (I50), pneumonii (J18), akutní selhání ledvin (N17) a edém mozku (G93)"
}
"""
    
    system_prompt = """Jsi expert na kódování diagnóz pro DRG (Diagnosis Related Groups) v českém zdravotnictví podle metodiky MKN-10.

Tvým úkolem je analyzovat klinická data pacienta a vybrat relevantní kódy nejvyšší úrovně (3-znakové kódy MKN-10).

Metodika:
- Hlavním podkladem pro kódování je zdravotní dokumentace o hospitalizaci
- Zaměř se na HLAVNÍ diagnózu (primárně odpovědná za potřebu léčby) a VEDLEJŠÍ diagnózy
- Vyber 5-15 nejrelevantnějších kódů nejvyšší úrovně
- Buď specifický ale komplexní"""
    
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
    patient_age: int = None,
    patient_sex: str = None,
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
    
    prompt = f"""# Dostupné kódy MKN-10
{codes_text}

# Kompletní klinická data pacienta
"""
    
    # Add patient demographics if available
    if patient_age and patient_sex:
        prompt += f"""
## Informace o pacientovi
- Věk: {patient_age} let
- Pohlaví: {patient_sex}
"""
    
    prompt += f"""
## Klinické hodnocení
{clinical_text}
"""
    
    if biochemistry:
        prompt += f"\n## Biochemie\n{biochemistry[:3000]}\n"
    
    if hematology:
        prompt += f"\n## Hematologie\n{hematology[:2000]}\n"
    
    if microbiology:
        prompt += f"\n## Mikrobiologie\n{microbiology[:2000]}\n"
    
    if medication:
        prompt += f"\n## Medikace\n{medication[:1000]}\n"
    
    prompt += """
# Pravidla kódování diagnóz pro DRG

## Hlavní diagnóza
Hlavní diagnóza označuje stav, který byl na konci období léčebné péče určen jako primárně odpovědný za potřebu nemocného léčit se nebo být vyšetřován.
Ve výjimečných případech, kdy existuje více takových stavů, označí se jako hlavní ten, který je nejvíce zodpovědný za čerpání prostředků.

## Vedlejší diagnózy
Onemocnění nebo potíže existující současně s hlavní diagnózou nebo se vyvíjející až během epizody léčebné péče, které mají prokazatelně vliv na péči o pacienta.
Ovlivňují léčbu pacienta takovým způsobem, že je potřebný kterýkoliv z uvedených faktorů:
1. Klinické vyšetření
2. Terapeutický zásah nebo léčba
3. Diagnostické výkony
4. Zvýšená ošetřovatelská péče a/nebo monitorování

## Směrnice pro chemoterapii a radioterapii
- Je-li účelem hospitalizace provedení chemoterapie nebo radioterapie pro maligní novotvar, stanovte chemoterapii Z51.1 nebo radioterapii Z51.0 jako hlavní diagnózu
- Jestliže je během hospitalizace provedeno chirurgické odstranění nádoru následované chemoterapií nebo radioterapií, stanovte maligní novotvar jako hlavní diagnózu
- Jestliže je pacient hospitalizován k provedení chemoterapeutického nebo radioterapeutického cyklu a během hospitalizace dojde ke komplikacím, uveďte jako hlavní diagnózu chemoterapii Z51.1 nebo radioterapii Z51.0 následovanou uvedenými komplikacemi

# Tvůj úkol
1. Zamysli se hluboce nad všemi pacientovými daty
2. Urči HLAVNÍ DIAGNÓZU (kód MKN-10 a název)
3. Uveď důvod pro výběr hlavní diagnózy a odhadni pravděpodobnost správnosti (0.0-1.0)
4. Navrhni další potenciální hlavní diagnózy, pokud existují
5. Urči VEDLEJŠÍ DIAGNÓZY (maximálně 14)
6. Pro každou vedlejší diagnózu uveď důvod (vždy také jak se vázala k přímo k průběhu léčby a potenciální důvod proč by se nemusela uznat) a odhadni pravděpodobnost

# Výstupní formát (JSON)
{
    "main_diagnosis": {
        "code": "I460",
        "name": "Srdeční zástava s úspěšnou resuscitací",
        "confidence": 0.95,
        "reasoning": "Pacient byl přijat s náhlou srdeční zástavou, úspěšná resuscitace po 8 minutách. Elevace troponinu potvrzuje srdeční příhodu jako primární důvod hospitalizace."
    },
    "other_potential_main_diagnoses": [
        {
            "code": "I219",
            "name": "Akutní infarkt myokardu, nespecifikovaný",
            "confidence": 0.30,
            "reasoning": "Elevace troponinu naznačuje možný infarkt, ale primární příčinou hospitalizace byla srdeční zástava"
        }
    ],
    "secondary_diagnoses": [
        {
            "code": "G931",
            "name": "Anoxické poškození mozku",
            "confidence": 0.87,
            "reasoning": "CT prokázalo anoxické poškození mozku po srdeční zástavě. Vyžadovalo zvýšenou neurologickou péči a monitorování. Mohlo by být zpochybněno pokud by nebylo jasně dokumentováno v CT nálezu."
        }
    ]
}
"""
    
    system_prompt = """Jsi expert na kódování diagnóz pro DRG (Diagnosis Related Groups) v českém zdravotnictví.
Tvým úkolem je analyzovat klinická data pacienta a určit hlavní diagnózu a vedlejší diagnózy podle metodiky MKN-10 a pravidel pro DRG.

Metodika kódování diagnóz určuje Instrukční příručka MKN-10 a úvody abecedního a tabelárního seznamu MKN-10.

Hlavním podkladem pro kódování je zdravotní dokumentace o hospitalizaci. Obsah propouštěcí zprávy musí mít oporu v ostatní dokumentaci (výsledky vyšetření, operační protokol, denní záznamy, atd.).

Tvá úloha:
- Vyber NEJSPECIFIČTĚJŠÍ a NEJPŘESNĚJŠÍ kódy z poskytnutého seznamu
- Vždy zvol hlavní diagnózu (primární důvod hospitalizace) a relevantní vedlejší diagnózy
- Poskytni detailní zdůvodnění pro každý výběr
- Odhadni pravděpodobnost správnosti každého kódu"""
    
    response = await llm.generate_json(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.2,
        max_tokens=8000,
    )
    
    if "main_diagnosis" not in response:
        raise ValueError("LLM response missing 'main_diagnosis' field")
    
    main = response["main_diagnosis"]
    other_potential = response.get("other_potential_main_diagnoses", [])
    secondary = response.get("secondary_diagnoses", [])
    
    logger.info(f"Step 2: Main={main.get('code')}, Other potential={len(other_potential)}, Secondary={len(secondary)}")
    
    return response


# ===== COMPLETE PREDICTION PIPELINE =====

async def predict_diagnosis(
    clinical_text: str,
    patient_age: int = None,
    patient_sex: str = None,
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
        patient_age, patient_sex,
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
