# Frontend Fixes - Patient Data Display

## What Was Fixed:

### 1. Backend API - Return Nested Data ✅
**File:** `backend/app/main.py`

- Updated `GET /api/predictions` to return nested `case.patient` data
- Updated `GET /api/predictions/{id}` to return full case and patient details
- Removed Pydantic response models to allow flexible nested JSON

**Response structure now includes:**
```json
{
  "predictions": [
    {
      "id": "...",
      "main_code": "I501",
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
    }
  ]
}
```

### 2. Frontend Table - Show Patient Data ✅
**File:** `frontend/app/components/predictions-database.tsx`

- Updated Prediction type to include nested `case.patient`
- Added debug logging to check API response
- Table columns already correctly access nested data:
  - Patient name: `row.original.case?.patient?.last_name, first_name`
  - Age: Calculated from `patient.date_of_birth`
  - Sex: `patient.sex`

### 3. Prediction Sidebar - Patient Info & Navigation ✅
**File:** `frontend/app/components/prediction-detail-sheet.tsx`

- Shows patient name instead of PAC ID
- Displays age and sex
- Added navigation buttons:
  - "View Patient: {name}" → `/patients/{id}`
  - "View Case" → `/cases/{id}`
- Added `useRouter` for navigation

## How To Test:

1. **Upload an XML file** (backend should be running)
2. **Check main table** - Should show:
   - Patient name (e.g., "Nováková, Jana")
   - Age (e.g., "49")
   - Sex (e.g., "F")
3. **Click a prediction row** - Opens sidebar
4. **Check sidebar** - Should show:
   - Patient name
   - Age / Sex
   - "View Patient: Jana" button
   - "View Case" button
5. **Click "View Patient"** - Navigate to patient detail page
6. **Click "View Case"** - Navigate to case detail page

## Database Relationships (Already Working):

```
patients table
├─ id (PK)
├─ birthNumber (UNIQUE)
├─ firstName
├─ lastName
└─ ...

patient_cases table
├─ id (PK)
├─ patientId (FK → patients.id) ✅
├─ pacId (just a string, hospital ID)
└─ ...

predictions table
├─ id (PK)
├─ caseId (FK → patient_cases.id) ✅
└─ ...
```

## Next Steps:

- [ ] Show secondary codes as +N badge in table
- [ ] Display biochemistry/hematology/microbiology in sidebar
- [ ] Add proper loading skeletons
- [ ] Fix search to work with patient names
- [ ] Add pagination controls
- [ ] Test complete navigation flow

## Debug Console Output:

When the page loads, check browser console for:
```
Predictions API response: { predictions: [...], total: X }
First prediction: { id: "...", case: { patient: {...} } }
Processed predictions: [...]
```

This confirms the nested data is being received correctly!
