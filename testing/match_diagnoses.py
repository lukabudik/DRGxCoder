import os
import json
import pandas as pd
import numpy as np
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
from openai import OpenAI
from dotenv import load_dotenv
import sys
import os

# Add project root to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from embeds import config

# Load environment variables
load_dotenv()

class HybridRetriever:
    def __init__(self):
        print("Initializing Hybrid Retriever...")
        # 1. Setup Pinecone (Dense)
        self.pc = Pinecone(api_key=config.PINECONE_API_KEY)
        self.index = self.pc.Index(config.PINECONE_INDEX_NAME)
        self.embed_model = SentenceTransformer(config.EMBEDDING_MODEL_NAME)
        
        # 2. Setup BM25 (Sparse) - In-memory build
        print("Building BM25 index...")
        self.df = pd.read_csv(config.CSV_PATH)
        self.df['Nazev'] = self.df['Nazev'].fillna('')
        # Tokenize for BM25 (Simple split for MVP, ideally use a Czech lemmatizer)
        # Improved: Lowercase and simple alphanumeric split
        import re
        def tokenize(text):
            return re.findall(r'\w+', text.lower())

        self.tokenize = tokenize
        tokenized_corpus = [self.tokenize(doc) for doc in self.df['Nazev'].tolist()]
        self.bm25 = BM25Okapi(tokenized_corpus)
        print("Retriever initialized.")

    def search(self, query, top_k=20):
        # Dense Search
        query_embedding = self.embed_model.encode(query).tolist()
        dense_results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        dense_ids = [match['id'] for match in dense_results['matches']]
        
        # Sparse Search
        tokenized_query = self.tokenize(query)
        sparse_results = self.bm25.get_top_n(tokenized_query, self.df['Kod'].tolist(), n=top_k)
        
        # RRF Fusion
        return self.rrf_fusion(dense_ids, sparse_results)

    def rrf_fusion(self, list1, list2, k=60):
        """Reciprocal Rank Fusion"""
        scores = {}
        for rank, item in enumerate(list1):
            scores[item] = scores.get(item, 0) + 1 / (k + rank + 1)
        for rank, item in enumerate(list2):
            scores[item] = scores.get(item, 0) + 1 / (k + rank + 1)
        
        sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [item[0] for item in sorted_items]

class Reranker:
    def __init__(self):
        print(f"Loading Cross-Encoder: {config.CROSS_ENCODER_MODEL_NAME}...")
        self.model = CrossEncoder(config.CROSS_ENCODER_MODEL_NAME)

    def rerank(self, query, candidate_codes, df_lookup):
        """
        Rerank candidates based on query relevance.
        """
        pairs = []
        valid_candidates = []
        
        for code in candidate_codes:
            # Get description from DF
            row = df_lookup[df_lookup['Kod'] == code]
            if not row.empty:
                desc = row.iloc[0]['Nazev']
                pairs.append([query, desc])
                valid_candidates.append({'code': code, 'name': desc})
        
        if not pairs:
            return []

        scores = self.model.predict(pairs)
        
        # Attach scores
        results = []
        for i, candidate in enumerate(valid_candidates):
            results.append({
                'code': candidate['code'],
                'name': candidate['name'],
                'score': float(scores[i])
            })
            
        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results

class DRGReasoningAgent:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            print("WARNING: OPENAI_API_KEY not found. LLM reasoning will be mocked.")
            self.client = None

    def analyze(self, patient_text, candidates):
        if not self.client:
            # Mock response
            return {
                "HDG": candidates[0]['code'] if candidates else "N/A",
                "VDG": [c['code'] for c in candidates[1:3]] if len(candidates) > 1 else [],
                "Reasoning": "Mock reasoning: API key missing."
            }

        candidate_str = "\n".join([f"- {c['code']}: {c['name']} (Relevance: {c['score']:.2f})" for c in candidates[:10]])
        
        prompt = f"""
        Jsi expertní kodér v systému CZ-DRG. Analyzuj lékařskou zprávu a seznam kandidátních kódů.
        
        PACIENTSKÁ ZPRÁVA:
        {patient_text[:2000]}... (zkráceno)

        KANDIDÁTNÍ KÓDY (seřazeno dle relevance):
        {candidate_str}

        ÚKOL:
        1. Identifikuj Hlavní diagnózu (HDG): Stav zodpovědný za přijetí a čerpání nejvíce zdrojů.
        2. Identifikuj Vedlejší diagnózy (VDG): Stavy, které vyžadovaly léčbu nebo diagnostiku.
        3. Ignoruj anamnestické údaje, které se neléčí.

        VÝSTUP (JSON):
        {{
            "HDG": "kód",
            "VDG": ["kód1", "kód2"],
            "Reasoning": "vysvětlení"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"LLM Error: {e}")
            return {"HDG": "Error", "VDG": [], "Reasoning": str(e)}

class ConformalPredictor:
    def calibrate(self, scores, alpha=0.05):
        # Simple implementation: Return set of codes whose normalized scores sum to 1-alpha
        # In a real system, this needs a calibration set.
        # Here we just use softmax-like probability from scores.
        
        # Softmax
        exp_scores = np.exp(scores)
        probs = exp_scores / np.sum(exp_scores)
        
        # Sort probs
        sorted_indices = np.argsort(probs)[::-1]
        
        prediction_set = []
        cumulative_prob = 0.0
        
        for idx in sorted_indices:
            prediction_set.append(idx)
            cumulative_prob += probs[idx]
            if cumulative_prob >= (1 - alpha):
                break
                
        return prediction_set, probs

def main():
    # 1. Initialize Components
    retriever = HybridRetriever()
    reranker = Reranker()
    agent = DRGReasoningAgent()
    
    # 2. Load Patient Data
    with open(config.HOSPITAL_DATA_PATH, 'r') as f:
        patients = json.load(f)
    
    results = []
    
    # 3. Process Patients
    for patient in patients[:3]: # Process first 3 for demo
        print(f"\nProcessing Patient ID: {patient['pac_id']}...")
        
        # Preprocessing (Simple concatenation)
        text = f"{patient['clinical_text']}\n{patient.get('biochemistry', '')}\n{patient.get('microbiology', '')}"
        
        # Extraction (Mock: Just use the first 500 chars as query for now)
        # In production: Use LLM to extract entities first.
        query = text[:500] 
        
        # Retrieval
        print("Retrieving candidates...")
        candidate_codes = retriever.search(query)
        
        # Reranking
        print("Reranking...")
        reranked_candidates = reranker.rerank(query, candidate_codes, retriever.df)
        
        # Reasoning
        print("LLM Reasoning...")
        decision = agent.analyze(text, reranked_candidates)
        
        # Conformal Prediction (Mock on top candidates)
        scores = [c['score'] for c in reranked_candidates[:5]]
        cp = ConformalPredictor()
        pred_set_indices, probs = cp.calibrate(scores)
        prediction_set = [reranked_candidates[i]['code'] for i in pred_set_indices]
        
        result = {
            "patient_id": patient['pac_id'],
            "decision": decision,
            "conformal_set": prediction_set,
            "top_candidates": reranked_candidates[:5]
        }
        results.append(result)
        print(f"Result: HDG={decision.get('HDG')}, Set={prediction_set}")

    # Save results
    with open("matched_diagnoses.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nDone. Results saved to matched_diagnoses.json")

if __name__ == "__main__":
    main()
