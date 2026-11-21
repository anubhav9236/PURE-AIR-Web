# PureAir Life

**GenAI-powered environmental assistant for families navigating winter smog and urban air pollution across India.**

PureAir Life turns a city's air-quality profile into practical daily decisions: low-emission
routines, indoor air-quality fixes, sustainable alternatives, and a clear explanation of what
each choice does to your health and your neighbourhood's emissions. It speaks **English and
Hindi**.

---

## What it does

| Workspace | Purpose |
|---|---|
| **Smog Shield** | City baseline, hourly inversion curve, and the physiology of your most at-risk family members. |
| **AI Smog-Armor** | A personalised hour-by-hour low-emission routine built from your household profile (commute, heating, cooking, vulnerabilities). |
| **Room Vision Auditor** | Upload a room photo to find particulate leak paths, airflow bottlenecks and budget DIY fixes. |
| **DIY Hack Lab** | Corsi-Rosenthal box CADR/ACH simulator plus a single-zone indoor concentration model grounded in your city's baseline. |
| **Family Impact** | Berkeley Earth cigarette-equivalent avoidance, CO₂/soot savings, and pledges that actually change the numbers. |
| **Clean Air AI** | Conversational assistant with multi-turn context, bilingual, and honest about its own provenance. |

---

## Security model

The Google Gemini API key **never reaches the browser**.

```
browser ──POST /api/gemini──▶  Node server (server/geminiProxy.js)  ──▶  Google Gemini
          (no credential)      holds GEMINI_API_KEY, validates,
                                rate-limits, fails over, redacts
```

- The key is read from the `GEMINI_API_KEY` environment variable.
- The Vite dev server mounts the same proxy handler, so `npm run dev` behaves
  exactly like production.
- The proxy enforces a request body limit, a per-IP rate limit, a hard timeout
  budget (8 s per model, 20 s for the whole failover chain), model failover and
  generic error messages (no stack traces, no provider internals).
- `tests/unit/security.test.js` fails the build if a key-shaped string ever
  reappears in the source tree or in `dist/`.
- If the provider is unreachable, the app falls back to a bundled offline
  clean-air guide and **says so** - it never fabricates an AI answer.
- The header badge tracks reality: it shows **AI live** only while the provider
  is reachable *and* the last answer came from the model. As soon as an answer
  falls back, the badge switches to **Local guide**.

### Static hosting without a server

Deploying `dist/` alone works; the assistant then runs on the offline guide and
shows an **"AI offline"** badge. Users can paste their own Google AI Studio key
from the header badge - it is kept in `sessionStorage` for that tab only.

> Never place a key in a `VITE_*` variable for a public deployment: Vite inlines
> `VITE_*` values into the JavaScript bundle.

---

## Deploying to Vercel

The repo deploys as a **static Vite build plus one serverless function**.

```
api/gemini.js        ->  Vercel Function  ->  /api/gemini
src/                 ->  static build      ->  dist/
```

| Request | Handling |
|---|---|
| `GET /api/gemini` | Provider status: `{ configured, models }` |
| `POST /api/gemini` | `{ prompt, systemInstruction, history, imageBase64 }` -> Gemini |

`api/gemini.js` is a thin adapter: it delegates to the **same**
`server/geminiProxy.js` handler used by the Node server and the Vite dev
server, so validation, rate limiting, timeouts, failover and error redaction
behave identically on every host.

### 1. Set the environment variable

Vercel dashboard -> **PureAir-Life** -> **Settings** -> **Environment
Variables**:

| Name | Value | Scope |
|---|---|---|
| `GEMINI_API_KEY` | your Google AI Studio key | Production (and Preview, if wanted) |

Use a **plain** name. A `VITE_`-prefixed variable is inlined into the client
bundle and would publish the key.

### 2. Push and deploy

`vercel.json` pins the framework, build command and output directory, and
rewrites the legacy `GET /api/gemini/status` path onto the function:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/api/gemini/status", "destination": "/api/gemini" }]
}
```

### Vercel platform limits, and how the app respects them

| Limit | Value | How PureAir Life stays inside it |
|---|---|---|
| Request / response body | 4.5 MB | The browser downscales room photos to a 1280 px JPEG before upload; the proxy caps the body at 4 MB and answers `413` itself rather than letting the platform return an opaque `FUNCTION_PAYLOAD_TOO_LARGE`. |
| Function duration | 300 s (Hobby, Fluid Compute) | The proxy budgets 8 s per model and 20 s for the whole failover chain, then returns a clean error so the client falls back to the local guide. |
| Function memory | 2 GB (Hobby) | The function has **no third-party dependencies** - Node standard library only. |

### Deploying the Node server instead

`npm start` serves `dist/` and the proxy from one process on port 8787. It is
not used by Vercel (which runs the serverless function), but it is the
simplest way to self-host the same behaviour.

---

## Getting started

```bash
npm install

# Live AI (recommended)
cp .env.example .env          # then set GEMINI_API_KEY
set GEMINI_API_KEY=your_key   # PowerShell
npm run build
npm start                     # http://127.0.0.1:8787

# Development (Vite dev server + the same API proxy)
set GEMINI_API_KEY=your_key
npm run dev                   # http://localhost:5173
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with the Gemini proxy mounted. |
| `npm run build` | Production build into `dist/` (Tailwind compiled, code-split). |
| `npm start` | Serves `dist/` with security headers and the Gemini proxy. |
| `npm run preview` | Vite's own preview server. |
| `npm test` | Vitest unit, integration, component and accessibility suite. |
| `npm run test:coverage` | Same suite with a coverage report and enforced thresholds. |
| `npm run lint` | oxlint - configured to report zero errors *and* zero warnings. |
| `npm run typecheck` | `tsc --noEmit` over the whole `src/` tree (JSDoc types). |
| `npm run check` | The full gate: lint + typecheck + coverage + build + dist/i18n/catalogue audits. |
| `npm run audit:i18n` | Checks every catalogue string has a Hindi translation. |
| `npm run audit:city` | Regenerates city AQI from PM2.5 using the EPA breakpoint table. |
| `npm run audit:dist` | Scans the built bundle for secrets, CDN links and inline scripts. |
| `npm run report:catalogue` | Catalogue inventory: AQI/PM2.5 consistency + translation coverage. |
| `npm run diagnose:provider` | Live-provider connectivity diagnostic (no key required). |

### Quality gate

`npm run check` is the single command that must stay green. It runs, in order:

| Step | Gate |
|---|---|
| `lint` | oxlint reports no error and no warning. |
| `typecheck` | `tsc` reports no type error across `src/`. |
| `test:coverage` | 347 tests pass and coverage stays above the floors in `vitest.config.js` (88% statements, 80% branches, 84% functions, 90% lines). |
| `build` | The production Vite build succeeds. |
| `audit:dist` | The built bundle contains no key, no CDN script and no inline script. |
| `audit:i18n` | Every catalogue string has a Hindi translation. |
| `report:catalogue` | Every city's stored AQI matches its PM2.5, and every catalogue string is translated. |

The maintenance scripts **import** the application modules rather than parsing
the source text, so a report can never drift from the running code.

---

## Architecture

```
src/
  App.jsx                     shell, lazy tab routing, state that survives tab switches
  components/                 Navbar, Dashboard, Planner, Scanner, HackLab, ImpactLedger,
                              AssistantChat, Modal, Provenance, ErrorBoundary
  types.d.ts                  shared domain types (CityRecord, Routine, VisionAudit, ...)
  i18n/
    strings.js                facade over the per-domain UI string table (EN/HI)
    strings/                  app, nav, ai, dash, planner, scanner, hacklab, impact, chat
    phrases.js                Hindi translations for the catalogue's descriptive data
    LanguageProvider.jsx      language state, <html lang>, persistence
    languageContext.js        context + storage helpers
  services/
    geminiService.js          facade over the Gemini modules
    gemini/                   sessionKey, sanitize, transport, validation, workflows
    localGuide.js             bilingual offline knowledge base
    telemetryService.js       facade over the telemetry modules
    telemetry/                cityCatalogue, aqi, vulnerableProfiles
    iaqCalculatorService.js   CR-box CADR/ACH, Berkeley Earth model, mass balance
  utils/confetti.js           dependency-free canvas confetti
api/
  gemini.js                   Vercel serverless function -> /api/gemini
server/
  geminiProxy.js              validation, rate limiting, failover, redaction
  index.js                    static server + security headers + proxy
scripts/
  realign-city-aqi.mjs        regenerates city AQI/status from PM2.5
  audit-i18n.mjs              reports catalogue strings with no Hindi translation
  audit-dist.mjs              scans the built bundle for secrets, CDN links, inline scripts
  report-catalogue.mjs        catalogue inventory and consistency report
  diagnose-provider.mjs       live-provider connectivity diagnostic (never prints a key)
tests/
  unit/                       pure logic, security, deployment guard
  components/                 user journeys through the real components
  accessibility/              axe-core audits + the WCAG contrast guard
vercel.json                   Vercel build + rewrite configuration
```

- **Large modules are split behind stable facades.** `telemetryService.js`,
  `geminiService.js` and `strings.js` stay the public entry points; the
  implementation lives in focused sub-modules. Every call site keeps working,
  and `tests/unit/deploy.test.js` fails the build if a module under `src/` is
  ever left unreferenced - dead code cannot creep back in.
- **The source tree is type-checked.** The app is plain JavaScript with JSDoc
  annotations, and `jsconfig.json` turns on `checkJs` so `npm run typecheck`
  runs `tsc --noEmit` over all of `src/`. The shared domain shapes live in
  `src/types.d.ts` and are imported from the components with
  `import('../types').CityRecord`, so a change to the city catalogue or the
  routine schema is caught everywhere it is used instead of drifting.
- **Tailwind CSS is compiled at build time** - no runtime CDN, no flash of
  unstyled content, and a strict Content-Security-Policy without
  `unsafe-inline` for scripts.
- **Workspaces are code-split**; the dashboard ships in the initial bundle and
  each other workspace loads on demand.
- **Visited workspaces stay mounted**, so switching tabs never loses a
  generated routine or an uploaded photo.

---

## Bilingual (English / हिन्दी)

The language switch in the header swaps the entire interface, not just the
headings:

- `src/i18n/strings/` holds the UI chrome, one module per domain (`app`,
  `nav`, `ai`, `dash`, `planner`, `scanner`, `hacklab`, `impact`, `chat`);
  `src/i18n/strings.js` is the facade that merges them. Every key carries both
  an English and a Hindi value, and an unknown key degrades to English rather
  than rendering blank.
- `src/i18n/phrases.js` holds the Hindi translations for the *data* strings the
  catalogue ships with: haze descriptors, inversion physics, AQI category
  guidance, the diurnal action hints and the vulnerable-group profiles. A
  missing entry falls back to the English source instead of blanking the UI.
- The choice is stored in `localStorage` and applied to `<html lang>` so screen
  readers announce the right language.
- `npm run audit:i18n` fails if a newly added city or profile ships without a
  Hindi translation.

---

## Data honesty

PureAir Life distinguishes four kinds of information, and labels every one of
them in the UI:

- **Reference baseline** - the shipped per-city winter-episode values. These
  are modelled reference figures, *not* a live monitoring feed.
- **Estimated** - values computed by a documented model (CADR/ACH, Berkeley
  Earth, single-zone mass balance).
- **Advisory** - general guidance that is not tied to any measurement.
- **Live** - only ever a genuine model response from the provider.

Each city's AQI is derived from its PM2.5 using the published US EPA
breakpoint table, so the two numbers shown side by side always agree. The
catalogue can be regenerated with `npm run audit:city`.

Health guidance is written responsibly: it points people to a doctor for
symptoms such as breathlessness, chest pain or asthma attacks, and it never
invents live readings or statistics.

---

## Testing

```bash
npm test
```

The suite is 347 tests across 24 files and covers telemetry and EPA breakpoint
maths, the CR-box and Berkeley Earth models, the indoor mass-balance model,
input sanitisation (including that Devanagari survives), model-response schema
validation, provider failover and fallbacks, the proxy's validation, routing
and rate limiting, secret scanning of both source and `dist/`, bilingual
coverage of the catalogue, the language provider's switching and persistence,
and component-level user journeys (navigation, language switching, city search,
pledges, chat).

**Nothing is mocked below the network boundary.** Component and journey tests
stub `global.fetch` and let the real transport, the real JSON parser, the real
schema validator and the real components run - so a test fails when the
application is broken, not when a mock is stale. `tests/components/AppWorkflows.test.jsx`
drives the whole shell: the dashboard call-to-action into the planner, the
generated routine crediting the household's avoided cigarettes and CO2, a pledge
crediting resilience points, and visited workspaces staying mounted so the user
never loses their work.

The suite contains **zero skipped tests**, and coverage is a hard gate
(`vitest.config.js`) rather than a report nobody reads:

| Metric | Floor | Actual |
|---|---|---|
| Statements | 88% | 92.8% |
| Branches | 80% | 85.1% |
| Functions | 84% | 89.0% |
| Lines | 90% | 95.1% |

`tests/unit/deploy.test.js` is the deployment guard. It fails the build when
the repository would break a host:

- a required module (`src/main.jsx`, `server/geminiProxy.js`, `api/gemini.js`,
  `vercel.json`, ...) is missing;
- `index.html` points at an entry module that does not exist;
- a file imports a package that is not declared in `package.json`, or a
  package that cannot be resolved;
- a `node <file>` npm script points at a file that does not exist;
- `vercel.json` is misconfigured;
- `.gitignore` would exclude `src`, `server`, `api`, `tests` or `scripts` -
  the mistake that produced an empty repository and a *"Module not found"*
  build failure;
- a key-shaped string appears anywhere in the source tree;
- a module under `src/` is not reachable from `src/main.jsx` - dead code is a
  build failure.

### Manual intervention required

The live AI path needs a credential that is **not** stored in the repository:

```powershell
$env:GEMINI_API_KEY = "<your Google AI Studio key>"
npm start
```

Without it the app is fully functional on the offline clean-air guide and
states that plainly. Anyone who previously ran a version with a key committed
to the source should **rotate that key** in Google AI Studio.

---

## Accessibility

Built to WCAG 2.2 AA: semantic landmarks, a skip link, labelled form
controls, an ARIA tablist with arrow-key navigation and roving tabindex,
`aria-pressed` toggles, visible focus rings, a live region for the
conversation, text alternatives for the chart, colour contrast raised to
AA-compliant levels, and a `prefers-reduced-motion` block that disables the
transform animations.

Accessibility is **verified, not asserted**:

- `tests/accessibility/workspaces.test.js` runs **axe-core** against every one
  of the six workspaces and the application shell, and fails on any violation.
  A companion test proves the harness really detects a deliberate violation,
  so the suite cannot pass vacuously.
- `tests/accessibility/contrast.test.js` computes the WCAG contrast ratio for
  the colour pairs the interface uses, because jsdom has no layout engine and
  cannot evaluate colour contrast. It also fails the build if white text is
  ever placed back on `teal-600` or on a translucent white chip - the two
  combinations that used to miss AA.
- The same axe-core audit was run against the built application in a real
  browser, at every scroll position of every workspace, and reports **zero**
  violations - including colour contrast, which only a real browser can check.
- `label-content-name-mismatch` is handled properly: each control's accessible
  name contains its visible label, so a screen-reader user hears the same words
  a sighted user reads.
- Scrollable regions are keyboard reachable, and the modal traps focus while
  it is open.
