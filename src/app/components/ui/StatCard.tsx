/**
 * ══════════════════════════════════════════════════════════
 *  StatCard Component
 * ══════════════════════════════════════════════════════════
 *
 *  Reusable stat display card with label, value, and optional trend.
 *  Common pattern for dashboard, portfolio, and analytics views.
 *
 *  Usage:
 *  ```tsx
 *  <StatCard label="Tổng giá trị" value="$1,234.56" />
 *  <StatCard label="P&L 24h" value="+$50.00" trend="up" />
 *  <StatCard label="Số dư" value="1,000 USDT" icon={Wallet} />
 *  ```
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

/* ─── Types ─── */

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatSize = 'sm' | 'md' | 'lg';

export interface StatCardProps {
  /** Label text */
  label: string;
  
  /** Value text (formatted) */
  value: string | number;
  
  /** Optional subtitle/helper text */
  subtitle?: string;
  
  /** Trend indicator */
  trend?: StatTrend;
  
  /** Optional icon */
  icon?: LucideIcon;
  
  /** Size variant */
  size?: StatSize;
  
  /** Click handler (makes card interactive) */
  onClick?: () => void;
  
  /** Loading state */
  loading?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Custom style */
  style?: React.CSSProperties;
  
  /** Highlight value with color */
  valueColor?: string;
}

/* ─── Size Configuration ─── */

const SIZE_CONFIG = {
  sm: {
    labelSize: 11,
    valueSize: 16,
    subtitleSize: 10,
    iconSize: 14,
    gap: 4,
    padding: 12,
  },
  md: {
    labelSize: 12,
    valueSize: 20,
    subtitleSize: 11,
    iconSize: 16,
    gap: 6,
    padding: 16,
  },
  lg: {
    labelSize: 13,
    valueSize: 28,
    subtitleSize: 12,
    iconSize: 18,
    gap: 8,
    padding: 20,
  },
} as const;

/* ─── Component ─── */

export function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  size = 'md',
  onClick,
  loading = false,
  className = '',
  style,
  valueColor,
}: StatCardProps) {
  const c = useThemeColors();
  const config = SIZE_CONFIG[size];

  // Get trend color
  const getTrendColor = (): string => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return c.text2;
    }
  };

  // Get value color
  const getValueColor = (): string => {
    if (valueColor) return valueColor;
    if (trend === 'up') return '#10B981';
    if (trend === 'down') return '#EF4444';
    return c.text1;
  };

  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl
        ${isInteractive ? 'cursor-pointer active:opacity-70' : ''}
        ${className}
      `.trim()}
      style={{
        background: c.surface2,
        padding: config.padding,
        ...style,
      }}
    >
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <Icon
            size={config.iconSize}
            color={c.text3}
          />
        )}
        <span
          style={{
            color: c.text2,
            fontSize: config.labelSize,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div
          className="animate-pulse rounded"
          style={{
            background: c.surface3,
            height: config.valueSize + 4,
            width: '60%',
          }}
        />
      ) : (
        <div className="flex items-baseline gap-2">
          <span
            style={{
              color: getValueColor(),
              fontSize: config.valueSize,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {value}
          </span>
          {trend && trend !== 'neutral' && (
            <div className="flex items-center">
              {trend === 'up' ? (
                <TrendingUp size={config.iconSize} color={getTrendColor()} />
              ) : (
                <TrendingDown size={config.iconSize} color={getTrendColor()} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div style={{ marginTop: config.gap }}>
          <span
            style={{
              color: c.text3,
              fontSize: config.subtitleSize,
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Horizontal Stat Item ─── */

export interface StatItemProps {
  /** Label text */
  label: string;
  
  /** Value text */
  value: string | number;
  
  /** Optional trend */
  trend?: StatTrend;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * Inline stat item (label: value format)
 * Good for lists and compact displays
 */
export function StatItem({
  label,
  value,
  trend,
  compact = false,
  className = '',
}: StatItemProps) {
  const c = useThemeColors();

  const getTrendColor = (): string => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return c.text1;
    }
  };

  return (
    <div
      className={`flex items-center justify-between ${className}`}
      style={{
        minHeight: compact ? 24 : 32,
      }}
    >
      <span
        style={{
          color: c.text2,
          fontSize: compact ? 11 : 12,
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          style={{
            color: trend ? getTrendColor() : c.text1,
            fontSize: compact ? 12 : 13,
            fontWeight: 600,
          }}
        >
          {value}
        </span>
        {trend && trend !== 'neutral' && (
          trend === 'up' ? (
            <TrendingUp size={compact ? 12 : 14} color={getTrendColor()} />
          ) : (
            <TrendingDown size={compact ? 12 : 14} color={getTrendColor()} />
          )
        )}
      </div>
    </div>
  );
}

/* ─── Grid Layout Helper ─── */

export interface StatGridProps {
  /** Child StatCard components */
  children: React.ReactNode;
  
  /** Number of columns */
  columns?: 2 | 3 | 4;
  
  /** Gap between cards */
  gap?: number;
  
  /** Custom className */
  className?: string;
}

/**
 * Grid layout for StatCards
 */
export function StatGrid({
  children,
  columns = 2,
  gap = 12,
  className = '',
}: StatGridProps) {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Percentage Change Helper ─── */

export interface PercentageStatProps extends Omit<StatCardProps, 'trend'> {
  /** Percentage value (positive or negative) */
  percentage: number;
  
  /** Auto-detect trend from percentage */
  autoTrend?: boolean;
}

/**
 * StatCard with automatic trend based on percentage
 */
export function PercentageStat({
  percentage,
  autoTrend = true,
  ...props
}: PercentageStatProps) {
  const trend: StatTrend = autoTrend
    ? percentage > 0
      ? 'up'
      : percentage < 0
      ? 'down'
      : 'neutral'
    : 'neutral';

  const formattedValue = `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;

  return (
    <StatCard
      {...props}
      value={formattedValue}
      trend={trend}
    />
  );
}
