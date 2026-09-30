# A05.03 API-mode browser attempt

- Observed: 2026-09-27, Windows, Codex In-app Browser; workspace source HEAD `41869d7d6080d1508353120bd15d482dd3d4bb91`.
- Attempt: restart the local Vite server at port `4173` with `VITE_DATA_SOURCE=api`, then reload `/w/markets` in the existing browser tab.
- Browser result: the tab displayed `ERR_CONNECTION_REFUSED` during the process transition.
- Host result: `Invoke-WebRequest http://127.0.0.1:4173/w/auth/login` returned HTTP 200 after the new server was listening.
- Recovery: a fresh browser tab could load the mock server after it was restarted in mock mode.
- Conclusion: the browser transition was inconclusive. It does not prove that the API-mode page rendered, that API calls failed as designed, or that a stale worker was removed in a live browser. Keep those checks open for A05.05; the pure worker-retirement and bootstrap behavior is covered by unit tests.

## A05.05 same-origin worker follow-up

- A separate API-mode tab at `http://127.0.0.1:4180/w/auth/login` loaded after the server restart. It showed no preview panel, demo button, credential hints, or mock warning. Submitting synthetic local-only data while port 4199 had no listener displayed the expected login error; see [api-mode-offline-smoke.json](api-mode-offline-smoke.json).
- This fresh-tab check does not expose the prior browser context's service-worker registration. The direct same-tab attempt still reached the browser's `ERR_CONNECTION_REFUSED` interstitial during Vite restart.
- Attempting to read the registration in the browser's internal service-worker page was rejected by browser URL policy because only HTTP and HTTPS navigation is allowed. The policy also prohibited an alternate browser surface or indirect inspection, so no workaround was attempted.
- Conclusion: source-level worker matching, cleanup failure behavior, and one-reload ordering pass their unit tests; direct live registration retirement remains unverified. Keep A05.05 open until an allowed browser check or user-provided observation closes this item. Do not report browser-level stale-worker certification.
