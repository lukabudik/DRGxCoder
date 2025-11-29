import React, { useState } from 'react';
import { AnalyzerForm } from '../../features/analyzer/AnalyzerForm';
import { ResultsPanel } from '../../features/results/ResultsPanel';
import { HighlightText } from '../../features/results/HighlightText';
import { useAnalyzeText } from '../../features/analyzer/useAnalyzeText';
import { CoderForm } from '../../features/coder/CoderForm';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Skeleton } from '../../shared/ui/Skeleton';
import { useTranslation, type Locale } from '../../shared/i18n';
import styles from './HomePage.module.css';
import type { CaseResult, Diagnosis } from '../../core/types';

export const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<CaseResult | null>(null);
    const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
    const [showCoderForm, setShowCoderForm] = useState(false);

    const { mutate: analyze, isPending, error } = useAnalyzeText();
    const { t, locale, setLocale, availableLocales } = useTranslation();

    const handleAnalyze = (text: string) => {
        setInputText(text);
        setResult(null); // Clear previous result
        analyze(text, {
            onSuccess: (data) => {
                setResult(data);
            }
        });
    };

    const handleLocaleChange = (value: Locale) => {
        setLocale(value);
    };

    const handleClear = () => {
        setInputText('');
        setResult(null);
        setActiveHighlightId(null);
    };

    const handlePrincipalChange = (newPrincipalId: string, customDiagnosis?: Diagnosis) => {
        if (!result) return;

        const newDiagnoses = [...result.diagnoses];

        if (customDiagnosis) {
            // Add custom diagnosis to the beginning
            newDiagnoses.unshift(customDiagnosis);
        } else {
            const targetIndex = newDiagnoses.findIndex(d => d.id === newPrincipalId);
            if (targetIndex > 0) {
                const targetDiagnosis = newDiagnoses[targetIndex];
                // Remove from current position
                newDiagnoses.splice(targetIndex, 1);
                // Insert at the beginning
                newDiagnoses.unshift(targetDiagnosis);
            }
        }

        // Ensure manual selections don't persist in potential list (index 1+)
        const filteredDiagnoses = [
            newDiagnoses[0],
            ...newDiagnoses.slice(1).filter(d => !d.id.startsWith('custom-'))
        ];

        setResult({
            ...result,
            diagnoses: filteredDiagnoses,
            mainDiagnosis: filteredDiagnoses[0].code
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    {t('common.appName')} <span className={styles.badge}>{t('common.demoBadge')}</span>
                </div>
                <div className={styles.localeSwitcher}>
                    <label htmlFor="locale-select" className={styles.localeLabel}>{t('common.language.label')}</label>
                    <select
                        id="locale-select"
                        className={styles.localeSelect}
                        value={locale}
                        onChange={(event) => handleLocaleChange(event.target.value as Locale)}
                    >
                        {availableLocales.map((code) => (
                            <option key={code} value={code}>
                                {code === 'cs' ? t('common.language.cs') : t('common.language.en')}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.column}>
                    {result ? (
                        <Card className={styles.inputCard} padding="lg">
                            <div className={styles.inputHeader}>
                                <h3 className={styles.cardTitle}>{t('home.analyzedTitle')}</h3>
                                <Button variant="secondary" onClick={handleClear} className={styles.clearBtn}>
                                    {t('home.clear')}
                                </Button>
                            </div>
                            <div className={styles.highlightContainer}>
                                <HighlightText
                                    text={inputText}
                                    highlights={result.highlights}
                                    activeHighlightId={activeHighlightId}
                                    onHighlightHover={setActiveHighlightId}
                                />
                            </div>
                        </Card>
                    ) : (
                        <AnalyzerForm onSubmit={handleAnalyze} isLoading={isPending} />
                    )}
                </div>

                <div className={styles.column}>
                    {isPending && (
                        <div className={styles.loadingState}>
                            <Skeleton height={200} className={styles.skeleton} />
                            <Skeleton height={100} className={styles.skeleton} />
                            <Skeleton height={100} className={styles.skeleton} />
                        </div>
                    )}

                    {error && (
                        <Card className={styles.errorCard}>
                            <h3 className={styles.errorTitle}>{t('home.errorTitle')}</h3>
                            <p>{t('home.errorDescription')}</p>
                            <Button onClick={() => handleAnalyze(inputText)} variant="secondary">{t('home.retry')}</Button>
                        </Card>
                    )}

                    {result && (
                        <ResultsPanel
                            result={result}
                            onHover={setActiveHighlightId}
                            activeId={activeHighlightId}
                            onPrincipalChange={handlePrincipalChange}
                        />
                    )}

                    {result && (
                        <div className={styles.coderSection}>
                            <div className={styles.coderHeader}>
                                <div>
                                    <h3 className={styles.coderTitle}>{t('home.coder.title')}</h3>
                                    <p className={styles.coderHint}>{t('home.coder.hint')}</p>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowCoderForm((prev) => !prev)}
                                >
                                    {showCoderForm ? t('home.coder.hide') : t('home.coder.show')}
                                </Button>
                            </div>

                            {showCoderForm && <CoderForm result={result} />}
                        </div>
                    )}

                    {!result && !isPending && !error && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIllustration} />
                            <p className={styles.emptyText}>{t('home.empty')}</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <p>{t('home.emptyFooter')}</p>
            </footer>
        </div>
    );
};
