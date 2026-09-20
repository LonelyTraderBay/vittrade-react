/**
 * ══════════════════════════════════════════════════════════════
 *  CopyProviderDetailPage — Phase 1: Provider Deep Dive
 * ══════════════════════════════════════════════════════════════
 * 
 * MiFID II Compliance:
 * - Verification tier & KYC status display
 * - Performance chart with Max DD highlighted
 * - Risk-adjusted metrics (Sharpe, Sortino, Calmar)
 * - Slippage & execution quality stats
 * - Fee breakdown calculator
 * - Conflict of interest disclosure
 * - Strategy change log
 * - Past performance disclaimers
 * 
 * Guidelines:
 * - PageLayout + PageContent pattern
 * - No dark patterns, no FOMO language
 * - Max DD same prominence as ROI
 * - Trust-first, safety-by-design
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Users, DollarSign, Activity, 
  AlertTriangle, Shield, CheckCircle, Star, Info, 
  BarChart3, Clock, Target, ChevronRight, AlertCircle 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtCompact, fmtSignedUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Extracted to prevent magic numbers
// ═══════════════════════════════════════════════════════════════

const FEE_CONFIG = {
  PLATFORM_PCT: 0.1,      // 0.1% platform fee
  PERFORMANCE_PCT: 10,    // 10% of profit
  TRADING_PCT: 0.25,      // 0.25% trading fee
} as const;

const CHART_CONFIG = {
  PERFORMANCE_DAYS: 90,
  TICK_INTERVAL: 15,
  TICKS: [0, 15, 30, 45, 60, 75, 90],
} as const;

const TIER_THRESHOLDS = {
  PRO: 3000,
  VERIFIED: 1000,
} as const;

// Risk tier colors
const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#10B981', label: 'Thấp' },
  medium: { color: '#F59E0B', label: 'Trung bình' },
  high: { color: '#EF4444', label: 'Cao' },
};

// Verification tier config
interface TierConfigType {
  icon: LucideIcon;
  color: string;
  label: string;
}

const getTierConfig = (copiers: number): TierConfigType => {
  if (copiers > TIER_THRESHOLDS.PRO) return { icon: Star, color: '#F59E0B', label: 'Pro Trader' };
  if (copiers > TIER_THRESHOLDS.VERIFIED) return { icon: CheckCircle, color: '#10B981', label: 'Verified' };
  return { icon: AlertCircle, color: '#6B7280', label: 'Basic' };
};

// Mock performance data (replace with real API)
const generatePerformanceData = (seed: string = 'default') => {
  const data = [];
  let value = 10000;
  let maxDD = 0;
  let peak = 10000;
  
  // ✅ Use deterministic pseudo-random based on seed
  const seededRandom = (index: number) => {
    const x = Math.sin(seed.length * 9999 + index * 123.456) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i <= CHART_CONFIG.PERFORMANCE_DAYS; i++) {
    const change = (seededRandom(i) - 0.45) * 200;
    value += change;
    if (value > peak) peak = value;
    const dd = ((value - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
    
    data.push({
      // ✅ Use day as unique identifier for XAxis dataKey
      day: i,
      value: value,
      drawdown: dd,
    });
  }
  return { data, maxDD };
};

// Mock slippage data - use index as dataKey for uniqueness
const SLIPPAGE_DATA = [
  { index: 0, range: '0-0.05%', count: 145, percent: 72.5 },
  { index: 1, range: '0.05-0.1%', count: 38, percent: 19 },
  { index: 2, range: '0.1-0.2%', count: 12, percent: 6 },
  { index: 3, range: '>0.2%', count: 5, percent: 2.5 },
];

// Mock strategy changes
const STRATEGY_CHANGES = [
  { date: '2026-01-15', from: 'Swing Trading', to: 'Scalping', reason: 'Market volatility increase', impact: 'Risk level: Medium → High' },
  { date: '2025-10-20', from: 'Day Trading', to: 'Swing Trading', reason: 'Lower frequency strategy', impact: 'Avg holding time: 2h → 8h' },
];

// Mock follower distribution - `name` field required by Recharts Pie for unique React keys
const FOLLOWER_DATA = [
  { index: 0, name: '$100-500', range: '$100-500', count: 52, percent: 21 },
  { index: 1, name: '$500-1K', range: '$500-1K', count: 78, percent: 31 },
  { index: 2, name: '$1K-5K', range: '$1K-5K', count: 89, percent: 35 },
  { index: 3, name: '$5K-10K', range: '$5K-10K', count: 23, percent: 9 },
  { index: 4, name: '>$10K', range: '>$10K', count: 8, percent: 4 },
];

// Pie chart colors
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function CopyProviderDetailPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'strategy' | 'disclosure'>('overview');
  const [feeAmount, setFeeAmount] = useState(1000);
  const [feeProfit, setFeeProfit] = useState(10);

  // Use a unique gradient ID for this page to prevent SVG conflicts
  const gradientId = `copy-equity-grad-${providerId}`;

  // ✅ Memoize chart data generation — MUST be before any conditional returns (Rules of Hooks)
  const { data: perfData, maxDD } = useMemo(() => generatePerformanceData(providerId ?? 'default'), [providerId]);

  // Find provider
  const provider = COPY_TRADERS.find(t => t.id === providerId);
  if (!provider) {
    return (
      <PageLayout>
        <Header title="Provider Not Found" back />
        <PageContent>
          <div className="text-center py-12">
            <AlertTriangle size={48} color={c.text3} className="mx-auto mb-4" />
            <p style={{ color: c.text2, fontSize: 14 }}>Provider không tồn tại</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const risk = RISK_CONFIG[provider.riskLevel];
  const tierConfig = getTierConfig(provider.copiers);
  const TierIcon = tierConfig.icon;
  
  // Fee calculation
  const platformFee = feeAmount * (FEE_CONFIG.PLATFORM_PCT / 100); // 0.1%
  const performanceFee = (feeAmount * (feeProfit / 100)) * (FEE_CONFIG.PERFORMANCE_PCT / 100); // 10% of profit
  const tradingFee = feeAmount * (FEE_CONFIG.TRADING_PCT / 100); // 0.25%
  const totalFees = platformFee + performanceFee + tradingFee;
  const netProfit = (feeAmount * (feeProfit / 100)) - totalFees;

  return (
    <PageLayout>
      <Header title={provider.name} back />

      <PageContent gap="relaxed">
        {/* ESMA Risk Warning */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <AlertTriangle size={16} color={c.warningText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Cảnh báo rủi ro
            </p>
            <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai. Bạn có thể mất toàn bộ vốn đầu tư.
            </p>
          </div>
        </div>

        {/* Provider Header Card */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
                <span style={{ color: c.primary, fontSize: 20, fontWeight: 700 }}>{provider.avatar}</span>
              </div>
              {/* Verification badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: c.surface, border: `1.5px solid ${tierConfig.color}` }}>
                <TierIcon size={13} color={tierConfig.color} />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{provider.name}</h2>
                {provider.isFollowing && <Star size={14} fill="#F59E0B" color="#F59E0B" />}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ background: tierConfig.color + '15', color: tierConfig.color, fontSize: 10, fontWeight: 600 }}>
                  {tierConfig.label}
                </span>
                <span className="px-2 py-0.5 rounded-md"
                  style={{ background: risk.color + '15', color: risk.color, fontSize: 10, fontWeight: 600 }}>
                  Rủi ro: {risk.label}
                </span>
                {provider.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md"
                    style={{ background: c.surface2, color: c.text2, fontSize: 10, fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                KYC Level 2 ✓ · Real Account · {provider.totalTrades.toLocaleString()} trades · Joined Nov 2024
              </p>
            </div>
          </div>

          {/* Key Stats — ROI + Max DD Equal Prominence */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700, marginBottom: 2 }}>
                +{provider.totalPnlPct.toFixed(1)}%
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Tổng ROI</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: '#EF4444', fontSize: 24, fontWeight: 700, marginBottom: 2 }}>
                {provider.maxDrawdown.toFixed(1)}%
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Max Drawdown</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.primary, fontSize: 24, fontWeight: 700, marginBottom: 2 }}>
                {provider.sharpeRatio.toFixed(2)}
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Sharpe Ratio</p>
            </div>
          </div>
        </TrCard>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(['overview', 'performance', 'strategy', 'disclosure'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="shrink-0 px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab ? c.primary : c.surface2,
                color: activeTab === tab ? '#fff' : c.text2,
                fontWeight: activeTab === tab ? 600 : 500,
              }}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'performance' && 'Hiệu suất'}
              {tab === 'strategy' && 'Chiến lược'}
              {tab === 'disclosure' && 'Công khai'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            {/* Performance Metrics */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Chỉ số hiệu suất
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Win Rate', value: `${provider.winRate}%`, color: '#10B981', icon: Target },
                  { label: 'Total P/L', value: fmtSignedUsd(provider.totalPnl), color: '#10B981', icon: DollarSign },
                  { label: 'Copiers', value: `${provider.copiers} / ${provider.maxCopiers}`, color: c.primary, icon: Users },
                  { label: 'AUM', value: fmtCompact(provider.aum, { prefix: '$' }), color: '#F59E0B', icon: BarChart3 },
                  { label: 'Avg Hold', value: provider.avgHoldingTime, color: c.text2, icon: Clock },
                  { label: 'Total Trades', value: provider.totalTrades.toLocaleString(), color: c.text2, icon: Activity },
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="flex items-center gap-2">
                      <Icon size={16} color={m.color} />
                      <div>
                        <p style={{ color: c.text3, fontSize: 10 }}>{m.label}</p>
                        <p style={{ color: m.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                          {m.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Slippage & Execution Quality */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                Chất lượng thực thi
              </h3>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 12 }}>
                Dữ liệu từ 200 lệnh gần nhất (30 ngày)
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>0.08%</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Avg Slippage</p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.primary, fontSize: 20, fontWeight: 700 }}>0.5s</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Exec Delay (P50)</p>
                </div>
                <div className="text-center">
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>98.5%</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Fill Rate</p>
                </div>
              </div>

              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SLIPPAGE_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid key="grid-slip" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-slip"
                      dataKey="index"
                      tick={{ fill: c.text3, fontSize: 9 }}
                      stroke={c.border}
                      tickFormatter={(value) => {
                        const item = SLIPPAGE_DATA.find(d => d.index === value);
                        return item ? item.range : value;
                      }}
                    />
                    <YAxis 
                      key="y-slip"
                      tick={{ fill: c.text3, fontSize: 9 }}
                      stroke={c.border}
                    />
                    <Tooltip
                      key="tip-slip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelFormatter={(value) => {
                        const item = SLIPPAGE_DATA.find(d => d.index === value);
                        return item ? `Slippage: ${item.range}` : value;
                      }}
                    />
                    <Bar 
                      key="bar-slip"
                      dataKey="count" 
                      fill={c.primary} 
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 4, textAlign: 'center' }}>
                72.5% lệnh có slippage {'<'}0.05% (xuất sắc)
              </p>
            </TrCard>

            {/* Fee Breakdown Calculator */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Tính phí dự kiến
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Số tiền copy (USD)
                  </label>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Lợi nhuận dự kiến (%)
                  </label>
                  <input
                    type="number"
                    value={feeProfit}
                    onChange={(e) => setFeeProfit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: c.text3, fontSize: 10 }}>Platform fee (0.1%)</span>
                  <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: c.text3, fontSize: 10 }}>Performance fee (10%)</span>
                  <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>${performanceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text3, fontSize: 10 }}>Trading fee (0.25%)</span>
                  <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>${tradingFee.toFixed(2)}</span>
                </div>
                <div className="h-px" style={{ background: c.border }} />
                <div className="flex justify-between items-center mt-2">
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>Tổng phí</span>
                  <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>${totalFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>Lợi nhuận ròng</span>
                  <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>${netProfit.toFixed(2)}</span>
                </div>
              </div>
              <p style={{ color: c.text3, fontSize: 9, marginTop: 4 }}>
                * Performance fee áp dụng high-water mark (chỉ tính trên profit mới)
              </p>
            </TrCard>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="flex flex-col gap-5">
            {/* Equity Curve */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                Đường equity (90 ngày)
              </h3>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 12 }}>
                Hiệu suất quá khứ không đảm bảo kết quả tương lai
              </p>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs key="gradient-defs">
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid key="grid-eq" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-eq"
                      dataKey="day"
                      tick={{ fill: c.text3, fontSize: 9 }}
                      stroke={c.border}
                      ticks={CHART_CONFIG.TICKS}
                      tickFormatter={(value) => `D${value}`}
                    />
                    <YAxis 
                      key="y-eq"
                      tick={{ fill: c.text3, fontSize: 9 }}
                      stroke={c.border}
                      tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      key="tip-eq"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'Equity']}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Area 
                      key="area-eq"
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fill={`url(#${gradientId})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TrCard>

            {/* Risk-Adjusted Metrics */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Chỉ số rủi ro điều chỉnh
              </h3>
              
              <div className="space-y-3">
                {[
                  { 
                    label: 'Sharpe Ratio', 
                    value: provider.sharpeRatio.toFixed(2), 
                    desc: 'Return trên 1 đơn vị rủi ro',
                    benchmark: '> 2.0 là tốt',
                    color: provider.sharpeRatio > 2 ? '#10B981' : '#F59E0B'
                  },
                  { 
                    label: 'Sortino Ratio', 
                    value: '2.87', 
                    desc: 'Chỉ tính rủi ro downside',
                    benchmark: '> 2.0 là tốt',
                    color: '#10B981'
                  },
                  { 
                    label: 'Calmar Ratio', 
                    value: (provider.totalPnlPct / Math.abs(provider.maxDrawdown)).toFixed(2), 
                    desc: 'Return / Max Drawdown',
                    benchmark: '> 3.0 là tốt',
                    color: '#F59E0B'
                  },
                  { 
                    label: 'Profit Factor', 
                    value: '2.15', 
                    desc: 'Gross profit / Gross loss',
                    benchmark: '> 1.5 là tốt',
                    color: '#10B981'
                  },
                ].map(m => (
                  <div key={m.label} className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: m.color + '15' }}
                    >
                      <span style={{ color: m.color, fontSize: 16, fontWeight: 700 }}>{m.value}</span>
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{m.label}</p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{m.desc}</p>
                      <p style={{ color: c.text3, fontSize: 9, marginTop: 2, opacity: 0.7 }}>
                        Benchmark: {m.benchmark}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Follower Distribution */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Phân bố follower theo vn
              </h3>
              
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      key="pie-fol"
                      data={FOLLOWER_DATA}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="range"
                      label={(entry) => `${entry.percent}%`}
                      labelStyle={{ fontSize: 10, fill: c.text1, fontWeight: 600 }}
                      isAnimationActive={false}
                    >
                      {FOLLOWER_DATA.map((entry) => (
                        <Cell key={`cell-${entry.index}`} fill={PIE_COLORS[entry.index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      key="tip-pie"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {FOLLOWER_DATA.map((item) => (
                  <div key={`legend-${item.index}`} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ background: PIE_COLORS[item.index] }}
                    />
                    <span style={{ color: c.text2, fontSize: 11, flex: 1 }}>{item.range}</span>
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{item.count} người ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="flex flex-col gap-5">
            {/* Strategy Description */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                Mô tả chiến lược
              </h3>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Scalping strategies với focus vào BTC/USDT và ETH/USDT. Sử dụng technical indicators (RSI, MACD, Bollinger Bands) 
                kết hợp volume analysis để tìm entry/exit points. Average holding time 4.2 giờ. Risk management chặt chẽ với 
                stop-loss tự động và position sizing dựa trên volatility.
              </p>
            </TrCard>

            {/* Strategy Changes Log */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                Lịch sử thay đổi chiến lược
              </h3>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 12 }}>
                Provider phải thông báo trước 24h khi thay đổi chiến lược quan trọng
              </p>
              
              <div className="space-y-3">
                {STRATEGY_CHANGES.map((change, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl" 
                    style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} color={c.primary} />
                      <span style={{ color: c.text3, fontSize: 10 }}>{change.date}</span>
                    </div>
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 1 }}>
                      {change.from} → {change.to}
                    </p>
                    <p style={{ color: c.text2, fontSize: 11, marginBottom: 1 }}>{change.reason}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{change.impact}</p>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Trading Hours */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Thời gian giao dịch
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Active hours</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>08:00 - 22:00 UTC+7</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Timezone</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>GMT+7 (Vietnam)</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Avg trades/day</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>12-18 trades</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Weekend trading</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Yes (reduced)</p>
                </div>
              </div>
            </TrCard>
          </div>
        )}

        {activeTab === 'disclosure' && (
          <div className="flex flex-col gap-5">
            {/* Verification Details */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Chi tiết xác minh
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Verification Tier', value: tierConfig.label, icon: TierIcon, color: tierConfig.color },
                  { label: 'KYC Level', value: 'Level 2 ✓', icon: CheckCircle, color: '#10B981' },
                  { label: 'Account Type', value: 'Real Money Trading', icon: Shield, color: c.primary },
                  { label: 'Track Record', value: '4 months verified', icon: Clock, color: c.text2 },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <Icon size={16} color={item.color} />
                      <div className="flex-1">
                        <p style={{ color: c.text3, fontSize: 10 }}>{item.label}</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Compensation Model */}
            <TrCard className="p-4">
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                Cơ chế thu nhập
              </h3>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 12 }}>
                MiFID II requires full compensation disclosure
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text2, fontSize: 12 }}>Performance fee</span>
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>10% of profit</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text2, fontSize: 12 }}>High-water mark</span>
                  <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>Enabled ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text2, fontSize: 12 }}>Spread rebates</span>
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>None</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text2, fontSize: 12 }}>Other incentives</span>
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>None disclosed</span>
                </div>
              </div>
            </TrCard>

            {/* Conflict of Interest */}
            <TrCard className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info size={16} color={c.primary} className="shrink-0 mt-0.5" />
                <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                  Xung đột lợi ích
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: c.primary }} />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Provider có thể giữ vị thế trên các tài sản được copy
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: c.primary }} />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Provider không nhận commission từ trading volume của followers
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: c.primary }} />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Provider không phải investment advisor được cấp phép
                  </p>
                </div>
              </div>
            </TrCard>

            {/* Fiduciary Disclaimer */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
                <strong style={{ color: c.text1 }}>Fiduciary Disclaimer:</strong> Provider không phải là investment advisor 
                hoặc fiduciary. Chiến lược copy không phải là lời khuyên tài chính. Bạn hoàn toàn chịu trách nhiệm cho quyết định đầu tư của mình.
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => navigate(`${prefix}/trade/copy-provider/${providerId}/assessment`)}
          className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: c.primary,
            color: '#fff',
            height: 48,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span>Đánh giá rủi ro</span>
          <ChevronRight size={16} />
        </button>

        {/* Past Performance Disclaimer */}
        <div className="mb-4">
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
            Hiệu suất quá khứ không đảm bảo kết quả tương lai. Copy Trading có rủi ro cao. Chỉ đầu tư số tiền bạn có thể chấp nhận mất.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}