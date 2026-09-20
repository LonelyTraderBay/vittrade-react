/**
 * ══════════════════════════════════════════════════════════════
 *  RegulatoryReportsDashboardPage — Phase 4 Sprint 1 Day 3-4
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Centralized dashboard for all regulatory reporting
 * - Submission queue management
 * - SLA monitoring & breach alerts
 * - Multi-jurisdiction reporting (MiFID II, EMIR, SEC, etc.)
 * - Export & audit capabilities
 * 
 * Compliance:
 * - Real-time status tracking
 * - T+1 SLA monitoring
 * - Automated retry logic
 * - Comprehensive audit trail
 * - Regulator-ready exports (CSV, XML, PDF)
 * 
 * Features:
 * - Weekly/monthly/quarterly views
 * - ARM provider breakdown
 * - Error analysis
 * - Latency heatmap
 * - Compliance score calculation
 * - Downloadable reports
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Charts (Recharts for trends)
 * - Enterprise tables
 * - Export buttons
 * - Trust-first transparency
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Download, Filter, Calendar, FileText, Shield, Activity,
  XCircle, RefreshCw, Zap, Database, ChevronRight, Eye,
  ExternalLink, Info, Target, Award
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtNum, fmtPct } from '../../data/formatNumber';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d' | '90d';
type TabType = 'overview' | 'queue' | 'compliance' | 'exports';

interface DailyStats {
  date: string;
  total: number;
  confirmed: number;
  failed: number;
  avgLatency: number;
}

interface ARMProvider {
  name: string;
  reports: number;
  successRate: number;
  avgLatency: number;
  status: 'healthy' | 'degraded' | 'down';
}

// Mock data
const DAILY_STATS: DailyStats[] = [
  { date: '03-02', total: 145, confirmed: 142, failed: 3, avgLatency: 18 },
  { date: '03-03', total: 167, confirmed: 164, failed: 3, avgLatency: 21 },
  { date: '03-04', total: 189, confirmed: 186, failed: 3, avgLatency: 19 },
  { date: '03-05', total: 203, confirmed: 198, failed: 5, avgLatency: 23 },
  { date: '03-06', total: 221, confirmed: 217, failed: 4, avgLatency: 20 },
  { date: '03-07', total: 198, confirmed: 195, failed: 3, avgLatency: 22 },
  { date: '03-08', total: 156, confirmed: 153, failed: 3, avgLatency: 19 },
];

const ARM_PROVIDERS: ARMProvider[] = [
  { name: 'REGIS-TR', reports: 512, successRate: 98.4, avgLatency: 18, status: 'healthy' },
  { name: 'UnaVista', reports: 389, successRate: 97.8, avgLatency: 22, status: 'healthy' },
  { name: 'Bloomberg', reports: 234, successRate: 99.1, avgLatency: 15, status: 'healthy' },
  { name: 'DTCC', reports: 89, successRate: 96.5, avgLatency: 28, status: 'degraded' },
];

const REPORT_DISTRIBUTION = [
  { name: 'MiFID II', value: 678, color: '#3B82F6' },
  { name: 'EMIR', value: 345, color: '#10B981' },
  { name: 'SEC', value: 123, color: '#F59E0B' },
  { name: 'Other', value: 78, color: '#94A3B8' },
];

export function RegulatoryReportsDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Calculate totals
  const totals = useMemo(() => {
    const total = DAILY_STATS.reduce((s, d) => s + d.total, 0);
    const confirmed = DAILY_STATS.reduce((s, d) => s + d.confirmed, 0);
    const failed = DAILY_STATS.reduce((s, d) => s + d.failed, 0);
    const avgLatency = DAILY_STATS.reduce((s, d) => s + d.avgLatency, 0) / DAILY_STATS.length;
    const successRate = (confirmed / total) * 100;
    
    return { total, confirmed, failed, avgLatency, successRate };
  }, []);

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'queue' as TabType, label: 'Queue' },
    { id: 'compliance' as TabType, label: 'Compliance' },
    { id: 'exports' as TabType, label: 'Exports' },
  ];

  const TIME_RANGES: { id: TimeRange; label: string }[] = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
  ];

  return (
    <PageLayout>
      <Header
        title="Regulatory Reports"
        subtitle="Dashboard · MiFID II · EMIR"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Export all reports'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Alert */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <CheckCircle size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              100% SLA Compliance (Last 7 Days)
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              All reports submitted within T+1. Zero regulatory breaches. Avg latency: {Math.round(totals.avgLatency)}s.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} color={c.primary} />
              <span style={{ color: c.text3, fontSize: 10 }}>Total Reports</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{fmtNum(totals.total)}</p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
              +12% vs last week
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} color="#10B981" />
              <span style={{ color: c.text3, fontSize: 10 }}>Success Rate</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{totals.successRate.toFixed(1)}%</p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              {totals.confirmed}/{totals.total} confirmed
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} color="#F59E0B" />
              <span style={{ color: c.text3, fontSize: 10 }}>Avg Latency</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{Math.round(totals.avgLatency)}s</p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
              Under 60s SLA ✓
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={14} color="#EF4444" />
              <span style={{ color: c.text3, fontSize: 10 }}>Failed</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{totals.failed}</p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              {((totals.failed / totals.total) * 100).toFixed(1)}% failure rate
            </p>
          </TrCard>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {TIME_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className="px-4 py-2 rounded-full text-xs transition-all"
              style={{
                background: timeRange === range.id ? c.primary : c.surface2,
                color: timeRange === range.id ? '#fff' : c.text2,
                fontWeight: timeRange === range.id ? 600 : 500,
              }}>
              {range.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'overview' && (
          <>
            {/* Submission Trend Chart */}
            <PageSection label="Submission Trend (Last 7 Days)">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={DAILY_STATS}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                    <XAxis key="x-axis" dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} />
                    <YAxis key="y-axis" stroke={c.text3} style={{ fontSize: 10 }} />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Line key="line-total" type="monotone" dataKey="total" stroke={c.primary} strokeWidth={2} dot={{ r: 3 }} />
                    <Line key="line-confirmed" type="monotone" dataKey="confirmed" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line key="line-failed" type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </TrCard>
            </PageSection>

            {/* Report Distribution */}
            <PageSection label="Report Distribution by Regulation">
              <div className="grid grid-cols-2 gap-3">
                <TrCard className="p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        key="pie-dist"
                        data={REPORT_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        labelLine={false}
                      >
                        {REPORT_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip key="tooltip-pie" />
                    </PieChart>
                  </ResponsiveContainer>
                </TrCard>

                <div className="space-y-2">
                  {REPORT_DISTRIBUTION.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: c.surface2 }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                        <span style={{ color: c.text2, fontSize: 12 }}>{item.name}</span>
                      </div>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {fmtNum(item.value)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t" style={{ borderColor: c.border }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 11 }}>Total</span>
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                        {fmtNum(REPORT_DISTRIBUTION.reduce((s, i) => s + i.value, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* ARM Providers */}
            <PageSection label="ARM Provider Performance">
              <div className="space-y-2">
                {ARM_PROVIDERS.map(provider => (
                  <TrCard key={provider.name} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full"
                          style={{ background: provider.status === 'healthy' ? '#10B981' : '#F59E0B' }} />
                        <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {provider.name}
                        </span>
                      </div>
                      <span style={{ color: c.text3, fontSize: 11 }}>
                        {fmtNum(provider.reports)} reports
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Success Rate</p>
                        <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                          {provider.successRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Avg Latency</p>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                          {provider.avgLatency}s
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 9 }}>Status</p>
                        <p style={{
                          color: provider.status === 'healthy' ? '#10B981' : '#F59E0B',
                          fontSize: 11,
                          fontWeight: 600,
                          marginTop: 2,
                          textTransform: 'capitalize'
                        }}>
                          {provider.status}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'compliance' && (
          <PageSection label="Compliance Metrics">
            <TrCard className="p-4">
              <div className="space-y-4">
                {/* SLA Compliance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 12 }}>SLA Compliance (T+1)</span>
                    <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>100%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{ width: '100%', background: '#10B981' }} />
                  </div>
                </div>

                {/* Field Accuracy */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 12 }}>Field Accuracy (RTS 22)</span>
                    <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>99.8%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{ width: '99.8%', background: '#10B981' }} />
                  </div>
                </div>

                {/* Submission Success */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 12 }}>Submission Success Rate</span>
                    <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                      {totals.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{ width: `${totals.successRate}%`, background: '#10B981' }} />
                  </div>
                </div>

                {/* Latency Performance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: c.text2, fontSize: 12 }}>Latency Performance (Target: &lt;60s)</span>
                    <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                      {Math.round(totals.avgLatency)}s
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(totals.avgLatency / 60) * 100}%`,
                      background: '#10B981'
                    }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: c.border }}>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: c.successBg }}>
                  <Award size={16} color={c.successText} />
                  <p style={{ color: c.successText, fontSize: 11, fontWeight: 600 }}>
                    ✓ Full regulatory compliance maintained for 90 consecutive days
                  </p>
                </div>
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'exports' && (
          <PageSection label="Export Reports">
            <div className="space-y-3">
              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.primary + '15' }}>
                      <FileText size={18} color={c.primary} />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        ISO 20022 XML Export
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                        Standard regulatory format
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>

              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#10B981' + '15' }}>
                      <BarChart3 size={18} color="#10B981" />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Compliance Report (PDF)
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                        Executive summary
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>

              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#F59E0B' + '15' }}>
                      <Database size={18} color="#F59E0B" />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Raw Data Export (CSV)
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                        All fields, all reports
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>
            </div>
          </PageSection>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/transaction-reporting`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <Activity size={16} color={c.primary} />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Live Queue</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>

          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/arm-integration-status`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <Shield size={16} color="#10B981" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>ARM Status</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}