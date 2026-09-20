import React, { useState } from 'react';
import { AlertTriangle, Shield, TrendingDown, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fmtUsd } from '../../data/formatNumber';
import { useNavigate } from 'react-router';

interface RiskMetric {
  category: string;
  score: number; // 0-100
  status: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action?: string;
}

const OVERALL_RISK_SCORE = 28; // 0-100 (lower is better)

const RISK_METRICS: RiskMetric[] = [
  {
    category: 'Validator Health',
    score: 15,
    status: 'low',
    description: 'All validators performing normally. Avg uptime: 99.8%',
    action: 'View Validator Monitor',
  },
  {
    category: 'Slashing Risk',
    score: 8,
    status: 'low',
    description: 'No slashing events in 90 days. Insurance fund at 165%',
    action: 'View Slashing History',
  },
  {
    category: 'Smart Contract Risk',
    score: 20,
    status: 'low',
    description: 'Last audit: 30 days ago. No critical vulnerabilities',
    action: 'View Audit Reports',
  },
  {
    category: 'Liquidity Risk',
    score: 35,
    status: 'medium',
    description: 'Unstaking queue: 2-3 days. Normal range for current network',
    action: 'View Liquidity Analysis',
  },
  {
    category: 'Market Risk',
    score: 45,
    status: 'medium',
    description: 'ETH volatility: 25% (30-day). Higher than 12-month avg',
    action: 'View Market Analysis',
  },
  {
    category: 'Concentration Risk',
    score: 52,
    status: 'medium',
    description: '45% of stake on ETH. Consider diversification',
    action: 'View Portfolio Allocation',
  },
];

const EXPOSURE_DATA = [
  { asset: 'ETH', value: 45000, percentage: 45, risk: 'medium' },
  { asset: 'BTC', value: 30000, percentage: 30, risk: 'low' },
  { asset: 'SOL', value: 15000, percentage: 15, risk: 'medium' },
  { asset: 'USDT', value: 10000, percentage: 10, risk: 'low' },
];

const RISK_EVENTS = [
  {
    id: 're1',
    date: '2026-03-05',
    type: 'warning' as const,
    title: 'High ETH Volatility Detected',
    desc: '30-day volatility increased to 25% (avg: 18%)',
    severity: 'medium' as const,
  },
  {
    id: 're2',
    date: '2026-03-01',
    type: 'info' as const,
    title: 'Validator Uptime Alert',
    desc: 'Validator #3 uptime dropped to 98.5% (threshold: 99%)',
    severity: 'low' as const,
  },
  {
    id: 're3',
    date: '2026-02-25',
    type: 'resolved' as const,
    title: 'Smart Contract Upgrade Completed',
    desc: 'Staking contract upgraded to v2.1 with security improvements',
    severity: 'low' as const,
  },
];

export function StakingRiskDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const getRiskColor = (score: number) => {
    if (score < 25) return '#10B981';
    if (score < 50) return '#F59E0B';
    if (score < 75) return '#F97316';
    return '#EF4444';
  };

  const getRiskLabel = (score: number) => {
    if (score < 25) return 'Low Risk';
    if (score < 50) return 'Moderate Risk';
    if (score < 75) return 'High Risk';
    return 'Critical Risk';
  };

  const overallColor = getRiskColor(OVERALL_RISK_SCORE);
  const overallLabel = getRiskLabel(OVERALL_RISK_SCORE);

  return (
    <PageLayout>
      <Header title="Risk Dashboard" back />

      <PageContent>
        {/* Overall Risk Score */}
        <TrCard className="p-5">
          <div className="text-center mb-6">
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 8 }}>Overall Risk Score</p>
            <div
              className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: `${overallColor}22`, border: `4px solid ${overallColor}` }}>
              <div>
                <p style={{ color: overallColor, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                  {OVERALL_RISK_SCORE}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>/ 100</p>
              </div>
            </div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-2"
              style={{ background: `${overallColor}22` }}>
              <Shield size={16} color={overallColor} />
              <p style={{ color: overallColor, fontSize: 14, fontWeight: 700 }}>
                {overallLabel}
              </p>
            </div>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
              Your staking portfolio has {overallLabel.toLowerCase()}. No immediate action required, but monitor market volatility.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Staked</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                {fmtUsd(100000)}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>At Risk</p>
              <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700 }}>
                {fmtUsd(5000)}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Protected</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                95%
              </p>
            </div>
          </div>
        </TrCard>

        {/* Risk Breakdown */}
        <PageSection label="Risk Breakdown">
          <div className="flex flex-col gap-2">
            {RISK_METRICS.map((metric, idx) => {
              const color = getRiskColor(metric.score);
              return (
                <TrCard
                  key={idx}
                  hover={!!metric.action}
                  className="p-4"
                  onClick={() => {
                    if (metric.action) {
                      if (metric.category === 'Validator Health') navigate('/earn/validator-health-monitor');
                      else if (metric.category === 'Slashing Risk') navigate('/earn/slashing-history');
                      else if (metric.category === 'Smart Contract Risk') navigate('/earn/audit-reports');
                    }
                  }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}22` }}>
                      {metric.status === 'low' ? (
                        <Shield size={20} color={color} />
                      ) : metric.status === 'critical' ? (
                        <AlertTriangle size={20} color={color} />
                      ) : (
                        <AlertCircle size={20} color={color} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {metric.category}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: `${color}22`, color }}>
                            {metric.score}/100
                          </span>
                          {metric.action && <ChevronRight size={16} color={c.text3} />}
                        </div>
                      </div>
                      <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {metric.description}
                      </p>
                    </div>
                  </div>

                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ background: color, width: `${metric.score}%` }}
                    />
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Exposure by Asset */}
        <PageSection label="Exposure by Asset">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  key="pie-exposure"
                  data={EXPOSURE_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ asset, percentage }) => `${asset} ${percentage}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value">
                  {EXPOSURE_DATA.map((entry, index) => (
                    <Cell
                      key={`exp-cell-${index}`}
                      fill={
                        entry.risk === 'low' ? '#10B981' :
                        entry.risk === 'medium' ? '#F59E0B' : '#EF4444'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => fmtUsd(value)}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-3">
              {EXPOSURE_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: item.risk === 'low' ? '#10B981' :
                                   item.risk === 'medium' ? '#F59E0B' : '#EF4444'
                      }}
                    />
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.asset}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {fmtUsd(item.value)}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Recent Risk Events */}
        <PageSection label="Recent Risk Events">
          <div className="flex flex-col gap-2">
            {RISK_EVENTS.map(event => {
              const iconColor =
                event.type === 'warning' ? '#F59E0B' :
                event.type === 'info' ? '#3B82F6' : '#10B981';
              const bgColor =
                event.type === 'warning' ? 'rgba(245,158,11,0.08)' :
                event.type === 'info' ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)';

              return (
                <TrCard key={event.id} className="p-3" style={{ background: bgColor }}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {event.type === 'warning' ? (
                        <AlertTriangle size={18} color={iconColor} />
                      ) : event.type === 'resolved' ? (
                        <Shield size={18} color={iconColor} />
                      ) : (
                        <Activity size={18} color={iconColor} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {event.title}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          {new Date(event.date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                        {event.desc}
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Quick Actions */}
        <PageSection label="Risk Management Actions">
          <div className="grid grid-cols-2 gap-3">
            <TrCard hover className="p-4" onClick={() => navigate('/earn/emergency-actions')}>
              <AlertTriangle size={20} color="#EF4444" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Emergency Actions
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Pause, withdraw, or rebalance</p>
            </TrCard>
            <TrCard hover className="p-4" onClick={() => navigate('/earn/risk-score-calculator')}>
              <Activity size={20} color="#3B82F6" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Risk Calculator
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Simulate scenarios</p>
            </TrCard>
            <TrCard hover className="p-4" onClick={() => navigate('/earn/contingency-plan')}>
              <Shield size={20} color="#10B981" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Contingency Plan
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>Disaster recovery</p>
            </TrCard>
            <TrCard hover className="p-4" onClick={() => navigate('/earn/insurance')}>
              <Shield size={20} color="#8B5CF6" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Insurance Fund
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>165% coverage</p>
            </TrCard>
          </div>
        </PageSection>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Risk scores are updated every 10 minutes. Historical data available for 12 months. Risk metrics are for informational purposes only and do not constitute financial advice.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}