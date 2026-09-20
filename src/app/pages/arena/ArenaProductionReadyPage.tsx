/**
 * ══════════════════════════════════════════════════════════
 *  ArenaProductionReadyPage — /arena/production-ready
 * ══════════════════════════════════════════════════════════
 *  08 – Open Arena Production Ready
 *  QA/Dev handoff dashboard — consolidates all Open Arena
 *  screens, state matrix, E2E flows, registry & handoff pack.
 *
 *  Target: PM, Designer, Dev, QA — NOT end-user facing.
 *  Route: QA/dev only
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, CheckCircle2, Clock, AlertTriangle, Shield,
  FileText, BookOpen, Layers, Map, Package, Eye, EyeOff,
  ArrowRight, XCircle, WifiOff, Ban, Flag, Lock, Zap,
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
   Data
   ═══════════════════════════════════════════ */

type ScreenStatus = 'live' | 'future' | 'qa_only' | 'archived';
type StateType = 'default' | 'loading' | 'empty' | 'error' | 'offline' | 'under_review' | 'reported' | 'hidden' | 'resolved' | 'canceled' | 'expired';

const STATUS_COLORS: Record<ScreenStatus, { bg: string; color: string; label: string }> = {
  live: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Live' },
  future: { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', label: 'Future' },
  qa_only: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'QA/Dev' },
  archived: { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8', label: 'Archived' },
};

interface ScreenEntry {
  name: string;
  route: string;
  status: ScreenStatus;
  version: string;
  states: StateType[];
  notes?: string;
}

const CANONICAL_SCREENS: ScreenEntry[] = [
  {
    name: 'ArenaHomePage',
    route: '/arena',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'empty', 'error', 'offline'],
    notes: 'Gọn hơn v4: bớt quick chips (3 thay vì 5), giữ hero + templates + modes + rooms + creators',
  },
  {
    name: 'ArenaStudioPage',
    route: '/arena/studio',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'error', 'offline', 'under_review'],
    notes: 'PublishEligibilityPanel rõ hơn, GovernanceHintBanner ở mỗi step, RuleClarityCard ở Review',
  },
  {
    name: 'ArenaChallengeDetailPage',
    route: '/arena/challenge/:challengeId',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'empty', 'error', 'offline', 'under_review', 'reported', 'hidden', 'resolved', 'canceled'],
    notes: 'Trust-first: tab mặc định là "Luật chơi", Governance+RuleClarity trước tabs, Safety Snapshot trước CTA',
  },
  {
    name: 'ArenaSafetyCenterPage',
    route: '/arena/safety',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'error'],
    notes: 'Trung tâm an toàn: chính sách, báo cáo, chặn users, quy tắc cộng đồng',
  },
  {
    name: 'ArenaResolutionCenterPage',
    route: '/arena/resolution',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'empty', 'error', 'resolved'],
    notes: 'Chốt kết quả: method-specific UI, evidence, timeline, ResultReceiptSheet khi settled',
  },
  {
    name: 'ArenaPointsLedgerPage',
    route: '/arena/ledger',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'empty', 'error'],
    notes: 'Full audit trail: 7 filter chips, search, balance summary, tappable rows → entry detail',
  },
  {
    name: 'MyArenaPage',
    route: '/profile/arena',
    status: 'live',
    version: 'vFinal',
    states: ['default', 'loading', 'empty', 'error'],
    notes: '3 mục riêng: challenges/modes/settings, links to reports + blocked users',
  },
];

const SUPPORTING_SCREENS: ScreenEntry[] = [
  { name: 'ArenaPointsPage', route: '/arena/points', status: 'live', version: 'v2', states: ['default', 'loading'], notes: 'Points hub: check-in, tasks, history → ledger link' },
  { name: 'ArenaPointsEntryDetailPage', route: '/arena/ledger/entry/:entryId', status: 'live', version: 'vFinal', states: ['default', 'empty'], notes: 'Chi tiết giao dịch điểm: amount hero, details, balance, refId' },
  { name: 'ArenaJoinPage', route: '/arena/join/:id', status: 'live', version: 'v2', states: ['default', 'loading', 'error'], notes: 'Preview trước join: checkboxes, fee breakdown, policy link' },
  { name: 'ArenaCreatorPage', route: '/arena/creator/:id', status: 'live', version: 'v2', states: ['default', 'empty'], notes: 'Creator profile: modes, challenges, trust, report modal' },
  { name: 'ArenaModeDetailPage', route: '/arena/mode/:id', status: 'live', version: 'v1', states: ['default', 'empty'], notes: 'Mode detail: rules, format, creator, clones' },
  { name: 'ArenaLeaderboardPage', route: '/arena/leaderboard', status: 'live', version: 'v1', states: ['default', 'loading', 'empty'], notes: 'Top creators + players' },
  { name: 'ArenaTrustBreakdownPage', route: '/arena/trust/:id', status: 'live', version: 'v1', states: ['default'], notes: 'Full trust metrics detail' },
  { name: 'ArenaBlockedUsersPage', route: '/arena/blocked', status: 'live', version: 'v1', states: ['default', 'empty'], notes: 'Blocked users list: unblock + view profile CTA' },
  { name: 'MyArenaReportsPage', route: '/arena/my-reports', status: 'live', version: 'v1', states: ['default', 'loading', 'empty'], notes: '6 filter chips, report list, skeleton loading' },
  { name: 'ArenaReportCasePage', route: '/arena/report/:caseId', status: 'live', version: 'v1', states: ['default', 'empty'], notes: 'Case detail: AppealBanner, CaseActionCard, timeline' },
  { name: 'VerifiedChallengesPage', route: '/arena/verified', status: 'future', version: 'v1', states: ['default'], notes: 'Placeholder: "Sẽ mở trong tương lai"' },
  { name: 'ArenaFlowMapPage', route: '/arena/flow-map', status: 'qa_only', version: 'v1', states: ['default'], notes: 'Flow visualization — dev/QA only, not user-facing' },
  { name: 'ArenaProductionReadyPage', route: '/arena/production-ready', status: 'qa_only', version: 'v1', states: ['default'], notes: 'This page — handoff dashboard' },
];

interface FlowStep {
  label: string;
  route: string;
  description: string;
}

interface E2EFlow {
  id: string;
  name: string;
  color: string;
  icon: string;
  steps: FlowStep[];
}

const E2E_FLOWS: E2EFlow[] = [
  {
    id: 'creator',
    name: 'Creator Flow',
    color: '#8B5CF6',
    icon: '🎨',
    steps: [
      { label: 'ArenaHome', route: '/arena', description: 'Tap "Tạo challenge"' },
      { label: 'ArenaStudio', route: '/arena/studio', description: 'Template → Cấu trúc → Luật → Kết quả → Points → Review' },
      { label: 'Publish', route: '/arena/studio', description: 'PublishEligibility check → Submit' },
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Challenge created, share link' },
      { label: 'Resolution', route: '/arena/resolution', description: 'Khi hết hạn → Chốt kết quả' },
    ],
  },
  {
    id: 'join',
    name: 'Join Flow',
    color: '#3B82F6',
    icon: '🎮',
    steps: [
      { label: 'ArenaHome', route: '/arena', description: 'Browse rooms/modes/challenges' },
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Xem rules, trust, participants' },
      { label: 'JoinPage', route: '/arena/join/:id', description: 'Preview: entry pts, checkboxes, fee' },
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Joined → wait for start' },
      { label: 'Resolution', route: '/arena/resolution', description: 'Submit evidence, confirm result' },
      { label: 'Receipt', route: '/arena/resolution', description: 'View ResultReceiptSheet' },
    ],
  },
  {
    id: 'moderation',
    name: 'Moderation Flow',
    color: '#EF4444',
    icon: '🛡️',
    steps: [
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'Tap "Báo cáo"' },
      { label: 'ReportDialog', route: '/arena/challenge/:id', description: 'Select reason, submit' },
      { label: 'MyArenaReports', route: '/arena/my-reports', description: 'View submitted reports' },
      { label: 'ReportCase', route: '/arena/report/:caseId', description: 'Case detail, timeline, appeal' },
      { label: 'Safety Center', route: '/arena/safety', description: 'Community rules, blocked users' },
    ],
  },
  {
    id: 'resolution',
    name: 'Resolution Flow',
    color: '#F59E0B',
    icon: '⚖️',
    steps: [
      { label: 'ChallengeDetail', route: '/arena/challenge/:id', description: 'CTA: "Chốt kết quả"' },
      { label: 'ResolutionCenter', route: '/arena/resolution', description: 'Choose method, submit evidence' },
      { label: 'ResultProposal', route: '/arena/resolution', description: 'Confirm winner/loser/draw/void' },
      { label: 'Settlement', route: '/arena/resolution', description: 'Points distributed' },
      { label: 'Receipt', route: '/arena/resolution', description: 'ResultReceiptSheet → ledger' },
    ],
  },
  {
    id: 'points_audit',
    name: 'Points Audit Flow',
    color: '#10B981',
    icon: '📊',
    steps: [
      { label: 'ArenaPoints', route: '/arena/points', description: 'Balance overview, tasks, history' },
      { label: 'PointsLedger', route: '/arena/ledger', description: 'Full audit trail with filters' },
      { label: 'EntryDetail', route: '/arena/ledger/entry/:entryId', description: 'Amount, type, balance, refId' },
      { label: 'LinkedChallenge', route: '/arena/challenge/:id', description: 'Navigate to linked challenge' },
    ],
  },
];

/* ─── Component Registry ─── */
interface ComponentEntry {
  name: string;
  file: string;
  type: 'page' | 'shared' | 'sheet' | 'dialog' | 'chip' | 'card';
  description: string;
}

const COMPONENT_REGISTRY: ComponentEntry[] = [
  { name: 'StatusChip', file: 'ArenaChips.tsx', type: 'chip', description: '11 challenge states: open, live, full, pending_result, resolved, canceled, hidden, error, under_review, reported, offline' },
  { name: 'FormatChip', file: 'ArenaChips.tsx', type: 'chip', description: '4 formats: 1v1, 1vN, NvN, open_lobby' },
  { name: 'TrustBadge', file: 'ArenaChips.tsx', type: 'chip', description: 'points_only | verified | community' },
  { name: 'ReportDialog', file: 'ArenaModeration.tsx', type: 'dialog', description: 'Report modal: 6 reason options + text input' },
  { name: 'BlockUserDialog', file: 'ArenaModeration.tsx', type: 'dialog', description: 'Block confirmation modal with user info' },
  { name: 'ReportCaseStatusChip', file: 'ArenaModerationCases.tsx', type: 'chip', description: '6 statuses: pending, investigating, resolved, dismissed, appealed, escalated' },
  { name: 'AppealBanner', file: 'ArenaModerationCases.tsx', type: 'card', description: 'Case appeal banner with appeal CTA' },
  { name: 'CaseActionCard', file: 'ArenaModerationCases.tsx', type: 'card', description: 'Actions available for a report case' },
  { name: 'BlockedUserRow', file: 'ArenaModerationCases.tsx', type: 'card', description: 'Blocked user list item with unblock CTA' },
  { name: 'SafetySnapshotCard', file: 'ArenaSafetyTrust.tsx', type: 'card', description: 'Challenge safety summary: resolution, evidence, privacy, trust' },
  { name: 'TrustBreakdownSheet', file: 'ArenaSafetyTrust.tsx', type: 'sheet', description: '5 trust metrics detail: fair_play, completion, dispute, report_upheld, reliability' },
  { name: 'ResultReceiptSheet', file: 'ArenaResultReceipt.tsx', type: 'sheet', description: 'Settlement receipt: result hero, participants, pool, ledger refs' },
  { name: 'ParticipantGovernanceCard', file: 'ArenaStudioGovernance.tsx', type: 'card', description: 'Resolution method, evidence, void rule, privacy for participants' },
  { name: 'RuleClarityCard', file: 'ArenaStudioGovernance.tsx', type: 'card', description: 'Clarity score gauge (0–100) based on rule completeness' },
  { name: 'PublishEligibilityPanel', file: 'ArenaStudioGovernance.tsx', type: 'card', description: '6 eligibility checks before publishing challenge' },
  { name: 'ResolutionRiskMatrix', file: 'ArenaStudioGovernance.tsx', type: 'card', description: 'Risk assessment for resolution method choice' },
  { name: 'ModerationTimelineRow', file: 'ArenaGovernance.tsx', type: 'card', description: 'Timeline step: done/pending dot + label + date' },
  { name: 'ArenaPageFooter', file: 'ArenaPageFooter.tsx', type: 'shared', description: 'Community rules, safety links, disclaimer' },
  { name: 'PredictionContextCard', file: 'ArenaPredictionBridges.tsx', type: 'card', description: '07D bridge: prediction market context in challenge detail' },
];

/* ─── Governance Dictionary ─── */
interface DictionaryEntry {
  category: string;
  items: { code: string; label: string; description: string }[];
}

const GOVERNANCE_DICTIONARY: DictionaryEntry[] = [
  {
    category: 'Resolution Methods',
    items: [
      { code: 'auto', label: 'Tự động', description: 'Kết quả từ nguồn dữ liệu bên ngoài (API, quiz engine)' },
      { code: 'mutual_confirm', label: 'Xác nhận 2 bên', description: 'Tất cả bên phải xác nhận kết quả' },
      { code: 'referee', label: 'Trọng tài', description: 'Người được chỉ định chốt kết quả' },
      { code: 'community_vote', label: 'Bình chọn cộng đồng', description: 'Bỏ phiếu với ngưỡng tối thiểu' },
    ],
  },
  {
    category: 'Resolution Statuses',
    items: [
      { code: 'pending', label: 'Đang chờ', description: 'Chưa có kết quả' },
      { code: 'evidence_submitted', label: 'Đã nộp bằng chứng', description: 'Evidence đã gửi, chờ review' },
      { code: 'proposed', label: 'Đề xuất', description: 'Kết quả đã được đề xuất, chờ xác nhận' },
      { code: 'confirmed', label: 'Đã xác nhận', description: 'Kết quả được xác nhận, chờ phân phối' },
      { code: 'settled', label: 'Đã chốt', description: 'Points đã phân phối xong' },
      { code: 'disputed', label: 'Tranh chấp', description: 'Có khiếu nại, đang xem xét' },
    ],
  },
  {
    category: 'Ledger Reason Codes',
    items: [
      { code: 'earned', label: 'Nhận', description: 'Points nhận được (task, check-in, thắng)' },
      { code: 'spent', label: 'Chi', description: 'Points chi tiêu (entry fee)' },
      { code: 'entry', label: 'Tham gia', description: 'Khấu trừ khi join challenge' },
      { code: 'settlement', label: 'Kết toán', description: 'Phân phối sau khi chốt kết quả' },
      { code: 'refund', label: 'Hoàn điểm', description: 'Hoàn khi challenge bị void/cancel' },
      { code: 'adjustment', label: 'Điều chỉnh', description: 'Admin adjustment (sửa lỗi)' },
    ],
  },
  {
    category: 'Moderation Case Statuses',
    items: [
      { code: 'pending', label: 'Đang chờ xử lý', description: 'Report mới, chưa được xem' },
      { code: 'investigating', label: 'Đang điều tra', description: 'Đội ngũ đang xem xét' },
      { code: 'resolved', label: 'Đã xử lý', description: 'Case closed, action taken' },
      { code: 'dismissed', label: 'Bác bỏ', description: 'Report không hợp lệ' },
      { code: 'appealed', label: 'Kháng cáo', description: 'User đã kháng cáo quyết định' },
      { code: 'escalated', label: 'Leo thang', description: 'Chuyển lên cấp cao hơn' },
    ],
  },
  {
    category: 'Safety Banners & Policy Tags',
    items: [
      { code: 'points_only', label: 'Points only', description: 'Arena Points không phải tài sản tài chính' },
      { code: 'fair_play', label: 'Fair Play', description: 'Creator/player tuân thủ luật chơi' },
      { code: 'no_outside_trade', label: 'Không giao dịch ngoài', description: 'Warning không thỏa thuận ngoài nền tảng' },
      { code: 'void_policy', label: 'Chính sách void', description: 'Khi nào challenge bị void và hoàn điểm' },
      { code: 'dispute_process', label: 'Quy trình tranh chấp', description: 'Steps khi có tranh chấp' },
      { code: 'anti_scam', label: 'Chống lừa đảo', description: 'Cảnh báo các hành vi lừa đảo' },
    ],
  },
];

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function StatusTag({ status }: { status: ScreenStatus }) {
  const cfg = STATUS_COLORS[status];
  return (
    <span className="px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

const STATE_ICONS: Partial<Record<StateType, { icon: typeof CheckCircle2; color: string }>> = {
  default: { icon: CheckCircle2, color: '#10B981' },
  loading: { icon: Clock, color: '#3B82F6' },
  empty: { icon: EyeOff, color: '#94A3B8' },
  error: { icon: XCircle, color: '#EF4444' },
  offline: { icon: WifiOff, color: '#6B7280' },
  under_review: { icon: Eye, color: '#F59E0B' },
  reported: { icon: Flag, color: '#EF4444' },
  hidden: { icon: Ban, color: '#6B7280' },
  resolved: { icon: CheckCircle2, color: '#10B981' },
  canceled: { icon: XCircle, color: '#94A3B8' },
  expired: { icon: Clock, color: '#6B7280' },
};

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

type Section = 'A' | 'B' | 'C' | 'D' | 'E';

export function ArenaProductionReadyPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [activeSection, setActiveSection] = useState<Section>('A');

  const sections: { id: Section; label: string; icon: typeof Layers }[] = [
    { id: 'A', label: 'Screens', icon: Layers },
    { id: 'B', label: 'States', icon: Eye },
    { id: 'C', label: 'Flows', icon: Map },
    { id: 'D', label: 'Registry', icon: Package },
    { id: 'E', label: 'Handoff', icon: FileText },
  ];

  return (
    <PageLayout>
      <Header title="Production Ready" subtitle="Sẵn sàng · Open Arena" back />

      <PageContent padding="compact">
      {/* ─── Dev banner ─── */}
      <div>
        <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(59,130,246,0.3)">
          <Shield size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>08 – Open Arena Production Ready</p>
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
              QA/Dev handoff dashboard. Trang này chỉ dành cho nội bộ — không hiển thị cho end-user.
            </p>
          </div>
        </TrCard>
      </div>

      {/* ─── Section tabs ─── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-5 px-5 no-scrollbar">
        {sections.map(s => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); hapticSelection(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl active:opacity-70"
              style={{
                background: active ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                color: active ? c.chipActiveText : c.chipText,
                fontSize: φ.xs, fontWeight: 600, minHeight: 44,
              }}
            >
              <s.icon size={13} /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {/* ══════════════════════════════════════
           SECTION A — Canonical Screens
           ══════════════════════════════════════ */}
        {activeSection === 'A' && (
          <div className="contents">
            <SectionHeader title="A — Canonical Screens (vFinal)" accent accentColor="#8B5CF6" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              7 core screens đã được consolidate thành bản vFinal. Mỗi screen đã audit: trust-first, accessibility, states đầy đủ.
            </p>

            {CANONICAL_SCREENS.map(screen => (
              <TrCard
                key={screen.name}
                hover as="button"
                onClick={() => { navigate(`${prefix}${screen.route.replace(':challengeId', 'ch003').replace(':id', 'ch003')}`); hapticSelection(); }}
                className="p-4 w-full text-left active:opacity-70"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{screen.name}</p>
                    <StatusTag status={screen.status} />
                  </div>
                  <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>{screen.version}</span>
                </div>
                <p style={{ color: '#3B82F6', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{screen.route}</p>
                {screen.notes && (
                  <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>{screen.notes}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {screen.states.map(st => (
                    <span key={st} className="px-1.5 py-0.5 rounded" style={{ background: c.surface2, color: c.text2, fontSize: 9 }}>
                      {st}
                    </span>
                  ))}
                </div>
              </TrCard>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION B — State Matrix
           ══════════════════════════════════════ */}
        {activeSection === 'B' && (
          <div className="contents">
            <SectionHeader title="B — State Matrix" accent accentColor="#F59E0B" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              Lưới states cho từng core screen. Chỉ hiển thị states thực sự áp dụng.
            </p>

            {/* State legend */}
            <TrCard className="p-3 mb-2">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATE_ICONS) as StateType[]).map(st => {
                  const cfg = STATE_ICONS[st]!;
                  const Icon = cfg.icon;
                  return (
                    <div key={st} className="flex items-center gap-1">
                      <Icon size={10} color={cfg.color} />
                      <span style={{ color: c.text2, fontSize: 9 }}>{st}</span>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Matrix grid */}
            {CANONICAL_SCREENS.map(screen => (
              <TrCard key={screen.name} className="p-3">
                <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 6 }}>{screen.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STATE_ICONS) as StateType[]).map(st => {
                    const has = screen.states.includes(st);
                    const cfg = STATE_ICONS[st]!;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={st}
                        className="flex items-center gap-1 px-2 py-1 rounded-md"
                        style={{
                          background: has ? hexToRgba(cfg.color, 12) : c.surface2,
                          opacity: has ? 1 : 0.3,
                          minWidth: 70,
                        }}
                      >
                        <Icon size={10} color={has ? cfg.color : c.text3} />
                        <span style={{ color: has ? cfg.color : c.text3, fontSize: 9, fontWeight: has ? 600 : 400 }}>
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION C — E2E Flows
           ══════════════════════════════════════ */}
        {activeSection === 'C' && (
          <div className="contents">
            <SectionHeader title="C — End-to-End Flows" accent accentColor="#3B82F6" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              5 flow chính. Mỗi step có prototype link thật. Tap step để navigate.
            </p>

            {E2E_FLOWS.map(flow => (
              <TrCard key={flow.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: 16 }}>{flow.icon}</span>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{flow.name}</p>
                  <div className="w-3 h-1 rounded-full" style={{ background: flow.color }} />
                </div>

                <div className="flex flex-col gap-0">
                  {flow.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                        <div className="w-3 h-3 rounded-full border-2 shrink-0"
                          style={{ borderColor: flow.color, background: i === 0 ? flow.color : 'transparent' }} />
                        {i < flow.steps.length - 1 && (
                          <div className="w-0.5 flex-1" style={{ background: hexToRgba(flow.color, 30) }} />
                        )}
                      </div>

                      {/* Step content */}
                      <button
                        onClick={() => {
                          const route = step.route.replace(':challengeId', 'ch003').replace(':id', 'ch003').replace(':caseId', 'rc001').replace(':entryId', 'le001');
                          navigate(`${prefix}${route}`);
                          hapticSelection();
                        }}
                        className="flex-1 pb-4 text-left active:opacity-70"
                        style={{ minHeight: 44 }}
                      >
                        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{step.label}</p>
                        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{step.description}</p>
                      </button>
                    </div>
                  ))}
                </div>
              </TrCard>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION D — Registry
           ══════════════════════════════════════ */}
        {activeSection === 'D' && (
          <div className="contents">
            <SectionHeader title="D — Production vs Future vs QA" accent accentColor="#10B981" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              Phân loại rõ ràng: Live = production, Future = chưa build, QA = internal only, Archived = deprecated.
            </p>

            {/* Stats summary */}
            <TrCard className="p-4 mb-2">
              <div className="grid grid-cols-4 gap-2 text-center">
                {(Object.keys(STATUS_COLORS) as ScreenStatus[]).map(status => {
                  const cfg = STATUS_COLORS[status];
                  const count = [...CANONICAL_SCREENS, ...SUPPORTING_SCREENS].filter(s => s.status === status).length;
                  return (
                    <div key={status}>
                      <p style={{ color: cfg.color, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>{count}</p>
                      <p style={{ color: c.text3, fontSize: 9 }}>{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Full registry */}
            {(Object.keys(STATUS_COLORS) as ScreenStatus[]).map(status => {
              const screens = [...CANONICAL_SCREENS, ...SUPPORTING_SCREENS].filter(s => s.status === status);
              if (screens.length === 0) return null;
              const cfg = STATUS_COLORS[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span style={{ color: cfg.color, fontSize: φ.sm, fontWeight: 700 }}>{cfg.label} ({screens.length})</span>
                  </div>
                  <TrCard overflow>
                    {screens.map((screen, i) => (
                      <div key={screen.name} className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: i < screens.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 48 }}>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate">{screen.name}</p>
                          <p style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{screen.route}</p>
                        </div>
                        <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{screen.version}</span>
                      </div>
                    ))}
                  </TrCard>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════
           SECTION E — Dev Handoff Pack
           ═════════════════════════════════════ */}
        {activeSection === 'E' && (
          <div className="contents">
            <SectionHeader title="E — Dev Handoff Pack" accent accentColor="#EF4444" mb={8} />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
              4 handoff boards: Route Registry, Component Registry, Trust & Governance Rules, Points Ledger / Resolution Dictionary.
            </p>

            {/* Board 1: Route Registry */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Map size={14} color="#8B5CF6" />
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>1. Route Registry</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {[...CANONICAL_SCREENS, ...SUPPORTING_SCREENS].map(s => (
                  <div key={s.name} className="flex items-center gap-2" style={{ minHeight: 28 }}>
                    <StatusTag status={s.status} />
                    <span style={{ color: '#3B82F6', fontSize: 9, fontFamily: 'monospace', flex: 1 }} className="truncate">
                      {s.route}
                    </span>
                    <span style={{ color: c.text3, fontSize: 9 }}>{s.version}</span>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Board 2: Component Registry */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={14} color="#3B82F6" />
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>2. Component Registry ({COMPONENT_REGISTRY.length})</p>
              </div>
              <div className="flex flex-col gap-2">
                {COMPONENT_REGISTRY.map(comp => {
                  const typeColors: Record<string, string> = {
                    page: '#8B5CF6', shared: '#3B82F6', sheet: '#F59E0B',
                    dialog: '#EF4444', chip: '#10B981', card: '#6366F1',
                  };
                  return (
                    <div key={comp.name} className="flex items-start gap-2" style={{ minHeight: 28 }}>
                      <span className="px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: hexToRgba(typeColors[comp.type], 12), color: typeColors[comp.type], fontSize: 8, fontWeight: 600 }}>
                        {comp.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{comp.name}</p>
                        <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>{comp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Board 3 & 4: Governance + Resolution Dictionary */}
            {GOVERNANCE_DICTIONARY.map(cat => (
              <TrCard key={cat.category} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} color="#F59E0B" />
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{cat.category}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {cat.items.map(item => (
                    <div key={item.code} className="flex items-start gap-2" style={{ minHeight: 28 }}>
                      <span className="px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: c.surface2, color: c.text1, fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}>
                        {item.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{item.label}</p>
                        <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            ))}

            {/* QA Checklist */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.25)">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} color="#10B981" />
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>QA Checklist — Pre-ship</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Tap targets ≥ 44pt (iOS) / 48dp (Android)',
                  'Contrast ≥ 4.5:1 cho text thường',
                  'Fee breakdown trước confirm (Points)',
                  'Error/empty/loading states đầy đủ',
                  'P2P-like flows: dispute + escrow timeline',
                  'Không có dark patterns (no FOMO copy)',
                  'Arena Points disclaimer hiển thị rõ',
                  'motion/react import (KHÔNG framer-motion)',
                  'Không dùng <> fragments (dùng div.contents)',
                  'Không hardcode rgba cho card borders',
                  'Backdrop blur chuẩn: blur(8px) + opacity 0.6–0.7',
                  'All number formatting qua formatNumber.ts',
                  'Routes DRY qua routeConfig.ts (import tĩnh)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ minHeight: 24 }}>
                    <CheckCircle2 size={12} color="#10B981" className="shrink-0 mt-0.5" />
                    <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {/* ─── Footer ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Shield size={12} color="#6B7280" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Trang này chỉ dành cho internal handoff. Không deploy lên production build. Open Arena = points-only, không phải tài sản tài chính.
          </p>
        </TrCard>
      </div>
      </PageContent>
    </PageLayout>
  );
}