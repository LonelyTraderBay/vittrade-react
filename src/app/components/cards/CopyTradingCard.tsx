import { TrendingUp, Users, UserCheck } from "lucide-react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface CopyTradingCardProps {
  traders: number;
  copiers: number;
  aum: number; // in USD
  aumTrend?: number; // percentage change
  lastUpdated?: string;
  variant?: "hero" | "tabular" | "compact";
}

export function CopyTradingCard({
  traders,
  copiers,
  aum,
  aumTrend,
  lastUpdated = "2 mins ago",
  variant = "hero",
}: CopyTradingCardProps) {
  const c = useThemeColors();

  const formatAUM = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  if (variant === "hero") {
    return (
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${c.primary}08 0%, ${c.primary}04 100%)`,
          border: `1px solid ${c.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        {/* Decorative gradient orb */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle, ${c.primary}40 0%, transparent 70%)`,
            filter: 'blur(40px)'
          }}
        />

        {/* Hero Metric - AUM (Featured) */}
        <div
          className="rounded-xl p-4 mb-3 relative z-10"
          style={{ 
            background: c.surface,
            border: `1px solid ${c.border}`
          }}
        >
          <div className="text-center mb-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: c.textTer, letterSpacing: '0.8px' }}
            >
              Asset Under Management
            </span>
          </div>
          <div
            className="text-[32px] font-bold leading-none tabular-nums text-center mb-2"
            style={{ color: c.text, letterSpacing: '-0.8px' }}
          >
            {formatAUM(aum)}
          </div>
          {aumTrend !== undefined && (
            <div className="flex items-center justify-center gap-1.5">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: aumTrend >= 0 ? '#10B98110' : '#EF444410',
                  border: `1px solid ${aumTrend >= 0 ? '#10B98120' : '#EF444420'}`
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    color: aumTrend >= 0 ? c.success : c.danger,
                  }}
                >
                  {aumTrend >= 0 ? '↑' : '↓'} {Math.abs(aumTrend).toFixed(1)}%
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: c.textTer }}
                >
                  vs last month
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          {/* Traders */}
          <div
            className="rounded-xl p-3.5 border"
            style={{ 
              backgroundColor: c.surface,
              borderColor: c.border
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users
                className="size-3.5"
                style={{ color: '#3B82F6' }}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: c.textTer }}
              >
                Traders
              </span>
            </div>
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: c.text, letterSpacing: '-0.4px' }}
            >
              {traders}
            </div>
          </div>

          {/* Copiers */}
          <div
            className="rounded-xl p-3.5 border"
            style={{ 
              backgroundColor: c.surface,
              borderColor: c.border
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <UserCheck
                className="size-3.5"
                style={{ color: '#10B981' }}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: c.textTer }}
              >
                Copiers
              </span>
            </div>
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: c.text, letterSpacing: '-0.4px' }}
            >
              {formatNumber(copiers)}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="mt-3 flex items-center justify-center relative z-10">
          <span
            className="text-[10px] font-medium"
            style={{ color: c.textTer, opacity: 0.6 }}
          >
            Updated {lastUpdated}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "tabular") {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: c.surface }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: c.primary }}
          >
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold leading-tight"
              style={{ color: c.text }}
            >
              Copy Trading
            </h3>
            <p
              className="text-xs mt-0.5 leading-tight"
              style={{ color: c.textSec }}
            >
              Sao chép trader chuyên nghiệp
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{ backgroundColor: c.border }}
        />

        {/* Tabular Metrics - Financial Dashboard Style */}
        <div className="space-y-0">
          {/* Row 1: Total AUM (Primary) */}
          <div 
            className="flex items-center justify-between py-3 border-b"
            style={{ borderColor: c.border }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: c.textSec }}
              >
                Total AUM
              </span>
              <button
                className="size-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: c.bg }}
              >
                <span className="text-[9px]" style={{ color: c.textTer }}>i</span>
              </button>
            </div>
            <div className="text-right">
              <div
                className="text-base font-bold tabular-nums"
                style={{ color: c.text }}
              >
                {formatAUM(aum)}
              </div>
              {aumTrend !== undefined && (
                <div className="text-[11px] font-medium mt-0.5" style={{ color: aumTrend >= 0 ? c.success : c.danger }}>
                  {aumTrend >= 0 ? '↑' : '↓'} {Math.abs(aumTrend).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Active Traders */}
          <div 
            className="flex items-center justify-between py-3 border-b"
            style={{ borderColor: c.border }}
          >
            <div className="flex items-center gap-2">
              <Users className="size-4" style={{ color: c.textSec }} />
              <span
                className="text-sm font-medium"
                style={{ color: c.textSec }}
              >
                Active Traders
              </span>
            </div>
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: c.text }}
            >
              {traders}
            </span>
          </div>

          {/* Row 3: Total Copiers */}
          <div 
            className="flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="size-4" style={{ color: c.textSec }} />
              <span
                className="text-sm font-medium"
                style={{ color: c.textSec }}
              >
                Total Copiers
              </span>
            </div>
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: c.text }}
            >
              {formatNumber(copiers)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px my-4"
          style={{ backgroundColor: c.border }}
        />

        {/* Footer - Timestamp + Info */}
        <div className="flex items-center justify-between">
          <span
            className="text-[11px]"
            style={{ color: c.textTer }}
          >
            Last updated: {lastUpdated}
          </span>
          <button
            className="text-[11px] font-semibold px-2 py-1 rounded"
            style={{ 
              color: c.primary,
              backgroundColor: c.primary + '10'
            }}
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  // variant === "compact" (refined original)
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: c.surface }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: c.primary }}
        >
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-tight"
            style={{ color: c.text }}
          >
            Copy Trading
          </h3>
          <p
            className="text-xs mt-0.5 leading-tight"
            style={{ color: c.textSec }}
          >
            Sao chép trader chuyên nghiệp
          </p>
        </div>
      </div>

      {/* Metrics Grid - Equal but Refined */}
      <div className="grid grid-cols-3 gap-2">
        {/* Traders */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: c.bg }}
        >
          <div
            className="text-[10px] font-medium uppercase tracking-wide mb-1"
            style={{ color: c.textSec }}
          >
            Traders
          </div>
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: c.text }}
          >
            {traders}
          </div>
        </div>

        {/* Copiers */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: c.bg }}
        >
          <div
            className="text-[10px] font-medium uppercase tracking-wide mb-1"
            style={{ color: c.textSec }}
          >
            Copiers
          </div>
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: c.text }}
          >
            {formatNumber(copiers)}
          </div>
        </div>

        {/* AUM - Highlighted */}
        <div
          className="rounded-xl p-3 text-center border-2"
          style={{
            backgroundColor: c.bg,
            borderColor: c.primary + "30", // 30% opacity
          }}
        >
          <div
            className="text-[10px] font-medium uppercase tracking-wide mb-1"
            style={{ color: c.primary }}
          >
            AUM
          </div>
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: c.text }}
          >
            {formatAUM(aum)}
          </div>
        </div>
      </div>
    </div>
  );
}