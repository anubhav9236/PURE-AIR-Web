import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.jsx';

/**
 * The application nav is the first tablist on the page; the dashboard also
 * renders a vulnerability-profile tablist further down.
 *
 * @returns {HTMLElement}
 */
function navTablist() {
  return screen.getAllByRole('tablist')[0];
}

beforeEach(() => {
  // The language preference and any session key persist between renders.
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

describe('App shell', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('exposes a single h1 on the dashboard view', () => {
    render(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('provides a skip link that targets the main landmark', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(document.querySelector('#main-content')).toBeTruthy();
  });

  it('renders a banner landmark and a contentinfo landmark', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('states that reference values are not a live feed', () => {
    render(<App />);
    // The dashboard must label the city figures as a modelled reference
    // baseline, never as a live monitoring feed.
    expect(screen.getByText('Reference baseline')).toBeInTheDocument();
    expect(
      screen.getByTitle(/not a live monitoring feed/i)
    ).toBeInTheDocument();
  });
});

describe('Navigation', () => {
  it('renders every workspace as a tab', () => {
    render(<App />);
    const tabs = within(navTablist()).getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(6);
  });

  it('marks exactly one nav tab as selected', () => {
    render(<App />);
    const selected = within(navTablist())
      .getAllByRole('tab')
      .filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
  });

  it('moves between nav tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<App />);

    const tabs = within(navTablist()).getAllByRole('tab');
    tabs[0].focus();
    await user.keyboard('{ArrowRight}');

    const selected = within(navTablist())
      .getAllByRole('tab')
      .filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveFocus();
  });

  it('switches workspaces when a tab is activated', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(within(navTablist()).getByRole('tab', { name: /clean air ai/i }));

    // The chat workspace is lazily loaded, so allow the chunk import to land
    // before asserting on the heading. The assertion itself is unchanged.
    expect(
      await screen.findByRole('heading', { name: /clean air ai assistant/i }, { timeout: 10000 })
    ).toBeInTheDocument();
  });

  it('links each nav tab to its panel', () => {
    render(<App />);
    const tab = within(navTablist()).getAllByRole('tab')[0];
    const panelId = tab.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.querySelector(`#${panelId}`)).toBeTruthy();
  });
});

describe('City selection', () => {
  it('opens a searchable city listbox', async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole('button', { name: /select city/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('filters the city list as the user types', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /select city/i }));
    await user.type(screen.getByLabelText(/filter indian cities/i), 'mum');

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(37);
    expect(options[0]).toHaveTextContent(/mumbai/i);
  });

  it('closes the listbox with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole('button', { name: /select city/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Language switching', () => {
  it('switches the interface to Hindi', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('language-toggle'));

    expect(screen.getByRole('tab', { name: /स्मॉग शील्ड/i })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('hi');
  });

  it('switches back to English', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('language-toggle'));
    await user.click(screen.getByTestId('language-toggle'));

    expect(screen.getByRole('tab', { name: /smog shield/i })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('AI provider disclosure', () => {
  it('does not claim the AI is live when the provider is unavailable', async () => {
    render(<App />);
    const badge = await screen.findByTestId('ai-status');
    expect(badge).toHaveAccessibleName(/AI offline/i);
    expect(badge).not.toHaveAccessibleName(/^AI live/i);
  });

  it('reports the AI as live when the server proxy has a key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ configured: true, models: ['gemini-3.8-flash'] })
      })
    );

    render(<App />);
    const badge = await screen.findByTestId('ai-status');
    await waitFor(() => {
      expect(badge).toHaveAccessibleName(/AI live/i);
    });
  });
});
