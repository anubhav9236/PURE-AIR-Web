/**
 * The three product workflows: the smog-armour routine, the room vision audit
 * and the conversational assistant.
 *
 * Every workflow degrades to the offline clean-air guide rather than failing,
 * and reports which source the answer came from.
 */

import {
  generateLocalFallbackRoutine,
  generateLocalFallbackVisionAudit,
  generateLocalFallbackChat,
  containsHindi
} from '../localGuide.js';
import { MAX_QUERY_CHARS, sanitizePromptField, sanitizeUserInput } from './sanitize.js';
import { GeminiUnavailableError, callGeminiApi } from './transport.js';
import { parseModelJson, validateRoutine, validateVisionAudit } from './validation.js';

/**
 * Generate a personalised low-emission daily routine.
 *
 * @param {Object} familyProfile
 * @param {Object} aqiData
 * @param {'en' | 'hi'} [lang]
 * @returns {Promise<Object>} routine with `source` ('live' | 'fallback')
 */
export async function generateSmogArmorRoutine(familyProfile, aqiData, lang = 'en') {
  const languageInstruction =
    lang === 'hi'
      ? 'Write every field in natural, simple Hindi (Devanagari script). Keep brand names and units in English.'
      : 'Write every field in clear, simple English suitable for a non-technical reader.';

  const systemPrompt = `You are PureAir Life's chief environmental pulmonologist and sustainable living architect.
Formulate an optimized, hour-by-hour winter smog navigation schedule for urban families facing severe air pollution and thermal inversions in India.
Recommend low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices.
${languageInstruction}
Return ONLY valid JSON without markdown wrapping or backticks.`;

  const city = sanitizePromptField(aqiData?.name, 80);
  const state = sanitizePromptField(aqiData?.state, 60);
  const vulnerabilities = Array.isArray(familyProfile?.vulnerabilities)
    ? familyProfile.vulnerabilities.map((v) => sanitizePromptField(v, 60)).filter(Boolean)
    : [];

  const userPrompt = `
Generate a structured winter smog survival & low-emission daily routine for this family in India:
- City: ${city} (${state || 'India'})
- Current AQI: ${Number(aqiData?.aqi) || 0} (Status: ${sanitizePromptField(aqiData?.status, 60)})
- PM2.5 Level: ${Number(aqiData?.pm25) || 0} µg/m³
- Thermal Inversion: ${sanitizePromptField(aqiData?.inversionStrength, 60)}
- Peak Smog Hours: ${sanitizePromptField(aqiData?.peakSmogHours, 60)}
- Safe Diurnal Window: ${sanitizePromptField(aqiData?.safeWindow, 60)}
- Family Composition: ${Number(familyProfile?.adults) || 0} adults, ${Number(familyProfile?.children) || 0} children, ${Number(familyProfile?.elderly) || 0} elderly members
- Vulnerability Focus: ${vulnerabilities.join(', ') || 'General urban smog protection'}
- Primary Commute: ${sanitizePromptField(familyProfile?.commuteMode, 60)} (typical distance: ${Number(familyProfile?.commuteDistance) || 0} km)
- Home Heating Source: ${sanitizePromptField(familyProfile?.heatingType, 60)}
- Cooking Style: ${sanitizePromptField(familyProfile?.cookingStyle, 60)}

Return JSON with this exact structure:
{
  "summaryTitle": "Catchy headline for today's routine",
  "threatAnalysis": "2 sentences explaining today's atmospheric inversion trap and risk to their specific family members",
  "timeBlocks": [
    {
      "time": "06:30 - 08:30",
      "phase": "Morning Inversion Trap & School Run",
      "hazardLevel": "Extreme",
      "action": "Specific routine recommendation",
      "iaqHack": "Indoor hack or seal instruction",
      "sustainableSwap": "Clean alternative choice",
      "directImpact": "Specific biological or environmental consequence explained simply"
    }
  ],
  "directImpactStatement": "Quantified summary of avoided particulate inhalation (e.g. cigarette equivalents avoided and carbon reduced)",
  "emergencyActionAlert": "One crucial safety directive for today"
}`;

  try {
    const result = await callGeminiApi({
      prompt: userPrompt,
      systemInstruction: systemPrompt
    });
    const parsed = parseModelJson(result.text);
    const routine = validateRoutine(parsed);
    if (!routine)
      throw new GeminiUnavailableError('invalid_response', 'Malformed routine payload.');
    return { ...routine, source: 'live', model: result.model };
  } catch {
    return generateLocalFallbackRoutine(familyProfile, aqiData, lang);
  }
}

/**
 * Read the MIME type out of a `data:` URL so the provider is told the real
 * image format. Falls back to JPEG, which is what the browser re-encodes to.
 *
 * @param {string|null} dataUrl
 * @returns {string}
 */
export function detectImageMimeType(dataUrl) {
  if (typeof dataUrl !== 'string') return 'image/jpeg';
  const match = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(dataUrl.trim());
  return match ? match[1].toLowerCase() : 'image/jpeg';
}

/**
 * Analyse a room photo for particulate leakage and DIY fixes.
 *
 * @param {string|null} imageBase64
 * @param {string} roomType
 * @param {string} userNotes
 * @param {'en' | 'hi'} [lang]
 * @param {import('../../types').CityRecord|null} [context] City baseline used to ground the analysis
 * @returns {Promise<Object>} audit with `source` ('live' | 'fallback')
 */
export async function analyzeRoomIAQ(
  imageBase64,
  roomType,
  userNotes,
  lang = 'en',
  context = null
) {
  const languageInstruction =
    lang === 'hi'
      ? 'Write every field in natural, simple Hindi (Devanagari script). Keep brand names and units in English.'
      : 'Write every field in clear, simple English.';

  const systemPrompt = `You are PureAir Life's computer vision indoor air quality and building envelope auditor.
Analyze user-submitted room photos, window seals, kitchen ventilation, or DIY air purifiers in Indian winter environments.
Detect particulate leakage paths, unsealed window frames, improper air purifier placement (flush against walls), and indoor combustion sources.
Provide high-impact, low-cost DIY fixes (Corsi-Rosenthal boxes, weatherstripping, window bubble insulation).
${languageInstruction}
Return ONLY valid JSON without markdown wrapping.`;

  const cityContext = context
    ? `Outside reference baseline for ${sanitizePromptField(context.name, 80)}: PM2.5 ${Number(context.pm25) || 0} µg/m³ (AQI ${Number(context.aqi) || 0}), ${sanitizePromptField(context.inversionStrength, 60)}. Use it to judge how severe the outdoor infiltration load on this room is.`
    : 'No city baseline was selected; assess the room on its own merits.';

  const userPrompt = `
Analyze this room setup for air pollution ingress and indoor air circulation:
- Room Type: ${sanitizePromptField(roomType, 80) || 'Living Room / Bedroom'}
- User Notes: ${sanitizePromptField(userNotes, 600) || 'Looking for particulate leaks, draft entry points, and purifier optimization'}
- ${cityContext}

Return JSON with this structure:
{
  "roomDetected": "Identified room or fixture",
  "leakageRiskScore": 65,
  "primaryVulnerabilities": ["Vulnerability 1", "Vulnerability 2", "Vulnerability 3"],
  "stepByStepFixes": [
    {
      "step": 1,
      "title": "Fix title",
      "diyFix": "Exact how-to instructions with materials needed",
      "estimatedCostUsd": 5,
      "pmReductionPercent": 35
    }
  ],
  "airPurifierPlacementAdvice": "Advice on where to position the filter or DIY box fan relative to breathing height and airflow drafts",
  "cleanAirDeliveryImpact": "Expected PM2.5 reduction in µg/m³"
}`;

  try {
    const result = await callGeminiApi({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      imageBase64,
      mimeType: detectImageMimeType(imageBase64)
    });
    const parsed = parseModelJson(result.text);
    const audit = validateVisionAudit(parsed);
    if (!audit) throw new GeminiUnavailableError('invalid_response', 'Malformed audit payload.');
    return { ...audit, source: 'live', model: result.model };
  } catch {
    return generateLocalFallbackVisionAudit(roomType, userNotes, lang);
  }
}

/**
 * Conversational clean-air companion.
 *
 * @param {string} query
 * @param {Array<{role: string, text: string}>} [history]
 * @param {Object|null} [hotspot]
 * @param {'en' | 'hi'} [lang]
 * @returns {Promise<{ text: string, source: 'live' | 'fallback', model?: string }>}
 */
export async function askSmogAssistant(query, history = [], hotspot = null, lang = 'en') {
  const cleanQuery = sanitizeUserInput(query, MAX_QUERY_CHARS);
  if (!cleanQuery) {
    return {
      text:
        lang === 'hi'
          ? 'कृपया अपना सवाल लिखें, और मैं आपको सर्दी के धुएँ से बचने के व्यावहारिक सुझाव दूँगा।'
          : 'Please type your question and I will give you practical smog-protection guidance.',
      source: 'fallback'
    };
  }

  const answerInHindi = lang === 'hi' || containsHindi(cleanQuery);

  const languageInstruction = answerInHindi
    ? 'Answer in natural, simple Hindi using the Devanagari script. Keep units, brand names and pollutant names in English. If the user asked in English, still answer in the language they used.'
    : 'Answer in clear, simple English. If the user wrote in Hindi, reply in Hindi using Devanagari.';

  const cityContext = hotspot
    ? `${sanitizePromptField(hotspot.name, 80)} (${sanitizePromptField(hotspot.state, 60)}), AQI ${Number(hotspot.aqi) || 0} (${sanitizePromptField(hotspot.status, 60)}), PM2.5 ${Number(hotspot.pm25) || 0} µg/m³, inversion ${sanitizePromptField(hotspot.inversionStrength, 60)}, peak smog ${sanitizePromptField(hotspot.peakSmogHours, 60)}, safe window ${sanitizePromptField(hotspot.safeWindow, 60)}`
    : 'an Indian urban hotspot';

  const systemInstruction = `You are the PureAir Life Assistant, an empathetic, science-backed pulmonology and atmospheric physics companion for families navigating winter air pollution across India.
Your mission:
1. Protect children, elderly, and asthmatic family members from severe winter smog.
2. Provide hyper-practical advice: paediatric mask fit, Corsi-Rosenthal DIY box building, thermal inversion explanations, low-emission cooking, and boundary layer timing.
3. Clearly explain the direct biological impact of their choices in simple, encouraging language.
4. Never invent live AQI readings, station data, or statistics. If you do not have live data, say so plainly and give general guidance instead.
5. Give health advice responsibly: recommend professional medical care for symptoms such as breathlessness, chest pain or asthma attacks, and never replace a doctor's guidance.
Current city context (reference baseline, not a live measurement): ${cityContext}.
${languageInstruction}
Keep responses structured, concise and actionable. Use short bullet points where appropriate.`;

  const safeHistory = Array.isArray(history)
    ? history
        .filter((turn) => turn && typeof turn.text === 'string')
        .slice(-8)
        .map((turn) => ({
          role: turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user',
          text: sanitizeUserInput(turn.text, 2000)
        }))
        .filter((turn) => turn.text.length > 0)
    : [];

  try {
    const result = await callGeminiApi({
      prompt: cleanQuery,
      systemInstruction,
      history: safeHistory
    });
    const text = result.text.trim();
    if (!text) throw new GeminiUnavailableError('empty_response', 'Empty model response.');
    return { text, source: 'live', model: result.model };
  } catch {
    return {
      text: generateLocalFallbackChat(cleanQuery, hotspot, answerInHindi ? 'hi' : 'en'),
      source: 'fallback'
    };
  }
}

export { containsHindi };
