/**
 * Hindi translations for the *data* strings PureAir Life ships with.
 *
 * `src/i18n/strings.js` covers the UI chrome (buttons, headings, labels).
 * This file covers the descriptive values that live in the telemetry
 * catalogue: city haze descriptors, inversion physics, AQI category advice
 * and the 24-hour diurnal action hints.
 *
 * Lookup is exact-match on the English source string, so an unknown string
 * degrades to the original English instead of rendering a blank. That keeps
 * the translator safe to call on any value, including future catalogue rows.
 */

/**
 * @typedef {'en' | 'hi'} PhraseLanguage
 */

/** @type {Record<string, string>} English source string -> Hindi text. */
export const PHRASES = {
  // ---- Provenance badge labels -------------------------------------------
  'Live data': 'लाइव डेटा',
  'Estimated': 'अनुमानित',
  'Advisory': 'सलाह',
  'Reference baseline': 'संदर्भ आधार',

  // ---- AQI categories (US EPA bands) ------------------------------------
  Good: 'अच्छा',
  Moderate: 'मध्यम',
  'Unhealthy for Sensitive Groups': 'संवेदनशील समूहों के लिए अस्वस्थ',
  Unhealthy: 'अस्वस्थ',
  'Very Unhealthy': 'बहुत अस्वस्थ',
  'Hazardous / Severe+': 'खतरनाक / अत्यधिक',

  // ---- Short city status labels ------------------------------------------
  'Unhealthy for Sensitive': 'संवेदनशीलों के लिए अस्वस्थ',
  Hazardous: 'खतरनाक',

  // ---- AQI category guidance ---------------------------------------------
  'Air quality is satisfactory. Ideal for outdoor family recreation.':
    'वायु गुणवत्ता संतोषजनक है। परिवार के लिए बाहर मनोरंजन के लिए आदर्श।',
  'Acceptable; unusually sensitive people should consider reducing prolonged outdoor exertion.':
    'स्वीकार्य; विशेष रूप से संवेदनशील लोगों को लंबे समय तक बाहरी परिश्रम कम करने पर विचार करना चाहिए।',
  'Children, asthmatics, and elderly should limit prolonged heavy outdoor exertion.':
    'बच्चों, अस्थमा रोगियों और बुज़ुर्गों को लंबे समय तक गंभीर बाहरी परिश्रम सीमित रखना चाहिए।',
  'Everyone may begin to experience health effects. Keep windows sealed, turn on HEPA/CR filters.':
    'सभी लोगों को स्वास्थ्य प्रभाव महसूस हो सकने लगेंगे। खिड़कियाँ बंद रखें और HEPA/CR फ़िल्टर चालू करें।',
  'Health alert: risk of health effects increased for everyone. N95 masks mandatory outdoors.':
    'स्वास्थ्य चेतावनी: सभी के लिए स्वास्थ्य प्रभाव का जोखिम बढ़ा है। बाहर N95 मास्क अनिवार्य है।',
  'Emergency conditions! The entire population is likely affected. Avoid all non-essential outdoor exposure.':
    'आपातकालीन स्थिति! पूरी आबादी प्रभावित हो सकती है। सभी गैर-आवश्यक बाहरी संपर्क से बचें।',

  // ---- Diurnal curve action hints ----------------------------------------
  'Ventilate home briefly & run essential errands':
    'घर में कुछ देर हवा खुली करें और ज़रूरी काम निपटाएँ',
  'Thermal inversion peak! Seal doors & wear N95':
    'तापीय उलटना का चरम! दरवाज़े बंद रखें और N95 पहनें',
  'Moderate exposure - run air purifiers indoors':
    'मध्यम संपर्क — घर में एयर प्यूरीफ़ायर चलाएँ',

  // ---- Inversion physics descriptors --------------------------------------
  'Extreme (Morning Trap at 180m)': 'चरम (सुबह 180 मीटर पर जाल)',
  'Severe Radiation Inversion': 'तीव्र विकिरण उलटना',
  'Severe Boundary Trap': 'तीव्र सीमा जाल',
  'Severe Radiation Trap': 'तीव्र विकिरण जाल',
  'Extreme Thermal Cap': 'चरम तापीय ऊपरी परत',
  'Strong Gangetic Basin Trap': 'प्रबल गंगा घाटी जाल',
  'Severe Gangetic Trap': 'तीव्र गंगा जाल',
  'Heavy River Valley Stagnation': 'भारी नदी घाटी स्थिरता',
  'River Basin Radiation Inversion': 'नदी घाटी विकिरण उलटना',
  'Strong Inversion Layer': 'प्रबल उलटना परत',
  'Severe Inversion Cap': 'तीव्र उलटना ऊपरी परत',
  'Dense Radiation Fog Trap': 'घना विकिरण कोहरा जाल',
  'Moderate Foothills Inversion': 'मध्यम पहाड़ी उलटना',
  'Severe Cold Radiation Cap': 'तीव्र शीत विकिरण ऊपरी परत',
  'Moderate Basin Trap': 'मध्यम घाटी जाल',
  'Light Desert Inversion': 'हल्का रेगिस्तानी उलटना',
  'Coastal Marine Layer Inversion': 'तटीय समुद्री परत उलटना',
  'Plateau Nocturnal Inversion': 'पठार रात्रिकालीन उलटना',
  'Light Continental Inversion': 'हल्का महाद्वीपीय उलटना',
  'Moderate Anticyclone Inversion': 'मध्यम प्रतिचक्रवात उलटना',
  'Coastal River Basin Inversion': 'तटीय नदी घाटी उलटना',
  'Moderate Plateau Inversion': 'मध्यम पठार उलटना',
  'Lake Basin Radiation Inversion': 'झील घाटी विकिरण उलटना',
  'Moderate Industrial Inversion': 'मध्यम औद्योगिक उलटना',
  'Deltaic Radiation Inversion': 'डेल्टा विकिरण उलटना',
  'Chota Nagpur Plateau Cold Trap': 'छोटा नागपुर पठार शीत जाल',
  'Light Coastal Valley Inversion': 'हल्का तटीय घाटी उलटना',
  'Brahmaputra Valley River Inversion': 'ब्रह्मपुत्र घाटी नदी उलटना',
  'Light Altitude Inversion': 'हल्का ऊँचाई उलटना',
  'Weak Coastal Sea Breeze Inversion': 'कमज़ोर तटीय समुद्री हवा उलटना',
  'Moderate Deccan Plateau Inversion': 'मध्यम दक्कन पठार उलटना',
  'Coastal Hills Trapping': 'तटीय पहाड़ी जाल',
  'Minimal Marine Dispersion': 'न्यूनतम समुद्री फैलाव',
  'Negligible Tropical Inversion': 'उपेक्षणीय उष्णकटिबंधीय उलटना',
  'Palghat Gap Wind Mixing': 'पालघाट दर्रे की हवा मिश्रण',
  'Severe Kashmir Valley Cold Basin Trap': 'तीव्र कश्मीर घाटी शीत बेसिन जाल',
  'Doon Valley Basin Cold Pool': 'दून घाटी बेसिन शीत कुंड',

  // ---- Haze / smog source descriptors -------------------------------------
  'Indo-Gangetic Plain Stubble & Vehicular Radiation Inversion':
    'सिंधु-गंगा मैदान पराली और वाहन विकिरण उलटना',
  'Industrial & Highway Freight Particulates': 'औद्योगिक और हाईवे माल-भार के कण',
  'Dense Vehicular Corridor & Diesel Generator Soot': 'सघन वाहक गलियारा और डीज़ल जनरेटर कालिख',
  'Industrial Heavy Particulates & Smog': 'भारी औद्योगिक कण और धुआँ',
  'Dense Arterial Highway & Industrial Smog': 'सघन मुख्य सड़क और औद्योगिक धुआँ',
  'Biomass Burning & Urban Stagnant Fog': 'बायोमास जलन और शहरी स्थिर कोहरा',
  'Tannery Industrial & Vehicular Smog': 'चर्म-उद्योग और वाहन धुआँ',
  'Unpaved Road Dust, Brick Kilns & Biomass Smoke': 'अपथीय सड़क धूल, ईंट भट्ठे और बायोमास धुआँ',
  'Traditional Biomass & Urban Congestion': 'पारंपरिक बायोमास और शहरी जाम',
  'Tourist Transit & Solid Fuel Emissions': 'पर्यटक यात्रा और ठोस ईंधन उत्सर्जन',
  'Agricultural Stubble & Highway Dust': 'कृषि पराली और हाईवे धूल',
  'Hosiery Dyeing, Diesel Generators & Crop Residue': 'वस्त्र रंगाई, डीज़ल जनरेटर और फसल अवशेष',
  'Shivalik Valley Cold Pool & Transit Dust': 'शिवालिक घाटी शीत कुंड और यात्रा धूल',
  'Paddy Residue & Border Smog Belt': 'धान अवशेष और सीमा धुआँ क्षेत्र',
  'Desert Mineral Dust & Vehicular Traffic': 'रेगिस्तानी खनिज धूल और वाहन यातायात',
  'Thar Fine Sand & Stone Processing Particulates': 'थार महीन रेत और पत्थर प्रसंस्करण कण',
  'Refinery, Construction Dust & Heavy Vehicular Congestion':
    'शोधक कारखाना, निर्माण धूल और भारी वाहन जाम',
  'Automobile Hub Exhaust & Road Dust': 'ऑटोमोबाइल केंद्र उत्सर्जन और सड़क धूल',
  'Thermal Power Plant & Freight Logistics': 'थर्मल पावर प्लांट और माल-भार लॉजिस्टिक्स',
  'Textile Processing & Chemical Corridor Particulates': 'वस्त्र प्रसंस्करण और रसायन गलियारा कण',
  'Diamond Processing & Synthetic Fiber Particulates': 'हीरा प्रसंस्करण और कृत्रिम रेशा कण',
  'Commercial Transit & Winter Fuel Wood': 'व्यापारिक यात्रा और सर्दी का ईंधन लकड़ी',
  'Heavy Industrial & Biomass Heating': 'भारी औद्योगिक और बायोमास हीटिंग',
  'Steel Rolling Mills & Sponge Iron Particulates': 'स्टील रोलिंग मिल और स्पंज आयरन कण',
  'Diesel Commercial Vehicles & Solid Fuel Chulhas': 'डीज़ल वाणिज्यिक वाहन और ठोस ईंधन चूल्हा',
  'Coal Mining Belt Dust & Biomass Smoke': 'कोयला खन पट्टी धूल और बायोमास धुआँ',
  'Urban Transit & Mining Freight Corridors': 'शहरी यात्रा और खन माल-भार गलियारे',
  'Valley Cold Fog & Hill Cutting Dust': 'घाटी शीत कोहरा और पहाड़ कटाई धूल',
  'Arterial Traffic Gridlock Particulates': 'मुख्य सड़क जाम के कण',
  'Harbor Freight & Vehicular Emissions': 'बंदरगाह माल-भार और वाहन उत्सर्जन',
  'Pharma Corridor & Ring Road Traffic': 'दवा गलियारा और रिंग रोड यातायात',
  'Steel Plant & Port Coal Handling Particulates': 'स्टील संयंत्र और बंदरगाह कोयला हैंडलिंग कण',
  'Coastal Ferry & Urban Island Congestion': 'तटीय फेरी और शहरी द्वीप जाम',
  'Clean Coastal Air & Low Particulates': 'स्वच्छ तटीय हवा और कम कण',
  'Engineering Foundries & Textile Dust': 'इंजीनियरिंग फाउंड्री और वस्त्र धूल',
  'Kangri Charcoal, Biomass Bukhari & Valley Inversion': 'कांगड़ी कोयला, बायोमास बुखारी और घाटी उलटना',
  'Valley Inversion, Wood Smoke & Tourist Traffic': 'घाटी उलटना, लकड़ी का धुआँ और पर्यटक यातायात',

  // ---- Vulnerable-group profiles ------------------------------------------
  'Toddlers & Infants': 'शिशु और बच्चे',
  'Elderly / Seniors': 'वरिष्ठ / बुज़ुर्ग',
  'Asthmatics & Respiratory': 'अस्थमा और श्वसन रोगी',
  'Outdoor Workers & Commuters': 'बाहरी कर्मचारी और यात्री',
  'Pets (Dogs & Cats)': 'पालतू जानवर (कुत्ते और बिल्लियाँ)',

  'Critical (3x higher breathing rate per kg than adults)':
    'गंभीर (प्रति किलो श्वसन दर वयस्कों से 3 गुना अधिक)',
  'High (Elevated cardiovascular and stroke risk from micro-emboli)':
    'उच्च (सूक्ष्म थक्कों से हृदय संवहनी और स्ट्रोक का बढ़ा जोखिम)',
  'Severe (Immediate bronchospasm trigger from PM2.5 and NO2)':
    'गंभीर (PM2.5 और NO2 से तुरंत ब्रोंकोस्पाज़्म)',
  'High cumulative exposure (8+ hours daily in urban air)':
    'उच्च संचयी संपर्क (शहरी हवा में रोज़ 8+ घंटे)',
  'Moderate to High (Animals lack nasal filtering for ultrafine dust)':
    'मध्यम से उच्च (जानवरों में अति-सूक्ष्म धूल के लिए नाकीय छानने की क्षमता नहीं)',

  'Keep indoor PM2.5 below 15 µg/m³ in nursery using DIY CR Box or HEPA':
    'DIY CR बॉक्स या HEPA की मदद से नर्सरी में घर का PM2.5 15 µg/m³ से नीचे रखें',
  'Never take stroller near heavy traffic corridors (strollers sit at exhaust tailpipe height)':
    'स्ट्रॉलर को भारी ट्रैफ़िक गलियारों के पास कभी न ले जाएँ (स्ट्रॉलर एक्ज़ॉस्ट पाइप की ऊँचाई पर रहता है)',
  'Avoid morning outdoor walks before 11:30 AM during winter inversion':
    'सर्दी की उलटना के दौरान सुबह 11:30 बजे से पहले बाहर टहलने से बचें',
  'Monitor blood pressure during severe winter smog episodes':
    'गंभीर सर्दी धुएँ के दौरान रक्तचाप पर नज़र रखें',
  'Replace morning brisk walks with gentle indoor stretching / yoga':
    'सुबह की तेज़ पैदल चाल को हल्की indoor stretching / योग से बदलें',
  'Maintain indoor relative humidity at 40-50% to prevent mucosal irritation':
    'श्लेष्मा झिल्ली की जलन रोकने के लिए घर की सापेक्ष आर्द्रता 40-50% रखें',
  'Keep rescue inhalers accessible at all times':
    'आपातकालीन इनहेलर हमेशा हाथ की पहुँच में रखें',
  'Run activated carbon filter alongside MERV 13 to adsorb winter NO2 & VOCs':
    'सर्दी के NO2 और VOCs को सोखने के लिए MERV 13 के साथ सक्रिय कार्बन फ़िल्टर भी चलाएँ',
  'Seal bedroom door gaps with damp towel or foam sweep during night inversion':
    'रात की उलटना के दौरान बेडरूम के दरवाज़े की दरारें गीले तौलिए या फ़ोम से भरें',
  'Wear tight-fitting N95 or FFP2 respirator with adjustable nose wire':
    'समायोज्य नाक-तार वाला टाइट-फिटिंग N95 या FFP2 रेस्पिरेटर पहनें',
  'Rinse nasal passages with saline mist post-shift to clear coarse particles':
    'शिफ्ट के बाद मोटे कण हटाने के लिए सेलाइन मिस्ट से नाक का धोना करें',
  'Switch from motorcycling / open auto-rickshaws to closed metro/buses during peaks':
    'चरम समय में मोटरसाइकिल या खुली ऑटो-रिक्शे से बंद मेट्रो/बस पर जाएँ',
  'Keep pets indoors during peak inversion hours':
    'चरम उलटना घंटों में पालतू जानवरों को घर के अंदर रखें',
  'Wipe paws and fur with damp cloth after walks to prevent grooming ingestion of soot':
    'टहलने के बाद पंजे और बाल गीले कपड़े से पोंछें ताकि सफ़ाई के समय कालिख न निगलें',
  'Limit high-intensity fetch/running games on lawns during high AQI hours':
    'उच्च AQI घंटों में बगीचे पर तेज़ दौड़-भाग वाले खेल सीमित रखें',
  'Shorten bathroom walks to 5-10 minutes during morning inversion peak':
    'सुबह की उलटना के चरम में बाहर निकलने का समय 5-10 मिनट तक सीमित रखें',
};

/**
 * Parenthetical suffixes that may trail a catalogue data string. They are
 * matched against the end of the string so the varying part (a time range,
 * for example) is preserved untouched.
 *
 * @type {Record<string, string>}
 */
const SUFFIX_PHRASES = {
  ' (Solar boundary layer rise)': ' (सौर सीमा परत का उठना)'
};

/**
 * Translate a catalogue data string into the requested language.
 *
 * @param {string} text English source string
 * @param {PhraseLanguage} [lang] target language, defaults to English
 * @returns {string} the Hindi translation when one exists, else `text`
 */
export function translatePhrase(text, lang = 'en') {
  if (lang !== 'hi') return text;
  if (typeof text !== 'string') return text;
  const hit = PHRASES[text];
  if (hit) return hit;
  for (const [suffix, translated] of Object.entries(SUFFIX_PHRASES)) {
    if (text.endsWith(suffix)) {
      return text.slice(0, text.length - suffix.length) + translated;
    }
  }
  return text;
}

/**
 * Translate a list of catalogue data strings.
 *
 * @param {string[]} list
 * @param {PhraseLanguage} [lang]
 * @returns {string[]}
 */
export function translatePhrases(list, lang = 'en') {
  if (!Array.isArray(list)) return list;
  return list.map((item) => translatePhrase(item, lang));
}
