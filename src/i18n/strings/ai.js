/**
 * AI provider status: honest live/offline wording and key management.
 */

/** @type {Record<string, { en: string, hi: string }>} */
export const aiStrings = {
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
  }

  // ---- Dashboard --------------------------------------------------------
};
