import json
import os
import sys
import re
import urllib.request
import urllib.error

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from testing.match_diagnoses import HybridRetriever

from openai import OpenAI

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    print("Error: OPENROUTER_API_KEY not found in environment variables.")
    sys.exit(1)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

from embeds import config

def load_patient_data():
    with open(config.HOSPITAL_DATA_PATH, 'r') as f:
        data = json.load(f)
    # Return first patient's text
    patient = data[0]
    return f"{patient['clinical_text']}\n{patient.get('biochemistry', '')}\n{patient.get('microbiology', '')}\nMedikace: {patient.get('medication', '')}"

TEXT = load_patient_data()

def load_abbreviations():
    abbr_path = os.path.join(config.INPUT_DIR, "medical_abbreviations.txt")
    if not os.path.exists(abbr_path):
        return ""
    with open(abbr_path, 'r') as f:
        return f.read()

ABBREVIATIONS = load_abbreviations()

def extract_diagnoses_with_gemini(text):
    prompt = f"""
    Jsi expertní lékařský kodér a diagnostik. Tvým úkolem je analyzovat komplexní lékařskou zprávu a identifikovat všechny diagnózy, které by měly být kódovány.
    
    Musíš "přemýšlet" nad souvislostmi:
    1. Propojuj klinický text s výsledky biochemie a mikrobiologie (např. vysoké CRP + nález E. coli v moči -> močová infekce/sepse).
    2. Odvozuj diagnózy z medikace (např. podání Noradrenalinu -> oběhové selhání/šok).
    3. Rozepisuj zkratky pomocí přiloženého seznamu.
    
    Zde je seznam zkratek:
    {ABBREVIATIONS}
    
    Vstupní data obsahují:
    - Klinický text
    - Biochemické výsledky
    - Mikrobiologické nálezy
    - Medikaci
    
    Tvůj výstup musí být JSON seznam řetězců (list of strings), kde každý řetězec je KONKRÉTNÍ DIAGNÓZA nebo KLINICKÝ STAV vhodný pro vyhledání v číselníku MKN-10.
    Nepiš celé věty, piš přesné lékařské termíny (např. "septický šok", "akutní selhání ledvin", "fibrilace síní").
    
    Text k analýze:
    {text}
    """
    
    try:
        response = client.chat.completions.create(
            model="google/gemini-3-pro-preview", # Using OpenRouter model ID
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"OpenRouter API Error: {e}")
        return []

def main():
    print("Initializing Hybrid Retriever...")
    retriever = HybridRetriever()
    
    print("\nCalling Gemini to extract diagnoses...")
    segments = extract_diagnoses_with_gemini(TEXT)
    
    if not segments:
        print("No segments found or API failed.")
        return

    print(f"Extracted {len(segments)} segments: {segments}")
    
    print("\nRunning queries for each segment...")
    print("-" * 50)
    
    results_map = {}
    
    for segment in segments:
        print(f"\nQuery: '{segment}'")
        candidates = retriever.search(segment, top_k=3)
        
        for rank, code in enumerate(candidates):
            row = retriever.df[retriever.df['Kod'] == code]
            name = row.iloc[0]['Nazev'] if not row.empty else "Unknown"
            print(f"  {rank+1}. [{code}] {name}")
            
            # Aggregate scores (simple frequency count for now)
            if code not in results_map:
                results_map[code] = {'name': name, 'count': 0, 'reasons': []}
            results_map[code]['count'] += 1
            results_map[code]['reasons'].append(segment)

    print("\n" + "="*50)
    print("AGGREGATED TOP DIAGNOSES")
    print("="*50)
    
    sorted_results = sorted(results_map.items(), key=lambda x: x[1]['count'], reverse=True)
    for code, data in sorted_results[:10]:
        print(f"[{code}] {data['name']} (Found in {data['count']} segments)")
        print(f"   - Matches: {', '.join(data['reasons'][:3])}...")

if __name__ == "__main__":
    main()
