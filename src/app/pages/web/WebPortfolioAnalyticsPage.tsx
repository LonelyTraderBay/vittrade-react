/**
 * ══════════════════════════════════════════════════════════
 *  WEB PORTFOLIO ANALYTICS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/wallet/portfolio-analytics
 *
 *  Portfolio performance analytics & insights
 *  - Asset allocation pie chart
 *  - Performance over time
 *  - PnL breakdown
 *  - Top gainers/losers
 *  - Risk metrics
 *  - Diversification score
 *
 *  Guidelines compliance:
 *  - §8.4: Wallet patterns
 *  - §15.1: Clear, factual metrics
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  AlertTriangle,
  DollarSign,
  Percent,
  Target,
  Activity,
  Calendar,
  Download,
  Filter,
  Info,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface AssetAllocation {
  asset: string;
  value: number;
  percentage: number;
  change24h: number;
  color: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const ASSET_ALLOCATION: AssetAllocation[] = [
  { asset: 'BTC', value: 12500, percentage: 45.2, change24h: 3.2, color: '#F7931A' },
  { asset: 'ETH', value: 8200, percentage: 29.6, change24h: 5.8, color: '#627EEA' },
  { asset: 'USDT', value: 4500, percentage: 16.3, change24h: 0.1, color: '#26A17B' },
  { asset: 'SOL', value: 1800, percentage: 6.5, change24h: -2.4, color: '#14F195' },
  { asset: 'Other', value: 680, percentage: 2.4, change24h: 1.2, color: '#94A3B8' },
];

const TOP_PERFORMERS = [
  { asset: 'ETH', pnl: 2450, percentage: 42.5, color: '#627EEA' },
  { asset: 'SOL', pnl: 890, percentage: 97.8, color: '#14F195' },
  { asset: 'BTC', pnl: 1200, percentage: 10.6, color: '#F7931A' },
];

const TOP_LOSERS = [
  { asset: 'DOGE', pnl: -340, percentage: -15.2, color: '#C2A633' },
  { asset: 'ADA', pnl: -120, percentage: -8.7, color: '#0033AD' },
];

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    label: 'Tổng giá trị',
    value: '$27,680',
    change: 8.4,
    trend: 'up',
    icon: DollarSign,
    color: '#10B981',
  },
  {
    label: 'PnL (30 ngày)',
    value: '+$4,120',
    change: 17.5,
    trend: 'up',
    icon: TrendingUp,
    color: '#10B981',
  },
  {
    label: 'Tỷ suất sinh lời',
    value: '23.8%',
    trend: 'up',
    icon: Percent,
    color: '#3B82F6',
  },
  {
    label: 'Điểm đa dạng hóa',
    value: '7.2/10',
    icon: Target,
    color: '#8B5CF6',
  },
];

const MONTHLY_PERFORMANCE = [
  { month: 'T10', value: 18200, pnl: 1200 },
  { month: 'T11', value: 21500, pnl: 3300 },
  { month: 'T12', value: 23100, pnl: 1600 },
  { month: 'T1', value: 25800, pnl: 2700 },
  { month: 'T2', value: 24200, pnl: -1600 },
  { month: 'T3', value: 27680, pnl: 3480 },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function MetricCard({ metric }: { metric: PerformanceMetric }) {
  const c = useThemeColors();
  const Icon = metric.icon;

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            background: `${metric.color}15`,
          }}
        >
          <Icon size={20} color={metric.color} />
        </div>
        <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION }}>
          {metric.label}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div style={{ color: c.text1, fontSize: 24, fontWeight: 800 }}>
          {metric.value}
        </div>
        {metric.change !== undefined && (
          <div className="flex items-center gap-1">
            {metric.trend === 'up' ? (
              <ArrowUp size={14} color="#10B981" />
            ) : (
              <ArrowDown size={14} color="#EF4444" />
            )}
            <span
              style={{
                color: metric.trend === 'up' ? '#10B981' : '#EF4444',
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 700,
              }}
            >
              {Math.abs(metric.change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AllocationRow({ asset }: { asset: AssetAllocation }) {
  const c = useThemeColors();

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: 12,
          height: 12,
          background: asset.color,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {asset.asset}
          </span>
          <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {asset.percentage}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
            ${asset.value.toLocaleString()}
          </span>
          <span
            style={{
              color: asset.change24h >= 0 ? '#10B981' : '#EF4444',
              fontSize: WEB_FONT.SIZE.CAPTION,
              fontWeight: 600,
            }}
          >
            {asset.change24h >= 0 ? '+' : ''}
            {asset.change24h}%
          </span>
        </div>
      </div>
    </div>
  );
}

function PerformerRow({
  asset,
  pnl,
  percentage,
  color,
}: {
  asset: string;
  pnl: number;
  percentage: number;
  color: string;
}) {
  const c = useThemeColors();
  const isGain = pnl >= 0;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: 8,
            height: 8,
            background: color,
          }}
        />
        <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
          {asset}
        </span>
      </div>
      <div className="text-right">
        <div
          style={{
            color: isGain ? '#10B981' : '#EF4444',
            fontSize: WEB_FONT.SIZE.BODY,
            fontWeight: 700,
          }}
        >
          {isGain ? '+' : ''}${Math.abs(pnl).toLocaleString()}
        </div>
        <div
          style={{
            color: isGain ? '#10B981' : '#EF4444',
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
          }}
        >
          {isGain ? '+' : ''}
          {percentage}%
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebPortfolioAnalyticsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const totalValue = ASSET_ALLOCATION.reduce((sum, a) => sum + a.value, 0);

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
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
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
              fontSize: WEB_FONT.SIZE.H2,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Analytics
          </h2>
        </div>

        {/* Timeframe Selector */}
        <div className="p-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Khoảng thời gian
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="px-3 py-2 rounded-lg transition-all"
                style={{
                  background: timeframe === tf ? '#3B82F6' : c.bg,
                  color: timeframe === tf ? '#fff' : c.text2,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: 600,
                  border: timeframe === tf ? 'none' : `1px solid ${c.border}`,
                }}
              >
                {tf === '7d' && '7 ngày'}
                {tf === '30d' && '30 ngày'}
                {tf === '90d' && '90 ngày'}
                {tf === '1y' && '1 năm'}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Phân bổ tài sản
          </div>
          <div
            className="p-3 rounded-lg"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            {ASSET_ALLOCATION.map((asset, i) => (
              <React.Fragment key={asset.asset}>
                {i > 0 && <div style={{ height: 1, background: c.divider, margin: '8px 0' }} />}
                <AllocationRow asset={asset} />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="px-4 pb-4 mt-auto">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.text2,
              fontSize: WEB_FONT.SIZE.CAPTION,
              fontWeight: 600,
            }}
          >
            <Download size={14} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h3
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H3,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Phân tích danh mục
            </h3>
            <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
              Tổng quan hiệu suất và phân bổ tài sản
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {PERFORMANCE_METRICS.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          {/* Performance Chart (Mock) */}
          <div
            className="p-6 rounded-xl mb-8"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h4
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Biến động giá trị danh mục
              </h4>
              <div className="flex items-center gap-2">
                <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  30 ngày qua
                </span>
              </div>
            </div>

            {/* Simple bar chart mock */}
            <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
              {MONTHLY_PERFORMANCE.map((month) => {
                const maxValue = Math.max(...MONTHLY_PERFORMANCE.map((m) => m.value));
                const height = (month.value / maxValue) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full" style={{ height: 160 }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all"
                        style={{
                          height: `${height}%`,
                          background: month.pnl >= 0 ? '#10B981' : '#EF4444',
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <div style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
                      {month.month}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performers / Losers */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div
              className="p-6 rounded-xl"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} color="#10B981" />
                <h4
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.BODY,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Top Gainers
                </h4>
              </div>
              <div>
                {TOP_PERFORMERS.map((p, i) => (
                  <React.Fragment key={p.asset}>
                    {i > 0 && <div style={{ height: 1, background: c.divider, margin: '12px 0' }} />}
                    <PerformerRow {...p} />
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div
              className="p-6 rounded-xl"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={20} color="#EF4444" />
                <h4
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.BODY,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Top Losers
                </h4>
              </div>
              <div>
                {TOP_LOSERS.map((p, i) => (
                  <React.Fragment key={p.asset}>
                    {i > 0 && <div style={{ height: 1, background: c.divider, margin: '12px 0' }} />}
                    <PerformerRow {...p} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Insights */}
          <div
            className="mt-6 p-5 rounded-xl"
            style={{
              background: '#3B82F615',
              border: `1px solid #3B82F640`,
            }}
          >
            <div className="flex items-start gap-3">
              <Info size={20} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ color: '#3B82F6', fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700, marginBottom: 8 }}>
                  Insight: Đa dạng hóa tốt
                </div>
                <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, lineHeight: 1.6 }}>
                  Danh mục của bạn phân bổ đa dạng với 5 tài sản. BTC và ETH chiếm 74.8% tổng giá trị.
                  Khuyến nghị: Cân nhắc tăng tỷ trọng stablecoin để giảm biến động.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}