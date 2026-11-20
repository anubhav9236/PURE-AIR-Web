/**
 * GenAI service for PureAir Life.
 *
 * SECURITY MODEL
 * --------------
 * The Google Gemini API key is NEVER embedded in this bundle. The browser
 * talks to the same-origin `/api/gemini` endpoint, and the Node server
 * (`server/geminiProxy.js`) attaches the credential from the environment.
 *
 * Fallback order:
 *   1. Same-origin server proxy  -> key stays on the server (recommended)
 *   2. Direct browser call       -> only when the user supplies their own key
 *                                    for this browser session (sessionStorage)
 *   3. Offline clean-air guide   -> deterministic, clearly labelled as such
 *
 * Every public helper returns a `source` field so the UI can state honestly
 * whether an answer came from the live model or the local guide.
 */

import {
  generateLocalFallbackRoutine,
  generateLocalFallbackVisionAudit,
  generateLocalFallbackChat,
  containsHindi
} from './localGuide.js';

const PROXY_ENDPOINT = '/api/gemini';
/**
 * Provider status is a `GET` on the same path as the proxy, so a single
 * serverless function (Vercel) or a single Node route covers the whole API.
 * The legacy `GET /api/gemini/status` path is still accepted server-side.
 */
const STATUS_ENDPOINT = '/api/gemini';
const CLIENT_KEY_STORAGE = 'pureair.geminiKey';

const MAX_QUERY_CHARS = 1000;
const MAX_PROMPT_CHARS = 12000;

/** Minimum spacing between outbound requests (client-side politeness). */
const MIN_REQUEST_INTERVAL_MS = 600;

let lastApiCallTimestamp = 0;

/**
 * Error type carrying a machine-readable reason so callers can distinguish
 * "provider down" from "proxy not deployed" from "rate limited".
 */
export class GeminiUnavailableError extends Error {
  /**
   * @param {string} reason
   * @param {string} message
   */
  constructor(reason, message) {
    super(message);
    this.name = 'GeminiUnavailableError';
    this.reason = reason;
  }
}

/* ------------------------------------------------------------------ *
 * Client-supplied key handling (opt-in, session scoped, never persisted)
 * ------------------------------------------------------------------ */

/**
 * @returns {string} The user's own key for this browser session, if any.
 */
export function getClientSuppliedKey() {
  try {
    return sessionStorage.getItem(CLIENT_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

/**
 * Store a user-supplied key for this browser session only.
 * @param {string} key
 * @returns {boolean} success
 */
export function setClientSuppliedKey(key) {
  const value = String(key || '').trim();
  if (value.length < 20) return false;
  try {
    sessionStorage.setItem(CLIENT_KEY_STORAGE, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove any user-supplied key from this session.
 */
export function clearClientSuppliedKey() {
  try {
    sessionStorage.removeItem(CLIENT_KEY_STORAGE);
  } catch {
    /* storage unavailable - nothing to clear */
  }
}

/* ------------------------------------------------------------------ *
 * Input sanitisation
 * ------------------------------------------------------------------ */

/**
 * Sanitise free-text user input.
 *
 * Unlike a naive `[^a-zA-Z0-9]` allow-list this preserves Unicode (including
 * Devanagari/Hindi), digits, punctuation and JSON punctuation, while still
 * removing angle brackets, script schemes and control characters that could
 * be used for markup or log injection.
 *
 * @param {string} input
 * @param {number} [maxLength]
 * @returns {string}
 */
export function sanitizeUserInput(input, maxLength = MAX_QUERY_CHARS) {
  if (typeof input !== 'string') return '';
  return (
    input
      .replace(/[<>]/g, ' ') // Neutralise tag delimiters
      .replace(/<\/?[a-z][^>]*>/gi, ' ') // Strip any residual tag-like runs
      .replace(/javascript\s*:/gi, ' ') // Neutralise script schemes
      .replace(/data\s*:\s*text\/html/gi, ' ') // Neutralise html data URIs
      .replace(/on[a-z]+\s*=/gi, ' ') // Neutralise inline event handlers
      // eslint-disable-next-line no-control-regex -- deliberately strips control characters
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .trim()
      .slice(0, maxLength)
  );
}

/**
 * Sanitise a value that will be interpolated into a structured prompt.
 * Keeps JSON punctuation intact while removing markup.
 * @param {string} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export function sanitizePromptField(value, maxLength = 400) {
  if (value === null || value === undefined) return '';
  return sanitizeUserInput(String(value), maxLength).replace(/[{}]/g, '');
}

/* ------------------------------------------------------------------ *
 * Provider status
 * ------------------------------------------------------------------ */

/**
 * Probe whether an AI provider is reachable.
 * @returns {Promise<{ configured: boolean, transport: 'proxy' | 'direct' | 'none', models: string[] }>}
 */
export async function getProviderStatus() {
  try {
    const response = await fetch(STATUS_ENDPOINT, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      if (data?.configured) {
        return { configured: true, transport: 'proxy', models: data.models || [] };
      }
    }
  } catch {
    /* proxy not deployed - fall through */
  }

  if (getClientSuppliedKey()) {
    return { configured: true, transport: 'direct', models: [] };
  }
  return { configured: false, transport: 'none', models: [] };
}

/* ------------------------------------------------------------------ *
 * Transport
 * ------------------------------------------------------------------ */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enforce a minimum gap between outbound provider calls.
 * @returns {Promise<void>}
 */
async function throttle() {
  const now = Date.now();
  const wait = MIN_REQUEST_INTERVAL_MS - (now - lastApiCallTimestamp);
  if (wait > 0) await delay(wait);
  lastApiCallTimestamp = Date.now();
}

/**
 * Call the same-origin proxy.
 * @param {object} request
 * @returns {Promise<{ ok: boolean, text?: string, model?: string, reason?: string, status?: number }>}
 */
async function callViaProxy(request) {
  let response;
  try {
    response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        systemInstruction: request.systemInstruction,
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        history: request.history
      })
    });
  } catch {
    return { ok: false, reason: 'proxy_unreachable', status: 0 };
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    return { ok: false, reason: 'proxy_unreachable', status: response.status };
  }

  if (response.ok && data?.ok && typeof data.text === 'string' && data.text.trim()) {
    return { ok: true, text: data.text, model: data.model || 'gemini' };
  }

  const reason =
    data?.code === 'provider_not_configured'
      ? 'provider_not_configured'
      : response.status === 429
        ? 'rate_limited'
        : response.status === 404 || response.status === 501
          ? 'proxy_unavailable'
          : 'provider_unavailable';

  return { ok: false, reason, status: response.status };
}

/**
 * Call Google Gemini directly using a user-supplied key.
 * Only used when the server proxy is not deployed on this host.
 * @param {object} request
 * @param {string} apiKey
 * @returns {Promise<{ ok: boolean, text?: string, model?: string, reason?: string }>}
 */
async function callDirect(request, apiKey) {
  const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];
  const parts = [];
  if (request.imageBase64) {
    parts.push({
      inlineData: { mimeType: request.mimeType, data: request.imageBase64 }
    });
  }
  parts.push({ text: request.prompt });

  const contents = [];
  for (const turn of request.history || []) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }
  contents.push({ role: 'user', parts });

  const payload = { contents, generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } };
  if (request.systemInstruction) {
    payload.systemInstruction = { parts: [{ text: request.systemInstruction }] };
  }

  let lastReason = 'provider_unavailable';
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
        if (text && text.trim()) return { ok: true, text, model };
        lastReason = 'empty_response';
        continue;
      }
      if (response.status === 429) lastReason = 'rate_limited';
      else if (response.status === 401 || response.status === 403) lastReason = 'provider_auth_failed';
      else lastReason = 'provider_unavailable';
    } catch {
      lastReason = error?.name === 'AbortError' ? 'provider_timeout' : 'provider_network_error';
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, reason: lastReason };
}

/**
 * Execute a Gemini completion.
 *
 * @param {object} options
 * @param {string} options.prompt
 * @param {string} [options.systemInstruction]
 * @param {string|null} [options.imageBase64]
 * @param {string} [options.mimeType]
 * @param {Array<{role: string, text: string}>} [options.history]
 * @returns {Promise<{ text: string, source: 'live', model: string, transport: string }>}
 * @throws {GeminiUnavailableError} when no provider could answer
 */
export async function callGeminiApi({
  prompt,
  systemInstruction = '',
  imageBase64 = null,
  mimeType = 'image/jpeg',
  history = []
}) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new GeminiUnavailableError('invalid_request', 'A prompt is required.');
  }

  await throttle();

  const request = {
    prompt: prompt.slice(0, MAX_PROMPT_CHARS),
    systemInstruction,
    imageBase64,
    mimeType,
    history
  };

  const proxied = await callViaProxy(request);
  if (proxied.ok) {
    return { text: proxied.text, source: 'live', model: proxied.model, transport: 'proxy' };
  }

  // The proxy may simply not be deployed on a static host. If the user has
  // supplied their own key for this session, try the provider directly.
  const clientKey = getClientSuppliedKey();
  if (clientKey && proxied.reason !== 'rate_limited') {
    const direct = await callDirect(request, clientKey);
    if (direct.ok) {
      return { text: direct.text, source: 'live', model: direct.model, transport: 'direct' };
    }
  }

  throw new GeminiUnavailableError(
    proxied.reason,
    proxied.reason === 'rate_limited'
      ? 'The AI provider is rate limiting requests. Please wait a moment.'
      : 'The AI provider is currently unavailable.'
  );
}

/* ------------------------------------------------------------------ *
 * JSON parsing helpers
 * ------------------------------------------------------------------ */

/**
 * Parse a JSON response from the model, tolerating markdown fences and
 * trailing prose around the payload.
 * @param {string} raw
 * @returns {Object|null}
 */
export function parseModelJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Validate a routine payload, normalising missing fields.
 * @param {any} parsed
 * @returns {Object|null}
 */
export function validateRoutine(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.timeBlocks) || parsed.timeBlocks.length === 0) return null;

  const blocks = parsed.timeBlocks
    .filter((block) => block && typeof block === 'object')
    .map((block, index) => ({
      time: sanitizePromptField(block.time, 60) || `Block ${index + 1}`,
      phase: sanitizePromptField(block.phase, 120) || 'Routine block',
      hazardLevel: sanitizePromptField(block.hazardLevel, 60) || 'Moderate',
      action: sanitizePromptField(block.action, 600),
      iaqHack: sanitizePromptField(block.iaqHack, 600),
      sustainableSwap: sanitizePromptField(block.sustainableSwap, 400),
      directImpact: sanitizePromptField(block.directImpact, 400)
    }));

  if (blocks.length === 0) return null;

  return {
    summaryTitle: sanitizePromptField(parsed.summaryTitle, 160) || 'Your smog-armour routine',
    threatAnalysis: sanitizePromptField(parsed.threatAnalysis, 800),
    timeBlocks: blocks,
    directImpactStatement: sanitizePromptField(parsed.directImpactStatement, 600),
    emergencyActionAlert: sanitizePromptField(parsed.emergencyActionAlert, 400)
  };
}

/**
 * Validate a vision audit payload.
 * @param {any} parsed
 * @returns {Object|null}
 */
export function validateVisionAudit(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.stepByStepFixes)) return null;

  const fixes = parsed.stepByStepFixes
    .filter((fix) => fix && typeof fix === 'object')
    .map((fix, index) => ({
      step: Number.isFinite(fix.step) ? fix.step : index + 1,
      title: sanitizePromptField(fix.title, 140) || 'Improvement step',
      diyFix: sanitizePromptField(fix.diyFix, 700),
      estimatedCostUsd: Number.isFinite(Number(fix.estimatedCostUsd))
        ? Number(fix.estimatedCostUsd)
        : 0,
      pmReductionPercent: Number.isFinite(Number(fix.pmReductionPercent))
        ? Number(fix.pmReductionPercent)
        : 0
    }));

  if (fixes.length === 0) return null;

  const score = Number(parsed.leakageRiskScore);
  return {
    roomDetected: sanitizePromptField(parsed.roomDetected, 140) || 'Room',
    leakageRiskScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50,
    primaryVulnerabilities: Array.isArray(parsed.primaryVulnerabilities)
      ? parsed.primaryVulnerabilities
          .slice(0, 6)
          .map((item) => sanitizePromptField(item, 240))
          .filter(Boolean)
      : [],
    stepByStepFixes: fixes,
    airPurifierPlacementAdvice: sanitizePromptField(parsed.airPurifierPlacementAdvice, 700),
    cleanAirDeliveryImpact: sanitizePromptField(parsed.cleanAirDeliveryImpact, 300)
  };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

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
    if (!routine) throw new GeminiUnavailableError('invalid_response', 'Malformed routine payload.');
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
 * @param {object|null} [context] City baseline used to ground the analysis
 * @returns {Promise<Object>} audit with `source` ('live' | 'fallback')
 */
export async function analyzeRoomIAQ(imageBase64, roomType, userNotes, lang = 'en', context = null) {
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
      imageBase64: imageBase64,
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
