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
 * Usage:  node scripts/_scan-strings.mjs
 *         npm run report:catalogue
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

/** US EPA PM2.5 breakpoint table for the 24-hour average. */
function aqiFromPm25(pm25) {
  const value = Number(pm25);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= 12.0) return Math.round((50 / 12.0) * value);
  if (value <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (value - 12.1) + 51);
  if (value <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (value - 35.5) + 101);
  if (value <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (value - 55.5) + 151);
  if (value <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (value - 150.5) + 201);
  if (value <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (value - 250.5) + 301);
  if (value <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (value - 350.5) + 401);
  return 500;
}

/** Pull every city record out of the catalogue source. */
function readCities() {
  const re = new RegExp(
    "id:\\s*'([^']*)',[\\s\\S]*?name:\\s*'([^']*)',[\\s\\S]*?aqi:\\s*(\\d+),[\\s\\S]*?pm25:\\s*(\\d+)",
    'g'
  );
  const cities = [];
  for (const m of telemetry.matchAll(re)) {
    cities.push({ id: m[1], name: m[2], aqi: Number(m[3]), pm25: Number(m[4]) });
  }
  return cities;
}

/** Distinct values of a catalogue field. */
function distinct(field) {
  const re = new RegExp(`${field}:\\s*'([^']*)'`, 'g');
  const out = new Set();
  for (const m of telemetry.matchAll(re)) if (m[1].trim()) out.add(m[1]);
  return [...out];
}

/** Keys declared in the Hindi phrase table. */
function phraseKeys() {
  const out = new Set();
  const quoted = /^\s{2}'([^'\n]+)':\s*'/gm;
  const bare = /^\s{2}([A-Za-z_][A-Za-z0-9_]*):\s*'/gm;
  for (const m of phrases.matchAll(quoted)) out.add(m[1]);
  for (const m of phrases.matchAll(bare)) out.add(m[1]);
  return out;
}

const cities = readCities();
const known = phraseKeys();

console.log(`Cities in catalogue: ${cities.length}`);
for (const field of ['smogType', 'inversionStrength', 'status']) {
  console.log(`Distinct ${field}: ${distinct(field).length}`);
}
console.log(`Hindi phrase table entries: ${known.size}`);

// ---- 1. AQI / PM2.5 consistency -----------------------------------------
const mismatched = cities.filter((c) => c.aqi !== aqiFromPm25(c.pm25));
console.log(
  mismatched.length === 0
    ? '\nAQI/PM2.5 consistency: OK for every city.'
    : `\nAQI/PM2.5 MISMATCH in ${mismatched.length} city/cities:`
);
for (const city of mismatched) {
  console.log(
    `  - ${city.name}: aqi=${city.aqi} but PM2.5 ${city.pm25} derives ${aqiFromPm25(city.pm25)}`
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
    : `\nUntranslated catalogue strings (${gaps.length}):`
);
for (const gap of gaps) console.log(`  - ${gap}`);

process.exit(mismatched.length === 0 && gaps.length === 0 ? 0 : 1);
