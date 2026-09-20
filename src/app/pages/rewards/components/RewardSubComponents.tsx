/**
 * Reward Sub-Components — Enterprise-level Fintech (v4)
 * ═══════════════════════════════════════════════════════
 * P0: Skeleton loading, accessibility (contrast, non-color indicators)
 * P1: Compact spin/mystery, collapsible sections
 * P2: Reduced motion, semantic tokens
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Gift, Zap, Timer, RotateCw, Star, Box,
  TrendingUp, Unlock, Lock, ChevronDown, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { fmtPoints, type DailyCheckIn } from '../../../data/arenaData';
import {
  type UnifiedTask,
  CONFETTI_COLORS,
  CATEGORY_CONFIG,
  getDaysUntilExpiry,
  isExpiringSoon,
  SPIN_PRIZES,
  MYSTERY_BOXES,
} from '../rewardsData';

/* ═══════════════════════════════════════════
   Skeleton Loading for Rewards Hub
   ═══════════════════════════════════════════ */

const shimmerCSS = `
@keyframes rwdShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}`;

function Shimmer({ style, className }: { style?: React.CSSProperties; className?: string }) {
  const c = useThemeColors();
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 37%, ${c.surface2} 63%)`,
        backgroundSize: '800px 100%',
        animation: 'rwdShimmer 1.8s ease-in-out infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

export function RewardsSkeletonLoading() {
  const c = useThemeColors();
  return (
    <div className="contents">
      <style>{shimmerCSS}</style>
      <div className="flex flex-col gap-4 px-5 pt-2">
        {/* Hero skeleton */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <Shimmer style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2">
              <Shimmer style={{ width: '65%', height: 16 }} />
              <Shimmer style={{ width: '45%', height: 12 }} />
            </div>
          </div>
          <div className="flex gap-3">
            <Shimmer style={{ flex: 1, height: 80, borderRadius: 12 }} />
            <Shimmer style={{ flex: 1, height: 80, borderRadius: 12 }} />
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          <Shimmer style={{ flex: 1, height: 56, borderRadius: 12 }} />
          <Shimmer style={{ flex: 1, height: 56, borderRadius: 12 }} />
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center justify-between">
          <Shimmer style={{ width: 100, height: 18 }} />
          <Shimmer style={{ width: 70, height: 14 }} />
        </div>

        {/* Filter chips skeleton */}
        <div className="flex gap-2">
          {[72, 64, 56, 72, 56].map((w, i) => (
            <Shimmer key={i} style={{ width: w, height: 32, borderRadius: 12, flexShrink: 0 }} />
          ))}
        </div>

        {/* Task cards skeleton */}
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}
          >
            <div className="flex items-start gap-3">
              <Shimmer style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-2">
                <Shimmer style={{ width: '70%', height: 14 }} />
                <Shimmer style={{ width: '90%', height: 12 }} />
                <Shimmer style={{ width: '100%', height: 6, borderRadius: 3 }} />
                <div className="flex items-center justify-between mt-1">
                  <Shimmer style={{ width: 80, height: 14 }} />
                  <Shimmer style={{ width: 60, height: 28, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Collapsible Section Wrapper
   ═══════════════════════════════════════════ */

export function CollapsibleSection({
  title,
  icon,
  iconColor,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-2 active:opacity-70"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}12` }}
        >
          {icon}
        </div>
        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, flex: 1, textAlign: 'left' }}>
          {title}
        </span>
        {badge && <div className="mr-2">{badge}</div>}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} color={c.text3} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-2 pb-1 flex flex-col gap-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Confetti Burst (simplified)
   ═══════════════════════════════════════════ */

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
  shape: 'circle' | 'rect' | 'star';
}

export function ConfettiBurst({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setTimeout(onComplete, 100);
      return;
    }

    const newParticles: ConfettiParticle[] = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 240,
      y: -(Math.random() * 160 + 40),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.12,
      shape: (['circle', 'rect', 'star'] as const)[Math.floor(Math.random() * 3)],
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete();
    }, 1200);
    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <div className="absolute top-1/2 left-1/2">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], scale: p.scale, rotate: p.rotation }}
            transition={{ duration: 1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
            style={{ width: p.shape === 'circle' ? 7 : 5, height: p.shape === 'circle' ? 7 : 8 }}
          >
            {p.shape === 'circle' ? (
              <div className="w-full h-full rounded-full" style={{ background: p.color }} />
            ) : p.shape === 'rect' ? (
              <div className="w-full h-full rounded-sm" style={{ background: p.color }} />
            ) : (
              <div style={{ color: p.color, fontSize: 10 }}>&#10022;</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Daily Check-in Row
   ═══════════════════════════════════════════ */

export function CheckInRow({ items, onClaim }: { items: DailyCheckIn[]; onClaim: (day: number) => void }) {
  const c = useThemeColors();

  return (
    <div className="flex gap-1.5">
      {items.map(item => {
        const isBonusDay = item.day === 7;
        return (
          <button
            key={item.day}
            onClick={() => item.isToday && !item.isClaimed ? onClaim(item.day) : undefined}
            disabled={item.isFuture || item.isClaimed}
            className="flex-1 flex flex-col items-center py-2 rounded-xl relative"
            aria-label={`Ngày ${item.day}${item.isClaimed ? ' - Đã nhận' : item.isToday ? ' - Nhận ngay' : ''}`}
            style={{
              background: item.isClaimed
                ? 'rgba(16,185,129,0.12)'
                : item.isToday
                  ? 'rgba(139,92,246,0.15)'
                  : c.surface2,
              border: item.isToday && !item.isClaimed
                ? '1.5px solid rgba(139,92,246,0.4)'
                : `1px solid ${item.isClaimed ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
              opacity: item.isFuture ? 0.4 : 1,
              minHeight: 48,
            }}
          >
            <span style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 2 }}>
              {item.isToday ? 'Hôm nay' : `N${item.day}`}
            </span>
            {item.isClaimed ? (
              <CheckCircle size={14} color="#10B981" />
            ) : (
              <span style={{ fontSize: isBonusDay ? 14 : 12 }}>{isBonusDay ? '🎁' : '🪙'}</span>
            )}
            <span style={{
              color: item.isClaimed ? '#10B981' : isBonusDay ? '#F59E0B' : c.text2,
              fontSize: 9,
              fontWeight: 600,
              marginTop: 2,
            }}>
              +{item.points}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Smart Prompt Banner
   ═══════════════════════════════════════════ */

export function SmartPromptBanner({
  completedCount,
  expiringCount,
  expiringTitle,
  onBatchClaim,
  onViewExpiring,
}: {
  completedCount: number;
  expiringCount: number;
  expiringTitle?: string;
  onBatchClaim: () => void;
  onViewExpiring?: () => void;
}) {
  const c = useThemeColors();

  if (completedCount === 0 && expiringCount === 0) return null;

  return (
    <div className="mx-5 mt-4 flex flex-col gap-2">
      {/* Batch Claim — prominent */}
      {completedCount > 0 && (
        <TrCard className="p-3.5 flex items-center gap-3" accentBorder="rgba(245,158,11,0.3)">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            <Gift size={18} color="#F59E0B" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
              {completedCount} phần thưởng chờ nhận
            </p>
            <p style={{ color: c.text3, fontSize: 11, marginTop: 1 }}>
              Bấm để xem chi tiết và nhận
            </p>
          </div>
          <button
            onClick={onBatchClaim}
            className="px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:opacity-70 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#000',
              minHeight: 40,
              boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
            }}
          >
            <Gift size={13} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>Nhận</span>
          </button>
        </TrCard>
      )}

      {/* Expiring warning — compact */}
      {expiringCount > 0 && (
        <TrCard
          className="px-3.5 py-3 flex items-center gap-2.5"
          accentBorder="rgba(239,68,68,0.2)"
        >
          <Timer size={15} color="#EF4444" className="shrink-0" />
          <p className="flex-1 min-w-0 truncate" style={{ color: c.text1, fontSize: 12 }}>
            <span style={{ color: '#EF4444', fontWeight: 600 }}>{expiringCount} nhiệm vụ</span>
            {' sắp hết hạn'}
            {expiringTitle && (
              <span style={{ color: c.text3 }}> — {expiringTitle}</span>
            )}
          </p>
          <button
            onClick={onViewExpiring}
            className="px-2.5 py-1 rounded-md shrink-0 active:opacity-70"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 10, fontWeight: 600, minHeight: 28 }}
          >
            Xem
          </button>
        </TrCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Unified Task Card (v2 — a11y improved)
   ═══════════════════════════════════════════ */

export function UnifiedTaskCard({
  task,
  onClaim,
  justClaimed,
}: {
  task: UnifiedTask;
  onClaim: (id: string) => void;
  justClaimed?: boolean;
}) {
  const c = useThemeColors();
  const cat = CATEGORY_CONFIG[task.category];
  const progressPct = Math.min(100, (task.progress / task.maxProgress) * 100);
  const isClaimable = task.status === 'completed';
  const expireDays = getDaysUntilExpiry(task.expiresAt);
  const expiring = isExpiringSoon(task.expiresAt);
  const hasDual = !!task.usdtReward && !!task.pointsReward;

  /* Status label — non-color indicator (a11y) */
  const statusLabel = task.status === 'claimed' || justClaimed
    ? 'Đã nhận'
    : isClaimable
      ? 'Chờ nhận'
      : task.status === 'expired'
        ? 'Hết hạn'
        : expiring
          ? `Còn ${expireDays === 0 ? 'hôm nay' : `${expireDays}d`}`
          : 'Đang làm';

  return (
    <motion.div
      layout
      animate={justClaimed ? {
        scale: [1, 1.02, 0.99, 1],
        boxShadow: [
          '0 0 0 0 rgba(16,185,129,0)',
          '0 0 0 4px rgba(16,185,129,0.2)',
          '0 0 0 8px rgba(16,185,129,0.05)',
          '0 0 0 0 rgba(16,185,129,0)',
        ],
      } : {}}
      transition={justClaimed ? { duration: 0.5, ease: 'easeOut' } : { layout: { duration: 0.3, ease: 'easeInOut' } }}
      className="rounded-2xl"
    >
      <TrCard
        className="p-4 relative overflow-hidden"
        accentBorder={justClaimed ? 'rgba(16,185,129,0.4)' : isClaimable ? 'rgba(245,158,11,0.3)' : expiring ? 'rgba(239,68,68,0.2)' : undefined}
        style={{ opacity: task.status === 'expired' ? 0.5 : 1 }}
      >
        {/* Claim success overlay */}
        <AnimatePresence>
          {justClaimed && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)' }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3 relative z-10">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: justClaimed ? 'rgba(16,185,129,0.15)' : cat.color + '15', fontSize: 20 }}
          >
            {justClaimed ? <CheckCircle size={22} color="#10B981" /> : task.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row + status badge (non-color a11y) */}
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }} className="truncate">{task.title}</span>
              {/* Category badge */}
              {(task.category === 'flash' || task.category === 'learn' || task.category === 'arena') && (
                <span
                  className="px-1.5 py-0.5 rounded-md shrink-0"
                  style={{
                    background: cat.color + '15',
                    color: cat.color,
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  {task.category === 'flash' ? 'Flash' : task.category === 'learn' ? 'Học' : 'Arena'}
                </span>
              )}
              {task.multiplier && task.multiplier > 1 && (
                <span
                  className="px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}
                >
                  x{task.multiplier}
                </span>
              )}
            </div>

            <p style={{ color: c.text2, fontSize: 12, marginTop: 2 }}>{task.description}</p>

            {/* Expiring warning — inline text (a11y: not just color) */}
            {expiring && task.status === 'active' && (
              <div className="flex items-center gap-1.5 mt-2">
                <Timer size={11} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>
                  {expireDays === 0 ? 'Hết hạn hôm nay!' : `Còn ${expireDays} ngày`}
                </span>
              </div>
            )}

            {/* Progress bar */}
            {task.status === 'active' && (
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    {task.maxProgress > 100
                      ? `${task.progress.toLocaleString()} / ${task.maxProgress.toLocaleString()}`
                      : `${task.progress} / ${task.maxProgress}`}
                  </span>
                  <span style={{ color: cat.color, fontSize: 10, fontWeight: 600 }}>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: c.surface2 }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ background: cat.color, width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Rewards + action */}
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {task.usdtReward && (
                  <div className="flex items-center gap-1">
                    <Gift size={11} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>{task.usdtReward}</span>
                  </div>
                )}
                {hasDual && <span style={{ color: c.text3, fontSize: 10 }}>+</span>}
                {task.pointsReward && (
                  <div className="flex items-center gap-1">
                    <Zap size={11} color="#8B5CF6" />
                    <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>{task.pointsReward} pts</span>
                  </div>
                )}
              </div>

              {/* Status indicator (text + icon, not just color) */}
              {isClaimable && !justClaimed && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onClaim(task.id)}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                  aria-label={`Nhận thưởng: ${task.title}`}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000',
                    minHeight: 32,
                  }}
                >
                  <Gift size={11} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Nhận</span>
                </motion.button>
              )}
              {(task.status === 'claimed' || justClaimed) && (
                <div className="flex items-center gap-1 shrink-0">
                  <CheckCircle size={13} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>Đã nhận</span>
                </div>
              )}
              {task.status === 'active' && !expiring && task.expiresAt && (
                <span className="shrink-0 flex items-center gap-1" style={{ color: c.text3, fontSize: 10 }}>
                  <Timer size={10} color={c.text3} />
                  {task.expiresAt.slice(5)}
                </span>
              )}
            </div>
          </div>
        </div>
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Compact Lucky Spin (no giant SVG wheel)
   ═══════════════════════════════════════════ */

export function CompactSpinCard({
  onSpin,
  hasSpunToday,
}: {
  onSpin: (prize: string) => void;
  hasSpunToday: boolean;
}) {
  const c = useThemeColors();
  const [spinning, setSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const handleSpin = () => {
    if (spinning || hasSpunToday) return;
    setSpinning(true);
    setSelectedPrize(null);

    const totalWeight = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let winIdx = 0;
    for (let i = 0; i < SPIN_PRIZES.length; i++) {
      rand -= SPIN_PRIZES[i].weight;
      if (rand <= 0) { winIdx = i; break; }
    }

    // Animate highlight cycling through prizes
    let tick = 0;
    const totalTicks = 24 + winIdx;
    const interval = setInterval(() => {
      setHighlightIdx(tick % SPIN_PRIZES.length);
      tick++;
      if (tick >= totalTicks) {
        clearInterval(interval);
        setHighlightIdx(winIdx);
        setSpinning(false);
        setSelectedPrize(SPIN_PRIZES[winIdx].label);
        onSpin(SPIN_PRIZES[winIdx].label);
      }
    }, spinning ? Math.min(60 + tick * 8, 200) : 100);

    return () => clearInterval(interval);
  };

  return (
    <TrCard className="p-4" accentBorder={hasSpunToday ? undefined : 'rgba(245,158,11,0.15)'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}
        >
          <RotateCw size={18} color="#F59E0B" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Vòng quay may mắn</p>
          <p style={{ color: c.text3, fontSize: 11, marginTop: 1 }}>
            {hasSpunToday ? 'Đã quay hôm nay' : 'Miễn phí 1 lượt/ngày'}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: hasSpunToday ? 'rgba(148,163,184,0.1)' : 'rgba(16,185,129,0.1)' }}
        >
          <Star size={10} color={hasSpunToday ? '#94A3B8' : '#10B981'} />
          <span style={{ color: hasSpunToday ? '#94A3B8' : '#10B981', fontSize: 9, fontWeight: 700 }}>
            {hasSpunToday ? '0/1' : '1/1'}
          </span>
        </div>
      </div>

      {/* Prize grid (compact) */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {SPIN_PRIZES.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-center py-2.5 rounded-lg transition-all"
            style={{
              background: highlightIdx === i
                ? `${p.color}25`
                : selectedPrize === p.label
                  ? `${p.color}20`
                  : c.surface2,
              border: highlightIdx === i
                ? `2px solid ${p.color}`
                : selectedPrize === p.label
                  ? `2px solid ${p.color}`
                  : `1px solid ${c.border}`,
              transform: highlightIdx === i ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <span style={{ color: highlightIdx === i || selectedPrize === p.label ? p.color : c.text2, fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      {selectedPrize && (
        <div
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <Gift size={14} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
            Bạn nhận: {selectedPrize}
          </span>
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || hasSpunToday}
        className="w-full rounded-xl flex items-center justify-center gap-2 active:opacity-70"
        style={{
          background: hasSpunToday
            ? c.surface2
            : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: hasSpunToday ? c.text3 : '#000',
          minHeight: 44,
          opacity: hasSpunToday ? 0.5 : 1,
        }}
      >
        <RotateCw size={14} className={spinning ? 'animate-spin' : ''} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          {hasSpunToday ? 'Đã quay hôm nay' : spinning ? 'Đang quay...' : 'Quay ngay'}
        </span>
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Combo Multiplier Banner (v2 — no infinite anim)
   ═══════════════════════════════════════════ */

export function ComboMultiplierBanner({ completedToday, streak }: { completedToday: number; streak: number }) {
  const c = useThemeColors();

  const getMultiplier = () => {
    if (completedToday >= 5) return { value: '2.0', label: 'MAX COMBO', color: '#EF4444' };
    if (completedToday >= 3) return { value: '1.5', label: 'Combo x1.5', color: '#F59E0B' };
    if (completedToday >= 1) return { value: '1.2', label: 'Combo x1.2', color: '#10B981' };
    return { value: '1.0', label: 'Chưa kích hoạt', color: c.text3 };
  };

  const combo = getMultiplier();
  const nextMilestone = completedToday < 1 ? 1 : completedToday < 3 ? 3 : completedToday < 5 ? 5 : null;
  const milestones = [
    { at: 1, mult: '1.2x', color: '#10B981' },
    { at: 3, mult: '1.5x', color: '#F59E0B' },
    { at: 5, mult: '2.0x', color: '#EF4444' },
  ];

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: combo.value !== '1.0' ? `${combo.color}15` : c.surface2 }}
        >
          <TrendingUp size={18} color={combo.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ color: combo.color, fontSize: 16, fontWeight: 700 }}>x{combo.value}</span>
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: `${combo.color}12`, color: combo.color, fontSize: 9, fontWeight: 700 }}
            >
              {combo.label}
            </span>
          </div>
          <p style={{ color: c.text3, fontSize: 11, marginTop: 2 }}>
            {combo.value === '1.0'
              ? 'Hoàn thành NV để kích hoạt'
              : `Thưởng x${combo.value} cho NV tiếp theo`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p style={{ color: combo.color, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
            {completedToday}
          </p>
          <p style={{ color: c.text3, fontSize: 9 }}>hôm nay</p>
        </div>
      </div>

      {/* Milestone progress */}
      <div className="flex items-center gap-1 mt-3">
        {milestones.map((m, i) => {
          const reached = completedToday >= m.at;
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: reached ? m.color : c.surface2 }} />
              <span style={{ color: reached ? m.color : c.text3, fontSize: 8, fontWeight: 700 }}>
                {m.mult}
              </span>
            </div>
          );
        })}
      </div>
      {nextMilestone && (
        <p style={{ color: c.text3, fontSize: 10, marginTop: 4, textAlign: 'center' }}>
          Thêm <span style={{ color: combo.value !== '1.0' ? combo.color : '#10B981', fontWeight: 700 }}>{nextMilestone - completedToday}</span> NV để tăng nhân thưởng
        </p>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Compact Mystery Box Row (inline, not grid)
   ═══════════════════════════════════════════ */

export function CompactMysteryRow({
  totalClaimed,
  onOpen,
  openedBoxes,
}: {
  totalClaimed: number;
  onOpen: (boxId: string) => void;
  openedBoxes: Set<string>;
}) {
  const c = useThemeColors();

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Box size={14} color="#8B5CF6" />
        <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
          Hộp quà bí ẩn
        </span>
        <span style={{ color: c.text3, fontSize: 10, marginLeft: 'auto' }}>
          {openedBoxes.size}/{MYSTERY_BOXES.length} đã mở
        </span>
      </div>

      <div className="flex gap-2">
        {MYSTERY_BOXES.map(box => {
          const canOpen = totalClaimed >= box.requiredTasks && !openedBoxes.has(box.id);
          const isOpened = openedBoxes.has(box.id);
          const isLocked = totalClaimed < box.requiredTasks;
          const progress = Math.min(100, (totalClaimed / box.requiredTasks) * 100);

          return (
            <div
              key={box.id}
              className="flex-1 flex flex-col items-center py-3 rounded-xl relative"
              style={{
                background: canOpen ? `${box.color}08` : c.surface2,
                border: canOpen ? `1.5px solid ${box.color}40` : `1px solid ${c.border}`,
                opacity: isLocked ? 0.55 : 1,
              }}
            >
              <span style={{ fontSize: 22 }}>{isOpened ? '🎊' : box.emoji}</span>
              <span style={{ color: box.color, fontSize: 10, fontWeight: 700, marginTop: 3 }}>
                {box.label}
              </span>

              {isLocked && (
                <div className="w-4/5 mt-2">
                  <div className="h-1 rounded-full" style={{ background: c.surface3 }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, background: box.color }}
                    />
                  </div>
                  <span style={{ color: c.text3, fontSize: 8, display: 'block', textAlign: 'center', marginTop: 2 }}>
                    {totalClaimed}/{box.requiredTasks}
                  </span>
                </div>
              )}

              {canOpen && (
                <button
                  onClick={() => onOpen(box.id)}
                  className="mt-2 px-3 py-1 rounded-lg active:opacity-70"
                  style={{
                    background: box.color,
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    minHeight: 26,
                  }}
                >
                  Mở
                </button>
              )}

              {isOpened && (
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle size={10} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Đã mở</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   Balance Breakdown (Hero)
   ═══════════════════════════════════════════ */

export function BalanceBreakdown({ totalBalance, lockedBalance }: { totalBalance: number; lockedBalance: number }) {
  const availableBalance = totalBalance - lockedBalance;
  const lockedPct = totalBalance > 0 ? Math.round((lockedBalance / totalBalance) * 100) : 0;

  return (
    <div className="mt-3 relative z-10">
      <div className="h-2 rounded-full flex overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-l-full" style={{ width: `${100 - lockedPct}%`, background: '#10B981' }} />
        <div className="h-full rounded-r-full" style={{ width: `${lockedPct}%`, background: '#F59E0B' }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Unlock size={11} color="#10B981" />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Khả dụng</span>
          <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtPoints(availableBalance)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={11} color="#F59E0B" />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Đang khóa</span>
          <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtPoints(lockedBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Batch Claim Preview (for ConfirmationDialog)
   ═══════════════════════════════════════════ */

export function BatchClaimPreview({ tasks }: { tasks: UnifiedTask[] }) {
  const c = useThemeColors();
  const totalUsdt = tasks.reduce((s, t) => {
    const m = t.usdtReward?.match(/([\d.]+)/);
    return s + (m ? parseFloat(m[1]) : 0);
  }, 0);
  const totalPts = tasks.reduce((s, t) => s + (t.pointsReward ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Summary */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
      >
        <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Bạn sẽ nhận</span>
        <div className="flex items-center gap-3">
          {totalUsdt > 0 && (
            <div className="flex items-center gap-1">
              <Gift size={12} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {totalUsdt.toFixed(1)} USDT
              </span>
            </div>
          )}
          {totalPts > 0 && (
            <div className="flex items-center gap-1">
              <Zap size={12} color="#8B5CF6" />
              <span style={{ color: '#8B5CF6', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(totalPts)} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Item list */}
      <div className="max-h-40 overflow-y-auto rounded-xl" style={{ border: `1px solid ${c.border}` }}>
        {tasks.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-3 py-2"
            style={{ borderBottom: i < tasks.length - 1 ? `1px solid ${c.border}` : 'none' }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span className="flex-1 truncate" style={{ color: c.text1, fontSize: 11, fontWeight: 500 }}>
              {t.title}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {t.usdtReward && <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>{t.usdtReward}</span>}
              {t.pointsReward && <span style={{ color: '#8B5CF6', fontSize: 10, fontWeight: 600 }}>{t.pointsReward}pts</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}