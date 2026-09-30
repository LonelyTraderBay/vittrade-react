A04 — request cancellation, deadline, and retry completion record

Scope and observed defect
F02 was reproduced with an already-aborted caller signal: GET and POST both called fetch and resolved. Those red tests are retained as pre-aborted-get-post-red.log. No real transaction was created.

Changes
- src/shared/api/http-client.ts: reject pre-aborted requests before fetch; propagate cancellation while fetch or either HTTP/network retry backoff is pending; map cancellation to REQUEST_ABORTED; apply one total timeout budget across attempts and backoff; validate retry count in the inclusive range 0–2 before network access; preserve request correlation/idempotency headers across retries; leave ambiguous POST transport failures at one attempt and NETWORK_ERROR.
- src/shared/api/http-client.test.ts: cover pre-abort, in-flight abort, both backoff paths, timeout budget, retry cap and invalid values, stable headers, ambiguous POST, 204, and cancel while a 401 handler is pending.
- src/features/wallet/api/wallet-api.test.ts: prove schema validation after HTTP success is not retried by the transport client.
- src/features/market/model/market-queries.test.tsx: integrate the real pair query hook and market API adapter with the shared HTTP client; unmounting the last query observer aborts the pending fetch signal and starts no second request. No existing browser route-switch cancellation test was located, so the test covers the query teardown boundary that route removal exercises.

Measured verification
- HTTP/API/query suite: 5 files, 116/116 tests passed (19 HTTP client, 16 wallet API, 23 wallet query, 13 market query, 45 P2P query).
- The query teardown integration made exactly 1 fetch; observer unmount changed its AbortSignal to aborted.
- Both TypeScript projects passed; targeted ESLint and Prettier passed; git diff --check passed. Git emitted only the known LF-to-CRLF working-copy notices.
- Retry callsite audit: 55/55 current literal retry overrides are GET; no Retry-After contract was found in the OpenAPI source. A rejected schema after HTTP 200 remains outside transport retries.

Boundary
These are deterministic frontend tests and source-contract checks. No real backend, staging endpoint, browser E2E navigation, transaction, or user acceptance was exercised. Backend certification remains 0 operations; route/page certification remains unchanged.
