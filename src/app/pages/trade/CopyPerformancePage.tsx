/**
 * ══════════════════════════════════════════════════════════════
 *  CopyPerformancePage — Phase 1 Week 3: Performance Analysis
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Dual equity curve comparison (You vs Provider)
 * - Slippage impact visualization
 * - Trade-by-trade execution comparison
 * - Cost attribution breakdown
 * - Risk-adjusted metrics comparison
 * 
 * Compliance:
 * - Full transparency on underperformance vs provider
 * - Slippage disclosure (ESMA requirement)
 * - All costs itemized and attributed
 * - No misleading comparisons
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Trust-first: show all performance gaps
 * - Charts use Recharts (consistent library)
 * - Color-coded: you (blue), provider (purple)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle,
  BarChart3, PieChart, ArrowRight, Info, Clock, Target,
  Zap, Eye, ChevronRight
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type TabType = 'overview' | 'trades' | 'costs' | 'metrics';

// Mock performance data
const EQUITY_CURVE_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  you: 5000 + (650 / 30) * i + Math.random() * 100 - 50,
  provider: 5000 + (780 / 30) * i + Math.random() * 80 - 40,
}));

const SLIPPAGE_DATA = [
  { range: '0-0.5%', you: 45, provider: 52 },
  { range: '0.5-1%', you: 30, provider: 28 },
  { range: '1-2%', you: 18, provider: 15 },
  { range: '2%+', you: 7, provider: 5 },
];

const COST_ATTRIBUTION = [
  { name: 'Trading Fees', value: 125, color: '#EF4444' },
  { name: 'Performance Fee', value: 65, color: '#F59E0B' },
  { name: 'Slippage', value: 95, color: '#6B7280' },
  { name: 'Platform Fee', value: 5, color: '#3B82F6' },
];

const TRADE_COMPARISON = [
  {
    id: 't1',
    pair: 'BTC/USDT',
    side: 'buy' as const,
    providerEntry: 67800,
    yourEntry: 67835,
    providerExit: 68500,
    yourExit: 68480,
    providerPnL: 35,
    yourPnL: 32,
    slippage: 0.52,
    delay: '2.1s',
    timestamp: '2024-03-05 14:23',
  },
  {
    id: 't2',
    pair: 'ETH/USDT',
    side: 'sell' as const,
    providerEntry: 3850,
    yourEntry: 3848,
    providerExit: 3825,
    yourExit: 3822,
    providerPnL: 50,
    yourPnL: 52,
    slippage: 0.31,
    delay: '1.8s',
    timestamp: '2024-03-04 09:15',
  },
  {
    id: 't3',
    pair: 'SOL/USDT',
    side: 'buy' as const,
    providerEntry: 142,
    yourEntry: 142.5,
    providerExit: 138,
    yourExit: 138.2,
    providerPnL: -40,
    yourPnL: -43,
    slippage: 0.71,
    delay: '3.2s',
    timestamp: '2024-03-03 16:42',
  },
];

export function CopyPerformancePage() {
  const { copyId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Summary stats
  const yourReturn = 13.0; // +13%
  const providerReturn = 15.6; // +15.6%
  const performanceGap = providerReturn - yourReturn; // -2.6%
  
  const yourSharpe = 1.82;
  const providerSharpe = 2.15;
  
  const yourMaxDD = -8.5;
  const providerMaxDD = -6.2;
  
  const totalCosts = COST_ATTRIBUTION.reduce((sum, item) => sum + item.value, 0);
  const avgSlippage = 0.68;

  return (
    <PageLayout>
      <Header title="Phân tích hiệu suất" back />

      <PageContent gap="relaxed">
        {/* Performance Gap Summary */}
        <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Tổng quan so sánh
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #3B82F6' }}>
              <p style={{ color: '#1E3A8A', fontSize: 11, marginBottom: 4 }}>Hiệu suất của bạn</p>
              <p style={{ color: '#3B82F6', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                +{yourReturn.toFixed(1)}%
              </p>
              <p style={{ color: '#1E3A8A', fontSize: 9 }}>$5,000 → $5,650</p>
            </div>

            <div className="p-3 rounded-xl" style={{ background: '#F5F3FF', border: '1px solid #8B5CF6' }}>
              <p style={{ color: '#4C1D95', fontSize: 11, marginBottom: 4 }}>Provider lý thuyết</p>
              <p style={{ color: '#8B5CF6', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                +{providerReturn.toFixed(1)}%
              </p>
              <p style={{ color: '#4C1D95', fontSize: 9 }}>$5,000 → $5,780</p>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl" style={{ 
            background: performanceGap < 0 ? c.warningBg : '#F0FDF4',
            border: `1px solid ${performanceGap < 0 ? c.warningBorder : '#10B981'}`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} color={performanceGap < 0 ? c.warningText : '#10B981'} />
                <span style={{ color: performanceGap < 0 ? c.warningText : '#166534', fontSize: 11 }}>
                  Chênh lệch hiệu suất
                </span>
              </div>
              <span style={{ 
                color: performanceGap < 0 ? c.warningText : '#10B981',
                fontSize: 16,
                fontWeight: 700
              }}>
                {performanceGap.toFixed(2)}%
              </span>
            </div>
            <p style={{ 
              color: performanceGap < 0 ? c.warningText : '#166534',
              fontSize: 10,
              marginTop: 4,
              lineHeight: 1.4
            }}>
              Nguyên nhân chính: slippage ({avgSlippage.toFixed(2)}%) và chi phí (${totalCosts})
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'trades', label: 'Trades' },
            { id: 'costs', label: 'Chi phí' },
            { id: 'metrics', label: 'Metrics' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Dual Equity Curve */}
            <PageSection label="Đường vốn so sánh (30 ngày)" accentColor={c.primary}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={EQUITY_CURVE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="xaxis"
                      dataKey="day" 
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: 'Ngày', position: 'insideBottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis 
                      key="yaxis"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `$${value.toFixed(0)}`}
                    />
                    <Legend 
                      key="legend"
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="line"
                    />
                    <Line 
                      key="line-you"
                      type="monotone" 
                      dataKey="you" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Bạn"
                      dot={false}
                    />
                    <Line 
                      key="line-provider"
                      type="monotone" 
                      dataKey="provider" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Provider (lý thuyết)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 p-3 rounded-lg" style={{ background: c.surface2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={12} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Tại sao có chênh lệch?</span>
                </div>
                <ul className="space-y-1">
                  {[
                    'Slippage: Copy orders thực thi chậm hơn 0.5-3s',
                    'Chi phí: Trading fees + performance fees',
                    'Position sizing: Fixed mode sử dụng 50% capital',
                  ].map((reason, i) => (
                    <li key={i} style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </PageSection>

            {/* Slippage Distribution */}
            <PageSection label="Phân bố Slippage" accentColor="#F59E0B">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SLIPPAGE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="xaxis"
                      dataKey="range" 
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <YAxis 
                      key="yaxis"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: '% Trades', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `${value}%`}
                    />
                    <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
                    <Bar key="bar-you" dataKey="you" fill="#3B82F6" name="Bạn" />
                    <Bar key="bar-provider" dataKey="provider" fill="#8B5CF6" name="Provider" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Slippage TB của bạn</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{avgSlippage.toFixed(2)}%</p>
                </div>
                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Provider TB</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>0.48%</p>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                So sánh từng giao dịch giữa bạn và provider. Chênh lệch chủ yếu do slippage và execution delay.
              </p>
            </div>

            {TRADE_COMPARISON.map(trade => (
              <div 
                key={trade.id}
                className="p-4 rounded-2xl"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: trade.side === 'buy' ? '#10B981' : '#EF4444',
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}
                    >
                      {trade.side}
                    </span>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{trade.pair}</span>
                  </div>
                  <span style={{ color: c.text3, fontSize: 10 }}>{trade.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Provider Column */}
                  <div className="p-3 rounded-lg" style={{ background: '#F5F3FF', border: '1px solid #8B5CF6' }}>
                    <p style={{ color: '#4C1D95', fontSize: 10, marginBottom: 6 }}>Provider</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span style={{ color: '#6B21A8', fontSize: 9 }}>Entry</span>
                        <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>${trade.providerEntry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#6B21A8', fontSize: 9 }}>Exit</span>
                        <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>${trade.providerExit}</span>
                      </div>
                      <div className="h-px" style={{ background: '#8B5CF6' }} />
                      <div className="flex justify-between">
                        <span style={{ color: '#6B21A8', fontSize: 9 }}>P/L</span>
                        <span style={{ 
                          color: trade.providerPnL >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {trade.providerPnL >= 0 ? '+' : ''}${trade.providerPnL}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Your Column */}
                  <div className="p-3 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #3B82F6' }}>
                    <p style={{ color: '#1E3A8A', fontSize: 10, marginBottom: 6 }}>Bạn</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span style={{ color: '#1E40AF', fontSize: 9 }}>Entry</span>
                        <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>${trade.yourEntry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#1E40AF', fontSize: 9 }}>Exit</span>
                        <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>${trade.yourExit}</span>
                      </div>
                      <div className="h-px" style={{ background: '#3B82F6' }} />
                      <div className="flex justify-between">
                        <span style={{ color: '#1E40AF', fontSize: 9 }}>P/L</span>
                        <span style={{ 
                          color: trade.yourPnL >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {trade.yourPnL >= 0 ? '+' : ''}${trade.yourPnL}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <div className="flex items-center gap-2">
                    <Clock size={12} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: 10 }}>Delay: {trade.delay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={12} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: 10 }}>Slippage: {trade.slippage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="space-y-4">
            {/* Cost Pie Chart */}
            <PageSection label="Phân bổ chi phí" accentColor="#EF4444">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      key="pie"
                      data={COST_ATTRIBUTION}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COST_ATTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      key="pie-tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `$${value}`}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {COST_ATTRIBUTION.map(item => (
                  <div 
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span style={{ color: c.text2, fontSize: 11 }}>{item.name}</span>
                    </div>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>${item.value}</span>
                  </div>
                ))}
                <div className="h-px" style={{ background: c.border }} />
                <div className="flex items-center justify-between p-2">
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Tổng chi phí</span>
                  <span style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>${totalCosts}</span>
                </div>
              </div>
            </PageSection>

            {/* Impact on Returns */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Ảnh hưởng đến lợi nhuận
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>Return gross</span>
                  <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>+18.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>- Chi phí ({((totalCosts / 5000) * 100).toFixed(1)}%)</span>
                  <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 600 }}>-5.8%</span>
                </div>
                <div className="h-px" style={{ background: c.border }} />
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Return net</span>
                  <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>+13.0%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Risk-Adjusted Metrics Comparison */}
            <PageSection label="Metrics điều chỉnh rủi ro" accentColor={c.primary}>
              <div className="space-y-3">
                {[
                  { name: 'Sharpe Ratio', you: yourSharpe, provider: providerSharpe, good: 'higher' },
                  { name: 'Max Drawdown', you: yourMaxDD, provider: providerMaxDD, good: 'lower' },
                  { name: 'Win Rate', you: 62.5, provider: 68.3, good: 'higher' },
                  { name: 'Avg Win/Loss', you: 1.42, provider: 1.68, good: 'higher' },
                ].map(metric => {
                  const youBetter = metric.good === 'higher' 
                    ? metric.you > metric.provider 
                    : metric.you < metric.provider;
                  
                  return (
                    <div key={metric.name} className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                        {metric.name}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Bạn</p>
                          <p style={{ 
                            color: youBetter ? '#10B981' : '#F59E0B',
                            fontSize: 16,
                            fontWeight: 700
                          }}>
                            {metric.you.toFixed(2)}{metric.name === 'Win Rate' ? '%' : ''}
                          </p>
                        </div>
                        <div className="text-center">
                          <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Provider</p>
                          <p style={{ 
                            color: !youBetter ? '#10B981' : '#F59E0B',
                            fontSize: 16,
                            fontWeight: 700
                          }}>
                            {metric.provider.toFixed(2)}{metric.name === 'Win Rate' ? '%' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageSection>

            {/* Explanation */}
            <div className="p-4 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    Tại sao metrics của bạn thấp hơn?
                  </p>
                  <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                    Slippage và execution delay làm giảm Sharpe Ratio và tăng Max Drawdown. 
                    Đây là điều bình thường trong copy trading và không thể tránh hoàn toàn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}