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

### 4.3 States

**MUST**
Mọi control quan trọng phải có:

- default
- pressed
- disabled
- loading
- error
- success

### 4.4 Lists & cards

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
Mọi page mới phải dùng `PageLayout` + `PageContent` từ `/src/app/components/layout/`:

```tsx
import {
  PageLayout,
  StickyFooter,
} from "../../components/layout/PageLayout";
import {
  PageContent,
  PageSection,
} from "../../components/layout/PageContent";
import { Header } from "../../components/layout/Header";
import { TabBar } from "../../components/layout/TabBar";
```

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

### 21.4 Header Gold Standard & Pattern Reference

**MUST — GOLD STANDARD (Trading Bots pattern)**

Tất cả inner/detail pages phải tuân theo mẫu chuẩn:

```
┌─────────────────────────────────────────┐
│  [←]         Trading Bots         [ ]   │  ← glass bar, h=52px, centered title
├─────────────────────────────────────────┤
│  Giao dịch  ›  Bot giao dịch           │  ← breadcrumb auto (depth ≥ 2)
└─────────────────────────────────────────┘
```

**Code mẫu chuẩn:**

```tsx
// ✅ GOLD STANDARD — chỉ cần 2 props, breadcrumb tự bật
<Header title="Trading Bots" back />

// Breadcrumb auto-enabled khi back=true (ẩn nếu depth < 2)
// right defaults to 'none' (placeholder 36px bên phải)
// variant defaults to 'standard' (centered title)
// breadcrumbMinDepth defaults to 2
```

**Smart Defaults (đã built-in vào Header component):**

- `back={true}` → `breadcrumb` tự bật (auto-enabled)
- `breadcrumbMinDepth` mặc định = `2` (chỉ hiện khi depth ≥ 2)
- `right` mặc định = `'none'` (placeholder 36px giữ cân bằng)
- `variant` mặc định = `'standard'` (centered title)
- Muốn tắt breadcrumb: dùng `breadcrumb={false}`

**MUST NOT:**

- Không tự tạo header div riêng — luôn dùng `<Header />`
- Không dùng `right="none"` explicitly — đó là default
- Không quên `back` cho inner pages — user phải quay lại được

**Action prop (cho header có icon button bên phải):**

```tsx
import { Settings } from 'lucide-react';

<Header
  title="Security Center"
  back
  action={{ icon: Settings, onClick: () => navigate('/settings') }}
/>
```

**MUST — Pattern Table:**

| Page Type          | variant    | back | right/action  | breadcrumb   | badge |
| ------------------ | ---------- | ---- | ------------- | ------------ | ----- |
| Detail page        | `standard` | ✓    | —             | auto ✓       | —     |
| Module index       | `page`     | ✗    | `bell`        | ✗            | —     |
| Sub-module index   | `page`     | ✓    | `search`      | auto ✓       | —     |
| Settings page      | `standard` | ✓    | —             | auto ✓       | —     |
| Chart/Trade        | `custom`   | ✓    | custom        | auto ✓       | —     |
| Form/Wizard        | `standard` | ✓    | —             | auto ✓       | —     |
| Search page        | `standard` | ✓    | `search`      | auto ✓       | —     |
| Deep nav (≥3 deep) | `standard` | ✓    | —             | auto ✓       | —     |
| Orders list        | `standard` | ✓    | —             | auto ✓       | count |
| With action button | `standard` | ✓    | `action={..}` | auto ✓       | —     |

**Breadcrumb tự sinh từ route path:**

- Route segment → Vietnamese label mapping tự động
- Segment labels được config trong `Breadcrumb.tsx` (`SEGMENT_LABELS` + `CONTEXT_LABELS`)
- Dynamic segments (IDs, UUIDs) tự phát hiện và hiển thị `...`
- Clickable: user có thể tap vào segment cha để navigate ngược

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