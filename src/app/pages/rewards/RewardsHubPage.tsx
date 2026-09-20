/**
 * ══════════════════════════════════════════════════════════
 *  RewardsHubPage — Enterprise Fintech Rewards Hub (v4)
 * ══════════════════════════════════════════════════════════
 *  P0: Confirmation dialogs, skeleton/error/empty states, a11y
 *  P1: Restructured IA (Tasks at #3), collapsible bonus/progress
 *  P2: Smart prompt, terms link, semantic tokens, reduced motion
 *
 *  Section order:
 *  ① Hero Compact (balance + tier badge)
 *  ② Quick Actions (batch claim + check-in + smart prompt)
 *  ③ Nhiệm vụ (Tasks) — primary content
 *  ④ Bonus Zone (collapsible: spin + mystery + combo)
 *  ⑤ Tiến trình (collapsible: tier + leaderboard + redeem)
 *  ⑥ Footer (referral + disclaimer + terms)
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle, Gift, Trophy, Flame, Zap,
  ChevronRight, Calendar, Info,
  Target, Package, Users, Crown, Timer, Sparkles,
  ShoppingBag, Award, Star, Box, TrendingUp, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { ErrorState } from '../../components/states/ErrorState';
import {
  MY_ARENA_STATS, DAILY_CHECKIN, ARENA_POINTS_HISTORY,
  ARENA_GLOBAL_LEADERBOARD, fmtPoints,
  type DailyCheckIn,
} from '../../data/arenaData';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { useUI } from '../../contexts/UIContext';

/* ─── Extracted data & types ─── */
import {
  type UnifiedTask,
  UNIFIED_TASKS,
  FILTER_TABS,
  FILTER_MAP,
  CATEGORY_CONFIG,
  TIER_CONFIG,
  getCurrentTier,
  REDEMPTION_ITEMS,
  getDaysUntilExpiry,
  isExpiringSoon,
  MYSTERY_BOXES,
} from './rewardsData';

/* ─── Extracted sub-components ─── */
import {
  ConfettiBurst,
  CheckInRow,
  UnifiedTaskCard,
  CompactSpinCard,
  ComboMultiplierBanner,
  CompactMysteryRow,
  BalanceBreakdown,
  SmartPromptBanner,
  CollapsibleSection,
  RewardsSkeletonLoading,
  BatchClaimPreview,
} from './components/RewardSubComponents';

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE — Unified Rewards Hub (v4)
   ═══════════════════════════════════════════════════════════ */

export function RewardsHubPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const { setPendingRewards } = useUI();

  /* ─── Ref for scrolling to tasks section ─── */
  const tasksSectionRef = useRef<HTMLDivElement>(null);

  /* ─── Loading / Error simulation ─── */
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ─── Confetti state ─── */
  const [confettiActive, setConfettiActive] = useState(false);
  const handleConfettiDone = useCallback(() => setConfettiActive(false), []);

  /* ─── Lucky Spin state ─── */
  const [hasSpunToday, setHasSpunToday] = useState(false);

  /* ─── Mystery Box state ─── */
  const [openedBoxes, setOpenedBoxes] = useState<Set<string>>(new Set());

  /* ─── Claim animation tracking ─── */
  const [justClaimedIds, setJustClaimedIds] = useState<Set<string>>(new Set());

  /* ─── Unified tasks state ─── */
  const [tasks, setTasks] = useState(UNIFIED_TASKS);
  const [filter, setFilter] = useState('Tất cả');

  const filterCat = FILTER_MAP[filter];

  /* ─── Computed stats ─── */
  const claimedTasks = tasks.filter(t => t.status === 'claimed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status === 'active');
  const expiringTasks = tasks.filter(t => t.status === 'active' && isExpiringSoon(t.expiresAt));

  /* ─── Smart sorting ─── */
  const sortedFilteredTasks = useMemo(() => {
    const base = filterCat ? tasks.filter(t => t.category === filterCat) : tasks;
    return [...base].sort((a, b) => {
      const priority = (t: UnifiedTask) => {
        if (t.status === 'active' && isExpiringSoon(t.expiresAt)) {
          const days = getDaysUntilExpiry(t.expiresAt) ?? 99;
          return 100 - days;
        }
        if (t.status === 'completed') return 200;
        if (t.status === 'active') return 300;
        if (t.status === 'claimed') return 400;
        return 500;
      };
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      const ea = getDaysUntilExpiry(a.expiresAt) ?? 999;
      const eb = getDaysUntilExpiry(b.expiresAt) ?? 999;
      return ea - eb;
    });
  }, [tasks, filterCat]);

  const totalUsdtClaimed = useMemo(() => {
    return claimedTasks
      .filter(t => t.usdtReward?.includes('USDT'))
      .reduce((sum, t) => {
        const m = t.usdtReward?.match(/([\d.]+)/);
        return sum + (m ? parseFloat(m[1]) : 0);
      }, 0);
  }, [claimedTasks]);

  const completionRate = tasks.length > 0 ? Math.round((claimedTasks.length / tasks.length) * 100) : 0;

  /* ─── Sync pendingRewards to UIContext ─── */
  useEffect(() => {
    setPendingRewards(completedTasks.length);
  }, [completedTasks.length, setPendingRewards]);

  /* ─── Check-in state ─── */
  const [checkin, setCheckin] = useState(DAILY_CHECKIN);
  const streak = checkin.filter(d => d.isClaimed).length;

  const handleCheckin = (day: number) => {
    hapticSelection();
    setCheckin(prev => prev.map(d => d.day === day ? { ...d, isClaimed: true } : d));
    setConfettiActive(true);
    actionToast.success(TOAST.REWARDS.CHECKIN_CLAIMED);
  };

  /* ─── Confirmation Dialog state ─── */
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'claim' | 'batchClaim' | 'redeem';
    data?: any;
  }>({ open: false, type: 'claim' });

  /* ─── Claim handler (with confirmation) ─── */
  const handleClaimRequest = (id: string) => {
    hapticSelection();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setConfirmDialog({ open: true, type: 'claim', data: task });
  };

  const executeClaimTask = (task: UnifiedTask) => {
    setJustClaimedIds(prev => new Set(prev).add(task.id));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'claimed' as const } : t));
    setConfettiActive(true);

    const parts: string[] = [];
    if (task.usdtReward) parts.push(task.usdtReward);
    if (task.pointsReward) parts.push(`${task.pointsReward} pts`);
    actionToast.success(`Đã nhận: ${task.title} (${parts.join(' + ')})`);

    setTimeout(() => {
      setJustClaimedIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 1200);
  };

  /* ─── Batch claim (with confirmation) ─── */
  const handleBatchClaimRequest = () => {
    hapticSelection();
    if (completedTasks.length === 0) return;
    setConfirmDialog({ open: true, type: 'batchClaim', data: completedTasks });
  };

  const executeBatchClaim = () => {
    const ids = completedTasks.map(t => t.id);
    setJustClaimedIds(new Set(ids));
    setTasks(prev => prev.map(t => t.status === 'completed' ? { ...t, status: 'claimed' as const } : t));
    setConfettiActive(true);
    actionToast.success(TOAST.REWARDS.ALL_CLAIMED);
    setTimeout(() => setJustClaimedIds(new Set()), 1200);
  };

  /* ─── Lucky Spin handler ─── */
  const handleSpin = (prize: string) => {
    setHasSpunToday(true);
    setConfettiActive(true);
    actionToast.success(TOAST.REWARDS.SPIN_WIN(prize));
  };

  /* ─── Mystery Box handler ─── */
  const handleOpenBox = (boxId: string) => {
    hapticSelection();
    const box = MYSTERY_BOXES.find(b => b.id === boxId);
    if (!box) return;
    const randomPrize = box.prizes[Math.floor(Math.random() * box.prizes.length)];
    setOpenedBoxes(prev => new Set(prev).add(boxId));
    setConfettiActive(true);
    actionToast.success(TOAST.REWARDS.MYSTERY_OPENED(randomPrize));
  };

  /* ─── Combo tracking ─── */
  const completedToday = claimedTasks.filter(t => t.category === 'daily' || t.category === 'flash').length;

  /* ─── Arena stats ─── */
  const arenaStats = MY_ARENA_STATS;
  const winRate = arenaStats.totalChallenges > 0
    ? Math.round((arenaStats.wins / arenaStats.totalChallenges) * 100) : 0;
  const tier = getCurrentTier(arenaStats.pointsEarned);
  const arenaBalance = arenaStats.currentBalance - arenaStats.lockedBalance;
  const leaderboardTop = ARENA_GLOBAL_LEADERBOARD.slice(0, 3);
  const totalUsers = 2847;
  const topPct = Math.max(1, Math.round((arenaStats.rank / totalUsers) * 100));

  /* ─── Đổi điểm state ─── */
  const [showRedeem, setShowRedeem] = useState(false);

  /* ─── Redeem confirmation ─── */
  const handleRedeemRequest = (item: typeof REDEMPTION_ITEMS[number]) => {
    hapticSelection();
    const canAfford = arenaBalance >= item.cost;
    if (!canAfford) {
      actionToast.warning(`Cần thêm ${item.cost - arenaBalance} pts`);
      return;
    }
    setConfirmDialog({ open: true, type: 'redeem', data: item });
  };

  const executeRedeem = (item: typeof REDEMPTION_ITEMS[number]) => {
    actionToast.success(`Đã đổi "${item.title}" thành công!`);
  };

  /* ─── Confirmation handler ─── */
  const handleConfirm = () => {
    if (confirmDialog.type === 'claim' && confirmDialog.data) {
      executeClaimTask(confirmDialog.data as UnifiedTask);
    } else if (confirmDialog.type === 'batchClaim') {
      executeBatchClaim();
    } else if (confirmDialog.type === 'redeem' && confirmDialog.data) {
      executeRedeem(confirmDialog.data);
    }
  };

  /* ─── Expiring task for smart prompt ─── */
  const topExpiringTitle = expiringTasks[0]?.title;

  /* ─── View expiring tasks handler ─── */
  const handleViewExpiring = useCallback(() => {
    hapticSelection();
    setFilter('Tất cả');
    // Scroll to tasks section
    setTimeout(() => {
      tasksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    actionToast.info(`${expiringTasks.length} nhiệm vụ sắp hết hạn — xem bên dưới`);
  }, [expiringTasks.length, hapticSelection, actionToast]);

  /* ─── Per-category stats for hero card ─── */
  const categoryStats = useMemo(() => {
    const cats = ['daily', 'weekly', 'flash', 'learn', 'achievement', 'arena'] as const;
    return cats.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const claimed = catTasks.filter(t => t.status === 'claimed').length;
      const completed = catTasks.filter(t => t.status === 'completed').length;
      const active = catTasks.filter(t => t.status === 'active').length;
      const total = catTasks.length;
      const cfg = CATEGORY_CONFIG[cat];
      return { cat, ...cfg, claimed, completed, active, total, done: claimed + completed };
    }).filter(s => s.total > 0);
  }, [tasks]);

  /* ─── Pending rewards total ─── */
  const pendingRewards = useMemo(() => {
    let usdt = 0;
    let pts = 0;
    completedTasks.forEach(t => {
      const m = t.usdtReward?.match(/([\d.]+)/);
      if (m) usdt += parseFloat(m[1]);
      pts += t.pointsReward ?? 0;
    });
    return { usdt, pts };
  }, [completedTasks]);

  /* ─── Error retry ─── */
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  /* ═══ RENDER ═══ */

  /* Error state */
  if (hasError) {
    return (
      <div className="contents">
        <Header title="Trung tâm Phần thưởng" subtitle="Phần thưởng · Rewards" back />
        <ErrorState
          title="Không tải được phần thưởng"
          message="Vui lòng kiểm tra kết nối mạng và thử lại."
          onAction={handleRetry}
        />
      </div>
    );
  }

  /* Loading state */
  if (isLoading) {
    return (
      <div className="contents">
        <Header title="Trung tâm Phần thưởng" subtitle="Phần thưởng · Rewards" back />
        <RewardsSkeletonLoading />
      </div>
    );
  }

  return (
    <div className="contents">
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-24">
      <Header title="Trung tâm Phần thưởng" subtitle="Phần thưởng · Rewards" back />

      <PageContent gap="default" padding="compact">
      {/* ═══════════════════════════════════════
          ① HERO COMPACT — Balance + Tier Badge
          ═══════════════════════════════════════ */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0d3e 0%, #2a1550 50%, #0d1b3e 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        <ConfettiBurst active={confettiActive} onComplete={handleConfettiDone} />

        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)' }}
        />

        {/* Title row with tier badge */}
        <div className="flex items-center gap-3 mb-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.2)' }}
          >
            <Trophy size={20} color="#8B5CF6" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>Phần thưởng</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.4, marginTop: 1 }}>
              Hoàn thành nhiệm vụ — nhận USDT + Points
            </p>
          </div>
          {/* Tier badge — compact */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: `${tier.current.color}20`, border: `1px solid ${tier.current.color}40` }}
          >
            <span style={{ fontSize: 14 }}>{tier.current.emoji}</span>
            <span style={{ color: tier.current.color, fontSize: 10, fontWeight: 700 }}>{tier.current.label}</span>
          </div>
        </div>

        {/* Dual balance cards */}
        <div className="flex gap-3 relative z-10">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Gift size={12} color="#F59E0B" />
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 500 }}>USDT đã nhận</span>
            </div>
            <p style={{ color: '#F59E0B', fontSize: 22, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.2 }}>
              {totalUsdtClaimed.toFixed(1)}
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 3, opacity: 0.8 }}>USDT</span>
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1">
                <CheckCircle size={10} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>{claimedTasks.length} xong</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer size={10} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>{completedTasks.length} chờ</span>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={12} color="#8B5CF6" />
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 500 }}>Arena Points</span>
            </div>
            <p style={{ color: '#8B5CF6', fontSize: 22, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.2 }}>
              {fmtPoints(arenaStats.currentBalance)}
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 3, opacity: 0.8 }}>pts</span>
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <Award size={10} color="rgba(255,255,255,0.5)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                Hạng #{arenaStats.rank} · Top {topPct}%
              </span>
            </div>
          </div>
        </div>

        <BalanceBreakdown totalBalance={arenaStats.currentBalance} lockedBalance={arenaStats.lockedBalance} />

        {/* ── Pending rewards alert ── */}
        {(pendingRewards.usdt > 0 || pendingRewards.pts > 0) && (
          <button
            onClick={handleBatchClaimRequest}
            className="w-full mt-3 relative z-10 flex items-center gap-2.5 px-3 py-2.5 rounded-xl active:opacity-80"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              minHeight: 44,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.2)' }}>
              <Package size={16} color="#F59E0B" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>
                {completedTasks.length} phần thưởng chờ nhận
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {pendingRewards.usdt > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                    +{pendingRewards.usdt.toFixed(1)} USDT
                  </span>
                )}
                {pendingRewards.pts > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                    +{fmtPoints(pendingRewards.pts)} pts
                  </span>
                )}
              </div>
            </div>
            <span
              className="px-2.5 py-1.5 rounded-lg shrink-0"
              style={{ background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 700 }}
            >
              Nhận tất cả
            </span>
          </button>
        )}

        {/* ── Expiring tasks warning ── */}
        {expiringTasks.length > 0 && (
          <button
            onClick={handleViewExpiring}
            className="mt-2.5 relative z-10 w-full flex items-center gap-2 px-3 py-2 rounded-lg active:opacity-80"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', minHeight: 36 }}
          >
            <Timer size={12} color="#EF4444" className="shrink-0" />
            <p className="flex-1 min-w-0 truncate text-left" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, lineHeight: 1.4 }}>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>{expiringTasks.length}</span> nhiệm vụ sắp hết hạn
              {expiringTasks[0] && (
                <span style={{ color: 'rgba(255,255,255,0.5)' }}> · {expiringTasks[0].title}</span>
              )}
            </p>
            <span
              className="px-2 py-1 rounded-md shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 9, fontWeight: 700 }}
            >
              Xem
            </span>
          </button>
        )}

        {/* ── Category progress breakdown ── */}
        <div className="mt-3 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }}>Tiến độ theo danh mục</span>
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>
              {claimedTasks.length}/{tasks.length} · {completionRate}%
            </span>
          </div>

          {/* Overall progress bar — segmented by category */}
          <div className="h-2 rounded-full flex overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {categoryStats.map(s => {
              const pct = tasks.length > 0 ? (s.claimed / tasks.length) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={s.cat}
                  className="h-full"
                  style={{ width: `${pct}%`, background: s.color, minWidth: pct > 0 ? 3 : 0 }}
                />
              );
            })}
          </div>

          {/* Per-category rows */}
          <div className="flex flex-col gap-1.5">
            {categoryStats.map(s => {
              const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <div key={s.cat} className="flex items-center gap-2">
                  {/* Color dot + label */}
                  <div className="flex items-center gap-1.5" style={{ width: 72 }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 500 }}>{s.label}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: s.color, transition: 'width 0.3s' }}
                    />
                  </div>
                  {/* Counts */}
                  <div className="flex items-center gap-1 shrink-0" style={{ width: 54, justifyContent: 'flex-end' }}>
                    <span style={{ color: s.color, fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
                      {s.done}/{s.total}
                    </span>
                    {s.completed > 0 && (
                      <span
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: '#F59E0B', fontSize: 7, fontWeight: 800, color: '#000' }}
                      >
                        {s.completed}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1">
              <CheckCircle size={9} color="#10B981" />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8 }}>Đã nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: '#F59E0B' }}>
                <span style={{ fontSize: 6, fontWeight: 800, color: '#000' }}>!</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8 }}>Chờ nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <Target size={9} color="rgba(255,255,255,0.35)" />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8 }}>Đang làm</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          ② QUICK ACTIONS — Check-in + Smart Prompt
          ═══════════════════════════════════════ */}

      {/* Daily Check-in */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} color="#8B5CF6" />
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Check-in hàng ngày</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame size={12} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>{streak}/7</span>
          </div>
        </div>
        <TrCard className="p-3 relative overflow-hidden">
          <CheckInRow items={checkin} onClaim={handleCheckin} />
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <Info size={11} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
              7 ngày liên tiếp: <span style={{ color: '#8B5CF6', fontWeight: 600 }}>100 pts</span> + <span style={{ color: '#F59E0B', fontWeight: 600 }}>0.5 USDT</span>
            </p>
          </div>
        </TrCard>
      </div>



      {/* Referral Banner — eye-catching CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.button
          onClick={() => { navigate(`${prefix}/referral`); hapticSelection(); }}
          className="w-full relative overflow-hidden rounded-2xl active:scale-[0.98]"
          style={{ minHeight: 72 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
          {/* Decorative circles */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 65%)' }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3.5 px-4 py-4">
            {/* Icon with pulse ring */}
            <div className="relative shrink-0">
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: '2px solid rgba(52,211,153,0.4)' }}
                animate={{ scale: [1, 1.35, 1.35], opacity: [0.6, 0, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(16,185,129,0.2)',
                  border: '1.5px solid rgba(52,211,153,0.35)',
                  backdropFilter: 'blur(4px)',
                }}
                animate={{ y: [0, -1.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Users size={22} color="#34D399" />
              </motion.div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 text-left">
              <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                Mời bạn bè, cùng nhận thưởng
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3, lineHeight: 1.3 }}>
                <span style={{ color: '#FCD34D', fontWeight: 700 }}>15 USDT</span>
                {' + '}
                <span style={{ color: '#C4B5FD', fontWeight: 700 }}>200 pts</span>
                {' '}mỗi lượt mời
              </p>
            </div>

            {/* CTA pill */}
            <motion.div
              className="shrink-0 flex items-center gap-1 px-4 py-2.5 rounded-xl"
              style={{
                background: '#10B981',
                boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                minHeight: 40,
              }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>Mời ngay</span>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          </div>
        </motion.button>
      </motion.div>


      {/* ═══════════════════════════════════════
          ③ NHIỆM VỤ (TASKS) — Primary Content
          ═══════════════════════════════════════ */}
      <div ref={tasksSectionRef}>
        <SectionHeader
          title="Nhiệm vụ"
          accent
          accentColor="#3B82F6"
          mb={8}
          right={
            <span style={{ color: c.text3, fontSize: 10 }}>
              {claimedTasks.length}/{tasks.length} hoàn thành
            </span>
          }
        />
      </div>

      {/* Filter chips */}
      <div>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pt-3 pb-2" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => {
            const catKey = FILTER_MAP[tab];
            const count = catKey ? tasks.filter(t => t.category === catKey).length : tasks.length;
            const claimableInCat = catKey
              ? tasks.filter(t => t.category === catKey && t.status === 'completed').length
              : completedTasks.length;
            return (
              <button
                key={tab}
                onClick={() => { setFilter(tab); hapticSelection(); }}
                className="shrink-0 px-3.5 py-2 rounded-xl whitespace-nowrap relative"
                aria-label={`${tab}: ${count} nhiệm vụ${claimableInCat > 0 ? `, ${claimableInCat} chờ nhận` : ''}`}
                style={{
                  background: filter === tab ? c.chipActiveBg : c.chipBg,
                  color: filter === tab ? c.chipActiveText : c.chipText,
                  border: `1px solid ${filter === tab ? c.chipActiveBorder : c.chipBorder}`,
                  fontWeight: 600,
                  fontSize: 12,
                  minHeight: 36,
                }}
              >
                {tab} <span style={{ opacity: 0.6 }}>({count})</span>
                {claimableInCat > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full"
                    style={{
                      top: -6,
                      right: -4,
                      background: '#EF4444',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      width: 16,
                      height: 16,
                      boxShadow: '0 1px 3px rgba(239,68,68,0.4)',
                    }}
                  >
                    {claimableInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {sortedFilteredTasks.length === 0 && (
          <TrCard className="py-12 text-center">
            <Gift size={36} color={c.text3} className="mx-auto mb-3" />
            <p style={{ color: c.text2, fontSize: 14, fontWeight: 600 }}>Không có nhiệm vụ nào</p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
              Chọn danh mục khác hoặc quay lại sau
            </p>
          </TrCard>
        )}
        {sortedFilteredTasks.map(task => (
          <UnifiedTaskCard
            key={task.id}
            task={task}
            onClaim={handleClaimRequest}
            justClaimed={justClaimedIds.has(task.id)}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════
          ④ BONUS ZONE (Collapsible, default closed)
          ═══════════════════════════════════════ */}
      <CollapsibleSection
        title="Khu vực Bonus"
        icon={<Sparkles size={16} color="#F59E0B" />}
        iconColor="#F59E0B"
        defaultOpen={false}
        badge={
          <div className="flex items-center gap-1">
            {!hasSpunToday && (
              <span
                className="px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 9, fontWeight: 600 }}
              >
                1 lượt quay
              </span>
            )}
          </div>
        }
      >
        {/* Combo Multiplier */}
        <ComboMultiplierBanner completedToday={completedToday} streak={streak} />

        {/* Lucky Spin — compact */}
        <CompactSpinCard onSpin={handleSpin} hasSpunToday={hasSpunToday} />

        {/* Mystery Box — compact */}
        <CompactMysteryRow totalClaimed={claimedTasks.length} onOpen={handleOpenBox} openedBoxes={openedBoxes} />
      </CollapsibleSection>

      {/* ═══════════════════════════════════════
          ⑤ TIẾN TRÌNH (Collapsible, default open)
          ═══════════════════════════════════════ */}
      <CollapsibleSection
        title="Tiến trình & Phần thưởng"
        icon={<Crown size={16} color="#8B5CF6" />}
        iconColor="#8B5CF6"
        defaultOpen={true}
        badge={
          <span style={{ color: tier.current.color, fontSize: 10, fontWeight: 600 }}>
            {tier.current.emoji} {tier.current.label}
          </span>
        }
      >
        {/* Tier Progress — Animated */}
        <TrCard className="p-4 relative overflow-hidden">
          {/* Shimmer sweep across card */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${tier.current.color}08 45%, ${tier.current.color}12 50%, ${tier.current.color}08 55%, transparent 60%)`,
              zIndex: 0,
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />

          <div className="flex items-center gap-3 mb-3 relative z-10">
            {/* Tier badge with pulse ring + float */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: `2px solid ${tier.current.color}`, opacity: 0 }}
                animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${tier.current.color}15`, border: `1.5px solid ${tier.current.color}30` }}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.span
                  style={{ fontSize: 22 }}
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                >
                  {tier.current.emoji}
                </motion.span>
              </motion.div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <motion.p
                  style={{ color: tier.current.color, fontSize: 15, fontWeight: 700 }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {tier.current.label}
                </motion.p>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Crown size={13} color={tier.current.color} />
                </motion.div>
              </div>
              <motion.p
                style={{ color: c.text3, fontSize: 11, marginTop: 1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {tier.current.perks}
              </motion.p>
            </div>
          </div>

          {tier.next && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <motion.span
                  style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Đến {tier.next.emoji} {tier.next.label}
                </motion.span>
                <motion.span
                  style={{ color: tier.next.color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                  {tier.progressToNext}%
                </motion.span>
              </div>

              {/* Progress bar with animated fill + shine + glowing dot */}
              <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: c.surface2 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${tier.current.color}, ${tier.next.color})`,
                    boxShadow: `0 0 8px ${tier.current.color}40`,
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${tier.progressToNext}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {/* Shine sweep */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    width: '30%',
                  }}
                  animate={{ x: ['-30%', '400%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut', delay: 1.5 }}
                />
                {/* Glowing dot at progress tip */}
                <motion.div
                  className="absolute top-1/2 w-3.5 h-3.5 rounded-full"
                  style={{
                    translateY: '-50%',
                    background: '#fff',
                    boxShadow: `0 0 6px ${tier.next.color}, 0 0 12px ${tier.next.color}80`,
                    border: `1.5px solid ${tier.next.color}`,
                  }}
                  initial={{ left: '0%', opacity: 0, scale: 0 }}
                  animate={{
                    left: `calc(${tier.progressToNext}% - 7px)`,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <motion.span
                  style={{ color: c.text3, fontSize: 10 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {fmtPoints(arenaStats.pointsEarned)} / {fmtPoints(tier.next.minPoints)} pts
                </motion.span>
                <motion.span
                  style={{ color: c.text3, fontSize: 10 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Cần thêm {fmtPoints(tier.pointsToNext)} pts
                </motion.span>
              </div>
            </div>
          )}
          {!tier.next && (
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-lg relative z-10"
              style={{ background: 'rgba(139,92,246,0.08)' }}
              animate={{ boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 12px rgba(139,92,246,0.3)', '0 0 0px rgba(139,92,246,0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={13} color="#8B5CF6" />
              </motion.div>
              <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>Cấp độ cao nhất!</span>
            </motion.div>
          )}

          {/* Tier steps — connector line + stagger entrance */}
          <div className="relative mt-4 px-1 z-10">
            {/* Background connector */}
            <div
              className="absolute top-3.5 left-5 right-5 h-0.5 rounded-full"
              style={{ background: c.surface2 }}
            />
            {/* Animated progress connector */}
            <motion.div
              className="absolute top-3.5 left-5 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${tier.current.color}, ${tier.current.color}60)` }}
              initial={{ width: '0%' }}
              animate={{
                width: `${Math.min(100, (TIER_CONFIG.findIndex(t => t.id === tier.current.id) / Math.max(1, TIER_CONFIG.length - 1)) * 100)}%`,
              }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />

            <div className="flex items-center justify-between relative">
              {TIER_CONFIG.map((t, i) => {
                const isReached = arenaStats.pointsEarned >= t.minPoints;
                const isCurrent = t.id === tier.current.id;
                return (
                  <motion.div
                    key={t.id}
                    className="flex flex-col items-center gap-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.4 + i * 0.1 }}
                  >
                    <motion.div
                      className="w-7 h-7 rounded-full flex items-center justify-center relative"
                      style={{
                        background: isReached ? `${t.color}20` : c.surface2,
                        border: isCurrent ? `2px solid ${t.color}` : `1px solid ${isReached ? t.color + '40' : c.border}`,
                      }}
                      animate={isCurrent ? { scale: [1, 1.12, 1] } : {}}
                      transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                    >
                      <span style={{ fontSize: 11 }}>{t.emoji}</span>
                      {isCurrent && (
                        <motion.div
                          className="absolute -inset-1 rounded-full"
                          style={{ border: `1.5px solid ${t.color}`, opacity: 0 }}
                          animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <span style={{
                      color: isCurrent ? t.color : c.text3,
                      fontSize: 8,
                      fontWeight: isCurrent ? 700 : 500,
                    }}>
                      {t.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </TrCard>

        {/* Mini Leaderboard — top 3 only */}
        <TrCard overflow>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-2">
              <Trophy size={13} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Bảng xếp hạng</span>
            </div>
            <button
              onClick={() => { navigate(`${prefix}/arena/leaderboard`); hapticSelection(); }}
              className="flex items-center gap-1 active:opacity-70"
              style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 600, minHeight: 28 }}
            >
              Tất cả <ChevronRight size={10} />
            </button>
          </div>
          {/* Your rank */}
          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ background: 'rgba(139,92,246,0.04)', borderBottom: `1px solid ${c.divider}` }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.3)' }}
            >
              <span style={{ color: '#8B5CF6', fontSize: 9, fontWeight: 700 }}>#{arenaStats.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>Bạn</p>
            </div>
            <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtPoints(arenaStats.pointsEarned)} pts
            </span>
          </div>
          {leaderboardTop.map((entry, i) => (
            <div
              key={entry.rank}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < leaderboardTop.length - 1 ? `1px solid ${c.divider}` : 'none' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: ['rgba(245,158,11,0.15)', 'rgba(148,163,184,0.15)', 'rgba(205,127,50,0.15)'][i],
                }}
              >
                <span style={{ fontSize: 11 }}>
                  {['🥇', '🥈', '🥉'][i]}
                </span>
              </div>
              <span style={{ fontSize: 14 }}>{entry.avatar}</span>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }} className="truncate">{entry.name}</p>
              </div>
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(entry.points)}
              </span>
            </div>
          ))}
        </TrCard>

        {/* Đổi điểm Arena */}
        <div>
          <button
            onClick={() => { setShowRedeem(!showRedeem); hapticSelection(); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:opacity-70"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', minHeight: 44 }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={14} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Đổi điểm Arena</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(arenaBalance)} pts
              </span>
              <ChevronRight size={12} color="#8B5CF6" style={{ transform: showRedeem ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </button>

          <AnimatePresence>
            {showRedeem && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-col gap-2.5 mt-3">
                  {REDEMPTION_ITEMS.map(item => {
                    const canAfford = arenaBalance >= item.cost;
                    return (
                      <TrCard key={item.id} className="p-3.5" style={{ opacity: canAfford ? 1 : 0.5 }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}12`, fontSize: 18 }}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }} className="truncate">{item.title}</p>
                              {item.tag && (
                                <span
                                  className="px-1.5 py-0.5 rounded-md shrink-0"
                                  style={{
                                    background: item.tag === 'Mới' ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)',
                                    color: item.tag === 'Mới' ? '#8B5CF6' : '#F59E0B',
                                    fontSize: 9,
                                    fontWeight: 600,
                                  }}
                                >
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{item.desc}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                              {item.cost} pts
                            </span>
                            <button
                              onClick={() => handleRedeemRequest(item)}
                              className="px-2.5 py-1 rounded-lg flex items-center gap-1 active:opacity-70"
                              style={{
                                background: canAfford ? '#8B5CF6' : c.surface2,
                                color: canAfford ? '#fff' : c.text3,
                                minHeight: 28,
                              }}
                            >
                              <span style={{ fontSize: 10, fontWeight: 600 }}>
                                {canAfford ? 'Đổi' : 'Chưa đủ'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </TrCard>
                    );
                  })}
                  <div className="flex items-start gap-2 px-1">
                    <Info size={11} color={c.text3} className="shrink-0 mt-0.5" />
                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                      Ưu đãi có số lượng giới hạn. Points đã đổi không thể hoàn lại.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CollapsibleSection>

      {/* ═══════════════════════════════════════
          ⑥ FOOTER — Disclaimer + Terms
          ═══════════════════════════════════════ */}

      {/* Disclaimer + Terms */}
      <div className="flex flex-col gap-2">
        <TrCard className="p-3 flex items-start gap-2">
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Phần thưởng USDT và Points được tính dựa trên hoạt động thực tế. Combo nhân thưởng áp dụng trong ngày và reset lúc 00:00 UTC. Arena Points không phải tài sản tài chính.
          </p>
        </TrCard>

        {/* Terms & Conditions link */}
        <button
          onClick={() => { hapticSelection(); actionToast.info('Điều khoản chương trình phần thưởng'); }}
          className="flex items-center justify-center gap-2 py-2.5 active:opacity-70"
          style={{ minHeight: 44 }}
        >
          <FileText size={13} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 500 }}>Điều khoản & Điều kiện chương trình</span>
        </button>
      </div>
      </PageContent>

    </PullToRefresh>

      {/* ═══ CONFIRMATION DIALOGS (outside scroll container for correct fixed positioning) ═══ */}

      {/* Single claim confirmation */}
      <ConfirmationDialog
        open={confirmDialog.open && confirmDialog.type === 'claim'}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        variant="success"
        icon={<Gift size={28} color="#10B981" />}
        title="Nhận phần thưởng"
        confirmText="Xác nhận nhận"
        description={
          confirmDialog.data && confirmDialog.type === 'claim' ? (
            <div className="contents">
              <p style={{ marginBottom: 8 }}>{(confirmDialog.data as UnifiedTask).title}</p>
              <div className="flex items-center justify-center gap-3">
                {(confirmDialog.data as UnifiedTask).usdtReward && (
                  <div className="flex items-center gap-1">
                    <Gift size={12} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>{(confirmDialog.data as UnifiedTask).usdtReward}</span>
                  </div>
                )}
                {(confirmDialog.data as UnifiedTask).pointsReward && (
                  <div className="flex items-center gap-1">
                    <Zap size={12} color="#8B5CF6" />
                    <span style={{ color: '#8B5CF6', fontWeight: 700 }}>{(confirmDialog.data as UnifiedTask).pointsReward} pts</span>
                  </div>
                )}
              </div>
            </div>
          ) : ''
        }
      />

      {/* Batch claim confirmation */}
      <ConfirmationDialog
        open={confirmDialog.open && confirmDialog.type === 'batchClaim'}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        variant="warning"
        icon={<Package size={28} color="#F59E0B" />}
        title={`Nhận ${completedTasks.length} phần thưởng`}
        confirmText="Nhận tất cả"
        description="Xem lại chi tiết phần thưởng trước khi nhận:"
      >
        <BatchClaimPreview tasks={completedTasks} />
      </ConfirmationDialog>

      {/* Redeem confirmation */}
      <ConfirmationDialog
        open={confirmDialog.open && confirmDialog.type === 'redeem'}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        variant="info"
        icon={<ShoppingBag size={28} color="#8B5CF6" />}
        title="Xác nhận đổi điểm"
        confirmText="Đổi ngay"
        description={
          confirmDialog.data && confirmDialog.type === 'redeem' ? (
            <div className="contents">
              <p style={{ marginBottom: 8 }}>{(confirmDialog.data as typeof REDEMPTION_ITEMS[number]).title}</p>
              <div className="flex items-center justify-center gap-1">
                <Zap size={12} color="#8B5CF6" />
                <span style={{ color: '#8B5CF6', fontWeight: 700 }}>
                  -{(confirmDialog.data as typeof REDEMPTION_ITEMS[number]).cost} pts
                </span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: 11, marginTop: 8 }}>
                Points đã đổi không thể hoàn lại
              </p>
            </div>
          ) : ''
        }
      />
    </div>
  );
}

export default RewardsHubPage;