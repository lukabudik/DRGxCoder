-- CreateTable
CREATE TABLE IF NOT EXISTS "patients" (
    "id" TEXT NOT NULL,
    "birthNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "countryOfResidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "patients_birthNumber_key" ON "patients"("birthNumber");
CREATE INDEX IF NOT EXISTS "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");
CREATE INDEX IF NOT EXISTS "patients_birthNumber_idx" ON "patients"("birthNumber");

-- Step 1: Add new columns to patient_cases (nullable first)
ALTER TABLE "patient_cases" ADD COLUMN IF NOT EXISTS "patientId" TEXT;
ALTER TABLE "patient_cases" ADD COLUMN IF NOT EXISTS "hospitalPatientId" TEXT;
ALTER TABLE "patient_cases" ADD COLUMN IF NOT EXISTS "admissionDate" TIMESTAMP(3);
ALTER TABLE "patient_cases" ADD COLUMN IF NOT EXISTS "dischargeDate" TIMESTAMP(3);
ALTER TABLE "patient_cases" ADD COLUMN IF NOT EXISTS "rawXml" TEXT;

-- Step 2: Migrate existing cases - create a default patient for each
DO $$
DECLARE
    case_record RECORD;
    new_patient_id TEXT;
BEGIN
    FOR case_record IN SELECT * FROM "patient_cases" WHERE "patientId" IS NULL
    LOOP
        -- Generate patient ID
        new_patient_id := gen_random_uuid()::text;
        
        -- Create patient with data from case (or defaults if missing)
        INSERT INTO "patients" (
            "id",
            "birthNumber",
            "firstName",
            "lastName",
            "dateOfBirth",
            "sex",
            "countryOfResidence",
            "createdAt",
            "updatedAt"
        ) VALUES (
            new_patient_id,
            COALESCE(case_record."birthNumber", 'MIGRATED_' || case_record.id),
            COALESCE(case_record."firstName", 'Unknown'),
            COALESCE(case_record."lastName", 'Patient'),
            COALESCE(case_record."dateOfBirth", '1970-01-01'::timestamp),
            COALESCE(case_record."sex", 'U'),
            case_record."countryOfResidence",
            case_record."createdAt",
            case_record."updatedAt"
        )
        ON CONFLICT ("birthNumber") DO NOTHING;
        
        -- If patient already exists (conflict), get their ID
        IF NOT FOUND THEN
            SELECT id INTO new_patient_id FROM "patients" 
            WHERE "birthNumber" = COALESCE(case_record."birthNumber", 'MIGRATED_' || case_record.id);
        END IF;
        
        -- Link case to patient
        UPDATE "patient_cases" 
        SET "patientId" = new_patient_id
        WHERE id = case_record.id;
    END LOOP;
END $$;

-- Step 3: Make patientId required now that all cases have one
ALTER TABLE "patient_cases" ALTER COLUMN "patientId" SET NOT NULL;

-- Step 4: Drop old demographic columns from patient_cases
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "birthNumber";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "firstName";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "lastName";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "dateOfBirth";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "sex";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "countryOfResidence";
ALTER TABLE "patient_cases" DROP COLUMN IF EXISTS "patientId_old";

-- Step 5: Add foreign key constraint
ALTER TABLE "patient_cases" ADD CONSTRAINT "patient_cases_patientId_fkey" 
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS "patient_cases_patientId_idx" ON "patient_cases"("patientId");
CREATE INDEX IF NOT EXISTS "patient_cases_pacId_idx" ON "patient_cases"("pacId");
