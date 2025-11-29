import React from 'react';
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

    return (
        <div className={styles.container}>
            <SummaryCard result={result} />

            <DiagnosisList
                title={t('results.diagnoses.principal')}
                diagnoses={result.diagnoses}
                onHover={onHover}
                activeId={activeId}
                collapsible={true}
                expandLabel={t('results.diagnoses.potentialExpand')}
                collapseLabel={t('results.diagnoses.potentialCollapse')}
            />

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
