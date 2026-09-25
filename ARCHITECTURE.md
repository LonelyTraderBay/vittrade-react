# VitTrade Frontend Architecture

## Mục tiêu

VitTrade được tổ chức theo feature/domain boundaries. `app` chỉ chịu trách nhiệm
bootstrap ứng dụng, provider composition và route composition. Business logic phải
thuộc về feature tương ứng; infrastructure dùng chung phải nằm trong `shared`.

## Trạng thái baseline

- Inventory hiện tại bao phủ 416 source page files, 428 route entries, 233
  components, 0 legacy data modules, 33 service/API files và 23 mock sources.
- Route composition preserves the public shell URLs `/`, `/t`, `/w`, `/r`; unused
  route-less app-page aliases have been removed. Owners and status live in the
  generated inventory.
- Inventory hiện nhận diện 120 page có dấu hiệu mock/simulation (`MOCK_*`, fixture,
  `Math.random()` hoặc simulation); danh sách routed pages là đầu vào bắt buộc cho
  từng vertical-slice migration, không được coi là production-ready mặc định.
- Legacy Launchpad simulators now live under `src/dev/legacy`; their production
  routes resolve to `IntegrationPendingPage` and the production artifact gate
  rejects the fixture module marker.
- Các route shell hiện tại phải giữ tương thích: `/`, `/t`, `/w`, `/r`.
- Các page demo, mock và legacy đang được migrate theo vertical slice; không được
  dùng làm nguồn dữ liệu production.

## Dependency direction

```text
app  -> features -> shared
app  -> shared
app  -> dev (build-time development routes only)
test -> app/features/shared
```

Quy tắc:

1. `shared` không import `features` hoặc `app`.
2. Feature-to-feature imports may target another feature only through its public
   `index.ts` API; deep imports across feature domains are forbidden.
3. Page không gọi `fetch`, `WebSocket` hoặc storage token trực tiếp.
4. Mock/fixture chỉ nằm trong `src/test` hoặc `src/dev`.
5. Các thư mục gốc legacy `src/components`, `src/types` và `src/utils` hiện
   không còn source file; code mới thuộc `app`, `features`, `shared` hoặc `dev`.
6. `features` and `shared` must not import `src/dev`; app imports from `src/dev`
   must sit behind `isDevelopmentBuild` route/provider branches and be absent
   from the production artifact.
7. No layer may import from the retired root directories `src/components`,
   `src/types` or `src/utils`; dependency-cruiser blocks these paths from returning.

UI drafts and preferences must use `shared/lib/browser-storage.ts`, which safely
handles SSR and browser storage denial. Authentication credentials remain
memory-only and must never use this persistence adapter.
Feature-flag caches/assignments, coachmark progress, trading preferences and the
typed app storage hook now use the adapter instead of accessing Web Storage directly.

### Feature-to-app migration gate

Feature modules must not depend on the application composition layer. Dependency
cruiser resolves TypeScript aliases from `tsconfig.json` and enforces this as a
hard error rule in CI.

## Target structure

```text
src/
  app/                 # bootstrap, providers, router, config, styles
  features/<domain>/   # api, model, components, pages, routes, tests
  shared/              # api, ui, hooks, lib, types, constants, telemetry
  dev/                 # demos, fixtures and development-only legacy screens
  test/                # setup, mocks, fixtures, factories, test utilities
```

## Phase 0 inventory

`docs/architecture/page-inventory.json` is the generated baseline for every
page, route, component, page-tree data module, service and mock source. Each page is assigned an owner,
an explicit migration status and dependency observations. Run
`npm run architecture:inventory` after an intentional route/page change, then
`npm run architecture:inventory:check` in CI to prevent stale ownership data or
untracked architectural growth.

Current generated inventory: 416 source pages, 428 routes, 233 components,
0 legacy data modules, 33 services and 23 mock sources. It records 106
`integration-pending`, 233 routed development-only `demo`, no `deprecated`
aliases and 77 route-less `not-implemented` source pages. Route-less app-page
re-export shims with no source consumers have been removed; routed composition
adapters remain only where the shell supplies app-owned behavior. The route
extractor resolves
nested relative paths, index routes and component slots injected through route
factories. 120 pages still reference mock/simulation sources. No page has direct
runtime access to `fetch`, `WebSocket` or browser storage. Production
certification remains empty until backend staging evidence is available.
Production certifications are bound to the verified source revision: page,
route, contract, adapter and test inputs must match the staged commit, with no
path-scoped worktree or index edits.

## Feature ownership

| Domain | Owner boundary | Migration priority |
| --- | --- | --- |
| Auth/session | `features/auth` | P0 |
| Market | `features/market` | P0 |
| Trading | `features/trading` | P0 |
| Wallet | `features/wallet` | P0 |
| P2P/compliance | `features/p2p` | P1 |
| DCA | `features/dca` | P1 |
| Earn/staking | `features/earn` | P1 |
| Launchpad | `features/launchpad` | P2 |
| Arena | `features/arena` | P2 |
| Predictions | `features/predictions` | P2 |
| Referral/discovery | `features/referral`, `features/discovery` | P2 |
| Admin/support | `features/admin`, `features/support` | P2 |

## Vertical-slice status: Auth/session

- The canonical `/auth/login` implementation belongs to
  `features/auth/pages/LoginPage.tsx`; the route imports the feature directly
  and its unused route-less app-page export has been removed.
- Auth child paths for login, registration, OTP, 2FA setup, password reset,
  account status and device trust are composed by `features/auth/routes.ts` for
  both app and web shells; shell routers supply page adapters and layouts.
- Auth API types and the session adapter now live under
  `features/auth/api/auth-api.ts`. The app API path remains a compatibility
  export so existing infrastructure tests do not create a second contract.
  Session and MFA setup responses are parsed at that API boundary before their
  data can update shared session state.
- `POST /auth/login` now returns a discriminated authenticated-session or
  backend-issued MFA challenge result. The shared session provider applies no
  session, user, role, permission or access token for the challenge branch;
  phone and web OTP screens verify only `{ challengeId, code }` through
  `/auth/login/mfa/verify`. Challenge navigation metadata stays in in-memory
  router state and is rejected by the OTP screens when missing or expired.
- Login MFA contract/component tests exercise malformed server challenges,
  both shell handoffs, no-auth-before-verify, retry failures, expired challenges
  and a successful verify. Generic contact/purpose MFA remains isolated for the
  existing development registration flow.
- Phone and web registration OTP routes accept generic registration state only
  in development. The phone screen no longer presents a local-only resend timer;
  resend controls remain absent until an API contract can actually issue a code.
- OTP screens also expire a challenge while it remains open, recheck its
  deadline before submit, and distinguish invalid code, expired challenge,
  account lockout, rate limiting and service failures.
- OTP verification and 2FA setup now live under `features/auth/pages`; unused
  route-less app-page exports were removed. Registration also belongs to the
  feature but remains development-only until its account-creation contract exists.
- Login feature tests cover required fields, Enter submission, password reveal,
  success/failure, shell-prefixed recovery and registration navigation, and the
  test-mode demo action. Auth adapter tests cover login, MFA setup/verification,
  session read/refresh and logout. Demo login remains development/test-only;
  production login uses the session adapter and does not persist the access
  token in browser storage.
- The staging-build contract E2E covers login through `/auth/login`, preserves
  the session across a profile reload via the session contract, calls logout
  through `/auth/logout` and returns to the login boundary. Additional phone and
  web MFA E2E paths confirm that the challenge response does not authenticate
  until the challenge verification endpoint returns a valid session. These use
  intercepted backend contracts; real backend cookie flags, challenge single-use,
  expiry enforcement, rate limiting and MFA policy still require HTTPS staging.
- `/auth/forgot-password` and `/auth/reset-password` now use the typed password
  reset contract; the direct reset route requires the backend-issued email and
  short-lived reset token. Registration remains development-only until its
  account-creation contract exists. Both the phone/tablet and web registration
  routes now resolve to the integration-pending boundary in staging/production,
  so the legacy simulated delay is not in the production route graph.
- Password recovery contract tests cover request/OTP/reset failures, numeric
  OTP filtering, server-issued reset-token enforcement, password policy,
  confirmation matching and successful direct reset.
- Web password change now belongs to `features/auth` and verifies the current
  password before calling the MFA-protected change operation with an idempotency
  key. The UI accepts TOTP only because the contract has no SMS challenge-send
  operation; the old local-only verification screen was removed.
- Web password-reset routes now reuse those feature-owned contract pages. The
  web OTP route accepts only an active MFA challenge (or development-only
  registration); resend and remembered-device controls stay absent until their
  backend contract operations are available.
- Web login, OTP, 2FA setup, registration, account status, and session-expiry
  views now live under `features/auth`; unused app-page re-exports were removed,
  and shared web-auth presentation/tokens live under `shared`.
- Social login controls remain absent until provider redirect/callback contracts
  and backend verification are defined; the login screen must not imply an
  unavailable OAuth flow.
- The 2FA flow keeps challenge setup, verification and navigation in its feature
  controller; QR, OTP and backup-code steps are separate presentational
  components. Every feature module is now below the 600-line limit.
- Backend certification still requires HttpOnly refresh-cookie behavior,
  account-lock/MFA responses, rate limiting, cross-tab logout and staging E2E.

## Vertical-slice status: DCA

- Route `/dca` renders the feature-owned `features/dca/pages/DCAMainPage`; the
  app page is a composition adapter for application rollout flags and feature callbacks.
- DCA event types, batching/offline-queue service, and analytics hooks are owned
  by `features/dca/model` and exposed through the feature public API. App consumers
  use that API; the service persists through the safe shared browser-storage adapter.
- Analytics delivery requires an injected transport. The current repository has
  no DCA event-ingestion contract, so the production singleton stays disabled and
  an unconfigured service retains queued events instead of reporting false success.
- DCA funnel definitions, session analytics, and funnel hooks also live under
  `features/dca/model`; route and wallet adapters consume the public feature API.
- DCA experiment definitions and exposure/conversion analytics are feature-owned;
  the app hook remains a composition adapter for the app-owned rollout assignment.
- DCA rollout and A/B flag keys/default variants are owned by
  `features/dca/model`; generic evaluation contracts and refresh config live in
  `shared`, while the app service composes the DCA registry.
- DCA cards, chart, annotation overlay and create sheet are owned by
  `features/dca/components`; unused app re-export shims have been removed.
- The unreferenced wallet shortcut prototype was removed after repository-wide
  search confirmed it had no caller.
- `DCAOverviewCard` delegates skeleton, sparkline and tooltip rendering to
  `DCAOverviewCardVisuals.tsx`. `DCAHistoryChart` composes separate visual,
  control/legend and canvas utility modules; both feature modules are below the
  600-line threshold.
- `ChartAnnotationOverlay` keeps canvas state and pointer orchestration in the
  overlay while drawing/hit-testing helpers, toolbar actions and floating text
  input live in dedicated modules; all remain below 600 lines.
- The page uses the `features/dca` OpenAPI adapter and TanStack Query
  snapshot/mutation hooks.
- Mutating plan operations require an explicit idempotency key and invalidate the snapshot query.
- `DCAMainPage` reuses the same idempotency key when create, update or delete is retried
  with an unchanged request after a transient API failure; integration tests cover key replay.
- Plan mutations are protected by the `dca:write` permission; read-only sessions can inspect
  the snapshot but cannot create, pause, resume or cancel a plan. The main DCA
  page hides plan creation and disables plan actions without that permission;
  an integration test verifies no write request is sent for read-only users.
- The contract-backed Savings DCA page confirms cancellation before stopping a
  recurring plan, reports create/update/cancel failures and preserves each
  action's idempotency key when retrying the same operation.
- The 10 advanced DCA route implementations and their four simulation services
  now live under `src/dev/legacy/dca`. Development routes lazy-load those
  implementations directly; unused app-page shims have been removed.
  Staging/production keeps all 10 URLs and renders the explicit
  `IntegrationPendingPage` boundary.
- The production-route check validates both DCA route lists, and staging E2E
  visits each URL to verify that no demo implementation is exposed.
- The legacy DCA context now lives in `features/dca`; the old app paths are
  compatibility re-exports for isolated tests and are not composed by
  `RootLayout`. Tests inject the adapter through the provider prop, with no test
  API global in production code.
- The savings DCA route is composed by `features/dca/routes.ts`; the app router only
  assembles that feature-owned route module.

## Vertical-slice status: Earn/staking

- `/earn`, `/earn/savings`, `/earn/staking` and the web shell equivalents use the
  `features/earn` page and typed API boundary.
- The API contract is `contracts/openapi/earn.yaml`; development data is served by
  MSW from `src/dev/mocks/earn-fixtures.ts` and is not imported by the feature page.
- Subscription and redemption mutations require an explicit idempotency key and
  invalidate the TanStack Query snapshot after a successful response.
- Subscription and redemption UI actions are independently guarded by `earn:subscribe` and
  `earn:redeem` (or the aggregate `earn:write`) permissions; the API contract declares the
  same required permission metadata.
- Savings product detail, redemption and receipt URLs are implemented in the
  feature boundary and use the same typed mutations; no local fixture is used
  as a transaction source.
- Subscription/redemption contract pages preserve one UUID idempotency key for
  retries of unchanged request data, expose API failures accessibly, and route
  successful operations to the server-backed receipt; contract tests cover
  those retry/error/receipt paths.
- `/earn/savings/portfolio` is now composed by `features/earn` from the typed
  snapshot. It filters positions by their savings product and requires the
  `earn:redeem` permission for redemption; mutations carry idempotency keys.
- `/earn/savings/history` and `/earn/history` share the `GET /earn/transactions`
  contract with a cursor-paginated query boundary, domain scoping, and explicit
  loading, error, empty, operation-filter and transaction-status states.
- Redundant app-level Savings/Staking re-export files and an unreferenced
  `stakingRoutes.lazy.ts` catalog were removed after confirming the active app
  composes the feature-owned Earn routes directly. The inventory follows only
  route modules reachable from the app route entrypoints.
- Secondary Earn/Staking screens without an active feature route and verified
  backend contract remain development-only or pending; they are not counted as
  production-ready because their old route catalog once declared them.
- Fourteen unrouted Savings prototype screens and their simulated loading hook
  now live under `src/dev/legacy/earn`; their imports use `shared` APIs and the
  dependency gate confirms they do not pull application modules into `dev`.
- The unreferenced legacy web referral prototype is under `src/dev/legacy/web`;
  `/referral` remains feature-owned and no router imports the prototype.
- Nine additional unrouted staking prototypes and six unreferenced web account,
  security and compliance prototypes now live under `src/dev/legacy`; their
  former app paths had no route or source/test consumer.
- The old `WebEarnSavingsPage` and `WebEarnStakingPage` module files are also
  archived under `src/dev/legacy/web`; the similarly named app route adapters
  load `features/earn` directly.
- The unrouted P2P ad-detail prototype and its confirmation modal now live in
  `src/dev/legacy/p2p`; the layout-lint fixture points at the development copy.
- Savings comparison and Savings DCA now also use the typed Earn/DCA snapshot
  and mutation boundaries. Earn comparison is owned by `features/earn/routes.ts`.

## Vertical-slice status: Wallet withdrawal

- `/wallet/withdraw` and `/wallet/withdraw/:asset` use the wallet feature page;
  the unused route-less legacy app-page export has been removed.
- Withdrawal follows `challenge -> verify -> submit`: the final mutation requires
  a short-lived `verificationToken` and an explicit idempotency key.
- The contract is `contracts/openapi/wallet.yaml`; the typed adapter validates
  challenge, verification and receipt responses at runtime.
- MSW provides the challenge flow only in development/test. The production route
  contains no simulated biometric success and no fallback accepting arbitrary OTP.
- Withdrawal submission is guarded by `wallet:withdraw` or aggregate `wallet:write`;
  read-only wallet sessions can load policy and balances but cannot request or submit
  a withdrawal.
- Real backend MFA/WebAuthn policy, rate limiting, audit events and staging E2E
  remain release prerequisites.

## Vertical-slice status: P2P escrow release

- Escrow release now follows `challenge -> verify -> release` and requires an
  explicit idempotency key plus a short-lived verification token.
- Retrying release with the same order and verification token reuses its idempotency
  key after a transient failure; the escrow contract test verifies both attempts.
- The contract is `contracts/openapi/p2p.yaml`; the release UI no longer invokes
  the legacy simulated biometric prompt.
- Development MSW handlers cover challenge issuance, code verification and token
  consumption. Production requires the real MFA/WebAuthn backend and audit trail.
- Dispute detail remains readable for `p2p:read` sessions, while escalation and
  support messaging require `p2p:write` (or the migration alias
  `p2p:dispute:write`) and carry idempotency keys.
- Order cancellation, payment-proof submission, rating and chat sending apply
  the same read/write boundary with action-specific migration aliases; the UI
  never relies on a hidden button as the authorization mechanism.
- P2P 2FA settings (`/p2p/security/2fa`) are query/mutation driven; method,
  primary-method, threshold and Authenticator setup state no longer originate
  from page-level `MOCK_*` constants.

## Vertical-slice status: Wallet address book

- `/wallet/address-book` and `/wallet/address-book/add` now use
  `features/wallet` typed query/mutation boundaries; unused route-less app-page
  re-exports have been removed.
- Address list, create, favorite, delete and whitelist settings use the shared
  API client, runtime response validation, idempotency keys and TanStack Query
  invalidation.
- Address-book mutations are guarded by `wallet:address-book` or aggregate
  `wallet:write`; read-only sessions retain safe inspection/copy access only.
- The legacy `/w/address-book` URL now renders the same feature page and server
  contract; its previous page-local sample destinations have been removed.
- The contract is defined in `contracts/openapi/wallet.yaml`. Development MSW
  data is isolated in `src/dev/mocks/handlers.ts`; no page-level address mock
  or local transaction source remains.
- Backend must enforce address/network validation, MFA or re-authentication,
  cooldown/whitelist policy and audit events before this slice is certified.
- `/w/profile/security/withdrawal-whitelist` composes the same wallet feature
  boundary; shell-specific code no longer owns a separate in-memory whitelist.

## Vertical-slice status: Wallet overview

- `/wallet` now composes `features/wallet/pages/WalletOverviewContractPage`
  across phone, tablet, web and responsive shells; the public URLs remain
  unchanged and each shell override imports the feature page directly.
- Balance summary, asset filtering, recent activity, loading and error states
  consume the typed `/wallet/assets` and `/wallet/transactions` contracts.
- Shell-aware navigation preserves `/`, `/t`, `/w` and `/r` prefixes for
  deposit, withdrawal, transfer, asset, history and analytics actions.
- The page removes hard-coded daily change and BTC conversion values from the
  production route; development data remains behind the MSW adapter only.
- Backend certification still requires user-scoped balance authorization,
  valuation freshness, transaction ownership, pagination and audit semantics.

## Vertical-slice status: Wallet deposit

- `/wallet/deposit` and `/wallet/deposit/:asset` now compose
  `features/wallet/pages/WalletDepositContractPage`; the unused route-less
  app-page export has been removed.
- Network, address, memo/tag, fee and confirmation data come from the typed
  `GET /wallet/deposit/networks` contract with runtime response validation.
- The QR payload is generated by `qrcode.react` from the server-provided
  address, so it encodes the real deposit address instead of a visual mock.
  Loading, retryable error, network selection and clipboard states are covered
  by feature integration tests.
- Backend certification still requires address rotation policy, network
  liveness, deposit attribution, memo handling, abuse controls and staging E2E.

## Vertical-slice status: Wallet internal transfer

- `/wallet/transfer` now composes
  `features/wallet/pages/WalletTransferContractPage` across all shells; the
  legacy page is no longer selected by the production route catalogue.
- Account and asset state comes from typed wallet queries. Transfer submission
  uses the OpenAPI `POST /wallet/transfers` boundary, an idempotency key,
  runtime receipt validation and explicit loading, validation, API-error and
  success states.
- MSW covers the development/test adapter and the feature integration suite
  covers validation, successful receipt rendering and rejected transfers.
- The transfer mutation is guarded in the UI by `wallet:write` (with
  `wallet:transfer` and `transfer:write` migration aliases); read-only sessions
  can inspect balances but cannot submit. The staging-build contract E2E checks
  the typed payload, idempotency header and receipt state.
- A retry with an unchanged transfer request reuses its idempotency key; a
  changed source wallet, destination, asset or amount gets a new key.
- `wallet-queries.ts` has hook coverage for every query and mutation, disabled
  identifier queries, idempotency inputs and cache invalidation; its current
  measured statement, branch and function coverage is 100%.
- Backend certification still requires wallet ownership checks, balance
  reservation, duplicate replay semantics, immutable ledger events and
  staging E2E coverage.

## Vertical-slice status: Wallet withdrawal with MFA

- `/wallet/withdraw` and `/wallet/withdraw/:asset` use the typed withdrawal
  network, asset, challenge, verification and submission boundaries; the page
  imports model/query modules directly to avoid a feature barrel cycle.
- Validation blocks malformed addresses, missing memo, invalid amounts and
  insufficient balance before an MFA challenge is created.
- The integration test covers the complete MSW contract flow: challenge,
  six-digit verification, withdrawal payload and Idempotency-Key assertion.
- The production-build wallet contract E2E also covers the network maximum,
  challenge and verification requests, submission payload and Idempotency-Key.
- A retry for the same challenge and withdrawal request reuses its idempotency
  key when MFA verification is repeated after a transient submit failure.
- Wallet boundary validation rejects withdrawal-network limits whose maximum
  is below the minimum, transfer receipts that move funds within the same
  wallet, and malformed challenge/verification/receipt timestamps.
- Backend certification still requires server-side risk checks, challenge
  expiry/replay protection, withdrawal holds, address screening, audit events
  and staging E2E.

## Vertical-slice status: Wallet transaction history

- `/wallet/history` now composes
  `features/wallet/pages/WalletTransactionHistoryContractPage` across all
  shells instead of the legacy shell-specific pages.
- Type/status filters, search, deterministic sorting, local pagination, summary
  metrics and loading/error/empty states consume the typed wallet transaction
  query; the page does not call `fetch` or import mock fixtures.
- Presentation helpers are isolated under
  `features/wallet/components/WalletTransactionHistoryComponents.tsx`; the page
  container is 225 lines and remains below the sub-400-line target.
- Backend certification still requires cursor pagination, export authorization,
  transaction ownership, immutable ledger semantics and audit retention.

## Vertical-slice status: Wallet asset and conversion details

- `/wallet/asset/:assetId`, `/wallet/transaction/:txId` and
  `/wallet/dust-converter` are owned by `features/wallet`; the asset-detail
  app adapter supplies only DCA feature-flag and analytics callbacks. Unused
  route-less compatibility exports have been removed.
- Asset and transaction details use typed wallet/market queries. The app shell
  supplies DCA rollout and analytics callbacks so the Wallet feature has no
  dependency on app services or feature internals.
- Dust conversion uses the typed quote and mutation operations, submits an
  idempotency key, and renders API-backed loading, error and receipt states.
  A retry of unchanged source assets and target asset reuses its idempotency key;
  changing the request signature issues a new key.
- Buy Crypto, Gas Optimizer, Wallet Health Score, network status, pending
  deposits, multi-wallet management, token approval and withdrawal limits are
  development-only while their backend contracts are absent. Development
  routes lazy-load implementations directly from `src/dev/legacy/wallet`;
  unused route-less app page shims have been removed. Production routes resolve to the
  integration-pending boundary.
- Certification still requires backend ownership and valuation guarantees,
  quote expiry/replay policy, payment-provider contracts, and staging evidence.

## Vertical-slice status: Market watchlist

- `/markets/watchlist` now uses `features/market` query/mutation hooks for pair
  data and watchlist ownership; its route-less app-page re-export was removed.
- Notes and removal use typed API operations with idempotency keys that are
  reused on unchanged retries; failures remain visible and retryable. Development
  MSW is the only source of fixture state and is not part of the production
  module graph.
- The watchlist contract is defined in `contracts/openapi/market.yaml`;
  backend must enforce user ownership and authorization for every mutation. The
  UI uses `market:watchlist:write` (or aggregate `market:write`) for mutations;
  read-only sessions retain market inspection access.
- Mobile `/pair/:pairId` now reads pair, order-book and recent-trade snapshots
  through the same market API boundary; client-side random price simulation and
  mock order-book/trade generation were removed from that production route.

## Dependency governance

- MUI and Emotion direct dependencies were removed because no production source
  imports them; the Vite manual chunk configuration no longer references them.
- Manual chunks must contain packages present in the runtime dependency graph.
- `npm ci`, high-severity audit, license policy and bundle budget are required
  before a release build. The approved license set is versioned in
  `license-policy.json` and checked by `npm run licenses:check`.

## Quality gates

The release branch must pass typecheck, lint, format check, unit/integration tests,
coverage, architecture validation, dependency audit, dependency license policy and
production build. A direct Vite build without typecheck is not considered a passing
release build.

Current measured production-code coverage is 88.14% lines, 85.49% statements,
80.61% functions and 81.68% branches (2,005 tests across 212 files). The
coverage denominator includes `app`, `features` and `shared`; `src/dev` is
explicitly excluded because those development-only pages are not shipped. The
ratcheted thresholds are currently 86% lines, 84% statements, 79% functions and
80% branches. Final certification requires at least 90% lines, 90% statements,
85% functions and 80% branches. Coverage remains a release blocker until those
targets and critical-flow E2E evidence are met. Tests for development pages still
run in the full suite, and those pages stay outside production only when the
route-boundary and artifact-isolation gates pass.
### Market pair detail route boundary

The phone, tablet, web, and legacy responsive pair-detail URLs compose the same
`features/market` API/query boundary. Route-less app-page exports were removed;
unbacked previews stay under `src/dev/legacy` and cannot own production market
data, polling, or business logic.

The market list row and its unit suite are owned by `features/market`; its old
trading-named app re-export and app-layer test were removed after the market list
had switched to the canonical feature component. The unused app re-export for
the feature-owned `TPSLForm` was also retired after confirming it had no importers.

## Vertical-slice status: Market depth

- Market depth routes now compose `features/market/pages/MarketDepthPage` and
  read pair/order-book snapshots through the typed market API boundary.
- Cumulative bid/ask depth is derived from the API response; synthetic price,
  order-book and whale-alert data are not used by this production route.
- Empty or one-sided order books no longer imply a fabricated spread; each
  missing side is called out, and order-book bars scale against the largest
  server-provided total. The tab selection is exposed with `aria-pressed`.
- `MarketDepthPage.test.tsx` covers sorted levels, bounded depth-bar widths,
  missing-side behavior and the contract-pending whale-alert state.
- The whale-alert tab remains explicitly contract-pending until a backend
  endpoint defines authorization, freshness and alert provenance.

## Vertical-slice status: Market overview

- `/markets/overview` and `/w/markets/overview` now compose the same
  `features/market` page and query the `/market/overview` contract.
- The response is runtime-validated and includes aggregate stats, breadth,
  Fear & Greed history, sector summaries and top movers.
- Phone and web route families compose the feature page directly; fixture data
  is available only through the development MSW adapter.

## Vertical-slice status: Market movers

- `/markets/movers` and `/w/markets/movers` use the shared typed movers query
  with contract-backed view, timeframe and category filters.
- Gainers, losers, most-active, unusual-volume and new-listings are selected
  by the API adapter; the page no longer computes a production list from
  `marketOverviewData`.

## Vertical-slice status: Market shells and alerts

- `/`, `/t/`, `/w/` and `/r/` home shells now use the shared market-pairs
  query; synthetic home announcements and pair lists are no longer in the
  production route.
- Heatmap and sector routes derive their views from typed market pairs and
  overview responses, with no direct `mockData` import.
- `MarketPair` now contains public market data only. Home, list and pair-detail
  favorite state comes from the authenticated user-owned watchlist; failed or
  pending watchlist reads do not fall back to a public `isFavorite` flag.
  Watchlist query-cache entries are scoped by authenticated user ID so one
  account's favorite state is not reused after switching sessions.
- Price alerts have a user-owned API contract with create/update/delete
  idempotency, query invalidation and explicit active/triggered states. The
  write boundary is `market:alerts:write` (or aggregate `market:write`), while
  `market:read` is sufficient for inspection. Mutations now reuse their UUID
  idempotency key on retries of unchanged inputs, expose retry errors with
  accessible alerts, and prevent duplicate pending toggles/deletes; contract
  tests cover request validation and retry behavior.
- `/markets` now composes `features/market/pages/MarketListPage`; its unused
  route-less app-page shim has been removed. Favorite add/remove uses the
  authenticated watchlist mutation contract with idempotency and invalidation.
  Favorite mutations in both `/markets` and `/pair/:pairId` reuse their key on
  unchanged retries and disable duplicate clicks while pending.

## Vertical-slice status: Advanced chart route

- The protected `/trade/advanced-chart/:pairId` route now resolves its requested
  market pair through `GET /market/pairs/{pairId}` instead of silently showing
  the first item from the market list. The routed pair is included in the selector
  even when it is outside the first market-list page; a feature integration test
  protects this route contract.
- The selected timeframe now loads OHLCV from
  `/market/pairs/{pairId}/candles`; the close-price chart has explicit loading,
  empty and retryable error states. The feature integration test checks both the
  route pair and timeframe query.
- A candlestick renderer and server-computed indicator overlays remain pending.
  The page names these limitations and does not present local toggles as active
  calculations or synthesize market signals.

## Vertical-slice status: Profile and security

- Profile overview, edit profile, trusted-device, activity and sub-account
  screens use the typed `features/profile` API/query boundary.
- Profile edits require `profile:write` or the migration alias `profile:edit`;
  trusted-device changes require `profile:security:write` or aggregate
  `profile:write`. Read-only sessions can inspect profile/security data but
  cannot mutate it.
- The contract is `contracts/openapi/profile.yaml`; mutations carry idempotency
  keys and query invalidation. Backend certification still requires ownership,
  re-authentication/MFA, device revocation semantics and audit retention.
- Device trust/revoke actions use UUID idempotency keys, expose mutation
  success/failure feedback and render an explicit empty state; regression tests
  cover permission, retry, success and failure paths. Profile edits also use a
  UUID idempotency key that stays stable across retries of the same form state,
  show API error feedback, keep email read-only and require a non-empty name.
  Regression tests cover normalized updates, immutable email, retry semantics
  and required-field validation.

## Vertical-slice status: Support and notifications

- Support tickets and notifications use the typed `features/support` API/query
  boundary; pages do not call `fetch` or import fixture data directly.
- Ticket creation requires `support:write` or `support:ticket:write`.
  Notification acknowledgement requires `notifications:write` or aggregate
  `support:write`; read-only sessions retain inspection access only.
- Contracts are defined in `contracts/openapi/support.yaml`; write operations
  use idempotency keys and query invalidation. Development MSW remains the
  adapter for tests/dev only; production certification requires backend
  authorization, notification ownership and support audit events.
- Ticket submission and notification acknowledgement use UUID idempotency keys,
  show action success/failure feedback, and retain retryable user state on
  failures with the same key for retries of the same action. Ticket/notification
  lists and help search render explicit empty states; contract tests cover
  success, errors, empty results and permission boundaries.

## Production route safety boundary

- Các route futures, margin, convert, positions và analytics/demo nâng cao vẫn
  giữ public URL để tránh breaking change, nhưng chỉ load implementation cũ trong
  development/test.
- Staging/production dùng `IntegrationPendingPage` cho đến khi API contract,
  permission, audit event và E2E backend staging hoàn tất; vì vậy mock/simulation
  không thể chạy qua production route path.
- Bot compliance không ghi nhận terms, suitability hoặc risk acknowledgement vào
  `localStorage` trong staging/production; các route tương ứng cũng đi qua boundary
  này cho đến khi có server-owned compliance contract.
- Các route wallet/P2P/predictions/launchpad có số dư, approval, order book,
  tournament hoặc staking/swap mock cũng bị chặn khỏi production path; public URL
  được giữ nguyên để migration theo vertical slice không gây breaking change.
- Các màn hình web security có session/device/alert/passkey/2FA fixture cũng dùng
  boundary này; trạng thái security thật phải do backend sở hữu và audit được.
- Cross-module portfolio/analytics/alerts/tax samples, onboarding demo and
  responsive showcase routes remain behind this boundary.
- Cross-module samples, onboarding, shell-template and enterprise-state showcases now live
  under `src/dev/legacy`; development routes target those implementations directly.
- Các màn hình copy-trading về provider, governance, khiếu nại, audit,
  regulatory reporting và best execution không còn hiển thị dữ liệu mẫu như
  trạng thái compliance thật ở staging/production.
- Bot backtesting, analytics, performance, history, tax và API guide vẫn giữ URL
  nhưng chỉ load bản mô phỏng trong development cho đến khi có contract và dữ liệu
  backend tương ứng.

## E2E và accessibility gate

- Playwright smoke chạy trên staging-mode preview build cho root redirect và login
  boundary.
- Contract-E2E intercepts the staging-build network boundary with
  OpenAPI-compatible responses and verifies auth login/logout, wallet deposit,
  wallet transfer, the authenticated trade route, order placement/cancellation,
  P2P escrow release, order payloads, idempotency headers and receipt navigation. This is local
  frontend contract evidence, not evidence that the real staging backend is
  certified.
- Axe scan hiện chặn lỗi accessibility mức `serious`/`critical` trên public login
  shell.
- Các flow giao dịch (login thật, order, transfer, P2P dispute, DCA, staking và
  admin permission) vẫn cần chạy trên backend staging thật trước certification.

## Vertical-slice status: Market candles

- Trading mini chart now reads typed OHLCV candles from
  `/market/pairs/:pairId/candles`; no random walk or generated price data is
  imported by the production chart path.
- The interval and limit are part of the Market OpenAPI contract, validated by
  the API adapter and cached through a feature-owned TanStack Query key.
- Development candles remain isolated in the MSW handler; backend staging must
  provide precision/volume semantics and authorization-free public market data
  according to the contract. Runtime validation rejects unordered/duplicate
  timestamps and OHLC values whose high/low do not envelope open/close.

## Vertical-slice status: Trading order lifecycle

- `/trade`, `/t/trade`, `/w/trade`, `/r/trade` and order-history routes compose
  the canonical trading page and typed trading query/mutation boundary.
- `features/trading/pages/TradePage.tsx` là route boundary; terminal tương tác
  nằm trong `features/trading/components/TradeTerminal.tsx`. Shell overrides
  import trực tiếp feature page; app-level compatibility shim đã được gỡ.
- Open orders, order history and cancellation use the trading OpenAPI adapter;
  mutating cancellation requests require an idempotency key.
- Trading order snapshots are runtime-validated for positive amount/execution
  price, non-negative fee/fill, RFC3339 timestamps, fill not exceeding amount,
  and consistent `filled`/`partial` status. Contract tests reject malformed
  server snapshots before they reach order-history or receipt UI.
- `TradeTerminal` now has an MSW integration test for the user-facing order
  lifecycle: invalid amount keeps submission disabled, limit-order confirmation
  sends the typed payload and `Idempotency-Key`, and the receipt route is
  reached after a successful response.
- The order modification sheet is isolated as `OrderModifySheet.tsx`; focused
  component tests cover prefilled order values, positive finite validation,
  permission and pending states, and the save/cancel callbacks.
- Open-order cards, order history cards and order confirmation now live in
  `OpenOrdersPanel.tsx`, `OrderHistoryPanel.tsx` and
  `OrderConfirmationSheet.tsx`, keeping rendering responsibilities out of the
  terminal. Market data/navigation and the controlled order-entry form now live
  in `TradingMarketPanel.tsx` and `TradingOrderEntryPanel.tsx`; the terminal is
  below the 600-line limit and no longer belongs to the oversized-module backlog.
- Order submission is also guarded by the session permission boundary
  (`trading:write`, with the legacy `trade:write` alias accepted during
  migration); read-only sessions can still inspect the terminal and open
  orders but cannot submit, modify or cancel a mutation.
- Limit and market order entry also checks finite positive price/amount values
  and the available quote/base balance before opening confirmation. Confirmation
  rechecks the current state before sending. OCO forms and their submit handler
  apply the same trading-write permission boundary.
- Persisted trade preferences are normalized against allowed order types,
  timeframes, precision values, booleans and positive thresholds on initial load
  and cross-tab updates; malformed local storage cannot inject invalid settings
  into the terminal.
- The trade route accepts only `buy` or `sell` from the `side` query parameter,
  defaulting invalid values to `buy`. Placement, OCO, modification and
  cancellation now reuse idempotency keys when the same logical payload is
  retried after an API failure; the order lifecycle tests verify placement,
  modification and cancellation key reuse, plus invalid-side normalization.
- The same test covers selecting open orders and cancelling an order through
  the typed mutation, including the order id and idempotency header. The
  rejection path also keeps the user on the terminal without navigating to a
  receipt. Editing an open order now rejects blank, non-finite and non-positive
  price/amount values before the PATCH request; valid edits carry the
  idempotency header, and read-only sessions cannot edit or cancel.
  false receipt. The backend/staging acceptance gate is still separate from
  this frontend contract evidence.
- Development order state is served only by stateful MSW handlers; create,
  modify, cancel, idempotent replay and open/history reads share one dev store.
  Backend certification
  still requires real order lifecycle events, authorization, audit events and
  staging E2E coverage.
- Account identity changes and sign-out clear the shared React Query cache so
  cached wallet and other user-owned data cannot be reused by a later session.
- `trade/order-receipt` now loads the feature-owned `OrderReceiptPage` in every
  shell. It validates navigation state at runtime, renders the order price,
  status, timestamp and fee returned by the order API, and fails to a recovery
  state when no valid receipt payload is present; the old synthetic receipt
  fallback was removed.
- The fee-tier display no longer uses hard-coded VIP/discount numbers. Until a
  fee-quote contract exists, entry and confirmation views state that the server
  determines the fee; the receipt displays the fee returned by the order API.
- The max-slippage selector and amount-based slippage estimate were removed
  because the trading request contract does not accept or enforce that setting.
  The market-order confirmation now explains that execution price and fee depend
  on liquidity and server processing time. A supported price-protection flow
  still needs a backend quote/order contract and real staging verification.
- The copy-trading leaderboard now consumes `/trading/copy/providers` with
  server-side ranking, risk and verification filters. Provider rankings remain
  informational until real performance attribution, risk disclosures and
  compliance audit events are available in staging.
- Copy-trader mock validation and sanitization now live under
  `src/dev/legacy/trading`, not the production feature or app utility layer.
  Tests validate the full `COPY_TRADERS` fixture set, duplicate IDs and weekly
  histories shorter or longer than seven days. The invalid assumption that
  lifetime PnL percentage must equal PnL divided by current AUM was removed.
- `/trade/trader/:traderId` now consumes the provider profile contract for
  performance history and recent trades. Client-side random PnL generation and
  hardcoded trade history were removed; copy execution still belongs to the
  separate order/configuration slice.
- `/trade/copy-trading` now uses the same provider query for aggregate metrics,
  server-side sorting and risk disclosure; the feature-owned page no longer
  imports the legacy copy-trader fixture.
- Copy relationship lifecycle is now contract-first: provider detail,
  pre-copy risk acknowledgement, configuration, confirmation and active-copy
  management compose `features/trading` query/mutation hooks. The activation
  and stop mutations require idempotency keys and invalidate the relationship
  query after success. An unchanged activation or stop request reuses its key
  after a transient failure and clears it only on success; contract tests verify replay.
- The copy-trading public URLs are composed by `features/trading/routes.ts`;
  `app/routeConfig.ts` no longer owns the implementation-level lazy imports for
  this slice.
- The `/trade/settings` page is owned by `features/trading/pages` and is lazy-
  loaded from the feature module. It consumes the feature settings model and
  shared UI/hooks; selectable controls expose pressed state and the preference
  persistence flow is covered by a feature-page test.
- Eight unused legacy Trading UI prototypes that generated local chart/order
  behavior have been moved from `src/app/components/trading` into
  `src/dev/legacy/trading/components`; they now use shared theme surfaces and
  cannot enter the production route graph. Unused app re-exports for the
  feature-owned OCO form, order book, pair switcher, recent-trades list and
  shared sparkline were retired after importer checks.
- The copy-trading education hub is feature-owned at
  `features/trading/pages/CopyEducationPage.tsx`; mobile and web routes are
  composed by the feature router and use the same page for both public URL
  families. The unused app-page re-export was removed. Its simulated
  examples remain illustrative pending product and compliance review; this move
  does not certify the page for production.
- The web copy performance URL is composed by `features/trading/routes.ts` and
  loads the selected relationship from the typed trading API. The app web router
  no longer imports that page directly; a page test and browser flow protect the
  API data display and existing URL.
- Active-copy, provider-detail, configuration and confirmation legacy pages are
  no longer retained as app-page compatibility exports. Tests for remaining
  unrouted demos now live under `src/dev/legacy/trading/__tests__` and import
  their development implementations directly; contract-backed tests cover the
  production relationship lifecycle.
- The relationship contract is defined in `contracts/openapi/trading.yaml`;
  development MSW keeps state only for local/test execution. The production
  route has no fixture import, but backend staging still must enforce balance,
  suitability, permission, cooling-off, position-close and audit policies.
- `/trade/bots` and `/w/trade/bots` still use client-only simulated bot
  builders, now isolated at `src/dev/legacy/trading/TradingBotsDemoPage.tsx` and
  `src/dev/legacy/trading/WebTradingBotsDemoPage.tsx`. Development routes load
  the demos only in development; staging and
  production show the integration-pending boundary until a bot contract,
  authorization model and integration evidence are implemented.
- All 66 development-only Trading route targets now lazy-load implementations
  directly from `src/dev/legacy/trading`; unused route-less app-page exports
  have been removed. The route inventory
  follows the dev-only implementations and carries their mock-reference
  evidence onto the app route records.
- The route-less legacy `PreCopyAssessmentPage` and `ProviderComparisonPage`
  remain reachable only from their isolated legacy tests. The live assessment
  and comparison routes resolve to `PreCopyAssessmentContractPage` and
  `ProviderComparisonContractPage` in `features/trading`; retain the old demos
  until their remaining test coverage is deliberately retired or migrated.

## Vertical-slice status: Trading analytics

- `/w/trade/analytics` now composes `features/trading/pages/TradeAnalyticsContractPage`
  instead of the legacy fixture-backed web page.
- The `/w/trade/analytics` route is composed by `features/trading/routes.ts`; the
  app router no longer imports the page directly.
- Analytics period, summary, daily P/L, trade ranking and asset breakdown are
  validated by the typed adapter at `/trading/analytics`; the page has explicit
  loading and error states and does not import `mockData`.
- The contract is documented in `contracts/openapi/trading.yaml`; MSW data is
  isolated in `src/dev/mocks/trading-analytics-fixtures.ts` and is not part of
  the production route boundary.
- Backend certification still requires user-scoped analytics, immutable trade
  history, timezone/precision rules, export authorization and staging E2E
  verification against the real order ledger.

## Vertical-slice status: Wallet portfolio analytics

- `/wallet/portfolio-analytics` and the web alias `/portfolio/analytics` now
  compose `features/wallet/pages/PortfolioAnalyticsContractPage` across all
  shells; the public URLs remain unchanged.
- The web alias is composed by `features/wallet/routes.ts` and registered by the
  app shell through the wallet feature route factory.
- Portfolio history, monthly P/L, performer rankings, period selection and
  summary metrics are loaded through `useWalletPortfolioAnalyticsQuery` and
  runtime-validated by the wallet API adapter at `/wallet/analytics/portfolio`.
- Development data is served only by the MSW handler in `src/dev/mocks`; the
  feature page has no direct mock import or direct `fetch` call.
- Backend certification still requires user-scoped valuation, immutable ledger
  semantics, timezone/precision policy, export authorization and staging E2E
  verification against real balances.

## Vertical-slice status: Profile and account security

- The default phone/profile route and profile sub-routes now compose
  `features/profile` typed query and mutation boundaries for profile data,
  editing, devices, activity audit and sub-accounts.
- Profile mutations use idempotency keys and TanStack Query invalidation;
  device trust/revoke actions are no longer delayed local state transitions.
- The contract is `contracts/openapi/profile.yaml`; MSW fixture state is only
  available through the development adapter. Backend must enforce ownership,
  re-authentication/MFA for sensitive actions, device revocation semantics and
  immutable audit retention before certification.
- Legacy profile page files remain compatibility implementations until their
  page-specific test suites are moved to feature pages; they are not composed
  by the migrated production routes.

## Vertical-slice status: Content, notifications and support

- News, announcements, notifications, help center and support-ticket routes
  now compose `features/support` typed query/mutation boundaries across phone
  and web shells.
- Notification read state and support-ticket creation use idempotency keys and
  query invalidation. Pages no longer own `useState` copies of notification or
  ticket fixtures.
- The contract is `contracts/openapi/support.yaml`; development MSW is the
  only fixture adapter. Backend must enforce notification ownership, content
  publication policy, ticket authorization, rate limiting and auditability.
- Existing legacy news/support pages are compatibility implementations until
  their dedicated UI tests are migrated and the files can be deleted.

## Vertical-slice status: Prediction markets

- Prediction event discovery, event detail, portfolio, rewards, leaderboard,
  activity and order receipt routes now consume `features/predictions` query
  hooks instead of importing `predictionMockData` from page modules.
- The core prediction route family is composed by
  `features/predictions/routes.ts`; risk, social, tournament and data-integration
  tools remain explicitly compatibility routes until their own contracts exist.
- Prediction orders use an explicit request contract and idempotency key;
  receipt status is server-owned and the dev adapter now enforces idempotency,
  replays duplicate requests and exposes a queryable receipt lifecycle only
  under `src/dev/mocks`.
- Event order placement requires `predictions:trade` (or aggregate
  `predictions:write`) in the UI and the OpenAPI operation declares the same
  authorization requirement.
- The contract is `contracts/openapi/predictions.yaml`. Backend certification
  still requires market resolution rules, balance reservation, price/odds
  validation, duplicate-order protection, authorization and audit events.
- Advanced prediction tools remain compatibility routes until each tool gets a
  typed API boundary and dedicated integration/E2E coverage.
- The risk calculator's user-entered, pure calculation page is now owned by
  `features/predictions/pages` and uses shared UI primitives; its route and
  calculator/scenario/guide behavior are covered by a feature-page test.
- The static advanced-chart page, its order-flow panel and fabricated chart
  series live under `src/dev/legacy/predictions`; the production URL remains
  available but resolves to `IntegrationPendingPage`. Inventory classifies it
  as a demo, the fixture-import gate verifies development-only consumers and a
  production browser test verifies the boundary.
- Prediction risk calculations live under `features/predictions/lib`; static
  chart series and its analysis panel are development-only legacy code. P2P
  guide and fraud-education content likewise live under `features/p2p/model`; the
  four large legacy screens are all below 600 lines but remain demo/compatibility
  pages pending typed backend contracts and integration evidence.

## Engineering gates

- `page-size:check` blocks feature pages, feature modules and legacy app pages
  over 600 lines. The current scan has no page or feature module over the limit.
- Route contract tests protect the public discovery/prediction paths and the
  protected trade, wallet, profile and P2P route families.
- Coverage gates ratchet from 86% lines, 84% statements, 79% functions and
  80% branches, with a final certification target of 90% lines, 90% statements,
  85% functions and 80% branches. The current
  production-code measurement is 88.14% lines, 85.49% statements, 80.61%
  functions and 81.68% branches (2,005 tests across 212 files); ratcheted
  thresholds are currently met, while the final target remains 90/90/85/80
  so Phase 1 remains open. `src/dev` is explicitly excluded from that denominator because it is not
  shipped, while its tests still run in the full suite. Route and artifact gates must prove that any
  moved implementation is genuinely development-only.
- Lazy route loading retries transient module failures; after the automatic
  retries are exhausted, the user retry action creates a fresh lazy module
  instance so React does not reuse its cached rejected promise.
- The mock-import gate now has a zero-consumer budget. Legacy Launchpad,
  Trading and Predictions fixture modules were moved to `src/dev/mocks`, with
  their development-only consumers updated to the dedicated fixture boundary.
- Lint warning ceiling is ratcheted to the current 522 warnings, with zero
  errors. The certification target remains zero. `src/app`, `src/features` and
  `src/shared` currently have zero warnings; `src/dev` accounts for most
  remaining warnings (mostly unused legacy prototype variables/imports). Every
  new slice must reduce or stay below the ceiling; certification target remains
  zero.
- `security:check` scans runtime source and blocks credential-like values from
  being written to `localStorage`, `sessionStorage` or browser cookies. Access
  tokens remain memory-only in the shared API client; refresh is delegated to
  the backend's HttpOnly cookie.
- `env:check` enforces that `import.meta.env` is read only by
  `src/shared/config/env.ts`; route and feature code consumes the validated
  `env` boundary instead of reading Vite globals directly.

## Vertical-slice status: Discovery

- `/search`, `/topics` and `/topic/:topicId` now compose the
  `features/discovery` contract-first pages. The route-compatible files under
  `app/pages/discovery` are re-export shims only.
- Search results are explicitly segmented into prediction markets, Arena
  Points, creators and spot pairs. Discovery pages do not import fixture data
  or call `fetch` directly.
- The contract is `contracts/openapi/discovery.yaml`; query hooks validate all
  responses with Zod and development MSW owns the fixture adapter. Backend
  certification still requires search authorization, ranking/relevance rules,
  pagination, rate limiting and privacy filtering.

## Vertical-slice status: Open Arena core

- `/arena/mode/:modeId`, `/arena/challenge/:challengeId` and
  `/arena/join/:challengeId` now use `features/arena` typed read/mutation models
  and query hooks. Their route definitions are composed by
  `features/arena/routes.ts`; the old join page is no longer a production
  implementation.
- The join confirmation requires explicit rule/points acknowledgement before
  submitting the contract mutation, then navigates only after the server
  returns the updated challenge receipt.
- Challenge join is a server mutation with an idempotency key, explicit state
  conflict handling and an audit event identifier. The development adapter
  rejects missing keys and replays duplicate joins without creating a second
  participant. Client state never treats local storage as the source of Arena
  points or participation truth.
- Challenge entry is guarded by `arena:join` (or aggregate `arena:write`);
  read-only users can inspect the challenge but cannot submit the join mutation.
- Arena/prediction bridge prototypes used only by development routes and fixtures
  now live under `src/dev/legacy/arena`; the one Market discovery widget is
  feature-owned by `features/market`, so shared UI no longer contains those demos.
- The contract is `contracts/openapi/arena.yaml`; backend certification still
  requires points reservation/settlement, membership authorization, privacy
  enforcement, anti-abuse controls and immutable audit records.

## Vertical-slice status: Referral overview

- `/referral` now reads a typed authenticated overview from
  `features/referral`; `features/referral/routes.ts` owns the route while
  unbacked referral previews remain isolated under `src/dev/legacy/referral`.
- Referral code, tier, campaign, stats and friend summaries are server-owned
  read models. Copying the invitation link is a presentation action and does
  not create client-side commission state.
- The contract is `contracts/openapi/referral.yaml`; backend certification
  still requires attribution integrity, fraud/abuse controls, privacy
  filtering, commission settlement and immutable audit records.

## Vertical-slice status: Launchpad core

- `/launchpad` and `/launchpad/:id` now compose `features/launchpad` typed list
  and detail queries. Unused route-less app-page re-exports were removed; demo
  implementations remain isolated under `src/dev/legacy/launchpad`.
- The feature validates project status, tokenomics, vesting, team, audit and
  access metadata at the API boundary; it does not simulate subscription or
  allocation mutations in the absence of a backend transaction contract.
- The contract is `contracts/openapi/launchpad.yaml`; development data is
  mapped from the legacy fixture only inside `src/dev/mocks/handlers.ts`.
- Integration tests cover server-backed list rendering, detail rendering and
  the shared API error state. Backend certification still requires balance
  reservation, eligibility/KYC, allocation settlement, idempotency and
  immutable audit events.

## Vertical-slice status: P2P core shells

- Phone, tablet, web and legacy responsive P2P home routes now compose the
  query-backed P2P marketplace page. The marketplace page and its cards,
  filter/results sections and action sheets are owned by `features/p2p`; the
  `app/pages/p2p/P2PHomePage` module is now a small composition adapter for the
  app-owned sheet analytics callbacks.
- P2P home ad listings, overview statistics, filters, refresh/error/loading
  states and comparison actions are composed inside the feature boundary.
  Marketplace platform statistics now come from the typed overview response;
  no local mock-data import is used by the page.
- `/p2p/my-orders` now composes `features/p2p/pages/P2POrdersContractPage`
  across phone, tablet, web and responsive shells; processing, completed and
  disputed views are derived from the typed `/p2p/orders` response.
- The order list has explicit search, deterministic date/amount sorting,
  loading/error/empty states and shell-aware navigation into the canonical
  order route; no page-level fixture data or direct `fetch` remains.
- The migrated page uses `model/p2p-order-queries.ts` as a narrow query
  boundary; it does not load the legacy all-in-one P2P query module while this
  slice is being certified.
- `/p2p/disputes` now uses a dedicated dispute query boundary with explicit
  status-filter, empty, retry and navigation coverage. Compliance certification
  still requires backend ownership checks, evidence retention, escalation audit
  events and staging E2E coverage.
- `/p2p/dispute/detail/:id` now uses a dedicated detail query/mutation boundary;
  message and escalation mutations are idempotency-keyed and update the cached
  detail before invalidating the dispute-list root.
- The migrated compliance URLs and the remaining protected P2P catalog are
  composed by `features/p2p/routes.ts` and
  `app/routes/p2pProtectedRoutes.ts`, respectively. Pending screens remain
  development-only and resolve to the production integration boundary.
- Legacy P2P dispute submission/evidence, AML/compliance claims, KYC capture,
  local settings, payment-method verification and limit/history screens now
  load only in development. Production routes show the integration-pending
  boundary until their API contracts, authorization policies and audit
  behavior exist; hard-coded "clear" status and client-only success flows are
  not accepted as live user or compliance data.
- The P2P chat shell now uses a narrow chat/order query boundary and keeps
  message mutation cache updates outside the legacy P2P query barrel.
- `/p2p/chat/:orderId` and the contract-backed web create/order-room/order
  aliases are now declared in `features/p2p/routes.ts`; `app/routes.ts` only
  composes the web alias array into its shell.
- `/p2p/escrow/:orderId` is also feature-owned and covers the contract-backed
  mark-paid → challenge → verify → release state transition.
- Escrow order and receipt timestamps, optional paid/released/cancelled times,
  and release challenge/verification expiries are runtime-validated as RFC3339;
  order ratings are constrained to the contract's 0–5 range.
- Escrow mutations are guarded by the session permission boundary
  (`p2p:write`, with `p2p:release` and `p2p:mark-paid` aliases during migration);
  read-only sessions retain state visibility without action controls.
- `/p2p/payment-methods` is feature-owned with idempotent default/delete
  mutations, empty/error states and no page-level mock data.
- `/p2p/blacklist` and `/p2p/blacklist/add` are now feature-owned trust routes.
  List filtering, empty/error/retry states, create and remove mutations use the
  dedicated `model/p2p-blacklist-queries.ts` boundary; create/remove requests
  carry idempotency keys and mutation failures are contained without unhandled
  promise rejections.
- `/p2p/merchant/:merchantId`, `/p2p/report/:merchantId` and `/p2p/reviews`
  now compose the same `p2pTrustRoutes` module. Merchant profile/report/review
  reads and report mutations use `model/p2p-trust-queries.ts`; report failures
  remain in mutation state and do not cause unhandled promise rejections.
- `/p2p/security/2fa` is feature-owned through `p2pSecurityRoutes` and uses a
  dedicated `model/p2p-security-queries.ts` boundary for settings, method and
  threshold mutations plus Authenticator setup/confirm. Sensitive mutations
  are idempotency-keyed and the UI contains API failures in toast/mutation state.
- `/p2p/dashboard` and `/p2p/trading-level` now compose `p2pOverviewRoutes` and
  read server-owned analytics/level data through `model/p2p-overview-queries.ts`.
- `/p2p/achievements` is also feature-owned through `p2pOverviewRoutes`, while
  `/p2p/ad-analytics/:id` and the Express buy/sell flow are composed by their
  dedicated feature route modules. Their pages import narrow model boundaries
  directly; no P2P feature page imports the legacy `features/p2p` barrel.
- `/p2p/payment-method/add` and `/p2p/payment-methods` share the typed payment
  method model boundary, including idempotent creation and cache invalidation.
- The web critical URL `/w/p2p/order/:orderId` composes the escrow contract
  page. `/w/p2p/my-orders` uses the shared protected-route composition; the
  legacy `/w/p2p/order-room` URL aliases the same feature-owned page, which loads
  the server-owned order list.
- The canonical `/p2p/order/:orderId` route now composes the same feature-owned
  lifecycle page across phone/tablet/responsive shells. No-ID web navigation
  no longer loads the legacy all-in-one order-room page.
- `/p2p/order/timeline/:orderId`, `/p2p/order/cancel/:orderId`,
  `/p2p/order/proof/:orderId` and `/p2p/order/rate/:orderId` now belong to
  `p2pOrderActionRoutes`. Their pages use typed order queries, idempotent
  cancel/rate/proof mutations and explicit loading/error states; unbacked
  previews remain under `src/dev/legacy/p2p`.
- P2P order-list and order-room shell routes use the canonical P2P order query
  and state-transition page; obsolete shell page re-exports were removed.
- `/p2p/create` and `/w/p2p/create-offer` now compose
  `P2PCreateAdContractPage`; the 703-line legacy implementation is isolated in
  development. The form validates limits/payment requirements,
  submits the typed `P2PAdCreateRequest`, uses an idempotency key and contains
  API failures without leaving an unhandled promise.
- `/p2p/my-ads` now composes `P2PMyAdsContractPage`; list, status and delete
  operations use the dedicated `p2p-my-ads-queries.ts` boundary. Filtering,
  loading/error/empty states, retry, confirmation and idempotent mutations are
  covered by feature integration tests; the unused route-less app-page export
  was removed.
- `/p2p/ad/:id` is now composed by `features/p2p/routes.ts` through
  `P2PAdDetailContractPage`; the legacy detail route was removed while the
  public URL stayed unchanged. Ad reads and order creation use typed API/query
  boundaries, loading/error/validation states and an idempotency key.
- P2P security slices cover release challenge verification and 2FA settings.
  Payment methods now use `/p2p/payment-methods` with idempotent create,
  default-selection and delete mutations; the add/list routes are feature-owned.
- The P2P endpoint adapter now keeps Zod response schemas in
  `p2p-api-schemas.ts` and its public method contract in `p2p-api-contract.ts`;
  `p2p-api.ts` owns endpoint requests and response parsing at 457 lines.
- Dispute list/detail uses `/p2p/disputes`, message and escalation contracts;
  server state owns the timeline and conversation, while MSW is dev-only.
- P2P dashboard and trading-level pages now read analytics and level data from
  typed `/p2p/dashboard` and `/p2p/overview` responses. KYC/AML, fraud and
  compliance action pages still require audited backend contracts before
  production certification.
- The P2P marketplace no longer presents favorites as a persisted action: the
  API contract has no favorite endpoint, so its local-only toggle, success toast
  and swipe/menu affordance were removed pending a server-backed contract.
- Reviews and blacklist now use `/p2p/reviews` and `/p2p/blacklist` contracts;
  blacklist create/remove mutations require idempotency keys and invalidate
  server state. The development fixture remains isolated in the MSW adapter.
- Express buy/sell now resolves active ads and verified payment methods through
  typed queries, then creates the escrow order through `/p2p/orders` with an
  idempotency key. The confirmation route no longer simulates order creation
  with a client-side delay or redirects to a hardcoded order ID.
- `/p2p/escrow/:orderId` now reads the canonical order state and uses the
  challenge → verify → release flow with a short-lived verification token;
  synthetic escrow addresses, signers and local release state were removed from
  that route.
- The staging-build contract E2E covers P2P release challenge/verification,
  dispute escalation and support messaging, including short-lived tokens,
  idempotency headers and final state transitions.
- `/p2p/chat/:orderId` now uses the order-chat read/send contract with query
  polling, runtime validation and idempotent message mutations. Local simulated
  replies and client-only read receipts are no longer the source of truth;
  backend WebSocket delivery remains a staging prerequisite.
- `/p2p/achievements` now reads progress and rewards from a typed response;
  achievement state is no longer embedded in the production page module.
- `/p2p/ad-analytics/:id`, `/p2p/merchant/:merchantId` and
  `/p2p/report/:merchantId` now use typed analytics, merchant-profile and
  compliance-report contracts. The dev adapter explicitly reports chat as
  non-E2E until the backend supplies a verified encryption protocol.
- All 43 development-only P2P route targets now lazy-load their implementations
  directly from `src/dev/legacy/p2p`; the KYC requirements preview was moved out
  of the production feature boundary and its unused app compatibility shim was
  removed. The inventory follows the route to the dev-only boundary.

## Admin route authorization

- `/admin`, `/admin/analytics`, `/admin/abtests` and `/admin/funnels` are
  nested behind both the `admin` role and `admin:read` permission. Authentication
  alone is not sufficient to enter the admin surface.
- The admin/analytics OpenAPI contract is `contracts/openapi/admin.yaml`.
  Feature-flag mutations require an idempotency key; backend staging must still
  provide authorization, audit logging, rollout expiry and rollback semantics.
- The admin read surface now belongs to `features/admin`: Zod-validated API
  adapters, TanStack Query hooks and contract pages replace the legacy
  localStorage analytics services on the development route. The MSW adapter
  supplies overview, funnel, A/B-test and idempotent feature-flag responses;
  production remains pending until the backend implements this contract.

## Route ownership boundaries

- Contract-backed route composition now lives in `features/market/routes.ts`,
  `features/wallet/routes.ts`, `features/profile/routes.ts`,
  `features/discovery/routes.ts`, `features/support/routes.ts` and
  `features/trading/routes.ts`.
- The authenticated P2P route catalog now lives in
  `app/routes/p2pProtectedRoutes.ts`; `app/routeConfig.ts` composes that module
  with the feature-owned route modules and residual pending routes.
- The protected trading catalog and its development-only page bindings now
  live in `app/routes/tradingProtectedRoutes.ts`; production routes retain the
  same integration boundaries and public paths.
- Wallet and profile catalogs, including development-only page bindings, now
  live in `app/routes/walletProfileProtectedRoutes.ts`. The route factory keeps
  shell-specific overrides as explicit inputs.
- `routeConfig.ts` no longer owns P2P, trading, wallet or profile catalogs,
  keeping the root route factory focused on shared shell composition.
- The web copy-trading compatibility URLs (`trade/copy/...`) are composed by
  `createTradingWebRoutes`; root router code no longer owns their page imports.
- Public URLs remain backward-compatible; route contract tests cover the shared
  shells and feature route modules independently.
- The generated route inventory records direct feature page imports nested by
  app composition adapters in `compositionTargets`; route ownership and future
  certification checks can therefore resolve the rendered feature page while
  preserving the actual app adapter as the route's target.
- Route import targets are resolved relative to their declaring route module
  (including `@/` aliases), so same-named app compatibility shims do not inherit
  route ownership from feature pages.

## Inventory status evidence

- Current generated inventory contains 416 source pages, 428 routes, 233 components,
  0 legacy data modules, 33 service/API files and 23 mock sources.
- Page status is classified as 106 `integration-pending`, 233 routed
  development-only `demo`, no `deprecated` aliases and 77 route-less
  `not-implemented` source pages. The inventory resolves nested route paths, index routes and injected
  component targets from route factories. The `not-implemented` status means a
  source page file has no route evidence; it is not a production certification.
  Those 77 route-less files are development legacy sources: 58 Earn, 8 web,
  5 Launchpad, 2 P2P, 2 trading, 1 arena and 1 tools page. They remain tracked
  for legacy cleanup, while routed development pages remain classified as `demo`.
- No page is currently certified as `production`: the full per-page evidence
  set required by `contracts/README.md` is not recorded and verified here.
- Production status is opt-in through
  `docs/architecture/production-page-certifications.json`. The inventory gate
  requires contract, adapter, authorization, integration-test and staging
  evidence, a non-development route, no page-level mocks and no direct runtime
  access before accepting a certification.
- Staging evidence must be a JSON file under
  `docs/architecture/staging-evidence/` containing `environment: "staging"`,
  HTTPS `baseUrl` and `testRunUrl`, an ISO `verifiedAt`, a 40-character deployment
  `commitSha`, and every non-development route path covered by the run. A free-form
  string cannot promote a page to `production`.
- 237 route-less pure re-export pages under `src/app/pages` were removed after
  confirming there were no source importers and redirecting test coverage to
  canonical feature/development modules. The demo-specific page suites were
  moved under `src/dev/legacy`. Thirty-four unrouted staking prototypes are archived under
  `src/dev/legacy/earn/unrouted-staking` with `shared` UI imports. The generator
  classifies the remaining pure feature alias as `deprecated`; route-less
  source pages are now counted separately as `not-implemented`.
- A further 21 unreferenced `src/app/pages` exports that only forwarded to
  `src/dev/legacy` were removed. Inventory now resolves directly routed dev
  modules as page targets even when their filename does not end in `Page` or
  `Screen`, so their demo and mock evidence remains attached to the route.
- P2P fraud-prevention and guide routes are composed by `features/p2p`. The KYC
  requirements preview remains available in development; production now shows
  the integration-pending boundary because its displayed current tier is local
  mock state. Feature tests cover interactions and the production browser test
  verifies the KYC boundary.
- The inventory records 120 pages with mock/simulation references. No page has
  direct runtime access to `fetch`, `WebSocket` or browser storage.
- The production certification manifest still has zero certified pages; E2E
  contract interception does not substitute for verification against a real
  backend staging environment.

## Production artifact isolation

- Development-only route branches use `isDevelopmentBuild` from the validated
  `src/shared/config/env.ts` boundary. This keeps the Vite build flag centralized
  while allowing demo and contract-pending modules to be removed from the
  production graph instead of merely hidden at runtime.
- Legacy web security audit, notification preference, API-key management, KYC,
  profile settings and VIP demo routes now resolve to the integration-pending
  page in staging/production. The security overview uses the typed profile
  query page, which shows an error state without backend data instead of
  fabricated settings.
- The latest production artifact was checked for legacy Arena/Launchpad data,
  copy-trading demo code and the DCA optimizer demo; none of those modules are
  present in `dist/assets`.
- The 5,872-line Launchpad mock/simulation module lives in
  `src/dev/legacy/launchpad-legacy-fixtures.ts`. Its 22 fixture-backed legacy
  page implementations and their shared component now live in
  `src/dev/legacy/launchpad`; routed demos stay behind development-only guards.
  The inventory follows those implementations; development routes target the demo files directly so
  mock-reference evidence remains attached to route records.
- The unused app-level P2P mock service and hook were removed from `app`; the
  API-shaped stub remains in `src/test/fixtures` for its legacy contract tests.
- Current boundary checks retain 191 explicit route guards and verify that all
  109 routed mock-reference pages and 233 routed demo pages stay development-only.
  Public route URLs remain available through the guarded route composition;
  unused route-less app-page aliases have been removed.
  The fixture-import gate now has zero routed page consumers; all fixture data
  is isolated under `src/dev/mocks`.
- Legacy market analytics implementations (`MarketCalendar`,
  `DerivativesOverview`, `SocialSentiment`, `PortfolioTracker`, `MarketNews`,
  `TokenUnlocks`, `SocialSignals`, `MarketCorrelations`) now live under
  `src/dev/legacy/market`; their development routes target those files directly.
  Referral
  history/rules/detail pages remain development-only until contract-backed data
  boundaries are implemented. Static `marketP*Data` and `referralData` modules
  are excluded from production route loading.
- The 78 development-only route imports that formerly traversed
  `src/app/pages` wrappers now resolve directly to their `src/dev/legacy` implementation
  (profile 5, prediction 6, Arena 23, cross-module 4, referral 4, Launchpad 21,
  rewards 1, markets 8, responsive 1, and trade-provider tools 5). The public
  route URLs and production guards are unchanged. Production route targets are
  not redirected to demo code.
- The remaining 35 development-only import call sites in `src/app/routes.ts`
  also resolve directly to their `src/dev/legacy` implementations. Across both
  route entry files, no development-only target imports through an
  `src/app/pages` compatibility wrapper; route inventory and production guards
  continue to verify target eligibility.
- `production-routes:check` now enforces that direct-import rule so a future
  development-only route cannot quietly reintroduce an app compatibility
  wrapper into its route graph.
- `npm run build` now invokes the local TypeScript and Vite CLIs through Node.
  This avoids Windows nested npm PATH resolution failing to find `tsc` in the
  build script while keeping the same two TypeScript projects and Vite build.
- Playwright's staging-build server now uses the active Node executable for
  both build and preview startup, avoiding the same nested Windows PATH issue.
- `production-mocks:check` now blocks those legacy module markers in every
  JavaScript artifact, in addition to MSW and test-fixture markers.
- Chart vendors are split into Recharts, chart-math and Lightweight Charts
  chunks. The build no longer emits a chunk-over-500-kB warning; `bundle:check`
  enforces both a 500-kB raw and 250-KiB gzip limit per JavaScript chunk.
- P2P marketplace filtering and sorting now live in a pure feature-library
  function, with focused tests for side, status, asset, search, payment, trader,
  amount and sort rules. Dust conversion contract coverage also exercises the
  authorized quote-to-confirm flow, idempotency header and post-success reset.
- DCA plan create/update/delete, P2P escrow release and copy relationship
  activation/stop retry coverage verifies
  that an unchanged transaction reuses its idempotency key after a transient failure.
- The latest verified local gates include typecheck, lint warning budget,
  formatting, 2,005 unit/integration tests across 212 files, margin
  suite (95 passed, 4 skipped), security, environment, OpenAPI, architecture,
  inventory, page size, production route/mock boundaries, dependency
  audit/license policy, production build and raw/gzip bundle budgets. The latest
  full browser run passed all 39 checks, including MFA login, escrow release,
  open-order modification and wallet withdrawal. Two earlier full runs briefly
  failed to observe the withdrawal success state; the wallet suite and two later
  subsequent full browser runs passed. Contract interception still does not certify live backend staging.

## Observability boundary

- Component, route and lazy-loading error boundaries report through the
  vendor-neutral telemetry interface with release version and route/component
  context; browser diagnostics remain visible and are not swallowed.
- Global `error` and `unhandledrejection` handlers in `app/App.tsx` report the
  same release context for failures outside React render boundaries.
- Bottom-sheet open events are sent through `shared/telemetry/sheet-analytics.ts`
  to the shared telemetry sink. Its in-memory diagnostic history is capped at
  100 entries and returned as a snapshot so it cannot grow without bound or be
  mutated by consumers.
