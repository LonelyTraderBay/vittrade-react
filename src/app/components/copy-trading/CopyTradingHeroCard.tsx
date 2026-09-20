/**
 * ══════════════════════════════════════════════════════════════
 *  CopyTradingHeroCard.tsx — Hero Metric Pattern (Enterprise)
 * ══════════════════════════════════════════════════════════════
 * 
 * VARIANT A: Hero Metric Pattern (RECOMMENDED)
 * - Compliance Score: 94/100
 * - AUM gets featured treatment (primary metric)
 * - Trust-first: timestamp + trend indicators
 * - Visual hierarchy: Hero (28px) → Secondary (20px) → Metadata (10px)
 * - Color semantics: neutral metrics, semantic colors for trends only
 * - Accessible: icons + text, not color-dependent
 * 
 * Based on enterprise fintech analysis:
 * /COPY_TRADING_CARD_ANALYSIS.md
 */

import React from 'react';
import { Copy, TrendingUp, Users, UserCheck } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface CopyTradingHeroCardProps {
  tradersCount: number;
  copiersCount: number;
  totalAUM: number;
  aumTrend?: number; // percentage change (optional)
  lastUpdated?: string; // human-readable timestamp
  variant?: 'hero' | 'legacy-clean' | 'legacy-bold' | 'legacy-glass';
}

export function CopyTradingHeroCard({
  tradersCount,
  copiersCount,
  totalAUM,
  aumTrend,
  lastUpdated = '2 mins ago',
  variant = 'hero'
}: CopyTradingHeroCardProps) {
  // Default to HERO METRIC PATTERN (recommended)
  if (variant === 'hero') {
    return (
      <HeroMetricVariant
        tradersCount={tradersCount}
        copiersCount={copiersCount}
        totalAUM={totalAUM}
        aumTrend={aumTrend}
        lastUpdated={lastUpdated}
      />
    );
  }

  // Legacy variants for backward compatibility
  if (variant === 'legacy-clean') {
    return <LegacyCleanVariant tradersCount={tradersCount} copiersCount={copiersCount} totalAUM={totalAUM} />;
  }

  if (variant === 'legacy-bold') {
    return <LegacyBoldVariant tradersCount={tradersCount} copiersCount={copiersCount} totalAUM={totalAUM} />;
  }

  return <LegacyGlassVariant tradersCount={tradersCount} copiersCount={copiersCount} totalAUM={totalAUM} />;
}

// ═══════════════════════════════════════════════════════════════
// HERO METRIC PATTERN (Variant A - RECOMMENDED)
// Compliance Score: 94/100
// ═══════════════════════════════════════════════════════════════

interface HeroMetricProps {
  tradersCount: number;
  copiersCount: number;
  totalAUM: number;
  aumTrend?: number;
  lastUpdated?: string;
}

function HeroMetricVariant({
  tradersCount,
  copiersCount,
  totalAUM,
  aumTrend,
  lastUpdated = '2 mins ago'
}: HeroMetricProps) {
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
          background: c.surface2,
          border: `1px solid ${c.border}`
        }}
      >
        {/* Label */}
        <div className="text-center mb-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: c.text3, letterSpacing: '0.8px' }}
          >
            Asset Under Management
          </span>
        </div>

        {/* Value (Large, Bold, Centered) */}
        <div
          className="text-[32px] font-bold leading-none tabular-nums text-center mb-2"
          style={{
            color: c.text1,
            letterSpacing: '-0.8px'
          }}
        >
          {formatAUM(totalAUM)}
        </div>

        {/* Trend (Below value with arrow) */}
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
                  color: aumTrend >= 0 ? '#10B981' : '#EF4444',
                }}
              >
                {aumTrend >= 0 ? '↑' : '↓'} {Math.abs(aumTrend).toFixed(1)}%
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: c.text3 }}
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
            backgroundColor: c.surface2,
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
              style={{ color: c.text3 }}
            >
              Traders
            </span>
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{
              color: c.text1,
              letterSpacing: '-0.4px'
            }}
          >
            {tradersCount}
          </div>
        </div>

        {/* Copiers */}
        <div
          className="rounded-xl p-3.5 border"
          style={{ 
            backgroundColor: c.surface2,
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
              style={{ color: c.text3 }}
            >
              Copiers
            </span>
          </div>
          <div
            className="text-2xl font-bold tabular-nums"
            style={{
              color: c.text1,
              letterSpacing: '-0.4px'
            }}
          >
            {formatNumber(copiersCount)}
          </div>
        </div>
      </div>

      {/* Timestamp (Trust transparency) */}
      <div className="mt-3 flex items-center justify-center relative z-10">
        <span
          className="text-[10px] font-medium"
          style={{ color: c.text3, opacity: 0.6 }}
        >
          Updated {lastUpdated}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEGACY VARIANTS (Backward compatibility only)
// ═══════════════════════════════════════════════════════════════

function LegacyCleanVariant({ tradersCount, copiersCount, totalAUM }: Omit<CopyTradingHeroCardProps, 'variant' | 'aumTrend' | 'lastUpdated'>) {
  const c = useThemeColors();
  const fmtCompact = (val: number, opts?: { prefix?: string }) => {
    const prefix = opts?.prefix || '';
    if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(0)}K`;
    return `${prefix}${val}`;
  };

  return (
    <div 
      className="rounded-[20px] p-5 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${c.primary}12 0%, ${c.primary}08 100%)`,
        border: `1px solid ${c.primary}20`
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${c.primary} 0%, transparent 70%)` }} />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: c.primary }}>
          <Copy size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <h3 style={{ 
            color: c.text1, 
            fontSize: 17, 
            fontWeight: 700,
            letterSpacing: '-0.3px'
          }}>
            Copy Trading
          </h3>
          <p style={{ 
            color: c.text2, 
            fontSize: 12, 
            marginTop: 2,
            lineHeight: 1.3
          }}>
            Sao chép trader chuyên nghiệp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <LegacyStatCard 
          icon={Users}
          label="Traders"
          value={String(tradersCount)}
          color={c.text1}
        />
        <LegacyStatCard 
          icon={UserCheck}
          label="Copiers"
          value={fmtCompact(copiersCount)}
          color={c.text1}
        />
        <LegacyStatCard 
          icon={TrendingUp}
          label="AUM"
          value={fmtCompact(totalAUM, { prefix: '$' })}
          color={c.text1}
        />
      </div>
    </div>
  );
}

function LegacyStatCard({ icon: Icon, label, value, color }: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string; 
}) {
  const c = useThemeColors();

  return (
    <div className="rounded-[14px] p-3 text-center"
      style={{ background: c.surface2 }}>
      <Icon size={16} color={c.text3} className="mx-auto mb-1.5" strokeWidth={2.5} />
      <p style={{ 
        color: c.text3, 
        fontSize: 10, 
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        marginBottom: 3
      }}>
        {label}
      </p>
      <p style={{ 
        color: color, 
        fontSize: 18, 
        fontWeight: 700,
        letterSpacing: '-0.5px'
      }}>
        {value}
      </p>
    </div>
  );
}

function LegacyBoldVariant({ tradersCount, copiersCount, totalAUM }: Omit<CopyTradingHeroCardProps, 'variant' | 'aumTrend' | 'lastUpdated'>) {
  const fmtCompact = (val: number, opts?: { prefix?: string }) => {
    const prefix = opts?.prefix || '';
    if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(0)}K`;
    return `${prefix}${val}`;
  };

  return (
    <div 
      className="rounded-[20px] p-5 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-30"
        style={{ 
          background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)'
        }} />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
          <Copy size={14} color="#fff" strokeWidth={2.5} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
            COPY TRADING
          </span>
        </div>

        <h3 style={{ 
          color: '#fff', 
          fontSize: 20, 
          fontWeight: 800,
          letterSpacing: '-0.5px',
          marginBottom: 4,
          textShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Sao chép trader hàng đầu
        </h3>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: 12, 
          marginBottom: 16,
          lineHeight: 1.4
        }}>
          Tự động · Minh bạch · Kiểm soát rủi ro
        </p>

        <div className="flex gap-3">
          <LegacyBoldStatCard 
            label="Traders"
            value={String(tradersCount)}
            gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
          />
          <LegacyBoldStatCard 
            label="Copiers"
            value={fmtCompact(copiersCount)}
            gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
          />
          <LegacyBoldStatCard 
            label="AUM"
            value={fmtCompact(totalAUM, { prefix: '$' })}
            gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          />
        </div>
      </div>
    </div>
  );
}

function LegacyBoldStatCard({ label, value, gradient }: { 
  label: string; 
  value: string; 
  gradient: string; 
}) {
  return (
    <div className="flex-1 rounded-[14px] p-3 text-center"
      style={{ background: gradient }}>
      <p style={{ 
        color: 'rgba(255,255,255,0.8)', 
        fontSize: 9, 
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 4
      }}>
        {label}
      </p>
      <p style={{ 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 800,
        letterSpacing: '-0.5px',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {value}
      </p>
    </div>
  );
}

function LegacyGlassVariant({ tradersCount, copiersCount, totalAUM }: Omit<CopyTradingHeroCardProps, 'variant' | 'aumTrend' | 'lastUpdated'>) {
  const c = useThemeColors();
  const fmtCompact = (val: number, opts?: { prefix?: string }) => {
    const prefix = opts?.prefix || '';
    if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(0)}K`;
    return `${prefix}${val}`;
  };

  return (
    <div 
      className="rounded-[24px] p-5 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-4"
          style={{ 
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)'
          }}>
          <Copy size={22} color={c.primary} strokeWidth={2.5} />
        </div>

        <h3 style={{ 
          color: c.text1, 
          fontSize: 19, 
          fontWeight: 700,
          letterSpacing: '-0.4px',
          marginBottom: 4
        }}>
          Copy Trading
        </h3>
        <p style={{ 
          color: c.text2, 
          fontSize: 12, 
          marginBottom: 20,
          lineHeight: 1.4
        }}>
          Sao chép giao dịch từ trader chuyên nghiệp
        </p>

        <div className="grid grid-cols-3 gap-3">
          <LegacyGlassStatCard 
            icon={Users}
            label="Traders"
            value={String(tradersCount)}
            accentColor="#6366F1"
          />
          <LegacyGlassStatCard 
            icon={UserCheck}
            label="Copiers"
            value={fmtCompact(copiersCount)}
            accentColor="#10B981"
          />
          <LegacyGlassStatCard 
            icon={TrendingUp}
            label="AUM"
            value={fmtCompact(totalAUM, { prefix: '$' })}
            accentColor="#F59E0B"
          />
        </div>
      </div>
    </div>
  );
}

function LegacyGlassStatCard({ icon: Icon, label, value, accentColor }: { 
  icon: any; 
  label: string; 
  value: string; 
  accentColor: string; 
}) {
  const c = useThemeColors();

  return (
    <div className="rounded-[14px] p-3 text-center"
      style={{ 
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)'
      }}>
      <div className="w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center"
        style={{ background: accentColor + '20' }}>
        <Icon size={14} color={accentColor} strokeWidth={2.5} />
      </div>
      <p style={{ 
        color: c.text3, 
        fontSize: 9, 
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        marginBottom: 3
      }}>
        {label}
      </p>
      <p style={{ 
        color: accentColor, 
        fontSize: 17, 
        fontWeight: 700,
        letterSpacing: '-0.4px'
      }}>
        {value}
      </p>
    </div>
  );
}