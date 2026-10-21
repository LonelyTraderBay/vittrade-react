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
Với trang nội dung chuẩn, dùng `PageLayout` + `PageContent` từ `src/shared/ui/layout/`. Web, Tablet và Responsive shell sở hữu gutter tại những profile mà chúng đặt max-width/padding; phone, centered và full-bleed dùng fallback/composition riêng. `Header`, `PageContent` và `StickyFooter` theo cùng hợp đồng `pageGutter.ts`, không cộng thêm gutter theo thói quen:

```tsx
import {
  PageLayout,
  StickyFooter,
} from "@/shared/ui/layout/PageLayout";
import {
  PageContent,
  PageSection,
} from "@/shared/ui/layout/PageContent";
import { Header } from "@/shared/ui/layout/Header";
import { TabBar } from "@/shared/ui/TabBar";
```

**MUST NOT**

- Tự viết `<div className="flex flex-col min-h-full pb-8">` — dùng `<PageLayout>` thay
- Tự viết `<div className="px-5 pt-3 flex flex-col gap-4">` — dùng `<PageContent>` thay
- Tự reimplent tab bar — dùng `<TabBar>` thay
- Không dùng `height: calc(100vh - Xpx)` / `h-screen` / `h-full` + nested `overflowY: auto` để tạo vùng cuộn thứ hai bên trong `AppLayout`. Chỉ dùng viewport sizing cho widget/full-bleed route có scroll owner, reflow và mobile keyboard được kiểm tra rõ.
- `PageLayout` hiện render `role="main"`; giữ đúng một main landmark cho page và không bọc nó trong một main khác.

### 21.2 PageLayout Variants

**MUST**
Chọn variant theo đúng nền và quyền sở hữu vùng cuộn. Các giá trị dưới đây là contract đang có trong `src/shared/ui/layout/PageLayout.tsx`; không suy ra tỷ lệ sử dụng nếu chưa đo inventory:

| Variant     | Background | Bottom Pad  | Use case                                       |
| ----------- | ---------- | ----------- | ---------------------------------------------- |
| `default`   | c.bg       | 32px        | Nội dung tiêu chuẩn                           |
| `surface`   | c.surface  | 32px        | Settings/forms khi nền surface phù hợp          |
| `flush`     | c.bg       | 0           | Pages with StickyFooter (Create Order, Wizard) |
| `immersive` | none       | 32px        | Nền gradient/chart do nội dung sở hữu          |

### 21.3 Approved Page Compositions

**MUST**
Dùng các composition sau làm mẫu mặc định khi semantics và scroll owner phù hợp. Đây không phải danh sách loại trang bắt buộc; pattern khác phải có lý do theo sản phẩm và không được tạo lại primitive dùng chung:

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
import { MoreVertical } from 'lucide-react';
import { IconButton } from '@/shared/ui/IconButton';

<PageLayout variant="immersive">
  <Header
    variant="page"
    title="Biểu đồ"
    transparent
    right={
      <IconButton
        icon={MoreVertical}
        label="Mở tuỳ chọn biểu đồ"
        onClick={openChartMenu}
      />
    }
  />
  <HeroGradient />
  <PageContent>{/* content below hero */}</PageContent>
</PageLayout>
```

Nếu cấu trúc header thực sự riêng, `variant="custom"` chỉ render `children`; các props như `back`, `right` không tạo action chuẩn trong variant này. Nội dung custom phải tự cung cấp semantics, keyboard, focus và action có handler.

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

### 21.4 Header contract và lựa chọn pattern

Implementation dùng chung là `src/shared/ui/layout/Header.tsx`. `src/app/components/layout/Header.tsx` chỉ là adapter cấp ứng dụng: nó lấy notification count từ `useUI()` rồi chuyển props xuống Header dùng chung. Page dùng adapter khi cần state notification toàn cục; không tạo một bản Header khác trong feature.

| Variant đang có | Hành vi được xác nhận trong code | Dùng khi |
| --------------- | -------------------------------- | -------- |
| `page` (default) | Title căn trái; `right="none"` không tạo placeholder | Trang có title/subtitle căn trái theo pattern sản phẩm |
| `standard` | Title căn giữa; `right="none"` giữ ô rộng 36px để cân bằng | Header cần trục title ở giữa |
| `custom` | Render `children`; không render bar chuẩn | Nội dung header thực sự khác cấu trúc chuẩn |

**MUST**

- Chỉ bật breadcrumb bằng `breadcrumb`; `back` không tự bật breadcrumb. `breadcrumbMinDepth` mặc định là `2` và chỉ có hiệu lực khi breadcrumb được bật.
- Đặt nhãn cụ thể cho icon action (`action.label`) để accessible name diễn đạt hành động.
- Xác minh callback của từng action. `right="bell"` dùng `onNotificationsClick` hoặc điều hướng tới route notification; `right="search"` chỉ gọi `onSearch` khi được truyền. `right="more"` hiện render button nhưng không có callback trong API, vì vậy không dùng nó làm menu/action có chức năng; truyền `action` hoặc phần tử `right` có handler.
- Dùng `onBack` nếu luồng yêu cầu hành vi quay lại xác định; nếu bỏ prop này Header gọi `navigate(-1)`.
- Không dựng header riêng chỉ để đổi màu, padding hoặc vị trí action. Nếu một khác biệt lặp lại là nhu cầu sản phẩm, mở rộng variant/public API có test.

Breadcrumb được tạo từ route path và mapping trong `src/shared/ui/Breadcrumb.tsx`; điều đó không đồng nghĩa mọi page phải hiển thị breadcrumb. Chỉ bật khi cấu trúc điều hướng và nhu cầu quay lại cấp cha đã được xác nhận.

Ví dụ dưới đây minh họa việc bật breadcrumb tường minh; đây là ví dụ theo API đang có, không phải thay đổi giao diện đã triển khai:

```tsx
<Header title="Security Center" back breadcrumb breadcrumbMinDepth={2} />
```

### 21.5 TabBar Variants

**MUST**
Chọn đúng TabBar variant:

| Variant     | Use case                                         | Example               |
| ----------- | ------------------------------------------------ | --------------------- |
| `underline` | Content tabs (default) — FAQ, Guide, Activity    | Hướng dẫn/An toàn/FAQ |
| `pill`      | Filter chips — status, category                  | Tất cả/Mua/Bán        |
| `segment`   | Binary/ternary toggle — Buy/Sell, mode switching | Mua Crypto/Bán Crypto |

### 21.6 PageContent spacing contract

`PageContent` tại `src/shared/ui/layout/PageContent.tsx` sở hữu vertical top padding và khoảng cách giữa các child trực tiếp. Gutter ngang dùng hợp đồng `--tr-page-inline-gutter` tại `src/shared/ui/layout/pageGutter.ts`: shell đặt `0px` khi chính nó đã cấp max-width/gutter; nếu không có shell sở hữu gutter, fallback giữ 20px. `PageContent fullBleed` bỏ gutter ngang của riêng component. `Header` (`page`/`standard`, không gồm `custom`) và `StickyFooter` dùng cùng hợp đồng để thẳng hàng với content. Các giá trị hiện tại:

| Prop | Giá trị code hiện tại | Vai trò |
| ---- | --------------------- | ------- |
| `padding="compact"` | `pt-2` = 8px | Nội dung dày, khi hierarchy vẫn đọc được |
| `padding="default"` | `pt-3` = 12px | Khoảng Header–content mặc định |
| `padding="relaxed"` | `pt-4` = 16px | Form/setting cần thêm khoảng thở |
| `padding="none"` | 0 | Nối với hero/full-bleed có chủ đích |
| `gap="tight"` | 8px | Các mục liên quan, nhóm dày |
| `gap="default"` | 16px | Khoảng giữa section mặc định |
| `gap="relaxed"` | 24px | Nhóm form/section tách biệt |
| `gap="loose"` | 32px | Các vùng nội dung lớn |
| `gap={number}` | Số px truyền trực tiếp | Chỉ dùng khi hình học/dữ liệu cần khoảng riêng; ghi lý do ở consumer |

**MUST**

- Dùng preset có tên cho khoảng cách trang thông thường; không đưa margin vào child trực tiếp để cộng dồn với `gap`.
- Mỗi breakpoint chỉ có một owner cho page gutter. `WebShell` sở hữu gutter 32px trên desktop và 16px ở hẹp; `TabletShell` sở hữu 24px; `ResponsiveAppLayout` sở hữu 24px ở desktop và 16px ở tablet. Các shell này đặt `--tr-page-inline-gutter: 0px`; `PageContent`, `Header` và `StickyFooter` không cộng thêm gutter. Phone, centered, full-bleed và nhánh shell không có outer gutter giữ fallback 20px, trừ `PageContent fullBleed`. Nhánh auth tuân theo shell thực tế chứa nó. Không cộng gutter thứ hai ở child trừ khi bố cục lồng có chủ đích và được kiểm chứng.
- Không suy ra density từ kích thước viewport. `density` trong `PageContent` chỉ ánh xạ preset padding/gap; `src/shared/theme/density.ts` là metrics cho control/card và không phải spacing scale tổng quát.
- Giữ `0`, tỷ lệ, `calc()`, kích thước dựa trên dữ liệu và vị trí runtime khi chúng biểu diễn hình học/thao tác, không phải lựa chọn spacing tùy tiện.

Các pattern numeric hiện được giữ có chủ đích: danh sách dữ liệu `WatchlistPage` dùng gap12px, top12px và trailing24px để thay margin từng card; filter band giữ padding nội bộ20px riêng. `P2PFraudPreventionPage` giữ gap21px của nội dung giáo dục, top16px; trailing44px thay chuỗi padding16 + gap21 + spacer8 (45px cũ, chủ ý giảm1px). Đây là spacing theo vùng, không phải gutter thứ hai. `tests/e2e/layout-migration.spec.ts` đo hai phía breakpoint768/1024 ở light/dark; không suy rộng thành mọi route/viewport.

`page-layout-contract.test.ts` kiểm page inventory bằng import/JSX alias và danh sách owner ngoại lệ phải còn hiệu lực. `design-system-legacy-guard.test.ts` giữ baseline đo được4 consumer typography legacy,2 consumer Fibonacci spacing,1 consumer CTA color override và95 mảnh selector CSS theo class shape; không tăng vi phạm mới. Các baseline là nợ cần giảm theo C06.14/C06.15, không phải mẫu thiết kế được duyệt. Thêm ngoại lệ hoặc đổi public contract phải qua quy trình review/CODEOWNERS hiện có, có lý do, phạm vi, test và điều kiện xem lại. Full CI còn chạy AST changed-code guard hiện có tại `scripts/check-design-system-diff.mjs`; guard tự động không thay review về semantics, dynamic consumers hay UI thật.

### 21.7 PageSection with Labels

**SHOULD**
Khi nhóm các controls/cards trong bottom sheets hoặc toolbox, dùng `PageSection` có label:

```tsx
<PageSection label="Giao dịch" accentColor="var(--tr-info)">
  <Button>Thanh toán</Button>
  <Button>Sổ lệnh</Button>
</PageSection>
<PageSection label="An toàn" accentColor="var(--tr-success-text)">
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

### 21.10 Token ownership và mapping hiện trạng

**Trạng thái:** các đường dẫn và giá trị dưới đây đã được xác nhận trong code ở revision hiện tại. Các quy tắc đặt trong cột “quy định đề xuất” là **PROPOSED**; không tự đổi nhận diện, typography, density hoặc giá trị token trong một lần chuẩn hóa tài liệu.

Repo có một Design System đang được dùng: theme CSS đi qua `useThemeColors`, các helper token và primitives/layout có consumers cùng owner tests. Tuy vậy, đây chưa phải một nguồn chuẩn đã đồng bộ cho mọi nhóm: CSS/TypeScript có các bản đồ song song, escape hatch được expose công khai, và catalog/consumer checks chưa bao phủ đầy đủ. Không gọi component folder hoặc một số CSS variables là bằng chứng hệ thống đã thống nhất.

| Nhóm | Nguồn/implementation hiện tại | Vấn đề hoặc giới hạn đã xác nhận | Quy định/mapping đề xuất | Consumer và cách kiểm chứng |
| ---- | ----------------------------- | ------------------------------- | ------------------------ | --------------------------- |
| Color/theme | `src/styles/theme.css` định nghĩa `--tr-*` trong `:root` và `.light`; `src/shared/hooks/useThemeColors.ts` trả CSS variable cho inline styles; `@theme inline` map một số utility names | `--primary` và `--tr-primary` khác nhau trong `.light`; viền lỗi của `InputField.tsx` dùng `--input-border-error`, nhưng focus shadow vẫn có rgba literal; `button.ts` và `StatusPill.tsx` còn màu literal | **PROPOSED:** giữ `--primary` và `--tr-primary` riêng. CTA/status chỉ chuyển sang semantic role sau khi duyệt đối chiếu cả dark/light vì có thể đổi brand/contrast; đo focus color/contrast riêng trước khi thay shadow | `ThemeProvider`, `Header`, `CTAButton`, `InputField`, `StatusPill`, portal/toast và chart. Chạy `theme-token-contract.test.tsx`, đo computed style cả dark/light tại component và trang tích hợp |
| Spacing/layout | `PageContent.tsx`: top preset 8/12/16/0, gap 8/16/24/32; `pageGutter.ts`: biến gutter dùng chung và fallback20px; Web/Tablet/Responsive shell cấp gutter theo profile; `density.ts`: metrics control/card; `webTokens.ts` + `webConstants.ts`: nhịp desktop; `theme.css`: `--φ-sp-*` 3/5/8/13/21/34/55 | Nhiều thang có vai trò khác nhau; density không phải spacing scale page. Shell wrapper và layout primitive trước đây cộng gutter; shared primitives hiện kế thừa một contract | `PageContent` sở hữu top padding/gap; `TrCard`/field/overlay sở hữu khoảng nội bộ; một shell/layout owner cấp gutter ngang cho mỗi breakpoint. Giữ riêng phone, desktop, full-bleed và data-density theo contract đã đo | `PageContent`, `Header`, `StickyFooter`, Web/Tablet/Responsive shell, TrCard, field/overlay và feature table. Kiểm shell/page computed padding, alignment, overflow tại breakpoint |
| Typography | `src/styles/theme.css` có `--φ-fs-*` và `--tr-text-*`; `src/shared/theme/typography.ts` có `VitTypeScale`/`VitTextRoles`; `legacyTypography.ts` và `webTokens.ts` còn được dùng | CSS, TS semantic roles, legacy scale và web scale không phải một output được sinh chung; role name/value không khớp hoàn toàn. Không có bằng chứng từ test rằng toàn bộ các bản đồ đồng bộ | **PROPOSED:** consumer dùng role hiện có (`textRoleStyle`, `VitTextRoles` hoặc `--tr-text-*`) phù hợp với styling context; không thêm role/value mới trước khi nêu vai trò, theme và consumer. Numeric/financial text được giữ độ chính xác và có thể dùng tabular figures | `InputField`, CTA, market values, `MarketListSections`, `OCOOrderForm`, Web pages. Test typography helper hiện có; thêm parity assertion khi mapping được chốt và review wrap/zoom/locale trên trang |
| Control sizing/density | `src/shared/theme/density.ts`; `src/shared/theme/button.ts`; `CTAButton` dùng subset `compact/standard/hero`; `TrInput` có `compact/standard/hero`; `InputField` có kích thước riêng | Height khác nhau có thật: `density.ts` compact/standard/relaxed/hero/tool = 44/52/58/58/44; `button.ts` = 36/52/58/56/44; `TrInput` = 44/52/64 cho các size của nó | **PROPOSED:** chọn density theo vai trò (tool, data row, standard form, hero); không áp cùng height máy móc. Chỉ hợp nhất API sau khi đối chiếu hit target, responsive, consumer và computed style | `CTAButton`, `InputField`, `TrInput`, `TrCard`, `IconButton`, web table row. Kiểm test owner, target size AA theo ngữ cảnh và thao tác touch/keyboard |
| Radius | `src/styles/theme.css`: `--tr-radius-*` và alias card; `src/shared/theme/radii.ts`: `VitRadii`/`radiusClass`; `TrCard.tsx`: card roles | Utility radius tổng quát từng lệch giá trị TS do mapping Tailwind khác; `TrCard` dùng chung helper để không có bản mapping riêng | `radius` foundation ưu tiên hơn `rounded`; helper trỏ CSS variable đúng key cho các mức hữu hạn; `none/full` giữ utility structural 0/pill (full có thể tính thành CSS infinity). `rounded="sm/md/lg"` dùng `--tr-radius-card-sm/card/card-lg` = 12/16/24px. Giữ API/alias hiện hữu; không dùng tên utility để suy ra số px | Token parity test + unit tests + `tests/e2e/design-system-radii.spec.ts` đo computed radius với CSS build thật ở light/dark; fixture component không thay thế kiểm toàn bộ route |
| Motion | `theme.css` có `--tr-duration-*`/easing; `src/shared/theme/motion.ts` có helper TS tương ứng | Hai biểu diễn cùng xuất hiện nhưng test hiện có kiểm tra các giá trị helper; chưa chứng minh mọi CSS declaration dùng các token đó | **PROPOSED:** CSS và TS dùng cùng giá trị theo tên vai trò; animation không thiết yếu phải theo `prefers-reduced-motion` | `BottomSheetV2`, toast, tabs/transitions. Chạy motion helper test, reduced-motion interaction test và kiểm tra computed animation |
| Shadow, opacity, z-index, breakpoint/container | `colors.ts` có alpha helper; một phần shadow/z-index nằm trong component/theme CSS; desktop shell constants nằm ở `webConstants.ts`; không thấy một catalog chung cho toàn nhóm trong các nguồn trên | Giá trị và stacking context được sở hữu phân tán; thêm global token khi chưa kiểm kê có thể tạo chuẩn giả hoặc che lỗi portal | **PROPOSED:** chỉ tạo token chung khi nhiều consumer có cùng trách nhiệm; giữ z-index cục bộ khi thuộc stacking context riêng và ghi lý do. Không tăng z-index như cách sửa portal/stacking context | Overlay/toast/sheet, sticky header/footer, chart và responsive shell. Kiểm stacking context thực tế, portal, breakpoint liền kề và reduced motion |

Không có token generation pipeline nào được xác nhận ở bước này. CSS runtime variables và TypeScript helpers hiện là các nguồn chỉnh tay riêng theo từng trách nhiệm; khi đồng bộ một mapping, phải có test parity ở cùng thay đổi hoặc giữ rõ hai contract vì semantics khác nhau. `theme-token-contract.test.tsx` là test hữu ích nhưng không phải bằng chứng toàn bộ Design System đã đồng bộ.

### 21.11 Danh mục component dùng chung và ranh giới

Danh mục dưới đây là điểm tra cứu các implementation thật dưới `src/shared/ui/`, không chứng minh mọi route đã dùng đúng component. Tên props/variant cần cập nhật cùng public API; page không sao chép implementation chung để né API hiện có.

| Nhóm/hợp đồng | Implementation và lựa chọn | State/keyboard/test hiện có | Consumer/ràng buộc |
| -------------- | -------------------------- | -------------------------- | ------------------ |
| Hành động | `button.tsx` cho primitive button; `CTAButton.tsx` cho CTA lớn với variant `primary/success/danger/warning/ghost/secondary`, density `compact/standard/hero`, `loading`, `disabled`, `fullWidth`, `label`, `icon`; `IconButton.tsx` có `IconOnlyButton`, `BackButton`, `CloseButton` | `button.test.tsx`, `CTAButton.test.tsx`; CTA test loading/disabled/contrast; `children ?? label` giữ tên khi loading, icon leading 18px là trang trí và không vào accessible name. IconButton không có file owner-test riêng được tìm thấy trong danh mục này | Consumer thật gồm `wallet/pages/AddressAddPage.tsx`, `wallet/pages/DustConverterPage.tsx`, `wallet/components/WithdrawSections.tsx`. Dùng CTA cho action cần contract màu/loading; icon-only phải có label. `bg`/`textColor` giữ tương thích cho `wallet/pages/WalletTransactionHistoryContractPage.tsx` tới migration C06.15; không thêm consumer mới. `className`/`style` chỉ tùy chỉnh layout ngoài hoặc ngoại lệ có review, không tạo variant nội bộ ngầm |
| Form field | `InputField.tsx` là wrapper quanh native input, nhận label dạng text/composition, helper/error/prefix/suffix và native input props; helper/error nối qua `aria-describedby`. `TrInput.tsx`/`TrTextarea` có size/variant, controlled value, numeric formatting, clearable/readOnly | `InputField.test.tsx`, `TrInput.test.tsx`, `form.test.tsx`; kiểm tra label/helper/error association, focus, numeric/password và change/blur | Consumer thật gồm `auth/pages/LoginPage.tsx`, `wallet/pages/AddressAddPage.tsx`, `wallet/pages/WalletTransferContractPage.tsx` (số tiền raw precision, giữ native number constraints), `wallet/components/WithdrawSections.tsx`, `p2p/pages/P2PPaymentMethodAddPage.tsx` (InputField) và `p2p/components/P2PMarketplaceSections.tsx` (TrInput có numeric formatting). Giữ API khi semantics khác; không đổi payload, precision, autocomplete, inputMode hoặc readonly/disabled. **PROPOSED:** consumer cục bộ chỉ tùy chỉnh nội dung đặc thù; kích thước, border, focus và cấu trúc wrapper do primitive sở hữu |
| Card/surface | `TrCard.tsx`, variants `standard/hero/inner/ghost`, `as`, density, radius/padding, optional hover | `TrCard.test.tsx` kiểm variant, element, keyboard khi `as="button"`, ARIA và overrides | Consumer thật gồm `arena/pages/ArenaDiscoveryPage.tsx`, `wallet/components/WithdrawSections.tsx`. Giữ consumer nghiệp vụ riêng; ưu tiên variant/density đã có. Không dùng `as="button"` nếu bên trong có control tương tác khác |
| Layout/navigation | `PageLayout.tsx`, `PageContent.tsx`/`PageSection`; `Header.tsx`; `pageGutter.ts`; `TabBar.tsx`; `Breadcrumb.tsx`; app `Header` adapter trong `src/app/components/layout/` | `PageLayout.test.tsx`, `PageContent.test.tsx`, shell integration tests, `Header.test.tsx`, `TabBar.test.tsx`, `Breadcrumb.test.tsx` kiểm contract/boundary khác nhau; browser gutter matrix ở `tests/e2e/production-shell.spec.ts` đo actual route/computed style | Consumer thật gồm `wallet/components/WithdrawSections.tsx`, `launchpad/pages/LaunchpadContractPages.tsx`, `predictions/pages/PredictionRiskCalculatorPage.tsx`. Web/Tablet/Responsive shells cấp gutter; full-bleed/Web auth, phone và centered shell giữ contract riêng. Đo lại consumer khi đổi shell owner |
| Overlay/confirmation | `BottomSheetV2.tsx` có `bottom/center`, close guards, max-height và custom header; `ConfirmationDialog.tsx` composition dùng center sheet; `dialog.tsx` là primitive riêng | `BottomSheetV2.test.tsx` kiểm Escape, focus trap/restore cả khi consumer unmount, StrictMode, dialog lồng/tiếp nối, nền không nhận focus, prevent-close và reduced motion; `ConfirmationDialog.test.tsx` kiểm phần content hiện có | Consumer thật gồm `dca/pages/DCAMainPage.tsx`, `wallet/pages/DustConverterPage.tsx`, `wallet/pages/AddressBookPage.tsx`, `earn/components/EarnFeatureComponents.tsx`, `p2p/components/P2PCreateAdSections.tsx`, `p2p/pages/P2PAdDetailContractPage.tsx`, `p2p/pages/P2PMyAdsContractPage.tsx`. Form Earn/P2P giữ dữ liệu/validation/callback tại feature và truyền mutation pending vào `preventClose`; lỗi của modal đang mở phải nằm trong modal. Confirmation P2P giữ nút Hủy ở footer, khóa khi pending; header không thêm action đóng trùng. Dùng `ConfirmationDialog` khi public API đáp ứng trạng thái cần có; form xác nhận có permission/pending/error riêng compose `BottomSheetV2`, không copy lifecycle focus hoặc thêm modal primitive. Không tự tạo modal không có vòng đời focus |
| Feedback/data display | `EmptyState.tsx`, `ErrorState.tsx`, `SkeletonBlock.tsx`, `RefreshableSkeletonList.tsx`, `OfflineBanner.tsx`, `ThemedToaster.tsx`, `StatusPill.tsx`, `InfoRow.tsx`, `StatCard.tsx`, `SearchBar.tsx` | Có owner test cho EmptyState, Error/StatusPill/Toaster (`ui-primitives.test.tsx`), Skeleton, OfflineBanner, SearchBar, InfoRow; coverage theo hành vi không đồng đều | Consumer thật của empty/error gồm `admin/pages/AdminAbTestsContractPage.tsx` và `dca/pages/SavingsDCAContractPage.tsx`. Dùng empty/no-results/error/loading đúng ngữ nghĩa; feature giữ copy/domain content. `StatusPill` preset và custom color không thay thế accessible text/status semantics |
| Data table/pagination | Không tìm thấy module `Table`/`Pagination` trong `src/shared/ui/` inventory hiện tại | Chưa có shared owner-test tương ứng tại đường dẫn đó | Giữ bảng feature-owned cho tới khi cùng hành vi/keyboard/sort/page contract được chứng minh; không tạo catalog component chỉ để đồng dạng hình thức |

`CTAButton` giữ class định danh `vit-cta-button` khi consumer truyền class bố cục. Các adapter class-shape cho nút full-width/navigation ở `theme.css` phải loại canonical CTA khỏi base/hover/active selectors; không để filter hoặc transform tự suy từ tên utility đổi hợp đồng màu của variant. Gradient/foreground vẫn do `shared/theme/button.ts` sở hữu; keyboard focus và ripple hiện có được giữ. `CTAButton.test.tsx` kiểm marker và ranh giới CSS, `tests/e2e/ui-cta-interaction-mock.spec.ts` kiểm default/hover/focus-visible/active trên consumer P2P Guide thật ở Phone/Web, CSS sáng/tối. Phép đo dùng renderer CSS riêng với background, foreground, filter và press overlay đã resolve; ảnh sản phẩm không bị thay/mask. Đây là technical sample, không phải WCAG hay nghiệm thu mọi consumer.

`TrCard` dùng marker `data-slot="tr-card"` cho selector/test ổn định; không chọn card theo `.rounded-*` và không dùng marker `card` vốn có CSS hover riêng. Radius không quyết định hover: dùng public prop `hover`. `TrCard as="button"` tiếp tục `type="button"`; không dùng card làm nút submit. `contentAlign`, density và callback được giữ nguyên.

**PROPOSED — quy tắc chọn và mở rộng:** ưu tiên component theo hành vi/semantics, không theo lượt import. Nếu API hiện tại thiếu nhu cầu lặp lại, mở rộng variant/composition đúng owner rồi kiểm tra consumer. CSS cục bộ được phép cho layout/domain visualization; thay màu, focus, control height, padding hoặc interaction nội bộ phải đi qua public prop/variant được test. Component nghiệp vụ không đẩy API/quyền/backend ngược vào primitive.

Ví dụ sửa tài liệu dựa trên implementation thật (chưa thay đổi code UI):

```tsx
// Tài liệu cũ nói back tự bật breadcrumb; implementation chỉ bật khi breadcrumb=true.
<Header title="Trading Bots" back />

// Dùng API đúng khi trang thực sự cần breadcrumb.
<Header title="Trading Bots" back breadcrumb />
```

`PageSection.headingLevel` chuyển tiếp hợp đồng semantic level của SectionHeader; mặc định h3 được giữ để không đổi consumer hiện hành. Trang chọn level theo cấu trúc nội dung, không theo cỡ chữ. Market Home dùng level 2 sau page title h1; typography không đổi.

Market Home giữ pattern hàng quote gọn riêng cho summary cards; không đồng nhất với MarketItem có sparkline/favorite. Hàng quote dùng native Link và cùng URL formatter, accessible name chứa đủ symbol/giá. Nội dung được wrap theo độ rộng card bằng flex max-content basis; khi thiếu chỗ giá xuống dòng, không cắt hoặc giảm precision để vừa bố cục. Regression tại `tests/e2e/ui-market-home-mock.spec.ts` kiểm text bounds, hai phía breakpoint, hai theme, text spacing/resize, keyboard và route Back qua MSW development. Đây là kiểm kỹ thuật, không thay AT/UAT hoặc nghiệm thu toàn bộ UI.

Development preview giữ cảnh báo dữ liệu mô phỏng. Shell sở hữu vị trí cảnh báo qua `shared/ui/layout/PreviewChromeSlot.tsx` và `preview-chrome-context.ts`; `RootLayout.tsx` giữ một host và truyền `portalHost` cho `dev/PreviewControls.tsx`. Controls giữ state/behavior mock và portal nội dung vào host; shared/app không import dev. Khi không được inject controls, slot không tạo DOM hoặc khoảng trống. Phone `AppLayout` đặt slot dưới status bar, bỏ spacer dưới 132px; cảnh báo thu gọn chiếm chỗ trong flow, panel mở là disclosure overlay có chủ đích, không đẩy nội dung trang. `tests/e2e/ui-preview-phone-chrome-mock.spec.ts` kiểm CTA DCA bằng click thật/keyboard, panel, frame bounds và draft tại 320/390/440/767px, CSS sáng/tối. Đây là bằng chứng local/MSW, không thay AT/UAT.

Nút disclosure preview phải giữ kích thước giữa trạng thái mở/thu gọn: hai nhãn cùng đo trong một ô grid, chỉ nhãn đang dùng được vẽ; accessible name giữ ở nút và chứa nhãn nhìn thấy. Không cố định chiều cao cảnh báo hoặc cắt chữ để tránh reflow. Regression kiểm vị trí title/warning/trigger bằng nhau khi mở/đóng tại 320px, CSS sáng/tối và bảy mức letter-spacing 0–0,12em; text vẫn được phép wrap theo viewport.

Trong rollout hiện tại, các nhánh thông thường (ngoài Auth) của Tablet/Web/Responsive chưa đăng ký host và tiếp tục adapter vị trí cũ: Root truyền `bottomNavigationVisible`, preview chừa phía trên navigation khi cần, độc lập với typography hẹp/rộng. Responsive còn navigation dưới ở 768–1023px, Tablet dùng sidebar; không suy navigation chỉ từ ngưỡng 768px. `tests/e2e/ui-preview-navigation-mock.spec.ts` giữ regression cho adapter này. Các shell còn lại cần chuyển cùng contract host trong lát cắt C06.13 tiếp theo; adapter không trở thành nguồn placement độc lập lâu dài. Không đổi navigation hoặc business contract của sản phẩm.

Preview host cũng áp dụng ở `AuthLayout` sau StatusBar (Phone/Tablet/Responsive) và nhánh Auth riêng của `WebShell`; không thêm provider xác thực. Root giữ một instance controls và chuyển portal vào host đang hoạt động; khi không có development controls, slot không tạo DOM hay khoảng trống. Panel mở dùng vị trí host và visual viewport thực tế để giới hạn chiều cao, tự cập nhật khi resize/scroll của visual viewport; mở panel không đẩy nội dung hoặc làm mất draft. Preview là chrome không modal ở lớp 50, dưới modal 60: cảnh báo vẫn được mount trong mock nhưng không được vẽ đè lên tiêu đề, nội dung hoặc nút đóng modal. Kiểm tra cả paint order/ảnh và pointer vì nền inert có thể làm `elementFromPoint` bỏ qua lớp đang che. Không tăng z-index của modal để vá preview. `tests/e2e/ui-preview-hosts-mock.spec.ts` kiểm Auth, panel resize và modal thấp; đây là mẫu Chrome/MSW, không phải xác nhận bàn phím ảo hay mọi browser.

Wallet transfer nối lỗi số tiền tại `getWalletTransferValidationError` (`features/wallet/model/validate-wallet-transfer.ts`) vào public prop `InputField.error`, giữ helper, accessible description và đưa focus về ô sai. Lỗi API/quyền vẫn là thông báo chung; không đánh dấu số tiền sai khi dịch vụ lỗi. API chuỗi `validateWalletTransfer` tiếp tục dùng cùng một validator để giữ tương thích. Regression tại `tests/e2e/ui-wallet-transfer-mock.spec.ts` kiểm form, payload/idempotency fixture, hit target CTA và giữ draft khi resize; đây là bằng chứng local/MSW, không xác nhận kết quả giao dịch backend.

DCA dùng `shared/ui/CTAButton.tsx` cho nút mở/tạo kế hoạch, xác nhận xóa và Quay lại khi feature flag tắt; Hủy dùng variant `secondary`, Xóa dùng `danger`. `DCACreatePlanSheet.tsx` dùng `InputField` với nhãn, helper và lỗi nối bằng public API; group coin/tần suất dùng `fieldset`/`legend`, nút native có `aria-pressed`, Tab/Shift+Tab và Enter/Space. Control dùng density standard 52px; consumer chỉ giữ chiều rộng/vị trí ngoài, không override màu, padding hay focus nội bộ. Mức tối thiểu 10.000 VND là quy tắc UI đang có, được dùng chung cho lỗi field và điều kiện disable; không suy mức này từ OpenAPI `exclusiveMinimum: 0` hoặc đổi payload. Chỉ confirmed success mới reset draft; đóng/hủy hoặc kết quả chưa xác nhận phải giữ intent. `tests/e2e/ui-dca-controls-mock.spec.ts` kiểm bốn shell × CSS sáng/tối, thêm Phone 320px, bàn phím, nhãn/lỗi/focus, ngưỡng, hủy và Back từ nhánh tắt cờ về entry Markets thật trong browser history; `ui-dca-create-intent-mock.spec.ts` giữ kiểm chứng retry/idempotency fixture. Không coi các mẫu này là nghiệm thu toàn trang DCA, theme persistence hoặc backend.

Hero DCA (`features/dca/components/DCAOverviewCard.tsx`) giữ `TrCard`/portfolio surface hiện có. Số dư và metric thông tin dùng `text1`; P&L và count trạng thái dùng `successText`/`errorText`/`warningText` trên nền đục `surface2` để không bị tint/gradient phía dưới làm giảm contrast; caption dùng `portfolioTextMuted`. Không dùng màu primitive sáng cố định cho chữ trên gradient hoặc giảm opacity của phần trăm P&L. Màu lãi/lỗ phải đi cùng dấu và icon; không đổi formatter, precision hay công thức để làm UI gọn hơn. Badge count nhỏ của feature tiếp tục riêng vì khác hợp đồng label/count/density của `StatusPill`; không sao chép primitive mới. `tests/e2e/ui-dca-hero-text-mock.spec.ts` đo nền CSS render và foreground danh định tại ROI chữ thật cho Phone/Web, sáng/tối, fixture lãi/lỗ và ba trạng thái, đồng thời giữ ẩn/hiện số dư và không gửi mutation. Phép đo này không bao phủ SVG/overlap, glyph antialias, toàn trang hay chứng nhận WCAG; font lớn áp 3:1, chữ thường 4,5:1.

Bố cục hero DCA thích ứng theo bề rộng container: cụm số có flex basis 16rem, chart giữ kích thước/dữ liệu và tách hàng khi không đủ chỗ; số đầy đủ và P&L được wrap, không ellipsis hoặc giảm precision để nhường chart. Grid ba metric dùng auto-fit với minimum min(100%, 7.5rem), tự thành một/hai/ba cột; class contract `DCA_METRIC_GRID_CLASS_NAME` trong `DCAOverviewCardVisuals.tsx` dùng chung cho dữ liệu và skeleton để giữ số cột/kích thước ô khi tải; không suy parity grid thành toàn bộ card không có layout shift; minimum này thuộc layout owner để chứa icon/nhãn/help và số, không phải token spacing dùng chung. Lịch mua có basis 12rem và nhóm count được xuống hàng độc lập khi hẹp. `tests/e2e/ui-dca-hero-layout-mock.spec.ts` kiểm vùng chữ số không giao chart, không tràn ô metric/ellipsis boundary, đủ ba metric, giữ giá trị/ẩn-hiện và không gửi mutation; bao gồm Phone 320/390/440, Tablet, Web, Responsive hai phía 376/768/1024, sáng/tối và fixture số dài/lỗ/không có lịch. Đây là kiểm chứng từng phần của component, không phải toàn bộ route/state/browser/AT hay nghiệm thu người dùng.

Auth dùng `features/auth/lib/login-return-path.ts` để đọc `location.state.from` của ProtectedRoute hoặc `returnTo` của Web session-expired. Chỉ nhận URL cục bộ, giữ nguyên query/hash và precision trong URL; đích ngoài origin, đường dẫn lỗi hoặc vòng lặp Auth/Onboarding quay về home của shell. ProtectedRoute giữ prefix phone/tablet/web/responsive khi đưa tới login. Login và login-MFA truyền cùng context qua OTP, lỗi mã, restart sau 429 và hết hạn; chỉ quay về đích khi xác thực thành công. Không truyền context này vào luồng đăng ký hoặc thay API/session/permission contract. `tests/e2e/ui-auth-return-mock.spec.ts` kiểm qua development MSW; đây không phải bằng chứng backend hoặc chính sách hủy request khi rời form.

`BottomSheetV2` giữ focus khi chuyển sang `preventClose`: nếu control đang có focus bị disabled hoặc focus rơi về `body`, primitive đưa focus về panel để Tab/Shift+Tab không đi ra nền. Không lấy focus khỏi field còn hoạt động hoặc dialog con; panel đang ẩn hay inert không được nhận focus. Consumer vẫn sở hữu trạng thái disabled, request, dữ liệu nhập và phản hồi lỗi; `preventClose` không tự vô hiệu hóa field nghiệp vụ. Regression nằm tại `src/shared/ui/BottomSheetV2.test.tsx` (bottom/center, StrictMode, field hợp lệ, dialog con) và các ca pending trong `tests/e2e/ui-earn-modal-mock.spec.ts` (keyboard, close guards, payload, draft và retry key).

`ThemedToaster` sở hữu theme và lớp của container; Sonner sở hữu z-index, vị trí, xếp chồng/mở rộng, animation và reduced motion của từng toast. Không đặt cùng z-index cho mọi item hoặc dùng keyframe global có `forwards` ghi đè transform của item. Consumer dùng public toast API cho nội dung/thời lượng hợp lệ, không sửa các giá trị nội bộ để vá một trang. Gradient phải giữ `background-color` surface đục; không dùng shorthand làm mất nền cơ sở. Kết quả axe `bgGradient` chưa đủ để nghiệm thu: phải đối chiếu từng node bằng phép đo gradient render từ computed style, không che hoặc sửa UI để lấy kết quả; loại `incomplete` khác vẫn bị chặn. `tests/e2e/ui-toast-stack-mock.spec.ts` kiểm tra 1/3/4 thông báo, mở rộng bằng pointer, theme từ control thật, focus của modal và reduced motion.

FAB cuộn đầu trang (`app/components/mobile/ScrollToTopFAB.tsx`) nằm tuyệt đối trong khung Phone của `AppLayout`, giữ vùng chạm 40px và nhận diện hiện có. Owner dành khoảng trống 96px cho navigation, thêm một hàng CTA standard từ `shared/theme/button.ts` và gap 16px; đây là contract utility hiện tại, không phải cách xử lý mọi footer nhiều hàng. Khi ẩn, nút phải disabled, không nằm trong cây accessibility hoặc thứ tự Tab; khi hiện, không ghi đè pointer isolation của modal bằng `pointer-events: auto`. `useScrollPosition` đọc reduced motion tại lúc kích hoạt, dùng cuộn `auto` hoặc `smooth` theo lựa chọn hiện tại. Toast nhận focus bằng Alt+T/Tab phải có outline chung trong `styles/theme.css`, giữ shadow/radius và cơ chế stacking của Sonner. `tests/e2e/ui-floating-controls-mock.spec.ts` kiểm khung Phone 390/767 và viewport thấp 568×320, sáng/tối, hai motion mode, CTA hit/clearance, modal isolation, scroll thật và focus toast Phone/Web. Đây là mẫu Chromium/MSW; chưa thay thế matrix route/footer, công nghệ trợ giúp hay nghiệm thu visual của người dùng.

Màu từ `shared/hooks/useThemeColors.ts` là CSS variable: không nối trực tiếp hậu tố hex alpha. Dùng `withAlpha` trong `shared/theme/colors.ts`; ưu tiên `ALPHA` theo vai trò đã có, giữ suffix riêng khi cần bảo toàn contract hiện tại và ghi lý do. `IntegrationPendingPage` giữ suffix `18` của nền icon, theo quy tắc làm tròn hiện có của helper thành 9%; không đổi màu `buy`, kích thước hoặc ranh giới chờ backend. `tests/e2e/ui-integration-boundary-mock.spec.ts` đo alpha paint từ computed style và đối chứng CSS không hợp lệ, kiểm standalone `/onboarding` cùng mẫu convert trong bốn shell, sáng/tối. Các route pending vẫn giữ boundary và thông báo; không thay chúng bằng implementation legacy hoặc coi phép đo nền icon là nghiệm thu toàn template.

`features/dca/components/DcaPlanCoinIcon.tsx` sở hữu ảnh coin và fallback của ba consumer DCA: picker, plan card và contract page. Tái sử dụng helper feature đã có, không import adapter `app/components/figma` ngược vào feature hoặc tạo primitive chung mới. Ảnh hợp lệ giữ URL, kích thước 24/28/32px, accessible name/decorative semantics, loading và referrer policy của consumer. Khi lỗi hoặc source không phải ảnh, hiển thị symbol cục bộ trong cùng box; không gọi dịch vụ avatar khác hoặc retry source đã lỗi. Source mới có state riêng theo key; sự kiện lỗi từ ảnh cũ không làm hỏng ảnh mới. Consumer không tự gán lại `img.src` trong `onError`. Đây là contract tài nguyên/khả năng truy cập, không đổi API, dữ liệu, formatter, quyền hay business rule DCA.

Normal routes của `TabletShell`, `WebShell` và `ResponsiveAppLayout` cũng đặt `PreviewChromeSlot` trong cột shell, dưới top/status/command bar và trước vùng nội dung cuộn. Cảnh báo thu gọn chiếm chỗ trong flow, không đè CTA; panel mở vẫn là disclosure overlay có chủ đích và không làm tăng chiều cao host. Auth Tablet/Responsive giữ host của `AuthLayout`, Web Auth giữ nhánh host riêng; mỗi surface chỉ có một host đang hoạt động. Không inject controls thì slot không tạo DOM hoặc khoảng trống, kể cả production-shaped render. Responsive dùng clearance 80px cộng safe-area khi có bottom navigation, 0 ở adaptive desktop. Trang thường dành khoảng trống tại cột shell để vùng cuộn kết thúc phía trên chrome; padding chỉ nằm bên trong scroller không ngăn focus/auto-scroll tới dưới nút nổi. Auth giữ viewport/scroller riêng của `AuthLayout` và reserve bên trong như contract cũ, tránh cắt disclosure ở viewport thấp. Giữ nguyên Outlet ancestry, gutter, API, quyền và dữ liệu nhập; dùng unit `PreviewChromeShells.test.tsx` và browser `ui-preview-shell-chrome-mock.spec.ts`, `ui-wallet-transfer-mock.spec.ts` để kiểm host, hit target, panel và trạng thái form.

### 21.12 Quy trình AI, ngoại lệ và cập nhật contract

**PROPOSED — MUST trước khi AI tạo/sửa trang:**

1. Đọc quy định áp dụng trong `AGENTS.md`, `docs/ai/WORKFLOW.md`, `guidelines/Guidelines.md` và hướng dẫn gần module; tìm route/pattern tương đương.
2. Tra token, layout và public component API theo các đường dẫn ở §§21.10–21.11; xác định shell, theme, locale, role và viewport ảnh hưởng.
3. Liệt kê component/layout/token sẽ tái sử dụng; tìm trong repo và đọc call site/test trước khi kết luận thiếu.
4. Dùng component sẵn có. Nếu chưa đáp ứng nhu cầu lặp lại, ưu tiên thêm variant/composition tại owner rồi kiểm tra mọi consumer bị ảnh hưởng.
5. Chỉ tạo component mới khi trách nhiệm hoặc hành vi khác nhau đã được chứng minh; nêu owner layer, public contract và consumer dự kiến.
6. Không copy component chung, tự định nghĩa lại token/layout tại page hoặc dùng selector/override xuyên tầng để lách public API.
7. Kiểm tra trạng thái áp dụng, responsive tại breakpoint liên quan, keyboard/focus, accessible name/error association, theme/locale và luồng nghiệp vụ chịu tác động.
8. Khi public contract đổi, cập nhật đúng tài liệu chính và test/example của owner cùng thay đổi; không tạo bản quy định song song.

**PROPOSED — ngoại lệ:** hồ sơ ngoại lệ nêu lý do sản phẩm, route/consumer, phần contract khác, rủi ro, test/ảnh đo cần review và điều kiện xem xét lại. Dùng quy trình PR/owner review đã có trong repository; không tự gán tên nhóm/người phê duyệt. Nếu chưa tìm thấy owner phù hợp, ghi nhận reviewer còn thiếu và không coi ngoại lệ là chuẩn chung.

Hướng dẫn AI cấp repository nên liên kết tới tài liệu này, không sao chép lại token table/component catalog. Các đoạn mang nhãn **PROPOSED** chưa trở thành quyết định thiết kế được duyệt cho tới khi đi qua review hiện có.
