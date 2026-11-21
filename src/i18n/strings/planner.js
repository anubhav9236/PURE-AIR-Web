/**
 * AI Smog-Armor planner: household profile form and generated routine.
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const plannerStrings = {
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
    hi: 'GenAI स्मॉग-आर्मर शेड्यूल आर्किटेक्चर (Gemini Flash)'
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
    hi: 'ऊपर दिए बटन से Gemini आज का अनुकूलित घंटा-वार शेड्यूल, इनडोर एयर क्वालिटी हैक और साफ़ यात्रा विकल्प बनाएगा।'
  },
  'planner.emptyCta': { en: 'Generate now', hi: 'अभी बनाएँ' },
  'planner.routineAction': { en: 'Routine action:', hi: 'दिनचर्या कार्य:' },
  'planner.iaqHack': { en: 'Indoor IAQ hack', hi: 'इनडोर IAQ हैक' },
  'planner.sustainableSwap': { en: 'Sustainable swap', hi: 'टिकाऊ विकल्प' },
  'planner.directImpact': { en: 'The direct impact:', hi: 'सीधा प्रभाव:' },
  'planner.collectiveImpact': { en: 'Collective impact milestone', hi: 'सामूहिक प्रभाव मीलका पत्थर' },
  'planner.smogProtocol': { en: 'Smog protocol:', hi: 'स्मॉग प्रोटोकॉल:' },

  // ---- Scanner ----------------------------------------------------------
};
