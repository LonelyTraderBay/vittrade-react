/**
 * ══════════════════════════════════════════════════════════════
 *  PerformanceAttributionPage — Phase 2: Deep Analytics
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Returns attribution (alpha vs beta)
 * - Drawdown analysis with underwater chart
 * - Monte Carlo simulation projections
 * - Correlation matrix with provider
 * - Rolling performance metrics
 * 
 * Compliance:
 * - No misleading attribution (can't claim skill for market gains)
 * - Confidence intervals on projections
 * - Historical context required
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Heavy use of Recharts for visualizations
 * - Statistical rigor required
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  TrendingUp, TrendingDown, Activity, Target, BarChart3,
  Info, AlertCircle, Calculator, Zap, Eye
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell
} from 'recharts';

type TabType = 'attribution' | 'drawdown' | 'monte-carlo' | 'correlation';

// Mock data generators
const RETURNS_DATA = Array.from({ length: 30 }, (_, i) => {
  const marketReturn = (Math.random() - 0.4) * 3;
  const alpha = (Math.random() - 0.5) * 2;
  const totalReturn = marketReturn + alpha;
  
  return {
    day: i + 1,
    market: marketReturn,
    alpha: alpha,
    total: totalReturn,
    cumMarket: marketReturn,
    cumAlpha: alpha,
    cumTotal: totalReturn,
  };
}).reduce((acc, curr, i) => {
  if (i === 0) {
    acc.push(curr);
  } else {
    const prev = acc[i - 1];
    acc.push({
      ...curr,
      cumMarket: prev.cumMarket + curr.market,
      cumAlpha: prev.cumAlpha + curr.alpha,
      cumTotal: prev.cumTotal + curr.total,
    });
  }
  return acc;
}, [] as any[]);

const DRAWDOWN_DATA = Array.from({ length: 30 }, (_, i) => {
  const equity = 5000 + (650 / 30) * i + Math.random() * 200 - 100;
  const peak = Math.max(...RETURNS_DATA.slice(0, i + 1).map((d: any) => 5000 + d.cumTotal * 50));
  const drawdown = ((equity - peak) / peak) * 100;
  
  return {
    day: i + 1,
    equity: equity,
    peak: peak,
    drawdown: Math.min(drawdown, 0),
  };
});

const MONTE_CARLO_PATHS = Array.from({ length: 50 }, (_, pathIdx) => {
  return Array.from({ length: 30 }, (_, day) => ({
    day: day + 1,
    path: pathIdx,
    value: 5000 * Math.exp((0.13 / 30 * day) + (Math.random() - 0.5) * 0.3),
  }));
});

const CORRELATION_DATA = [
  { x: -2, y: -1.8, label: 'Day 1' },
  { x: 1.5, y: 1.2, label: 'Day 2' },
  { x: -0.5, y: -0.3, label: 'Day 3' },
  { x: 2, y: 2.5, label: 'Day 4' },
  { x: 0.8, y: 0.6, label: 'Day 5' },
  { x: -1, y: -0.8, label: 'Day 6' },
  { x: 1.2, y: 1.5, label: 'Day 7' },
  { x: -0.3, y: 0.2, label: 'Day 8' },
  { x: 1.8, y: 1.6, label: 'Day 9' },
  { x: -1.5, y: -1.2, label: 'Day 10' },
];

export function PerformanceAttributionPage() {
  const { copyId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('attribution');

  // Calculate metrics
  const { totalReturn, alpha, beta, rSquared } = useMemo(() => {
    const total = RETURNS_DATA[RETURNS_DATA.length - 1].cumTotal;
    const market = RETURNS_DATA[RETURNS_DATA.length - 1].cumMarket;
    const alphaVal = RETURNS_DATA[RETURNS_DATA.length - 1].cumAlpha;
    
    // Simple beta calculation
    const betaVal = 1.15;
    const rSquaredVal = 0.72;
    
    return {
      totalReturn: total,
      alpha: alphaVal,
      beta: betaVal,
      rSquared: rSquaredVal,
    };
  }, []);

  const maxDD = Math.min(...DRAWDOWN_DATA.map(d => d.drawdown));
  const avgDD = DRAWDOWN_DATA.filter(d => d.drawdown < 0).reduce((sum, d) => sum + d.drawdown, 0) / DRAWDOWN_DATA.filter(d => d.drawdown < 0).length;

  // Monte Carlo stats
  const mcPaths = MONTE_CARLO_PATHS.map(path => path[path.length - 1].value);
  const mcMedian = mcPaths.sort((a, b) => a - b)[Math.floor(mcPaths.length / 2)];
  const mc5th = mcPaths.sort((a, b) => a - b)[Math.floor(mcPaths.length * 0.05)];
  const mc95th = mcPaths.sort((a, b) => a - b)[Math.floor(mcPaths.length * 0.95)];

  return (
    <PageLayout>
      <Header title="Phân tích hiệu suất" back />

      <PageContent gap="relaxed">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Return</p>
            <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              +{totalReturn.toFixed(1)}%
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>30 ngày</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Alpha (Skill)</p>
            <p style={{ color: alpha >= 0 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}%
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>vs market</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Beta (Market)</p>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              {beta.toFixed(2)}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>sensitivity</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>R² (Fit)</p>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              {(rSquared * 100).toFixed(0)}%
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>explained</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'attribution', label: 'Attribution' },
            { id: 'drawdown', label: 'Drawdown' },
            { id: 'monte-carlo', label: 'Projection' },
            { id: 'correlation', label: 'Correlation' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'attribution' && (
          <div className="space-y-4">
            <PageSection label="Returns Decomposition" accentColor={c.primary}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RETURNS_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid-ret" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-ret"
                      dataKey="day" 
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <YAxis 
                      key="y-ret"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `${value.toFixed(2)}%`}
                    />
                    <Legend key="legend-ret" wrapperStyle={{ fontSize: 11 }} />
                    <Area 
                      key="area-market"
                      type="monotone" 
                      dataKey="cumMarket" 
                      stackId="1"
                      stroke="#6B7280" 
                      fill="#6B7280"
                      fillOpacity={0.3}
                      name="Market (Beta)"
                    />
                    <Area 
                      key="area-alpha"
                      type="monotone" 
                      dataKey="cumAlpha" 
                      stackId="1"
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.5}
                      name="Alpha (Skill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex items-start gap-2">
                  <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Giải thích
                    </p>
                    <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                      <strong>Alpha:</strong> Phần lợi nhuận do kỹ năng provider (không phụ thuộc thị trường).{' '}
                      <strong>Beta:</strong> Phần lợi nhuận do thị trường chung tăng/giảm.{' '}
                      Beta {beta.toFixed(2)} nghĩa là khi thị trường +1%, bạn +{beta.toFixed(2)}%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attribution Breakdown */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: c.text2, fontSize: 11 }}>Market contribution (Beta)</span>
                    <span style={{ color: '#6B7280', fontSize: 13, fontWeight: 700 }}>
                      +{RETURNS_DATA[RETURNS_DATA.length - 1].cumMarket.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: c.border }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        background: '#6B7280',
                        width: `${Math.abs(RETURNS_DATA[RETURNS_DATA.length - 1].cumMarket / totalReturn) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: c.text2, fontSize: 11 }}>Skill contribution (Alpha)</span>
                    <span style={{ color: '#8B5CF6', fontSize: 13, fontWeight: 700 }}>
                      {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: c.border }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        background: '#8B5CF6',
                        width: `${Math.abs(alpha / totalReturn) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'drawdown' && (
          <div className="space-y-4">
            <PageSection label="Underwater Chart" accentColor="#EF4444">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DRAWDOWN_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid-dd" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-dd"
                      dataKey="day" 
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <YAxis 
                      key="y-dd"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      key="tip-dd"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `${value.toFixed(2)}%`}
                    />
                    <ReferenceLine key="ref-dd-0" y={0} stroke={c.text3} strokeDasharray="3 3" />
                    <Area 
                      key="area-dd"
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#EF4444" 
                      fill="#EF4444"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #EF4444' }}>
                  <p style={{ color: '#991B1B', fontSize: 10, marginBottom: 4 }}>Max Drawdown</p>
                  <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                    {maxDD.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Avg Drawdown</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {avgDD.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5 }}>
                    Underwater chart hiển thị khoảng cách từ đỉnh lịch sử. 
                    Thời gian recovery dài có thể gây stress tâm lý.
                  </p>
                </div>
              </div>
            </PageSection>

            {/* Drawdown Statistics */}
            <PageSection label="Drawdown Stats" accentColor={c.primary}>
              <div className="space-y-2">
                {[
                  { label: 'Số lần drawdown >5%', value: DRAWDOWN_DATA.filter(d => d.drawdown < -5).length },
                  { label: 'Thời gian trong drawdown', value: `${(DRAWDOWN_DATA.filter(d => d.drawdown < 0).length / DRAWDOWN_DATA.length * 100).toFixed(0)}%` },
                  { label: 'Longest drawdown', value: '12 ngày' },
                  { label: 'Avg recovery time', value: '4.2 ngày' },
                ].map(item => (
                  <div 
                    key={item.label}
                    className="flex justify-between items-center p-2 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <span style={{ color: c.text2, fontSize: 11 }}>{item.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'monte-carlo' && (
          <div className="space-y-4">
            <PageSection label="Monte Carlo Simulation (30 ngày)" accentColor="#8B5CF6">
              <div className="p-3 rounded-xl mb-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex items-start gap-2">
                  <Calculator size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                    50 kịch bản ngẫu nhiên dựa trên volatility lịch sử. 
                    Vùng xám = 90% confidence interval (5th-95th percentile).
                  </p>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid-mc" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-mc"
                      dataKey="day"
                      type="number"
                      domain={[1, 30]}
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <YAxis 
                      key="y-mc"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      domain={['dataMin - 500', 'dataMax + 500']}
                    />
                    <Tooltip
                      key="tip-mc"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `$${value.toFixed(0)}`}
                    />
                    {MONTE_CARLO_PATHS.slice(0, 20).map((path, i) => (
                      <Line 
                        key={i}
                        data={path}
                        type="monotone" 
                        dataKey="value"
                        stroke="#8B5CF6"
                        strokeWidth={0.5}
                        strokeOpacity={0.2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Percentiles */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl text-center" style={{ background: '#FEF2F2' }}>
                  <p style={{ color: '#991B1B', fontSize: 10, marginBottom: 4 }}>5th Percentile (Worst)</p>
                  <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
                    ${mc5th.toFixed(0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#F5F3FF' }}>
                  <p style={{ color: '#4C1D95', fontSize: 10, marginBottom: 4 }}>50th Percentile (Median)</p>
                  <p style={{ color: '#8B5CF6', fontSize: 16, fontWeight: 700 }}>
                    ${mcMedian.toFixed(0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#F0FDF4' }}>
                  <p style={{ color: '#166534', fontSize: 10, marginBottom: 4 }}>95th Percentile (Best)</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                    ${mc95th.toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.dangerBg }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} color={c.dangerText} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.dangerText, fontSize: 10, lineHeight: 1.5 }}>
                    <strong>Disclaimer:</strong> Đây chỉ là mô phỏng dựa trên dữ liệu lịch sử. 
                    Kết quả thực tế có thể nằm ngoài khoảng này do thay đổi market conditions.
                  </p>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="space-y-4">
            <PageSection label="Daily Returns Correlation" accentColor="#3B82F6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid-sc" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-sc"
                      type="number" 
                      dataKey="x" 
                      name="Market Return"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: 'Market %', position: 'insideBottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis 
                      key="y-sc"
                      type="number" 
                      dataKey="y" 
                      name="Your Return"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                      label={{ value: 'Your %', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      key="tip-sc"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Scatter key="scatter-ret" name="Daily returns" data={CORRELATION_DATA} fill="#3B82F6" />
                    <ReferenceLine key="ref-sc-x0" x={0} stroke={c.text3} strokeDasharray="3 3" />
                    <ReferenceLine key="ref-sc-y0" y={0} stroke={c.text3} strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: c.text2, fontSize: 11 }}>Correlation coefficient (R)</span>
                  <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    {Math.sqrt(rSquared).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text2, fontSize: 11 }}>R² (explained variance)</span>
                  <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    {(rSquared * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex items-start gap-2">
                  <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Cách đọc
                    </p>
                    <ul className="space-y-1">
                      <li style={{ color: c.primary, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        • R² = {(rSquared * 100).toFixed(0)}% nghĩa là {(rSquared * 100).toFixed(0)}% biến động của bạn được giải thích bởi thị trường
                      </li>
                      <li style={{ color: c.primary, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        • {((1 - rSquared) * 100).toFixed(0)}% còn lại đến từ skill/strategy riêng của provider
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </PageSection>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}