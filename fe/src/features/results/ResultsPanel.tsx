import React from 'react';
import type { CaseResult } from '../../core/types';
import { SummaryCard } from './components/SummaryCard';
import { DiagnosisList } from './components/DiagnosisList';
import { ProcedureList } from './components/ProcedureList';
import styles from './ResultsPanel.module.css';

interface ResultsPanelProps {
    result: CaseResult;
    onHover: (id: string | null) => void;
    activeId: string | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onHover, activeId }) => {
    return (
        <div className={styles.container}>
            <SummaryCard result={result} />

            <DiagnosisList
                title="Principal Diagnose (ICD-10)"
                diagnoses={result.diagnoses}
                onHover={onHover}
                activeId={activeId}
                collapsible={true}
                expandLabel="Show potential"
                collapseLabel="Hide potential"
            />

            {result.otherDiagnoses.length > 0 && (
                <DiagnosisList
                    title="Secondary Diagnoses (ICD-10)"
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
