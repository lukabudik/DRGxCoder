import type { CaseResult, CoderCaseData, HighlightSpan } from '../../core/types';

const MOCK_DELAY = 1500;
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const analyzeText = async (text: string): Promise<CaseResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate some mock highlights based on the text
            const highlights: HighlightSpan[] = [];
            const words = text.split(/\s+/);

            if (words.length > 5) {
                let currentPos = 0;
                words.forEach((word, index) => {
                    if (index % 10 === 0 || ['fever', 'pain', 'fracture', 'diabetes'].some(k => word.toLowerCase().includes(k))) {
                        const start = text.indexOf(word, currentPos);
                        if (start !== -1) {
                            highlights.push({
                                id: `hl-${index}`,
                                start,
                                end: start + word.length
                            });
                        }
                    }
                    currentPos += word.length + 1;
                });
            }

            resolve({
                // Basic Info
                mainDiagnosis: 'J18.9',
                hospEnd: '1',
                patientAge: 65,
                patientAgeUnit: 'years',
                patientWeight: 82,
                patientSex: '1',
                ventilationHours: 0,
                caseYear: 2023,

                // Case Info
                hospDays: 5,
                primaryExpenses: 15000,
                hospitalId: '12345678',

                // Lists
                otherDiagnoses: [
                    { id: 'd2', code: 'R06.02', name: 'Shortness of breath', probability: 0.88, source: 'ai', weight: 1, reason: 'Patient reported difficulty breathing upon admission.' },
                    { id: 'd3', code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', probability: 0.75, source: 'human', weight: 1, reason: 'History of T2DM noted in patient records.' }
                ],
                procedures: [
                    { id: 'p1', code: '3E0234Z', name: 'Introduction of Serum/Toxoid into Muscle', probability: 0.65, source: 'ai', amount: 1 }
                ],
                criticalItems: [],

                // Specifics
                therapeuticDays: {
                    radiation: 0,
                    liver: 0,
                    chest: 0,
                    psychotherapy: 0,
                    chestDrainage: 0,
                    skull: 0,
                    eye: 0,
                    burn: 0,
                    heart: 0,
                    tissue: 0,
                    veins: 0,
                    pelvis: 0,
                    blood: 0,
                    orthopedic: 0
                },
                rehabilitation: {
                    bedType: '',
                    days: 0
                },

                // Computed
                drgCode: '194',
                drgName: 'Simple Pneumonia & Pleurisy w/ CC',
                reliabilityScore: 0.85,
                los: 4.2,
                rv: 1.2,
                revenue: 5400,
                cost: 3200,

                // Metadata
                metadata: {
                    admissionDate: '2023-10-01',
                    dischargeDate: '2023-10-05',
                    department: 'Internal Medicine',
                    payer: 'Medicare',
                    status: 'Open',
                    riskScore: 3
                },

                // Highlights
                diagnoses: [
                    { id: 'd1', code: 'J18.9', name: 'Pneumonia, unspecified organism', probability: 0.92, source: 'ai', reason: 'Chest X-ray shows consolidation consistent with pneumonia.' },
                    { id: 'd2', code: 'R06.02', name: 'Shortness of breath', probability: 0.88, source: 'ai', reason: 'Patient reported difficulty breathing upon admission.' },
                    { id: 'd3', code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', probability: 0.75, source: 'human', reason: 'History of T2DM noted in patient records.' }
                ],
                highlights
            });
        }, MOCK_DELAY);
    });
};

export const submitCoderRepair = async (payload: CoderCaseData) => {
    const target = API_BASE ? `${API_BASE}/cases/repair` : '/api/cases/repair';

    if (API_BASE) {
        const response = await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Failed to submit repair');
        }

        return response.json();
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            // Mocked acknowledgement to keep the flow working without a backend
            resolve({ status: 'ok' });
        }, 750);
    });
};
