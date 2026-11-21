#!/usr/bin/env node
/**
 * i18n coverage audit for the PureAir Life telemetry catalogue.
 *
 * The catalogue (src/services/telemetry/cityCatalogue.js) ships a lot of
 * descriptive English data - haze descriptors, inversion physics, AQI
 * categories and vulnerable-group guidance. `src/i18n/phrases.js` carries the
 * Hindi translations for those strings.
 *
 * This script reports any catalogue string that has no Hindi translation, so
 * a newly added city or profile cannot silently ship untranslated.
 *
 * Usage:  node scripts/audit-i18n.mjs
 * Exit code 0 = fully translated, 1 = gaps found.
 */

import { ALL_INDIAN_CITIES } from '../src/services/telemetry/cityCatalogue.js';
import { VULNERABLE_PROFILES } from '../src/services/telemetry/vulnerableProfiles.js';
import { PHRASES } from '../src/i18n/phrases.js';

const known = new Set(Object.keys(PHRASES));
const fields = ['smogType', 'inversionStrength', 'status', 'safeWindow', 'peakSmogHours'];

const gaps = [];
const checked = new Set();

for (const field of fields) {
  for (const city of ALL_INDIAN_CITIES) {
    const value = city[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    // The safe-window strings are mostly a time range; only the ones carrying
    // prose need a phrase entry.
    const needsTranslation = /[A-Za-z]{4,}/.test(value) && !/^\d{2}:\d{2}/.test(value);
    if (!needsTranslation) continue;
    if (checked.has(value)) continue;
    checked.add(value);
    if (!known.has(value)) gaps.push({ field, value });
  }
}

// The vulnerable-group profiles carry their own prose.
for (const profile of Object.values(VULNERABLE_PROFILES)) {
  for (const value of [profile.name, profile.lungVulnerability, ...profile.guidelines]) {
    if (typeof value !== 'string' || !value.trim()) continue;
    if (!/[A-Za-z]{4,}/.test(value)) continue;
    if (checked.has(value)) continue;
    checked.add(value);
    if (!known.has(value)) gaps.push({ field: 'vulnerableProfiles', value });
  }
}

console.log(`Phrase table entries: ${known.size}`);
console.log(`Catalogue fields checked: ${fields.join(', ')}`);

if (gaps.length === 0) {
  console.log('\nAll catalogue prose has a Hindi translation.');
  process.exit(0);
}

console.log(`\n${gaps.length} catalogue string(s) without a Hindi translation:`);
for (const gap of gaps) console.log(`  - [${gap.field}] ${gap.value}`);
console.log('\nAdd each string to src/i18n/phrases.js to close the gap.');
process.exit(1);
