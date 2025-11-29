'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PredictionForm } from './components/prediction-form';
import { PredictionResult } from './components/prediction-result';
import { EmptyState } from './components/empty-state';
import { LoadingState } from './components/loading-state';
import type { PredictResponse } from '@/types';
import styles from './predict.module.css';
import Link from 'next/link';

export default function PredictPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<PredictResponse | null>(null);

  const predictMutation = useMutation({
    mutationFn: api.predict,
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleSubmit = (data: { clinical_text: string }) => {
    setInputText(data.clinical_text);
    predictMutation.mutate(data);
  };

  const handleClear = () => {
    setResult(null);
    setInputText('');
    predictMutation.reset();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">DRGxCoder</Link>
          <span className={styles.badge}>AI Demo</span>
        </div>
      </header>

      {/* Main 2-Column Layout */}
      <main className={styles.main}>
        {/* Left Column - Input */}
        <div className={styles.column}>
          <PredictionForm
            onSubmit={handleSubmit}
            isLoading={predictMutation.isPending}
            error={predictMutation.error?.message}
            onClear={result ? handleClear : undefined}
            inputText={inputText}
          />
        </div>

        {/* Right Column - Results */}
        <div className={styles.column}>
          {predictMutation.isPending && <LoadingState />}
          
          {predictMutation.error && (
            <div className={styles.errorCard}>
              <h3 className={styles.errorTitle}>Prediction Failed</h3>
              <p>{predictMutation.error.message}</p>
            </div>
          )}

          {result && <PredictionResult result={result} />}

          {!result && !predictMutation.isPending && !predictMutation.error && <EmptyState />}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>AI-powered ICD-10 diagnosis code prediction system</p>
      </footer>
    </div>
  );
}
