/**
 * Vercel Serverless Function for the PureAir Life Gemini proxy.
 *
 * The Google Gemini API key is read from the `GEMINI_API_KEY` environment
 * variable configured in the Vercel project settings. It is never sent to the
 * browser: the client only ever talks to this same-origin `/api/gemini` route.
 *
 *   GET  /api/gemini  -> provider status `{ configured, models }`
 *   POST /api/gemini  -> `{ prompt, systemInstruction, history, imageBase64 }`
 *
 * All validation, rate limiting, timeout budgeting, model failover and error
 * redaction live in the shared handler (`server/geminiProxy.js`), which is the
 * exact same code path used by the Node server and the Vite dev server.
 */

import { handleGeminiApi, resolveApiKey } from '../server/geminiProxy.js';

/**
 * Best-effort client IP, honouring Vercel's forwarding headers.
 *
 * @param {import('node:http').IncomingMessage} req
 * @returns {string}
 */
function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return (first || '').trim() || req.socket?.remoteAddress || 'unknown';
}

/**
 * Vercel Node.js entry point.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export default async function handler(req, res) {
  try {
    const handled = await handleGeminiApi(req, res, {
      apiKey: resolveApiKey(),
      ip: clientIp(req)
    });

    if (!handled) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
    }
  } catch {
    // Never leak a stack trace or provider internals to the client.
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Internal server error.' }));
  }
}
