# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately rather than in a public issue.
Open a GitHub security advisory on the repository, or contact the maintainer
directly.

You can expect an acknowledgement within 72 hours and a status update within
seven days.

## Security model

PureAir Life is designed so that **no API key ever reaches the browser**.

| Control                                                          | Where                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| The provider key is read on the server only                      | `server/geminiProxy.js`, `api/gemini.js`                   |
| The browser talks to `/api/gemini` on its own origin             | `src/services/gemini/transport.js`                         |
| Inputs are validated, length-capped and sanitised before use     | `src/services/gemini/sanitize.js`, `server/geminiProxy.js` |
| Rate limiting per client address                                 | `server/geminiProxy.js`                                    |
| Model responses are schema-validated and redacted before display | `src/services/gemini/validation.js`                        |
| Security headers and a strict Content-Security-Policy            | `server/index.js`, `vercel.json`                           |
| A secret scan of the source tree                                 | `tests/unit/security.test.js`                              |
| A secret scan of the built bundle                                | `scripts/audit-dist.mjs`                                   |
| A dependency audit                                               | `npm audit`, and the `dependency-audit` CI job             |

## What the app will not do

- It will never embed a key in the frontend bundle.
- It will never present modelled or estimated figures as live measurements -
  every value is labelled `reference`, `estimated`, `advisory` or `live`.
- It will never render a provider answer that has not passed schema
  validation; the offline guide is used instead and the interface says so.

## Client-supplied keys (optional)

A user may paste their own provider key into the interface. It is kept in
`sessionStorage` for that tab only, is sent to the proxy over the same origin,
and is never written to `localStorage`, a cookie, or a log.
