/**
 * DIY Hack Lab: Corsi-Rosenthal simulator and the hack catalogue.
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const hacklabStrings = {
  'hacklab.badge': {
    en: 'Indoor air science & engineering lab',
    hi: 'इनडोर हवा विज्ञान और इंजीनियरिंग प्रयोगशाला'
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
    hi: 'पीछे की ओर घूमने वाले व्हर्लपूल बैकफ़्लो को रोकता है'
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
    hi: 'आपके शहर के आधार पर इनडोर सांद्रण'
  },
  'hacklab.cityExplainer': {
    en: 'A single-zone outdoor-air mass balance: how much PM2.5 stays indoors at your outdoor baseline, with and without the simulated filtration.',
    hi: 'एकल-ज़ोन बाहरी-हवा द्रव्यमान संतुलन: आपके बाहरी आधार पर इनडोर PM2.5 कितना रहेगा, सिमुलेटेड फ़िल्टर के साथ और बिना।'
  },
  'hacklab.sealLevel': { en: 'Room sealing condition', hi: 'कमरे की सील की स्थिति' },
  'hacklab.sealSealed': { en: 'Fully sealed', hi: 'पूरी तरह सील' },
  'hacklab.sealStripped': { en: 'Weatherstripped', hi: 'वेदरस्ट्रिप लगा' },
  'hacklab.sealDrafty': { en: 'Drafty (typical)', hi: 'हवादार (सामान्य)' },
  'hacklab.sealUnsealed': { en: 'Unsealed / broken', hi: 'बिना सील / टूटी हुई' },
  'hacklab.outdoorBaseline': { en: 'Outdoor baseline', hi: 'बाहरी आधार' },
  'hacklab.withoutFiltration': { en: 'Indoor, unfiltered', hi: 'इनडोर, बिना फ़िल्टर' },
  'hacklab.withFiltration': { en: 'Indoor, filtered', hi: 'इनडोर, फ़िल्टर के साथ' },
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
    hi: 'बिल्डिंग साइंस के शोधकर्ताओं द्वारा सिद्ध कम-लागत उपाय जो कण रिसाव और इनडोर दहन के उछाल रोकते हैं।'
  },
  'hacklab.materials': { en: 'Materials', hi: 'सामग्री' },

  // ---- Impact ledger ----------------------------------------------------
  'hacklab.title': { en: 'DIY Indoor Air Hack Lab', hi: 'डीआईवाई इनडोर एयर हैक लैब' },
  'hacklab.filterType': { en: 'Filter class', hi: 'फ़िल्टर श्रेणी' },
  'hacklab.fanType': { en: 'Fan class', hi: 'फ़ैन श्रेणी' },
  'hacklab.roomSize': { en: 'Room size', hi: 'कमरे का आकार' },
  'hacklab.calculate': { en: 'Recalculate', hi: 'फिर से गणना करें' },
  'hacklab.cadr': { en: 'Effective CADR', hi: 'प्रभावी CADR' },
  'hacklab.ach': { en: 'Air changes per hour', hi: 'प्रति घंटा हवा परिवर्तन' },
  'hacklab.clearance': { en: 'Time to clear 90%', hi: '90% साफ़ होने का समय' },
  'hacklab.roomBaseline': { en: 'Your city baseline', hi: 'आपके शहर का आधार' },
  'hacklab.leakage': { en: 'Sealed room', hi: 'सीलबंद कमरा' }

  // ---- Impact ledger ----------------------------------------------------
};
