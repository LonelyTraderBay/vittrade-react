/**
 * ══════════════════════════════════════════════════════════
 *  P2PTransactionLimitsPage — /p2p/limits
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Transaction limits by KYC tier
 *  Daily/weekly/monthly limits, per-transaction limits
 *  Limit increase request flow
 *  Tone: Clear, regulatory compliance, transparent
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, Lock, Shield, ChevronRight, Info,
  AlertCircle, CheckCircle, Clock, FileText, ArrowUp,
  DollarSign, Calendar, BarChart3,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   KYC Tier Configuration
   ═══════════════════════════════════════════════════════════ */
interface LimitTier {
  tier: number;
  name: string;
  color: string;
  limits: {
    dailyBuy: number;
    dailySell: number;
    weeklyTotal: number;
    monthlyTotal: number;
    perTransaction: number;
  };
  requirements: string[];
}

const LIMIT_TIERS: LimitTier[] = [
  {
    tier: 1,
    name: 'Basic',
    color: '#10B981',
    limits: {
      dailyBuy: 50_000_000,
      dailySell: 50_000_000,
      weeklyTotal: 300_000_000,
      monthlyTotal: 1_000_000_000,
      perTransaction: 20_000_000,
    },
    requirements: ['KYC Basic (CMND/CCCD)'],
  },
  {
    tier: 2,
    name: 'Intermediate',
    color: '#3B82F6',
    limits: {
      dailyBuy: 200_000_000,
      dailySell: 200_000_000,
      weeklyTotal: 1_200_000_000,
      monthlyTotal: 4_000_000_000,
      perTransaction: 100_000_000,
    },
    requirements: ['KYC Intermediate', 'Proof of Address', 'Selfie Verification'],
  },
  {
    tier: 3,
    name: 'Advanced',
    color: '#F59E0B',
    limits: {
      dailyBuy: 1_000_000_000,
      dailySell: 1_000_000_000,
      weeklyTotal: 6_000_000_000,
      monthlyTotal: 20_000_000_000,
      perTransaction: 500_000_000,
    },
    requirements: ['KYC Advanced', 'Video Verification', 'Source of Funds', 'Enhanced DD'],
  },
];

const CURRENT_TIER = 1;

/* ═══════════════════════════════════════════════════════════
   Current Usage Mock Data
   ═══════════════════════════════════════════════════════════ */
const CURRENT_USAGE = {
  daily: {
    buy: 35_000_000,
    sell: 15_000_000,
  },
  weekly: 180_000_000,
  monthly: 650_000_000,
};

/* ═══════════════════════════════════════════════════════════
   Limit Card Component
   ═══════════════════════════════════════════════════════════ */
function LimitCard({
  label,
  current,
  max,
  unit = 'VND',
  color = '#3B82F6',
  showProgress = true,
}: {
  label: string;
  current: number;
  max: number;
  unit?: string;
  color?: string;
  showProgress?: boolean;
}) {
  const c = useThemeColors();
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ color: c.text3, fontSize: 10 }}>
          {fmtAmount(current, 0)} / {fmtAmount(max, 0)} {unit}
        </span>
      </div>

      {showProgress && (
        <>
          <div
            className="h-2 rounded-full overflow-hidden mb-1"
            style={{ background: c.surface2 }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                background: isNearLimit
                  ? 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
                  : `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span
              style={{
                color: isNearLimit ? '#EF4444' : color,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {percentage.toFixed(1)}% đã dùng
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>
              Còn lại: {fmtAmount(max - current, 0)} {unit}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PTransactionLimitsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const currentTierData = LIMIT_TIERS.find(t => t.tier === CURRENT_TIER)!;
  const nextTierData = LIMIT_TIERS.find(t => t.tier === CURRENT_TIER + 1);

  return (
    <PageLayout>
      <Header
        title="Transaction Limits"
        subtitle="Hạn mức · P2P"
        back
        action={{
          icon: BarChart3,
        }}
      />

      {/* Current Tier Card */}
      <div className="px-5 py-4">
        <TrCard
          rounded="lg"
          className="p-4"
          style={{
            background: `linear-gradient(135deg, ${currentTierData.color} 0%, ${currentTierData.color}CC 100%)`,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={20} color="#FFFFFF" />
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>
                  Tier {currentTierData.tier} - {currentTierData.name}
                </h2>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>
                Giới hạn hiện tại của bạn
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <span style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700 }}>
                Đang dùng
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginBottom: 4 }}>
                Mua/ngày
              </p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>
                {fmtAmount(currentTierData.limits.dailyBuy / 1_000_000, 0)}M VND
              </p>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginBottom: 4 }}>
                Bán/ngày
              </p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>
                {fmtAmount(currentTierData.limits.dailySell / 1_000_000, 0)}M VND
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Current Usage */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            Sử dụng hiện tại
          </h3>
          <button
            onClick={() => {
              hapticSelection();
              navigate(`${prefix}/p2p/limit-tracker`);
            }}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: '#3B82F6' }}
          >
            Xem chi tiết
            <ChevronRight size={12} />
          </button>
        </div>

        <TrCard rounded="lg" className="p-4">
          <div className="flex flex-col gap-4">
            <LimitCard
              label="Mua hôm nay"
              current={CURRENT_USAGE.daily.buy}
              max={currentTierData.limits.dailyBuy}
              color="#10B981"
            />
            <LimitCard
              label="Bán hôm nay"
              current={CURRENT_USAGE.daily.sell}
              max={currentTierData.limits.dailySell}
              color="#3B82F6"
            />
            <LimitCard
              label="Tuần này"
              current={CURRENT_USAGE.weekly}
              max={currentTierData.limits.weeklyTotal}
              color="#8B5CF6"
            />
            <LimitCard
              label="Tháng này"
              current={CURRENT_USAGE.monthly}
              max={currentTierData.limits.monthlyTotal}
              color="#F59E0B"
            />
          </div>
        </TrCard>
      </div>

      {/* Detailed Limits */}
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Chi tiết giới hạn
        </h3>

        <TrCard rounded="lg" className="overflow-hidden">
          {[
            { label: 'Mua tối đa/ngày', value: currentTierData.limits.dailyBuy, icon: TrendingUp, color: '#10B981' },
            { label: 'Bán tối đa/ngày', value: currentTierData.limits.dailySell, icon: TrendingUp, color: '#3B82F6' },
            { label: 'Tổng/tuần', value: currentTierData.limits.weeklyTotal, icon: Calendar, color: '#8B5CF6' },
            { label: 'Tổng/tháng', value: currentTierData.limits.monthlyTotal, icon: Calendar, color: '#F59E0B' },
            { label: 'Tối đa/giao dịch', value: currentTierData.limits.perTransaction, icon: DollarSign, color: '#EF4444' },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            const isLast = idx === 4;

            return (
              <div
                key={idx}
                className="p-4 flex items-center gap-3"
                style={{
                  borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: hexToRgba(item.color, 12) }}
                >
                  <ItemIcon size={18} color={item.color} />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text2, fontSize: 11, marginBottom: 2 }}>
                    {item.label}
                  </p>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    {fmtAmount(item.value, 0)} VND
                  </p>
                </div>
              </div>
            );
          })}
        </TrCard>
      </div>

      {/* Upgrade Section */}
      {nextTierData && (
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Nâng cấp giới hạn
          </h3>

          <TrCard rounded="lg" className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(nextTierData.color, 12) }}
              >
                <ArrowUp size={24} color={nextTierData.color} />
              </div>
              <div className="flex-1">
                <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
                  Nâng lên Tier {nextTierData.tier} - {nextTierData.name}
                </h4>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Tăng giới hạn lên đến{' '}
                  <span style={{ color: nextTierData.color, fontWeight: 700 }}>
                    {fmtAmount(nextTierData.limits.monthlyTotal / 1_000_000, 0)}M VND/tháng
                  </span>
                </p>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-4">
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                Yêu cầu:
              </p>
              <div className="flex flex-col gap-2">
                {nextTierData.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Lock size={12} color={c.text3} className="shrink-0 mt-1" />
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/kyc/requirements`);
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: nextTierData.color, color: '#FFFFFF' }}
            >
              Bắt đầu nâng cấp
              <ChevronRight size={16} />
            </button>
          </TrCard>
        </div>
      )}

      {/* Info Notice */}
      <div className="px-5">
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ background: hexToRgba('#3B82F6', 10), border: `1px solid ${hexToRgba('#3B82F6', 30)}` }}
        >
          <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
              Lưu ý về giới hạn
            </p>
            <ul style={{ color: c.text2, fontSize: 10, lineHeight: 1.6, paddingLeft: 16 }}>
              <li>Giới hạn reset vào 00:00 UTC+7 mỗi ngày/tuần/tháng</li>
              <li>Giới hạn áp dụng cho cả Buy và Sell orders</li>
              <li>Số tiền đang trong escrow không tính vào giới hạn</li>
              <li>Giới hạn c�� thể thay đổi theo chính sách compliance</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}