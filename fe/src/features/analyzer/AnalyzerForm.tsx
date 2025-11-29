import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import styles from './AnalyzerForm.module.css';

interface AnalyzerFormProps {
    onSubmit: (text: string) => void;
    isLoading: boolean;
}

interface FormValues {
    text: string;
}

export const AnalyzerForm: React.FC<AnalyzerFormProps> = ({ onSubmit, isLoading }) => {
    const { register, handleSubmit, watch } = useForm<FormValues>();
    const text = watch('text', '');

    return (
        <Card className={styles.container} padding="lg">
            <form onSubmit={handleSubmit((data) => onSubmit(data.text))} className={styles.form}>
                <div className={styles.header}>
                    <label htmlFor="text-input" className={styles.label}>Clinician Text</label>
                    <span className={styles.helper}>Paste discharge summary or epicrisis</span>
                </div>

                <textarea
                    id="text-input"
                    className={styles.textarea}
                    placeholder="Paste clinical text here..."
                    {...register('text', { required: true })}
                    disabled={isLoading}
                />

                <div className={styles.footer}>
                    <span className={styles.count}>{text.length} characters</span>
                    <Button type="submit" isLoading={isLoading} disabled={!text.trim()}>
                        Analyze Text
                    </Button>
                </div>
            </form>
        </Card>
    );
};
