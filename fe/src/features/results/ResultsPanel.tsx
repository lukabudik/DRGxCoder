import React, { useState } from 'react';
import type { CaseResult, Diagnosis } from '../../core/types';
import { SummaryCard } from './components/SummaryCard';
import { DiagnosisList } from './components/DiagnosisList';
import { ProcedureList } from './components/ProcedureList';
import { DiagnosisSearch } from './components/DiagnosisSearch';
import { Modal } from '../../shared/ui/Modal';
import styles from './ResultsPanel.module.css';
import { useTranslation } from '../../shared/i18n';

interface ResultsPanelProps {
    result: CaseResult;
    onHover: (id: string | null) => void;
    activeId: string | null;
    onPrincipalChange?: (newPrincipalId: string, customDiagnosis?: Diagnosis) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onHover, activeId, onPrincipalChange }) => {
    const { t } = useTranslation();
    const [showPotential, setShowPotential] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const principalDiagnosis = result.diagnoses[0];
    const potentialDiagnoses = result.diagnoses.slice(1);

    const handleCustomSelect = (diagnosis: Diagnosis) => {
        if (onPrincipalChange) {
            onPrincipalChange(diagnosis.id, diagnosis);
        }
        setIsSearchOpen(false);
    };

    return (
        <div className={styles.container}>
            <SummaryCard result={result} principalDiagnosis={principalDiagnosis} />

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
                        onSelectCustom={() => setIsSearchOpen(true)}
                    />
                )}
            </div>

            <Modal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                title={t('results.search.modalTitle')}
            >
                <DiagnosisSearch onSelect={handleCustomSelect} />
            </Modal>

            {result.otherDiagnoses.length > 0 && (
                <DiagnosisList
                    title={t('results.diagnoses.secondary')}
                    diagnoses={result.otherDiagnoses}
                    onHover={onHover}
                    activeId={activeId}
                    collapsible={false}
                />
            )}

            {result.procedures.length > 0 && (
                <ProcedureList
                    procedures={result.procedures}
                    onHover={onHover}
                    activeId={activeId}
                />
            )}
        </div>
    );
};
