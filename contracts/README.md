# VitTrade API contracts

Các API production phải bắt đầu từ OpenAPI contract trong thư mục này. Feature không được gọi endpoint ngoài adapter của chính feature; UI chỉ dùng query và mutation hooks.

## Trạng thái contract frontend

| Domain | Contract | Bằng chứng adapter/query frontend |
| --- | --- | --- |
| Auth/session | `auth.yaml` | Auth API, discriminated login/MFA challenge, memory-only session boundary, phone/web OTP flows |
| Market data | `market.yaml` | Market/pair/order-book/watchlist queries, stream boundary và write-permission checks |
| Trading/order | `trading.yaml` | Order placement/cancel/modify, receipt lifecycle, copy-trading core flows và analytics queries |
| Wallet/balance | `wallet.yaml` | Wallet assets/history, deposit/withdrawal MFA, transfer, address book và dust conversion |
| P2P/escrow/KYC | `p2p.yaml` | Marketplace/ad/order, escrow challenge-release, disputes/chat, payment methods và security settings |
| DCA | `dca.yaml` | Snapshot và plan mutations; create/update/delete retries preserve idempotency keys |
| Earn/staking | `earn.yaml` | Core portfolio, subscription/redemption và paginated transaction history |
| Launchpad | `launchpad.yaml` | Core project reads và API-backed routes; unbacked demo routes remain development-only |
| Arena | `arena.yaml` | Mode/challenge reads và idempotent join; unbacked secondary demos remain development-only |
| Predictions | `predictions.yaml` | Event/read adapter, idempotent order receipt lifecycle và risk calculation boundary |
| Referral | `referral.yaml` | Overview read adapter/query; unbacked secondary routes remain development-only |
| Admin/analytics | `admin.yaml` | Zod-validated adapters, query hooks và admin feature-flag mutations; local MSW is development-only |

These rows describe frontend code and local contract tests only. They do not mean
the backend is deployed or verified. Secondary routes without typed contracts
remain behind development-only or integration-pending boundaries.

## Backend production evidence

| Evidence | Current status |
| --- | --- |
| Backend staging deployment per domain | Not verified |
| Real-backend HTTPS staging E2E | Not available in this repository run |
| Frontend contract E2E with intercepted API responses | Local coverage exists for auth, DCA/Earn, P2P, Trading and Wallet |
| Production page certification manifest | Empty until contract, adapter, authorization, integration-test and staging evidence are recorded |

## Contract gate

Write operations should declare `x-required-permissions` in the OpenAPI operation and mirror
that boundary in the feature UI. Backend authorization remains the final enforcement point.

The inventory at `docs/architecture/page-inventory.json` remains the source of
truth for every page's owner and route status. A contract-backed core slice may
exist within a domain while that domain's other pages remain demos or
integration-pending; none are production-certified without real staging evidence.

Chạy `npm run contracts:check` để parse toàn bộ OpenAPI YAML và kiểm tra:

- OpenAPI 3.x, `info`, `paths` và `securitySchemes` hợp lệ.
- Mỗi operation có `operationId`, response và security declaration rõ ràng.
- Business mutation ngoài auth/challenge bắt buộc có `Idempotency-Key`.

Gate này chỉ xác nhận tính nhất quán của contract frontend; không thay thế backend
staging verification, authorization test, audit event hoặc E2E transaction thật.

Một domain chỉ được chuyển sang production khi contract, adapter, authorization, error mapping, audit requirement, integration test và staging E2E cùng đạt.
