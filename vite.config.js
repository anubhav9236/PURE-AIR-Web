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
 * @returns {import('vite').Plugin}
 */
function pureairApiPlugin() {
  const mount = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) return next();
      try {
        const handled = await handleGeminiApi(req, res, {
          apiKey: resolveApiKey(),
          ip: req.socket?.remoteAddress
        });
        if (!handled) next();
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Internal server error.' }));
      }
    });
  };

  return {
    name: 'pureair-api-proxy',
    configureServer: mount,
    configurePreviewServer: mount
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
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'icons-vendor';
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor';
          }
          return undefined;
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
