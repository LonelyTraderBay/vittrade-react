import React, { useState, useMemo } from 'react';
import {
  Target, Plus, Trophy, Gift, Star, TrendingUp, Calendar,
  ChevronRight, CheckCircle, Clock, Zap, PiggyBank, Sparkles,
  Edit3, Trash2, ArrowUpRight, Flag, Award, Crown, Medal,
  CircleDollarSign, AlertCircle,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtNum, fmtPct } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */

interface Milestone {
  id: string;
  percentage: number;
  label: string;
  reward: string;
  rewardType: 'apy_boost' | 'badge' | 'points' | 'gift';
  rewardValue: string;
  unlocked: boolean;
  claimedAt: string | null;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  color: string;
  icon: 'house' | 'car' | 'vacation' | 'education' | 'emergency' | 'custom';
  startDate: string;
  targetDate: string;
  autoContribute: boolean;
  monthlyContribution: number;
  linkedProduct: string;
  linkedProductAPY: number;
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  contributions: { date: string; amount: number; source: string }[];
}

interface GoalTemplate {
  id: string;
  name: string;
  icon: 'house' | 'car' | 'vacation' | 'education' | 'emergency' | 'custom';
  suggestedTarget: number;
  suggestedMonths: number;
  color: string;
  description: string;
}

const GOAL_ICONS: Record<string, React.ReactNode> = {
  house: <PiggyBank size={20} />,
  car: <CircleDollarSign size={20} />,
  vacation: <Star size={20} />,
  education: <Award size={20} />,
  emergency: <AlertCircle size={20} />,
  custom: <Target size={20} />,
};

const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: 't1', name: 'Quỹ khẩn cấp', icon: 'emergency', suggestedTarget: 5000, suggestedMonths: 12, color: '#EF4444', description: '3-6 tháng chi phí sinh hoạt' },
  { id: 't2', name: 'Mua nhà', icon: 'house', suggestedTarget: 50000, suggestedMonths: 60, color: '#3B82F6', description: 'Tích lũy tiền đặt cọc' },
  { id: 't3', name: 'Du lịch', icon: 'vacation', suggestedTarget: 3000, suggestedMonths: 6, color: '#F59E0B', description: 'Chuyến đi trong mơ' },
  { id: 't4', name: 'Giáo dục', icon: 'education', suggestedTarget: 20000, suggestedMonths: 36, color: '#8B5CF6', description: 'Đầu tư cho tương lai' },
  { id: 't5', name: 'Mua xe', icon: 'car', suggestedTarget: 15000, suggestedMonths: 24, color: '#10B981', description: 'Phương tiện di chuyển' },
  { id: 't6', name: 'Mục tiêu tùy chỉnh', icon: 'custom', suggestedTarget: 1000, suggestedMonths: 12, color: '#6366F1', description: 'Tự đặt mục tiêu riêng' },
];

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const MOCK_GOALS: SavingsGoal[] = [
  {
    id: 'g1',
    name: 'Quỹ khẩn cấp',
    targetAmount: 5000,
    currentAmount: 3750,
    currency: 'USDT',
    color: '#EF4444',
    icon: 'emergency',
    startDate: '2025-09-01',
    targetDate: '2026-09-01',
    autoContribute: true,
    monthlyContribution: 350,
    linkedProduct: 'USDT Linh hoạt',
    linkedProductAPY: 4.5,
    status: 'active',
    milestones: [
      { id: 'm1', percentage: 25, label: '25% Khởi đầu', reward: 'Badge Người tiết kiệm', rewardType: 'badge', rewardValue: 'Saver Badge', unlocked: true, claimedAt: '2025-12-15' },
      { id: 'm2', percentage: 50, label: '50% Nửa chặng đường', reward: '+0.2% APY Boost 30 ngày', rewardType: 'apy_boost', rewardValue: '+0.2% APY', unlocked: true, claimedAt: '2026-01-20' },
      { id: 'm3', percentage: 75, label: '75% Sắp hoàn thành', reward: '500 điểm thưởng', rewardType: 'points', rewardValue: '500 Points', unlocked: true, claimedAt: '2026-02-28' },
      { id: 'm4', percentage: 100, label: '100% Hoàn thành!', reward: '+0.5% APY Boost 60 ngày', rewardType: 'gift', rewardValue: '+0.5% APY', unlocked: false, claimedAt: null },
    ],
    contributions: [
      { date: '2026-03-01', amount: 350, source: 'Tự động' },
      { date: '2026-02-01', amount: 350, source: 'Tự động' },
      { date: '2026-01-15', amount: 200, source: 'Thủ công' },
      { date: '2026-01-01', amount: 350, source: 'Tự động' },
      { date: '2025-12-01', amount: 350, source: 'Tự động' },
    ],
  },
  {
    id: 'g2',
    name: 'Du lịch Nhật Bản',
    targetAmount: 3000,
    currentAmount: 1200,
    currency: 'USDT',
    color: '#F59E0B',
    icon: 'vacation',
    startDate: '2026-01-01',
    targetDate: '2026-07-01',
    autoContribute: true,
    monthlyContribution: 300,
    linkedProduct: 'USDT Linh hoạt',
    linkedProductAPY: 4.5,
    status: 'active',
    milestones: [
      { id: 'm5', percentage: 25, label: '25% Khởi đầu', reward: 'Badge Explorer', rewardType: 'badge', rewardValue: 'Explorer Badge', unlocked: true, claimedAt: '2026-02-10' },
      { id: 'm6', percentage: 50, label: '50% Nửa chặng đường', reward: '+0.3% APY Boost 30 ngày', rewardType: 'apy_boost', rewardValue: '+0.3% APY', unlocked: false, claimedAt: null },
      { id: 'm7', percentage: 75, label: '75% Sắp hoàn thành', reward: '800 điểm thưởng', rewardType: 'points', rewardValue: '800 Points', unlocked: false, claimedAt: null },
      { id: 'm8', percentage: 100, label: '100% Hoàn thành!', reward: 'Voucher ưu đãi đổi tiền', rewardType: 'gift', rewardValue: 'Exchange Voucher', unlocked: false, claimedAt: null },
    ],
    contributions: [
      { date: '2026-03-01', amount: 300, source: 'Tự động' },
      { date: '2026-02-01', amount: 300, source: 'Tự động' },
      { date: '2026-01-01', amount: 600, source: 'Thủ công' },
    ],
  },
  {
    id: 'g3',
    name: 'Quỹ đầu tư BTC',
    targetAmount: 10000,
    currentAmount: 10000,
    currency: 'USDT',
    color: '#F7931A',
    icon: 'custom',
    startDate: '2025-03-01',
    targetDate: '2026-03-01',
    autoContribute: false,
    monthlyContribution: 0,
    linkedProduct: 'BTC Cố định 60D',
    linkedProductAPY: 3.5,
    status: 'completed',
    milestones: [
      { id: 'm9', percentage: 25, label: '25%', reward: 'Badge', rewardType: 'badge', rewardValue: 'BTC Saver', unlocked: true, claimedAt: '2025-06-01' },
      { id: 'm10', percentage: 50, label: '50%', reward: '+0.2% APY', rewardType: 'apy_boost', rewardValue: '+0.2%', unlocked: true, claimedAt: '2025-08-15' },
      { id: 'm11', percentage: 75, label: '75%', reward: '1000 Points', rewardType: 'points', rewardValue: '1000', unlocked: true, claimedAt: '2025-11-01' },
      { id: 'm12', percentage: 100, label: '100%', reward: '+0.5% APY 90 ngày', rewardType: 'gift', rewardValue: '+0.5%', unlocked: true, claimedAt: '2026-03-01' },
    ],
    contributions: [],
  },
];

/* ═══════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════ */
function GoalSkeleton() {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-4">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl" style={{ background: c.borderSolid }} />
            <div className="flex-1">
              <div className="h-3.5 rounded mb-2" style={{ background: c.borderSolid, width: '60%' }} />
              <div className="h-2.5 rounded" style={{ background: c.borderSolid, width: '40%' }} />
            </div>
          </div>
          <div className="h-2 rounded-full mb-3" style={{ background: c.borderSolid }} />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex-1 h-8 rounded-lg" style={{ background: c.borderSolid }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Circular Progress Ring
   ═══════════════════════════════════════════════════════════ */
function ProgressRing({ progress, size = 56, strokeWidth = 4, color }: {
  progress: number; size?: number; strokeWidth?: number; color: string;
}) {
  const c = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={c.surface2}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Milestone Item
   ═══════════════════════════════════════════════════════════ */
function MilestoneItem({ milestone, goalColor }: { milestone: Milestone; goalColor: string }) {
  const c = useThemeColors();
  const REWARD_ICONS: Record<string, React.ReactNode> = {
    apy_boost: <TrendingUp size={14} color="#3B82F6" />,
    badge: <Medal size={14} color="#F59E0B" />,
    points: <Star size={14} color="#8B5CF6" />,
    gift: <Gift size={14} color="#10B981" />,
  };

  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${c.divider}` }}
    >
      {/* Status indicator */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: milestone.unlocked ? `${goalColor}18` : c.surface2,
          border: milestone.unlocked ? `1.5px solid ${goalColor}` : `1.5px solid ${c.border}`,
        }}
      >
        {milestone.unlocked ? (
          <CheckCircle size={16} color={goalColor} />
        ) : (
          <span style={{ fontSize: 10, fontWeight: 700, color: c.text3 }}>
            {milestone.percentage}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
          {milestone.label}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {REWARD_ICONS[milestone.rewardType]}
          <span style={{ fontSize: 11, color: milestone.unlocked ? goalColor : c.text3 }}>
            {milestone.reward}
          </span>
        </div>
      </div>

      {/* Status */}
      {milestone.unlocked ? (
        <div
          className="px-2 py-1 rounded-md"
          style={{ background: `${goalColor}14`, fontSize: 10, fontWeight: 600, color: goalColor }}
        >
          {milestone.claimedAt ? 'Đã nhận' : 'Nhận ngay'}
        </div>
      ) : (
        <Clock size={14} color={c.text3} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Goal Card
   ═══════════════════════════════════════════════════════════ */
function GoalCard({ goal, onExpand }: { goal: SavingsGoal; onExpand: (id: string) => void }) {
  const c = useThemeColors();
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const unlockedCount = goal.milestones.filter(m => m.unlocked).length;
  const nextMilestone = goal.milestones.find(m => !m.unlocked);
  const isCompleted = goal.status === 'completed';

  // Days remaining
  const now = new Date('2026-03-09');
  const target = new Date(goal.targetDate);
  const daysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Monthly pace needed
  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsLeft = Math.max(1, daysRemaining / 30);
  const paceNeeded = remaining > 0 ? remaining / monthsLeft : 0;

  return (
    <TrCard hover className="p-4" onClick={() => onExpand(goal.id)} as="button" style={{ width: '100%', textAlign: 'left' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${goal.color}14`, color: goal.color }}
        >
          {GOAL_ICONS[goal.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: c.text1 }}>
              {goal.name}
            </span>
            {isCompleted && (
              <div
                className="px-1.5 py-0.5 rounded"
                style={{ background: '#10B98118', fontSize: 9, fontWeight: 700, color: '#10B981' }}
              >
                Hoàn thành
              </div>
            )}
            {goal.status === 'paused' && (
              <div
                className="px-1.5 py-0.5 rounded"
                style={{ background: '#F59E0B18', fontSize: 9, fontWeight: 700, color: '#F59E0B' }}
              >
                Tạm dừng
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: c.text3 }}>
            {goal.linkedProduct} · APY {goal.linkedProductAPY}%
          </span>
        </div>
        <div className="relative shrink-0">
          <ProgressRing progress={progress} size={48} strokeWidth={3.5} color={goal.color} />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: 11, fontWeight: 700, color: goal.color }}
          >
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Amount progress */}
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 16, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
          {fmtUsd(goal.currentAmount)}
        </span>
        <span style={{ fontSize: 12, color: c.text3 }}>
          / {fmtUsd(goal.targetAmount)}
        </span>
      </div>

      {/* Linear progress bar */}
      <div className="rounded-full overflow-hidden mb-3" style={{ height: 6, background: c.surface2 }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${goal.color}, ${goal.color}CC)`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {/* Milestone dots on progress bar */}
      <div className="flex items-center gap-1.5 mb-3">
        {goal.milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: m.unlocked ? goal.color : c.surface2,
                border: m.unlocked ? 'none' : `1.5px solid ${c.border}`,
              }}
            >
              {m.unlocked ? (
                <CheckCircle size={10} color="#fff" />
              ) : (
                <span style={{ fontSize: 7, fontWeight: 700, color: c.text3 }}>{m.percentage}</span>
              )}
            </div>
            {m.id !== goal.milestones[goal.milestones.length - 1].id && (
              <div className="flex-1 h-px" style={{ background: m.unlocked ? goal.color : c.border, minWidth: 12 }} />
            )}
          </div>
        ))}
        <span style={{ fontSize: 10, color: c.text3, marginLeft: 4 }}>
          {unlockedCount}/{goal.milestones.length}
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3">
        {!isCompleted && (
          <>
            <div className="flex items-center gap-1">
              <Calendar size={11} color={c.text3} />
              <span style={{ fontSize: 10, color: c.text3 }}>
                {daysRemaining > 0 ? `${fmtNum(daysRemaining)} ngày` : 'Quá hạn'}
              </span>
            </div>
            {goal.autoContribute && (
              <div className="flex items-center gap-1">
                <Zap size={11} color={goal.color} />
                <span style={{ fontSize: 10, color: c.text2 }}>
                  {fmtUsd(goal.monthlyContribution)}/tháng
                </span>
              </div>
            )}
            {nextMilestone && (
              <div className="flex items-center gap-1">
                <Trophy size={11} color="#F59E0B" />
                <span style={{ fontSize: 10, color: c.text2 }}>
                  Tiếp: {nextMilestone.percentage}%
                </span>
              </div>
            )}
          </>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1">
            <Crown size={11} color="#F59E0B" />
            <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>
              Tất cả milestone đã hoàn thành
            </span>
          </div>
        )}
        <ChevronRight size={14} color={c.text3} className="ml-auto shrink-0" />
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */
export function SavingsGoalPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true });

  const [goals] = useState<SavingsGoal[]>(MOCK_GOALS);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState(0); // 0=template, 1=config, 2=confirm
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');
  const [autoContribute, setAutoContribute] = useState(true);
  const [monthlyAmount, setMonthlyAmount] = useState('');

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);
  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

  // Summary stats
  const totalTarget = useMemo(() => goals.filter(g => g.status === 'active').reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const totalCurrent = useMemo(() => goals.filter(g => g.status === 'active').reduce((s, g) => s + g.currentAmount, 0), [goals]);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const totalMilestones = useMemo(() => goals.reduce((s, g) => s + g.milestones.length, 0), [goals]);
  const unlockedMilestones = useMemo(() => goals.reduce((s, g) => s + g.milestones.filter(m => m.unlocked).length, 0), [goals]);

  const handleExpand = (id: string) => {
    hapticSelection();
    setSelectedGoalId(id);
    setShowDetailSheet(true);
  };

  const handleOpenCreate = () => {
    hapticSelection();
    setCreateStep(0);
    setSelectedTemplate(null);
    setGoalName('');
    setGoalTarget('');
    setGoalMonths('12');
    setAutoContribute(true);
    setMonthlyAmount('');
    setShowCreateSheet(true);
  };

  const handleSelectTemplate = (t: GoalTemplate) => {
    hapticSelection();
    setSelectedTemplate(t);
    setGoalName(t.name);
    setGoalTarget(String(t.suggestedTarget));
    setGoalMonths(String(t.suggestedMonths));
    const suggestedMonthly = Math.ceil(t.suggestedTarget / t.suggestedMonths);
    setMonthlyAmount(String(suggestedMonthly));
    setCreateStep(1);
  };

  const handleConfirmCreate = () => {
    hapticSuccess();
    setShowCreateSheet(false);
  };

  return (
    <PageLayout>
      <Header title="Mục tiêu tiết kiệm" subtitle="Đặt mục tiêu & theo dõi tiến độ" back />

      <PageContent gap="relaxed">
        {isLoading ? (
          <GoalSkeleton />
        ) : (
          <>
            {/* ─── Summary Hero Card ─── */}
            <TrCard variant="hero" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div style={{ fontSize: 11, color: c.text3, fontWeight: 600 }}>
                    Tổng tiến độ
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtUsd(totalCurrent)}
                  </div>
                  <div style={{ fontSize: 12, color: c.text2 }}>
                    mục tiêu {fmtUsd(totalTarget)}
                  </div>
                </div>
                <ProgressRing progress={totalProgress} size={72} strokeWidth={5} color="#3B82F6" />
              </div>

              {/* Stats row */}
              <div className="flex gap-2">
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6', fontFamily: 'monospace' }}>
                    {activeGoals.length}
                  </div>
                  <div style={{ fontSize: 10, color: c.text3 }}>Đang thực hiện</div>
                </TrCardStat>
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                    {completedGoals.length}
                  </div>
                  <div style={{ fontSize: 10, color: c.text3 }}>Hoàn thành</div>
                </TrCardStat>
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', fontFamily: 'monospace' }}>
                    {unlockedMilestones}/{totalMilestones}
                  </div>
                  <div style={{ fontSize: 10, color: c.text3 }}>Milestone</div>
                </TrCardStat>
              </div>
            </TrCard>

            {/* ─── Create Goal CTA ─── */}
            <CTAButton onClick={handleOpenCreate}>
              <Plus size={18} />
              Tạo mục tiêu mới
            </CTAButton>

            {/* ─── Active Goals ─── */}
            {activeGoals.length > 0 && (
              <PageSection label="Đang thực hiện" accentColor="#3B82F6">
                <div className="flex flex-col gap-3">
                  {activeGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onExpand={handleExpand} />
                  ))}
                </div>
              </PageSection>
            )}

            {/* ─── Completed Goals ─── */}
            {completedGoals.length > 0 && (
              <PageSection label="Đã hoàn thành" accentColor="#10B981">
                <div className="flex flex-col gap-3">
                  {completedGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onExpand={handleExpand} />
                  ))}
                </div>
              </PageSection>
            )}

            {/* ─── Tips Section ─── */}
            <PageSection label="Mẹo tiết kiệm" accentColor="#8B5CF6">
              <TrCard className="p-3">
                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#8B5CF614' }}
                  >
                    <Sparkles size={16} color="#8B5CF6" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
                      Tự động đóng góp đều đặn
                    </div>
                    <div style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>
                      Đặt auto-contribute hàng tháng giúp bạn đạt mục tiêu nhanh hơn 2.5x so với đóng góp thủ công.
                    </div>
                  </div>
                </div>
              </TrCard>
              <TrCard className="p-3">
                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#F59E0B14' }}
                  >
                    <Trophy size={16} color="#F59E0B" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
                      Milestone rewards tích lũy
                    </div>
                    <div style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>
                      Mỗi milestone đạt được sẽ mở khóa phần thưởng APY boost, badge hoặc điểm thưởng.
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}
      </PageContent>

      {/* ═══════════════════════════════════════════════════════
         Create Goal Bottom Sheet
         ═══════════════════════════════════════════════════════ */}
      <BottomSheetV2
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        title={
          createStep === 0
            ? 'Chọn mục tiêu'
            : createStep === 1
            ? 'Thiết lập mục tiêu'
            : 'Xác nhận mục tiêu'
        }
      >
        {/* Step 0: Template selection */}
        {createStep === 0 && (
          <div className="flex flex-col gap-2 pb-4">
            {GOAL_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className="flex items-center gap-3 p-3 rounded-xl text-left"
                style={{ background: c.surface2 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${t.color}18`, color: t.color }}
                >
                  {GOAL_ICONS[t.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: c.text3 }}>{t.description}</div>
                </div>
                <div style={{ fontSize: 11, color: c.text2, fontFamily: 'monospace' }}>
                  ~{fmtUsd(t.suggestedTarget)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Configuration */}
        {createStep === 1 && selectedTemplate && (
          <div className="flex flex-col gap-4 pb-4">
            {/* Goal name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
                Tên mục tiêu
              </label>
              <input
                type="text"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 14,
                }}
                placeholder="VD: Quỹ khẩn cấp"
              />
            </div>

            {/* Target amount */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
                Số tiền mục tiêu (USDT)
              </label>
              <input
                type="number"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
                placeholder={String(selectedTemplate.suggestedTarget)}
              />
            </div>

            {/* Duration */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
                Thời gian (tháng)
              </label>
              <div className="flex gap-2">
                {['3', '6', '12', '24', '36'].map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setGoalMonths(m);
                      if (goalTarget) {
                        setMonthlyAmount(String(Math.ceil(Number(goalTarget) / Number(m))));
                      }
                    }}
                    className="flex-1 py-2 rounded-lg"
                    style={{
                      background: goalMonths === m ? `${selectedTemplate.color}18` : c.surface2,
                      border: goalMonths === m ? `1.5px solid ${selectedTemplate.color}` : `1px solid ${c.border}`,
                      color: goalMonths === m ? selectedTemplate.color : c.text2,
                      fontSize: 13,
                      fontWeight: goalMonths === m ? 700 : 400,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto contribute toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>Tự động đóng góp</div>
                <div style={{ fontSize: 11, color: c.text3 }}>Trừ tự động từ ví hàng tháng</div>
              </div>
              <button
                onClick={() => setAutoContribute(!autoContribute)}
                className="w-12 h-7 rounded-full relative"
                style={{
                  background: autoContribute ? selectedTemplate.color : c.toggleTrackOff,
                  transition: 'background 0.2s ease',
                }}
              >
                <div
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                  style={{
                    left: autoContribute ? 'calc(100% - 26px)' : 2,
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Monthly contribution */}
            {autoContribute && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
                  Đóng góp hàng tháng (USDT)
                </label>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={e => setMonthlyAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{
                    background: c.surface2,
                    border: `1px solid ${c.border}`,
                    color: c.text1,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                {goalTarget && monthlyAmount && (
                  <div style={{ fontSize: 11, color: c.text3, marginTop: 4 }}>
                    Ước tính hoàn thành trong {Math.ceil(Number(goalTarget) / Number(monthlyAmount))} tháng
                  </div>
                )}
              </div>
            )}

            {/* Milestones preview */}
            <div
              className="rounded-xl p-3"
              style={{ background: c.surface2 }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={12} color="#F59E0B" />
                <span style={{ fontSize: 11, fontWeight: 600, color: c.text2 }}>
                  4 milestone rewards sẽ được tạo
                </span>
              </div>
              <div className="flex gap-2">
                {[25, 50, 75, 100].map(p => (
                  <div
                    key={p}
                    className="flex-1 text-center py-1.5 rounded-lg"
                    style={{
                      background: `${selectedTemplate.color}0D`,
                      border: `1px solid ${selectedTemplate.color}20`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedTemplate.color }}>{p}%</div>
                    <div style={{ fontSize: 8, color: c.text3 }}>
                      {p === 25 ? 'Badge' : p === 50 ? 'APY+' : p === 75 ? 'Points' : 'Gift'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setCreateStep(0)}
                className="flex-1 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  color: c.text2,
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${c.border}`,
                }}
              >
                Quay lại
              </button>
              <CTAButton
                fullWidth={false}
                className="flex-1"
                disabled={!goalName || !goalTarget || Number(goalTarget) <= 0}
                onClick={() => setCreateStep(2)}
              >
                Tiếp tục
              </CTAButton>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {createStep === 2 && selectedTemplate && (
          <div className="flex flex-col gap-3 pb-4">
            {/* Summary card */}
            <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedTemplate.color}18`, color: selectedTemplate.color }}
                >
                  {GOAL_ICONS[selectedTemplate.icon]}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.text1 }}>{goalName}</div>
                  <div style={{ fontSize: 12, color: c.text3 }}>{selectedTemplate.description}</div>
                </div>
              </div>
            </div>

            <BottomSheetRow label="Mục tiêu" value={fmtUsd(Number(goalTarget))} highlight />
            <BottomSheetRow label="Thời gian" value={`${goalMonths} tháng`} />
            <BottomSheetRow label="Tự động đóng góp" value={autoContribute ? 'Bật' : 'Tắt'} valueColor={autoContribute ? '#10B981' : c.text3} />
            {autoContribute && <BottomSheetRow label="Số tiền/tháng" value={fmtUsd(Number(monthlyAmount))} />}
            <BottomSheetRow label="Sản phẩm liên kết" value="USDT Linh hoạt" />
            <BottomSheetRow label="APY ước tính" value="4.50%" valueColor="#10B981" />
            <BottomSheetRow label="Milestone rewards" value="4 mốc" valueColor="#F59E0B" />

            <div
              className="flex items-start gap-2 p-3 rounded-xl mt-1"
              style={{ background: '#3B82F60D', border: '1px solid #3B82F620' }}
            >
              <AlertCircle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ fontSize: 11, color: c.text2 }}>
                Số tiền trong mục tiêu sẽ được tính lãi suất theo sản phẩm đã chọn. Bạn có thể rút bất cứ lúc nào.
              </span>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setCreateStep(1)}
                className="flex-1 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  color: c.text2,
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${c.border}`,
                }}
              >
                Quay lại
              </button>
              <CTAButton
                fullWidth={false}
                className="flex-1"
                variant="success"
                onClick={handleConfirmCreate}
              >
                <Flag size={16} />
                Tạo mục tiêu
              </CTAButton>
            </div>
          </div>
        )}
      </BottomSheetV2>

      {/* ═══════════════════════════════════════════════════════
         Goal Detail Bottom Sheet
         ═══════════════════════════════════════════════════════ */}
      <BottomSheetV2
        open={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        title={selectedGoal?.name || 'Chi tiết mục tiêu'}
        maxHeight="90vh"
      >
        {selectedGoal && (() => {
          const progress = Math.min((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100, 100);
          const now = new Date('2026-03-09');
          const target = new Date(selectedGoal.targetDate);
          const start = new Date(selectedGoal.startDate);
          const totalDays = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, totalDays - elapsedDays);
          const timeProgress = totalDays > 0 ? Math.min((elapsedDays / totalDays) * 100, 100) : 0;
          const isOnTrack = progress >= timeProgress;
          const remaining = selectedGoal.targetAmount - selectedGoal.currentAmount;

          return (
            <div className="flex flex-col gap-4 pb-4">
              {/* Progress overview */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ProgressRing progress={progress} size={80} strokeWidth={5} color={selectedGoal.color} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: selectedGoal.color, fontFamily: 'monospace' }}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtUsd(selectedGoal.currentAmount)}
                  </div>
                  <div style={{ fontSize: 12, color: c.text3 }}>
                    Mục tiêu: {fmtUsd(selectedGoal.targetAmount)}
                  </div>
                  {remaining > 0 && (
                    <div style={{ fontSize: 12, color: c.text2, marginTop: 4 }}>
                      Còn thiếu: <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{fmtUsd(remaining)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                  style={{
                    background: isOnTrack ? '#10B98114' : '#F59E0B14',
                    border: `1px solid ${isOnTrack ? '#10B98130' : '#F59E0B30'}`,
                  }}
                >
                  {isOnTrack ? <TrendingUp size={12} color="#10B981" /> : <Clock size={12} color="#F59E0B" />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: isOnTrack ? '#10B981' : '#F59E0B' }}>
                    {isOnTrack ? 'Đúng tiến độ' : 'Chậm tiến độ'}
                  </span>
                </div>
                <div
                  className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg"
                  style={{ background: c.surface2 }}
                >
                  <Calendar size={12} color={c.text3} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.text2 }}>
                    {daysRemaining > 0 ? `${fmtNum(daysRemaining)} ngày còn lại` : 'Đã đến hạn'}
                  </span>
                </div>
              </div>

              {/* Key metrics */}
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Ngày bắt đầu" value={new Date(selectedGoal.startDate).toLocaleDateString('vi-VN')} />
                <BottomSheetRow label="Ngày mục tiêu" value={new Date(selectedGoal.targetDate).toLocaleDateString('vi-VN')} />
                <BottomSheetRow label="Sản phẩm" value={selectedGoal.linkedProduct} />
                <BottomSheetRow label="APY" value={`${selectedGoal.linkedProductAPY}%`} valueColor="#10B981" />
                {selectedGoal.autoContribute && (
                  <BottomSheetRow label="Auto-contribute" value={`${fmtUsd(selectedGoal.monthlyContribution)}/tháng`} />
                )}
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy size={14} color="#F59E0B" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>
                    Milestone Rewards
                  </span>
                </div>
                {selectedGoal.milestones.map(m => (
                  <MilestoneItem key={m.id} milestone={m} goalColor={selectedGoal.color} />
                ))}
              </div>

              {/* Recent contributions */}
              {selectedGoal.contributions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ArrowUpRight size={14} color="#3B82F6" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>
                      Đóng góp gần đây
                    </span>
                  </div>
                  <div className="flex flex-col gap-0">
                    {selectedGoal.contributions.slice(0, 5).map((contrib, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: i < 4 ? `1px solid ${c.divider}` : 'none' }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: c.text1 }}>
                            +{fmtUsd(contrib.amount)}
                          </div>
                          <div style={{ fontSize: 10, color: c.text3 }}>
                            {new Date(contrib.date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div
                          className="px-2 py-0.5 rounded"
                          style={{
                            background: contrib.source === 'Tự động' ? '#3B82F60D' : '#10B9810D',
                            fontSize: 10,
                            fontWeight: 600,
                            color: contrib.source === 'Tự động' ? '#3B82F6' : '#10B981',
                          }}
                        >
                          {contrib.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedGoal.status === 'active' && (
                <div className="flex gap-3 mt-2">
                  <button
                    className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5"
                    style={{
                      background: c.surface2,
                      color: c.text2,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <Edit3 size={14} />
                    Chỉnh sửa
                  </button>
                  <CTAButton
                    fullWidth={false}
                    className="flex-1"
                    variant="success"
                    onClick={() => {
                      hapticSuccess();
                      setShowDetailSheet(false);
                    }}
                  >
                    <Plus size={16} />
                    Đóng góp thêm
                  </CTAButton>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheetV2>
    </PageLayout>
  );
}