'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, MapPin } from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api.getPatient(patientId),
  });

  const calculateAge = (dateOfBirth: string) => {
    const age = Math.floor(
      (new Date().getTime() - new Date(dateOfBirth).getTime()) / 
      (1000 * 60 * 60 * 24 * 365.25)
    );
    return age;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div>Loading patient details...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ color: 'var(--color-error)' }}>
          Failed to load patient: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

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
          {patient.first_name} {patient.last_name}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Patient Demographics and Case History
        </p>
      </div>

      {/* Patient Info Card */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
          Patient Information
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Birth Number
              </span>
            </div>
            <div style={{ fontWeight: 500 }}>{patient.birth_number}</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Calendar size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Age / Date of Birth
              </span>
            </div>
            <div style={{ fontWeight: 500 }}>
              {calculateAge(patient.date_of_birth)} years ({new Date(patient.date_of_birth).toLocaleDateString()})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Sex
            </div>
            <div style={{ fontWeight: 500 }}>{patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex}</div>
          </div>

          {patient.country_of_residence && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MapPin size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Country
                </span>
              </div>
              <div style={{ fontWeight: 500 }}>{patient.country_of_residence}</div>
            </div>
          )}
        </div>
      </div>

      {/* Cases List */}
      <div style={{
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
          Case History ({patient.cases?.length || 0} cases)
        </h2>

        {patient.cases && patient.cases.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {patient.cases.map((caseItem: any) => (
              <div
                key={caseItem.id}
                onClick={() => router.push(`/cases/${caseItem.id}`)}
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
                      Case #{caseItem.id.slice(0, 12)}
                    </div>
                    {caseItem.pac_id && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        PAC ID: {caseItem.pac_id}
                      </div>
                    )}
                  </div>
                  <Badge variant={caseItem.predictions?.length > 0 ? 'default' : 'secondary'}>
                    {caseItem.predictions?.length || 0} predictions
                  </Badge>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Created: {new Date(caseItem.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
            No cases found for this patient
          </div>
        )}
      </div>
    </div>
  );
}
