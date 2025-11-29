'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleSidebar } from './simple-sidebar';
import styles from './prediction-detail-sheet.module.css';
import { useEffect } from 'react';

interface PredictionDetailSheetProps {
  predictionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PredictionDetailSheet({ predictionId, open, onOpenChange }: PredictionDetailSheetProps) {
  const { data: prediction, isLoading, error } = useQuery({
    queryKey: ['prediction', predictionId],
    queryFn: () => predictionId ? api.getPrediction(predictionId) : null,
    enabled: !!predictionId && open,
  });

  useEffect(() => {
    if (open && predictionId) {
      console.log('Opening sidebar for prediction:', predictionId);
    }
  }, [open, predictionId]);

  useEffect(() => {
    if (prediction) {
      console.log('Prediction data loaded:', prediction);
    }
    if (error) {
      console.error('Error loading prediction:', error);
    }
  }, [prediction, error]);

  return (
    <SimpleSidebar isOpen={open} onClose={() => onOpenChange(false)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Prediction Details</h2>
        <p className={styles.description}>
          View and manage the AI-predicted diagnosis codes for this case
        </p>
      </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div>Loading prediction details...</div>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <div>Failed to load prediction</div>
            <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        ) : prediction ? (
          <div className={styles.content}>
            {/* Meta Info */}
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Patient</span>
                <span className={styles.metaValue}>{prediction.pac_id || 'N/A'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Case ID</span>
                <span className={styles.metaValue}>#{prediction.case_id?.slice(0, 12)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Status</span>
                <Badge variant={prediction.validated ? 'success' : 'default'}>
                  {prediction.validated ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Main Diagnosis */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Main Diagnosis</h3>
              <div className={styles.diagnosis}>
                <div className={styles.diagnosisHeader}>
                  <code className={styles.diagnosisCode}>{prediction.main_diagnosis?.code}</code>
                  <Badge variant="info">{Math.round((prediction.main_diagnosis?.confidence || 0) * 100)}%</Badge>
                </div>
                <p className={styles.diagnosisName}>{prediction.main_diagnosis?.name}</p>
                {prediction.main_diagnosis?.reasoning && (
                  <details className={styles.reasoningDetails}>
                    <summary className={styles.reasoningSummary}>AI Reasoning</summary>
                    <p className={styles.reasoning}>{prediction.main_diagnosis.reasoning}</p>
                  </details>
                )}
              </div>
            </div>

            {/* Secondary Diagnoses */}
            {prediction.secondary_diagnoses && prediction.secondary_diagnoses.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Secondary Diagnoses ({prediction.secondary_diagnoses.length})</h3>
                <div className={styles.secondaryList}>
                  {prediction.secondary_diagnoses.map((diag: any, idx: number) => (
                    <div key={idx} className={styles.secondaryItem}>
                      <div className={styles.diagnosisHeader}>
                        <code className={styles.diagnosisCode}>{diag.code}</code>
                        {diag.confidence && (
                          <span className={styles.confidence}>{Math.round(diag.confidence * 100)}%</span>
                        )}
                      </div>
                      <p className={styles.diagnosisName}>{diag.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!prediction.validated && (
              <div className={styles.actions}>
                <Button variant="secondary" className="w-full">
                  ✏️ Edit & Reject
                </Button>
                <Button className="w-full">
                  ✓ Approve
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.error}>Prediction not found</div>
        )}
    </SimpleSidebar>
  );
}
