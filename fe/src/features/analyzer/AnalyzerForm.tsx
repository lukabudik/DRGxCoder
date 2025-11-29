import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { useTranslation } from '../../shared/i18n';
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
    const { t } = useTranslation();

    return (
        <Card className={styles.container} padding="lg">
            <form onSubmit={handleSubmit((data) => onSubmit(data.text))} className={styles.form}>
                <div className={styles.header}>
                    <label htmlFor="text-input" className={styles.label}>{t('analyzer.label')}</label>
                    <span className={styles.helper}>{t('analyzer.helper')}</span>
                </div>

                <textarea
                    id="text-input"
                    className={styles.textarea}
                    placeholder={t('analyzer.placeholder')}
                    {...register('text', { required: true })}
                    disabled={isLoading}
                />

                <div className={styles.footer}>
                    <span className={styles.count}>{t('common.states.characters', { count: text.length })}</span>
                    <Button type="submit" isLoading={isLoading} disabled={!text.trim()}>
                        {t('analyzer.submit')}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
