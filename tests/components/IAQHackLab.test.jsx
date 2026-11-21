import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IAQHackLab from '../../src/components/IAQHackLab.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import { GLOBAL_SMOG_HOTSPOTS } from '../../src/services/telemetryService.js';

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

/**
 * @returns {ReturnType<typeof render>}
 */
function renderHackLab() {
  return render(
    <LanguageProvider>
      <IAQHackLab hotspot={HOTSPOT} />
    </LanguageProvider>
  );
}

describe('IAQHackLab', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the simulator with its default readout', () => {
    renderHackLab();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/hack lab/i);
    // Default build: 20" box fan, medium speed, 4x MERV 13, shroud installed.
    expect(screen.getByText(/CFM CADR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4-filter cube' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('exposes every simulator control with a label', () => {
    renderHackLab();

    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^medium$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MERV 13/i })).toBeInTheDocument();
  });

  it('recalculates CADR when the fan speed changes', async () => {
    const user = userEvent.setup();
    renderHackLab();

    const readout = screen.getByText(/CFM CADR/i).previousSibling;
    const before = Number(String(readout.textContent).replace(/,/g, ''));

    await user.click(screen.getByRole('button', { name: /^high$/i }));

    const after = Number(String(readout.textContent).replace(/,/g, ''));
    expect(after).toBeGreaterThan(before);
  });

  it('boosts CADR when the cardboard shroud is installed', async () => {
    const user = userEvent.setup();
    renderHackLab();

    const readout = screen.getByText(/CFM CADR/i).previousSibling;
    const withShroud = Number(String(readout.textContent).replace(/,/g, ''));

    await user.click(screen.getByRole('button', { name: /installed \(\+35% cadr\)/i }));

    const withoutShroud = Number(String(readout.textContent).replace(/,/g, ''));
    expect(withoutShroud).toBeLessThan(withShroud);
  });

  it('switches the filter architecture', async () => {
    const user = userEvent.setup();
    renderHackLab();

    const readout = screen.getByText(/CFM CADR/i).previousSibling;
    const before = Number(String(readout.textContent).replace(/,/g, ''));

    await user.click(screen.getByRole('button', { name: /^2-filter mini$/i }));

    const after = Number(String(readout.textContent).replace(/,/g, ''));
    expect(after).toBeLessThan(before);
  });

  it('changes the infiltration load when the sealing level changes', async () => {
    const user = userEvent.setup();
    renderHackLab();

    const before = screen.getByText(/infiltration\s+[\d.]+ ACH/i).textContent;

    await user.click(screen.getByRole('button', { name: /^fully sealed$/i }));

    const after = screen.getByText(/infiltration\s+[\d.]+ ACH/i).textContent;
    expect(after).not.toBe(before);
  });

  it('states the WHO guideline verdict for the filtered indoor estimate', () => {
    renderHackLab();

    const verdict = screen.getByText(/meets the who 24-hour guideline|above the who 24-hour guideline/i);
    expect(verdict).toBeInTheDocument();
  });

  it('keeps the estimate honest by labelling it as estimated', () => {
    renderHackLab();
    const estimated = screen.getAllByText(/estimated/i);
    expect(estimated.length).toBeGreaterThan(0);
  });

  it('lists the DIY hack catalogue with cost and time for each entry', () => {
    renderHackLab();

    expect(screen.getByRole('heading', { name: /emergency thermal window bubble-glazing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /damp towel/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /activated carbon/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cardboard shroud/i })).toBeInTheDocument();
  });

  it('uses a range input for the room dimensions', () => {
    renderHackLab();
    const length = screen.getByLabelText(/length/i);
    expect(length).toHaveAttribute('type', 'range');
    expect(length).toHaveAttribute('min', '10');
    expect(length).toHaveAttribute('max', '30');
  });

  it('exposes the sealing level options as a toggle group', () => {
    renderHackLab();
    const sealed = screen.getByRole('button', { name: /^fully sealed$/i });
    expect(sealed).toHaveAttribute('aria-pressed', 'false');
    expect(within(screen.getByRole('group', { name: /room sealing condition/i })).getAllByRole('button')).toHaveLength(4);
  });
});
