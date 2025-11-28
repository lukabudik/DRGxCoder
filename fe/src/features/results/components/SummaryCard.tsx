import React from 'react';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import type { CaseResult } from '../../../core/types';
import styles from './Components.module.css';

interface SummaryCardProps {
    result: CaseResult;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ result }) => {
    return (
        <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
                <div>
                    <div className={styles.drgLabel}>DRG {result.drgCode}</div>
                    <h2 className={styles.drgName}>{result.drgName}</h2>
                </div>
                <Badge variant="info">AI Suggestion</Badge>
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Reliability</span>
                    <span className={styles.metricValue}>{(result.reliabilityScore * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>LOS</span>
                    <span className={styles.metricValue}>{result.los} days</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Rel. Value</span>
                    <span className={styles.metricValue}>{result.rv}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>Revenue</span>
                    <span className={styles.metricValue}>${result.revenue.toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
};
