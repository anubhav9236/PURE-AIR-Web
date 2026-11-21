import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { handleGeminiApi, resolveApiKey } from './server/geminiProxy.js';

/**
 * Mount the Gemini proxy inside the Vite dev server.
 *
 * This keeps the API key on the machine running the dev server - the browser
 * only ever talks to `/api/gemini` on the same origin, exactly as it does in
 * production behind `server/index.js`.
 *
 * The middleware is deliberately *not* an `async` function: Connect does not
 * await a returned promise, so a rejected promise would become an unhandled
 * rejection. The promise chain below forwards failures to the error handler
 * instead.
 *
 * @param {import('vite').ViteDevServer | import('vite').PreviewServer} server
 */
function mountPureAirApi(server) {
  server.middlewares.use((req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) {
      next();
      return;
    }

    const respondWithError = () => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Internal server error.' }));
      return null;
    };

    const proxyRequest = async () => {
      const handled = await handleGeminiApi(req, res, {
        apiKey: resolveApiKey(),
        ip: req.socket?.remoteAddress
      });
      if (!handled) {
        next();
      }
      return handled;
    };

    proxyRequest().catch(respondWithError);
  });
}

/**
 * Vite plugin that exposes the server-side Gemini proxy during dev and preview.
 *
 * @returns {import('vite').Plugin}
 */
function pureairApiPlugin() {
  return {
    name: 'pureair-api-proxy',
    configureServer: mountPureAirApi,
    configurePreviewServer: mountPureAirApi
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pureairApiPlugin()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires the function form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-react')) return 'icons-vendor';
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173
  }
});
