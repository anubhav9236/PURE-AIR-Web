#!/usr/bin/env node
/**
 * Audit the production build output.
 *
 * `npm test` deliberately never depends on `dist/` so the suite can run on a
 * fresh clone without a build step, and so no test is ever silently skipped.
 * This script closes the gap: the quality gate builds first and then runs
 * this audit, so the *shipped* bundle is checked for the same secrets and
 * the same hardening as the source.
 *
 * Usage:  node scripts/audit-dist.mjs
 * Exit code 0 = clean, 1 = problems found.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const distDir = path.join(root, 'dist');

if (!existsSync(distDir)) {
  console.error('No dist/ directory found. Run "npm run build" first.');
  process.exit(1);
}

const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.map']);

const SECRET_PATTERNS = [
  { name: 'Google AI Studio key (AIza…)', regex: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'Previously leaked Gemini key (AQ.…)', regex: /AQ\.Ab8RN6KG/ },
  { name: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  {
    name: 'Hard-coded secret assignment',
    regex: /(api[_-]?key|apikey|secret|password|passwd|token)\s*[:=]\s*['"][A-Za-z0-9_-]{24,}['"]/i
  }
];

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (SCAN_EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

const problems = [];

// ---- 1. no secrets in the shipped bundle ---------------------------------
const files = collectFiles(distDir);
if (files.length === 0) problems.push('dist/ contains no files to scan - was the build empty?');

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const { name, regex } of SECRET_PATTERNS) {
    if (regex.test(content)) {
      problems.push(`secret in bundle: ${relative(root, file)} (${name})`);
    }
  }
}

// ---- 2. no runtime CDN ---------------------------------------------------
const html = readFileSync(join(distDir, 'index.html'), 'utf8');
if (html.includes('cdn.tailwindcss.com')) {
  problems.push('index.html loads Tailwind from a CDN');
}
if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/.test(html)) {
  problems.push('index.html contains an inline script');
}

// ---- 3. the security headers are in place ---------------------------------
const csp = html.match(/content="([^"]*default-src[^"]*)"/i);
if (!csp) problems.push('index.html has no Content-Security-Policy');
else if (!/script-src 'self'/.test(csp[1])) {
  problems.push("the Content-Security-Policy does not restrict script-src to 'self'");
}

// ---- 4. the entry module actually shipped ---------------------------------
const entry = html.match(/<script[^>]+src="([^"]+)"/);
if (!entry) problems.push('index.html has no module entry script');
else if (!existsSync(join(distDir, entry[1].replace(/^\//, '')))) {
  problems.push(`index.html points at a missing bundle: ${entry[1]}`);
}

console.log(`Scanned ${files.length} built file(s) in dist/.`);
if (problems.length === 0) {
  console.log('Build output audit: OK (no secrets, no CDN, CSP present, entry present).');
  process.exit(0);
}

console.error(`Build output audit found ${problems.length} problem(s):`);
for (const problem of problems) console.error(`  - ${problem}`);
process.exit(1);
