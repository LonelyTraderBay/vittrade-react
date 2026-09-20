/**
 * ══════════════════════════════════════════════════════════════════
 *  MARGIN SAFETY COMPONENTS — P0 Regulatory & Safety Features
 * ══════════════════════════════════════════════════════════════════
 *  Enterprise-level margin trading safety components:
 *  - Margin Call Alerts
 *  - Mark Price vs Last Price
 *  - IMR/MMR Disclosure
 *  - ADL Indicator
 *  - Negative Balance Protection
 *  - Leverage Warning (EU/UK/SG compliance)
 *  - Cost Breakdown (MiFID II transparency)
 */

import React from 'react';
import {
  AlertTriangle, Info, Shield, TrendingUp, TrendingDown,
  Bell, Target, DollarSign, Zap, Clock, Activity,
} from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. MARGIN LEVEL ALERT SYSTEM
   ═══════════════════════════════════════════════════════════════ */

interface MarginLevelAlertProps {
  marginLevel: number; // percentage (e.g., 204.8%)
  className?: string;
}

export function MarginLevelAlert({ marginLevel, className = '' }: MarginLevelAlertProps) {
  const c = useThemeColors();

  // Thresholds (industry standard)
  const SAFE = 150;
  const CAUTION = 120;
  const WARNING = 110;
  const DANGER = 105;

  const getAlertConfig = () => {
    if (marginLevel >= SAFE) {
      return {
        level: 'safe',
        color: '#10B981',
        bg: withAlpha('#10B981', ALPHA.soft),
        border: withAlpha('#10B981', ALPHA.muted),
        icon: Shield,
        title: 'Tài khoản an toàn',
        message: 'Margin level của bạn đang ở mức an toàn.',
        action: null,
      };
    }
    if (marginLevel >= CAUTION) {
      return {
        level: 'caution',
        color: '#F59E0B',
        bg: withAlpha('#F59E0B', ALPHA.soft),
        border: withAlpha('#F59E0B', ALPHA.muted),
        icon: Info,
        title: 'Lưu ý',
        message: 'Margin level đang giảm. Theo dõi vị thế thường xuyên.',
        action: 'Cân nhắc thêm margin hoặc đóng bớt vị thế.',
      };
    }
    if (marginLevel >= WARNING) {
      return {
        level: 'warning',
        color: '#F97316',
        bg: withAlpha('#F97316', ALPHA.soft),
        border: withAlpha('#F97316', ALPHA.muted),
        icon: AlertTriangle,
        title: 'Cảnh báo - Margin Call',
        message: `Margin level ${marginLevel.toFixed(1)}% gần ngưỡng thanh lý!`,
        action: 'Hành động ngay: Thêm margin hoặc đóng vị thế để tránh thanh lý.',
      };
    }
    return {
      level: 'danger',
      color: '#EF4444',
      bg: withAlpha('#EF4444', ALPHA.soft),
      border: withAlpha('#EF4444', ALPHA.muted),
      icon: AlertTriangle,
      title: 'NGUY HIỂM - Sắp thanh lý',
      message: `Margin level ${marginLevel.toFixed(1)}% cực kỳ thấp!`,
      action: 'HÀNH ĐỘNG NGAY LẬP TỨC: Vị thế của bạn sắp bị thanh lý tự động.',
    };
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  // Don't show alert if safe
  if (config.level === 'safe') return null;

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{
        background: config.bg,
        border: `1.5px solid ${config.border}`,
        ...(config.level === 'danger' && {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }),
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha(config.color, ALPHA.muted) }}
        >
          <Icon size={ICON_SIZE.md} color={config.color} strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p style={{ color: config.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {config.title}
            </p>
            <span
              className="px-2 py-0.5 rounded-lg"
              style={{
                background: withAlpha(config.color, ALPHA.muted),
                color: config.color,
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {marginLevel.toFixed(1)}%
            </span>
          </div>
          <p style={{ color: config.color, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 6 }}>
            {config.message}
          </p>
          {config.action && (
            <p style={{ color: config.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              ⚠️ {config.action}
            </p>
          )}
        </div>
      </div>

      {/* Margin level bar */}
      <div className="mt-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, marginLevel / 3)}%`,
              background: config.color,
              boxShadow: `0 0 8px ${config.color}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ color: c.text3, fontSize: 9 }}>0%</span>
          <span style={{ color: c.text3, fontSize: 9 }}>100% = Liq</span>
          <span style={{ color: c.text3, fontSize: 9 }}>300%</span>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. MARK PRICE VS LAST PRICE DISPLAY
   ═══════════════════════════════════════════════════════════════ */

interface PriceComparisonProps {
  markPrice: number;
  lastPrice: number;
  indexPrice: number;
  className?: string;
}

export function PriceComparison({ markPrice, lastPrice, indexPrice, className = '' }: PriceComparisonProps) {
  const c = useThemeColors();

  const spread = ((lastPrice - markPrice) / markPrice) * 100;
  const isDeviation = Math.abs(spread) > 0.1; // 0.1% deviation threshold

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Giá tham chiếu
          </span>
        </div>
        {isDeviation && (
          <span
            className="px-2 py-0.5 rounded-lg"
            style={{
              background: withAlpha('#F59E0B', ALPHA.soft),
              color: '#F59E0B',
              fontSize: FONT_SCALE.micro,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            Lệch {spread.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Mark Price (Used for liquidation) */}
        <div className="rounded-xl p-3" style={{ background: withAlpha(c.primary, ALPHA.hover) }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Mark Price</p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ background: withAlpha(c.primary, ALPHA.muted), border: `1px solid ${withAlpha(c.primary, ALPHA.border)}` }}
            >
              <span style={{ color: c.primary, fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>Dùng cho thanh lý</span>
            </div>
          </div>
        </div>

        {/* Last Price */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Last Price</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá khớp lệnh gần nhất</span>
        </div>

        {/* Index Price */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Index Price</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              ${indexPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Avg của các sàn</span>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover), border: `1px solid ${withAlpha('#3B82F6', ALPHA.soft)}` }}
      >
        <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
        <p style={{ color: '#3B82F6', fontSize: 10, lineHeight: 1.5 }}>
          <strong>Mark Price</strong> được dùng để tính PnL và thanh lý, giúp tránh manipulation từ flash crash.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. IMR/MMR DISCLOSURE
   ═══════════════════════════════════════════════════════════════ */

interface MarginRequirementProps {
  leverage: number;
  positionSize: number;
  mode: 'cross' | 'isolated';
  className?: string;
}

export function MarginRequirement({ leverage, positionSize, mode, className = '' }: MarginRequirementProps) {
  const c = useThemeColors();

  // Industry standard margins
  const IMR = 100 / leverage; // Initial Margin Ratio
  const MMR = IMR * 0.5; // Maintenance Margin Ratio (usually 50% of IMR)

  const initialMargin = (positionSize * IMR) / 100;
  const maintenanceMargin = (positionSize * MMR) / 100;

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Target size={ICON_SIZE.sm} color="#8B5CF6" strokeWidth={ICON_STROKE.standard} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Yêu cầu ký quỹ ({leverage}x)
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* IMR */}
        <div
          className="rounded-xl p-3"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Initial Margin Ratio (IMR)</span>
            <span style={{ color: '#8B5CF6', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {IMR.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Margin cần để mở vị thế</span>
            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              ${initialMargin.toFixed(2)}
            </span>
          </div>
        </div>

        {/* MMR */}
        <div
          className="rounded-xl p-3"
          style={{ background: withAlpha('#EF4444', ALPHA.hover), border: `1px solid ${withAlpha('#EF4444', ALPHA.soft)}` }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Maintenance Margin Ratio (MMR)</span>
            <span style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {MMR.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Margin tối thiểu để giữ vị thế</span>
            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              ${maintenanceMargin.toFixed(2)}
            </span>
          </div>
          <p style={{ color: '#EF4444', fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
            ⚠️ Nếu margin của bạn &lt; MMR, vị thế sẽ bị thanh lý tự động
          </p>
        </div>

        {/* Mode badge */}
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-lg"
            style={{
              background: mode === 'cross' ? withAlpha(c.primary, ALPHA.soft) : withAlpha('#F59E0B', ALPHA.soft),
              color: mode === 'cross' ? c.primary : '#F59E0B',
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
            }}
          >
            {mode === 'cross' ? 'CROSS MARGIN' : 'ISOLATED MARGIN'}
          </span>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
            {mode === 'cross'
              ? 'Dùng chung toàn bộ số dư ví'
              : 'Chỉ rủi ro margin của vị thế này'}
          </span>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. ADL (AUTO-DELEVERAGING) INDICATOR
   ═══════════════════════════════════════════════════════════════ */

interface ADLIndicatorProps {
  queuePosition: 1 | 2 | 3 | 4 | 5; // 1 = highest risk, 5 = lowest
  className?: string;
}

export function ADLIndicator({ queuePosition, className = '' }: ADLIndicatorProps) {
  const c = useThemeColors();

  const getConfig = () => {
    if (queuePosition === 1) {
      return {
        color: '#EF4444',
        label: 'Rủi ro rất cao',
        message: 'Vị thế của bạn ở hàng đầu trong hàng đợi ADL. Có thể bị đóng tự động nếu xảy ra thanh lý lớn.',
      };
    }
    if (queuePosition === 2) {
      return {
        color: '#F97316',
        label: 'Rủi ro cao',
        message: 'Vị thế có khả năng bị ADL nếu market biến động mạnh.',
      };
    }
    if (queuePosition === 3) {
      return {
        color: '#F59E0B',
        label: 'Rủi ro trung bình',
        message: 'Vị thế ở giữa hàng đợi ADL.',
      };
    }
    return {
      color: '#10B981',
      label: 'Rủi ro thấp',
      message: 'Vị thế của bạn ít khả năng bị ADL.',
    };
  };

  const config = getConfig();

  return (
    <TrCard className={`p-3.5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap size={ICON_SIZE.sm} color={config.color} strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            ADL Queue
          </span>
        </div>
        <span style={{ color: config.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {config.label}
        </span>
      </div>

      {/* Visual indicator */}
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              background: i <= queuePosition ? config.color : c.surface2,
              opacity: i <= queuePosition ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
        {config.message}
      </p>

      <div
        className="flex items-start gap-2 mt-2.5 p-2 rounded-lg"
        style={{ background: c.surface2 }}
      >
        <Info size={11} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
          ADL xảy ra khi vị thế lỗ lớn bị thanh lý nhưng không đủ thanh khoản. Vị thế có lãi cao nhất sẽ bị đóng để bù đắp.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. TOTAL COST BREAKDOWN (MiFID II Compliance)
   ═══════════════════════════════════════════════════════════════ */

interface CostBreakdownProps {
  positionSize: number;
  tradingFeeRate: number; // e.g., 0.0005 = 0.05%
  fundingRate?: number; // e.g., 0.0001 = 0.01%
  borrowInterest?: number; // e.g., 0.02 for 2% daily
  holdDuration?: number; // hours
  className?: string;
}

export function CostBreakdown({
  positionSize,
  tradingFeeRate,
  fundingRate = 0,
  borrowInterest = 0,
  holdDuration = 8,
  className = '',
}: CostBreakdownProps) {
  const c = useThemeColors();

  const tradingFee = positionSize * tradingFeeRate;
  const fundingFee = fundingRate !== 0 ? positionSize * fundingRate * (holdDuration / 8) : 0; // Funding every 8h
  const borrowFee = borrowInterest !== 0 ? positionSize * (borrowInterest / 24) * holdDuration : 0;
  const totalCost = tradingFee + Math.abs(fundingFee) + borrowFee;

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Chi phí dự kiến
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Trading fee */}
        <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Phí giao dịch</span>
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>({(tradingFeeRate * 100).toFixed(3)}%)</span>
          </div>
          <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
            ${tradingFee.toFixed(4)}
          </span>
        </div>

        {/* Funding fee (futures) */}
        {fundingRate !== 0 && (
          <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Funding fee</span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                ({fundingRate >= 0 ? '+' : ''}{(fundingRate * 100).toFixed(4)}% × {holdDuration / 8} lần)
              </span>
            </div>
            <span
              style={{
                color: fundingFee >= 0 ? '#EF4444' : '#10B981',
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.semibold,
                fontFamily: 'monospace',
              }}
            >
              {fundingFee >= 0 ? '-' : '+'}${Math.abs(fundingFee).toFixed(4)}
            </span>
          </div>
        )}

        {/* Borrow interest (margin) */}
        {borrowInterest !== 0 && (
          <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Lãi vay ký quỹ</span>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                ({(borrowInterest * 100).toFixed(2)}%/ngày × {holdDuration}h)
              </span>
            </div>
            <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              -${borrowFee.toFixed(4)}
            </span>
          </div>
        )}

        {/* Total */}
        <div
          className="flex items-center justify-between py-2 px-3 rounded-xl mt-1"
          style={{ background: withAlpha('#F59E0B', ALPHA.soft), border: `1px solid ${withAlpha('#F59E0B', ALPHA.muted)}` }}
        >
          <span style={{ color: '#F59E0B', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Tổng chi phí
          </span>
          <span style={{ color: '#F59E0B', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${totalCost.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Disclosure */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Chi phí thực tế có thể khác tùy funding rate và thời gian giữ vị thế. Phí được tự động trừ vào số dư.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. NEGATIVE BALANCE PROTECTION BANNER
   ═══════════════════════════════════════════════════════════════ */

export function NegativeBalanceProtection({ className = '' }: { className?: string }) {
  const c = useThemeColors();

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{ background: withAlpha('#10B981', ALPHA.hover), border: `1.5px solid ${withAlpha('#10B981', ALPHA.soft)}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha('#10B981', ALPHA.muted) }}
        >
          <Shield size={ICON_SIZE.md} color="#10B981" strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
            Bảo vệ số dư âm
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
            Nền tảng cam kết <strong style={{ color: c.text1 }}>bảo vệ 100% số dư âm</strong>. 
            Bạn không bao giờ mất nhiều hơn số tiền đã nạp vào tài khoản, ngay cả trong trường hợp thanh lý.
          </p>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 6 }}>
            Insurance Fund: $12,450,000 | Cập nhật: Hàng ngày
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. LEVERAGE WARNING (EU/UK/SG REGULATORY COMPLIANCE)
   ═══════════════════════════════════════════════════════════════ */

interface LeverageWarningProps {
  leverage: number;
  region?: 'EU' | 'UK' | 'SG' | 'US' | 'OTHER';
  className?: string;
}

export function LeverageWarning({ leverage, region = 'OTHER', className = '' }: LeverageWarningProps) {
  const c = useThemeColors();

  // Regulatory stats (must be displayed in EU/UK)
  const RETAIL_LOSS_PERCENTAGE = 76; // Industry average: 76% of retail lose money

  const getWarningLevel = () => {
    if (leverage <= 5) return { color: '#F59E0B', level: 'moderate' };
    if (leverage <= 20) return { color: '#F97316', level: 'high' };
    return { color: '#EF4444', level: 'extreme' };
  };

  const config = getWarningLevel();

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{
        background: withAlpha(config.color, ALPHA.hover),
        border: `1.5px solid ${withAlpha(config.color, ALPHA.soft)}`,
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={ICON_SIZE.md} color={config.color} strokeWidth={ICON_STROKE.bold} className="shrink-0" />
        <div className="flex-1">
          {/* Regulatory warning (EU/UK/SG) */}
          {(region === 'EU' || region === 'UK' || region === 'SG') && (
            <div
              className="rounded-xl p-3 mb-3"
              style={{ background: withAlpha(config.color, ALPHA.muted), border: `1px solid ${withAlpha(config.color, ALPHA.border)}` }}
            >
              <p style={{ color: config.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
                ⚠️ Cảnh báo theo quy định {region}
              </p>
              <p style={{ color: config.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                {RETAIL_LOSS_PERCENTAGE}% nhà đầu tư cá nhân thua lỗ khi giao dịch với đòn bẩy
              </p>
            </div>
          )}

          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 6 }}>
            Rủi ro đòn bẩy {leverage}x
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span style={{ color: config.color, fontSize: FONT_SCALE.xs }}>•</span>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                Giá chỉ cần biến động <strong style={{ color: config.color }}>{(100 / leverage).toFixed(2)}%</strong> ngược chiều là bạn bị thanh lý toàn bộ vị thế
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: config.color, fontSize: FONT_SCALE.xs }}>•</span>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                Đòn bẩy cao = rủi ro cao. Chỉ giao dịch số tiền bạn có thể chấp nhận mất
              </p>
            </div>
            {leverage > 20 && (
              <div className="flex items-start gap-2">
                <span style={{ color: config.color, fontSize: FONT_SCALE.xs }}>•</span>
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                  <strong style={{ color: config.color }}>Đòn bẩy cực kỳ cao</strong> - Chỉ dành cho trader có kinh nghiệm. Luôn đặt Stop Loss
                </p>
              </div>
            )}
          </div>

          {/* Regional restrictions */}
          {region === 'EU' && leverage > 30 && (
            <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginTop: 8 }}>
              ⚠️ ESMA quy định: Nhà đầu tư cá nhân ở EU chỉ được dùng tối đa 30x cho crypto
            </p>
          )}
          {region === 'UK' && leverage > 2 && (
            <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginTop: 8 }}>
              ⚠️ FCA quy định: Nhà đầu tư cá nhân ở UK chỉ được dùng tối đa 2x cho crypto derivatives
            </p>
          )}
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. FUNDING RATE DISPLAY (FUTURES)
   ═══════════════════════════════════════════════════════════════ */

interface FundingRateDisplayProps {
  currentRate: number; // e.g., 0.0001 = 0.01%
  nextFundingIn: number; // seconds until next funding
  predictedRate?: number;
  positionSize?: number;
  side?: 'long' | 'short';
  className?: string;
}

export function FundingRateDisplay({
  currentRate,
  nextFundingIn,
  predictedRate,
  positionSize = 0,
  side = 'long',
  className = '',
}: FundingRateDisplayProps) {
  const c = useThemeColors();

  const hours = Math.floor(nextFundingIn / 3600);
  const minutes = Math.floor((nextFundingIn % 3600) / 60);

  // Calculate cost/profit
  const fundingAmount = positionSize * currentRate;
  const willPay = (side === 'long' && currentRate > 0) || (side === 'short' && currentRate < 0);

  const rateColor = currentRate >= 0 ? '#EF4444' : '#10B981';

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={ICON_SIZE.sm} color="#3B82F6" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Funding Rate
          </span>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{
            background: withAlpha(rateColor, ALPHA.soft),
            color: rateColor,
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          {currentRate >= 0 ? '+' : ''}{(currentRate * 100).toFixed(4)}%
        </span>
      </div>

      {/* Countdown */}
      <div
        className="rounded-xl p-3 mb-3"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover), border: `1px solid ${withAlpha('#3B82F6', ALPHA.soft)}` }}
      >
        <div className="flex items-center justify-between">
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Funding tiếp theo trong</span>
          <div className="flex items-center gap-1">
            <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Position impact */}
      {positionSize > 0 && (
        <div
          className="rounded-xl p-3 mb-2"
          style={{
            background: willPay ? withAlpha('#EF4444', ALPHA.hover) : withAlpha('#10B981', ALPHA.hover),
            border: `1px solid ${willPay ? withAlpha('#EF4444', ALPHA.soft) : withAlpha('#10B981', ALPHA.soft)}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
              Bạn sẽ {willPay ? 'trả' : 'nhận'}
            </span>
            <span
              style={{
                color: willPay ? '#EF4444' : '#10B981',
                fontSize: FONT_SCALE.base,
                fontWeight: FONT_WEIGHT.bold,
                fontFamily: 'monospace',
              }}
            >
              {willPay ? '-' : '+'}${Math.abs(fundingAmount).toFixed(4)}
            </span>
          </div>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
            Cho vị thế ${positionSize.toLocaleString()} {side === 'long' ? 'Long' : 'Short'}
          </p>
        </div>
      )}

      {/* Info */}
      <div
        className="flex items-start gap-2 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Info size={11} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
          Funding rate dương → Long trả Short. Âm → Short trả Long. Thanh toán mỗi 8 giờ.
        </p>
      </div>
    </TrCard>
  );
}
