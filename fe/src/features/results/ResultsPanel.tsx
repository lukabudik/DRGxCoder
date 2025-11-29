import React, { useState } from 'react';
import type { CaseResult, Diagnosis } from '../../core/types';
import { SummaryCard } from './components/SummaryCard';
import { DiagnosisList } from './components/DiagnosisList';
// import { ProcedureList } from './components/ProcedureList';
import { DiagnosisSearch } from './components/DiagnosisSearch';
import { Modal } from '../../shared/ui/Modal';
import styles from './ResultsPanel.module.css';
import { useTranslation } from '../../shared/i18n';

interface ResultsPanelProps {
    result: CaseResult;
    onHover: (id: string | null) => void;
    activeId: string | null;
    onPrincipalChange?: (newPrincipalId: string, customDiagnosis?: Diagnosis) => void;
    onAddSecondary?: (diagnosis: Diagnosis) => void;
    onRemoveSecondary?: (id: string) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
    result, 
    onHover, 
    activeId, 
    onPrincipalChange,
    onAddSecondary,
    onRemoveSecondary 
}) => {
    const { t } = useTranslation();
    const [showPotential, setShowPotential] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<'principal' | 'secondary'>('principal');

    const principalDiagnosis = result.diagnoses[0];
    const potentialDiagnoses = result.diagnoses.slice(1);

    const handleCustomSelect = (diagnosis: Diagnosis) => {
        if (searchMode === 'principal' && onPrincipalChange) {
            onPrincipalChange(diagnosis.id, diagnosis);
        } else if (searchMode === 'secondary' && onAddSecondary) {
            onAddSecondary(diagnosis);
        }
        setIsSearchOpen(false);
    };

    const openSearch = (mode: 'principal' | 'secondary') => {
        setSearchMode(mode);
        setIsSearchOpen(true);
    };

    const excludedCodes = React.useMemo(() => {
        if (searchMode === 'secondary') {
            const codes = new Set<string>();
            // Exclude principal diagnosis
            if (result.diagnoses.length > 0) codes.add(result.diagnoses[0].code);
            // Exclude existing secondary diagnoses
            result.otherDiagnoses.forEach(d => codes.add(d.code));
            return Array.from(codes);
        }
        return [];
    }, [result, searchMode]);

    return (
        <div className={styles.container}>
            <SummaryCard 
                result={result} 
                principalDiagnosis={principalDiagnosis}
                secondaryDiagnoses={result.otherDiagnoses}
                onAddSecondary={() => openSearch('secondary')}
                onRemoveSecondary={onRemoveSecondary}
                onHover={onHover}
                activeId={activeId}
            />

            <div className={styles.potentialContainer}>
                <div className={styles.potentialHeader}>
                    <h3 className={styles.potentialTitle}>{t('results.diagnoses.potentialTitle')}</h3>
                    <div className={styles.potentialActions}>
                        {potentialDiagnoses.length > 0 && (
                            <button
                                className={styles.potentialButton}
                                onClick={() => setShowPotential(!showPotential)}
                            >
                                {showPotential
                                    ? t('results.diagnoses.potentialCollapse')
                                    : t('results.diagnoses.potentialExpand')}
                            </button>
                        )}
                    </div>
                </div>

                {showPotential && (
                    <DiagnosisList
                        diagnoses={potentialDiagnoses}
                        onHover={onHover}
                        activeId={activeId}
                        collapsible={false}
                        hideHeader={true}
                        onSetPrincipal={onPrincipalChange ? (id) => onPrincipalChange(id) : undefined}
                        onSelectCustom={() => openSearch('principal')}
                    />
                )}
            </div>

            <Modal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                title={searchMode === 'principal' ? t('results.search.modalTitle') : t('results.search.modalTitle')}
            >
                <DiagnosisSearch onSelect={handleCustomSelect} excludedCodes={excludedCodes} />
            </Modal>

            {/* {result.otherDiagnoses.length > 0 && (
                <DiagnosisList
                    title={t('results.diagnoses.secondary')}
                    diagnoses={result.otherDiagnoses}
                    onHover={onHover}
                    activeId={activeId}
                    collapsible={false}
                    onRemove={onRemoveSecondary}
                    onAdd={() => openSearch('secondary')}
                />
            )} */}

            {/* {result.procedures.length > 0 && (
                <ProcedureList
                    procedures={result.procedures}
                    onHover={onHover}
                    activeId={activeId}
                />
            )} */}
        </div>
    );
};
