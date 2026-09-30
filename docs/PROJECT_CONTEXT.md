# Hồ sơ dự án VitTrade React

Hồ sơ khảo sát trong phạm vi checkout hiện tại, dùng bộ Universal **3.1**.
Đây là điểm tra cứu nguồn và điều kiện làm việc; kiến trúc, quy trình, công việc
và tiến độ tiếp tục thuộc các nguồn trong [WORKFLOW.md](ai/WORKFLOW.md#1-nguồn-hướng-dẫn-và-thứ-tự-đọc).

## 1. Phạm vi, căn cứ và quyền

- **ĐÃ QUAN SÁT:** frontend đang phát triển; mã ứng dụng, test, contract frontend,
  cấu hình build và CI đều có trong checkout. Artifact dự kiến là ứng dụng trình
  duyệt được Vite đóng gói vào `dist`; không có backend thật được xác minh ở đây.
- Snapshot khảo sát ngày **30/09/2026**, HEAD
  `41869d7d6080d1508353120bd15d482dd3d4bb91`, nhánh
  `codex/vittrade-architecture-completion`. Trước phiên có **710** file staged,
  **0** file unstaged và **0** untracked. HEAD không đại diện riêng cho toàn bộ
  mã đang khảo sát: phải xét cả thay đổi staged.
- **ĐÃ ĐƯỢC GIAO:** người dùng yêu cầu thực hiện `PROJECT_BOOTSTRAP_PROMPT.txt`
  cùng `AI_RULES.md` 3.1, chỉ khảo sát và tạo/cập nhật tài liệu. Phiên này chịu
  trách nhiệm phần tài liệu đó; không suy ra phê duyệt thiết kế, UI hoặc phát hành.
- Nguồn đọc: [manifest](../package.json), [lockfile](../package-lock.json),
  [ARCHITECTURE.md](../ARCHITECTURE.md), [Guidelines.md](../guidelines/Guidelines.md),
  [contracts](../contracts/README.md), [PLAN](architecture/production-readiness/PLAN.md),
  checkpoint/session trong [TRACKING](architecture/production-readiness/TRACKING.json),
  [CI](../.github/workflows/ci.yml) và các source/config/test dẫn chiếu bên dưới.
- **CHƯA XÁC ĐỊNH:** backend owner/version/endpoint được chấp thuận, môi trường
  HTTPS staging, người nghiệm thu UI và quyền phát hành. Không khảo sát repo khác,
  dịch vụ thật hoặc thông tin tài khoản để tự điền những phần này.

Bằng chứng và hash nhận diện snapshot nằm tại
[bootstrap-3.1-2026-09-30.json](architecture/production-readiness/evidence/bootstrap-3.1-2026-09-30.json);
session bổ sung thuộc A01.05 trong TRACKING. Các con số ở hồ sơ này là snapshot,
không thay trạng thái của sổ và không cần đổi timestamp khi chạy lại cùng đầu vào.

## 2. Thành phần, topology và dữ liệu

| Thành phần                      | Maturity, nguồn và trách nhiệm                                                                                                              | Ranh giới/tác động                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend trình duyệt            | ĐANG PHÁT TRIỂN; [main.tsx](../src/main.tsx), [App.tsx](../src/app/App.tsx), `src/app`, `src/features`, `src/shared`                        | `app → features → shared`; shell phone `/`, tablet `/t`, web `/w`, URL legacy `/r` được giữ tương thích theo kiến trúc.                             |
| 15 feature/domain               | ĐANG PHÁT TRIỂN; admin, arena, auth, dca, discovery, earn, launchpad, market, p2p, predictions, profile, referral, support, trading, wallet | Owner và public API theo ARCHITECTURE; không đồng nghĩa mọi màn hình đã hoàn thiện hay được nghiệm thu.                                             |
| Contract và API consumer        | ĐANG PHÁT TRIỂN; [OpenAPI](../contracts/openapi), feature `api/model`, [HTTP client](../src/shared/api/http-client.ts)                      | UI → hook → feature adapter → HTTP client; server phải thực thi quyền và giao dịch. Metadata `draft_frontend` không chứng minh server đã chấp nhận. |
| Preview và mock                 | ĐANG PHÁT TRIỂN; `src/dev/mocks`, [UI-RUNBOOK](architecture/production-readiness/UI-RUNBOOK.md)                                             | MSW development/test, fixture và persona mô phỏng; không có bằng chứng tiền, ledger, escrow hoặc blockchain thật.                                   |
| Kiểm thử và công cụ repo        | ĐANG PHÁT TRIỂN; [Vitest config](../vitest.config.ts), [Playwright config](../playwright.config.ts), `scripts`, CI                          | Unit/integration dùng jsdom/MSW; E2E có Chromium và staging-mode build tại loopback. Staging-mode không tự là HTTPS staging với backend thật.       |
| Backend/provider ngoài checkout | CHƯA XÁC ĐỊNH; ranh giới mô tả trong contract                                                                                               | Không tự chọn server, DB, queue, chain hoặc cloud; cần hợp đồng và bằng chứng của owner khi tích hợp.                                               |

[env.ts](../src/shared/config/env.ts) sở hữu cấu hình runtime: development mặc định
`mock`, build không phải development mặc định `api`; staging/production từ chối
`mock`, production yêu cầu API `https:` và stream `wss:`. Bootstrap thực tế chỉ
import MSW khi development + mock; development + api nghỉ worker cũ trước render.
Không tự ghi `.env.local` hoặc chạy server trong lần khảo sát này.

Dữ liệu nhạy rủi ro gồm session, quyền, số dư, lệnh, withdrawal, escrow và receipt.
Token/session frontend theo [AuthContext](../src/shared/session/AuthContext.tsx)
và [auth spec](architecture/auth-login-mfa-spec.md); HTTP client gửi
`credentials: include`. Cookie policy, authorization, tính nguyên tử và chống
trùng của server chưa được kiểm chứng. Guideline phân biệt Arena points-only với
Prediction/value và wallet; không hợp nhất các ledger theo cách trình bày UI.

## 3. Toolchain và quy ước có bằng chứng

| Nguồn                              | Giá trị quan sát                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json` và lockfile v3      | App `0.0.1`, npm lockfile; React/React DOM 18.3.1, React Router 7.18.4, Vite 6.4.3, Tailwind/Vite plugin 4.1.12.                                       |
| Lockfile và module resolve tại máy | TypeScript 5.9.3, TanStack Query 5.103.2, Vitest 4.1.11, MSW 2.15.0, Prettier 3.9.8. Range trong manifest không thay phiên bản đã khóa.                |
| [.nvmrc](../.nvmrc), CI            | Node **22**; CI dùng `ubuntu-latest`, cài từ `npm ci`, kích hoạt cho PR hoặc push `main`. Chưa kiểm chứng run/branch protection trên dịch vụ GitHub.   |
| Shell của lần bootstrap            | Windows PowerShell, Node **24.19.0**, npm **11.17.0**, Git **2.45.1.windows.1**, Codex CLI **0.159.0**. Module cần cho kiểm tra tài liệu resolve được. |

Node của phiên khác Node target. Các kiểm tra tài liệu ở môi trường này không
thay bộ gate trên Node 22/CI; không tự đổi runtime, cài dependency hoặc sửa cấu hình.

Các ví dụ cần đọc khi phát triển: adapter/query/pages/test gần feature; auth
login/MFA theo spec hiện có; [P2P queries](../src/features/p2p/model/p2p-queries.ts)
và [tests](../src/features/p2p/model/p2p-queries.test.tsx) cho permission/idempotency;
[Prediction pages](../src/features/predictions/pages/PredictionContractPages.tsx)
và [tests](../src/features/predictions/pages/PredictionContractPages.test.tsx) cho
query/mutation/receipt. Đây là ví dụ source được dẫn chiếu để định vị, không phải lời
khẳng định test vừa chạy hoặc hợp đồng backend đã được duyệt.

## 4. Bất biến, giả định và khoảng trống

- Quyền sở hữu/import theo ARCHITECTURE; UI không gọi endpoint ngoài feature
  adapter và không tự fallback dữ liệu fixture khi API lỗi.
- Mutation nghiệp vụ áp dụng permission và `Idempotency-Key` theo contract;
  auth/challenge có ngoại lệ operation-specific tại contracts/README. Mất phản hồi
  không đủ để báo thất bại hay gửi lại một giao dịch mới.
- [query-client.ts](../src/shared/api/query-client.ts) cấu hình mutation retry 0;
  HTTP retry và hủy request do client chung quản lý. Không tự diễn giải retry
  frontend thành bảo đảm exactly-once của backend.
- Chứng nhận page/route production cần bộ evidence theo contracts và
  [certification manifest](architecture/production-page-certifications.json);
  manifest quan sát được có **0** page certified.
- Mục đích/tải/SLA/retention và yêu cầu pháp lý ngoài những gì repo đã mô tả còn
  **CHƯA XÁC ĐỊNH**; bootstrap không tự đặt ngưỡng hoặc nhận tuân thủ tiêu chuẩn.

Các blocker có nguồn trong checkpoint/decision/evidence của TRACKING: hợp đồng
Wallet unknown/duplicate chưa có theo quyết định người dùng; Auth `refreshSession`
thiếu HTTP 401 đã quan sát trong preview; một số authorization scenario chưa có
response tương ứng trong contract; tám sidecar P2P/Predictions đã stale; widget Web
che banner preview ở C05.03. Đọc record hiện tại trước khi xử lý, không coi danh
sách snapshot này là backlog riêng. Các mô hình auth/order/receipt đã có tại
spec/kiến trúc/kiểu TypeScript được tái sử dụng; không tạo mô hình runtime mới.

## 5. Danh mục kiểm tra và Verification Ladder

Cwd của các hàng là **root repo**. Lệnh lấy từ manifest/config/script đã đọc;
Windows dùng `npm.cmd`. Kết quả lần bootstrap được lưu trong evidence đã dẫn ở
mục 1; toàn bộ gate milestone vẫn thuộc [PLAN mục 11](architecture/production-readiness/PLAN.md#11-lệnh-kiểm-tra-và-công-thức-tiến-độ).

| ID         | Mức, lệnh/cách kiểm                                                                       | Điều kiện, tác động và thời điểm                                                                                                                     | Trạng thái trong lần bootstrap                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BOOT-V0    | V0; Git HEAD/branch/status, staged/unstaged diff, SHA-256 của nguồn và hai Universal      | Đọc; mỗi lần tiếp quản hoặc đổi đầu vào; phải bảo toàn index và phần ngoài phạm vi.                                                                  | ĐẠT cho snapshot/phạm vi đã ghi.                                                                                                          |
| DOC-LINK   | V0/V1; Node kiểm đường dẫn và anchor Markdown trong 5 tài liệu tạo/sửa                    | Đọc file, không mạng/build/cache; sau sửa tài liệu; không suy link còn tồn tại là đúng nghiệp vụ.                                                    | ĐẠT: 982 liên kết nội bộ và 10 anchor, không xác minh runtime của nội dung đích.                                                          |
| DOC-FORMAT | V1; Prettier API `check` cho hồ sơ/evidence mới; rà định dạng đoạn Markdown bổ sung       | Dùng dependency hiện có, chỉ đọc khi check; không format lại tài liệu cũ toàn repo.                                                                  | ĐẠT cho hồ sơ/evidence mới; layout TRACKING được giữ, không format lại tài liệu cũ.                                                       |
| LEDGER     | V0/V1; `node docs/architecture/production-readiness/check-tracking.mjs`                   | Đọc sổ, source, Git và YAML; sau đổi hồ sơ/danh mục; errorCount phải 0.                                                                              | ĐẠT sau bổ sung entry Universal/lệnh mở đầu và hồ sơ; errorCount=0. Baseline thiếu 3 entry được giữ trong evidence.                       |
| INVENTORY  | V0/V1; `npm.cmd run architecture:inventory:check`                                         | Đọc, không sinh file; khi cần dùng inventory như hiện trạng. Generator so nội dung byte với output hiện có.                                          | CHƯA ĐẠT ở baseline: output báo stale; chưa regenerate hoặc xác định nguyên nhân. Số 129 page/427 route từ inventory lưu sẵn là snapshot. |
| FE-STATIC  | V1/V2; `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run architecture:check`      | Cần dependency và Node target; typecheck có thể ghi build-info theo tsconfig, xác minh trước chạy trong docs-only; sau sửa source/boundary.          | CHƯA XÁC MINH lần này.                                                                                                                    |
| FE-TEST    | V1/V2; `npm.cmd run test:run`, `npm.cmd run test:coverage -- --reporter=dot`              | Vitest có cache, coverage ghi `coverage`; sau thay logic/bất biến; ngưỡng hiện có ở vitest.config, không hạ để xanh.                                 | CHƯA XÁC MINH lần này; lịch sử trong TRACKING không tự là kết quả hiện tại.                                                               |
| CONTRACT   | V2; `npm.cmd run contracts:check`                                                         | Parse OpenAPI, kiểm quyền/idempotency metadata; khi sửa API boundary; không gọi backend và không chứng minh server enforcement.                      | CHƯA XÁC MINH lần này; chỉ đọc contract liên quan.                                                                                        |
| ARTIFACT   | V3; `npm.cmd run build`, `npm.cmd run production-mocks:check`, `npm.cmd run bundle:check` | Build ghi `dist`/đầu ra typecheck; artifact checks phụ thuộc đúng build. Không chạy trên output dùng chung khi chưa cô lập.                          | CHƯA XÁC MINH lần này; không thay output hiện có.                                                                                         |
| BROWSER    | V2/V3; `npm.cmd run test:e2e`                                                             | Playwright khởi chạy build staging/preview, dùng port 4173 và ghi report/trace; chạy tuần tự với build, cần Chromium.                                | CHƯA XÁC MINH lần này; mocked E2E không chứng minh M4.                                                                                    |
| RELEASE    | V3/V4; M4/B01–B10 và bộ gate trong PLAN                                                   | Cần backend/version/owner, HTTPS staging, bằng chứng quyền/giao dịch/CI/vận hành đúng revision và quyền phát hành; chưa có một lệnh đơn lẻ thay thế. | CHƯA XÁC MINH, không phải KHÔNG ÁP DỤNG vì backend chưa có.                                                                               |

`format:check` trong package chỉ kiểm source/E2E, `.prettierignore` bỏ Markdown;
không dùng kết quả đó thay DOC-FORMAT. `audit:high` gọi registry; install/audit,
build/E2E và các thao tác có dữ liệu/dịch vụ ngoài không được chạy chỉ để hoàn
thành hồ sơ. Không phân loại thiếu điều kiện hoặc lỗi môi trường là lỗi sản phẩm.

## 6. Change Budget, Complexity và Production Claim Gate

- **Change Budget của yêu cầu đã giao:** hồ sơ này, bổ sung tham chiếu ở AGENTS,
  README, WORKFLOW, PLAN; ghi nhận file/session/evidence trong TRACKING và một
  artifact evidence. Giữ bộ Universal, code, test thực thi, contract runtime,
  dependency/lockfile, CI/config và đầu ra sinh tự động. Không stage/commit/push
  hoặc triển khai; 710 file staged trước phiên thuộc công việc có sẵn.
- **Complexity/Abstraction Gate:** KHÔNG ÁP DỤNG cho cơ chế runtime mới vì lần này
  chỉ tạo một hồ sơ dẫn nguồn tại nơi còn thiếu. Giữ tracker/spec/generator hiện
  có; không tạo framework, dịch vụ khóa, schema hay backlog thứ hai. Phương án
  nhỏ hơn là chỉ dẫn workflow, nhưng chưa lưu được snapshot/toolchain/hash và
  danh mục kiểm tra có điều kiện ở một nơi để tiếp quản.
- **Production Claim Gate:** hồ sơ/tài liệu được kiểm trong phạm vi DOC-LINK,
  DOC-FORMAT, LEDGER và bảo toàn nguồn; điều đó không nghiệm thu code. Sản phẩm
  frontend/M4 **CHƯA XÁC MINH**, chưa đủ bằng chứng tuyên bố Production-Ready hoặc
  Enterprise-Grade. Checkpoint vẫn báo user acceptance **0/128**, backend/staging
  **0/154**; các số này mô tả mẫu số của sổ, khác số source page files trong inventory.

Đề xuất cho nhiệm vụ tiếp theo chỉ là xử lý drift của inventory, chạy gate phù
hợp trên Node target và tiếp tục checkpoint khi được giao phát triển. Đây là
**ĐỀ XUẤT CHƯA DUYỆT** về phạm vi công việc tiếp theo, không phải quyền mở rộng
bootstrap hoặc ghi nhận sản phẩm đã đạt.

## 7. Phối hợp, đầu ra sinh và bàn giao

Phiên hiện tại ghi tuần tự phần tài liệu theo yêu cầu người dùng. Đầu mối
backend/reviewer/integrator ngoài phiên **CHƯA XÁC ĐỊNH**; không tự giao việc hay
nhận đã có review độc lập. Chưa có phân công/cơ chế tích hợp được xác nhận thì
chưa đủ điều kiện ghi song song phần dùng chung. So hash trước ghi giúp phát
hiện thay đổi, không phải khóa và không chứng minh không có tác vụ khác.

Phần cần điều phối gồm hướng dẫn chung, TRACKING, OpenAPI, generator/output,
manifest/lockfile, CI và dữ liệu preview/port/dist/cache. Worktree riêng không
tự cô lập DB/tài khoản/worker/port. Review chuẩn mới tại nguồn sở hữu nội dung,
ghi quyết định đúng thẩm quyền; sau tích hợp kiểm diff và bản kết hợp với target,
không tự merge/phát hành từ hồ sơ này.

| Nguồn → generator                                                                                                                                                         | Toàn bộ đầu ra của generator liên quan                                                                                                                                                            | Quy tắc                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Source page/route/import và certification → [generate-architecture-inventory.mjs](../scripts/generate-architecture-inventory.mjs), bản ở snapshot                         | [page-inventory.json](architecture/page-inventory.json)                                                                                                                                           | Không sửa tay; lần này chỉ `--check`, fail giữ nguyên.                          |
| Contract/handler/trace manifest/hash source → [generate-scenario-matrix.mjs](architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs), bản ở snapshot | [scenario-matrix-2026-09-28.json](architecture/production-readiness/evidence/A06/scenario-matrix-2026-09-28.json)                                                                                 | Không làm mới bằng chứng browser bằng cách chỉ regenerate metadata.             |
| Route ledger và scenario matrix → [generate-ui-acceptance-index.mjs](architecture/production-readiness/evidence/C05/generate-ui-acceptance-index.mjs), bản ở snapshot     | [ui-acceptance-index-2026-09-29.json](architecture/production-readiness/evidence/C05/ui-acceptance-index-2026-09-29.json), [UI-ACCEPTANCE.md](architecture/production-readiness/UI-ACCEPTANCE.md) | JSON và Markdown cần nhất quán; không sửa tay hoặc tự nhận người dùng accepted. |

Hash generator trong artifact evidence nhận diện phiên bản khảo sát; không
regenerate/autofix ngoài quyền. Lần sau đọc `checkpoint` và session bổ sung mới
nhất: application nextAction vẫn là A06.03 `trading.pending`. Chỉ tiếp tục khi
yêu cầu hiện hành cho phép triển khai. Các blocker nghiệp vụ cần owner quyết
định; không bịa HTTP status/replay/correlation để đóng bước.

## 8. Tiếp nhận hướng dẫn ở phiên sau

Cặp đã tiếp nhận tại root (hai header đều 3.1, ngày phát hành 2026-09-29):

| File                                                            | SHA-256 trước/sau áp dụng                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| [AI_RULES.md](../AI_RULES.md)                                   | `1662406d9ac9e63646130516ad6811934b2bd7f0a6b7d240403749200777f9e3` |
| [PROJECT_BOOTSTRAP_PROMPT.txt](../PROJECT_BOOTSTRAP_PROMPT.txt) | `b1d692184f9b4bac87f6b55b25e1c49bab90af5d5eb1706a428a09d85212b686` |

Hash chỉ nhận diện nội dung, không chứng nhận chất lượng hoặc mọi repo đã đồng
bộ. Không tải/nâng bộ quy tắc hoặc đưa dữ kiện riêng vào hai file khi áp dụng.
File `Đọc và thực hiện PROJECT_BOOTSTRAP.txt` chỉ là lời mở đầu trỏ tới đúng cặp.

Trong phiên Codex hiện tại, AGENTS root đã được cung cấp trong ngữ cảnh và đọc
lại từ checkout; không tìm thấy AGENTS.override/nested AGENTS trong repo. Theo
[tài liệu chính thức về AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
Codex nạp chuỗi hướng dẫn lúc bắt đầu phiên, ưu tiên override ở cùng thư mục và
hướng dẫn gần cwd. Link trong AGENTS không tự khiến nội dung file đích được nạp:
agent phải đọc AI_RULES/hồ sơ/workflow theo hướng dẫn. Tài liệu online được kiểm
ngày khảo sát; chưa đối chiếu mã nội bộ của CLI 0.159.0 hoặc mở phiên độc lập để
xác minh thay đổi mới tự nạp, không nhận đã kiểm chứng mọi cấu hình cá nhân.

Phiên mới bắt đầu ở root, kiểm nguồn hướng dẫn đang có hiệu lực và yêu cầu AI
nêu file/version đã đọc trước khi sửa. Nếu thiếu hoặc bị override, đọc rõ
`AGENTS.md` → phần cốt lõi/lộ trình của `AI_RULES.md` → hồ sơ này → workflow →
checkpoint/task/source liên quan; báo xung đột thay vì sửa cấu hình toàn máy.
Công cụ khác không được giả định tự nạp AGENTS hoặc toàn bộ bộ Universal.
