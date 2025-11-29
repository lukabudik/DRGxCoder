#!/bin/bash

echo "Testing Feedback System"
echo "======================="

# Get a prediction ID
PRED_ID=$(curl -s "http://localhost:8000/api/predictions?limit=1" | python3 -c "import sys, json; print(json.load(sys.stdin)['predictions'][0]['id'])")

echo "Testing prediction ID: $PRED_ID"
echo ""

# Test 1: Approve prediction with comment
echo "Test 1: Approve prediction with comment"
curl -s -X POST "http://localhost:8000/api/predictions/$PRED_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "validated_by": "Dr. Smith",
    "feedback_type": "approved",
    "feedback_comment": "Excellent prediction, very accurate!"
  }' | python3 -m json.tool

echo -e "\n"

# Test 2: Get prediction to see feedback
echo "Test 2: Get prediction to see feedback was saved"
curl -s "http://localhost:8000/api/predictions/$PRED_ID" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Prediction ID: {data['prediction_id']}\")
print(f\"Main diagnosis: {data['main_diagnosis']['code']} - {data['main_diagnosis']['name']}\")
"

echo -e "\n"

# Test 3: Reject with corrections (on another prediction if available)
echo "Test 3: Reject prediction with corrections"
curl -s -X POST "http://localhost:8000/api/predictions/$PRED_ID/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "validated_by": "Dr. Johnson",
    "feedback_type": "rejected",
    "corrected_main_code": "I509",
    "corrected_main_name": "Heart failure, unspecified",
    "corrected_secondary": [
      {
        "action": "added",
        "code": "N185",
        "name": "Chronic kidney disease, stage 5"
      },
      {
        "action": "removed",
        "code": "R570"
      }
    ],
    "feedback_comment": "Main diagnosis code should be unspecified, and CKD stage 5 was completely missed by the AI"
  }' | python3 -m json.tool

echo -e "\n"
echo "✅ Feedback tests complete!"
