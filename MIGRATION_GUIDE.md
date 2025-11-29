# Migration Guide: Patient/Case Separation

## 🚨 Important: This is a Breaking Change

The database schema has changed significantly. Existing data will need migration.

## Step 1: Backup Current Database

```bash
# Export current data (if you have any test cases)
cd backend
python -m app.scripts.export_data  # Create this if needed

# Or just snapshot the database
pg_dump $DATABASE_URL > backup_before_migration.sql
```

## Step 2: Run Prisma Migration

```bash
cd backend

# Generate migration
prisma migrate dev --name add_patients_and_update_cases

# This will:
# 1. Create new 'patients' table
# 2. Add patientId column to patient_cases
# 3. Drop old demographic columns from patient_cases
# 4. Add new columns (hospitalPatientId, admissionDate, dischargeDate, rawXml)
```

## Step 3: Regenerate Prisma Client

```bash
prisma generate
```

## Step 4: Migrate Existing Data (If Any)

If you have existing cases in the database, run this migration script:

```python
# backend/app/scripts/migrate_cases_to_patients.py

"""
Migrate existing PatientCase records to new Patient/Case structure
"""

import asyncio
from app.database import db
from datetime import datetime

async def migrate_existing_cases():
    """
    For each existing case:
    1. Extract demographics (if present)
    2. Create or find patient
    3. Link case to patient
    """
    await db.connect()
    
    # Get all cases without a patientId
    cases = await db.patientcase.find_many(
        where={"patientId": None}
    )
    
    print(f"Found {len(cases)} cases to migrate")
    
    for case in cases:
        # Extract demographics from old schema
        birth_number = getattr(case, 'birthNumber', None) or "MIGRATED_" + case.id
        first_name = getattr(case, 'firstName', None) or "Unknown"
        last_name = getattr(case, 'lastName', None) or "Patient"
        date_of_birth = getattr(case, 'dateOfBirth', None) or datetime(1970, 1, 1)
        sex = getattr(case, 'sex', None) or "U"
        country = getattr(case, 'countryOfResidence', None)
        
        # Find or create patient
        patient = await db.patient.find_unique(
            where={"birthNumber": birth_number}
        )
        
        if not patient:
            patient = await db.patient.create(
                data={
                    "birthNumber": birth_number,
                    "firstName": first_name,
                    "lastName": last_name,
                    "dateOfBirth": date_of_birth,
                    "sex": sex,
                    "countryOfResidence": country,
                }
            )
            print(f"Created patient: {patient.id}")
        
        # Link case to patient
        await db.patientcase.update(
            where={"id": case.id},
            data={"patientId": patient.id}
        )
        print(f"Linked case {case.id} to patient {patient.id}")
    
    await db.disconnect()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_existing_cases())
```

Run it:
```bash
python -m app.scripts.migrate_cases_to_patients
```

## Step 5: Update Frontend API Calls

### Old Code (frontend/app/components/new-prediction-dialog.tsx):
```typescript
const predictMutation = useMutation({
  mutationFn: async (file: File) => {
    const text = await file.text();
    return api.predict({ clinical_text: text });  // ❌ OLD
  },
  // ...
});
```

### New Code:
```typescript
const predictMutation = useMutation({
  mutationFn: async (file: File) => {
    const xmlContent = await file.text();
    // Call new XML endpoint
    return fetch(`${API_BASE_URL}/api/predict/xml`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: xmlContent,  // Send raw XML
    }).then(res => res.json());
  },
  // ...
});
```

### Update api.ts:
```typescript
// frontend/lib/api.ts

export const api = {
  // New XML prediction endpoint
  predictFromXml: (xmlContent: string) =>
    fetch(`${API_BASE_URL}/api/predict/xml`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: xmlContent,
    }).then(res => {
      if (!res.ok) throw new Error('Prediction failed');
      return res.json();
    }),
    
  // Old endpoint (keep for backward compatibility)
  predict: (data: PredictRequest) => 
    fetchAPI<PredictResponse>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // ... rest of API
};
```

## Step 6: Update TypeScript Types

### Add Patient type (frontend/types/index.ts):
```typescript
export interface Patient {
  id: string;
  birth_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  country_of_residence?: string;
  created_at: string;
}

export interface PatientCase {
  id: string;
  patient_id: string;
  pac_id?: string;
  hospital_patient_id?: string;
  admission_date?: string;
  discharge_date?: string;
  clinical_text: string;
  biochemistry?: string;
  hematology?: string;
  microbiology?: string;
  medication?: string;
  created_at: string;
  
  // Relations
  patient?: Patient;
  predictions?: Prediction[];
}
```

## Step 7: Update Table to Show Patient Info

```typescript
// frontend/app/components/predictions-database.tsx

// Add columns for patient demographics
const columns = useMemo<ColumnDef<Prediction>[]>(() => [
  { 
    id: 'select', 
    header: CheckboxHeader, 
    cell: CheckboxCell 
  },
  { 
    accessorKey: 'patient_name',  // NEW
    header: 'Patient',
    cell: ({ row }) => {
      const patient = row.original.case?.patient;
      return patient ? `${patient.last_name}, ${patient.first_name}` : '-';
    }
  },
  { 
    accessorKey: 'patient_age',  // NEW
    header: 'Age',
    cell: ({ row }) => {
      const patient = row.original.case?.patient;
      if (!patient) return '-';
      const age = calculateAge(new Date(patient.date_of_birth));
      return age;
    }
  },
  { 
    accessorKey: 'patient_sex',  // NEW
    header: 'Sex',
    cell: ({ row }) => row.original.case?.patient?.sex || '-'
  },
  // ... existing columns
], []);
```

## Step 8: Test the Complete Flow

```bash
# 1. Start backend
cd backend
uvicorn app.main:app --reload

# 2. Start frontend
cd frontend
npm run dev

# 3. Test XML upload
# - Upload one of the sample XMLs from preprocessing/input/xml_input/
# - Verify patient demographics extracted
# - Verify clinical text separated correctly
# - Verify prediction runs successfully
# - Check database to confirm Patient and PatientCase created
```

## Step 9: Verify Database Structure

```sql
-- Check patients table
SELECT * FROM patients LIMIT 5;

-- Check cases linked to patients
SELECT 
  c.id as case_id,
  c.patient_id,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  c.created_at
FROM patient_cases c
JOIN patients p ON c.patient_id = p.id
LIMIT 5;

-- Check predictions with patient info
SELECT 
  pr.id as prediction_id,
  pr.main_code,
  pr.main_name,
  p.first_name,
  p.last_name,
  EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age
FROM predictions pr
JOIN patient_cases c ON pr.case_id = c.id
JOIN patients p ON c.patient_id = p.id
LIMIT 5;
```

## ✅ Migration Checklist

- [ ] Backup current database
- [ ] Run Prisma migration
- [ ] Regenerate Prisma client
- [ ] Migrate existing data (if any)
- [ ] Update frontend API calls to use `/api/predict/xml`
- [ ] Update TypeScript types
- [ ] Update table columns to show patient demographics
- [ ] Test complete XML upload → prediction flow
- [ ] Verify patient matching works (upload same patient twice)
- [ ] Verify predictions use patient context (age/sex)
- [ ] Check database structure is correct

## 🔄 Rollback Plan (If Needed)

```bash
# Restore from backup
psql $DATABASE_URL < backup_before_migration.sql

# Or rollback Prisma migration
prisma migrate reset

# Checkout previous code version
git checkout HEAD~1
```

## 🎉 After Migration

Your system will have:
- ✅ Proper patient/case separation
- ✅ No duplicate demographics
- ✅ Patient history tracking
- ✅ Better predictions with demographics
- ✅ Production-ready architecture

Ready to migrate! 🚀
