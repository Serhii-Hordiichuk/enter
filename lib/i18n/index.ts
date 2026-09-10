/**
 * Lightweight i18n helper — no heavy deps.
 * Locale bundles are JSON (en, uk); `t(key, vars)` does {var} interpolation.
 * Language resolution: stored override → Navigator.language → 'en'.
 */

import en from './en.json';
import uk from './uk.json';

const LOCALES: Record<string, Record<string, string>> = { en, uk };
export const SUPPORTED_LOCALES = Object.keys(LOCALES);
export const DEFAULT_LOCALE = 'en';

export type LocaleCode = keyof typeof LOCALES;

function normalizeLocale(code: string): LocaleCode {
  const base = code.toLowerCase().split('-')[0];
  return (base in LOCALES ? base : DEFAULT_LOCALE) as LocaleCode;
}

export function detectLocale(): LocaleCode {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('gotoap.locale');
    if (stored && stored in LOCALES) return stored as LocaleCode;
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocale(navigator.language);
  }
  return DEFAULT_LOCALE;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  // Lazily pick locale so SSR doesn't break.
  const locale: LocaleCode = (typeof window !== 'undefined') ? detectLocale() : DEFAULT_LOCALE;
  const bundle = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];
  let str = bundle[key] ?? LOCALES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v));
    }
  }
  return str;
}

export function setLocale(code: string): LocaleCode {
  const normalized = normalizeLocale(code);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('gotoap.locale', normalized);
  }
  return normalized;
}

export function getLocale(): LocaleCode {
  return detectLocale();
}