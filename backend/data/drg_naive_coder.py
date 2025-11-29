import json
import os
import argparse
import requests
from typing import List, Dict, Any, Optional, Tuple
from tqdm import tqdm
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

SYSTEM_PROMPT = """
Jsi expert na kódování diagnóz pro DRG (Diagnosis Related Groups) v českém zdravotnictví.
Tvým úkolem je analyzovat klinická data pacienta a určit hlavní diagnózu a vedlejší diagnózy podle metodiky MKN-10 a pravidel pro DRG.

Metodika kódování diagnóz pro využití v DRG:
Metodiku kódování diagnóz určuje Instrukční příručka MKN-10 a úvody abecedního a tabelárního seznamu MKN-10 společně s níže uvedenými pokyny.

Podklady pro kódování:
Hlavním podkladem pro kódování a jeho revizi/audit je zdravotní dokumentace o hospitalizaci. Obsah propouštěcí zprávy musí mít oporu v ostatní dokumentaci (výsledky vyšetření, operační protokol, denní záznamy, atd.) a musí odpovídat průběhu epizody léčebné péče. Ze zprávy musí být zřejmé, jak byl vytvořen konečný diagnostický souhrn.

Hlavní diagnóza:
Hlavní diagnóza označuje stav, který byl na konci období léčebné péče určen jako primárně odpovědný za potřebu nemocného léčit se nebo být vyšetřován.
Ve výjimečných případech, kdy existuje více takových stavů, označí se jako hlavní ten, který je nejvíce zodpovědný za čerpání prostředků.
Zneužívání tohoto pravidla pro dosažení vyšších úhrad díky zařazení do Pre-MDC, DRG 888.. nebo díky výhodnější kombinaci diagnóz pro DRG s vyšší závažností (CC, MCC) může být považováno za podvodný nárok.

Vedlejší diagnózy:
Onemocnění nebo potíže existující současně s hlavní diagnózou nebo se vyvíjející až během epizody léčebné péče, které mají prokazatelně vliv na péči o pacienta v průběhu dané epizody péče.
Ovlivňují léčbu pacienta takovým způsobem, že je potřebný kterýkoliv z uvedených faktorů:
1. Klinické vyšetření
2. Terapeutický zásah nebo léčba
3. Diagnostické výkony
4. Zvýšená ošetřovatelská péče a/nebo monitorování
Přítomnost jednoho nebo více uvedených faktorů většinou vede k prodloužení hospitalizace. Na zařazení do DRG nemá vliv pořadí vedlejších diagnóz, ale doporučuje se dodržovat pravidla MKN-10 (systém + a *, kódování následků, atd.)

Směrnice pro kódování chemoterapie a radioterapie:
Je-li účelem hospitalizace provedení chemoterapie nebo radioterapie pro maligní novotvar, stanovte chemoterapii Z51.1 nebo radioterapii Z51.0 jako hlavní diagnózu.
Jestliže je během hospitalizace provedeno chirurgické odstranění nádoru následované chemoterapií nebo radioterapií, stanovte maligní novotvar jako hlavní diagnózu, následovanou kódy pro chemoterapii a/nebo radioterapii.
Jestliže je pacient hospitalizován k provedení chemoterapeutického nebo radioterapeutického cyklu a během hospitalizace dojde ke komplikacím jako nekontrolovatelná nausea a zvracení a/nebo dehydratace, uveďte jako hlavní diagnózu chemoterapii Z51.1 nebo radioterapii Z51.0 následovanou uvedenými komplikacemi.

Tvůj úkol:
1. Zamysli se hluboce nad pacientovými daty (klinický text, biochemie, hematologie, mikrobiologie, medikace).
2. Urči HLAVNÍ DIAGNÓZU (kód MKN-10 a název).
3. Uveď důvod pro výběr hlavní diagnózy a odhadni pravděpodobnost správnosti (0-100%).
4. Navrhni další potenciální hlavní diagnózy, pokud existují.
5. Urči VEDLEJŠÍ DIAGNÓZY (maximálně 14).
6. Uveď důvod pro každou vedlejší diagnózu (případně tam i popiš jak se to vázalo k průběhu léčby a taky potenciální důvod proč by se tato diagnóza nemusela uznat) a odhadni pravděpodobnost.

Výstup musí být POUZE validní JSON v následujícím formátu:
{
  "main_diagnosis": {
    "code": "Kód MKN-10",
    "name": "Název diagnózy",
    "reason": "Důvod...",
    "probability": 95
  },
  "other_potential_main_diagnoses": [
    {
      "code": "Kód",
      "name": "Název",
      "reason": "Důvod...",
      "probability": 30
    }
  ],
  "secondary_diagnoses": [
    {
      "code": "Kód",
      "name": "Název",
      "reason": "Důvod...",
      "probability": 90
    }
  ]
}
"""

def get_patient_prompt(patient: Dict[str, Any]) -> str:
    prompt = "Pacient:\n"
    for key, value in patient.items():
        if value:
            prompt += f"{key.upper()}: {value}\n"
    prompt += "\nAnalyzuj tohoto pacienta a vytvoř JSON výstup podle instrukcí."
    return prompt

def call_openrouter(prompt: str, model: str, api_key: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/tomasjelinek/DRGxCoder", # Optional
        "X-Title": "DRGxCoder", # Optional
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=120 
        )
        response.raise_for_status()
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            try:
                return json.loads(content), result
            except json.JSONDecodeError:
                print(f"Error decoding JSON from response: {content}")
                return {"error": "Invalid JSON response", "raw_content": content}, result
        else:
            return {"error": "No choices in response", "raw_response": result}, result
            
    except Exception as e:
        return {"error": str(e)}, {}

def main():
    parser = argparse.ArgumentParser(description="DRG Coder using OpenRouter")
    parser.add_argument("--input", default="hospital_data.json", help="Input JSON file path")
    parser.add_argument("--output", help="Output JSON file path (optional, defaults to auto-generated name)")
    parser.add_argument("--model", default="google/gemini-3-pro-preview", help="OpenRouter model to use")
    parser.add_argument("--api-key", help="OpenRouter API Key (or set OPENROUTER_API_KEY env var)")
    parser.add_argument("--limit", type=int, help="Limit number of patients to process (for testing)")
    
    args = parser.parse_args()
    
    # Generate output filename if not provided
    if not args.output:
        output_dir = "results_drg_naive_coder"
        os.makedirs(output_dir, exist_ok=True)
        
        sanitized_model = args.model.replace("/", "_").replace(":", "_")
        limit_str = f"_limit{args.limit}" if args.limit else ""
        filename = f"drg_results_{sanitized_model}{limit_str}.json"
        args.output = os.path.join(output_dir, filename)
    
    api_key = args.api_key or os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OpenRouter API Key is required. Set OPENROUTER_API_KEY env var or use --api-key.")
        return

    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            patients = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{args.input}' not found.")
        return

    if args.limit:
        patients = patients[:args.limit]

    results = []
    usage_stats = []
    
    print(f"Processing {len(patients)} patients using model {args.model}...")
    
    for patient in tqdm(patients):
        prompt = get_patient_prompt(patient)
        analysis, raw_response = call_openrouter(prompt, args.model, api_key)
        
        # Add patient ID to raw response for tracking
        if raw_response:
            raw_response["_patient_id"] = patient.get("pac_id", "unknown")
        usage_stats.append(raw_response)
        
        patient_result = {
            "patient_id": patient.get("pac_id", "unknown"),
            "original_data": patient,
            "drg_analysis": analysis
        }
        results.append(patient_result)

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    # Save usage stats
    usage_output = args.output.replace(".json", "") + "_usage.json"
    if usage_output == args.output: # Handle case where .json wasn't present
        usage_output = args.output + "_usage.json"
        
    with open(usage_output, 'w', encoding='utf-8') as f:
        json.dump(usage_stats, f, indent=2, ensure_ascii=False)
        
    print(f"Results saved to {args.output}")
    print(f"Usage stats saved to {usage_output}")

if __name__ == "__main__":
    main()
