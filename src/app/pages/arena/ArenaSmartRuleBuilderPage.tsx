import React, { useState, useMemo, useEffect } from 'react';
import {
  Check, ChevronLeft, ChevronRight, ChevronDown, Search,
  AlertTriangle, Info, Shield, Zap, Save, Send, Lightbulb,
  Target, Clock, RefreshCw, Eye, Sparkles, HelpCircle,
  X, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useGoBack } from '../../hooks/useGoBack';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { TOAST } from '../../data/toastMessages';
import { φ, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   Constants & Types
   ═══════════════════════════════════════════ */

type ClarityLevel = 'low' | 'medium' | 'high' | 'public_ready';
type ChallengeType =
  | 'yes_no' | 'multi_choice' | 'closest_guess' | 'highest_wins'
  | 'lowest_wins' | 'first_to_finish' | 'team_score' | 'referee_decision'
  | 'community_vote' | 'proof_challenge';

type DomainId =
  | 'sports' | 'esports' | 'crypto' | 'tech' | 'science'
  | 'health' | 'entertainment' | 'work' | 'community' | 'other';

interface Domain {
  id: DomainId;
  label: string;
  icon: string;
  placeholders: string[];
}

interface ChallengeTypeOption {
  id: ChallengeType;
  label: string;
  desc: string;
  icon: string;
}

const DOMAINS: Domain[] = [
  { id: 'sports', label: 'Thể thao', icon: '⚽', placeholders: ['Đội nào thắng trận chung kết?', 'Cầu thủ nào ghi bàn đầu tiên?', 'Tỷ số chính xác của trận đấu?'] },
  { id: 'esports', label: 'Esports / Game', icon: '🎮', placeholders: ['Team nào vô địch giải đấu?', 'Ai đạt điểm cao nhất?', 'Map nào được chọn nhiều nhất?'] },
  { id: 'crypto', label: 'Crypto / Markets', icon: '📈', placeholders: ['ETH sẽ ở mức nào vào ngày X?', 'BTC vượt $100K trước tháng 6?', 'Token nào tăng mạnh nhất tuần này?'] },
  { id: 'tech', label: 'Công nghệ / AI', icon: '🤖', placeholders: ['Sản phẩm nào ra mắt đầu tiên?', 'AI nào đạt benchmark cao nhất?', 'Ngôn ngữ lập trình nào phổ biến nhất 2026?'] },
  { id: 'science', label: 'Khoa học / Học tập', icon: '🔬', placeholders: ['Kết quả thí nghiệm là gì?', 'Ai đạt điểm cao nhất kỳ thi?', 'Bao nhiêu người hoàn thành khóa học?'] },
  { id: 'health', label: 'Sức khỏe / Lifestyle', icon: '💪', placeholders: ['Ai chạy được nhiều nhất trong 30 ngày?', 'Bao nhiêu bước đi trung bình?', 'Ai giảm cân nhiều nhất?'] },
  { id: 'entertainment', label: 'Giải trí / Văn hóa', icon: '🎬', placeholders: ['Phim nào đoạt giải Oscar?', 'Bài hát nào đạt #1?', 'Ai bị loại tiếp theo?'] },
  { id: 'work', label: 'Công việc / Năng suất', icon: '💼', placeholders: ['Ai hoàn thành task trước?', 'Sprint nào có velocity cao nhất?', 'Bao nhiêu bug được fix trong tuần?'] },
  { id: 'community', label: 'Cộng đồng / Sự kiện', icon: '🎪', placeholders: ['Bao nhiêu người tham dự?', 'Ai đóng góp nhiều nhất?', 'Sự kiện nào được vote cao nhất?'] },
  { id: 'other', label: 'Khác', icon: '🎲', placeholders: ['Kết quả sẽ là gì?', 'Ai sẽ thắng?', 'Điều gì sẽ xảy ra?'] },
];

// Vietnamese-correct domain labels
const DOMAIN_LABELS: Record<DomainId, string> = {
  sports: 'Thể thao',
  esports: 'Esports / Game',
  crypto: 'Crypto / Markets',
  tech: 'Công nghệ / AI',
  science: 'Khoa học / Học tập',
  health: 'Sức khỏe / Lifestyle',
  entertainment: 'Giải trí / Văn hóa',
  work: 'Công việc / Năng suất',
  community: 'Cộng đồng / Sự kiện',
  other: 'Khác',
};

const CHALLENGE_TYPES: ChallengeTypeOption[] = [
  { id: 'yes_no', label: 'Yes / No', desc: 'Kết quả chỉ có đúng hoặc sai', icon: '✅' },
  { id: 'multi_choice', label: 'Multi-choice', desc: 'Nhiều lựa chọn, 1 đáp án đúng', icon: '📋' },
  { id: 'closest_guess', label: 'Closest Guess', desc: 'Người đoán gần nhất thắng', icon: '🎯' },
  { id: 'highest_wins', label: 'Highest Wins', desc: 'Điểm/giá trị cao nhất thắng', icon: '📊' },
  { id: 'lowest_wins', label: 'Lowest Wins', desc: 'Điểm/giá trị thấp nhất thắng', icon: '📉' },
  { id: 'first_to_finish', label: 'First To Finish', desc: 'Ai hoàn thành trước thắng', icon: '🏁' },
  { id: 'team_score', label: 'Team Score', desc: 'Tổng điểm team quyết định', icon: '⚔️' },
  { id: 'referee_decision', label: 'Referee Decision', desc: 'Trọng tài quyết định kết quả', icon: '🧑‍⚖️' },
  { id: 'community_vote', label: 'Community Vote', desc: 'Cộng đồng bình chọn kết quả', icon: '🗳️' },
  { id: 'proof_challenge', label: 'Proof Challenge', desc: 'Bằng chứng xác minh thắng/thua', icon: '📸' },
];

const TIE_RULES = [
  { id: 'split_equal', label: 'Chia đều pool' },
  { id: 'refund', label: 'Hoàn trả entry points' },
  { id: 'rematch', label: 'Chơi lại (rematch)' },
  { id: 'referee', label: 'Trọng tài quyết định' },
  { id: 'random', label: 'Bốc thăm ngẫu nhiên' },
  { id: 'custom', label: 'Tùy chỉnh...' },
];

const VOID_RULES = [
  { id: 'no_evidence', label: 'Không đủ bằng chứng → hủy' },
  { id: 'external_cancel', label: 'Sự kiện gốc bị hủy → hủy' },
  { id: 'min_participants', label: 'Không đủ người tham gia → hủy' },
  { id: 'timeout', label: 'Quá hạn chốt kết quả → hủy' },
  { id: 'custom', label: 'Tùy chỉnh...' },
];

const RESULT_DEADLINES = [
  { id: '1h', label: '1 giờ sau kết thúc' },
  { id: '6h', label: '6 giờ sau kết thúc' },
  { id: '12h', label: '12 giờ sau kết thúc' },
  { id: '24h', label: '24 giờ sau kết thúc' },
  { id: '48h', label: '48 giờ sau kết thúc' },
  { id: '7d', label: '7 ngày sau kết thúc' },
  { id: 'custom', label: 'Tùy chỉnh...' },
];

// Win condition builder field options
const SUBJECTS = ['Người chơi', 'Đội', 'Cá nhân', 'Tất cả', 'AI/Bot'];
const ACTIONS = ['đoán gần đúng nhất', 'đạt điểm cao nhất', 'đạt điểm thấp nhất', 'hoàn thành trước', 'đúng đáp án', 'gửi bằng chứng hợp lệ', 'được vote nhiều nhất'];
const METRICS = ['giá', 'điểm số', 'tỷ số', 'thời gian', 'số lượng', 'thứ hạng', 'kết quả sự kiện'];
const WIN_TYPES = ['sẽ thắng', 'sẽ được công nhận', 'sẽ nhận toàn bộ pool', 'sẽ chia pool'];
const DEADLINES_BUILDER = ['vào ngày kết thúc', 'lúc 23:59 UTC', 'sau khi sự kiện kết thúc', 'khi có kết quả chính thức'];

interface SmartRuleState {
  title: string;
  domain: DomainId | '';
  challengeType: ChallengeType | '';
  // Structured win condition builder
  subject: string;
  action: string;
  metric: string;
  winType: string;
  deadlineContext: string;
  // Custom win condition (free text fallback)
  customWinCondition: string;
  description: string;
  endDate: string;
  tieRule: string;
  customTieRule: string;
  voidRule: string;
  customVoidRule: string;
  resultDeadline: string;
  customResultDeadline: string;
  rematchEnabled: boolean;
  saveAsMode: boolean;
}

const initialSmartState: SmartRuleState = {
  title: '',
  domain: '',
  challengeType: '',
  subject: '',
  action: '',
  metric: '',
  winType: '',
  deadlineContext: '',
  customWinCondition: '',
  description: '',
  endDate: '2026-03-15',
  tieRule: '',
  customTieRule: '',
  voidRule: '',
  customVoidRule: '',
  resultDeadline: '',
  customResultDeadline: '',
  rematchEnabled: false,
  saveAsMode: false,
};

/* ═══════════════════════════════════════════
   Clarity Score Computation
   ═══════════════════════════════════════════ */

function computeSmartClarityScore(s: SmartRuleState): { score: number; level: ClarityLevel } {
  let score = 0;
  if (s.title.length >= 5) score += 10; else if (s.title.length >= 3) score += 5;
  if (s.domain) score += 10;
  if (s.challengeType) score += 10;
  // Win condition structured
  if (s.subject) score += 8;
  if (s.action) score += 8;
  if (s.metric) score += 6;
  if (s.winType) score += 5;
  if (s.deadlineContext) score += 5;
  // Or custom win
  if (s.customWinCondition.length >= 10) score += 15;
  else if (s.customWinCondition.length >= 5) score += 8;
  if (s.description.length >= 20) score += 8; else if (s.description.length >= 5) score += 4;
  if (s.tieRule) score += 8;
  if (s.voidRule) score += 8;
  if (s.resultDeadline) score += 8;
  if (s.endDate) score += 5;

  score = Math.min(100, score);
  let level: ClarityLevel = 'low';
  if (score >= 85) level = 'public_ready';
  else if (score >= 60) level = 'high';
  else if (score >= 35) level = 'medium';
  return { score, level };
}

const CLARITY_CONFIG: Record<ClarityLevel, { label: string; color: string; bg: string; desc: string }> = {
  low: { label: 'Thấp', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', desc: 'Cần bổ sung thêm thông tin để room dễ hiểu' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', desc: 'Rule đã ổn, nhưng thêm chi tiết sẽ rõ ràng hơn' },
  high: { label: 'Cao', color: '#10B981', bg: 'rgba(16,185,129,0.1)', desc: 'Rule rõ ràng, dễ hiểu cho người tham gia' },
  public_ready: { label: 'Public-ready', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', desc: 'Đủ tiêu chuẩn để publish room công khai' },
};

/* ═══════════════════════════════════════════
   Reusable Components
   ═══════════════════════════════════════════ */

function FieldLabel({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) {
  const c = useThemeColors();
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{children}</span>
      {required && <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 700 }}>*</span>}
      {hint && <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 4 }}>{hint}</span>}
    </div>
  );
}

/* ─── DomainDropdown ─── */
function DomainDropdown({
  value, onChange,
}: {
  value: DomainId | ''; onChange: (v: DomainId) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = DOMAINS.filter(d =>
    DOMAIN_LABELS[d.id].toLowerCase().includes(search.toLowerCase())
  );
  const selected = value ? DOMAINS.find(d => d.id === value) : null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); hapticSelection(); }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:opacity-70"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${value ? 'rgba(139,92,246,0.3)' : c.searchBorder}`,
          minHeight: 48,
        }}
      >
        <div className="flex items-center gap-2.5">
          {selected ? (
            <div className="contents">
              <span style={{ fontSize: 16 }}>{selected.icon}</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{DOMAIN_LABELS[selected.id]}</span>
            </div>
          ) : (
            <span style={{ color: c.text3, fontSize: φ.sm }}>Chọn lĩnh vực...</span>
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
            style={{
              background: c.surface,
              border: `1.5px solid ${c.borderSolid}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b"
              style={{ borderColor: c.divider }}>
              <Search size={14} color={c.text3} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm lĩnh vực..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: c.text1, fontSize: φ.xs }}
                autoFocus
              />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {filtered.map(d => {
                const active = value === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { onChange(d.id); setOpen(false); setSearch(''); hapticSelection(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 active:opacity-70 text-left"
                    style={{
                      background: active ? 'rgba(139,92,246,0.06)' : 'transparent',
                      borderBottom: `1px solid ${c.divider}`,
                      minHeight: 48,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{d.icon}</span>
                    <span style={{
                      color: active ? '#8B5CF6' : c.text1,
                      fontSize: φ.sm,
                      fontWeight: active ? 700 : 500,
                      flex: 1,
                    }}>
                      {DOMAIN_LABELS[d.id]}
                    </span>
                    {active && <Check size={14} color="#8B5CF6" strokeWidth={3} />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Không tìm thấy</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── ChallengeTypeSelector ─── */
function ChallengeTypeSelector({
  value, onChange,
}: {
  value: ChallengeType | ''; onChange: (v: ChallengeType) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div className="grid grid-cols-2 gap-2">
      {CHALLENGE_TYPES.map(ct => {
        const active = value === ct.id;
        return (
          <button
            key={ct.id}
            onClick={() => { onChange(ct.id); hapticSelection(); }}
            className="py-2.5 px-3 rounded-xl text-left active:opacity-70"
            style={{
              background: active ? c.chipActiveBg : c.chipBg,
              border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
              minHeight: 48,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>{ct.icon}</span>
              <span style={{
                color: active ? c.chipActiveText : c.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}>
                {ct.label}
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2, marginLeft: 22, lineHeight: 1.3 }}>
              {ct.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ─── EdgeRuleDropdown ─── */
function EdgeRuleDropdown({
  label, options, value, onChange, customValue, onCustomChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  customValue?: string;
  onCustomChange?: (v: string) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.id === value);

  return (
    <div>
      <button
        onClick={() => { setOpen(!open); hapticSelection(); }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:opacity-70"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${value ? 'rgba(16,185,129,0.2)' : c.searchBorder}`,
          minHeight: 48,
        }}
      >
        <span style={{
          color: selected ? c.text1 : c.text3,
          fontSize: φ.sm,
          fontWeight: selected ? 600 : 400,
        }}>
          {selected ? selected.label : `Chọn ${label.toLowerCase()}...`}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color={c.text3} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 rounded-xl overflow-hidden"
            style={{ background: c.surface, border: `1.5px solid ${c.borderSolid}`, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          >
            {options.map(opt => {
              const active = value === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setOpen(false); hapticSelection(); }}
                  className="w-full flex items-center justify-between px-4 py-3 active:opacity-70 text-left"
                  style={{
                    background: active ? 'rgba(16,185,129,0.06)' : 'transparent',
                    borderBottom: `1px solid ${c.divider}`,
                    minHeight: 44,
                  }}
                >
                  <span style={{
                    color: active ? '#10B981' : c.text1,
                    fontSize: φ.sm,
                    fontWeight: active ? 700 : 500,
                  }}>
                    {opt.label}
                  </span>
                  {active && <Check size={14} color="#10B981" strokeWidth={3} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom text fallback */}
      {value === 'custom' && onCustomChange && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="mt-2"
        >
          <input
            type="text"
            value={customValue || ''}
            onChange={e => onCustomChange(e.target.value)}
            placeholder="Nhập chi tiết..."
            className="w-full px-4 py-3 rounded-xl"
            style={{
              background: c.searchBg,
              border: `1.5px solid ${c.searchBorder}`,
              color: c.text1,
              fontSize: φ.sm,
              outline: 'none',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

/* ─── RulePresetChip ─── */
function RulePresetChip({
  label, onClick, active,
}: {
  label: string; onClick: () => void; active?: boolean;
}) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:opacity-70"
      style={{
        background: active ? 'rgba(139,92,246,0.1)' : c.chipBg,
        border: `1.5px solid ${active ? 'rgba(139,92,246,0.3)' : c.chipBorder}`,
        minHeight: 36,
      }}
    >
      <Sparkles size={11} color={active ? '#8B5CF6' : c.text3} />
      <span style={{
        color: active ? '#8B5CF6' : c.chipText,
        fontSize: 11,
        fontWeight: 600,
      }}>
        {label}
      </span>
    </button>
  );
}

/* ─── DynamicPlaceholderInput ─── */
function DynamicPlaceholderInput({
  value, onChange, domain, suggestions,
}: {
  value: string; onChange: (v: string) => void;
  domain: DomainId | '';
  suggestions: string[];
}) {
  const c = useThemeColors();
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const domainObj = domain ? DOMAINS.find(d => d.id === domain) : null;
  const placeholders = domainObj?.placeholders || ['VD: BTC Weekly Predict — Tuan 10'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholders[placeholderIdx]}
        className="w-full px-4 py-3 rounded-xl"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${c.searchBorder}`,
          color: c.text1,
          fontSize: φ.sm,
          outline: 'none',
        }}
      />
      {/* Suggestion chips */}
      {suggestions.length > 0 && !value && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onChange(s)}
              className="px-2.5 py-1.5 rounded-lg active:opacity-70"
              style={{
                background: c.chipBg,
                border: `1px solid ${c.chipBorder}`,
                minHeight: 28,
              }}
            >
              <span style={{ color: c.chipText, fontSize: 10, fontWeight: 500 }}>"{s}"</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── RuleSentenceBuilder ─── */
function RuleSentenceBuilder({
  state, onChange,
}: {
  state: SmartRuleState;
  onChange: (partial: Partial<SmartRuleState>) => void;
}) {
  const c = useThemeColors();

  // Generate live preview sentence
  const previewSentence = useMemo(() => {
    const parts: string[] = [];
    if (state.subject) parts.push(state.subject);
    if (state.action) parts.push(state.action);
    if (state.metric) parts.push(state.metric);
    if (state.deadlineContext) parts.push(state.deadlineContext);
    if (state.winType) parts.push(state.winType + '.');
    if (parts.length === 0) return '';
    // Capitalize first letter
    const sentence = parts.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }, [state.subject, state.action, state.metric, state.deadlineContext, state.winType]);

  const BuilderDropdown = ({
    label, options, value, field,
  }: {
    label: string; options: string[]; value: string; field: keyof SmartRuleState;
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, marginBottom: 2, display: 'block' }}>{label}</span>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg active:opacity-70"
          style={{
            background: value ? 'rgba(139,92,246,0.06)' : c.searchBg,
            border: `1.5px solid ${value ? 'rgba(139,92,246,0.2)' : c.searchBorder}`,
            minHeight: 40,
          }}
        >
          <span style={{
            color: value ? c.text1 : c.text3,
            fontSize: 12,
            fontWeight: value ? 600 : 400,
          }}>
            {value || 'Chọn...'}
          </span>
          <ChevronDown size={12} color={c.text3} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 rounded-lg overflow-hidden z-20 relative"
              style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onChange({ [field]: opt }); setOpen(false); }}
                  className="w-full text-left px-3 py-2.5 active:opacity-70"
                  style={{
                    borderBottom: `1px solid ${c.divider}`,
                    background: value === opt ? 'rgba(139,92,246,0.06)' : 'transparent',
                    minHeight: 36,
                  }}
                >
                  <span style={{
                    color: value === opt ? '#8B5CF6' : c.text1,
                    fontSize: 12,
                    fontWeight: value === opt ? 700 : 500,
                  }}>
                    {opt}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div>
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Builder điều kiện thắng</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <BuilderDropdown label="A. Chủ thể" options={SUBJECTS} value={state.subject} field="subject" />
          <BuilderDropdown label="B. Hành động" options={ACTIONS} value={state.action} field="action" />
          <BuilderDropdown label="C. Chỉ số / đối tượng" options={METRICS} value={state.metric} field="metric" />
          <BuilderDropdown label="D. Kiểu thắng" options={WIN_TYPES} value={state.winType} field="winType" />
        </div>
        <BuilderDropdown label="E. Thời điểm / hạn kết quả" options={DEADLINES_BUILDER} value={state.deadlineContext} field="deadlineContext" />

        {/* Live Preview */}
        <AnimatePresence>
          {previewSentence && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 px-3.5 py-3 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <div className="flex items-start gap-2">
                <Eye size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 2 }}>PREVIEW TỰ SINH</p>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                    "{previewSentence}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TrCard>

      {/* Fallback free text */}
      <div className="mt-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span style={{ color: c.text3, fontSize: φ.xs }}>Hoặc tự nhập điều kiện thắng:</span>
        </div>
        <textarea
          value={state.customWinCondition}
          onChange={e => onChange({ customWinCondition: e.target.value })}
          placeholder="VD: Người đoán gần nhất với giá ETH vào 25/03/2026 lúc 10:00 sẽ thắng."
          rows={2}
          className="w-full px-4 py-3 rounded-xl resize-none"
          style={{
            background: c.searchBg,
            border: `1.5px solid ${c.searchBorder}`,
            color: c.text1,
            fontSize: φ.sm,
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

/* ─── GeneratedRuleSummaryCard ─── */
function GeneratedRuleSummaryCard({ state }: { state: SmartRuleState }) {
  const c = useThemeColors();

  // Build the win condition sentence from structured builder
  const winSentence = useMemo(() => {
    const parts: string[] = [];
    if (state.subject) parts.push(state.subject);
    if (state.action) parts.push(state.action);
    if (state.metric) parts.push(state.metric);
    if (state.deadlineContext) parts.push(state.deadlineContext);
    if (state.winType) parts.push(state.winType);
    if (parts.length > 0) {
      const s = parts.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }
    return state.customWinCondition || '—';
  }, [state]);

  const tieLabel = state.tieRule === 'custom' ? state.customTieRule : TIE_RULES.find(t => t.id === state.tieRule)?.label || '—';
  const voidLabel = state.voidRule === 'custom' ? state.customVoidRule : VOID_RULES.find(v => v.id === state.voidRule)?.label || '—';
  const deadlineLabel = state.resultDeadline === 'custom' ? state.customResultDeadline : RESULT_DEADLINES.find(r => r.id === state.resultDeadline)?.label || '—';

  const rows = [
    { label: 'Lĩnh vực', value: state.domain ? `${DOMAINS.find(d => d.id === state.domain)?.icon} ${DOMAIN_LABELS[state.domain as DomainId]}` : '—' },
    { label: 'Loại challenge', value: state.challengeType ? CHALLENGE_TYPES.find(ct => ct.id === state.challengeType)?.label || '—' : '—' },
    { label: 'Điều kiện thắng', value: winSentence },
    { label: 'Kết thúc', value: state.endDate || '—' },
    { label: 'Luật hòa', value: tieLabel },
    { label: 'Luật hủy bỏ', value: voidLabel },
    { label: 'Hạn chốt kết quả', value: deadlineLabel },
  ];

  return (
    <TrCard className="p-4" accentBorder="rgba(139,92,246,0.2)">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} color="#8B5CF6" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tóm tắt luật chơi</span>
        <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 8, fontWeight: 700 }}>
          TỰ SINH
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start justify-between gap-3"
            style={{ paddingBottom: i < rows.length - 1 ? 8 : 0, borderBottom: i < rows.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
            <span style={{ color: c.text3, fontSize: φ.xs, minWidth: 80 }}>{r.label}</span>
            <span className="text-right" style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, wordBreak: 'break-word', maxWidth: '60%', lineHeight: 1.4 }}>
              {r.value}
            </span>
          </div>
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
            <span style={{ fontSize: 16 }}>🌐</span>
            <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Public Room</span>
          </div>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6, marginBottom: 8 }}>
            Ai cũng thấy và tham gia được. Cần rule rõ ràng nhất.
          </p>
          <div className="flex flex-col gap-1.5">
            {['Lĩnh vực rõ ràng', 'Loại challenge', 'Điều kiện thắng hoàn chỉnh', 'Luật hòa & hủy bỏ', 'Hạn chốt kết quả', 'Nguồn xác minh'].map(r => (
              <div key={r} className="flex items-center gap-2">
                <Check size={11} color="#10B981" />
                <span style={{ color: c.text2, fontSize: 11 }}>{r}</span>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 16 }}>🔒</span>
            <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>Private / Unlisted</span>
          </div>
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6, marginBottom: 8 }}>
            Chỉ người được mời hoặc có link. Linh hoạt hơn, nhưng nên rõ ràng.
          </p>
          <div className="flex flex-col gap-1.5">
            {['Có thể dùng custom rule thoải mái', 'Vẫn nên có điều kiện thắng', 'Không bắt buộc domain/type', 'Hiện cảnh báo nhẹ nếu rule mơ hồ'].map(r => (
              <div key={r} className="flex items-center gap-2">
                <Info size={11} color="#F59E0B" />
                <span style={{ color: c.text2, fontSize: 11 }}>{r}</span>
              </div>
            ))}
          </div>
        </TrCard>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)' }}>
          <HelpCircle size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Custom mode public cần rule rõ hơn vì nhiều người không quen biết nhau cùng chơi — càng rõ ràng, càng ít tranh chấp.
          </p>
        </div>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════
   STEPS for stepper (reuse existing)
   ═══════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: 'Template' },
  { id: 2, label: 'Cấu trúc' },
  { id: 3, label: 'Luật chơi' },
  { id: 4, label: 'Kết quả' },
  { id: 5, label: 'Points' },
  { id: 6, label: 'Review' },
] as const;

function ProgressStepper({ current }: { current: number }) {
  const c = useThemeColors();
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: step.id < current ? '#10B981' : step.id === current ? '#8B5CF6' : c.surface2,
                  border: step.id === current ? '2px solid rgba(139,92,246,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {step.id < current ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : (
                  <span style={{ color: step.id === current ? '#fff' : c.text3, fontSize: 10, fontWeight: 700 }}>
                    {step.id}
                  </span>
                )}
              </div>
              <span style={{
                color: step.id === current ? '#8B5CF6' : step.id < current ? '#10B981' : c.text3,
                fontSize: 8, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-0.5" style={{
                height: 2,
                background: step.id < current ? '#10B981' : c.surface2,
                borderRadius: 1, marginBottom: 14, transition: 'background 0.2s',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page Export
   ═══════════════════════════════════════════ */

export function ArenaSmartRuleBuilderPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const [state, setState] = useState<SmartRuleState>(initialSmartState);
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const updateState = (partial: Partial<SmartRuleState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  const { score: clarityScore, level: clarityLevel } = useMemo(() => computeSmartClarityScore(state), [state]);
  const cc = CLARITY_CONFIG[clarityLevel];

  // Dynamic presets based on domain + type
  const presets = useMemo(() => {
    const base: string[] = [];
    if (state.domain === 'sports') base.push('Đội nào thắng?', 'Tỷ số chính xác?', 'Ai ghi bàn đầu tiên?');
    else if (state.domain === 'crypto') base.push('Giá gần đúng nhất?', 'Vượt mốc giá?', 'Token nào tăng mạnh nhất?');
    else if (state.domain === 'esports') base.push('Team nào vô địch?', 'Ai đạt điểm cao nhất?', 'Map nào được chọn?');
    else if (state.domain === 'tech') base.push('Sản phẩm nào ra mắt?', 'AI nào đạt benchmark?', 'Ngôn ngữ nào phổ biến?');
    else base.push('Ai sẽ thắng?', 'Kết quả là gì?', 'Ai hoàn thành trước?');
    if (state.challengeType === 'closest_guess') base.push('Giá gần đúng nhất?');
    if (state.challengeType === 'first_to_finish') base.push('Ai hoàn thành trước?');
    if (state.challengeType === 'team_score') base.push('Đội nào điểm cao nhất?');
    return [...new Set(base)].slice(0, 4);
  }, [state.domain, state.challengeType]);

  // Title suggestions
  const titleSuggestions = useMemo(() => {
    return [
      'ETH sẽ ở mức nào vào ngày X?',
      'Đội nào thắng trận này?',
      'Ai hoàn thành thử thách trước?',
    ];
  }, []);

  // Determine if CTA should be disabled
  const canProceed = state.title.length >= 3
    && !!state.domain
    && !!state.challengeType
    && (
      (state.subject && state.action) || state.customWinCondition.length >= 5
    );

  const handleSaveDraft = () => {
    hapticSelection();
    actionToast.success({ title: 'Đã lưu nháp', description: 'Bạn có thể tiếp tục bất kỳ lúc nào' });
  };

  return (
    <PageLayout>
      <Header title="Arena Studio" subtitle="Smart Rule Builder" back />

      {/* Stepper (locked at step 3) */}
      <ProgressStepper current={3} />

      {/* Content */}
      <PageContent gap="default">
        <SectionHeader title="Luật chơi — Smart Builder" accent accentColor="#F59E0B" mb={0}
          subtitle="Chọn rule có cấu trúc để room dễ hiểu và dễ được tin tưởng hơn" />

        {/* ─── 1. Rule Clarity Score ─── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={14} color={cc.color} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Rule Clarity Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{
                color: cc.color, fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
              }}>
                {clarityScore}
              </span>
              <span className="px-2 py-0.5 rounded-lg" style={{ background: cc.bg, color: cc.color, fontSize: 10, fontWeight: 700 }}>
                {cc.label}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${clarityScore}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: cc.color }}
            />
          </div>
          <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 6, lineHeight: 1.4 }}>
            {cc.desc}
          </p>
          {/* Subtext guidance */}
          <p style={{ color: c.text3, fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>
            Chọn rule có cấu trúc để room dễ hiểu và dễ được tin tưởng hơn
          </p>
        </TrCard>

        {/* ─── Public/Private guidance link ─── */}
        <button
          onClick={() => { setGuidanceOpen(true); hapticSelection(); }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl active:opacity-70"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', minHeight: 44 }}
        >
          <HelpCircle size={14} color="#3B82F6" />
          <span style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 600, flex: 1, textAlign: 'left' }}>
            Public vs Private — Room cần rule gì?
          </span>
          <ChevronRight size={14} color="#3B82F6" />
        </button>

        {/* ─── 2. Tên challenge ─── */}
        <div>
          <FieldLabel required>Tên challenge</FieldLabel>
          <DynamicPlaceholderInput
            value={state.title}
            onChange={v => updateState({ title: v })}
            domain={state.domain}
            suggestions={titleSuggestions}
          />
        </div>

        {/* ─── 3. Domain selector ─── */}
        <div>
          <FieldLabel required>Lĩnh vực</FieldLabel>
          <DomainDropdown
            value={state.domain}
            onChange={v => updateState({ domain: v })}
          />
          {state.domain === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2"
            >
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Custom rules cần mô tả rõ hơn để người tham gia hiểu đúng.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── 4. Challenge type ─── */}
        <div>
          <FieldLabel required>Loại challenge</FieldLabel>
          <ChallengeTypeSelector
            value={state.challengeType}
            onChange={v => updateState({ challengeType: v })}
          />
        </div>

        {/* ─── 5. Rule Sentence Builder ─── */}
        <div>
          <FieldLabel required hint="Chọn hoặc tự nhập">Điều kiện thắng</FieldLabel>
          <RuleSentenceBuilder state={state} onChange={updateState} />
        </div>

        {/* ─── 6. Mô tả ngắn ─── */}
        <div>
          <FieldLabel hint="Tùy chọn">Mô tả ngắn</FieldLabel>
          <textarea
            value={state.description}
            onChange={e => updateState({ description: e.target.value })}
            placeholder="Mô tả bối cảnh nếu cần. Không cần lặp lại luật chơi."
            rows={2}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{
              background: c.searchBg,
              border: `1.5px solid ${c.searchBorder}`,
              color: c.text1,
              fontSize: φ.sm,
              outline: 'none',
            }}
          />
        </div>

        {/* ─── 7. Rule Presets ─── */}
        {presets.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} color="#F59E0B" />
              <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600 }}>Gợi ý nhanh</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <RulePresetChip
                  key={p}
                  label={p}
                  onClick={() => {
                    updateState({ title: state.title || p });
                    hapticSelection();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── 8. Timing & Edge Rules ─── */}
        <TrCard className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} color="#10B981" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Timing & Edge Rules</span>
          </div>

          {/* End date */}
          <div>
            <FieldLabel required>Thời hạn kết thúc</FieldLabel>
            <input
              type="date"
              value={state.endDate}
              onChange={e => updateState({ endDate: e.target.value })}
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

          {/* Tie rule */}
          <div>
            <FieldLabel hint="Nên có">Luật hòa (Tie rule)</FieldLabel>
            <EdgeRuleDropdown
              label="Luật hòa"
              options={TIE_RULES}
              value={state.tieRule}
              onChange={v => updateState({ tieRule: v })}
              customValue={state.customTieRule}
              onCustomChange={v => updateState({ customTieRule: v })}
            />
          </div>

          {/* Void rule */}
          <div>
            <FieldLabel hint="Nên có">Luật hủy bỏ (Void rule)</FieldLabel>
            <EdgeRuleDropdown
              label="Luật hủy bỏ"
              options={VOID_RULES}
              value={state.voidRule}
              onChange={v => updateState({ voidRule: v })}
              customValue={state.customVoidRule}
              onCustomChange={v => updateState({ customVoidRule: v })}
            />
          </div>

          {/* Result deadline */}
          <div>
            <FieldLabel hint="Nên có">Hạn chốt kết quả (Result deadline)</FieldLabel>
            <EdgeRuleDropdown
              label="Hạn chốt"
              options={RESULT_DEADLINES}
              value={state.resultDeadline}
              onChange={v => updateState({ resultDeadline: v })}
              customValue={state.customResultDeadline}
              onCustomChange={v => updateState({ customResultDeadline: v })}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-1" style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
            <button
              onClick={() => updateState({ rematchEnabled: !state.rematchEnabled })}
              className="flex items-center justify-between w-full py-2 active:opacity-70"
            >
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Cho phép rematch</p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Người chơi có thể yêu cầu chơi lại</p>
              </div>
              <div className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: state.rematchEnabled ? '#8B5CF6' : c.surface2 }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: state.rematchEnabled ? 21 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </button>
            <button
              onClick={() => updateState({ saveAsMode: !state.saveAsMode })}
              className="flex items-center justify-between w-full py-2 active:opacity-70"
            >
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Lưu thành reusable mode</p>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Người khác có thể clone luật chơi này</p>
              </div>
              <div className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: state.saveAsMode ? '#8B5CF6' : c.surface2 }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: state.saveAsMode ? 21 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </button>
          </div>
        </TrCard>

        {/* ─── 9. Generated Rule Summary ─── */}
        <GeneratedRuleSummaryCard state={state} />

        {/* ─── Moderation note ─── */}
        <TrCard className="p-3 flex items-start gap-2">
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Challenge sẽ được kiểm duyệt tự động. Nội dung vi phạm sẽ bị ẩn. Arena Points không phải tài sản tài chính.
          </p>
        </TrCard>
      </PageContent>

      {/* ─── Footer Actions ─── */}
      <div className="px-5 pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${c.divider}` }}>
        <div className="flex gap-3">
          <button
            onClick={() => { goBack(); hapticSelection(); }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 active:opacity-70"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, touchAction: 'manipulation' }}
          >
            <ChevronLeft size={18} color={c.text2} />
          </button>
          <div className="flex-1">
            <CTAButton onClick={() => {
              hapticSelection();
              actionToast.success({ title: 'Tiếp tục', description: 'Rule đã hoàn chỉnh — bước tiếp theo' });
            }} disabled={!canProceed}>
              <div className="flex items-center gap-2 justify-center">
                Tiếp tục <ChevronRight size={14} />
              </div>
            </CTAButton>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 py-3 px-2 -ml-2 active:opacity-70"
            style={{ background: 'none', border: 'none', minHeight: 44 }}
          >
            <Save size={14} color={c.text3} />
            <span style={{ color: c.text3, fontSize: φ.xs }}>Lưu nháp</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md"
              style={{ background: cc.bg, color: cc.color, fontSize: 9, fontWeight: 700 }}>
              Clarity: {clarityScore}
            </span>
            <span style={{ color: c.text3, fontSize: φ.xs }}>Bước 3 / 6</span>
          </div>
        </div>
      </div>

      {/* Guidance Sheet */}
      <AnimatePresence>
        {guidanceOpen && (
          <PublicPrivateGuidanceSheet open={guidanceOpen} onClose={() => setGuidanceOpen(false)} />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}