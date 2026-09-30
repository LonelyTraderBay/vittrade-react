# Frontend performance measurement profile

Status: **C02.01–C02.03 complete; no performance budget has been set.** The next step is C02.04 in [PLAN.md](PLAN.md). This profile measures local frontend behavior with development fixtures; it does not measure backend latency or production RUM.

## Journeys and fixture sizes

Use the web shell and the same route, persona and fixture shape for each repeated run. C02.02 records the exact requests and response row counts seen on each route.

| Journey | Route | Preview persona | Current fixture dimensions |
| --- | --- | --- | --- |
| Login form | `/w/auth/login` | Public, unauthenticated | 10 selectable preview personas are available in development; login submission is outside this route-render measurement. |
| Markets overview | `/w/markets/overview` | `market` | 21 market movers, 8 sectors, 8 fear/greed history points and one 14-field global-stats object. |
| Trading terminal | `/w/trade/btcusdt` | `developer` | Route ID `btcusdt` is source-backed by `WebSidebar.tsx` and fixture IDs; 10 available pairs; default candles are 24 points. `/w/trade/btc-usdt` returned 404 from the local fixture and is not used. |
| Wallet overview | `/w/wallet` | `wallet` | 13 assets, 3 wallet accounts and 6 transaction fixtures. |
| P2P order room/detail | `/w/p2p/order/p2p001` | `developer` | One target order (`p2p001`) and 5 chat messages; the shared mock order collection contains 7 rows if the journey requests the collection. |
| DCA savings | `/w/earn/savings/dca` | `dca` | 3 plans, 21–22 generated purchases and 91 portfolio-history points. |

Source fixture counts describe available mock data, not necessarily route responses. The observed route payload counts below are authoritative for this measurement. The preview PRNG resets to seed `0x51f15e`; its clock uses wall time unless explicitly fixed. DCA purchase history varied between 21 and 22 rows across the repeated trials.

## Observed local profile

- Revision: `41869d7d6080d1508353120bd15d482dd3d4bb91`; the working tree contains existing uncommitted changes. The evidence sidecar records hashes for the routes, fixtures and handlers used by this profile.
- Runtime: the existing `http://127.0.0.1:4173` endpoint returned HTTP 200 and served `/@vite/client`, confirming a Vite development server. Vite reports `dataSource: mock`; requests are handled by local MSW fixtures.
- Browser: Playwright-managed Chromium `153.0.8010.12`, viewport `1440×900`, device scale factor 1, `navigator.hardwareConcurrency=24`.
- Host: Windows 11 Pro, Intel Core Ultra 7 270K Plus, 24 logical CPUs.
- Network: no CPU/network throttling was configured in the profile probe; the app origin is loopback. MSW request duration is recorded separately and must never be described as backend latency.

## C02.02 measured route baseline

Measured on **2026-09-29 13:07 UTC**, Chromium 153.0.8010.12, the existing Vite development server, mock data/MSW, 1440×900, DPR 1, loopback and no throttling. Each route has 5 cold and 5 warm trials. Cold authenticated trials use a fresh browser context, perform local mock sign-in before the timer, then measure the first SPA route navigation; warm trials repeat the route in the same authenticated context after the first successful render. Login measures document navigation to the unauthenticated form. Route timers stop when the route-specific UI marker appears; the login timer stops when the submit button is visible. No business mutations were sent.

| Journey | Cold render median (range), ms | Warm render median (range), ms | Cold requests (API) | Warm requests (API) | Cold JS encoded bytes / Resource Timing transfer bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Login form | 220.525 (216.292–2,626.311) | 159.102 (155.156–174.734) | 166–178 (1) | 178 (1) | 9,379,181 / 9,241,339; warm 9,379,181 / 41,400 |
| Markets | 56.000 (49.500–61.300) | 14.100 (8.700–19.500) | 3 (1) | 0 (0) | 99,432 / 0; warm 0 / 0 |
| Trading terminal | 126.300 (122.200–136.400) | 9.100 (8.400–13.700) | 38–40 (6) | 0 (0) | 1,489,113 / 0; warm 0 / 0 |
| Wallet | 29.100 (27.400–38.000) | 6.700 (6.500–7.100) | 2 (2) | 0 (0) | 0 / 0; warm 0 / 0 |
| P2P order detail | 46.600 (37.500–60.600) | 5.000 (4.600–5.300) | 6 (1) | 0 (0) | 172,246 / 0; warm 0 / 0 |
| DCA savings | 41.300 (38.600–53.100) | 12.200 (6.700–20.100) | 11 (1) | 0 (0) | 172,484 / 0; warm 0 / 0 |

`JS encoded bytes` is the sum of response-body sizes exposed by Resource Timing; `transfer bytes` is the browser's reported transfer size. The authenticated route transfer totals are 0 even where encoded bytes are nonzero, so treat encoded size as a payload-size observation and do not claim actual wire transfer for those route chunks. Warm authenticated navigations issued zero route requests and rendered from already-held app/query state. Login reloads still produced 178 browser requests; the browser reported lower transfer size from its warm cache.

Actual cold route responses (all from the same-origin MSW service worker) were:

- Markets: `GET /api/market/overview` returned 200; the payload contained 8 fear/greed history rows, 8 sectors, and 5 top-gainer plus 5 top-loser rows.
- Terminal: six GET responses returned 200. Pair detail contained 8 sparkline points; market-pair list 2 rows; candles 24 rows; wallet assets 2 rows; open orders and order history each 0 rows.
- Wallet: `GET /api/wallet/assets` returned 2 rows and `GET /api/wallet/transactions` returned 6 rows, both 200. This is the actual response for this persona, not the 13 assets available in broader fixtures.
- P2P: `GET /api/p2p/orders/p2p001` returned 200 with one detail object; there were no business writes.
- DCA: `GET /api/dca/snapshot` returned 200 with 3 plans, 91 portfolio-history rows and 21–22 purchase-history rows per trial.
- Login form: the only API call was the expected mock-session bootstrap `GET /api/auth/session` → 401 for an unauthenticated visitor.

Across all 60 measured trials, the route-specific stable marker appeared in every trial, with 0 page errors, 0 failed requests, 0 external API origins and 0 non-GET requests. The cold login range includes one 2,626.311 ms trial; it is retained in the raw data and no cause is inferred. MSW operation durations observed by browser Resource Timing ranged from 2.7 to 18.5 ms; they describe local service-worker/fixture behavior only. UI acceptance, backend, staging, production RUM and real network latency were not tested.

The raw 60-trial ledger, per-request paths/statuses/timings/response row counts, resource lists, summary and source hashes are in [C02.02 evidence](evidence/C02/c02-02-performance-runs-2026-09-29.json); the reproducible runner is [run-c02-02-performance.mjs](evidence/C02/run-c02-02-performance.mjs). The runner reads `C02_PREVIEW_PASSWORD` for local preview sign-in and never writes it to the report. Do not use these development figures to set production budgets; C02.04 must also consider production build measurements and an agreed SLO.

## C02.03 interaction, route lifecycle and memory profile

Observed **2026-09-29 13:43 UTC** against the existing Vite development preview at `http://127.0.0.1:4173`, local MSW fixtures, Chromium `153.0.8010.12`, Windows 11 Pro, Intel Core Ultra 7 270K Plus/24 logical CPUs, viewport `1440×900`, DPR 1 and no throttling. The authenticated `developer` fixture was used. Eight cycles exercised pair-sheet open, category change (`DeFi` 2 rows → 0; `Layer 1` → 2), ETH search, ETH selection, reopen, BTC search and BTC selection: **64 interaction samples**. A separate one-cycle CDP trace/profile was captured; 10 SPA cycles mounted/unmounted `/w/trade/btcusdt` through `/w/markets/overview` and back. After the profile pass, the app returned to BTC, requested GC and took one more memory snapshot.

The timing is a repeatable **action-to-ready-marker plus two animation frames** measure. Pair-open includes waiting for the sheet motion to settle; pair selection waits for the new terminal marker and the closing sheet. These timings are not React commit duration. Chromium Event Timing observed 33 interactions with p75 **64 ms**, p95 **88 ms**, maximum **88 ms** (duration threshold 16 ms).

| Interaction | Samples | Median / p95, ms | Observed result |
| --- | ---: | ---: | --- |
| Open pair switcher | 16 | 432.6 / 457.1 | Includes BottomSheet motion; no API response during the action. |
| Category `DeFi` | 8 | 182.3 / 225.7 | The actual market-pairs response exposed only two rows; both were filtered out. |
| Category `Layer 1` | 8 | 108.5 / 124.4 | Restored the two fixture rows. |
| Search `ETH` | 8 | 52.0 / 55.5 | One matching pair row. |
| Search `BTC` | 8 | 52.0 / 56.4 | One matching pair row. |
| Select `ETH/USDT` | 8 | 888.4 / 901.2 | Waits for the new route marker and sheet close; one cold selection fetched pair/candle GETs, HTTP 200 from MSW. |
| Select `BTC/USDT` | 8 | 941.4 / 959.3 | Waits for the new route marker and sheet close; stale queries refetched on some cycles, all observed interaction responses were HTTP 200 from MSW. |

The raw interaction ledger captures every sample and API response in [C02.03 report](evidence/C02/c02-03-interaction-profile-2026-09-29.json). Across the run there were **32 API requests**, **0 failed requests**, **0 page errors** and **0 external API origins**; the only non-GET was the local preview login. A separate trace contains **3,943** sanitized Chrome timeline events and a **1,425-sample** V8 CPU profile at [trace artifact](evidence/C02/c02-03-interaction-profile-trace-2026-09-29.json). In that profile, the largest complete JavaScript call observed lasted **6.604 ms**; `Layout` maximum was **0.367 ms**, `UpdateLayoutTree` maximum **0.815 ms**, and `Paint` maximum **0.447 ms**. These observations did not identify a long JavaScript task or a measured function worth optimizing; the ~0.9-second pair-ready timings include route readiness and sheet close, and their remaining time is not attributed to a specific cause.

After requested GC, the initial BTC terminal used **21,406,808 bytes** of V8 heap, **462 DOM nodes** and **387 JS event listeners**. After 10 route mount/unmount cycles, counters were stable at **462 nodes / 388 listeners**; heap rose to **25,117,588 bytes**. After the final SPA reset to BTC, the snapshot was **25,560,988 bytes**, **463 nodes** and **388 listeners**: **+4,154,180 bytes (+3.962 MiB)** versus the initial snapshot. This is a rising post-GC heap trend worth rechecking after query-cache cleanup and a longer soak; it does not by itself prove a memory leak. The DOM/listener counts did not grow across the 10 route cycles.

No market-data stream was active on this route. Browser observation found one same-origin WebSocket at `ws://127.0.0.1:4173/` (Vite HMR); source search found `connectMarketStream` called from the development legacy `MarketDataWSProvider`, with no consumer in the active Trading feature route. Stream render cost and stream listener cleanup are therefore **not applicable to this route’s current runtime** and remain to be measured if a product feature consumes the adapter.

Evidence: [measurement report](evidence/C02/c02-03-interaction-profile-2026-09-29.json), [sanitized timeline and CPU profile](evidence/C02/c02-03-interaction-profile-trace-2026-09-29.json), [reproducible runner](evidence/C02/run-c02-03-interaction-profile.mjs). The runner reads the public local preview fixture password from `C02_PREVIEW_PASSWORD`; credentials are not written into artifacts. The final reset is an SPA navigation because this preview’s local auth state did not remain stable across a full-document reload. These measurements are local development evidence only; they do not establish production build performance, backend latency, user-perceived INP, RUM, or a performance budget.

## C02.04 production artifact and route-graph profile

Observed **2026-09-29 14:00 UTC** from a Windows 11 Pro production build using Node.js `v24.19.0`. The build used the current working tree at HEAD `41869d7d6080d1508353120bd15d482dd3d4bb91`; the worktree was already dirty. A 835-file source snapshot fingerprint and manifest/HTML hashes are recorded in the raw report. The build output went to an isolated temporary directory; the existing repository `dist/` directory was not overwritten.

The Vite manifest contains **221 emitted JavaScript chunks**. Their combined size is **2,613,121 raw bytes**, **823,187 bytes gzip level 9**, and **710,306 bytes Brotli quality 11**. The single emitted CSS asset is **81,155 / 15,789 / 13,287 bytes** in the same order. The static shell graph (entry JavaScript, its static dependencies and global CSS) is **806,474 raw / 235,932 gzip / 202,930 Brotli bytes**.

| Journey | Route | Static graph raw bytes | gzip-9 bytes | Brotli-q11 bytes | Route-only gzip-9 bytes beyond shell |
| --- | --- | ---: | ---: | ---: | ---: |
| Login form | `/w/auth/login` | 821,919 | 242,477 | 208,594 | 6,545 |
| Markets overview | `/w/markets/overview` | 851,042 | 249,970 | 215,404 | 14,038 |
| Trading terminal | `/w/trade/btcusdt` | 1,117,610 | 334,235 | 288,396 | 98,303 |
| Wallet overview | `/w/wallet` | 836,161 | 247,199 | 212,948 | 11,267 |
| P2P order detail | `/w/p2p/order/p2p001` | 845,842 | 248,832 | 214,261 | 12,900 |
| DCA savings | `/w/earn/savings/dca` | 842,002 | 250,109 | 215,393 | 14,177 |

Each route graph follows the production manifest entry for that route and sums its transitive **static** JavaScript/CSS imports; shared shell assets count once. The final column is the additional route graph after subtracting shared shell files. These are per-file compressor estimates for a static graph, not browser Resource Timing or actual bytes transferred over a deployed server. They exclude HTML, response headers, server compression configuration, cache behavior, runtime-loaded assets, parsing/execution time and network/device effects. Brotli is a local quality-11 estimate, not evidence that the deployment serves Brotli.

The current checker in `scripts/check-bundle-budget.mjs` has an exclusive per-JavaScript-chunk threshold of **500,000 raw bytes and 256,000 gzip-9 bytes (250 KiB)**. It passed **221/221 chunks** on this isolated build. The largest chunk was `index-DxWEF0EH.js` at **358,127 raw / 99,954 gzip / 83,476 Brotli bytes**; `vendor-recharts-BY9R9OMA.js` followed at **341,233 / 87,943 / 71,683 bytes**. The emitted artifact also contains `mockServiceWorker.js` (**9,666 raw / 3,226 gzip bytes**); this profile did not test worker registration or change the separate production-mock checks.

**Budget disposition:** retain the existing per-chunk gate as an **unapproved engineering proposal**, not an agreed production SLO. No new aggregate route cap or optimization is justified by this build alone; the current per-chunk gate passes and the C02.03 trace did not identify a code bottleneck. The six route graphs above are a baseline, not accepted route targets. A product-approved target device/network profile and LCP/INP/CLS expectations are still needed before promoting these figures to a production performance SLO. Real-user measurement remains assigned to B08.

Evidence: [production build report](evidence/C02/c02-04-production-build-profile-2026-09-29.json) and [reusable manifest profiler](evidence/C02/profile-c02-04-production-build.mjs). Rebuild into a new isolated output directory with `node scripts/build.mjs --outDir <isolated-temp-dir> --manifest`; then pass that output to the profiler with `--dist <isolated-temp-dir> --out <report.json>`. To run the existing hard-coded budget checker against the isolated output, run it from the temporary directory’s parent so its `dist/assets` path resolves there. These checks establish local build/artifact evidence only; they do not establish deployed delivery, production RUM, backend behavior, or user acceptance.

## C02.05 profile revalidation and no-change decision

Re-ran the C02.04 manifest profiler against its isolated artifact on **2026-09-29 14:15:52 UTC** and compared the full captured output. The current 835-file source/config fingerprint is identical (`901c3ed30f35619599fbad2e8511fea8c780032bb6b2d3db84c3ef96e1dbf1d8`); manifest and HTML SHA-256, all **221/221 JavaScript asset hashes/sizes**, CSS and `mockServiceWorker.js` hashes/sizes, aggregate JS sizes and all **6/6 route static graphs** also match exactly. The existing bundle checker again passed **221/221** chunks.

No measured application source or production build configuration changed since C02.04, the existing chunk gate remains unexceeded and C02.03 found no code bottleneck. Therefore the conditional before/after optimization run was **not applicable**; no optimization was made or claimed. Route coverage remains the six journeys in the C02.04 table, and real-user measurement remains assigned to B08. The production SLO approval is still missing, so the existing chunk budget remains an unapproved proposal.

Evidence: [C02.05 profile comparison](evidence/C02/c02-05-profile-revalidation-2026-09-29.json). This revalidation used the same isolated build because source/build fingerprints were unchanged; it did not claim a new build, deployed transfer measurement, production RUM, backend/staging verification or user acceptance.
