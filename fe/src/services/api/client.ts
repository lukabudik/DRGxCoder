import type { CaseResult, HighlightSpan } from '../../core/types';

const MOCK_DELAY = 1500;

export const analyzeText = async (text: string): Promise<CaseResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate some mock highlights based on the text
            const highlights: HighlightSpan[] = [];
            const words = text.split(/\s+/);

            // Pick a few random words to highlight if text is long enough
            if (words.length > 5) {
                let currentPos = 0;
                words.forEach((word, index) => {
                    // Highlight every 10th word or if it matches specific keywords (mock logic)
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
                    currentPos += word.length + 1; // +1 for space
                });
            }

            resolve({
                drgCode: '194',
                drgName: 'Simple Pneumonia & Pleurisy w/ CC',
                reliabilityScore: 0.85,
                los: 4.2,
                rv: 1.2,
                revenue: 5400,
                cost: 3200,
                diagnoses: [
                    { id: 'd1', code: 'J18.9', name: 'Pneumonia, unspecified organism', probability: 0.92, source: 'ai' },
                    { id: 'd2', code: 'R06.02', name: 'Shortness of breath', probability: 0.88, source: 'ai' },
                    { id: 'd3', code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', probability: 0.75, source: 'human' }
                ],
                procedures: [
                    { id: 'p1', code: '3E0234Z', name: 'Introduction of Serum/Toxoid into Muscle', probability: 0.65, source: 'ai' }
                ],
                metadata: {
                    patientAge: 65,
                    patientSex: 'Male',
                    admissionDate: '2023-10-01',
                    dischargeDate: '2023-10-05',
                    department: 'Internal Medicine',
                    payer: 'Medicare',
                    status: 'Open',
                    riskScore: 3
                },
                highlights
            });
        }, MOCK_DELAY);
    });
};
