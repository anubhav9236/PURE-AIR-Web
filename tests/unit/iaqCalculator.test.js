import { describe, it, expect } from 'vitest';
import {
  calculateCRBoxCADR,
  calculateBerkeleyEarthCigarettes,
  calculateSustainableSavings,
  estimateIndoorPM25,
  INFILTRATION_ACH,
  BERKELEY_EARTH_PM25_PER_CIGARETTE,
  WHO_24HR_PM25_LIMIT
} from '../../src/services/iaqCalculatorService.js';

describe('CR box simulator — airflow engineering', () => {
  const cr4Filter = calculateCRBoxCADR({
    fanSpeed: 'medium',
    filterCount: 4,
    filterRating: 'merv13',
    hasCardboardShroud: true,
    roomLengthFt: 15,
    roomWidthFt: 15,
    roomHeightFt: 9
  });

  it('generates a university-validated CADR in the published range', () => {
    expect(cr4Filter.cadrCFM).toBeGreaterThanOrEqual(400);
    expect(cr4Filter.cadrCFM).toBeLessThanOrEqual(850);
  });

  it('delivers the CDC-recommended air changes per hour', () => {
    expect(cr4Filter.ach).toBeGreaterThanOrEqual(5);
  });

  it('clears 90% of room particulates in under 25 minutes', () => {
    expect(cr4Filter.minutesToClear90).toBeLessThan(25);
  });

  it('saves more than $300 against a commercial HEPA unit', () => {
    expect(cr4Filter.savings).toBeGreaterThan(300);
  });

  it('reports a room volume consistent with the supplied dimensions', () => {
    expect(cr4Filter.roomVolumeCuFt).toBe(15 * 15 * 9);
  });

  it('keeps the clearance time physically consistent with CADR and volume', () => {
    // t(min) = (V / CADR) * ln(10)
    const expected = (cr4Filter.roomVolumeCuFt / cr4Filter.cadrCFM) * Math.log(10);
    expect(cr4Filter.minutesToClear90).toBeCloseTo(expected, 0);
  });

  it('scales air changes per hour with a faster fan', () => {
    const low = calculateCRBoxCADR({ fanSpeed: 'low' });
    const high = calculateCRBoxCADR({ fanSpeed: 'high' });
    expect(high.ach).toBeGreaterThan(low.ach);
  });

  it('increases CADR when the cardboard shroud is installed', () => {
    const withShroud = calculateCRBoxCADR({ hasCardboardShroud: true });
    const withoutShroud = calculateCRBoxCADR({ hasCardboardShroud: false });
    expect(withShroud.cadrCFM).toBeGreaterThan(withoutShroud.cadrCFM);
  });

  it('reduces CADR when a lower MERV rating is used', () => {
    const merv11 = calculateCRBoxCADR({ filterRating: 'merv11' });
    const merv14 = calculateCRBoxCADR({ filterRating: 'merv14' });
    expect(merv11.cadrCFM).toBeLessThan(merv14.cadrCFM);
  });

  it('never reports a negative clearance time or cost', () => {
    const stats = calculateCRBoxCADR({});
    expect(stats.minutesToClear90).toBeGreaterThan(0);
    expect(stats.minutesToClear99).toBeGreaterThan(stats.minutesToClear90);
    expect(stats.diyCost).toBeGreaterThan(0);
    expect(stats.annualEnergyCostUsd).toBeGreaterThan(0);
  });
});

describe('Berkeley Earth cigarette-equivalent model', () => {
  const berkeley = calculateBerkeleyEarthCigarettes({
    outdoorPM25: 280,
    indoorPM25WithPureAir: 15,
    outdoorHoursSpent: 1.5,
    indoorHoursSpent: 22.5,
    respiratoryMultiplier: 1.0
  });

  it('avoids a significant daily cigarette-equivalent load', () => {
    expect(berkeley.avoidedCigarettesPerDay).toBeGreaterThan(5);
  });

  it('prevents substantial alveolar particulate mass', () => {
    expect(berkeley.microgramsAvoided).toBeGreaterThan(1000);
  });

  it('exposes avoidedCigarettesPerMonth (the field ImpactLedger renders)', () => {
    // Regression guard: the ledger used to read a renamed-away field and
    // rendered "undefined cigarettes avoided per month".
    expect(berkeley.avoidedCigarettesPerMonth).toBeTypeOf('number');
    expect(berkeley.avoidedCigarettesPerMonth).toBe(
      Math.round(berkeley.avoidedCigarettesPerDay * 30)
    );
  });

  it('does not silently cap outdoor hours at one hour', () => {
    // Regression guard: outdoorHoursSpent used to be clamped to 1, which
    // inflated the indoor-hours denominator and overstated the benefit.
    // With 8 outdoor hours the unmanaged (unfiltered) daily mean must rise,
    // because the household is exposed to outdoor air for longer.
    const oneHour = calculateBerkeleyEarthCigarettes({
      outdoorPM25: 280,
      outdoorHoursSpent: 1,
      indoorHoursSpent: 23
    });
    const eightHours = calculateBerkeleyEarthCigarettes({
      outdoorPM25: 280,
      outdoorHoursSpent: 8,
      indoorHoursSpent: 16
    });

    expect(eightHours.unmanagedDailyMean).toBeGreaterThan(oneHour.unmanagedDailyMean);

    // The managed mean must use the real 16 indoor hours, not 23.
    const expectedManaged = (280 * 8 + 15 * 16) / 24;
    expect(eightHours.managedDailyMean).toBeCloseTo(expectedManaged, 0);

    // More time outdoors means less time indoors for filtration to help.
    expect(eightHours.avoidedCigarettesPerDay).toBeLessThan(
      oneHour.avoidedCigarettesPerDay
    );
  });

  it('scales the avoided load with the respiratory vulnerability multiplier', () => {
    const vulnerable = calculateBerkeleyEarthCigarettes({
      outdoorPM25: 280,
      respiratoryMultiplier: 2.0
    });
    const baseline = calculateBerkeleyEarthCigarettes({
      outdoorPM25: 280,
      respiratoryMultiplier: 1.0
    });
    expect(vulnerable.avoidedCigarettesPerDay).toBeGreaterThan(
      baseline.avoidedCigarettesPerDay
    );
  });

  it('uses the published Berkeley Earth constant', () => {
    expect(BERKELEY_EARTH_PM25_PER_CIGARETTE).toBe(22);
  });

  it('handles a clean outdoor environment without negative results', () => {
    const clean = calculateBerkeleyEarthCigarettes({ outdoorPM25: 0 });
    expect(clean.avoidedCigarettesPerDay).toBeGreaterThanOrEqual(0);
    expect(clean.microgramsAvoided).toBeGreaterThanOrEqual(0);
  });
});

describe('Sustainable savings model', () => {
  const sustainable = calculateSustainableSavings({
    commuteShift: 'metro',
    commuteKm: 15,
    heatingShift: 'heatpump'
  });

  it('saves more than 3 kg CO2 daily with metro and heat pump', () => {
    expect(sustainable.dailyCo2SavedKg).toBeGreaterThan(3);
  });

  it('saves significant community black-carbon soot', () => {
    expect(sustainable.dailyPm25SavedGrams).toBeGreaterThan(10);
  });

  it('beats a single-occupant petrol car for every clean mode', () => {
    const petrol = calculateSustainableSavings({
      commuteShift: 'car',
      commuteKm: 15,
      heatingShift: 'wood_coal'
    });
    for (const mode of ['metro', 'ev', 'carpool', 'wfh']) {
      const clean = calculateSustainableSavings({
        commuteShift: mode,
        commuteKm: 15,
        heatingShift: 'heatpump'
      });
      expect(clean.dailyCo2SavedKg).toBeGreaterThan(petrol.dailyCo2SavedKg);
    }
  });

  it('keeps the community score inside 0-100', () => {
    for (const mode of ['metro', 'ev', 'carpool', 'wfh', 'car']) {
      const stats = calculateSustainableSavings({ commuteShift: mode });
      expect(stats.communitySmogScore).toBeGreaterThanOrEqual(0);
      expect(stats.communitySmogScore).toBeLessThanOrEqual(100);
    }
  });
});

describe('Indoor concentration model (single-zone mass balance)', () => {
  it('reduces indoor PM2.5 as filtration increases', () => {
    const none = estimateIndoorPM25({ outdoorPM25: 300, filterACH: 0 });
    const some = estimateIndoorPM25({ outdoorPM25: 300, filterACH: 5 });
    const lots = estimateIndoorPM25({ outdoorPM25: 300, filterACH: 25 });
    expect(some.filteredIndoorPM25).toBeLessThan(none.filteredIndoorPM25);
    expect(lots.filteredIndoorPM25).toBeLessThan(some.filteredIndoorPM25);
  });

  it('reduces indoor PM2.5 as the room is sealed better', () => {
    const sealed = estimateIndoorPM25({
      outdoorPM25: 300,
      filterACH: 6,
      infiltrationACH: INFILTRATION_ACH.sealed
    });
    const drafty = estimateIndoorPM25({
      outdoorPM25: 300,
      filterACH: 6,
      infiltrationACH: INFILTRATION_ACH.drafty
    });
    expect(sealed.filteredIndoorPM25).toBeLessThan(drafty.filteredIndoorPM25);
  });

  it('matches the closed-form solution C_in = (lambda * C_out) / (lambda + k)', () => {
    const result = estimateIndoorPM25({
      outdoorPM25: 240,
      filterACH: 8,
      infiltrationACH: 1.5
    });
    const expected = (1.5 * 240) / (1.5 + 8);
    expect(result.filteredIndoorPM25).toBeCloseTo(expected, 1);
  });

  it('flags whether the WHO 24-hour guideline is met', () => {
    const good = estimateIndoorPM25({
      outdoorPM25: 40,
      filterACH: 20,
      infiltrationACH: INFILTRATION_ACH.sealed
    });
    expect(good.meetsWHO).toBe(true);
    expect(good.filteredIndoorPM25).toBeLessThanOrEqual(WHO_24HR_PM25_LIMIT);

    const bad = estimateIndoorPM25({
      outdoorPM25: 400,
      filterACH: 1,
      infiltrationACH: INFILTRATION_ACH.unsealed
    });
    expect(bad.meetsWHO).toBe(false);
  });

  it('never returns a negative concentration', () => {
    const result = estimateIndoorPM25({ outdoorPM25: 0, filterACH: 0 });
    expect(result.filteredIndoorPM25).toBeGreaterThanOrEqual(0);
    expect(result.reductionPercent).toBeGreaterThanOrEqual(0);
  });
});
