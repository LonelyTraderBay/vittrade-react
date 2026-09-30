# A02 evidence: development login and MFA preview

Measured 2026-09-27 against source HEAD `41869d7d6080d1508353120bd15d482dd3d4bb91` on Windows, Node 24.19.0. These checks exercise deterministic fictional MSW data; they do not connect to or certify a backend.

Before the handler change, the real `createAuthApi` + `createHttpClient` probe rejected login with Zod `invalid_union` at discriminator `status`, and found zero `POST /auth/login/mfa/verify` handlers. See [baseline-login-rejection.json](baseline-login-rejection.json).

After the change, `node node_modules/vitest/vitest.mjs run src/dev/mocks src/features/auth` passed 107 tests in 20 files. Both TypeScript projects passed with direct `tsc` invocation; ESLint and Prettier passed on the three changed source files; `git diff --check` passed. `npm.cmd run typecheck` could not locate the `tsc` shim in this shell, so the same configured compiler projects were run directly with `node node_modules/typescript/bin/tsc`.

The real Chromium dev preview passed seven UI journeys: direct login, logout then reload, MFA challenge, valid MFA verification, invalid password, locked persona, and the Demo button. It recorded 13 auth responses, all from the actual MSW Service Worker: four 200s, one 204, one 423, and seven expected 401s (initial unauthenticated session checks and invalid credentials). There were zero JavaScript page errors. Browser console resource errors correspond to those expected HTTP 401/423 responses; see [browser-results.json](browser-results.json) for each request and route.

The production-build auth contract E2E suite passed 5/5 tests with request interception (`page.route`); this is still mocked network evidence. Re-run it by building with `node scripts/build-e2e.mjs`, serving `dist` with `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort`, then running `node node_modules/@playwright/test/cli.js test tests/e2e/auth-session.spec.ts --config docs/architecture/production-readiness/evidence/A02/auth-session-preview.config.mjs --project=chromium`.

For the dev MSW browser run, start `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort`, then run `node docs/architecture/production-readiness/evidence/A02/dev-browser-smoke.cjs`. Override the browser base URL with `VITTRADE_DEV_BASE` if needed. Demo accounts are fictional and documented in the login screen; the MFA code is `123456`.

Screenshots: [login and fixture hints](dev-auth-login-hints.png), [authenticated home shell](dev-auth-home.png), [logout and reload](dev-auth-logout.png), [MFA challenge](dev-auth-mfa.png), and [invalid credentials](dev-auth-invalid.png). The home route reached its shell but its central market panel still displayed `Đang tải...` at capture time. That page is tracked under U02 and remains a separate UI/data acceptance item; this evidence only certifies the auth journey.
