import { describe, it, expect } from 'vitest';
import { PHRASES, translatePhrase, translatePhrases } from '../../src/i18n/phrases.js';
import {
  ALL_INDIAN_CITIES,
  VULNERABLE_PROFILES,
  getAQICategory,
  generateDiurnalCurve
} from '../../src/services/telemetryService.js';

/** Latin words of 3+ characters, i.e. English prose and technical acronyms. */
const LATIN_WORD = /[A-Za-z]{3,}/g;

/**
 * Detect English that leaked into a Hindi rendering.
 *
 * A phrase leaks when it was left untranslated entirely, or when the
 * translation introduces a Latin word that does not already exist in the
 * English source (technical acronyms such as HEPA, N95, PM2.5 and VOCs are
 * legitimately kept, so they are not counted).
 *
 * @param {string} source English source string
 * @param {string} translated rendered translation
 * @returns {string[]} human-readable leak descriptions
 */
function englishLeaks(source, translated) {
  const sourceWords = source.match(LATIN_WORD) || [];
  if (sourceWords.length === 0) return [];
  if (translated === source) return ['<not translated>'];
  const known = new Set(sourceWords.map((w) => w.toLowerCase()));
  return (translated.match(LATIN_WORD) || [])
    .filter((w) => !known.has(w.toLowerCase()))
    .map((w) => w.toLowerCase());
}

describe('Data phrase table', () => {
  it('translates a known phrase', () => {
    expect(translatePhrase('Hazardous', 'hi')).toBe('खतरनाक');
  });

  it('returns the English source in English mode', () => {
    expect(translatePhrase('Hazardous', 'en')).toBe('Hazardous');
  });

  it('falls back to the source string for an unknown phrase', () => {
    expect(translatePhrase('Totally Unknown Phrase', 'hi')).toBe('Totally Unknown Phrase');
  });

  it('handles non-string input safely', () => {
    expect(translatePhrase(null, 'hi')).toBeNull();
    expect(translatePhrase(42, 'hi')).toBe(42);
  });

  it('translates a list of phrases', () => {
    expect(translatePhrases(['Good', 'Unknown'], 'hi')).toEqual(['अच्छा', 'Unknown']);
    expect(translatePhrases(['Good'], 'en')).toEqual(['Good']);
  });

  it('gives every Hindi value at least one Devanagari character', () => {
    const offenders = Object.entries(PHRASES)
      .filter(([, hi]) => !/[\u0900-\u097F]/.test(hi))
      .map(([en]) => en);
    expect(offenders).toEqual([]);
  });

  it('has no duplicate source strings', () => {
    // The table is an object literal, so duplicates collapse silently at build
    // time; this guards against a future refactor to an array.
    const keys = Object.keys(PHRASES);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('No English leaks in Hindi mode', () => {
  it('translates every city haze descriptor', () => {
    const leaks = [];
    for (const city of ALL_INDIAN_CITIES) {
      for (const field of [
        'smogType',
        'inversionStrength',
        'status',
        'safeWindow',
        'peakSmogHours'
      ]) {
        const translated = translatePhrase(city[field], 'hi');
        for (const leak of englishLeaks(city[field], translated)) {
          leaks.push(`${city.id}.${field}: ${leak}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it('translates every vulnerable-profile string', () => {
    const leaks = [];
    for (const profile of Object.values(VULNERABLE_PROFILES)) {
      for (const value of [profile.name, profile.lungVulnerability, ...profile.guidelines]) {
        for (const leak of englishLeaks(value, translatePhrase(value, 'hi'))) {
          leaks.push(`${profile.id}: ${leak}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it('translates every AQI category label and advice', () => {
    const leaks = [];
    for (const aqi of [10, 75, 125, 175, 250, 400]) {
      const category = getAQICategory(aqi, 'hi');
      const en = getAQICategory(aqi, 'en');
      for (const leak of englishLeaks(en.label, category.label)) {
        leaks.push(`label@${aqi}: ${leak}`);
      }
      for (const leak of englishLeaks(en.advice, category.advice)) {
        leaks.push(`advice@${aqi}: ${leak}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('translates every diurnal action hint', () => {
    const hi = generateDiurnalCurve(290, 'hi');
    const en = generateDiurnalCurve(290, 'en');
    const leaks = [];
    for (const [i, point] of en.entries()) {
      for (const leak of englishLeaks(point.action, hi[i].action)) {
        leaks.push(`${point.hour}: ${leak}`);
      }
    }
    expect(leaks).toEqual([]);
  });
});

describe('Language-aware telemetry helpers', () => {
  it('keeps English output identical when lang is en', () => {
    expect(getAQICategory(340).label).toBe('Hazardous / Severe+');
    expect(getAQICategory(340, 'en').label).toBe('Hazardous / Severe+');
  });

  it('returns Hindi categories when lang is hi', () => {
    expect(getAQICategory(340, 'hi').label).toBe('खतरनाक / अत्यधिक');
    expect(getAQICategory(25, 'hi').label).toBe('अच्छा');
  });

  it('returns Hindi diurnal actions when lang is hi', () => {
    const hi = generateDiurnalCurve(290, 'hi');
    const en = generateDiurnalCurve(290, 'en');
    expect(hi).toHaveLength(en.length);
    expect(hi[13].action).not.toBe(en[13].action);
  });

  it('produces the same numeric curve regardless of language', () => {
    const hi = generateDiurnalCurve(290, 'hi');
    const en = generateDiurnalCurve(290, 'en');
    expect(hi.map((p) => p.aqi)).toEqual(en.map((p) => p.aqi));
    expect(hi.map((p) => p.pm25)).toEqual(en.map((p) => p.pm25));
  });
});
