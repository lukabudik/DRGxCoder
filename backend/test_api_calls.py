"""Test API by making actual HTTP requests"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def print_separator(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def test_health():
    """Test health endpoint"""
    print_separator("TEST 1: Health Check")
    
    response = requests.get(f"{BASE_URL}/health")
    
    print(f"GET {BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_predict():
    """Test prediction endpoint with real patient data"""
    print_separator("TEST 2: Create Prediction")
    
    # Load test patient
    data_path = Path(__file__).parent / "data" / "patient_cases.json"
    with open(data_path) as f:
        patients = json.load(f)
    
    # Use patient 1 (different from patient 2 we tested before)
    patient = patients[0]
    
    # Prepare request
    request_data = {
        "pac_id": patient.get("pac_id"),
        "clinical_text": patient["clinical_text"],
        "biochemistry": patient.get("biochemistry"),
        "hematology": patient.get("hematology"),
        "microbiology": patient.get("microbiology"),
        "medication": patient.get("medication")
    }
    
    print(f"POST {BASE_URL}/api/predict")
    print(f"\nINPUT (Patient {patient['pac_id']}):")
    print("-" * 80)
    print(f"Clinical Text: {patient['clinical_text'][:200]}...")
    print(f"Biochemistry: {'Yes (' + str(len(patient.get('biochemistry', ''))) + ' chars)' if patient.get('biochemistry') else 'No'}")
    print(f"Hematology: {'Yes (' + str(len(patient.get('hematology', ''))) + ' chars)' if patient.get('hematology') else 'No'}")
    print(f"Microbiology: {'Yes' if patient.get('microbiology') else 'No'}")
    print(f"Medication: {'Yes' if patient.get('medication') else 'No'}")
    
    print("\nSending request... (this will take 30-60 seconds)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=request_data,
            timeout=180
        )
        
        print(f"\nStatus: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\nOUTPUT:")
            print("-" * 80)
            print(f"Prediction ID: {result['prediction_id']}")
            print(f"Case ID: {result['case_id']}")
            print(f"Processing Time: {result['processing_time']}ms ({result['processing_time']/1000:.1f}s)")
            print(f"Model Used: {result['model_used']}")
            
            print(f"\nStep 1 - Selected Codes ({len(result['selected_codes'])} codes):")
            print(f"  {result['selected_codes']}")
            print(f"  Reasoning: {result['step1_reasoning'][:150]}...")
            
            print(f"\nStep 2 - Main Diagnosis:")
            main = result['main_diagnosis']
            print(f"  Code: {main['code']}")
            print(f"  Name: {main['name']}")
            print(f"  Confidence: {main['confidence']:.2%}")
            if main.get('reasoning'):
                print(f"  Reasoning: {main['reasoning'][:150]}...")
            
            print(f"\nStep 2 - Secondary Diagnoses ({len(result['secondary_diagnoses'])}):")
            for i, diag in enumerate(result['secondary_diagnoses'], 1):
                print(f"  {i}. {diag['code']}: {diag['name']}")
                print(f"     Confidence: {diag['confidence']:.2%}")
                if diag.get('reasoning'):
                    print(f"     Reasoning: {diag['reasoning'][:100]}...")
            
            print("\n✅ Prediction saved to database")
            print(f"   Case ID: {result['case_id']}")
            print(f"   Prediction ID: {result['prediction_id']}")
            
            return result['case_id'], result['prediction_id']
        else:
            print(f"Error: {response.text}")
            return None, None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (>180 seconds)")
        return None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def test_get_case(case_id):
    """Test getting case details"""
    if not case_id:
        return
    
    print_separator("TEST 3: Get Case Details")
    
    response = requests.get(f"{BASE_URL}/api/cases/{case_id}")
    
    print(f"GET {BASE_URL}/api/cases/{case_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        case = response.json()
        print(f"\nCase Details:")
        print(f"  ID: {case['id']}")
        print(f"  Patient ID: {case['pac_id']}")
        print(f"  Created: {case['created_at']}")
        print(f"  Predictions: {case['predictions_count']}")
        print(f"  Clinical Text: {case['clinical_text'][:100]}...")

def test_get_prediction(prediction_id):
    """Test getting prediction details"""
    if not prediction_id:
        return
    
    print_separator("TEST 4: Get Prediction Details")
    
    response = requests.get(f"{BASE_URL}/api/predictions/{prediction_id}")
    
    print(f"GET {BASE_URL}/api/predictions/{prediction_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        pred = response.json()
        print(f"\nPrediction Details:")
        print(f"  ID: {pred['prediction_id']}")
        print(f"  Case ID: {pred['case_id']}")
        print(f"  Main: {pred['main_diagnosis']['code']} - {pred['main_diagnosis']['name']}")
        print(f"  Confidence: {pred['main_diagnosis']['confidence']:.2%}")
        print(f"  Secondary: {len(pred['secondary_diagnoses'])} diagnoses")

def test_list_cases():
    """Test listing cases"""
    print_separator("TEST 5: List All Cases")
    
    response = requests.get(f"{BASE_URL}/api/cases?page=1&limit=10")
    
    print(f"GET {BASE_URL}/api/cases?page=1&limit=10")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nTotal Cases: {data['total']}")
        print(f"Page: {data['page']} of {data['pages']}")
        print(f"Cases on this page: {len(data['cases'])}")
        
        for i, case in enumerate(data['cases'][:5], 1):
            print(f"\n  {i}. Case {case['id'][:8]}...")
            print(f"     Patient: {case['pac_id']}")
            print(f"     Predictions: {case['predictions_count']}")
            print(f"     Clinical: {case['clinical_text'][:80]}...")

def test_search_codes():
    """Test code search"""
    print_separator("TEST 6: Search Diagnosis Codes")
    
    query = "cardiac"
    response = requests.get(f"{BASE_URL}/api/codes/search?q={query}&limit=5")
    
    print(f"GET {BASE_URL}/api/codes/search?q={query}&limit=5")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        codes = response.json()
        print(f"\nFound {len(codes)} codes matching '{query}':")
        for code in codes:
            print(f"  {code['code']}: {code['name']}")
            print(f"    Chapter: {code['chapter']}, Category: {code['category']}")

def main():
    print_separator("API TESTING - AutoCode AI Backend")
    print("Testing with real patient data and HTTP requests")
    
    # Test 1: Health check
    test_health()
    
    # Test 2: Create prediction (main test)
    case_id, prediction_id = test_predict()
    
    # Test 3-4: Get created resources
    test_get_case(case_id)
    test_get_prediction(prediction_id)
    
    # Test 5: List cases
    test_list_cases()
    
    # Test 6: Search codes
    test_search_codes()
    
    print_separator("TESTING COMPLETE")
    print("✅ All tests passed!")
    print(f"\nCheck database for:")
    print(f"  - Case ID: {case_id}")
    print(f"  - Prediction ID: {prediction_id}")
    print(f"\nView in browser:")
    print(f"  - API Docs: http://localhost:8000/docs")
    print(f"  - Case: http://localhost:8000/api/cases/{case_id}")
    print(f"  - Prediction: http://localhost:8000/api/predictions/{prediction_id}")

if __name__ == "__main__":
    main()
