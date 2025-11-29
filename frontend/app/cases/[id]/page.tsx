'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, FileText } from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId),
  });

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div>Loading case details...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ color: 'var(--color-error)' }}>
          Failed to load case: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const patient = caseData.patient;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back
        </Button>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>
          Case #{caseData.id.slice(0, 12)}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Case Details and Predictions
        </p>
      </div>

      {/* Patient Info Link */}
      {patient && (
        <div style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={20} style={{ color: 'var(--color-text-secondary)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>
                {patient.first_name} {patient.last_name}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex}, 
                Age: {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/patients/${patient.id}`)}
          >
            View Patient Profile
          </Button>
        </div>
      )}

      {/* Case Information */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
          Case Information
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {caseData.pac_id && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                PAC ID
              </div>
              <div style={{ fontWeight: 500 }}>{caseData.pac_id}</div>
            </div>
          )}

          {caseData.hospital_patient_id && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Hospital Patient ID
              </div>
              <div style={{ fontWeight: 500 }}>{caseData.hospital_patient_id}</div>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Calendar size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Created
              </span>
            </div>
            <div style={{ fontWeight: 500 }}>
              {new Date(caseData.created_at).toLocaleString()}
            </div>
          </div>

          {caseData.admission_date && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Admission Date
              </div>
              <div style={{ fontWeight: 500 }}>
                {new Date(caseData.admission_date).toLocaleDateString()}
              </div>
            </div>
          )}

          {caseData.discharge_date && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Discharge Date
              </div>
              <div style={{ fontWeight: 500 }}>
                {new Date(caseData.discharge_date).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Data Sections */}
        <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
          {caseData.clinical_text && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Clinical Text</span>
              </div>
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {caseData.clinical_text}
              </div>
            </div>
          )}

          {caseData.biochemistry && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Biochemistry</span>
              </div>
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {caseData.biochemistry}
              </div>
            </div>
          )}

          {caseData.hematology && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Hematology</span>
              </div>
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {caseData.hematology}
              </div>
            </div>
          )}

          {caseData.microbiology && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Microbiology</span>
              </div>
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {caseData.microbiology}
              </div>
            </div>
          )}

          {caseData.medication && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontWeight: 600 }}>Medication</span>
              </div>
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {caseData.medication}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Predictions List */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
          Predictions ({caseData.predictions_count || caseData.predictions?.length || 0})
        </h2>

        {caseData.predictions && caseData.predictions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {caseData.predictions.map((prediction: any) => (
              <div
                key={prediction.id}
                onClick={() => router.push(`/?prediction=${prediction.id}`)}
                style={{
                  padding: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {prediction.main_code}: {prediction.main_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Confidence: {Math.round((prediction.main_confidence || 0) * 100)}%
                    </div>
                  </div>
                  <Badge variant={prediction.validated ? 'success' : 'default'}>
                    {prediction.validated ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Created: {new Date(prediction.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
            No predictions found for this case
          </div>
        )}
      </div>
    </div>
  );
}
