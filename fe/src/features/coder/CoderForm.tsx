import React, { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import type { CaseResult, CoderCaseData, Diagnosis, Procedure, CriticalItem } from '../../core/types';
import { useSubmitRepair } from './useSubmitRepair';
import { useTranslation, type TranslationKey } from '../../shared/i18n';
import styles from './CoderForm.module.css';

interface CoderFormProps {
    result: CaseResult;
}

const therapeuticKeys: Array<{ key: keyof CoderCaseData['therapeuticDays']; labelKey: TranslationKey }> = [
    { key: 'radiation', labelKey: 'coder.therapeuticDays.radiation' },
    { key: 'liver', labelKey: 'coder.therapeuticDays.liver' },
    { key: 'chest', labelKey: 'coder.therapeuticDays.chest' },
    { key: 'psychotherapy', labelKey: 'coder.therapeuticDays.psychotherapy' },
    { key: 'chestDrainage', labelKey: 'coder.therapeuticDays.chestDrainage' },
    { key: 'skull', labelKey: 'coder.therapeuticDays.skull' },
    { key: 'eye', labelKey: 'coder.therapeuticDays.eye' },
    { key: 'burn', labelKey: 'coder.therapeuticDays.burn' },
    { key: 'heart', labelKey: 'coder.therapeuticDays.heart' },
    { key: 'tissue', labelKey: 'coder.therapeuticDays.tissue' },
    { key: 'veins', labelKey: 'coder.therapeuticDays.veins' },
    { key: 'pelvis', labelKey: 'coder.therapeuticDays.pelvis' },
    { key: 'blood', labelKey: 'coder.therapeuticDays.blood' },
    { key: 'orthopedic', labelKey: 'coder.therapeuticDays.orthopedic' },
];

const buildTherapeuticDefaults = (data?: CoderCaseData['therapeuticDays']) =>
    therapeuticKeys.reduce<Record<string, number>>((acc, { key }) => {
        acc[key] = data?.[key] ?? 0;
        return acc;
    }, {}) as CoderCaseData['therapeuticDays'];

const ensureArray = <T extends Diagnosis | Procedure | CriticalItem>(items: T[] | undefined, fallback: T) =>
    items && items.length > 0 ? items : [fallback];

const buildDefaults = (result: CaseResult): CoderCaseData => {
    const diagnosisSource = result.otherDiagnoses?.length ? result.otherDiagnoses : result.diagnoses;

    return {
        mainDiagnosis: result.mainDiagnosis || '',
        hospEnd: result.hospEnd || '',
        patientAge: result.patientAge ?? 0,
        patientAgeUnit: result.patientAgeUnit || 'years',
        patientWeight: result.patientWeight,
        patientSex: result.patientSex || '',
        ventilationHours: result.ventilationHours ?? 0,
        caseYear: result.caseYear ?? new Date().getFullYear(),
        hospDays: result.hospDays ?? 0,
        primaryExpenses: result.primaryExpenses ?? 0,
        hospitalId: result.hospitalId || '',
        otherDiagnoses: ensureArray<Diagnosis>(diagnosisSource, {
            id: `diag-${Date.now()}`,
            code: '',
            name: '',
            ccLevel: '',
            source: 'human',
        }),
        procedures: ensureArray<Procedure>(result.procedures, {
            id: `proc-${Date.now()}`,
            code: '',
            name: '',
            amount: 1,
            source: 'human',
        }),
        criticalItems: ensureArray<CriticalItem>(result.criticalItems, {
            id: `crit-${Date.now()}`,
            code: '',
            amount: 1,
        }),
        therapeuticDays: buildTherapeuticDefaults(result.therapeuticDays),
        rehabilitation: result.rehabilitation || { bedType: '', days: 0 },
    };
};

export const CoderForm: React.FC<CoderFormProps> = ({ result }) => {
    const { t } = useTranslation();
    const {
        register,
        control,
        handleSubmit,
        reset,
    } = useForm<CoderCaseData>({
        defaultValues: useMemo(() => buildDefaults(result), [result]),
    });

    const diagnoses = useFieldArray({
        control,
        name: 'otherDiagnoses',
        keyName: 'fieldKey',
    });

    const procedures = useFieldArray({
        control,
        name: 'procedures',
        keyName: 'fieldKey',
    });

    const criticalItems = useFieldArray({
        control,
        name: 'criticalItems',
        keyName: 'fieldKey',
    });

    const { mutateAsync, isPending, isSuccess, error, reset: resetMutation } = useSubmitRepair();

    useEffect(() => {
        reset(buildDefaults(result));
        resetMutation();
    }, [result, reset, resetMutation]);

    const onSubmit = handleSubmit(async (values) => {
        await mutateAsync(values);
    });

    return (
        <Card className={styles.card}>
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.kicker}>{t('coder.header.kicker')}</p>
                    <h3 className={styles.heading}>{t('coder.header.title')}</h3>
                    <p className={styles.subtext}>{t('coder.header.subtitle')}</p>
                </div>
                <div className={styles.statusRow}>
                    {isSuccess && <span className={styles.success}>{t('coder.header.success')}</span>}
                    {error && <span className={styles.error}>{t('coder.header.error')}</span>}
                </div>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.basics.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.basics.helper')}</p>
                    </div>
                    <div className={styles.grid}>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.mainDiagnosis.label')}</span>
                            <input
                                className={styles.input}
                                placeholder={t('coder.fields.mainDiagnosis.placeholder')}
                                {...register('mainDiagnosis', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.hospEnd.label')}</span>
                            <input
                                className={styles.input}
                                placeholder={t('coder.fields.hospEnd.placeholder')}
                                {...register('hospEnd', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.hospitalId.label')}</span>
                            <input
                                className={styles.input}
                                placeholder={t('coder.fields.hospitalId.placeholder')}
                                {...register('hospitalId', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.caseYear.label')}</span>
                            <input
                                type="number"
                                min={2000}
                                className={styles.input}
                                {...register('caseYear', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.patientAge.label')}</span>
                            <div className={styles.inlineInputs}>
                                <input
                                    type="number"
                                    min={0}
                                    className={styles.input}
                                    {...register('patientAge', { valueAsNumber: true })}
                                />
                                <select className={styles.select} {...register('patientAgeUnit')}>
                                    <option value="years">{t('coder.fields.patientAge.years')}</option>
                                    <option value="days">{t('coder.fields.patientAge.days')}</option>
                                </select>
                            </div>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.patientWeight.label')}</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                placeholder={t('coder.fields.patientWeight.placeholder')}
                                {...register('patientWeight', {
                                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                                })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.patientSex.label')}</span>
                            <select className={styles.select} {...register('patientSex', { required: true })}>
                                <option value="">{t('coder.fields.patientSex.placeholder')}</option>
                                <option value="1">{t('coder.fields.patientSex.male')}</option>
                                <option value="2">{t('coder.fields.patientSex.female')}</option>
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.ventilationHours.label')}</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('ventilationHours', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.hospDays.label')}</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('hospDays', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.primaryExpenses.label')}</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('primaryExpenses', { valueAsNumber: true })}
                            />
                        </label>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.secondary.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.secondary.helper')}</p>
                    </div>
                    <div className={styles.rows}>
                        {diagnoses.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.row}>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.code')}</span>
                                    <input
                                        className={styles.input}
                                        placeholder={t('coder.fields.diagnosisCodePlaceholder')}
                                        {...register(`otherDiagnoses.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.name')}</span>
                                    <input
                                        className={styles.input}
                                        placeholder={t('coder.fields.diagnosisNamePlaceholder')}
                                        {...register(`otherDiagnoses.${index}.name` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.severity.label')}</span>
                                    <select className={styles.select} {...register(`otherDiagnoses.${index}.ccLevel` as const)}>
                                        <option value="">{t('coder.fields.severity.placeholder')}</option>
                                        <option value="0">{t('coder.fields.severity.none')}</option>
                                        <option value="1">{t('coder.fields.severity.cc')}</option>
                                        <option value="2">{t('coder.fields.severity.mcc')}</option>
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => diagnoses.remove(index)}
                                    aria-label={t('coder.actions.removeDiagnosis')}
                                >
                                    {t('common.actions.remove')}
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className={styles.addButton}
                        onClick={() =>
                            diagnoses.append({
                                id: `diag-${Date.now()}`,
                                code: '',
                                name: '',
                                ccLevel: '',
                                source: 'human',
                            })
                        }
                    >
                        {t('coder.actions.addDiagnosis')}
                    </Button>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.procedures.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.procedures.helper')}</p>
                    </div>
                    <div className={styles.rows}>
                        {procedures.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.row}>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.code')}</span>
                                    <input
                                        className={styles.input}
                                        placeholder={t('coder.fields.procedureCodePlaceholder')}
                                        {...register(`procedures.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.name')}</span>
                                    <input
                                        className={styles.input}
                                        placeholder={t('coder.fields.procedureNamePlaceholder')}
                                        {...register(`procedures.${index}.name` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.amount')}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        className={styles.input}
                                        {...register(`procedures.${index}.amount` as const, { valueAsNumber: true })}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => procedures.remove(index)}
                                    aria-label={t('coder.actions.removeProcedure')}
                                >
                                    {t('common.actions.remove')}
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className={styles.addButton}
                        onClick={() =>
                            procedures.append({
                                id: `proc-${Date.now()}`,
                                code: '',
                                name: '',
                                amount: 1,
                                source: 'human',
                            })
                        }
                    >
                        {t('coder.actions.addProcedure')}
                    </Button>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.therapeutic.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.therapeutic.helper')}</p>
                    </div>
                    <div className={styles.therapeuticGrid}>
                        {therapeuticKeys.map(({ key, labelKey }) => (
                            <label key={key} className={styles.field}>
                                <span className={styles.label}>{t(labelKey)}</span>
                                <input
                                    type="number"
                                    min={0}
                                    className={styles.input}
                                    {...register(`therapeuticDays.${key}` as const, {
                                        setValueAs: (value) => (value === '' ? 0 : Number(value)),
                                    })}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.rehab.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.rehab.helper')}</p>
                    </div>
                    <div className={styles.grid}>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.rehabBedType.label')}</span>
                            <select className={styles.select} {...register('rehabilitation.bedType' as const)}>
                                <option value="">{t('coder.fields.rehabBedType.placeholder')}</option>
                                <option value="2H1">{t('coder.fields.rehabBedType.h2')}</option>
                                <option value="2F1">{t('coder.fields.rehabBedType.f2')}</option>
                                <option value="1F1">{t('coder.fields.rehabBedType.f1')}</option>
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>{t('coder.fields.rehabDays.label')}</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('rehabilitation.days' as const, { valueAsNumber: true })}
                            />
                        </label>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{t('coder.sections.critical.title')}</h4>
                        <p className={styles.helperText}>{t('coder.sections.critical.helper')}</p>
                    </div>
                    <div className={styles.rows}>
                        {criticalItems.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.rowCritical}>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.code')}</span>
                                    <input
                                        className={styles.input}
                                        placeholder={t('coder.fields.criticalCodePlaceholder')}
                                        {...register(`criticalItems.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('coder.fields.criticalAmount.label')}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        className={styles.input}
                                        {...register(`criticalItems.${index}.amount` as const, { valueAsNumber: true })}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => criticalItems.remove(index)}
                                    aria-label={t('coder.actions.removeCritical')}
                                >
                                    {t('common.actions.remove')}
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className={styles.addButton}
                        onClick={() =>
                            criticalItems.append({
                                id: `crit-${Date.now()}`,
                                code: '',
                                amount: 1,
                            })
                        }
                    >
                        {t('coder.actions.addCritical')}
                    </Button>
                </div>

                <div className={styles.footerActions}>
                    {error && <span className={styles.error}>{t('coder.footer.errorPrefix', { message: (error as Error).message })}</span>}
                    <Button type="submit" isLoading={isPending} disabled={isPending}>
                        {t('coder.footer.submit')}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
