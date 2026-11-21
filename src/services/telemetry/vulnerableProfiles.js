/**
 * Vulnerability profiles for the groups most affected by winter smog.
 *
 * `name`, `lungVulnerability` and the guideline strings are the English
 * source strings that `src/i18n/phrases.js` translates.
 */

export const VULNERABLE_PROFILES = {
  toddler: {
    id: 'toddler',
    name: 'Toddlers & Infants',
    lungVulnerability: 'Critical (3x higher breathing rate per kg than adults)',
    criticalAqiThreshold: 100,
    guidelines: [
      'Keep indoor PM2.5 below 15 µg/m³ in nursery using DIY CR Box or HEPA',
      'Never take stroller near heavy traffic corridors (strollers sit at exhaust tailpipe height)',
      'Avoid morning outdoor walks before 11:30 AM during winter inversion'
    ]
  },
  elderly: {
    id: 'elderly',
    name: 'Elderly / Seniors',
    lungVulnerability: 'High (Elevated cardiovascular and stroke risk from micro-emboli)',
    criticalAqiThreshold: 120,
    guidelines: [
      'Monitor blood pressure during severe winter smog episodes',
      'Replace morning brisk walks with gentle indoor stretching / yoga',
      'Maintain indoor relative humidity at 40-50% to prevent mucosal irritation'
    ]
  },
  asthmatic: {
    id: 'asthmatic',
    name: 'Asthmatics & Respiratory',
    lungVulnerability: 'Severe (Immediate bronchospasm trigger from PM2.5 and NO2)',
    criticalAqiThreshold: 80,
    guidelines: [
      'Keep rescue inhalers accessible at all times',
      'Run activated carbon filter alongside MERV 13 to adsorb winter NO2 & VOCs',
      'Seal bedroom door gaps with damp towel or foam sweep during night inversion'
    ]
  },
  outdoorWorker: {
    id: 'outdoorWorker',
    name: 'Outdoor Workers & Commuters',
    lungVulnerability: 'High cumulative exposure (8+ hours daily in urban air)',
    criticalAqiThreshold: 150,
    guidelines: [
      'Wear tight-fitting N95 or FFP2 respirator with adjustable nose wire',
      'Rinse nasal passages with saline mist post-shift to clear coarse particles',
      'Switch from motorcycling / open auto-rickshaws to closed metro/buses during peaks'
    ]
  },
  pets: {
    id: 'pets',
    name: 'Pets (Dogs & Cats)',
    lungVulnerability: 'Moderate to High (Animals lack nasal filtering for ultrafine dust)',
    criticalAqiThreshold: 130,
    guidelines: [
      'Wipe paws and fur with damp cloth after walks to prevent grooming ingestion of soot',
      'Limit high-intensity fetch/running games on lawns during high AQI hours',
      'Shorten bathroom walks to 5-10 minutes during morning inversion peak'
    ]
  }
};
