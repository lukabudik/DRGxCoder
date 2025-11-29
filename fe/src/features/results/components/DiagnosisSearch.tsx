import React, { useState, useEffect, useMemo } from 'react';
import styles from './DiagnosisSearch.module.css';
import { useTranslation } from '../../../shared/i18n';
import type { Diagnosis } from '../../../core/types';

interface DiagnosisItem {
    code: string;
    name: string;
}

interface DiagnosisSearchProps {
    onSelect: (diagnosis: Diagnosis) => void;
    excludedCodes?: string[];
}

// Simple debounce hook implementation if not present
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const DiagnosisSearch: React.FC<DiagnosisSearchProps> = ({ onSelect, excludedCodes = [] }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounceValue(query, 300);
    const [data, setData] = useState<DiagnosisItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        import('../../../assets/data/diagnoses.json')
            .then((module) => {
                setData(module.default);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load diagnoses', err);
                setLoading(false);
            });
    }, []);

    const filteredResults = useMemo(() => {
        if (!debouncedQuery) return [];
        const lowerQuery = debouncedQuery.toLowerCase();
        const excludedSet = new Set(excludedCodes);
        
        return data.filter(
            (item) =>
                !excludedSet.has(item.code) &&
                (item.code.toLowerCase().includes(lowerQuery) ||
                item.name.toLowerCase().includes(lowerQuery))
        ).slice(0, 50); // Limit results for performance
    }, [debouncedQuery, data, excludedCodes]);

    const handleSelect = (item: DiagnosisItem) => {
        onSelect({
            id: `custom-${Date.now()}`,
            code: item.code,
            name: item.name,
            source: 'human',
            probability: 1,
            reason: t('results.search.manualSelection')
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchBox}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder={t('results.search.placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>
            <div className={styles.results}>
                {loading && <div className={styles.loading}>{t('common.states.loading')}</div>}
                {!loading && debouncedQuery && filteredResults.length === 0 && (
                    <div className={styles.empty}>{t('results.search.noResults')}</div>
                )}
                {!loading && filteredResults.map((item) => (
                    <div
                        key={item.code}
                        className={styles.item}
                        onClick={() => handleSelect(item)}
                    >
                        <span className={styles.code}>{item.code}</span>
                        <span className={styles.name}>{item.name}</span>
                    </div>
                ))}
                {!loading && !debouncedQuery && (
                    <div className={styles.empty}>{t('results.search.startTyping')}</div>
                )}
            </div>
        </div>
    );
};
