# Approval System Implementation Plan

## Current State Analysis ✅

### Backend (Already Implemented):
- ✅ Database schema has feedback fields in `Prediction` model:
  - `validated` (Boolean, default false)
  - `validatedAt` (DateTime)
  - `validatedBy` (String)
  - `feedbackType` ("approved" or "rejected")
  - `corrections` (JSON)
  - `feedbackComment` (String)

- ✅ API Endpoint: `POST /api/predictions/{id}/feedback`
  - Accepts: `validated_by`, `feedback_type`, corrections, `feedback_comment`
  - Returns: Updated prediction with validation status

- ✅ Database function: `submit_prediction_feedback()`

- ✅ Frontend API client: `api.submitFeedback()`

### What's Missing:
- ❌ Frontend UI for approval/rejection in sidebar
- ❌ "Doomscroll" approval page
- ❌ Code search/autocomplete for corrections
- ❌ Keyboard shortcuts for fast approval

---

## Implementation Plan

### Phase 1: Sidebar Quick Approval (Simple) 🎯

**Goal:** Add approve/reject buttons to prediction detail sidebar

#### Todo:
1. ✅ Check existing sidebar structure
2. Add approval buttons section at bottom of sidebar
3. Wire up `api.submitFeedback()` to buttons
4. Add simple comment textarea (optional)
5. Show success/error toast notifications
6. Refresh predictions list after approval
7. Disable buttons if already validated
8. Show validation status (who approved, when)

**Files to modify:**
- `frontend/app/components/prediction-detail-sheet.tsx`
- `frontend/types/index.ts` (add FeedbackSubmission type)

**UI Design:**
```
┌─────────────────────────────────┐
│ Prediction Detail               │
│ ─────────────────────────────── │
│ Patient: Jana Nováková          │
│ Main Diagnosis: I501            │
│ Secondary: +2                   │
│                                 │
│ [Already shows this ✅]         │
│                                 │
│ ─────────────────────────────── │
│ Actions:                        │
│                                 │
│ [✓ Approve]  [✗ Reject & Edit] │
│                                 │
│ Comment (optional):             │
│ [                             ] │
└─────────────────────────────────┘
```

---

### Phase 2: Doomscroll Approval Page (Advanced) 🚀

**Goal:** Full-screen side-by-side approval interface for rapid batch coding

#### Page Structure:
```
┌──────────────────────────────────────────────────────────────┐
│  /approve - Approval Mode                                    │
├──────────────────────────┬───────────────────────────────────┤
│ LEFT (Clinical Data)     │ RIGHT (Prediction)                │
│ 40% width                │ 60% width                         │
├──────────────────────────┼───────────────────────────────────┤
│                          │                                   │
│ 👤 Patient Info          │ 🎯 Main Diagnosis                 │
│ Jana Nováková, 49, F     │ I501 - Heart Failure (92%)       │
│ Birth: 6469567539        │                                   │
│                          │ 📋 Secondary Diagnoses            │
│ 📅 Case Info             │ N17 - Acute Kidney Injury (85%)  │
│ Admission: 2025-01-11    │ E87 - Electrolyte Disorder (78%) │
│ Discharge: 2025-01-12    │                                   │
│                          │ ─────────────────────────────────│
│ 📝 Clinical Text         │ ✏️ Edit Codes                     │
│ ┌──────────────────────┐│ Main: [I501 ▼] [Search...]       │
│ │Pacientka žijící...   ││                                   │
│ │chodící soběstačná... ││ Secondary:                        │
│ │                      ││ [N17 ▼] [x]                       │
│ │(scrollable)          ││ [E87 ▼] [x]                       │
│ └──────────────────────┘│ [+ Add code]                      │
│                          │                                   │
│ 🧪 Biochemistry         │ 💬 Comment                        │
│ ┌──────────────────────┐│ [                               ] │
│ │NA 143.0 mmol/L...    ││                                   │
│ └──────────────────────┘│ ═════════════════════════════════│
│                          │                                   │
│ 🩸 Hematology           │ [✓ Approve] [✗ Reject] [→ Next]  │
│ ┌──────────────────────┐│                                   │
│ │WBC 6.0 x10^9/L...    ││ ⌨️  Shortcuts:                    │
│ └──────────────────────┘│ A = Approve  R = Reject  N = Next│
│                          │                                   │
│ 🦠 Microbiology         │ 👤 Validated by: [Your Name]     │
│ ┌──────────────────────┐│                                   │
│ │Q_MOČ-PM...           ││                                   │
│ └──────────────────────┘│                                   │
└──────────────────────────┴───────────────────────────────────┘

Progress: 1/15 pending predictions  [████░░░░░] 27%
```

#### Features:
1. **Auto-load next unvalidated prediction**
2. **Keyboard shortcuts:**
   - `A` = Approve
   - `R` = Reject (focus on edit)
   - `N` = Next prediction
   - `Cmd/Ctrl + Enter` = Submit
3. **Code search with autocomplete**
4. **Side-by-side clinical data + prediction**
5. **Progress tracking**
6. **Batch workflow optimization**

#### Todo List:

**Backend (if needed):**
1. ✅ Endpoint already exists: `POST /api/predictions/{id}/feedback`
2. ✅ Filter predictions by `validated=false`
3. Maybe add: `GET /api/predictions/next-unvalidated` (optional)

**Frontend:**
1. Create new route: `/approve` or `/review`
2. Create approval page component with split layout
3. Implement left panel (clinical data display)
4. Implement right panel (prediction + actions)
5. Add code search component (search diagnosis codes)
6. Add autocomplete dropdown for code selection
7. Wire up approve/reject/next buttons
8. Implement keyboard shortcuts
9. Add progress bar/counter
10. Handle edge cases (no more predictions, errors)
11. Add smooth transitions between predictions
12. Persist coder name in localStorage

**Code Search Component:**
- Use existing `/api/codes/search` endpoint
- Debounced search input
- Dropdown with top 10 results
- Keyboard navigation (up/down/enter)

---

## Implementation Todos

### 🔥 High Priority - Sidebar Approval (Quick Win)

- [ ] 1.1: Update `prediction-detail-sheet.tsx` to show approve/reject buttons
- [ ] 1.2: Add approval actions state (loading, success, error)
- [ ] 1.3: Wire up `api.submitFeedback()` call
- [ ] 1.4: Add toast notifications for success/error
- [ ] 1.5: Refresh predictions list after approval (invalidate React Query)
- [ ] 1.6: Show validation status if already approved
- [ ] 1.7: Disable buttons if already validated

### 🚀 High Priority - Doomscroll Page (Main Feature)

#### Foundation:
- [ ] 2.1: Create `/approve` route in Next.js
- [ ] 2.2: Create `ApprovalPage` component with split layout
- [ ] 2.3: Fetch first unvalidated prediction on mount
- [ ] 2.4: Create left panel component (clinical data)
- [ ] 2.5: Create right panel component (prediction + actions)

#### Left Panel (Clinical):
- [ ] 2.6: Display patient demographics with icons
- [ ] 2.7: Display case info (admission/discharge dates)
- [ ] 2.8: Show clinical text in scrollable section
- [ ] 2.9: Show biochemistry in collapsible/scrollable section
- [ ] 2.10: Show hematology in collapsible/scrollable section
- [ ] 2.11: Show microbiology in collapsible/scrollable section

#### Right Panel (Prediction):
- [ ] 2.12: Display main diagnosis with confidence
- [ ] 2.13: Display secondary diagnoses list
- [ ] 2.14: Add edit mode toggle
- [ ] 2.15: Create code search input component
- [ ] 2.16: Connect to `/api/codes/search` endpoint
- [ ] 2.17: Implement autocomplete dropdown
- [ ] 2.18: Allow adding/removing secondary codes
- [ ] 2.19: Add comment textarea

#### Actions:
- [ ] 2.20: Implement "Approve" button action
- [ ] 2.21: Implement "Reject" button action (with corrections)
- [ ] 2.22: Implement "Next" button (load next prediction)
- [ ] 2.23: Add keyboard shortcuts (A/R/N)
- [ ] 2.24: Add Cmd/Ctrl+Enter to submit

#### UX Polish:
- [ ] 2.25: Add progress bar (X of Y predictions)
- [ ] 2.26: Add smooth transition animations
- [ ] 2.27: Handle "no more predictions" state
- [ ] 2.28: Add loading states for all actions
- [ ] 2.29: Add error handling with retry
- [ ] 2.30: Persist coder name in localStorage
- [ ] 2.31: Add toast notifications
- [ ] 2.32: Make panels resizable (optional)

### 🎨 Medium Priority - Polish

- [ ] 3.1: Add keyboard shortcut hints overlay
- [ ] 3.2: Add "Skip" button to skip prediction
- [ ] 3.3: Add filter to show only high-confidence predictions
- [ ] 3.4: Add statistics dashboard (approved/rejected counts)
- [ ] 3.5: Add "Undo" for last approval (within 5 seconds)

---

## API Endpoints Summary

### Already Available:
- ✅ `GET /api/predictions?validated=false` - Get unvalidated predictions
- ✅ `GET /api/predictions/{id}` - Get single prediction with case/patient
- ✅ `POST /api/predictions/{id}/feedback` - Submit approval/rejection
- ✅ `GET /api/codes/search?q={query}` - Search diagnosis codes

### Might Need:
- ❓ `GET /api/predictions/next-unvalidated` - Get next unvalidated (optional, can filter client-side)

---

## Data Flow

```
1. Load /approve page
   ↓
2. Fetch predictions where validated=false
   ↓
3. Display first prediction
   ↓
4. Show clinical data (left) + prediction (right)
   ↓
5. User reviews and clicks:
   - Approve → POST /feedback (approved)
   - Reject → Edit codes → POST /feedback (rejected + corrections)
   - Next → Load next prediction
   ↓
6. Auto-advance to next prediction
   ↓
7. Repeat until all done
```

---

## Success Metrics

- ⚡ **Speed:** Coder can review 10+ predictions in under 5 minutes
- ⌨️ **Keyboard-first:** All actions via keyboard shortcuts
- 🎯 **Accuracy:** Easy to spot and correct errors
- 🔄 **Workflow:** Smooth, no page reloads

---

## Next Steps

1. **Start with Phase 1** (Sidebar) - Quick win, test feedback API
2. **Then Phase 2** (Doomscroll page) - Main feature for production use
3. **Polish and optimize** based on real coder feedback

Ready to implement! 🚀
