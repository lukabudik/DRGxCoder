'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import styles from './prediction-form.module.css';

interface PredictionFormProps {
  onSubmit: (data: { clinical_text: string }) => void;
  isLoading: boolean;
  error?: string;
  onClear?: () => void;
  inputText?: string;
}

interface FormValues {
  clinical_text: string;
}

export function PredictionForm({ onSubmit, isLoading, error, onClear, inputText }: PredictionFormProps) {
  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { clinical_text: inputText || '' }
  });
  const clinicalText = watch('clinical_text', inputText || '');

  return (
    <Card padding="lg" className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.header}>
          <label htmlFor="clinical-text" className={styles.label}>
            Clinical Text
          </label>
          {onClear && (
            <Button variant="secondary" onClick={onClear} type="button" className={styles.clearBtn}>
              Clear
            </Button>
          )}
        </div>

        <textarea
          id="clinical-text"
          {...register('clinical_text', { required: true })}
          disabled={isLoading}
          placeholder="Paste patient clinical history, symptoms, procedures, lab results, medications..."
          className={styles.textarea}
        />

        <div className={styles.footer}>
          <span className={styles.count}>{clinicalText.length} characters</span>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!clinicalText.trim() || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
