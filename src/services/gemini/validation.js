/**
 * Model response validation.
 *
 * A model reply is untrusted input: it is parsed defensively and every field
 * is length-capped before it reaches the interface.
 */

import { sanitizePromptField } from './sanitize.js';

export function parseModelJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Validate a routine payload, normalising missing fields.
 * @param {any} parsed
 * @returns {Object|null}
 */
export function validateRoutine(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.timeBlocks) || parsed.timeBlocks.length === 0) return null;

  const blocks = parsed.timeBlocks
    .filter((block) => block && typeof block === 'object')
    .map((block, index) => ({
      time: sanitizePromptField(block.time, 60) || `Block ${index + 1}`,
      phase: sanitizePromptField(block.phase, 120) || 'Routine block',
      hazardLevel: sanitizePromptField(block.hazardLevel, 60) || 'Moderate',
      action: sanitizePromptField(block.action, 600),
      iaqHack: sanitizePromptField(block.iaqHack, 600),
      sustainableSwap: sanitizePromptField(block.sustainableSwap, 400),
      directImpact: sanitizePromptField(block.directImpact, 400)
    }));

  if (blocks.length === 0) return null;

  return {
    summaryTitle: sanitizePromptField(parsed.summaryTitle, 160) || 'Your smog-armour routine',
    threatAnalysis: sanitizePromptField(parsed.threatAnalysis, 800),
    timeBlocks: blocks,
    directImpactStatement: sanitizePromptField(parsed.directImpactStatement, 600),
    emergencyActionAlert: sanitizePromptField(parsed.emergencyActionAlert, 400)
  };
}

/**
 * Validate a vision audit payload.
 * @param {any} parsed
 * @returns {Object|null}
 */
export function validateVisionAudit(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.stepByStepFixes)) return null;

  const fixes = parsed.stepByStepFixes
    .filter((fix) => fix && typeof fix === 'object')
    .map((fix, index) => ({
      step: Number.isFinite(fix.step) ? fix.step : index + 1,
      title: sanitizePromptField(fix.title, 140) || 'Improvement step',
      diyFix: sanitizePromptField(fix.diyFix, 700),
      estimatedCostUsd: Number.isFinite(Number(fix.estimatedCostUsd))
        ? Number(fix.estimatedCostUsd)
        : 0,
      pmReductionPercent: Number.isFinite(Number(fix.pmReductionPercent))
        ? Number(fix.pmReductionPercent)
        : 0
    }));

  if (fixes.length === 0) return null;

  const score = Number(parsed.leakageRiskScore);
  return {
    roomDetected: sanitizePromptField(parsed.roomDetected, 140) || 'Room',
    leakageRiskScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50,
    primaryVulnerabilities: Array.isArray(parsed.primaryVulnerabilities)
      ? parsed.primaryVulnerabilities
          .slice(0, 6)
          .map((item) => sanitizePromptField(item, 240))
          .filter(Boolean)
      : [],
    stepByStepFixes: fixes,
    airPurifierPlacementAdvice: sanitizePromptField(parsed.airPurifierPlacementAdvice, 700),
    cleanAirDeliveryImpact: sanitizePromptField(parsed.cleanAirDeliveryImpact, 300)
  };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
