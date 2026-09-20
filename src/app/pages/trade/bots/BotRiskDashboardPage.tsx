import React, { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, Activity, DollarSign, Zap, AlertOctagon } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router';

// Mock real-time data
const DRAWDOWN_DATA = [
  { time: '00:00', drawdown: 0 },
  { time: '04:00', drawdown: -2.3 },
  { time: '08:00', drawdown: -5.1 },
  { time: '12:00', drawdown: -8.4 },
  { time: '16:00', drawdown: -12.2 },
  { time: '20:00', drawdown: -15.2 },
  { time: 'Now', drawdown: -15.2 },
];

const EXPOSURE_DATA = [
  { asset: 'BTC', exposure: 1250, percentage: 50 },
  { asset: 'ETH', exposure: 750, percentage: 30 },
  { asset: 'SOL', exposure: 500, percentage: 20 },
];

const VAR_HISTORY = [
  { date: 'Mon', var: 142 },
  { date: 'Tue', var: 156 },
  { date: 'Wed', var: 134 },
  { date: 'Thu', var: 167 },
  { date: 'Fri', var: 189 },
  { date: 'Sat', var: 201 },
  { date: 'Sun', var: 178 },
];

export function BotRiskDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  
  // Mock real-time risk data
  const [riskData] = useState({
    currentDrawdown: -15.2,
    maxDrawdownLimit: -20,
    dailyLoss: -127,
    dailyLossLimit: -500,
    totalExposure: 2500,
    maxExposure: 5000,
    riskScore: 68,
    var95: 178, // Value at Risk (95% confidence)
    circuitBreakerStatus: 'active',
    runningBots: 3,
  });

  const drawdownPercent = Math.abs((riskData.currentDrawdown / riskData.maxDrawdownLimit) * 100);
  const lossPercent = Math.abs((riskData.dailyLoss / riskData.dailyLossLimit) * 100);
  const exposurePercent = (riskData.totalExposure / riskData.maxExposure) * 100;

  const getRiskColor = (score: number) => {
    if (score < 40) return '#10B981'; // Low risk
    if (score < 70) return '#F59E0B'; // Medium risk
    return '#EF4444'; // High risk
  };

  const getRiskLabel = (score: number) => {
    if (score < 40) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  const riskColor = getRiskColor(riskData.riskScore);

  return (
    <PageLayout>
      <Header 
        title="Risk Dashboard" 
        back 
        action={{ 
          icon: AlertOctagon, 
          onClick: () => navigate('/trade/bots/emergency-stop') 
        }} 
      />

      <PageContent>
        {/* Overall Risk Score */}
        <TrCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: c.text3, fontSize: 12 }}>Portfolio Risk Score</p>
              <p style={{ color: riskColor, fontSize: 28, fontWeight: 700 }}>
                {riskData.riskScore}/100
              </p>
              <p style={{ color: riskColor, fontSize: 13, fontWeight: 600 }}>
                {getRiskLabel(riskData.riskScore)}
              </p>
            </div>
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ 
                background: `conic-gradient(${riskColor} ${riskData.riskScore * 3.6}deg, ${c.surface2} 0deg)`,
              }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: c.surface }}>
                <Shield size={32} color={riskColor} />
              </div>
            </div>
          </div>
          
          <div className="rounded-xl p-3" style={{ background: `${riskColor}10`, border: `1px solid ${riskColor}30` }}>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              {riskData.riskScore < 40 && 'Your portfolio is within safe risk limits. Continue monitoring performance.'}
              {riskData.riskScore >= 40 && riskData.riskScore < 70 && 'Moderate risk detected. Consider reducing position sizes or stopping high-risk bots.'}
              {riskData.riskScore >= 70 && '⚠️ High risk! Drawdown approaching limit. Consider emergency stop or reducing exposure immediately.'}
            </p>
          </div>
        </TrCard>

        {/* Critical Metrics */}
        <PageSection label="Critical Metrics">
          <div className="grid grid-cols-2 gap-3">
            {/* Drawdown */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={18} color="#EF4444" />
                <p style={{ color: c.text2, fontSize: 12 }}>Drawdown</p>
              </div>
              <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                {riskData.currentDrawdown}%
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 8 }}>
                Limit: {riskData.maxDrawdownLimit}%
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div 
                  className="h-full"
                  style={{ 
                    background: drawdownPercent > 80 ? '#EF4444' : drawdownPercent > 60 ? '#F59E0B' : '#10B981',
                    width: `${Math.min(drawdownPercent, 100)}%`,
                  }}
                />
              </div>
            </TrCard>

            {/* Daily Loss */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={18} color="#F59E0B" />
                <p style={{ color: c.text2, fontSize: 12 }}>Daily Loss</p>
              </div>
              <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                -${Math.abs(riskData.dailyLoss)}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 8 }}>
                Limit: -${Math.abs(riskData.dailyLossLimit)}
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div 
                  className="h-full"
                  style={{ 
                    background: lossPercent > 80 ? '#EF4444' : lossPercent > 60 ? '#F59E0B' : '#10B981',
                    width: `${Math.min(lossPercent, 100)}%`,
                  }}
                />
              </div>
            </TrCard>

            {/* Exposure */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} color="#3B82F6" />
                <p style={{ color: c.text2, fontSize: 12 }}>Total Exposure</p>
              </div>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                ${riskData.totalExposure.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 8 }}>
                Max: ${riskData.maxExposure.toLocaleString()}
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div 
                  className="h-full"
                  style={{ 
                    background: exposurePercent > 80 ? '#EF4444' : exposurePercent > 60 ? '#F59E0B' : '#10B981',
                    width: `${Math.min(exposurePercent, 100)}%`,
                  }}
                />
              </div>
            </TrCard>

            {/* VaR */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} color="#8B5CF6" />
                <p style={{ color: c.text2, fontSize: 12 }}>VaR (95%)</p>
              </div>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                ${riskData.var95}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 8 }}>
                Max 1-day loss (95%)
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div className="h-full" style={{ background: '#8B5CF6', width: '72%' }} />
              </div>
            </TrCard>
          </div>
        </PageSection>

        {/* Drawdown Chart */}
        <PageSection label="Drawdown Trend (24h)">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={DRAWDOWN_DATA}>
                <defs key="gradient-defs">
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  key="x-axis-dd"
                  dataKey="time" 
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  key="y-axis-dd"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  key="tooltip-dd"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: c.text1, fontWeight: 700 }}
                  formatter={(value: any) => [`${value}%`, 'Drawdown']}
                />
                <Area 
                  key="area-dd"
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fill="url(#drawdownGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Exposure Breakdown */}
        <PageSection label="Exposure by Asset">
          <TrCard className="p-4">
            <div className="space-y-3">
              {EXPOSURE_DATA.map(asset => (
                <div key={asset.asset}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{asset.asset}</p>
                      <span style={{ color: c.text3, fontSize: 11 }}>{asset.percentage}%</span>
                    </div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      ${asset.exposure.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div 
                      className="h-full"
                      style={{ 
                        background: asset.asset === 'BTC' ? '#F7931A' : asset.asset === 'ETH' ? '#627EEA' : '#14F195',
                        width: `${asset.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t" style={{ borderColor: c.borderSolid }}>
              <div className="flex items-center justify-between">
                <p style={{ color: c.text2, fontSize: 12 }}>Diversification Score</p>
                <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>72/100 (Good)</p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* VaR History */}
        <PageSection label="VaR Trend (7 days)">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={VAR_HISTORY}>
                <XAxis 
                  key="x-axis-var"
                  dataKey="date" 
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  key="y-axis-var"
                  stroke={c.text3} 
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  key="tooltip-var"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(value: any) => [`$${value}`, 'Max 1-day loss']}
                />
                <Line 
                  key="line-var"
                  type="monotone" 
                  dataKey="var" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Circuit Breaker Status */}
        <PageSection label="Safety Controls">
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" 
                  style={{ 
                    background: riskData.circuitBreakerStatus === 'active' ? '#10B981' : '#EF4444',
                    boxShadow: riskData.circuitBreakerStatus === 'active' ? '0 0 8px #10B981' : 'none',
                  }} 
                />
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Circuit Breaker</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>Auto-stop at limit breach</p>
                </div>
              </div>
              <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>Active</p>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Drawdown limit', value: '-20%', status: 'safe' },
                { label: 'Daily loss limit', value: '-$500', status: 'safe' },
                { label: 'Max position size', value: '$1,000', status: 'safe' },
                { label: 'Emergency stop', value: 'Enabled', status: 'safe' },
              ].map((control, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text2, fontSize: 11 }}>{control.label}</p>
                  <div className="flex items-center gap-2">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{control.value}</p>
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Emergency Actions */}
        <PageSection label="Emergency Actions">
          <button
            onClick={() => navigate('/trade/bots/emergency-stop')}
            className="w-full p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-3">
              <AlertOctagon size={24} color="#EF4444" />
              <div className="text-left">
                <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>Emergency Stop All Bots</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Stop all {riskData.runningBots} running bots immediately</p>
              </div>
            </div>
            <div style={{ color: c.text3 }}>→</div>
          </button>
        </PageSection>

        {/* Risk Explanation */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            How Risk Score is Calculated
          </p>
          <ul className="space-y-2">
            {[
              'Current drawdown (30%)',
              'Daily loss vs limit (25%)',
              'Portfolio exposure (20%)',
              'VaR trend (15%)',
              'Diversification (10%)',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span style={{ color: c.text3 }}>•</span>
                <p style={{ color: c.text3, fontSize: 11 }}>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}