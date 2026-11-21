import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx';

/**
 * A component that throws while rendering, used to exercise the boundary.
 * @returns {never}
 */
function Boom() {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>Healthy workspace</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Healthy workspace')).toBeInTheDocument();
  });

  it('renders a recovery panel instead of the crashed tree', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /recovered gracefully/i })).toBeInTheDocument();
    expect(screen.queryByText('Healthy workspace')).not.toBeInTheDocument();
  });

  it('offers a reload action that resets the page', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    // jsdom forbids real navigation, so stub the reload side effect.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload }
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: /reload application/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('logs the caught exception for diagnostics', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    const logged = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('Error Boundary caught an exception')
    );
    expect(logged).toBe(true);
  });
});
