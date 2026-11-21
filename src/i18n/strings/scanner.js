/**
 * Room Vision Auditor: photo upload, context inputs and the audit report.
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const scannerStrings = {
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
    hi: 'साँस की ज़ोन में सही जगह'
  },
  'scanner.expected': { en: 'Expected improvement', hi: 'अपेक्षित सुधार' },

  // ---- Hack Lab ---------------------------------------------------------
};
