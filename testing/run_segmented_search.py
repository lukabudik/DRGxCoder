import re
import pandas as pd
from match_diagnoses import HybridRetriever

# Patient data
TEXT = """Pacientka žijící v domě s ošetřovatelskou péčí. Chodící soběstačná. Dle ošetřovatelky 3 dny zhoršování stavu vědomí, polehává omezený kontakt. Dnes ráno apatická, dostala snad Nutridrink, poté desaturace. Volána záchranná služba. Po příjezdu pacientka ležící v posteli, somnoletní, na důrazný podnět probudná, výzvě nevyhoví, subfebrilní TT 37,3 st. C, zornice izokorické, oběhově hypotenze 91/51, Tf 112/min. SpO2 85%, snad bez lateralizace. Podán kyslík a následně pacienta dovezena na urgentní příjem Nem. Kyjov. Vzdledem k výše uvedenému přijata na ARO oddělení. Zde invazivně zajištěna, provedeno echokardiografické vyšetření, kde obraz selhání levé komory s nízkou ejekční frakcí. Pro hypotenzi a snízký stav cirkulujícího oběmu zahájena egresivní tekutinová resuscitace. Nasazena vazopresorická podpora Noradrenalinem. I přes doplnění intravaskulárního objemu se prohlubuje hypotenze, proto přistoupeno o rozšíření o vardessin. Dobutamin vzhledem k nově vzniklé Fisi s ROK nepodáván. Fisi oponována Cordaronem a Digoxinem. Při suspektní aspiraci podín empiricky amoxicilin. Vzhledem k srdečnímu selhání s nízkým srdečním výdejema vzniklou  spontánní koagulopatií INR 3,24 upuštěno od punkce výpotku vpravo, kde dle CT až 45 mm. Nicméne výpotek nelimituje pacietku ,v ASTRUPU normální pH s  hyperoxémií. Zdravotní stav s nepříznivou prognózou konzultován s dcerou. Vzhledem k předchorobí s výskytem demence, zhoršování zdravotního stavu a nemožnosti dostáhnout terapeutickými prostředky dostatečného srdecního výdeje rozdodnuto dále nenavyšovat terapii ve smyslu napojení na UPV, DNR, která nepovede k úzdravě pacientky. Stav progreduje do anergní hypotenze s exitem v 3:50 12.1.2025. Dceru se pokusíme telefonicky konzultovat v ranních hodiných."""

def extract_potential_diagnoses(text):
    # Split by punctuation to get small phrases
    # We are looking for things like "selhání levé komory", "hypotenze", "demence"
    segments = re.split(r'[.,;\n]+', text)
    
    cleaned_segments = []
    for seg in segments:
        seg = seg.strip()
        # Filter out very short segments or common non-medical words if possible
        # For now, just length filter
        if len(seg) > 3: 
            cleaned_segments.append(seg)
            
    return cleaned_segments

def main():
    print("Initializing components...")
    retriever = HybridRetriever()
    
    print("\nExtracting segments...")
    segments = extract_potential_diagnoses(TEXT)
    print(f"Found {len(segments)} segments.")
    
    print("\nRunning queries for each segment...")
    print("-" * 50)
    
    for i, segment in enumerate(segments):
        # Skip some obviously non-medical segments manually if needed, but let's see all
        print(f"\nQuery: '{segment}'")
        
        # Search
        candidates = retriever.search(segment, top_k=3)
        
        # Print top results
        for rank, code in enumerate(candidates):
            row = retriever.df[retriever.df['Kod'] == code]
            name = row.iloc[0]['Nazev'] if not row.empty else "Unknown"
            print(f"  {rank+1}. [{code}] {name}")

if __name__ == "__main__":
    main()
