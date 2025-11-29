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
    reason?: string;
    source?: 'ai' | 'human';
    severity?: string;
    ccLevel?: string;
    weight?: number; // For coder editing
}

export interface Procedure {
    id: string;
    code: string;
    name: string;
    probability?: number;
    source?: 'ai' | 'human';
    amount?: number; // For coder editing
    date?: string;
}

export interface TherapeuticDays {
    radiation?: number;
    liver?: number;
    chest?: number;
    psychotherapy?: number;
    chestDrainage?: number;
    skull?: number;
    eye?: number;
    burn?: number;
    heart?: number;
    tissue?: number;
    veins?: number;
    pelvis?: number;
    blood?: number;
    orthopedic?: number;
}

export interface Rehabilitation {
    bedType: '1F1' | '2F1' | '2H1' | '';
    days: number;
}

export interface CriticalItem {
    id: string;
    code: string;
    amount: number;
}

export interface CoderCaseData {
    // Basic Info
    mainDiagnosis: string;
    hospEnd: string; // 0-8, P
    patientAge: number;
    patientAgeUnit: 'years' | 'days';
    patientWeight?: number;
    patientSex: '1' | '2' | ''; // 1=Male, 2=Female
    ventilationHours?: number;
    caseYear: number;

    // Case Info
    hospDays: number;
    primaryExpenses: number;
    hospitalId: string;

    // Lists
    otherDiagnoses: Diagnosis[];
    procedures: Procedure[];
    criticalItems: CriticalItem[];

    // Specifics
    therapeuticDays: TherapeuticDays;
    rehabilitation: Rehabilitation;
}

export interface CaseResult extends CoderCaseData {
    diagnoses: Diagnosis[];
    // Computed/AI fields
    drgCode: string;
    drgName: string;
    reliabilityScore: number;
    los: number; // Length of Stay (computed/avg)
    rv: number; // Relative Value
    revenue: number;
    cost: number;

    highlights: HighlightSpan[];
}
