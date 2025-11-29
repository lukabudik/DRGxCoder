"""
Medical XML Parser

Combines rule-based extraction for structured data (demographics)
with LLM-based extraction for unstructured clinical text separation.
"""

import xml.etree.ElementTree as ET
from typing import Optional, Dict
from datetime import datetime
from dataclasses import dataclass
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
import json
from loguru import logger

from app.core.config import settings


@dataclass
class ParsedMedicalData:
    """Structured medical data extracted from XML"""
    # Demographics
    birth_number: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    date_of_birth: Optional[datetime]
    country_of_residence: Optional[str]
    sex: Optional[str]
    patient_id: Optional[str]
    pac_id: Optional[str]
    
    # Clinical data (LLM-separated)
    clinical_text: str
    biochemistry: str
    hematology: str
    microbiology: str
    medication: str
    
    # Raw XML for reference
    raw_xml: str


# XML namespaces for Czech medical data (DASTA format)
NAMESPACES = {
    'ds': 'urn:cz-mzcr:ns:dasta:ds4:ds_dasta',
    'dsip': 'urn:cz-mzcr:ns:dasta:ds4:ds_ip',
}


def extract_demographics(tree: ET.Element) -> Dict:
    """
    Extract patient demographics using XPath (rule-based)
    Fast and reliable for structured fields
    """
    demographics = {}
    
    try:
        # Birth number (rodné číslo)
        rodcis = tree.find('.//dsip:rodcis', NAMESPACES)
        demographics['birth_number'] = rodcis.text if rodcis is not None else None
        
        # First name
        jmeno = tree.find('.//dsip:jmeno', NAMESPACES)
        demographics['first_name'] = jmeno.text if jmeno is not None else None
        
        # Last name
        prijmeni = tree.find('.//dsip:prijmeni', NAMESPACES)
        demographics['last_name'] = prijmeni.text if prijmeni is not None else None
        
        # Date of birth
        dat_dn = tree.find('.//dsip:dat_dn', NAMESPACES)
        if dat_dn is not None and dat_dn.text:
            try:
                demographics['date_of_birth'] = datetime.strptime(dat_dn.text, '%Y-%m-%d')
            except ValueError:
                demographics['date_of_birth'] = None
        else:
            demographics['date_of_birth'] = None
        
        # Country of residence
        stat_pris = tree.find('.//dsip:stat_pris', NAMESPACES)
        demographics['country_of_residence'] = stat_pris.text if stat_pris is not None else None
        
        # Sex
        sex = tree.find('.//dsip:sex', NAMESPACES)
        demographics['sex'] = sex.text if sex is not None else None
        
        # Patient ID (internal hospital ID)
        ip = tree.find('.//dsip:ip', NAMESPACES)
        demographics['patient_id'] = ip.get('id_pac') if ip is not None else None
        
        # PAC ID (could be same as birth number or separate)
        demographics['pac_id'] = demographics['birth_number'] or demographics['patient_id']
        
    except Exception as e:
        logger.warning(f"Error extracting demographics: {e}")
    
    return demographics


def extract_medications(tree: ET.Element) -> str:
    """
    Extract medications using XPath (rule-based)
    Format: "DRUG1, DRUG2, DRUG3"
    """
    medications = []
    
    try:
        lez_elements = tree.findall('.//dsip:lez', NAMESPACES)
        for lez in lez_elements:
            drug_name = lez.get('nazev_lek')
            if drug_name:
                medications.append(drug_name)
    except Exception as e:
        logger.warning(f"Error extracting medications: {e}")
    
    return ', '.join(medications) if medications else ""


def extract_clinical_text_full(tree: ET.Element) -> str:
    """
    Extract full clinical text that needs to be separated by LLM
    """
    try:
        ptext = tree.find('.//dsip:ptext', NAMESPACES)
        if ptext is not None and ptext.text:
            return ptext.text.strip()
    except Exception as e:
        logger.warning(f"Error extracting clinical text: {e}")
    
    return ""


# LLM Client for XML parsing (reuses OpenRouter like services.py)
class XMLParserLLM:
    """OpenRouter client for clinical text separation"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        # Use fast lite model for XML parsing
        self.model = "google/gemini-2.5-flash-lite"
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def separate_sections(self, full_text: str) -> Dict[str, str]:
        """Separate mixed clinical text into structured categories"""
        
        system_prompt = """You are a medical data extraction system. 
You separate mixed clinical text into distinct categories: clinical narrative, biochemistry labs, hematology labs, and microbiology results.
Always return valid JSON with these exact 4 fields: clinical_text, biochemistry, hematology, microbiology."""
        
        user_prompt = f"""Separate this hospital discharge summary into 4 categories:

1. **clinical_text**: Medical narrative - patient history, symptoms, diagnosis, procedures, treatment course, outcomes, doctor's notes
2. **biochemistry**: Lab chemistry values - electrolytes (NA, KA, CL), glucose (GL), kidney function (KR, MO), liver function (BI, AS, AL), cardiac markers (BNP, TNI), blood gases (KPH, KPC, KPO)
3. **hematology**: Blood counts - WBC, RBC, HGB, PLT, coagulation (APTT, PT-INR, PT-R)
4. **microbiology**: Culture results, bacterial identification, antibiotic sensitivity

Rules:
- Keep all values and units intact
- Preserve Czech language text
- If section not found, return empty string ""
- Keep "|" separators in lab values

Clinical Text:
{full_text}

Return JSON:
{{
  "clinical_text": "...",
  "biochemistry": "...",
  "hematology": "...",
  "microbiology": "..."
}}"""
        
        try:
            logger.info(f"Separating clinical text with LLM ({self.model})")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,  # Low temp for consistency
                max_tokens=8000,
                response_format={"type": "json_object"},
            )
            
            content = response.choices[0].message.content
            separated = json.loads(content)
            
            # Validate required fields
            required_fields = ['clinical_text', 'biochemistry', 'hematology', 'microbiology']
            for field in required_fields:
                if field not in separated:
                    separated[field] = ""
            
            logger.info("Successfully separated clinical text")
            return separated
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            raise ValueError(f"Invalid JSON from LLM: {e}")
        except Exception as e:
            logger.error(f"LLM separation failed: {e}")
            # Fallback: return everything as clinical_text
            return {
                'clinical_text': full_text,
                'biochemistry': "",
                'hematology': "",
                'microbiology': "",
            }


# Global parser LLM instance
parser_llm = XMLParserLLM()


async def parse_medical_xml(xml_content: str) -> ParsedMedicalData:
    """
    Complete XML parsing pipeline:
    1. Extract demographics with XPath (fast, reliable)
    2. Extract medications with XPath
    3. Extract clinical text
    4. Separate clinical text with LLM (smart, flexible)
    
    Returns: ParsedMedicalData with all fields populated
    """
    try:
        # Parse XML
        tree = ET.fromstring(xml_content)
        
        # Step 1: Extract demographics (rule-based, fast)
        demographics = extract_demographics(tree)
        logger.info(f"Extracted demographics for patient: {demographics.get('first_name')} {demographics.get('last_name')}")
        
        # Step 2: Extract medications (rule-based, fast)
        medications = extract_medications(tree)
        logger.info(f"Extracted {len(medications.split(',')) if medications else 0} medications")
        
        # Step 3: Extract full clinical text
        full_clinical_text = extract_clinical_text_full(tree)
        
        if not full_clinical_text:
            raise ValueError("No clinical text found in XML")
        
        # Step 4: Separate sections with LLM (smart, flexible)
        logger.info("Separating clinical text sections with LLM...")
        separated_sections = await parser_llm.separate_sections(full_clinical_text)
        
        # Build final result
        parsed_data = ParsedMedicalData(
            # Demographics
            birth_number=demographics.get('birth_number'),
            first_name=demographics.get('first_name'),
            last_name=demographics.get('last_name'),
            date_of_birth=demographics.get('date_of_birth'),
            country_of_residence=demographics.get('country_of_residence'),
            sex=demographics.get('sex'),
            patient_id=demographics.get('patient_id'),
            pac_id=demographics.get('pac_id'),
            
            # Clinical data (LLM-separated)
            clinical_text=separated_sections['clinical_text'],
            biochemistry=separated_sections['biochemistry'],
            hematology=separated_sections['hematology'],
            microbiology=separated_sections['microbiology'],
            medication=medications,
            
            # Raw XML
            raw_xml=xml_content,
        )
        
        logger.info("Successfully parsed medical XML")
        return parsed_data
        
    except ET.ParseError as e:
        logger.error(f"XML parsing error: {e}")
        raise ValueError(f"Invalid XML format: {e}")
    except Exception as e:
        logger.error(f"Error parsing medical XML: {e}")
        raise
