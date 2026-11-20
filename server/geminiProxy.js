/**
 * Gemini API proxy for PureAir Life.
 *
 * SECURITY MODEL
 * --------------
 * The Google Gemini API key NEVER reaches the browser. It lives only in this
 * process, sourced from the `GEMINI_API_KEY` environment variable. The browser
 * talks to `/api/gemini` on the same origin; this module adds the credentials,
 * enforces limits, and returns text only.
 *
 * Responsibilities:
 *  - Strict request validation (size, shape, length)
 *  - Per-IP rate limiting
 *  - Request timeouts with hard abort
 *  - Model failover across known-good Gemini models
 *  - Error sanitisation so provider internals / stack traces never leak
 *
 * Built on Node.js standard library only - no third-party runtime dependencies.
 */

import { Buffer } from 'node:buffer';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Ordered model failover chain. Gemini periodically returns 503 UNAVAILABLE
 * ("high demand") for specific model IDs, so we retry the next known-good
 * model rather than surfacing a transient failure to the user.
 */
export const MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite'
];

/**
 * Maximum request body size.
 *
 * 4 MB keeps the payload comfortably below Vercel's 4.5 MB function request
 * limit (which would otherwise reject the request with an opaque
 * `FUNCTION_PAYLOAD_TOO_LARGE`). The client downscales room photos before
 * upload, so a 4 MB body still fits a usable image.
 */
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_PROMPT_CHARS = 12000;
const MAX_SYSTEM_CHARS = 6000;
const MAX_HISTORY_TURNS = 10;

/** Maximum decoded image size accepted by the proxy (3 MB). */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/**
 * Per-model request timeout.
 *
 * Gemini Flash normally answers in 2-5 s. 8 s leaves room for a cold start
 * without making the user wait through a long stall on a busy model.
 */
const MODEL_TIMEOUT_MS = 8000;

/**
 * Total budget for the whole failover chain.
 *
 * Capped so the UI falls back to the local guide quickly instead of hanging
 * on a provider that is having a bad day.
 */
const TOTAL_BUDGET_MS = 20000;

/** Rate limit: 30 requests per IP per 60 second window. */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** @type {Map<string, { count: number, resetAt: number }>} */
const rateBuckets = new Map();

/**
 * Resolve the API key from the environment.
 *
 * Only `GEMINI_API_KEY` is read. A `VITE_*` variable must never be used:
 * Vite inlines `VITE_*` values into the client bundle, which would publish
 * the credential to every visitor.
 *
 * @returns {string|null}
 */
export function resolveApiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Consume one rate-limit token for an IP address.
 * @param {string} ip
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
export function consumeRateLimit(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Periodic cleanup so the rate-limit map cannot grow without bound. */
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);
sweeper.unref?.();

/**
 * Strip anything that could be used for log injection and cap length.
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
function cleanString(value, max) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex -- deliberately strips control characters
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

/**
 * Validate and normalise the incoming JSON body.
 * @param {any} body
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const prompt = cleanString(body.prompt, MAX_PROMPT_CHARS);
  if (prompt.length === 0) {
    return { ok: false, error: 'A non-empty "prompt" field is required.' };
  }

  const systemInstruction = cleanString(body.systemInstruction, MAX_SYSTEM_CHARS);

  let imageBase64 = null;
  let mimeType = 'image/jpeg';
  if (body.imageBase64) {
    const raw = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const base64 = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
    if (!/^[A-Za-z0-9+/=]+$/.test(base64.slice(0, 256))) {
      return { ok: false, error: 'imageBase64 is not valid base64 content.' };
    }
    const byteLength = Math.floor((base64.length * 3) / 4);
    if (byteLength > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        error: `Image payload exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`
      };
    }
    imageBase64 = base64;
    const requestedMime = cleanString(body.mimeType, 60);
    if (/^image\/(jpeg|png|webp|heic|heif)$/i.test(requestedMime)) {
      mimeType = requestedMime.toLowerCase();
    }
  }

  let history = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .slice(-MAX_HISTORY_TURNS)
      .map((turn) => {
        const role = turn?.role === 'model' ? 'model' : 'user';
        return { role, text: cleanString(turn?.text, 2000) };
      })
      .filter((turn) => turn.text.length > 0);
  }

  const requestedModel = cleanString(body.model, 60);
  const model = MODEL_CHAIN.includes(requestedModel) ? requestedModel : null;

  return {
    ok: true,
    value: { prompt, systemInstruction, imageBase64, mimeType, history, model }
  };
}

/**
 * Build the Gemini `generateContent` payload from a validated request.
 * @param {object} req
 * @returns {object}
 */
export function buildProviderPayload(req) {
  const parts = [];
  if (req.imageBase64) {
    parts.push({
      inlineData: { mimeType: req.mimeType, data: req.imageBase64 }
    });
  }
  parts.push({ text: req.prompt });

  const contents = [];
  for (const turn of req.history) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }
  contents.push({ role: 'user', parts });

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  if (req.systemInstruction) {
    payload.systemInstruction = { parts: [{ text: req.systemInstruction }] };
  }
  return payload;
}

/**
 * Extract the first text block from a Gemini response.
 * @param {any} data
 * @returns {string}
 */
export function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

/**
 * Call Gemini with model failover.
 * @param {object} request - Validated request
 * @param {string} apiKey
 * @returns {Promise<{ ok: true, text: string, model: string } | { ok: false, status: number, reason: string }>}
 */
export async function callGemini(request, apiKey) {
  const payload = buildProviderPayload(request);
  const body = JSON.stringify(payload);
  const chain = request.model ? [request.model] : MODEL_CHAIN;
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  let lastReason = 'unknown_error';
  let lastStatus = 503;

  for (const model of chain) {
    const remaining = deadline - Date.now();
    if (remaining <= 1000) {
      lastReason = 'provider_timeout';
      lastStatus = 504;
      break;
    }

    const timeout = Math.min(MODEL_TIMEOUT_MS, remaining);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: controller.signal
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = extractText(data);
        if (text) {
          return { ok: true, text, model };
        }
        // Empty completion (possible with safety filters) - try the next model.
        lastReason = 'empty_response';
        lastStatus = 502;
        continue;
      }

      lastStatus = response.status;
      const upstream = await response.text().catch(() => '');

      if (response.status === 429 || response.status === 503 || response.status === 404) {
        // Transient capacity / quota / model-gone -> try the next model.
        lastReason = response.status === 429 ? 'rate_limited' : 'model_unavailable';
        continue;
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        // Not recoverable by switching models (bad key, blocked prompt, bad request).
        const reason =
          response.status === 401 || response.status === 403
            ? 'provider_auth_failed'
            : 'provider_rejected_request';
        return { ok: false, status: response.status, reason };
      }

      lastReason = 'provider_error';
      void upstream;
    } catch (error) {
      if (error?.name === 'AbortError') {
        lastReason = 'provider_timeout';
        lastStatus = 504;
      } else {
        lastReason = 'provider_network_error';
        lastStatus = 502;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, status: lastStatus, reason: lastReason };
}

/**
 * Read a request body with a hard byte ceiling.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * Write a JSON response with hardened headers.
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {object} body
 */
export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

/**
 * Handle an incoming `/api/gemini` request.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {object} [options]
 * @param {string|null} [options.apiKey]
 * @param {string} [options.ip]
 * @returns {Promise<boolean>} true when the request was handled
 */
export async function handleGeminiApi(req, res, options = {}) {
  const url = (req.url || '').split('?')[0];
  const method = (req.method || 'GET').toUpperCase();

  // The provider status is served from `GET /api/gemini` so that a single
  // serverless function (`api/gemini.js` on Vercel) covers the whole API.
  // The legacy `GET /api/gemini/status` path is kept working.
  const isStatusRequest =
    url === '/api/gemini/status' || (url === '/api/gemini' && method === 'GET');

  if (isStatusRequest) {
    sendJson(res, 200, {
      configured: Boolean(options.apiKey),
      models: MODEL_CHAIN
    });
    return true;
  }

  if (url !== '/api/gemini') return false;

  if (method === 'OPTIONS') {
    res.writeHead(204, { Allow: 'POST, OPTIONS' });
    res.end();
    return true;
  }

  if (method !== 'POST') {
    res.writeHead(405, { Allow: 'POST, OPTIONS', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return true;
  }

  const ip = options.ip || req.socket?.remoteAddress || 'unknown';
  const limit = consumeRateLimit(ip);
  if (!limit.allowed) {
    sendJson(res, 429, {
      ok: false,
      error: 'Too many requests. Please wait a moment and try again.',
      retryAfterSeconds: limit.retryAfterSeconds
    });
    return true;
  }

  if (!options.apiKey) {
    sendJson(res, 503, {
      ok: false,
      error:
        'The AI provider is not configured on this server. Set the GEMINI_API_KEY environment variable and restart.',
      code: 'provider_not_configured'
    });
    return true;
  }

  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch (error) {
    const tooLarge = error?.message === 'PAYLOAD_TOO_LARGE';
    sendJson(res, tooLarge ? 413 : 400, {
      ok: false,
      error: tooLarge ? 'Request payload is too large.' : 'Request body must be valid JSON.'
    });
    return true;
  }

  const validated = validateRequestBody(body);
  if (!validated.ok) {
    sendJson(res, 400, { ok: false, error: validated.error });
    return true;
  }

  const result = await callGemini(validated.value, options.apiKey);
  if (!result.ok) {
    sendJson(res, result.status === 429 ? 429 : 502, {
      ok: false,
      error:
        result.reason === 'provider_auth_failed'
          ? 'The AI provider rejected the server credentials. Please check the server configuration.'
          : 'The AI provider is temporarily unavailable. The local clean-air guide has been used instead.',
      code: result.reason
    });
    return true;
  }

  sendJson(res, 200, {
    ok: true,
    text: result.text,
    model: result.model,
    source: 'live'
  });
  return true;
}
