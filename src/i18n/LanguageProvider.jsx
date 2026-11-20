/**
 * Language provider for PureAir Life.
 *
 * Applies the chosen language to the whole app, keeps the `<html lang>`
 * attribute accurate for screen readers, and persists the preference.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LanguageContext,
  readStoredLanguage,
  storeLanguage
} from './languageContext.js';
import { translate } from './strings.js';

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.documentElement.dir = 'ltr';
  }, [lang]);

  const setLang = useCallback((next) => {
    const value = next === 'hi' ? 'hi' : DEFAULT_LANGUAGE;
    setLangState(value);
    storeLanguage(value);
  }, []);

  // Derives the next language from the current state instead of from a state
  // updater. Performing side effects inside an updater is unsafe: React may
  // invoke the updater more than once, which would apply the toggle twice and
  // persist the wrong preference.
  const toggleLang = useCallback(() => {
    const next = lang === 'hi' ? 'en' : 'hi';
    setLangState(next);
    storeLanguage(next);
  }, [lang]);

  const t = useCallback((key, fallback) => translate(lang, key, fallback), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
