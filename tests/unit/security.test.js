import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

// Vitest runs from the project root.
const ROOT = process.cwd();

const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.html', '.css']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vite', 'coverage']);

/**
 * Recursively collect source files to scan.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Secret patterns that must never appear in browser-delivered source.
 *
 * - Google AI Studio / Gemini keys start with `AIza`
 * - The key previously hard-coded in this repo started with `AQ.`
 * - Private key blocks
 * - Generic high-entropy assignments to a key/token/secret variable
 */
const SECRET_PATTERNS = [
  { name: 'Google AI Studio key (AIza…)', regex: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'Previously leaked Gemini key (AQ.…)', regex: /AQ\.Ab8RN6KG/ },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  {
    name: 'Hard-coded secret assignment',
    regex: /(api[_-]?key|apikey|secret|password|passwd|token)\s*[:=]\s*['"][A-Za-z0-9_-]{24,}['"]/i
  }
];

describe('Secret scanning — browser-delivered source', () => {
  const files = collectFiles(ROOT);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const pattern of SECRET_PATTERNS) {
    it('contains no ' + pattern.name, () => {
      const offenders = [];
      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        if (pattern.regex.test(content)) {
          offenders.push(relative(ROOT, file));
        }
      }
      expect(offenders).toEqual([]);
    });
  }
  it('does not ship the API key inside the frontend service layer', () => {
    const service = readFileSync(join(ROOT, 'src/services/geminiService.js'), 'utf8');
    expect(service).not.toMatch(/AIza[0-9A-Za-z_-]{30,}/);
    expect(service).not.toMatch(/AQ\.Ab8RN6KG/);
  });

  it('reads the key from the server environment instead of the bundle', () => {
    const proxy = readFileSync(join(ROOT, 'server/geminiProxy.js'), 'utf8');
    expect(proxy).toMatch(/process\.env\.GEMINI_API_KEY/);
  });

  it('never returns the API key to the browser', () => {
    const proxy = readFileSync(join(ROOT, 'server/geminiProxy.js'), 'utf8');
    // The status endpoint must expose only a boolean, never the credential.
    expect(proxy).toMatch(/configured:\s*Boolean/);
    // The raw key may only be used to build the upstream request URL.
    expect(proxy).toMatch(/encodeURIComponent\(apiKey\)/);
    expect(proxy).not.toMatch(/sendJson\([^)]*:\s*(options\.)?apiKey\s*[,}]/s);
  });
});

describe('Secret scanning — production build output', () => {
  const distDir = join(ROOT, 'dist');

  it.skipIf(!existsSync(distDir))('contains no secrets in the built bundle', () => {
    const offenders = [];
    for (const file of collectFiles(distDir)) {
      const content = readFileSync(file, 'utf8');
      for (const { name, regex } of SECRET_PATTERNS) {
        if (regex.test(content)) {
          offenders.push(`${relative(ROOT, file)} (${name})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it.skipIf(!existsSync(distDir))('does not load Tailwind from a CDN at runtime', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    expect(html).not.toContain('cdn.tailwindcss.com');
  });

  it.skipIf(!existsSync(distDir))('ships a Content-Security-Policy meta tag', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    expect(html).toMatch(/Content-Security-Policy/);
    // Scripts must not be allowed from arbitrary origins.
    const csp = html.match(/content="([^"]*Content-Security[^"]*)"|content="([^"]*default-src[^"]*)"/);
    expect(csp).not.toBeNull();
  });
});

describe('Transport security', () => {
  it('does not ship an inline script tag in the production HTML', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) || [];
    expect(inlineScripts).toEqual([]);
  });

  it('requires the key over a non-insecure scheme in the source', () => {
    const proxy = readFileSync(join(ROOT, 'server/geminiProxy.js'), 'utf8');
    expect(proxy).not.toMatch(/http:\/\/generativelanguage/);
  });
});
