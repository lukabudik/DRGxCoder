import type { TranslationSchema } from '../types';

export const en: TranslationSchema = {
    common: {
        appName: 'DRG Audit',
        demoBadge: 'Demo',
        language: {
            label: 'Language',
            cs: 'Czech',
            en: 'English',
        },
        actions: {
            settings: 'Settings',
            analyze: 'Analyze Text',
            clearNew: 'Clear & New',
            retry: 'Retry',
            show: 'Show',
            hide: 'Hide',
            remove: 'Remove',
            add: 'Add',
            submitRepair: 'Send repair to server',
        },
        states: {
            characters: '{{count}} characters',
            loading: 'Loading...',
        },
    },
    analyzer: {
        label: 'Clinician Text',
        helper: 'Paste discharge summary or epicrisis',
        placeholder: 'Paste clinical text here...',
        submit: 'Analyze Text',
    },
    home: {
        header: {
            settingsPlaceholder: 'Settings are not available yet',
        },
        analyzedTitle: 'Analyzed Text',
        clear: 'Clear & New',
        empty: 'Paste the epicrisis/discharge text and start the analysis.',
        errorTitle: 'Analysis Failed',
        errorDescription: "We couldn't process your request. Please try again.",
        retry: 'Retry',
        coder: {
            title: 'Coder Repair',
            hint: 'Expand if you want to adjust values and send a repair.',
            show: 'Show',
            hide: 'Hide',
        },
        emptyFooter: 'Highlighting is a demo mock — randomly generated for illustration.',
    },
    results: {
        summary: {
            reliability: 'Reliability',
            los: 'Length of stay',
            days: 'days',
            rv: 'Relative value',
            revenue: 'Revenue',
            drgLabel: 'DRG {{code}}',
            manualSelection: 'Manual selection',
        },
        diagnoses: {
            defaultTitle: 'Diagnoses (ICD-10)',
            principal: 'Principal Diagnosis (ICD-10)',
            secondary: 'Secondary Diagnoses (ICD-10)',
            expand: 'Show more ({{count}})',
            collapse: 'Hide',
            potentialExpand: 'Show',
            potentialCollapse: 'Hide',
            potentialTitle: 'Potential Principal Diagnoses',
            setPrincipal: 'Set as Principal',
        },
        search: {
            placeholder: 'Search by code or name...',
            noResults: 'No diagnoses found.',
            startTyping: 'Start typing to search...',
            modalTitle: 'Select Principal Diagnosis',
            customAction: 'Select Custom',
            manualSelection: 'Manual selection',
        },
        procedures: {
            title: 'Procedures',
        },
    },
    coder: {
        header: {
            kicker: 'Coder repair',
            title: 'Edit grouper inputs & send repair',
            subtitle: 'Fields mirror the CZ-DRG interactive classifier. Values below are fully editable.',
            success: 'Saved to server',
            error: 'Submission failed',
        },
        sections: {
            basics: {
                title: 'Basic information',
                helper: 'Primary diagnosis, discharge status, and patient basics.',
            },
            secondary: {
                title: 'Secondary diagnoses',
                helper: 'Ordering matters for acute rehabilitation (2H1/2F1).',
            },
            procedures: {
                title: 'Procedures',
                helper: 'Procedure code, name, and quantity.',
            },
            therapeutic: {
                title: 'Therapeutic days',
                helper: 'Number of days per requested category in the interactive classifier.',
            },
            rehab: {
                title: 'Rehabilitation',
                helper: 'Admission specialty 2H1 / 2F1 and number of rehab days.',
            },
            critical: {
                title: 'Separately billed critical items',
                helper: 'Critical item code and quantity.',
            },
        },
        fields: {
            mainDiagnosis: {
                label: 'Case primary diagnosis*',
                placeholder: 'e.g. J18.9',
            },
            hospEnd: {
                label: 'Discharge status (0-8, P)',
                placeholder: '1',
            },
            hospitalId: {
                label: 'Hospital ID',
                placeholder: '12345678',
            },
            caseYear: {
                label: 'Case discharge year',
            },
            patientAge: {
                label: 'Patient age on admission',
                years: 'years',
                days: 'days',
            },
            patientWeight: {
                label: 'Birth weight (g)',
                placeholder: 'e.g. 3200',
            },
            patientSex: {
                label: 'Patient sex',
                placeholder: 'Select',
                male: '1 – Male',
                female: '2 – Female',
            },
            ventilationHours: {
                label: 'Ventilation duration (hours)',
            },
            hospDays: {
                label: 'Case length (days)',
            },
            primaryExpenses: {
                label: 'Direct HP expenses (CZK)',
            },
            code: 'Code',
            name: 'Name',
            diagnosisCodePlaceholder: 'e.g. E11.9',
            diagnosisNamePlaceholder: 'Diagnosis description',
            procedureCodePlaceholder: 'e.g. 3E0234Z',
            procedureNamePlaceholder: 'Procedure description',
            amount: 'Quantity',
            severity: {
                label: 'Severity',
                placeholder: 'Not specified',
                none: '0 – no CC/MCC',
                cc: '1 – CC',
                mcc: '2 – MCC',
            },
            rehabBedType: {
                label: 'Admission specialty',
                placeholder: 'Not specified',
                h2: '2H1',
                f2: '2F1',
                f1: '1F1',
            },
            rehabDays: {
                label: 'Rehab days',
            },
            criticalAmount: {
                label: 'Quantity',
            },
            criticalCodePlaceholder: 'Item code',
        },
        actions: {
            removeDiagnosis: 'Remove secondary diagnosis',
            addDiagnosis: 'Add secondary diagnosis',
            removeProcedure: 'Remove procedure',
            addProcedure: 'Add procedure',
            removeCritical: 'Remove critical item',
            addCritical: 'Add critical item',
        },
        therapeuticDays: {
            radiation: 'Number of radiation days',
            liver: 'Days with endoscopic/radiologic liver procedure',
            chest: 'Days with surgery in the chest cavity',
            psychotherapy: 'Days of acute psychiatric care',
            chestDrainage: 'Days with chest drainage procedure',
            skull: 'Days with procedure on skull or brain',
            eye: 'Days with eye procedure',
            burn: 'Treatment days for burns/frostbite in CA',
            heart: 'Days with procedure on heart or aorta',
            tissue: 'Days with soft/connective tissue procedure',
            veins: 'Days with peripheral vascular procedure',
            pelvis: 'Days with surgery in abdominal/pelvic cavity',
            blood: 'Days with blood elimination methods',
            orthopedic: 'Days with orthopedic surgical procedure',
        },
        footer: {
            submit: 'Send repair to server',
            errorPrefix: 'Error: {{message}}',
        },
    },
};
