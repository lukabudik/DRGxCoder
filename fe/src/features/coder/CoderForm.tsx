import React, { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import type { CaseResult, CoderCaseData, Diagnosis, Procedure, CriticalItem } from '../../core/types';
import { useSubmitRepair } from './useSubmitRepair';
import styles from './CoderForm.module.css';

interface CoderFormProps {
    result: CaseResult;
}

const therapeuticKeys: Array<{ key: keyof CoderCaseData['therapeuticDays']; label: string }> = [
    { key: 'radiation', label: 'Počet ozařovacích dnů' },
    { key: 'liver', label: 'Dny s endoskopickým/radiologickým výkonem na játrech' },
    { key: 'chest', label: 'Dny s operačním výkonem v dutině hrudní' },
    { key: 'psychotherapy', label: 'Dny akutní psychiatrické péče' },
    { key: 'chestDrainage', label: 'Dny s výkonem hrudní drenáže' },
    { key: 'skull', label: 'Dny s výkonem na lebce nebo mozku' },
    { key: 'eye', label: 'Dny s výkonem na oku' },
    { key: 'burn', label: 'Ošetř. dny pro popáleninu/omrzlinu v CA' },
    { key: 'heart', label: 'Dny s výkonem na srdci nebo aortě' },
    { key: 'tissue', label: 'Dny s výkonem na měkkých/pojivových tkáních' },
    { key: 'veins', label: 'Dny s výkonem na periferních cévách' },
    { key: 'pelvis', label: 'Dny s operačním výkonem v dutině břišní/pánevní' },
    { key: 'blood', label: 'Dny s eliminačními metodami krve' },
    { key: 'orthopedic', label: 'Dny s ortopedickým operačním výkonem' },
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
                    <p className={styles.kicker}>Coder repair</p>
                    <h3 className={styles.heading}>Edit grouper inputs & send repair</h3>
                    <p className={styles.subtext}>Fields mirror the CZ-DRG interactive classifier. Values below are fully editable.</p>
                </div>
                <div className={styles.statusRow}>
                    {isSuccess && <span className={styles.success}>Saved to server</span>}
                    {error && <span className={styles.error}>Submission failed</span>}
                </div>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>Základní informace</h4>
                        <p className={styles.helperText}>Hlavní diagnóza, ukončení hospitalizace a základní údaje o pacientovi.</p>
                    </div>
                    <div className={styles.grid}>
                        <label className={styles.field}>
                            <span className={styles.label}>Hlavní diagnóza případu*</span>
                            <input
                                className={styles.input}
                                placeholder="Např. J18.9"
                                {...register('mainDiagnosis', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Ukončení hospitalizace (0-8, P)</span>
                            <input
                                className={styles.input}
                                placeholder="1"
                                {...register('hospEnd', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Zdravotnické zařízení (IČZ)</span>
                            <input
                                className={styles.input}
                                placeholder="12345678"
                                {...register('hospitalId', { required: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Rok ukončení případu</span>
                            <input
                                type="number"
                                min={2000}
                                className={styles.input}
                                {...register('caseYear', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Věk pacienta při přijetí</span>
                            <div className={styles.inlineInputs}>
                                <input
                                    type="number"
                                    min={0}
                                    className={styles.input}
                                    {...register('patientAge', { valueAsNumber: true })}
                                />
                                <select className={styles.select} {...register('patientAgeUnit')}>
                                    <option value="years">roky</option>
                                    <option value="days">dny</option>
                                </select>
                            </div>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Porodní hmotnost (g)</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                placeholder="např. 3200"
                                {...register('patientWeight', {
                                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                                })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Pohlaví pacienta</span>
                            <select className={styles.select} {...register('patientSex', { required: true })}>
                                <option value="">Vyberte</option>
                                <option value="1">1 – Muž</option>
                                <option value="2">2 – Žena</option>
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Délka připojení k UPV (hodiny)</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('ventilationHours', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Délka případu (dny)</span>
                            <input
                                type="number"
                                min={0}
                                className={styles.input}
                                {...register('hospDays', { valueAsNumber: true })}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Přímé náklady HP (Kč)</span>
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
                        <h4 className={styles.sectionTitle}>Vedlejší diagnózy</h4>
                        <p className={styles.helperText}>Pořadí je důležité pro akutní rehabilitaci (2H1/2F1).</p>
                    </div>
                    <div className={styles.rows}>
                        {diagnoses.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.row}>
                                <label className={styles.field}>
                                    <span className={styles.label}>Kód</span>
                                    <input
                                        className={styles.input}
                                        placeholder="např. E11.9"
                                        {...register(`otherDiagnoses.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Název</span>
                                    <input
                                        className={styles.input}
                                        placeholder="Popis diagnózy"
                                        {...register(`otherDiagnoses.${index}.name` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Závažnost</span>
                                    <select className={styles.select} {...register(`otherDiagnoses.${index}.ccLevel` as const)}>
                                        <option value="">Neuvedeno</option>
                                        <option value="0">0 – bez CC/MCC</option>
                                        <option value="1">1 – CC</option>
                                        <option value="2">2 – MCC</option>
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => diagnoses.remove(index)}
                                    aria-label="Odebrat vedlejší diagnózu"
                                >
                                    Odebrat
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
                        Přidat vedlejší diagnózu
                    </Button>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>Výkony</h4>
                        <p className={styles.helperText}>Kód výkonu, název a počet (množství).</p>
                    </div>
                    <div className={styles.rows}>
                        {procedures.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.row}>
                                <label className={styles.field}>
                                    <span className={styles.label}>Kód</span>
                                    <input
                                        className={styles.input}
                                        placeholder="např. 3E0234Z"
                                        {...register(`procedures.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Název</span>
                                    <input
                                        className={styles.input}
                                        placeholder="Popis výkonu"
                                        {...register(`procedures.${index}.name` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Počet</span>
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
                                    aria-label="Odebrat výkon"
                                >
                                    Odebrat
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
                        Přidat výkon
                    </Button>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>Terapeutické dny</h4>
                        <p className={styles.helperText}>Počty dnů podle požadovaných kategorií v interaktivním klasifikátoru.</p>
                    </div>
                    <div className={styles.therapeuticGrid}>
                        {therapeuticKeys.map(({ key, label }) => (
                            <label key={key} className={styles.field}>
                                <span className={styles.label}>{label}</span>
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
                        <h4 className={styles.sectionTitle}>Rehabilitace</h4>
                        <p className={styles.helperText}>Příjmová lůžková odbornost 2H1 / 2F1 a počet rehab. dnů.</p>
                    </div>
                    <div className={styles.grid}>
                        <label className={styles.field}>
                            <span className={styles.label}>Příjmová odbornost</span>
                            <select className={styles.select} {...register('rehabilitation.bedType' as const)}>
                                <option value="">Neuvedeno</option>
                                <option value="2H1">2H1</option>
                                <option value="2F1">2F1</option>
                                <option value="1F1">1F1</option>
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>Počet rehabilitačních dnů</span>
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
                        <h4 className={styles.sectionTitle}>Zvlášť účtované kritické položky</h4>
                        <p className={styles.helperText}>Kód kritické položky a množství.</p>
                    </div>
                    <div className={styles.rows}>
                        {criticalItems.fields.map((field, index) => (
                            <div key={field.fieldKey} className={styles.row}>
                                <label className={styles.field}>
                                    <span className={styles.label}>Kód</span>
                                    <input
                                        className={styles.input}
                                        placeholder="Kód položky"
                                        {...register(`criticalItems.${index}.code` as const)}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>Množství</span>
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
                                    aria-label="Odebrat kritickou položku"
                                >
                                    Odebrat
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
                        Přidat kritickou položku
                    </Button>
                </div>

                <div className={styles.footerActions}>
                    {error && <span className={styles.error}>Chyba: {(error as Error).message}</span>}
                    <Button type="submit" isLoading={isPending} disabled={isPending}>
                        Odeslat opravu na server
                    </Button>
                </div>
            </form>
        </Card>
    );
};
