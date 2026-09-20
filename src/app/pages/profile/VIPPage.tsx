import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Crown, Check, Lock, Zap, Award } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtCompact } from '../../data/formatNumber';

function fmtVolume(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

interface VIPTier {
  level: number;
  name: string;
  color: string;
  gradient: string;
  icon: string;
  monthlyVolume: number; // in USD
  assetHold: number; // in USD
  makerFee: number;
  takerFee: number;
  withdrawLimit: number;
  features: string[];
  badge: string;
}

const VIP_TIERS: VIPTier[] = [
  {
    level: 0,
    name: 'Standard',
    color: '#8B95B3',
    gradient: 'linear-gradient(135deg, #2A3356 0%, #1C2235 100%)',
    icon: '👤',
    monthlyVolume: 0,
    assetHold: 0,
    makerFee: 0.10,
    takerFee: 0.10,
    withdrawLimit: 100000,
    features: ['Spot trading', 'P2P trading', 'Staking cơ bản'],
    badge: 'STANDARD',
  },
  {
    level: 1,
    name: 'VIP 1',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
    icon: '⭐',
    monthlyVolume: 50000,
    assetHold: 1000,
    makerFee: 0.09,
    takerFee: 0.09,
    withdrawLimit: 500000,
    features: ['Tất cả Standard', 'Phí thấp hơn 10%', 'Hỗ trợ ưu tiên'],
    badge: 'VIP 1',
  },
  {
    level: 2,
    name: 'VIP 2',
    color: '#94A3B8',
    gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    icon: '🥈',
    monthlyVolume: 500000,
    assetHold: 5000,
    makerFee: 0.08,
    takerFee: 0.08,
    withdrawLimit: 1000000,
    features: ['Tất cả VIP 1', 'API nâng cao', 'Launchpad ưu tiên', 'Staking APY +1%'],
    badge: 'VIP 2',
  },
  {
    level: 3,
    name: 'VIP 3',
    color: '#F7931A',
    gradient: 'linear-gradient(135deg, #78350f 0%, #7c2d12 100%)',
    icon: '🥇',
    monthlyVolume: 2000000,
    assetHold: 20000,
    makerFee: 0.06,
    takerFee: 0.07,
    withdrawLimit: 5000000,
    features: ['Tất cả VIP 2', 'Maker fee giảm 40%', 'Dedicated account manager', 'Launchpad allocation ưu tiên'],
    badge: 'VIP 3',
  },
  {
    level: 4,
    name: 'VIP 4',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
    icon: '💎',
    monthlyVolume: 10000000,
    assetHold: 100000,
    makerFee: 0.04,
    takerFee: 0.06,
    withdrawLimit: 20000000,
    features: ['Tất cả VIP 3', 'Maker 0.04% — tốt nhất thị trường', 'OTC desk riêng', 'Sub-accounts không giới hạn'],
    badge: 'VIP 4',
  },
  {
    level: 5,
    name: 'Market Maker',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0d1b3e 100%)',
    icon: '🚀',
    monthlyVolume: 50000000,
    assetHold: 500000,
    makerFee: 0,
    takerFee: 0.04,
    withdrawLimit: 100000000,
    features: ['Tất cả VIP 4', 'Maker fee = 0%', 'Colocation API', 'Custom fee negotiation', 'Hỗ trợ 24/7 riêng'],
    badge: 'MM',
  },
];

// User current state (mock VIP 1)
const USER_VIP = {
  level: 1,
  monthlyVolume: 12450,
  assetHold: 54276,
};

export function VIPPage() {
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'benefits' | 'history'>('overview');
  const currentTier = VIP_TIERS[USER_VIP.level];
  const nextTier = VIP_TIERS[USER_VIP.level + 1] ?? null;

  const volumeProgress = nextTier
    ? Math.min(100, (USER_VIP.monthlyVolume / nextTier.monthlyVolume) * 100)
    : 100;
  const assetProgress = nextTier
    ? Math.min(100, (USER_VIP.assetHold / nextTier.assetHold) * 100)
    : 100;

  return (
    <PageLayout>
      <Header title="VIP Program" subtitle="VIP · Profile" back />

      <PageContent gap="relaxed">
      {/* Current VIP card */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: currentTier.gradient, border: `1px solid ${currentTier.color}44` }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
          style={{ background: currentTier.color, transform: 'translate(40%, -40%)' }} />

        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              {currentTier.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Crown size={16} color={currentTier.color} />
                <span style={{ color: currentTier.color, fontSize: 18, fontWeight: 800 }}>{currentTier.name}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Thành viên từ 15/08/2023</p>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1.5 rounded-xl"
              style={{ background: `${currentTier.color}33`, border: `1px solid ${currentTier.color}55` }}>
              <span style={{ color: currentTier.color, fontSize: 13, fontWeight: 700 }}>{currentTier.badge}</span>
            </div>
          </div>
        </div>

        {/* Fee highlights */}
        <div className="grid grid-cols-2 gap-3 relative">
          {[
            { label: 'Maker fee', value: `${currentTier.makerFee.toFixed(2)}%`, color: '#10B981' },
            { label: 'Taker fee', value: `${currentTier.takerFee.toFixed(2)}%`, color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
        {[
          { id: 'overview', label: '📊 Tổng quan' },
          { id: 'benefits', label: '🎁 Đặc quyền' },
          { id: 'history', label: '📋 Lịch sử' },
        ].map(t => (
          <button key={t.id} onClick={() => setSelectedTab(t.id as any)}
            className="flex-1 h-10 rounded-xl text-xs font-semibold"
            style={{ background: selectedTab === t.id ? c.chipActiveBg : 'transparent', color: selectedTab === t.id ? c.chipActiveText : c.text2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content with animation */}
      {/* OVERVIEW TAB */}
        {selectedTab === 'overview' && (
          <div
            key="overview"
            className="flex flex-col gap-4"
          >
            {/* Progress to next VIP */}
            {nextTier && (
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: 13 }}>Tiến độ lên hạng</span>
                  <span style={{ color: nextTier.color, fontSize: 13 }}>{nextTier.icon}</span>
                </div>

                {/* Volume progress */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: c.text2, fontSize: 13 }}>Khối lượng 30 ngày</span>
                    <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                      ${fmtUsd(USER_VIP.monthlyVolume)} / ${fmtUsd(nextTier.monthlyVolume)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: c.borderSolid }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${volumeProgress}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }} />
                  </div>
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                    Cần thêm ${fmtUsd(nextTier.monthlyVolume - USER_VIP.monthlyVolume)} để đạt mục tiêu
                  </p>
                </div>

                {/* Asset hold progress */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: c.text2, fontSize: 13 }}>Tài sản đang giữ</span>
                    <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                      ${fmtUsd(USER_VIP.assetHold)} / ${fmtUsd(nextTier.assetHold)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: c.borderSolid }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${assetProgress}%`, background: 'linear-gradient(90deg, #10B981, #3B82F6)' }} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Check size={11} color="#10B981" />
                    <p style={{ color: '#10B981', fontSize: 11 }}>
                      Điều kiện tài sản đã đạt ✓
                    </p>
                  </div>
                </div>
              </TrCard>
            )}

            {/* VIP Tier table */}
            <TrCard overflow>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>So sánh các cấp VIP</p>
              </div>
              {/* Header */}
              <div className="grid px-4 py-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: `1px solid ${c.border}` }}>
                {['Cấp độ', 'Volume/tháng', 'Maker', 'Taker'].map(h => (
                  <span key={h} style={{ color: c.text3, fontSize: 11 }}>{h}</span>
                ))}
              </div>
              {VIP_TIERS.map(tier => (
                <div key={tier.level}
                  className="grid px-4 py-3 items-center"
                  style={{
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    borderBottom: `1px solid ${c.divider}`,
                    background: tier.level === USER_VIP.level ? 'rgba(59,130,246,0.05)' : 'transparent',
                  }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 14 }}>{tier.icon}</span>
                    <span style={{ color: tier.level === USER_VIP.level ? '#3B82F6' : c.text1, fontSize: 12, fontWeight: tier.level === USER_VIP.level ? 700 : 400 }}>
                      {tier.name}
                    </span>
                    {tier.level === USER_VIP.level && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3B82F6' }} />
                    )}
                  </div>
                  <span style={{ color: c.text2, fontSize: 11 }}>
                    {tier.monthlyVolume === 0 ? '—' : fmtVolume(tier.monthlyVolume)}
                  </span>
                  <span style={{ color: tier.level === USER_VIP.level ? '#10B981' : c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {tier.makerFee === 0 ? '0%' : `${tier.makerFee.toFixed(2)}%`}
                  </span>
                  <span style={{ color: tier.level === USER_VIP.level ? '#10B981' : c.text1, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {tier.takerFee === 0 ? '0%' : `${tier.takerFee.toFixed(2)}%`}
                  </span>
                </div>
              ))}
            </TrCard>

            {/* Fee savings calculation */}
            <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} color="#10B981" />
                <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>Tiết kiệm phí của bạn</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tháng này', value: '$12.45', sub: 'vs. Standard rate' },
                  { label: 'Tổng tích lũy', value: '$89.30', sub: 'từ 15/08/2023' },
                ].map((s, i) => (
                  <div key={s.label} className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 11 }}>{s.label}</p>
                    <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{s.sub}</p>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {/* BENEFITS TAB */}
        {selectedTab === 'benefits' && (
          <div
            key="benefits"
            className="flex flex-col gap-3"
          >
            {VIP_TIERS.filter(t => t.level > 0).map((tier, idx) => {
              const isUnlocked = USER_VIP.level >= tier.level;
              return (
                <div
                  key={tier.level}
                >
                  <TrCard overflow
                    accentBorder={isUnlocked ? tier.color + '44' : undefined}
                    style={{ opacity: isUnlocked ? 1 : 0.6 }}>
                    <div className="px-4 py-3 flex items-center gap-3"
                      style={{ background: isUnlocked ? tier.color + '15' : 'transparent', borderBottom: `1px solid ${c.divider}` }}>
                      <span style={{ fontSize: 20 }}>{tier.icon}</span>
                      <div className="flex-1">
                        <span style={{ color: isUnlocked ? tier.color : c.text2, fontSize: 15, fontWeight: 700 }}>{tier.name}</span>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Volume ≥ ${fmtUsd(tier.monthlyVolume)}/tháng hoặc Tài sản ≥ ${fmtUsd(tier.assetHold)}
                        </p>
                      </div>
                      {isUnlocked ? (
                        <Check size={18} color={tier.color} />
                      ) : (
                        <Lock size={16} color={c.text3} />
                      )}
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-2">
                      {tier.features.map((feature, i) => (
                        <div key={feature} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: isUnlocked ? tier.color + '22' : c.surface2 }}>
                            <Check size={9} color={isUnlocked ? tier.color : c.text3} />
                          </div>
                          <span style={{ color: isUnlocked ? c.text1 : c.text3, fontSize: 13 }}>{feature}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div className="flex gap-4">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Maker</p>
                            <p style={{ color: isUnlocked ? '#10B981' : c.text2, fontSize: 13, fontWeight: 700 }}>{tier.makerFee === 0 ? '0%' : `${tier.makerFee.toFixed(2)}%`}</p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Taker</p>
                            <p style={{ color: isUnlocked ? '#10B981' : c.text2, fontSize: 13, fontWeight: 700 }}>{tier.takerFee === 0 ? '0%' : `${tier.takerFee.toFixed(2)}%`}</p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Hạn mức rút</p>
                            <p style={{ color: c.text2, fontSize: 13 }}>{fmtCompact(tier.withdrawLimit, { prefix: '$' })}/ngày</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                </div>
              );
            })}

            {/* Upgrade CTA */}
            {nextTier && (
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Award size={20} color="#3B82F6" />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Nâng cấp lên {nextTier.name}</p>
                  <p style={{ color: c.text2, fontSize: 12 }}>Tăng khối lượng giao dịch để tiết kiệm thêm</p>
                </div>
                <button onClick={() => navigate(routePrefix + '/trade/btcusdt')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: '#3B82F6', color: '#fff' }}>
                  Giao dịch
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {selectedTab === 'history' && (
          <div
            key="history"
            className="flex flex-col gap-3"
          >
            {[
              { date: '2026-02-23', volume: '$12,450', level: 'VIP 1', fee: '$11.21', saved: '$1.24' },
              { date: '2026-01-23', volume: '$28,340', level: 'VIP 1', fee: '$25.51', saved: '$2.83' },
              { date: '2025-12-23', volume: '$45,120', level: 'VIP 1', fee: '$40.61', saved: '$4.51' },
              { date: '2025-11-23', volume: '$8,900', level: 'Standard', fee: '$8.90', saved: '$0' },
              { date: '2025-10-23', volume: '$5,600', level: 'Standard', fee: '$5.60', saved: '$0' },
            ].map((row, idx) => (
              <div key={row.date}>
                <TrCard className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 13 }}>{row.date}</span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{ background: row.level !== 'Standard' ? 'rgba(245,158,11,0.12)' : c.surface2, color: row.level !== 'Standard' ? '#F59E0B' : c.text2 }}>
                      {row.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Khối lượng', value: row.volume },
                      { label: 'Phí đã trả', value: row.fee },
                      { label: 'Tiết kiệm', value: row.saved, color: '#10B981' },
                    ].map(r => (
                      <div key={r.label}>
                        <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
                        <p style={{ color: (r as any).color ?? c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                </TrCard>
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}