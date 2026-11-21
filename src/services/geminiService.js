/**
 * Gemini service for PureAir Life.
 *
 * Stable facade over the focused modules in `src/services/gemini/`. Import
 * from here so the internal layout can change without touching call sites.
 */

export {
  clearClientSuppliedKey,
  getClientSuppliedKey,
  setClientSuppliedKey
} from './gemini/sessionKey.js';
export { sanitizePromptField, sanitizeUserInput } from './gemini/sanitize.js';
export { GeminiUnavailableError, callGeminiApi, getProviderStatus } from './gemini/transport.js';
export { parseModelJson, validateRoutine, validateVisionAudit } from './gemini/validation.js';
export {
  analyzeRoomIAQ,
  askSmogAssistant,
  containsHindi,
  detectImageMimeType,
  generateSmogArmorRoutine
} from './gemini/workflows.js';
