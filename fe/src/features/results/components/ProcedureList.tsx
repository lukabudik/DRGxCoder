import React from 'react';
import { Card } from '../../../shared/ui/Card';
import type { Procedure } from '../../../core/types';
import styles from './Components.module.css';
import clsx from 'clsx';

interface ProcedureListProps {
    procedures: Procedure[];
    onHover: (id: string | null) => void;
    activeId: string | null;
}

export const ProcedureList: React.FC<ProcedureListProps> = ({ procedures, onHover, activeId }) => {
    return (
        <Card className={styles.listCard}>
            <h3 className={styles.cardTitle}>Procedures</h3>
            <div className={styles.list}>
                {procedures.map((p) => (
                    <div
                        key={p.id}
                        className={clsx(styles.listItem, activeId === p.id && styles.activeItem)}
                        onMouseEnter={() => onHover(p.id)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <div className={styles.itemHeader}>
                            <span className={styles.code}>{p.code}</span>
                        </div>
                        <div className={styles.itemName}>{p.name}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
