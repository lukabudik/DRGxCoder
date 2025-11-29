'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, FileText, Activity, Edit2, X } from 'lucide-react';
import { CodeSearch } from '../components/code-search';
import styles from './approve.module.css';

interface EditedDiagnosis {
  code: string;
  name: string;
  originalCode?: string; // Track if modified
}

export default function ApprovePage() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validatedBy, setValidatedBy] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMainCode, setEditedMainCode] = useState('');
  const [editedMainName, setEditedMainName] = useState('');
  const [editedSecondary, setEditedSecondary] = useState<EditedDiagnosis[]>([]);

  // Fetch unvalidated predictions
  const { data: predictionsData, isLoading } = useQuery({
    queryKey: ['predictions', 'unvalidated'],
    queryFn: () => api.listPredictions({ page: 1, limit: 100 }),
    refetchInterval: 30000, // Refresh every 30s
  });

  const unvalidatedPredictions = predictionsData?.predictions?.filter(
    (p: any) => !p.validated
  ) || [];

  const currentPrediction = unvalidatedPredictions[currentIndex];

  // Fetch full prediction details
  const { data: predictionDetail } = useQuery({
    queryKey: ['prediction', currentPrediction?.id],
    queryFn: () => currentPrediction ? api.getPrediction(currentPrediction.id) : null,
    enabled: !!currentPrediction,
  });

  // Load validator name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('validator_name');
    if (stored) setValidatedBy(stored);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        handleApprove();
      } else if (e.key === 'n' || e.key === 'N') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPrediction, validatedBy, comment]);

  const handleApprove = async () => {
    if (!currentPrediction || !validatedBy.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitFeedback(currentPrediction.id, {
        validated_by: validatedBy,
        feedback_type: 'approved',
        feedback_comment: comment || undefined,
      });

      localStorage.setItem('validator_name', validatedBy);
      
      // Clear comment and move to next
      setComment('');
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['predictions'] });
      
      // Auto-advance to next
      if (currentIndex < unvalidatedPredictions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        alert('All predictions approved! 🎉');
      }
    } catch (err) {
      alert('Failed to approve: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!predictionDetail) return;
    
    // Enter edit mode and pre-fill with current values
    setIsEditMode(true);
    setEditedMainCode(predictionDetail.main_diagnosis?.code || '');
    setEditedMainName(predictionDetail.main_diagnosis?.name || '');
    setEditedSecondary(
      predictionDetail.secondary_diagnoses?.map((d: any) => ({
        code: d.code,
        name: d.name,
        originalCode: d.code, // Track original for detecting changes
      })) || []
    );
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedMainCode('');
    setEditedMainName('');
    setEditedSecondary([]);
  };

  const handleAddSecondary = () => {
    setEditedSecondary([...editedSecondary, { code: '', name: '' }]);
  };

  const handleRemoveSecondary = (index: number) => {
    setEditedSecondary(editedSecondary.filter((_, i) => i !== index));
  };

  const handleUpdateSecondary = (index: number, code: string, name: string) => {
    const updated = [...editedSecondary];
    updated[index] = { ...updated[index], code, name };
    setEditedSecondary(updated);
  };

  const handleSubmitRejection = async () => {
    if (!currentPrediction || !validatedBy.trim() || !editedMainCode || !comment.trim()) {
      alert('Please fill in your name, main diagnosis, and a comment explaining the changes');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build corrected_secondary array tracking changes
      const originalSecondary = predictionDetail?.secondary_diagnoses || [];
      const correctedSecondary = [];

      // Check for modifications and additions
      for (const edited of editedSecondary) {
        if (!edited.code) continue; // Skip empty entries

        if (edited.originalCode) {
          // This was an existing diagnosis
          if (edited.originalCode !== edited.code) {
            // Modified
            correctedSecondary.push({
              action: 'modified',
              code: edited.code,
              name: edited.name,
              original_code: edited.originalCode,
            });
          } else {
            // No change, but include for completeness
            correctedSecondary.push({
              action: 'kept',
              code: edited.code,
              name: edited.name,
            });
          }
        } else {
          // Added new
          correctedSecondary.push({
            action: 'added',
            code: edited.code,
            name: edited.name,
          });
        }
      }

      // Check for removals
      for (const original of originalSecondary) {
        const stillExists = editedSecondary.find(
          (e) => e.originalCode === original.code || e.code === original.code
        );
        if (!stillExists) {
          correctedSecondary.push({
            action: 'removed',
            code: original.code,
            name: original.name,
          });
        }
      }

      await api.submitFeedback(currentPrediction.id, {
        validated_by: validatedBy,
        feedback_type: 'rejected',
        corrected_main_code: editedMainCode,
        corrected_main_name: editedMainName,
        corrected_secondary: correctedSecondary,
        feedback_comment: comment,
      });

      localStorage.setItem('validator_name', validatedBy);
      
      // Reset edit mode
      handleCancelEdit();
      setComment('');
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['predictions'] });
      
      // Auto-advance to next
      if (currentIndex < unvalidatedPredictions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        alert('All predictions reviewed! 🎉');
      }
    } catch (err) {
      alert('Failed to reject: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < unvalidatedPredictions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setComment('');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setComment('');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading predictions...</div>
      </div>
    );
  }

  if (unvalidatedPredictions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>🎉 All done!</h2>
          <p>No pending predictions to review.</p>
          <Button onClick={() => window.location.href = '/'}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const patient = predictionDetail?.case?.patient;
  const caseData = predictionDetail?.case;

  return (
    <div className={styles.container}>
      {/* Header with Progress */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Approval Mode</h1>
          <div className={styles.progress}>
            {currentIndex + 1} / {unvalidatedPredictions.length} predictions
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" size="sm" onClick={() => window.location.href = '/'}>
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${((currentIndex + 1) / unvalidatedPredictions.length) * 100}%` }}
        />
      </div>

      {/* Main Content: Split Layout */}
      <div className={styles.splitLayout}>
        {/* LEFT PANEL: Clinical Data */}
        <div className={styles.leftPanel}>
          <div className={styles.panelContent}>
            {/* Patient Info */}
            {patient && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <User size={18} />
                  <h2>Patient Information</h2>
                </div>
                <div className={styles.patientInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Name:</span>
                    <span className={styles.value}>
                      {patient.last_name}, {patient.first_name}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Age / Sex:</span>
                    <span className={styles.value}>
                      {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} / {patient.sex}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Birth Number:</span>
                    <span className={styles.value}>{patient.birth_number}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Case Info */}
            {caseData && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Calendar size={18} />
                  <h2>Case Information</h2>
                </div>
                <div className={styles.caseInfo}>
                  {caseData.admission_date && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Admission:</span>
                      <span className={styles.value}>
                        {new Date(caseData.admission_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {caseData.discharge_date && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Discharge:</span>
                      <span className={styles.value}>
                        {new Date(caseData.discharge_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clinical Text */}
            {caseData?.clinical_text && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <FileText size={18} />
                  <h2>Clinical Text</h2>
                </div>
                <div className={styles.clinicalText}>
                  {caseData.clinical_text}
                </div>
              </div>
            )}

            {/* Biochemistry */}
            {caseData?.biochemistry && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Activity size={18} />
                  <h2>Biochemistry</h2>
                </div>
                <div className={styles.labData}>
                  {caseData.biochemistry}
                </div>
              </div>
            )}

            {/* Hematology */}
            {caseData?.hematology && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Activity size={18} />
                  <h2>Hematology</h2>
                </div>
                <div className={styles.labData}>
                  {caseData.hematology}
                </div>
              </div>
            )}

            {/* Microbiology */}
            {caseData?.microbiology && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Activity size={18} />
                  <h2>Microbiology</h2>
                </div>
                <div className={styles.labData}>
                  {caseData.microbiology}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Prediction & Actions */}
        <div className={styles.rightPanel}>
          <div className={styles.panelContent}>
            {/* Edit Mode Indicator */}
            {isEditMode && (
              <div style={{
                padding: '12px 16px',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Edit2 size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 600, color: '#92400e' }}>EDIT MODE</span>
              </div>
            )}

            {/* Main Diagnosis */}
            {predictionDetail && (
              <>
                <div className={styles.section}>
                  <h2 className={styles.diagnosisTitle}>Main Diagnosis *</h2>
                  {isEditMode ? (
                    <div>
                      <label className={styles.inputLabel}>Code:</label>
                      <CodeSearch
                        value={editedMainCode}
                        onSelect={(code, name) => {
                          setEditedMainCode(code);
                          setEditedMainName(name);
                        }}
                        placeholder="Search code (e.g., I50)"
                        autoFocus
                      />
                      <label className={styles.inputLabel} style={{ marginTop: '12px' }}>Name:</label>
                      <input
                        type="text"
                        value={editedMainName}
                        onChange={(e) => setEditedMainName(e.target.value)}
                        className={styles.input}
                        placeholder="Diagnosis name"
                      />
                    </div>
                  ) : (
                    <div className={styles.mainDiagnosis}>
                      <div className={styles.diagnosisHeader}>
                        <code className={styles.diagnosisCode}>
                          {predictionDetail.main_diagnosis?.code}
                        </code>
                        <Badge variant="info">
                          {Math.round((predictionDetail.main_diagnosis?.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className={styles.diagnosisName}>
                        {predictionDetail.main_diagnosis?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Secondary Diagnoses */}
                <div className={styles.section}>
                  <h2 className={styles.diagnosisTitle}>
                    Secondary Diagnoses {isEditMode ? '' : `(${predictionDetail.secondary_diagnoses?.length || 0})`}
                  </h2>
                  {isEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {editedSecondary.map((diag, idx) => (
                        <div key={idx} style={{
                          padding: '12px',
                          background: 'var(--color-surface, #f9fafb)',
                          border: '1px solid var(--color-border, #e5e7eb)',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <label className={styles.inputLabel}>Code:</label>
                            <button
                              onClick={() => handleRemoveSecondary(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <CodeSearch
                            value={diag.code}
                            onSelect={(code, name) => handleUpdateSecondary(idx, code, name)}
                            placeholder="Search code"
                          />
                          <label className={styles.inputLabel} style={{ marginTop: '8px' }}>Name:</label>
                          <input
                            type="text"
                            value={diag.name}
                            onChange={(e) => handleUpdateSecondary(idx, diag.code, e.target.value)}
                            className={styles.input}
                            placeholder="Diagnosis name"
                          />
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={handleAddSecondary}
                        style={{ width: '100%' }}
                      >
                        + Add Secondary Diagnosis
                      </Button>
                    </div>
                  ) : (
                    predictionDetail.secondary_diagnoses && predictionDetail.secondary_diagnoses.length > 0 && (
                      <div className={styles.secondaryList}>
                        {predictionDetail.secondary_diagnoses.map((diag: any, idx: number) => (
                          <div key={idx} className={styles.secondaryItem}>
                            <div className={styles.diagnosisHeader}>
                              <code className={styles.diagnosisCode}>{diag.code}</code>
                              <span className={styles.confidence}>
                                {Math.round(diag.confidence * 100)}%
                              </span>
                            </div>
                            <p className={styles.diagnosisName}>{diag.name}</p>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* Validator Input */}
                <div className={styles.section}>
                  <label className={styles.inputLabel}>Your Name:</label>
                  <input
                    type="text"
                    value={validatedBy}
                    onChange={(e) => setValidatedBy(e.target.value)}
                    placeholder="Enter your name"
                    className={styles.input}
                  />
                </div>

                {/* Comment */}
                <div className={styles.section}>
                  <label className={styles.inputLabel}>
                    Comment {isEditMode && '(required - explain changes) *'}:
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isEditMode ? "Explain why you're rejecting and what changes you made..." : "Add a comment..."}
                    rows={3}
                    className={styles.textarea}
                  />
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  {isEditMode ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitRejection}
                        disabled={isSubmitting || !validatedBy.trim() || !editedMainCode || !comment.trim()}
                        style={{ flex: 1, background: '#ef4444' }}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Rejection'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleReject}
                        disabled={isSubmitting}
                        style={{ flex: 1 }}
                      >
                        ✗ Reject & Edit
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={isSubmitting || !validatedBy.trim()}
                        style={{ flex: 1 }}
                      >
                        {isSubmitting ? 'Approving...' : '✓ Approve'}
                      </Button>
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div className={styles.navigation}>
                  <Button
                    variant="secondary"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0 || isSubmitting}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleNext}
                    disabled={currentIndex >= unvalidatedPredictions.length - 1 || isSubmitting}
                  >
                    Next →
                  </Button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className={styles.shortcuts}>
                  <div className={styles.shortcutsTitle}>⌨️ Keyboard Shortcuts:</div>
                  <div className={styles.shortcutsList}>
                    <span><kbd>A</kbd> = Approve</span>
                    <span><kbd>N</kbd> = Next</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
