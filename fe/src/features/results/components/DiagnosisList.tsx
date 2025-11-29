import React, { useMemo } from 'react';
import { Card } from '../../../shared/ui/Card';
import type { Diagnosis } from '../../../core/types';
import styles from './Components.module.css';
import clsx from 'clsx';
import { useTranslation } from '../../../shared/i18n';
import { X } from 'lucide-react';

interface DiagnosisListProps {
    diagnoses: Diagnosis[];
    onHover: (id: string | null) => void;
    activeId: string | null;
    title?: string;
    collapsible?: boolean;
    expandLabel?: string;
    collapseLabel?: string;
    hideHeader?: boolean;
    onSetPrincipal?: (id: string) => void;
    onSelectCustom?: () => void;
    onRemove?: (id: string) => void;
    onAdd?: () => void;
}

export const DiagnosisList: React.FC<DiagnosisListProps> = ({
    diagnoses,
    onHover,
    activeId,
    title,
    collapsible = true,
    expandLabel,
    collapseLabel,
    hideHeader = false,
    onSetPrincipal,
    onSelectCustom,
    onRemove,
    onAdd
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { t, locale } = useTranslation();

    const sortedDiagnoses = React.useMemo(() => {
        return [...diagnoses].sort((a, b) => (b.probability || 0) - (a.probability || 0));
    }, [diagnoses]);

    const visibleDiagnoses = collapsible && !isExpanded ? sortedDiagnoses.slice(0, 1) : sortedDiagnoses;
    const hasMore = collapsible && diagnoses.length > 1;
    const numberLocale = locale === 'cs' ? 'cs-CZ' : 'en-US';
    const percentFormatter = useMemo(
        () => new Intl.NumberFormat(numberLocale, { style: 'percent', maximumFractionDigits: 0 }),
        [numberLocale],
    );

    const heading = title ?? t('results.diagnoses.defaultTitle');
    const expandText = expandLabel ?? t('results.diagnoses.expand', { count: Math.max(diagnoses.length - 1, 0) });
    const collapseText = collapseLabel ?? t('results.diagnoses.collapse');

    const showCustomButton = onSelectCustom && (!collapsible || isExpanded);
    const showAddButton = onAdd && (!collapsible || isExpanded);

    return (
        <Card className={styles.listCard}>
            {!hideHeader && (
                <div className={styles.headerRow}>
                    <h3 className={styles.cardTitle}>{heading}</h3>
                    {hasMore && (
                        <button
                            className={styles.toggleButton}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? collapseText : expandText}
                        </button>
                    )}
                </div>
            )}
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
                            {d.probability && !d.id.startsWith('custom-') && (
                                <span className={styles.probability}>
                                    {percentFormatter.format(d.probability)}
                                </span>
                            )}
                        </div>
                        <div className={styles.contentContainer}>
                            <div className={styles.itemName}>{d.name}</div>
                            {d.reason && <div className={styles.itemReason}>{d.reason}</div>}
                        </div>
                        <div className={styles.actions}>
                            {onSetPrincipal && (
                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetPrincipal(d.id);
                                    }}
                                    title={t('results.diagnoses.setPrincipal')}
                                >
                                    {t('results.diagnoses.setPrincipal')}
                                </button>
                            )}
                            {onRemove && (
                                <button
                                    className={styles.removeButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(d.id);
                                    }}
                                    title={t('results.diagnoses.remove')}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {showCustomButton && (
                    <button className={styles.customSelectButton} onClick={onSelectCustom}>
                        + {t('results.search.customAction')}
                    </button>
                )}
                {showAddButton && (
                    <button className={styles.customSelectButton} onClick={onAdd}>
                        + {t('results.diagnoses.addSecondary')}
                    </button>
                )}
            </div>
        </Card>
    );
};
