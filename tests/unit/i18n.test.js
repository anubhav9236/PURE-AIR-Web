import { describe, it, expect } from 'vitest';
import { STRINGS, translate } from '../../src/i18n/strings.js';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../../src/i18n/languageContext.js';
import {
  containsHindi,
  generateLocalFallbackChat,
  generateLocalFallbackRoutine,
  generateLocalFallbackVisionAudit
} from '../../src/services/localGuide.js';

describe('Translation table', () => {
  const keys = Object.keys(STRINGS);

  it('contains a meaningful set of strings', () => {
    expect(keys.length).toBeGreaterThan(80);
  });

  it('provides an English and a Hindi value for every key', () => {
    const missing = [];
    for (const key of keys) {
      const entry = STRINGS[key];
      if (!entry.en || !entry.hi) missing.push(key);
    }
    expect(missing).toEqual([]);
  });

  it('gives every Hindi value at least one Devanagari character', () => {
    // The language-toggle label intentionally shows the *other* language, so
    // its Hindi value is English by design.
    const languageToggleKeys = new Set(['nav.switchToHindi']);
    const offenders = keys.filter(
      (key) => !languageToggleKeys.has(key) && !/[\u0900-\u097F]/.test(STRINGS[key].hi)
    );
    expect(offenders).toEqual([]);
  });

  it('falls back to English for an unknown key', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
    expect(translate('hi', 'does.not.exist', 'fallback')).toBe('fallback');
  });

  it('returns the requested language', () => {
    expect(translate('en', 'nav.dashboard')).toBe('Smog Shield');
    expect(translate('hi', 'nav.dashboard')).toBe('स्मॉग शील्ड');
  });

  it('exposes exactly the supported languages', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['en', 'hi']);
    expect(DEFAULT_LANGUAGE).toBe('en');
  });
});

describe('Hindi detection', () => {
  it('detects Devanagari text', () => {
    expect(containsHindi('धुएँ में बचाव')).toBe(true);
  });

  it('does not flag English text', () => {
    expect(containsHindi('how do I protect my family?')).toBe(false);
  });

  it('handles non-string input safely', () => {
    expect(containsHindi(null)).toBe(false);
    expect(containsHindi(42)).toBe(false);
  });
});

describe('Offline clean-air guide', () => {
  const HOTSPOT = {
    name: 'Delhi',
    aqi: 342,
    pm25: 280,
    state: 'Delhi NCR'
  };

  it('answers the documented severe-smog scenario in English', () => {
    const answer = generateLocalFallbackChat(
      'How can I protect myself during severe winter smog?',
      HOTSPOT,
      'en'
    );
    expect(answer).toMatch(/thermal inversion/i);
    expect(answer.length).toBeGreaterThan(80);
  });

  it('answers the indoor air quality scenario', () => {
    const answer = generateLocalFallbackChat(
      'How can I improve indoor air quality?',
      HOTSPOT,
      'en'
    );
    expect(answer).toMatch(/CR box|Corsi|MERV/i);
  });

  it('answers the eco-friendly routine scenario', () => {
    const answer = generateLocalFallbackChat(
      'Suggest an eco-friendly daily routine.',
      HOTSPOT,
      'en'
    );
    expect(answer.length).toBeGreaterThan(80);
  });

  it('answers the transport emissions scenario', () => {
    const answer = generateLocalFallbackChat(
      'Which transportation options produce fewer emissions?',
      HOTSPOT,
      'en'
    );
    expect(answer).toMatch(/metro|cycling|electric/i);
  });

  it('answers the pet safety scenario', () => {
    const answer = generateLocalFallbackChat('Is it safe to walk my dog?', HOTSPOT, 'en');
    expect(answer).toMatch(/dog/i);
  });

  it('answers the child mask scenario', () => {
    const answer = generateLocalFallbackChat(
      'How do I fit an N95 mask on a 5-year-old?',
      HOTSPOT,
      'en'
    );
    expect(answer).toMatch(/N95|KF94|under 2/i);
  });

  it('answers the cooking scenario', () => {
    const answer = generateLocalFallbackChat(
      'What dinner cooking hacks prevent indoor PM2.5?',
      HOTSPOT,
      'en'
    );
    expect(answer).toMatch(/PM2\.5|exhaust|induction/i);
  });

  it('answers Hindi queries in Hindi', () => {
    const answer = generateLocalFallbackChat('धुएँ में बच्चों को कैसे बचाएँ?', HOTSPOT, 'hi');
    expect(answer).toMatch(/[ऀ-ॿ]/);
  });

  it('produces a bilingual routine with the same structure', () => {
    const profile = {
      adults: 2,
      children: 1,
      elderly: 1,
      vulnerabilities: ['Toddlers & Infants']
    };

    const en = generateLocalFallbackRoutine(profile, HOTSPOT, 'en');
    const hi = generateLocalFallbackRoutine(profile, HOTSPOT, 'hi');

    expect(en.timeBlocks).toHaveLength(hi.timeBlocks.length);
    expect(en.timeBlocks).toHaveLength(4);
    expect(hi.timeBlocks[0].phase).toMatch(/[ऀ-ॿ]/);
    expect(en.source).toBe('fallback');
    expect(hi.source).toBe('fallback');
  });

  it('produces a bilingual vision audit', () => {
    const en = generateLocalFallbackVisionAudit('Bedroom', 'drafty', 'en');
    const hi = generateLocalFallbackVisionAudit('Bedroom', 'drafty', 'hi');
    expect(en.stepByStepFixes.length).toBe(hi.stepByStepFixes.length);
    expect(hi.stepByStepFixes[0].title).toMatch(/[ऀ-ॿ]/);
  });

  it('never claims to be a live measurement', () => {
    const routine = generateLocalFallbackRoutine({ vulnerabilities: [] }, HOTSPOT, 'en');
    expect(routine.source).toBe('fallback');
  });
});
