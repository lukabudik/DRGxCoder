# Production-Ready Code Validation Plan

## Current Problem ❌

**LLM returns diagnosis codes WITH names**, but:
1. ✅ We have 38,769 ICD-10 codes in database (`diagnosis_codes` table)
2. ❌ LLM might hallucinate incorrect code names
3. ❌ LLM might return invalid codes not in our database
4. ❌ When editing, humans can enter invalid codes
5. ❌ No validation that codes actually exist

**Example of current flow:**
```
LLM Output:
{
  "main_diagnosis": {
    "code": "I501",  
    "name": "Heart Failure" // ❌ LLM generated, might be wrong!
  }
}

Database has:
code: I501
name: "Left ventricular failure, unspecified" // ✅ Official name
```

---

## Production-Ready Solution ✅

### Core Principle:
**ONLY store codes, lookup names from database**

### Changes Needed:

## 1. Database Schema (Prediction Model)
**NO CHANGES NEEDED** - Already stores codes correctly:
```prisma
mainCode        String   // "I501" ✅
mainName        String   // Store DB name
secondaryCodes  Json     // [{code, name, confidence}]
```

## 2. Backend Services (`services.py`)

### Step 1: LLM Returns Only Codes
Change prompt to return:
```json
{
  "main_diagnosis": {
    "code": "I501",  // ✅ Only code
    "confidence": 0.92,
    "reasoning": "..."
  },
  "secondary_diagnoses": [
    {"code": "N17", "confidence": 0.85}  // ✅ Only codes
  ]
}
```

### Step 2: Validate & Enrich
After LLM response, validate each code:
```python
async def validate_and_enrich_codes(codes: List[str]) -> List[Dict]:
    """Validate codes exist and get official names from DB"""
    enriched = []
    for code in codes:
        db_code = await db.diagnosiscode.find_unique(where={"code": code})
        if db_code:
            enriched.append({
                "code": db_code.code,
                "name": db_code.name,  # ✅ Official name from DB
                "confidence": confidence
            })
        else:
            logger.warning(f"Invalid code from LLM: {code}")
            # Skip or flag for review
    return enriched
```

### Step 3: Save to Database
```python
await create_prediction(
    main_code=main_diagnosis["code"],
    main_name=db_validated_name,  # ✅ From DB, not LLM
    secondary_codes=validated_secondary  # ✅ All validated
)
```

## 3. Backend API Endpoints

### Add Code Validation Endpoint
```python
@app.post("/api/codes/validate")
async def validate_codes(codes: List[str]):
    """Validate if codes exist in DB and return official names"""
    results = []
    for code in codes:
        db_code = await db.diagnosiscode.find_unique(where={"code": code})
        results.append({
            "code": code,
            "valid": db_code is not None,
            "name": db_code.name if db_code else None,
            "error": None if db_code else "Code not found in database"
        })
    return results
```

## 4. Frontend Changes

### CodeSearch Component (`code-search.tsx`)
**ALREADY GOOD** ✅ - Searches database, returns valid codes

### Approval Page Edit Mode
**Change Required:**
When user selects a code via CodeSearch:
```typescript
// Current (WRONG):
handleUpdateSecondary(idx, code, name)  // ❌ User can edit name

// New (CORRECT):
handleUpdateSecondary(idx, code)  // ✅ Only code, name from DB
```

Remove name input fields - make them read-only displays:
```tsx
{/* BEFORE */}
<input value={diag.name} onChange={...} />  // ❌ Editable

{/* AFTER */}
<div className={styles.diagnosisName}>{diag.name}</div>  // ✅ Read-only
```

### Validation on Submit
Before submitting rejection:
```typescript
const validateCodes = async () => {
  const codes = [editedMainCode, ...editedSecondary.map(d => d.code)];
  const validation = await api.validateCodes(codes);
  
  const invalid = validation.filter(v => !v.valid);
  if (invalid.length > 0) {
    alert(`Invalid codes: ${invalid.map(v => v.code).join(', ')}`);
    return false;
  }
  return true;
};
```

## 5. Corrections Payload

When rejecting, store ONLY codes:
```json
{
  "corrected_main_code": "I501",  // ✅ Only code
  "corrected_secondary": [
    {"action": "added", "code": "N17"},  // ✅ Only code
    {"action": "removed", "code": "E87"}
  ]
}
```

Names fetched from DB when displaying.

---

## Implementation Steps

### Phase 1: Backend Validation (HIGH PRIORITY)
- [ ] 1.1: Add `validate_codes()` function in `database.py`
- [ ] 1.2: Add `POST /api/codes/validate` endpoint in `main.py`
- [ ] 1.3: Update `predict_diagnosis()` in `services.py` to validate LLM codes
- [ ] 1.4: Update LLM prompts to return ONLY codes (no names)
- [ ] 1.5: Add enrichment step after LLM: lookup names from DB

### Phase 2: Frontend Validation (HIGH PRIORITY)
- [ ] 2.1: Add `validateCodes()` to API client (`lib/api.ts`)
- [ ] 2.2: Update approval page: validate codes before submit rejection
- [ ] 2.3: Make diagnosis name fields READ-ONLY (remove text inputs)
- [ ] 2.4: Only allow editing via CodeSearch dropdown

### Phase 3: Display Corrections (MEDIUM PRIORITY)
- [ ] 3.1: When showing corrections, fetch names from DB
- [ ] 3.2: Update sidebar corrections display
- [ ] 3.3: Update case detail corrections display

### Phase 4: Testing (HIGH PRIORITY)
- [ ] 4.1: Test LLM returns invalid code → verify it's caught
- [ ] 4.2: Test human enters invalid code → verify validation fails
- [ ] 4.3: Test approved prediction → verify DB names used
- [ ] 4.4: Test rejected prediction → verify corrections have DB names

---

## Files to Modify

### Backend:
1. `backend/app/database.py` - Add `validate_codes()`
2. `backend/app/services.py` - Update LLM prompt, add validation
3. `backend/app/main.py` - Add `/api/codes/validate` endpoint

### Frontend:
1. `frontend/lib/api.ts` - Add `validateCodes()`
2. `frontend/app/approve/page.tsx` - Validation + read-only names
3. `frontend/app/components/code-search.tsx` - Already good ✅
4. `frontend/app/components/prediction-detail-sheet.tsx` - Show corrections with DB names

---

## Benefits

✅ **Data Integrity**: Only valid ICD-10 codes stored
✅ **Official Names**: Always use standardized code names
✅ **No Hallucinations**: LLM can't make up code descriptions
✅ **Validation**: Catch invalid codes before saving
✅ **Consistency**: Same code always has same name
✅ **Auditability**: Clear what code was used

---

## Example Flow (After Implementation)

```
1. XML Upload
   ↓
2. LLM Prediction (returns codes only)
   {code: "I501", confidence: 0.92}
   ↓
3. Backend Validation
   ✅ "I501" exists in DB
   ✅ Get official name: "Left ventricular failure, unspecified"
   ↓
4. Save to Database
   mainCode: "I501"
   mainName: "Left ventricular failure, unspecified"  ← From DB
   ↓
5. Human Review (Approval Page)
   - Shows: I501 - Left ventricular failure, unspecified
   - Can search/select other codes
   - Name automatically filled from DB
   - Cannot edit name manually
   ↓
6. Submit Rejection (if correcting)
   - Validate all codes exist
   - Store only codes
   - Names fetched from DB when displaying
```

---

Ready to implement! 🚀

Estimated time: 4-6 hours total
