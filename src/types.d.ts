/**
 * Shared type definitions for PureAir Life.
 *
 * The app is written in JavaScript with JSDoc annotations, and the whole source
 * tree is checked by `tsc --noEmit` (see `npm run typecheck`). Keeping the
 * domain shapes in one place means a change to, say, the city catalogue is
 * caught everywhere it is used instead of drifting.
 *
 * Import them from JavaScript with:
 *
 *   @param {import('../types').CityRecord} props.hotspot
 */

/** The interface languages the app ships. */
export type Language = 'en' | 'hi';

/**
 * One city in the shipped reference catalogue.
 *
 * These are *modelled* winter-episode reference values, not a live
 * monitoring feed.
 */
export interface CityRecord {
  /** stable slug used by the city picker */
  id: string;
  /** display name */
  name: string;
  /** state or union territory */
  state: string;
  /** broad geographic band */
  region: string;
  /** latitude in decimal degrees */
  lat: number;
  /** longitude in decimal degrees */
  lon: number;
  /** AQI derived from {@link CityRecord.pm25} */
  aqi: number;
  /** fine particulate concentration in µg/m³ */
  pm25: number;
  /** coarse particulate concentration in µg/m³ */
  pm10: number;
  /** nitrogen dioxide in ppb */
  no2: number;
  /** air temperature in °C */
  temp: number;
  /** relative humidity in percent */
  humidity: number;
  /** description of the inversion physics */
  inversionStrength: string;
  /** description of the smog chemistry */
  smogType: string;
  /** AQI category label */
  status: string;
  /** hex colour used for the status marker */
  color: string;
  /** hours of peak inversion danger */
  peakSmogHours: string;
  /** the safest outdoor window */
  safeWindow: string;
}

/** A point on the modelled 24-hour pollution curve. */
export interface DiurnalPoint {
  /** hour label, e.g. `07:00` */
  hour: string;
  /** the hour of day */
  hourNum: number;
  /** modelled PM2.5 concentration in µg/m³ */
  pm25: number;
  /** modelled AQI at that hour */
  aqi: number;
  /** the AQI band label */
  category: string;
  /** hex colour for the band */
  color: string;
  /** whether the hour is in the safe window */
  isSafeWindow: boolean;
  /** whether the hour is an inversion peak */
  isSeverePeak: boolean;
  /** what to do in that hour */
  action: string;
}

/** The AQI band the current city sits in. */
export interface AqiBand {
  /** band label, e.g. `Hazardous` */
  label: string;
  /** hex colour for the band */
  color: string;
  /** Tailwind classes for the band chip */
  badge: string;
  /** short guidance shown in the hazard board */
  advice: string;
}

/** One step of a generated smog-armour routine. */
export interface RoutineBlock {
  /** the window this step covers */
  time: string;
  /** the inversion phase it falls in */
  phase: string;
  /** qualitative risk label */
  hazardLevel: string;
  /** what the household should do */
  action: string;
  /** an indoor air-quality fix for the step */
  iaqHack: string;
  /** the low-emission alternative */
  sustainableSwap: string;
  /** the quantified effect of the step */
  directImpact: string;
}

/** A generated smog-armour routine. */
export interface Routine {
  /** headline for the routine */
  summaryTitle: string;
  /** what makes today dangerous */
  threatAnalysis: string;
  /** the ordered steps */
  timeBlocks: RoutineBlock[];
  /** the quantified family impact */
  directImpactStatement: string;
  /** required action during a hazard */
  emergencyActionAlert: string;
  /** where the routine came from */
  source: 'live' | 'fallback';
}

/** One ranked fix inside a {@link VisionAudit}. */
export interface VisionFix {
  /** the order of the fix */
  step: number;
  /** short name of the fix */
  title: string;
  /** how to carry it out */
  diyFix: string;
  /** estimated cost in US dollars */
  estimatedCostUsd: number;
  /** expected PM reduction in percent */
  pmReductionPercent: number;
}

/** A room vision audit report. */
export interface VisionAudit {
  /** what the model saw in the photo */
  roomDetected: string;
  /** 0-100 leakage risk */
  leakageRiskScore: number;
  /** the flaws found */
  primaryVulnerabilities: string[];
  /** the ranked fixes */
  stepByStepFixes: VisionFix[];
  /** where to put a purifier */
  airPurifierPlacementAdvice: string;
  /** the expected indoor effect */
  cleanAirDeliveryImpact: string;
  /** where the report came from */
  source: 'live' | 'fallback';
}

/** A message in the Clean Air AI conversation. */
export interface ChatMessage {
  /** stable identifier */
  id: number | string;
  /** who produced the message */
  sender: 'user' | 'bot';
  /** the message body */
  text: string;
  /** `live` or `fallback` for assistant replies */
  source?: 'live' | 'fallback';
  /** the model that answered, when known */
  model?: string;
  /** human-readable time */
  timestamp: string;
}

/** The result of probing the AI provider. */
export interface ProviderStatus {
  /** whether a provider is reachable */
  configured: boolean;
  /** how a call would be made */
  transport: 'proxy' | 'direct' | 'none';
  /** the models the provider offers */
  models: string[];
}

/** The household profile that drives routine generation. */
export interface FamilyProfile {
  /** number of adults in the household */
  adults: number;
  /** number of children */
  children: number;
  /** number of elderly members */
  elderly: number;
  /** primary commute mode */
  commute: string;
  /** home heating source */
  heating: string;
  /** primary cooking style */
  cooking: string;
  /** the vulnerable groups present */
  vulnerabilities: string[];
}

/**
 * The four kinds of information the interface can show.
 *
 * - `reference` - a shipped, modelled baseline for the city.
 * - `estimated` - computed by a documented physical or statistical model.
 * - `advisory` - general guidance not tied to a measurement.
 * - `live` - a genuine model response from the provider.
 */
export type ProvenanceKind = 'reference' | 'estimated' | 'advisory' | 'live';
