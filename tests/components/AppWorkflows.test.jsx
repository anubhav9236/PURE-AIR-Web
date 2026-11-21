import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.jsx';

/**
 * The exact JSON the provider is asked to return. The app renders the
 * *validated* result of this payload, so these journeys exercise the real
 * shell, the real transport, the real parser and the real schema validation -
 * nothing is mocked below the network boundary.
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
 * Stub the network boundary only.
 *
 * `GET /api/gemini` is the provider probe, `POST /api/gemini` is the
 * generation call. Both the client and the server contract run for real.
 *
 * @returns {import('vitest').Mock}
 */
function stubNetwork() {
  const fetchMock = vi.fn(async (_url, init = {}) => {
    const method = init.method || 'GET';
    if (method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ configured: true, models: ['gemini-3.8-flash'] })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        text: JSON.stringify(ROUTINE_PAYLOAD),
        model: 'gemini-3.8-flash'
      })
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/**
 * The cumulative family-impact readout in the navigation bar.
 *
 * @returns {HTMLElement}
 */
function navbarImpact() {
  return screen.getByText(/Family resilience points/).parentElement;
}

/**
 * The workspace panels the shell has mounted so far.
 *
 * @returns {NodeListOf<Element>}
 */
function mountedPanels() {
  return document.querySelectorAll('[id^="panel-"]');
}

// Lazily-loaded workspaces need more head-room than the 1 s default when the
// whole suite runs in parallel.
const WAIT = { timeout: 10000 };

describe('End-to-end workspace journeys', () => {
  beforeEach(() => {
    // The language preference and any session key persist between renders.
    localStorage.clear();
    sessionStorage.clear();
    stubNetwork();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the AI planner from the dashboard call to action', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /generate ai smog routine/i }));

    expect(
      await screen.findByRole('tab', { name: /AI Smog-Armor/i, selected: true }, WAIT)
    ).toBeInTheDocument();
    expect(mountedPanels()).toHaveLength(2);
  });

  it('opens the DIY hack lab from the dashboard call to action', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /diy iaq hacks/i }));

    expect(
      await screen.findByRole('tab', { name: /DIY Hack Lab/i, selected: true }, WAIT)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'DIY Indoor Air Hack Lab' }, WAIT)
    ).toBeInTheDocument();
  });

  it('credits the household once the generated routine is finished', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /generate ai smog routine/i }));
    await screen.findByRole('tab', { name: /AI Smog-Armor/i, selected: true }, WAIT);

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' }, WAIT);

    expect(navbarImpact()).toHaveTextContent('Family resilience points 70');
    expect(navbarImpact()).toHaveTextContent('14.8 cig-equiv');

    // Ticking every block completes the routine and awards the impact points.
    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);

    await waitFor(() => {
      expect(navbarImpact()).toHaveTextContent('Family resilience points 120');
    });
    expect(navbarImpact()).toHaveTextContent('17.3 cig-equiv');
    expect(navbarImpact()).toHaveTextContent('45 kg CO2');
  });

  it('credits resilience points when a pledge is switched on', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /Family Impact/i }));
    await screen.findByRole('heading', { name: 'Family Impact Ledger' }, WAIT);

    await user.click(
      screen.getByRole('button', {
        name: /toggle this pledge: switched from single-car commute/i
      })
    );

    await waitFor(() => {
      expect(navbarImpact()).toHaveTextContent('Family resilience points 90');
    });
    expect(navbarImpact()).toHaveTextContent('16 cig-equiv');
  });

  it('keeps a visited workspace mounted so the user never loses their work', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(mountedPanels()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /generate ai smog routine/i }));
    await screen.findByRole('tab', { name: /AI Smog-Armor/i, selected: true }, WAIT);
    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' }, WAIT);

    // Visiting another workspace mounts it but must not unmount the planner.
    await user.click(screen.getByRole('tab', { name: /Family Impact/i }));
    await screen.findByRole('heading', { name: 'Family Impact Ledger' }, WAIT);
    expect(mountedPanels()).toHaveLength(3);

    await user.click(screen.getByRole('tab', { name: /AI Smog-Armor/i }));
    expect(screen.getByRole('heading', { name: 'Shield the school run' })).toBeInTheDocument();
  });
});
