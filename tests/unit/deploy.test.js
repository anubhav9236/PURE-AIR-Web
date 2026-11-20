import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();

/**
 * Read every source file that ships to the build or to the runtime.
 * @returns {Array<{ file: string, source: string }>}
 */
function readSourceFiles() {
  const roots = ['src', 'server', 'api', 'scripts'];
  const files = [];

  for (const dir of roots) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const full = path.join(abs, entry.name);
      if (entry.isDirectory()) {
        for (const child of fs.readdirSync(full, { withFileTypes: true })) {
          if (child.isFile() && /\.(js|jsx|mjs)$/.test(child.name)) {
            files.push({
              file: path.join(dir, entry.name, child.name),
              source: fs.readFileSync(path.join(full, child.name), 'utf8')
            });
          }
        }
      } else if (/\.(js|jsx|mjs)$/.test(entry.name)) {
        files.push({ file: path.join(dir, entry.name), source: fs.readFileSync(full, 'utf8') });
      }
    }
  }

  return files;
}

const files = readSourceFiles();

/**
 * Extract the package name from a bare-module specifier.
 * @param {string} specifier
 * @returns {string|null} null for relative paths and Node builtins
 */
function packageNameOf(specifier) {
  if (!specifier) return null;
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('node:')) return null;

  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/**
 * Remove comments so prose inside them is never mistaken for an import.
 *
 * @param {string} source
 * @returns {string}
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Collect every bare-module specifier imported by a file.
 * @param {string} source
 * @returns {string[]}
 */
function importedPackages(source) {
  const code = stripComments(source);
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const name = packageNameOf(match[1]);
      if (name) specifiers.add(name);
    }
  }

  return [...specifiers];
}

describe('Deployment integrity', () => {
  it('ships the entry modules Vite and the runtime need', () => {
    const required = [
      'src/main.jsx',
      'src/App.jsx',
      'server/index.js',
      'server/geminiProxy.js',
      'api/gemini.js',
      'index.html',
      'vercel.json'
    ];

    const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
    expect(missing).toEqual([]);
  });

  it('points index.html at an entry module that exists', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const match = /<script[^>]+src="([^"]+)"/.exec(html);
    expect(match).not.toBeNull();

    const entry = match[1].replace(/^\//, '');
    expect(fs.existsSync(path.join(root, entry))).toBe(true);
  });

  it('declares every imported package in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const declared = new Set([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {})
    ]);

    const undeclared = [];
    for (const { file, source } of files) {
      for (const name of importedPackages(source)) {
        if (!declared.has(name)) undeclared.push(`${file} -> ${name}`);
      }
    }

    expect(undeclared).toEqual([]);
  });

  it('has no unresolved bare-module imports', () => {
    const unresolved = [];
    for (const { file, source } of files) {
      for (const name of importedPackages(source)) {
        try {
          require.resolve(`${name}/package.json`);
        } catch {
          try {
            require.resolve(name);
          } catch {
            unresolved.push(`${file} -> ${name}`);
          }
        }
      }
    }

    expect(unresolved).toEqual([]);
  });

  it('keeps every script referenced by package.json runnable', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const scripts = pkg.scripts || {};

    expect(scripts.build).toContain('vite build');
    expect(scripts.test).toContain('vitest');
    expect(scripts.start).toContain('server/index.js');

    // Every `node <file>` script must point at a file that exists.
    for (const [name, command] of Object.entries(scripts)) {
      const match = /node\s+([\w./-]+\.(?:mjs|js))/.exec(command);
      if (!match) continue;
      expect(fs.existsSync(path.join(root, match[1])), `${name} -> ${match[1]}`).toBe(true);
    }
  });

  it('configures Vercel for a Vite build with a serverless API', () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

    expect(vercel.framework).toBe('vite');
    expect(vercel.buildCommand).toBe('npm run build');
    expect(vercel.outputDirectory).toBe('dist');

    const rewrites = vercel.rewrites || [];
    expect(
      rewrites.some((r) => r.source === '/api/gemini/status' && r.destination === '/api/gemini')
    ).toBe(true);
  });

  it('does not ignore the directories the build needs', () => {
    const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    const entries = gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    // A pattern that would exclude the source tree is the exact failure that
    // produced an empty repository and a "Module not found" build error.
    for (const pattern of ['src', 'src/', 'server', 'api', 'tests', 'scripts']) {
      expect(entries, `".gitignore" must not ignore ${pattern}`).not.toContain(pattern);
    }
  });

  it('never ships a key-shaped string in the source tree', () => {
    const pattern = /(AIza[0-9A-Za-z_-]{20,}|AQ\.Ab8[0-9A-Za-z_-]{20,})/;
    const offenders = files
      .filter(({ source }) => pattern.test(source))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});

describe('Vercel serverless function', () => {
  it('exposes a default export handler', async () => {
    const mod = await import('../../api/gemini.js');
    expect(typeof mod.default).toBe('function');
  });

  it('serves the provider status on a GET', async () => {
    const { default: handler } = await import('../../api/gemini.js');

    const written = [];
    const res = {
      writeHead: (status, headers) => written.push({ status, headers }),
      end: (body) => written.push({ body })
    };

    await handler({ url: '/api/gemini', method: 'GET', headers: {} }, res);

    const payload = JSON.parse(written.find((w) => w.body).body);
    expect(payload.configured).toBe(false);
    expect(Array.isArray(payload.models)).toBe(true);
    expect(payload.models.length).toBeGreaterThan(0);
  });

  it('rejects an unsupported method without leaking internals', async () => {
    const { default: handler } = await import('../../api/gemini.js');

    const written = [];
    const res = {
      writeHead: (status, headers) => written.push({ status, headers }),
      end: (body) => written.push({ body })
    };

    await handler({ url: '/api/gemini', method: 'DELETE', headers: {} }, res);

    const entry = written.find((w) => w.status);
    expect(entry.status).toBe(405);
    expect(JSON.parse(written.find((w) => w.body).body).error).toBe('Method Not Allowed');
  });
});
