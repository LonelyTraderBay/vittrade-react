/**
 * ══════════════════════════════════════════════════════════════
 *  WalletHealthScorePage — Wallet Advanced Feature 4/4
 * ══════════════════════════════════════════════════════════════
 *  Wallet health score: Security metrics, Diversification analysis,
 *  Risk assessment, Actionable recommendations, Health trends
 *  Pattern B — Page with Tabs (Score/Security/Diversification)
 *  Compliance: §14 Security & Privacy UX
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, Lock,
  Eye, Users, DollarSign, Activity, Zap, Info,
  ArrowRight, Target,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const TABS = ['Tổng quan', 'Bảo mật', 'Đa dạng hóa'] as const;
type Tab = typeof TABS[number];

interface HealthMetric {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

const HEALTH_METRICS: HealthMetric[] = [
  { category: 'Security', score: 75, maxScore: 100, status: 'good' },
  { category: 'Diversification', score: 60, maxScore: 100, status: 'warning' },
  { category: 'Activity', score: 85, maxScore: 100, status: 'excellent' },
  { category: 'Risk Management', score: 70, maxScore: 100, status: 'good' },
  { category: 'Backup & Recovery', score: 45, maxScore: 100, status: 'critical' },
];

const RADAR_DATA = HEALTH_METRICS.map((m) => ({
  metric: m.category,
  score: m.score,
  fullMark: 100,
}));

const DIVERSIFICATION_DATA = [
  { name: 'BTC', value: 42, color: '#F59E0B' },
  { name: 'ETH', value: 28, color: '#3B82F6' },
  { name: 'Stablecoins', value: 18, color: '#10B981' },
  { name: 'Altcoins', value: 12, color: '#8B5CF6' },
];

const HEALTH_HISTORY = [
  { month: 'Jan', score: 65 },
  { month: 'Feb', score: 68 },
  { month: 'Mar', score: 72 },
  { month: 'Apr', score: 70 },
  { month: 'May', score: 75 },
  { month: 'Jun', score: 73 },
];

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'security' | 'diversification' | 'backup';
  actionLabel: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    title: 'Enable 2FA',
    description: 'Two-factor authentication adds an extra security layer to your wallet',
    impact: 'high',
    category: 'security',
    actionLabel: 'Enable Now',
  },
  {
    id: 'r2',
    title: 'Backup Seed Phrase',
    description: 'Create an encrypted backup of your seed phrase in secure storage',
    impact: 'high',
    category: 'backup',
    actionLabel: 'Backup Now',
  },
  {
    id: 'r3',
    title: 'Diversify Portfolio',
    description: '42% concentration in BTC. Consider rebalancing to reduce risk',
    impact: 'medium',
    category: 'diversification',
    actionLabel: 'View Plan',
  },
  {
    id: 'r4',
    title: 'Review Token Approvals',
    description: 'You have 3 unlimited approvals to unverified contracts',
    impact: 'high',
    category: 'security',
    actionLabel: 'Review',
  },
  {
    id: 'r5',
    title: 'Test Recovery Process',
    description: 'Last recovery test was 6 months ago. Test your backup regularly',
    impact: 'medium',
    category: 'backup',
    actionLabel: 'Test Now',
  },
];

export function WalletHealthScorePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tổng quan');

  const overallScore = Math.round(
    HEALTH_METRICS.reduce((sum, m) => sum + m.score, 0) / HEALTH_METRICS.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#3B82F6';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return c.text3;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Wallet Health" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tổng quan' && (
          <>
            {/* Overall Score */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Overall Health Score</p>
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg width="160" height="160" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={c.bg}
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={getScoreColor(overallScore)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallScore / 100) * 440} 440`}
                  />
                </svg>
                <div className="absolute">
                  <p style={{ color: getScoreColor(overallScore), fontSize: 42, fontWeight: 700 }}>
                    {overallScore}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>/ 100</p>
                </div>
              </div>

              <p
                style={{
                  color: getScoreColor(overallScore),
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {overallScore >= 80
                  ? 'Excellent'
                  : overallScore >= 60
                  ? 'Good'
                  : overallScore >= 40
                  ? 'Needs Improvement'
                  : 'Critical'}
              </p>
              <p style={{ color: c.text3, fontSize: 11 }}>
                Your wallet is{' '}
                {overallScore >= 80
                  ? 'well-secured and diversified'
                  : overallScore >= 60
                  ? 'in good shape with room for improvement'
                  : 'at risk - take action now'}
              </p>
            </div>

            {/* Radar Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Health Breakdown
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke={c.border} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: c.text2, fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: c.text3, fontSize: 9 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Metric Cards */}
            <PageSection label="Chi tiết điểm">
              <div className="space-y-2">
                {HEALTH_METRICS.map((metric) => (
                  <div
                    key={metric.category}
                    className="rounded-2xl p-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {metric.category}
                      </p>
                      <div className="flex items-center gap-2">
                        <p style={{ color: getStatusColor(metric.status), fontSize: 14, fontWeight: 700 }}>
                          {metric.score}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                          style={{
                            background: `${getStatusColor(metric.status)}20`,
                            color: getStatusColor(metric.status),
                          }}
                        >
                          {metric.status}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 6, background: c.bg }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${metric.score}%`,
                          background: getStatusColor(metric.status),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* History Trend */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Health Trend (6 months)
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={HEALTH_HISTORY}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Recommendations */}
            <PageSection label="Đề xuất ưu tiên">
              <div className="space-y-2">
                {RECOMMENDATIONS.filter((r) => r.impact === 'high').slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            {rec.title}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                            style={{
                              background: `${getImpactColor(rec.impact)}20`,
                              color: getImpactColor(rec.impact),
                            }}
                          >
                            {rec.impact} impact
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                          {rec.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(rec.actionLabel)}
                      className="w-full rounded-xl py-2 mt-2 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: c.primary,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {rec.actionLabel}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Bảo mật' && (
          <>
            {/* Security Score */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(59,130,246,0.08)',
                  }}
                >
                  <Shield size={24} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Security Score</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Based on 8 security factors</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#3B82F6', fontSize: 24, fontWeight: 700 }}>75</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Good</p>
                </div>
              </div>
            </div>

            {/* Security Checklist */}
            <PageSection label="Security Checklist">
              <div className="space-y-2">
                {[
                  { item: '2FA Enabled', status: true, description: 'Google Authenticator active' },
                  { item: 'Email Verification', status: true, description: 'Verified on signup' },
                  { item: 'Biometric Lock', status: true, description: 'Face ID enabled' },
                  { item: 'Seed Phrase Backup', status: false, description: 'Not backed up securely' },
                  { item: 'Anti-Phishing Code', status: true, description: 'Set: XK89' },
                  { item: 'Withdrawal Whitelist', status: false, description: 'Not configured' },
                  { item: 'Session Timeout', status: true, description: '15 minutes' },
                  { item: 'Device Authorization', status: true, description: '2 devices registered' },
                ].map((check) => (
                  <div
                    key={check.item}
                    className="rounded-xl p-3 flex items-start gap-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: check.status ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        flexShrink: 0,
                      }}
                    >
                      {check.status ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <AlertTriangle size={14} color="#EF4444" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                        {check.item}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{check.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Security Recommendations */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <AlertTriangle size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Action Required
                </p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Backup your seed phrase and enable withdrawal whitelist to improve security score.
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'Đa dạng hóa' && (
          <>
            {/* Diversification Score */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(245,158,11,0.08)',
                  }}
                >
                  <Target size={24} color="#F59E0B" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Diversification</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Portfolio balance analysis</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#F59E0B', fontSize: 24, fontWeight: 700 }}>60</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Moderate</p>
                </div>
              </div>
            </div>

            {/* Asset Distribution */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Asset Distribution
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={DIVERSIFICATION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.value}%`}
                  >
                    {DIVERSIFICATION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {DIVERSIFICATION_DATA.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
                    <p style={{ color: c.text2, fontSize: 11 }}>{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Concentration Risk */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Concentration Risk
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    42% of your portfolio is in BTC. Consider rebalancing to reduce single-asset risk.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p style={{ color: c.text3, fontSize: 11 }}>Recommended BTC allocation</p>
                  <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>25-30%</p>
                </div>
                <div className="flex items-center justify-between">
                  <p style={{ color: c.text3, fontSize: 11 }}>Current BTC allocation</p>
                  <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>42%</p>
                </div>
              </div>
            </div>

            {/* Diversification Tips */}
            <PageSection label="Diversification Tips">
              <div className="space-y-2">
                {[
                  'Maintain 15-25% in stablecoins for liquidity',
                  'Limit single asset to max 30% of portfolio',
                  'Spread across 5-10 quality assets',
                  'Rebalance quarterly to maintain targets',
                ].map((tip, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <Zap size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ color: c.text2, fontSize: 11 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Diversification reduces portfolio volatility. Aim for balance across asset types and risk levels.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}