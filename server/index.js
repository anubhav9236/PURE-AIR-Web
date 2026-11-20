/**
 * PureAir Life production server.
 *
 * Serves the built SPA from `dist/` and exposes the Gemini proxy at
 * `/api/gemini`. The Gemini API key is read from the environment and is never
 * sent to the browser.
 *
 * Usage:
 *   GEMINI_API_KEY=... npm run build && npm start
 *
 * Node.js standard library only - no third-party runtime dependencies.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream';

import { handleGeminiApi, resolveApiKey } from './geminiProxy.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST_DIR = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

const COMPRESSIBLE = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.webmanifest'
]);

/**
 * Content Security Policy. `connect-src 'self'` keeps all Gemini traffic on
 * the same origin via the server-side proxy, so the browser never needs direct
 * access to generativelanguage.googleapis.com.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join('; ');

/**
 * Standard hardening headers applied to every response.
 * @param {boolean} isHtml
 * @returns {Record<string, string>}
 */
function securityHeaders(isHtml) {
  const headers = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
  if (isHtml) {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  }
  return headers;
}

/**
 * Resolve a request path to a file inside `dist/`, rejecting traversal.
 * @param {string} urlPath
 * @returns {string|null}
 */
function resolveStaticPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const candidate = resolve(DIST_DIR, `.${normalized.startsWith('/') ? '' : '/'}${normalized}`);
  const rootPrefix = DIST_DIR.endsWith(sep) ? DIST_DIR : DIST_DIR + sep;

  if (candidate !== DIST_DIR && !candidate.startsWith(rootPrefix)) return null;
  if (!existsSync(candidate)) return null;

  const stats = statSync(candidate);
  if (stats.isDirectory()) {
    const indexFile = join(candidate, 'index.html');
    return existsSync(indexFile) ? indexFile : null;
  }
  return candidate;
}

const server = createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  // ---- API routes -------------------------------------------------------
  if (url.startsWith('/api/')) {
    try {
      const handled = await handleGeminiApi(req, res, {
        apiKey: resolveApiKey(),
        ip: req.socket?.remoteAddress
      });
      if (handled) return;
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Internal server error.' }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Not found.' }));
    return;
  }

  // ---- Static assets ----------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let filePath = resolveStaticPath(url);

  if (!filePath) {
    // SPA fallback: unknown routes are client-side routes.
    filePath = join(DIST_DIR, 'index.html');
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Build output not found. Run "npm run build" first.');
      return;
    }
  }

  const ext = extname(filePath).toLowerCase();
  const isHtml = ext === '.html';
  const headers = securityHeaders(isHtml);

  // The Content-Type must be set on every path: with `X-Content-Type-Options:
  // nosniff` a response without one is not rendered as HTML.
  headers['Content-Type'] = MIME_TYPES[ext] || 'application/octet-stream';

  if (!isHtml) {
    // Vite emits content-hashed filenames, so these are safe to cache forever.
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }

  const acceptsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
  const shouldCompress = acceptsGzip && COMPRESSIBLE.has(ext);

  if (shouldCompress) {
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    pipeline(createReadStream(filePath), createGzip({ level: 6 }), res, () => {});
    return;
  }

  res.writeHead(200, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  pipeline(createReadStream(filePath), res, () => {});
});

server.listen(PORT, HOST, () => {
  const key = resolveApiKey();
  console.log(
    `PureAir Life running at http://${HOST}:${PORT}  |  AI provider: ${
      key ? 'configured' : 'NOT configured (set GEMINI_API_KEY)'
    }`
  );
});

export { server };
