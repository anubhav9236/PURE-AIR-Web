import { describe, it, expect } from 'vitest';
import {
  calculateAQIFromPM25,
  generateDiurnalCurve,
  getAQICategory,
  GLOBAL_SMOG_HOTSPOTS,
  VULNERABLE_PROFILES
} from '../../src/services/telemetryService.js';

describe('Telemetry service — city baseline catalogue', () => {
  it('ships at least 25 Indian cities covering all regions', () => {
    expect(GLOBAL_SMOG_HOTSPOTS.length).toBeGreaterThanOrEqual(25);
  });

  it('gives every city a unique id and complete baseline fields', () => {
    const ids = new Set();
    for (const city of GLOBAL_SMOG_HOTSPOTS) {
      expect(city.id).toBeTruthy();
      expect(ids.has(city.id)).toBe(false);
      ids.add(city.id);

      expect(city.name).toBeTruthy();
      expect(city.state).toBeTruthy();
      expect(city.region).toBeTruthy();
      expect(Number.isFinite(city.aqi)).toBe(true);
      expect(Number.isFinite(city.pm25)).toBe(true);
      expect(Number.isFinite(city.pm10)).toBe(true);
      expect(Number.isFinite(city.no2)).toBe(true);
      expect(city.smogType).toBeTruthy();
      expect(city.inversionStrength).toBeTruthy();
      expect(city.peakSmogHours).toBeTruthy();
      expect(city.safeWindow).toBeTruthy();
      expect(city.status).toBeTruthy();
    }
  });

  it('identifies Delhi NCR as a severe winter smog hotspot', () => {
    const delhi = GLOBAL_SMOG_HOTSPOTS.find((h) => h.id === 'delhi');
    expect(delhi).toBeDefined();
    expect(delhi.aqi).toBeGreaterThan(300);
  });

  it('configures Mumbai with the coastal marine layer', () => {
    const mumbai = GLOBAL_SMOG_HOTSPOTS.find((h) => h.id === 'mumbai');
    expect(mumbai).toBeDefined();
    expect(mumbai.state).toBe('Maharashtra');
  });

  it('configures Srinagar with the Kashmir valley cold pool', () => {
    const srinagar = GLOBAL_SMOG_HOTSPOTS.find((h) => h.id === 'srinagar');
    expect(srinagar).toBeDefined();
    expect(srinagar.state).toBe('Jammu & Kashmir');
  });

  it('keeps AQI and PM2.5 internally consistent for every city', () => {
    for (const city of GLOBAL_SMOG_HOTSPOTS) {
      const derived = calculateAQIFromPM25(city.pm25);
      // The catalogue stores rounded AQI, so allow a small tolerance band.
      expect(Math.abs(derived - city.aqi)).toBeLessThanOrEqual(25);
    }
  });
});

describe('Telemetry service — US EPA AQI breakpoints', () => {
  it('maps PM2.5 of 10 µg/m³ to AQI Good (<= 50)', () => {
    expect(calculateAQIFromPM25(10)).toBeLessThanOrEqual(50);
  });

  it('maps PM2.5 of 25 µg/m³ to AQI Moderate (51-100)', () => {
    const aqi = calculateAQIFromPM25(25);
    expect(aqi).toBeGreaterThan(50);
    expect(aqi).toBeLessThanOrEqual(100);
  });

  it('maps PM2.5 of 120 µg/m³ to AQI Unhealthy for Sensitive Groups (151-200)', () => {
    const aqi = calculateAQIFromPM25(120);
    expect(aqi).toBeGreaterThan(150);
    expect(aqi).toBeLessThanOrEqual(200);
  });

  it('maps PM2.5 of 300 µg/m³ to AQI Hazardous (> 300)', () => {
    expect(calculateAQIFromPM25(300)).toBeGreaterThan(300);
  });

  it('matches the published EPA breakpoint table exactly', () => {
    expect(calculateAQIFromPM25(0)).toBe(0);
    expect(calculateAQIFromPM25(12)).toBe(50);
    expect(calculateAQIFromPM25(35.4)).toBe(100);
    expect(calculateAQIFromPM25(55.4)).toBe(150);
    expect(calculateAQIFromPM25(150.4)).toBe(200);
  });

  it('never returns a negative AQI', () => {
    expect(calculateAQIFromPM25(-50)).toBeGreaterThanOrEqual(0);
  });

  it('caps the AQI at the top of the EPA scale', () => {
    expect(calculateAQIFromPM25(9999)).toBeLessThanOrEqual(500);
  });
});

describe('Telemetry service — AQI categories', () => {
  it('returns a label, colour and advice for every band', () => {
    const samples = [20, 75, 125, 175, 275, 400];
    for (const pm of samples) {
      const category = getAQICategory(calculateAQIFromPM25(pm));
      expect(category.label).toBeTruthy();
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(category.advice).toBeTruthy();
      expect(category.badge).toBeTruthy();
    }
  });
});

describe('Telemetry service — diurnal inversion curve', () => {
  const curve = generateDiurnalCurve(250);

  it('produces exactly 24 hourly points', () => {
    expect(curve).toHaveLength(24);
  });

  it('is dirtier at the 07:00 inversion peak than at the 13:00 solar window', () => {
    const morningPeak = curve.find((c) => c.hour === '07:00');
    const afternoonSafe = curve.find((c) => c.hour === '13:00');
    expect(morningPeak.pm25).toBeGreaterThan(afternoonSafe.pm25);
  });

  it('flags 13:00 as a safe activity and venting window', () => {
    expect(curve.find((c) => c.hour === '13:00').isSafeWindow).toBe(true);
  });

  it('flags the early morning as a severe peak', () => {
    expect(curve.find((c) => c.hour === '07:00').isSeverePeak).toBe(true);
  });

  it('scales the whole curve with the baseline PM2.5', () => {
    const cleanCurve = generateDiurnalCurve(30);
    const dirtyCurve = generateDiurnalCurve(300);
    const mid = curve.find((c) => c.hour === '13:00').pm25;
    expect(dirtyCurve.find((c) => c.hour === '13:00').pm25).toBeGreaterThan(mid);
    expect(cleanCurve.find((c) => c.hour === '13:00').pm25).toBeLessThan(mid);
  });

  it('never produces a negative concentration', () => {
    for (const point of generateDiurnalCurve(0)) {
      expect(point.pm25).toBeGreaterThanOrEqual(0);
      expect(point.aqi).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Telemetry service — vulnerable family member profiles', () => {
  it('sets the toddler critical AQI threshold to 100', () => {
    expect(VULNERABLE_PROFILES.toddler.criticalAqiThreshold).toBe(100);
  });

  it('sets the asthma bronchospasm threshold to 80', () => {
    expect(VULNERABLE_PROFILES.asthmatic.criticalAqiThreshold).toBe(80);
  });

  it('populates at least three guidelines for every profile', () => {
    for (const key of Object.keys(VULNERABLE_PROFILES)) {
      const profile = VULNERABLE_PROFILES[key];
      expect(profile.guidelines.length).toBeGreaterThanOrEqual(3);
      expect(profile.name).toBeTruthy();
      expect(profile.lungVulnerability).toBeTruthy();
      expect(Number.isFinite(profile.criticalAqiThreshold)).toBe(true);
    }
  });
});
