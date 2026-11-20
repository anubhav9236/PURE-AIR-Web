import { describe, it, expect, afterEach } from 'vitest';
import {
  validateRequestBody,
  buildProviderPayload,
  extractText,
  consumeRateLimit,
  handleGeminiApi,
  resolveApiKey,
  MODEL_CHAIN
} from '../../server/geminiProxy.js';

/**
 * Minimal response double that records what the handler wrote.
 */
function fakeRes() {
  const state = { status: 0, headers: {}, body: '' };
  return {
    state,
    writeHead(status, headers) {
      state.status = status;
      state.headers = headers || {};
      return this;
    },
    setHeader(name, value) {
      state.headers[name] = value;
      return this;
    },
    end(body) {
      state.body = body ?? '';
      return this;
    }
  };
}

/**
 * Minimal request double that streams an optional body.
 * @param {{ url?: string, method?: string, body?: string|Buffer|null }} options
 */
function fakeReq({ url = '/api/gemini', method = 'GET', body = null } = {}) {
  const listeners = {};
  const req = {
    url,
    method,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    on(event, callback) {
      (listeners[event] ||= []).push(callback);
      return req;
    },
    destroy() {}
  };

  queueMicrotask(() => {
    if (body !== null && body !== undefined) {
      const chunk = Buffer.isBuffer(body) ? body : Buffer.from(body);
      for (const callback of listeners.data || []) callback(chunk);
    }
    for (const callback of listeners.end || []) callback();
  });

  return req;
}

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.VITE_GEMINI_API_KEY;
});

describe('Server proxy - request validation', () => {
  it('rejects a non-object body', () => {
    expect(validateRequestBody(null).ok).toBe(false);
    expect(validateRequestBody('string').ok).toBe(false);
    expect(validateRequestBody([]).ok).toBe(false);
  });

  it('rejects an empty prompt', () => {
    const result = validateRequestBody({ prompt: '   ' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/prompt/i);
  });

  it('accepts a valid minimal request', () => {
    const result = validateRequestBody({ prompt: 'How do I protect my family?' });
    expect(result.ok).toBe(true);
    expect(result.value.prompt).toBe('How do I protect my family?');
  });

  it('caps the prompt length', () => {
    const result = validateRequestBody({ prompt: 'a'.repeat(50000) });
    expect(result.ok).toBe(true);
    expect(result.value.prompt.length).toBeLessThanOrEqual(12000);
  });

  it('strips control characters from prompts', () => {
    const result = validateRequestBody({ prompt: 'safetext' });
    // eslint-disable-next-line no-control-regex -- deliberately checks control characters
    expect(result.value.prompt).not.toMatch(/[\u0000-\u001f]/);
  });

  it('rejects non-base64 image payloads', () => {
    const result = validateRequestBody({
      prompt: 'analyse this',
      imageBase64: '!!!not base64!!!'
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/base64/i);
  });

  it('accepts a data-URL image payload and strips the prefix', () => {
    const result = validateRequestBody({
      prompt: 'analyse',
      imageBase64: `data:image/jpeg;base64,${'A'.repeat(400)}`
    });
    expect(result.ok).toBe(true);
    expect(result.value.imageBase64.startsWith('data:')).toBe(false);
  });

  it('rejects an image mime type that is not an image', () => {
    const result = validateRequestBody({
      prompt: 'analyse',
      imageBase64: 'A'.repeat(400),
      mimeType: 'text/html'
    });
    expect(result.ok).toBe(true);
    expect(result.value.mimeType).toBe('image/jpeg');
  });

  it('ignores an unrecognised requested model', () => {
    const result = validateRequestBody({ prompt: 'hi', model: 'evil-model' });
    expect(result.value.model).toBeNull();
  });

  it('accepts a model from the failover chain', () => {
    const result = validateRequestBody({ prompt: 'hi', model: MODEL_CHAIN[0] });
    expect(result.value.model).toBe(MODEL_CHAIN[0]);
  });

  it('caps the number of history turns', () => {
    const history = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      text: `turn ${i}`
    }));
    const result = validateRequestBody({ prompt: 'hi', history });
    expect(result.value.history.length).toBeLessThanOrEqual(10);
  });
});

describe('Server proxy - provider payload', () => {
  it('places history before the current turn', () => {
    const payload = buildProviderPayload({
      prompt: 'current',
      systemInstruction: 'be helpful',
      imageBase64: null,
      mimeType: 'image/jpeg',
      history: [{ role: 'user', text: 'earlier' }],
      model: null
    });

    expect(payload.contents).toHaveLength(2);
    expect(payload.contents[0].parts[0].text).toBe('earlier');
    expect(payload.contents[1].parts[0].text).toBe('current');
  });

  it('includes the system instruction when provided', () => {
    const payload = buildProviderPayload({
      prompt: 'x',
      systemInstruction: 'be helpful',
      imageBase64: null,
      mimeType: 'image/jpeg',
      history: [],
      model: null
    });
    expect(payload.systemInstruction.parts[0].text).toBe('be helpful');
  });

  it('omits the system instruction when empty', () => {
    const payload = buildProviderPayload({
      prompt: 'x',
      systemInstruction: '',
      imageBase64: null,
      mimeType: 'image/jpeg',
      history: [],
      model: null
    });
    expect(payload.systemInstruction).toBeUndefined();
  });
});

describe('Server proxy - response parsing', () => {
  it('extracts the first text block', () => {
    const data = { candidates: [{ content: { parts: [{ text: 'hello' }] } }] };
    expect(extractText(data)).toBe('hello');
  });

  it('joins multiple text parts', () => {
    const data = { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] };
    expect(extractText(data)).toBe('ab');
  });

  it('returns an empty string for an unusable payload', () => {
    expect(extractText({})).toBe('');
    expect(extractText(null)).toBe('');
    expect(extractText({ candidates: [] })).toBe('');
  });
});

describe('Server proxy - rate limiting', () => {
  it('blocks requests beyond the configured budget', () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 250) + 1}`;
    let blocked = false;
    for (let i = 0; i < 60; i += 1) {
      const result = consumeRateLimit(ip);
      if (!result.allowed) {
        blocked = true;
        expect(result.retryAfterSeconds).toBeGreaterThan(0);
        break;
      }
    }
    expect(blocked).toBe(true);
  });

  it('keeps separate buckets per IP', () => {
    const a = `192.168.1.${Math.floor(Math.random() * 250) + 1}`;
    const b = `192.168.2.${Math.floor(Math.random() * 250) + 1}`;
    for (let i = 0; i < 40; i += 1) consumeRateLimit(a);
    expect(consumeRateLimit(b).allowed).toBe(true);
  });
});

describe('Server proxy - model failover chain', () => {
  it('lists real, currently served Gemini models', () => {
    expect(MODEL_CHAIN).toContain('gemini-3.8-flash');
    expect(MODEL_CHAIN.length).toBeGreaterThan(1);
    for (const model of MODEL_CHAIN) {
      expect(model).toMatch(/^gemini-[0-9.]+-(flash|flash-lite)$/);
    }
  });
});

describe('Server proxy - credential handling', () => {
  it('reads the key from GEMINI_API_KEY only', () => {
    process.env.GEMINI_API_KEY = 'server-side-key';
    process.env.VITE_GEMINI_API_KEY = 'client-visible-key';
    expect(resolveApiKey()).toBe('server-side-key');
  });

  it('never falls back to a VITE_ variable, which would be bundled into the client', () => {
    process.env.VITE_GEMINI_API_KEY = 'client-visible-key';
    expect(resolveApiKey()).toBeNull();
  });

  it('returns null when no key is configured', () => {
    expect(resolveApiKey()).toBeNull();
  });
});

describe('Server proxy - HTTP routing', () => {
  it('serves the provider status on GET /api/gemini', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(fakeReq({ url: '/api/gemini', method: 'GET' }), res, {
      apiKey: 'a-key'
    });

    expect(handled).toBe(true);
    expect(res.state.status).toBe(200);
    const payload = JSON.parse(res.state.body);
    expect(payload.configured).toBe(true);
    expect(payload.models).toEqual(MODEL_CHAIN);
    // The status response must never expose the key itself.
    expect(res.state.body).not.toContain('a-key');
  });

  it('still serves the legacy GET /api/gemini/status path', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(
      fakeReq({ url: '/api/gemini/status', method: 'GET' }),
      res,
      { apiKey: null }
    );

    expect(handled).toBe(true);
    expect(res.state.status).toBe(200);
    expect(JSON.parse(res.state.body).configured).toBe(false);
  });

  it('reports that no provider is configured when the key is missing', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(
      fakeReq({ url: '/api/gemini', method: 'POST', body: '{"prompt":"hi"}' }),
      res,
      { apiKey: null }
    );

    expect(handled).toBe(true);
    expect(res.state.status).toBe(503);
    const payload = JSON.parse(res.state.body);
    expect(payload.code).toBe('provider_not_configured');
    expect(payload.error).not.toMatch(/stack|at .*\.js:\d+/i);
  });

  it('rejects an unsupported method', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(fakeReq({ url: '/api/gemini', method: 'DELETE' }), res, {
      apiKey: 'a-key'
    });

    expect(handled).toBe(true);
    expect(res.state.status).toBe(405);
  });

  it('rejects a malformed JSON body', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(
      fakeReq({ url: '/api/gemini', method: 'POST', body: '{not json' }),
      res,
      { apiKey: 'a-key' }
    );

    expect(handled).toBe(true);
    expect(res.state.status).toBe(400);
  });

  it('rejects a body larger than the platform limit', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(
      fakeReq({
        url: '/api/gemini',
        method: 'POST',
        body: Buffer.alloc(5 * 1024 * 1024, 'a')
      }),
      res,
      { apiKey: 'a-key' }
    );

    expect(handled).toBe(true);
    expect(res.state.status).toBe(413);
  });

  it('ignores requests outside the API namespace', async () => {
    const res = fakeRes();
    const handled = await handleGeminiApi(fakeReq({ url: '/index.html', method: 'GET' }), res, {
      apiKey: 'a-key'
    });
    expect(handled).toBe(false);
  });
});
