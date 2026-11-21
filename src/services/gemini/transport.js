/**
 * Provider transport.
 *
 * Requests go to the same-origin proxy first (the server holds the key).
 * Only when the proxy is not deployed on this host, and the user supplied
 * their own session key, does the browser talk to the provider directly.
 */

import { getClientSuppliedKey } from './sessionKey.js';

/**
 * One outbound provider request.
 *
 * @typedef {Object} ProviderRequest
 * @property {string} prompt the user prompt
 * @property {string} [systemInstruction] system role instruction
 * @property {string} [imageBase64] base64 image for the vision workflow
 * @property {string} [mimeType] MIME type of {@link ProviderRequest.imageBase64}
 * @property {{ role: string, text: string }[]} [history] earlier conversation turns
 */

/**
 * The outcome of one provider call.
 *
 * @typedef {Object} ProviderResult
 * @property {boolean} ok whether the call produced usable text
 * @property {string} [text] the model text
 * @property {string} [model] the model that answered
 * @property {string} [reason] machine-readable failure reason
 * @property {number} [status] the HTTP status, when there was a response
 */

/**
 * Provider status is a `GET` on the same path as the proxy, so a single
 * serverless function (Vercel) or a single Node route covers the whole API.
 * The legacy `GET /api/gemini/status` path is still accepted server-side.
 */
const STATUS_ENDPOINT = '/api/gemini';
const PROXY_ENDPOINT = '/api/gemini';

const MAX_PROMPT_CHARS = 12000;

/** Minimum spacing between outbound requests (client-side politeness). */
const MIN_REQUEST_INTERVAL_MS = 600;

/** Timestamp of the last outbound provider call, used by {@link throttle}. */
let lastApiCallTimestamp = 0;

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
 * @param {ProviderRequest} request
 * @returns {Promise<ProviderResult>}
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
 * @param {ProviderRequest} request
 * @param {string} apiKey
 * @returns {Promise<ProviderResult>}
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
    } catch (error) {
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
