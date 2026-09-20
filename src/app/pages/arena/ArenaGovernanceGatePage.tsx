import React, { useState, useMemo } from 'react';
import {
  Check, ChevronDown, ChevronRight, ChevronLeft, Search, X,
  AlertTriangle, Info, Shield, ShieldCheck, ShieldAlert, Target,
  Eye, Sparkles, HelpCircle, BookOpen, Lock, Unlock,
  ArrowRight, Lightbulb, Clock, Save, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useGoBack } from '../../hooks/useGoBack';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

type DomainId =
  | 'sports' | 'esports' | 'crypto' | 'tech' | 'science'
  | 'health' | 'entertainment' | 'work' | 'community' | 'other';

type ChallengeType =
  | 'yes_no' | 'multi_choice' | 'closest_guess' | 'highest_wins'
  | 'lowest_wins' | 'first_to_finish' | 'team_score' | 'referee_decision'
  | 'community_vote' | 'proof_challenge';

type RoomPrivacy = 'public' | 'private' | 'unlisted';
type ClarityLevel = 'low' | 'medium' | 'high' | 'public_ready';
type EligibilityTier = 'green' | 'amber' | 'red';
type AmbiguityType = 'duplicate_desc' | 'unclear_resolution' | 'public_insufficient' | 'custom_invite' | 'missing_edge';
type RiskTier = 'low' | 'medium' | 'high';

const DOMAIN_LABELS: Record<DomainId, string> = {
  sports: 'Thể thao', esports: 'Esports / Game', crypto: 'Crypto / Markets',
  tech: 'Công nghệ / AI', science: 'Khoa học / Học tập', health: 'Sức khỏe / Lifestyle',
  entertainment: 'Giải trí / Văn hóa', work: 'Công việc / Năng suất',
  community: 'Cộng đồng / Sự kiện', other: 'Khác',
};

const DOMAIN_ICONS: Record<DomainId, string> = {
  sports: '⚽', esports: '🎮', crypto: '📈', tech: '🤖', science: '🔬',
  health: '💪', entertainment: '🎬', work: '💼', community: '🎪', other: '🎲',
};

const CHALLENGE_TYPE_MAP: Record<ChallengeType, { label: string; icon: string }> = {
  yes_no: { label: 'Yes / No', icon: '✅' },
  multi_choice: { label: 'Multi-choice', icon: '📋' },
  closest_guess: { label: 'Closest Guess', icon: '🎯' },
  highest_wins: { label: 'Highest Wins', icon: '📊' },
  lowest_wins: { label: 'Lowest Wins', icon: '📉' },
  first_to_finish: { label: 'First To Finish', icon: '🏁' },
  team_score: { label: 'Team Score', icon: '⚔️' },
  referee_decision: { label: 'Referee Decision', icon: '🧑‍⚖️' },
  community_vote: { label: 'Community Vote', icon: '🗳️' },
  proof_challenge: { label: 'Proof Challenge', icon: '📸' },
};

const TIE_RULES = [
  { id: 'split_equal', label: 'Chia đều pool' },
  { id: 'refund', label: 'Hoàn trả entry points' },
  { id: 'rematch', label: 'Chơi lại (rematch)' },
  { id: 'referee', label: 'Trọng tài quyết định' },
  { id: 'random', label: 'Bốc thăm ngẫu nhiên' },
];

const VOID_RULES = [
  { id: 'no_evidence', label: 'Không đủ bằng chứng → hủy' },
  { id: 'external_cancel', label: 'Sự kiện gốc bị hủy → hủy' },
  { id: 'min_participants', label: 'Không đủ người tham gia → hủy' },
  { id: 'timeout', label: 'Quá hạn chốt kết quả → hủy' },
];

const RESULT_DEADLINES = [
  { id: '1h', label: '1 giờ sau kết thúc' },
  { id: '6h', label: '6 giờ sau kết thúc' },
  { id: '24h', label: '24 giờ sau kết thúc' },
  { id: '48h', label: '48 giờ sau kết thúc' },
  { id: '7d', label: '7 ngày sau kết thúc' },
];

const RESOLUTION_SOURCES = [
  { id: 'api', label: 'API / Oracle tự động' },
  { id: 'manual', label: 'Creator nhập thủ công' },
  { id: 'referee', label: 'Trọng tài xác nhận' },
  { id: 'community', label: 'Cộng đồng bình chọn' },
  { id: 'proof', label: 'Bằng chứng xác minh' },
];

/* ─── Wizard State ─── */
interface GovState {
  title: string;
  domain: DomainId | '';
  challengeType: ChallengeType | '';
  privacy: RoomPrivacy;
  // Win condition
  subject: string;
  action: string;
  metric: string;
  winType: string;
  deadlineContext: string;
  customWinCondition: string;
  // Details
  description: string;
  endDate: string;
  tieRule: string;
  voidRule: string;
  resultDeadline: string;
  resolutionSource: string;
  rematchEnabled: boolean;
  saveAsMode: boolean;
}

const initialGovState: GovState = {
  title: '',
  domain: '',
  challengeType: '',
  privacy: 'public',
  subject: '',
  action: '',
  metric: '',
  winType: '',
  deadlineContext: '',
  customWinCondition: '',
  description: '',
  endDate: '2026-03-15',
  tieRule: '',
  voidRule: '',
  resultDeadline: '',
  resolutionSource: '',
  rematchEnabled: false,
  saveAsMode: false,
};

// Builder options
const SUBJECTS = ['Người chơi', 'Đội', 'Cá nhân', 'Tất cả'];
const ACTIONS = ['đoán gần đúng nhất', 'đạt điểm cao nhất', 'đạt điểm thấp nhất', 'hoàn thành trước', 'đúng đáp án', 'gửi bằng chứng hợp lệ', 'được vote nhiều nhất'];
const METRICS = ['giá', 'điểm số', 'tỷ số', 'thời gian', 'số lượng', 'kết quả sự kiện'];
const WIN_TYPES = ['sẽ thắng', 'sẽ được công nhận', 'sẽ nhận toàn bộ pool'];
const DEADLINE_CTXS = ['vào ngày kết thúc', 'lúc 23:59 UTC', 'sau khi sự kiện kết thúc', 'khi có kết quả chính thức'];

/* ═══════════════════════════════════════════════════════════════
   GOVERNANCE ENGINE
   ═══════════════════════════════════════════════════════════════ */

interface EligibilityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  hint: string;
  requiredForPublic: boolean;
}

function computeGovernance(s: GovState) {
  const isPublic = s.privacy === 'public';
  const isCustomDomain = s.domain === 'other';
  const hasStructuredWin = !!(s.subject && s.action);
  const hasFreeTextWin = s.customWinCondition.length >= 10;
  const hasWinCondition = hasStructuredWin || hasFreeTextWin;

  // Clarity score
  let clarity = 0;
  if (s.title.length >= 5) clarity += 10; else if (s.title.length >= 3) clarity += 5;
  if (s.domain && s.domain !== 'other') clarity += 10; else if (s.domain === 'other') clarity += 4;
  if (s.challengeType) clarity += 10;
  if (s.subject) clarity += 7;
  if (s.action) clarity += 7;
  if (s.metric) clarity += 5;
  if (s.winType) clarity += 4;
  if (s.deadlineContext) clarity += 4;
  if (hasFreeTextWin) clarity += 10;
  if (s.description.length >= 15) clarity += 6; else if (s.description.length >= 5) clarity += 3;
  if (s.tieRule) clarity += 8;
  if (s.voidRule) clarity += 8;
  if (s.resultDeadline) clarity += 8;
  if (s.resolutionSource) clarity += 8;
  if (s.endDate) clarity += 5;
  clarity = Math.min(100, clarity);

  let clarityLevel: ClarityLevel = 'low';
  if (clarity >= 85) clarityLevel = 'public_ready';
  else if (clarity >= 60) clarityLevel = 'high';
  else if (clarity >= 35) clarityLevel = 'medium';

  // Checks
  const checks: EligibilityCheckItem[] = [
    { id: 'domain', label: 'Lĩnh vực đã chọn', passed: !!s.domain, hint: 'Chọn lĩnh vực cho challenge', requiredForPublic: true },
    { id: 'type', label: 'Loại challenge đã chọn', passed: !!s.challengeType, hint: 'Chọn loại challenge', requiredForPublic: true },
    { id: 'win', label: 'Cách thắng rõ ràng', passed: hasWinCondition, hint: 'Dùng Builder hoặc tự nhập ≥10 ký tự', requiredForPublic: true },
    { id: 'resolution', label: 'Cách chốt kết quả rõ', passed: !!s.resolutionSource, hint: 'Chọn nguồn chốt kết quả', requiredForPublic: true },
    { id: 'tie', label: 'Luật hòa (tie rule)', passed: !!s.tieRule, hint: 'Nên có để tránh tranh chấp', requiredForPublic: true },
    { id: 'void', label: 'Luật hủy bỏ (void rule)', passed: !!s.voidRule, hint: 'Nên có cho trường hợp bất khả kháng', requiredForPublic: true },
    { id: 'deadline', label: 'Deadline kết quả', passed: !!s.resultDeadline, hint: 'Xác định thời hạn chốt kết quả', requiredForPublic: true },
  ];

  const publicChecks = checks.filter(ch => ch.requiredForPublic);
  const allPublicPassed = publicChecks.every(ch => ch.passed);
  const anyPassed = checks.some(ch => ch.passed);
  const passedCount = checks.filter(ch => ch.passed).length;

  // Eligibility tier
  let eligibility: EligibilityTier = 'red';
  if (isPublic) {
    if (allPublicPassed && clarity >= 60) eligibility = 'green';
    else if (passedCount >= 4) eligibility = 'amber';
    else eligibility = 'red';
  } else {
    // Private/unlisted more lenient
    if (hasWinCondition && passedCount >= 3) eligibility = 'green';
    else if (anyPassed) eligibility = 'amber';
    else eligibility = 'red';
  }

  // Ambiguity warnings
  const ambiguities: { type: AmbiguityType; text: string }[] = [];
  if (s.description && s.customWinCondition && s.description.length > 10 && s.customWinCondition.length > 10) {
    const descLower = s.description.toLowerCase();
    const winLower = s.customWinCondition.toLowerCase();
    if (descLower.includes(winLower.slice(0, 20)) || winLower.includes(descLower.slice(0, 20))) {
      ambiguities.push({ type: 'duplicate_desc', text: 'Mô tả và điều kiện thắng có nội dung trùng lặp. Hãy phân biệt rõ: mô tả = bối cảnh, điều kiện thắng = cách xác định người thắng.' });
    }
  }
  if (!s.resolutionSource && hasWinCondition) {
    ambiguities.push({ type: 'unclear_resolution', text: 'Chưa rõ cách chốt kết quả. Người tham gia cần biết ai/hệ thống nào xác nhận kết quả.' });
  }
  if (isPublic && !allPublicPassed) {
    ambiguities.push({ type: 'public_insufficient', text: 'Room public nhưng chưa đủ thông tin bắt buộc. Hoàn thành checklist hoặc chuyển sang Private.' });
  }
  if (isCustomDomain && isPublic && clarity < 60) {
    ambiguities.push({ type: 'custom_invite', text: 'Custom rules trên room public cần rõ ràng hơn. Gợi ý: chuyển sang Invite Only hoặc bổ sung chi tiết.' });
  }
  if (!s.tieRule && !s.voidRule) {
    ambiguities.push({ type: 'missing_edge', text: 'Thiếu luật hòa và luật hủy bỏ. Bổ sung để tránh tranh chấp khi có tình huống đặc biệt.' });
  }

  // Risk tier
  let riskTier: RiskTier = 'low';
  if (s.resolutionSource === 'community' || s.resolutionSource === 'manual') riskTier = 'medium';
  if (isCustomDomain && isPublic && clarity < 50) riskTier = 'high';
  if (!hasWinCondition && isPublic) riskTier = 'high';

  // Privacy recommendation
  let privacyRecommendation = '';
  if (isPublic && clarity < 60) privacyRecommendation = 'Nên chuyển sang Private hoặc Unlisted cho đến khi rule rõ ràng hơn.';
  if (isCustomDomain && isPublic) privacyRecommendation = 'Custom domain trên room Public cần rule rất rõ. Cân nhắc Invite Only nếu rule phức tạp.';

  // Suggested next action
  let nextAction = '';
  if (!s.domain) nextAction = 'Chọn lĩnh vực';
  else if (!s.challengeType) nextAction = 'Chọn loại challenge';
  else if (!hasWinCondition) nextAction = 'Thiết lập điều kiện thắng';
  else if (!s.resolutionSource) nextAction = 'Chọn cách chốt kết quả';
  else if (!s.tieRule) nextAction = 'Thêm luật hòa';
  else if (!s.voidRule) nextAction = 'Thêm luật hủy bỏ';
  else if (!s.resultDeadline) nextAction = 'Chọn deadline kết quả';
  else if (eligibility === 'green') nextAction = 'Sẵn sàng tiếp tục!';
  else nextAction = 'Hoàn thiện các mục còn thiếu';

  return { clarity, clarityLevel, checks, eligibility, ambiguities, riskTier, privacyRecommendation, nextAction, isCustomDomain, hasStructuredWin, hasFreeTextWin };
}

const CLARITY_CONFIG: Record<ClarityLevel, { label: string; color: string; bg: string }> = {
  low: { label: 'Thấp', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'Cao', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  public_ready: { label: 'Public-ready', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
};

const ELIGIBILITY_CONFIG: Record<EligibilityTier, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck; desc: string }> = {
  green: { label: 'Public-ready', color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', icon: ShieldCheck, desc: 'Room đủ tiêu chuẩn publish công khai' },
  amber: { label: 'Private only', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: Shield, desc: 'Có thể publish dạng Private/Unlisted, cần bổ sung để publish Public' },
  red: { label: 'Chưa đủ điều kiện', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: ShieldAlert, desc: 'Cần hoàn thành thêm thông tin trước khi publish' },
};

const RISK_CONFIG: Record<RiskTier, { label: string; color: string; bg: string }> = {
  low: { label: 'Thấp', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'Cao', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

/* ═══════════════════════════════════════════════════════════════
   REUSABLE GOVERNANCE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── PublishEligibilityPanel_v2 ─── */
function PublishEligibilityPanelV2({
  checks, tier, clarity, clarityLevel,
}: {
  checks: EligibilityCheckItem[];
  tier: EligibilityTier;
  clarity: number;
  clarityLevel: ClarityLevel;
}) {
  const c = useThemeColors();
  const cfg = ELIGIBILITY_CONFIG[tier];
  const cc = CLARITY_CONFIG[clarityLevel];
  const IconComp = cfg.icon;

  return (
    <TrCard className="overflow-hidden" accentBorder={cfg.border}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ background: cfg.bg }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: hexToRgba(cfg.color, 0.08) }}>
          <IconComp size={20} color={cfg.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: cfg.color, fontSize: φ.sm, fontWeight: 700 }}>{cfg.label}</span>
            <span className="px-1.5 py-0.5 rounded-md" style={{ background: cc.bg, color: cc.color, fontSize: 9, fontWeight: 700 }}>
              Clarity: {clarity}
            </span>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>{cfg.desc}</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {checks.map(ch => (
          <div key={ch.id} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{
              background: ch.passed ? '#10B981' : 'transparent',
              border: ch.passed ? 'none' : `2px solid ${c.text3}`,
            }}>
              {ch.passed && <Check size={11} color="#fff" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span style={{
                  color: ch.passed ? c.text1 : c.text3,
                  fontSize: 12,
                  fontWeight: ch.passed ? 600 : 500,
                  textDecoration: ch.passed ? 'none' : 'none',
                }}>
                  {ch.label}
                </span>
                {ch.requiredForPublic && !ch.passed && (
                  <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 700 }}>PUBLIC</span>
                )}
              </div>
              {!ch.passed && (
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3, marginTop: 1 }}>{ch.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${c.divider}`, background: cfg.bg }}>
        <span style={{ color: c.text3, fontSize: 10 }}>{checks.filter(ch => ch.passed).length} / {checks.length} hoàn thành</span>
        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
          <div className="h-full rounded-full" style={{
            width: `${(checks.filter(ch => ch.passed).length / checks.length) * 100}%`,
            background: cfg.color,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </TrCard>
  );
}

/* ─── AmbiguityWarningBanner ─── */
function AmbiguityWarningBanner({
  warnings,
}: {
  warnings: { type: AmbiguityType; text: string }[];
}) {
  const c = useThemeColors();

  if (warnings.length === 0) return null;

  const iconMap: Record<AmbiguityType, { icon: typeof AlertTriangle; color: string }> = {
    duplicate_desc: { icon: Info, color: '#F59E0B' },
    unclear_resolution: { icon: HelpCircle, color: '#EF4444' },
    public_insufficient: { icon: ShieldAlert, color: '#EF4444' },
    custom_invite: { icon: Lock, color: '#F59E0B' },
    missing_edge: { icon: AlertTriangle, color: '#F97316' },
  };

  return (
    <div className="flex flex-col gap-2">
      {warnings.map((w, i) => {
        const cfg = iconMap[w.type];
        const IconComp = cfg.icon;
        return (
          <motion.div
            key={`${w.type}-${i}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
            style={{ background: hexToRgba(cfg.color, 0.03), border: `1px solid ${hexToRgba(cfg.color, 0.09)}` }}
          >
            <IconComp size={14} color={cfg.color} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{w.text}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── SuggestedFallbackCard ─── */
function SuggestedFallbackCard({
  eligibility, isCustom, hasWin, clarity, privacy,
  onSuggest,
}: {
  eligibility: EligibilityTier;
  isCustom: boolean;
  hasWin: boolean;
  clarity: number;
  privacy: RoomPrivacy;
  onSuggest: (suggestion: string) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  if (eligibility === 'green' && clarity >= 60) return null;

  const suggestions: { label: string; desc: string; icon: string; action: string }[] = [];

  if (!hasWin || clarity < 40) {
    suggestions.push({ label: 'Chuyển sang Closest Guess', desc: 'Người đoán gần đúng nhất thắng — đơn giản, rõ ràng', icon: '🎯', action: 'closest_guess' });
    suggestions.push({ label: 'Chuyển sang Proof Challenge', desc: 'Yêu cầu bằng chứng — dễ xác minh kết quả', icon: '📸', action: 'proof_challenge' });
  }
  if (privacy === 'public' && clarity < 60) {
    suggestions.push({ label: 'Chuyển sang Invite Only', desc: 'Giảm yêu cầu rule cho room riêng tư', icon: '🔒', action: 'invite_only' });
  }
  if (isCustom) {
    suggestions.push({ label: 'Chọn Referee', desc: 'Để trọng tài quyết định kết quả — giảm mơ hồ', icon: '🧑‍⚖️', action: 'referee' });
  }
  if (eligibility !== 'green') {
    suggestions.push({ label: 'Bổ sung tie/void rules', desc: 'Thêm luật hòa và hủy bỏ để nâng clarity', icon: '⚖️', action: 'add_rules' });
  }

  if (suggestions.length === 0) return null;

  return (
    <TrCard className="p-4" accentBorder="rgba(59,130,246,0.15)">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} color="#3B82F6" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Gợi ý cải thiện</span>
        <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 8, fontWeight: 700 }}>
          SMART
        </span>
      </div>
      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>
        Rule chưa đủ rõ cho room hiện tại. Thử các gợi ý sau:
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => { onSuggest(s.action); hapticSelection(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left active:opacity-70"
            style={{ background: c.surface2, border: `1px solid ${c.divider}`, minHeight: 44 }}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{s.label}</p>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{s.desc}</p>
            </div>
            <ArrowRight size={14} color={c.text3} />
          </button>
        ))}
      </div>
    </TrCard>
  );
}

/* ─── PublicPrivateGuidanceSheet ─── */
function PublicPrivateGuidanceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useThemeColors();

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Public vs Private Room">
      <div className="flex flex-col gap-4">
        <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
          <div className="flex items-center gap-2 mb-2">
            <Unlock size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Public Room</span>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
            Ai cũng thấy và tham gia được. Rule cần rõ ràng nhất để tránh tranh chấp.
          </p>
          <div className="flex flex-col gap-1.5">
            {['Lĩnh vực bắt buộc', 'Loại challenge bắt buộc', 'Điều kiện thắng hoàn chỉnh', 'Luật hòa & hủy bỏ', 'Hạn chốt kết quả', 'Nguồn xác minh'].map(r => (
              <div key={r} className="flex items-center gap-2">
                <Check size={11} color="#10B981" />
                <span style={{ color: c.text2, fontSize: 11 }}>{r}</span>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>Private / Unlisted</span>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
            Chỉ người được mời hoặc có link. Linh hoạt hơn về rule, phù hợp custom domain.
          </p>
          <div className="flex flex-col gap-1.5">
            {['Custom rule thoải mái', 'Vẫn nên có điều kiện thắng', 'Domain/type không bắt buộc', 'Cảnh báo nhẹ nếu rule mơ hồ'].map(r => (
              <div key={r} className="flex items-center gap-2">
                <Info size={11} color="#F59E0B" />
                <span style={{ color: c.text2, fontSize: 11 }}>{r}</span>
              </div>
            ))}
          </div>
        </TrCard>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)' }}>
          <Shield size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Governance Gate không cản bạn — mà giúp bạn tạo room mà người chơi tin tưởng và ít tranh chấp.
          </p>
        </div>
      </div>
    </BottomSheetV2>
  );
}

/* ─── GeneratedGovernanceSummary ─── */
function GeneratedGovernanceSummary({
  clarity, clarityLevel, eligibility, riskTier,
  resolutionSource, privacy, privacyRecommendation, nextAction,
}: {
  clarity: number; clarityLevel: ClarityLevel; eligibility: EligibilityTier; riskTier: RiskTier;
  resolutionSource: string; privacy: RoomPrivacy; privacyRecommendation: string; nextAction: string;
}) {
  const c = useThemeColors();
  const cc = CLARITY_CONFIG[clarityLevel];
  const ec = ELIGIBILITY_CONFIG[eligibility];
  const rc = RISK_CONFIG[riskTier];

  const resLabel = RESOLUTION_SOURCES.find(r => r.id === resolutionSource)?.label || '—';
  const privacyLabel = privacy === 'public' ? 'Công khai' : privacy === 'private' ? 'Riêng tư' : 'Unlisted';

  const rows = [
    { label: 'Rule clarity', value: `${clarity} / 100`, color: cc.color, badge: cc.label },
    { label: 'Publish eligibility', value: ec.label, color: ec.color },
    { label: 'Risk tier', value: rc.label, color: rc.color },
    { label: 'Resolution method', value: resLabel, color: c.text1 },
    { label: 'Privacy', value: privacyLabel, color: c.text1 },
  ];

  return (
    <TrCard className="p-4" accentBorder="rgba(139,92,246,0.15)">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} color="#8B5CF6" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Governance Summary</span>
        <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
          TỰ SINH
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between" style={{
            paddingBottom: i < rows.length - 1 ? 8 : 0,
            borderBottom: i < rows.length - 1 ? `1px solid ${c.divider}` : 'none',
          }}>
            <span style={{ color: c.text3, fontSize: φ.xs }}>{r.label}</span>
            <div className="flex items-center gap-1.5">
              <span style={{ color: r.color, fontSize: φ.xs, fontWeight: 700 }}>{r.value}</span>
              {r.badge && (
                <span className="px-1.5 py-0.5 rounded-md" style={{ background: hexToRgba(r.color, 0.08), color: r.color, fontSize: 8, fontWeight: 700 }}>
                  {r.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Privacy recommendation */}
      {privacyRecommendation && (
        <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <Lightbulb size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{privacyRecommendation}</p>
        </div>
      )}

      {/* Next action */}
      <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl" style={{
        background: eligibility === 'green' ? 'rgba(16,185,129,0.06)' : 'rgba(59,130,246,0.06)',
        border: `1px solid ${eligibility === 'green' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)'}`,
      }}>
        {eligibility === 'green' ? <Check size={13} color="#10B981" /> : <ArrowRight size={13} color="#3B82F6" />}
        <span style={{ color: eligibility === 'green' ? '#10B981' : '#3B82F6', fontSize: 12, fontWeight: 600 }}>
          {nextAction}
        </span>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMALL HELPERS (inline dropdowns, builder, etc.)
   ═══════════════════════════════════════════════════════════════ */

function MiniDropdown({ label, options, value, onChange, color }: {
  label: string; options: { id: string; label: string }[];
  value: string; onChange: (v: string) => void; color?: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); hapticSelection(); }}
        className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl active:opacity-70"
        style={{ background: c.searchBg, border: `1.5px solid ${value ? hexToRgba(color || '#8B5CF6', 30) : c.searchBorder}`, minHeight: 44 }}
      >
        <span style={{ color: selected ? c.text1 : c.text3, fontSize: φ.sm, fontWeight: selected ? 600 : 400 }}>
          {selected ? selected.label : `Chọn ${label.toLowerCase()}...`}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={14} color={c.text3} /></motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 rounded-xl overflow-hidden z-30 relative"
            style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); hapticSelection(); }}
                className="w-full text-left px-3.5 py-2.5 active:opacity-70 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${c.divider}`, minHeight: 40,
                  background: value === opt.id ? hexToRgba(color || '#8B5CF6', 8) : 'transparent' }}
              >
                <span style={{ color: value === opt.id ? (color || '#8B5CF6') : c.text1, fontSize: 12, fontWeight: value === opt.id ? 700 : 500 }}>
                  {opt.label}
                </span>
                {value === opt.id && <Check size={12} color={color || '#8B5CF6'} strokeWidth={3} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BuilderField({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span style={{ color: c.text3, fontSize: 9, fontWeight: 600, display: 'block', marginBottom: 2 }}>{label}</span>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg active:opacity-70"
        style={{ background: value ? 'rgba(139,92,246,0.06)' : c.searchBg, border: `1px solid ${value ? 'rgba(139,92,246,0.2)' : c.searchBorder}`, minHeight: 36 }}>
        <span style={{ color: value ? c.text1 : c.text3, fontSize: 11, fontWeight: value ? 600 : 400 }}>{value || 'Chọn...'}</span>
        <ChevronDown size={10} color={c.text3} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 rounded-lg overflow-hidden z-20 relative"
            style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-2.5 py-2 active:opacity-70"
                style={{ borderBottom: `1px solid ${c.divider}`, background: value === opt ? 'rgba(139,92,246,0.06)' : 'transparent', minHeight: 32 }}>
                <span style={{ color: value === opt ? '#8B5CF6' : c.text1, fontSize: 11, fontWeight: value === opt ? 700 : 500 }}>{opt}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEPPER (reuse from 10A)
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: 'Template' }, { id: 2, label: 'Cấu trúc' },
  { id: 3, label: 'Luật chơi' }, { id: 4, label: 'Kết quả' },
  { id: 5, label: 'Points' }, { id: 6, label: 'Review' },
] as const;

function ProgressStepper() {
  const c = useThemeColors();
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: step.id < 3 ? '#10B981' : step.id === 3 ? '#8B5CF6' : c.surface2,
                  border: step.id === 3 ? '2px solid rgba(139,92,246,0.3)' : 'none' }}>
                {step.id < 3 ? <Check size={12} color="#fff" strokeWidth={3} /> :
                  <span style={{ color: step.id === 3 ? '#fff' : c.text3, fontSize: 10, fontWeight: 700 }}>{step.id}</span>}
              </div>
              <span style={{ color: step.id === 3 ? '#8B5CF6' : step.id < 3 ? '#10B981' : c.text3,
                fontSize: 8, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-0.5" style={{ height: 2, background: step.id < 3 ? '#10B981' : c.surface2, borderRadius: 1, marginBottom: 14 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export function ArenaGovernanceGatePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const [s, setS] = useState<GovState>(initialGovState);
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const upd = (partial: Partial<GovState>) => setS(prev => ({ ...prev, ...partial }));

  const gov = useMemo(() => computeGovernance(s), [s]);

  // Win condition preview sentence
  const winPreview = useMemo(() => {
    const parts: string[] = [];
    if (s.subject) parts.push(s.subject);
    if (s.action) parts.push(s.action);
    if (s.metric) parts.push(s.metric);
    if (s.deadlineContext) parts.push(s.deadlineContext);
    if (s.winType) parts.push(s.winType + '.');
    if (parts.length === 0) return '';
    const sentence = parts.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }, [s.subject, s.action, s.metric, s.deadlineContext, s.winType]);

  const handleSuggest = (action: string) => {
    switch (action) {
      case 'closest_guess': upd({ challengeType: 'closest_guess' }); break;
      case 'proof_challenge': upd({ challengeType: 'proof_challenge' }); break;
      case 'invite_only': upd({ privacy: 'private' }); break;
      case 'referee': upd({ resolutionSource: 'referee' }); break;
      case 'add_rules': /* scroll to rules */ break;
    }
    actionToast.success({ title: 'Đã áp dụng gợi ý', description: `Action: ${action}` });
  };

  const canProceed = gov.eligibility === 'green' || (s.privacy !== 'public' && gov.eligibility === 'amber');

  return (
    <PageLayout>
      <Header title="Arena Studio" subtitle="10C — Governance Gate" back />

      <ProgressStepper />

      <PageContent gap="default">
        <SectionHeader title="Luật chơi — Governed Mode" accent accentColor="#F59E0B" mb={0}
          subtitle="Governance Gate tự động kiểm tra rule trước khi publish" />

        {/* ─── Privacy Selector ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Quyền riêng tư</span>
            <button
              onClick={() => { setGuidanceOpen(true); hapticSelection(); }}
              className="flex items-center gap-1 active:opacity-70"
              style={{ minHeight: 28, minWidth: 28 }}
            >
              <HelpCircle size={13} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>So sánh</span>
            </button>
          </div>
          <div className="flex gap-2">
            {(['public', 'private', 'unlisted'] as RoomPrivacy[]).map(p => {
              const active = s.privacy === p;
              const labels: Record<RoomPrivacy, { label: string; icon: string }> = {
                public: { label: 'Công khai', icon: '🌐' },
                private: { label: 'Riêng tư', icon: '🔒' },
                unlisted: { label: 'Unlisted', icon: '🔗' },
              };
              const info = labels[p];
              return (
                <button
                  key={p}
                  onClick={() => { upd({ privacy: p }); hapticSelection(); }}
                  className="flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{info.icon}</span>
                  <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 11, fontWeight: 600 }}>
                    {info.label}
                  </span>
                </button>
              );
            })}
          </div>
          {s.privacy === 'public' && (
            <p style={{ color: c.text3, fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
              Public room yêu cầu tất cả mục rule bắt buộc. Governance Gate sẽ kiểm tra tự động.
            </p>
          )}
        </TrCard>

        {/* ─── Rule Clarity Score ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={14} color={CLARITY_CONFIG[gov.clarityLevel].color} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Rule Clarity Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: CLARITY_CONFIG[gov.clarityLevel].color, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                {gov.clarity}
              </span>
              <span className="px-2 py-0.5 rounded-lg" style={{
                background: CLARITY_CONFIG[gov.clarityLevel].bg,
                color: CLARITY_CONFIG[gov.clarityLevel].color,
                fontSize: 10, fontWeight: 700,
              }}>
                {CLARITY_CONFIG[gov.clarityLevel].label}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${gov.clarity}%` }}
              transition={{ duration: 0.6 }} style={{ background: CLARITY_CONFIG[gov.clarityLevel].color }} />
          </div>
        </TrCard>

        {/* ─── Tên challenge ─── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Tên challenge</span>
            <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>*</span>
          </div>
          <input type="text" value={s.title} onChange={e => upd({ title: e.target.value })}
            placeholder="VD: BTC Weekly Predict — Tuần 10"
            className="w-full px-4 py-3 rounded-xl"
            style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, color: c.text1, fontSize: φ.sm, outline: 'none' }} />
        </div>

        {/* ─── Domain ─── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Lĩnh vực</span>
            {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>*</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DOMAIN_LABELS) as DomainId[]).map(d => {
              const active = s.domain === d;
              return (
                <button key={d} onClick={() => { upd({ domain: d }); hapticSelection(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    minHeight: 36,
                  }}>
                  <span style={{ fontSize: 12 }}>{DOMAIN_ICONS[d]}</span>
                  <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 10, fontWeight: active ? 700 : 500 }}>{DOMAIN_LABELS[d]}</span>
                </button>
              );
            })}
          </div>
          {/* Custom domain banner */}
          {s.domain === 'other' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Custom rules cần mô tả rõ hơn để người tham gia hiểu đúng.
                  {s.privacy === 'public' && ' Room public với custom domain cần điều kiện thắng đặc biệt rõ ràng.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Challenge Type ─── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Loại challenge</span>
            {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>*</span>}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(CHALLENGE_TYPE_MAP) as [ChallengeType, { label: string; icon: string }][]).map(([id, info]) => {
              const active = s.challengeType === id;
              return (
                <button key={id} onClick={() => { upd({ challengeType: id }); hapticSelection(); }}
                  className="py-2 px-2.5 rounded-xl text-left active:opacity-70 flex items-center gap-1.5"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    minHeight: 40,
                  }}>
                  <span style={{ fontSize: 12 }}>{info.icon}</span>
                  <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 10, fontWeight: 600 }}>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Win Condition Builder ─── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} color="#8B5CF6" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Điều kiện thắng</span>
            {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 9, fontWeight: 700 }}>BẮT BUỘC</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <BuilderField label="A. Chủ thể" options={SUBJECTS} value={s.subject} onChange={v => upd({ subject: v })} />
            <BuilderField label="B. Hành động" options={ACTIONS} value={s.action} onChange={v => upd({ action: v })} />
            <BuilderField label="C. Chỉ số" options={METRICS} value={s.metric} onChange={v => upd({ metric: v })} />
            <BuilderField label="D. Kiểu thắng" options={WIN_TYPES} value={s.winType} onChange={v => upd({ winType: v })} />
          </div>
          <BuilderField label="E. Thời điểm" options={DEADLINE_CTXS} value={s.deadlineContext} onChange={v => upd({ deadlineContext: v })} />

          {winPreview && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div className="flex items-start gap-2">
                <Eye size={12} color="#8B5CF6" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 2 }}>PREVIEW TỰ SINH</p>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>"{winPreview}"</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Free text fallback */}
          <div className="mt-2">
            <span style={{ color: c.text3, fontSize: 10, marginBottom: 4, display: 'block' }}>Hoặc tự nhập:</span>
            <textarea value={s.customWinCondition} onChange={e => upd({ customWinCondition: e.target.value })}
              placeholder="VD: Người đoán gần nhất với giá ETH vào 25/03 lúc 10:00 sẽ thắng."
              rows={2} className="w-full px-3 py-2.5 rounded-xl resize-none"
              style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, color: c.text1, fontSize: 12, outline: 'none' }} />
          </div>
        </TrCard>

        {/* ─── Description ─── */}
        <div>
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mô tả ngắn</span>
          <textarea value={s.description} onChange={e => upd({ description: e.target.value })}
            placeholder="Mô tả bối cảnh nếu cần. Không cần lặp lại luật chơi." rows={2}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, color: c.text1, fontSize: φ.sm, outline: 'none' }} />
        </div>

        {/* ─── Resolution Source ─── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Cách chốt kết quả</span>
            {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>*</span>}
          </div>
          <MiniDropdown label="Resolution source" options={RESOLUTION_SOURCES} value={s.resolutionSource}
            onChange={v => upd({ resolutionSource: v })} color="#10B981" />
        </div>

        {/* ─── Timing & Edge Rules ─── */}
        <TrCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} color="#10B981" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Timing & Edge Rules</span>
          </div>

          <div>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Thời hạn kết thúc</span>
            <input type="date" value={s.endDate} onChange={e => upd({ endDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl"
              style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, color: c.text1, fontSize: φ.sm, outline: 'none' }} />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Luật hòa</span>
              {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 700 }}>PUBLIC</span>}
            </div>
            <MiniDropdown label="Tie rule" options={TIE_RULES} value={s.tieRule}
              onChange={v => upd({ tieRule: v })} color="#F97316" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Luật hủy bỏ</span>
              {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 700 }}>PUBLIC</span>}
            </div>
            <MiniDropdown label="Void rule" options={VOID_RULES} value={s.voidRule}
              onChange={v => upd({ voidRule: v })} color="#EF4444" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Hạn chốt kết quả</span>
              {s.privacy === 'public' && <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 700 }}>PUBLIC</span>}
            </div>
            <MiniDropdown label="Result deadline" options={RESULT_DEADLINES} value={s.resultDeadline}
              onChange={v => upd({ resultDeadline: v })} color="#94A3B8" />
          </div>

          {/* Toggles */}
          <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
            {[
              { label: 'Cho phép rematch', desc: 'Người chơi có thể yêu cầu chơi lại', value: s.rematchEnabled, key: 'rematchEnabled' },
              { label: 'Lưu thành reusable mode', desc: 'Người khác có thể clone luật chơi', value: s.saveAsMode, key: 'saveAsMode' },
            ].map(t => (
              <button key={t.key} onClick={() => upd({ [t.key]: !t.value } as Partial<GovState>)}
                className="flex items-center justify-between w-full py-2 active:opacity-70">
                <div>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{t.label}</p>
                  <p style={{ color: c.text3, fontSize: φ.xs }}>{t.desc}</p>
                </div>
                <div className="w-11 h-6 rounded-full relative" style={{ background: t.value ? '#8B5CF6' : c.surface2 }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: t.value ? 21 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </button>
            ))}
          </div>
        </TrCard>

        {/* ─── Ambiguity Warnings ─── */}
        <AmbiguityWarningBanner warnings={gov.ambiguities} />

        {/* ─── Suggested Fallback ─── */}
        <SuggestedFallbackCard
          eligibility={gov.eligibility}
          isCustom={gov.isCustomDomain}
          hasWin={gov.hasStructuredWin || gov.hasFreeTextWin}
          clarity={gov.clarity}
          privacy={s.privacy}
          onSuggest={handleSuggest}
        />

        {/* ─── Publish Eligibility Panel v2 ─── */}
        <PublishEligibilityPanelV2
          checks={gov.checks}
          tier={gov.eligibility}
          clarity={gov.clarity}
          clarityLevel={gov.clarityLevel}
        />

        {/* ─── Generated Governance Summary ─── */}
        <GeneratedGovernanceSummary
          clarity={gov.clarity}
          clarityLevel={gov.clarityLevel}
          eligibility={gov.eligibility}
          riskTier={gov.riskTier}
          resolutionSource={s.resolutionSource}
          privacy={s.privacy}
          privacyRecommendation={gov.privacyRecommendation}
          nextAction={gov.nextAction}
        />

        {/* ─── Moderation note ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Governance Gate giúp bạn tạo room chất lượng — không cản bạn sáng tạo.
            Custom mode vẫn mở cho mọi lĩnh vực, nhưng room public cần rule rõ ràng để bảo vệ người tham gia.
          </p>
        </TrCard>
      </PageContent>

      {/* ─── Footer ─── */}
      <div className="px-5 pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${c.divider}` }}>
        <div className="flex gap-3">
          <button onClick={() => { goBack(); hapticSelection(); }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 active:opacity-70"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, touchAction: 'manipulation' }}>
            <ChevronLeft size={18} color={c.text2} />
          </button>
          <div className="flex-1">
            <CTAButton onClick={() => {
              hapticSelection();
              if (canProceed) {
                actionToast.success({ title: 'Tiếp tục', description: 'Governance Gate passed — bước tiếp theo' });
              } else {
                actionToast.error({ title: 'Chưa đủ điều kiện', description: gov.nextAction });
              }
            }} disabled={!canProceed}>
              <div className="flex items-center gap-2 justify-center">
                Tiếp tục <ChevronRight size={14} />
              </div>
            </CTAButton>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => { hapticSelection(); actionToast.success({ title: 'Đã lưu nháp', description: 'Bạn có thể tiếp tục bất kỳ lúc nào' }); }}
            className="flex items-center gap-1.5 py-3 px-2 -ml-2 active:opacity-70"
            style={{ background: 'none', border: 'none', minHeight: 44 }}>
            <Save size={14} color={c.text3} />
            <span style={{ color: c.text3, fontSize: φ.xs }}>Lưu nháp</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md" style={{
              background: ELIGIBILITY_CONFIG[gov.eligibility].bg,
              color: ELIGIBILITY_CONFIG[gov.eligibility].color,
              fontSize: 9, fontWeight: 700,
            }}>
              {ELIGIBILITY_CONFIG[gov.eligibility].label}
            </span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>Bước 3 / 6</span>
          </div>
        </div>
      </div>

      {/* Guidance sheet */}
      <PublicPrivateGuidanceSheet open={guidanceOpen} onClose={() => setGuidanceOpen(false)} />
    </PageLayout>
  );
}
