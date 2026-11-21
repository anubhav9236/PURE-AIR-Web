/**
 * Smog Shield dashboard: hazard board, diurnal curve and vulnerability profiles.
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const dashStrings = {
  'dash.title': { en: 'Smog Shield Dashboard', hi: 'स्मॉग शील्ड डैशबोर्ड' },
  'dash.subtitle': {
    en: 'Your city baseline, today\'s smog traps and what to do about them.',
    hi: 'आपके शहर का आधार, आज के धुएँ के जाल और उससे बचने के उपाय।'
  },
  'dash.referenceBaseline': { en: 'Reference baseline', hi: 'संदर्भ आधार' },
  'dash.notLive': {
    en: 'Modelled winter-episode baseline - not a live monitoring feed',
    hi: 'नमूना विन शत्रु-एपिसोड आधार - लाइव मॉनिटरिंग फ़ीड नहीं'
  },
  'dash.estimated': { en: 'Estimated', hi: 'अनुमानित' },
  'dash.advisory': { en: 'Advisory', hi: 'सलाह' },
  'dash.liveData': { en: 'Live data', hi: 'लाइव डेटा' },
  'dash.hazardBoard': { en: 'Hazard board', hi: 'खतरा बोर्ड' },
  'dash.vulnerableGroups': { en: 'Most at risk', hi: 'सबसे अधिक जोखिम में' },
  'dash.diurnal': { en: 'Hourly pollution curve', hi: 'घंटेवार प्रदूषण वक्र' },
  'dash.diurnalRegion': {
    en: 'Hourly pollution curve, scroll sideways to see every hour',
    hi: 'घंटेवार प्रदूषण वक्र, हर घंटा देखने के लिए बग़तार स्क्रॉल करें'
  },
  'dash.shieldPlan': { en: 'Shield plan', hi: 'सुरक्षा योजना' },
  'dash.inversion': { en: 'Atmospheric inversion', hi: 'वायुमंडलीय उलटना' },
  'dash.status': { en: 'Status:', hi: 'स्थिति:' },
  'dash.pm25': { en: 'PM2.5 (Fine)', hi: 'PM2.5 (बारीक)' },
  'dash.whoLimit': { en: 'WHO limit', hi: 'WHO सीमा' },
  'dash.pm10': { en: 'PM10 (Coarse)', hi: 'PM10 (मोटा)' },
  'dash.dustTrap': { en: 'Dust & smoke trap', hi: 'धूल और धुआँ का जाल' },
  'dash.no2': { en: 'NO2 (Tailpipe)', hi: 'NO2 (निकास गैस)' },
  'dash.combustionGas': { en: 'Combustion gas', hi: 'दहन गैस' },
  'dash.tempHum': { en: 'Temp / Humidity', hi: 'तापमान / नमी' },
  'dash.coldInversion': { en: 'Cold inversion', hi: 'ठंडी उलटना' },
  'dash.safeWindow': { en: 'Safe diurnal window', hi: 'सुरक्षित दिनचर्या अवधि' },
  'dash.windowOpen': { en: 'Window OPEN NOW', hi: 'अवधि अभी खुली है' },
  'dash.windowNext': { en: 'Next window midday', hi: 'अगली अवधि दोपहर' },
  'dash.safeWindowExplainer': {
    en: 'Solar warming expands the atmospheric boundary layer and temporarily reduces ground-level PM2.5 by roughly 55%.',
    hi: 'सूर्य की गर्मी वायुमंडल की सीमा परत फैलाती है और ज़मीन के स्तर का PM2.5 लगभग 55% तक घटाती है।'
  },
  'dash.safeWindowCta': {
    en: 'Best for cross-ventilation and outdoor errands.',
    hi: 'ताज़ी हवा और बाहर के कामों के लिए सर्वोत्तम।'
  },
  'dash.peakHours': { en: 'Peak inversion danger hours', hi: 'उलटना के सबसे खतरनाक घंटे' },
  'dash.peakHoursAdvice': {
    en: 'Strict window seal and N95 mask requirement.',
    hi: 'खिड़की सील रखें और N95 मास्क ज़रूरी।'
  },
  'dash.generateRoutine': { en: 'Generate AI Smog Routine', hi: 'एआई स्मॉग दिनचर्या बनाएँ' },
  'dash.diyHacks': { en: 'DIY IAQ Hacks', hi: 'डीआईवाई IAQ हैक' },
  'dash.diurnalExplainer': {
    en: 'Why winter air is worst at dawn and night (thermal inversion cap) versus afternoon sunlight dispersion.',
    hi: 'सर्दी में हवा सुबह-रात सबसे खराब क्यों होती है (थर्मल इनवर्जन कैप) और दोपहर में सूर्य कैसे बिखेरता है।'
  },
  'dash.legendPeak': { en: 'Inversion trap (peak)', hi: 'उलटना का जाल (चरम)' },
  'dash.legendSafe': { en: 'Safe window (12-3 PM)', hi: 'सुरक्षित अवधि (दोपहर 12-3)' },
  'dash.phaseNight': { en: 'Night stagnation', hi: 'रात का जमाव' },
  'dash.phaseNightNote': { en: 'Cold pool accumulates', hi: 'ठंडी हवा जमा होती है' },
  'dash.phaseMorning': { en: 'Morning inversion peak', hi: 'सुबह की उलटना चरम पर' },
  'dash.phaseMorningNote': { en: 'Cold boundary lid + traffic', hi: 'ठंडी सील + यातायात' },
  'dash.phaseSafe': { en: 'Optimal safe window', hi: 'सर्वोत्तम सुरक्षित अवधि' },
  'dash.phaseSafeNote': { en: 'Solar thermal mixing', hi: 'सौर ताप मिश्रण' },
  'dash.phaseEvening': { en: 'Evening smog rebound', hi: 'शाम की धुएँ की वापसी' },
  'dash.phaseEveningNote': { en: 'Heating & commute trap', hi: 'हीटिंग और यात्रा का जाल' },
  'dash.chartSummary': {
    en: 'Modelled 24-hour PM2.5 curve. Peak concentrations occur between 06:00 and 09:30 and again after 18:00; the lowest modelled values fall in the 12:00 to 15:30 safe window.',
    hi: 'नमूना 24-घंटे का PM2.5 वक्र। सर्वाधिक मान 06:00 से 09:30 के बीच और 18:00 के बाद रहते हैं; न्यूनतम मान 12:00 से 15:30 की सुरक्षित अवधि में आते हैं।'
  },
  'dash.vulnerableTitle': {
    en: 'Vulnerable family member protection matrix',
    hi: 'संवेदनशील परिवार सदस्य सुरक्षा मैट्रिक्स'
  },
  'dash.vulnerableExplainer': {
    en: 'Specific physiological thresholds and defensive instructions for at-risk loved ones.',
    hi: 'जोखिम में मौजूद प्रियजनों के लिए विशिष्ट शारीरिक सीमाएँ और बचाव के निर्देश।'
  },
  'dash.vulnerableTabs': { en: 'Vulnerable group', hi: 'संवेदनशील समूह' },
  'dash.criticalThreshold': { en: 'Critical AQI threshold:', hi: 'गंभीर AQI सीमा:' },
  'dash.currentCityAqi': { en: 'Current city AQI of', hi: 'वर्तमान शहर का AQI' },
  'dash.dangerouslyAbove': { en: 'DANGEROUSLY ABOVE', hi: 'क़तर से ऊपर' },
  'dash.withinLimit': { en: 'within', hi: 'सीमा के भीतर' },
  'dash.toleranceLimit': { en: 'their tolerance limit.', hi: 'उनकी सहनशीलता की सीमा।' },
  'dash.directives': { en: 'Immediate defensive directives', hi: 'तुरंत बचाव के निर्देश' },

  // ---- Planner ----------------------------------------------------------
};
