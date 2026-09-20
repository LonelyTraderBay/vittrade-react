import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ChevronRight, ChevronLeft, AlertTriangle, Info, Plus, Minus,
  Check, Lock, Clock, Eye, EyeOff, Shield, Users, Zap,
  Calendar, FileText, Save, Send, WifiOff, RefreshCw,
  Download, Upload, Share2, ChevronDown, Search, Target, Sparkles,
  Percent, Receipt, FileEdit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ArenaLoadingSkeleton } from '../../components/arena/ArenaStates';
import { FormatChip, ResolutionChip, TrustBadge } from '../../components/arena/ArenaChips';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import {
  RuleClarityCard, ResolutionRiskChip, ResolutionRiskMatrix,
  PublishEligibilityPanel, RoomSafetySnapshotCard, PolicyVersionTag,
  GovernanceHintBanner, EligibilityNoteCard,
  computeClarityScore, resolutionRisk,
  type GovernanceStatus, type EligibilityCheck, type SafetySnapshot,
  ParticipantPreviewSheet, type PreviewData,
} from '../../components/arena/ArenaStudioGovernance';
import { TOAST } from '../../data/toastMessages';
import { StepUpAuthSheet } from '../../components/arena/ArenaEnhancements';
import { φ, φRadius } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { ARENA_TEMPLATES, fmtPoints, MY_ARENA_STATS, type ArenaTemplate } from '../../data/arenaData';
import { BridgeSourceBar, ModuleBoundaryBanner, type SharedTopicId } from '../../components/bridges/ArenaPredictionFoundation';
import { DistributionComparisonSheet } from '../../components/arena/ArenaRewardComponents';

/* ─── Prediction Bridge Context ─── */
interface PredictionBridgeContext {
  fromPrediction: true;
  eventId: string;
  eventTitle: string;
  category: string;
  topic: SharedTopicId;
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: 'Template' },
  { id: 2, label: 'Cấu trúc' },
  { id: 3, label: 'Luật chơi' },
  { id: 4, label: 'Kết quả' },
  { id: 5, label: 'Points' },
  { id: 6, label: 'Review' },
] as const;

type MatchFormat = '1v1' | '1vN' | 'NvN' | 'open_lobby';
type JoinStyle = 'invite_only' | 'public' | 'unlisted';
type ResolutionMethod = 'auto' | 'mutual' | 'referee' | 'community_vote';
type Visibility = 'public' | 'private' | 'friends_only';
type PageState = 'wizard' | 'draft' | 'loading' | 'error' | 'under_review' | 'offline';

const MATCH_FORMATS: { id: MatchFormat; label: string; desc: string; icon: string }[] = [
  { id: '1v1', label: '1 vs 1', desc: 'Đấu tay đôi', icon: '🤜' },
  { id: '1vN', label: '1 vs N', desc: 'Một người chống cả team', icon: '🎯' },
  { id: 'NvN', label: 'N vs N', desc: 'Team vs team', icon: '⚔️' },
  { id: 'open_lobby', label: 'Open Lobby', desc: 'Ai cũng tham gia được', icon: '🏟️' },
];

const JOIN_STYLES: { id: JoinStyle; label: string; icon: string }[] = [
  { id: 'invite_only', label: 'Mời thôi', icon: '🔒' },
  { id: 'public', label: 'Công khai', icon: '🌐' },
  { id: 'unlisted', label: 'Unlisted', icon: '🔗' },
];

const RESOLUTION_METHODS: { id: ResolutionMethod; label: string; desc: string; icon: string }[] = [
  { id: 'auto', label: 'Auto / Linked', desc: 'Tự động lấy kết quả từ nguồn', icon: '🤖' },
  { id: 'mutual', label: 'Mutual Confirm', desc: 'Cả 2 bên phải xác nhận', icon: '🤝' },
  { id: 'referee', label: 'Referee', desc: 'Người phân xử quyết định', icon: '🧑‍⚖️' },
  { id: 'community_vote', label: 'Community Vote', desc: 'Cộng đồng bình chọn', icon: '🗳️' },
];

const CATEGORIES = ['Crypto', 'Macro', 'Sports', 'Tech', 'Community', 'Fun', 'Other'];

/* ─── Dropdown options for Step 3 Governed ─── */
type DomainId = 'sports' | 'esports' | 'crypto' | 'tech' | 'science' | 'health' | 'entertainment' | 'work' | 'community' | 'other';
type ChallengeType = 'yes_no' | 'multi_choice' | 'closest_guess' | 'highest_wins' | 'lowest_wins' | 'first_to_finish' | 'team_score' | 'referee_decision' | 'community_vote' | 'proof_challenge';

const DOMAIN_PACKS: { id: DomainId; icon: string; label: string }[] = [
  { id: 'sports', icon: '⚽', label: 'Thể thao' },
  { id: 'esports', icon: '🎮', label: 'Esports / Game' },
  { id: 'crypto', icon: '📈', label: 'Crypto / Markets' },
  { id: 'tech', icon: '🤖', label: 'Công nghệ / AI' },
  { id: 'science', icon: '🔬', label: 'Khoa học / Học tập' },
  { id: 'health', icon: '💪', label: 'Sức khỏe / Lifestyle' },
  { id: 'entertainment', icon: '🎬', label: 'Giải trí / Văn hóa' },
  { id: 'work', icon: '💼', label: 'Công việc / Năng suất' },
  { id: 'community', icon: '🎪', label: 'Cộng đồng / Sự kiện' },
  { id: 'other', icon: '🎲', label: 'Khác / Custom' },
];

const CHALLENGE_TYPES: { id: ChallengeType; icon: string; label: string; desc: string }[] = [
  { id: 'yes_no', icon: '✅', label: 'Yes / No', desc: 'Kết quả đúng hoặc sai' },
  { id: 'multi_choice', icon: '📋', label: 'Multi-choice', desc: 'Nhiều lựa chọn, 1 đáp án' },
  { id: 'closest_guess', icon: '🎯', label: 'Closest Guess', desc: 'Đoán gần nhất thắng' },
  { id: 'highest_wins', icon: '📊', label: 'Highest Wins', desc: 'Điểm cao nhất thắng' },
  { id: 'lowest_wins', icon: '📉', label: 'Lowest Wins', desc: 'Điểm thấp nhất thắng' },
  { id: 'first_to_finish', icon: '🏁', label: 'First To Finish', desc: 'Hoàn thành trước thắng' },
  { id: 'team_score', icon: '⚔️', label: 'Team Score', desc: 'Tổng điểm team' },
  { id: 'referee_decision', icon: '🧑‍⚖️', label: 'Referee Decision', desc: 'Trọng tài quyết định' },
  { id: 'community_vote', icon: '🗳️', label: 'Community Vote', desc: 'Cộng đồng bình chọn' },
  { id: 'proof_challenge', icon: '📸', label: 'Proof Challenge', desc: 'Bằng chứng xác minh' },
];

const TIE_RULE_OPTIONS = [
  { id: 'split_equal', label: 'Chia đều pool', icon: '⚖️' },
  { id: 'refund', label: 'Hoàn trả entry points', icon: '↩️' },
  { id: 'rematch', label: 'Chơi lại (rematch)', icon: '🔄' },
  { id: 'referee', label: 'Trọng tài quyết định', icon: '🧑‍⚖️' },
  { id: 'random', label: 'Bốc thăm ngẫu nhiên', icon: '🎲' },
];

const VOID_RULE_OPTIONS = [
  { id: 'no_evidence', label: 'Không đủ bằng chứng → hủy', icon: '🚫' },
  { id: 'external_cancel', label: 'Sự kiện gốc bị hủy → hủy', icon: '❌' },
  { id: 'min_participants', label: 'Không đủ người tham gia → hủy', icon: '👤' },
  { id: 'timeout', label: 'Quá hạn chốt kết quả → hủy', icon: '⏰' },
];

const RESULT_DEADLINE_OPTIONS = [
  { id: '1h', label: '1 giờ sau kết thúc', icon: '⏱️' },
  { id: '6h', label: '6 giờ sau kết thúc', icon: '⏱️' },
  { id: '12h', label: '12 giờ sau kết thúc', icon: '⏱️' },
  { id: '24h', label: '24 giờ sau kết thúc', icon: '⏱️' },
  { id: '48h', label: '48 giờ sau kết thúc', icon: '⏱️' },
  { id: '7d', label: '7 ngày sau kết thúc', icon: '📅' },
];

const WIN_CONDITION_OPTIONS = [
  { id: 'closest', label: 'Người đoán gần đúng nhất', icon: '🎯' },
  { id: 'highest', label: 'Điểm/giá trị cao nhất', icon: '📊' },
  { id: 'lowest', label: 'Điểm/giá trị thấp nhất', icon: '📉' },
  { id: 'first', label: 'Hoàn thành trước', icon: '🏁' },
  { id: 'correct', label: 'Trả lời đúng', icon: '✅' },
  { id: 'voted', label: 'Được vote nhiều nhất', icon: '🗳️' },
  { id: 'proof', label: 'Bằng chứng hợp lệ', icon: '📸' },
  { id: 'custom', label: 'Tùy chỉnh...', icon: '✏️' },
];

/* ─── Reward Distribution Types ─── */
type RewardDistType = 'winner_all' | 'top3' | 'top5' | 'top10pct' | 'proportional' | 'equal_split' | 'tiered_custom';

interface RewardTier {
  rank: string;
  pct: number;
}

const REWARD_DIST_OPTIONS: { id: RewardDistType; icon: string; label: string; desc: string; tiers: RewardTier[] }[] = [
  {
    id: 'winner_all', icon: '🏆', label: 'Winner Takes All',
    desc: '100% pool cho người thắng duy nhất',
    tiers: [{ rank: '🥇 1st', pct: 100 }],
  },
  {
    id: 'top3', icon: '🥇', label: 'Top 3',
    desc: 'Chia cho 3 người đứng đầu',
    tiers: [{ rank: '🥇 1st', pct: 60 }, { rank: '🥈 2nd', pct: 25 }, { rank: '🥉 3rd', pct: 15 }],
  },
  {
    id: 'top5', icon: '🏅', label: 'Top 5',
    desc: 'Chia cho 5 người đứng đầu',
    tiers: [{ rank: '🥇 1st', pct: 40 }, { rank: '🥈 2nd', pct: 25 }, { rank: '🥉 3rd', pct: 15 }, { rank: '4th', pct: 12 }, { rank: '5th', pct: 8 }],
  },
  {
    id: 'top10pct', icon: '📊', label: 'Top 10%',
    desc: 'Chia đều cho top 10% người chơi',
    tiers: [{ rank: 'Top 10%', pct: 100 }],
  },
  {
    id: 'proportional', icon: '📈', label: 'Tỷ lệ theo điểm',
    desc: 'Pool chia theo tỷ lệ điểm đạt được',
    tiers: [{ rank: 'Theo điểm', pct: 100 }],
  },
  {
    id: 'equal_split', icon: '⚖️', label: 'Chia đều (đúng)',
    desc: 'Tất cả trả lời đúng chia đều pool',
    tiers: [{ rank: 'Tất cả đúng', pct: 100 }],
  },
  {
    id: 'tiered_custom', icon: '✏️', label: 'Tùy chỉnh bậc',
    desc: 'Tự thiết lập % cho từng hạng',
    tiers: [{ rank: '🥇 1st', pct: 50 }, { rank: '🥈 2nd', pct: 30 }, { rank: '🥉 3rd', pct: 20 }],
  },
];

const TIER_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32', '#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#EC4899'];

/* ─── Challenge Type → Reward Preset Mapping ─── */
const CHALLENGE_REWARD_PRESETS: Record<ChallengeType, { dist: RewardDistType; label: string; reason: string }> = {
  yes_no: { dist: 'winner_all', label: 'Winner Takes All', reason: 'Yes/No chỉ có 1 đáp án đúng → thắng hết' },
  multi_choice: { dist: 'equal_split', label: 'Chia đều (đúng)', reason: 'Multi-choice → tất cả đáp đúng chia đều' },
  closest_guess: { dist: 'top3', label: 'Top 3', reason: 'Closest Guess → chia cho 3 người gần nhất' },
  highest_wins: { dist: 'top5', label: 'Top 5', reason: 'Highest Wins → chia cho top 5 người cao điểm nhất' },
  lowest_wins: { dist: 'top5', label: 'Top 5', reason: 'Lowest Wins → chia cho top 5 người thấp nhất' },
  first_to_finish: { dist: 'top3', label: 'Top 3', reason: 'First To Finish → chia cho 3 người hoàn thành sớm nhất' },
  team_score: { dist: 'winner_all', label: 'Winner Takes All', reason: 'Team Score → team thắng chia nội bộ' },
  referee_decision: { dist: 'winner_all', label: 'Winner Takes All', reason: 'Referee quyết định → 1 bên thắng' },
  community_vote: { dist: 'proportional', label: 'Tỷ lệ theo điểm', reason: 'Community Vote → chia theo % vote' },
  proof_challenge: { dist: 'top3', label: 'Top 3', reason: 'Proof Challenge → chia cho top 3 bằng chứng tốt nhất' },
};

/* ─── Dynamic Pool Participant Presets ─── */
const DYNAMIC_POOL_MARKS = [5, 10, 20, 50, 100, 200, 500];

const COMPLEXITY_LABELS: Record<ArenaTemplate['complexity'], { label: string; color: string }> = {
  easy: { label: 'Dễ', color: '#10B981' },
  medium: { label: 'Trung bình', color: '#F59E0B' },
  advanced: { label: 'Nâng cao', color: '#EF4444' },
};

/* ═══════════════════════════════════════════
   Wizard State
   ═══════════════════════════════════════════ */

interface WizardState {
  // Step 1
  templateId: string | null;
  // Step 2
  matchFormat: MatchFormat;
  teamSize: number;
  maxParticipants: number;
  captainEnabled: boolean;
  joinStyle: JoinStyle;
  // Step 3
  title: string;
  category: string;
  description: string;
  winCondition: string;
  endDate: string;
  tieRule: string;
  voidRule: string;
  resultDeadline: string;
  rematchEnabled: boolean;
  saveAsMode: boolean;
  // Step 4
  resolution: ResolutionMethod;
  sourceLabel: string;
  sourceUrl: string;
  refereeName: string;
  minVotes: number;
  voteDuration: number;
  // Step 5
  entryPoints: number;
  rewardDist: RewardDistType;
  customTiers: RewardTier[];
  bonusPool: number;
  creatorCut: number;
  consolationEnabled: boolean;
  consolationPct: number;
  dynamicPoolEnabled: boolean;
  dynamicPoolPreviewCount: number;
  dynamicPoolMinParticipants: number;
  visibility: Visibility;
  joinDeadline: string;
  evidenceRequired: boolean;
  // Step 6 — Governance
  confirmClarity: boolean;
}

const initialState: WizardState = {
  templateId: null,
  matchFormat: 'open_lobby',
  teamSize: 1,
  maxParticipants: 20,
  captainEnabled: false,
  joinStyle: 'public',
  title: '',
  category: 'Crypto',
  description: '',
  winCondition: '',
  endDate: '2026-03-15',
  tieRule: '',
  voidRule: '',
  resultDeadline: '2026-03-15',
  rematchEnabled: false,
  saveAsMode: false,
  resolution: 'auto',
  sourceLabel: '',
  sourceUrl: '',
  refereeName: '',
  minVotes: 5,
  voteDuration: 24,
  entryPoints: 100,
  rewardDist: 'top3',
  customTiers: [{ rank: '🥇 1st', pct: 50 }, { rank: '🥈 2nd', pct: 30 }, { rank: '🥉 3rd', pct: 20 }],
  bonusPool: 0,
  creatorCut: 0,
  consolationEnabled: false,
  consolationPct: 5,
  dynamicPoolEnabled: false,
  dynamicPoolPreviewCount: 20,
  dynamicPoolMinParticipants: 5,
  visibility: 'public',
  joinDeadline: '2026-03-10',
  evidenceRequired: false,
  confirmClarity: false,
};

/* ═══════════════════════════════════════════
   Progress Stepper Component
   ═══════════════════════════════════════════ */

function ProgressStepper({ current, total }: { current: number; total: number }) {
  const c = useThemeColors();
  return (
    <div className="px-5 py-3">
      {/* Dots + lines */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center" style={{ flex: i < total - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: step.id < current
                    ? '#10B981'
                    : step.id === current
                      ? '#8B5CF6'
                      : c.surface2,
                  border: step.id === current ? '2px solid rgba(139,92,246,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {step.id < current ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : (
                  <span style={{
                    color: step.id === current ? '#fff' : c.text3,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {step.id}
                  </span>
                )}
              </div>
              <span style={{
                color: step.id === current ? '#8B5CF6' : step.id < current ? '#10B981' : c.text3,
                fontSize: 8,
                fontWeight: 600,
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className="flex-1 mx-0.5"
                style={{
                  height: 2,
                  background: step.id < current ? '#10B981' : c.surface2,
                  borderRadius: 1,
                  marginBottom: 14,
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reusable Field Components
   ═══════════════════════════════════════════ */

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  const c = useThemeColors();
  return (
    <div className="mb-1.5">
      <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{children}</span>
      {hint && (
        <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 8 }}>{hint}</span>
      )}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, multiline, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  multiline?: boolean; rows?: number;
}) {
  const c = useThemeColors();
  const shared: React.CSSProperties = {
    background: c.searchBg,
    border: `1.5px solid ${c.searchBorder}`,
    color: c.text1,
    fontSize: φ.sm,
    outline: 'none',
    width: '100%',
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl resize-none"
        style={shared}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl"
      style={shared}
    />
  );
}

function NumberStepper({
  value, onChange, min, max, step = 1, label, suffix = '',
}: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number;
  label: string; suffix?: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: c.text2, fontSize: φ.sm }}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { onChange(Math.max(min, value - step)); hapticSelection(); }}
          className="w-11 h-11 rounded-xl flex items-center justify-center active:opacity-70"
          style={{ background: c.surface2 }}
          aria-label={`Giảm ${label}`}
        >
          <Minus size={16} color={c.text2} />
        </button>
        <span style={{
          color: c.text1, fontSize: φ.body, fontWeight: 700,
          fontFamily: 'monospace', width: 48, textAlign: 'center',
        }}>
          {value}{suffix}
        </span>
        <button
          onClick={() => { onChange(Math.min(max, value + step)); hapticSelection(); }}
          className="w-11 h-11 rounded-xl flex items-center justify-center active:opacity-70"
          style={{ background: c.surface2 }}
          aria-label={`Tăng ${label}`}
        >
          <Plus size={16} color={c.text2} />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  const c = useThemeColors();
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2 active:opacity-70"
    >
      <div>
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ color: c.text3, fontSize: φ.xs }}>{desc}</p>}
      </div>
      <div
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: value ? '#8B5CF6' : c.surface2 }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: value ? 21 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        />
      </div>
    </button>
  );
}

/* ─── SelectDropdown — Searchable dropdown for Step 3 Governed ─── */
function SelectDropdown({
  label, options, value, onChange, placeholder, color = '#8B5CF6',
}: {
  label: string;
  options: { id: string; label: string; icon?: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  color?: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => o.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); hapticSelection(); }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:opacity-70"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${value ? hexToRgba(color, 30) : c.searchBorder}`,
          minHeight: 48,
        }}
      >
        <div className="flex items-center gap-2.5">
          {selected ? (
            <div className="flex items-center gap-2">
              {selected.icon && <span style={{ fontSize: 14 }}>{selected.icon}</span>}
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{selected.label}</span>
            </div>
          ) : (
            <span style={{ color: c.text3, fontSize: φ.sm }}>{placeholder || `Chọn ${label.toLowerCase()}...`}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color={c.text3} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 rounded-xl overflow-hidden z-30 relative"
            style={{ background: c.surface, border: `1.5px solid ${c.borderSolid}`, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            {options.length > 4 && (
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <Search size={14} color={c.text3} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Tìm ${label.toLowerCase()}...`}
                  className="flex-1 bg-transparent outline-none"
                  style={{ color: c.text1, fontSize: φ.xs }} autoFocus />
                {search && (
                  <button onClick={() => setSearch('')} style={{ minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: c.text3, fontSize: 14, lineHeight: 1 }}>✕</span>
                  </button>
                )}
              </div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Không tìm thấy kết quả</p>
                </div>
              ) : filtered.map(opt => {
                const active = value === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { onChange(opt.id); setOpen(false); setSearch(''); hapticSelection(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 active:opacity-70 text-left"
                    style={{
                      background: active ? hexToRgba(color, 10) : 'transparent',
                      borderBottom: `1px solid ${c.divider}`,
                      minHeight: 44,
                    }}
                  >
                    {opt.icon && <span style={{ fontSize: 14 }}>{opt.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <span style={{ color: active ? color : c.text1, fontSize: φ.sm, fontWeight: active ? 700 : 500 }}>
                        {opt.label}
                      </span>
                      {opt.desc && <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{opt.desc}</p>}
                    </div>
                    {active && <Check size={14} color={color} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChipSelector<T extends string>({
  options, value, onChange, columns = 0,
}: {
  options: { id: T; label: string; icon?: string; desc?: string }[];
  value: T; onChange: (v: T) => void;
  columns?: number;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const gridClass = columns ? `grid gap-2` : 'flex flex-wrap gap-2';
  const gridStyle = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {};

  return (
    <div className={gridClass} style={gridStyle}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => { onChange(opt.id); hapticSelection(); }}
            className={`${columns ? '' : 'flex-1'} py-2.5 px-3 rounded-xl text-left active:opacity-70`}
            style={{
              background: active ? c.chipActiveBg : c.chipBg,
              border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
              minHeight: 44,
            }}
          >
            <div className="flex items-center gap-2">
              {opt.icon && <span style={{ fontSize: 16 }}>{opt.icon}</span>}
              <span style={{
                color: active ? c.chipActiveText : c.chipText,
                fontSize: φ.xs,
                fontWeight: 600,
              }}>
                {opt.label}
              </span>
            </div>
            {opt.desc && (
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2, marginLeft: opt.icon ? 26 : 0 }}>
                {opt.desc}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Fee Tooltip (tap/hover on Step 5 fee row)
   ═══════════════════════════════════════════ */

const FEE_TOOLTIP_ITEMS = [
  { icon: '🛡️', label: 'Kiểm duyệt', pct: '3%' },
  { icon: '🔒', label: 'Escrow & bảo mật', pct: '3%' },
  { icon: '⚖️', label: 'Dispute resolution', pct: '2%' },
  { icon: '🖥️', label: 'Hạ tầng & vận hành', pct: '2%' },
];

function FeeTooltip({ amount, onClose }: { amount: number; onClose: () => void }) {
  const c = useThemeColors();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="absolute left-0 right-0 z-20 rounded-xl p-3.5"
      style={{
        top: 'calc(100% + 6px)',
        background: c.surface2,
        border: `1px solid rgba(245,158,11,0.2)`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Receipt size={13} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>Chi tiết phí 10%</span>
        </div>
        <button onClick={onClose} className="p-1 -mr-1 active:opacity-70" style={{ minHeight: 28, minWidth: 28 }}>
          <span style={{ color: c.text3, fontSize: 16, lineHeight: 1 }}>×</span>
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {FEE_TOOLTIP_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1 px-2 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11 }}>{item.icon}</span>
              <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.3 }}>{item.label}</span>
            </div>
            <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>{item.pct}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2 flex items-center justify-between"
        style={{ borderTop: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>Tổng phí</span>
        <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
          −{fmtPoints(amount)} pts (10%)
        </span>
      </div>
      <div className="flex items-start gap-1.5 mt-2 px-2 py-1.5 rounded-lg"
        style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.08)' }}>
        <Check size={9} color="#10B981" className="shrink-0 mt-0.5" />
        <span style={{ color: '#10B981', fontSize: 8, fontWeight: 600, lineHeight: 1.4 }}>
          Mức phí cố định, không có phí ẩn nào khác
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Platform Fee Banner (10% transparency)
   ═══════════════════════════════════════════ */

function PlatformFeeBanner({ variant = 'full', animated = false }: { variant?: 'full' | 'compact' | 'reminder'; animated?: boolean }) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  if (variant === 'reminder') {
    return (
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}
      >
        <Receipt size={12} color="#F59E0B" className="shrink-0" />
        <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
          Phí vận hành <strong style={{ color: '#F59E0B', fontWeight: 700 }}>10%</strong> tổng pool sẽ được trích tự động
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}
        >
          <Percent size={14} color="#F59E0B" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, lineHeight: 1.3 }}>
            Phí vận hành: <span style={{ color: '#F59E0B' }}>10% tổng pool</span>
          </p>
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
            Đã bao gồm kiểm duyệt, escrow & dispute resolution
          </p>
        </div>
      </div>
    );
  }

  /* variant === 'full' */
  const card = (
    <TrCard className="p-4" accentBorder="rgba(245,158,11,0.25)">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)' }}
        >
          <Receipt size={18} color="#F59E0B" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Phí vận hành platform</span>
            <span
              className="px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 10, fontWeight: 700 }}
            >
              10%
            </span>
          </div>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 2 }}>
            Mọi challenge đều được trích <strong style={{ color: '#F59E0B' }}>10% tổng pool</strong> để duy trì hệ thống. Phần này được hiển thị công khai cho tất cả người tham gia.
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 active:opacity-70"
            style={{ minHeight: 28 }}
          >
            <Info size={11} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>
              {expanded ? 'Ẩn chi tiết' : 'Phí bao gồm những gì?'}
            </span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={11} color="#F59E0B" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: `1px solid rgba(245,158,11,0.1)` }}>
                  {[
                    { icon: '🛡️', label: 'Kiểm duyệt tự động', desc: 'AI + manual review trước khi hiển thị công khai' },
                    { icon: '🔒', label: 'Hệ thống Escrow', desc: 'Points được giữ an toàn trong suốt challenge' },
                    { icon: '⚖️', label: 'Dispute Resolution', desc: 'Xử lý tranh chấp công bằng & minh bạch' },
                    { icon: '🖥️', label: 'Bảo trì & Hạ tầng', desc: 'Server, storage, real-time updates' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.04)' }}>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</p>
                        <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <Check size={11} color="#10B981" className="shrink-0 mt-0.5" />
                    <p style={{ color: '#10B981', fontSize: 9, lineHeight: 1.4, fontWeight: 600 }}>
                      Kh��ng có phí ẩn. 10% là mức duy nhất và cố định cho mọi challenge.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TrCard>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0px rgba(245,158,11,0)',
              '0 0 0 4px rgba(245,158,11,0.15)',
              '0 0 0 0px rgba(245,158,11,0)',
            ],
          }}
          transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
          className="rounded-2xl"
        >
          {card}
        </motion.div>
      </motion.div>
    );
  }

  return card;
}

/* ═══════════════════════════════════════════
   Step 1 — Choose Template
   ═══════════════════════════════════════════ */

function Step1({ ws, setWs, predictionCtx }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>>; predictionCtx?: PredictionBridgeContext | null }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const suggestedTemplates = ['prediction', 'closest_guess', 'team_battle'];

  return (
    <>
      {/* 09D: Prediction context note */}
      {predictionCtx && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Info size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Bạn đang tạo room <strong style={{ color: '#F59E0B' }}>points-only</strong> lấy cảm hứng từ Prediction event. Template được gợi ý dựa trên bối cảnh event.
          </p>
        </div>
      )}
      {/* Platform Fee Banner — transparency from Step 1 */}
      <PlatformFeeBanner variant="full" animated />

      <SectionHeader title="Chọn template" accent accentColor="#8B5CF6" />
      <div className="flex flex-col gap-3">
        {ARENA_TEMPLATES.map(t => {
          const active = ws.templateId === t.id;
          const disabled = !!t.verifiedOnly;
          const cx = COMPLEXITY_LABELS[t.complexity];

          return (
            <button
              key={t.id}
              onClick={() => {
                if (!disabled) { setWs(prev => ({ ...prev, templateId: t.id })); hapticSelection(); }
              }}
              disabled={disabled}
              className="w-full text-left active:opacity-70"
              style={{ opacity: disabled ? 0.45 : 1 }}
            >
              <TrCard
                className="p-4"
                accentBorder={active ? t.color : undefined}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: hexToRgba(t.color, 15), fontSize: 22 }}
                  >
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{
                        color: active ? t.color : c.text1,
                        fontSize: φ.body,
                        fontWeight: 700,
                      }}>
                        {t.title}
                      </span>
                      {active && <Check size={14} color={t.color} strokeWidth={3} />}
                    </div>
                    <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 6 }}>
                      {t.description}
                    </p>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5">
                      {t.formatTags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md"
                          style={{ background: c.chipBg, color: c.chipText, fontSize: 9, fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 rounded-md"
                        style={{ background: hexToRgba(cx.color, 15), color: cx.color, fontSize: 9, fontWeight: 600 }}>
                        {cx.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>
                        Points-only
                      </span>
                      {disabled && (
                        <span className="px-2 py-0.5 rounded-md flex items-center gap-1"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 9, fontWeight: 600 }}>
                          <Lock size={8} /> Verified only
                        </span>
                      )}
                      {predictionCtx && suggestedTemplates.includes(t.id) && (
                        <span className="px-2 py-0.5 rounded-md flex items-center gap-1"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 9, fontWeight: 700 }}>
                          ✦ Gợi ý
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TrCard>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   Step 2 — Match Structure
   ═══════════════════════════════════════════ */

function Step2({ ws, setWs }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>> }) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Cấu trúc trận đấu" accent accentColor="#3B82F6" />

      {/* Match format */}
      <div>
        <FieldLabel>Match format</FieldLabel>
        <ChipSelector
          options={MATCH_FORMATS}
          value={ws.matchFormat}
          onChange={v => setWs(prev => ({ ...prev, matchFormat: v }))}
          columns={2}
        />
      </div>

      {/* Team size / slots */}
      <TrCard className="p-4 flex flex-col gap-4">
        {(ws.matchFormat === 'NvN' || ws.matchFormat === '1vN') && (
          <NumberStepper
            label="Team size"
            value={ws.teamSize}
            onChange={v => setWs(prev => ({ ...prev, teamSize: v }))}
            min={1} max={50}
          />
        )}
        <NumberStepper
          label="Số slot tối đa"
          value={ws.maxParticipants}
          onChange={v => setWs(prev => ({ ...prev, maxParticipants: v }))}
          min={2} max={200} step={5}
          suffix=" người"
        />
        <ToggleRow
          label="Captain mode"
          desc="Mỗi team có 1 captain quyết định"
          value={ws.captainEnabled}
          onChange={v => setWs(prev => ({ ...prev, captainEnabled: v }))}
        />
      </TrCard>

      {/* Join style */}
      <div>
        <FieldLabel>Kiểu tham gia</FieldLabel>
        <ChipSelector
          options={JOIN_STYLES}
          value={ws.joinStyle}
          onChange={v => setWs(prev => ({ ...prev, joinStyle: v }))}
        />
      </div>

      {/* 07A Governance: Eligibility note */}
      <EligibilityNoteCard joinStyle={ws.joinStyle} />

      {/* Platform fee reminder */}
      <PlatformFeeBanner variant="reminder" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 3 — Rules
   ═══════════════════════════════════════════ */

function Step3({ ws, setWs, predictionCtx }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>>; predictionCtx?: PredictionBridgeContext | null }) {
  const c = useThemeColors();

  /* 09D: Prefill from prediction context on first render */
  React.useEffect(() => {
    if (predictionCtx && !ws.title) {
      setWs(prev => ({
        ...prev,
        title: prev.title || `Arena: ${predictionCtx.eventTitle.slice(0, 40)}`,
        category: predictionCtx.category || prev.category,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* 07A Governance: compute clarity score */
  const clarityScore = computeClarityScore({
    title: ws.title,
    description: ws.description,
    winCondition: ws.winCondition,
    tieRule: ws.tieRule,
    voidRule: ws.voidRule,
    resultDeadline: ws.resultDeadline,
    evidenceRequired: ws.evidenceRequired,
    joinStyle: ws.joinStyle,
  });

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Luật chơi" accent accentColor="#F59E0B" />

      {/* 07A Governance: Rule Clarity Score */}
      <RuleClarityCard score={clarityScore} />

      {/* 09D: Prediction context rules reminder */}
      {predictionCtx && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Shield size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Kết quả room Arena <strong style={{ color: c.text1 }}>không thay đổi</strong> vị thế Prediction. Title và category đã được gợi ý từ event nguồn.
          </p>
        </div>
      )}

      <div>
        <FieldLabel hint="Bắt buộc">Tên challenge</FieldLabel>
        <TextInput
          value={ws.title}
          onChange={v => setWs(prev => ({ ...prev, title: v }))}
          placeholder="VD: BTC Weekly Predict — Tuần 10"
        />
      </div>

      {/* ─── Lĩnh vực (Domain) ─── */}
      <div>
        <FieldLabel hint="Bắt buộc">Lĩnh vực</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {DOMAIN_PACKS.map(d => {
            const active = ws.category === d.id;
            return (
              <button
                key={d.id}
                onClick={() => { setWs(prev => ({ ...prev, category: d.id })); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
                style={{
                  background: active ? c.chipActiveBg : c.chipBg,
                  border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                  minHeight: 40,
                }}
              >
                <span style={{ fontSize: 13 }}>{d.icon}</span>
                <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 11, fontWeight: 600 }}>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Loại challenge ─── */}
      <div>
        <FieldLabel hint="Bắt buộc">Loại challenge</FieldLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {CHALLENGE_TYPES.map(ct => {
            const active = ws.winCondition === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => {
                  const preset = CHALLENGE_REWARD_PRESETS[ct.id];
                  setWs(prev => ({
                    ...prev,
                    winCondition: ct.id,
                    ...(preset ? { rewardDist: preset.dist } : {}),
                  }));
                }}
                className="py-2.5 px-3 rounded-xl text-left active:opacity-70"
                style={{
                  background: active ? c.chipActiveBg : c.chipBg,
                  border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                  minHeight: 44,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13 }}>{ct.icon}</span>
                  <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 11, fontWeight: 600 }}>{ct.label}</span>
                </div>
                <p style={{ color: c.text3, fontSize: 9, marginTop: 2, marginLeft: 20, lineHeight: 1.3 }}>{ct.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Mô tả ─── */}
      <div>
        <FieldLabel hint="Bắt buộc">Mô tả</FieldLabel>
        <TextInput
          value={ws.description}
          onChange={v => setWs(prev => ({ ...prev, description: v }))}
          placeholder="Mô tả bối cảnh và chi tiết challenge..."
          multiline
        />
      </div>

      {/* ─── Điều kiện thắng (dropdown) ─── */}
      <div>
        <FieldLabel hint="Bắt buộc">Điều kiện thắng</FieldLabel>
        <SelectDropdown
          label="Điều kiện thắng"
          options={WIN_CONDITION_OPTIONS}
          value={(() => {
            const match = WIN_CONDITION_OPTIONS.find(o => o.id === ws.winCondition || ws.winCondition === o.id);
            return match ? match.id : '';
          })()}
          onChange={v => {
            if (v === 'custom') {
              setWs(prev => ({ ...prev, winCondition: '' }));
            } else {
              const opt = WIN_CONDITION_OPTIONS.find(o => o.id === v);
              setWs(prev => ({ ...prev, winCondition: opt ? opt.label : v }));
            }
          }}
          placeholder="Chọn điều kiện thắng..."
          color="#10B981"
        />
        {/* Custom fallback */}
        {(ws.winCondition === '' || !WIN_CONDITION_OPTIONS.find(o => o.label === ws.winCondition) && !CHALLENGE_TYPES.find(o => o.id === ws.winCondition)) && (
          <div className="mt-2">
            <TextInput
              value={ws.winCondition}
              onChange={v => setWs(prev => ({ ...prev, winCondition: v }))}
              placeholder="VD: Người đoán gần nhất với giá BTC lúc 23:59 UTC"
            />
          </div>
        )}
      </div>

      {/* ─── Thời hạn kết thúc ─── */}
      <div>
        <FieldLabel>Thời hạn kết thúc</FieldLabel>
        <input
          type="date"
          value={ws.endDate}
          onChange={e => setWs(prev => ({ ...prev, endDate: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            color: c.text1,
            fontSize: φ.sm,
            outline: 'none',
          }}
        />
      </div>

      {/* ─── Edge Rules (Tie, Void, Deadline) ─── */}
      <TrCard className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} color="#10B981" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Edge Rules</span>
        </div>

        <div>
          <FieldLabel hint="Chọn mẫu">Luật hòa (Tie rule)</FieldLabel>
          <SelectDropdown
            label="Luật hòa"
            options={TIE_RULE_OPTIONS}
            value={(() => {
              const match = TIE_RULE_OPTIONS.find(o => o.label === ws.tieRule || o.id === ws.tieRule);
              return match ? match.id : '';
            })()}
            onChange={v => {
              const opt = TIE_RULE_OPTIONS.find(o => o.id === v);
              setWs(prev => ({ ...prev, tieRule: opt ? opt.label : v }));
            }}
            placeholder="Chọn luật hòa..."
            color="#F97316"
          />
        </div>
        <div>
          <FieldLabel hint="Chọn mẫu">Luật hủy bỏ (Void rule)</FieldLabel>
          <SelectDropdown
            label="Luật hủy bỏ"
            options={VOID_RULE_OPTIONS}
            value={(() => {
              const match = VOID_RULE_OPTIONS.find(o => o.label === ws.voidRule || o.id === ws.voidRule);
              return match ? match.id : '';
            })()}
            onChange={v => {
              const opt = VOID_RULE_OPTIONS.find(o => o.id === v);
              setWs(prev => ({ ...prev, voidRule: opt ? opt.label : v }));
            }}
            placeholder="Chọn luật hủy bỏ..."
            color="#EF4444"
          />
        </div>
        <div>
          <FieldLabel hint="Chọn mẫu">Thời hạn kết quả (Result deadline)</FieldLabel>
          <SelectDropdown
            label="Deadline"
            options={RESULT_DEADLINE_OPTIONS}
            value={(() => {
              const match = RESULT_DEADLINE_OPTIONS.find(o => o.label === ws.resultDeadline || o.id === ws.resultDeadline);
              return match ? match.id : '';
            })()}
            onChange={v => {
              const opt = RESULT_DEADLINE_OPTIONS.find(o => o.id === v);
              setWs(prev => ({ ...prev, resultDeadline: opt ? opt.label : v }));
            }}
            placeholder="Chọn thời hạn kết quả..."
            color="#94A3B8"
          />
        </div>

        <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
          <ToggleRow
            label="Cho phép rematch"
            desc="Người chơi có thể yêu cầu chơi lại"
            value={ws.rematchEnabled}
            onChange={v => setWs(prev => ({ ...prev, rematchEnabled: v }))}
          />
          <ToggleRow
            label="Lưu thành reusable mode"
            desc="Người khác có thể clone luật chơi này"
            value={ws.saveAsMode}
            onChange={v => setWs(prev => ({ ...prev, saveAsMode: v }))}
          />
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 4 — Resolution Method
   ═══════════════════════════════════════════ */

function Step4({ ws, setWs, predictionCtx }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>>; predictionCtx?: PredictionBridgeContext | null }) {
  const c = useThemeColors();

  /* 09D: Prefill sourceLabel from prediction context */
  React.useEffect(() => {
    if (predictionCtx && ws.resolution === 'auto' && !ws.sourceLabel) {
      setWs(prev => ({
        ...prev,
        sourceLabel: prev.sourceLabel || `Prediction Event: ${predictionCtx.eventTitle.slice(0, 50)}`,
      }));
    }
  }, [predictionCtx, ws.resolution]); // eslint-disable-line react-hooks/exhaustive-deps

  const showResolutionWarning = predictionCtx && (ws.resolution === 'community_vote' || ws.resolution === 'mutual');

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Cách chốt kết quả" accent accentColor="#10B981" />

      {/* 09D: Warning when choosing non-auto resolution from prediction context */}
      {showResolutionWarning && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Bạn đang rời khỏi cơ chế resolve của market gốc. Kết quả room Arena sẽ do <strong style={{ color: '#F59E0B' }}>{ws.resolution === 'community_vote' ? 'cộng đồng bình chọn' : 'cả 2 bên xác nhận'}</strong> thay vì nguồn tự động.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {RESOLUTION_METHODS.map(m => {
          const active = ws.resolution === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setWs(prev => ({ ...prev, resolution: m.id }))}
              className="w-full text-left active:opacity-70"
            >
              <TrCard className="p-4" accentBorder={active ? '#10B981' : undefined}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: active ? 'rgba(16,185,129,0.12)' : c.surface2, fontSize: 18 }}
                  >
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{
                        color: active ? '#10B981' : c.text1,
                        fontSize: φ.sm,
                        fontWeight: 700,
                      }}>
                        {m.label}
                      </span>
                      {active && <Check size={12} color="#10B981" strokeWidth={3} />}
                    </div>
                    <p style={{ color: c.text3, fontSize: φ.xs }}>{m.desc}</p>
                  </div>
                </div>
              </TrCard>
            </button>
          );
        })}
      </div>

      {/* Conditional fields */}
      {ws.resolution === 'auto' && (
        <TrCard className="p-4 flex flex-col gap-3">
          <div>
            <FieldLabel>Nguồn dữ liệu</FieldLabel>
            <TextInput
              value={ws.sourceLabel}
              onChange={v => setWs(prev => ({ ...prev, sourceLabel: v }))}
              placeholder="VD: CoinGecko BTC/USDT"
            />
          </div>
          <div>
            <FieldLabel hint="Tùy chọn">URL nguồn</FieldLabel>
            <TextInput
              value={ws.sourceUrl}
              onChange={v => setWs(prev => ({ ...prev, sourceUrl: v }))}
              placeholder="https://api.coingecko.com/..."
            />
          </div>
        </TrCard>
      )}

      {ws.resolution === 'mutual' && (
        <TrCard className="p-3 flex items-start gap-2">
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Cả 2 bên phải xác nhận kết quả. Nếu không đồng ý, hệ thống sẽ chuyển sang dispute.
          </p>
        </TrCard>
      )}

      {ws.resolution === 'referee' && (
        <TrCard className="p-4">
          <FieldLabel>Người phân xử</FieldLabel>
          <TextInput
            value={ws.refereeName}
            onChange={v => setWs(prev => ({ ...prev, refereeName: v }))}
            placeholder="Nhập tên hoặc ID người phân xử"
          />
        </TrCard>
      )}

      {ws.resolution === 'community_vote' && (
        <TrCard className="p-4 flex flex-col gap-3">
          <NumberStepper
            label="Số phiếu tối thiểu"
            value={ws.minVotes}
            onChange={v => setWs(prev => ({ ...prev, minVotes: v }))}
            min={3} max={100}
          />
          <NumberStepper
            label="Thời gian vote"
            value={ws.voteDuration}
            onChange={v => setWs(prev => ({ ...prev, voteDuration: v }))}
            min={1} max={168} step={1}
            suffix="h"
          />
        </TrCard>
      )}

      {/* 07A Governance: Resolution Risk Matrix */}
      <ResolutionRiskMatrix selected={ws.resolution} />

      {/* 07A Governance: Referee required warning */}
      {ws.resolution === 'referee' && ws.refereeName.length < 2 && (
        <GovernanceHintBanner
          text="Bạn cần chỉ định người phân xử (referee) trước khi có thể publish room."
          type="warning"
        />
      )}

      {/* 07A Governance: Community Vote risk warning */}
      {ws.resolution === 'community_vote' && (
        <GovernanceHintBanner
          text="Kết quả phụ thuộc cộng đồng bình chọn. Rủi ro tranh chấp cao hơn — room sẽ được gắn nhãn rủi ro cao."
          type="warning"
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reward Distribution Visual Bar
   ═══════════════════════════════════════════ */

function RewardDistBar({ tiers, netPool }: { tiers: RewardTier[]; netPool: number }) {
  const c = useThemeColors();
  const total = tiers.reduce((s, t) => s + t.pct, 0);
  return (
    <div>
      {/* Stacked horizontal bar */}
      <div className="flex rounded-lg overflow-hidden" style={{ height: 28 }}>
        {tiers.map((t, i) => {
          const w = total > 0 ? (t.pct / total) * 100 : 0;
          return (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{
                width: `${w}%`,
                background: TIER_COLORS[i % TIER_COLORS.length],
                minWidth: w > 0 ? 20 : 0,
                transition: 'width 0.3s',
              }}
            >
              {w >= 12 && (
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{t.pct}%</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {tiers.map((t, i) => {
          const pts = Math.round(netPool * t.pct / 100);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
              <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>{t.rank}</span>
              <span style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                {t.pct}% · {fmtPoints(pts)} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Custom Tier Editor
   ═══════════════════════════════════════════ */

function CustomTierEditor({ tiers, onChange }: { tiers: RewardTier[]; onChange: (t: RewardTier[]) => void }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const total = tiers.reduce((s, t) => s + t.pct, 0);
  const isValid = total === 100;

  const updateTier = (idx: number, pct: number) => {
    const next = [...tiers];
    next[idx] = { ...next[idx], pct: Math.max(0, Math.min(100, pct)) };
    onChange(next);
  };

  const updateRank = (idx: number, rank: string) => {
    const next = [...tiers];
    next[idx] = { ...next[idx], rank };
    onChange(next);
  };

  const addTier = () => {
    if (tiers.length >= 8) return;
    const remaining = Math.max(0, 100 - total);
    hapticSelection();
    onChange([...tiers, { rank: `${tiers.length + 1}th`, pct: remaining > 0 ? Math.min(remaining, 10) : 5 }]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    hapticSelection();
    onChange(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2.5">
      {tiers.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ background: TIER_COLORS[i % TIER_COLORS.length] }}
          />
          <input
            type="text"
            value={t.rank}
            onChange={e => updateRank(i, e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg"
            style={{
              background: c.searchBg,
              border: `1px solid ${c.searchBorder}`,
              color: c.text1,
              fontSize: 12,
              outline: 'none',
              minWidth: 0,
            }}
            placeholder="Hạng..."
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateTier(i, t.pct - 5)}
              className="w-8 h-8 rounded-lg flex items-center justify-center active:opacity-70"
              style={{ background: c.surface2 }}
              aria-label="Giảm"
            >
              <Minus size={12} color={c.text3} />
            </button>
            <span style={{
              color: TIER_COLORS[i % TIER_COLORS.length],
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              width: 36,
              textAlign: 'center',
            }}>
              {t.pct}%
            </span>
            <button
              onClick={() => updateTier(i, t.pct + 5)}
              className="w-8 h-8 rounded-lg flex items-center justify-center active:opacity-70"
              style={{ background: c.surface2 }}
              aria-label="Tăng"
            >
              <Plus size={12} color={c.text3} />
            </button>
          </div>
          {tiers.length > 1 && (
            <button
              onClick={() => removeTier(i)}
              className="w-8 h-8 rounded-lg flex items-center justify-center active:opacity-70"
              style={{ background: 'rgba(239,68,68,0.08)' }}
              aria-label="Xóa bậc"
            >
              <Minus size={12} color="#EF4444" />
            </button>
          )}
        </div>
      ))}

      {/* Total indicator */}
      <div className="flex items-center justify-between px-1 pt-1">
        <button
          onClick={addTier}
          disabled={tiers.length >= 8}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg active:opacity-70"
          style={{
            background: c.chipBg,
            border: `1px solid ${c.chipBorder}`,
            opacity: tiers.length >= 8 ? 0.4 : 1,
            minHeight: 36,
          }}
        >
          <Plus size={12} color={c.text2} />
          <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Thêm bậc</span>
        </button>
        <div className="flex items-center gap-2">
          <span style={{ color: c.text3, fontSize: 11 }}>Tổng:</span>
          <span style={{
            color: isValid ? '#10B981' : '#EF4444',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}>
            {total}%
          </span>
          {isValid ? (
            <Check size={14} color="#10B981" strokeWidth={3} />
          ) : (
            <AlertTriangle size={14} color="#EF4444" />
          )}
        </div>
      </div>
      {!isValid && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <AlertTriangle size={12} color="#EF4444" className="shrink-0 mt-0.5" />
          <span style={{ color: '#EF4444', fontSize: 10, lineHeight: 1.4 }}>
            Tổng % phải bằng 100%. Hiện tại: {total}% ({total > 100 ? `thừa ${total - 100}%` : `thiếu ${100 - total}%`})
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Step 5 — Points, Reward Distribution & Privacy
   ═══════════════════════════════════════════ */

function Step5({ ws, setWs, predictionCtx }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>>; predictionCtx?: PredictionBridgeContext | null }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [feeTooltipOpen, setFeeTooltipOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const estPool = ws.entryPoints * ws.maxParticipants + ws.bonusPool;
  const platformFee = Math.round(estPool * 0.1);
  const creatorAmount = Math.round(estPool * ws.creatorCut / 100);
  const consolationAmount = ws.consolationEnabled ? Math.round((estPool - platformFee - creatorAmount) * ws.consolationPct / 100) : 0;
  const netPool = estPool - platformFee - creatorAmount - consolationAmount;

  const activeDist = REWARD_DIST_OPTIONS.find(d => d.id === ws.rewardDist);
  const displayTiers = ws.rewardDist === 'tiered_custom' ? ws.customTiers : (activeDist?.tiers || []);
  const customTotalValid = ws.rewardDist !== 'tiered_custom' || ws.customTiers.reduce((s, t) => s + t.pct, 0) === 100;

  /* ─── Challenge Type → Reward Preset logic ─── */
  const challengeTypeId = CHALLENGE_TYPES.find(ct => ct.id === ws.winCondition)?.id as ChallengeType | undefined;
  const suggestedPreset = challengeTypeId ? CHALLENGE_REWARD_PRESETS[challengeTypeId] : null;
  const isPresetApplied = suggestedPreset && ws.rewardDist === suggestedPreset.dist;

  /* ─── Dynamic Pool calculations ─── */
  const dynPreviewCount = ws.dynamicPoolEnabled ? ws.dynamicPoolPreviewCount : ws.maxParticipants;
  const dynEstPool = ws.entryPoints * dynPreviewCount + ws.bonusPool;
  const dynPlatformFee = Math.round(dynEstPool * 0.1);
  const dynCreatorAmt = Math.round(dynEstPool * ws.creatorCut / 100);
  const dynConsolation = ws.consolationEnabled ? Math.round((dynEstPool - dynPlatformFee - dynCreatorAmt) * ws.consolationPct / 100) : 0;
  const dynNetPool = dynEstPool - dynPlatformFee - dynCreatorAmt - dynConsolation;
  const dynConsolationPerPerson = ws.consolationEnabled && dynPreviewCount > displayTiers.length
    ? Math.round(dynConsolation / Math.max(1, dynPreviewCount - displayTiers.length))
    : 0;

  return (
    <>
      <SectionHeader title="Points, Thưởng & Quyền riêng tư" accent accentColor="#F59E0B" mb={0} />

      {/* ─── Preset Suggestion Banner ─── */}
      {suggestedPreset && (
        <TrCard className="p-3.5" accentBorder={isPresetApplied ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: isPresetApplied ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
              {isPresetApplied ? <Check size={14} color="#10B981" strokeWidth={3} /> : <Sparkles size={14} color="#F59E0B" />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>
                {isPresetApplied ? 'Preset đã áp dụng' : 'Gợi ý preset cho challenge type'}
              </p>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginBottom: isPresetApplied ? 0 : 8 }}>
                {suggestedPreset.reason}
              </p>
              {!isPresetApplied && (
                <button
                  onClick={() => {
                    hapticSelection();
                    setWs(prev => ({ ...prev, rewardDist: suggestedPreset.dist }));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:opacity-70"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', minHeight: 32 }}
                >
                  <Sparkles size={11} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>
                    Áp dụng "{suggestedPreset.label}"
                  </span>
                </button>
              )}
            </div>
          </div>
        </TrCard>
      )}

      {/* ─── Entry points ─── */}
      <TrCard className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span style={{ color: c.text2, fontSize: φ.sm }}>Entry Points</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWs(prev => ({ ...prev, entryPoints: Math.max(10, prev.entryPoints - 10) }))}
              className="w-11 h-11 rounded-xl flex items-center justify-center active:opacity-70"
              style={{ background: c.surface2 }}
              aria-label="Giảm entry points"
            >
              <Minus size={16} color={c.text2} />
            </button>
            <span style={{ color: '#F59E0B', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace', width: 48, textAlign: 'center' }}>
              {ws.entryPoints}
            </span>
            <button
              onClick={() => setWs(prev => ({ ...prev, entryPoints: Math.min(5000, prev.entryPoints + 10) }))}
              className="w-11 h-11 rounded-xl flex items-center justify-center active:opacity-70"
              style={{ background: c.surface2 }}
              aria-label="Tăng entry points"
            >
              <Plus size={16} color={c.text2} />
            </button>
          </div>
        </div>

        {/* Bonus pool & Creator cut */}
        <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
          <NumberStepper
            label="Bonus pool (thêm từ host)"
            value={ws.bonusPool}
            onChange={v => setWs(prev => ({ ...prev, bonusPool: v }))}
            min={0} max={10000} step={50}
            suffix=" pts"
          />
        </div>
        <NumberStepper
          label="Creator cut"
          value={ws.creatorCut}
          onChange={v => setWs(prev => ({ ...prev, creatorCut: v }))}
          min={0} max={20} step={1}
          suffix="%"
        />
        {ws.creatorCut > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <Info size={12} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
              Host nhận {ws.creatorCut}% pool ({fmtPoints(creatorAmount)} pts) như phần thưởng tổ chức. Phần này được hiển thị công khai cho người chơi.
            </span>
          </div>
        )}
      </TrCard>

      {/* ─── Reward Pool Summary ─── */}
      <TrCard className="p-4">
        <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
          Reward Pool (ước tính)
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: φ.xs }}>Entry × {ws.maxParticipants} người</span>
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>{fmtPoints(ws.entryPoints * ws.maxParticipants)} pts</span>
          </div>
          {ws.bonusPool > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Bonus pool (host)</span>
              <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontFamily: 'monospace' }}>+{fmtPoints(ws.bonusPool)}</span>
            </div>
          )}
          {/* Enhanced platform fee row with tooltip */}
          <div className="relative">
            <button
              onClick={() => { setFeeTooltipOpen(!feeTooltipOpen); hapticSelection(); }}
              className="w-full rounded-lg px-3 py-2.5 text-left active:opacity-80"
              style={{
                background: feeTooltipOpen ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.04)',
                border: `1px solid ${feeTooltipOpen ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.1)'}`,
                minHeight: 44,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={12} color="#F59E0B" className="shrink-0" />
                  <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>Phí vận hành (10%)</span>
                  <Info size={10} color="#F59E0B" style={{ opacity: 0.6 }} />
                </div>
                <span style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>−{fmtPoints(platformFee)} pts</span>
              </div>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 3, marginLeft: 20 }}>
                Bao gồm: kiểm duyệt, escrow, dispute resolution, hạ tầng
                <span style={{ color: '#F59E0B', marginLeft: 4, fontSize: 8, fontWeight: 600 }}>Xem chi tiết ▸</span>
              </p>
            </button>
            <AnimatePresence>
              {feeTooltipOpen && (
                <FeeTooltip amount={platformFee} onClose={() => setFeeTooltipOpen(false)} />
              )}
            </AnimatePresence>
          </div>
          {ws.creatorCut > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Creator cut ({ws.creatorCut}%)</span>
              <span style={{ color: '#EF4444', fontSize: φ.sm, fontFamily: 'monospace' }}>−{fmtPoints(creatorAmount)}</span>
            </div>
          )}
          {ws.consolationEnabled && consolationAmount > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Thưởng an ủi ({ws.consolationPct}%)</span>
              <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontFamily: 'monospace' }}>−{fmtPoints(consolationAmount)}</span>
            </div>
          )}
          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: `1px solid ${c.divider}` }}
          >
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Net pool (chia cho người thắng)</span>
            <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtPoints(netPool)} pts
            </span>
          </div>
          {ws.consolationEnabled && consolationAmount > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Consolation pool (không thắng)</span>
              <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtPoints(consolationAmount)} pts
              </span>
            </div>
          )}
        </div>
      </TrCard>

      {/* ═══ REWARD DISTRIBUTION ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Cách chia thưởng</span>
          <span style={{ color: c.text3, fontSize: 10, fontWeight: 500 }}>(bắt buộc)</span>
        </div>

        {/* Distribution type selector — scrollable cards */}
        <div className="flex flex-col gap-2">
          {REWARD_DIST_OPTIONS.map(opt => {
            const active = ws.rewardDist === opt.id;
            const isRecommended = suggestedPreset && suggestedPreset.dist === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  hapticSelection();
                  setWs(prev => ({
                    ...prev,
                    rewardDist: opt.id,
                    ...(opt.id === 'tiered_custom' ? {} : {}),
                  }));
                }}
                className="w-full text-left active:opacity-70"
              >
                <TrCard
                  className="p-3.5"
                  accentBorder={active ? '#F59E0B' : isRecommended ? 'rgba(16,185,129,0.25)' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: active ? 'rgba(245,158,11,0.12)' : isRecommended ? 'rgba(16,185,129,0.08)' : c.surface2, fontSize: 18 }}
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{
                          color: active ? '#F59E0B' : c.text1,
                          fontSize: φ.sm,
                          fontWeight: 700,
                        }}>
                          {opt.label}
                        </span>
                        {active && <Check size={12} color="#F59E0B" strokeWidth={3} />}
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 rounded-md flex items-center gap-1"
                            style={{
                              background: active ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                              border: '1px solid rgba(16,185,129,0.2)',
                            }}>
                            <Sparkles size={8} color="#10B981" />
                            <span style={{ color: '#10B981', fontSize: 8, fontWeight: 700, letterSpacing: 0.3 }}>
                              RECOMMENDED
                            </span>
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 1, lineHeight: 1.3 }}>{opt.desc}</p>
                      {isRecommended && !active && (
                        <p style={{ color: '#10B981', fontSize: 9, marginTop: 2, lineHeight: 1.3 }}>
                          Phù hợp nhất cho challenge type đã chọn
                        </p>
                      )}
                    </div>
                    {/* Mini preview chips for tiers */}
                    {active && opt.tiers.length > 1 && opt.id !== 'tiered_custom' && (
                      <div className="flex gap-0.5">
                        {opt.tiers.slice(0, 3).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded"
                            style={{ background: hexToRgba(TIER_COLORS[i], 20), color: TIER_COLORS[i], fontSize: 8, fontWeight: 700 }}>
                            {t.pct}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TrCard>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Distribution Visual Breakdown ─── */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Phân chia chi tiết
          </span>
          {activeDist && (
            <span className="px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
              {activeDist.label}
            </span>
          )}
        </div>

        {/* Visual bar */}
        <RewardDistBar tiers={displayTiers} netPool={netPool} />

        {/* Custom tier editor */}
        {ws.rewardDist === 'tiered_custom' && (
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
              Tùy chỉnh % cho từng hạng
            </p>
            <CustomTierEditor
              tiers={ws.customTiers}
              onChange={t => setWs(prev => ({ ...prev, customTiers: t }))}
            />
          </div>
        )}

        {/* Example payout for top tiers */}
        {displayTiers.length > 1 && displayTiers.length <= 5 && (
          <div className="mt-4 pt-3 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${c.divider}` }}>
            <p style={{ color: c.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, marginBottom: 2 }}>
              Ước tính thưởng (nếu {ws.maxParticipants} người tham gia)
            </p>
            {displayTiers.map((t, i) => {
              const pts = Math.round(netPool * t.pct / 100);
              const roi = ws.entryPoints > 0 ? ((pts / ws.entryPoints - 1) * 100).toFixed(0) : '0';
              return (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: hexToRgba(TIER_COLORS[i % TIER_COLORS.length], 8) }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{t.rank}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: TIER_COLORS[i % TIER_COLORS.length], fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtPoints(pts)} pts
                    </span>
                    {Number(roi) > 0 && (
                      <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>
                        +{roi}% ROI
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TrCard>

      {/* ─── N7: Compare distribution types button ─── */}
      <button
        onClick={() => { setComparisonOpen(true); hapticSelection(); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
        style={{
          background: 'rgba(139,92,246,0.06)', border: '1.5px solid rgba(139,92,246,0.15)',
          color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600, minHeight: 44,
        }}
      >
        <Target size={13} />
        So sánh các cách chia thưởng
      </button>

      <DistributionComparisonSheet
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        entryPoints={ws.entryPoints}
        maxParticipants={ws.maxParticipants}
        platformFeePct={10}
      />

      {/* ═══ CONSOLATION PRIZE ═══ */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: 16 }}>🎁</span>
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Thưởng an ủi (Consolation Prize)</span>
        </div>
        <ToggleRow
          label="Bật thưởng an ủi"
          desc="Chia nhỏ % pool cho người tham gia không thắng"
          value={ws.consolationEnabled}
          onChange={v => setWs(prev => ({ ...prev, consolationEnabled: v }))}
        />
        <AnimatePresence>
          {ws.consolationEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                <NumberStepper
                  label="% pool cho consolation"
                  value={ws.consolationPct}
                  onChange={v => setWs(prev => ({ ...prev, consolationPct: v }))}
                  min={1} max={30} step={1}
                  suffix="%"
                />
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <Info size={12} color="#8B5CF6" className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5, marginBottom: 4 }}>
                      {ws.consolationPct}% net pool ({fmtPoints(consolationAmount)} pts) sẽ được chia đều cho những người tham gia không nằm trong top thắng.
                    </p>
                    {ws.maxParticipants > displayTiers.length && (
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                        Ước tính: ~{fmtPoints(Math.round(consolationAmount / Math.max(1, ws.maxParticipants - displayTiers.length)))} pts/người × {ws.maxParticipants - displayTiers.length} người không thắng
                      </p>
                    )}
                  </div>
                </div>
                {ws.consolationPct > 20 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                    <span style={{ color: '#F59E0B', fontSize: 10, lineHeight: 1.4 }}>
                      Consolation prize trên 20% có thể giảm động lực cạnh tranh cho người chơi top.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TrCard>

      {/* ═══ DYNAMIC POOL ═══ */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} color="#3B82F6" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Dynamic Pool</span>
          <span className="px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>
            PREVIEW
          </span>
        </div>
        <ToggleRow
          label="Bật Dynamic Pool"
          desc="Pool thay đổi theo số người tham gia thực tế"
          value={ws.dynamicPoolEnabled}
          onChange={v => setWs(prev => ({ ...prev, dynamicPoolEnabled: v }))}
        />
        <AnimatePresence>
          {ws.dynamicPoolEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                {/* Participant slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: φ.xs }}>Số người tham gia (preview)</span>
                    <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                      {ws.dynamicPoolPreviewCount} người
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={Math.max(ws.maxParticipants * 2, 100)}
                    step={1}
                    value={ws.dynamicPoolPreviewCount}
                    onChange={e => setWs(prev => ({ ...prev, dynamicPoolPreviewCount: Number(e.target.value) }))}
                    className="w-full"
                    style={{ accentColor: '#3B82F6', height: 4 }}
                  />
                  {/* Quick marks */}
                  <div className="flex justify-between mt-1.5">
                    {DYNAMIC_POOL_MARKS.filter(m => m <= Math.max(ws.maxParticipants * 2, 100)).map(mark => (
                      <button
                        key={mark}
                        onClick={() => { setWs(prev => ({ ...prev, dynamicPoolPreviewCount: mark })); hapticSelection(); }}
                        className="px-1.5 py-0.5 rounded active:opacity-70"
                        style={{
                          background: ws.dynamicPoolPreviewCount === mark ? 'rgba(59,130,246,0.12)' : 'transparent',
                          minWidth: 28, minHeight: 24,
                        }}
                      >
                        <span style={{
                          color: ws.dynamicPoolPreviewCount === mark ? '#3B82F6' : c.text3,
                          fontSize: 9, fontWeight: 600,
                        }}>
                          {mark}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Pool Realtime Preview */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <p style={{ color: '#3B82F6', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                      PREVIEW: {ws.dynamicPoolPreviewCount} NGƯỜI THAM GIA
                    </p>
                    {ws.dynamicPoolPreviewCount < ws.dynamicPoolMinParticipants && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 700 }}>DƯỚI NGƯỠNG — TỰ HỦY</span>
                      </motion.span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 10 }}>Gross pool</span>
                      <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtPoints(dynEstPool)} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Receipt size={10} color="#F59E0B" className="shrink-0" />
                        <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>Phí vận hành (10%)</span>
                      </div>
                      <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>−{fmtPoints(dynPlatformFee)}</span>
                    </div>
                    {ws.creatorCut > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: c.text3, fontSize: 10 }}>Creator cut ({ws.creatorCut}%)</span>
                        <span style={{ color: '#EF4444', fontSize: 11, fontFamily: 'monospace' }}>−{fmtPoints(dynCreatorAmt)}</span>
                      </div>
                    )}
                    {ws.consolationEnabled && dynConsolation > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: c.text3, fontSize: 10 }}>Consolation ({ws.consolationPct}%)</span>
                        <span style={{ color: '#8B5CF6', fontSize: 11, fontFamily: 'monospace' }}>−{fmtPoints(dynConsolation)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1.5" style={{ borderTop: `1px solid rgba(59,130,246,0.1)` }}>
                      <span style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>Net pool (winners)</span>
                      <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                        {fmtPoints(dynNetPool)} pts
                      </span>
                    </div>
                  </div>

                  {/* Per-tier breakdown */}
                  {displayTiers.length > 0 && displayTiers.length <= 5 && (
                    <div className="mt-3 pt-2.5 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}>
                      <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.3, marginBottom: 2 }}>
                        Ước tính thưởng theo hạng
                      </p>
                      {displayTiers.map((t, i) => {
                        const pts = Math.round(dynNetPool * t.pct / 100);
                        const roi = ws.entryPoints > 0 ? ((pts / ws.entryPoints - 1) * 100).toFixed(0) : '0';
                        return (
                          <div key={i} className="flex items-center justify-between px-2 py-1 rounded"
                            style={{ background: hexToRgba(TIER_COLORS[i % TIER_COLORS.length], 8) }}>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-sm" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
                              <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>{t.rank}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span style={{ color: TIER_COLORS[i % TIER_COLORS.length], fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                                {fmtPoints(pts)} pts
                              </span>
                              {Number(roi) > 0 && (
                                <span style={{ color: '#10B981', fontSize: 8, fontWeight: 600 }}>+{roi}%</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {ws.consolationEnabled && dynConsolationPerPerson > 0 && (
                        <div className="flex items-center justify-between px-2 py-1 rounded"
                          style={{ background: 'rgba(139,92,246,0.04)' }}>
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: 9 }}>🎁</span>
                            <span style={{ color: c.text3, fontSize: 10 }}>Mỗi người không thắng</span>
                          </div>
                          <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                            ~{fmtPoints(dynConsolationPerPerson)} pts
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pool size comparison bar — animated */}
                  <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(59,130,246,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, letterSpacing: 0.3, marginBottom: 6 }}>
                      Pool theo số người (so sánh)
                    </p>
                    <div className="flex flex-col gap-1">
                      {[
                        { count: Math.max(2, Math.round(ws.maxParticipants * 0.25)), label: '25%' },
                        { count: Math.round(ws.maxParticipants * 0.5), label: '50%' },
                        { count: ws.maxParticipants, label: '100%' },
                        { count: Math.round(ws.maxParticipants * 1.5), label: '150%' },
                        { count: ws.maxParticipants * 2, label: '200%' },
                      ].map(({ count, label }) => {
                        const pool = count * ws.entryPoints + ws.bonusPool;
                        const net = pool - Math.round(pool * 0.1) - Math.round(pool * ws.creatorCut / 100)
                          - (ws.consolationEnabled ? Math.round((pool - Math.round(pool * 0.1) - Math.round(pool * ws.creatorCut / 100)) * ws.consolationPct / 100) : 0);
                        const maxNet = ws.maxParticipants * 2 * ws.entryPoints + ws.bonusPool;
                        const barPct = Math.max(5, (net / maxNet) * 100);
                        const isCurrent = count === ws.dynamicPoolPreviewCount;
                        const belowMin = count < ws.dynamicPoolMinParticipants;
                        return (
                          <div key={label} className="flex items-center gap-2">
                            <span style={{
                              color: belowMin ? '#EF4444' : isCurrent ? '#3B82F6' : c.text3,
                              fontSize: 9, fontWeight: isCurrent ? 700 : 500, minWidth: 28, textAlign: 'right',
                              textDecoration: belowMin ? 'line-through' : 'none',
                            }}>
                              {count}p
                            </span>
                            <div className="flex-1 h-3 rounded-sm overflow-hidden relative" style={{ background: c.surface2 }}>
                              <motion.div
                                className="h-full rounded-sm"
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.8 }}
                                style={{
                                  background: belowMin
                                    ? 'rgba(239,68,68,0.3)'
                                    : isCurrent
                                      ? '#3B82F6'
                                      : 'rgba(59,130,246,0.25)',
                                }}
                              />
                              {belowMin && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span style={{ color: '#EF4444', fontSize: 7, fontWeight: 700, letterSpacing: 0.3 }}>HỦY</span>
                                </div>
                              )}
                            </div>
                            <motion.span
                              key={net}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{
                                color: belowMin ? '#EF4444' : isCurrent ? '#3B82F6' : c.text3,
                                fontSize: 9, fontWeight: isCurrent ? 700 : 500,
                                fontFamily: 'monospace', minWidth: 52, textAlign: 'right',
                              }}
                            >
                              {belowMin ? 'Hoàn tiền' : fmtPoints(net)}
                            </motion.span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Min threshold indicator line */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                      <span style={{ color: '#EF4444', fontSize: 8, fontWeight: 600 }}>
                        Dưới {ws.dynamicPoolMinParticipants} người = tự hủy
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                    </div>
                  </div>
                </div>

                {/* ─── Minimum Participants Threshold ─── */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={12} color="#EF4444" />
                    <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>Ngưỡng tối thiểu</span>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginBottom: 8 }}>
                    Nếu không đủ người tham gia trước hạn chót, challenge sẽ tự động hủy và hoàn lại entry points.
                  </p>
                  <NumberStepper
                    label="Tối thiểu"
                    value={ws.dynamicPoolMinParticipants}
                    onChange={v => setWs(prev => ({ ...prev, dynamicPoolMinParticipants: v }))}
                    min={2} max={Math.min(ws.maxParticipants, 100)} step={1}
                    suffix=" người"
                  />
                  {ws.dynamicPoolMinParticipants < 3 && (
                    <div className="flex items-start gap-2 mt-2 px-2.5 py-2 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                      <AlertTriangle size={10} color="#F59E0B" className="shrink-0 mt-0.5" />
                      <span style={{ color: '#F59E0B', fontSize: 9, lineHeight: 1.4 }}>
                        Ngưỡng thấp (dưới 3 người) có thể dẫn đến challenge không cạnh tranh.
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.04)' }}>
                    <span style={{ fontSize: 10 }}>🚫</span>
                    <span style={{ color: '#EF4444', fontSize: 9, fontWeight: 600, lineHeight: 1.4 }}>
                      Dưới {ws.dynamicPoolMinParticipants} người → tự hủy + hoàn tiền 100%
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.08)' }}>
                  <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Dynamic Pool: pool thay đổi theo số người tham gia thực tế. Phần thưởng chỉ được tính khi challenge kết thúc.
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TrCard>

      {/* ─── Visibility ─── */}
      <div>
        <FieldLabel>Quyền riêng tư</FieldLabel>
        <ChipSelector
          options={[
            { id: 'public' as Visibility, label: 'Công khai', icon: '🌐' },
            { id: 'private' as Visibility, label: 'Riêng tư', icon: '🔒' },
            { id: 'friends_only' as Visibility, label: 'Bạn bè', icon: '👥' },
          ]}
          value={ws.visibility}
          onChange={v => setWs(prev => ({ ...prev, visibility: v }))}
        />
      </div>

      {/* Join deadline */}
      <div>
        <FieldLabel>Hạn chót tham gia</FieldLabel>
        <input
          type="date"
          value={ws.joinDeadline}
          onChange={e => setWs(prev => ({ ...prev, joinDeadline: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            color: c.text1,
            fontSize: φ.sm,
            outline: 'none',
          }}
        />
      </div>

      {/* Toggles */}
      <TrCard className="p-4">
        <ToggleRow
          label="Yêu cầu bằng chứng"
          desc="Người chơi phải gửi ảnh/video minh chứng"
          value={ws.evidenceRequired}
          onChange={v => setWs(prev => ({ ...prev, evidenceRequired: v }))}
        />
      </TrCard>

      {/* House Rules summary (auto-generated) */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>House Rules (tự sinh)</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            'Entry points bị trừ ngay khi tham gia',
            ws.evidenceRequired ? 'Bằng chứng bắt buộc trước khi claim' : null,
            `Kết quả chốt bằng: ${RESOLUTION_METHODS.find(r => r.id === ws.resolution)?.label}`,
            `Chia thưởng: ${activeDist?.label || 'Top 3'} (${displayTiers.map(t => `${t.rank}: ${t.pct}%`).join(', ')})`,
            ws.tieRule ? `Tie rule: ${ws.tieRule}` : 'Nếu hòa: pool chia đều',
            ws.bonusPool > 0 ? `Host thêm ${fmtPoints(ws.bonusPool)} pts vào pool` : null,
            ws.creatorCut > 0 ? `Creator cut: ${ws.creatorCut}% pool` : null,
            ws.consolationEnabled ? `Thưởng an ủi: ${ws.consolationPct}% net pool chia cho người kh��ng thắng` : null,
            ws.dynamicPoolEnabled ? `Dynamic Pool: phần thưởng thay đổi theo số người tham gia thực tế (tối thiểu ${ws.dynamicPoolMinParticipants} người, dưới ngưỡng → tự hủy)` : null,
            ws.rematchEnabled ? 'Cho phép rematch' : null,
          ].filter(Boolean).map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, minWidth: 14 }}>{i + 1}.</span>
              <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>{rule}</span>
            </div>
          ))}
          {/* Platform fee — highlighted rule */}
          <div
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mt-1"
            style={{
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.12)',
            }}
          >
            <Receipt size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700, lineHeight: 1.5 }}>
                Phí vận hành: 10% tổng pool
              </span>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 2 }}>
                Bao gồm kiểm duyệt, escrow, dispute resolution và hạ tầng. Không có phí ẩn.
              </p>
            </div>
          </div>
        </div>
      </TrCard>

      {/* Validation warning for custom tiers */}
      {!customTotalValid && (
        <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(239,68,68,0.3)">
          <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
          <p style={{ color: '#EF4444', fontSize: φ.xs, lineHeight: 1.5 }}>
            Tổng % phân chia thưởng phải bằng 100%. Vui lòng điều chỉnh các bậc trước khi tiếp tục.
          </p>
        </TrCard>
      )}

      {/* Moderation note */}
      <TrCard className="p-3 flex items-start gap-2">
        <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
          Challenge sẽ được kiểm duyệt tự động. Nội dung vi phạm sẽ bị ẩn. Arena Points không phải tài sản tài chính.
        </p>
      </TrCard>

      {/* 07A Governance: Room Safety Snapshot */}
      <RoomSafetySnapshotCard
        snapshot={{
          format: MATCH_FORMATS.find(f => f.id === ws.matchFormat)?.label || ws.matchFormat,
          resolution: RESOLUTION_METHODS.find(r => r.id === ws.resolution)?.label || ws.resolution,
          evidence: ws.evidenceRequired ? 'Bắt buộc' : 'Không bắt buộc',
          privacy: ws.visibility === 'public' ? 'Công khai' : ws.visibility === 'private' ? 'Riêng tư' : 'Bạn bè',
          voidRule: ws.voidRule || 'Chưa thiết lập',
          riskTier: resolutionRisk(ws.resolution),
        }}
      />

      {/* 09D: Prediction Bridge Safety Snapshot */}
      {predictionCtx && (
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Bridge Safety Snapshot</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { icon: '🎮', label: 'Arena Points only', desc: 'Không liên quan tài sản thật' },
              { icon: '🔗', label: 'Market context linked', desc: `Từ: ${predictionCtx.eventTitle.slice(0, 35)}…` },
              { icon: '🔒', label: 'Wallet independent', desc: 'Không kết nối ví, không ảnh hưởng vị thế' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.04)' }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }} className="truncate">{item.desc}</p>
                </div>
                <Check size={12} color="#10B981" className="shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </TrCard>
      )}

      {/* 07A Governance: Publish Eligibility */}
      {(() => {
        const clarityScore = computeClarityScore({
          title: ws.title, description: ws.description, winCondition: ws.winCondition,
          tieRule: ws.tieRule, voidRule: ws.voidRule, resultDeadline: ws.resultDeadline,
          evidenceRequired: ws.evidenceRequired, joinStyle: ws.joinStyle,
        });
        const checks: EligibilityCheck[] = [
          { id: 'title', label: 'Tên challenge', passed: ws.title.length >= 3, hint: 'Cần ít nhất 3 ký tự' },
          { id: 'desc', label: 'Mô tả đầy đủ', passed: ws.description.length >= 10, hint: 'Mô tả cần ít nhất 10 ký tự' },
          { id: 'win', label: 'Điều kiện thắng', passed: ws.winCondition.length >= 5, hint: 'Cần mô tả rõ cách xác định người thắng' },
          { id: 'tie', label: 'Luật hòa (tie rule)', passed: ws.tieRule.length >= 2, hint: 'Nên có luật hòa để tránh tranh chấp' },
          { id: 'void', label: 'Luật hủy bỏ (void rule)', passed: ws.voidRule.length >= 2, hint: 'Nên có void rule cho trường hợp bất khả kháng' },
          { id: 'deadline', label: 'Thời hạn kết quả', passed: ws.resultDeadline.length >= 1, hint: 'Cần xác định thời hạn chốt kết quả' },
          { id: 'referee', label: 'Referee đã chỉ định', passed: ws.resolution !== 'referee' || ws.refereeName.length >= 2, hint: 'Cần chỉ định người phân xử' },
          { id: 'clarity', label: `Rule clarity >= 40 (hiện: ${clarityScore})`, passed: clarityScore >= 40, hint: 'Cần bổ sung thêm thông tin luật chơi' },
        ];
        const allPassed = checks.every(ch => ch.passed);
        const missingReferee = ws.resolution === 'referee' && ws.refereeName.length < 2;
        const isHighRisk = resolutionRisk(ws.resolution) === 'high';
        const missingRules = clarityScore < 40;
        let status: GovernanceStatus = 'publish_ready';
        if (!allPassed) status = 'publish_blocked';
        if (missingReferee) status = 'missing_referee';
        if (missingRules) status = 'missing_rules';
        if (isHighRisk && allPassed) status = 'high_risk';
        if (allPassed && !isHighRisk) status = 'publish_ready';

        return <PublishEligibilityPanel checks={checks} status={status} />;
      })()}
    </>
  );
}

/* ═══════════════════════════════════════════
   Step 6 — Review & Publish
   ═══════════════════════════════════════════ */

function Step6({ ws, setWs, predictionCtx }: { ws: WizardState; setWs: React.Dispatch<React.SetStateAction<WizardState>>; predictionCtx?: PredictionBridgeContext | null }) {
  const c = useThemeColors();
  const template = ARENA_TEMPLATES.find(t => t.id === ws.templateId);
  const resolution = RESOLUTION_METHODS.find(r => r.id === ws.resolution);
  const estPool = ws.entryPoints * ws.maxParticipants + ws.bonusPool;
  const platformFee6 = Math.round(estPool * 0.1);
  const creatorAmt6 = Math.round(estPool * ws.creatorCut / 100);
  const consolationAmt6 = ws.consolationEnabled ? Math.round((estPool - platformFee6 - creatorAmt6) * ws.consolationPct / 100) : 0;
  const netPool = estPool - platformFee6 - creatorAmt6 - consolationAmt6;
  const activeDist6 = REWARD_DIST_OPTIONS.find(d => d.id === ws.rewardDist);
  const displayTiers6 = ws.rewardDist === 'tiered_custom' ? ws.customTiers : (activeDist6?.tiers || []);

  /* ─── Map resolution method id to chip type ─── */
  const resolutionMap: Record<ResolutionMethod, 'auto' | 'mutual_confirm' | 'referee' | 'community_vote'> = {
    auto: 'auto',
    mutual: 'mutual_confirm',
    referee: 'referee',
    community_vote: 'community_vote',
  };

  const rows: { label: string; value: string; color?: string }[] = [
    ...(predictionCtx ? [
      { label: 'Linked Event', value: predictionCtx.eventTitle.slice(0, 40), color: '#3B82F6' },
      { label: 'Topic', value: predictionCtx.topic, color: '#3B82F6' },
      { label: 'Context Source', value: 'Prediction Market', color: '#3B82F6' },
    ] : []),
    { label: 'Template', value: template ? `${template.icon} ${template.title}` : '—' },
    { label: 'Creator / Host', value: 'CryptoTrader_VN' },
    { label: 'Format', value: MATCH_FORMATS.find(f => f.id === ws.matchFormat)?.label || ws.matchFormat },
    { label: 'Số slot', value: `${ws.maxParticipants} người` },
    { label: 'Tên', value: ws.title || '—' },
    { label: 'Category', value: ws.category },
    { label: 'Điều kiện thắng', value: ws.winCondition || '—' },
    { label: 'Luật hòa', value: ws.tieRule || 'Pool chia đều' },
    { label: 'Void rule', value: ws.voidRule || '—' },
    { label: 'Chốt kết quả', value: resolution?.label || '—' },
    { label: 'Bằng chứng', value: ws.evidenceRequired ? 'Bắt buộc' : 'Không' },
    { label: 'Kết thúc', value: ws.endDate },
    { label: 'Chốt KQ trước', value: ws.resultDeadline },
    { label: 'Quyền riêng tư', value: ws.visibility === 'public' ? 'Công khai' : ws.visibility === 'private' ? 'Riêng tư' : 'Bạn bè' },
    { label: 'Chia thưởng', value: activeDist6?.label || 'Top 3', color: '#F59E0B' },
    { label: 'Entry', value: `${ws.entryPoints} pts`, color: '#F59E0B' },
    ...(ws.bonusPool > 0 ? [{ label: 'Bonus pool', value: `+${fmtPoints(ws.bonusPool)} pts`, color: '#8B5CF6' }] : []),
    ...(ws.creatorCut > 0 ? [{ label: 'Creator cut', value: `${ws.creatorCut}%`, color: '#EF4444' }] : []),
    ...(ws.consolationEnabled ? [{ label: 'Thưởng an ủi', value: `${ws.consolationPct}% (${fmtPoints(consolationAmt6)} pts)`, color: '#8B5CF6' }] : []),
    ...(ws.dynamicPoolEnabled ? [
      { label: 'Dynamic Pool', value: 'Bật — pool thay đổi theo số người', color: '#3B82F6' },
      { label: 'Tối thiểu tham gia', value: `${ws.dynamicPoolMinParticipants} người (dưới → tự hủy)`, color: '#EF4444' },
    ] : []),
    { label: 'Net Pool (est.)', value: `${fmtPoints(netPool)} pts`, color: '#10B981' },
  ];

  return (
    <>
      <SectionHeader title="Review & Publish" accent accentColor="#8B5CF6" mb={0} />

      {/* ─── Visual Chips Summary ─── */}
      <div className="flex flex-wrap gap-2">
        <FormatChip format={ws.matchFormat} size="md" />
        <ResolutionChip resolution={resolutionMap[ws.resolution]} size="md" />
        <TrustBadge type="points_only" size="md" />
        <ResolutionRiskChip method={ws.resolution} size="md" />
        <PolicyVersionTag />
      </div>

      {/* 07A Governance: Enterprise Review Card */}
      <TrCard className="p-4">
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3"
              style={{ paddingBottom: i < rows.length - 1 ? 8 : 0, borderBottom: i < rows.length - 1 ? `1px solid ${c.divider}` : 'none' }}
            >
              <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 80 }}>{r.label}</span>
              <span
                className="text-right"
                style={{
                  color: r.color || c.text1,
                  fontSize: φ.sm,
                  fontWeight: 600,
                  wordBreak: 'break-word',
                  maxWidth: '60%',
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Description preview */}
      {ws.description && (
        <TrCard className="p-4">
          <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>Mô tả luật chơi</p>
          <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5 }}>{ws.description}</p>
        </TrCard>
      )}

      {/* Reward Distribution Review */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Phân chia thưởng</span>
          <span className="px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
            {activeDist6?.label}
          </span>
        </div>
        <RewardDistBar tiers={displayTiers6} netPool={netPool} />
        {ws.consolationEnabled && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(139,92,246,0.06)' }}>
            <span style={{ fontSize: 13 }}>🎁</span>
            <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
              Thưởng an ủi: {ws.consolationPct}% net pool ({fmtPoints(consolationAmt6)} pts) chia cho người không thắng
            </span>
          </div>
        )}
        {ws.dynamicPoolEnabled && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.06)' }}>
              <Users size={12} color="#3B82F6" />
              <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
                Dynamic Pool bật — pool sẽ thay đổi theo số người tham gia thực tế
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <AlertTriangle size={11} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: 10, lineHeight: 1.4 }}>
                Tối thiểu {ws.dynamicPoolMinParticipants} người tham gia — dưới ngưỡng sẽ tự hủy + hoàn 100% entry
              </span>
            </div>
          </div>
        )}
      </TrCard>

      {/* Platform fee final reminder — Step 6 Review */}
      <PlatformFeeBanner variant="compact" />

      {/* 07A Governance: Confirm checkbox */}
      <button
        onClick={() => setWs(prev => ({ ...prev, confirmClarity: !prev.confirmClarity }))}
        className="flex items-start gap-3 py-3 px-4 rounded-xl active:opacity-70"
        style={{
          background: ws.confirmClarity ? 'rgba(16,185,129,0.08)' : c.surface2,
          border: `1.5px solid ${ws.confirmClarity ? 'rgba(16,185,129,0.3)' : c.borderSolid}`,
          minHeight: 44,
        }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: ws.confirmClarity ? '#10B981' : 'transparent',
            border: ws.confirmClarity ? 'none' : `2px solid ${c.text3}`,
          }}
        >
          {ws.confirmClarity && <Check size={12} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5, textAlign: 'left' as const }}>
          Tôi xác nhận luật rõ ràng và có thể kiểm chứng. Challenge tuân thủ Arena Policy.
        </span>
      </button>

      {/* Moderation notice */}
      <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(245,158,11,0.3)">
        <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
          Sau khi mở phòng, challenge sẽ được kiểm duyệt tự động trước khi hiển thị công khai. Quá trình này mất khoảng 1–5 phút.
        </p>
      </TrCard>
    </>
  );
}

/* ═══════════════════════════════════════════
   State Screens
   ═══════════════════════════════════════════ */

function DraftState({ onResume, onDiscard, savedAt, draftStep, draftWs }: {
  onResume: () => void;
  onDiscard: () => void;
  savedAt: number | null;
  draftStep: number;
  draftWs: WizardState;
}) {
  const c = useThemeColors();
  const age = savedAt ? draftAgeDays(savedAt) : 0;
  const ageText = savedAt ? draftAgeLabel(savedAt) : null;
  const isStale = age >= 3;
  const templateLabel = draftWs.templateId
    ? ARENA_TEMPLATES.find(t => t.id === draftWs.templateId)?.label
    : null;

  return (
    <div className="flex-1 flex flex-col px-5 pt-6">
      {/* Header area */}
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(139,92,246,0.1)' }}
        >
          <FileText size={26} color="#8B5CF6" />
        </div>
        <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Có bản nháp chưa hoàn thành</p>
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
          Bạn đang soạn dở 1 challenge. Tiếp tục từ nơi đã dừng hoặc bắt đầu lại.
        </p>
      </div>

      {/* Draft info card */}
      <TrCard className="p-4 mb-3" accentBorder="rgba(139,92,246,0.2)">
        {/* Title + template */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.08)' }}
          >
            <FileEdit size={18} color="#8B5CF6" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>
              {draftWs.title || 'Challenge chưa đặt tên'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {templateLabel && (
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}
                >
                  {templateLabel}
                </span>
              )}
              {draftWs.category && (
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{ background: c.chipBg, color: c.chipText, fontSize: 10, fontWeight: 500 }}
                >
                  {draftWs.category}
                </span>
              )}
              <span style={{ color: c.text3, fontSize: 10 }}>
                {ageText ? `Lưu: ${ageText}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div
          className="rounded-xl px-3.5 py-3"
          style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}` }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span style={{ color: c.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>
              TIẾN ĐỘ
            </span>
            <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 700 }}>
              Bước {draftStep} / {STEPS.length}
            </span>
          </div>
          <div className="flex gap-1.5 mb-2.5">
            {STEPS.map(s => {
              const done = s.id < draftStep;
              const current = s.id === draftStep;
              return (
                <div key={s.id} className="flex-1 relative" style={{ height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: done
                        ? '#8B5CF6'
                        : current
                          ? 'linear-gradient(90deg, #8B5CF6 60%, rgba(139,92,246,0.2) 100%)'
                          : c.chipBg,
                      borderRadius: 2,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {STEPS.map(s => {
              const done = s.id < draftStep;
              const current = s.id === draftStep;
              return (
                <div key={s.id} className="flex-1 text-center">
                  <span style={{
                    fontSize: 8,
                    fontWeight: current ? 700 : 500,
                    color: current ? '#8B5CF6' : done ? c.text2 : c.text3,
                    lineHeight: 1.2,
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current step detail */}
        <div className="flex items-center gap-2 mt-3 px-1">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 800 }}>{draftStep}</span>
          </div>
          <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.4 }}>
            Đang ở bước <strong style={{ color: c.text1 }}>{STEPS.find(s => s.id === draftStep)?.label}</strong> — bấm Tiếp tục để soạn tiếp
          </span>
        </div>
      </TrCard>

      {/* Stale draft warning */}
      {isStale && (
        <div
          className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl mb-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            Bản nháp đã cũ <strong>{age} ngày</strong>. Thị trường và điều kiện có thể đã thay đổi. Hãy kiểm tra lại trước khi publish.
          </p>
        </div>
      )}

      {/* Privacy note */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-6"
        style={{ background: c.searchBg }}>
        <Lock size={12} color={c.text3} className="shrink-0" />
        <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
          Bản nháp chỉ hiển thị với bạn. Chưa ai khác nhìn thấy.
        </span>
      </div>

      {/* Actions — push to bottom */}
      <div className="flex-1" />
      <div className="flex gap-3 pb-6">
        <button onClick={onDiscard} className="flex-1 py-3 rounded-xl active:opacity-70"
          style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 48 }}>
          Bỏ nháp
        </button>
        <div className="flex-1">
          <CTAButton onClick={onResume}>
            <div className="flex items-center gap-2 justify-center">
              Tiếp tục <ChevronRight size={16} />
            </div>
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <ArenaLoadingSkeleton variant="studio" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const c = useThemeColors();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)', fontSize: 32 }}>
        <AlertTriangle size={32} color="#EF4444" />
      </div>
      <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Không thể tạo challenge</p>
      <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 20 }}>
        Đã xảy ra lỗi khi gửi challenge. Vui lòng kiểm tra kết nối mạng và thử lại.
      </p>
      <CTAButton onClick={onRetry}>Thử lại</CTAButton>
    </div>
  );
}

function UnderReviewState({ onHome }: { onHome: () => void }) {
  const c = useThemeColors();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)', fontSize: 32 }}>
        <Clock size={32} color="#8B5CF6" />
      </div>
      <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Đang kiểm duyệt</p>
      <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 8 }}>
        Challenge của bạn đã được gửi thành công và đang chờ kiểm duyệt tự động. Thường mất 1–5 phút.
      </p>
      <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 20 }}>
        Bạn sẽ nhận thông báo khi challenge được duyệt.
      </p>
      <CTAButton onClick={onHome}>Về trang Arena</CTAButton>
    </div>
  );
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
  const c = useThemeColors();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(148,163,184,0.1)', fontSize: 32 }}>
        <WifiOff size={32} color="#94A3B8" />
      </div>
      <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Không có kết nối</p>
      <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 20 }}>
        Không thể kết nối server. Bản nháp đã được lưu tự động. Hãy thử lại khi có mạng.
      </p>
      <CTAButton onClick={onRetry}>
        <div className="flex items-center gap-2 justify-center">
          <RefreshCw size={14} /> Thử lại
        </div>
      </CTAButton>
    </div>
  );
}

/* ═══════════════════════════════════════════
   localStorage Draft Persistence (versioned)
   ═══════════════════════════════════════════ */

const DRAFT_STORAGE_KEY = 'arena_studio_draft';
const DRAFT_CURRENT_VERSION = 2;

/** Envelope stored in localStorage */
interface DraftEnvelope {
  _version: number;
  _savedAt: number; // epoch ms
  step: number;
  ws: WizardState;
}

/* ─── Migration registry ─── */

type MigrationFn = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Each key N migrates from version N → N+1.
 * Migrations are applied sequentially.
 */
const MIGRATIONS: Record<number, MigrationFn> = {
  // v1 → v2: legacy format stored ws fields flat (no envelope).
  // Wrap into envelope structure + fill missing fields from initialState.
  1: (raw) => {
    // v1 had ws fields flat + _step key in separate storage item
    const stepRaw = localStorage.getItem('arena_studio_step');
    const s = stepRaw ? Math.min(6, Math.max(1, parseInt(stepRaw, 10))) : 1;
    localStorage.removeItem('arena_studio_step'); // clean up legacy key
    return {
      _version: 2,
      _savedAt: Date.now(),
      step: isNaN(s) ? 1 : s,
      ws: { ...initialState, ...raw },
    };
  },
};

function detectVersion(raw: Record<string, unknown>): number {
  if (typeof raw._version === 'number') return raw._version;
  // Legacy v1: no _version field, ws fields stored flat
  return 1;
}

function applyMigrations(raw: Record<string, unknown>): DraftEnvelope | null {
  let version = detectVersion(raw);
  let data = { ...raw };

  while (version < DRAFT_CURRENT_VERSION) {
    const migrateFn = MIGRATIONS[version];
    if (!migrateFn) {
      // No migration path — discard
      return null;
    }
    data = migrateFn(data);
    version++;
  }

  // Validate final shape
  const envelope = data as unknown as DraftEnvelope;
  if (!envelope.ws || typeof envelope.step !== 'number') return null;
  return envelope;
}

function loadDraft(): { ws: WizardState; step: number; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const envelope = applyMigrations(parsed);
    if (!envelope) return null;

    const ws = { ...initialState, ...envelope.ws };
    // Must have at least templateId or title to count as real draft
    if (!ws.templateId && !ws.title) return null;

    const step = Math.min(6, Math.max(1, envelope.step));
    const savedAt = envelope._savedAt || Date.now();

    return { ws, step, savedAt };
  } catch {
    return null;
  }
}

function saveDraftToStorage(ws: WizardState, step: number): void {
  try {
    const envelope: DraftEnvelope = {
      _version: DRAFT_CURRENT_VERSION,
      _savedAt: Date.now(),
      step,
      ws,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(envelope));
  } catch { /* storage full */ }
}

function clearDraftStorage(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem('arena_studio_step'); // legacy cleanup
  } catch { /* ignore */ }
}

/* ─── Export / Import helpers ─── */

interface ExportPayload {
  _type: 'arena_challenge_template';
  _version: number;
  _exportedAt: string;
  _exportedBy: string;
  step: number;
  ws: WizardState;
}

function exportDraftAsJSON(ws: WizardState, step: number): void {
  const payload: ExportPayload = {
    _type: 'arena_challenge_template',
    _version: DRAFT_CURRENT_VERSION,
    _exportedAt: new Date().toISOString(),
    _exportedBy: 'CryptoTrader_VN',
    step,
    ws,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (ws.title || 'untitled').replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9]/g, '_').slice(0, 40);
  a.download = `arena-template-${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseImportedJSON(text: string): { ws: WizardState; step: number } | { error: string } {
  try {
    const obj = JSON.parse(text);
    // Accept both ExportPayload and DraftEnvelope formats
    if (obj._type === 'arena_challenge_template' && obj.ws) {
      const ws = { ...initialState, ...obj.ws, confirmClarity: false }; // always reset confirm
      const step = Math.min(6, Math.max(1, obj.step || 1));
      return { ws, step };
    }
    if (obj._version && obj.ws) {
      const ws = { ...initialState, ...obj.ws, confirmClarity: false };
      const step = Math.min(6, Math.max(1, obj.step || 1));
      return { ws, step };
    }
    // Try legacy flat format
    if (obj.templateId !== undefined || obj.title !== undefined) {
      const ws = { ...initialState, ...obj, confirmClarity: false };
      return { ws, step: 1 };
    }
    return { error: 'File không đúng định dạng Arena template.' };
  } catch {
    return { error: 'Không thể đọc file JSON.' };
  }
}

/** Compute draft age in days */
function draftAgeDays(savedAt: number): number {
  return Math.floor((Date.now() - savedAt) / (1000 * 60 * 60 * 24));
}

function draftAgeLabel(savedAt: number): string {
  const days = draftAgeDays(savedAt);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

/* ═══════════════════════════════════════════
   ArenaStudioPage — Main Export
   ═══════════════════════════════════════════ */

export function ArenaStudioPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  /* ─── 09D: Prediction Bridge Context from navigation state ─── */
  const locationState = location.state as PredictionBridgeContext | null;
  const [predictionCtx, setPredictionCtx] = useState<PredictionBridgeContext | null>(
    locationState?.fromPrediction ? locationState : null
  );

  /* ─── Load saved draft on mount ─── */
  const savedDraft = React.useMemo(() => loadDraft(), []);
  const hasSavedDraft = savedDraft !== null;

  const [step, setStep] = useState(hasSavedDraft ? savedDraft!.step : 1);
  const [ws, setWs] = useState<WizardState>(hasSavedDraft ? savedDraft!.ws : initialState);
  const [pageState, setPageState] = useState<PageState>(hasSavedDraft ? 'draft' : 'wizard');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState<string | null>(null);
  const [draftSavedAt] = useState<number | null>(savedDraft?.savedAt ?? null);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ─── Auto-save to localStorage (debounced 1.5s) ─── */
  useEffect(() => {
    if (pageState !== 'wizard') return;
    if (!ws.templateId && !ws.title) return;
    const timer = setTimeout(() => {
      saveDraftToStorage(ws, step);
      const now = new Date();
      setAutoSaveLabel(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [ws, step, pageState]);

  /* ─── Step validation ─── */
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!ws.templateId;
      case 2: return ws.maxParticipants >= 2;
      case 3: return ws.title.length >= 3 && ws.description.length >= 10 && ws.winCondition.length >= 5;
      case 4: {
        if (ws.resolution === 'auto') return ws.sourceLabel.length >= 2;
        if (ws.resolution === 'referee') return ws.refereeName.length >= 2;
        return true;
      }
      case 5: {
        if (ws.entryPoints < 10) return false;
        if (ws.rewardDist === 'tiered_custom') {
          const total = ws.customTiers.reduce((s, t) => s + t.pct, 0);
          if (total !== 100) return false;
        }
        return true;
      }
      case 6: return ws.confirmClarity;
      default: return false;
    }
  }, [step, ws]);

  const [stepUpOpen, setStepUpOpen] = useState(false);

  const handleNext = () => {
    if (!canProceed) return;
    hapticSelection();
    if (step < 6) {
      setStep(step + 1);
    } else {
      setStepUpOpen(true);
    }
  };

  const handleBack = () => {
    hapticSelection();
    if (step > 1) setStep(step - 1);
  };

  const handlePublish = () => {
    setPageState('loading');
    clearDraftStorage();
    setTimeout(() => {
      setPageState('under_review');
      actionToast.success(TOAST.ARENA.CHALLENGE_CREATED);
    }, 2000);
  };

  const handleSaveDraft = () => {
    hapticSelection();
    saveDraftToStorage(ws, step);
    actionToast.success(TOAST.ARENA.DRAFT_SAVED);
  };

  const handleExport = () => {
    hapticSelection();
    exportDraftAsJSON(ws, step);
    actionToast.success('Đã xuất template');
  };

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = parseImportedJSON(text);
      if ('error' in result) {
        actionToast.error(result.error);
      } else {
        setWs(result.ws);
        setStep(result.step);
        saveDraftToStorage(result.ws, result.step);
        setPageState('wizard');
        actionToast.success('Đã nhập template thành công');
      }
    };
    reader.onerror = () => actionToast.error('Không thể đọc file');
    reader.readAsText(file);
    // Reset input so same file can be imported again
    e.target.value = '';
  }, [actionToast]);

  /* ─── State screens ─── */
  if (pageState === 'draft') {
    return (
      <PageLayout>
        <Header title="Arena Studio" subtitle="Bản nháp · Open Arena" back />
        <DraftState
          onResume={() => setPageState('wizard')}
          onDiscard={() => { clearDraftStorage(); setWs(initialState); setStep(1); setPageState('wizard'); }}
          savedAt={draftSavedAt}
          draftStep={step}
          draftWs={ws}
        />
      </PageLayout>
    );
  }

  if (pageState === 'loading') {
    return (
      <PageLayout>
        <Header title="Arena Studio" subtitle="Đang tải..." />
        <LoadingState />
      </PageLayout>
    );
  }

  if (pageState === 'error') {
    return (
      <PageLayout>
        <Header title="Arena Studio" subtitle="Lỗi · Open Arena" back />
        <ErrorState onRetry={() => { setPageState('wizard'); setStep(6); }} />
      </PageLayout>
    );
  }

  if (pageState === 'under_review') {
    return (
      <PageLayout>
        <Header title="Arena Studio" subtitle="Đang xem xét · Open Arena" />
        <UnderReviewState onHome={() => navigate(`${prefix}/arena`)} />
      </PageLayout>
    );
  }

  if (pageState === 'offline') {
    return (
      <PageLayout>
        <Header title="Arena Studio" subtitle="Mất kết nối · Open Arena" back />
        <OfflineState onRetry={() => setPageState('wizard')} />
      </PageLayout>
    );
  }

  /* ─── Step labels ─── */
  const stepLabels = [
    'Tiếp tục',
    'Tiếp tục',
    'Tiếp tục',
    'Tiếp tục',
    'Tiếp tục',
    'Mở phòng',
  ];

  return (
    <PageLayout variant="flush">
      <Header
        title="Arena Studio"
        subtitle="Tạo challenge mới"
        back
      />

      <PageContent gap="default" grow>
        {/* Progress stepper */}
        <ProgressStepper current={step} total={STEPS.length} />

        {/* 09D: Bridge Source Bar when from Prediction event */}
        {predictionCtx && (
          <BridgeSourceBar
            eventTitle={predictionCtx.eventTitle}
            topic={predictionCtx.topic}
            eventId={predictionCtx.eventId}
            onRemove={() => { setPredictionCtx(null); hapticSelection(); }}
          />
        )}

        {/* Step content */}
        {step === 1 && <Step1 ws={ws} setWs={setWs} predictionCtx={predictionCtx} />}
        {step === 2 && <Step2 ws={ws} setWs={setWs} />}
        {step === 3 && <Step3 ws={ws} setWs={setWs} predictionCtx={predictionCtx} />}
        {step === 4 && <Step4 ws={ws} setWs={setWs} predictionCtx={predictionCtx} />}
        {step === 5 && <Step5 ws={ws} setWs={setWs} predictionCtx={predictionCtx} />}
        {step === 6 && <Step6 ws={ws} setWs={setWs} predictionCtx={predictionCtx} />}
      </PageContent>

      <StickyFooter>
        <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 active:opacity-70"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
            >
              <ChevronLeft size={18} color={c.text2} />
            </button>
          )}
          <div className="flex-1">
            <CTAButton onClick={handleNext} disabled={!canProceed}>
              {step === 6 ? (
                <div className="flex items-center gap-2 justify-center">
                  <Send size={14} /> {predictionCtx ? 'Mở room Arena' : 'Mở phòng'}
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  {stepLabels[step - 1]} <ChevronRight size={14} />
                </div>
              )}
            </CTAButton>
          </div>
        </div>

        {/* Secondary actions — row 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 py-3 px-2 -ml-2 active:opacity-70"
              style={{ background: 'none', border: 'none', minHeight: 44 }}
            >
              <Save size={14} color={c.text3} />
              <span style={{ color: c.text3, fontSize: φ.xs }}>Lưu</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 py-3 px-2 active:opacity-70"
              style={{ background: 'none', border: 'none', minHeight: 44 }}
              aria-label="Xuất template JSON"
            >
              <Download size={13} color={c.text3} />
              <span style={{ color: c.text3, fontSize: φ.xs }}>Xuất</span>
            </button>
            <button
              onClick={() => { fileInputRef.current?.click(); hapticSelection(); }}
              className="flex items-center gap-1.5 py-3 px-2 active:opacity-70"
              style={{ background: 'none', border: 'none', minHeight: 44 }}
              aria-label="Nhập template JSON"
            >
              <Upload size={13} color={c.text3} />
              <span style={{ color: c.text3, fontSize: φ.xs }}>Nhập</span>
            </button>
            {step === 6 && (
              <button
                onClick={() => { setPreviewOpen(true); hapticSelection(); }}
                className="flex items-center gap-1.5 py-3 px-2 active:opacity-70"
                style={{ background: 'none', border: 'none', minHeight: 44 }}
              >
                <Eye size={14} color="#8B5CF6" />
                <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Xem trước</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {autoSaveLabel && (
              <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>
                Đã lưu {autoSaveLabel}
              </span>
            )}
            <span style={{ color: c.text3, fontSize: φ.xs }}>
              Bước {step} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        </div>
      </StickyFooter>

      {/* Participant Preview Sheet */}
      <ParticipantPreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          title: ws.title,
          description: ws.description,
          matchFormat: MATCH_FORMATS.find(f => f.id === ws.matchFormat)?.label || ws.matchFormat,
          maxParticipants: ws.maxParticipants,
          entryPoints: ws.entryPoints,
          prizePool: Math.round((ws.entryPoints * ws.maxParticipants + ws.bonusPool) * (0.9 - ws.creatorCut / 100)),
          endDate: ws.endDate,
          privacy: ws.visibility === 'public' ? 'Công khai' : ws.visibility === 'private' ? 'Riêng tư' : 'Bạn bè',
          resolutionMethod: ws.resolution,
          evidenceRequired: ws.evidenceRequired,
          voidRule: ws.voidRule,
          tieRule: ws.tieRule,
          creator: 'CryptoTrader_VN',
        }}
      />

      {/* Page footer */}
      <ArenaPageFooter />

      {/* Important #10: Step-up Auth before publishing */}
      <StepUpAuthSheet
        open={stepUpOpen}
        onClose={() => setStepUpOpen(false)}
        onSuccess={handlePublish}
        actionLabel="Mở phòng challenge"
        riskLevel="medium"
      />
    </PageLayout>
  );
}