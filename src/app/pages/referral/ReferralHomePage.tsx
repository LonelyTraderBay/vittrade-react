import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy, Gift, Users, Share2, CheckCircle, X,
  ChevronRight, Award, Clock, UserCheck, TrendingUp,
  AlertTriangle, Shield, Bell, Trophy, Target,
  Calculator, Zap, Timer,
  ChevronDown, ChevronUp,
  Sparkles, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { USER_PROFILE } from '../../data/mockData';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { fmtUsd } from '../../data/formatNumber';
import {
  REFERRAL_FRIENDS,
  getReferralStats,
  getCurrentTier,
  REFERRAL_LEADERBOARD,
  REFERRAL_MILESTONES,
  ACTIVE_CAMPAIGN,
  REFERRAL_SOCIAL_PROOF,
  PENDING_COMMISSION_DETAILS,
  SHARE_TEMPLATES,
  QR_CODE_MATRIX,
  CAMPAIGN_HISTORY,
} from '../../data/referralData';
import { φ, φIcon, φRadius, φSpace } from '../../utils/golden';

/* ═══════════════════════════════════════════════════════════
   SPACING CONSTANTS — 8pt rhythm (Guidelines §2.3)
   ═══════════════════════════════════════════════════════════
   Notification zone internal:  8px  (φSpace[3])
   Section gap (PageContent):  16px  (gap="default")
   Card internal padding:      16px  (p-4)
   Sub-item gap:                8px  (gap-2)
   ═══════════════════════════════════════════════════════════ */

const S = {
  /** Gap inside notification zone */
  notifyGap: φSpace[3],    // 8px
  /** Standard section gap — managed by PageContent gap="default" = 16px */
  /** Card inner padding */
  cardPad: 16,
  /** Sub-item gap */
  itemGap: φSpace[3],      // 8px
} as const;

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function CampaignBanner({ c }: { c: ReturnType<typeof useThemeColors> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          padding: S.cardPad,
          background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
          border: '1px solid rgba(251,146,60,0.3)',
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        />
        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.25) 0%, transparent 65%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,146,60,0.2)', border: '1.5px solid rgba(251,146,60,0.3)' }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap size={φIcon.md} color="#FB923C" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p style={{ color: '#FED7AA', fontSize: φ.body, fontWeight: 700 }}>{ACTIVE_CAMPAIGN.title}</p>
              <motion.span
                className="px-2 py-0.5 rounded-md"
                style={{ background: '#FB923C', color: '#000', fontSize: 9, fontWeight: 800 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {ACTIVE_CAMPAIGN.bonusLabel}
              </motion.span>
            </div>
            <p style={{ color: 'rgba(254,215,170,0.7)', fontSize: φ.xs, lineHeight: 1.3 }}>
              {ACTIVE_CAMPAIGN.description}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Timer size={φ.xs} color="#FB923C" />
                <span style={{ color: '#FB923C', fontSize: φ.xs, fontWeight: 700 }}>
                  Còn {ACTIVE_CAMPAIGN.daysLeft} ngày
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={φ.xs} color="rgba(254,215,170,0.5)" />
                <span style={{ color: 'rgba(254,215,170,0.5)', fontSize: φ.xs }}>
                  {ACTIVE_CAMPAIGN.totalParticipants.toLocaleString()} tham gia
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 rounded-lg mt-3"
          style={{ padding: '6px 10px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <Trophy size={φIcon.sm} color="#FB923C" />
          <span style={{ color: 'rgba(254,215,170,0.8)', fontSize: φ.xs, lineHeight: 1.3 }}>
            {ACTIVE_CAMPAIGN.extraReward}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SocialProofRow({ c }: { c: ReturnType<typeof useThemeColors> }) {
  const items = [
    { value: (REFERRAL_SOCIAL_PROOF.totalReferrers / 1000).toFixed(1) + 'K+', label: 'Người giới thiệu', IconComp: Users, color: '#3B82F6' },
    { value: '$' + (REFERRAL_SOCIAL_PROOF.totalEarnedAll / 1_000_000).toFixed(1) + 'M+', label: 'Tổng đã trả', IconComp: Gift, color: '#10B981' },
    { value: REFERRAL_SOCIAL_PROOF.successRate + '%', label: 'Tỷ lệ KYC', IconComp: UserCheck, color: '#8B5CF6' },
    { value: '$' + REFERRAL_SOCIAL_PROOF.avgMonthlyEarning, label: 'TB/tháng', IconComp: TrendingUp, color: '#F59E0B' },
  ];
  return (
    <div className="flex gap-2 -mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {items.map((s) => (
        <div key={s.label} className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: s.color + '08', border: '1px solid ' + s.color + '15' }}>
          <s.IconComp size={φIcon.sm} color={s.color} />
          <div>
            <p style={{ color: s.color, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
            <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MilestoneRow({ c, stats }: { c: ReturnType<typeof useThemeColors>; stats: ReturnType<typeof getReferralStats> }) {
  const nextMilestone = REFERRAL_MILESTONES.find(m => !m.claimed);
  const friendsToNext = nextMilestone ? nextMilestone.friends - stats.totalFriends : 0;
  const actionToast = useActionToast();
  const { hapticSelection } = useHaptic();
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = (milestoneId: string, reward: string) => {
    hapticSelection();
    setClaimingId(milestoneId);
    setTimeout(() => {
      setClaimedIds(prev => new Set(prev).add(milestoneId));
      setClaimingId(null);
      actionToast.success({ title: 'Nhận thưởng thành công!', description: `+${reward} đã cộng vào ví USDT` });
    }, 1200);
  };

  return (
    <div>
      <SectionHeader
        title="Mốc thành tích"
        accent
        accentColor="#F59E0B"
        mb={S.itemGap}
        right={nextMilestone ? (
          <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
            Còn {friendsToNext > 0 ? friendsToNext : 0} bạn
          </span>
        ) : undefined}
      />
      <div className="flex gap-2 -mx-5 px-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {REFERRAL_MILESTONES.map((m, i) => {
          const isAlreadyClaimed = m.claimed || claimedIds.has(m.id);
          const isClaimable = !isAlreadyClaimed && stats.totalFriends >= m.friends;
          const isClaiming = claimingId === m.id;
          const isNext = m.id === nextMilestone?.id && !isClaimable;
          const isLocked = !isAlreadyClaimed && !isClaimable && !isNext;
          const progressToThis = Math.min(100, (stats.totalFriends / m.friends) * 100);
          return (
            <motion.div
              key={m.id}
              className="shrink-0 rounded-2xl p-3 relative overflow-hidden"
              style={{
                width: 120,
                background: isAlreadyClaimed ? 'rgba(16,185,129,0.06)' : isClaimable ? 'rgba(59,130,246,0.06)' : isNext ? 'rgba(245,158,11,0.06)' : c.surface2,
                border: '1.5px solid ' + (isAlreadyClaimed ? 'rgba(16,185,129,0.2)' : isClaimable ? 'rgba(59,130,246,0.3)' : isNext ? 'rgba(245,158,11,0.25)' : c.border),
                opacity: isLocked ? 0.5 : 1,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLocked ? 0.5 : 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {isClaimable && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(59,130,246,0.08) 50%, transparent 60%)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                />
              )}
              {isNext && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(245,158,11,0.06) 50%, transparent 60%)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                />
              )}
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                {isAlreadyClaimed && <CheckCircle size={φ.body} color="#10B981" />}
                {isClaimable && !isClaiming && (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Gift size={φ.body} color="#3B82F6" />
                  </motion.div>
                )}
                {isNext && (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Target size={φ.body} color="#F59E0B" />
                  </motion.div>
                )}
              </div>
              <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }} className="relative z-10">
                {m.friends} bạn bè
              </p>
              <p style={{ color: isAlreadyClaimed ? '#10B981' : isClaimable ? '#3B82F6' : isNext ? '#F59E0B' : c.text3, fontSize: φ.xs, fontWeight: 600, lineHeight: 1.3 }} className="relative z-10">
                {m.reward}
              </p>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }} className="relative z-10">
                {m.description}
              </p>

              {isClaimable && (
                <motion.button
                  onClick={() => handleClaim(m.id, m.reward)}
                  disabled={isClaiming}
                  className="w-full mt-2 rounded-lg flex items-center justify-center gap-1 relative z-10"
                  style={{
                    minHeight: 28,
                    background: isClaiming ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    color: isClaiming ? '#3B82F6' : '#fff',
                    fontSize: φ.xs, fontWeight: 700,
                    border: isClaiming ? '1px solid rgba(59,130,246,0.2)' : 'none',
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isClaiming ? (
                    <motion.div
                      className="w-3.5 h-3.5 border-2 rounded-full"
                      style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <div className="contents">
                      <Gift size={φ.xs} />
                      <span>Nhận thưởng</span>
                    </div>
                  )}
                </motion.button>
              )}

              {isNext && (
                <div className="mt-2 relative z-10">
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: '#F59E0B' }}
                      initial={{ width: '0%' }}
                      animate={{ width: progressToThis + '%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <p style={{ color: '#F59E0B', fontSize: 8, fontWeight: 600, marginTop: 2, textAlign: 'center' }}>
                    {stats.totalFriends}/{m.friends}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function EarningCalculator({ c, stats }: { c: ReturnType<typeof useThemeColors>; stats: ReturnType<typeof getReferralStats> }) {
  const [showCalc, setShowCalc] = useState(false);
  const [calcFriends, setCalcFriends] = useState(10);
  const [calcVolume, setCalcVolume] = useState(5000);
  const { hapticSelection } = useHaptic();

  const estimate = useMemo(() => {
    const tier = getCurrentTier(stats.totalFriends + calcFriends);
    const commPct = tier.current.commission / 100;
    const monthlyComm = calcFriends * calcVolume * 0.001 * commPct;
    const kycBonus = calcFriends * tier.current.kycBonus;
    const yearlyComm = monthlyComm * 12;
    return { monthlyComm, kycBonus, yearlyComm, tier: tier.current };
  }, [calcFriends, calcVolume, stats.totalFriends]);

  return (
    <div>
      <button
        onClick={() => { setShowCalc(!showCalc); hapticSelection(); }}
        className="w-full flex items-center justify-between rounded-2xl active:opacity-80"
        style={{
          padding: S.cardPad,
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.15)',
          minHeight: 52,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Calculator size={18} color="#3B82F6" />
          </div>
          <div className="text-left">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>Tính thu nhập ước tính</p>
            <p style={{ color: c.text3, fontSize: φ.xs }}>Xem bạn có thể kiếm bao nhiêu</p>
          </div>
        </div>
        {showCalc ? <ChevronUp size={16} color="#3B82F6" /> : <ChevronDown size={16} color="#3B82F6" />}
      </button>

      <AnimatePresence>
        {showCalc && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <TrCard className="p-4" style={{ marginTop: S.itemGap }}>
              <div style={{ marginBottom: S.cardPad }}>
                <div className="flex items-center justify-between" style={{ marginBottom: S.itemGap }}>
                  <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>Số bạn bè mời thêm</span>
                  <span style={{ color: '#3B82F6', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>{calcFriends}</span>
                </div>
                <input
                  type="range" min={1} max={100} value={calcFriends}
                  onChange={e => setCalcFriends(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #3B82F6 ' + calcFriends + '%, ' + c.surface2 + ' ' + calcFriends + '%)' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: 9 }}>1</span>
                  <span style={{ color: c.text3, fontSize: 9 }}>100</span>
                </div>
              </div>

              <div style={{ marginBottom: S.cardPad }}>
                <div className="flex items-center justify-between" style={{ marginBottom: S.itemGap }}>
                  <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>KL GD TB/bạn/tháng</span>
                  <span style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>${calcVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={500} max={50000} step={500} value={calcVolume}
                  onChange={e => setCalcVolume(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #10B981 ' + ((calcVolume - 500) / 49500 * 100) + '%, ' + c.surface2 + ' ' + ((calcVolume - 500) / 49500 * 100) + '%)' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ color: c.text3, fontSize: 9 }}>$500</span>
                  <span style={{ color: c.text3, fontSize: 9 }}>$50,000</span>
                </div>
              </div>

              <div className="rounded-2xl p-3" style={{ background: c.surface2, border: '1px solid ' + c.border }}>
                <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 500, marginBottom: S.itemGap }}>
                  Hạng ước tính: <span style={{ color: estimate.tier.color, fontWeight: 700 }}>{estimate.tier.icon} {estimate.tier.name} ({estimate.tier.commission}%)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p style={{ color: '#8B5CF6', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>${estimate.kycBonus}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Thưởng KYC</p>
                    <p style={{ color: c.text3, fontSize: 8, opacity: 0.7 }}>1 lần</p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>${estimate.monthlyComm.toFixed(0)}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Hoa hồng/tháng</p>
                    <p style={{ color: c.text3, fontSize: 8, opacity: 0.7 }}>ước tính</p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: '#F59E0B', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>${estimate.yearlyComm.toFixed(0)}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Hoa hồng/năm</p>
                    <p style={{ color: c.text3, fontSize: 8, opacity: 0.7 }}>ước tính</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle size={φ.xs} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.3 }}>
                  Ước tính dựa trên phí GD trung bình ~0.1%. Kết quả thực tế có thể khác.
                </p>
              </div>
            </TrCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaderboardSection({ c, stats }: { c: ReturnType<typeof useThemeColors>; stats: ReturnType<typeof getReferralStats> }) {
  return (
    <div>
      <SectionHeader
        title="Bảng xếp hạng"
        accent
        accentColor="#8B5CF6"
        mb={S.itemGap}
        right={<span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Tháng 3/2026</span>}
      />
      <TrCard overflow>
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.04)', borderBottom: '1px solid ' + c.divider }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
            <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 700 }}>#42</span>
          </div>
          <span style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>Bạn</span>
          <div className="flex-1" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontFamily: 'monospace' }}>{stats.totalFriends} bạn</span>
          <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace', marginLeft: 8 }}>
            {fmtUsd(stats.totalCommission)}
          </span>
        </div>

        {REFERRAL_LEADERBOARD.slice(0, 5).map((entry, i) => {
          const rankBgs = ['rgba(245,158,11,0.15)', 'rgba(148,163,184,0.15)', 'rgba(205,127,50,0.15)'];
          const rankIcons = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
          return (
            <div key={entry.rank} className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < 4 ? '1px solid ' + c.divider : 'none' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: i < 3 ? rankBgs[i] : c.surface2 }}>
                {i < 3
                  ? <span style={{ fontSize: 12 }}>{rankIcons[i]}</span>
                  : <span style={{ color: c.text3, fontSize: 9, fontWeight: 700 }}>#{entry.rank}</span>
                }
              </div>
              <span style={{ fontSize: φ.body }}>{entry.avatar}</span>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{entry.name}</p>
                <p style={{ color: c.text3, fontSize: 9 }}>{entry.tierIcon} {entry.tier}</p>
              </div>
              <div className="text-right shrink-0">
                <p style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace' }}>
                  ${entry.totalEarned.toLocaleString()}
                </p>
                <p style={{ color: c.text3, fontSize: 9 }}>{entry.friends} bạn</p>
              </div>
            </div>
          );
        })}
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export function ReferralHomePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { hapticSelection } = useHaptic();
  const [copied, setCopied] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const referralLink = 'https://vittrade.app/ref/' + USER_PROFILE.referralCode;
  const stats = getReferralStats();
  const { current: currentTier, next: nextTier } = getCurrentTier(stats.totalFriends);

  const pendingKycCount = REFERRAL_FRIENDS.filter(f => f.status === 'pending_kyc').length;

  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHasAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const progressPct = nextTier ? Math.min(100, (stats.totalFriends / nextTier.friends) * 100) : 100;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    actionToast.success(TOAST.COPY.REFERRAL);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageLayout>
      <Header title="Giới thiệu bạn bè" subtitle="Chương trình · Referral" back />

      {/* Share Bottom Sheet — portaled to AppLayout root */}
      {createPortal(
        <AnimatePresence>
          {showShareSheet && (
            <motion.div
              className="absolute inset-0 z-50 flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowShareSheet(false)}
            >
              <motion.div
                className="w-full rounded-t-3xl flex flex-col"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                style={{ background: c.surface, border: '1px solid ' + c.borderSolid, maxWidth: 440, margin: '0 auto', maxHeight: '85%' }}
                onClick={e => e.stopPropagation()}
              >
                {/* ── Fixed top section ── */}
                <div className="shrink-0 px-6 pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Chia sẻ mã giới thiệu</h3>
                    <button onClick={() => setShowShareSheet(false)} style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={20} color={c.text2} />
                    </button>
                  </div>

                  <div className="rounded-2xl px-3 py-2.5 mb-3 flex items-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Gift size={φ.body} color="#10B981" />
                    <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.4 }}>
                      Bạn bè nhận: <span style={{ color: '#10B981', fontWeight: 700 }}>5 USDT</span> + giảm 10% phí GD 30 ngày
                    </span>
                  </div>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ scrollbarWidth: 'none' }}>
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-40 h-40 rounded-2xl flex items-center justify-center mb-3 p-2.5"
                      style={{ background: '#fff', border: '2px solid #E5E7EB' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(21, 1fr)', gap: 0, width: '100%', height: '100%' }}>
                        {QR_CODE_MATRIX.flat().map((cell, i) => (
                          <div key={i} style={{
                            background: cell === 1 ? '#1F2937' : '#FFFFFF',
                            borderRadius: cell === 1 ? 1 : 0,
                          }} />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: c.text2, fontSize: φ.sm, textAlign: 'center' }}>
                      Quét QR hoặc chia sẻ link bên dưới
                    </p>
                  </div>

                  <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2"
                    style={{ background: c.surface2, border: '1px solid ' + c.borderSolid }}>
                    <span style={{ color: c.text2, fontSize: φ.sm, flex: 1, wordBreak: 'break-all' }}>{referralLink}</span>
                    <button onClick={() => handleCopy(referralLink)}
                      style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {copied ? <CheckCircle size={18} color="#10B981" /> : <Copy size={18} color="#3B82F6" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Zalo', 'Facebook', 'Telegram'].map(app => (
                      <button key={app} className="py-3 rounded-2xl"
                        onClick={() => {
                          hapticSelection();
                          const tpl = SHARE_TEMPLATES.find(t => t.id === selectedTemplate);
                          const msg = tpl ? tpl.generateMessage(USER_PROFILE.referralCode, referralLink) : referralLink;
                          navigator.clipboard?.writeText(msg).catch(() => {});
                          actionToast.success('Đã sao chép tin nhắn để gửi qua ' + app);
                        }}
                        style={{ background: c.surface2, color: c.text1, border: '1px solid ' + c.borderSolid, minHeight: 48, fontSize: φ.body, fontWeight: 600 }}>
                        {app}
                      </button>
                    ))}
                  </div>

                  {/* ─── Custom Share Templates ─── */}
                  <div style={{ marginTop: 20 }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={φ.body} color="#8B5CF6" />
                      <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>Mẫu tin nhắn</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {SHARE_TEMPLATES.map(tpl => {
                        const isSelected = selectedTemplate === tpl.id;
                        const catColors: Record<string, string> = { casual: '#3B82F6', professional: '#10B981', festive: '#F59E0B' };
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(isSelected ? null : tpl.id)}
                            className="rounded-xl p-3 text-left"
                            style={{
                              background: isSelected ? c.chipActiveBg : c.surface2,
                              border: '1.5px solid ' + (isSelected ? c.chipActiveBorder : c.border),
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ fontSize: φ.base }}>{tpl.emoji}</span>
                              <span style={{ color: isSelected ? c.chipActiveText : c.text1, fontSize: φ.sm, fontWeight: 600 }}>{tpl.name}</span>
                              <span className="px-1.5 py-0.5 rounded-md"
                                style={{ background: catColors[tpl.category] + '15', color: catColors[tpl.category], fontSize: 9, fontWeight: 600 }}>
                                {tpl.category === 'casual' ? 'Thường' : tpl.category === 'professional' ? 'Pro' : 'Sự kiện'}
                              </span>
                            </div>
                            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }} className="truncate">{tpl.preview}</p>
                            {isSelected && (
                              <div className="mt-2 rounded-lg p-2.5" style={{ background: c.surface }}>
                                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                  {tpl.generateMessage(USER_PROFILE.referralCode, referralLink)}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const msg = tpl.generateMessage(USER_PROFILE.referralCode, referralLink);
                                    navigator.clipboard?.writeText(msg).catch(() => {});
                                    actionToast.success('Đã sao chép tin nhắn "' + tpl.name + '"');
                                  }}
                                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg"
                                  style={{ minHeight: 36, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff', fontSize: φ.sm, fontWeight: 600 }}
                                >
                                  <Copy size={φIcon.sm} />
                                  Sao chép tin nhắn này
                                </button>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-start gap-2 mt-3">
                      <MessageSquare size={φ.xs} color={c.text3} className="shrink-0 mt-0.5" />
                      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4 }}>
                        Chọn mẫu rồi bấm nút mạng xã hội ở trên. Tin nhắn sẽ tự động sao chép vào clipboard.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById('app-layout-root') || document.body
      )}

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
        <PageContent gap="default">

          {/* ═══════ ZONE 1: Notifications — tight 8px gap ═══════ */}
          <div className="flex flex-col" style={{ gap: S.notifyGap }}>
            <CampaignBanner c={c} />

            {/* Anti-abuse Warning */}
            <div className="rounded-2xl flex items-start gap-3"
              style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Shield size={φ.base} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
                Nghiêm cấm tự giới thiệu, tạo tài khoản ảo, hoặc gian lận hoa hồng.
                Vi phạm sẽ bị khóa tài khoản và thu hồi thưởng.
              </p>
            </div>

            {/* Pending KYC Reminder */}
            {pendingKycCount > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                <button
                  onClick={() => navigate(prefix + '/referral/history', { replace: true })}
                  className="rounded-2xl flex items-center gap-3 w-full"
                  style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', minHeight: 48 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <Bell size={φ.body} color="#3B82F6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                      {pendingKycCount} bạn bè chưa hoàn tất KYC
                    </p>
                    <p style={{ color: c.text3, fontSize: φ.xs }}>
                      Nhắc họ để nhận thưởng {fmtUsd(currentTier.kycBonus)} USDT/người
                    </p>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </button>
              </motion.div>
            )}
          </div>

          {/* ═══════ ZONE 2: Hero Card — primary content ═══════ */}
          <div className="rounded-2xl relative overflow-hidden"
            style={{ padding: 20, background: c.portfolioBg, border: '1px solid ' + c.portfolioBorder, boxShadow: c.portfolioShadow }}>
            <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)' }} />

            <motion.div className="flex items-center gap-3 relative z-10"
              style={{ marginBottom: S.cardPad }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, ' + currentTier.color + '33, ' + currentTier.color + '22)',
                  border: '1px solid ' + currentTier.color + '44',
                }}
                animate={{ boxShadow: ['0 0 0px ' + currentTier.color + '00', '0 0 20px ' + currentTier.color + '40', '0 0 0px ' + currentTier.color + '00'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span style={{ fontSize: 22 }}>{currentTier.icon}</span>
              </motion.div>
              <div>
                <p style={{ color: c.portfolioTextDim, fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Hạng {currentTier.name}</p>
                <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs, opacity: 0.7 }}>{currentTier.nameEn}</p>
                <p style={{ color: c.portfolioTextMuted, fontSize: φ.sm, marginTop: 2 }}>
                  Hoa hồng {currentTier.commission}% + {fmtUsd(currentTier.kycBonus)}/KYC
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 relative z-10" style={{ gap: S.itemGap, marginBottom: S.cardPad }}>
              {[
                { label: 'Bạn bè', value: stats.totalFriends.toString(), sub: stats.activeFriends + ' hoạt động', color: '#60A5FA' },
                { label: 'Hoa hồng', value: fmtUsd(stats.totalCommission), sub: 'Tổng tích luỹ', color: '#34D399' },
                { label: 'Khối lượng', value: '$' + (stats.totalVolume / 1000).toFixed(1) + 'K', sub: 'Từ giới thiệu', color: '#FBBF24' },
              ].map((s, idx) => (
                <motion.div key={s.label} className="rounded-2xl p-3 text-center"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + idx * 0.1, ease: 'easeOut' }}
                  style={{ background: c.portfolioBtnGhost, border: '1px solid ' + c.portfolioBtnGhostBorder }}>
                  <p style={{ color: s.color, fontSize: 17, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                  <p style={{ color: c.portfolioTextDim, fontSize: φ.xs, fontWeight: 600, marginTop: 2 }}>{s.label}</p>
                  <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {stats.pendingCommission > 0 && (
              <div className="rounded-xl px-3 py-2 flex items-center gap-2 relative z-10"
                style={{ marginBottom: S.itemGap, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Clock size={φIcon.sm} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                  {fmtUsd(stats.pendingCommission)} đang chờ xử lý
                </span>
              </div>
            )}

            <div className="rounded-2xl p-3 relative z-10" style={{ marginBottom: S.itemGap, background: c.portfolioBtnGhost, border: '1px solid ' + c.portfolioBtnGhostBorder }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.portfolioTextMuted, fontSize: φ.sm }}>Mã giới thiệu</span>
                <button onClick={() => handleCopy(USER_PROFILE.referralCode)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.2)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)', minHeight: 32 }}>
                  {copied ? <CheckCircle size={φIcon.sm} /> : <Copy size={φIcon.sm} />}
                  <span style={{ fontSize: φ.sm, fontWeight: 600 }}>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
              <p style={{ color: c.portfolioTextDim, fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>
                {USER_PROFILE.referralCode}
              </p>
            </div>

            {/* Dual reward transparency */}
            <div className="rounded-xl p-2.5 relative z-10 flex items-center gap-3"
              style={{ marginBottom: S.itemGap, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex-1 text-center">
                <p style={{ color: c.portfolioTextMuted, fontSize: 9, fontWeight: 500 }}>Bạn nhận</p>
                <p style={{ color: '#34D399', fontSize: φ.sm, fontWeight: 700 }}>{fmtUsd(currentTier.kycBonus)} + {currentTier.commission}%</p>
              </div>
              <div className="w-px h-6" style={{ background: 'rgba(16,185,129,0.2)' }} />
              <div className="flex-1 text-center">
                <p style={{ color: c.portfolioTextMuted, fontSize: 9, fontWeight: 500 }}>Bạn bè nhận</p>
                <p style={{ color: '#34D399', fontSize: φ.sm, fontWeight: 700 }}>5 USDT + giảm phí</p>
              </div>
            </div>

            <div className="flex relative z-10" style={{ gap: S.itemGap }}>
              <button onClick={() => handleCopy(referralLink)}
                className="flex-1 rounded-2xl flex items-center justify-center gap-2"
                style={{ height: 48, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.35)', fontSize: φ.body, fontWeight: 600 }}>
                <Copy size={16} />
                Sao chép link
              </button>
              <button onClick={() => setShowShareSheet(true)}
                className="rounded-2xl flex items-center justify-center"
                style={{ width: 48, height: 48, background: c.portfolioBtnGhost, color: c.portfolioTextDim, border: '1px solid ' + c.portfolioBtnGhostBorder }}>
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* ═══════ ZONE 3: Social Proof ═══════ */}
          <SocialProofRow c={c} />

          {/* ═══════ ZONE 4: Gamification ═══════ */}
          <MilestoneRow c={c} stats={stats} />

          {/* Tier Progress */}
          {nextTier && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <TrCard className="p-4">
                <div className="flex items-center justify-between" style={{ marginBottom: S.itemGap }}>
                  <span style={{ color: c.text2, fontSize: φ.sm }}>Tiến độ hạng tiếp theo</span>
                  <motion.span style={{ color: nextTier.color, fontSize: φ.sm, fontWeight: 700 }}
                    animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    {nextTier.icon} {nextTier.name} <span style={{ fontSize: φ.xs, opacity: 0.7 }}>({nextTier.nameEn})</span>
                  </motion.span>
                </div>
                <div className="h-2.5 rounded-full relative overflow-hidden" style={{ marginBottom: S.itemGap, background: c.surface2 }}>
                  <motion.div className="h-full rounded-full relative"
                    initial={{ width: '0%' }}
                    animate={{ width: hasAnimated ? progressPct + '%' : '0%' }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ background: 'linear-gradient(90deg, ' + currentTier.color + ', ' + nextTier.color + ')' }}>
                    <motion.div className="absolute inset-0"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', width: '50%' }}
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 2, delay: 1.4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }} />
                  </motion.div>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>{stats.totalFriends} / {nextTier.friends} bạn bè</span>
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Hoa hồng {nextTier.commission}% + {fmtUsd(nextTier.kycBonus)}/KYC</span>
                </div>
              </TrCard>
            </motion.div>
          )}

          {/* ═══════ ZONE 5: Tools ═══════ */}
          <EarningCalculator c={c} stats={stats} />

          {/* ═══════ ZONE 6: Financial Detail ═══════ */}
          {PENDING_COMMISSION_DETAILS.length > 0 && (
            <div>
              <SectionHeader
                title="Hoa hồng đang chờ"
                accent accentColor="#F59E0B"
                mb={S.itemGap}
                right={
                  <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace' }}>
                    ~{fmtUsd(PENDING_COMMISSION_DETAILS.reduce((s, p) => s + p.amount, 0))}
                  </span>
                }
              />
              <div className="flex flex-col" style={{ gap: S.itemGap }}>
                {PENDING_COMMISSION_DETAILS.map((pd, idx) => (
                  <motion.div key={pd.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
                      <div className="flex items-center gap-3" style={{ marginBottom: S.itemGap }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
                          <span style={{ color: '#F59E0B', fontSize: φ.base, fontWeight: 700 }}>{pd.friendAvatar}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{pd.friendName}</p>
                          <div className="flex items-center gap-1.5">
                            <Clock size={φ.xs} color="#F59E0B" />
                            <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{pd.reason}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p style={{ color: '#F59E0B', fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>~{fmtUsd(pd.amount)}</p>
                          <p style={{ color: c.text3, fontSize: 9 }}>{pd.currency}</p>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full" style={{ marginBottom: S.itemGap, background: c.surface2 }}>
                        <div className="h-full rounded-full" style={{ background: '#F59E0B', width: pd.progress + '%', transition: 'width 0.6s ease' }} />
                      </div>

                      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 6 }}>
                        {pd.reasonDetail}
                      </p>

                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', display: 'inline-flex' }}>
                        <Clock size={φ.xs} color="#F59E0B" />
                        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{pd.eta}</span>
                      </div>
                    </TrCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Reward Highlight */}
          <div>
            <SectionHeader title="Thưởng của bạn" accent accentColor="#10B981" mb={S.itemGap} />
            <div className="grid grid-cols-2" style={{ gap: S.itemGap }}>
              <TrCard className="p-4" accentBorder="rgba(16,185,129,0.15)">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <Gift size={16} color="#10B981" />
                  </div>
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Thưởng KYC</span>
                </div>
                <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{fmtUsd(currentTier.kycBonus)}</p>
                <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>Mỗi bạn hoàn tất KYC</p>
                <div className="flex items-center gap-1 mt-2 px-2 py-1 rounded-md" style={{ background: 'rgba(251,146,60,0.1)' }}>
                  <Zap size={9} color="#FB923C" />
                  <span style={{ color: '#FB923C', fontSize: 9, fontWeight: 700 }}>x{ACTIVE_CAMPAIGN.bonusMultiplier} đang áp dụng!</span>
                </div>
              </TrCard>
              <TrCard className="p-4" accentBorder="rgba(59,130,246,0.15)">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <TrendingUp size={16} color="#3B82F6" />
                  </div>
                  <span style={{ color: c.text2, fontSize: φ.xs }}>Hoa h���ng</span>
                </div>
                <p style={{ color: '#3B82F6', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{currentTier.commission}%</p>
                <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>Phí GD của bạn bè, vĩnh viễn</p>
              </TrCard>
            </div>
          </div>

          {/* ═══════ ZONE 7: Community ═══════ */}
          <LeaderboardSection c={c} stats={stats} />

          {/* Commission Transparency */}
          <TrCard className="px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={φIcon.sm} color={c.text3} />
              <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                Hoa hồng = Phí GD thực tế của bạn bè x {currentTier.commission}%.
                Cộng real-time vào ví USDT, không giới hạn thời gian.
              </p>
            </div>
          </TrCard>

          {/* ═══════ ZONE 8: Navigation & Info ═══════ */}
          <div>
            <SectionHeader title="Chi tiết" mb={S.itemGap} />
            <TrCard overflow>
              {[
                { IconComp: Users, label: 'Bạn bè đã mời (' + stats.totalFriends + ')', sub: stats.kycCompleted + ' đã KYC', color: '#8B5CF6', route: prefix + '/referral/history' },
                { IconComp: Gift, label: 'Phần thưởng', sub: fmtUsd(stats.totalCommission) + ' tổng tích luỹ' + (stats.pendingCommission > 0 ? ' · ' + fmtUsd(stats.pendingCommission) + ' đang chờ' : ''), color: '#10B981', route: prefix + '/referral/rewards' },
                { IconComp: Award, label: 'Bảng hạng & Điều khoản', sub: 'Hạng hiện tại: ' + currentTier.name + ' (' + currentTier.nameEn + ')', color: '#F59E0B', route: prefix + '/referral/rules' },
              ].map((item, i) => (
                <button key={item.label}
                  onClick={() => navigate(item.route, { replace: true })}
                  className="flex items-center gap-3 px-4 py-3.5 w-full"
                  style={{ borderBottom: i < 2 ? '1px solid ' + c.divider : 'none', minHeight: 56 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.color + '15' }}>
                    <item.IconComp size={18} color={item.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ color: c.text3, fontSize: φ.sm }}>{item.sub}</p>
                  </div>
                  <ChevronRight size={16} color={c.text3} />
                </button>
              ))}
            </TrCard>
          </div>

          {/* How it works */}
          <div>
            <SectionHeader title="Cách thức hoạt động" accent accentColor="#3B82F6" mb={S.itemGap} />
            <TrCard className="p-4">
              {[
                { step: '1', title: 'Chia sẻ link', desc: 'Gửi link giới thiệu cho bạn bè qua Zalo, Facebook, Telegram', IconComp: Share2, color: '#3B82F6' },
                { step: '2', title: 'Bạn bè đăng ký & KYC', desc: 'Cả hai nhận thưởng ' + fmtUsd(currentTier.kycBonus) + ' USDT', IconComp: UserCheck, color: '#8B5CF6' },
                { step: '3', title: 'Bạn bè giao dịch', desc: 'Bạn bè bắt đầu trade trên VitTrade', IconComp: TrendingUp, color: '#F59E0B' },
                { step: '4', title: 'Nhận hoa hồng vĩnh viễn', desc: currentTier.commission + '% phí GD, real-time, không giới hạn', IconComp: Gift, color: '#10B981' },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < 3 ? '1px solid ' + c.divider : 'none' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: item.color + '15', border: '1.5px solid ' + item.color + '33' }}>
                    <item.IconComp size={18} color={item.color} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{item.title}</p>
                    <p style={{ color: c.text3, fontSize: φ.sm }}>{item.desc}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: c.surface2 }}>
                    <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 700 }}>{item.step}</span>
                  </div>
                </div>
              ))}
            </TrCard>
          </div>

          {/* This Month */}
          <div>
            <SectionHeader title="Tháng này" accent accentColor="#F59E0B" mb={S.itemGap} />
            <div className="grid grid-cols-2" style={{ gap: S.itemGap }}>
              <TrCard className="p-4">
                <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 4 }}>Hoa hồng tháng này</p>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>+{fmtUsd(stats.thisMonthCommission)}</p>
              </TrCard>
              <TrCard className="p-4">
                <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 4 }}>Bạn mời tháng này</p>
                <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>+{stats.thisMonthFriends}</p>
              </TrCard>
            </div>
          </div>

          {/* ═══════ ZONE 9: History ═══════ */}
          <div>
            <SectionHeader
              title="Lịch sử sự kiện"
              accent accentColor="#8B5CF6"
              mb={S.itemGap}
              right={<span style={{ color: c.text3, fontSize: φ.xs }}>{CAMPAIGN_HISTORY.length} sự kiện</span>}
            />
            <div className="flex flex-col" style={{ gap: S.itemGap }}>
              {CAMPAIGN_HISTORY.map((camp, idx) => {
                const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
                  active: { label: 'Đang diễn ra', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                  ended: { label: 'Đã kết thúc', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
                  upcoming: { label: 'Sắp diễn ra', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                };
                const st = statusCfg[camp.status];
                return (
                  <motion.div key={camp.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                  >
                    <TrCard className="p-4" accentBorder={camp.status === 'active' ? 'rgba(16,185,129,0.2)' : undefined}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>{camp.title}</p>
                          <span className="px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 600 }}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginBottom: S.itemGap }}>{camp.description}</p>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock size={φ.xs} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{camp.startDate} – {camp.endDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={φ.xs} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: φ.xs }}>{camp.totalParticipants.toLocaleString()}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 9, fontWeight: 700 }}>
                          {camp.bonusLabel}
                        </span>
                      </div>

                      {camp.yourResult && (
                        <div className="rounded-xl p-2.5 mt-1" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>KẾT QUẢ CỦA BẠN</p>
                          <div className="flex items-center gap-4">
                            <div>
                              <span style={{ color: '#3B82F6', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
                                {camp.yourResult.friendsReferred}
                              </span>
                              <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 4 }}>bạn mời</span>
                            </div>
                            <div>
                              <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
                                +{fmtUsd(camp.yourResult.bonusEarned)}
                              </span>
                              <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 4 }}>thưởng</span>
                            </div>
                            {camp.yourResult.rank && (
                              <div>
                                <span style={{ color: '#F59E0B', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
                                  #{camp.yourResult.rank}
                                </span>
                                <span style={{ color: c.text3, fontSize: φ.xs, marginLeft: 4 }}>xếp hạng</span>
                              </div>
                            )}
                          </div>
                          {camp.yourResult.specialReward && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Gift size={φ.xs} color="#8B5CF6" />
                              <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>{camp.yourResult.specialReward}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {camp.highlights && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Sparkles size={φ.xs} color={st.color} />
                          <span style={{ color: st.color, fontSize: φ.xs, fontWeight: 600 }}>{camp.highlights}</span>
                        </div>
                      )}
                    </TrCard>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ═══════ Bottom CTA ═══════ */}
          <motion.button
            onClick={() => { handleCopy(referralLink); hapticSelection(); }}
            className="w-full rounded-2xl flex items-center justify-center gap-2.5 relative overflow-hidden"
            style={{
              height: 52,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }} />
            <Users size={18} />
            <span className="relative z-10">Mời bạn bè ngay</span>
            <ChevronRight size={16} />
          </motion.button>

        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}
