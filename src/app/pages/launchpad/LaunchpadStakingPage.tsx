/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadStakingPage — Launchpool Staking (Phase 4)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Pool list, Stake/Unstake sheets, APY calculator,
 *            user positions, staking tiers
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Coins, Lock, Unlock, TrendingUp, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Shield, Calculator, Info,
  X, Star, Zap, Gift, ArrowRight, ArrowDown,
  AlertCircle, Percent,
} from 'lucide-react';
import {
  LAUNCHPOOL_POOLS, MOCK_STAKE_POSITIONS, MOCK_USER,
  calculateAPY, estimateRewards, truncateAddress,
  getRewardPerSecond,
  type LaunchpoolPool, type StakePosition, type StakingTier,
} from './launchpadData';
import { CountdownTimer, RiskDisclosure } from './LaunchpadComponents';

const TABS = ['Pools', 'Vị trí của tôi', 'Tính APY'] as const;
type StakingTab = typeof TABS[number];

/* ─── Hook: real-time reward accrual ─── */
function useRewardAccrual(positions: StakePosition[]) {
  const [rewards, setRewards] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    positions.forEach(p => { m[p.id] = p.pendingRewards; });
    return m;
  });
  const ratesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // pre-compute per-second rates
    const pools = LAUNCHPOOL_POOLS;
    positions.forEach(pos => {
      const pool = pools.find(p => p.id === pos.poolId);
      if (pool && pos.status === 'active') {
        ratesRef.current[pos.id] = getRewardPerSecond(pos.stakedAmount, pos.apy, pool.rewardTokenPrice);
      }
    });

    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000; // seconds elapsed
      last = now;
      setRewards(prev => {
        const next = { ...prev };
        let changed = false;
        positions.forEach(pos => {
          const rate = ratesRef.current[pos.id];
          if (rate && pos.status === 'active') {
            next[pos.id] = (prev[pos.id] ?? pos.pendingRewards) + rate * dt;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [positions]);

  return rewards;
}

/* ─── Animated number display ─── */
function AnimatedNumber({ value, decimals = 4, color, size = 14, symbol }: {
  value: number; decimals?: number; color: string; size?: number; symbol?: string;
}) {
  // Split into integer and fractional for smooth display
  const fixed = value.toFixed(decimals);
  const [int, frac] = fixed.split('.');
  return (
    <span style={{ color, fontSize: size, fontWeight: 700, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'baseline' }}>
      <span>{parseInt(int).toLocaleString()}</span>
      {frac && <span style={{ fontSize: size * 0.75, opacity: 0.75 }}>.{frac}</span>}
      {symbol && <span style={{ fontSize: size * 0.7, marginLeft: 3, fontWeight: 600 }}>{symbol}</span>}
    </span>
  );
}

export function LaunchpadStakingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<StakingTab>('Pools');
  const [stakePool, setStakePool] = useState<LaunchpoolPool | null>(null);
  const [unstakePosition, setUnstakePosition] = useState<StakePosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const totalStaked = MOCK_STAKE_POSITIONS.reduce((s, p) => s + p.stakedAmount, 0);
  const totalPendingRewards = MOCK_STAKE_POSITIONS.reduce((s, p) => s + p.pendingRewards, 0);
  const activePools = LAUNCHPOOL_POOLS.filter(p => p.status === 'active');

  const rewards = useRewardAccrual(MOCK_STAKE_POSITIONS);
  const liveTotalRewards = Object.values(rewards).reduce((s, v) => s + v, 0);

  return (
    <PageLayout>
      {/* Stake sheet */}
      {stakePool && (
        <StakeSheet pool={stakePool} onClose={() => setStakePool(null)} />
      )}
      {/* Unstake sheet */}
      {unstakePosition && (
        <UnstakeSheet position={unstakePosition} onClose={() => setUnstakePosition(null)} />
      )}

      <Header title="Launchpool Staking" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Hero stats */}
        <TrCard variant="hero" className="p-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Coins size={22} color="#10B981" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tổng giá trị stake</p>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>
                ${totalStaked.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Pools hoạt động</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{activePools.length}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Phần thưởng chờ</p>
              <AnimatedNumber value={liveTotalRewards} decimals={2} color="#F59E0B" size={16} />
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Vị trí</p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{MOCK_STAKE_POSITIONS.length}</p>
            </div>
          </div>
        </TrCard>

        {/* Tab content */}
        {tab === 'Pools' && (
          <>
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: c.surface2 }} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {LAUNCHPOOL_POOLS.map(pool => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    onStake={() => setStakePool(pool)}
                    onDetail={() => navigate(`${prefix}/launchpad/${pool.projectId}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Vị trí của tôi' && (
          <>
            {MOCK_STAKE_POSITIONS.length === 0 ? (
              <TrCard className="p-8 text-center">
                <Coins size={40} color={c.text3} className="mx-auto mb-3" />
                <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Chưa có vị trí nào
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>
                  Bắt đầu stake vào pool để nhận phần thưởng token mới
                </p>
                <CTAButton className="mt-4" onClick={() => setTab('Pools')}>
                  Xem pools
                </CTAButton>
              </TrCard>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Batch claim entry */}
                <button
                  onClick={() => navigate(`${prefix}/launchpad/batch-claim`)}
                  className="w-full rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <Zap size={18} color="#10B981" />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Batch Claim</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>Nhận phần thưởng từ tất cả vị trí cùng lúc</p>
                  </div>
                  <ChevronRight size={16} color="#10B981" />
                </button>

                {MOCK_STAKE_POSITIONS.map(pos => (
                  <PositionCard
                    key={pos.id}
                    position={pos}
                    liveReward={rewards[pos.id] ?? pos.pendingRewards}
                    onUnstake={() => setUnstakePosition(pos)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Tính APY' && (
          <APYCalculator pools={LAUNCHPOOL_POOLS.filter(p => p.status === 'active')} />
        )}

        {/* Risk disclosure */}
        <RiskDisclosure />

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   PoolCard — individual launchpool
   ═══════════════════════════════════════════════════════════ */

function PoolCard({ pool, onStake, onDetail }: {
  pool: LaunchpoolPool; onStake: () => void; onDetail: () => void;
}) {
  const c = useThemeColors();
  const fillPct = Math.min((pool.totalStaked / pool.poolCap) * 100, 100);
  const tierForUser = pool.stakingTiers.filter(t => pool.userStaked >= t.minStake).pop();
  const effectiveAPY = calculateAPY(pool.apy, pool.userStaked, pool.stakingTiers);

  return (
    <TrCard overflow>
      <button className="w-full text-left p-4" onClick={onDetail}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: pool.projectLogoColor + '22', border: `2px solid ${pool.projectLogoColor}44`, color: pool.projectLogoColor }}>
            {pool.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{pool.projectName}</span>
              <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                Launchpool
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 12 }}>
              Stake {pool.stakeToken} · Earn {pool.rewardToken}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 800 }}>{effectiveAPY}%</p>
            <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Tổng stake', value: pool.totalStakedDisplay },
            { label: 'Lock', value: `${pool.lockPeriod} ngày` },
            { label: 'Chain', value: pool.chain },
          ].map(r => (
            <div key={r.label} className="rounded-xl p-2 text-center" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Pool fill */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span style={{ color: c.text3, fontSize: 11 }}>Pool capacity</span>
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{fillPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
            <div className="h-full rounded-full" style={{
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${pool.projectLogoColor}, ${pool.projectLogoColor}99)`,
            }} />
          </div>
        </div>

        {/* Staking tiers */}
        <div className="flex gap-1.5 mb-3">
          {pool.stakingTiers.map(tier => (
            <div key={tier.label} className="flex-1 rounded-lg p-1.5 text-center"
              style={{
                background: tierForUser?.label === tier.label ? `${tier.color}20` : c.surface2,
                border: tierForUser?.label === tier.label ? `1px solid ${tier.color}40` : `1px solid transparent`,
              }}>
              <p style={{ color: tier.color, fontSize: 10, fontWeight: 600 }}>{tier.label}</p>
              <p style={{ color: c.text2, fontSize: 9 }}>+{tier.apyBonus}%</p>
            </div>
          ))}
        </div>

        {/* User position summary */}
        {pool.userStaked > 0 && (
          <div className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: `${pool.projectLogoColor}08`, border: `1px solid ${pool.projectLogoColor}18` }}>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Bạn đang stake</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                ${pool.userStaked.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: c.text3, fontSize: 10 }}>Phần thưởng chờ</p>
              <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                {pool.userRewards.toLocaleString()} {pool.rewardToken}
              </p>
            </div>
          </div>
        )}

        {/* Countdown */}
        {pool.status === 'upcoming' && (
          <div className="mt-3">
            <CountdownTimer targetDate={pool.startDate} label="Pool mở sau" color="#F59E0B" />
          </div>
        )}
        {pool.status === 'active' && (
          <div className="mt-3">
            <CountdownTimer targetDate={pool.endDate} label="Pool kết thúc sau" color={pool.projectLogoColor} />
          </div>
        )}
      </button>

      {/* Action */}
      <div className="px-4 pb-4">
        {pool.status === 'active' && (
          <button onClick={onStake}
            className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: pool.projectLogoColor, fontSize: 14, borderRadius: 14, fontWeight: 600 }}>
            <Coins size={16} />
            {pool.userStaked > 0 ? 'Stake thêm' : 'Bắt đầu stake'}
          </button>
        )}
        {pool.status === 'upcoming' && (
          <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 14, borderRadius: 14, color: '#F59E0B', fontWeight: 600 }}>
            <Clock size={16} />
            Sắp mở
          </div>
        )}
        {pool.status === 'ended' && (
          <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: c.surface2, fontSize: 14, borderRadius: 14, color: c.text3, fontWeight: 600 }}>
            Đã kết thúc
          </div>
        )}
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   PositionCard — user staking position
   ═══════════════════════════════════════════════════════════ */

function PositionCard({ position, liveReward, onUnstake }: {
  position: StakePosition; liveReward: number; onUnstake: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', label: 'Đang stake' },
    cooldown: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', label: 'Cooldown' },
    unlocked: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Sẵn sàng rút' },
    withdrawn: { bg: 'rgba(139,149,179,0.1)', text: '#8B95B3', label: 'Đã rút' },
  };
  const st = statusColors[position.status];

  return (
    <TrCard className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
          style={{ background: position.projectLogoColor + '22', color: position.projectLogoColor }}>
          {position.projectSymbol.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{position.projectName}</p>
          <p style={{ color: c.text3, fontSize: 11 }}>
            Stake {position.stakeToken} · Earn {position.rewardToken}
          </p>
        </div>
        <div className="px-2 py-1 rounded-lg" style={{ background: st.bg }}>
          <span style={{ color: st.text, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Số lượng stake', value: `$${position.stakedAmount.toLocaleString()}`, icon: Coins },
          { label: 'APY', value: `${position.apy}%`, icon: Percent },
          { label: 'Phần thưởng chờ', value: `${liveReward.toLocaleString()} ${position.rewardToken}`, icon: Gift },
          { label: 'Đã nhận', value: `${position.claimedRewards.toLocaleString()} ${position.rewardToken}`, icon: CheckCircle },
        ].map(r => (
          <div key={r.label} className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: c.surface2 }}>
            <r.icon size={13} color={c.text3} />
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>{r.label}</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lock info */}
      <div className="rounded-xl p-3 flex items-center gap-2 mb-3"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
        <Lock size={14} color="#F59E0B" />
        <div className="flex-1">
          <p style={{ color: c.text2, fontSize: 11 }}>
            Khóa đến: <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{position.lockUntil}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {position.pendingRewards > 0 && (
          <button
            onClick={() => navigate(`${prefix}/launchpad/claim-receipt/${position.id}`)}
            className="flex-1 h-10 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 13, fontWeight: 600 }}>
            <Gift size={14} />
            Nhận thưởng
          </button>
        )}
        <button onClick={onUnstake}
          className="flex-1 h-10 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, fontWeight: 600 }}>
          <Unlock size={14} />
          Unstake
        </button>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   APYCalculator — interactive APY/rewards estimator
   ═══════════════════════════════════════════════════════════ */

function APYCalculator({ pools }: { pools: LaunchpoolPool[] }) {
  const c = useThemeColors();
  const [selectedPoolId, setSelectedPoolId] = useState(pools[0]?.id || '');
  const [amount, setAmount] = useState('1000');
  const [days, setDays] = useState('30');

  const pool = pools.find(p => p.id === selectedPoolId) || pools[0];
  if (!pool) return null;

  const numAmount = parseFloat(amount) || 0;
  const numDays = parseInt(days) || 0;
  const effectiveAPY = calculateAPY(pool.apy, numAmount, pool.stakingTiers);
  const rewards = estimateRewards(numAmount, effectiveAPY, numDays, pool.rewardTokenPrice);
  const currentTier = pool.stakingTiers.filter(t => numAmount >= t.minStake).pop();
  const nextTier = pool.stakingTiers.find(t => numAmount < t.minStake);

  return (
    <div className="flex flex-col gap-4">
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={18} color="#3B82F6" />
          <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Tính toán phần thưởng</p>
        </div>

        {/* Pool selector */}
        <div className="mb-4">
          <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Chọn pool</p>
          <div className="flex gap-2">
            {pools.map(p => (
              <button key={p.id} onClick={() => setSelectedPoolId(p.id)}
                className="flex-1 rounded-xl p-2.5 text-center"
                style={{
                  background: selectedPoolId === p.id ? `${p.projectLogoColor}15` : c.surface2,
                  border: `1px solid ${selectedPoolId === p.id ? p.projectLogoColor + '40' : c.borderSolid}`,
                }}>
                <p style={{ color: selectedPoolId === p.id ? p.projectLogoColor : c.text2, fontSize: 11, fontWeight: 600 }}>
                  {p.projectSymbol}
                </p>
                <p style={{ color: c.text3, fontSize: 9 }}>{p.apy}% APY</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Số lượng stake ({pool.stakeToken})</p>
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: 16, fontWeight: 600, fontFamily: 'monospace' }}
              placeholder="0.00"
              min={pool.minStake}
              max={pool.maxStake}
            />
            <span className="flex items-center px-3" style={{ color: c.text3, fontSize: 12, background: c.surface2 }}>
              {pool.stakeToken}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setAmount(v.toString())}
                className="flex-1 py-1 rounded-lg text-xs"
                style={{
                  background: amount === v.toString() ? 'rgba(59,130,246,0.1)' : c.surface2,
                  color: amount === v.toString() ? '#3B82F6' : c.text3,
                  fontWeight: 600,
                }}>
                {v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
        </div>

        {/* Duration input */}
        <div className="mb-4">
          <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Thời gian stake (ngày)</p>
          <div className="flex gap-2">
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d.toString())}
                className="flex-1 py-2 rounded-xl text-center"
                style={{
                  background: days === d.toString() ? 'rgba(16,185,129,0.1)' : c.surface2,
                  border: `1px solid ${days === d.toString() ? 'rgba(16,185,129,0.3)' : c.borderSolid}`,
                  color: days === d.toString() ? '#10B981' : c.text2,
                  fontSize: 13, fontWeight: 600,
                }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
      </TrCard>

      {/* Results */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Kết quả ước tính</p>

        <div className="flex flex-col gap-3">
          {/* Effective APY */}
          <div className="flex justify-between items-center">
            <span style={{ color: c.text2, fontSize: 13 }}>APY hiệu lực</span>
            <span style={{ color: '#10B981', fontSize: 18, fontWeight: 800 }}>{effectiveAPY}%</span>
          </div>

          {/* Current tier */}
          {currentTier && (
            <div className="flex justify-between items-center">
              <span style={{ color: c.text2, fontSize: 13 }}>Hạng hiện tại</span>
              <div className="flex items-center gap-1.5">
                <Star size={12} color={currentTier.color} />
                <span style={{ color: currentTier.color, fontSize: 13, fontWeight: 600 }}>
                  {currentTier.label} (+{currentTier.apyBonus}%)
                </span>
              </div>
            </div>
          )}

          {/* Next tier hint */}
          {nextTier && numAmount > 0 && (
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <p style={{ color: '#3B82F6', fontSize: 11 }}>
                <Info size={11} className="inline mr-1" />
                Stake thêm ${(nextTier.minStake - numAmount).toLocaleString()} để lên hạng {nextTier.label} (+{nextTier.apyBonus}% APY)
              </p>
            </div>
          )}

          <div className="h-px" style={{ background: c.borderSolid }} />

          {/* Daily rate */}
          <div className="flex justify-between items-center">
            <span style={{ color: c.text2, fontSize: 13 }}>Lãi suất hàng ngày</span>
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
              {(rewards.dailyRate * 100).toFixed(4)}%
            </span>
          </div>

          {/* Token rewards */}
          <div className="flex justify-between items-center">
            <span style={{ color: c.text2, fontSize: 13 }}>Phần thưởng dự kiến</span>
            <span style={{ color: '#F59E0B', fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
              {rewards.tokenRewards.toLocaleString()} {pool.rewardToken}
            </span>
          </div>

          {/* USD value */}
          <div className="flex justify-between items-center">
            <span style={{ color: c.text2, fontSize: 13 }}>Giá trị ước tính (USD)</span>
            <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
              ${rewards.usdValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
            Kết quả chỉ mang tính tham khảo. APY có thể thay đổi theo điều kiện pool và số người tham gia.
            Rút sớm có thể bị phạt {pool.earlyExitPenalty}% số lượng stake.
          </p>
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   StakeSheet — bottom sheet for staking
   ═══════════════════════════════════════════════════════════ */

function StakeSheet({ pool, onClose }: { pool: LaunchpoolPool; onClose: () => void }) {
  const c = useThemeColors();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  const [processing, setProcessing] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const effectiveAPY = calculateAPY(pool.apy, numAmount, pool.stakingTiers);
  const rewards = estimateRewards(numAmount, effectiveAPY, pool.lockPeriod, pool.rewardTokenPrice);
  const isValid = numAmount >= pool.minStake && numAmount <= pool.maxStake && numAmount <= MOCK_USER.usdtBalance;
  const currentTier = pool.stakingTiers.filter(t => numAmount >= t.minStake).pop();

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: c.surface }}>
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">

          {step === 'input' && (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Stake {pool.stakeToken}</h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              {/* Pool info */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: c.surface2 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: pool.projectLogoColor + '22', color: pool.projectLogoColor }}>
                  {pool.projectLogo}
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{pool.projectName}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>Lock: {pool.lockPeriod} ngày · Chain: {pool.chain}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800 }}>{pool.apy}%</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Base APY</p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: c.text2, fontSize: 12 }}>Số lượng</span>
                  <span style={{ color: c.text3, fontSize: 11 }}>
                    Có sẵn: <span style={{ fontWeight: 600, color: c.text1 }}>${MOCK_USER.usdtBalance.toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="flex-1 px-3 py-3 bg-transparent outline-none"
                    style={{ color: c.text1, fontSize: 18, fontWeight: 600, fontFamily: 'monospace' }}
                    placeholder="0.00" />
                  <div className="flex items-center gap-2 px-3" style={{ background: c.surface2 }}>
                    <button onClick={() => setAmount(Math.min(pool.maxStake, MOCK_USER.usdtBalance).toString())}
                      className="px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                      MAX
                    </button>
                    <span style={{ color: c.text3, fontSize: 12 }}>{pool.stakeToken}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct}
                      onClick={() => setAmount(Math.min(MOCK_USER.usdtBalance * pct / 100, pool.maxStake).toString())}
                      className="flex-1 py-1 rounded-lg text-xs"
                      style={{ background: c.surface2, color: c.text3, fontWeight: 600 }}>
                      {pct}%
                    </button>
                  ))}
                </div>
                {numAmount > 0 && numAmount < pool.minStake && (
                  <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>
                    Tối thiểu: ${pool.minStake.toLocaleString()}
                  </p>
                )}
                {numAmount > pool.maxStake && (
                  <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>
                    Tối đa: ${pool.maxStake.toLocaleString()}
                  </p>
                )}
              </div>

              {/* APY + tier preview */}
              {numAmount > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 12 }}>APY hiệu lực</span>
                    <span style={{ color: '#10B981', fontSize: 16, fontWeight: 800 }}>{effectiveAPY}%</span>
                  </div>
                  {currentTier && (
                    <div className="flex items-center gap-1.5">
                      <Star size={11} color={currentTier.color} />
                      <span style={{ color: currentTier.color, fontSize: 11, fontWeight: 600 }}>
                        Hạng {currentTier.label}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between">
                    <span style={{ color: c.text3, fontSize: 11 }}>
                      Thu nhập dự kiến ({pool.lockPeriod}d)
                    </span>
                    <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                      ~{rewards.tokenRewards.toLocaleString()} {pool.rewardToken}
                    </span>
                  </div>
                </div>
              )}

              {/* Warnings */}
              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Token sẽ bị khóa {pool.lockPeriod} ngày. Rút sớm mất {pool.earlyExitPenalty}% phí. 
                  Cooldown {pool.cooldownDays} ngày khi unstake.
                </p>
              </div>

              <CTAButton disabled={!isValid} onClick={() => setStep('review')}>
                Xem lại & Stake
              </CTAButton>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Xác nhận Stake</h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'Pool', value: pool.projectName },
                  { label: 'Token stake', value: pool.stakeToken },
                  { label: 'Số lượng', value: `$${numAmount.toLocaleString()}` },
                  { label: 'APY', value: `${effectiveAPY}%` },
                  { label: 'Lock', value: `${pool.lockPeriod} ngày` },
                  { label: 'Cooldown', value: `${pool.cooldownDays} ngày` },
                  { label: 'Phi rút sớm', value: `${pool.earlyExitPenalty}%` },
                  { label: 'Chain', value: pool.chain },
                  { label: 'Thu nhập dự kiến', value: `~${rewards.tokenRewards.toLocaleString()} ${pool.rewardToken}` },
                  { label: 'Giá trị USD ước tính', value: `~$${rewards.usdValue.toLocaleString()}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 13 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Shield size={14} color="#EF4444" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Hành động này không thể hoàn tác. Token sẽ bị khóa và chỉ có thể rút sau khi hết lock + cooldown.
                  Giá trị phần thưởng có thể thay đổi.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('input')}
                  className="flex-1 h-12 rounded-2xl font-bold"
                  style={{ background: c.surface2, color: c.text2, fontSize: 14, borderRadius: 14, fontWeight: 600 }}>
                  Quay lại
                </button>
                <CTAButton className="flex-1" loading={processing} onClick={handleConfirm}>
                  Xác nhận Stake
                </CTAButton>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Stake thành công!</h3>
                <p style={{ color: c.text2, fontSize: 13 }}>
                  Bạn đã stake ${numAmount.toLocaleString()} {pool.stakeToken} vào {pool.projectName}
                </p>
              </div>

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                {[
                  { label: 'APY', value: `${effectiveAPY}%` },
                  { label: 'Lock until', value: `${pool.lockPeriod} ngày từ bây giờ` },
                  { label: 'Thu nhập dự kiến', value: `~${rewards.tokenRewards.toLocaleString()} ${pool.rewardToken}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1" >
                    <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <CTAButton variant="success" onClick={onClose}>
                Hoàn tất
              </CTAButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UnstakeSheet — bottom sheet for unstaking
   ═══════════════════════════════════════════════════════════ */

function UnstakeSheet({ position, onClose }: { position: StakePosition; onClose: () => void }) {
  const c = useThemeColors();
  const [amount, setAmount] = useState(position.stakedAmount.toString());
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [processing, setProcessing] = useState(false);

  const pool = LAUNCHPOOL_POOLS.find(p => p.id === position.poolId);
  const penalty = pool?.earlyExitPenalty || 0;
  const numAmount = parseFloat(amount) || 0;
  const penaltyAmount = numAmount * penalty / 100;
  const receiveAmount = numAmount - penaltyAmount;

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: c.surface }}>
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">

          {step === 'input' && (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Unstake {position.stakeToken}</h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11 }}>Đang stake</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
                  ${position.stakedAmount.toLocaleString()} {position.stakeToken}
                </p>
              </div>

              <div>
                <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Số lượng rút</p>
                <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="flex-1 px-3 py-3 bg-transparent outline-none"
                    style={{ color: c.text1, fontSize: 18, fontWeight: 600, fontFamily: 'monospace' }}
                    placeholder="0.00" max={position.stakedAmount} />
                  <div className="flex items-center gap-2 px-3" style={{ background: c.surface2 }}>
                    <button onClick={() => setAmount(position.stakedAmount.toString())}
                      className="px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 10, fontWeight: 600 }}>
                      ALL
                    </button>
                  </div>
                </div>
              </div>

              {/* Penalty warning */}
              {penalty > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>Phi rút sớm</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: c.text2, fontSize: 12 }}>Phi phạt ({penalty}%)</span>
                    <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                      -${penaltyAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: c.text2, fontSize: 12 }}>Bạn nhận được</span>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      ${receiveAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Cooldown info */}
              {pool && pool.cooldownDays > 0 && (
                <div className="rounded-xl p-3 flex items-start gap-2"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <Clock size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Sau khi unstake, token sẽ vào giai đoạn cooldown {pool.cooldownDays} ngày trước khi có thể rút về ví.
                  </p>
                </div>
              )}

              <CTAButton variant="danger" disabled={numAmount <= 0 || numAmount > position.stakedAmount}
                onClick={() => setStep('confirm')}>
                Tiếp tục Unstake
              </CTAButton>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: '#EF4444', fontSize: 18, fontWeight: 800 }}>Xác nhận Unstake</h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              <div className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={28} color="#EF4444" className="mx-auto mb-2" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  Bạn chắc chắn muốn unstake?
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                  Bạn sẽ mất {penalty}% phí phạt (${penaltyAmount.toLocaleString()}).
                  Token sẽ vào cooldown {pool?.cooldownDays || 0} ngày.
                  Bạn sẽ ngừng nhận phần thưởng cho số lượng này.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'Số lượng unstake', value: `$${numAmount.toLocaleString()}` },
                  { label: 'Phi phạt', value: `-$${penaltyAmount.toLocaleString()}`, color: '#EF4444' },
                  { label: 'Bạn nhận', value: `$${receiveAmount.toLocaleString()}`, color: '#10B981' },
                  { label: 'Cooldown', value: `${pool?.cooldownDays || 0} ngày` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 13 }}>{r.label}</span>
                    <span style={{ color: (r as any).color || c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('input')}
                  className="flex-1 h-12 rounded-2xl font-bold"
                  style={{ background: c.surface2, color: c.text2, fontSize: 14, borderRadius: 14, fontWeight: 600 }}>
                  Hủy
                </button>
                <CTAButton variant="danger" className="flex-1" loading={processing} onClick={handleConfirm}>
                  Xác nhận Unstake
                </CTAButton>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Unstake thành công!</h3>
                <p style={{ color: c.text2, fontSize: 13 }}>
                  ${receiveAmount.toLocaleString()} {position.stakeToken} đang trong giai đoạn cooldown
                </p>
              </div>
              <CTAButton onClick={onClose}>Hoàn tất</CTAButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}