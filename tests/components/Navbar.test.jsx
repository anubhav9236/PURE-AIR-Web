import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../src/components/Navbar.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import { GLOBAL_SMOG_HOTSPOTS } from '../../src/services/telemetryService.js';

const HOTSPOTS = GLOBAL_SMOG_HOTSPOTS.slice(0, 6);

/**
 * Render the Navbar inside the language provider it depends on.
 * @param {object} [overrides]
 * @returns {ReturnType<typeof render>}
 */
function renderNavbar(overrides = {}) {
  const props = {
    selectedHotspot: HOTSPOTS[0],
    onSelectHotspot: vi.fn(),
    hotspots: HOTSPOTS,
    activeTab: 'dashboard',
    setActiveTab: vi.fn(),
    ...overrides
  };

  return {
    props,
    ...render(
      <LanguageProvider>
        <Navbar {...props} />
      </LanguageProvider>
    )
  };
}

describe('Navbar', () => {
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

  it('renders a banner landmark and the primary navigation', () => {
    renderNavbar();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: /navigation tabs/i })).toBeInTheDocument();
  });

  it('renders one tab per workspace and marks the active one', () => {
    renderNavbar({ activeTab: 'planner' });

    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs).toHaveLength(6);

    const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute('id', 'tab-planner');
  });

  it('reports the city count in the brand block', () => {
    renderNavbar();
    expect(screen.getByText(new RegExp(`\\(${HOTSPOTS.length}\\)`))).toBeInTheDocument();
  });

  it('activates a workspace tab on click', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    renderNavbar({ setActiveTab });

    await user.click(within(screen.getByRole('tablist')).getByRole('tab', { name: /clean air ai/i }));
    expect(setActiveTab).toHaveBeenCalledWith('chat');
  });

  it('moves the roving tabindex with the arrow, Home and End keys', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    renderNavbar({ setActiveTab });

    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    tabs[0].focus();

    await user.keyboard('{ArrowRight}');
    expect(setActiveTab).toHaveBeenLastCalledWith('planner');

    await user.keyboard('{End}');
    expect(setActiveTab).toHaveBeenLastCalledWith('chat');

    await user.keyboard('{Home}');
    expect(setActiveTab).toHaveBeenLastCalledWith('dashboard');

    await user.keyboard('{ArrowLeft}');
    expect(setActiveTab).toHaveBeenLastCalledWith('chat');
  });

  it('opens the city listbox and filters it by name', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const trigger = screen.getByRole('button', { name: /select city/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(HOTSPOTS.length);

    await user.type(screen.getByLabelText(/filter indian cities/i), HOTSPOTS[1].name.slice(0, 4));
    expect(screen.getAllByRole('option').length).toBeLessThan(HOTSPOTS.length);
  });

  it('selects a city and closes the listbox', async () => {
    const user = userEvent.setup();
    const onSelectHotspot = vi.fn();
    renderNavbar({ onSelectHotspot });

    await user.click(screen.getByRole('button', { name: /select city/i }));
    const target = screen.getAllByRole('option').find(
      (option) => option.textContent.includes(HOTSPOTS[1].name)
    );
    await user.click(target);

    expect(onSelectHotspot).toHaveBeenCalledWith(HOTSPOTS[1]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the city listbox with Escape', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const trigger = screen.getByRole('button', { name: /select city/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the selected city in the listbox', async () => {
    const user = userEvent.setup();
    renderNavbar({ selectedHotspot: HOTSPOTS[2] });

    await user.click(screen.getByRole('button', { name: /select city/i }));
    const selected = screen
      .getAllByRole('option')
      .filter((option) => option.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent(HOTSPOTS[2].name);
  });

  it('toggles the interface language', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = screen.getByTestId('language-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(screen.getByTestId('language-toggle')).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('hi');
  });

  it('reports the AI provider as offline when the proxy has no key', async () => {
    renderNavbar();
    const badge = await screen.findByTestId('ai-status');
    await waitFor(() => {
      expect(badge).toHaveAccessibleName(/AI offline/i);
    });
  });

  it('reports the AI provider as live when the proxy has a key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ configured: true, models: ['gemini-flash'] })
      })
    );

    renderNavbar();
    const badge = await screen.findByTestId('ai-status');
    await waitFor(() => {
      expect(badge).toHaveAccessibleName(/AI live/i);
    });
  });

  it('opens the provider dialog and rejects an invalid key', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByTestId('ai-status'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await user.type(screen.getByLabelText(/api key/i), 'not-a-real-key');
    await user.click(screen.getByRole('button', { name: /^save key$/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      /does not look like a valid api key/i
    );
  });

  it('closes the provider dialog with the close control', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByTestId('ai-status'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getAllByRole('button', { name: /cancel/i })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the cumulative family impact figures', () => {
    renderNavbar({
      avoidedCigarettesTotal: 21.5,
      savedCo2Total: 44.2,
      resiliencePoints: 120
    });

    expect(screen.getByText('21.5')).toBeInTheDocument();
    expect(screen.getByText(/44\.2 kg CO2/)).toBeInTheDocument();
    expect(screen.getByText(/resilience points 120/i)).toBeInTheDocument();
  });
});
