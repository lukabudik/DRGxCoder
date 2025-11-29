import React from 'react';
import { Card } from '../../../shared/ui/Card';
import type { Diagnosis } from '../../../core/types';
import styles from './Components.module.css';
import clsx from 'clsx';

interface DiagnosisListProps {
    diagnoses: Diagnosis[];
    onHover: (id: string | null) => void;
    activeId: string | null;
    title?: string;
    collapsible?: boolean;
    expandLabel?: string;
    collapseLabel?: string;
}

export const DiagnosisList: React.FC<DiagnosisListProps> = ({
    diagnoses,
    onHover,
    activeId,
    title = 'Diagnoses (ICD-10)',
    collapsible = true,
    expandLabel = 'Show all',
    collapseLabel = 'Show less'
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const sortedDiagnoses = React.useMemo(() => {
        return [...diagnoses].sort((a, b) => (b.probability || 0) - (a.probability || 0));
    }, [diagnoses]);

    const visibleDiagnoses = collapsible && !isExpanded ? sortedDiagnoses.slice(0, 1) : sortedDiagnoses;
    const hasMore = collapsible && diagnoses.length > 1;

    return (
        <Card className={styles.listCard}>
            <div className={styles.headerRow}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {hasMore && (
                    <button
                        className={styles.toggleButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? collapseLabel : `${expandLabel} (${diagnoses.length - 1})`}
                    </button>
                )}
            </div>
            <div className={styles.list}>
                {visibleDiagnoses.map((d) => (
                    <div
                        key={d.id}
                        className={clsx(styles.listItem, activeId === d.id && styles.activeItem)}
                        onMouseEnter={() => onHover(d.id)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <div className={styles.codeContainer}>
                            <span className={styles.code}>{d.code}</span>
                            {d.probability && (
                                <span className={styles.probability}>
                                    {(d.probability * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <div className={styles.contentContainer}>
                            <div className={styles.itemName}>{d.name}</div>
                            {d.reason && <div className={styles.itemReason}>{d.reason}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
