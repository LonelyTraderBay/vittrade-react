import React from 'react';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Info, Clock,
  Eye, Lock, Link2, FileWarning, Scale, ShieldCheck, ShieldAlert,
  Smartphone, Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../ui/TrCard';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type GovernanceStatus =
  | 'draft'
  | 'missing_rules'
  | 'missing_referee'
  | 'high_risk'
  | 'publish_blocked'
  | 'publish_ready';

export type RiskTier = 'low' | 'medium' | 'high';

export interface RuleClarityInput {
  title: string;
  description: string;
  winCondition: string;
  tieRule: string;
  voidRule: string;
  resultDeadline: string;
  evidenceRequired: boolean;
  joinStyle: 'public' | 'invite_only' | 'unlisted';
}

export interface SafetySnapshot {
  format: string;
  resolution: string;
  evidence: string;
  privacy: string;
  voidRule: string;
  riskTier: RiskTier;
}

export interface EligibilityCheck {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

const RISK_COLORS: Record<RiskTier, { bg: string; text: string; label: string }> = {
  low:    { bg: 'rgba(16,185,129,0.1)', text: '#10B981', label: 'Thấp' },
  medium: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', label: 'Trung bình' },
  high:   { bg: 'rgba(239,68,68,0.1)',  text: '#EF4444', label: 'Cao' },
};

/** Compute rule clarity score 0–100 */
export function computeClarityScore(input: RuleClarityInput): number {
  let score = 0;
  const max = 100;

  // Title (10)
  if (input.title.length >= 5) score += 10;
  else if (input.title.length >= 3) score += 5;

  // Description (20)
  if (input.description.length >= 30) score += 20;
  else if (input.description.length >= 15) score += 12;
  else if (input.description.length >= 5) score += 5;

  // Win condition (20)
  if (input.winCondition.length >= 10) score += 20;
  else if (input.winCondition.length >= 5) score += 10;

  // Tie rule (15)
  if (input.tieRule.length >= 5) score += 15;
  else if (input.tieRule.length >= 2) score += 7;

  // Void rule (15)
  if (input.voidRule.length >= 5) score += 15;
  else if (input.voidRule.length >= 2) score += 7;

  // Result deadline (10)
  if (input.resultDeadline.length >= 1) score += 10;

  // Evidence (5)
  if (input.evidenceRequired) score += 5;

  // Public rooms need higher clarity — penalize if low
  if (input.joinStyle === 'public' && score < 60) {
    score = Math.max(0, score - 10);
  }

  return Math.min(max, score);
}

/** Map resolution method to risk tier */
export function resolutionRisk(method: string): RiskTier {
  switch (method) {
    case 'auto': return 'low';
    case 'mutual': return 'medium';
    case 'referee': return 'medium';
    case 'community_vote': return 'high';
    default: return 'medium';
  }
}

/* ═══════════════════════════════════════════════════════════════
   1) RuleClarityCard
   ═══════════════════════════════════════════════════════════════ */

export function RuleClarityCard({ score }: { score: number }) {
  const c = useThemeColors();

  const tier: RiskTier =
    score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';
  const tierLabel = score >= 70 ? 'Rõ ràng' : score >= 40 ? 'Cần bổ sung' : 'Mơ hồ';
  const tierColor = RISK_COLORS[tier];

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Scale size={14} color={c.accent} />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
          Rule Clarity Score
        </span>
      </div>

      {/* Animated progress bar */}
      <div className="mb-2">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: c.surface2 }}
        >
          <motion.div
            className="rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%`, background: tierColor.text }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ height: 6 }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${tier}-${score}`}
            className="px-2.5 py-1 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            style={{
              background: tierColor.bg,
              color: tierColor.text,
              fontSize: φ.xs,
              fontWeight: 700,
            }}
          >
            {score}/100 — {tierLabel}
          </motion.span>
        </AnimatePresence>
        <span style={{ color: c.text3, fontSize: 10 }}>
          Luật càng rõ, room càng dễ được tin tưởng
        </span>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2) ResolutionRiskChip
   ═══════════════════════════════════════════════════════════════ */

export function ResolutionRiskChip({
  method,
  size = 'sm',
}: {
  method: string;
  size?: 'sm' | 'md';
}) {
  const risk = resolutionRisk(method);
  const { bg, text, label } = RISK_COLORS[risk];
  const Icon = risk === 'low' ? ShieldCheck : risk === 'medium' ? Shield : ShieldAlert;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg"
      style={{
        background: bg,
        color: text,
        fontSize: size === 'md' ? φ.xs : 10,
        fontWeight: 600,
        padding: size === 'md' ? '4px 10px' : '3px 8px',
      }}
    >
      <Icon size={size === 'md' ? 12 : 10} />
      Rủi ro {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3) Resolution Risk Matrix (Step 4 visual)
   ═══════════════════════════════════════════════════════════════ */

const RISK_MATRIX: { method: string; label: string; risk: RiskTier; icon: string }[] = [
  { method: 'auto', label: 'Auto / Linked', risk: 'low', icon: '🤖' },
  { method: 'mutual', label: 'Mutual Confirm', risk: 'medium', icon: '🤝' },
  { method: 'referee', label: 'Referee', risk: 'medium', icon: '🧑‍⚖️' },
  { method: 'community_vote', label: 'Community Vote', risk: 'high', icon: '🗳️' },
];

export function ResolutionRiskMatrix({ selected }: { selected: string }) {
  const c = useThemeColors();
  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} color="#10B981" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
          Resolution Risk Matrix
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {RISK_MATRIX.map(r => {
          const active = r.method === selected;
          const riskStyle = RISK_COLORS[r.risk];
          return (
            <div
              key={r.method}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg"
              style={{
                background: active ? `${riskStyle.bg}` : 'transparent',
                border: active ? `1.5px solid ${hexToRgba(riskStyle.text, 20)}` : '1.5px solid transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{
                  color: active ? c.text1 : c.text3,
                  fontSize: φ.xs,
                  fontWeight: active ? 700 : 500,
                }}>
                  {r.label}
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: riskStyle.bg,
                  color: riskStyle.text,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {riskStyle.label}
              </span>
            </div>
          );
        })}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4) PublishEligibilityPanel
   ═══════════════════════════════════════════════════════════════ */

export function PublishEligibilityPanel({
  checks,
  status,
}: {
  checks: EligibilityCheck[];
  status: GovernanceStatus;
}) {
  const c = useThemeColors();
  const allPassed = checks.every(ch => ch.passed);

  const statusConfig: Record<GovernanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft:           { label: 'Bản nháp',          color: '#94A3B8', icon: <Clock size={14} color="#94A3B8" /> },
    missing_rules:   { label: 'Thiếu luật',        color: '#F59E0B', icon: <AlertTriangle size={14} color="#F59E0B" /> },
    missing_referee: { label: 'Thiếu referee',     color: '#F59E0B', icon: <AlertTriangle size={14} color="#F59E0B" /> },
    high_risk:       { label: 'Rủi ro cao',        color: '#EF4444', icon: <ShieldAlert size={14} color="#EF4444" /> },
    publish_blocked: { label: 'Chưa đủ điều kiện', color: '#EF4444', icon: <XCircle size={14} color="#EF4444" /> },
    publish_ready:   { label: 'Đủ điều kiện',      color: '#10B981', icon: <CheckCircle size={14} color="#10B981" /> },
  };

  const cfg = statusConfig[status];

  return (
    <TrCard className="p-4" accentBorder={allPassed ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Publish Eligibility
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: hexToRgba(cfg.color, 15), color: cfg.color, fontSize: 10, fontWeight: 700 }}
        >
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {checks.map(ch => (
          <div key={ch.id} className="flex items-start gap-2">
            {ch.passed ? (
              <CheckCircle size={14} color="#10B981" className="shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span style={{
                color: ch.passed ? c.text2 : c.text1,
                fontSize: φ.xs,
                fontWeight: ch.passed ? 500 : 600,
              }}>
                {ch.label}
              </span>
              {!ch.passed && ch.hint && (
                <p style={{ color: '#EF4444', fontSize: 10, marginTop: 1 }}>{ch.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5) RoomSafetySnapshotCard
   ═══════════════════════════════════════════════════════════════ */

export function RoomSafetySnapshotCard({ snapshot }: { snapshot: SafetySnapshot }) {
  const c = useThemeColors();
  const riskStyle = RISK_COLORS[snapshot.riskTier];

  const rows: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'Format',     value: snapshot.format,     icon: <Eye size={12} color={c.text3} /> },
    { label: 'Resolution', value: snapshot.resolution,  icon: <Scale size={12} color={c.text3} /> },
    { label: 'Evidence',   value: snapshot.evidence,    icon: <FileWarning size={12} color={c.text3} /> },
    { label: 'Privacy',    value: snapshot.privacy,     icon: <Lock size={12} color={c.text3} /> },
    { label: 'Void rule',  value: snapshot.voidRule || '—', icon: <AlertTriangle size={12} color={c.text3} /> },
  ];

  return (
    <TrCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Room Safety Snapshot
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{ background: riskStyle.bg, color: riskStyle.text, fontSize: 10, fontWeight: 700 }}
        >
          Risk: {riskStyle.label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="flex items-center justify-between"
            style={{
              paddingBottom: i < rows.length - 1 ? 6 : 0,
              borderBottom: i < rows.length - 1 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <div className="flex items-center gap-2">
              {r.icon}
              <span style={{ color: c.text3, fontSize: φ.xs }}>{r.label}</span>
            </div>
            <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, maxWidth: '55%', textAlign: 'right' as const }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6) PolicyVersionTag
   ═══════════════════════════════════════════════════════════════ */

export function PolicyVersionTag({ version = 'v1.0' }: { version?: string }) {
  const c = useThemeColors();
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
      style={{ background: c.surface2, color: c.text3, fontSize: 10, fontWeight: 600 }}
    >
      <Shield size={9} />
      Policy {version}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7) GovernanceHintBanner
   ═══════════════════════════════════════════════════════════════ */

export function GovernanceHintBanner({
  text,
  type = 'info',
}: {
  text: string;
  type?: 'info' | 'warning' | 'success';
}) {
  const c = useThemeColors();
  const config = {
    info:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', color: '#3B82F6', Icon: Info },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', color: '#F59E0B', Icon: AlertTriangle },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', color: '#10B981', Icon: CheckCircle },
  };
  const cfg = config[type];

  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon size={14} color={cfg.color} className="shrink-0 mt-0.5" />
      <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8) EligibilityNoteCard (Step 2 — Join Style notes)
   ═══════════════════════════════════════════════════════════════ */

const JOIN_STYLE_NOTES: Record<string, { label: string; note: string; icon: React.ReactNode; type: 'info' | 'warning' | 'success' }> = {
  public:      { label: 'Public room',  note: 'Room công khai cần luật rõ ràng hơn để tránh tranh chấp từ người lạ. Rule Clarity Score sẽ được áp dụng nghiêm hơn.', icon: <Eye size={14} color="#3B82F6" />, type: 'info' },
  invite_only: { label: 'Invite only',  note: 'Phù hợp khi bạn đã biết đối thủ. Hỗ trợ referee / mutual confirm tốt hơn vì các bên quen nhau.', icon: <Lock size={14} color="#10B981" />, type: 'success' },
  unlisted:    { label: 'Unlisted',     note: 'Room không xuất hiện trong danh sách khám phá, chỉ ai có link mới vào. Ít tranh chấp hơn nhưng cũng ít người tham gia.', icon: <Link2 size={14} color="#F59E0B" />, type: 'warning' },
};

export function EligibilityNoteCard({ joinStyle }: { joinStyle: string }) {
  const info = JOIN_STYLE_NOTES[joinStyle];
  if (!info) return null;
  return (
    <GovernanceHintBanner text={info.note} type={info.type} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   9) ParticipantGovernanceCard (for ArenaChallengeDetailPage)
   ═══════════════════════════════════════════════════════════════ */

export function ParticipantGovernanceCard({
  resolutionMethod,
  evidenceRequired,
  voidRule,
  privacy,
}: {
  resolutionMethod?: string;
  evidenceRequired?: string;
  voidRule?: string;
  privacy?: string;
}) {
  const c = useThemeColors();
  const method = resolutionMethod || 'auto';
  const risk = resolutionRisk(method === 'Tự động' ? 'auto' : method === 'Mutual Confirm' ? 'mutual' : method === 'Referee' ? 'referee' : method === 'Community Vote' ? 'community_vote' : method);
  const riskStyle = RISK_COLORS[risk];

  const rows = [
    { label: 'Chốt kết quả', value: resolutionMethod || 'Tự động' },
    { label: 'Rủi ro', value: riskStyle.label, color: riskStyle.text },
    { label: 'Bằng chứng', value: evidenceRequired || 'Không yêu cầu' },
    { label: 'Void rule', value: voidRule || 'Theo chính sách chung' },
    { label: 'Quyền riêng tư', value: privacy || 'Công khai' },
  ];

  return (
    <TrCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} color="#10B981" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Governance & Trust
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ResolutionRiskChip method={method === 'Tự động' ? 'auto' : method === 'Mutual Confirm' ? 'mutual' : method === 'Referee' ? 'referee' : method === 'Community Vote' ? 'community_vote' : method} size="sm" />
          <PolicyVersionTag />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="flex items-center justify-between"
            style={{
              paddingBottom: i < rows.length - 1 ? 6 : 0,
              borderBottom: i < rows.length - 1 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <span style={{ color: c.text3, fontSize: φ.xs }}>{r.label}</span>
            <span style={{
              color: r.color || c.text1,
              fontSize: φ.xs,
              fontWeight: 600,
            }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   10) ParticipantPreviewSheet (for ArenaStudio Step 6)
   ═══════════════════════════════════════════════════════════════ */

export interface PreviewData {
  title: string;
  description: string;
  matchFormat: string;
  maxParticipants: number;
  entryPoints: number;
  prizePool: number;
  endDate: string;
  privacy: string;
  resolutionMethod: string;
  evidenceRequired: boolean;
  voidRule: string;
  tieRule: string;
  creator: string;
}

export function ParticipantPreviewSheet({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: PreviewData;
}) {
  const c = useThemeColors();
  const riskTier = resolutionRisk(data.resolutionMethod);
  const riskStyle = RISK_COLORS[riskTier];
  const [viewMode, setViewMode] = React.useState<'mobile' | 'desktop'>('mobile');

  const isMobile = viewMode === 'mobile';

  /* ── Shared preview content (rendered inside device frame) ── */
  const previewContent = (
    <div className="flex flex-col gap-4" style={{ padding: isMobile ? 16 : 20 }}>

      {/* Title + chips */}
      <div>
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
            Đang mở
          </span>
          <span className="px-2.5 py-1 rounded-lg" style={{ background: c.chipBg, color: c.chipText, fontSize: 10, fontWeight: 600 }}>
            {data.matchFormat}
          </span>
          <span className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>
            Points-only
          </span>
          <ResolutionRiskChip method={data.resolutionMethod} size="sm" />
        </div>
        <p style={{ color: c.text1, fontSize: isMobile ? φ.md : φ.body, fontWeight: 700, lineHeight: 1.3 }}>
          {data.title || 'Chưa đặt tên'}
        </p>
        {data.description && (
          <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginTop: 4 }}>
            {data.description}
          </p>
        )}
      </div>

      {/* Desktop: 2-column layout / Mobile: stacked */}
      {!isMobile ? (
        <div className="flex gap-4">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Stats grid */}
            <TrCard className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <p style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                    {data.entryPoints}
                  </p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Entry Points</p>
                </div>
                <div className="text-center">
                  <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                    {data.prizePool.toLocaleString()}
                  </p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Prize Pool (est.)</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 8 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Người tham gia</span>
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                    0 / {data.maxParticipants}
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                  <div className="h-full rounded-full" style={{ width: '0%', background: '#3B82F6' }} />
                </div>
              </div>
            </TrCard>

            {/* Rules summary */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} color="#10B981" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tóm tắt luật chơi</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Chốt kết quả', value: data.resolutionMethod || 'Tự động' },
                  { label: 'Bằng chứng', value: data.evidenceRequired ? 'Bắt buộc' : 'Không yêu cầu' },
                  { label: 'Luật hòa', value: data.tieRule || 'Pool chia đều' },
                  { label: 'Hủy / Void', value: data.voidRule || 'Theo chính sách chung' },
                  { label: 'Kết thúc', value: data.endDate },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 90 }}>{row.label}</span>
                    <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>

          {/* Right column — Governance + warnings */}
          <div className="flex-1 flex flex-col gap-4">
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} color="#10B981" />
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Governance & Trust</span>
                </div>
                <PolicyVersionTag />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between" style={{ paddingBottom: 6, borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Risk tier</span>
                  <span className="px-2 py-0.5 rounded-md" style={{ background: riskStyle.bg, color: riskStyle.text, fontSize: 10, fontWeight: 600 }}>
                    {riskStyle.label}
                  </span>
                </div>
                <div className="flex items-center justify-between" style={{ paddingBottom: 6, borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Quyền riêng tư</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.privacy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Người tạo</span>
                  <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.creator}</span>
                </div>
              </div>
            </TrCard>

            <GovernanceHintBanner text="Arena Points chỉ dùng trong Open Arena, không phải tài sản tài chính." type="info" />

            {/* Mock CTA */}
            <div className="flex gap-3">
              <div className="flex-1 py-3 rounded-2xl flex items-center justify-center" style={{
                background: '#8B5CF6', color: '#fff', fontSize: φ.sm, fontWeight: 700, opacity: 0.5, minHeight: 48,
              }}>
                Tham gia · {data.entryPoints} pts
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mobile: stacked layout (original) ── */
        <div className="contents">
          {/* Stats grid */}
          <TrCard className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <p style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                  {data.entryPoints}
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Entry Points</p>
              </div>
              <div className="text-center">
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                  {data.prizePool.toLocaleString()}
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Prize Pool (est.)</p>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 8 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ color: c.text2, fontSize: φ.xs }}>Người tham gia</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  0 / {data.maxParticipants}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                <div className="h-full rounded-full" style={{ width: '0%', background: '#3B82F6' }} />
              </div>
            </div>
          </TrCard>

          {/* Rules summary */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} color="#10B981" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tóm tắt luật chơi</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Chốt kết quả', value: data.resolutionMethod || 'Tự động' },
                { label: 'Bằng chứng', value: data.evidenceRequired ? 'Bắt buộc' : 'Không yêu cầu' },
                { label: 'Luật hòa', value: data.tieRule || 'Pool chia đều' },
                { label: 'Hủy / Void', value: data.voidRule || 'Theo chính sách chung' },
                { label: 'Kết thúc', value: data.endDate },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 90 }}>{row.label}</span>
                  <span className="text-right flex-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Governance card */}
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} color="#10B981" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Governance & Trust</span>
              </div>
              <PolicyVersionTag />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between" style={{ paddingBottom: 6, borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: φ.xs }}>Risk tier</span>
                <span className="px-2 py-0.5 rounded-md" style={{ background: riskStyle.bg, color: riskStyle.text, fontSize: 10, fontWeight: 600 }}>
                  {riskStyle.label}
                </span>
              </div>
              <div className="flex items-center justify-between" style={{ paddingBottom: 6, borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: φ.xs }}>Quyền riêng tư</span>
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.privacy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Người tạo</span>
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{data.creator}</span>
              </div>
            </div>
          </TrCard>

          {/* Warning banners */}
          <GovernanceHintBanner text="Arena Points chỉ dùng trong Open Arena, không phải tài sản tài chính." type="info" />

          {/* Mock CTA */}
          <div className="flex gap-3">
            <div className="flex-1 py-3 rounded-2xl flex items-center justify-center" style={{
              background: '#8B5CF6', color: '#fff', fontSize: φ.sm, fontWeight: 700, opacity: 0.5, minHeight: 48,
            }}>
              Tham gia · {data.entryPoints} pts
            </div>
          </div>
        </div>
      )}

      <p style={{ color: c.text3, fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
        Đây là bản xem trước. Participant sẽ thấy nội dung này sau khi room được duyệt.
      </p>
    </div>
  );

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      showHandle={true}
      showCloseButton={false}
      maxHeight="92vh"
      customHeader={
        <div className="flex items-center justify-between px-5 pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-2">
            <Eye size={16} color={c.accent} />
            <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
              Xem trước
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(['mobile', 'desktop'] as const).map(mode => {
              const active = viewMode === mode;
              const ModeIcon = mode === 'mobile' ? Smartphone : Monitor;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : 'transparent',
                    border: active ? `1.5px solid ${c.chipActiveBorder}` : '1.5px solid transparent',
                  }}
                  aria-label={mode === 'mobile' ? 'Mobile view' : 'Desktop view'}
                >
                  <ModeIcon size={14} color={active ? c.chipActiveText : c.text3} />
                </button>
              );
            })}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:opacity-70 ml-1"
              style={{ background: c.surface2 }}
            >
              <XCircle size={14} color={c.text3} />
            </button>
          </div>
        </div>
      }
    >
        {/* Device label */}
        <div className="flex items-center justify-center gap-2 py-2 -mx-5" style={{ background: c.surface2 }}>
          {isMobile ? <Smartphone size={12} color={c.text3} /> : <Monitor size={12} color={c.text3} />}
          <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
            {isMobile ? 'Mobile — 390×844' : 'Desktop — 1280×800'}
          </span>
        </div>

        {/* Device frame wrapper */}
        {isMobile ? (
          <div style={{ maxWidth: 390, margin: '0 auto', width: '100%' }}>
            {previewContent}
          </div>
        ) : (
          <div className="px-3 py-3" style={{ overflow: 'hidden' }}>
            <div
              className="rounded-xl"
              style={{
                border: `2px solid ${c.surface2}`,
                background: c.surface,
                transform: 'scale(0.55)',
                transformOrigin: 'top center',
                width: 720,
                margin: '0 auto',
                marginBottom: -200,
              }}
            >
              {previewContent}
            </div>
          </div>
        )}
    </BottomSheetV2>
  );
}