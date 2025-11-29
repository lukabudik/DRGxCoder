// Patient Case
export interface PatientCase {
  id: string;
  pac_id: string;
  clinical_text: string;
  biochemistry?: string;
  hematology?: string;
  microbiology?: string;
  medication?: string;
  created_at: string;
  predictions_count?: number;
}

// Diagnosis Code
export interface DiagnosisCode {
  code: string;
  name: string;
  confidence?: number;
  reasoning?: string;
}

// Prediction
export interface Prediction {
  id: string;
  case_id: string;
  pac_id: string;
  
  // Step 1
  selected_codes: string[];
  selected_codes_reasoning: string;
  
  // Step 2 - Main diagnosis
  main_code: string;
  main_name: string;
  main_confidence: number;
  main_reasoning: string;
  
  // Step 2 - Secondary diagnoses
  secondary_codes: DiagnosisCode[];
  
  // Metadata
  model_used: string;
  processing_time: number;
  validated: boolean;
  validated_at?: string;
  validated_by?: string;
  feedback_type?: 'approved' | 'rejected';
  feedback_comment?: string;
  corrections?: any;
  created_at: string;
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
  main_diagnosis: {
    code: string;
    name: string;
    confidence: number;
    reasoning: string;
  };
  secondary_diagnoses: DiagnosisCode[];
  selected_codes: string[];
  processing_time: number;
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

// Paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
