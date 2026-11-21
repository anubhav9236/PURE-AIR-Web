# Contributing to PureAir Life

Thanks for helping keep PureAir Life honest, fast and accessible.

## The one rule

**`npm run check` must be green.** It is the same gate CI runs:

```
lint -> typecheck -> test:coverage -> build -> audit:dist -> audit:i18n -> report:catalogue
```

If a change cannot pass the gate, it is not finished.

## Getting set up

```bash
npm ci
npm run dev          # Vite dev server + the Gemini proxy on /api/gemini
```

To use the live AI provider, set the key in `.env.local` (never commit it):

```bash
GEMINI_API_KEY=your_key_here
```

The app is fully functional without a key - it falls back to the offline
clean-air guide and says so in the interface.

## Ground rules

1. **Never commit a key.** `GEMINI_API_KEY` is read on the server only. The
   browser never receives it. `scripts/audit-dist.mjs` and
   `tests/unit/security.test.js` fail the build if a key reaches the bundle.
2. **Never present modelled data as live.** Every figure is labelled
   `reference`, `estimated`, `advisory` or `live` in the interface, and the
   dashboard says "Reference baseline" rather than claiming a live feed.
3. **Keep the interface honest about AI output.** A provider answer that fails
   schema validation falls back to the offline guide and is labelled as such.
4. **Every string exists in English and Hindi.** `npm run audit:i18n` fails if
   a catalogue string has no translation.
5. **New behaviour needs a test.** Component tests stub `global.fetch` and let
   the real transport, parser and schema validation run - do not mock the
   service module.

## Where things live

| Path                      | What lives there                                         |
| ------------------------- | -------------------------------------------------------- |
| `src/components/`         | The six workspaces and the shared UI.                    |
| `src/services/gemini/`    | Transport, sanitisation, validation, workflows.          |
| `src/services/telemetry/` | The city catalogue and the EPA AQI maths.                |
| `src/i18n/`               | The bilingual string table and the language provider.    |
| `src/types.d.ts`          | Shared domain types. Import them, do not redeclare them. |
| `tests/unit/`             | Pure logic, security and the deployment guard.           |
| `tests/components/`       | User journeys through the real components.               |
| `tests/accessibility/`    | axe-core audits, contrast and reduced motion.            |
| `tests/e2e/`              | Playwright journeys against the production build.        |
| `scripts/`                | Maintenance reports and audits. They import app modules. |

## Style

- Two spaces, single quotes, semicolons, 100-column soft limit.
- `npm run format` (Prettier) and `npm run lint` (oxlint) both have to be clean.
- Prefer a named function over an inline arrow when the arrow is more than a
  few lines.
- Comment the _why_, never the _what_.

## Commit messages

One line, imperative mood, and say why:

```
Guard the reduced-motion stylesheet with a test

WCAG 2.3.3 asks that motion be avoidable, and the app honours
prefers-reduced-motion in the shipped stylesheet. jsdom has no layout engine
and cannot evaluate a media query, so nothing tested that block.
```

## Pull requests

1. `npm run check`
2. `npm run test:e2e` (needs `npx playwright install chromium` once)
3. Describe the user-visible change, and anything you could not verify.
