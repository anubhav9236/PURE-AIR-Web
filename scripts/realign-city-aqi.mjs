/**
 * One-off maintenance script: realign each reference-baseline city's stored
 * AQI with the EPA value derived from its PM2.5, and align the status label
 * with the resulting category.
 *
 * The AQI is an index *defined* by the EPA as a function of PM2.5, so it must
 * never be stored independently of the measured PM2.5 value.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/services/telemetryService.js';

function calculateAQIFromPM25(pm25) {
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

const STATUS_BY_CATEGORY = {
  Good: 'Good',
  Moderate: 'Moderate',
  'Unhealthy for Sensitive Groups': 'Unhealthy for Sensitive',
  Unhealthy: 'Unhealthy',
  'Very Unhealthy': 'Very Unhealthy',
  'Hazardous / Severe+': 'Hazardous'
};

function categoryFor(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous / Severe+';
}

const source = readFileSync(FILE, 'utf8');

const pattern =
  /aqi: (\d+),\n(\s*)pm25: (\d+),\n(\s*)pm10: (\d+),\n(\s*)no2: (\d+),\n(\s*)temp: (-?\d+),\n(\s*)humidity: (\d+),\n(\s*)inversionStrength: '([^']*)',\n(\s*)smogType: '([^']*)',\n(\s*)status: '([^']*)',/g;

let replaced = 0;
const changes = [];

const output = source.replace(
  pattern,
  (_match, aqiRaw, s1, pm25Raw, s2, pm10Raw, s3, no2Raw, s4, tempRaw, s5, humidityRaw, s6, inversion, s7, smogType, s8, status) => {
    replaced += 1;
    const derived = calculateAQIFromPM25(Number(pm25Raw));
    const nextStatus = STATUS_BY_CATEGORY[categoryFor(derived)];
    if (Number(aqiRaw) !== derived || status !== nextStatus) {
      changes.push({ aqi: aqiRaw, derived, status, nextStatus, pm25: pm25Raw });
    }
    return [
      `aqi: ${derived},`,
      `${s1}pm25: ${pm25Raw},`,
      `${s2}pm10: ${pm10Raw},`,
      `${s3}no2: ${no2Raw},`,
      `${s4}temp: ${tempRaw},`,
      `${s5}humidity: ${humidityRaw},`,
      `${s6}inversionStrength: '${inversion}',`,
      `${s7}smogType: '${smogType}',`,
      `${s8}status: '${nextStatus}',`
    ].join('\n');
  }
);

writeFileSync(FILE, output, 'utf8');

console.log(`city blocks rewritten: ${replaced}`);
console.log(`values changed: ${changes.length}`);
for (const change of changes) {
  console.log(
    `  aqi ${change.aqi} -> ${change.derived} | status "${change.status}" -> "${change.nextStatus}" | pm25 ${change.pm25}`
  );
}
