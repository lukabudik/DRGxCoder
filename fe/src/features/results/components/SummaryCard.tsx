import React, { useMemo } from 'react';
import { Card } from '../../../shared/ui/Card';
import type { CaseResult, Diagnosis } from '../../../core/types';
import { useTranslation } from '../../../shared/i18n';
import { DiagnosisList } from './DiagnosisList';
import styles from './Components.module.css';

interface SummaryCardProps {
    result: CaseResult;
    principalDiagnosis: Diagnosis;
    secondaryDiagnoses: Diagnosis[];
    onAddSecondary?: () => void;
    onRemoveSecondary?: (id: string) => void;
    onHover: (id: string | null) => void;
    activeId: string | null;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    result,
    principalDiagnosis,
    secondaryDiagnoses,
    onAddSecondary,
    onRemoveSecondary,
    onHover,
    activeId
}) => {
    const { t, locale } = useTranslation();

    const numberLocale = locale === 'cs' ? 'cs-CZ' : 'en-US';
    const percentFormatter = useMemo(
        () => new Intl.NumberFormat(numberLocale, { style: 'percent', maximumFractionDigits: 0 }),
        [numberLocale],
    );
    const currencyFormatter = useMemo(
        () => new Intl.NumberFormat(numberLocale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
        [numberLocale],
    );
    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 1 }),
        [numberLocale],
    );

    return (
        <Card className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
                <div>
                    <div className={styles.drgLabel}>{principalDiagnosis.code}</div>
                    <h2 className={styles.drgName}>{principalDiagnosis.name}</h2>
                    {(principalDiagnosis.id.startsWith('custom-') ? (
                        <div className={styles.summaryReason}>{t('results.summary.manualSelection')}</div>
                    ) : (
                        principalDiagnosis.reason && (
                            <div className={styles.summaryReason}>{principalDiagnosis.reason}</div>
                        )
                    ))}
                </div>
            </div>

            <div className={styles.metricsGrid}>
                {!principalDiagnosis.id.startsWith('custom-') && (
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>{t('results.summary.reliability')}</span>
                        <span className={styles.metricValue}>
                            {percentFormatter.format(principalDiagnosis.probability ?? result.reliabilityScore)}
                        </span>
                    </div>
                )}
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>{t('results.summary.los')}</span>
                    <span className={styles.metricValue}>{numberFormatter.format(result.los)} {t('results.summary.days')}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>{t('results.summary.rv')}</span>
                    <span className={styles.metricValue}>{numberFormatter.format(result.rv)}</span>
                </div>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>{t('results.summary.revenue')}</span>
                    <span className={styles.metricValue}>{currencyFormatter.format(result.revenue)}</span>
                </div>
            </div>

            <div className={styles.secondaryDiagnosesContainer}>
                <DiagnosisList
                    title={t('results.diagnoses.secondary')}
                    diagnoses={secondaryDiagnoses}
                    onHover={onHover}
                    activeId={activeId}
                    collapsible={false}
                    onRemove={onRemoveSecondary}
                    onAdd={onAddSecondary}
                />
            </div>
        </Card>
    );
};
