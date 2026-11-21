import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const generateSmogArmorRoutine = vi.fn();
const confettiMock = vi.fn();

vi.mock('../../src/services/geminiService', () => ({
  generateSmogArmorRoutine: (...args) => generateSmogArmorRoutine(...args)
}));

vi.mock('../../src/utils/confetti', () => ({
  default: (...args) => confettiMock(...args)
}));

const { default: GenAISmogPlanner } = await import('../../src/components/GenAISmogPlanner.jsx');
const { default: LanguageProvider } = await import('../../src/i18n/LanguageProvider.jsx');
const { GLOBAL_SMOG_HOTSPOTS } = await import('../../src/services/telemetryService.js');

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

const ROUTINE = {
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
  emergencyActionAlert: 'Keep windows shut while the AQI stays above 300.',
  source: 'live'
};

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
    generateSmogArmorRoutine.mockReset();
    confettiMock.mockReset();
    generateSmogArmorRoutine.mockResolvedValue(ROUTINE);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state before any routine is generated', () => {
    renderPlanner();
    expect(screen.getByRole('heading', { name: /no schedule formulated yet/i })).toBeInTheDocument();
    expect(generateSmogArmorRoutine).not.toHaveBeenCalled();
  });

  it('renders the household profile form with accessible labels', () => {
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
    renderPlanner();

    const adults = screen.getByLabelText('Adults');
    await user.clear(adults);
    await user.type(adults, '99');
    expect(Number(adults.value)).toBeLessThanOrEqual(10);
  });

  it('generates a routine for the selected city', async () => {
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));

    await waitFor(() => {
      expect(generateSmogArmorRoutine).toHaveBeenCalledTimes(1);
    });

    const [profile, hotspot] = generateSmogArmorRoutine.mock.calls[0];
    expect(profile.adults).toBe(2);
    expect(hotspot.name).toBe(HOTSPOT.name);

    expect(
      await screen.findByRole('heading', { name: 'Shield the school run' })
    ).toBeInTheDocument();
  });

  it('labels a live provider response honestly', async () => {
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByText('Live Gemini response')).toBeInTheDocument();
  });

  it('labels a fallback routine as a reference response', async () => {
    generateSmogArmorRoutine.mockResolvedValue({ ...ROUTINE, source: 'fallback' });
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByText(/offline clean-air guide/i)).toBeInTheDocument();
  });

  it('lists every time block with its action and impact', async () => {
    const user = userEvent.setup();
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
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' });

    const toggle = screen.getAllByRole('button', { name: /mark block complete/i })[0];
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(
      screen.getAllByRole('button', { name: /mark block as not done/i })[0]
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('celebrates and logs the routine only once when every block is complete', async () => {
    const user = userEvent.setup();
    const onLogRoutineCompleted = vi.fn();
    renderPlanner({ onLogRoutineCompleted });

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: 'Shield the school run' });

    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /mark block complete/i })[0]);

    await waitFor(() => {
      expect(onLogRoutineCompleted).toHaveBeenCalledTimes(1);
    });
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the routine cannot be generated', async () => {
    generateSmogArmorRoutine.mockRejectedValue(new Error('provider down'));
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('toggles a vulnerability focus chip', async () => {
    const user = userEvent.setup();
    renderPlanner();

    const chip = screen.getByRole('button', { name: /asthmatics/i });
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the emergency protocol directive when the routine supplies one', async () => {
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    expect(await screen.findByText(/keep windows shut while the aqi stays above 300/i)).toBeInTheDocument();
  });
});
