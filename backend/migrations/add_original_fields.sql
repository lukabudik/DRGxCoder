-- Add fields for preserving original AI prediction
ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS original_main_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS original_main_name TEXT,
ADD COLUMN IF NOT EXISTS original_main_confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS original_secondary_codes JSONB,
ADD COLUMN IF NOT EXISTS corrected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMP;

-- Add index for corrected field
CREATE INDEX IF NOT EXISTS idx_predictions_corrected ON predictions(corrected);

-- Update existing records to set corrected = false if null
UPDATE predictions SET corrected = FALSE WHERE corrected IS NULL;
