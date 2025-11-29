import React, { useMemo } from 'react';
import { Card } from '../../../shared/ui/Card';
import type { CaseResult } from '../../../core/types';
import { useTranslation } from '../../../shared/i18n';
import styles from './Components.module.css';

interface SummaryCardProps {
    result: CaseResult;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ result }) => {
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
                    <div className={styles.drgLabel}>{t('results.summary.drgLabel', { code: result.drgCode })}</div>
                    <h2 className={styles.drgName}>{result.drgName}</h2>
                </div>
            </div>

            <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                    <span className={styles.metricLabel}>{t('results.summary.reliability')}</span>
                    <span className={styles.metricValue}>{percentFormatter.format(result.reliabilityScore)}</span>
                </div>
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
        </Card>
    );
};
