/**
 * ══════════════════════════════════════════════════════════════
 *  PortfolioRiskAnalysisPage — Phase 2: Risk Management
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Aggregate exposure by asset
 * - Correlation heatmap across providers
 * - Value at Risk (VaR) calculation
 * - Scenario analysis (stress tests)
 * - Diversification score
 * 
 * Compliance:
 * - Risk concentration limits
 * - Correlation warnings (>0.8)
 * - VaR disclosure (95% confidence)
 * 
 * Guidelines:
 * - PageLayout + TabBar
 * - Heavy visualizations (Recharts)
 * - Color-coded risk levels
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Shield, AlertTriangle, TrendingDown, BarChart3, Target,
  Activity, Info, Eye, DollarSign, Percent
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter
} from 'recharts';

type TabType = 'exposure' | 'correlation' | 'var' | 'scenarios';

// Mock portfolio data
const ASSET_EXPOSURE = [
  { asset: 'BTC', value: 2800, percent: 35, color: '#F7931A' },
  { asset: 'ETH', value: 2000, percent: 25, color: '#627EEA' },
  { asset: 'SOL', value: 1200, percent: 15, color: '#00D4AA' },
  { asset: 'AVAX', value: 800, percent: 10, color: '#E84142' },
  { asset: 'USDT', value: 600, percent: 7.5, color: '#26A17B' },
  { asset: 'Others', value: 600, percent: 7.5, color: '#6B7280' },
];

const CORRELATION_MATRIX = [
  { provider: 'CryptoKing', cryptoKing: 1.00, swingMaster: 0.72, algoTrader: 0.45 },
  { provider: 'SwingMaster', cryptoKing: 0.72, swingMaster: 1.00, algoTrader: 0.38 },
  { provider: 'AlgoTrader', cryptoKing: 0.45, swingMaster: 0.38, algoTrader: 1.00 },
];

const VAR_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  var95: -250 - Math.random() * 100,
  var99: -350 - Math.random() * 150,
  actual: (Math.random() - 0.5) * 300,
}));

const STRESS_SCENARIOS = [
  { name: 'Market Crash (-30%)', impact: -2400, probability: 5, color: '#EF4444' },
  { name: 'BTC Halving Rally', impact: +1800, probability: 20, color: '#10B981' },
  { name: 'Regulatory Crackdown', impact: -1500, probability: 15, color: '#F59E0B' },
  { name: 'Stable Bull Market', impact: +600, probability: 40, color: '#3B82F6' },
  { name: 'High Volatility', impact: -800, probability: 20, color: '#8B5CF6' },
];

export function PortfolioRiskAnalysisPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('exposure');

  const totalValue = ASSET_EXPOSURE.reduce((sum, a) => sum + a.value, 0);
  const var95 = VAR_HISTORY[VAR_HISTORY.length - 1].var95;
  const var99 = VAR_HISTORY[VAR_HISTORY.length - 1].var99;

  // Calculate diversification score (0-100, higher is better)
  const diversificationScore = useMemo(() => {
    // Simple Herfindahl index
    const herfindahl = ASSET_EXPOSURE.reduce((sum, a) => sum + Math.pow(a.percent / 100, 2), 0);
    const maxDiversity = 1 / ASSET_EXPOSURE.length; // Perfect diversification
    const score = (1 - (herfindahl - maxDiversity) / (1 - maxDiversity)) * 100;
    return Math.max(0, Math.min(100, score));
  }, []);

  // Concentration risk check
  const highConcentration = ASSET_EXPOSURE.filter(a => a.percent > 30);
  
  // Correlation warnings
  const highCorrelation = CORRELATION_MATRIX.flatMap((row, i) => 
    Object.entries(row)
      .filter(([key, val]) => key !== 'provider' && typeof val === 'number' && val > 0.8 && i < CORRELATION_MATRIX.length - 1)
      .map(([key, val]) => ({ p1: row.provider, p2: key, corr: val }))
  );

  return (
    <PageLayout>
      <Header title="Phân tích rủi ro" back />

      <PageContent gap="relaxed">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Exposure</p>
            <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              ${totalValue.toLocaleString()}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>Across {ASSET_EXPOSURE.length} assets</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>VaR (95%, 1-day)</p>
            <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              ${Math.abs(var95).toFixed(0)}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>Max loss @ 95%</p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Diversification</p>
            <p style={{ 
              color: diversificationScore > 70 ? '#10B981' : diversificationScore > 50 ? '#F59E0B' : '#EF4444',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 2
            }}>
              {diversificationScore.toFixed(0)}/100
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>
              {diversificationScore > 70 ? 'Good' : diversificationScore > 50 ? 'Medium' : 'Poor'}
            </p>
          </div>

          <div className="p-3 rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Risk Alerts</p>
            <p style={{ 
              color: (highConcentration.length + highCorrelation.length) > 0 ? '#EF4444' : '#10B981',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 2
            }}>
              {highConcentration.length + highCorrelation.length}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>Active warnings</p>
          </div>
        </div>

        {/* Risk Warnings */}
        {(highConcentration.length > 0 || highCorrelation.length > 0) && (
          <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
              <h4 style={{ color: c.warningText, fontSize: 12, fontWeight: 700 }}>
                Cảnh báo rủi ro
              </h4>
            </div>
            <ul className="space-y-1">
              {highConcentration.map(asset => (
                <li key={asset.asset} style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                  • {asset.asset} chiếm {asset.percent}% (khuyến nghị &lt;30%)
                </li>
              ))}
              {highCorrelation.map((corr, i) => (
                <li key={i} style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                  • High correlation: {corr.p1} ↔ {corr.p2} ({(corr.corr as number).toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'exposure', label: 'Exposure' },
            { id: 'correlation', label: 'Correlation' },
            { id: 'var', label: 'VaR' },
            { id: 'scenarios', label: 'Stress Test' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'exposure' && (
          <div className="space-y-4">
            <PageSection label="Asset Allocation" accentColor={c.primary}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      key="pie-exposure"
                      data={ASSET_EXPOSURE}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ asset, percent }) => `${asset} ${percent}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ASSET_EXPOSURE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {ASSET_EXPOSURE.map(asset => (
                  <div 
                    key={asset.asset}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ background: asset.color }}
                      />
                      <span style={{ color: c.text2, fontSize: 11 }}>{asset.asset}</span>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        ${asset.value.toLocaleString()}
                      </p>
                      <p style={{ color: c.text3, fontSize: 9 }}>
                        {asset.percent}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                  Diversification score {diversificationScore.toFixed(0)}/100. 
                  Khuyến nghị không để asset nào chiếm &gt;30% portfolio.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="space-y-4">
            <PageSection label="Provider Correlation Matrix" accentColor="#8B5CF6">
              <div className="p-3 rounded-xl mb-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex items-start gap-2">
                  <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                    Correlation &gt;0.8 nghĩa là 2 providers có xu hướng giống nhau. 
                    Portfolio tốt nên có providers với correlation thấp.
                  </p>
                </div>
              </div>

              {/* Correlation Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left" style={{ fontSize: 10, color: c.text3 }}>Provider</th>
                      {CORRELATION_MATRIX.map(row => (
                        <th key={row.provider} className="p-2 text-center" style={{ fontSize: 10, color: c.text3 }}>
                          {row.provider.split(/(?=[A-Z])/).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CORRELATION_MATRIX.map((row, i) => (
                      <tr key={row.provider}>
                        <td className="p-2" style={{ fontSize: 11, color: c.text2, fontWeight: 600 }}>
                          {row.provider.split(/(?=[A-Z])/).join(' ')}
                        </td>
                        {Object.entries(row)
                          .filter(([key]) => key !== 'provider')
                          .map(([key, val]) => {
                            const isHigh = typeof val === 'number' && val > 0.8 && val < 1.0;
                            return (
                              <td 
                                key={key}
                                className="p-2 text-center"
                                style={{ 
                                  background: isHigh ? c.warningBg : c.surface2,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: isHigh ? c.warningText : c.text1,
                                }}
                              >
                                {typeof val === 'number' ? val.toFixed(2) : '-'}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'var' && (
          <div className="space-y-4">
            <PageSection label="Value at Risk (30 ngày)" accentColor="#EF4444">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={VAR_HISTORY} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid key="grid-var" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis 
                      key="x-var"
                      dataKey="day" 
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <YAxis 
                      key="y-var"
                      stroke={c.text3}
                      style={{ fontSize: 10 }}
                    />
                    <Tooltip
                      key="tip-var"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => `$${value.toFixed(0)}`}
                    />
                    <Legend key="legend-var" wrapperStyle={{ fontSize: 11 }} />
                    <Bar key="bar-var95" dataKey="var95" fill="#F59E0B" name="VaR 95%" />
                    <Bar key="bar-var99" dataKey="var99" fill="#EF4444" name="VaR 99%" />
                    <Bar key="bar-actual" dataKey="actual" fill="#3B82F6" name="Actual P/L" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: '#FEF2F2' }}>
                  <p style={{ color: '#991B1B', fontSize: 10, marginBottom: 4 }}>VaR 95% (1-day)</p>
                  <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                    ${Math.abs(var95).toFixed(0)}
                  </p>
                  <p style={{ color: '#991B1B', fontSize: 9, marginTop: 2 }}>
                    5% ngày có thể lỗ nhiều hơn
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#FEF2F2' }}>
                  <p style={{ color: '#991B1B', fontSize: 10, marginBottom: 4 }}>VaR 99% (1-day)</p>
                  <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                    ${Math.abs(var99).toFixed(0)}
                  </p>
                  <p style={{ color: '#991B1B', fontSize: 9, marginTop: 2 }}>
                    1% ngày có thể lỗ nhiều hơn
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.dangerBg }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} color={c.dangerText} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.dangerText, fontSize: 10, lineHeight: 1.5 }}>
                    VaR chỉ ước tính rủi ro trong điều kiện market bình thường. 
                    Trong black swan events, loss có thể vượt xa VaR 99%.
                  </p>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            <PageSection label="Stress Test Scenarios" accentColor="#6B7280">
              <div className="space-y-2">
                {STRESS_SCENARIOS.map(scenario => (
                  <div 
                    key={scenario.name}
                    className="p-3 rounded-xl"
                    style={{ background: c.surface2 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                          {scenario.name}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>
                          Probability: {scenario.probability}%
                        </p>
                      </div>
                      <p style={{ 
                        color: scenario.impact >= 0 ? '#10B981' : '#EF4444',
                        fontSize: 16,
                        fontWeight: 700
                      }}>
                        {scenario.impact >= 0 ? '+' : ''}${scenario.impact.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: c.border }}>
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          background: scenario.color,
                          width: `${Math.abs(scenario.impact) / 2400 * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex items-start gap-2">
                  <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                    Stress test giúp bạn hiểu portfolio sẽ phản ứng ra sao trong các tình huống thị trường khác nhau. 
                    Đảm bảo bạn có thể chấp nhận worst-case scenario.
                  </p>
                </div>
              </div>
            </PageSection>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}