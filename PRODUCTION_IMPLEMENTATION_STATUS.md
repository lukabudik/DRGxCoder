# Production-Ready Code Validation - Implementation Status

## ✅ COMPLETED (Backend Phase 1)

### 1. Database Functions (`backend/app/database.py`)
- ✅ `validate_codes(codes)` - Validates codes exist in DB, returns official names
- ✅ `enrich_code(code)` - Gets official name for a single code

### 2. API Endpoints (`backend/app/main.py`)
- ✅ `POST /api/codes/validate` - Endpoint to validate list of codes
- ✅ Returns: `[{code, valid, name, error}]`

### 3. Frontend API Client (`frontend/lib/api.ts`)
- ✅ `api.validateCodes(codes)` - Calls validation endpoint

---

## 🚧 REMAINING WORK (Frontend Phase 2 + Backend Validation)

### Critical Remaining Tasks:

#### A. Update Approval Page (`frontend/app/approve/page.tsx`)

**1. Add Validation Before Rejection Submit:**
```typescript
const handleSubmitRejection = async () => {
  // STEP 1: Validate all codes
  const allCodes = [editedMainCode, ...editedSecondary.map(d => d.code)].filter(Boolean);
  
  try {
    const validation = await api.validateCodes(allCodes);
    const invalid = validation.filter(v => !v.valid);
    
    if (invalid.length > 0) {
      alert(`Invalid codes found:\n${invalid.map(v => `${v.code}: ${v.error}`).join('\n')}`);
      return;
    }
  } catch (err) {
    alert('Failed to validate codes: ' + err.message);
    return;
  }
  
  // STEP 2: Proceed with existing submission logic
  // ... existing code ...
};
```

**2. Make Name Fields READ-ONLY:**

Find this section:
```tsx
{/* Main Diagnosis Name Input */}
<input
  type="text"
  value={editedMainName}
  onChange={(e) => setEditedMainName(e.target.value)}  // ❌ REMOVE
  className={styles.input}
/>
```

Replace with READ-ONLY display:
```tsx
{/* Main Diagnosis Name (Auto-filled from DB) */}
<div className={styles.readOnlyName}>
  {editedMainName || 'Select a code to see name'}
</div>
```

Similarly for secondary diagnoses - remove the name input field, show as read-only text.

**3. Auto-Fill Name When Code Selected:**
Already working via CodeSearch component ✅

#### B. Update LLM Service (`backend/app/services.py`)

**1. Change LLM Prompt to Return ONLY Codes:**

Find the prompt section around line 260:
```python
# Current output format (WRONG):
{
    "main_diagnosis": {
        "code": "I460",
        "name": "Srdeční zástava s úspěšnou resuscitací",  # ❌ Remove
        "confidence": 0.95
    }
}
```

Change to:
```python
# New output format (CORRECT):
{
    "main_diagnosis": {
        "code": "I460",  # ✅ Only code
        "confidence": 0.95,
        "reasoning": "..."
    },
    "secondary_diagnoses": [
        {"code": "G931", "confidence": 0.88}  # ✅ Only codes
    ]
}
```

**2. Add Enrichment Step After LLM:**

After getting LLM response (around line 305), add:
```python
# After LLM returns response
main = response["main_diagnosis"]
secondary = response.get("secondary_diagnoses", [])

# Enrich codes with official names from DB
from app.database import enrich_code

# Enrich main diagnosis
main_enriched = await enrich_code(main["code"])
if not main_enriched:
    logger.warning(f"Invalid main code from LLM: {main['code']}")
    raise ValueError(f"Invalid diagnosis code: {main['code']}")

main["name"] = main_enriched["name"]  # Use DB name

# Enrich secondary diagnoses
enriched_secondary = []
for sec in secondary:
    sec_enriched = await enrich_code(sec["code"])
    if sec_enriched:
        enriched_secondary.append({
            "code": sec_enriched["code"],
            "name": sec_enriched["name"],  # Use DB name
            "confidence": sec.get("confidence", 0.8),
            "reasoning": sec.get("reasoning", "")
        })
    else:
        logger.warning(f"Invalid secondary code from LLM: {sec['code']}")

# Continue with enriched data
```

---

## 📝 Quick Implementation Checklist

### Backend (30 min):
- [ ] Update LLM prompt in `services.py` to not request names
- [ ] Add code enrichment after LLM response
- [ ] Handle invalid codes from LLM (reject or skip)
- [ ] Test: Upload XML → verify DB names used

### Frontend (1 hour):
- [ ] Update approval page: validate codes before submit
- [ ] Remove name input fields (make read-only)
- [ ] Add CSS for read-only name display
- [ ] Test: Edit prediction → verify can only change via dropdown

### Testing (30 min):
- [ ] Upload XML → Check codes are validated
- [ ] Reject prediction with invalid code → Verify validation blocks it
- [ ] Approve prediction → Verify DB names stored
- [ ] Check corrections display correct names

---

## 🎯 Expected Result

### Before:
```
LLM: {code: "I501", name: "Heart Failure"}  ❌ Hallucinated
DB:  {code: "I501", name: "Left ventricular failure"}
Stored: "Heart Failure"  ❌ Wrong name
```

### After:
```
LLM: {code: "I501"}  ✅ Only code
DB:  {code: "I501", name: "Left ventricular failure"}  
Validation: ✅ Code exists
Enrichment: Add official name from DB
Stored: "Left ventricular failure"  ✅ Correct official name
```

---

## 🔧 Code Snippets Ready to Use

### Approval Page Validation:
```typescript
// Add before existing submission in handleSubmitRejection
const allCodes = [editedMainCode, ...editedSecondary.map(d => d.code)].filter(Boolean);
const validation = await api.validateCodes(allCodes);
const invalid = validation.filter(v => !v.valid);
if (invalid.length > 0) {
  alert(`Invalid codes: ${invalid.map(v => v.code).join(', ')}`);
  return;
}
```

### Read-Only Name Display:
```tsx
<div style={{
  padding: '10px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)'
}}>
  {editedMainName || 'Select a code above'}
</div>
```

---

## Files to Modify Next:

1. `backend/app/services.py` - Lines 260-310 (LLM prompt + enrichment)
2. `frontend/app/approve/page.tsx` - Lines 148-235 (validation + readonly)

Ready to continue implementation! 🚀
