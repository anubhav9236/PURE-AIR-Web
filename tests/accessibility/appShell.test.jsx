import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { getViolations, formatViolations } from './axeHelper.js';
import App from '../../src/App.jsx';

describe('Application shell accessibility (axe-core)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ configured: false, models: [] })
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has no automated accessibility violations on the dashboard', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    const violations = await getViolations(container);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  it('keeps every page region inside a landmark', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    const violations = await getViolations(container, {
      rules: { region: { enabled: true }, 'landmark-unique': { enabled: true } }
    });
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  it('exposes exactly one banner, one main and one contentinfo landmark', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('gives every focusable control an accessible name', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    const violations = await getViolations(container, {
      rules: {
        'button-name': { enabled: true },
        'link-name': { enabled: true },
        'aria-command-name': { enabled: true }
      }
    });
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});
