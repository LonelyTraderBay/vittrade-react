# Hybrid Guidelines V2 — Current App Ecosystem

**Scope:** Current app UI system
**Modules:** Core Trading + Wallet + P2P + Prediction Markets + Open Arena + Safe Bridges
**Use case:** Figma Make + Design QA + Dev Handoff
**Status:** Current-app specific, supersedes generic V1 where conflicts arise

---

## 0) Product context

Đây là guideline **riêng cho app hiện tại**, không phải cho một app broker generic.

### 0.1 Current product surfaces

App hiện có các nhóm chính:

- **Core app**
  - Home
  - Markets
  - Trade
  - Wallet
  - Profile

- **Prediction Markets**
  - market/event based
  - probability / order / portfolio / reward / leaderboard / activity

- **Open Arena**
  - creator-driven
  - points-only
  - modes / rooms / trust / moderation / resolution / points ledger

- **P2P**
  - marketplace → offer detail → create order → order room → release / dispute

- **Standalone / utility**
  - Notifications
  - Support
  - News
  - Earn / Referral / Launchpad
  - Settings / Security / KYC / Activity

### 0.2 Current information architecture

**MUST**
Bottom navigation của app hiện tại giữ nguyên **5 tabs**:

- **Home**
- **Markets**
- **Trade**
- **Wallet**
- **Profile**

**MUST NOT**

- thêm tab riêng cho Prediction Markets
- thêm tab riêng cho Open Arena
- thêm tab riêng cho P2P nếu chưa đổi IA chính thức

Prediction Markets và Open Arena là **secondary modules inside the ecosystem**, đi vào qua:

- Home
- Markets
- Profile
- detail/context bridges
- Topic Hub / Unified Search

---

## 1) North Star Principles

1. **Trust-first**
   UI phải làm user thấy sản phẩm đáng tin, có kiểm soát, có luật, có disclosure.

2. **Boundary clarity**
   User phải luôn hiểu mình đang ở:
   - trading/value-based surface
   - hay points-only/social surface

3. **Clarity over density**
   Không nhồi thông tin. Ưu tiên scan nhanh, hiểu nhanh, quyết định đúng.

4. **Beginner-first, Pro-available**
   User mới hoàn thành tác vụ không bị lạc; user nâng cao vẫn có đủ context và controls.

5. **Safety-by-design**
   Action có risk hoặc liên quan tiền/escrow/resolution luôn có preview, confirm, state, next step.

6. **No dark patterns**
   Không FOMO, không hype, không che phí, không tạo cảm giác casino.

7. **Connected, not merged**
   Prediction Markets và Open Arena được nối bằng **topic / context / discovery**, không gộp wallet, points, PnL, settlement.

---

## 2) Visual system for current app

### 2.1 Visual identity

**MUST**

- Bám đúng visual language hiện tại trong file Figma / codebase
- Light-first hoặc neutral-first nếu app hiện tại đang dùng sáng
- Accent chính bám theo hệ màu hiện có
- Tránh đổi hẳn sang dark broker style nếu không phải visual chính thức của app

### 2.2 Token discipline

**MUST**

- Dùng semantic tokens hiện có trong app
- Không tự tạo màu mới ngoài hệ
- Không tự tạo radius / spacing / shadows lạ

### 2.3 Grid & spacing

**MUST**

- Dùng **4pt base grid**
- Duy trì **8pt rhythm** cho layout chính
- Ưu tiên spacing: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 52`

### 2.4 Breakpoints

**MUST**

- Base mobile: **390**
- Must support: **360 / 375 / 390 / 414 / 428**
- Tablet: **768 / 834**
- Desktop adaptive: **1280 / 1440**
- Tất cả screens mới dùng Auto Layout + constraints

### 2.5 Safe areas

**MUST**

- Không để bottom nav che nội dung
- Scroll containers có bottom inset
- Sheets/modals tôn trọng safe areas

---

## 3) Typography & numeric display

### 3.1 Fonts

**MUST**

- UI text: font chính hiện có trong app
- Số liệu tài chính / percentages / IDs / timestamps: digits ổn định, ưu tiên tabular nếu có

### 3.2 Hierarchy

**MUST**
Duy trì system rõ ràng:

- Caption / helper
- Body
- Section heading
- Page title
- Large numeric display

### 3.3 Number clarity

**MUST**

- Trading/value surfaces: dùng format số rõ, có thousands separator
- Arena points surfaces: dùng wording và format points riêng, không được giống wallet/value card

---

## 4) Accessibility & ergonomics

### 4.1 Touch targets

**MUST**

- touch target đủ lớn
- spacing giữa targets đủ tránh bấm nhầm

### 4.2 Readability

**MUST**

- contrast đủ rõ
- text nhỏ không bị nhạt quá
- icon quan trọng không được chỉ dựa vào màu

### 4.3 Accessibility baseline

**MUST**

- Chữ thường đạt contrast tối thiểu **4.5:1**; chữ lớn đạt **3:1** theo WCAG 2.2 SC 1.4.3. Thành phần giao diện và đồ họa cần thiết đạt **3:1** theo tiêu chí tương ứng; không áp ngưỡng chữ cho mọi đối tượng.
- Control có tên truy cập, thao tác bàn phím và focus-visible; trạng thái lỗi/liên kết phải được biểu đạt ngoài màu sắc.
- Với web, target mặc định đáp ứng WCAG 2.2 AA SC 2.5.8 (**24×24 CSS px**) hoặc một ngoại lệ được tiêu chí cho phép; **44×44 CSS px** là mục tiêu sản phẩm có thể chọn thêm, không phải ngưỡng AA bắt buộc.
- Overlay modal giữ focus trong dialog, đưa focus vào khi mở, trả focus khi đóng và ngăn tương tác nền theo primitive dùng chung.

### 4.4 States

**MUST**
Mọi control quan trọng phải có:

- default
- pressed
- disabled
- loading
- error
- success

### 4.5 Lists & cards

**MUST**
Cards và rows phải scan được nhanh:

- leading
- primary
- secondary
- trailing
- action hoặc chevron khi cần

---

## 5) Core IA & navigation rules for current app

### 5.1 Core tab behavior

**MUST**

- Giữ 5 tabs hiện có
- Khi vào detail/push views, bottom nav có thể ẩn theo pattern hiện tại
- Mọi detail screen có back button rõ

### 5.2 Module placement

**MUST**

- Prediction Markets nằm dưới **Markets** và **Profile**
- Open Arena nằm dưới **Arena routes + Profile**
- P2P giữ module riêng, không trộn với Prediction/Arena

### 5.3 Current route philosophy

**SHOULD**

- Prediction routes đi theo nhánh `/markets/predictions/*`
- Arena routes đi theo `/arena/*`
- My Arena đi theo `/profile/arena`
- Prediction portfolio đi theo `/profile/predictions`

---

## 6) Module boundaries — the most important rule

### 6.1 Prediction Markets

**Nature:** market/value-based
**Mental model:** user đang xem/trade một thị trường dự đoán có giá, xác suất, receipt, positions

### 6.2 Open Arena

**Nature:** social / creator / points-only
**Mental model:** user đang tạo hoặc tham gia room/challenge dùng Arena Points

### 6.3 Safe bridge principle

**MUST**
Hai module chỉ được nối theo:

- topic
- category
- event context
- creator discovery
- search/discovery
- profile surface

### 6.4 Absolute separation

**MUST NOT**
Không được gộp giữa hai module các thứ sau:

- wallet balance
- PnL
- points conversion
- order receipts
- settlement history
- leaderboard metrics
- financial performance
- payout language

---

## 7) Shared component rules

### 7.1 Buttons

**MUST**

- Mỗi vùng chỉ có 1 CTA chính
- Label phải rõ hành động:
  - `Mua BTC`
  - `Xem room`
  - `Tạo challenge`
  - `Xác nhận rút`

### 7.2 Inputs

**MUST**

- label
- placeholder
- helper text
- error state rõ
- numeric input có formatting nếu phù hợp
- dropdown/searchable dropdown nếu field quá mở

### 7.3 Bottom sheets / modal

**MUST**
Dùng cho:

- confirm
- fee breakdown
- filter
- network selector
- risk explanation
- destructive actions
- release escrow confirm
- order review
- result confirmation

### 7.4 Feedback

**MUST**

- Toast / snackbar
- Inline banners
- Skeleton
- Empty state
- Error state
- Offline state

---

## 8) Core app patterns

### 8.1 Home

**MUST**

- tổng quan đơn giản
- quick actions
- entry points rõ tới:
  - Prediction Markets
  - Open Arena
  - Wallet
  - P2P

- không nhồi quá nhiều CTA cạnh tranh nhau

### 8.2 Markets

**MUST**

- search
- filter
- watchlist
- list rows scan nhanh
- Prediction Markets là module con rõ ràng, không lẫn với coin list

### 8.3 Trade

**MUST**

- Beginner / Pro split rõ
- Beginner = convert / quick buy sell
- Pro = chart + order form + open orders/history shortcut

### 8.4 Wallet

**MUST**

- assets
- available vs locked
- deposit / withdraw / history
- preview trước confirm
- address/network clarity

### 8.5 Profile

**MUST**

- là nơi chứa:
  - security
  - KYC
  - API / activity
  - My Prediction surfaces
  - My Arena surfaces

---

## 9) Prediction Markets — module-specific rules

### 9.1 Product role

Prediction Markets là **market-based module**, không phải social game.

### 9.2 Required screens

**MUST**

- Predictions Home
- Search
- Breaking / movers
- Event Detail
- Portfolio
- Rewards
- Leaderboard
- Global Activity

### 9.3 Event detail priorities

**MUST**
PredictionEventDetail phải ưu tiên:

1. event title + category
2. probability/outcomes
3. chart/orderbook/trade form
4. rules / resolution source
5. related sections
6. comments / top holders / activity

### 9.4 Trade safety

**MUST**
Trước khi submit order phải có:

- selected outcome
- buy/sell
- market/limit
- shares
- estimated cost/proceeds
- fee
- liquidity/slippage note
- confirm action

### 9.5 Prediction hardening

**SHOULD**
Prediction module nên có:

- Trade Review sheet
- Order Receipt page
- Risk Explainer sheet
- Comment report / block actions

### 9.6 Prediction copy rules

**MUST**

- Không hype kiểu “kiếm lời nhanh”
- Không làm probability trông như certainty
- Reward opportunities không được viết như lợi nhuận đảm bảo

### 9.7 Prediction leaderboard

**MUST**

- metric rõ: P/L hoặc Volume
- không gộp với Arena trust/creator metrics

---

## 10) Open Arena — module-specific rules

### 10.1 Product role

Open Arena là **creator-driven, points-only social module**.

### 10.2 Core identity

**MUST**
Arena luôn có disclosure rõ:

- `Arena Points only`
- `Không liên quan wallet`
- `Không phải tài sản tài chính`

### 10.3 Required screens

**MUST**

- Arena Home
- Arena Studio
- Mode Detail
- Challenge Detail
- Join
- Creator Profile
- Leaderboard
- My Arena
- Safety Center
- Resolution Center
- Points Ledger
- Report Cases / Blocked Users

### 10.4 Studio philosophy

**MUST**
Arena Studio không được là form text mở hỗn loạn.
Phải dùng:

- structured builder
- domain packs
- challenge types
- edge rule dropdowns
- rule summary tự sinh
- governance gate

### 10.5 Smart Rule Builder

**MUST**
Step “Luật chơi” nên ưu tiên:

- Domain selector
- Challenge type selector
- Win condition builder
- Tie rule dropdown
- Void rule dropdown
- Result deadline dropdown
- Generated Rule Summary

### 10.6 Custom modes

**MUST**

- Custom mode được phép
- Nhưng custom mode công khai phải qua governance gate mạnh hơn
- Rule mơ hồ → chỉ private/unlisted hoặc blocked publish

### 10.7 Governance surfaces

**MUST**
Arena phải có đủ:

- Rule Clarity Score
- Publish Eligibility
- Safety Snapshot
- Trust Breakdown
- Moderation case lifecycle
- Resolution Center
- Ledger entry details

### 10.8 Arena trust model

**MUST**
Trust không được chỉ là badge trang trí.
User phải bấm vào xem được:

- Fair Play
- Completion Rate
- Dispute Rate
- Report Upheld Rate
- Creator Reliability
- Room Safety Tier

### 10.9 Arena leaderboard

**MUST**
Arena leaderboard ưu tiên:

- Fair Play
- Creator Quality
- Completion
- Community Trust
- Activity
  Không ưu tiên metric tiền bạc.

### 10.10 Arena points

**MUST**
Mọi cộng/trừ điểm đều cần:

- reason code
- linked challenge
- before/after
- status
- time
- reference

### 10.11 Arena moderation

**MUST**

- report
- block
- case detail
- appeal / review state
- safety center
- anti-scam messaging
- community rules

---

## 11) Safe Bridges — connecting Prediction Markets and Open Arena

### 11.1 Core bridge principle

**MUST**
Connect by:

- topic
- context
- discovery
- creator visibility

**MUST NOT**
Connect by:

- wallet/value
- settlement
- PnL
- points conversion
- shared leaderboard

### 11.2 Shared topic taxonomy

**MUST**
Dùng taxonomy chung:

- Crypto
- Macro
- Politics
- Sports
- Tech
- AI
- Culture
- Community

### 11.3 Bridge components

**MUST**
Hệ sinh thái phải có các bridge UI chính:

- `PredictionContextCard`
- `ArenaRelatedRoomCard`
- `DualModuleStatCard`
- `ModuleBoundaryBanner`
- `UnifiedTopicChip`

### 11.4 Profile bridge

**MUST**
Profile hiển thị 2 khối riêng:

- Prediction Portfolio
- Open Arena

Không gộp số.

### 11.5 Home bridge

**MUST**
Home có section discovery kiểu:

- `Prediction Markets`
- `Open Arena`
  đặt cạnh nhau như 2 surface khác nature

### 11.6 Detail bridge

**MUST**
Prediction Event Detail có thể hiển thị:

- `Open Arena trên cùng chủ đề`

Arena Mode/Challenge có thể hiển thị:

- `Bối cảnh thị trường`

Nhưng mọi bridge card đều phải có disclosure.

### 11.7 Arena created from event

**SHOULD**
Cho phép flow:

- Prediction event → Arena Studio preset theo topic/context

Nhưng phải có statement rõ:

- event chỉ là bối cảnh
- room Arena không ảnh hưởng vị thế Prediction

### 11.8 Topic Hub / Unified Search

**SHOULD**
Để discovery mạnh hơn, hệ nên có:

- Unified Search
- Topic Hub
  nhưng kết quả **segmented by module**, không trộn mơ hồ.

---

## 12) Unified Search & Topic Hub rules

### 12.1 Unified Search

**MUST**
Search kết quả phải chia block:

- Prediction Events
- Arena Modes
- Arena Rooms
- Creators

### 12.2 Search cards

**MUST**
Mỗi card search phải có module label/disclosure:

- `Prediction Market`
- `Open Arena`
- `Arena Points only`
- `Market context only`

### 12.3 Topic Hub

**SHOULD**
Topic Hub là nơi 2 module gặp nhau an toàn:

- active prediction events
- live arena rooms
- featured modes
- creators

### 12.4 Discovery-only principle

**MUST**
Unified Search / Topic Hub là discovery surfaces, không phải transaction surfaces.
CTA ở đây nên là:

- `Xem thị trường`
- `Xem room`
- `Xem mode`
- `Xem creator`
- `Tạo room Arena theo chủ đề`

---

## 13) P2P — current app rules

### 13.1 Product role

P2P là flow tài chính có rủi ro cao, phải **an toàn và rất rõ trạng thái**.

### 13.2 Core flow

**MUST**

- Marketplace
- Offer Detail
- Create Order
- Order Room
- Orders list
- Payment Methods
- Add Method
- Dispute

### 13.3 Offer cards

**MUST**
Offer card phải có:

- Buy/Sell
- price
- available
- limit
- payment methods
- merchant rating
- completion rate
- verification badge

### 13.4 Create order

**MUST**
Trước khi vào room phải có:

- amount
- method
- summary
- fee
- payment window
- validation rõ

### 13.5 Order room

**MUST**

- status pill
- countdown timer khi chờ thanh toán
- timeline
- payment info card
- action bar theo status
- release action luôn confirm
- dispute entry rõ ràng

### 13.6 Anti-scam

**MUST**
P2P phải luôn có:

- không giao dịch ngoài nền tảng
- chỉ bấm “Đã thanh toán” khi đã chuyển thật
- report dễ thấy
- dangerous confirm cho release

### 13.7 Demo gate

**MUST**
Nếu có demo mode:

- P2P không interactive trong demo
- show disabled overlay/state rõ

---

## 14) Security & privacy UX

### 14.1 Security Center

**SHOULD**
Có:

- 2FA status
- biometrics/passkey
- devices
- anti-phishing code
- activity/session info

### 14.2 Sensitive data

**MUST**

- address masked
- email/phone masked
- copy action có toast

### 14.3 High-risk actions

**MUST**
Preview + confirm + step-up auth nếu cần cho:

- withdraw
- release escrow
- đổi password
- tắt 2FA
- thêm address
- đổi payment method P2P

---

## 15) Microcopy & tone

### 15.1 Tone

**MUST**

- ngắn
- rõ
- trung tính
- không hype
- không casino-like
- beginner-friendly

### 15.2 Error structure

**MUST**

- vấn đề
- lý do
- cách xử lý

### 15.3 Arena copy

**MUST**
Arena phải dùng wording như:

- `Arena Points`
- `pool điểm`
- `chốt kết quả`
- `sổ điểm`
- `thử thách`
- `phòng`

**MUST NOT**
Không dùng wording financial như:

- payout USD
- profit
- wallet value
- balance value
- stake return

### 15.4 Prediction copy

**MUST**
Prediction có thể dùng:

- positions
- open orders
- probability
- event
- rewards
- receipt
- P/L

Nhưng không dùng copy quá kích thích.

---

## 16) Engineering & implementation guardrails

### 16.1 Component discipline

**MUST**

- ưu tiên mở rộng component cũ
- không tạo component mới nếu chỉ cần thêm variant/state
- dùng naming rõ:
  - `Component/Variant/State`

### 16.2 File / route discipline

**SHOULD**

- Prediction pages grouped dưới prediction module
- Arena grouped dưới arena module
- bridge surfaces grouped riêng nếu cần
- vFinal screens phải được chọn rõ, tránh để quá nhiều v2/v3 sống song song

### 16.3 Data discipline

**MUST**

- mock data deterministic
- không dùng random flicker cho charts hoặc price history
- Arena và Prediction có data model riêng
- bridge chỉ carry-over context fields, không carry-over value fields

### 16.4 Charts

**MUST**

- deterministic
- consistent tooltip styling
- readable axes
- no visual noise

### 16.5 Approved libs mindset

**SHOULD**

- không thêm package mới nếu chưa cần
- ưu tiên stack hiện có trong codebase

---

## 17) Delivery expectations for current app

### 17.1 Core ecosystem deliverables

**MUST**

- Home
- Markets
- Trade Beginner / Pro
- Wallet
- Profile
- Settings / Security
- P2P full flow

### 17.2 Prediction deliverables

**MUST**

- Predictions Home
- Event Detail
- Portfolio
- Search
- Rewards
- Leaderboard
- Global Activity

### 17.3 Arena deliverables

**MUST**

- Arena Home
- Studio
- Mode Detail
- Challenge Detail
- Creator
- My Arena
- Leaderboard
- Safety Center
- Resolution Center
- Points Ledger

### 17.4 Bridge deliverables

**SHOULD**

- Home bridge section
- Profile dual stats
- Event ↔ Arena context cards
- Unified Search
- Topic Hub
- Studio preset from event

---

## 18) QA checklist before design ship

### 18.1 Global

- Tap targets đủ lớn
- Contrast ổn
- Safe areas đúng
- Loading / empty / error / offline đủ
- No dark patterns

### 18.2 Core trading

- Fee breakdown có trước confirm
- Withdraw preview đầy đủ
- Network/address clarity đủ

### 18.3 Prediction

- Event detail không quá hype
- Trade review có đủ fields
- Risk explainer có chỗ mở
- Reward copy không hứa hẹn chắc thắng

### 18.4 Arena

- Rule builder đủ structured
- Public room governance gate hoạt động rõ
- Trust breakdown xem được
- Resolution flow rõ
- Ledger entries truy vết được
- report/block/case lifecycle đủ

### 18.5 Bridges

- Mọi bridge card có disclosure
- Không có chỗ nào gộp points với PnL
- Search results segmented đúng
- Topic Hub không làm user nhầm nature
- Arena-from-event flow có boundary statement

### 18.6 P2P

- create order → room → timer → confirm paid → release confirm → dispute đủ
- release luôn destructive confirm
- anti-scam banner rõ
- demo gate đúng nếu có demo mode

---

## 19) What MUST NOT happen

- Không đổi IA hiện tại bằng cách thêm tab Arena/Prediction vào bottom nav
- Không gộp Arena Points với wallet/PnL
- Không gộp leaderboards của Prediction và Arena
- Không dùng copy financial cho Arena
- Không dùng copy casino/FOMO cho Prediction hoặc P2P
- Không để bridge card thiếu disclosure
- Không cho release escrow mà thiếu confirm/destructive warning
- Không cho room public với rules mơ hồ
- Không để offline state giả vờ loading vô hạn
- Không để nhiều version screen sống song song mà không có canonical vFinal

---

## 20) Final priority order

Nếu có xung đột giữa:

- trust
- safety
- boundary clarity
- speed
- density
- beauty

thì luôn ưu tiên:

**Trust → Safety → Boundary Clarity → Clarity → Accessibility → Speed → Beauty**

---

## 21) Layout Templates & Header Patterns — Enterprise Standard

### 21.1 Layout Template System

**MUST**
Page ứng dụng có nội dung cuộn thông thường phải dùng `PageLayout` + `PageContent` từ `src/shared/ui/layout/`. Shell của ứng dụng nằm riêng ở `src/app/components/layout/`; không import page-content primitive từ shell.

```tsx
import { PageLayout, StickyFooter } from '@/shared/ui/layout/PageLayout';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { Header } from '@/shared/ui/layout/Header';
import { TabBar } from '@/shared/ui/TabBar';
```

`PageContent` là boundary cho một vùng nội dung liên tục có chung gutter/gap. Dùng preset khi các sibling chia sẻ cùng spacing role; giữ section riêng tự sở hữu gutter khi trang gồm toolbar/filter/row edge-to-edge với density khác nhau. `WatchlistPage` dùng `PageContent` cho danh sách card (gap 12px do parent sở hữu); `OrdersHistoryPage` giữ tabs/filter/rows theo section vì mỗi vùng có gutter và padding riêng. `P2PMarketplacePage` giữ `PullToRefresh` ở root; `P2PMarketplaceSections` sở hữu vùng nội dung bằng `PageContent`. Không thêm wrapper không có trách nhiệm layout chỉ để tăng số lần import.

Auth Web và chart/trade immersive theo shell riêng. `src/features/dca/pages/DCAMainPage.tsx` và `src/features/p2p/pages/P2PMarketplacePage.tsx` giữ `PullToRefresh` làm root gesture/layout owner; nội dung DCA dùng `PageContent` trực tiếp, còn P2P giao vùng danh sách cho `src/features/p2p/components/P2PMarketplaceSections.tsx`. Không lồng `PageLayout` nếu chưa kiểm tra min-height, bottom inset và pull gesture trên runtime. `src/features/p2p/pages/P2P2FASettingsPage.tsx` giao vùng nội dung cho `src/features/p2p/components/P2P2FASettingsView.tsx`, nơi đang dùng `PageContent`. Các route adapter, Web auth shell, trang trade immersive và preview dev/legacy được liệt kê cùng owner trong `src/app/__tests__/page-layout-contract.test.ts`; không thêm ngoại lệ chỉ để né primitive. Ngoại lệ mới MUST nêu route/file, lý do, owner tại lớp hiện có, trạng thái cần kiểm tra và điều kiện xem xét lại trong cùng change/review.

**MUST NOT**

- Tự viết `<div className="flex flex-col min-h-full pb-8">` — dùng `<PageLayout>` thay
- Tự viết `<div className="px-5 pt-3 flex flex-col gap-4">` — dùng `<PageContent>` thay
- Tự reimplent tab bar — dùng `<TabBar>` thay
- Dùng `height: calc(100vh - Xpx)` / `h-screen` / `h-full` + `overflowY: auto` bên trong `AppLayout`

### 21.2 PageLayout Variants

**MUST**
Chọn đúng variant cho từng loại trang:

| Variant     | Background | Bottom Pad  | Use case                                       |
| ----------- | ---------- | ----------- | ---------------------------------------------- |
| `default`   | c.bg       | pb-8 (32px) | ~90% pages — standard scrollable content       |
| `surface`   | c.surface  | pb-8 (32px) | Settings, forms, modal-like pages              |
| `flush`     | c.bg       | 0           | Pages with StickyFooter (Create Order, Wizard) |
| `immersive` | none       | pb-8 (32px) | Custom gradient/chart backgrounds              |

### 21.3 Approved Page Compositions

**MUST**
Chỉ dùng các composition patterns sau:

**Pattern A — Standard Page (detail, list, info):**

```tsx
<PageLayout>
  <Header title="Tiêu đề" back />
  <PageContent>{/* content */}</PageContent>
</PageLayout>
```

**Pattern B — Page with Tabs (guide, module index):**

```tsx
<PageLayout>
  <Header title="Tiêu đề" back />
  <TabBar tabs={TABS} active={tab} onChange={setTab} />
  <PageContent>{tab === "X" && <div>...</div>}</PageContent>
</PageLayout>
```

**Pattern C — Form/Wizard with Bottom CTA:**

```tsx
<PageLayout variant="flush">
  <Header title="Step 1" back />
  <PageContent grow>{/* form fields */}</PageContent>
  <StickyFooter>
    <CTAButton>Xác nhận</CTAButton>
  </StickyFooter>
</PageLayout>
```

**Pattern D — Immersive/Chart page:**

```tsx
<PageLayout variant="immersive">
  <Header transparent back right="more" variant="custom">
    {/* custom header overlay */}
  </Header>
  <HeroGradient />
  <PageContent>{/* content below hero */}</PageContent>
</PageLayout>
```

**Pattern E — Module Index (Home-like):**

```tsx
<PageLayout>
  <Header
    variant="page"
    title="P2P Trading"
    subtitle="Giao dịch ngang hàng"
    right="bell"
  />
  <PageContent gap="relaxed">
    <HubCard />
    <PageSection label="Giao dịch gần đây">
      {/* cards */}
    </PageSection>
  </PageContent>
</PageLayout>
```

### 21.4 Header API & Pattern Reference

`Header` có ba API công khai: `page` (left-aligned), `standard` (centered title) và `custom` (nội dung do consumer composition). Implementation/test hiện xác nhận default là `page`; không đổi default toàn cục chỉ để khớp một mẫu trang.

| Hành vi | Contract hiện tại |
| --- | --- |
| `variant` | Mặc định `page`; chọn `standard` tường minh khi trang cần title căn giữa; `custom` dành cho nội dung header do feature composition. |
| `right` | Mặc định `none`. `page` không tạo placeholder khi không có action; `standard` giữ placeholder 36px để cân title. |
| Breadcrumb | Tắt mặc định, kể cả khi có `back`. Chỉ render khi truyền `breadcrumb`; `breadcrumbMinDepth` mặc định là 2. |
| Back | `back` hiển thị hành động quay lại; không tự bật breadcrumb. Giữ hành vi navigation/fallback hiện có. |
| Title | `page` căn trái; `standard` căn giữa. Title dài phải wrap/truncate theo behavior của owner, không tạo header riêng tại page. |

```tsx
// Header trái theo default, không breadcrumb; hợp với page/list thông thường.
<Header title="Trading Bots" back />

// Title căn giữa và breadcrumb là hai lựa chọn tường minh.
<Header variant="standard" title="Chi tiết lệnh" back breadcrumb />
```

**MUST**

- Dùng `Header` cho header trang thuộc app shell; chọn `variant` theo hierarchy của sản phẩm và giữ default hiện có khi phù hợp.
- Chỉ bật breadcrumb khi route có đường dẫn cha hữu ích; kiểm tra label/đường quay lại ở route thật.
- Dùng `action` hoặc `right` API công khai cho thao tác header; icon-only action phải có accessible name.
- Không coi một variant là chuẩn bắt buộc cho mọi trang; chart/immersive và module-specific navigation được giữ composition có chủ đích.

**MUST NOT**

- Không tuyên bố `back` tự bật breadcrumb hoặc `right="none"` luôn có placeholder.
- Không tự dựng header div để né API hiện có; nếu contract thiếu, mở rộng owner và test consumer trước.
- Không đổi default/visual behavior toàn sản phẩm sem documentation-only migration; thay đổi như vậy cần consumer inventory, regression và review.

### 21.5 TabBar Variants

**MUST**
Chọn đúng TabBar variant:

| Variant     | Use case                                         | Example               |
| ----------- | ------------------------------------------------ | --------------------- |
| `underline` | Content tabs (default) — FAQ, Guide, Activity    | Hướng dẫn/An toàn/FAQ |
| `pill`      | Filter chips — status, category                  | Tất cả/Mua/Bán        |
| `segment`   | Binary/ternary toggle — Buy/Sell, mode switching | Mua Crypto/Bán Crypto |

### 21.6 PageContent Spacing Presets

**MUST**
Dùng đúng preset, không hard-code padding:

| Padding   | Value | Use case                          |
| --------- | ----- | --------------------------------- |
| `compact` | pt-2  | Dense lists, tables               |
| `default` | pt-3  | Standard pages (~80%)             |
| `relaxed` | pt-4  | Forms, settings, spacious layouts |
| `none`    | 0     | Full-bleed hero, custom gradient  |

| Gap       | Value | Use case                            |
| --------- | ----- | ----------------------------------- |
| `tight`   | 8px   | Compact card lists, FAQ items       |
| `default` | 16px  | Standard section spacing (~70%)     |
| `relaxed` | 24px  | Form groups, settings sections      |
| `loose`   | 32px  | Major page sections, hero + content |

### 21.7 PageSection with Labels

**SHOULD**
Khi nhóm các controls/cards trong bottom sheets hoặc toolbox, dùng `PageSection` có label:

```tsx
<PageSection label="Giao dịch" accentColor="#3B82F6">
  <Button>Thanh toán</Button>
  <Button>Sổ lệnh</Button>
</PageSection>
<PageSection label="An toàn" accentColor="#10B981">
  <Button>Bảo hiểm</Button>
  <Button>Tranh chấp</Button>
</PageSection>
```

### 21.8 Performance Rules for Templates

**MUST**

- Không import `motion` / `framer-motion` trong page components trừ khi thật sự cần complex animation
- TabBar phải dùng pure CSS transitions (scaleX + opacity), không `layoutId`
- Accordion/FAQ dùng `grid-template-rows: 0fr → 1fr`, không `useEffect` + `scrollHeight`
- Không `useFadeInTab` cho tab content — để PageTransition xử lý entrance animation
- `useThemeColors()` trả về static object (zero re-render) — an toàn gọi nhiều lần

### 21.9 Migration Checklist

**SHOULD**
Khi refactor page cũ sang template system:

- [ ] Thay `<div className="flex flex-col min-h-full pb-8">` → `<PageLayout>`
- [ ] Thay manual `px-5 pt-X gap-X` → `<PageContent padding="..." gap="...">`
- [ ] Thay custom tab bar → `<TabBar>`
- [ ] Thay `motion.div layoutId` tab indicator → pure CSS
- [ ] Thay `useEffect` + `scrollHeight` accordion → CSS `grid-template-rows`
- [ ] Xóa `useFadeInTab` nếu page đang dùng
- [ ] Xóa `import { motion } from 'motion/react'` nếu chỉ dùng cho tab indicator
- [ ] Verify: không có `h-screen` / `calc(100vh)` / `overflow-y: auto` bên trong layout

### 21.10 Nguồn chuẩn token, layout và density

Các giá trị dưới đây mô tả owner đang chạy trong ứng dụng. Không chép lại bảng giá trị token đầy đủ vào page hoặc tạo một file token thứ hai.

| Trách nhiệm | Owner hiện có | Hợp đồng áp dụng |
| --- | --- | --- |
| Màu semantic/theme | `src/styles/theme.css`; `.light` là theme override. `src/main.tsx` nạp `src/styles/index.css`, stylesheet này nạp theme; `ThemeProvider`/`useThemeColors()` cung cấp theme và các giá trị CSS cho component. | Page dùng vai trò `--tr-*` hoặc `useThemeColors()`. Primitive riêng như CTA dùng `src/shared/theme/button.ts` và phải giữ test tương phản/contract. |
| Radius | `src/shared/theme/radii.ts` cho API TypeScript; `--tr-radius-*` trong `src/styles/theme.css` cho CSS runtime. | Hai adapter hiện được đối chiếu bởi `src/shared/theme/theme-token-contract.test.tsx`; không khai báo radius nền tảng mới trong page. |
| Border/elevation/control size | Semantic colors và surface/shadow vars tại `src/styles/theme.css` qua `src/shared/hooks/useThemeColors.ts`; `src/shared/theme/radii.ts`, `src/shared/theme/density.ts`, `src/shared/theme/button.ts`, `src/shared/ui/TrCard.tsx`. | Card/control dùng variant, radius, density API có sẵn. Giá trị component riêng chỉ thêm khi contract ổn định; không thêm biến nền tảng trùng vai trò. |
| Density/control sizing | `src/shared/theme/density.ts` và component tokens tại `src/shared/theme/button.ts`. | Chọn density có tên (`compact`, `standard`, `relaxed`, `hero`, `tool`) theo nhu cầu thực tế; không tự đặt chiều cao control nền tảng ở page. |
| Page gutter/section spacing | `src/shared/ui/layout/PageLayout.tsx`, `src/shared/ui/layout/PageContent.tsx`, `src/shared/theme/density.ts`; legacy Fibonacci scale tại `src/shared/lib/golden.ts` (`φSpace`). | `PageContent` sở hữu gutter ngang `px-5` (20px), trừ `fullBleed`; component sở hữu padding bên trong; parent `gap` sở hữu khoảng cách giữa sibling. `src/features/market/pages/WatchlistPage.tsx` dùng gap 12px thay cho margin-bottom 12px trên từng card. `src/features/p2p/pages/P2PFraudPreventionPage.tsx` giữ gap đặc thù 21px từ `φSpace[5]`; không dùng scale này cho layout mới nếu semantic preset hiện có đáp ứng. |
| Typography | CSS roles `--tr-text-*` trong `src/styles/theme.css`; API role `VitTextRoles`/`textRoleStyle()` trong `src/shared/theme/typography.ts`. | Màn hình mới dùng role hiện có theo ý nghĩa. `src/shared/theme/legacyTypography.ts` là compatibility source cho consumer hiện hữu, không phải nơi thêm role mới. `src/shared/theme/webTokens.ts` giữ riêng density/typography của Web shell. |
| Breakpoint/shell | `src/app/components/layout/device-layout.ts`, shell responsive hiện có và cấu hình CSS thực tế. | Route dùng shell và breakpoint đã có; chỉ thêm breakpoint khi có yêu cầu sản phẩm và kiểm tra hai phía ranh giới. |
| Opacity/motion/icons/charts/z-index | `src/shared/theme/motion.ts`, `src/shared/theme/colors.ts`, `src/shared/theme/icons.ts`; CSS runtime tại `src/styles/theme.css`; chart mapping tại `src/shared/lib/charts/chartTheme.ts`. Z-index hiện do từng overlay/portal owner khai báo. | Dùng token/theme helper ở shared consumer; chart palette và onboarding overlay được giữ theo owner. Chưa có z-index semantic map thống nhất trong source; không tạo số chung mới khi chưa inventory stacking context/portal. |

Giá trị density hiện được map tại owner như sau: `PageContent` compact/tool → padding compact + gap tight (8px); standard → default + default (12px trên, 16px giữa section); relaxed/hero → relaxed + relaxed (16px trên, 24px giữa section). Gutter mặc định là 20px; `PageLayout` default/surface/immersive giữ bottom inset 32px, còn `flush` không thêm inset. `CTAButton` có sizing riêng theo `density`; dùng API đó thay vì tự dựng nút cùng ý nghĩa. `φSpace` là thang Fibonacci cũ (3/5/8/13/21/34/55px), hiện còn dùng trong Coachmark/onboarding, một số nội dung P2P và màn hình `dev/legacy`; giữ consumer hiện hữu theo đúng hình học, không mở rộng thành nguồn spacing chung.

Thang spacing nền tảng 4pt và nhịp 8pt hiện hữu không bắt buộc mọi vai trò phải là bội số 8: các preset 12px, 20px và giá trị hình học là hợp lệ khi đúng role. Không thay token/brand/font toàn cục chỉ để làm các số trông đồng đều. Literal động theo dữ liệu, chart/canvas geometry, `0`, `auto`, `100%`, grid fraction và giá trị third-party boundary được giữ khi có lý do.

### 21.11 Catalog component dùng chung hiện có

Đây là catalog của public module đang có, không phải yêu cầu mọi trang phải bọc thêm một wrapper. Dùng component có cùng trách nhiệm; giữ composition nghiệp vụ ở feature.

| Nhóm | API/owner | Dùng khi | Contract và kiểm thử owner |
| --- | --- | --- | --- |
| Hành động | `src/shared/ui/button.tsx` (`Button`); `src/shared/ui/CTAButton.tsx`; `src/shared/ui/IconButton.tsx` | `Button` cho action thông thường; `CTAButton` cho CTA có intent/loading/density; `IconButton` cho action chỉ có icon khi có accessible label. | Không truyền style để lén đổi intent/focus/disabled. Test: `src/shared/ui/button.test.tsx`, `src/shared/ui/CTAButton.test.tsx`, `src/app/__tests__/IconButton.test.tsx`. |
| Trường nhập | `src/shared/ui/TrInput.tsx`; `src/shared/ui/InputField.tsx` | Dùng `TrInput`/`TrTextarea` cho field của sản phẩm; `InputField` khi cần wrapper field có label/error/prefix/suffix. | Gắn label, helper và error với đúng control; giữ `aria-invalid`, disabled/readOnly và focus. Test: `src/shared/ui/TrInput.test.tsx`, `src/shared/ui/InputField.test.tsx`. |
| Card và dữ liệu | `src/shared/ui/TrCard.tsx`; `src/shared/ui/InfoRow.tsx`; `src/shared/ui/StatusPill.tsx` | `TrCard` cho bề mặt card có density/radius/variant; `InfoRow` cho cặp nhãn/giá trị; `StatusPill` cho trạng thái đã biết. | Không dùng status color như màu trang trí; giữ nghĩa trạng thái. Test: `src/shared/ui/TrCard.test.tsx`, `src/shared/ui/InfoRow.test.tsx`; `StatusPill` hiện chưa có test owner riêng. |
| Overlay/xác nhận | `src/shared/ui/BottomSheetV2.tsx`; `src/shared/ui/ConfirmationDialog.tsx` | Sheet/center modal dùng chung; xác nhận thao tác cần mô tả tác động và action. | Focus, Escape/dismiss theo `preventClose`, title/name và restore focus thuộc owner; không tự dựng modal bằng portal ở page. Test: `src/shared/ui/BottomSheetV2.test.tsx`, `src/shared/ui/ConfirmationDialog.test.tsx`. |
| Bố cục | `src/shared/ui/layout/PageLayout.tsx`, `src/shared/ui/layout/PageContent.tsx`, `src/shared/ui/layout/Header.tsx`; `src/shared/ui/TabBar.tsx` | Page content, section, heading/navigation và tabs có cùng behavior. | Dùng variant/preset có tên; shell cấp ứng dụng tiếp tục thuộc `src/app/components/layout/`. Test: `src/shared/ui/layout/PageLayout.test.tsx`, `src/shared/ui/layout/PageContent.test.tsx`, `src/shared/ui/layout/Header.test.tsx`, `src/shared/ui/TabBar.test.tsx`. |
| Trạng thái và phản hồi | `src/shared/ui/EmptyState.tsx`, `src/shared/ui/ErrorState.tsx`, `src/shared/ui/SkeletonBlock.tsx`, `src/shared/ui/ThemedToaster.tsx` | Empty/no-results, lỗi có retry, loading và feedback toàn cục. | Lỗi của field hiển thị gần field; toast không thay validation. Câu thông báo nêu kết quả và bước tiếp theo. Test owner hiện có: `src/shared/ui/EmptyState.test.tsx`, `src/shared/ui/SkeletonBlock.test.tsx`; chưa tìm thấy test riêng cho `ErrorState`/`ThemedToaster`. |
| Tìm kiếm | `src/shared/ui/SearchBar.tsx` | Ô tìm kiếm có clear/debounce/keyboard theo API hiện có. | Giữ request cancellation/stale-result contract của feature; không nhân đôi search field chỉ để đổi màu. Test: `src/shared/ui/SearchBar.test.tsx`. |

Không có Storybook/component-site trong cấu hình hiện tại được xác nhận là nguồn chuẩn; test owner và public module là catalog đang chạy. Khi đổi public contract, cập nhật test owner và mục này cùng change.

`src/app/__tests__/page-layout-contract.test.ts` khóa inventory page vào shared primitives hoặc owner ngoại lệ đã nêu. `src/app/__tests__/design-system-legacy-guard.test.ts` ngăn thêm consumer sản phẩm mới của `legacyTypography`/`φSpace` và không cho tăng selector CSS suy luận variant từ hình dạng class. Các danh sách hiện tại là nợ cần giảm theo migration, không phải API mới được khuyến nghị; không mở rộng chúng để làm CI xanh.

### 21.12 Quy tắc tạo/sửa UI và ngoại lệ

**MUST**

1. Đọc phần Guidelines áp dụng và tìm route/component có cùng hành vi trong source.
2. Tra token, density, layout và public module ở bảng trên; tìm consumer trước khi kết luận thiếu component.
3. Tái sử dụng component hiện có. Nếu hợp đồng chưa đáp ứng, ưu tiên thêm variant/slot có nghĩa vào owner và kiểm tra consumer bị ảnh hưởng.
4. Chỉ tạo component mới khi trách nhiệm/hành vi khác biệt và có consumer dự kiến; component thuộc đúng tầng shared layout, shared primitive hay feature.
5. Không copy shared component, khai báo lại màu/radius/spacing/typography nền tảng tại page, hoặc dùng selector CSS dựa vào hình dáng class của consumer để tạo variant.
6. Không override nội bộ public component bằng CSS xuyên tầng. Nhu cầu lặp lại phải trở thành public prop/variant/slot có test; `className`/style cục bộ chỉ dùng cho composition và hình học đặc thù không phá hợp đồng.
7. Kiểm tra state áp dụng, bàn phím/focus, theme, viewport hai phía breakpoint liên quan, text dài và consumer sibling.
8. Khi đổi public contract, cập nhật owner tests, catalog này và gate hiện có; không cập nhật screenshot baseline chỉ để test xanh.

**SHOULD** ghi ngoại lệ cùng change/review với phạm vi cụ thể, lý do sản phẩm, owner theo quy trình review hiện có, bằng chứng kiểm tra và điều kiện loại bỏ/xem xét lại. Không tự đặt owner mới; khi chưa xác định được owner theo quy trình sẵn có, giữ ngoại lệ ở trạng thái cần phân công.
