import React, { useState } from 'react';
import { AnalyzerForm } from '../../features/analyzer/AnalyzerForm';
import { ResultsPanel } from '../../features/results/ResultsPanel';
import { HighlightText } from '../../features/results/HighlightText';
import { useAnalyzeText } from '../../features/analyzer/useAnalyzeText';
import { CoderForm } from '../../features/coder/CoderForm';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Skeleton } from '../../shared/ui/Skeleton';
import styles from './HomePage.module.css';
import type { CaseResult } from '../../core/types';

export const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<CaseResult | null>(null);
    const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

    const { mutate: analyze, isPending, error } = useAnalyzeText();

    const handleAnalyze = (text: string) => {
        setInputText(text);
        setResult(null); // Clear previous result
        analyze(text, {
            onSuccess: (data) => {
                setResult(data);
            }
        });
    };

    const handleClear = () => {
        setInputText('');
        setResult(null);
        setActiveHighlightId(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>DRG Audit <span className={styles.badge}>Demo</span></div>
                <Button variant="secondary" onClick={() => alert('Settings placeholder')}>Settings</Button>
            </header>

            <main className={styles.main}>
                <div className={styles.column}>
                    {result ? (
                        <Card className={styles.inputCard} padding="lg">
                            <div className={styles.inputHeader}>
                                <h3 className={styles.cardTitle}>Analyzed Text</h3>
                                <Button variant="secondary" onClick={handleClear} className={styles.clearBtn}>
                                    Clear & New
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
                            <h3 className={styles.errorTitle}>Analysis Failed</h3>
                            <p>We couldn't process your request. Please try again.</p>
                            <Button onClick={() => handleAnalyze(inputText)} variant="secondary">Retry</Button>
                        </Card>
                    )}

                    {result && (
                        <ResultsPanel
                            result={result}
                            onHover={setActiveHighlightId}
                            activeId={activeHighlightId}
                        />
                    )}

                    {result && <CoderForm result={result} />}

                    {!result && !isPending && !error && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIllustration} />
                            <p className={styles.emptyText}>Paste the epicrisis/discharge text and start analysis.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <p>Demo highlighting (mock) - Randomly generated for demonstration purposes.</p>
            </footer>
        </div>
    );
};
