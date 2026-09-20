/**
 * ══════════════════════════════════════════════════════════
 *  WEB VIP PROGRAM PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/vip
 *
 *  VIP tier system with fee discounts & exclusive benefits
 *  - Current tier status & progress
 *  - Tier comparison table
 *  - Trading volume requirements
 *  - Fee breakdown (Maker/Taker)
 *  - Exclusive benefits per tier
 *  - Tier upgrade roadmap
 *
 *  Guidelines compliance:
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout pattern
 *  - WEB_FONT flat tokens only
 *  - Enterprise-grade design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Crown,
  TrendingUp,
  Award,
  Gift,
  Users,
  Zap,
  Star,
  ChevronRight,
  Check,
  Lock,
  Sparkles,
  Target,
  BadgePercent,
  Shield,
  Headphones,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface VIPTier {
  level: number;
  name: string;
  color: string;
  gradient: string;
  volumeRequired: number; // 30-day trading volume in USDT
  makerFee: number;
  takerFee: number;
  benefits: string[];
  exclusivePerks?: string[];
}

interface UserVIPStatus {
  currentTier: number;
  volume30d: number;
  nextTierVolume: number;
  progress: number; // 0-100
  referralCount: number;
  stakingAmount: number;
}

const VIP_TIERS: VIPTier[] = [
  {
    level: 0,
    name: 'Regular',
    color: '#94A3B8',
    gradient: 'linear-gradient(135deg, #94A3B8, #64748B)',
    volumeRequired: 0,
    makerFee: 0.1,
    takerFee: 0.15,
    benefits: ['Giao dịch cơ bản', 'Hỗ trợ email'],
  },
  {
    level: 1,
    name: 'Bronze',
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)',
    volumeRequired: 50000,
    makerFee: 0.09,
    takerFee: 0.14,
    benefits: ['Fee giảm 10%', 'Rút tiền ưu tiên', 'Chat support'],
  },
  {
    level: 2,
    name: 'Silver',
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
    volumeRequired: 200000,
    makerFee: 0.08,
    takerFee: 0.13,
    benefits: ['Fee giảm 20%', 'API key không giới hạn', 'NFT badge độc quyền'],
    exclusivePerks: ['Early access Launchpad'],
  },
  {
    level: 3,
    name: 'Gold',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    volumeRequired: 1000000,
    makerFee: 0.07,
    takerFee: 0.11,
    benefits: ['Fee giảm 30%', 'Account manager', 'Staking APY +2%'],
    exclusivePerks: ['Private trading room', 'Research reports'],
  },
  {
    level: 4,
    name: 'Platinum',
    color: '#E5E4E2',
    gradient: 'linear-gradient(135deg, #E5E4E2, #BCC6CC)',
    volumeRequired: 5000000,
    makerFee: 0.05,
    takerFee: 0.09,
    benefits: ['Fee giảm 50%', 'Priority customer support', 'Insurance coverage'],
    exclusivePerks: ['OTC desk access', 'Exclusive events'],
  },
  {
    level: 5,
    name: 'Diamond',
    color: '#B9F2FF',
    gradient: 'linear-gradient(135deg, #B9F2FF, #00D4FF)',
    volumeRequired: 20000000,
    makerFee: 0.03,
    takerFee: 0.07,
    benefits: ['Fee tối ưu', 'Dedicated account team', 'Unlimited everything'],
    exclusivePerks: ['Custom trading solutions', 'VIP lounge access', 'Institutional services'],
  },
];

const USER_STATUS: UserVIPStatus = {
  currentTier: 1,
  volume30d: 125000,
  nextTierVolume: 200000,
  progress: 62.5,
  referralCount: 12,
  stakingAmount: 50000,
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function TierProgressCard({ status, tiers }: { status: UserVIPStatus; tiers: VIPTier[] }) {
  const c = useThemeColors();
  const currentTier = tiers[status.currentTier];
  const nextTier = tiers[status.currentTier + 1];

  const volumeRemaining = status.nextTierVolume - status.volume30d;

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${currentTier.color}20, ${currentTier.color}05)`,
        border: `2px solid ${currentTier.color}40`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: currentTier.gradient,
          }}
        >
          <Crown size={28} color="#fff" />
        </div>
        <div>
          <div style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
            Tier hiện tại
          </div>
          <div style={{ color: c.text1, fontSize: 24, fontWeight: 800 }}>{currentTier.name}</div>
        </div>
      </div>

      {nextTier && (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                Tiến độ lên {nextTier.name}
              </span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                {status.progress.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.bg }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${status.progress}%`,
                  background: nextTier.gradient,
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between mt-4 pt-4"
            style={{ borderTop: `1px solid ${c.divider}` }}
          >
            <div>
              <div style={{ color: c.text2, fontSize: WEB_FONT.xs }}>Khối lượng 30 ngày</div>
              <div style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
                ${status.volume30d.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div style={{ color: c.text2, fontSize: WEB_FONT.xs }}>Cần thêm</div>
              <div style={{ color: nextTier.color, fontSize: WEB_FONT.base, fontWeight: 700 }}>
                ${volumeRemaining.toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TierComparisonTable({ tiers, currentTier }: { tiers: VIPTier[]; currentTier: number }) {
  const c = useThemeColors();

  return (
    <div className="overflow-x-auto">
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: 16,
                color: c.text2,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                background: c.surface,
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              Tier
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: 16,
                color: c.text2,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                background: c.surface,
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              Khối lượng 30d
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: 16,
                color: c.text2,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                background: c.surface,
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              Maker
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: 16,
                color: c.text2,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                background: c.surface,
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              Taker
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: 16,
                color: c.text2,
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
                background: c.surface,
                borderBottom: `1px solid ${c.divider}`,
              }}
            >
              Đặc quyền
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr
              key={tier.level}
              style={{
                background: tier.level === currentTier ? `${tier.color}10` : c.surface,
              }}
            >
              <td
                style={{
                  padding: 16,
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 40,
                      height: 40,
                      background: tier.gradient,
                    }}
                  >
                    <Crown size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
                      {tier.name}
                    </div>
                    {tier.level === currentTier && (
                      <div
                        style={{
                          color: tier.color,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                        }}
                      >
                        Tier hiện tại
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: 16,
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                {tier.volumeRequired === 0 ? '—' : `$${tier.volumeRequired.toLocaleString()}`}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: 16,
                  color: '#10B981',
                  fontSize: WEB_FONT.base,
                  fontWeight: 700,
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                {tier.makerFee}%
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: 16,
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  fontWeight: 700,
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                {tier.takerFee}%
              </td>
              <td
                style={{
                  padding: 16,
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                <div className="flex flex-wrap gap-1">
                  {tier.benefits.slice(0, 2).map((benefit, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded"
                      style={{
                        background: `${tier.color}15`,
                        color: tier.color,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                      }}
                    >
                      {benefit}
                    </span>
                  ))}
                  {tier.benefits.length > 2 && (
                    <span
                      style={{
                        color: c.text3,
                        fontSize: WEB_FONT.xs,
                      }}
                    >
                      +{tier.benefits.length - 2}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebVIPProgramPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const currentTier = VIP_TIERS[USER_STATUS.currentTier];

  const benefits = [
    { icon: BadgePercent, label: 'Phí giao dịch giảm', value: 'Lên tới 70%' },
    { icon: Zap, label: 'Rút tiền ưu tiên', value: '24/7 nhanh' },
    { icon: Headphones, label: 'Hỗ trợ chuyên biệt', value: 'VIP support' },
    { icon: Gift, label: 'Phần thưởng độc quyền', value: 'Airdrops & NFT' },
    { icon: Shield, label: 'Bảo hiểm tài sản', value: 'Tier 4+' },
    { icon: Users, label: 'Cộng đồng VIP', value: 'Sự kiện riêng' },
  ];

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (280px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 280,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.xl,
                fontWeight: 700,
                margin: 0,
              }}
            >
              VIP Program
            </h2>
          </div>

          {/* Current Tier Card */}
          <div className="p-4">
            <TierProgressCard status={USER_STATUS} tiers={VIP_TIERS} />
          </div>

          {/* Quick Stats */}
          <div className="px-4 pb-4">
            <div
              style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 12 }}
            >
              Thống kê
            </div>
            <div className="flex flex-col gap-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ color: c.text2, fontSize: WEB_FONT.xs, marginBottom: 4 }}>
                  Tiết kiệm phí (30d)
                </div>
                <div style={{ color: '#10B981', fontSize: 18, fontWeight: 800 }}>$1,234</div>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ color: c.text2, fontSize: WEB_FONT.xs, marginBottom: 4 }}>
                  Giới thiệu bạn bè
                </div>
                <div style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>
                  {USER_STATUS.referralCount}
                  <span style={{ fontSize: WEB_FONT.xs, fontWeight: 600, color: c.text3 }}>
                    {' '}
                    người
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto p-8">
            {/* Benefits Grid */}
            <section className="mb-8">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Quyền lợi VIP
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.label}
                      className="p-4 rounded-xl"
                      style={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-xl mb-3"
                        style={{
                          width: 48,
                          height: 48,
                          background: `${currentTier.color}15`,
                        }}
                      >
                        <Icon size={24} color={currentTier.color} />
                      </div>
                      <div
                        style={{
                          color: c.text1,
                          fontSize: WEB_FONT.base,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {benefit.label}
                      </div>
                      <div style={{ color: c.text2, fontSize: WEB_FONT.xs }}>{benefit.value}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tier Comparison Table */}
            <section className="mb-8">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                So sánh tier
              </h3>

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <TierComparisonTable tiers={VIP_TIERS} currentTier={USER_STATUS.currentTier} />
              </div>
            </section>

            {/* How to Upgrade */}
            <section>
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Cách nâng tier
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-5 rounded-xl"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Target size={32} color="#3B82F6" className="mb-3" />
                  <div
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.base,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Tăng khối lượng giao dịch
                  </div>
                  <div style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.6 }}>
                    Khối lượng giao dịch 30 ngày được tính tự động. Giao dịch nhiều hơn để đạt tier
                    cao hơn.
                  </div>
                </div>

                <div
                  className="p-5 rounded-xl"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Users size={32} color="#10B981" className="mb-3" />
                  <div
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.base,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Giới thiệu bạn bè
                  </div>
                  <div style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.6 }}>
                    Mỗi bạn bè active +5% khối lượng tương đương. Tối đa 50% boost.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
