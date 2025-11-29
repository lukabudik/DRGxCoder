export const cs = {
    common: {
        appName: 'DRG Audit',
        demoBadge: 'Demo',
        language: {
            label: 'Jazyk',
            cs: 'Čeština',
            en: 'Angličtina',
        },
        actions: {
            settings: 'Nastavení',
            analyze: 'Analyzovat text',
            clearNew: 'Vymazat a nový',
            retry: 'Zkusit znovu',
            show: 'Zobrazit',
            hide: 'Skrýt',
            remove: 'Odebrat',
            add: 'Přidat',
            submitRepair: 'Odeslat opravu na server',
        },
        states: {
            characters: '{{count}} znaků',
            loading: 'Načítání...',
        },
    },
    analyzer: {
        label: 'Text lékaře',
        helper: 'Vložte propouštěcí zprávu nebo epikrízu',
        placeholder: 'Vložte klinický text sem...',
        submit: 'Analyzovat text',
    },
    home: {
        header: {
            settingsPlaceholder: 'Nastavení zatím není dostupné',
        },
        analyzedTitle: 'Analyzovaný text',
        clear: 'Vymazat a nový',
        empty: 'Vložte text epikrízy/propouštěcí zprávy a spusťte analýzu.',
        errorTitle: 'Analýza selhala',
        errorDescription: 'Nepodařilo se zpracovat požadavek. Zkuste to prosím znovu.',
        retry: 'Zkusit znovu',
        coder: {
            title: 'Oprava kodéra',
            hint: 'Rozbalte, pokud chcete upravit hodnoty a odeslat opravu.',
            show: 'Zobrazit',
            hide: 'Skrýt',
        },
        emptyFooter: 'Zvýraznění je demo (mock) - generuje se náhodně pro ukázku.',
    },
    results: {
        summary: {
            reliability: 'Spolehlivost',
            los: 'Délka pobytu',
            days: 'dní',
            rv: 'Relativní hodnota',
            revenue: 'Příjem',
            drgLabel: 'DRG {{code}}',
        },
        diagnoses: {
            defaultTitle: 'Diagnózy (ICD-10)',
            principal: 'Hlavní diagnóza (ICD-10)',
            secondary: 'Vedlejší diagnózy (ICD-10)',
            expand: 'Zobrazit další ({{count}})',
            collapse: 'Skrýt',
            potentialExpand: 'Zobrazit',
            potentialCollapse: 'Skrýt',
            potentialTitle: 'Potenciální hlavní diagnózy',
            setPrincipal: 'Nastavit jako hlavní',
        },
        search: {
            placeholder: 'Hledat podle kódu nebo názvu...',
            noResults: 'Žádné diagnózy nenalezeny.',
            startTyping: 'Začněte psát pro vyhledávání...',
            modalTitle: 'Vybrat hlavní diagnózu',
            customAction: 'Vybrat vlastní',
            manualSelection: 'Manuální výběr',
        },
        procedures: {
            title: 'Výkony',
        },
    },
    coder: {
        header: {
            kicker: 'Oprava kodéra',
            title: 'Upravte vstupy pro grouper a odešlete',
            subtitle: 'Pole odpovídají interaktivnímu klasifikátoru CZ-DRG. Hodnoty níže lze libovolně upravit.',
            success: 'Uloženo na server',
            error: 'Odeslání se nezdařilo',
        },
        sections: {
            basics: {
                title: 'Základní informace',
                helper: 'Hlavní diagnóza, ukončení hospitalizace a základní údaje o pacientovi.',
            },
            secondary: {
                title: 'Vedlejší diagnózy',
                helper: 'Pořadí je důležité pro akutní rehabilitaci (2H1/2F1).',
            },
            procedures: {
                title: 'Výkony',
                helper: 'Kód výkonu, název a počet (množství).',
            },
            therapeutic: {
                title: 'Terapeutické dny',
                helper: 'Počty dnů podle požadovaných kategorií v interaktivním klasifikátoru.',
            },
            rehab: {
                title: 'Rehabilitace',
                helper: 'Příjmová lůžková odbornost 2H1 / 2F1 a počet rehab. dnů.',
            },
            critical: {
                title: 'Zvlášť účtované kritické položky',
                helper: 'Kód kritické položky a množství.',
            },
        },
        fields: {
            mainDiagnosis: {
                label: 'Hlavní diagnóza případu*',
                placeholder: 'Např. J18.9',
            },
            hospEnd: {
                label: 'Ukončení hospitalizace (0-8, P)',
                placeholder: '1',
            },
            hospitalId: {
                label: 'Zdravotnické zařízení (IČZ)',
                placeholder: '12345678',
            },
            caseYear: {
                label: 'Rok ukončení případu',
            },
            patientAge: {
                label: 'Věk pacienta při přijetí',
                years: 'roky',
                days: 'dny',
            },
            patientWeight: {
                label: 'Porodní hmotnost (g)',
                placeholder: 'např. 3200',
            },
            patientSex: {
                label: 'Pohlaví pacienta',
                placeholder: 'Vyberte',
                male: '1 – Muž',
                female: '2 – Žena',
            },
            ventilationHours: {
                label: 'Délka připojení k UPV (hodiny)',
            },
            hospDays: {
                label: 'Délka případu (dny)',
            },
            primaryExpenses: {
                label: 'Přímé náklady HP (Kč)',
            },
            code: 'Kód',
            name: 'Název',
            diagnosisCodePlaceholder: 'Např. E11.9',
            diagnosisNamePlaceholder: 'Popis diagnózy',
            procedureCodePlaceholder: 'Např. 3E0234Z',
            procedureNamePlaceholder: 'Popis výkonu',
            amount: 'Počet',
            severity: {
                label: 'Závažnost',
                placeholder: 'Neuvedeno',
                none: '0 – bez CC/MCC',
                cc: '1 – CC',
                mcc: '2 – MCC',
            },
            rehabBedType: {
                label: 'Příjmová odbornost',
                placeholder: 'Neuvedeno',
                h2: '2H1',
                f2: '2F1',
                f1: '1F1',
            },
            rehabDays: {
                label: 'Počet rehabilitačních dnů',
            },
            criticalAmount: {
                label: 'Množství',
            },
            criticalCodePlaceholder: 'Kód položky',
        },
        actions: {
            removeDiagnosis: 'Odebrat vedlejší diagnózu',
            addDiagnosis: 'Přidat vedlejší diagnózu',
            removeProcedure: 'Odebrat výkon',
            addProcedure: 'Přidat výkon',
            removeCritical: 'Odebrat kritickou položku',
            addCritical: 'Přidat kritickou položku',
        },
        therapeuticDays: {
            radiation: 'Počet ozařovacích dnů',
            liver: 'Dny s endoskopickým/radiologickým výkonem na játrech',
            chest: 'Dny s operačním výkonem v dutině hrudní',
            psychotherapy: 'Dny akutní psychiatrické péče',
            chestDrainage: 'Dny s výkonem hrudní drenáže',
            skull: 'Dny s výkonem na lebce nebo mozku',
            eye: 'Dny s výkonem na oku',
            burn: 'Ošetř. dny pro popáleninu/omrzlinu v CA',
            heart: 'Dny s výkonem na srdci nebo aortě',
            tissue: 'Dny s výkonem na měkkých/pojivových tkáních',
            veins: 'Dny s výkonem na periferních cévách',
            pelvis: 'Dny s operačním výkonem v dutině břišní/pánevní',
            blood: 'Dny s eliminačními metodami krve',
            orthopedic: 'Dny s ortopedickým operačním výkonem',
        },
        footer: {
            submit: 'Odeslat opravu na server',
            errorPrefix: 'Chyba: {{message}}',
        },
    },
};
