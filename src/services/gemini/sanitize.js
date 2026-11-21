/**
 * Input sanitisation for everything the user types or that is interpolated
 * into a prompt.
 */

/** Longest free-text query the assistant accepts. */
export const MAX_QUERY_CHARS = 1000;

export function sanitizeUserInput(input, maxLength = MAX_QUERY_CHARS) {
  if (typeof input !== 'string') return '';
  return (
    input
      .replace(/[<>]/g, ' ') // Neutralise tag delimiters
      .replace(/<\/?[a-z][^>]*>/gi, ' ') // Strip any residual tag-like runs
      .replace(/javascript\s*:/gi, ' ') // Neutralise script schemes
      .replace(/data\s*:\s*text\/html/gi, ' ') // Neutralise html data URIs
      .replace(/on[a-z]+\s*=/gi, ' ') // Neutralise inline event handlers
      // eslint-disable-next-line no-control-regex -- deliberately strips control characters
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .trim()
      .slice(0, maxLength)
  );
}

/**
 * Sanitise a value that will be interpolated into a structured prompt.
 * Keeps JSON punctuation intact while removing markup.
 * @param {string} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export function sanitizePromptField(value, maxLength = 400) {
  if (value === null || value === undefined) return '';
  return sanitizeUserInput(String(value), maxLength).replace(/[{}]/g, '');
}
