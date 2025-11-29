import type { cs } from './locales/cs';

export type TranslationSchema = typeof cs;
export type Locale = 'cs' | 'en';

export type TranslationTree = Record<string, string | TranslationTree>;

export type TranslationKey<T extends Record<string, unknown> = TranslationSchema> = {
    [K in keyof T]: T[K] extends string
        ? K & string
        : `${K & string}.${TranslationKey<T[K]>}`;
}[keyof T];
