import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenAISmogPlanner from '../../src/components/GenAISmogPlanner.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import { GLOBAL_SMOG_HOTSPOTS } from '../../src/services/telemetryService.js';

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

/**
 * The exact JSON the provider is asked to return. The component renders the
 * *validated* result of this payload, so the assertions below exercise the
 * real transport, the real parser and the real schema validation.
 */
const ROUTINE_PAYLOAD = {
  summaryTitle: 'Shield the school run',
  threatAnalysis: 'A shallow inversion traps particulates over the city until noon.',
  timeBlocks: [
    {
      time: '06:30 - 08:30',
      phase: 'Morning Inversion Trap',
      hazardLevel: 'Extreme',
      action: 'Walk the child to school instead of driving.',
      iaqHack: 'Seal the bedroom window with bubble wrap.',
      sustainableSwap: 'Use the metro line instead of a petrol car.',
      directImpact: 'Avoids 1.4 cigarettes of particulate load.'
    },
    {
      time: '12:00 - 14:00',
      phase: 'Midday Clear Window',
      hazardLevel: 'Moderate',
      action: 'Open the windows while the inversion lifts.',
      iaqHack: 'Run the box fan for a full air exchange.',
      sustainableSwap: 'Cook with the lid on and induction.',
      directImpact: 'Cuts indoor PM2.5 by roughly 40%.'
    }
  ],
  directImpactStatement: 'Your family avoids 2.6 cigarette equivalents and 6.8 kg of CO2.',
  emergencyActionAlert: 'Keep windows shut while the AQI stays above 300.'
};

/**
 * Stub the network boundary only - the component, the service facade, the
 * transport, the JSON parser and the schema validator all run for real.
 *
 * @param {object|null} payload the model payload to return, or null to fail
 */
function stubProvider(payload) {
  const fetchMock = vi.fn(async () => {
    if (payload === null) {
      return {
        ok: false,
        status: 503,
        json: async () => ({ ok: false, code: 'provider_unavailable' })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, text: JSON.stringify(payload), model: 'gemini-3.8-flash' })
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/**
 * @param {object} [props]
 * @returns {ReturnType<typeof render>}
 */
function renderPlanner(props = {}) {
  return render(
    <LanguageProvider>
      <GenAISmogPlanner hotspot={HOTSPOT} {...props} />
    </LanguageProvider>
  );
}

describe('GenAISmogPlanner', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows an empty state before any routine is generated', () => {
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();
    expect(screen.getByRole('heading', { name: /no schedule formulated yet/i })).toBeInTheDocument();
  });

  it('renders the household profile form with accessible labels', () => {
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    expect(screen.getByLabelText('Adults')).toHaveValue(2);
    expect(screen.getByLabelText('Children')).toHaveValue(1);
    expect(screen.getByLabelText('Elderly')).toHaveValue(1);
    expect(screen.getByLabelText(/primary commute/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/home heating source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cooking style/i)).toBeInTheDocument();
  });

  it('clamps the household count inputs to their allowed range', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    const adults = screen.getByLabelText('Adults');
    await user.clear(adults);
    await user.type(adults, '99');
    expect(Number(adults.value)).toBeLessThanOrEqual(10);
  });

  it('generates a routine for the selected city through the real provider path', async () => {
    const user = userEvent.setup();
    const fetchMock = stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));

    expect(await screen.findByRole('heading', { name: 'Shield the school run' })).toBeInTheDocument();

    // The request went to the same-origin proxy, never to the provider host.
    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/gemini');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(body.prompt).toContain(HOTSPOT.name);
    expect(body.systemInstruction).toBeTruthy();
  });

  it('labels a live provider response honestly', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByText('Live Gemini response')).toBeInTheDocument();
  });

  it('falls back to the offline guide and labels it when the provider fails', async () => {
    const user = userEvent.setup();
    stubProvider(null);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByText(/offline clean-air guide/i)).toBeInTheDocument();
  });

  it('lists every time block with its action and impact', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));

    const list = await screen.findByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Morning Inversion Trap');
    expect(items[0]).toHaveTextContent('Walk the child to school instead of driving.');
  });

  it('toggles a time block between done and not done', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' });

    const toggle = screen.getAllByRole('button', { name: /mark block complete/i })[0];
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(screen.getAllByRole('button', { name: /mark block as not done/i })[0]).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('celebrates and logs the routine only once when every block is complete', async () => {
    const user = userEvent.setup();
    const onLogRoutineCompleted = vi.fn();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner({ onLogRoutineCompleted });

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' });

    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);

    await waitFor(() => {
      expect(onLogRoutineCompleted).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error message when the routine cannot be generated', async () => {
    const user = userEvent.setup();
    stubProvider(null);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    // The offline guide covers the failure, so no error alert is shown.
    expect(await screen.findByText(/offline clean-air guide/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles a vulnerability focus chip', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    const chip = screen.getByRole('button', { name: /asthmatics/i });
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the emergency protocol directive when the routine supplies one', async () => {
    const user = userEvent.setup();
    stubProvider(ROUTINE_PAYLOAD);
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(
      await screen.findByText(/keep windows shut while the aqi stays above 300/i)
    ).toBeInTheDocument();
  });
});
