/**
 * ══════════════════════════════════════════════════════════
 *  09E — Connected Ecosystem Production Ready
 * ══════════════════════════════════════════════════════════
 *  Consolidates all 09A–09D bridge work into production-ready
 *  canonical versions, state matrix, E2E flows, registry &
 *  handoff pack.
 *
 *  Target: PM, Designer, Dev, QA — NOT end-user facing.
 *  Route: /arena/connected-ecosystem
 *
 *  5 Sections:
 *  1. Canonical Connected Screens
 *  2. Bridge State Matrix
 *  3. Connected End-to-End Flows
 *  4. Shared vs Separate Registry + Forbidden UX Patterns
 *  5. Dev / QA Handoff Pack
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, CheckCircle2, Clock, AlertTriangle, Shield,
  FileText, BookOpen, Layers, Map, Package, Eye, EyeOff,
  ArrowRight, XCircle, WifiOff, Ban, Flag, Lock, Zap,
  Link2, Target, Gamepad2, Check, X, Info, ExternalLink,
  OctagonAlert, Unlink, RefreshCw, Archive,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════ */

type SectionId = '1' | '2' | '3' | '4' | '5';

const SECTION_TABS: { id: SectionId; label: string; icon: typeof FileText }[] = [
  { id: '1', label: 'Canonical', icon: Layers },
  { id: '2', label: 'States', icon: AlertTriangle },
  { id: '3', label: 'E2E Flows', icon: Map },
  { id: '4', label: 'Registry', icon: Package },
  { id: '5', label: 'Handoff', icon: FileText },
];

/* ─── Section 1: Canonical Connected Screens ─── */

type ScreenStatus = 'vFinal' | 'live' | 'needs_review' | 'archived';

interface CanonicalScreen {
  name: string;
  route: string;
  status: ScreenStatus;
  bridgeComponents: string[];
  source: string; // which 09 module contributed
  notes: string;
}

const STATUS_CFG: Record<ScreenStatus, { bg: string; color: string; label: string }> = {
  vFinal: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'vFinal' },
  live: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'Live' },
  needs_review: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Needs Review' },
  archived: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', label: 'Archived' },
};

const CANONICAL_SCREENS: CanonicalScreen[] = [
  {
    name: 'HomePage_vFinal_Connected',
    route: '/',
    status: 'vFinal',
    bridgeComponents: ['HomeDiscoverySection'],
    source: '09B',
    notes: 'Discovery cards cho Predictions & Arena. Mỗi card có disclosure badge rõ module. Không merge metrics.',
  },
  {
    name: 'ProfilePage_vFinal_Connected',
    route: '/profile',
    status: 'vFinal',
    bridgeComponents: ['ProfileModuleBlocks', 'DualModuleStatCard'],
    source: '09A + 09B',
    notes: 'Dual surface tách biệt: Prediction Portfolio (PnL, positions) vs MyArena (points, rooms, trust). Stats KHÔNG BAO GIỜ gộp.',
  },
  {
    name: 'MarketListPage_vFinal_Connected',
    route: '/markets',
    status: 'vFinal',
    bridgeComponents: ['DiscoverMoreSection'],
    source: '09B',
    notes: '"Khám phá thêm" section cuối page. Safe bridge dẫn đến Predictions hoặc Arena, có disclosure.',
  },
  {
    name: 'PredictionsHomePage_vFinal_Connected',
    route: '/markets/predictions',
    status: 'vFinal',
    bridgeComponents: ['TopicChipBar (shared taxonomy)'],
    source: '09A',
    notes: 'Topic chips dùng shared taxonomy. Discovery card Arena ở cuối — badge "Points only".',
  },
  {
    name: 'PredictionEventDetailPage_vFinal_Connected',
    route: '/markets/predictions/event/:id',
    status: 'vFinal',
    bridgeComponents: ['ArenaRelatedRoomsSection', 'ArenaBridgeConfirmSheet (09D)', 'mapCategoryToTopic'],
    source: '09B + 09C + 09D',
    notes: 'Arena rooms bridge section + CTA "Tạo Arena từ event này" → confirmation sheet → navigate to ArenaStudio with prediction context.',
  },
  {
    name: 'ArenaHomePage_vFinal_Connected',
    route: '/arena',
    status: 'vFinal',
    bridgeComponents: ['PredictionInsightSection'],
    source: '09B',
    notes: 'Prediction insight section ở cuối: "Thị trường đang nói gì?" card → dẫn đến Predictions. Badge "Market context only".',
  },
  {
    name: 'ArenaStudioPage_vFinal_Connected',
    route: '/arena/studio',
    status: 'vFinal',
    bridgeComponents: ['BridgeSourceBar', 'ModuleBoundaryBanner', 'Bridge Safety Snapshot (Step5)', 'Linked Event rows (Step6)'],
    source: '09D',
    notes: 'Khi mở từ Prediction: BridgeSourceBar top, Step1 suggest templates, Step3 prefill, Step4 resolution warning, Step5 safety snapshot, Step6 linked event + CTA "Mở room Arena".',
  },
  {
    name: 'ArenaModeDetailPage_vFinal_Connected',
    route: '/arena/mode/:id',
    status: 'vFinal',
    bridgeComponents: ['PredictionContextCard', 'mapArenaTagToTopic'],
    source: '09C',
    notes: 'Nếu mode có tags liên quan prediction topic → hiển thị PredictionContextCard với CTA "Xem thị trường dự đoán".',
  },
  {
    name: 'ArenaChallengeDetailPage_vFinal_Connected',
    route: '/arena/challenge/:id',
    status: 'vFinal',
    bridgeComponents: ['PredictionContextCard', 'LinkedSourceCard (09D)', 'ModuleBoundaryBanner', 'BoundaryInfoRow', '"Hiểu ranh giới" sheet'],
    source: '09C + 09D',
    notes: 'Prediction context bridge + Linked source card cho rooms từ Prediction. "Hiểu ranh giới" info sheet. Disclosure: "Kết quả room Arena không phải kết quả trade."',
  },
];

/* ─── Section 2: Bridge State Matrix ─── */

type BridgeStateType =
  | 'linked_available'
  | 'linked_unavailable'
  | 'stale_context'
  | 'no_arena_rooms'
  | 'no_prediction_events'
  | 'bridge_disabled'
  | 'context_removed'
  | 'verified_locked';

interface BridgeState {
  id: BridgeStateType;
  label: string;
  description: string;
  icon: typeof Link2;
  color: string;
  affectedScreens: string[];
  behavior: string;
}

const BRIDGE_STATES: BridgeState[] = [
  {
    id: 'linked_available',
    label: 'Linked context available',
    description: 'Bridge context tồn tại và valid. Hiển thị đầy đủ bridge card + disclosure.',
    icon: Link2,
    color: '#10B981',
    affectedScreens: ['PredictionEventDetail', 'ArenaStudio', 'ArenaChallengeDetail', 'ArenaModeDetail'],
    behavior: 'Show bridge card, context bar, related rooms/events. Disclosure badge luôn hiện.',
  },
  {
    id: 'linked_unavailable',
    label: 'Linked context unavailable',
    description: 'Event/room nguồn không còn tồn tại hoặc bị xoá.',
    icon: Unlink,
    color: '#EF4444',
    affectedScreens: ['ArenaChallengeDetail (linked source)', 'ArenaStudio (BridgeSourceBar)'],
    behavior: 'Show fallback card: "Event gốc không còn khả dụng." Disable "Xem event gốc" CTA. Giữ room/challenge hoạt động bình thường.',
  },
  {
    id: 'stale_context',
    label: 'Stale context',
    description: 'Context đã quá cũ hoặc event đã resolved/expired.',
    icon: Clock,
    color: '#F59E0B',
    affectedScreens: ['ArenaChallengeDetail', 'ArenaStudio'],
    behavior: 'Show warning chip "Context cũ" trên bridge card. Room/challenge vẫn hoạt động. CTA "Xem event gốc" vẫn navigate nhưng event sẽ ở trạng thái resolved.',
  },
  {
    id: 'no_arena_rooms',
    label: 'No related Arena rooms',
    description: 'Prediction event không có rooms Arena nào liên quan qua shared topic.',
    icon: Gamepad2,
    color: '#94A3B8',
    affectedScreens: ['PredictionEventDetail'],
    behavior: 'Ẩn hoàn toàn ArenaRelatedRoomsSection. CTA "Tạo Arena từ event này" vẫn hiển thị — user có thể tạo room đầu tiên.',
  },
  {
    id: 'no_prediction_events',
    label: 'No related Prediction events',
    description: 'Arena mode/challenge không có events Prediction nào match topic.',
    icon: Target,
    color: '#94A3B8',
    affectedScreens: ['ArenaChallengeDetail', 'ArenaModeDetail'],
    behavior: 'Ẩn PredictionContextCard. Ẩn "Hiểu ranh giới" link. Room hoạt động bình thường.',
  },
  {
    id: 'bridge_disabled',
    label: 'Bridge disabled',
    description: 'Feature flag tắt bridge — maintenance hoặc chưa launch.',
    icon: Ban,
    color: '#94A3B8',
    affectedScreens: ['All connected screens'],
    behavior: 'Ẩn toàn bộ bridge sections. Không hiện error hay empty — chỉ đơn giản không render bridge components. App hoạt động như trước 09A.',
  },
  {
    id: 'context_removed',
    label: 'Context removed by user',
    description: 'User bấm "Bỏ liên kết" trên BridgeSourceBar trong ArenaStudio.',
    icon: X,
    color: '#6B7280',
    affectedScreens: ['ArenaStudio'],
    behavior: 'Ẩn BridgeSourceBar. Steps trở về trạng thái bình thường (không prefill, không suggest). predictionCtx = null. User có thể tiếp tục tạo room thường.',
  },
  {
    id: 'verified_locked',
    label: 'Verified future locked',
    description: 'Bridge features chưa mở cho verified/future screens.',
    icon: Lock,
    color: '#8B5CF6',
    affectedScreens: ['VerifiedChallengesPage'],
    behavior: 'Hiện placeholder message: "Tính năng kết nối sẽ sớm được hỗ trợ cho thử thách xác minh." Không navigate, không CTA.',
  },
];

/* ─── Section 3: Connected E2E Flows ─── */

interface FlowStep {
  label: string;
  route: string;
  description: string;
  isBridge?: boolean;
}

interface ConnectedFlow {
  id: string;
  name: string;
  color: string;
  icon: string;
  steps: FlowStep[];
}

const CONNECTED_FLOWS: ConnectedFlow[] = [
  {
    id: 'prediction_to_arena',
    name: 'Prediction → Arena Studio',
    color: '#F59E0B',
    icon: '🔗',
    steps: [
      { label: 'Home', route: '/', description: 'Discovery section → tap Predictions card' },
      { label: 'PredictionsHome', route: '/markets/predictions', description: 'Browse events, filter by topic' },
      { label: 'EventDetail', route: '/markets/predictions/event/:id', description: 'Xem event, scroll đến Arena section' },
      { label: 'ConfirmSheet', route: '/markets/predictions/event/:id', description: '09D: "Tạo room Arena từ event này?" — 3 disclosure bullets', isBridge: true },
      { label: 'ArenaStudio', route: '/arena/studio', description: 'BridgeSourceBar top, suggested templates, prefill context', isBridge: true },
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Room created — LinkedSourceCard hiện "Xem event gốc"', isBridge: true },
    ],
  },
  {
    id: 'arena_to_prediction',
    name: 'Arena → Xem thị trường dự đoán',
    color: '#3B82F6',
    icon: '📊',
    steps: [
      { label: 'Home', route: '/', description: 'Discovery section → tap Arena card' },
      { label: 'ArenaHome', route: '/arena', description: 'Browse modes, rooms' },
      { label: 'ModeDetail', route: '/arena/mode/:id', description: 'PredictionContextCard hiện khi mode có related topic', isBridge: true },
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Context card + "Hiểu ranh giới" sheet', isBridge: true },
      { label: 'PredictionEvent', route: '/markets/predictions/event/:id', description: 'Navigate qua "Xem thị trường dự đoán" CTA', isBridge: true },
    ],
  },
  {
    id: 'profile_dual',
    name: 'Profile dual surfaces',
    color: '#8B5CF6',
    icon: '👤',
    steps: [
      { label: 'Profile', route: '/profile', description: 'ProfileModuleBlocks: 2 cards tách biệt' },
      { label: 'PredictionPortfolio', route: '/markets/predictions/portfolio', description: 'Tap "Prediction" card → PnL, positions, orders — financial data' },
      { label: 'Profile (back)', route: '/profile', description: 'Navigate back' },
      { label: 'MyArena', route: '/profile/arena', description: 'Tap "Arena" card → Points, rooms, trust score — non-financial', isBridge: true },
    ],
  },
  {
    id: 'market_discover',
    name: 'MarketList → Khám phá thêm',
    color: '#10B981',
    icon: '🔍',
    steps: [
      { label: 'MarketList', route: '/markets', description: 'Browse crypto, scroll đến cuối' },
      { label: 'DiscoverMore', route: '/markets', description: '"Khám phá thêm" section — Predictions card + Arena card', isBridge: true },
      { label: 'Choice: Predictions', route: '/markets/predictions', description: 'Tap "Dự đoán thị trường" → PredictionsHome' },
      { label: 'Choice: Arena', route: '/arena', description: 'Tap "Open Arena" → ArenaHome' },
    ],
  },
];

/* ─── Section 4: Shared vs Separate Registry ─── */

interface RegistryItem {
  name: string;
  description: string;
}

const SHARED_ITEMS: RegistryItem[] = [
  { name: 'Topic Taxonomy', description: '8 shared topics (crypto, macro, politics, sports, tech, ai, culture, community). Dùng chung cho cả Predictions và Arena.' },
  { name: 'Context Cards', description: 'PredictionContextCard (trong Arena), ArenaRelatedRoomCard (trong Predictions). Bridge by content, not value.' },
  { name: 'Discovery Cards', description: 'HomeDiscoverySection, DiscoverMoreSection. Entry points an toàn giữa 2 module.' },
  { name: 'Profile Surface', description: 'ProfileModuleBlocks — 2 blocks tách biệt trên cùng 1 profile page. Chung surface, khác data.' },
  { name: 'Bridge Disclosures', description: 'ModuleBoundaryBanner, BoundaryInfoRow, ModuleLabelBadge. Disclosure component dùng chung.' },
];

const SEPARATE_ITEMS: RegistryItem[] = [
  { name: 'Wallet', description: 'Prediction: real wallet (deposit/withdraw/balance). Arena: KHÔNG CÓ wallet — chỉ points.' },
  { name: 'PnL', description: 'Prediction: profit/loss tính bằng tiền thật (USD/USDT). Arena: KHÔNG CÓ PnL — chỉ net points change.' },
  { name: 'Points Ledger', description: 'Arena only. Full audit trail cho Arena Points. Prediction không dùng points system.' },
  { name: 'Order Receipts', description: 'Prediction: trade receipts với giá khớp, phí, slippage. Arena: ResultReceiptSheet — points settlement only.' },
  { name: 'Settlement', description: 'Prediction: USDT settlement qua smart contract/escrow. Arena: Points redistribution internal.' },
  { name: 'Leaderboard Metrics', description: 'Prediction: PnL-based ranking. Arena: Points + trust score ranking. KHÔNG BAO GIỜ gộp.' },
  { name: 'Trust Metrics', description: 'Arena only: trust_score, fair_play, completion_rate, dispute_rate, reliability. Prediction không có trust system riêng.' },
  { name: 'Moderation System', description: 'Arena only: ReportDialog, BlockUser, ModerationCases, Appeal. Prediction dùng platform-wide moderation.' },
];

interface ForbiddenPattern {
  pattern: string;
  reason: string;
  severity: 'critical' | 'high' | 'medium';
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  { pattern: 'Points cạnh PnL', reason: 'Arena Points là điểm chơi, PnL là tiền thật. Đặt cạnh nhau → user nhầm points = tiền.', severity: 'critical' },
  { pattern: 'Merged leaderboard', reason: 'Gộp ranking points Arena với PnL Prediction → sai bản chất hoàn toàn 2 module.', severity: 'critical' },
  { pattern: 'Wallet wording trong Arena', reason: '"Ví", "Số dư", "Tài sản" → KHÔNG. Chỉ dùng "Points", "Điểm Arena", "Arena Points".', severity: 'critical' },
  { pattern: 'Trade wording trong Arena join flow', reason: '"Mua", "Bán", "Đặt lệnh" → KHÔNG. Dùng "Tham gia", "Entry points", "Đặt cược điểm".', severity: 'critical' },
  { pattern: 'Arena card thiếu disclosure', reason: 'Mọi bridge card Arena phải có badge "Points only" hoặc "Market context only". Không ngoại lệ.', severity: 'high' },
  { pattern: 'Prediction card thiếu market label', reason: 'Mọi bridge card Prediction phải có label "Prediction Market" hoặc "Thị trường dự đoán" rõ ràng.', severity: 'high' },
];

/* ─── Section 5: Handoff Pack ─── */

interface RouteEntry {
  route: string;
  page: string;
  bridgeType: 'none' | 'source' | 'target' | 'bidirectional';
  bridgeComponents: string[];
}

const ROUTE_REGISTRY: RouteEntry[] = [
  { route: '/', page: 'HomePage', bridgeType: 'source', bridgeComponents: ['HomeDiscoverySection'] },
  { route: '/profile', page: 'ProfilePage', bridgeType: 'bidirectional', bridgeComponents: ['ProfileModuleBlocks'] },
  { route: '/markets', page: 'MarketListPage', bridgeType: 'source', bridgeComponents: ['DiscoverMoreSection'] },
  { route: '/markets/predictions', page: 'PredictionsHomePage', bridgeType: 'source', bridgeComponents: ['TopicChipBar'] },
  { route: '/markets/predictions/event/:id', page: 'PredictionEventDetailPage', bridgeType: 'source', bridgeComponents: ['ArenaRelatedRoomsSection', 'ArenaBridgeConfirmSheet'] },
  { route: '/arena', page: 'ArenaHomePage', bridgeType: 'target', bridgeComponents: ['PredictionInsightSection'] },
  { route: '/arena/studio', page: 'ArenaStudioPage', bridgeType: 'target', bridgeComponents: ['BridgeSourceBar', 'ModuleBoundaryBanner'] },
  { route: '/arena/mode/:id', page: 'ArenaModeDetailPage', bridgeType: 'target', bridgeComponents: ['PredictionContextCard'] },
  { route: '/arena/challenge/:id', page: 'ArenaChallengeDetailPage', bridgeType: 'bidirectional', bridgeComponents: ['PredictionContextCard', 'LinkedSourceCard', 'BoundaryInfoSheet'] },
];

interface BridgeComponentEntry {
  name: string;
  file: string;
  module: string;
  usedIn: string[];
  disclosure: string;
}

const COMPONENT_REGISTRY: BridgeComponentEntry[] = [
  { name: 'HomeDiscoverySection', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['HomePage'], disclosure: 'Mỗi card có badge module' },
  { name: 'ProfileModuleBlocks', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['ProfilePage'], disclosure: '2 blocks tách biệt, stats không gộp' },
  { name: 'DiscoverMoreSection', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['MarketListPage'], disclosure: 'Entry points với disclosure' },
  { name: 'PredictionContextCard', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['ArenaChallengeDetail', 'ArenaModeDetail'], disclosure: '"Market context only" badge' },
  { name: 'ArenaRelatedRoomsSection', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['PredictionEventDetail'], disclosure: '"Points only" badge trên mỗi room card' },
  { name: 'TopicChipBar', file: 'ArenaPredictionBridges.tsx', module: '07D', usedIn: ['PredictionsHome', 'ArenaHome'], disclosure: 'Shared taxonomy, neutral chips' },
  { name: 'UnifiedTopicChip', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['Multiple pages'], disclosure: '4 states: default/selected/compact/disabled' },
  { name: 'ModuleBoundaryBanner', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['ArenaStudio', 'BoundaryInfoSheet'], disclosure: '6 disclosure variants' },
  { name: 'ModuleLabelBadge', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['Bridge cards'], disclosure: '6 badge variants' },
  { name: 'BoundaryInfoRow', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['BoundaryInfoSheet'], disclosure: 'Icon + text disclosure row' },
  { name: 'ArenaRelatedRoomCard', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['ArenaRelatedRoomsSection'], disclosure: 'Individual room card with "Points only"' },
  { name: 'DualModuleStatCard', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['ProfileModuleBlocks'], disclosure: 'Separate stat blocks' },
  { name: 'BridgeSourceBar', file: 'ArenaPredictionFoundation.tsx', module: '09A', usedIn: ['ArenaStudio (09D)'], disclosure: '"Nguồn bối cảnh" + event title + remove action' },
];

interface BridgeRule {
  field: string;
  allowed: boolean;
  reason: string;
}

const BRIDGE_RULES: BridgeRule[] = [
  // Allowed
  { field: 'eventId', allowed: true, reason: 'Identify prediction event nguồn. Chỉ dùng để link back, không chứa giá trị tài chính.' },
  { field: 'topic', allowed: true, reason: 'Shared topic taxonomy. Neutral content classification.' },
  { field: 'category', allowed: true, reason: 'Event category → map to shared topic. Content-only.' },
  { field: 'title suggestion', allowed: true, reason: 'Gợi ý tên room từ event title. User có thể chỉnh sửa.' },
  { field: 'source label', allowed: true, reason: 'Label cho resolution source (Auto mode). Content reference only.' },
  { field: 'context flag', allowed: true, reason: 'Boolean flag: fromPrediction = true. Trigger UI adjustments.' },
  // Forbidden
  { field: 'wallet balance', allowed: false, reason: 'Số dư ví là dữ liệu tài chính. KHÔNG BAO GIỜ carry qua Arena.' },
  { field: 'PnL', allowed: false, reason: 'Profit/loss là dữ liệu giao dịch thật. Arena chỉ dùng points.' },
  { field: 'open orders', allowed: false, reason: 'Orders là thao tác tài chính. Arena không liên quan.' },
  { field: 'order status', allowed: false, reason: 'Trạng thái lệnh mua/bán. Không expose trong Arena context.' },
  { field: 'receipt value', allowed: false, reason: 'Giá trị giao dịch. Arena ResultReceipt chỉ có points.' },
  { field: 'settlement records', allowed: false, reason: 'Bản ghi thanh toán tài chính. Arena chỉ settle points.' },
  { field: 'user financial performance', allowed: false, reason: 'Win rate/PnL/ROI tài chính. Arena chỉ có trust score + points.' },
];

interface QACheckItem {
  id: string;
  category: string;
  check: string;
  severity: 'must' | 'should' | 'may';
}

const QA_CHECKLIST: QACheckItem[] = [
  { id: 'qa1', category: 'Disclosure', check: 'Mọi bridge card có disclosure badge (Points only / Market context only / Module label)', severity: 'must' },
  { id: 'qa2', category: 'Disclosure', check: 'BoundaryInfoSheet accessible từ mọi context card (link "Hiểu ranh giới")', severity: 'must' },
  { id: 'qa3', category: 'Disclosure', check: 'BridgeSourceBar có nút "Bỏ liên kết" hoạt động đúng', severity: 'must' },
  { id: 'qa4', category: 'Boundary', check: 'PredictionEventDetail có section Arena nhưng không lấn trade flow (CTA tách biệt)', severity: 'must' },
  { id: 'qa5', category: 'Boundary', check: 'Arena screens có PredictionContext nhưng không lấn trust/rules sections', severity: 'must' },
  { id: 'qa6', category: 'Boundary', check: 'Arena Studio preset từ Prediction có boundary statement rõ (Step5 Safety Snapshot)', severity: 'must' },
  { id: 'qa7', category: 'Boundary', check: 'Profile đã tách stats thành 2 blocks riêng biệt (Prediction ≠ Arena)', severity: 'must' },
  { id: 'qa8', category: 'Boundary', check: 'Không có chỗ nào gộp money (USDT/VND) với points (Arena Points)', severity: 'must' },
  { id: 'qa9', category: 'Navigation', check: 'Flow Prediction → Arena → back hoạt động đúng (history stack clean)', severity: 'must' },
  { id: 'qa10', category: 'Navigation', check: 'CTA "Xem event gốc" navigate đúng route predictions/event/:id', severity: 'must' },
  { id: 'qa11', category: 'Navigation', check: 'CTA "Tạo Arena từ event này" mở confirm sheet trước khi navigate', severity: 'must' },
  { id: 'qa12', category: 'State', check: 'Bridge state fallback khi event nguồn bị xoá/expired', severity: 'should' },
  { id: 'qa13', category: 'State', check: 'Bridge disabled state — ẩn sạch bridge sections, không error', severity: 'should' },
  { id: 'qa14', category: 'State', check: 'Linked context unavailable — fallback card hiện, CTA disable', severity: 'should' },
  { id: 'qa15', category: 'Wording', check: 'Không có "ví", "tài sản", "mua", "bán" trong Arena bridge context', severity: 'must' },
  { id: 'qa16', category: 'Wording', check: 'Không có "stake", "bet", "gamble" wording trong Arena UI', severity: 'must' },
  { id: 'qa17', category: 'Wording', check: '"Kết quả room Arena không phải kết quả trade" disclosure ở mọi linked source', severity: 'must' },
  { id: 'qa18', category: 'Visual', check: 'Bridge cards không dùng accent color gây nhầm module (Arena purple, Prediction amber)', severity: 'should' },
];

/* ═══════════════════════════════════════════
   Section Components
   ═══════════════════════════════════════════ */

function Section1({ navigate, prefix }: { navigate: ReturnType<typeof useNavigate>; prefix: string }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div className="flex flex-col">
      <SectionHeader title="Canonical Connected Screens" accent accentColor="#10B981" mb={0} />
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
        9 màn hình vFinal chứa bridge integration từ 09A–09D. Mỗi màn đã chọn canonical version tốt nhất.
      </p>

      {CANONICAL_SCREENS.map((screen, i) => (
        <TrCard key={screen.name} hover
          className="p-4 active:opacity-70"
          onClick={() => { hapticSelection(); }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.3 }}>{screen.name}</span>
            <span className="px-2 py-0.5 rounded-md shrink-0"
              style={{ background: STATUS_CFG[screen.status].bg, color: STATUS_CFG[screen.status].color, fontSize: 9, fontWeight: 700 }}>
              {STATUS_CFG[screen.status].label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <span className="px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
              {screen.source}
            </span>
            <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{screen.route}</span>
          </div>

          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>{screen.notes}</p>

          <div className="flex flex-wrap gap-1">
            {screen.bridgeComponents.map(comp => (
              <span key={comp} className="px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(59,130,246,0.06)', color: '#3B82F6', fontSize: 9, fontWeight: 600, border: '1px solid rgba(59,130,246,0.1)' }}>
                {comp}
              </span>
            ))}
          </div>

          {screen.route !== '/' && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`${prefix}${screen.route.replace(':id', 'evt001').replace(':challengeId', 'ch001')}`); hapticSelection(); }}
              className="flex items-center gap-1 mt-2 active:opacity-70"
              style={{ minHeight: 28 }}
            >
              <ExternalLink size={10} color="#8B5CF6" />
              <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Mở trang</span>
            </button>
          )}
        </TrCard>
      ))}

      {/* Summary card */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={14} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total screens', value: '9' },
            { label: 'vFinal', value: `${CANONICAL_SCREENS.filter(s => s.status === 'vFinal').length}` },
            { label: 'Bridge components', value: `${new Set(CANONICAL_SCREENS.flatMap(s => s.bridgeComponents)).size}` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{s.value}</p>
              <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </TrCard>
    </div>
  );
}

function Section2() {
  const c = useThemeColors();

  return (
    <div className="flex flex-col">
      <SectionHeader title="Bridge State Matrix" accent accentColor="#F59E0B" mb={0} />
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
        8 bridge-specific states. Mỗi state định nghĩa behavior, affected screens và fallback UI.
      </p>

      {BRIDGE_STATES.map((state) => {
        const Icon = state.icon;
        return (
          <TrCard key={state.id} className="p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(state.color, 12) }}>
                <Icon size={15} color={state.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{state.label}</p>
                <span className="px-1.5 py-0.5 rounded"
                  style={{ background: hexToRgba(state.color, 12), color: state.color, fontSize: 8, fontWeight: 700, fontFamily: 'monospace' }}>
                  {state.id}
                </span>
              </div>
            </div>

            <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>{state.description}</p>

            <div className="flex flex-col gap-2 mb-2"
              style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 8 }}>
              <div className="flex items-start gap-2">
                <Layers size={10} color={c.text3} className="shrink-0 mt-1" />
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600 }}>Screens:</span> {state.affectedScreens.join(', ')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight size={10} color={state.color} className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: state.color }}>Behavior:</span> {state.behavior}
                </p>
              </div>
            </div>
          </TrCard>
        );
      })}
    </div>
  );
}

function Section3({ navigate, prefix }: { navigate: ReturnType<typeof useNavigate>; prefix: string }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div className="flex flex-col">
      <SectionHeader title="Connected E2E Flows" accent accentColor="#3B82F6" mb={0} />
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
        4 end-to-end flows kết nối 2 module. Bridge steps được đánh dấu 🔗.
      </p>

      {CONNECTED_FLOWS.map(flow => (
        <TrCard key={flow.id} className="p-4" accentBorder={`${flow.color}25`}>
          <div className="flex items-center gap-2.5 mb-3">
            <span style={{ fontSize: 18 }}>{flow.icon}</span>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{flow.name}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>{flow.steps.length} steps</p>
            </div>
          </div>

          <div className="flex flex-col gap-0">
            {flow.steps.map((step, i) => {
              const isLast = i === flow.steps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.isBridge ? hexToRgba(flow.color, 20) : c.surface2,
                        border: `2px solid ${step.isBridge ? flow.color : c.borderSolid}`,
                      }}>
                      {step.isBridge ? (
                        <Link2 size={8} color={flow.color} />
                      ) : (
                        <span style={{ color: c.text3, fontSize: 8, fontWeight: 700 }}>{i + 1}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className="flex-1" style={{ width: 1.5, background: step.isBridge ? flow.color : c.borderSolid, opacity: step.isBridge ? 0.4 : 0.3, minHeight: 20 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{step.label}</span>
                      {step.isBridge && (
                        <span className="px-1 py-0.5 rounded"
                          style={{ background: hexToRgba(flow.color, 12), color: flow.color, fontSize: 7, fontWeight: 700 }}>
                          BRIDGE
                        </span>
                      )}
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{step.description}</p>
                    <button
                      onClick={() => {
                        const route = step.route.replace(':id', 'evt001').replace(':challengeId', 'ch001');
                        navigate(`${prefix}${route}`);
                        hapticSelection();
                      }}
                      className="flex items-center gap-1 mt-1 active:opacity-70"
                      style={{ minHeight: 24 }}
                    >
                      <span style={{ color: flow.color, fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}>{step.route}</span>
                      <ChevronRight size={9} color={flow.color} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>
      ))}
    </div>
  );
}

function Section4() {
  const c = useThemeColors();
  const [showForbidden, setShowForbidden] = useState(true);

  return (
    <div className="flex flex-col">
      <SectionHeader title="Shared vs Separate Registry" accent accentColor="#8B5CF6" mb={0} />
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
        Ranh giới rõ ràng: items nào được share, items nào PHẢI tách biệt.
      </p>

      {/* Shared */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Link2 size={13} color="#10B981" />
          </div>
          <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Shared (Connect by Content)</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {SHARED_ITEMS.map(item => (
            <div key={item.name} className="flex items-start gap-2">
              <Check size={10} color="#10B981" className="shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{item.name}</p>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Separate */}
      <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Shield size={13} color="#EF4444" />
          </div>
          <span style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>Separate (Never Merge)</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {SEPARATE_ITEMS.map(item => (
            <div key={item.name} className="flex items-start gap-2">
              <X size={10} color="#EF4444" className="shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{item.name}</p>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Forbidden UX Patterns */}
      <div className="mt-2">
        <button
          onClick={() => setShowForbidden(!showForbidden)}
          className="flex items-center gap-2 mb-3 active:opacity-70"
          style={{ minHeight: 32 }}
        >
          <OctagonAlert size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>Forbidden UX Patterns</span>
          <ChevronRight size={14} color="#EF4444" style={{ transform: showForbidden ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showForbidden && (
          <div className="flex flex-col gap-2.5">
            {FORBIDDEN_PATTERNS.map((fp, i) => {
              const sevCfg = {
                critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', color: '#EF4444', label: 'CRITICAL' },
                high: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'HIGH' },
                medium: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: 'MEDIUM' },
              }[fp.severity];
              return (
                <div key={i} className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                  style={{ background: sevCfg.bg, border: `1px solid ${sevCfg.border}` }}>
                  <Ban size={12} color={sevCfg.color} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>{fp.pattern}</span>
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: hexToRgba(sevCfg.color, 15), color: sevCfg.color, fontSize: 7, fontWeight: 700 }}>
                        {sevCfg.label}
                      </span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>{fp.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Section5() {
  const c = useThemeColors();
  const [activeBoard, setActiveBoard] = useState<'routes' | 'components' | 'rules' | 'qa'>('routes');
  const { hapticSelection } = useHaptic();

  const boards = [
    { id: 'routes' as const, label: 'Routes', icon: Map },
    { id: 'components' as const, label: 'Components', icon: Package },
    { id: 'rules' as const, label: 'Bridge Rules', icon: BookOpen },
    { id: 'qa' as const, label: 'QA Checklist', icon: CheckCircle2 },
  ];

  const bridgeTypeColors: Record<string, { bg: string; color: string }> = {
    none: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    source: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    target: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    bidirectional: { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
  };

  return (
    <div className="flex flex-col">
      <SectionHeader title="Dev / QA Handoff Pack" accent accentColor="#EF4444" mb={0} />

      {/* Board tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {boards.map(b => {
          const active = activeBoard === b.id;
          const Icon = b.icon;
          return (
            <button key={b.id}
              onClick={() => { setActiveBoard(b.id); hapticSelection(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
              style={{
                background: active ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                color: active ? c.chipActiveText : c.chipText,
                fontSize: φ.xs, fontWeight: 600, minHeight: 44,
              }}
            >
              <Icon size={12} />
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Route Registry */}
      {activeBoard === 'routes' && (
        <TrCard overflow>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Route Registry</p>
            <p style={{ color: c.text3, fontSize: 10 }}>{ROUTE_REGISTRY.length} routes with bridge integration</p>
          </div>
          {ROUTE_REGISTRY.map((entry, i) => (
            <div key={entry.route}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: i < ROUTE_REGISTRY.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 52 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{entry.page}</span>
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ ...bridgeTypeColors[entry.bridgeType], fontSize: 7, fontWeight: 700 }}>
                    {entry.bridgeType}
                  </span>
                </div>
                <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{entry.route}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entry.bridgeComponents.map(comp => (
                    <span key={comp} className="px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(59,130,246,0.06)', color: '#3B82F6', fontSize: 8 }}>
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TrCard>
      )}

      {/* Component Registry */}
      {activeBoard === 'components' && (
        <TrCard overflow>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Bridge Component Registry</p>
            <p style={{ color: c.text3, fontSize: 10 }}>{COMPONENT_REGISTRY.length} bridge components</p>
          </div>
          {COMPONENT_REGISTRY.map((comp, i) => (
            <div key={comp.name}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: i < COMPONENT_REGISTRY.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 48 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{comp.name}</span>
                  <span className="px-1 py-0.5 rounded"
                    style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 7, fontWeight: 700 }}>
                    {comp.module}
                  </span>
                </div>
                <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{comp.file}</p>
                <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
                  <span style={{ fontWeight: 600 }}>Disclosure:</span> {comp.disclosure}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {comp.usedIn.map(page => (
                    <span key={page} className="px-1.5 py-0.5 rounded"
                      style={{ background: c.surface2, color: c.text3, fontSize: 8 }}>
                      {page}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </TrCard>
      )}

      {/* Bridge Rules Dictionary */}
      {activeBoard === 'rules' && (
        <div className="flex flex-col gap-3">
          <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
            <div className="flex items-center gap-2 mb-3">
              <Check size={14} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Allowed Carry-over Fields</span>
            </div>
            <div className="flex flex-col gap-2">
              {BRIDGE_RULES.filter(r => r.allowed).map(rule => (
                <div key={rule.field} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.04)' }}>
                  <Check size={10} color="#10B981" className="shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>{rule.field}</p>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{rule.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>

          <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
            <div className="flex items-center gap-2 mb-3">
              <Ban size={14} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>Forbidden Carry-over Fields</span>
            </div>
            <div className="flex flex-col gap-2">
              {BRIDGE_RULES.filter(r => !r.allowed).map(rule => (
                <div key={rule.field} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <X size={10} color="#EF4444" className="shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>{rule.field}</p>
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{rule.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </div>
      )}

      {/* QA Checklist */}
      {activeBoard === 'qa' && (
        <QAChecklistBoard />
      )}
    </div>
  );
}

function QAChecklistBoard() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    hapticSelection();
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const categories = [...new Set(QA_CHECKLIST.map(q => q.category))];
  const passedCount = checked.size;
  const totalCount = QA_CHECKLIST.length;
  const allPassed = passedCount === totalCount;
  const mustCount = QA_CHECKLIST.filter(q => q.severity === 'must').length;
  const mustPassed = QA_CHECKLIST.filter(q => q.severity === 'must' && checked.has(q.id)).length;

  const sevColors = {
    must: { bg: 'rgba(239,68,68,0.08)', color: '#EF4444' },
    should: { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
    may: { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6' },
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <TrCard className="p-4" accentBorder={allPassed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>QA Progress</span>
          <span style={{ color: allPassed ? '#10B981' : '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>
            {passedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${(passedCount / totalCount) * 100}%`, background: allPassed ? '#10B981' : '#F59E0B' }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ color: c.text3, fontSize: 10 }}>MUST: {mustPassed}/{mustCount}</span>
          {allPassed && (
            <span className="flex items-center gap-1" style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
              <CheckCircle2 size={10} /> All checks passed
            </span>
          )}
        </div>
      </TrCard>

      {/* Checklist by category */}
      {categories.map(cat => (
        <TrCard key={cat} overflow>
          <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>{cat}</span>
          </div>
          {QA_CHECKLIST.filter(q => q.category === cat).map((item, i, arr) => {
            const isDone = checked.has(item.id);
            return (
              <button key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-start gap-3 px-4 py-3 w-full text-left active:opacity-70"
                style={{
                  borderBottom: i < arr.length - 1 ? `1px solid ${c.divider}` : 'none',
                  minHeight: 48,
                  background: isDone ? 'rgba(16,185,129,0.03)' : 'transparent',
                }}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    border: `2px solid ${isDone ? '#10B981' : c.borderSolid}`,
                    background: isDone ? '#10B981' : 'transparent',
                  }}>
                  {isDone && <Check size={10} color="#fff" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{
                    color: isDone ? c.text3 : c.text1,
                    fontSize: φ.xs, lineHeight: 1.5,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {item.check}
                  </p>
                </div>
                <span className="px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{ ...sevColors[item.severity], fontSize: 7, fontWeight: 700 }}>
                  {item.severity.toUpperCase()}
                </span>
              </button>
            );
          })}
        </TrCard>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page Export
   ═══════════════════════════════════════════ */

export function ConnectedEcosystemProductionPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [section, setSection] = useState<SectionId>('1');

  return (
    <PageLayout>
      <Header
        title="09E — Connected Ecosystem"
        subtitle="Production Ready"
        back
      />

      <PageContent gap="default">
      {/* Page intro */}
      <div>
        <TrCard className="p-4" accentBorder="rgba(139,92,246,0.2)">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Package size={16} color="#8B5CF6" />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Connected Ecosystem</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Consolidation 09A → 09D</p>
            </div>
            <span className="px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 9, fontWeight: 700 }}>
              PRODUCTION
            </span>
          </div>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
            Bộ handoff pack production-ready cho hệ sinh thái kết nối Open Arena × Prediction Markets.
            2 module liên kết chặt qua content/topic — nhưng vẫn tách biệt hoàn toàn về bản chất tài chính.
          </p>
        </TrCard>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 no-scrollbar">
        {SECTION_TABS.map(tab => {
          const active = section === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id}
              onClick={() => { setSection(tab.id); hapticSelection(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
              style={{
                background: active ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                color: active ? c.chipActiveText : c.chipText,
                fontSize: φ.xs, fontWeight: 600, minHeight: 44,
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      {section === '1' && <Section1 navigate={navigate} prefix={prefix} />}
      {section === '2' && <Section2 />}
      {section === '3' && <Section3 navigate={navigate} prefix={prefix} />}
      {section === '4' && <Section4 />}
      {section === '5' && <Section5 />}

      {/* Footer disclaimer */}
      <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl"
        style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <Info size={12} color="#94A3B8" className="shrink-0 mt-0.5" />
        <p style={{ color: '#94A3B8', fontSize: 10, lineHeight: 1.5 }}>
          Trang này dành cho PM / Designer / Dev / QA — không phải user-facing.
          Toàn bộ nội dung là handoff documentation cho hệ sinh thái kết nối
          giữa Open Arena (points-only) và Prediction Markets (real positions).
        </p>
      </div>

      </PageContent>
    </PageLayout>
  );
}