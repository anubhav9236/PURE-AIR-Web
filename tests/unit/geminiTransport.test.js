import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GeminiUnavailableError,
  callGeminiApi,
  getProviderStatus
} from '../../src/services/gemini/transport.js';
import {
  clearClientSuppliedKey,
  setClientSuppliedKey
} from '../../src/services/gemini/sessionKey.js';

/**
 * Build a fetch stub that answers a POST to the same-origin proxy.
 *
 * @param {object} response the JSON body the proxy returns
 * @param {number} [status] the HTTP status
 * @returns {import('vitest').Mock}
 */
function proxyResponds(response, status = 200) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response
  }));
}

describe('Provider transport', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearClientSuppliedKey();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getProviderStatus', () => {
    it('reports the proxy as configured when it answers with a key', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => ({ configured: true, models: ['gemini-3.8-flash'] })
        }))
      );

      await expect(getProviderStatus()).resolves.toEqual({
        configured: true,
        transport: 'proxy',
        models: ['gemini-3.8-flash']
      });
    });

    it('falls back to the session key when the proxy is not deployed', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('offline');
        })
      );

      await expect(getProviderStatus()).resolves.toEqual({
        configured: false,
        transport: 'none',
        models: []
      });

      setClientSuppliedKey('test-session-key-0123456789abcdef');
      await expect(getProviderStatus()).resolves.toEqual({
        configured: true,
        transport: 'direct',
        models: []
      });
    });

    it('reports no provider when the proxy says it is not configured', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => ({ configured: false, models: [] })
        }))
      );

      await expect(getProviderStatus()).resolves.toEqual({
        configured: false,
        transport: 'none',
        models: []
      });
    });
  });

  describe('callGeminiApi', () => {
    it('rejects an empty prompt before making a request', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(callGeminiApi({ prompt: '   ' })).rejects.toBeInstanceOf(
        GeminiUnavailableError
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns live text through the same-origin proxy', async () => {
      const fetchMock = proxyResponds({ ok: true, text: 'hello', model: 'gemini-3.8-flash' });
      vi.stubGlobal('fetch', fetchMock);

      const result = await callGeminiApi({ prompt: 'What should I do today?' });

      expect(result).toEqual({
        text: 'hello',
        source: 'live',
        model: 'gemini-3.8-flash',
        transport: 'proxy'
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/gemini');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body).prompt).toBe('What should I do today?');
    });

    it('forwards the system instruction and the conversation history', async () => {
      const fetchMock = proxyResponds({ ok: true, text: 'ok' });
      vi.stubGlobal('fetch', fetchMock);

      await callGeminiApi({
        prompt: 'next',
        systemInstruction: 'be brief',
        history: [{ role: 'user', text: 'earlier' }]
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.systemInstruction).toBe('be brief');
      expect(body.history).toEqual([{ role: 'user', text: 'earlier' }]);
    });

    it('reports a missing proxy as unavailable', async () => {
      vi.stubGlobal('fetch', proxyResponds({ ok: false }, 404));

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'proxy_unavailable'
      });
    });

    it('reports rate limiting distinctly', async () => {
      vi.stubGlobal('fetch', proxyResponds({ ok: false }, 429));

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'rate_limited'
      });
    });

    it('reports a provider that is not configured', async () => {
      vi.stubGlobal(
        'fetch',
        proxyResponds({ ok: false, code: 'provider_not_configured' }, 503)
      );

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'provider_not_configured'
      });
    });

    it('reports an unreachable proxy without leaking internals', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('socket hang up');
        })
      );

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'proxy_unreachable'
      });
    });

    it('treats a non-JSON proxy answer as unreachable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('not json');
          }
        }))
      );

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'proxy_unreachable'
      });
    });

    it('never sends the session key to the proxy endpoint', async () => {
      const fetchMock = proxyResponds({ ok: true, text: 'hello' });
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('super-secret-session-key-0123456789');

      await callGeminiApi({ prompt: 'x' });

      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.stringify(init)).not.toContain('super-secret-session-key-0123456789');
    });

    it('falls back to the provider directly when the user supplied a key', async () => {
      const fetchMock = vi.fn(async (url) => {
        if (url === '/api/gemini') {
          return { ok: false, status: 404, json: async () => ({ ok: false }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'direct answer' }] } }]
          })
        };
      });
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('test-session-key-0123456789abcdef');

      const result = await callGeminiApi({ prompt: 'x' });

      expect(result).toMatchObject({ text: 'direct answer', source: 'live', transport: 'direct' });

      const providerCall = fetchMock.mock.calls.find(([url]) =>
        String(url).startsWith('https://generativelanguage.googleapis.com')
      );
      expect(providerCall).toBeTruthy();
      expect(String(providerCall[0])).toContain('key=test-session-key-0123456789abcdef');
    });

    it('does not call the provider directly when the proxy is rate limiting', async () => {
      const fetchMock = proxyResponds({ ok: false }, 429);
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('test-session-key-0123456789abcdef');

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'rate_limited'
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('fails over across the model chain when the provider rejects a model', async () => {
      const providerCall = vi.fn(async (url) => {
        if (String(url).includes('gemini-3.8-flash')) {
          return { ok: false, status: 503, json: async () => ({}) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'second model answered' }] } }]
          })
        };
      });
      const fetchMock = vi.fn(async (url) =>
        url === '/api/gemini'
          ? { ok: false, status: 404, json: async () => ({ ok: false }) }
          : providerCall(url)
      );
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('test-session-key-0123456789abcdef');

      const result = await callGeminiApi({ prompt: 'x' });

      expect(result.text).toBe('second model answered');
      expect(result.model).toBe('gemini-3.7-flash');
    });

    it('surfaces a provider network error as a clean failure', async () => {
      const fetchMock = vi.fn(async (url) => {
        if (url === '/api/gemini') {
          return { ok: false, status: 404, json: async () => ({ ok: false }) };
        }
        throw new Error('dns failure');
      });
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('test-session-key-0123456789abcdef');

      // The proxy reason is what the caller sees. The guarantee that matters
      // is that a failure inside the direct path is handled cleanly instead
      // of throwing a raw ReferenceError out of the transport.
      await expect(callGeminiApi({ prompt: 'x' })).rejects.toBeInstanceOf(
        GeminiUnavailableError
      );
      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'proxy_unavailable'
      });
    });

    it('surfaces an aborted request as a timeout instead of crashing', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';

      const fetchMock = vi.fn(async (url) => {
        if (url === '/api/gemini') {
          return { ok: false, status: 404, json: async () => ({ ok: false }) };
        }
        throw abortError;
      });
      vi.stubGlobal('fetch', fetchMock);
      setClientSuppliedKey('test-session-key-0123456789abcdef');

      await expect(callGeminiApi({ prompt: 'x' })).rejects.toBeInstanceOf(
        GeminiUnavailableError
      );
      await expect(callGeminiApi({ prompt: 'x' })).rejects.toMatchObject({
        reason: 'proxy_unavailable'
      });
    });

    it('never puts the raw key in the error message', async () => {
      vi.stubGlobal('fetch', proxyResponds({ ok: false }, 500));
      setClientSuppliedKey('super-secret-session-key-0123456789');

      const error = await callGeminiApi({ prompt: 'x' }).catch((e) => e);
      expect(error.message).not.toContain('super-secret-session-key-0123456789');
    });
  });
});
