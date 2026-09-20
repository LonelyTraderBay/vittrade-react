import React, { useState, useMemo } from 'react';
import {
  Check, ChevronDown, ChevronRight, Search, Sparkles, Eye,
  Info, Shield, Target, BookOpen, Layers, Zap, List, Play,
  X, Star, Filter, Hash, type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { φ, φRadius } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type DomainId =
  | 'sports' | 'esports' | 'crypto' | 'tech' | 'science'
  | 'health' | 'entertainment' | 'work' | 'community' | 'other';

type ChallengeType =
  | 'yes_no' | 'multi_choice' | 'closest_guess' | 'highest_wins'
  | 'lowest_wins' | 'first_to_finish' | 'team_score' | 'referee_decision'
  | 'community_vote' | 'proof_challenge';

type DropdownState = 'default' | 'focused' | 'typing' | 'selected' | 'no_results' | 'disabled';

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — DOMAIN PACKS DATA
   ═══════════════════════════════════════════════════════════════ */

interface DomainPack {
  id: DomainId;
  icon: string;
  title: string;
  description: string;
  supportedTypes: ChallengeType[];
  examples: string[];
}

const DOMAIN_PACKS: DomainPack[] = [
  {
    id: 'sports', icon: '⚽', title: 'Thể thao',
    description: 'Bóng đá, bóng rổ, tennis, F1, MMA, Olympic — tất cả giải đấu thể thao.',
    supportedTypes: ['yes_no', 'closest_guess', 'highest_wins', 'team_score', 'multi_choice', 'referee_decision'],
    examples: ['Đội nào thắng trận chung kết?', 'Tỷ số gần đúng nhất?', 'Ai ghi bàn trước?'],
  },
  {
    id: 'esports', icon: '🎮', title: 'Esports / Game',
    description: 'League of Legends, Valorant, CS2, PUBG Mobile, Genshin Impact, speedrun.',
    supportedTypes: ['yes_no', 'highest_wins', 'first_to_finish', 'team_score', 'closest_guess', 'proof_challenge'],
    examples: ['Team nào vô địch giải đấu?', 'Ai đạt điểm cao nhất?', 'Map nào được chọn nhiều nhất?'],
  },
  {
    id: 'crypto', icon: '📈', title: 'Crypto / Markets',
    description: 'Bitcoin, Ethereum, altcoins, DeFi, macro, cổ phiếu, chỉ số tài chính.',
    supportedTypes: ['yes_no', 'closest_guess', 'highest_wins', 'lowest_wins', 'multi_choice'],
    examples: ['BTC vượt mốc $100K không?', 'ETH ở mức nào tại thời điểm Y?', 'Coin nào tăng mạnh hơn?'],
  },
  {
    id: 'tech', icon: '🤖', title: 'Công nghệ / AI',
    description: 'Ra mắt sản phẩm, AI benchmark, ngôn ngữ lập trình, startup, gadget.',
    supportedTypes: ['yes_no', 'multi_choice', 'closest_guess', 'highest_wins', 'community_vote'],
    examples: ['Sản phẩm nào ra mắt đầu tiên?', 'AI nào đạt benchmark cao nhất?', 'Framework nào phổ biến nhất 2026?'],
  },
  {
    id: 'science', icon: '🔬', title: 'Khoa học / Học tập',
    description: 'Thí nghiệm, kỳ thi, khóa học online, quiz, nghiên cứu, bài tập nhóm.',
    supportedTypes: ['closest_guess', 'highest_wins', 'multi_choice', 'first_to_finish', 'team_score'],
    examples: ['Kết quả gần đúng nhất?', 'Ai trả lời đúng nhiều nhất?', 'Nhóm nào đạt điểm cao hơn?'],
  },
  {
    id: 'health', icon: '💪', title: 'Sức khỏe / Lifestyle',
    description: 'Fitness challenge, chạy bộ, giảm cân, thiền, thói quen, streak.',
    supportedTypes: ['highest_wins', 'lowest_wins', 'first_to_finish', 'closest_guess', 'proof_challenge'],
    examples: ['Ai hoàn thành mục tiêu trước?', 'Ai giữ streak dài hơn?', 'Ai có số bước cao hơn?'],
  },
  {
    id: 'entertainment', icon: '🎬', title: 'Giải trí / Văn hóa',
    description: 'Oscar, Grammy, phim, nhạc, game show, reality TV, sách, truyện.',
    supportedTypes: ['yes_no', 'multi_choice', 'community_vote', 'closest_guess'],
    examples: ['Phim nào đoạt giải Oscar?', 'Bài hát nào đạt #1?', 'Ai bị loại tiếp theo?'],
  },
  {
    id: 'work', icon: '💼', title: 'Công việc / Năng suất',
    description: 'Sprint KPI, task completion, bug fix, sales target, OKR, team challenge.',
    supportedTypes: ['first_to_finish', 'highest_wins', 'team_score', 'closest_guess', 'proof_challenge'],
    examples: ['Ai hoàn thành task trước?', 'Team nào đạt KPI cao hơn?', 'Ai close nhiều việc hơn?'],
  },
  {
    id: 'community', icon: '🎪', title: 'Cộng đồng / Sự kiện',
    description: 'Meetup, hackathon, volunteer, fundraising, event, neighborhood.',
    supportedTypes: ['yes_no', 'closest_guess', 'community_vote', 'first_to_finish', 'team_score'],
    examples: ['Ai đến trước?', 'Team nào hoàn thành checkpoint đủ?', 'Kết quả vote nào thắng?'],
  },
  {
    id: 'other', icon: '🎲', title: 'Khác / Custom',
    description: 'Mọi lĩnh vực khác: thời tiết, nấu ăn, thú cưng, du lịch, tùy ý sáng tạo.',
    supportedTypes: ['yes_no', 'multi_choice', 'closest_guess', 'highest_wins', 'lowest_wins', 'first_to_finish', 'team_score', 'referee_decision', 'community_vote', 'proof_challenge'],
    examples: ['Kết quả sẽ là gì?', 'Ai sẽ thắng?', 'Điều gì sẽ xảy ra?'],
  },
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — SUGGESTION LIBRARY
   ═══════════════════════════════════════════════════════════════ */

interface SuggestionItem {
  text: string;
  type: ChallengeType;
}

const SUGGESTION_LIBRARY: Record<DomainId, SuggestionItem[]> = {
  sports: [
    { text: 'Đội nào thắng trận này?', type: 'yes_no' },
    { text: 'Tỷ số gần đúng nhất?', type: 'closest_guess' },
    { text: 'Ai ghi bàn đầu tiên?', type: 'multi_choice' },
    { text: 'Đội nào thắng cả series?', type: 'yes_no' },
    { text: 'Ai có tổng điểm cao hơn?', type: 'highest_wins' },
    { text: 'Bao nhiêu thẻ vàng trong trận?', type: 'closest_guess' },
    { text: 'Ai thắng set cuối?', type: 'yes_no' },
    { text: 'Tổng bàn thắng trên/dưới 2.5?', type: 'yes_no' },
  ],
  esports: [
    { text: 'Team nào vô địch giải đấu?', type: 'yes_no' },
    { text: 'Ai đạt MVP trận này?', type: 'multi_choice' },
    { text: 'Tổng kill trận đấu là bao nhiêu?', type: 'closest_guess' },
    { text: 'Map nào được chọn đầu tiên?', type: 'multi_choice' },
    { text: 'Ai có KDA cao nhất?', type: 'highest_wins' },
    { text: 'Trận đấu kéo dài bao lâu?', type: 'closest_guess' },
    { text: 'Ai hoàn thành speedrun trước?', type: 'first_to_finish' },
    { text: 'Team nào first blood?', type: 'yes_no' },
  ],
  crypto: [
    { text: 'BTC vượt mốc $100K trước tháng 6?', type: 'yes_no' },
    { text: 'ETH ở mức nào vào ngày 25/03?', type: 'closest_guess' },
    { text: 'Coin nào tăng mạnh nhất tuần?', type: 'highest_wins' },
    { text: 'Giá BTC gần đúng nhất cuối tuần?', type: 'closest_guess' },
    { text: 'Chỉ số DXY tăng hay giảm?', type: 'yes_no' },
    { text: 'SOL hay AVAX tăng nhiều hơn?', type: 'multi_choice' },
    { text: 'TVL DeFi vượt $200B?', type: 'yes_no' },
    { text: 'Token nào listing sàn lớn trước?', type: 'multi_choice' },
  ],
  tech: [
    { text: 'Sản phẩm nào ra mắt trước?', type: 'first_to_finish' },
    { text: 'AI nào đạt benchmark cao nhất?', type: 'highest_wins' },
    { text: 'Framework nào được star nhiều nhất?', type: 'highest_wins' },
    { text: 'Apple ra iPhone mới tháng nào?', type: 'closest_guess' },
    { text: 'GPT-5 release trước 2026 Q3?', type: 'yes_no' },
    { text: 'Ngôn ngữ nào top 1 TIOBE cuối năm?', type: 'multi_choice' },
  ],
  science: [
    { text: 'Kết quả thí nghiệm gần đúng nhất?', type: 'closest_guess' },
    { text: 'Ai trả lời đúng nhiều nhất?', type: 'highest_wins' },
    { text: 'Nhóm nào đạt điểm cao hơn?', type: 'team_score' },
    { text: 'Kết luận nào đúng?', type: 'multi_choice' },
    { text: 'Ai hoàn thành bài nhanh nhất?', type: 'first_to_finish' },
    { text: 'Bao nhiêu người pass kỳ thi?', type: 'closest_guess' },
  ],
  health: [
    { text: 'Ai hoàn thành mục tiêu trước?', type: 'first_to_finish' },
    { text: 'Ai giữ streak dài hơn?', type: 'highest_wins' },
    { text: 'Ai có số bước cao hơn tuần này?', type: 'highest_wins' },
    { text: 'Ai cải thiện thành tích tốt hơn?', type: 'highest_wins' },
    { text: 'Ai đạt target cân nặng trước?', type: 'first_to_finish' },
    { text: 'Tổng km chạy nhóm là bao nhiêu?', type: 'closest_guess' },
    { text: 'Ai thiền nhiều phút nhất tháng?', type: 'highest_wins' },
  ],
  entertainment: [
    { text: 'Phim nào đoạt giải Best Picture?', type: 'multi_choice' },
    { text: 'Bài hát nào đạt #1 Billboard?', type: 'multi_choice' },
    { text: 'Ai bị loại tiếp theo reality show?', type: 'multi_choice' },
    { text: 'Phim nào doanh thu cao nhất tuần?', type: 'multi_choice' },
    { text: 'MV nào đạt 100M views trước?', type: 'first_to_finish' },
    { text: 'Rating phim trên IMDb là bao nhiêu?', type: 'closest_guess' },
  ],
  work: [
    { text: 'Ai hoàn thành task trước deadline?', type: 'first_to_finish' },
    { text: 'Team nào đạt KPI cao hơn?', type: 'team_score' },
    { text: 'Ai close nhiều ticket nhất sprint?', type: 'highest_wins' },
    { text: 'Bao nhiêu bug được fix tuần này?', type: 'closest_guess' },
    { text: 'Sprint velocity là bao nhiêu?', type: 'closest_guess' },
    { text: 'Team nào deploy trước?', type: 'first_to_finish' },
  ],
  community: [
    { text: 'Bao nhiêu người tham dự event?', type: 'closest_guess' },
    { text: 'Ai đóng góp nhiều nhất?', type: 'highest_wins' },
    { text: 'Kết quả vote nào thắng?', type: 'community_vote' },
    { text: 'Team nào hoàn thành checkpoint?', type: 'first_to_finish' },
    { text: 'Ai đến sớm nhất?', type: 'first_to_finish' },
    { text: 'Fundraising đạt bao nhiêu?', type: 'closest_guess' },
  ],
  other: [
    { text: 'Kết quả sẽ là gì?', type: 'multi_choice' },
    { text: 'Ai sẽ thắng?', type: 'yes_no' },
    { text: 'Điều gì sẽ xảy ra trước?', type: 'first_to_finish' },
    { text: 'Con số gần đúng nhất?', type: 'closest_guess' },
    { text: 'Kết quả bình chọn?', type: 'community_vote' },
    { text: 'Ai hoàn thành thử thách?', type: 'proof_challenge' },
  ],
};

const CHALLENGE_TYPE_MAP: Record<ChallengeType, { label: string; icon: string; color: string }> = {
  yes_no: { label: 'Yes / No', icon: '✅', color: '#10B981' },
  multi_choice: { label: 'Multi-choice', icon: '📋', color: '#3B82F6' },
  closest_guess: { label: 'Closest Guess', icon: '🎯', color: '#F59E0B' },
  highest_wins: { label: 'Highest Wins', icon: '📊', color: '#8B5CF6' },
  lowest_wins: { label: 'Lowest Wins', icon: '📉', color: '#06B6D4' },
  first_to_finish: { label: 'First To Finish', icon: '🏁', color: '#EF4444' },
  team_score: { label: 'Team Score', icon: '⚔️', color: '#F97316' },
  referee_decision: { label: 'Referee Decision', icon: '🧑‍⚖️', color: '#94A3B8' },
  community_vote: { label: 'Community Vote', icon: '🗳️', color: '#EC4899' },
  proof_challenge: { label: 'Proof Challenge', icon: '📸', color: '#14B8A6' },
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — EXAMPLE MAPPINGS DATA
   ═══════════════════════════════════════════════════════════════ */

interface DemoFlow {
  domain: DomainId;
  domainLabel: string;
  domainIcon: string;
  type: ChallengeType;
  typeLabel: string;
  typeIcon: string;
  suggestions: string[];
  generatedRule: string;
  color: string;
}

const DEMO_FLOWS: DemoFlow[] = [
  {
    domain: 'sports', domainLabel: 'Thể thao', domainIcon: '⚽',
    type: 'closest_guess', typeLabel: 'Closest Guess', typeIcon: '🎯',
    suggestions: ['Tỷ số gần đúng nhất?', 'Bao nhiêu thẻ vàng?', 'Tổng bàn thắng?'],
    generatedRule: 'Người đoán gần đúng nhất tỷ số trận chung kết vào ngày kết thúc sẽ thắng.',
    color: '#10B981',
  },
  {
    domain: 'crypto', domainLabel: 'Crypto / Markets', domainIcon: '📈',
    type: 'yes_no', typeLabel: 'Yes / No', typeIcon: '✅',
    suggestions: ['BTC vượt $100K?', 'ETH flippening?', 'Fed giảm lãi suất?'],
    generatedRule: 'Nếu BTC vượt mốc $100,000 trước 23:59 UTC ngày kết thúc → Yes thắng.',
    color: '#F59E0B',
  },
  {
    domain: 'science', domainLabel: 'Khoa học / Học tập', domainIcon: '🔬',
    type: 'highest_wins', typeLabel: 'Highest Wins', typeIcon: '📊',
    suggestions: ['Ai trả lời đúng nhiều nhất?', 'Nhóm nào điểm cao hơn?', 'Ai đạt A+?'],
    generatedRule: 'Người chơi đạt điểm số cao nhất trong bài kiểm tra vào ngày kết thúc sẽ thắng.',
    color: '#8B5CF6',
  },
  {
    domain: 'health', domainLabel: 'Sức khỏe / Lifestyle', domainIcon: '💪',
    type: 'first_to_finish', typeLabel: 'First To Finish', typeIcon: '🏁',
    suggestions: ['Ai hoàn thành mục tiêu trước?', 'Ai đạt target cân nặng?', 'Ai chạy 100km trước?'],
    generatedRule: 'Cá nhân hoàn thành trước mục tiêu 100km chạy bộ trước deadline sẽ thắng.',
    color: '#EF4444',
  },
  {
    domain: 'community', domainLabel: 'Cộng đồng / Sự kiện', domainIcon: '🎪',
    type: 'community_vote', typeLabel: 'Community Vote', typeIcon: '🗳️',
    suggestions: ['Kết quả vote nào thắng?', 'Ai được bầu chọn?', 'Ý tưởng nào được chọn?'],
    generatedRule: 'Tất cả được vote nhiều nhất kết quả sự kiện sau khi sự kiện kết thúc sẽ được công nh���n.',
    color: '#EC4899',
  },
  {
    domain: 'work', domainLabel: 'Công việc / Năng suất', domainIcon: '💼',
    type: 'team_score', typeLabel: 'Team Score', typeIcon: '⚔️',
    suggestions: ['Team nào đạt KPI cao hơn?', 'Sprint velocity cao nhất?', 'Ai close nhiều nhất?'],
    generatedRule: 'Đội đạt điểm cao nhất tổng số task completed trong sprint vào ngày kết thúc sẽ nhận toàn bộ pool.',
    color: '#F97316',
  },
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — AUTO TITLE SUGGESTIONS DATA
   ═══════════════════════════════════════════════════════════════ */

interface TitleSuggestion {
  text: string;
  domain: DomainId;
  type: ChallengeType;
}

const TITLE_SUGGESTIONS: TitleSuggestion[] = [
  { text: 'ETH sẽ ở mức nào vào ngày 25/03?', domain: 'crypto', type: 'closest_guess' },
  { text: 'Đội nào thắng trận chung kết Champions League?', domain: 'sports', type: 'yes_no' },
  { text: 'Ai hoàn thành thử thách trước 18:00?', domain: 'health', type: 'first_to_finish' },
  { text: 'Team nào đạt KPI cao hơn tuần này?', domain: 'work', type: 'team_score' },
  { text: 'BTC vượt $120K trước hết tháng 4?', domain: 'crypto', type: 'yes_no' },
  { text: 'GPT-5 release trước Q3/2026?', domain: 'tech', type: 'yes_no' },
  { text: 'Ai có số bước cao nhất tuần này?', domain: 'health', type: 'highest_wins' },
  { text: 'Phim nào đoạt Best Picture 2027?', domain: 'entertainment', type: 'multi_choice' },
  { text: 'Nhóm nào đạt điểm cao hơn bài quiz?', domain: 'science', type: 'team_score' },
  { text: 'Fundraising meetup đạt bao nhiêu?', domain: 'community', type: 'closest_guess' },
];

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── SearchableDropdown (generic) ─── */
function SearchableDropdown({
  label, options, value, onChange, icon: IconComp, color,
  renderOption, placeholder, demoState,
}: {
  label: string;
  options: { id: string; label: string; icon?: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon;
  color?: string;
  renderOption?: (opt: { id: string; label: string; icon?: string; desc?: string }, active: boolean) => React.ReactNode;
  placeholder?: string;
  demoState?: DropdownState;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isDisabled = demoState === 'disabled';
  const effectiveState: DropdownState = demoState || (open ? (search ? 'typing' : 'focused') : (value ? 'selected' : 'default'));

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => o.id === value);
  const hasNoResults = filtered.length === 0 && search.length > 0;

  const borderColor = effectiveState === 'selected' ? (color || 'rgba(139,92,246,0.3)')
    : effectiveState === 'focused' || effectiveState === 'typing' ? 'rgba(59,130,246,0.4)'
    : c.searchBorder;

  return (
    <div className="relative">
      {/* State badge */}
      {demoState && (
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full" style={{
            background: effectiveState === 'selected' ? '#10B981'
              : effectiveState === 'disabled' ? '#94A3B8'
              : effectiveState === 'no_results' ? '#EF4444'
              : '#3B82F6',
          }} />
          <span style={{ color: c.text3, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {effectiveState}
          </span>
        </div>
      )}

      <button
        onClick={() => { if (!isDisabled) { setOpen(!open); hapticSelection(); } }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:opacity-70"
        style={{
          background: c.searchBg,
          border: `1.5px solid ${borderColor}`,
          minHeight: 48,
          opacity: isDisabled ? 0.45 : 1,
        }}
        disabled={isDisabled}
      >
        <div className="flex items-center gap-2.5">
          {IconComp && <IconComp size={14} color={color || c.text3} />}
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
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <Search size={14} color={c.text3} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Tìm ${label.toLowerCase()}...`}
                className="flex-1 bg-transparent outline-none"
                style={{ color: c.text1, fontSize: φ.xs }}
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} color={c.text3} />
                </button>
              )}
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {hasNoResults ? (
                <div className="px-4 py-6 text-center">
                  <Search size={20} color={c.text3} className="mx-auto mb-2" style={{ opacity: 0.4 }} />
                  <p style={{ color: c.text3, fontSize: φ.xs }}>Không tìm thấy kết quả</p>
                </div>
              ) : (
                filtered.map(opt => {
                  const active = value === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { onChange(opt.id); setOpen(false); setSearch(''); hapticSelection(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 active:opacity-70 text-left"
                      style={{
                        background: active ? hexToRgba(color || '#8B5CF6', 10) : 'transparent',
                        borderBottom: `1px solid ${c.divider}`,
                        minHeight: 44,
                      }}
                    >
                      {renderOption ? renderOption(opt, active) : (
                        <div className="contents">
                          {opt.icon && <span style={{ fontSize: 14 }}>{opt.icon}</span>}
                          <div className="flex-1 min-w-0">
                            <span style={{ color: active ? (color || '#8B5CF6') : c.text1, fontSize: φ.sm, fontWeight: active ? 700 : 500 }}>
                              {opt.label}
                            </span>
                            {opt.desc && <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{opt.desc}</p>}
                          </div>
                          {active && <Check size={14} color={color || '#8B5CF6'} strokeWidth={3} />}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── SuggestionChipRow ─── */
function SuggestionChipRow({
  suggestions, onSelect, selectedIdx, color,
}: {
  suggestions: { text: string; type?: ChallengeType }[];
  onSelect: (text: string, idx: number) => void;
  selectedIdx?: number;
  color?: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s, i) => {
        const active = selectedIdx === i;
        const typeInfo = s.type ? CHALLENGE_TYPE_MAP[s.type] : null;
        return (
          <button
            key={i}
            onClick={() => { onSelect(s.text, i); hapticSelection(); }}
            className="shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 active:opacity-70"
            style={{
              background: active ? hexToRgba(color || '#8B5CF6', 15) : c.chipBg,
              border: `1.5px solid ${active ? hexToRgba(color || '#8B5CF6', 40) : c.chipBorder}`,
              minHeight: 34,
            }}
          >
            {typeInfo && <span style={{ fontSize: 10 }}>{typeInfo.icon}</span>}
            <span style={{ color: active ? (color || '#8B5CF6') : c.chipText, fontSize: 11, fontWeight: active ? 600 : 500 }}>
              {s.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── SmartAutocompleteList ─── */
function SmartAutocompleteList({
  query, domain, onSelect,
}: {
  query: string;
  domain: DomainId;
  onSelect: (text: string) => void;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const allSuggestions = SUGGESTION_LIBRARY[domain] || [];
  const filtered = query
    ? allSuggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase()))
    : allSuggestions.slice(0, 5);

  if (filtered.length === 0 && query) {
    return (
      <div className="px-3 py-4 text-center rounded-xl" style={{ background: c.surface2 }}>
        <p style={{ color: c.text3, fontSize: φ.xs }}>Không tìm thấy gợi ý — bạn có thể tự nhập</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.divider}` }}>
      {filtered.map((s, i) => {
        const typeInfo = CHALLENGE_TYPE_MAP[s.type];
        return (
          <button
            key={i}
            onClick={() => { onSelect(s.text); hapticSelection(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 active:opacity-70 text-left"
            style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none', minHeight: 40 }}
          >
            <Sparkles size={11} color={typeInfo.color} />
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 500, flex: 1 }}>{s.text}</span>
            <span className="px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: hexToRgba(typeInfo.color, 12), color: typeInfo.color, fontSize: 8, fontWeight: 600 }}>
              {typeInfo.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── AutoTitleSuggestionRow ─── */
function AutoTitleSuggestionRow({
  onSelect, selectedTitle,
}: {
  onSelect: (title: string) => void;
  selectedTitle?: string;
}) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  return (
    <div className="flex flex-col gap-1.5">
      {TITLE_SUGGESTIONS.map((ts, i) => {
        const active = selectedTitle === ts.text;
        const domainPack = DOMAIN_PACKS.find(d => d.id === ts.domain);
        const typeInfo = CHALLENGE_TYPE_MAP[ts.type];
        return (
          <button
            key={i}
            onClick={() => { onSelect(ts.text); hapticSelection(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl active:opacity-70 text-left"
            style={{
              background: active ? 'rgba(139,92,246,0.06)' : c.chipBg,
              border: `1.5px solid ${active ? 'rgba(139,92,246,0.25)' : c.chipBorder}`,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 14 }}>{domainPack?.icon}</span>
            <div className="flex-1 min-w-0">
              <p style={{ color: active ? '#8B5CF6' : c.text1, fontSize: 12, fontWeight: active ? 700 : 500 }} className="truncate">
                {ts.text}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span style={{ color: c.text3, fontSize: 9 }}>{domainPack?.title}</span>
                <span style={{ color: c.text3, fontSize: 9 }}>•</span>
                <span style={{ color: typeInfo.color, fontSize: 9, fontWeight: 600 }}>{typeInfo.icon} {typeInfo.label}</span>
              </div>
            </div>
            {active && <Check size={14} color="#8B5CF6" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export function ArenaUniversalPresetLibraryPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  // Section tab
  const [activeSection, setActiveSection] = useState(0);
  // Domain pack expand
  const [expandedDomain, setExpandedDomain] = useState<DomainId | null>(null);
  // Suggestion library selected domain
  const [sugDomain, setSugDomain] = useState<DomainId>('sports');
  const [sugSelectedIdx, setSugSelectedIdx] = useState<number | undefined>(undefined);
  // Dropdown demos
  const [ddDomain, setDdDomain] = useState('');
  const [ddType, setDdType] = useState('');
  const [ddTie, setDdTie] = useState('');
  const [ddVoid, setDdVoid] = useState('');
  const [ddDeadline, setDdDeadline] = useState('');
  const [ddWin, setDdWin] = useState('');
  const [ddSource, setDdSource] = useState('');
  // Autocomplete demo
  const [autoQuery, setAutoQuery] = useState('');
  // Title suggestion
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>(undefined);
  // Demo flow selected
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);

  const sections = [
    { label: 'Domain Packs', icon: Layers },
    { label: 'Suggestions', icon: Sparkles },
    { label: 'Dropdowns', icon: List },
    { label: 'Demo Flows', icon: Play },
    { label: 'Titles', icon: Hash },
  ];

  return (
    <PageLayout>
      <Header title="Universal Rule Presets" subtitle="10B — Preset Library" back />

      {/* Section Tabs */}
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto no-scrollbar">
        {sections.map((sec, i) => {
          const active = activeSection === i;
          return (
            <button
              key={i}
              onClick={() => { setActiveSection(i); hapticSelection(); }}
              className="shrink-0 flex items-center gap-1.5 px-3.5 rounded-xl"
              style={{
                background: active ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                color: active ? c.chipActiveText : c.chipText,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                minHeight: 40,
              }}
            >
              <sec.icon size={12} />
              {sec.label}
            </button>
          );
        })}
      </div>

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
        <PageContent gap="default">

        {/* ═══ SECTION 1 — Domain Packs ═══ */}
        {activeSection === 0 && (
          <div className="flex flex-col">
            <SectionHeader title="Domain Packs" accent accentColor="#8B5CF6" mb={4}
              subtitle="10 lĩnh vực bao phủ mọi loại challenge" />

            {DOMAIN_PACKS.map(pack => {
              const expanded = expandedDomain === pack.id;
              return (
                <TrCard key={pack.id} className="overflow-hidden">
                  <button
                    onClick={() => { setExpandedDomain(expanded ? null : pack.id); hapticSelection(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70"
                    style={{ minHeight: 56 }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: c.surface2, fontSize: 20 }}>
                      {pack.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{pack.title}</p>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.3 }} className="truncate">{pack.description}</p>
                    </div>
                    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} color={c.text3} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                          {/* Supported types */}
                          <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginTop: 12, marginBottom: 6, letterSpacing: 0.5 }}>
                            CHALLENGE TYPES HỖ TRỢ
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {pack.supportedTypes.map(t => {
                              const info = CHALLENGE_TYPE_MAP[t];
                              return (
                                <span key={t} className="px-2 py-1 rounded-lg flex items-center gap-1"
                                  style={{ background: hexToRgba(info.color, 10), border: `1px solid ${hexToRgba(info.color, 20)}` }}>
                                  <span style={{ fontSize: 10 }}>{info.icon}</span>
                                  <span style={{ color: info.color, fontSize: 9, fontWeight: 600 }}>{info.label}</span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Example suggestions */}
                          <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
                            GỢI Ý MẪU
                          </p>
                          <div className="flex flex-col gap-1">
                            {pack.examples.map((ex, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: c.surface2 }}>
                                <Sparkles size={10} color={c.text3} />
                                <span style={{ color: c.text1, fontSize: 12 }}>"{ex}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TrCard>
              );
            })}
          </div>
        )}

        {/* ═══ SECTION 2 — Suggestion Library ═══ */}
        {activeSection === 1 && (
          <div className="flex flex-col">
            <SectionHeader title="Suggestion Library" accent accentColor="#F59E0B" mb={4}
              subtitle="6–8 gợi ý cho mỗi lĩnh vực" />

            {/* Domain filter */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {DOMAIN_PACKS.map(d => {
                const active = sugDomain === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSugDomain(d.id); setSugSelectedIdx(undefined); hapticSelection(); }}
                    className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl"
                    style={{
                      background: active ? c.chipActiveBg : c.chipBg,
                      border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                      minHeight: 36,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{d.icon}</span>
                    <span style={{ color: active ? c.chipActiveText : c.chipText, fontSize: 10, fontWeight: active ? 700 : 500 }}>
                      {d.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Suggestions as chips */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} color="#F59E0B" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Gợi ý — {DOMAIN_PACKS.find(d => d.id === sugDomain)?.title}
                </span>
                <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
                  {SUGGESTION_LIBRARY[sugDomain].length}
                </span>
              </div>
              <SuggestionChipRow
                suggestions={SUGGESTION_LIBRARY[sugDomain]}
                onSelect={(text, idx) => {
                  setSugSelectedIdx(idx);
                  actionToast.success({ title: 'Đã chọn gợi ý', description: text });
                }}
                selectedIdx={sugSelectedIdx}
                color="#F59E0B"
              />
            </TrCard>

            {/* Autocomplete demo */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={14} color="#3B82F6" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>SmartAutocompleteList</span>
              </div>
              <input
                type="text"
                value={autoQuery}
                onChange={e => setAutoQuery(e.target.value)}
                placeholder="Gõ để tìm gợi ý..."
                className="w-full px-4 py-3 rounded-xl mb-2"
                style={{
                  background: c.searchBg,
                  border: `1.5px solid ${c.searchBorder}`,
                  color: c.text1,
                  fontSize: φ.sm,
                  outline: 'none',
                }}
              />
              <SmartAutocompleteList
                query={autoQuery}
                domain={sugDomain}
                onSelect={(text) => {
                  setAutoQuery(text);
                  actionToast.success({ title: 'Đã chọn', description: text });
                }}
              />
            </TrCard>
          </div>
        )}

        {/* ═══ SECTION 3 — Dropdown Components ═══ */}
        {activeSection === 2 && (
          <div className="flex flex-col">
            <SectionHeader title="Dropdown / Autocomplete" accent accentColor="#3B82F6" mb={4}
              subtitle="Component set có đầy đủ states" />

            {/* Domain dropdown */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — DOMAIN</p>
              <SearchableDropdown
                label="Lĩnh vực"
                options={DOMAIN_PACKS.map(d => ({ id: d.id, label: d.title, icon: d.icon, desc: d.description.slice(0, 50) }))}
                value={ddDomain}
                onChange={setDdDomain}
                icon={Layers}
                color="#8B5CF6"
              />
            </TrCard>

            {/* Challenge type dropdown */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — CHALLENGE TYPE</p>
              <SearchableDropdown
                label="Loại challenge"
                options={Object.entries(CHALLENGE_TYPE_MAP).map(([id, info]) => ({
                  id, label: info.label, icon: info.icon,
                }))}
                value={ddType}
                onChange={setDdType}
                icon={Target}
                color="#F59E0B"
              />
            </TrCard>

            {/* Win condition */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — WIN CONDITION</p>
              <SearchableDropdown
                label="Điều kiện thắng"
                options={[
                  { id: 'closest', label: 'Người đoán gần đúng nhất', icon: '🎯' },
                  { id: 'highest', label: 'Điểm/giá trị cao nhất', icon: '📊' },
                  { id: 'lowest', label: 'Điểm/giá trị thấp nhất', icon: '📉' },
                  { id: 'first', label: 'Hoàn thành trước', icon: '🏁' },
                  { id: 'correct', label: 'Trả lời đúng', icon: '✅' },
                  { id: 'voted', label: 'Được vote nhiều nhất', icon: '🗳️' },
                  { id: 'proof', label: 'Bằng chứng hợp lệ', icon: '📸' },
                ]}
                value={ddWin}
                onChange={setDdWin}
                icon={Target}
                color="#10B981"
              />
            </TrCard>

            {/* Resolution source */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — RESOLUTION SOURCE</p>
              <SearchableDropdown
                label="Nguồn kết quả"
                options={[
                  { id: 'coingecko', label: 'CoinGecko API', icon: '📈', desc: 'Giá crypto real-time' },
                  { id: 'espn', label: 'ESPN / Live Score', icon: '⚽', desc: 'Kết quả thể thao' },
                  { id: 'manual', label: 'Nhập thủ công', icon: '✍️', desc: 'Creator tự nhập kết quả' },
                  { id: 'community', label: 'Community Vote', icon: '🗳️', desc: 'Cộng đồng bình chọn' },
                  { id: 'referee', label: 'Referee', icon: '🧑‍⚖️', desc: 'Trọng tài xác nhận' },
                  { id: 'oracle', label: 'Oracle / Smart Contract', icon: '🔗', desc: 'Nguồn on-chain' },
                ]}
                value={ddSource}
                onChange={setDdSource}
                icon={Eye}
                color="#06B6D4"
              />
            </TrCard>

            {/* Tie rule */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — TIE RULE</p>
              <SearchableDropdown
                label="Luật hòa"
                options={[
                  { id: 'split', label: 'Chia đều pool', icon: '⚖️' },
                  { id: 'refund', label: 'Hoàn trả entry points', icon: '↩️' },
                  { id: 'rematch', label: 'Chơi lại (rematch)', icon: '🔄' },
                  { id: 'referee', label: 'Trọng tài quyết định', icon: '🧑‍⚖️' },
                  { id: 'random', label: 'Bốc thăm ngẫu nhiên', icon: '🎲' },
                ]}
                value={ddTie}
                onChange={setDdTie}
                icon={Shield}
                color="#F97316"
              />
            </TrCard>

            {/* Void rule */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — VOID RULE</p>
              <SearchableDropdown
                label="Luật hủy bỏ"
                options={[
                  { id: 'no_evidence', label: 'Không đủ bằng chứng → hủy', icon: '🚫' },
                  { id: 'external', label: 'Sự kiện gốc bị hủy → hủy', icon: '❌' },
                  { id: 'min_part', label: 'Không đủ người tham gia → hủy', icon: '👤' },
                  { id: 'timeout', label: 'Quá hạn chốt kết quả → hủy', icon: '⏰' },
                ]}
                value={ddVoid}
                onChange={setDdVoid}
                icon={Shield}
                color="#EF4444"
              />
            </TrCard>

            {/* Result deadline */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>SEARCHABLE DROPDOWN — RESULT DEADLINE</p>
              <SearchableDropdown
                label="Hạn chốt kết quả"
                options={[
                  { id: '1h', label: '1 giờ sau kết thúc', icon: '⏱️' },
                  { id: '6h', label: '6 giờ sau kết thúc', icon: '⏱️' },
                  { id: '12h', label: '12 giờ sau kết thúc', icon: '⏱️' },
                  { id: '24h', label: '24 giờ sau kết thúc', icon: '⏱️' },
                  { id: '48h', label: '48 giờ sau kết thúc', icon: '⏱️' },
                  { id: '7d', label: '7 ngày sau kết thúc', icon: '📅' },
                ]}
                value={ddDeadline}
                onChange={setDdDeadline}
                icon={Filter}
                color="#94A3B8"
              />
            </TrCard>

            {/* Disabled state demo */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>STATE — DISABLED</p>
              <SearchableDropdown
                label="Demo"
                options={[]}
                value=""
                onChange={() => {}}
                demoState="disabled"
                placeholder="Dropdown bị vô hiệu hóa"
              />
            </TrCard>
          </div>
        )}

        {/* ═══ SECTION 4 — Demo Mini-Flows ═══ */}
        {activeSection === 3 && (
          <div className="flex flex-col">
            <SectionHeader title="Example Mappings" accent accentColor="#10B981" mb={4}
              subtitle="6 demo mini-flow minh họa end-to-end" />

            {/* Demo selector */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {DEMO_FLOWS.map((df, i) => {
                const active = activeDemoIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setActiveDemoIdx(i); hapticSelection(); }}
                    className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl"
                    style={{
                      background: active ? hexToRgba(df.color, 15) : c.chipBg,
                      border: `1.5px solid ${active ? hexToRgba(df.color, 40) : c.chipBorder}`,
                      minHeight: 36,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{df.domainIcon}</span>
                    <span style={{ color: active ? df.color : c.chipText, fontSize: 10, fontWeight: active ? 700 : 500 }}>
                      {df.domainLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Demo Card */}
            {(() => {
              const demo = DEMO_FLOWS[activeDemoIdx];
              return (
                <motion.div
                  key={activeDemoIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrCard className="p-4" accentBorder={hexToRgba(demo.color, 30)}>
                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: hexToRgba(demo.color, 15), fontSize: 20 }}>
                        {demo.domainIcon}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                          {demo.domainLabel} + {demo.typeLabel}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Demo mapping flow</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg"
                        style={{ background: hexToRgba(demo.color, 12), color: demo.color, fontSize: 9, fontWeight: 700 }}>
                        {demo.typeIcon} {demo.typeLabel}
                      </span>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-3">
                      {/* Step 1: Domain */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: c.surface2 }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: demo.color, fontSize: 10 }}>
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>1</span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, width: 60 }}>Domain</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span style={{ fontSize: 12 }}>{demo.domainIcon}</span>
                          <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{demo.domainLabel}</span>
                        </div>
                        <Check size={12} color="#10B981" />
                      </div>

                      {/* Step 2: Type */}
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: c.surface2 }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: demo.color, fontSize: 10 }}>
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>2</span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, width: 60 }}>Type</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span style={{ fontSize: 12 }}>{demo.typeIcon}</span>
                          <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{demo.typeLabel}</span>
                        </div>
                        <Check size={12} color="#10B981" />
                      </div>

                      {/* Step 3: Suggestions */}
                      <div className="px-3 py-2.5 rounded-xl" style={{ background: c.surface2 }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: demo.color }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>3</span>
                          </div>
                          <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>Suggestion chips</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-8">
                          {demo.suggestions.map((s, i) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-lg"
                              style={{ background: hexToRgba(demo.color, 10), border: `1px solid ${hexToRgba(demo.color, 25)}`, fontSize: 10, color: demo.color, fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Step 4: Generated rule */}
                      <div className="px-3 py-2.5 rounded-xl" style={{ background: hexToRgba(demo.color, 8), border: `1px solid ${hexToRgba(demo.color, 15)}` }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: demo.color }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>4</span>
                          </div>
                          <span style={{ color: demo.color, fontSize: 10, fontWeight: 600 }}>Generated Rule Preview</span>
                        </div>
                        <div className="ml-8 flex items-start gap-2">
                          <Eye size={12} color={demo.color} className="shrink-0 mt-0.5" />
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                            "{demo.generatedRule}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                </motion.div>
              );
            })()}

            {/* All 6 demos summary */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} color="#10B981" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Tổng quan 6 demo flows</span>
              </div>
              <div className="flex flex-col gap-2">
                {DEMO_FLOWS.map((df, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveDemoIdx(i); hapticSelection(); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl active:opacity-70 text-left"
                    style={{
                      background: activeDemoIdx === i ? hexToRgba(df.color, 8) : c.surface2,
                      border: `1px solid ${activeDemoIdx === i ? hexToRgba(df.color, 25) : 'transparent'}`,
                      minHeight: 44,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{df.domainIcon}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, flex: 1 }}>
                      {df.domainLabel} + {df.typeLabel}
                    </span>
                    <span style={{ fontSize: 10 }}>{df.typeIcon}</span>
                    <ChevronRight size={12} color={c.text3} />
                  </button>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {/* ═══ SECTION 5 — Auto Title Suggestions ═══ */}
        {activeSection === 4 && (
          <div className="flex flex-col">
            <SectionHeader title="Auto Title Suggestions" accent accentColor="#EC4899" mb={4}
              subtitle="Gợi ý title thông minh theo domain + type" />

            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} color="#EC4899" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>AutoTitleSuggestionRow</span>
                <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899', fontSize: 8, fontWeight: 700 }}>
                  {TITLE_SUGGESTIONS.length} titles
                </span>
              </div>
              <AutoTitleSuggestionRow
                onSelect={(title) => {
                  setSelectedTitle(title);
                  actionToast.success({ title: 'Đã chọn title', description: title });
                }}
                selectedTitle={selectedTitle}
              />
            </TrCard>

            {/* Selected title preview */}
            {selectedTitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <TrCard className="p-4" accentBorder="rgba(236,72,153,0.2)">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={13} color="#EC4899" />
                    <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>Title đã chọn</span>
                  </div>
                  <p style={{ color: '#EC4899', fontSize: φ.body, fontWeight: 700, lineHeight: 1.4 }}>
                    "{selectedTitle}"
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                    Có thể chỉnh sửa sau khi chọn
                  </p>
                </TrCard>
              </motion.div>
            )}

            {/* How it works */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} color="#3B82F6" />
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Cách hoạt động</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { step: '1', text: 'User chọn Domain → hệ thống lọc title phù hợp', color: '#8B5CF6' },
                  { step: '2', text: 'User chọn Challenge Type → refine suggestions', color: '#F59E0B' },
                  { step: '3', text: 'User tap suggestion → auto-fill title input', color: '#10B981' },
                  { step: '4', text: 'User có thể chỉnh sửa title trước khi tiếp tục', color: '#3B82F6' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba(s.color, 20) }}>
                      <span style={{ color: s.color, fontSize: 9, fontWeight: 700 }}>{s.step}</span>
                    </div>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{s.text}</p>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Rule engine note */}
            <TrCard className="p-3 flex items-start gap-2">
              <Shield size={14} color="#10B981" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                Hệ preset dùng 1 rule engine chung — không tạo form riêng cho từng ngành.
                Tất cả domains đều tái sử dụng cùng challenge types, dropdowns, và suggestion pipeline.
              </p>
            </TrCard>
          </div>
        )}

        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}
