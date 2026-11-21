import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Reduced-motion guard.
 *
 * WCAG 2.3.3 asks that motion be avoidable. PureAir Life honours the
 * operating-system preference in the shipped stylesheet, so jsdom - which has
 * no layout engine and cannot evaluate a media query - cannot see it. These
 * checks read the stylesheet that is actually built and shipped, so the
 * reduced-motion block cannot be dropped by accident.
 */

const STYLESHEET = path.resolve(process.cwd(), 'src/index.css');

/**
 * The body of the `prefers-reduced-motion` block.
 *
 * @returns {string}
 */
function reducedMotionBlock() {
  const css = fs.readFileSync(STYLESHEET, 'utf8');
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  expect(start).toBeGreaterThan(-1);
  return css.slice(start);
}

describe('Reduced motion', () => {
  it('stops animations and transitions when the preference is set', () => {
    const block = reducedMotionBlock();

    expect(block).toContain('animation-duration: 0.001ms !important');
    expect(block).toContain('animation-iteration-count: 1 !important');
    expect(block).toContain('transition-duration: 0.001ms !important');
    expect(block).toContain('scroll-behavior: auto !important');
  });

  it('removes the hover and active transforms of interactive surfaces', () => {
    const block = reducedMotionBlock();

    expect(block).toMatch(/button:hover/);
    expect(block).toMatch(/transform: none !important/);
  });

  it('applies the override to every element, including pseudo-elements', () => {
    const block = reducedMotionBlock();

    expect(block).toMatch(/\*::before/);
    expect(block).toMatch(/\*::after/);
  });
});
