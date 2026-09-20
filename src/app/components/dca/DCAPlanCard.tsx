/**
 * DCA Plan Card Component — Redesigned
 *
 * Beautiful, scannable, transparent active DCA plan card.
 * Follows 4pt grid, φ spacing, trading token system.
 *
 * @module components/dca
 */

import { Edit2, Trash2, Clock, Pause, Play, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { DCAPlan } from '../../types/dca';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * DCAPlanCard Props
 */
export interface DCAPlanCardProps {
  plan: DCAPlan;
  onToggleStatus?: (planId: string) => void;
  onEdit?: (planId: string) => void;
  onDelete?: (planId: string) => void;
  onViewDetail?: (planId: string) => void;
  isLoading?: boolean;
}

/* ─── Helpers ─────────────────────────────────────── */

const formatVND = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString('vi-VN');
};

const formatFrequency = (frequency: DCAPlan['frequency']): string => {
  switch (frequency) {
    case 'daily': return 'Hàng ngày';
    case 'weekly': return 'Hàng tuần';
    case 'monthly': return 'Hàng tháng';
  }
};

const frequencyShort = (frequency: DCAPlan['frequency']): string => {
  switch (frequency) {
    case 'daily': return '/ngày';
    case 'weekly': return '/tuần';
    case 'monthly': return '/tháng';
  }
};

const getStatusConfig = (status: DCAPlan['status']) => {
  switch (status) {
    case 'active':
      return {
        label: 'Đang chạy',
        color: '#10B981',
        bgColor: 'rgba(16,185,129,0.12)',
        borderColor: 'rgba(16,185,129,0.25)',
        icon: <RefreshCw className="w-3 h-3" />,
      };
    case 'paused':
      return {
        label: 'Tạm dừng',
        color: '#F59E0B',
        bgColor: 'rgba(245,158,11,0.12)',
        borderColor: 'rgba(245,158,11,0.25)',
        icon: <Pause className="w-3 h-3" />,
      };
    case 'error':
      return {
        label: 'Lỗi',
        color: '#EF4444',
        bgColor: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.25)',
        icon: <AlertTriangle className="w-3 h-3" />,
      };
  }
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const minutes = Math.floor(diff / (1000 * 60));

  if (diff < 0) return 'Đã quá hạn';
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) return `${hours} giờ`;
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
};

/**
 * DCA Plan Card Component — Redesigned
 */
export function DCAPlanCard({
  plan,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetail,
  isLoading,
}: DCAPlanCardProps) {
  const c = useThemeColors();
  const currentValue = plan.totalInvested > 0
    ? (plan.totalInvested / plan.currentHoldings) * plan.currentHoldings
    : 0;
  const profitLoss = plan.totalInvested > 0
    ? ((plan.averageCost > 0
      ? ((plan.totalInvested / plan.currentHoldings) - plan.averageCost) * plan.currentHoldings
      : 0))
    : 0;
  const profitLossPercent = plan.averageCost > 0 && plan.totalInvested > 0
    ? (((plan.totalInvested / plan.currentHoldings) - plan.averageCost) / plan.averageCost) * 100
    : 0;
  const isProfit = profitLossPercent >= 0;
  const statusConfig = getStatusConfig(plan.status);

  // Calculate execution count estimate
  const daysSinceCreation = Math.max(1, Math.floor((new Date().getTime() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const estimatedExecutions = plan.frequency === 'daily'
    ? daysSinceCreation
    : plan.frequency === 'weekly'
      ? Math.floor(daysSinceCreation / 7)
      : Math.floor(daysSinceCreation / 30);

  return (
    <div
      style={{
        background: 'var(--card-bg, var(--card, #141822))',
        borderRadius: 'var(--card-radius, 16px)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.05))',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Status accent stripe at top */}
      <div
        style={{
          height: 3,
          background: statusConfig.color,
          opacity: plan.status === 'active' ? 1 : 0.5,
        }}
      />

      <div style={{ padding: '16px 16px 12px' }}>
        {/* ── Row 1: Coin identity + Status badge ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: onViewDetail ? 'pointer' : undefined }}
            onClick={() => onViewDetail?.(plan.id)}
          >
            {/* Coin icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: c.surface2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={plan.coinIcon}
                alt={plan.coinName}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${plan.coinSymbol}&background=1C2235&color=F0F4FF&size=56`;
                }}
              />
            </div>

            {/* Coin name + frequency tag */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 'var(--φ-fs-base, 16px)',
                    fontWeight: 600,
                    color: c.text1,
                    lineHeight: 'var(--φ-lh-tight, 1.272)',
                  }}
                >
                  {plan.coinSymbol}
                </span>
                <span
                  style={{
                    fontSize: 'var(--φ-fs-xs, 10px)',
                    color: c.text2,
                    background: c.surface2,
                    padding: '2px 8px',
                    borderRadius: 'var(--φ-radius-xs, 5px)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatFrequency(plan.frequency)}
                </span>
              </div>
              <span
                style={{
                  fontSize: 'var(--φ-fs-sm, 13px)',
                  color: c.text2,
                  lineHeight: 'var(--φ-lh-normal, 1.5)',
                }}
              >
                {plan.coinName}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--φ-fs-xs, 10px)',
              fontWeight: 600,
              color: statusConfig.color,
              background: statusConfig.bgColor,
              border: `1px solid ${statusConfig.borderColor}`,
              borderRadius: 'var(--φ-radius-sm, 8px)',
              padding: '4px 10px',
              whiteSpace: 'nowrap' as const,
              letterSpacing: '0.02em',
            }}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </div>
        </div>

        {/* ── Row 2: Key metrics — 2-column clean grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px 16px',
            padding: '14px 16px',
            background: c.surface2,
            borderRadius: 'var(--φ-radius-md, 13px)',
            marginBottom: 12,
          }}
        >
          {/* Amount per purchase */}
          <div>
            <div
              style={{
                fontSize: 'var(--φ-fs-xs, 10px)',
                color: c.text2,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              Mỗi lần mua
            </div>
            <div
              style={{
                fontSize: 'var(--φ-fs-body, 14px)',
                fontWeight: 600,
                color: c.text1,
                lineHeight: 'var(--φ-lh-tight, 1.272)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatVND(plan.amountPerPurchase)} <span style={{ fontSize: 'var(--φ-fs-xs, 10px)', fontWeight: 400, color: c.text2 }}>VND</span>
            </div>
          </div>

          {/* Đang nắm */}
          <div>
            <div
              style={{
                fontSize: 'var(--φ-fs-xs, 10px)',
                color: c.text2,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              Đang nắm giữ
            </div>
            <div
              style={{
                fontSize: 'var(--φ-fs-body, 14px)',
                fontWeight: 600,
                color: c.text1,
                lineHeight: 'var(--φ-lh-tight, 1.272)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {plan.currentHoldings.toFixed(4)} <span style={{ fontSize: 'var(--φ-fs-xs, 10px)', fontWeight: 400, color: c.text2 }}>{plan.coinSymbol}</span>
            </div>
          </div>

          {/* Total invested */}
          <div>
            <div
              style={{
                fontSize: 'var(--φ-fs-xs, 10px)',
                color: c.text2,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              Đã đầu tư
            </div>
            <div
              style={{
                fontSize: 'var(--φ-fs-body, 14px)',
                fontWeight: 600,
                color: c.text1,
                lineHeight: 'var(--φ-lh-tight, 1.272)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatVND(plan.totalInvested)} <span style={{ fontSize: 'var(--φ-fs-xs, 10px)', fontWeight: 400, color: c.text2 }}>VND</span>
            </div>
          </div>

          {/* P&L */}
          <div>
            <div
              style={{
                fontSize: 'var(--φ-fs-xs, 10px)',
                color: c.text2,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              Lãi / Lỗ
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {plan.totalInvested > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isProfit ? (
                    <TrendingUp style={{ width: 13, height: 13, color: '#10B981' }} />
                  ) : (
                    <TrendingDown style={{ width: 13, height: 13, color: '#EF4444' }} />
                  )}
                  <span
                    style={{
                      fontSize: 'var(--φ-fs-body, 14px)',
                      fontWeight: 600,
                      color: isProfit ? '#10B981' : '#EF4444',
                      lineHeight: 'var(--φ-lh-tight, 1.272)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 'var(--φ-fs-body, 14px)',
                    color: c.text2,
                  }}
                >
                  —
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Next execution countdown (active only) ── */}
        {plan.status === 'active' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.10)',
              borderRadius: 'var(--φ-radius-sm, 8px)',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock style={{ width: 14, height: 14, color: c.primary }} />
              <span
                style={{
                  fontSize: 'var(--φ-fs-sm, 13px)',
                  color: c.text2,
                }}
              >
                Lần mua tiếp theo
              </span>
            </div>
            <span
              style={{
                fontSize: 'var(--φ-fs-sm, 13px)',
                fontWeight: 600,
                color: c.primary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {getRelativeTime(plan.nextExecution)}
            </span>
          </div>
        )}

        {/* Error message for error state */}
        {plan.status === 'error' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.10)',
              borderRadius: 'var(--φ-radius-sm, 8px)',
              marginBottom: 12,
            }}
          >
            <AlertTriangle style={{ width: 14, height: 14, color: '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--φ-fs-sm, 13px)', color: '#EF4444' }}>
              Không thể thực hiện lệnh mua. Kiểm tra số dư.
            </span>
          </div>
        )}

        {/* ── Row 4: Action bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 12,
            borderTop: `1px solid ${c.divider}`,
          }}
        >
          {/* Primary action: Toggle status */}
          <button
            onClick={() => onToggleStatus?.(plan.id)}
            disabled={isLoading || plan.status === 'error'}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 'var(--φ-radius-sm, 8px)',
              border: 'none',
              cursor: isLoading || plan.status === 'error' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 'var(--φ-fs-sm, 13px)',
              fontWeight: 600,
              transition: 'background 0.15s, opacity 0.15s',
              opacity: isLoading || plan.status === 'error' ? 0.4 : 1,
              background: plan.status === 'active'
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(16,185,129,0.12)',
              color: plan.status === 'active' ? '#F59E0B' : '#10B981',
            }}
          >
            {plan.status === 'active' ? (
              <Pause style={{ width: 14, height: 14 }} />
            ) : (
              <Play style={{ width: 14, height: 14 }} />
            )}
            {plan.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit?.(plan.id)}
            disabled={isLoading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--φ-radius-sm, 8px)',
              border: `1px solid ${c.divider}`,
              background: 'transparent',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: c.text2,
              transition: 'background 0.15s, opacity 0.15s',
              opacity: isLoading ? 0.4 : 1,
            }}
            aria-label="Chỉnh sửa"
          >
            <Edit2 style={{ width: 16, height: 16 }} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete?.(plan.id)}
            disabled={isLoading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--φ-radius-sm, 8px)',
              border: '1px solid rgba(239,68,68,0.12)',
              background: 'transparent',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              transition: 'background 0.15s, opacity 0.15s',
              opacity: isLoading ? 0.4 : 0.7,
            }}
            aria-label="Xóa kế hoạch"
          >
            <Trash2 style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
}