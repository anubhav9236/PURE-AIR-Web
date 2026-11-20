import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImpactLedger from '../../src/components/ImpactLedger.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';

const HOTSPOT = {
  id: 'delhi',
  name: 'Delhi',
  state: 'Delhi NCR',
  aqi: 342,
  pm25: 280,
  pm10: 420,
  no2: 58,
  status: 'Severe'
};

function renderLedger(onPledgeCompleted = vi.fn()) {
  const utils = render(
    <LanguageProvider>
      <ImpactLedger hotspot={HOTSPOT} onPledgeCompleted={onPledgeCompleted} />
    </LanguageProvider>
  );
  return { ...utils, onPledgeCompleted };
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Impact ledger rendering', () => {
  it('renders the ledger with a single h1', () => {
    renderLedger();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('never renders an undefined monthly cigarette figure', () => {
    // Regression guard: the ledger read `monthlyCigarettesAvoided` after the
    // calculator renamed it, so the card rendered "~undefined cigarettes".
    renderLedger();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.getByText(/cigarettes avoided per month/i)).toBeInTheDocument();
  });

  it('shows the Berkeley Earth equivalent for the selected city', () => {
    renderLedger();
    expect(screen.getByText(/Berkeley Earth equivalent/i)).toBeInTheDocument();
  });

  it('renders every pledge as a real button', () => {
    renderLedger();
    const toggles = screen.getAllByRole('button', { name: /toggle this pledge/i });
    expect(toggles.length).toBe(6);
  });
});

describe('Impact ledger interaction', () => {
  it('toggles a pledge and awards its resilience points exactly once', async () => {
    const user = userEvent.setup();
    const { onPledgeCompleted } = renderLedger();

    const unchecked = screen
      .getAllByRole('button', { name: /toggle this pledge/i })
      .find((button) => button.getAttribute('aria-pressed') === 'false');

    await user.click(unchecked);

    expect(unchecked.getAttribute('aria-pressed')).toBe('true');
    expect(onPledgeCompleted).toHaveBeenCalledTimes(1);
    expect(onPledgeCompleted).toHaveBeenCalledWith(20);
  });

  it('updates the resilience score when a pledge is completed', async () => {
    const user = userEvent.setup();
    renderLedger();

    const unchecked = screen
      .getAllByRole('button', { name: /toggle this pledge/i })
      .find((button) => button.getAttribute('aria-pressed') === 'false');

    const before = screen.getByTestId('resilience-score').textContent;
    await user.click(unchecked);
    const after = screen.getByTestId('resilience-score').textContent;

    expect(before).not.toBe(after);
  });

  it('recomputes the sustainability figures when the commute mode changes', async () => {
    const user = userEvent.setup();
    renderLedger();

    const select = screen.getByLabelText(/commute mode/i);
    const petrolFigure = screen.getByTestId('co2-per-day').textContent;

    // The ledger defaults to metro, so switch to a higher-emitting mode and
    // then back to confirm the figures actually track the control.
    await user.selectOptions(select, 'car');
    const carFigure = screen.getByTestId('co2-per-day').textContent;
    expect(carFigure).not.toBe(petrolFigure);

    await user.selectOptions(select, 'metro');
    expect(screen.getByTestId('co2-per-day').textContent).toBe(petrolFigure);
  });

  it('exposes labelled lifestyle controls', () => {
    renderLedger();
    expect(screen.getByLabelText(/commute mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/home heating source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours spent outdoors per day/i)).toBeInTheDocument();
  });
});
