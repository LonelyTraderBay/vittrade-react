# SDD ledger — plan: docs/superpowers/plans/2026-09-25-auth-login-mfa.md

Pre-flight: existing workspace has 904 changed/untracked entries and 7 staged renames; user previously selected inline execution in the current checkout. Ruling: execute on the current checkout and do not create another worktree, because a clean worktree would omit the user's untracked migration baseline and make planned architecture/auth code disappear. Preserve all existing changes; do not stage or commit.

Pre-flight interface: Task 1 produces `LoginResult`, `LoginMfaChallenge`, and `LoginMfaVerificationRequest` types and OpenAPI schemas; Task 2 consumes those shapes in Zod parsing and AuthApi.
Pre-flight interface: Task 2 produces `AuthApi.login(): Promise<LoginResult>` and `verifyLoginMfa`; Task 3 consumes them through AuthAdapter and shared AuthContext.
Pre-flight interface: Task 3 produces challenge-aware `signIn`/`verifyLoginMfa` state behavior; Task 4 consumes the discriminated result and Task 5 consumes challenge-only verification.
Pre-flight interface: Task 4 passes route challenge state; Task 5 validates it and invokes the challenge verify method.
Pre-flight interface: Task 5 secures phone/web OTP success and failure; Task 6 covers those paths through E2E.

Task 1: in_progress
- RED: `src/features/auth/api/auth-openapi-contract.test.ts` failed as expected: login schema was AuthSession-only; challenge verify route was missing.

Task 1: complete
- RED/GREEN: `auth-openapi-contract.test.ts` failed while login was session-only and challenge verify absent; passed after OpenAPI login variants, discriminated response schemas, verify request/response and 400/410/429 errors were added.
- GREEN gates: `npm.cmd run test:run -- src/features/auth/api/auth-openapi-contract.test.ts` (2/2), `npm.cmd run contracts:check` (15 contracts, 140 operations), `npm.cmd run typecheck` (passed at Task 1 baseline).
- Ruling: remove optional `mfaCode` from password `LoginRequest` because MFA must be bound to a backend-issued challenge and no source callers use it; keep MFA fields on password-change and generic verification contracts. Typecheck found no callers relying on the removed login field.

Task 2: complete
- RED/GREEN: API contract tests failed against the old session-only login parser and absent `verifyLoginMfa`; passed after adding strict discriminated Zod parsing and the challenge-only verification endpoint.
- GREEN gates: focused Auth API + OpenAPI tests (9/9), OpenAPI contract check passed.

Task 3: complete
- RED/GREEN: provider tests failed because a challenge object was treated as an AuthSession and `verifyLoginMfa` was missing; passed after shared auth adapter/provider support and test adapters were updated.
- GREEN gates: AuthSessionProvider/AuthContext tests (27/27); `npm.cmd run typecheck` passed.
- Compatibility: deprecated `login(email,password)` still returns `AuthSession`; it rejects when a challenge is required rather than accepting the user.

Task 4: complete
- RED/GREEN: phone/web login tests failed because both navigated home after a challenge and the web dev 2FA fixture skipped the backend; passed after routing challenge metadata through in-memory router state and removing the fake 2FA handoff.
- GREEN gates: phone/web login component tests (9/9); `npm.cmd run typecheck` passed.

Task 5: complete
- RED/GREEN: OTP page tests failed because challenge IDs were not verified, missing/expired challenges were accepted, and invalid routes did not return to login; passed after runtime route-state validation and dedicated challenge verification.
- GREEN gates: phone/web OTP tests (9/9 including development registration contract compatibility).
- Test harness ruling: route OTP components through matching React Router routes so tests model page unmount after successful navigation; mounting OTP as a permanent sibling caused the test harness itself to redirect a successful `/home` navigation back to login.

Task 6: complete
- RED: initial E2E route matcher `**/auth/login` intercepted the page navigation itself; changed it to the known API origin `https://e2e.invalid/auth/login` after Playwright error context showed the HTML page received JSON.
- GREEN: auth E2E 5/5, including phone MFA, web MFA, and expired challenge, all using intercepted backend contracts.

Task 7: complete
- `npm.cmd run test:coverage` passed 1,932 tests across 205 files. Coverage: 87.3% lines, 84.6% statements, 80.12% functions, 80.96% branches.
- Gates passed: typecheck, lint (0 errors / 1,426 warnings under 1,465 budget), format, architecture (1,244 modules / 7,926 dependencies), contracts (15 / 140), security boundary (975 files), environment, page size, inventory (416 pages / 429 routes / 233 components / 33 services / 22 mock sources), production mocks/imports/routes, license review (552 packages), npm audit (0 high vulnerabilities), bundle budget (211 JS chunks), build, auth E2E.
- Build warning: Zod package PURE annotations are positioned where Rollup cannot interpret them; build passes after removing those annotations.
- Final review: four P2 findings fixed. OTP screens now return to login when expiry elapses while open, recheck before submission, route HTTP 410 to login, distinguish 400/423/429 from generic service errors, and expose login recovery for phone lockout/rate limiting. OpenAPI verification now declares 423 AccountLocked.
- RED/GREEN after review: expiry-while-open (phone + web), phone lockout recovery, phone/web rate-limit messaging, and the OpenAPI 423 contract all failed before fixes and passed after. Focused auth/OpenAPI suite: 17/17.
- Phone E2E review: verified the prior test ran at desktop viewport and the responsive shell changed `/home` into `/w/home`; set an actual phone viewport and assert `/home`. Auth E2E: 5/5.
- Final gates after review: full coverage 1,938/1,938 across 205 files; 87.23% lines, 84.56% statements, 80.24% functions, 80.92% branches. Typecheck, build, format, lint budget, dependency-cruiser, OpenAPI contracts and security boundary passed. Build retains the known Zod PURE-annotation warnings; lint is 0 errors and remains under the configured warning budget.
- `task-start`/`task-done` helpers described by the executing-plans skill are absent from its installed script bundle; `bash` is not installed on this Windows host. Recording each task and actual command outputs manually in this ledger.
- Do not claim full enterprise/production certification: measured coverage remains below the 90% lines/statements and 85% functions targets, lint warning debt remains 1,426, migration inventory still has 106 integration-pending and 310 demo pages, and no real HTTPS backend staging proof is available.
- Final verification refresh: `npm.cmd run typecheck`, `lint:check` (0 errors / 1,426 warnings), `format:check`, `contracts:check`, `security:check`, `build`, full coverage (1,938/1,938), and `test:e2e -- tests/e2e/auth-session.spec.ts` (5/5) all passed after final code and E2E edits. Build reports only the existing Rollup/Zod PURE-annotation warnings.

## Roadmap continuation: production-certification revision binding

- Confirmed `architecture:inventory:check` was failing because the generated page inventory had become stale after the auth changes; regenerated the JSON and the check now passes at 416 pages / 429 routes.
- Production-status audit found staging evidence validated a 40-character SHA but never compared page or route source files with that revision. Added path-scoped Git revision checks for page, routes, contract, adapter and tests. Staging evidence JSON and manifest can be added after the staging run, while certified source inputs must match the verified revision and have a clean worktree/index.
- RED/GREEN: a fixture committed a valid source snapshot, then changed page source; before the validator, loader incorrectly returned a production certification. After the validator, changed page/route inputs and missing Git revisions are rejected; the valid fixture with post-commit evidence still passes.
- Verification: inventory generator tests 14/14; full coverage 1,941/1,941 across 205 files; typecheck, format, inventory freshness, architecture boundaries (1,244 modules / 7,926 dependencies), OpenAPI contracts (15 / 140) and security boundaries (975 files) passed. Production inventory remains 0 certified pages until real HTTPS staging evidence exists.
