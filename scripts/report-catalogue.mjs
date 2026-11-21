#!/usr/bin/env node
/**
 * PureAir Life catalogue report.
 *
 * Prints the distinct descriptive values used by the telemetry catalogue and
 * flags the two classes of drift that silently break the app:
 *
 *   1. a city whose stored AQI disagrees with the EPA value derived from its
 *      PM2.5 (the two numbers are shown side by side in the UI);
 *   2. a catalogue string that has no entry in the Hindi phrase table, so it
 *      would ship untranslated.
 *
 * The catalogue and the phrase table are imported rather than parsed out of
 * the source text, so this report can never drift from the running code.
 *
 * Usage:  node scripts/report-catalogue.mjs
 *         npm run report:catalogue
 */

import { ALL_INDIAN_CITIES } from '../src/services/telemetry/cityCatalogue.js';
import { calculateAQIFromPM25 } from '../src/services/telemetry/aqi.js';
import { PHRASES } from '../src/i18n/phrases.js';

/** Distinct values of a catalogue field. */
function distinct(field) {
  const out = new Set();
  for (const city of ALL_INDIAN_CITIES) {
    const value = city[field];
    if (typeof value === 'string' && value.trim()) out.add(value);
  }
  return [...out];
}

const cities = ALL_INDIAN_CITIES;
const known = new Set(Object.keys(PHRASES));

console.log(`Cities in catalogue: ${cities.length}`);
for (const field of ['smogType', 'inversionStrength', 'status']) {
  console.log(`Distinct ${field}: ${distinct(field).length}`);
}
console.log(`Hindi phrase table entries: ${known.size}`);

// ---- 1. AQI / PM2.5 consistency -----------------------------------------
const mismatched = cities.filter((city) => city.aqi !== calculateAQIFromPM25(city.pm25));
console.log(
  mismatched.length === 0
    ? '\nAQI/PM2.5 consistency: OK for every city.'
    : `\nAQI/PM2.5 MISMATCH in ${mismatched.length} city/cities:`
);
for (const city of mismatched) {
  console.log(
    `  - ${city.name}: aqi=${city.aqi} but PM2.5 ${city.pm25} derives ${calculateAQIFromPM25(city.pm25)}`
  );
}

// ---- 2. Translation coverage ---------------------------------------------
const gaps = [];
for (const field of ['smogType', 'inversionStrength', 'status']) {
  for (const value of distinct(field)) {
    if (/^\d{2}:\d{2}/.test(value)) continue;
    if (!known.has(value)) gaps.push(`[${field}] ${value}`);
  }
}
console.log(
  gaps.length === 0
    ? 'Translation coverage: OK for every catalogue string.'
    : `Untranslated catalogue strings (${gaps.length}):`
);
for (const gap of gaps) console.log(`  - ${gap}`);

process.exit(mismatched.length === 0 && gaps.length === 0 ? 0 : 1);
