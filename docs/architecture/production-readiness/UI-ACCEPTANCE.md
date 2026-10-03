# UI acceptance index

Status: **C05.01 index and C05.02 local preview smoke complete; C05 remains in progress**. This is a complete route-declaration index and a two-route development smoke, not proof that every page passed a visual check or that the user accepted it.

The machine-readable index contains **428 active route declarations**, **1462 shell URL registrations**, and **1393 unique resolved preview URLs**. One retired route is excluded and retained in the index metadata.

## URL registrations by shell

| Shell | URL registrations |
| --- | ---: |
| phone | 353 |
| tablet | 348 |
| web | 411 |
| responsive | 350 |

## Route declarations by domain

| Domain | Declarations | URL registrations | With page records | With scenario references |
| --- | ---: | ---: | ---: | ---: |
| admin | 4 | 16 | 4 | 4 |
| analytics | 1 | 4 | 1 | 0 |
| arena | 27 | 108 | 27 | 0 |
| auth | 18 | 30 | 18 | 13 |
| dca | 23 | 89 | 23 | 0 |
| discovery | 3 | 12 | 3 | 0 |
| earn | 13 | 46 | 13 | 1 |
| launchpad | 24 | 96 | 24 | 0 |
| market | 25 | 97 | 25 | 2 |
| p2p | 75 | 294 | 75 | 23 |
| platform | 3 | 9 | 3 | 0 |
| predictions | 19 | 70 | 19 | 11 |
| profile | 27 | 60 | 27 | 0 |
| referral | 6 | 24 | 6 | 0 |
| responsive | 2 | 2 | 2 | 0 |
| shell-guard-or-development-route | 10 | 18 | 0 | 0 |
| support | 8 | 23 | 8 | 0 |
| trading | 116 | 374 | 116 | 0 |
| wallet | 26 | 95 | 26 | 1 |

## What the index records

Each route row includes its stable ROUTE ID, source declaration, component/page target, page IDs and checklist state, task/domain ownership, development-only classification, every resolved preview URL grouped by shell, historical route-template/runtime context, direct and operation-intersection scenario references, mapped operation IDs/names, route-level persona/fixture mapping, mock reset procedure, and user/backend status. A persona mapping documents a local test entry point; it does not prove authorization or acceptance. C05.03 still carries page-specific visual and interaction review.

The current A06 matrix defines **106 scenarios** across 15 domains, but it reports **0 fresh browser rows** after source-hash validation. All **425/428** current concrete URL sets match the historical A07 preview URL sets, while **229/428** active declarations come from four source files whose hashes have since changed. A07 is therefore useful as a historical URL/fixture reference, not current runtime-route proof.

## Run and inspect

1. Start a clean local mock preview using [UI-RUNBOOK.md](UI-RUNBOOK.md), mục 1.
2. Select the route by ROUTE ID in the [full index](evidence/C05/ui-acceptance-index-2026-09-29.json), open one URL under the matching shell, then follow a linked route scenario only when its source evidence is current.
3. Reset between mock scenarios using mục 4 in [UI-RUNBOOK.md](UI-RUNBOOK.md). The reset clears the in-app query cache and reloads in-memory fixtures; it does not clear browser-wide storage.
4. Record screenshots, expected-versus-actual behavior, route ID, scenario ID and reviewer response in TRACKING.json. Keep user acceptance pending until the user supplies that review.

C05.02 clean-context smoke, Chromium Chromium 153.0.8010.12, http://127.0.0.1:5189: [Market screenshot](evidence/C05/c05-02-dev-market-2026-09-30.png), [login screenshot](evidence/C05/c05-02-dev-login-2026-09-30.png), [raw report](evidence/C05/c05-02-dev-preview-browser-check-2026-09-30.json), [reproduction runner](evidence/C05/run-c05-02-dev-preview-check.mjs). It rendered 2/2 route documents at HTTP 200, showed the mock banner on both, and observed 3 API responses, all from the registered mock Service Worker. Failed API requests: 0; uncaught page errors: 0; unexpected console errors: 0. Two guest-session 401 responses account for two expected Chromium console messages; no API request crossed origins.

## Measured gaps

- Route-level persona mappings assigned: **16/428**; remaining: **412**.
- Route declarations with direct scenario references: **11/428**; references are not fresh browser verification.
- Operation-intersection scenario candidates: **338** across 44 additional route declarations; candidates need route-owner review.
- Fresh A06 scenario browser rows: **0/106**.
- Historical A07 current-preview URL parity: **425/428**; declarations in changed A07 source files: **229/428** across 6 files (src/app/routeConfig.ts, src/app/routes.ts, src/features/earn/routes.ts, src/features/market/routes.ts, src/features/p2p/routes.ts, src/features/support/routes.ts).
- User-accepted pages: **0/128** applicable baseline pages; the route ledger separately has 331 page records. Backend operations verified: **0/154**.

C05.01 index generation and C05.02 two-route clean-preview smoke are complete. C05.03 owns page-specific interaction checklists and broader route review. Do not translate route presence, fixture rendering, stale browser evidence, this two-route smoke, or the 27 production-shell E2E tests into user acceptance.
