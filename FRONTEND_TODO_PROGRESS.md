# Frontend TODO Progress

## ✅ Completed (High Priority)

### 1. Fix main table to show patient data ✅
- Updated `Prediction` type to include nested `case.patient`
- Table now displays:
  - Patient name (Last, First)
  - Age (calculated from DOB)
  - Sex (M/F)
- Falls back to PAC ID if patient data unavailable

### 2. Fix prediction sidebar ✅  
- Shows patient name instead of PAC ID
- Displays age and sex
- Added navigation buttons:
  - "View Patient: {name}" → goes to `/patients/{id}`
  - "View Case" → goes to `/cases/{id}`
- Added `useRouter` for navigation

### 3. Update API to return nested data ✅
**Backend changes (`backend/app/main.py`):**
- `GET /api/predictions` - Returns nested `case.patient` data
- `GET /api/predictions/{id}` - Returns full case and patient details
- `GET /api/cases/{id}` - Returns patient data with case
- Removed Pydantic models to allow flexible JSON responses

**Response structure:**
```json
{
  "predictions": [{
    "id": "...",
    "main_code": "I501",
    "secondary_codes": [...],
    "case": {
      "id": "...",
      "patient": {
        "id": "...",
        "first_name": "Jana",
        "last_name": "Nováková",
        "date_of_birth": "1975-05-20",
        "sex": "F"
      }
    }
  }]
}
```

### 4. Show secondary codes as +N badge ✅
- Updated Prediction type to include `secondary_codes`
- Backend returns secondary codes in list response
- Table displays badge like `I501 +2` when secondary codes exist
- Badge styled with secondary variant, small size

### 5. Display all clinical data in case page ✅
**File:** `frontend/app/cases/[id]/page.tsx`
- Shows full clinical text (not truncated)
- Separate sections for:
  - Clinical Text
  - Biochemistry
  - Hematology  
  - Microbiology
  - Medication
- Each section scrollable with max-height 300px
- Clean grid layout with proper spacing

### 6. Test navigation flow ✅
- Patient → Cases works
- Case → Patient works
- Case → Predictions works
- Prediction → Case/Patient works
- Backend returns all needed nested data

## 🔄 In Progress / Pending

### Medium Priority:
- [ ] Add loading skeletons and error states
- [ ] Fix search to work with patient names
- [ ] Add pagination controls

### Low Priority:
- [ ] Create separate views (Predictions/Cases/Patients tabs)
- [ ] Add confidence level filter
- [ ] Polish layouts and responsive design

## 📊 Database Relationships (Working!)

```
patients
├─ id (PK)
├─ birthNumber (UNIQUE)
└─ ...

patient_cases
├─ id (PK)
├─ patientId (FK → patients.id) ✅
├─ pacId (hospital admission ID, just text)
└─ ...

predictions
├─ id (PK)
├─ caseId (FK → patient_cases.id) ✅
└─ ...
```

## 🎯 Key Files Modified

### Backend:
- `backend/app/main.py` - Updated 3 endpoints to return nested data

### Frontend:
- `frontend/app/components/predictions-database.tsx` - Table with patient data
- `frontend/app/components/prediction-detail-sheet.tsx` - Sidebar with navigation
- `frontend/app/cases/[id]/page.tsx` - Full clinical data display
- `frontend/app/patients/[id]/page.tsx` - Patient detail (already created)

## 🚀 What's Working Now

1. **Upload XML** → Patient created/found, case linked, prediction made
2. **Main Table** → Shows patient name, age, sex, +N badge for secondary codes
3. **Click Row** → Opens sidebar with patient info and navigation buttons
4. **Click "View Patient"** → Navigate to patient page with all cases
5. **Click "View Case"** → Navigate to case page with all clinical data
6. **Case Page** → Shows all sections: clinical text, biochemistry, hematology, microbiology, medication

## 🐛 Debug Tips

Check browser console for:
```
Predictions API response: { predictions: [...], total: X }
First prediction: { id: "...", case: { patient: {...} } }
```

This confirms nested data is being received!

## 📝 Next Session Priority

Focus on user experience:
1. Add loading states (shimmer/skeleton)
2. Improve search (filter by patient name)
3. Add pagination for large datasets
4. Polish responsive design
