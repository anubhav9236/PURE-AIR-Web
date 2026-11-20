/**
 * Vitest global setup.
 *
 * Provides jest-dom matchers plus the browser APIs that jsdom does not
 * implement but that PureAir Life relies on (speech synthesis, matchMedia,
 * scrollIntoView, canvas-free confetti rendering).
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom does not implement scrollIntoView.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// jsdom does not implement window.matchMedia.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
}

// jsdom has no speech synthesis implementation.
if (!('speechSynthesis' in window)) {
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speak: vi.fn(),
      cancel: vi.fn()
    }
  });
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
}

// Confetti creates canvas elements; jsdom does not implement the 2d context.
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  globalAlpha: 1,
  fillStyle: '#000',
  strokeStyle: '#000',
  lineWidth: 1
});
