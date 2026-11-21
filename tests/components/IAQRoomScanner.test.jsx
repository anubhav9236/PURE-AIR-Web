import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IAQRoomScanner from '../../src/components/IAQRoomScanner.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import { GLOBAL_SMOG_HOTSPOTS } from '../../src/services/telemetryService.js';

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

/**
 * The exact JSON the vision model is asked to return. The component renders
 * the *validated* result, so the assertions exercise the real transport, the
 * real image plumbing and the real schema validation.
 */
const AUDIT_PAYLOAD = {
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
  cleanAirDeliveryImpact: 'Roughly 11 µg/m³ lower indoors'
};

/**
 * Stub the network boundary only - the component, the service facade, the
 * transport and the schema validator all run for real.
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
 * Attach a small accepted photo so the audit can run.
 * @param {import('@testing-library/user-event').UserEvent} user
 */
async function attachPhoto(user) {
  const input = document.querySelector('input[type="file"]');
  const file = new File([new Uint8Array([1, 2, 3])], 'room.jpg', { type: 'image/jpeg' });
  await user.upload(input, file);
  await screen.findByRole('img', { name: /preview of the uploaded room photo/i });
}

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

/**
 * Install a working image pipeline so the downscale path can be exercised.
 *
 * jsdom has neither `createImageBitmap` nor a 2D canvas, so the browser API
 * is stubbed here and the component's own scaling maths runs for real.
 *
 * @returns {{ bitmap: import('vitest').Mock, close: import('vitest').Mock }}
 */
function stubImagePipeline() {
  const close = vi.fn();
  const bitmap = vi.fn(async () => ({ width: 4000, height: 3000, close }));

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
    drawImage: vi.fn()
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
    () => 'data:image/jpeg;base64,SMALLER'
  );
  vi.stubGlobal('createImageBitmap', bitmap);

  return { bitmap, close };
}

describe('IAQRoomScanner', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders an empty state before an audit runs', () => {
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();
    expect(screen.getByRole('heading', { name: /no iaq audit performed yet/i })).toBeInTheDocument();
  });

  it('exposes the upload control and the room context fields', () => {
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');

    expect(screen.getByLabelText(/room type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/worried about/i)).toBeInTheDocument();
  });

  it('offers the sample setups and applies their context', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
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
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    await attachPhoto(user);
    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));

    expect(
      await screen.findByRole('heading', { name: 'Living room sliding window' })
    ).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText(/unsealed window perimeter/i)).toBeInTheDocument();
    expect(screen.getByText(/bubble-glaze the window pane/i)).toBeInTheDocument();
  });

  it('sends the photo and the city baseline to the provider', async () => {
    const user = userEvent.setup();
    const fetchMock = stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    await attachPhoto(user);
    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    await screen.findByRole('heading', { name: 'Living room sliding window' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/gemini');

    const body = JSON.parse(init.body);
    expect(body.imageBase64).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.mimeType).toBe('image/jpeg');
    expect(body.prompt).toContain(HOTSPOT.name);
  });

  it('labels a live audit honestly', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    await attachPhoto(user);
    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    expect(await screen.findByText('Live Gemini response')).toBeInTheDocument();
  });

  it('falls back to the offline guide and labels it when the provider fails', async () => {
    const user = userEvent.setup();
    stubProvider(null);
    renderScanner();

    await attachPhoto(user);
    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    expect(await screen.findByText(/offline clean-air guide/i)).toBeInTheDocument();
  });

  it('rejects an unsupported file type with an alert', async () => {
    // `applyAccept: false` bypasses the input's accept filter so the component
    // itself has to reject the unsupported type.
    const user = userEvent.setup({ applyAccept: false });
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    await user.upload(input, file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg, png or webp/i);
  });

  it('rejects an oversized file with an alert', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    const input = document.querySelector('input[type="file"]');
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    await user.upload(input, big);

    expect(await screen.findByRole('alert')).toHaveTextContent(/too large|mb/i);
  });

  it('shows a preview for an accepted photo', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();

    await attachPhoto(user);
    const preview = screen.getByRole('img', { name: /preview of the uploaded room photo/i });
    expect(preview.getAttribute('src')).toMatch(/^data:/);
  });

  it('renders the sample setups inside a labelled group', () => {
    stubProvider(AUDIT_PAYLOAD);
    renderScanner();
    const group = screen.getByRole('group', { name: /test room setup/i });
    expect(within(group).getAllByRole('button')).toHaveLength(4);
  });

  it('waits for the provider before showing a report', async () => {
    const user = userEvent.setup();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        await gate;
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, text: JSON.stringify(AUDIT_PAYLOAD), model: 'gemini' })
        };
      })
    );

    renderScanner();
    await attachPhoto(user);
    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /analysing|analyzing/i })[0]).toBeDisabled();
    });

    expect(screen.queryByRole('heading', { name: 'Living room sliding window' })).not.toBeInTheDocument();

    release();
    expect(await screen.findByRole('heading', { name: 'Living room sliding window' })).toBeInTheDocument();
  });

  it('downscales a large photo before it is uploaded', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
    const { bitmap, close } = stubImagePipeline();
    renderScanner();

    // A photo large enough that the re-encoded copy is genuinely smaller.
    const big = new File([new Uint8Array(4096)], 'big.jpg', { type: 'image/jpeg' });
    await user.upload(document.querySelector('input[type="file"]'), big);

    const preview = await screen.findByRole('img', { name: /preview of the uploaded room photo/i });
    await waitFor(() => {
      expect(preview.getAttribute('src')).toBe('data:image/jpeg;base64,SMALLER');
    });

    expect(bitmap).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('keeps the original photo when the downscale is not smaller', async () => {
    const user = userEvent.setup();
    stubProvider(AUDIT_PAYLOAD);
    stubImagePipeline();
    renderScanner();

    // A tiny photo re-encodes to something longer, so the original is kept.
    const tiny = new File([new Uint8Array(2)], 'tiny.jpg', { type: 'image/jpeg' });
    await user.upload(document.querySelector('input[type="file"]'), tiny);

    const preview = await screen.findByRole('img', { name: /preview of the uploaded room photo/i });
    await waitFor(() => {
      expect(preview.getAttribute('src')).not.toBe('data:image/jpeg;base64,SMALLER');
    });
  });
});
