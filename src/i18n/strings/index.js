/**
 * Assembled UI string table.
 *
 * Each domain lives in its own module so the table stays readable; this file
 * merges them and exposes the lookup helper.
 */

/**
 * @typedef {'en' | 'hi'} Language
 */

import { appStrings } from './app.js';
import { navStrings } from './nav.js';
import { aiStrings } from './ai.js';
import { dashStrings } from './dash.js';
import { plannerStrings } from './planner.js';
import { scannerStrings } from './scanner.js';
import { hacklabStrings } from './hacklab.js';
import { impactStrings } from './impact.js';
import { chatStrings } from './chat.js';

/** @type {Record<string, { en: string, hi: string }>} */
export const STRINGS = {
  ...appStrings,
  ...navStrings,
  ...aiStrings,
  ...dashStrings,
  ...plannerStrings,
  ...scannerStrings,
  ...hacklabStrings,
  ...impactStrings,
  ...chatStrings
};

/**
 * Look up a translated string.
 *
 * Falls back to the English source when the requested language is missing, and
 * to the supplied fallback (or the key itself) when the key is unknown, so a
 * partially translated screen degrades gracefully instead of showing blanks.
 *
 * @param {Language} lang
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function translate(lang, key, fallback = '') {
  const entry = STRINGS[key];
  if (!entry) return fallback || key;
  return entry[lang] || entry.en || fallback || key;
}
