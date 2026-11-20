/**
 * Language context for PureAir Life.
 *
 * Kept in a plain `.js` module so this file exports no React components and
 * stays free of `react/only-export-components` lint noise.
 */

import { createContext, useContext } from 'react';
import { translate } from './strings.js';

/** @typedef {'en' | 'hi'} Language */

/** Supported UI languages. */
export const LANGUAGES = /** @type {const} */ ([
  { code: 'en', label: 'English', short: 'EN', htmlLang: 'en' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं', htmlLang: 'hi' }
]);

export const DEFAULT_LANGUAGE = 'en';

const STORAGE_KEY = 'pureair.language';

/**
 * @type {import('react').Context<{ lang: Language, setLang: (l: Language) => void, t: (k: string, f?: string) => string, toggleLang: () => void }>}
 */
export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key, fallback) => translate(DEFAULT_LANGUAGE, key, fallback),
  toggleLang: () => {}
});

/**
 * Read the persisted language preference.
 * @returns {Language}
 */
export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'hi' ? 'hi' : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Persist the language preference.
 * @param {Language} lang
 */
export function storeLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable - preference simply will not persist */
  }
}

/**
 * Access the active language and translator.
 * @returns {{ lang: Language, setLang: (l: Language) => void, t: (k: string, f?: string) => string, toggleLang: () => void }}
 */
export function useLanguage() {
  return useContext(LanguageContext);
}
