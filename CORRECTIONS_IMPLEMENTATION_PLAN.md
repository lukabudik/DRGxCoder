# Corrections → Current Prediction Implementation Plan

## 🎯 Problem Statement

**Current Behavior:**
- When user rejects and corrects a prediction, corrections are stored in `corrections` JSON field
- Main fields (`mainCode`, `mainName`, `secondaryCodes`) still show AI's original prediction
- No way to see history or what changed

**Desired Behavior:**
- Corrections become the NEW current prediction (update main fields)
- Original AI prediction preserved in history
- UI shows current (corrected) values with ability to view AI's original prediction
- Clear visual indication that prediction was corrected

---

## 📋 Required Changes

### 1. Database Schema Changes

**Option A: Add History Fields (Simpler)**
```prisma
model Prediction {
  // Current prediction (after corrections if any)
  mainCode        String
  mainName        String
  mainConfidence  Float
  secondaryCodes  Json
  
  // Original AI prediction (preserved)
  originalMainCode        String?
  originalMainName        String?
  originalMainConfidence  Float?
  originalSecondaryCodes  Json?
  
  // Metadata
  corrected       Boolean   @default(false)
  correctedAt     DateTime?
  corrections     Json?     // Keep for detailed change tracking
}
```

**Option B: Separate History Table (More Scalable)**
```prisma
model Prediction {
  // Current prediction (updated with corrections)
  mainCode        String
  mainName        String
  secondaryCodes  Json
  
  // Relationships
  history         PredictionHistory[]
}

model PredictionHistory {
  id            String      @id @default(cuid())
  predictionId  String
  version       Int         // 1 = original AI, 2+ = corrections
  mainCode      String
  mainName      String
  secondaryCodes Json
  changedBy     String
  changedAt     DateTime
  changeReason  String?
  prediction    Prediction  @relation(fields: [predictionId], references: [id])
}
```

**Recommendation: Option A** (simpler, covers 99% of use cases - one correction)

---

### 2. Backend Changes

#### A. Update `submit_prediction_feedback()` in `main.py`

**Current Logic:**
```python
# Just stores corrections in JSON
await update_prediction_status(
    prediction_id=prediction_id,
    validated=True,
    corrections=feedback.corrections  # ❌ Stored but not applied
)
```

**New Logic:**
```python
async def submit_prediction_feedback(prediction_id, feedback):
    prediction = await get_prediction(prediction_id)
    
    if feedback.feedback_type == 'rejected':
        # 1. Preserve original AI prediction
        original_data = {
            "mainCode": prediction.mainCode,
            "mainName": prediction.mainName,
            "mainConfidence": prediction.mainConfidence,
            "secondaryCodes": prediction.secondaryCodes,
        }
        
        # 2. Update main fields with corrections
        await db.prediction.update(
            where={"id": prediction_id},
            data={
                # Update current prediction
                "mainCode": feedback.corrected_main_code,
                "mainName": feedback.corrected_main_name,
                "secondaryCodes": build_corrected_secondary(
                    prediction.secondaryCodes,
                    feedback.corrected_secondary
                ),
                
                # Preserve original
                "originalMainCode": original_data["mainCode"],
                "originalMainName": original_data["mainName"],
                "originalMainConfidence": original_data["mainConfidence"],
                "originalSecondaryCodes": original_data["secondaryCodes"],
                
                # Metadata
                "corrected": True,
                "correctedAt": datetime.now(),
                "validated": True,
                "validatedAt": datetime.now(),
                "validatedBy": feedback.validated_by,
                "feedbackType": "rejected",
                "corrections": feedback.corrected_secondary,  # Detailed changes
                "feedbackComment": feedback.feedback_comment,
            }
        )
```

#### B. Create `build_corrected_secondary()` Helper

```python
def build_corrected_secondary(original_codes: list, corrections: list) -> list:
    """
    Apply corrections to secondary codes and return final list
    
    Args:
        original_codes: Original AI secondary diagnoses
        corrections: List of changes [{action, code, name, original_code}]
    
    Returns:
        Final corrected list of secondary codes
    """
    result = []
    
    # Start with original codes
    current_codes = {code['code']: code for code in original_codes}
    
    # Apply corrections
    for correction in corrections:
        action = correction['action']
        
        if action == 'removed':
            current_codes.pop(correction['code'], None)
        
        elif action == 'added':
            result.append({
                'code': correction['code'],
                'name': correction['name'],
                'confidence': 0.0,  # User-added, no confidence
            })
        
        elif action == 'modified':
            # Remove old, add new
            current_codes.pop(correction['original_code'], None)
            result.append({
                'code': correction['code'],
                'name': correction['name'],
                'confidence': 0.0,  # Modified, reset confidence
            })
    
    # Add remaining unmodified codes
    result.extend(current_codes.values())
    
    return result
```

---

### 3. Database Migration

```sql
-- Add new columns for original AI prediction
ALTER TABLE predictions 
ADD COLUMN original_main_code VARCHAR(10),
ADD COLUMN original_main_name TEXT,
ADD COLUMN original_main_confidence FLOAT,
ADD COLUMN original_secondary_codes JSONB,
ADD COLUMN corrected BOOLEAN DEFAULT FALSE,
ADD COLUMN corrected_at TIMESTAMP;

-- Add index for corrected field
CREATE INDEX idx_predictions_corrected ON predictions(corrected);
```

**Prisma Migration:**
```bash
cd backend
# Update schema.prisma with new fields
prisma migrate dev --name add_original_prediction_fields
```

---

### 4. Frontend Changes

#### A. Update Types (`frontend/types/index.ts`)

```typescript
export interface Prediction {
  // Current prediction (after corrections if any)
  main_code: string;
  main_name: string;
  main_confidence: number;
  secondary_diagnoses: DiagnosisCode[];
  
  // Original AI prediction (if corrected)
  original_main_code?: string;
  original_main_name?: string;
  original_main_confidence?: number;
  original_secondary_diagnoses?: DiagnosisCode[];
  
  // Metadata
  corrected: boolean;
  corrected_at?: string;
  corrections?: any;
  
  // ... rest of fields
}
```

#### B. Update Prediction Detail Sheet

```tsx
// Show if prediction was corrected
{prediction.corrected && (
  <div className={styles.correctionBanner}>
    <AlertCircle size={16} />
    <span>
      This prediction was corrected by {prediction.validated_by} on{' '}
      {new Date(prediction.corrected_at).toLocaleDateString()}
    </span>
  </div>
)}

// Current (corrected) values
<div className={styles.section}>
  <h3>Current Diagnosis</h3>
  <div className={styles.mainDiagnosis}>
    <code>{prediction.main_code}</code>
    <span>{prediction.main_name}</span>
  </div>
</div>

// Show AI's original prediction if corrected
{prediction.corrected && (
  <div className={styles.section}>
    <button 
      onClick={() => setShowAiPrediction(!showAiPrediction)}
      className={styles.toggleHistory}
    >
      {showAiPrediction ? 'Hide' : 'Show'} AI's Original Prediction
    </button>
    
    {showAiPrediction && (
      <div className={styles.aiPredictionHistory}>
        <div className={styles.comparisonCard}>
          <h4>AI Predicted:</h4>
          <code>{prediction.original_main_code}</code>
          <span>{prediction.original_main_name}</span>
          <Badge>{prediction.original_main_confidence * 100}%</Badge>
        </div>
        
        <div className={styles.comparisonCard}>
          <h4>User Corrected To:</h4>
          <code>{prediction.main_code}</code>
          <span>{prediction.main_name}</span>
        </div>
      </div>
    )}
  </div>
)}
```

#### C. Update Predictions List

```tsx
// Show indicator that prediction was corrected
<div className={styles.predictionCard}>
  <code>{prediction.main_code}</code>
  <span>{prediction.main_name}</span>
  
  {prediction.corrected && (
    <Badge variant="warning">
      <Edit size={12} />
      Corrected
    </Badge>
  )}
</div>
```

---

### 5. Approval Page Changes

**Minimal changes needed** - just ensure feedback submission includes all corrected codes:

```typescript
const handleSubmitRejection = async () => {
  // ... validation ...
  
  await api.submitFeedback(currentPrediction.id, {
    validated_by: validatedBy,
    feedback_type: 'rejected',
    corrected_main_code: editedMainCode,
    corrected_main_name: editedMainName,  // Will become new mainCode/mainName
    corrected_secondary: correctedSecondary,  // Will become new secondaryCodes
    feedback_comment: comment,
  });
};
```

---

## 🔄 Data Flow

### Before Correction:
```
Prediction {
  mainCode: "I50",
  mainName: "Heart failure",
  mainConfidence: 0.92,
  secondaryCodes: [{code: "E11", name: "Diabetes", confidence: 0.85}],
  corrected: false,
  originalMainCode: null,
}
```

### After User Corrects to I501:
```
Prediction {
  // Current (corrected) values
  mainCode: "I501",  // ✅ Updated
  mainName: "Left ventricular failure",  // ✅ Updated
  mainConfidence: 0.92,  // Keep original confidence
  secondaryCodes: [{code: "E11", name: "Diabetes", confidence: 0.85}],
  
  // Original AI prediction preserved
  originalMainCode: "I50",  // ✅ Preserved
  originalMainName: "Heart failure",  // ✅ Preserved
  originalMainConfidence: 0.92,
  originalSecondaryCodes: [{code: "E11", ...}],
  
  // Metadata
  corrected: true,  // ✅ Flag
  correctedAt: "2025-11-30T10:30:00Z",
  validatedBy: "Dr. Smith",
  corrections: [...],  // Detailed change log
}
```

---

## 📊 Implementation Checklist

### Database (1 hour):
- [ ] Update `schema.prisma` with original fields
- [ ] Create and run migration
- [ ] Test migration doesn't break existing data

### Backend (2 hours):
- [ ] Create `build_corrected_secondary()` helper
- [ ] Update `submit_prediction_feedback()` logic
- [ ] Update `get_prediction()` to include original fields
- [ ] Test with sample corrections

### Frontend (2 hours):
- [ ] Update Prediction type definition
- [ ] Update prediction detail sheet UI
- [ ] Add "Show AI's Original" toggle
- [ ] Add comparison view
- [ ] Update predictions list with "Corrected" badge
- [ ] Test approval → correction flow

### Testing (1 hour):
- [ ] Test: Approve without corrections → No original fields
- [ ] Test: Reject with corrections → Original preserved, current updated
- [ ] Test: View corrected prediction → Shows both versions
- [ ] Test: List view → Shows "Corrected" badge

---

## 🎨 UI Mockup

### Prediction Detail (Corrected):
```
┌─────────────────────────────────────────┐
│ ⚠️ Corrected by Dr. Smith on 11/30/25  │
└─────────────────────────────────────────┘

Current Diagnosis (After Correction):
┌─────────────────────────────────────────┐
│ I501 - Left ventricular failure         │
└─────────────────────────────────────────┘

[▼ Show AI's Original Prediction]

┌─────────────────────────────────────────┐
│ AI Predicted:                           │
│ I50 - Heart failure                     │
│ Confidence: 92%                         │
│                                         │
│ User Corrected To:                      │
│ I501 - Left ventricular failure         │
└─────────────────────────────────────────┘
```

---

## ⚡ Quick Implementation (MVP)

**If you want the fastest solution:**

1. **Schema:** Add 4 fields (original_main_code, original_main_name, original_secondary_codes, corrected)
2. **Backend:** Update submit_feedback to copy current → original, then update current
3. **Frontend:** Show banner if corrected, add toggle to view original

**Time:** ~3 hours total

---

## 🚀 Benefits

1. **Data Integrity**: Never lose AI's original prediction
2. **Transparency**: Clear audit trail of what changed
3. **Learning**: Can analyze AI accuracy vs corrections
4. **Trust**: Users see human corrections clearly marked
5. **Analytics**: Track correction patterns for model improvement

---

Ready to implement? I recommend starting with the schema migration first, then backend logic, then frontend UI.
