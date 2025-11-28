export interface HighlightSpan {
    id: string;
    start: number;
    end: number;
}

export interface Diagnosis {
    id: string;
    code: string;
    name: string;
    probability?: number;
    source?: 'ai' | 'human';
    severity?: string;
    ccLevel?: string;
}

export interface Procedure {
    id: string;
    code: string;
    name: string;
    probability?: number;
    source?: 'ai' | 'human';
}

export interface CaseMetadata {
    patientAge?: number;
    patientSex?: 'Male' | 'Female' | 'Other';
    admissionDate?: string;
    dischargeDate?: string;
    department?: string;
    payer?: string;
    treatmentType?: string;
    status?: 'Closed' | 'Blocked' | 'Open';
    notes?: string;
    riskScore?: number;
}

export interface CaseResult {
    drgCode: string;
    drgName: string;
    reliabilityScore: number;
    los: number; // Length of Stay
    rv: number; // Relative Value
    revenue: number;
    cost: number;
    diagnoses: Diagnosis[];
    procedures: Procedure[];
    metadata: CaseMetadata;
    highlights: HighlightSpan[];
}
