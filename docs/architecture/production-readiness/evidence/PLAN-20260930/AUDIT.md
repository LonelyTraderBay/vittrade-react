# Đo kiến trúc và mức sẵn sàng production — VitTrade React

Ngày đo: **30/09/2026**, múi giờ UTC+7. Revision: **c5fc38b0755da3fe2c9831fe3040160a308a9a03**, nhánh **main**. Báo cáo này là snapshot đo và đầu vào lập kế hoạch; PLAN/TRACKING hiện có tiếp tục là nguồn công việc và tiến độ. Không sửa code, contract, cấu hình cá nhân, PLAN hoặc TRACKING.

**Kết luận: chưa đủ bằng chứng để công nhận toàn bộ frontend đạt Production-Ready Enterprise-Grade.** Cấu trúc feature và các gate chất lượng tại máy có bằng chứng đạt rõ ràng. Phần nghiệm thu vận hành, hợp đồng backend, UI toàn phạm vi và môi trường đích chưa đủ. Các gate tái lập artifact/evidence còn thất bại trên checkout Windows vì LF/CRLF, cùng tám sidecar có source hash cũ thực sự. Không dùng một điểm tổng hợp hoặc tỷ lệ cảm tính để thay các điều kiện này.

## 1. Căn cứ và cách đo

- Tiêu chí lấy từ [AGENTS.md](../../../../../AGENTS.md), [Production Claim Gate](C:/Users/Joker-PC/Documents/Projects/vittrade-react/AI_RULES.md:219), [kiến trúc](C:/Users/Joker-PC/Documents/Projects/vittrade-react/ARCHITECTURE.md:93), [điều kiện contract/staging](C:/Users/Joker-PC/Documents/Projects/vittrade-react/contracts/README.md:33), [milestones và lệnh kiểm chứng](C:/Users/Joker-PC/Documents/Projects/vittrade-react/docs/architecture/production-readiness/PLAN.md:1203).
- Đọc source/config/test; dựng lại inventory bằng logic generator trong bản sao chỉ đọc ở bộ nhớ; AST TypeScript đếm file/cấu trúc; dependency-cruiser xuất graph; Vitest V8/Istanbul tổng hợp coverage theo mẫu số thực; chạy Playwright, build và các script của manifest.
- Môi trường: **Windows x64, Node v24.19.0, npm 11.17.0**. Target repo/CI là **Node 22 + Ubuntu**. Lần này không chạy target đó, không cài dependency lại, dùng node_modules hiện có.
- Worktree sạch trước và sau audit; HEAD không đổi. Dữ liệu build/coverage/E2E nằm trong các đường dẫn ignored. Bằng chứng audit nằm ngoài repository tại thư mục chứa báo cáo này.
- [Kết quả gate dạng JSON](audit-result.json), [số đo dạng JSON](measurements.json), [phân tích EOL/graph/bundle](supplement.json), [dependency graph](dependencies.json) và các runner trong cùng thư mục cho phép kiểm lại phương pháp và dữ liệu.

## 2. Quy mô và cấu trúc thực tế

| Đại lượng | Kết quả | Mẫu số/phạm vi |
| --- | ---: | --- |
| Feature/domain | 15 | Thư mục src/features; 15/15 có index.ts |
| File TS/TSX trong src | 823 | Gồm code, dev, test và declarations |
| File không khớp tên test | 543 | Gồm cả dev fixtures và test helpers; không gọi tất cả là production code |
| File test trong src | 280 | Test .test/.spec và __tests__; không gồm ba suite mjs của tooling |
| Số dòng file không khớp tên test | 125.157 | Có dòng trống, comment, JSX, type; không phải executable LOC |
| Feature code | 310 file / 60.067 dòng | Không gồm feature tests |
| Feature tests | 185 file / 29007 dòng | File count không thay coverage |
| App composition | 66 file / 9.254 dòng | Không gồm 54 file test |
| Shared | 82 file / 10.761 dòng | Không gồm 24 file test |
| Dev | 76 file / 44.071 dòng | Không gồm 11 file test; bị cách ly khỏi production artifact bằng gate |
| File trang trong inventory | 129 | 125 integration-pending, 2 demo, 2 route-less not-implemented |
| Route declarations | 427 | Không phải 427 màn hình độc lập hoặc 427 URL duy nhất |
| Component/service/mock source trong inventory | 149 / 32 / 28 | Theo định nghĩa generator |
| Legacy data modules | 0 | Theo inventory |
| Direct runtime access ở page | 0/129 | Không gọi fetch/WebSocket/storage trực tiếp theo detector inventory |
| Page có mock marker | 2/129 | Hai trang auth tham chiếu fixture-mode; gate giữ development-only |
| Public API giữa feature | 10 import edges | Cả 10 đi qua index.ts, gồm 3 type-only; không có deep import cross-feature |
| Feature module lớn nhất | 596 dòng | dca-analytics-service.ts; gate hiện hành giới hạn 600 |
| Explicit any / ts-ignore / ts-expect-error | 0 / 0 / 0 | AST/source không phải test; không chứng minh toàn bộ type system an toàn |

Graph hiện có **858 module, 4.619 dependency, 22 quy tắc, 0 error, 0 warning, 0 circular edge**. Trên các file không phải test, quan hệ liên tầng đo được: app→features **73**, app→shared **71**, features→shared **1.098**; app→dev **3** ở composition. Không có features→app, shared→features/app hoặc features/shared→dev trong graph này. Có **1** edge mà graph không resolve được: triple-slash type directive vite/client ở src/vite-env.d.ts; typecheck/build vẫn đạt. Không diễn giải đây là import runtime hỏng.

Kiến trúc quan sát được có chiều app→features→shared, feature API/query/page tách trách nhiệm, session tập trung tại [AuthContext](../../../../../src/shared/session/AuthContext.tsx), guard tại [ProtectedRoute](C:/Users/Joker-PC/Documents/Projects/vittrade-react/src/app/components/layout/ProtectedRoute.tsx:20), cấu hình tập trung tại [env](C:/Users/Joker-PC/Documents/Projects/vittrade-react/src/shared/config/env.ts:73) và HTTP/query client chung. HTTP có deadline mặc định 15 giây, retry tối đa hai lần ở mỗi HTTP request; query layer có thể thử lại riêng, nên không coi tổng request của một user action luôn chỉ ba. Mutation retry tại QueryClient là 0. Đây là bằng chứng cấu trúc/frontend, chưa chứng minh tính nguyên tử, quyền hoặc exactly-once của server.

Inventory mới dựng và JSON được lưu **khớp nội dung 100%**; byte chỉ khác LF/CRLF. [Inventory dựng lại ngoài repo](generated-inventory.json) không được ghi đè vào nguồn.

## 3. Số liệu từng feature

File code/test và dòng code lấy từ thư mục feature. Cột trang lấy theo owner của inventory nên có thể bao gồm adapter/alias nằm ngoài thư mục feature. Cột operation lấy OpenAPI. Coverage tổng hợp theo số statement/line/branch thực, không lấy trung bình phần trăm các file.

| Feature | File code | File test | Dòng code | File trang theo owner | API operation | Mutation | Line coverage | Branch coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| admin | 9 | 2 | 463 | 4 | 5 | 1 | 79.66% | 100% |
| arena | 7 | 4 | 997 | 2 | 4 | 1 | 81.35% | 60.34% |
| auth | 27 | 17 | 5086 | 13 | 14 | 13 | 89.86% | 87.43% |
| dca | 36 | 19 | 9612 | 5 | 5 | 3 | 96.1% | 83.73% |
| discovery | 6 | 3 | 611 | 1 | 2 | 0 | 96.42% | 95% |
| earn | 12 | 6 | 1833 | 5 | 4 | 2 | 90.68% | 86.45% |
| launchpad | 6 | 2 | 542 | 1 | 2 | 0 | 95.74% | 75.55% |
| market | 34 | 29 | 8788 | 21 | 22 | 6 | 93% | 89.26% |
| p2p | 61 | 31 | 13029 | 28 | 42 | 25 | 91.2% | 82.7% |
| predictions | 8 | 4 | 1505 | 2 | 8 | 1 | 91.56% | 81.76% |
| profile | 11 | 9 | 951 | 6 | 7 | 3 | 97.74% | 88.88% |
| referral | 6 | 3 | 295 | 1 | 1 | 0 | 86.66% | 100% |
| support | 9 | 4 | 724 | 4 | 6 | 2 | 82.52% | 66.66% |
| trading | 55 | 34 | 9520 | 18 | 13 | 5 | 92.52% | 90.43% |
| wallet | 23 | 18 | 6111 | 16 | 19 | 9 | 91.27% | 84.96% |

**Không có trang nào trong 15 domain được production-certified.** Có code và test hoạt động không đồng nghĩa các task U01–U15 đã nghiệm thu đủ checklist P01–P08. Các cột số lượng cũng không thể đổi trực tiếp thành số ngày công.

## 4. Kiểm thử và coverage vừa chạy

**Vitest: 283/283 suite, 2.393/2.393 test pass. Chromium E2E: 51/51 case pass, 6 file, 1 browser project.** E2E dùng staging-mode build ở loopback và intercepted API tại e2e.invalid. Không có backend thật được kiểm qua bộ này. Lần chạy coverage hoàn tất trong 33,34 giây theo Vitest; E2E khoảng 1,1 phút gồm chuẩn bị/build. Đây là thời gian chạy test ở máy này, không phải tốc độ/độ trễ sản phẩm.

| Coverage | Đã chạy / tổng | Kết quả | Ngưỡng hiện hành |
| --- | ---: | ---: | ---: |
| Lines | 10.213/11.114 | 91,89% | 90% |
| Statements | 10.868/12.060 | 90,11% | 90% |
| Functions | 3.406/3.909 | 87,13% | 85% |
| Branches | 8.426/9.930 | 84,85% | 80% |

Coverage report có **435 file**. Mẫu số là app/features/shared theo [vitest.config.ts](C:/Users/Joker-PC/Documents/Projects/vittrade-react/vitest.config.ts:23), loại test/dev/routes/route composition theo cấu hình đã có; đây không phải 91,89% của toàn bộ 125.157 dòng source. Statement gate chỉ cao hơn ngưỡng **0,11 điểm phần trăm**. Có **33 file với executable line coverage bằng 0**; một phần là barrel/adapter/wrapper. Có **72 file** thỏa line<80% hoặc branch<60% theo bộ lọc chẩn đoán; bộ lọc này không phải ngưỡng nghiệm thu mới. Danh sách và mẫu số từng file ở JSON.

Các miền cần review theo hành vi/rủi ro: Admin line **79,66%**, Arena branch **60,34%**, Support branch **66,66%**, Launchpad branch **75,55%**. Ngưỡng repo đang cưỡng chế toàn cục, không có gate riêng 90/80 cho từng feature. Không được tự kết luận các domain này vi phạm ngưỡng per-feature chưa tồn tại, hoặc bỏ file ít coverage để tăng tỷ lệ.

Output Vitest có cảnh báo React act(...); pass suite không chứng minh test harness không có cảnh báo. Lần coverage đầu dùng PATH thiếu Git gây sáu lỗi spawnSync git ENOENT ở tooling certification tests; sau bổ sung đường dẫn Git **chỉ trong process audit**, chạy lại toàn bộ đạt 2.393/2.393. Không sửa test để vượt lỗi. Log trước được giữ riêng.

Hồ sơ C03.04 cũ ghi **3 mutation đại diện được test phát hiện** và hoàn trả source. Audit này không thực hiện mutation mới và không coi ba case là mutation coverage toàn dự án.

## 5. Gate cuối cùng và tính tái lập

**21 phép kiểm**, **17 exit 0**, **4 exit 1**. Đây là số lần kiểm tra có phạm vi khác nhau, không phải điểm production hoặc phần trăm an toàn.

| Lệnh/script | Trạng thái cuối / exit | Bằng chứng |
| --- | --- | --- |
| npm.cmd run typecheck | ĐẠT (0) | [Log](typecheck.txt) |
| npm.cmd run lint:check | ĐẠT (0) | [Log](lint-check.txt) |
| npm.cmd run format:check | CHƯA ĐẠT (1) | [Log](format-check.txt) |
| npm.cmd run architecture:check | ĐẠT (0) | [Log](architecture-check.txt) |
| npm.cmd run architecture:inventory:check | CHƯA ĐẠT (1) | [Log](architecture-inventory-check.txt) |
| npm.cmd run page-size:check | ĐẠT (0) | [Log](page-size-check.txt) |
| npm.cmd run contracts:check | ĐẠT (0) | [Log](contracts-check.txt) |
| npm.cmd run security:check | ĐẠT (0) | [Log](security-check.txt) |
| npm.cmd run env:check | ĐẠT (0) | [Log](env-check.txt) |
| npm.cmd run production-mock-imports:check | ĐẠT (0) | [Log](production-mock-imports-check.txt) |
| npm.cmd run production-routes:check | ĐẠT (0) | [Log](production-routes-check.txt) |
| npm.cmd run licenses:check | ĐẠT (0) | [Log](licenses-check.txt) |
| npm.cmd run test:coverage -- --reporter=dot | ĐẠT (0) | [Log](test-coverage.txt) |
| npm.cmd run build | ĐẠT (0) | [Log](build.txt) |
| npm.cmd run production-mocks:check | ĐẠT (0) | [Log](production-mocks-check.txt) |
| npm.cmd run bundle:check | ĐẠT (0) | [Log](bundle-check.txt) |
| node node_modules/@playwright/test/cli.js test | ĐẠT (0) | [Log](e2e.txt) |
| npm.cmd audit --json | ĐẠT (0) | [Log](npm-audit.json) |
| node docs/architecture/production-readiness/check-tracking.mjs | ĐẠT (0) | [Log](tracking-check.json) |
| node docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs --check | CHƯA ĐẠT (1) | [Log](matrix-check.txt) |
| node docs/architecture/production-readiness/evidence/C05/generate-ui-acceptance-index.mjs --check | CHƯA ĐẠT (1) | [Log](ui-index-check.txt) |

lint:check thực sự chạy ESLint toàn repo, báo **0 error, 0 warning**. Không chạy lại lint riêng vì sẽ trùng phép kiểm. test:coverage đã chạy toàn suite nên không chạy test:run riêng.

Dependency audit hiện trả **0 advisory** ở mọi severity, metadata tổng **628 dependency**. License gate review **552 package** theo phạm vi riêng của script; hai mẫu số khác nhau. Security boundary check scan **543 file**; đây là kiểm policy storage credential, không phải pentest hoặc kiểm server authorization.

**Bốn gate fail cần giải thích riêng:**

1. **Format check: 382 file.** Đã dùng Prettier so nội dung sau chuẩn hóa LF: **382/382 chỉ khác xuống dòng**, không có format khác. [Prettier config](C:/Users/Joker-PC/Documents/Projects/vittrade-react/.prettierrc:8) yêu cầu LF, checkout đang core.autocrlf=true và repo không có .gitattributes để cưỡng chế LF. Chưa sửa cấu hình người dùng.
2. **Inventory check:** generator so byte [current !== serialized](C:/Users/Joker-PC/Documents/Projects/vittrade-react/scripts/generate-architecture-inventory.mjs:1438); byte fail, nhưng JSON dựng lại khớp và LF comparison khớp. Không phải drift số lượng/ownership trong lần đo này.
3. **Scenario matrix check:** **35/35** raw sidecar hash fail trên checkout. **35/35** khớp SHA manifest khi dùng byte Git HEAD hoặc chuẩn hóa LF. Generator [hash raw và source freshness](C:/Users/Joker-PC/Documents/Projects/vittrade-react/docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs:283) đang nhạy xuống dòng. Sau loại trừ EOL, **27/35** sidecar có toàn bộ recorded source hash khớp; **8/35** vẫn không khớp src/dev/mocks/handlers.ts: p2p.duplicate, p2p.pending, predictions.empty/error/loading/pending/success/unauthorized. Tám case cần chạy lại với source mới trước closeout.
4. **UI acceptance index check:** generator báo stale. Artifact phụ thuộc byte/hash của route, fixture và scenario matrix; chưa regenerate hoặc gán nhãn fresh. Các số trong index được giữ làm snapshot lịch sử, không nâng lên runtime proof hiện tại.

Hướng xử lý cần ghi tại task nguồn: chốt byte source/evidence dùng để hash, giữ LF qua Git hoặc có quy tắc canonicalization được kiểm thử; sau đó chạy lại gate trên clean checkout Windows và Node22/Ubuntu. Không chỉ thay hash manifest để làm tám case cũ thành đã chạy lại.

## 6. Bundle và giới hạn đo hiệu năng

Production build và mock artifact gate đều đạt; output có **223 file**, **221 JS chunk**, không chứa MSW worker theo gate. Có hai cảnh báo annotation của dependency Zod trong build; build exit 0.

| Phép đo artifact | Byte thực | Ý nghĩa |
| --- | ---: | --- |
| Tổng toàn bộ 221 JS chunk | 2.613.214 raw / 823.237 gzip | Toàn artifact, không phải một page tải tất cả |
| Chunk raw lớn nhất | 358.127 raw | Entry index |
| Chunk gzip lớn nhất | 99.959 gzip | Entry index, level 9 |
| Static entry + import closure | 725.319 raw / 220.148 gzip | Ba chunk: index, vendor-react, vendor-motion; chưa gồm CSS/dynamic route |
| Budget mỗi chunk | 500.000 raw / 256.000 gzip | 221/221 đạt; không cưỡng chế total initial-load budget |

Gzip do Node gzip level 9 tính từ file, không phải byte tải qua CDN/HTTP thực tế. Bundle pass không chứng minh LCP, INP, CLS, API latency hoặc hiệu năng thiết bị thật. Các số browser/MSW trong evidence C02 trước đây là development/loopback, không có CPU/network throttling và không phải production field metrics.

Audit này **chưa có số production p75 LCP/INP/CLS**, sample size RUM, error rate, throughput, long-running stability hoặc SLO đã được owner duyệt. Không ghi các số đó bằng 0. Ngưỡng Google khuyến nghị là LCP≤2,5 giây, INP≤200ms, CLS≤0,1 ở p75; đó là tiêu chí tham chiếu, chưa là kết quả đo của dự án. [Google Web Vitals](https://web.dev/articles/vitals).

## 7. Khoảng trống nghiệm thu/enterprise hiện quan sát được

| Tiêu chí | Số liệu/bằng chứng | Kết luận |
| --- | --- | --- |
| Architecture boundaries | 22 rule, 0 violation, 0 cycle, 15/15 public APIs | Đạt gate local |
| Type/lint/test/build | Hai TS project, lint 0/0, 2.393 test, 51 E2E, build pass | Đạt phạm vi Windows/Node24/mock |
| Contract/frontend mapping | 15 OpenAPI, 154 operation, matrix lưu 154/154 handler mapping | Mapping không chứng minh mọi response branch hoặc backend |
| Contract acceptance | 154/154 operation approval=unreviewed; 0/154 backend owner được gán | Chưa xác minh backend contract acceptance |
| Mutation declaration | 71 mutation; 54/54 generic business mutation có required Idempotency-Key; 4 challenge exception | Declaration frontend đạt; server dedup chưa xác minh |
| Draft permissions | 23 operation P2P có draft_frontend | Chưa chứng minh role/permission backend đã duyệt |
| Auth error contract | refreshSession chỉ khai báo 200, preview Trading unauthorized từng nhận refresh 401 | Khoảng trống contract quan sát từ evidence cũ, chưa có backend quyết định |
| Scenario evidence | Matrix lưu 27/106 fresh, chỉ 16/106 full, 32/154 unique operation | Snapshot lịch sử; current matrix check fail; normalized source diagnostic 27/35 sidecar khớp |
| Route/page evidence | 427 declarations; index lưu 1.458 registration / 1.389 URL sample; 41/427 có scenario reference, 0/427 persona mapping | URL sample/alias không phải đã browser test toàn bộ |
| UI technical ledger | 0/330 page record ui=done | Trạng thái sổ, không kết luận tất cả màn hình không hoạt động |
| UI user acceptance | 0/128 baseline scope page | Chưa có nghiệm thu người dùng |
| Backend/staging | 0/154 operation backend=done; certified manifest rỗng | Chưa có bằng chứng production certification |
| Telemetry | [noopSink là mặc định](C:/Users/Joker-PC/Documents/Projects/vittrade-react/src/shared/telemetry/telemetry.ts:16); 0 call configureTelemetry ngoài test trong AST source | Chưa có production telemetry sink được nối ở checkout này |
| Browser/accessibility | Một Chromium project; một axe analysis ở public /auth/login, chỉ assert serious/critical | Chưa bao phủ mọi page/state/device hoặc WCAG đầy đủ |
| CI đúng revision/toolchain | Workflow có Node22/Ubuntu; gh run list không chạy được vì gh chưa đăng nhập | Chưa xác minh run, branch protection hoặc required checks |
| Real hosting/realtime/recovery | B02/B03/B04/B05/B08/B09 đều todo trong tracker | Chưa xác minh live config, alerts, rollback, RUM/SLO |

Một scan axe trên login không đủ xác nhận toàn website đáp ứng accessibility; W3C yêu cầu đánh giá có phạm vi và phán đoán của con người. [W3C WAI](https://www.w3.org/WAI/test-evaluate/).

Telemetry interface, error boundary và release context đã tồn tại. Tuy nhiên chỉ có các test gọi configureTelemetry; source thực mặc định noop. Không gọi đây là hệ thống monitoring/alert đã vận hành. Các team handle trong CODEOWNERS là metadata trong repo; audit không xác minh team tồn tại hoặc branch protection có hiệu lực.

## 8. Số liệu dùng cho kế hoạch tiếp theo

Sổ hiện có **38 task: 10 done, 2 in_progress, 26 todo**; **205 step: 54 done, 1 in_progress, 150 todo**. M1–M4 đều todo. Đây là tiến độ theo record hiện hành và chưa phản ánh mọi phép đo mới ở báo cáo; không đổi thành phần trăm effort hoặc thời gian còn lại. Active step là **A06.03**, next row **trading.pending**. Giữ PLAN/TRACKING làm nguồn duy nhất, không tự tạo backlog thay thế.

Các khoảng trống nên đưa vào kế hoạch theo task đã có, với điều kiện hoàn tất rõ:

| Ưu tiên cho kế hoạch | Phạm vi/source owner | Đầu vào thực tế | Cách nghiệm thu cần có |
| --- | --- | --- | --- |
| P0 — chặn nghiệm thu production nghiệp vụ | B01/B05/B06; U01/U03/U04/U05/U06/U13 | 154 operation chưa review/owner; 23 P2P permission draft; Wallet unknown/duplicate và Auth refresh 401 chưa chốt | Backend contract được duyệt, owner/version rõ; HTTPS staging thử auth/permission/receipt/idempotency/reconciliation ở revision/artifact phát hành |
| P1 — tính tái lập bằng chứng | A06/C05/B07 | 382 EOL-only format fail, inventory byte fail, 35 sidecar byte mismatch, 8 source-stale sidecar | Quy tắc EOL/hash rõ; clean checkout Windows + Node22/Ubuntu chạy gate; tám scenario chạy lại, matrix/index --check đạt |
| P1 — UI và state toàn phạm vi | A06.03/A06.04/C05.03/U01–U15/C01 | 0/128 user accepted; 0 persona mapping; 16/106 scenario full trong snapshot | Checklist page/route/state đúng phạm vi, viewport/keyboard/focus; trace/screenshot nguồn mới; user acceptance thực |
| P1 — quan sát và phục hồi | B02/B03/B04/B08/B09 | Telemetry sink chưa nối; thiếu môi trường/SLO/rollback proof | Provider/hosting/owner được chốt; sự cố thử nghiệm thấy event/correlation và alert; staging rollback tương thích API; đo RUM/SLO theo cửa sổ/sample đã thống nhất |
| P2 — củng cố độ sâu kiểm thử | C03 và owner feature | Statement margin 0,11 điểm; Arena/Support branch thấp; 33 file 0 line coverage | Review reachable behavior/invariant, tăng test ở nhánh có rủi ro thực; không thêm test chỉ để tăng số hoặc loại source khỏi mẫu số |

Ưu tiên ở bảng là đề xuất đầu vào kế hoạch, không tự chuyển status hoặc quyết định phát hành. Làm bước phụ thuộc theo PLAN; phần tái lập/checker và UI mock có thể tiếp tục trong phạm vi frontend, còn contract/live integration cần owner và môi trường tương ứng. Chưa có dữ liệu về người thực hiện, effort từng step, backend lead time hoặc SLO, nên không có căn cứ đưa số ngày triển khai hay ngày release.

**Trạng thái được hỗ trợ bởi số liệu: frontend theo feature boundaries đã qua các gate kiến trúc và test local; toàn phạm vi Production-Ready Enterprise-Grade chưa đủ điều kiện nghiệm thu.** Dùng bảng domain, log, JSON và các mẫu số trên làm baseline cho kế hoạch chi tiết; không dùng số test hoặc mức coverage tổng làm giấy chứng nhận production.
