import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cs } from './locales/cs';
import { en } from './locales/en';
import type { Locale, TranslationKey, TranslationTree } from './types';

const translations = { cs, en } as const;
const STORAGE_KEY = 'drg-i18n-locale';
const FALLBACK_LOCALE: Locale = 'cs';

type TranslationParams = Record<string, string | number>;

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, params?: TranslationParams) => string;
    availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const resolveMessage = (tree: TranslationTree, key: string): string | TranslationTree | undefined => {
    return key.split('.').reduce<string | TranslationTree | undefined>((acc, part) => {
        if (acc && typeof acc === 'object') {
            return acc[part] as string | TranslationTree | undefined;
        }
        return undefined;
    }, tree);
};

const formatMessage = (message: string, params?: TranslationParams) => {
    if (!params) {
        return message;
    }

    return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, token) => {
        const value = params[token];
        return value !== undefined ? String(value) : '';
    });
};

const detectInitialLocale = (defaultLocale: Locale): Locale => {
    if (typeof window === 'undefined') {
        return defaultLocale;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && translations[stored]) {
        return stored;
    }

    return defaultLocale;
};

export const I18nProvider: React.FC<{ children: React.ReactNode; defaultLocale?: Locale }> = ({
    children,
    defaultLocale = 'cs',
}) => {
    const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale(defaultLocale));

    const setLocale = useCallback((nextLocale: Locale) => {
        setLocaleState(nextLocale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, nextLocale);
        }
    }, []);

    const t = useCallback(
        (key: TranslationKey, params?: TranslationParams) => {
            const localeMessages = translations[locale] as TranslationTree;
            const fallbackMessages = translations[FALLBACK_LOCALE] as TranslationTree;

            const raw = resolveMessage(localeMessages, key) ?? resolveMessage(fallbackMessages, key) ?? key;

            if (typeof raw !== 'string') {
                return key;
            }

            return formatMessage(raw, params);
        },
        [locale],
    );

    const value = useMemo(
        () => ({
            locale,
            setLocale,
            t,
            availableLocales: Object.keys(translations) as Locale[],
        }),
        [locale, setLocale, t],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider');
    }
    return context;
};
