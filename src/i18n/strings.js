/**
 * UI string table for PureAir Life.
 *
 * English is the source language; every key has a Hindi (`hi`) translation.
 * `translate()` falls back to the English string when a key is missing, so a
 * partially translated screen degrades gracefully instead of showing blanks.
 */

/**
 * @typedef {'en' | 'hi'} Language
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const STRINGS = {
  // ---- App shell --------------------------------------------------------
  'app.skipToContent': {
    en: 'Skip to main content',
    hi: 'मुख्य सामग्री पर जाएँ'
  },
  'app.loading': { en: 'Loading workspace…', hi: 'वर्कस्पेस लोड हो रहा है…' },
  'app.mainContent': {
    en: 'PureAir Life application content',
    hi: 'प्योरएयर लाइफ एप्लिकेशन सामग्री'
  },
  'app.footerLabel': {
    en: 'Scientific disclosures and credits',
    hi: 'वैज्ञानिक खुलासे और श्रेय'
  },
  'app.brand': { en: 'PureAir Life', hi: 'प्योरएयर लाइफ' },
  'app.tagline': {
    en: 'Pan-India Smog & Community Clean Air Navigator',
    hi: 'पूरे भारत के लिए धुएँ और साफ़ हवा नेविगेटर'
  },
  'app.allIndiaCities': { en: 'All-India Cities', hi: 'भारत के सभी शहर' },
  'app.footerNote': {
    en: 'PureAir Life combines public-health guidance with GenAI to make smog protection practical.',
    hi: 'प्योरएयर लाइफ सार्वजनिक स्वास्थ्य मार्गदर्शन और जेनएआई को जोड़कर धुएँ से बचाव को व्यावहारिक बनाता है।'
  },
  'app.disclaimer': {
    en: 'Reference values are modelled estimates for education, not a live air-quality feed. For medical emergencies, contact a doctor.',
    hi: 'संदर्भ मान शिक्षा के लिए नमूना अनुमान हैं, लाइव वायु-गुणवत्ता फ़ीड नहीं। चिकित्सा आपात स्थिति में डॉक्टर से संपर्क करें।'
  },

  // ---- Navigation -------------------------------------------------------
  'nav.dashboard': { en: 'Smog Shield', hi: 'स्मॉग शील्ड' },
  'nav.planner': { en: 'AI Smog-Armor', hi: 'एआई स्मॉग-आर्मर' },
  'nav.scanner': { en: 'Room Vision Auditor', hi: 'कमरा विज़न ऑडिटर' },
  'nav.hacklab': { en: 'DIY Hack Lab', hi: 'डीआईवाई हैक लैब' },
  'nav.impact': { en: 'Family Impact', hi: 'परिवार प्रभाव' },
  'nav.chat': { en: 'Clean Air AI', hi: 'क्लीन एयर एआई' },
  'nav.selectCity': { en: 'Select city', hi: 'शहर चुनें' },
  'nav.currentlySelected': { en: 'Currently selected', hi: 'वर्तमान में चुना गया' },
  'nav.searchCity': {
    en: 'Search Indian city, state, or region',
    hi: 'भारतीय शहर, राज्य या क्षेत्र खोजें'
  },
  'nav.filterCities': { en: 'Filter Indian cities', hi: 'भारतीय शहर छाँटें' },
  'nav.clearSearch': { en: 'Clear city search', hi: 'शहर की खोज साफ़ करें' },
  'nav.availableCities': { en: 'Available Indian Cities', hi: 'उपलब्ध भारतीय शहर' },
  'nav.avoided': { en: 'Avoided', hi: 'बचा' },
  'nav.cigEquivalent': { en: 'cig-equiv', hi: 'सिगरेट-समकक्ष' },
  'nav.home': { en: 'PureAir Life Home', hi: 'प्योरएयर लाइफ मुख्य पृष्ठ' },
  'nav.mainTabs': { en: 'Main Navigation Tabs', hi: 'मुख्य नेविगेशन टैब' },
  'nav.language': { en: 'Language', hi: 'भाषा' },
  'nav.switchToHindi': { en: 'हिंदी में देखें', hi: 'View in English' },

  // ---- AI provider status ----------------------------------------------
  'ai.live': { en: 'AI live', hi: 'एआई लाइव' },
  'ai.checking': { en: 'Checking AI access…', hi: 'एआई पहुँच जाँच हो रही है…' },
  'ai.offline': { en: 'AI offline', hi: 'एआई ऑफ़लाइन' },
  'ai.localGuide': { en: 'Local guide', hi: 'स्थानीय गाइड' },
  'ai.configure': { en: 'Configure AI access', hi: 'एआई पहुँच सेट करें' },
  'ai.configureTitle': { en: 'Connect the AI assistant', hi: 'एआई सहायक को जोड़ें' },
  'ai.configureIntro': {
    en: 'This deployment has no server-side AI key configured, so the assistant is using the offline clean-air guide. Paste your own Google AI Studio key to enable live Gemini answers. The key is kept in this browser tab only and is sent nowhere except Google.',
    hi: 'इस डिप्लॉयमेंट में सर्वर-साइड एआई कुंजी सेट नहीं है, इसलिए सहायक ऑफ़लाइन क्लीन-एयर गाइड का उपयोग कर रही है। लाइव Gemini उत्तरों के लिए अपनी Google AI Studio कुंजी चिपकाएँ। कुंजी केवल इसी ब्राउज़र टैब में रहती है और Google के अलावा कहीं नहीं भेजी जाती।'
  },
  'ai.keyLabel': { en: 'Google AI Studio API key', hi: 'Google AI Studio API कुंजी' },
  'ai.keyHint': {
    en: 'Stored in sessionStorage for this tab only. Clear it any time.',
    hi: 'केवल इसी टैब के लिए sessionStorage में सुरक्षित। आप कभी भी हटा सकते हैं।'
  },
  'ai.saveKey': { en: 'Save key', hi: 'कुंजी सुरक्षित करें' },
  'ai.clearKey': { en: 'Remove key', hi: 'कुंजी हटाएँ' },
  'ai.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'ai.keySaved': { en: 'Key saved for this session.', hi: 'कुंजी इस सत्र के लिए सुरक्षित हो गई।' },
  'ai.keyInvalid': {
    en: 'That does not look like a valid API key.',
    hi: 'यह मान्य API कुंजी जैसी नहीं लगती।'
  },
  'ai.responseLive': { en: 'Live Gemini response', hi: 'लाइव Gemini उत्तर' },
  'ai.responseFallback': {
    en: 'Offline clean-air guide (no AI provider available)',
    hi: 'ऑफ़लाइन क्लीन-एयर गाइड (एआई प्रदाता उपलब्ध नहीं)'
  },

  // ---- Dashboard --------------------------------------------------------
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
  'planner.title': { en: 'AI Smog-Armor Planner', hi: 'एआई स्मॉग-आर्मर प्लानर' },
  'planner.subtitle': {
    en: 'Build a low-emission daily routine for your family.',
    hi: 'अपने परिवार के लिए कम-प्रदूषण दिनचर्या बनाएँ।'
  },
  'planner.generate': { en: 'Generate my routine', hi: 'मेरी दिनचर्या बनाएँ' },
  'planner.generating': { en: 'Generating…', hi: 'बनाई जा रही है…' },
  'planner.adults': { en: 'Adults', hi: 'वयस्क' },
  'planner.children': { en: 'Children', hi: 'बच्चे' },
  'planner.elderly': { en: 'Elderly', hi: 'वरिष्ठ' },
  'planner.commute': { en: 'Primary commute', hi: 'मुख्य यात्रा' },
  'planner.commuteDistance': { en: 'Commute distance (km)', hi: 'यात्रा दूरी (किमी)' },
  'planner.heating': { en: 'Home heating source', hi: 'घर की हीटिंग' },
  'planner.cooking': { en: 'Cooking style', hi: 'रसोई की शैली' },
  'planner.vulnerabilities': { en: 'Vulnerability focus', hi: 'संवेदनशीलता' },
  'planner.markComplete': { en: 'Mark block complete', hi: 'यह ब्लॉक पूरा करें' },
  'planner.markIncomplete': { en: 'Mark block as not done', hi: 'इस ब्लॉक को अधूरा करें' },
  'planner.routineReady': { en: 'Your routine is ready', hi: 'आपकी दिनचर्या तैयार है' },
  'planner.engineBadge': {
    en: 'GenAI smog-armor schedule architect (Gemini Flash)',
    hi: 'GenAI स्मॉग-आर्मर शेड्यूल आर्किटेक्ट (Gemini Flash)'
  },
  'planner.subtitleCity': {
    en: '’s diurnal inversion curve to minimise respiratory exposure while reducing your household’s emissions footprint.',
    hi: 'के दिनचर्या उलटना वक्र के अनुसार श्वसन जोखिम घटाने और परिवार के उत्सर्जन को कम करने के लिए।'
  },
  'planner.regenerate': { en: 'Regenerate schedule', hi: 'दिनचर्या फिर से बनाएँ' },
  'planner.error': {
    en: 'The routine could not be generated right now. Please try again in a moment.',
    hi: 'दिनचर्या अभी नहीं बनाई जा सकी। कृपया कुछ देर बाद फिर कोशिश करें।'
  },
  'planner.profileTitle': {
    en: 'Family lifestyle & exposure profile',
    hi: 'परिवार की जीवनशैली और जोखिम प्रोफ़ाइल'
  },
  'planner.householdSize': { en: 'Household members', hi: 'घर के सदस्य' },
  'planner.commuteCar': {
    en: 'Single-occupant petrol / diesel car',
    hi: 'एकल-यात्री पेट्रोल / डीज़ल कार'
  },
  'planner.commuteTwoWheeler': {
    en: 'Motorcycle / scooter (high direct inhalation)',
    hi: 'मोटरसाइकिल / स्कूटर (सीधे अधिक साँस)'
  },
  'planner.commuteMetro': {
    en: 'Electric metro / clean public transit',
    hi: 'इलेक्ट्रिक मेट्रो / साफ़ सार्वजनिक परिवहन'
  },
  'planner.commuteCarpool': {
    en: 'Shared carpool / vanpool',
    hi: 'साझा कारपूल / वैनपूल'
  },
  'planner.commuteWfh': {
    en: 'Work or study from home (zero transit)',
    hi: 'घर से काम या पढ़ाई (शून्य यात्रा)'
  },
  'planner.heatHeatpump': {
    en: 'Clean electric heat pump / inverter AC',
    hi: 'साफ़ इलेक्ट्रिक हीट पंप / इनवर्टर AC'
  },
  'planner.heatGas': {
    en: 'Gas wall heater / radiant heaters',
    hi: 'गैस वॉल हीटर / रेडिएंट हीटर'
  },
  'planner.heatElectric': {
    en: 'Electric oil radiator / blower',
    hi: 'इलेक्ट्रिक ऑयल रेडिएटर / ब्लोअर'
  },
  'planner.heatWoodCoal': {
    en: 'Traditional wood / coal / kerosene brazier',
    hi: 'पारंपरिक लकड़ी / कोयला / मिट्टी का तेल चूल्हा'
  },
  'planner.cookFrying': {
    en: 'High-heat oil frying / stir fry / sauté (heavy PM2.5)',
    hi: 'तेज़ आँच पर तलना / तड़का (भारी PM2.5)'
  },
  'planner.cookSteaming': {
    en: 'Covered steaming, soups, boiling, baking (low PM2.5)',
    hi: 'ढके पकाना, सूप, उबालना, बेकिंग (कम PM2.5)'
  },
  'planner.cookInduction': {
    en: 'Induction cooktop with exhaust hood active',
    hi: 'इंडक्शन कुकर, एग्ज़ॉस्ट हुड चालू'
  },
  'planner.contextNote': {
    en: 'GenAI context: Gemini Flash matches these household habits against the',
    hi: 'GenAI संदर्भ: Gemini Flash इन घरेलू आदतों को'
  },
  'planner.output': { en: 'Generated routine', hi: 'बनाई गई दिनचर्या' },
  'planner.emptyTitle': { en: 'No schedule formulated yet', hi: 'अभी कोई शेड्यूल नहीं बना' },
  'planner.emptyBody': {
    en: 'Use the button above to let Gemini assemble an optimised hourly schedule with indoor air quality hacks and clean transit alternatives for today.',
    hi: 'ऊपर दिए बटन से Gemini आज का अनुकूलित घंटा-वार शेड्यूल, indoor एयर क्वालिटी हैक और साफ़ यात्रा विकल्प बनाएगा।'
  },
  'planner.emptyCta': { en: 'Generate now', hi: 'अभी बनाएँ' },
  'planner.routineAction': { en: 'Routine action:', hi: 'दिनचर्या कार्य:' },
  'planner.iaqHack': { en: 'Indoor IAQ hack', hi: 'Indoor IAQ हैक' },
  'planner.sustainableSwap': { en: 'Sustainable swap', hi: 'टिकाऊ विकल्प' },
  'planner.directImpact': { en: 'The direct impact:', hi: 'सीधा प्रभाव:' },
  'planner.collectiveImpact': { en: 'Collective impact milestone', hi: 'सामूहिक प्रभाव मीलका पत्थर' },
  'planner.smogProtocol': { en: 'Smog protocol:', hi: 'स्मॉग प्रोटोकॉल:' },

  // ---- Scanner ----------------------------------------------------------
  'scanner.title': { en: 'Room Vision Auditor', hi: 'कमरा विज़न ऑडिटर' },
  'scanner.subtitle': {
    en: 'Upload a room photo to find particulate leak paths.',
    hi: 'कण रिसाव के रास्ते पाने के लिए कमरे की तस्वीर अपलोड करें।'
  },
  'scanner.upload': { en: 'Upload room photo', hi: 'कमरे की तस्वीर अपलोड करें' },
  'scanner.analyzing': { en: 'Analysing room…', hi: 'कमरा जाँचा जा रहा है…' },
  'scanner.roomType': { en: 'Room type', hi: 'कमरे का प्रकार' },
  'scanner.notes': { en: 'What are you worried about?', hi: 'आपको किस बात की चिंता है?' },
  'scanner.notesPlaceholder': {
    en: 'e.g. window leaks, purifier placement, kitchen smoke',
    hi: 'जैसे खिड़की में दरार, प्यूरीफायर की जगह, रसोई का धुआँ'
  },
  'scanner.leakageRisk': { en: 'Leakage risk score', hi: 'रिसाव जोखिम स्कोर' },
  'scanner.fixes': { en: 'Step-by-step fixes', hi: 'कदम-दर-कदम सुधार' },
  'scanner.fileTooLarge': {
    en: 'That image is too large. Please choose a photo under 5 MB.',
    hi: 'यह इमेज बहुत बड़ी है। कृपया 5 MB से कम की तस्वीर चुनें।'
  },
  'scanner.fileWrongType': {
    en: 'Please choose an image file (JPEG, PNG or WebP).',
    hi: 'कृपया एक इमेज फ़ाइल चुनें (JPEG, PNG या WebP)।'
  },
  'scanner.fileReadFailed': {
    en: 'That image could not be read. Please try a different file.',
    hi: 'यह इमेज पढ़ी नहीं जा सकी। कृपया कोई दूसरी फ़ाइल आज़माएँ।'
  },
  'scanner.engineBadge': {
    en: 'Multimodal computer vision IAQ auditor (Gemini Flash)',
    hi: 'मल्टीमोडल कंप्यूटर विज़न IAQ ऑडिटर (Gemini Flash)'
  },
  'scanner.runAudit': { en: 'Run AI vision audit', hi: 'एआई विज़न ऑडिट चलाएँ' },
  'scanner.reaudit': { en: 'Re-audit room', hi: 'कमरे की फिर से जाँच' },
  'scanner.uploadOrSample': {
    en: 'Upload a room photo or choose a setup',
    hi: 'कमरे की तस्वीर अपलोड करें या सेटअप चुनें'
  },
  'scanner.photoAttached': {
    en: 'Photo attached (click to change)',
    hi: 'तस्वीर जुड़ी हुई है (बदलने के लिए क्लिक करें)'
  },
  'scanner.uploadHint': {
    en: 'Windows, door jambs, purifiers, or DIY filters',
    hi: 'खिड़कियाँ, दरवाज़े के चौखटे, प्यूरीफायर या DIY फ़िल्टर'
  },
  'scanner.uploadLimits': {
    en: 'JPEG, PNG or WebP up to 5 MB',
    hi: 'JPEG, PNG या WebP, अधिकतम 5 MB'
  },
  'scanner.previewAlt': {
    en: 'Preview of the uploaded room photo',
    hi: 'अपलोड की गई कमरे की तस्वीर का पूर्वावलोकन'
  },
  'scanner.uploadReady': {
    en: 'Custom upload ready',
    hi: 'कस्टम अपलोड तैयार'
  },
  'scanner.sampleLegend': {
    en: 'Or select a test room setup',
    hi: 'या कोई परीक्षण कमरा सेटअप चुनें'
  },
  'scanner.roomTypePlaceholder': {
    en: 'e.g. nursery window or kitchen cooktop',
    hi: 'जैसे नर्सरी की खिड़की या रसोई का चूल्हा'
  },
  'scanner.report': { en: 'Audit report', hi: 'ऑडिट रिपोर्ट' },
  'scanner.emptyTitle': { en: 'No IAQ audit performed yet', hi: 'अभी कोई IAQ ऑडिट नहीं हुआ' },
  'scanner.emptyBody': {
    en: 'Choose one of the four test room setups or upload a photo of your window or filter, then run the vision audit.',
    hi: 'चार परीक्षण कमरा सेटअप में से एक चुनें या अपनी खिड़की/फ़िल्टर की तस्वीर अपलोड करें, फिर विज़न ऑडिट चलाएँ।'
  },
  'scanner.emptyCta': { en: 'Analyse sample setup now', hi: 'अभी सेटअप जाँचें' },
  'scanner.reportTitleLive': {
    en: 'Gemini vision audit report',
    hi: 'Gemini विज़न ऑडिट रिपोर्ट'
  },
  'scanner.reportTitleLocal': {
    en: 'Offline room audit (local guide)',
    hi: 'ऑफ़लाइन कमरा ऑडिट (स्थानीय गाइड)'
  },
  'scanner.vulnerabilities': {
    en: 'Detected infiltration and airflow flaws',
    hi: 'पाए गए रिसाव और वायु-प्रवाह दोष'
  },
  'scanner.placement': {
    en: 'Optimal breathing-zone placement',
    hi: 'साँस की ज़ zone में सही जगह'
  },
  'scanner.expected': { en: 'Expected improvement', hi: 'अपेक्षित सुधार' },

  // ---- Hack Lab ---------------------------------------------------------
  'hacklab.badge': {
    en: 'Indoor air science & engineering lab',
    hi: 'Indoor हवा विज्ञान और इंजीनियरिंग प्रयोगशाला'
  },
  'hacklab.subtitle': {
    en: 'Build high-performance, university-validated DIY air purifiers for a fraction of commercial costs. Stop drafts and particulate leaks using tested physics hacks.',
    hi: 'व्यावसायिक लागत के एक हिस्से में विश्वविद्यालय-सत्यापित DIY एयर प्यूरीफायर बनाएँ। परीक्षित भौतिकी हैक से हवा के झोंक और कण रिसाव रोकें।'
  },
  'hacklab.simTitle': {
    en: 'Corsi-Rosenthal box CADR and room airflow simulator',
    hi: 'कॉर्सी-रोज़ेंथल बॉक्स CADR और कमरे की हवा सिमुलेटर'
  },
  'hacklab.simExplainer': {
    en: 'Adjust fan speed, filter count and room dimensions to calculate air changes per hour (ACH) and clearance times.',
    hi: 'प्रति घंटा हवा परिवर्तन (ACH) और साफ़ होने का समय निकालने के लिए फ़ैन की गति, फ़िल्टर संख्या और कमरे के आकार बदलें।'
  },
  'hacklab.fanSpeed': { en: '20-inch box fan speed', hi: '20-इंच बॉक्स फ़ैन की गति' },
  'hacklab.filterArch': { en: 'Filter architecture', hi: 'फ़िल्टर संरचना' },
  'hacklab.filter4': { en: '4-filter cube', hi: '4-फ़िल्टर क्यूब' },
  'hacklab.filter5': { en: '5-filter comp', hi: '5-फ़िल्टर कॉम्प' },
  'hacklab.filter2': { en: '2-filter mini', hi: '2-फ़िल्टर मिनी' },
  'hacklab.merv': { en: 'Furnace filter efficiency', hi: 'फ़र्नेस फ़िल्टर दक्षता' },
  'hacklab.shroud': { en: '15-inch cardboard shroud', hi: '15-इंच कार्डबोर्ड शील्ड' },
  'hacklab.shroudDesc': {
    en: 'Prevents reverse blade vortex backflow',
    hi: 'पीछे की ओर घूमने वाले व्हर्लपool बैकफ़्लो को रोकता है'
  },
  'hacklab.shroudOn': { en: 'Installed (+35% CADR)', hi: 'लगा हुआ (+35% CADR)' },
  'hacklab.shroudOff': { en: 'Not installed', hi: 'लगाया नहीं' },
  'hacklab.roomDims': { en: 'Target room dimensions', hi: 'कमरे के आकार' },
  'hacklab.length': { en: 'Length', hi: 'लंबाई' },
  'hacklab.width': { en: 'Width', hi: 'चौड़ाई' },
  'hacklab.height': { en: 'Height', hi: 'ऊँचाई' },
  'hacklab.readout': {
    en: 'Airflow physics and CADR performance',
    hi: 'वायु प्रवाह भौतिकी और CADR प्रदर्शन'
  },
  'hacklab.achLine': { en: 'Delivers', hi: 'प्रदान करता है' },
  'hacklab.inRoom': { en: 'in your', hi: 'आपके' },
  'hacklab.clear90': { en: '90% PM2.5 clearance', hi: '90% PM2.5 निष्कासन' },
  'hacklab.clear90Note': { en: 'Rapid alveolar defence', hi: 'तेज़ श्वसन-रक्षा' },
  'hacklab.clear99': { en: '99% air wash clearance', hi: '99% एयर वॉश निष्कासन' },
  'hacklab.clear99Note': { en: 'Total room particle purge', hi: 'कमरे के सभी कणों की सफ़ाई' },
  'hacklab.mins': { en: 'mins', hi: 'मिनट' },
  'hacklab.acoustic': { en: 'Acoustic level', hi: 'ध्वनि स्तर' },
  'hacklab.acousticNote': { en: 'Quiet bedroom hum', hi: 'शांत बेडरूम की गुनगुनाहट' },
  'hacklab.powerCost': { en: 'Annual electric cost', hi: 'सालाना बिजली खर्च' },
  'hacklab.powerNote': { en: 'Low wattage inductive fan', hi: 'कम वाट वाला इंडक्शन फ़ैन' },
  'hacklab.diyCost': { en: 'DIY build cost', hi: 'DIY निर्माण लागत' },
  'hacklab.commercial': { en: 'Commercial equivalent', hi: 'व्यावसायिक समतुल्य' },
  'hacklab.moneySaved': { en: 'Total family money saved', hi: 'कुल बचत' },
  'hacklab.saved': { en: 'saved', hi: 'बचत' },
  'hacklab.cityTitle': {
    en: 'Indoor concentration for your city baseline',
    hi: 'आपके शहर के आधार पर indoor concentration'
  },
  'hacklab.cityExplainer': {
    en: 'A single-zone outdoor-air mass balance: how much PM2.5 stays indoors at your outdoor baseline, with and without the simulated filtration.',
    hi: 'एकल-ज़ोन बाहरी-हवा द्रव्यमान संतुलन: आपके बाहरी आधार पर indoor PM2.5 कितना रहेगा, सिमुलेटेड फ़िल्टर के साथ और बिना।'
  },
  'hacklab.sealLevel': { en: 'Room sealing condition', hi: 'कमरे की सील की स्थिति' },
  'hacklab.sealSealed': { en: 'Fully sealed', hi: 'पूरी तरह सील' },
  'hacklab.sealStripped': { en: 'Weatherstripped', hi: 'वेदरस्ट्रिप लगा' },
  'hacklab.sealDrafty': { en: 'Drafty (typical)', hi: 'हवादार (सामान्य)' },
  'hacklab.sealUnsealed': { en: 'Unsealed / broken', hi: 'बिना सील / टूटी हुई' },
  'hacklab.outdoorBaseline': { en: 'Outdoor baseline', hi: 'बाहरी आधार' },
  'hacklab.withoutFiltration': { en: 'Indoor, unfiltered', hi: 'Indoor, बिना फ़िल्टर' },
  'hacklab.withFiltration': { en: 'Indoor, filtered', hi: 'Indoor, फ़िल्टर के साथ' },
  'hacklab.infiltration': { en: 'Infiltration', hi: 'रिसाव' },
  'hacklab.meetsWho': { en: 'Meets the WHO 24-hour guideline', hi: 'WHO 24-घंटे की सीमा में' },
  'hacklab.aboveWho': {
    en: 'Still above the WHO 24-hour guideline - tighten sealing or filter further',
    hi: 'अब भी WHO 24-घंटे की सीमा से ऊपर - सील बढ़ाएँ या फ़िल्टर बेहतर करें'
  },
  'hacklab.methodNote': {
    en: 'Model: steady-state single-zone mass balance, C_in = (lambda x C_out) / (lambda + k), where lambda is the outdoor air-change rate and k is the filtered air-change rate. Figures are modelling estimates, not measurements.',
    hi: 'मॉडल: स्थिर-अवस्था एकल-ज़ोन द्रव्यमान संतुलन, C_in = (lambda x C_out) / (lambda + k), जहाँ lambda बाहरी हवा-परिवर्तन दर है और k फ़िल्टर की हवा-परिवर्तन दर। ये आँकड़े नमूना अनुमान हैं, माप नहीं।'
  },
  'hacklab.catalogTitle': {
    en: 'Tested winter smog and thermal sealing hacks',
    hi: 'परीक्षित सर्दी धुएँ और थर्मल सील हैक'
  },
  'hacklab.catalogExplainer': {
    en: 'Low-cost interventions proven by building science researchers to stop particle infiltration and indoor combustion spikes.',
    hi: 'बिल्डिंग साइंस के शोधकर्ताओं द्वारा सिद्ध कम-लागत उपाय जो कण रिसाव और indoor दहन spikes रोकते हैं।'
  },
  'hacklab.materials': { en: 'Materials', hi: 'सामग्री' },

  // ---- Impact ledger ----------------------------------------------------
  'impact.badge': {
    en: 'The direct impact engine & family ledger',
    hi: 'सीधा प्रभाव इंजन और परिवार खाता'
  },
  'impact.subtitle': {
    en: 'PureAir Life translates atmospheric telemetry into tangible biological outcomes: cigarette-equivalents prevented from entering alveolar tissue, and neighbourhood carbon cut.',
    hi: 'प्योरएयर लाइफ वायुमंडलीय सूचना को ठोस जैव-नतीजों में बदलता है: फेफड़ों तक पहुँचने से रोकी गई सिगरेट-समकक्ष मात्रा और मोहल्ले का कम कार्बन।'
  },
  'impact.berkeleyEquivalent': {
    en: 'Berkeley Earth equivalent',
    hi: 'बर्कले अर्थ समकक्ष'
  },
  'impact.cigPerDay': { en: 'cig-equiv / day', hi: 'सिगरेट-समकक्ष / दिन' },
  'impact.cigPerMonth': {
    en: 'cigarettes avoided per month',
    hi: 'सिगरेट प्रति माह बची'
  },
  'impact.berkeleyExplainer': {
    en: 'Based on the UC Berkeley model (22 µg/m³ PM2.5 = 1 cigarette). Your indoor filtration routine prevented this deep alveolar particle load today.',
    hi: 'UC बर्कले मॉडल पर आधारित (22 µg/m³ PM2.5 = 1 सिगरेट)। आज आपकी indoor फ़िल्टरिंग ने इतनी गहरी फुफ्फुसीय कण मात्रा रोकी।'
  },
  'impact.alveolarDefense': {
    en: 'Alveolar PM2.5 defence',
    hi: 'फेफड़ों की PM2.5 रक्षा'
  },
  'impact.perDay': { en: 'day', hi: 'दिन' },
  'impact.alveolarExplainer': {
    en: 'Ultrafine particulate mass kept out of the bloodstream and lungs by sealing windows during',
    hi: 'खिड़कियाँ सील करके रक्त और फेफड़ों में पहुँचने से रोका गया सूक्ष्म कण द्रव्यमान,'
  },
  'impact.alveolarFooter': {
    en: 'Prevents systemic cardiovascular inflammation',
    hi: 'सिस्टमिक हृदय-वाहिका सूजन रोकता है'
  },
  'impact.communityCut': {
    en: 'Community soot & CO2 cut',
    hi: 'मोहल्ले की कालिख और CO2 में कटौती'
  },
  'impact.communityExplainer': {
    en: 'Plus',
    hi: 'इसके अतिरिक्त'
  },
  'impact.communityScore': {
    en: 'Community clean air score:',
    hi: 'सामुदायिक स्वच्छ वायु स्कोर:'
  },
  'impact.lifestyleTitle': { en: 'Your lifestyle assumptions', hi: 'आपकी जीवनशैली की मान्यताएँ' },
  'impact.lifestyleExplainer': {
    en: 'Adjust these to see how the impact figures above respond to your actual routine.',
    hi: 'अपनी वास्तविक दिनचर्या के अनुसार इन्हें बदलें और देखें कि ऊपर के आँकड़े कैसे बदलते हैं।'
  },
  'impact.commuteChoice': { en: 'Commute mode', hi: 'यात्रा का तरीका' },
  'impact.commuteMetro': { en: 'Metro / clean public transit', hi: 'मेट्रो / साफ़ सार्वजनिक परिवहन' },
  'impact.commuteEv': { en: 'Electric vehicle', hi: 'इलेक्ट्रिक वाहन' },
  'impact.commuteCarpool': { en: 'Shared carpool', hi: 'साझा कारपूल' },
  'impact.commuteWfh': { en: 'Work from home', hi: 'घर से काम' },
  'impact.commuteCar': { en: 'Single-occupant petrol car', hi: 'एकल-यात्री पेट्रोल कार' },
  'impact.commuteKm': { en: 'Daily commute distance (km)', hi: 'रोज़ की यात्रा दूरी (किमी)' },
  'impact.heatingChoice': { en: 'Home heating source', hi: 'घर की हीटिंग' },
  'impact.heatHeatpump': { en: 'Electric heat pump / inverter AC', hi: 'इलेक्ट्रिक हीट पंप / इनवर्टर AC' },
  'impact.heatElectric': { en: 'Electric oil radiator', hi: 'इलेक्ट्रिक ऑयल रेडिएटर' },
  'impact.heatInsulation': { en: 'Better insulation / passive sealing', hi: 'बेहतर इंसुलेशन / निष्क्रिय सीलिंग' },
  'impact.heatWoodCoal': { en: 'Wood / coal / kerosene heating', hi: 'लकड़ी / कोयला / मिट्टी का तेल' },
  'impact.outdoorHours': { en: 'Hours spent outdoors per day', hi: 'प्रतिदिन बाहर बिताए घंटे' },
  'impact.hoursPerDay': { en: 'hours per day', hi: 'घंटे प्रतिदिन' },
  'impact.checklistTitle': {
    en: 'Daily smog defence & collective action checklist',
    hi: 'रोज़ की स्मॉग रक्षा और सामूहिक कार्य सूची'
  },
  'impact.checklistExplainer': {
    en: 'Check off your clean-air daily milestones to build family resilience and track community impact.',
    hi: 'परिवार की सहनशीलता बढ़ाने और सामुदायिक प्रभाव देखने के लिए अपने रोज़ के स्वच्छ वायु लक्ष्य चुनें।'
  },
  'impact.resilience': { en: 'Resilience score', hi: 'सहनशीलता स्कोर' },
  'impact.resiliencePts': { en: 'Resilience pts', hi: 'सहनशीलता अंक' },
  'impact.communityTitle': {
    en: 'Community smog shield & clean air corridors',
    hi: 'सामुदायिक स्मॉग शील्ड और स्वच्छ वायु कॉरिडोर'
  },
  'impact.neighbourhoodHub': { en: 'Neighbourhood hub', hi: 'मोहल्ला केंद्र' },
  'impact.communityBody': {
    en: 'Individual air filtration protects your living room, but collective action clears the neighbourhood. Join local parent-teacher associations and resident welfare groups to establish zero-idling school drop-off zones and report illegal biomass burning.',
    hi: 'व्यक्तिगत एयर फ़िल्टरिंग आपके कमरे को बचाती है, लेकिन सामूहिक कार्य पूरे मोहल्ले को साफ़ करता है। स्कूल ड्रॉप-ऑफ़ ज़ोन में इंजन बंद रखने और अवैध बायोमास जलाने की शिकायत के लिए स्थानीय अभिभावक संघों से जुड़ें।'
  },
  'impact.corridorsTitle': { en: 'Clean school corridors', hi: 'साफ़ स्कूल कॉरिडोर' },
  'impact.corridorsBody': {
    en: 'Advocate for engines-off idling rules within 200 m of elementary school gates.',
    hi: 'प्राथमिक विद्यालय के दरवाज़ों से 200 मीटर के भीतर इंजन बंद रखने के नियम की माँग रखें।'
  },
  'impact.biomassTitle': { en: 'Local biomass spotting', hi: 'स्थानीय बायोमास पहचान' },
  'impact.biomassBody': {
    en: 'Report open leaf and garbage fires with geolocated photos to municipal dispatchers.',
    hi: 'खुले पत्तों और कचरे की आग की जानकारी तस्वीर के साथ नगर निगम को दें।'
  },
  'impact.groupCrTitle': { en: 'Group CR box assembly', hi: 'सामूहिक CR बॉक्स निर्माण' },
  'impact.groupCrBody': {
    en: 'Bulk-order MERV 13 filters with neighbours to equip community kindergartens and daycare centres.',
    hi: 'पड़ोसियों के साथ मिलकर MERV 13 फ़िल्टर की थोक खरीद कर समुदाय के आँगनवाड़ियों को फ़िल्टर दें।'
  },

  // ---- Chat -------------------------------------------------------------
  'chat.engineBadge': {
    en: 'Gemini Flash smog companion',
    hi: 'Gemini Flash स्मॉग साथी'
  },
  'chat.context': { en: 'Context', hi: 'संदर्भ' },
  'chat.conversation': { en: 'Conversation', hi: 'बातचीत' },
  'chat.errorMessage': {
    en: 'The assistant could not respond right now. Please try again in a moment.',
    hi: 'सहायक अभी उत्तर नहीं दे सका। कृपया कुछ देर बाद फिर कोशिश करें।'
  },
  'chat.stop': { en: 'Stop', hi: 'रोकें' },
  'chat.listen': { en: 'Listen', hi: 'सुनें' },
  'chat.inputLabel': {
    en: 'Ask the clean air assistant',
    hi: 'क्लीन एयर सहायक से पूछें'
  },

  // ---- Hack Lab ---------------------------------------------------------
  'hacklab.title': { en: 'DIY Indoor Air Hack Lab', hi: 'डीआईवाई इनडोर एयर हैक लैब' },
  'hacklab.filterType': { en: 'Filter class', hi: 'फ़िल्टर श्रेणी' },
  'hacklab.fanType': { en: 'Fan class', hi: 'फ़ैन श्रेणी' },
  'hacklab.roomSize': { en: 'Room size', hi: 'कमरे का आकार' },
  'hacklab.calculate': { en: 'Recalculate', hi: 'फिर से गणना करें' },
  'hacklab.cadr': { en: 'Effective CADR', hi: 'प्रभावी CADR' },
  'hacklab.ach': { en: 'Air changes per hour', hi: 'प्रति घंटा हवा परिवर्तन' },
  'hacklab.clearance': { en: 'Time to clear 90%', hi: '90% साफ़ होने का समय' },
  'hacklab.roomBaseline': { en: 'Your city baseline', hi: 'आपके शहर का आधार' },
  'hacklab.leakage': { en: 'Sealed room', hi: 'सीलबंद कमरा' },

  // ---- Impact ledger ----------------------------------------------------
  'impact.title': { en: 'Family Impact Ledger', hi: 'परिवार प्रभाव खाता' },
  'impact.pledges': { en: 'Family pledges', hi: 'परिवार की प्रतिबद्धताएँ' },
  'impact.togglePledge': { en: 'Toggle this pledge', hi: 'यह प्रतिबद्धता चालू/बंद करें' },
  'impact.pledged': { en: 'pledged', hi: 'प्रतिबद्ध' },
  'impact.cigarettes': { en: 'cigarettes avoided / month', hi: 'सिगरेट प्रति माह बची' },
  'impact.co2': { en: 'kg CO2 saved / month', hi: 'किग्रा CO2 प्रति माह बचा' },
  'impact.pm25': { en: 'g PM2.5 avoided / month', hi: 'ग्राम PM2.5 प्रति माह बचा' },
  'impact.resiliencePoints': {
    en: 'Family resilience points',
    hi: 'परिवार सहनशीलता अंक'
  },

  // ---- Chat -------------------------------------------------------------
  'chat.title': { en: 'Clean Air AI Assistant', hi: 'क्लीन एयर एआई सहायक' },
  'chat.subtitle': {
    en: 'Ask anything about smog, indoor air and low-emission living.',
    hi: 'धुएँ, indoor हवा और कम-प्रदूषण जीवन के बारे में कुछ भी पूछें।'
  },
  'chat.placeholder': {
    en: 'Ask how to protect your family during smog…',
    hi: 'धुएँ में अपने परिवार को कैसे बचाएँ, पूछें…'
  },
  'chat.send': { en: 'Send', hi: 'भेजें' },
  'chat.sendShort': { en: 'Ask AI', hi: 'पूछें' },
  'chat.quickPrompts': { en: 'Quick questions', hi: 'त्वरित प्रश्न' },
  'chat.thinking': { en: 'Thinking…', hi: 'सोच रहा है…' },
  'chat.speak': { en: 'Read this answer aloud', hi: 'यह उत्तर बोलकर सुनाएँ' },
  'chat.clear': { en: 'Clear conversation', hi: 'बातचीत साफ़ करें' },
  'chat.you': { en: 'You', hi: 'आप' },
  'chat.assistant': { en: 'Clean Air AI', hi: 'क्लीन एयर एआई' }
};

/**
 * Look up a translated string.
 * @param {Language} lang
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function translate(lang, key, fallback = '') {
  const entry = STRINGS[key];
  if (!entry) return fallback || key;
  return entry[lang] || entry.en || fallback || key;
}
