import React, { useState } from 'react';
import type { CaseResult } from '../../core/types';
import { SummaryCard } from './components/SummaryCard';
import { DiagnosisList } from './components/DiagnosisList';
import { ProcedureList } from './components/ProcedureList';
import styles from './ResultsPanel.module.css';
import { useTranslation } from '../../shared/i18n';

interface ResultsPanelProps {
    result: CaseResult;
    onHover: (id: string | null) => void;
    activeId: string | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onHover, activeId }) => {
    const { t } = useTranslation();
    const [showPotential, setShowPotential] = useState(false);

    const principalDiagnosis = result.diagnoses[0];
    const potentialDiagnoses = result.diagnoses.slice(1);

    return (
        <div className={styles.container}>
            <SummaryCard result={result} principalDiagnosis={principalDiagnosis} />

            {potentialDiagnoses.length > 0 && (
                <div className={styles.potentialContainer}>
                    <div className={styles.potentialHeader}>
                        <h3 className={styles.potentialTitle}>{t('results.diagnoses.potentialTitle')}</h3>
                        <button
                            className={styles.potentialButton}
                            onClick={() => setShowPotential(!showPotential)}
                        >
                            {showPotential
                                ? t('results.diagnoses.potentialCollapse')
                                : t('results.diagnoses.potentialExpand')}
                        </button>
                    </div>

                    {showPotential && (
                        <DiagnosisList
                            diagnoses={potentialDiagnoses}
                            onHover={onHover}
                            activeId={activeId}
                            collapsible={false}
                            hideHeader={true}
                        />
                    )}
                </div>
            )}

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
