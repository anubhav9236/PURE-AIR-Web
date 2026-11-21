import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const analyzeRoomIAQ = vi.fn();

vi.mock('../../src/services/geminiService', () => ({
  analyzeRoomIAQ: (...args) => analyzeRoomIAQ(...args)
}));

const { default: IAQRoomScanner } = await import('../../src/components/IAQRoomScanner.jsx');
const { default: LanguageProvider } = await import('../../src/i18n/LanguageProvider.jsx');
const { GLOBAL_SMOG_HOTSPOTS } = await import('../../src/services/telemetryService.js');

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

const AUDIT = {
  roomDetected: 'Living room sliding window',
  leakageRiskScore: 62,
  primaryVulnerabilities: ['Unsealed window perimeter', 'No exterior exhaust hood'],
  stepByStepFixes: [
    {
      step: 1,
      title: 'Bubble-glaze the window pane',
      diyFix: 'Mist the glass and press bubble wrap onto it.',
      estimatedCostUsd: 4,
      pmReductionPercent: 30
    }
  ],
  airPurifierPlacementAdvice: 'Keep the unit 30 cm off the wall.',
  cleanAirDeliveryImpact: 'Roughly 11 µg/m³ lower indoors',
  source: 'live'
};

/**
 * @returns {ReturnType<typeof render>}
 */
function renderScanner() {
  return render(
    <LanguageProvider>
      <IAQRoomScanner hotspot={HOTSPOT} />
    </LanguageProvider>
  );
}

describe('IAQRoomScanner', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    analyzeRoomIAQ.mockReset();
    analyzeRoomIAQ.mockResolvedValue(AUDIT);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders an empty state before an audit runs', () => {
    renderScanner();
    expect(
      screen.getByRole('heading', { name: /no iaq audit performed yet/i })
    ).toBeInTheDocument();
    expect(analyzeRoomIAQ).not.toHaveBeenCalled();
  });

  it('exposes the upload control and the room context fields', () => {
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');

    expect(screen.getByLabelText(/room type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/worried about/i)).toBeInTheDocument();
  });

  it('offers the sample setups and applies their context', async () => {
    const user = userEvent.setup();
    renderScanner();

    const sample = screen.getByRole('button', { name: /drafty single-pane window/i });
    expect(sample).toHaveAttribute('aria-pressed', 'false');

    await user.click(sample);
    expect(sample).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/room type/i)).toHaveValue('Living Room Sliding Window');
    expect(screen.getByLabelText(/worried about/i)).toHaveValue(
      'Cold drafts entering at night; curtains move slightly when closed'
    );
  });

  it('runs the audit and reports the room, risk score and fixes', async () => {
    const user = userEvent.setup();
    renderScanner();

    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));

    await waitFor(() => {
      expect(analyzeRoomIAQ).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByRole('heading', { name: 'Living room sliding window' })
    ).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText(/unsealed window perimeter/i)).toBeInTheDocument();
    expect(screen.getByText(/bubble-glaze the window pane/i)).toBeInTheDocument();
  });

  it('passes the selected city baseline to the audit service', async () => {
    const user = userEvent.setup();
    renderScanner();

    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    await waitFor(() => {
      expect(analyzeRoomIAQ).toHaveBeenCalledTimes(1);
    });

    const args = analyzeRoomIAQ.mock.calls[0];
    expect(args[1]).toBe('Living Room Window & Airflow Zone');
    expect(args[4]).toBe(HOTSPOT);
  });

  it('labels a live audit honestly', async () => {
    const user = userEvent.setup();
    renderScanner();

    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    expect(await screen.findByText('Live Gemini response')).toBeInTheDocument();
  });

  it('labels a fallback audit as a local guide response', async () => {
    analyzeRoomIAQ.mockResolvedValue({ ...AUDIT, source: 'fallback' });
    const user = userEvent.setup();
    renderScanner();

    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    expect(await screen.findByText(/offline clean-air guide/i)).toBeInTheDocument();
  });

  it('rejects an unsupported file type with an alert', async () => {
    // `applyAccept: false` bypasses the input's accept filter so the component
    // itself has to reject the unsupported type.
    const user = userEvent.setup({ applyAccept: false });
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    await user.upload(input, file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg, png or webp/i);
  });

  it('rejects an oversized file with an alert', async () => {
    const user = userEvent.setup();
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    await user.upload(input, big);

    expect(await screen.findByRole('alert')).toHaveTextContent(/too large|mb/i);
  });

  it('shows a preview for an accepted photo', async () => {
    const user = userEvent.setup();
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    const file = new File([new Uint8Array([1, 2, 3])], 'room.jpg', { type: 'image/jpeg' });
    await user.upload(input, file);

    const preview = await screen.findByRole('img', { name: /preview of the uploaded room photo/i });
    expect(preview.getAttribute('src')).toMatch(/^data:/);
  });

  it('renders the sample setups inside a labelled group', () => {
    renderScanner();
    const group = screen.getByRole('group', { name: /test room setup/i });
    expect(within(group).getAllByRole('button')).toHaveLength(4);
  });
});
