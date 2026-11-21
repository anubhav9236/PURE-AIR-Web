import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * WCAG 2.1 contrast guard.
 *
 * jsdom cannot evaluate colour contrast (it has no layout engine), so the
 * axe-core suite cannot see this class of defect. The pairs below are the
 * exact foreground/background combinations the interface uses, checked
 * against the WCAG 2.1 AA thresholds, plus a source-level rule that keeps
 * the failing combination from being reintroduced.
 */

/** Tailwind v4 teal palette, as emitted by the production build. */
const TEAL = {
  50: '#f0fdfa',
  100: '#cbfbf1',
  200: '#96f7e4',
  300: '#46ecd5',
  400: '#00d3bd',
  500: '#00baa7',
  600: '#009588',
  700: '#00776e',
  800: '#005f5a',
  900: '#0b4f4a'
};

const WHITE = '#ffffff';

/**
 * Convert a 6-digit hex colour to its sRGB channels.
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}}
 */
function channels(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

/**
 * Relative luminance of a colour (WCAG 2.1 definition).
 * @param {string} hex
 * @returns {number}
 */
function luminance(hex) {
  const { r, g, b } = channels(hex);
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Contrast ratio between two colours.
 * @param {string} foreground
 * @param {string} background
 * @returns {number} ratio between 1 and 21
 */
function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Collect every source file under `src/`.
 * @returns {string[]}
 */
function sourceFiles() {
  const root = path.resolve(process.cwd(), 'src');
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(full);
    }
  };
  walk(root);
  return out;
}

describe('WCAG contrast', () => {
  it('computes a known contrast ratio correctly', () => {
    // Black on white is the maximum ratio, white on white the minimum.
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it.each([
    ['teal-700', TEAL[700], WHITE, 4.5],
    ['teal-800', TEAL[800], WHITE, 4.5],
    ['teal-900', TEAL[900], WHITE, 4.5],
    ['teal-900 on teal-100', TEAL[900], TEAL[100], 4.5],
    ['teal-900 on teal-50', TEAL[900], TEAL[50], 4.5]
  ])('meets AA for %s', (_label, foreground, background, required) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(required);
  });

  it('rejects teal-600 for white body text', () => {
    // teal-600 is the shade the interface must not use behind white text.
    expect(contrastRatio(WHITE, TEAL[600])).toBeLessThan(4.5);
    expect(contrastRatio(WHITE, TEAL[700])).toBeGreaterThanOrEqual(4.5);
  });

  it('never places white text on teal-600 in the source', () => {
    const offenders = sourceFiles().filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /bg-teal-600[^"']*text-white|text-white[^"']*bg-teal-600/.test(source);
    });

    expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual([]);
  });

  it('never places white text on a translucent white chip', () => {
    const offenders = sourceFiles().filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /bg-white\/\d+[^"']*text-white|text-white[^"']*bg-white\/\d+/.test(source);
    });

    expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual([]);
  });
});
