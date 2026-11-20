#!/usr/bin/env node
/**
 * i18n coverage audit for the PureAir Life telemetry catalogue.
 *
 * The catalogue (src/services/telemetryService.js) ships a lot of descriptive
 * English data - haze descriptors, inversion physics, AQI categories and
 * vulnerable-group guidance. `src/i18n/phrases.js` carries the Hindi
 * translations for those strings.
 *
 * This script reports any catalogue string that has no Hindi translation, so
 * a newly added city or profile cannot silently ship untranslated.
 *
 * Usage:  node scripts/audit-i18n.mjs
 * Exit code 0 = fully translated, 1 = gaps found.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const telemetryPath = path.join(root, 'src', 'services', 'telemetryService.js');
const phrasesPath = path.join(root, 'src', 'i18n', 'phrases.js');

const telemetry = fs.readFileSync(telemetryPath, 'utf8');
const phrases = fs.readFileSync(phrasesPath, 'utf8');

/** Collect the English source strings of the given object-literal fields. */
function collectField(field) {
  const re = new RegExp(`${field}:\\s*'([^']*)'`, 'g');
  const out = new Set();
  for (const match of telemetry.matchAll(re)) {
    if (match[1].trim()) out.add(match[1]);
  }
  return [...out];
}

/**
 * Read the keys declared in the phrase table.
 *
 * Keys are either bare identifiers (`Good: 'अच्छा'`) or quoted strings
 * (`'Hazardous / Severe+': '...'`), so both forms are matched separately.
 */
function collectPhrases() {
  const out = new Set();
  const quoted = /^\s{2}'([^'\n]+)':\s*'/gm;
  const bare = /^\s{2}([A-Za-z_][A-Za-z0-9_]*):\s*'/gm;
  for (const match of phrases.matchAll(quoted)) out.add(match[1]);
  for (const match of phrases.matchAll(bare)) out.add(match[1]);
  return out;
}

const known = collectPhrases();
const fields = ['smogType', 'inversionStrength', 'status', 'safeWindow', 'peakSmogHours'];

const gaps = [];
for (const field of fields) {
  for (const value of collectField(field)) {
    // The safe-window strings are mostly a time range; only the ones carrying
    // prose need a phrase entry.
    const needsTranslation = /[A-Za-z]{4,}/.test(value) && !/^\d{2}:\d{2}/.test(value);
    if (!needsTranslation) continue;
    if (!known.has(value)) gaps.push({ field, value });
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
