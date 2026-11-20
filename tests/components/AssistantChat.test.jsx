import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistantChat from '../../src/components/AssistantChat.jsx';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';

const HOTSPOT = {
  id: 'delhi',
  name: 'Delhi',
  state: 'Delhi NCR',
  aqi: 342,
  pm25: 280,
  status: 'Severe',
  smogType: 'Stubble smoke + vehicular aerosol',
  inversionStrength: 'Severe',
  peakSmogHours: '05:30 - 09:30',
  safeWindow: '11:00 AM - 3:00 PM'
};

// The client throttles provider calls to one per 600 ms, so async assertions
// need more head-room than the 1 s default when the suite runs in parallel.
const WAIT = { timeout: 10000 };

function renderChat() {
  return render(
    <LanguageProvider>
      <AssistantChat hotspot={HOTSPOT} />
    </LanguageProvider>
  );
}

/**
 * Type a message and send it.
 * @param {object} user
 * @param {string} text
 */
async function sendMessage(user, text) {
  const input = screen.getByLabelText(/ask the clean air assistant/i);
  await user.type(input, text);
  await user.click(screen.getByRole('button', { name: /^send$/i }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ ok: false, error: 'unavailable', code: 'provider_unavailable' })
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Assistant chat rendering', () => {
  it('renders the conversation with the greeting', () => {
    renderChat();
    // The greeting is split across emphasis spans, so assert on the log text.
    expect(screen.getByRole('log').textContent).toMatch(
      /hello! i am your pureair life ai assistant/i
    );
  });

  it('exposes the conversation as a live region', () => {
    renderChat();
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });

  it('labels the message input', () => {
    renderChat();
    expect(screen.getByLabelText(/ask the clean air assistant/i)).toBeInTheDocument();
  });

  it('offers bilingual quick prompts', () => {
    renderChat();
    expect(screen.getByText(/Is it safe to walk my dog right now\?/i)).toBeInTheDocument();
  });

  it('marks the environment as offline when no provider is configured', async () => {
    renderChat();
    await waitFor(() => {
      expect(screen.getByText(/Local guide/i)).toBeInTheDocument();
    }, WAIT);
  });
});

describe('Assistant chat interaction', () => {
  it('sends a typed question and shows the answer', async () => {
    const user = userEvent.setup();
    renderChat();

    await sendMessage(user, 'How can I protect my family during smog?');

    await waitFor(() => {
      expect(screen.getByText(/How can I protect my family during smog\?/i)).toBeInTheDocument();
    }, WAIT);
    await waitFor(() => {
      expect(screen.getByText(/thermal inversion/i)).toBeInTheDocument();
    }, WAIT);
  });

  it('labels offline answers honestly instead of claiming live AI output', async () => {
    const user = userEvent.setup();
    renderChat();

    await sendMessage(user, 'indoor air quality');

    await waitFor(() => {
      // The greeting is also an offline message, so more than one badge may
      // legitimately carry this label - what matters is that it is present and
      // that no badge claims a live model response.
      const badges = screen.getAllByText(
        /Offline clean-air guide \(no AI provider available\)/i
      );
      expect(badges.length).toBeGreaterThan(0);
    }, WAIT);

    expect(screen.queryByText(/Live Gemini response/i)).not.toBeInTheDocument();
  });

  it('stops advertising a live model once the provider falls back', async () => {
    // The provider answers the status probe but the answer request fails.
    // The status probe is a GET, the generation call is a POST, so the mock
    // discriminates on the HTTP method rather than on the URL.
    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        const method = String(init?.method || 'GET').toUpperCase();
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ configured: true, models: ['gemini-3.8-flash'] })
          });
        }
        return Promise.resolve({
          ok: false,
          status: 503,
          json: async () => ({ ok: false, code: 'provider_unavailable' })
        });
      })
    );

    const user = userEvent.setup();
    renderChat();

    await waitFor(() => {
      expect(screen.getByText(/AI live/i)).toBeInTheDocument();
    }, WAIT);

    await sendMessage(user, 'indoor air quality');

    // The greeting already carries an offline badge, so wait until the
    // *answer* is labelled too.
    await waitFor(() => {
      expect(
        screen.getAllByText(/Offline clean-air guide \(no AI provider available\)/i).length
      ).toBeGreaterThanOrEqual(2);
    }, WAIT);

    // The header must stop claiming a live model and state the local guide.
    await waitFor(() => {
      expect(screen.queryByText(/AI live/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Local guide/i).length).toBeGreaterThan(0);
    }, WAIT);
  });

  it('does not send an empty message', async () => {    const user = userEvent.setup();
    renderChat();

    const send = screen.getByRole('button', { name: /^send$/i });
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText(/ask the clean air assistant/i), '   ');
    expect(send).toBeDisabled();
  });

  it('caps the message length', () => {
    renderChat();
    const input = screen.getByLabelText(/ask the clean air assistant/i);
    expect(input).toHaveAttribute('maxLength', '1000');
  });

  it('sends a quick prompt chip', async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole('button', { name: /How do I build an emergency Corsi-Rosenthal box\?/i })
    );

    await waitFor(() => {
      const matches = screen.getAllByText(/How do I build an emergency Corsi-Rosenthal box\?/i);
      expect(matches.length).toBeGreaterThan(1);
    }, WAIT);
  });

  it('clears the conversation back to the greeting', async () => {
    const user = userEvent.setup();
    renderChat();

    await sendMessage(user, 'a question');

    await waitFor(() => {
      expect(screen.getByText('a question')).toBeInTheDocument();
    }, WAIT);

    await user.click(screen.getByRole('button', { name: /clear conversation/i }));
    expect(screen.queryByText('a question')).not.toBeInTheDocument();
  });
});
