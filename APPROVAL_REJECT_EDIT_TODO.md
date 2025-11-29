# Approval Page - Reject & Edit Feature TODO

## Analysis from fe/src folder (buddy's prototype)

### Key Components Found:
1. **CoderForm.tsx** - Full edit form with:
   - Main diagnosis input
   - Secondary diagnoses (add/remove with react-hook-form)
   - Field arrays for dynamic diagnosis list
   - Code + name inputs per diagnosis
   - Add/Remove buttons

2. **DiagnosisSearch.tsx** - Search/autocomplete for diagnosis codes
3. **DiagnosisList.tsx** - List rendering of diagnoses
4. **Modal.tsx** - Reusable modal component

### Design Pattern to Reuse:
- Split layout (clinical data | editing form)
- Dynamic field arrays for secondary diagnoses
- Add/Remove buttons for list items
- Search/autocomplete for finding codes

---

## Implementation TODO

### Phase 1: Add Edit Mode Toggle ✓ (Already Exists)
- [x] Reject button exists in approval page
- [ ] Create edit mode state

### Phase 2: Create Editable Diagnosis Form
- [ ] 2.1: Add state for edit mode (boolean)
- [ ] 2.2: Add state for edited codes (main + secondary)
- [ ] 2.3: Create editable main diagnosis input
- [ ] 2.4: Create editable secondary diagnoses list
- [ ] 2.5: Add "Add Secondary" button
- [ ] 2.6: Add "Remove" button per secondary diagnosis
- [ ] 2.7: Wire up code search component

### Phase 3: Code Search/Autocomplete
- [ ] 3.1: Create CodeSearch component
- [ ] 3.2: Connect to `/api/codes/search` endpoint
- [ ] 3.3: Debounce search input (300ms)
- [ ] 3.4: Show dropdown with results
- [ ] 3.5: Keyboard navigation (up/down/enter)
- [ ] 3.6: Click to select code
- [ ] 3.7: Auto-fill code + name on selection

### Phase 4: Rejection Flow
- [ ] 4.1: On "Reject" click → enable edit mode
- [ ] 4.2: Show editable form instead of read-only
- [ ] 4.3: Track changes (main code, secondary codes)
- [ ] 4.4: Build corrections payload
- [ ] 4.5: Submit with feedback_type='rejected'
- [ ] 4.6: Include corrections in API call
- [ ] 4.7: Show success and move to next

### Phase 5: UI/UX Polish
- [ ] 5.1: Visual indicator for edit mode
- [ ] 5.2: Cancel edit button (revert changes)
- [ ] 5.3: Validation (require main diagnosis)
- [ ] 5.4: Loading states during search
- [ ] 5.5: Error handling for invalid codes
- [ ] 5.6: Smooth transitions

---

## Corrections Payload Structure

When rejecting with edits:
```json
{
  "validated_by": "John Doe",
  "feedback_type": "rejected",
  "corrected_main_code": "I501",  // If changed
  "corrected_main_name": "Heart Failure",
  "corrected_secondary": [
    {
      "action": "modified",
      "code": "N17",
      "name": "Acute Kidney Injury",
      "original_code": "N18"  // What it was before
    },
    {
      "action": "added",
      "code": "E87",
      "name": "Electrolyte Disorder"
    },
    {
      "action": "removed",
      "code": "J96",
      "name": "Respiratory Failure"
    }
  ],
  "feedback_comment": "Changed diagnosis based on lab results"
}
```

---

## UI Design for Edit Mode

### Current (Read-Only):
```
┌─────────────────────────────────┐
│ Main Diagnosis                  │
│ ┌─────────────────────────────┐ │
│ │ I501 - Heart Failure (92%) │ │
│ └─────────────────────────────┘ │
│                                 │
│ Secondary Diagnoses (2)         │
│ ┌─────────────────────────────┐ │
│ │ N17 - Kidney Injury (85%)  │ │
│ │ E87 - Electrolyte (78%)    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Edit Mode (After "Reject"):
```
┌─────────────────────────────────┐
│ ✏️ EDIT MODE                    │
│                                 │
│ Main Diagnosis *                │
│ ┌─────────────────────────────┐ │
│ │ [I501        ▼] Search...  │ │
│ │ Heart Failure              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Secondary Diagnoses             │
│ ┌─────────────────────────────┐ │
│ │ [N17 ▼] Kidney Injury  [x] │ │
│ │ [E87 ▼] Electrolyte    [x] │ │
│ └─────────────────────────────┘ │
│ [+ Add Secondary Diagnosis]     │
│                                 │
│ Comment *                       │
│ [Changed based on labs...]      │
│                                 │
│ [Cancel] [Submit Rejection]     │
└─────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: State Management
```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [editedMainCode, setEditedMainCode] = useState('');
const [editedMainName, setEditedMainName] = useState('');
const [editedSecondary, setEditedSecondary] = useState<Array<{
  code: string;
  name: string;
  originalCode?: string; // For tracking changes
}>>([]);
```

### Step 2: Toggle Edit Mode
```typescript
const handleReject = () => {
  setIsEditMode(true);
  // Pre-fill with current values
  setEditedMainCode(predictionDetail.main_diagnosis.code);
  setEditedMainName(predictionDetail.main_diagnosis.name);
  setEditedSecondary(predictionDetail.secondary_diagnoses.map(d => ({
    code: d.code,
    name: d.name,
    originalCode: d.code
  })));
};
```

### Step 3: Submit with Corrections
```typescript
const handleSubmitRejection = async () => {
  // Build corrections
  const corrections = {
    corrected_main: {
      code: editedMainCode,
      name: editedMainName
    },
    corrected_secondary: editedSecondary.map(d => {
      if (d.originalCode && d.originalCode !== d.code) {
        return { action: 'modified', code: d.code, name: d.name, original_code: d.originalCode };
      } else if (!d.originalCode) {
        return { action: 'added', code: d.code, name: d.name };
      }
      return { action: 'kept', code: d.code, name: d.name };
    })
  };
  
  await api.submitFeedback(currentPrediction.id, {
    validated_by: validatedBy,
    feedback_type: 'rejected',
    corrected_main_code: editedMainCode,
    corrected_main_name: editedMainName,
    corrected_secondary: corrections.corrected_secondary,
    feedback_comment: comment
  });
};
```

---

## Files to Create/Modify

1. **frontend/app/approve/page.tsx** (MODIFY)
   - Add edit mode state
   - Add edited codes state
   - Modify Reject button to toggle edit mode
   - Add editable form in right panel

2. **frontend/app/components/CodeSearch.tsx** (CREATE)
   - Search input with debounce
   - Dropdown with results
   - Keyboard navigation
   - Auto-complete on select

3. **frontend/app/components/DiagnosisInput.tsx** (CREATE)
   - Code + name input pair
   - Search integration
   - Validation

---

## Testing Plan

1. Open /approve page
2. Click "Reject" button
3. Verify edit mode activates
4. Change main diagnosis code
5. Add a secondary diagnosis
6. Remove a secondary diagnosis
7. Add comment
8. Click "Submit Rejection"
9. Verify API call with corrections
10. Check database for stored corrections
11. Verify next prediction loads

---

Ready to implement! 🚀
