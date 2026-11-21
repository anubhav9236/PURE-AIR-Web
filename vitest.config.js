import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    restoreMocks: true,
    // The app throttles provider calls (one per 600 ms) and the suite runs in
    // parallel, so individual tests need more head-room than the 5 s default.
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx'],
      // A regression gate, not a target: the suite must never drop below
      // these floors, and raising them is part of the normal workflow.
      thresholds: {
        statements: 88,
        branches: 80,
        functions: 84,
        lines: 90
      }
    }
  }
});
