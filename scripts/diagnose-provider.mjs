/**
 * Live provider connectivity diagnostic for PureAir Life.
 *
 * This script is NOT the unit/integration test suite - that lives in the
 * `tests` directory as Vitest specs and runs through `npm test`.
 *
 * What this script does:
 *   1. Checks the server-side Gemini proxy is reachable and correctly
 *      configured, without ever printing or embedding a credential.
 *   2. Optionally exercises the live provider using a key supplied through
 *      the environment.
 *
 * Design notes:
 *   - The API key is read from `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`.
 *     It is never hard-coded and never logged.
 *   - Network failures are reported honestly. A provider that cannot be
 *     reached is NOT reported as a pass - it is reported as SKIPPED with the
 *     reason, and the exit code reflects whether the configuration itself is
 *     correct.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const PROXY_BASE = process.env.PUREAIR_PROXY_URL || 'http://127.0.0.1:8787';
const PROVIDER_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

let failures = 0;
let skips = 0;
let passes = 0;

/**
 * @param {boolean} condition
 * @param {string} message
 */
function check(condition, message) {
  if (condition) {
    console.log(`  PASS  ${message}`);
    passes += 1;
  } else {
    console.error(`  FAIL  ${message}`);
    failures += 1;
  }
}

/**
 * @param {string} message
 */
function skip(message) {
  console.log(`  SKIP  ${message}`);
  skips += 1;
}

async function run() {
  console.log('\n======================================================');
  console.log('PUREAIR LIFE - LIVE PROVIDER DIAGNOSTIC');
  console.log('======================================================\n');

  // ---- 1. No secret may live in the source tree -------------------------
  console.log('1. Secret hygiene');
  const servicePath = join(PROJECT_ROOT, 'src/services/geminiService.js');
  const { readFileSync } = await import('node:fs');
  const serviceSource = readFileSync(servicePath, 'utf8');
  check(
    !/AIza[0-9A-Za-z_-]{30,}/.test(serviceSource) && !/AQ\.Ab8RN6KG/.test(serviceSource),
    'frontend service layer contains no embedded API key'
  );

  const proxyPath = join(PROJECT_ROOT, 'server/geminiProxy.js');
  const proxySource = readFileSync(proxyPath, 'utf8');
  check(
    /process\.env\.GEMINI_API_KEY/.test(proxySource),
    'server proxy reads the key from the environment'
  );

  // ---- 2. Built bundle must not contain the key -------------------------
  console.log('\n2. Build output');
  const distDir = join(PROJECT_ROOT, 'dist');
  if (!existsSync(distDir)) {
    skip('dist/ not present - run "npm run build" to verify the bundle');
  } else {
    const { readdirSync, statSync } = await import('node:fs');
    const scanDir = (dir) => {
      const hits = [];
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          hits.push(...scanDir(full));
        } else if (/\.(js|css|html)$/.test(entry)) {
          const content = readFileSync(full, 'utf8');
          if (/AIza[0-9A-Za-z_-]{30,}/.test(content) || /AQ\.Ab8RN6KG/.test(content)) {
            hits.push(full);
          }
        }
      }
      return hits;
    };
    const leaks = scanDir(distDir);
    check(leaks.length === 0, 'built bundle contains no API key');
  }

  // ---- 3. Server proxy configuration ------------------------------------
  console.log('\n3. Server proxy');
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  let proxyConfigured = false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${PROXY_BASE}/api/gemini/status`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json();
    proxyConfigured = Boolean(data?.configured);
    check(true, `proxy reachable at ${PROXY_BASE} (configured: ${proxyConfigured})`);
  } catch {
    check(false, `proxy not reachable at ${PROXY_BASE} - start it with "npm start" for live AI`);
  }

  // ---- 4. Live provider round-trip --------------------------------------
  console.log('\n4. Live provider round-trip');
  if (!envKey) {
    skip('no GEMINI_API_KEY in the environment - set it to exercise the live provider');
  } else {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(
        `${PROVIDER_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(envKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Give a 5-word clean air tip' }] }],
            generationConfig: { maxOutputTokens: 40 }
          })
        }
      );
      clearTimeout(timer);
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      check(Boolean(reply && reply.trim().length > 0), `live ${MODEL} returned a reply`);
    } catch (error) {
      // A network failure is reported as a skip, never as a silent pass.
      skip(`live provider unreachable (${error.name || 'network error'})`);
    }
  }

  console.log('\n======================================================');
  console.log(`RESULT: ${passes} passed, ${failures} failed, ${skips} skipped`);
  console.log('======================================================\n');

  process.exit(failures > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error('Diagnostic crashed:', error?.message || error);
  process.exit(1);
});
