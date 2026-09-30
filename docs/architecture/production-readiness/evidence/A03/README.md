# A03 evidence: session freshness and remote logout

Measured 2026-09-27 on Windows, Node 24.19.0, source HEAD `41869d7d6080d1508353120bd15d482dd3d4bb91`. The implementation keeps auth session/token ownership in `AuthSessionProvider`.

The original F01 probe reproduced a late refresh restoring authentication after logout in another tab. `remote-logout-refresh-red.log` records the regression failing before the fix. `legacy-login-refresh-red.log` records a second stale-write defect: a successful legacy synchronous login did not supersede a pending refresh (21 passed, 1 failed before its source fix).

After the fixes, `node node_modules/vitest/vitest.mjs run src/app/contexts src/shared/session src/features/auth` passed 130 tests in 18 files. This includes stale success from refresh, bootstrap, password login, login-MFA verification, authenticated MFA verification and MFA-setup confirmation; stale refresh error; a new login surviving an older refresh; successful `loginSync` surviving an older refresh; and BroadcastChannel listener/channel cleanup.

Both TypeScript projects passed using direct `tsc`; ESLint, Prettier and `git diff --check` passed. The latter printed Git's LF-to-CRLF working-copy notices and exited successfully. See `static-check-final.log`.

`node scripts/build-e2e.mjs` built the staging bundle successfully after transforming 3,422 modules. Rollup printed Zod pure-annotation placement warnings and removed the annotations; the build completed. See `staging-build-final.log`.

The production-build browser suite passed 5/5 Chromium auth tests. The preview server was run from `dist` at `127.0.0.1:4174`; every API in `auth-session.spec.ts` is intercepted by Playwright, so this is browser-flow evidence with a mocked API. See `preview-server.log` and `auth-session-e2e-final.log`.

The transition table and reverse source check are in [auth-login-mfa-spec.md](../../../auth-login-mfa-spec.md). Stale API promises still return their API result to their original caller, while stale completions cannot write provider session/token/error state. Protected routes use the provider's current auth state. These checks do not establish backend cookie flags, token revocation, rate limiting, or behavior with real user data; those remain staging/backend certification work.
