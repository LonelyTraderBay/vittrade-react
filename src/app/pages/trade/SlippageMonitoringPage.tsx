/**
 * ══════════════════════════════════════════════════════════════
 *  SlippageMonitoringPage — Phase 4 Sprint 1 Day 11-12
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Real-time slippage tracking & monitoring
 * - Provider-level slippage benchmarks
 * - Alerts for excessive slippage (>1%)
 * - Historical slippage analysis
 * - Client protection mechanism
 * 
 * Compliance:
 * - Best Execution obligation (MiFID II)
 * - Client disclosure requirement
 * - Transaction Cost Analysis (TCA)
 * - Performance monitoring
 * 
 * Features:
 * - Real-time slippage feed
 * - Provider comparison
 * - Slippage heatmap
 * - Alert threshold configuration
 * - Historical trends
 * - Export capabilities
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Real-time updates simulation
 * - Color-coded severity (green/amber/red)
 * - Charts for visualization
 * - Trust-first transparency
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle, TrendingUp, TrendingDown, Activity, BarChart3,
  Clock, Target, CheckCircle, XCircle, Filter, Download,
  ChevronRight, Shield, Info, Bell, Settings
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtNum, fmtPct } from '../../data/formatNumber';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type TabType = 'realtime' | 'providers' | 'history' | 'alerts';
type SlippageSeverity = 'normal' | 'warning' | 'critical';

interface SlippageEvent {
  id: string;
  timestamp: string;
  provider: string;
  instrument: string;
  side: 'buy' | 'sell';
  expectedPrice: number;
  executedPrice: number;
  slippageBps: number;
  slippagePct: number;
  volume: number;
  value: number;
  severity: SlippageSeverity;
}

interface ProviderSlippageStats {
  provider: string;
  avgSlippage: number;
  maxSlippage: number;
  eventCount: number;
  warningCount: number;
  criticalCount: number;
  totalImpact: number; // USD
}

// Mock data
const SLIPPAGE_EVENTS: SlippageEvent[] = [
  {
    id: 'slip-1',
    timestamp: '2026-03-08T10:45:23Z',
    provider: 'AlphaTrader',
    instrument: 'BTC/USDT',
    side: 'buy',
    expectedPrice: 68500,
    executedPrice: 68550,
    slippageBps: 7.3,
    slippagePct: 0.073,
    volume: 0.5,
    value: 34275,
    severity: 'normal',
  },
  {
    id: 'slip-2',
    timestamp: '2026-03-08T10:42:11Z',
    provider: 'BetaTrader',
    instrument: 'ETH/USDT',
    side: 'sell',
    expectedPrice: 3825,
    executedPrice: 3780,
    slippageBps: 117.6,
    slippagePct: 1.176,
    volume: 10,
    value: 37800,
    severity: 'critical',
  },
  {
    id: 'slip-3',
    timestamp: '2026-03-08T10:40:45Z',
    provider: 'AlphaTrader',
    instrument: 'SOL/USDT',
    side: 'buy',
    expectedPrice: 125.5,
    executedPrice: 125.8,
    slippageBps: 23.9,
    slippagePct: 0.239,
    volume: 100,
    value: 12580,
    severity: 'normal',
  },
  {
    id: 'slip-4',
    timestamp: '2026-03-08T10:38:33Z',
    provider: 'GammaTrader',
    instrument: 'BTC/USDT',
    side: 'sell',
    expectedPrice: 68600,
    executedPrice: 68250,
    slippageBps: 51.0,
    slippagePct: 0.510,
    volume: 0.25,
    value: 17062.5,
    severity: 'warning',
  },
  {
    id: 'slip-5',
    timestamp: '2026-03-08T10:35:12Z',
    provider: 'AlphaTrader',
    instrument: 'BTC/USDT',
    side: 'buy',
    expectedPrice: 68550,
    executedPrice: 68570,
    slippageBps: 2.9,
    slippagePct: 0.029,
    volume: 1.0,
    value: 68570,
    severity: 'normal',
  },
];

const PROVIDER_STATS: ProviderSlippageStats[] = [
  {
    provider: 'AlphaTrader',
    avgSlippage: 11.4,
    maxSlippage: 23.9,
    eventCount: 145,
    warningCount: 8,
    criticalCount: 1,
    totalImpact: 2450,
  },
  {
    provider: 'BetaTrader',
    avgSlippage: 45.2,
    maxSlippage: 117.6,
    eventCount: 89,
    warningCount: 15,
    criticalCount: 5,
    totalImpact: 8920,
  },
  {
    provider: 'GammaTrader',
    avgSlippage: 28.3,
    maxSlippage: 51.0,
    eventCount: 67,
    warningCount: 12,
    criticalCount: 2,
    totalImpact: 4560,
  },
];

const SLIPPAGE_HISTORY = [
  { date: '03-02', avg: 15.2, max: 48.5 },
  { date: '03-03', avg: 18.3, max: 52.1 },
  { date: '03-04', avg: 22.1, max: 68.9 },
  { date: '03-05', avg: 19.7, max: 55.3 },
  { date: '03-06', avg: 16.8, max: 45.2 },
  { date: '03-07', avg: 21.5, max: 62.7 },
  { date: '03-08', avg: 28.3, max: 117.6 },
];

const SEVERITY_CONFIG: Record<SlippageSeverity, { color: string; label: string; threshold: string }> = {
  normal: { color: '#10B981', label: 'Normal', threshold: '<0.5%' },
  warning: { color: '#F59E0B', label: 'Warning', threshold: '0.5-1%' },
  critical: { color: '#EF4444', label: 'Critical', threshold: '>1%' },
};

export function SlippageMonitoringPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('realtime');

  // Calculate totals
  const totals = useMemo(() => {
    const total = SLIPPAGE_EVENTS.length;
    const normal = SLIPPAGE_EVENTS.filter(e => e.severity === 'normal').length;
    const warning = SLIPPAGE_EVENTS.filter(e => e.severity === 'warning').length;
    const critical = SLIPPAGE_EVENTS.filter(e => e.severity === 'critical').length;
    const avgSlippage = SLIPPAGE_EVENTS.reduce((s, e) => s + e.slippageBps, 0) / total;
    const maxSlippage = Math.max(...SLIPPAGE_EVENTS.map(e => e.slippageBps));
    
    return { total, normal, warning, critical, avgSlippage, maxSlippage };
  }, []);

  const TABS = [
    { id: 'realtime' as TabType, label: `Real-time (${totals.total})` },
    { id: 'providers' as TabType, label: 'By Provider' },
    { id: 'history' as TabType, label: 'History' },
    { id: 'alerts' as TabType, label: `Alerts (${totals.critical + totals.warning})` },
  ];

  return (
    <PageLayout>
      <Header
        title="Slippage Monitoring"
        subtitle="Real-time Tracking · Alerts"
        back
        action={{
          icon: Settings,
          onClick: () => console.log('Configure alerts'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Alert Banner */}
        {totals.critical > 0 && (
          <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.errorBg, border: `1px solid ${c.errorBorder}` }}>
            <AlertTriangle size={16} color={c.errorText} className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.errorText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                {totals.critical} Critical Slippage Event{totals.critical > 1 ? 's' : ''} Detected
              </p>
              <p style={{ color: c.errorText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
                Slippage exceeded 1% threshold. Review affected trades and consider provider adjustments.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} color={c.primary} />
              <span style={{ color: c.text3, fontSize: 10 }}>Total Events</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{totals.total}</p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              Last 24h
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} color="#10B981" />
              <span style={{ color: c.text3, fontSize: 10 }}>Avg Slippage</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {totals.avgSlippage.toFixed(1)} bps
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              {(totals.avgSlippage / 100).toFixed(3)}%
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} color="#F59E0B" />
              <span style={{ color: c.text3, fontSize: 10 }}>Max Slippage</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {totals.maxSlippage.toFixed(1)} bps
            </p>
            <p style={{ color: '#EF4444', fontSize: 9, marginTop: 2 }}>
              {(totals.maxSlippage / 100).toFixed(2)}%
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} color="#EF4444" />
              <span style={{ color: c.text3, fontSize: 10 }}>Critical</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{totals.critical}</p>
            <p style={{ color: '#EF4444', fontSize: 9, marginTop: 2 }}>
              {totals.warning} warning
            </p>
          </TrCard>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'realtime' && (
          <PageSection label="Recent Slippage Events">
            <div className="space-y-3">
              {SLIPPAGE_EVENTS.map((event) => {
                const severity = SEVERITY_CONFIG[event.severity];
                const isFavorable = event.slippageBps < 0;

                return (
                  <TrCard key={event.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Severity Indicator */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: severity.color + '15' }}>
                        {event.severity === 'critical' ? (
                          <XCircle size={18} color={severity.color} />
                        ) : event.severity === 'warning' ? (
                          <AlertTriangle size={18} color={severity.color} />
                        ) : (
                          <CheckCircle size={18} color={severity.color} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                                {event.instrument}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                style={{
                                  background: event.side === 'buy' ? '#10B981' + '15' : '#EF4444' + '15',
                                  color: event.side === 'buy' ? '#10B981' : '#EF4444',
                                }}>
                                {event.side.toUpperCase()}
                              </span>
                            </div>
                            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                              {event.provider} • {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                            style={{ background: severity.color + '15', color: severity.color }}>
                            {severity.label}
                          </span>
                        </div>

                        {/* Price Details */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                            <p style={{ color: c.text3, fontSize: 9 }}>Expected</p>
                            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                              ${event.expectedPrice.toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                            <p style={{ color: c.text3, fontSize: 9 }}>Executed</p>
                            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                              ${event.executedPrice.toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-lg p-2" style={{ background: severity.color + '15' }}>
                            <p style={{ color: c.text3, fontSize: 9 }}>Slippage</p>
                            <p style={{ color: severity.color, fontSize: 11, fontWeight: 700, marginTop: 1 }}>
                              {event.slippagePct.toFixed(3)}%
                            </p>
                          </div>
                        </div>

                        {/* Impact */}
                        <div className="flex items-center justify-between p-2 rounded-lg"
                          style={{ background: c.surface2 }}>
                          <span style={{ color: c.text3, fontSize: 10 }}>Cost Impact:</span>
                          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                            ${Math.abs((event.executedPrice - event.expectedPrice) * event.volume).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'providers' && (
          <PageSection label="Provider Performance">
            <div className="space-y-3">
              {PROVIDER_STATS.map((provider) => (
                <TrCard key={provider.provider} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                      {provider.provider}
                    </p>
                    <span style={{
                      color: provider.criticalCount > 0 ? '#EF4444' : provider.avgSlippage > 30 ? '#F59E0B' : '#10B981',
                      fontSize: 16,
                      fontWeight: 700
                    }}>
                      {provider.avgSlippage.toFixed(1)} bps
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Events</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {provider.eventCount}
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Max Slippage</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {provider.maxSlippage.toFixed(1)} bps
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Cost Impact</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        ${fmtNum(provider.totalImpact)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                      <span style={{ color: c.text3, fontSize: 10 }}>{provider.criticalCount} critical</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                      <span style={{ color: c.text3, fontSize: 10 }}>{provider.warningCount} warning</span>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'history' && (
          <PageSection label="Slippage Trends (Last 7 Days)">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={SLIPPAGE_HISTORY}>
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
                  <Line key="line-avg" type="monotone" dataKey="avg" name="Avg Slippage (bps)" stroke="#3B82F6" strokeWidth={2} />
                  <Line key="line-max" type="monotone" dataKey="max" name="Max Slippage (bps)" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-3 p-3 rounded-lg" style={{ background: c.warningBg }}>
                <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600 }}>
                  ⚠️ Slippage trending upward. Consider reviewing provider allocations.
                </p>
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'alerts' && (
          <PageSection label="Alert Configuration">
            <div className="space-y-3">
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      Critical Slippage Alert
                    </p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                      Notify when slippage exceeds 1%
                    </p>
                  </div>
                  <div className="w-12 h-6 rounded-full relative transition-all"
                    style={{ background: c.primary }}>
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>

                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Current Threshold: 100 bps (1.0%)</p>
                </div>
              </TrCard>

              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      Warning Slippage Alert
                    </p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                      Notify when slippage exceeds 0.5%
                    </p>
                  </div>
                  <div className="w-12 h-6 rounded-full relative transition-all"
                    style={{ background: c.primary }}>
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>

                <div className="p-2 rounded-lg" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>Current Threshold: 50 bps (0.5%)</p>
                </div>
              </TrCard>

              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      Daily Summary Email
                    </p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                      Receive daily slippage report at 9:00 AM
                    </p>
                  </div>
                  <div className="w-12 h-6 rounded-full relative transition-all"
                    style={{ background: c.surface2 }}>
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white" />
                  </div>
                </div>
              </TrCard>
            </div>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}