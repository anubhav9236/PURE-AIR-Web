/**
 * Telemetry service for PureAir Life.
 *
 * Stable public facade over the focused telemetry modules. Import from here
 * so the internal layout can change without touching call sites.
 */

export { ALL_INDIAN_CITIES, GLOBAL_SMOG_HOTSPOTS } from './telemetry/cityCatalogue.js';
export { calculateAQIFromPM25, generateDiurnalCurve, getAQICategory } from './telemetry/aqi.js';
export { VULNERABLE_PROFILES } from './telemetry/vulnerableProfiles.js';
