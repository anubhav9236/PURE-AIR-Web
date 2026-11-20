/**
 * Offline clean-air knowledge base for PureAir Life.
 *
 * These routines are deterministic, evidence-grounded fallbacks used when the
 * GenAI provider is unreachable, misconfigured, or rate-limited. They are
 * explicitly labelled in the UI as "Local guide" rather than live AI output.
 *
 * All figures are reference estimates derived from published public-health
 * guidance (EPA AQI breakpoints, WHO PM2.5 guideline values, Berkeley Earth
 * cigarette-equivalence methodology). They are NOT live measurements.
 */

/**
 * Detect whether a string contains Devanagari (Hindi) characters.
 * @param {string} value
 * @returns {boolean}
 */
export function containsHindi(value) {
  if (typeof value !== 'string') return false;
  return /[\u0900-\u097F]/.test(value);
}

/**
 * Build a locale-aware label for the local guide.
 * @param {'en' | 'hi'} lang
 * @param {string} en
 * @param {string} hi
 * @returns {string}
 */
function t(lang, en, hi) {
  return lang === 'hi' ? hi : en;
}

/**
 * Offline daily routine tailored to the selected city.
 * @param {Object} profile
 * @param {Object} aqi
 * @param {'en' | 'hi'} [lang]
 * @returns {Object}
 */
export function generateLocalFallbackRoutine(profile, aqi, lang = 'en') {
  const isSevere = aqi.aqi > 250;
  const vulnerable = profile.vulnerabilities?.join(' & ') || t(lang, 'your family', 'आपका परिवार');
  const city = aqi.name || t(lang, 'your city', 'आपका शहर');
  const cigEquiv = Math.max(1, Math.round(((aqi.pm25 || 0) / 22) * 1.6));

  const summaryTitle = t(
    lang,
    `Winter Inversion Armor Routine for ${city} (AQI ${aqi.aqi})`,
    `${city} के लिए सर्दी के धुंध-धुंध विरोधी दिनचर्या (AQI ${aqi.aqi})`
  );

  const threatAnalysis = t(
    lang,
    `Ground-level radiative cooling in ${city} has formed a dense thermal inversion cap. Particulate matter PM2.5 is trapped below 200 m, presenting severe bronchial stress for ${vulnerable}.`,
    `${city} में ज़मीन के करीब की रात की ठंडक ने सघन थर्मल इनवर्जन कैप बना दिया है। PM2.5 कण 200 मीटर से नीचे ही फँस जाते हैं, जिससे ${vulnerable} को गंभीर श्वसन तनाव होता है।`
  );

  const timeBlocks = [
    {
      time: '06:30 - 08:45',
      phase: t(
        lang,
        'Severe Morning Inversion Trap & School Transit',
        'सुबह की गंभीर इनवर्जन ट्रैप और स्कूल की यात्रा'
      ),
      hazardLevel: isSevere
        ? t(lang, 'Extreme Hazard (AQI 320+)', 'अत्यधिक खतरा (AQI 320+)')
        : t(lang, 'High Hazard', 'उच्च खतरा'),
      action: t(
        lang,
        'Cancel all outdoor jogging and morning lawn walks. For school children, enforce certified KF94 or well-fitted small N95 respirators. Keep car HVAC strictly on internal recirculation.',
        'सुबह की दौड़ और बाहर की टहल निलंबित करें। बच्चों के लिए प्रमाणित KF94 या अच्छी फिट वाले छोटे N95 रेस्पिरेटर पहनाएँ। कार का HVAC पूरी तरह इंटर्नल रीसर्कुलेशन पर रखें।'
      ),
      iaqHack: t(
        lang,
        'Keep bedroom doors sealed and run your Corsi-Rosenthal box on medium-high to scrub overnight CO2 and ingress soot.',
        'कमरे के दरवाज़े सील रखें और कॉर्सी-रोज़ेंथल बॉक्स को मध्यम-उच्च पर चलाकर रातभर जमी CO2 और बाहर की गंद धुआँ साफ करें।'
      ),
      sustainableSwap: t(
        lang,
        'Carpool with two neighbouring families or board the school electric bus to eliminate four cold-start car emissions.',
        'दो पड़ोसी परिवारों के साथ कार-पूल करें या स्कूल की इलेक्ट्रिक बस लें, जिससे ठंडे मौसम की चार गाड़ियों के धुएँ बच जाते हैं।'
      ),
      directImpact: t(
        lang,
        `Prevents inhaling roughly ${(aqi.pm25 * 0.08).toFixed(1)} cigarette-equivalents of soot during the peak cold-cap window.`,
        `सबसे ज़हरीली ठंड-कैप अवधि में लगभग ${(aqi.pm25 * 0.08).toFixed(1)} सिगरेट-समकक्ष कण ऊँसने से बचाता है।`
      )
    },
    {
      time: '12:00 - 15:30',
      phase: t(
        lang,
        'Solar Boundary Layer Safe Dispersal Window',
        'धूप से बनी सुरक्षित हवा-प्रसार अवधि'
      ),
      hazardLevel: t(
        lang,
        'Low to Moderate (Optimal Window)',
        'कम से मध्यम (सर्वोत्तम अवधि)'
      ),
      action: t(
        lang,
        'This is your clean air activity window. Solar radiation has broken the ground temperature inversion, lifting the atmospheric lid. Run grocery errands and let children engage in moderate outdoor play.',
        'यह आपकी स्वच्छ गतिविधि की अवधि है। सूर्य की किरणों से ज़मीन की गर्मी की उलटी स्थिति टूट गई है और वायुमंडल की ऊपरी सील हट गई है। किराने का काम करें और बच्चों को बीच के समय खुले में खेलने दें।'
      ),
      iaqHack: t(
        lang,
        'Perform a 15-minute rapid cross-ventilation flush by opening opposing windows, then reseal tightly before 4 PM.',
        'आमने-सामने की खिड़कियाँ खोलकर 15 मिनट तेज़ी से हवा बदलें, फिर शाम 4 बजे से पहले कसकर सील कर दें।'
      ),
      sustainableSwap: t(
        lang,
        'Walk or ride a metro train for local errands while sunlight keeps surface air dispersed.',
        'धूप में ज़मीन की हवा फैली रहती है, इसलिए स्थानीय कामों के लिए पैदल या मेट्रो से जाएँ।'
      ),
      directImpact: t(
        lang,
        'Flushes indoor stale carbon dioxide below 800 ppm without pulling in dense evening smog.',
        'शाम की घने धुएँ को अंदर आने दिए बिना घर की पुरानी CO2 को 800 ppm से नीचे लाता है।'
      )
    },
    {
      time: '17:30 - 20:30',
      phase: t(
        lang,
        'Evening Temperature Inversion & Commute Rebound',
        'शाम का तापमान उलटना और यात्रा का दोबारा बढ़ना'
      ),
      hazardLevel: t(
        lang,
        'Severe Smog Rebound',
        'गंभीर धुएँ की वापसी'
      ),
      action: t(
        lang,
        'Commute home with windows rolled completely up. As soon as you enter, take off outdoor shoes at the door, rinse eyes with saline mist, and change into clean indoor clothes.',
        'घर आते समय खिड़कियाँ पूरी तरह बंद रखें। घर में आते ही दरवाज़े पर बाहर के जूते उतारें, आँखों को नमक पानी के मिस्ट से धोएँ और साफ़ कपड़े पहनें।'
      ),
      iaqHack: t(
        lang,
        'Place a damp threshold towel under your main front door to stop corridor soot being sucked in by hallway drafts.',
        'मुख्य दरवाज़े की चौखट के नीचे गीला तौलिया रखें ताकि गलियारे की हवा बाहर की गंद को अंदर न खींचे।'
      ),
      sustainableSwap: t(
        lang,
        'Take the electrified rapid metro rather than idling in bumper-to-bumper vehicle exhaust on ring roads.',
        'रिंग रोड पर जाम में खड़े वाहनों के धुएँ से बचने के लिए इलेक्ट्रिक मेट्रो का इस्तेमाल करें।'
      ),
      directImpact: t(
        lang,
        'Metro transit saves about 2.8 kg of neighbourhood tailpipe CO2 and avoids roadside ultrafine black carbon.',
        'मेट्रो से यात्रा करने से हर दिन लगभग 2.8 किग्रा CO2 बचती है और सड़क किनारे की सूक्ष्म काली कार्बन से बचाव होता है।'
      )
    },
    {
      time: '20:30 - 22:30',
      phase: t(
        lang,
        'Low-Emission Cooking & Overnight Bedroom Seal',
        'कम-प्रदूषण रसोई और रात भर के कमरे की सील'
      ),
      hazardLevel: t(
        lang,
        'Controlled Indoor Air',
        'नियंत्रित indoor हवा'
      ),
      action: t(
        lang,
        'Cook with lids tightly on pans; avoid dry roasting chilies or high-smoke oil tadka without active exterior extraction.',
        'बर्तनों पर ढक्कन रखकर खाना बनाएँ; बिना बाहरी निकासी के सूखी मसाला भूनना या तेल का तड़का बचाएँ।'
      ),
      iaqHack: t(
        lang,
        'Position your air purifier or Corsi-Rosenthal box about 90 cm away from walls and at bed height for optimal breathing-zone recirculation.',
        'एयर प्यूरीफायर या कॉर्सी-रोज़ेंथल बॉक्स को दीवारों से लगभग 90 सेमी दूर और बिस्तर की ऊँचाई पर रखें ताकि साँस लेने की जगह तक साफ़ हवा पहुँचे।'
      ),
      sustainableSwap: t(
        lang,
        'Switch from LPG or biomass heating to a portable induction cooktop and electric oil-radiator heater.',
        'एलपीजी या जैव-मात्रा ईंधन की जगह पोर्टेबल इंडक्शन कुकर और इलेक्ट्रिक ऑयल-रेडिएटर हीटर अपनाएँ।'
      ),
      directImpact: t(
        lang,
        'Keeps sleeping-room PM2.5 below 15 µg/m³ through the night, avoiding overnight cardiovascular strain.',
        'रातभर सोने वाले कमरे का PM2.5 15 µg/m³ से नीचे रखता है, जिससे रात की दिल की धड़कन पर भार नहीं पड़ता।'
      )
    }
  ];

  return {
    summaryTitle,
    threatAnalysis,
    timeBlocks,
    directImpactStatement: t(
      lang,
      `Following today's schedule keeps your family from inhaling the equivalent of about ${cigEquiv} cigarettes a day, while avoiding roughly 3.8 kg of neighbourhood vehicle soot through cleaner transit choices.`,
      `आज की दिनचर्या से आपका परिवार लगभग ${cigEquiv} सिगरेट-समकक्ष धुएँ से बचता है और साफ़ यात्रा के चुनावों से लगभग 3.8 किग्रा वाहन CO2 बचाता है।`
    ),
    emergencyActionAlert: t(
      lang,
      'If the morning AQI breaches 400, shift school routines to remote study and run all indoor filtration on continuous high.',
      'यदि सुबह का AQI 400 पार कर जाए, तो स्कूल की रोटीन बदलकर ऑनलाइन पढ़ाई कराएँ और घर की सभी फ़िल्टरिंग लगातार चालू रखें।'
    ),
    source: 'fallback'
  };
}

/**
 * Offline room IAQ audit.
 * @param {string} roomType
 * @param {string} notes
 * @param {'en' | 'hi'} [lang]
 * @returns {Object}
 */
export function generateLocalFallbackVisionAudit(roomType, notes, lang = 'en') {
  return {
    roomDetected:
      roomType || t(lang, 'Living room / bedroom window & ventilation area', 'बैठक / बेडरूम की खिड़की और हवा का क्षेत्र'),
    leakageRiskScore: 74,
    primaryVulnerabilities: [
      t(
        lang,
        'Unsealed window frame perimeter leaking cold, particle-laden air under thermal pressure',
        'किनारों पर सील न होने से थर्मल दबाव के कारण ठंडी, कण-युक्त हवा अंदर आ रही है'
      ),
      t(
        lang,
        'Air purifier positioned flush against a corner wall, cutting clean air recirculation CADR by roughly 40%',
        'एयर प्यूरीफायर कोने की दीवार से सटा रखा है, जिससे साफ़ हवा का परिसंचरण लगभग 40% घट रहा है'
      ),
      t(
        lang,
        'Gap beneath the main entrance door allowing corridor dust and ambient smog ingress',
        'मुख्य दरवाज़े के नीचे खाली जगह से गलियारे की धूल और बाहर का धुआँ अंदर आ रहा है'
      )
    ],
    stepByStepFixes: [
      {
        step: 1,
        title: t(
          lang,
          'Draft stoppage with adhesive foam weatherstrip',
          'फोम वेदरस्ट्रिप से हवा का रास्ता बंद करें'
        ),
        diyFix: t(
          lang,
          'Apply 6 mm high-density weatherstrip foam tape along the sliding window sash contact points.',
          'स्लाइडिंग खिड़की के रिम के संपर्क बिंदुओं पर 6 मिमी ऊँचा घना वेदरस्ट्रिप फोम टेप लगाएँ।'
        ),
        estimatedCostUsd: 4,
        pmReductionPercent: 32
      },
      {
        step: 2,
        title: t(
          lang,
          'Thermal bubble-wrap glazing hack',
          'बुलबुला रैपर से थर्मल ग्लेज़िंग का फ़ायदा'
        ),
        diyFix: t(
          lang,
          'Lightly mist single-pane glass with water and press clean bubble wrap (bubbles facing the glass). It acts as double glazing, stopping drafts and condensation.',
          'एकल-काँच की खिड़की पर हल्का पानी छिड़कें और साफ़ बुलबुला रैपर (बुलबुले काँच की ओर) चिपकाएँ। यह डबल-ग्लेज़िंग जैसा काम करता है और हवा व ओसीफ़रन रोकता है।'
        ),
        estimatedCostUsd: 3,
        pmReductionPercent: 22
      },
      {
        step: 3,
        title: t(
          lang,
          'Reposition filter to the central breathing zone',
          'फ़िल्टर को साँस की मुख्य ज़zone में रखें'
        ),
        diyFix: t(
          lang,
          'Pull your air purifier or Corsi-Rosenthal box about 90 cm away from walls and obstructions. Aim the airflow diagonally across the room for convective mixing.',
          'एयर प्यूरीफायर या कॉर्सी-रोज़ेंथल बॉक्स को दीवारों से लगभग 90 सेमी दूर करें। हवा को कमरे में तिरछी दिशा में चलाएँ ताकि अच्छा मिश्रण हो।'
        ),
        estimatedCostUsd: 0,
        pmReductionPercent: 28
      }
    ],
    airPurifierPlacementAdvice: t(
      lang,
      'Elevate the purifier about 45 cm off the floor so it captures suspended winter aerosols instead of kicking up heavy carpet dust.',
      'प्यूरीफायर को फ़र्श से लगभग 45 सेमी ऊपर रखें ताकि वह भरमली उड़ती धूल नहीं उठाता बल्कि बीच में तैरते कण पकड़े।'
    ),
    cleanAirDeliveryImpact: t(
      lang,
      'Expected indoor PM2.5 drop from roughly 180 µg/m³ to under 22 µg/m³ within 45 minutes of sealing and correct filter placement.',
      'सील करने और फ़िल्टर सही जगह रखने के 45 मिनट के भीतर घर का PM2.5 लगभग 180 µg/m³ से घटकर 22 µg/m³ से नीचे आने की उम्मीद है।'
    ),
    source: 'fallback'
  };
}

/**
 * Offline conversational guide with bilingual coverage.
 * @param {string} query
 * @param {Object|null} hotspot
 * @param {'en' | 'hi'} [lang]
 * @returns {string}
 */
export function generateLocalFallbackChat(query, hotspot, lang = 'en') {
  const q = String(query || '');
  const qLower = q.toLowerCase();
  const isHindi = lang === 'hi' || containsHindi(q);
  const city = hotspot?.name || t(isHindi ? 'hi' : 'en', 'your city', 'आपका शहर');
  const aqi = hotspot?.aqi ?? '300+';

  if (
    qLower.includes('dog') ||
    qLower.includes('pet') ||
    qLower.includes('कुत्ता') ||
    qLower.includes('पालतू')
  ) {
    return isHindi
      ? `${city} में गंभीर सर्दी के धुएँ (AQI ${aqi}) के दौरान कुत्ते की सैर को सुरक्षित अवधि (12:00 - 15:00) में 5-10 मिनट तक रखें। कुत्ते धरातल के करीब साँस लेते हैं जहाँ भारी कण जमा होते हैं। घर आने पर पंजों और बालों को गीले कपड़े से पोंछें ताकि चलते-फिरते वे ज़हरीला कण न निगलें।`
      : `During high winter smog in ${city} (AQI ${aqi}), shorten dog walks to 5-10 minutes during the midday safe window (12:00 - 15:00). Dogs breathe closer to the ground where heavy particulates settle and lack deep nasal mucus filters. Always wipe their paws and coat with a damp washcloth after coming inside so they do not ingest toxic soot while grooming.`;
  }

  if (
    qLower.includes('mask') ||
    qLower.includes('kid') ||
    qLower.includes('child') ||
    qLower.includes('toddler') ||
    qLower.includes('मास्क') ||
    qLower.includes('बच्च')
  ) {
    return isHindi
      ? `बच्चों के लिए सामान्य कपड़े या सर्जिकल मास्क PM2.5 के विरुद्ध लगभग 0% सुरक्षा देते हैं। बाल-चिकित्सा प्रमाणित KF94 या छोटे N95 रेस्पिरेटर इस्तेमाल करें जिनमें समायोज्य नाक-क्लिप और सिर की पट्टी हो। गाल और ठोड़ी के पास हवा न रिसे। 2 साल से छोटे बच्चों को मास्क सांस लेने में बाधा बन सकता है — उन्हें चलता हुआ एयर प्यूरीफायर वाले कमरे में रखें।`
      : `For children, standard cloth and surgical masks offer virtually 0% protection against ultrafine PM2.5. Use paediatric-certified KF94 or small-profile N95 respirators with an adjustable nose clip and head straps, and check for air leaking near the cheeks or chin. A mask is a suffocation risk for children under 2 years old - keep them in a room with a running HEPA or Corsi-Rosenthal purifier instead.`;
  }

  if (
    qLower.includes('cook') ||
    qLower.includes('kitchen') ||
    qLower.includes('food') ||
    qLower.includes('tadka') ||
    qLower.includes('रसोई') ||
    qLower.includes('खाना')
  ) {
    return isHindi
      ? `बंद कमरों में तेज़ आँच पर खाना बनाने और तड़का लगाने से PM2.5 450 µg/m³ से ज़्यादा हो सकता है। 1) सूखी मसाला भूनना और खुले तेल में गहरा तलना बचाएँ। 2) ढके पकाने, प्रेशर कुकर या उबालना अपनाएँ। 3) रसोई का एग्ज़ॉस्ट हमेशा चालू रखें। यदि एग्ज़ॉस्ट नहीं है, तो खिड़की के पास आउटवर्ड बॉक्स फ़ैन के साथ पोर्टेबल इंडक्शन कुकर का उपयोग करें।`
      : `High-heat cooking and tadka in closed winter rooms create internal PM2.5 spikes exceeding 450 µg/m³. 1) Avoid dry roasting spices and open high-heat deep frying in closed rooms. 2) Switch to covered steaming, pressure cooking or boiling. 3) Always run your kitchen exhaust on maximum. Without an exhaust, use a portable induction cooktop next to an open window fitted with an outward box fan.`;
  }

  if (
    qLower.includes('corsi') ||
    qLower.includes('cr box') ||
    qLower.includes('filter') ||
    qLower.includes('diy') ||
    qLower.includes('कॉर्सी') ||
    qLower.includes('फ़िल्टर')
  ) {
    return isHindi
      ? `कॉर्सी-रोज़ेंथल (CR) बॉक्स 20-इंच का बॉक्स फ़ैन और 4-5 MERV 13 फ़र्नेस फ़िल्टर (20"x20"x2" या 1") टेप से जोड़कर बनाया जाता है। फ़ैन के सामने 15-इंच खुला वाला गोल कार्डबोर्ड शील्ड लगाने से हवा की दक्षता लगभग 35% बढ़ जाती है। यह लगभग 600-750 CFM CADR देता है और लागत लगभग ₹4,500 (~$65) है, जो ₹35,000+ के वाणिज्यिक HEPA प्यूरीफायर से सस्ता और प्रभावी है।`
      : `A Corsi-Rosenthal (CR) box is built using a 20-inch box fan and 4 or 5 MERV 13 furnace filters (20"x20"x2" or 1") taped together with duct tape. Adding a circular cardboard shroud with a 15-inch opening over the fan face boosts airflow efficiency by about 35%. It delivers roughly 600-750 CFM CADR for around ₹4,500 (~$65), outperforming commercial HEPA purifiers that cost ₹35,000+.`;
  }

  if (qLower.includes('transport') || qLower.includes('travel') || qLower.includes('यातायात') || qLower.includes('यात्रा')) {
    return isHindi
      ? `परिवहन के कम-प्रदूषण विकल्प, घटते क्रम में: मेट्रो/मेट्रो-लाइट रेल, साइकिल या पैदल यात्रा, बस, EV (इलेक्ट्रिक वाहन), कारपूल, और सबसे आख़िर में एकल-यात्री कार (जहाँ दो-चक्र वाहन और सार्वजनिक परिवहन न हो)। गैसोलिन की कार की तुलना में EV हर किलोमीटर पर लगभग 40-60% कम ग्रीनहाउस गैस उत्सर्जित करता है, और मेट्रो वाहनों की तुलना में सबसे कम प्रदूषण करती है।`
      : `Lowest-emission transport options, in order: metro or metro-rail, walking and cycling, bus, electric vehicles, car-pooling, and single-occupant petrol cars only as a last resort. An EV emits roughly 40-60% less greenhouse gas per kilometre than a petrol car, and public transport beats private vehicles for both carbon and local particulate exposure.`;
  }

  return isHindi
    ? `भारत में सर्दी के धुएँ को थर्मल इनवर्जन कई गुना बढ़ा देता है: ठंडी रात की हवा गर्म ऊपरी परत के नीचे बंद रहती है, जिससे वाहनों और जैव-मात्रा के धुएँ को ऊपर जाने नहीं देती। सबसे सुरक्षित बाहरी समय दोपहर 12:00 से 3:30 बजे तक है, जब सूर्य की गर्मी बॉउंडरी लेयर को फैला देती है। घर की हवा साफ़ रखने के लिए खिड़की की दरारें सील करें, MERV 13 फ़िल्टर चलाएँ, और लकड़ी या कोयले की चूल्हे/आंगीठी से बचें।`
    : `Winter smog in India is intensified by thermal inversions: cold night air gets trapped under a warm upper layer across the Indo-Gangetic plain and river basins, preventing vehicular and biomass pollution from rising. The safest outdoor hours are between 12:00 PM and 3:30 PM, when solar heat expands the boundary layer. Keep indoor air clean by sealing drafty window cracks, running MERV 13 filtration, and avoiding indoor smoke from wood, coal or angithis stoves.`;
}
