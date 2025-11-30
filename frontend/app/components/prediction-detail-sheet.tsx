'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleSidebar } from './simple-sidebar';
import styles from './prediction-detail-sheet.module.css';
import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PredictionDetailSheetProps {
  predictionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PredictionDetailSheet({ predictionId, open, onOpenChange }: PredictionDetailSheetProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [validatedBy, setValidatedBy] = useState('');
  const [showAiOriginal, setShowAiOriginal] = useState(false);
  
  const { data: prediction, isLoading, error, refetch } = useQuery({
    queryKey: ['prediction', predictionId],
    queryFn: () => predictionId ? api.getPrediction(predictionId) : null,
    enabled: !!predictionId && open,
  });
  
  // Load validator name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('validator_name');
    if (stored) setValidatedBy(stored);
  }, []);
  
  const handleApprove = async () => {
    if (!predictionId || !validatedBy.trim()) {
      alert('Please enter your name');
      return;
    }
    
    setIsApproving(true);
    try {
      await api.submitFeedback(predictionId, {
        validated_by: validatedBy,
        feedback_type: 'approved',
        feedback_comment: feedbackComment || undefined,
      });
      
      // Save name for next time
      localStorage.setItem('validator_name', validatedBy);
      
      // Show success and close
      alert('Prediction approved!');
      await refetch();
      onOpenChange(false);
      
      // Refresh predictions list
      window.location.reload();
    } catch (err) {
      alert('Failed to approve: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = () => {
    // TODO: Implement reject with edit modal
    alert('Reject with editing will be implemented in the approval page');
  };

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

  const patient = (prediction as any)?.case?.patient;
  const caseData = (prediction as any)?.case;

  return (
    <SimpleSidebar isOpen={open} onClose={() => onOpenChange(false)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Prediction Details</h2>
        <p className={styles.description}>
          View and manage the AI-predicted diagnosis codes for this case
        </p>
        
        {/* Navigation Links */}
        {(patient || caseData) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {patient && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = `/patients/${patient.id}`}
                style={{ fontSize: '13px' }}
              >
                View Patient: {patient.last_name}, {patient.first_name}
              </Button>
            )}
            {caseData && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = `/cases/${caseData.id}`}
                style={{ fontSize: '13px' }}
              >
                View Case
              </Button>
            )}
          </div>
        )}
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
                <span className={styles.metaValue}>
                  {(prediction as any).case?.patient 
                    ? `${(prediction as any).case.patient.last_name}, ${(prediction as any).case.patient.first_name}`
                    : prediction.pac_id || 'N/A'}
                </span>
              </div>
              {(prediction as any).case?.patient && (
                <>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Age / Sex</span>
                    <span className={styles.metaValue}>
                      {Math.floor((new Date().getTime() - new Date((prediction as any).case.patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} / {(prediction as any).case.patient.sex}
                    </span>
                  </div>
                </>
              )}
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
            
            {/* Navigation Buttons */}
            {prediction.case?.patient && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/patients/${prediction.case?.patient?.id}`)}
                  style={{ flex: 1 }}
                >
                  View Patient: {prediction.case.patient.first_name}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/cases/${prediction.case_id}`)}
                  style={{ flex: 1 }}
                >
                  View Case
                </Button>
              </div>
            )}

            {/* Correction Banner */}
            {prediction.corrected && (
              <div style={{
                padding: '12px 14px',
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '6px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'start',
                gap: '10px'
              }}>
                <AlertCircle size={18} style={{color: '#f59e0b', flexShrink: 0, marginTop: '2px'}} />
                <div style={{fontSize: '0.875rem'}}>
                  <strong style={{color: '#92400e'}}>This prediction was corrected</strong>
                  <div style={{color: '#78350f'}}>
                    by {prediction.validated_by} on{' '}
                    {prediction.corrected_at && new Date(prediction.corrected_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Main Diagnosis */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {prediction.corrected ? 'Current Diagnosis (After Correction)' : 'Main Diagnosis'}
              </h3>
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

            {/* Show AI's Original Prediction (if corrected) */}
            {prediction.corrected && prediction.original_main_diagnosis && (
              <div className={styles.section}>
                <button
                  onClick={() => setShowAiOriginal(!showAiOriginal)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-surface, #f9fafb)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f9fafb'}
                >
                  {showAiOriginal ? (
                    <>
                      <ChevronUp size={16} />
                      Hide AI's Original Prediction
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Show AI's Original Prediction
                    </>
                  )}
                </button>

                {showAiOriginal && (
                  <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div style={{
                      padding: '12px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '6px'
                    }}>
                      <h4 style={{fontSize: '0.75rem', fontWeight: 600, color: '#9a3412', marginBottom: '8px', textTransform: 'uppercase'}}>
                        AI Predicted:
                      </h4>
                      <div className={styles.diagnosisHeader}>
                        <code className={styles.diagnosisCode}>{prediction.original_main_diagnosis.code}</code>
                        <Badge variant="secondary">
                          {Math.round((prediction.original_main_diagnosis.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className={styles.diagnosisName}>{prediction.original_main_diagnosis.name}</p>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px'
                    }}>
                      <h4 style={{fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '8px', textTransform: 'uppercase'}}>
                        User Corrected To:
                      </h4>
                      <div className={styles.diagnosisHeader}>
                        <code className={styles.diagnosisCode}>{prediction.main_diagnosis.code}</code>
                      </div>
                      <p className={styles.diagnosisName}>{prediction.main_diagnosis.name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Validation Status or Actions */}
            {prediction.validated ? (
              <div>
                <div style={{
                  padding: '16px',
                  background: prediction.feedback_type === 'rejected' 
                    ? 'var(--color-error-light, #fee2e2)' 
                    : 'var(--color-success-light, #d1fae5)',
                  border: prediction.feedback_type === 'rejected'
                    ? '1px solid var(--color-error, #ef4444)'
                    : '1px solid var(--color-success, #10b981)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '16px'
                }}>
                  <div style={{ 
                    fontWeight: 600, 
                    color: prediction.feedback_type === 'rejected' 
                      ? 'var(--color-error-dark, #991b1b)' 
                      : 'var(--color-success-dark, #047857)', 
                    marginBottom: '4px' 
                  }}>
                    {prediction.feedback_type === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    by {prediction.validated_by} on {new Date(prediction.validated_at!).toLocaleString()}
                  </div>
                  {prediction.feedback_comment && (
                    <div style={{ marginTop: '8px', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      "{prediction.feedback_comment}"
                    </div>
                  )}
                </div>

                {/* Show Corrections if Rejected */}
                {prediction.feedback_type === 'rejected' && prediction.corrections && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--color-surface, #f9fafb)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem' }}>
                      Corrections Made:
                    </div>
                    
                    {typeof prediction.corrections === 'string' && (() => {
                      try {
                        const corrections = JSON.parse(prediction.corrections);
                        return (
                          <>
                            {corrections.corrected_main && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                  Main Diagnosis Changed:
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                                    {prediction.main_diagnosis?.code}
                                  </code>
                                  {' → '}
                                  <code style={{ background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                                    {corrections.corrected_main.code}
                                  </code>
                                </div>
                              </div>
                            )}
                            
                            {corrections.corrected_secondary && corrections.corrected_secondary.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                  Secondary Diagnoses:
                                </div>
                                {corrections.corrected_secondary.map((c: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                                    {c.action === 'added' && (
                                      <span>➕ Added: <code>{c.code}</code> - {c.name}</span>
                                    )}
                                    {c.action === 'removed' && (
                                      <span>➖ Removed: <code>{c.code}</code></span>
                                    )}
                                    {c.action === 'modified' && (
                                      <span>
                                        ✏️ Changed: <code>{c.original_code}</code> → <code>{c.code}</code>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      } catch (e) {
                        return <div>Could not parse corrections</div>;
                      }
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                {/* Validator Name Input */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                    Your Name:
                  </label>
                  <input
                    type="text"
                    value={validatedBy}
                    onChange={(e) => setValidatedBy(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                {/* Comment Input */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                    Comment (optional):
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className={styles.actions} style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={handleReject}
                    disabled={isApproving}
                    style={{ flex: 1 }}
                  >
                    ✗ Reject
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={isApproving || !validatedBy.trim()}
                    style={{ flex: 1 }}
                  >
                    {isApproving ? 'Approving...' : '✓ Approve'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.error}>Prediction not found</div>
        )}
    </SimpleSidebar>
  );
}
