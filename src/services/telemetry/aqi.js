/**
 * AQI derivation and the diurnal inversion curve.
 *
 * The AQI is always *derived* from the PM2.5 concentration using the
 * published US EPA breakpoint table; it is never stored independently.
 */

import { translatePhrase } from '../../i18n/phrases.js';

export function generateDiurnalCurve(basePM25, lang = 'en') {
  const curve = [];
  const hourFactors = [
    1.15, 1.20, 1.25, 1.30, 1.38, 1.55, 
    1.78, 1.85, 1.70, 1.40, 1.05, 0.75, 
    0.62, 0.58, 0.65, 0.85, 1.15, 1.45, 
    1.65, 1.60, 1.48, 1.35, 1.25, 1.18
  ];

  for (let h = 0; h < 24; h++) {
    const pm25Val = Math.round(basePM25 * hourFactors[h]);
    let aqiVal = calculateAQIFromPM25(pm25Val);
    let category = getAQICategory(aqiVal);
    let isSafeWindow = h >= 12 && h <= 15;
    let isSeverePeak = (h >= 6 && h <= 9) || (h >= 18 && h <= 20);

    curve.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      hourNum: h,
      pm25: pm25Val,
      aqi: aqiVal,
      category: category.label,
      color: category.color,
      isSafeWindow,
      isSeverePeak,
      action: isSafeWindow 
        ? translatePhrase('Ventilate home briefly & run essential errands', lang) 
        : isSeverePeak 
          ? translatePhrase('Thermal inversion peak! Seal doors & wear N95', lang) 
          : translatePhrase('Moderate exposure - run air purifiers indoors', lang)
    });
  }
  return curve;
}

/**
 * Convert a PM2.5 concentration (µg/m³) to its US EPA AQI value.
 *
 * Implements the published EPA PM2.5 breakpoint table for the 24-hour
 * average. The AQI is *defined* as a function of PM2.5, so it is always
 * derived rather than stored independently.
 *
 * @param {number} pm25 - PM2.5 concentration in µg/m³
 * @returns {number} AQI on the 0-500 EPA scale
 */
export function calculateAQIFromPM25(pm25) {
  const value = Number(pm25);
  // Negative or non-numeric concentrations are physically meaningless.
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= 12.0) return Math.round((50 / 12.0) * value);
  if (value <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (value - 12.1) + 51);
  if (value <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (value - 35.5) + 101);
  if (value <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (value - 55.5) + 151);
  if (value <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (value - 150.5) + 201);
  if (value <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (value - 250.5) + 301);
  if (value <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (value - 350.5) + 401);
  // Above the published table the AQI is capped at the top of the EPA scale.
  return 500;
}

export function getAQICategory(aqi, lang = 'en') {
  const t = (text) => translatePhrase(text, lang);
  if (aqi <= 50) return { label: t('Good'), color: '#10b981', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', advice: t('Air quality is satisfactory. Ideal for outdoor family recreation.') };
  if (aqi <= 100) return { label: t('Moderate'), color: '#f59e0b', badge: 'bg-amber-50 text-amber-800 border-amber-200', advice: t('Acceptable; unusually sensitive people should consider reducing prolonged outdoor exertion.') };
  if (aqi <= 150) return { label: t('Unhealthy for Sensitive Groups'), color: '#f97316', badge: 'bg-orange-50 text-orange-800 border-orange-200', advice: t('Children, asthmatics, and elderly should limit prolonged heavy outdoor exertion.') };
  if (aqi <= 200) return { label: t('Unhealthy'), color: '#ef4444', badge: 'bg-red-50 text-red-800 border-red-200', advice: t('Everyone may begin to experience health effects. Keep windows sealed, turn on HEPA/CR filters.') };
  if (aqi <= 300) return { label: t('Very Unhealthy'), color: '#8b5cf6', badge: 'bg-purple-50 text-purple-800 border-purple-200', advice: t('Health alert: risk of health effects increased for everyone. N95 masks mandatory outdoors.') };
  return { label: t('Hazardous / Severe+'), color: '#7f1d1d', badge: 'bg-rose-50 text-rose-900 border-rose-200', advice: t('Emergency conditions! The entire population is likely affected. Avoid all non-essential outdoor exposure.') };
}
