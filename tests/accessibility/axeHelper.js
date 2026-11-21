/**
 * Shared axe-core helpers for the accessibility test suite.
 *
 * axe-core is used directly (instead of a Jest-only wrapper) so the checks
 * run inside Vitest's jsdom environment.
 */

import axe from 'axe-core';

/**
 * Rules that cannot produce a trustworthy result in jsdom.
 *
 * - `color-contrast` needs real layout and computed background colours, which
 *   jsdom does not implement. It is verified separately in a real browser.
 * - `landmark-unique` and `region` are checked against the full application
 *   shell in `appShell.test.jsx`, where the landmarks actually exist.
 */
const DISABLED_RULES = {
  'color-contrast': { enabled: false }
};

/**
 * Run axe against a container and return the violations.
 *
 * @param {HTMLElement} container element to analyse
 * @param {object} [options] extra axe options
 * @returns {Promise<object[]>} axe violation objects
 */
export async function getViolations(container, options = {}) {
  const results = await axe.run(container, {
    rules: DISABLED_RULES,
    resultTypes: ['violations'],
    ...options
  });
  return results.violations;
}

/**
 * Turn axe violations into a readable assertion message.
 *
 * @param {object[]} violations
 * @returns {string}
 */
export function formatViolations(violations) {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join('\n      ');
      return `- [${violation.impact}] ${violation.id}: ${violation.help}\n      ${targets}`;
    })
    .join('\n');
}
