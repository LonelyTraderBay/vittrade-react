# Auth login MFA challenge implementation plan

> **For agentic workers:** This plan is written for native, in-session execution after review. Follow `superpowers:executing-plans` and `superpowers:test-driven-development` one task at a time. Keep the existing dirty working tree intact; do not stage or commit.

**Goal:** Implement the approved backend-issued login MFA challenge flow for phone and web login without creating an authenticated frontend session before OTP verification.

**Architecture:** `POST /auth/login` returns a discriminated `LoginResult`: an authenticated session or a short-lived MFA challenge. The shared session provider applies sessions only for the authenticated variant and exposes a separate challenge verification operation. Both login shells pass only the opaque challenge ID and display metadata through router navigation state. OTP screens reject missing/expired login challenge state and use a dedicated challenge verification endpoint. Registration and other MFA purposes retain their existing contracts.

**Tech Stack:** React 18, TypeScript, React Router 7, Zod, Vitest, Testing Library, MSW, Playwright, OpenAPI 3.1.

**Spec:** `docs/architecture/auth-login-mfa-spec.md` (approved by the user).

**Global Constraints:**

- Never place challenge or session data in local/session storage. The access token remains memory-only.
- A challenge response must not set session, user, roles, permissions, or access token.
- The OTP login verification payload contains only `challengeId` and `code`; keep existing registration/setup MFA contracts separate.
- Preserve dev/test demo behavior without allowing it to create a production bypass.
- Do not claim backend MFA policy, cookie security, or rate limits are verified by intercepted frontend tests.
- Preserve all pre-existing working-tree changes; do not stage or commit.

**Review Focus:** Login union types match OpenAPI and Zod; race/error handling in the provider; no privilege/session state on challenge; navigation state validity and expiry; both phone and web OTP flows; compatibility of legacy `login` and registration OTP; tests assert exact request bodies and no premature authenticated navigation.

## Task 1: Define the login and challenge contracts

**Files:**

- Modify `src/shared/session/session-types.ts`
- Modify `contracts/openapi/auth.yaml`
- Modify `scripts/check-openapi-contracts.mjs` only if the current checker requires explicit support for the new request/response schemas

1. Add `LoginMfaChallenge`, `AuthenticatedLoginResult`, `MfaRequiredLoginResult`, and `LoginResult` types. The challenge fields are `id`, `method: 'totp' | 'sms' | 'email'`, optional `maskedDestination`, and `expiresAt`.
2. Add `LoginMfaVerificationRequest` with exactly `challengeId` and `code`.
3. Update OpenAPI `POST /auth/login` response to `oneOf` the authenticated and challenge variants using a required `status` discriminator. Add `POST /auth/login/mfa/verify`, success session response, and documented invalid/expired/rate-limited challenge errors. Leave generic `/auth/mfa/verify` unchanged for its current callers.
4. Run `npm.cmd run contracts:check` and correct only contract issues caused by this change.

## Task 2: Parse both login variants at the Auth API boundary

**Files:**

- Modify `src/features/auth/api/auth-api.ts`
- Modify `src/features/auth/api/auth-api.test.ts`

1. Change `AuthApi.login` to return `Promise<LoginResult>` and expose `verifyLoginMfa(request): Promise<AuthSession>`.
2. Define Zod schemas matching both OpenAPI variants. Reject unknown status values, malformed sessions, blank challenge IDs, invalid methods, and invalid expiry timestamps.
3. Implement login MFA verification at `/auth/login/mfa/verify`, parsing the returned session.
4. Write MSW contract tests first: valid authenticated login, valid challenge, invalid challenge payload, and exact `{ challengeId, code }` verification body. Keep tests for generic MFA verification and MFA setup unchanged.
5. Run `npm.cmd test:run -- src/features/auth/api/auth-api.test.ts` and `npm.cmd run contracts:check`.

## Task 3: Keep the shared session unauthenticated until challenge verification

**Files:**

- Modify `src/shared/session/auth-context-types.ts`
- Modify `src/shared/session/AuthContext.tsx`
- Modify `src/test/auth-test-adapter.ts`
- Modify `src/app/contexts/AuthSessionProvider.test.tsx`
- Modify `src/app/contexts/AuthContext.test.tsx` only where types or legacy behavior require it

1. Update `AuthAdapter.login` to return `LoginResult` and add optional `verifyLoginMfa` adapter support. Update deterministic test adapters to return the authenticated result variant.
2. Change `signIn` to return `LoginResult`; call `applySession` only for `status === 'authenticated'`. On challenge, preserve no session and clear any existing access token while keeping the provider unauthenticated.
3. Add `verifyLoginMfa` to `AuthContextValue`; it must require adapter support, parse/receive only the challenge request, apply the verified session on success, and leave the user unauthenticated on failure.
4. Keep deprecated `login(email, password): Promise<AuthSession>` source-compatible for existing callers; if the result is a challenge, reject with a clear error instead of treating the user as authenticated. Preserve `loginSync` for deterministic legacy tests.
5. Add tests asserting challenge login leaves `isAuthenticated`, user, roles, permissions, session, and API access token empty; successful challenge verification creates the session; failed verification does not authenticate.
6. Run `npm.cmd test:run -- src/app/contexts/AuthSessionProvider.test.tsx src/app/contexts/AuthContext.test.tsx` and `npm.cmd run typecheck`.

## Task 4: Route phone and web login challenges into OTP

**Files:**

- Modify `src/features/auth/pages/LoginPage.tsx`
- Modify `src/features/auth/pages/LoginPage.test.tsx`
- Modify `src/features/auth/pages/WebLoginPage.tsx`
- Add `src/features/auth/pages/WebLoginPage.test.tsx`

1. For authenticated login, preserve current success navigation. For `mfa_required`, navigate to the matching OTP route with only challenge ID, method, masked destination, and expiry in `location.state`; do not include credentials, tokens, user data, or contact chosen by the client.
2. Ensure login demos handle only the authenticated result and remain dev/test-only.
3. Remove the WebLogin dev-only `2fa@test.com` fake OTP handoff so MFA login uses the same backend contract in all environments; retain unrelated locked-account and device-trust development fixtures.
4. Add phone and web component tests for challenge handoff, authenticated success, and absence of session navigation for challenge results.
5. Run both login page test files with `npm.cmd test:run`.

## Task 5: Verify login challenges in both OTP screens

**Files:**

- Modify `src/features/auth/pages/OTPPage.tsx`
- Add `src/features/auth/pages/OTPPage.test.tsx`
- Modify `src/features/auth/pages/WebOTPPage.tsx`
- Add `src/features/auth/pages/WebOTPPage.test.tsx`
- Modify any route-state types in `src/shared/types/route-state.ts` if shared typing is needed

1. Parse/validate the expected navigation-state shape. For login MFA, if challenge ID is absent, method invalid, or expiry has passed, replace-navigate to the appropriate login route without calling any verification API.
2. Use `verifyLoginMfa({ challengeId, code })` for login MFA. Do not call generic `verifyMfa` with client-supplied `contact`/`purpose` for login.
3. Preserve the web registration OTP behavior behind its existing dev-only gate and generic verification contract. Keep it isolated from login MFA.
4. On backend verification failure, keep OTP view unauthenticated, show an actionable message, and permit retry; on success, navigate with replace after the existing success UX.
5. Add component tests for valid request body, missing/expired state, invalid code/server failure, and successful navigation. Assert failed/missing challenge does not enter protected app routes.
6. Run all auth page tests with `npm.cmd test:run -- src/features/auth/pages`.

## Task 6: Exercise complete phone and web flows in E2E

**Files:**

- Modify `tests/e2e/auth-session.spec.ts`

1. Add one phone-shell and one web-shell test where login returns an MFA challenge, OTP state carries its ID, and verify sends only `{ challengeId, code }`.
2. Assert `/home` and protected session UI do not appear before the verify endpoint returns a valid session; assert they appear after success.
3. Add an invalid/expired challenge case that returns the user to login without an authenticated session.
4. Keep the existing password login/logout and password-change E2E coverage.
5. Run `npm.cmd run test:e2e -- tests/e2e/auth-session.spec.ts`.

## Task 7: Update architecture notes and verify the whole change

**Files:**

- Modify `ARCHITECTURE.md`
- Modify `docs/architecture/auth-login-mfa-spec.md` only if implementation changes an approved detail

1. Document the two-step login contract, the memory-only session boundary, and the distinction between frontend contract evidence and live staging evidence.
2. Run focused auth unit/component tests, then full `npm.cmd run typecheck`, `npm.cmd run lint:check`, `npm.cmd run format:check`, `npm.cmd run architecture:check`, `npm.cmd run contracts:check`, `npm.cmd run security:check`, `npm.cmd run build`, and auth E2E.
3. Run the full coverage suite only with the implementation's verification pass; update architecture coverage figures if they changed.
4. Inspect final `git status --short` and ensure no unrelated user changes were staged, reverted, or overwritten.
5. Report passed gates, warning budgets and test limitations separately. Record live HTTPS staging validation as outstanding unless actual backend staging is available and tested.
