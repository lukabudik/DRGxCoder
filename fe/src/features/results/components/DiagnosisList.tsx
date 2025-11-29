import React from 'react';
import { Card } from '../../../shared/ui/Card';
import type { Diagnosis } from '../../../core/types';
import styles from './Components.module.css';
import clsx from 'clsx';

interface DiagnosisListProps {
    diagnoses: Diagnosis[];
    onHover: (id: string | null) => void;
    activeId: string | null;
}

export const DiagnosisList: React.FC<DiagnosisListProps> = ({ diagnoses, onHover, activeId }) => {
    return (
        <Card className={styles.listCard}>
            <h3 className={styles.cardTitle}>Diagnoses (ICD-10)</h3>
            <div className={styles.list}>
                {diagnoses.map((d) => (
                    <div
                        key={d.id}
                        className={clsx(styles.listItem, activeId === d.id && styles.activeItem)}
                        onMouseEnter={() => onHover(d.id)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <div className={styles.itemHeader}>
                            <span className={styles.code}>{d.code}</span>
                        </div>
                        <div className={styles.itemName}>{d.name}</div>
                        <div className={styles.itemMeta}>
                            {d.probability && <span>Prob: {(d.probability * 100).toFixed(0)}%</span>}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
