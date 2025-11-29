// Patient (demographics)
export interface Patient {
  id: string;
  birth_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string; // "M" or "F"
  country_of_residence?: string;
  created_at: string;
  updated_at: string;
}

// Patient Case (hospital admission/episode)
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
  raw_xml?: string;
  created_at: string;
  updated_at: string;
  predictions_count?: number;
  
  // Relations
  patient?: Patient;
}

// Diagnosis Code
export interface DiagnosisCode {
  code: string;
  name: string;
  confidence?: number;
  reasoning?: string;
}

// Prediction (matches backend PredictionResponse)
export interface Prediction {
  prediction_id: string;
  case_id: string;
  pac_id?: string;
  
  // Step 1
  selected_codes: string[];
  step1_reasoning: string;
  
  // Step 2 - Main diagnosis
  main_diagnosis: DiagnosisCode;
  secondary_diagnoses: DiagnosisCode[];
  
  // Metadata
  model_used: string;
  processing_time: number;
  validated?: boolean;
  validated_at?: string;
  validated_by?: string;
  feedback_type?: 'approved' | 'rejected';
  feedback_comment?: string;
  corrections?: any;
  created_at: string;
}

// Prediction List Item (matches backend PredictionListItem)
export interface PredictionListItem {
  id: string;
  case_id: string;
  pac_id?: string;
  main_code: string;
  main_name: string;
  main_confidence: number;
  validated: boolean;
  created_at: string;
  
  // Relations
  case?: PatientCase;
}

// API Request/Response types
export interface PredictRequest {
  clinical_text: string;
  biochemistry?: string;
  hematology?: string;
  microbiology?: string;
  medication?: string;
  pac_id?: string;
}

export interface PredictResponse {
  prediction_id: string;
  case_id: string;
  selected_codes: string[];
  step1_reasoning: string;
  main_diagnosis: DiagnosisCode;
  secondary_diagnoses: DiagnosisCode[];
  model_used: string;
  processing_time: number;
  created_at: string;
}

// Feedback
export interface CorrectedCode {
  action: 'added' | 'removed' | 'modified';
  code: string;
  name?: string;
  original_code?: string;
}

export interface FeedbackSubmission {
  validated_by: string;
  feedback_type: 'approved' | 'rejected';
  corrected_main_code?: string;
  corrected_main_name?: string;
  corrected_secondary?: CorrectedCode[];
  feedback_comment?: string;
}

// Paginated responses (matches backend)
export interface PaginatedPredictions {
  predictions: PredictionListItem[];
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedCases {
  cases: PatientCase[];
  total: number;
  page: number;
  pages: number;
}
