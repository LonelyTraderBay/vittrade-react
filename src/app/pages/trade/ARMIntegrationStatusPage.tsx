/**
 * ══════════════════════════════════════════════════════════════
 *  ARMIntegrationStatusPage — Phase 4 Sprint 1 Day 5-6
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Real-time ARM (Approved Reporting Mechanism) connection health
 * - Latency monitoring & SLA tracking
 * - Failover status & redundancy checks
 * - Connection diagnostics & troubleshooting
 * 
 * Compliance:
 * - ARM providers must be approved by regulator
 * - Redundancy required for business continuity
 * - Latency monitoring for SLA compliance
 * - Automated failover for high availability
 * 
 * Features:
 * - Live connection status (green/amber/red)
 * - Latency heatmap (real-time)
 * - Uptime percentage (99.9% SLA)
 * - Incident history
 * - Test connection button
 * - Automatic health checks
 * 
 * Guidelines:
 * - PageLayout pattern
 * - Real-time status indicators
 * - Color-coded health metrics
 * - Trust-first transparency
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Activity, Zap, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, TrendingUp, Clock, Server, Database, Wifi,
  ChevronRight, Info, Settings, ExternalLink, Target
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

type ConnectionStatus = 'healthy' | 'degraded' | 'down';

interface ARMConnection {
  id: string;
  provider: string;
  region: string;
  status: ConnectionStatus;
  uptime: number;
  avgLatency: number;
  currentLatency: number;
  lastCheck: string;
  isPrimary: boolean;
  endpoint: string;
  certExpiry: string;
}

interface LatencyDataPoint {
  time: string;
  registr: number;
  unavista: number;
  bloomberg: number;
}

// Mock data
const ARM_CONNECTIONS: ARMConnection[] = [
  {
    id: 'arm-1',
    provider: 'REGIS-TR',
    region: 'EU (Frankfurt)',
    status: 'healthy',
    uptime: 99.97,
    avgLatency: 18,
    currentLatency: 16,
    lastCheck: '2026-03-08T10:45:00Z',
    isPrimary: true,
    endpoint: 'https://api.regis-tr.com/v2',
    certExpiry: '2026-12-31',
  },
  {
    id: 'arm-2',
    provider: 'UnaVista',
    region: 'UK (London)',
    status: 'healthy',
    uptime: 99.95,
    avgLatency: 22,
    currentLatency: 20,
    lastCheck: '2026-03-08T10:45:05Z',
    isPrimary: false,
    endpoint: 'https://api.unavista.com/mifid',
    certExpiry: '2026-11-15',
  },
  {
    id: 'arm-3',
    provider: 'Bloomberg',
    region: 'US (New York)',
    status: 'degraded',
    uptime: 98.50,
    avgLatency: 15,
    currentLatency: 45,
    lastCheck: '2026-03-08T10:44:50Z',
    isPrimary: false,
    endpoint: 'https://bpipe.bloomberg.com/arm',
    certExpiry: '2027-03-20',
  },
];

const LATENCY_HISTORY: LatencyDataPoint[] = [
  { time: '10:30', registr: 18, unavista: 22, bloomberg: 15 },
  { time: '10:35', registr: 16, unavista: 21, bloomberg: 17 },
  { time: '10:40', registr: 19, unavista: 23, bloomberg: 42 },
  { time: '10:45', registr: 16, unavista: 20, bloomberg: 45 },
];

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string; icon: any }> = {
  healthy: { color: '#10B981', label: 'Healthy', icon: CheckCircle },
  degraded: { color: '#F59E0B', label: 'Degraded', icon: AlertTriangle },
  down: { color: '#EF4444', label: 'Down', icon: XCircle },
};

export function ARMIntegrationStatusPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [testing, setTesting] = useState<string | null>(null);

  const handleTestConnection = (armId: string) => {
    setTesting(armId);
    setTimeout(() => setTesting(null), 2000);
  };

  return (
    <PageLayout>
      <Header
        title="ARM Integration"
        subtitle="Connection Health · Monitoring"
        back
      />

      <PageContent gap="relaxed">
        {/* Overall Status */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <CheckCircle size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              All Systems Operational
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              3/3 ARM providers online. Failover ready. Average uptime: 99.5%.
            </p>
          </div>
        </div>

        {/* Connection Cards */}
        <PageSection label="ARM Providers">
          <div className="space-y-3">
            {ARM_CONNECTIONS.map((conn) => {
              const statusConfig = STATUS_CONFIG[conn.status];
              const StatusIcon = statusConfig.icon;
              const isOverLimit = conn.currentLatency > 60;

              return (
                <TrCard key={conn.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Status Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: statusConfig.color + '15' }}>
                      <StatusIcon size={22} color={statusConfig.color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          {conn.provider}
                        </span>
                        {conn.isPrimary && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
                            style={{ background: c.primary + '15', color: c.primary }}>
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>{conn.region}</p>
                    </div>

                    {/* Status Badge */}
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      style={{ background: statusConfig.color + '15', color: statusConfig.color }}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Uptime</p>
                      <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                        {conn.uptime.toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Avg Latency</p>
                      <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                        {conn.avgLatency}ms
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{
                      background: isOverLimit ? '#EF4444' + '15' : c.surface2
                    }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Current</p>
                      <p style={{
                        color: isOverLimit ? '#EF4444' : c.text1,
                        fontSize: 16,
                        fontWeight: 700,
                        marginTop: 2
                      }}>
                        {conn.currentLatency}ms
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-3 p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 10 }}>Endpoint:</span>
                      <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                        {conn.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 10 }}>Last Check:</span>
                      <span style={{ color: c.text2, fontSize: 10 }}>
                        {new Date(conn.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text3, fontSize: 10 }}>Cert Expiry:</span>
                      <span style={{ color: c.text2, fontSize: 10 }}>
                        {conn.certExpiry}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(conn.id)}
                      disabled={testing === conn.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: testing === conn.id ? c.surface2 : c.primary + '15',
                        color: testing === conn.id ? c.text3 : c.primary,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                      {testing === conn.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>Test Connection</span>
                        </>
                      )}
                    </button>

                    <button
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: c.surface2,
                        color: c.text2,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                      <ExternalLink size={14} />
                      <span>Logs</span>
                    </button>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Latency Chart */}
        <PageSection label="Latency Monitoring (Last 15 min)">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={LATENCY_HISTORY}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                <XAxis key="x-axis" dataKey="time" stroke={c.text3} style={{ fontSize: 10 }} />
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
                <Line
                  key="line-registr"
                  type="monotone"
                  dataKey="registr"
                  name="REGIS-TR"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  key="line-unavista"
                  type="monotone"
                  dataKey="unavista"
                  name="UnaVista"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  key="line-bloomberg"
                  type="monotone"
                  dataKey="bloomberg"
                  name="Bloomberg"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                <span style={{ color: c.text3, fontSize: 10 }}>REGIS-TR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                <span style={{ color: c.text3, fontSize: 10 }}>UnaVista</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span style={{ color: c.text3, fontSize: 10 }}>Bloomberg</span>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* SLA Monitoring */}
        <PageSection label="SLA Compliance">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: 12 }}>Uptime Target (99.9%)</span>
                  <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>99.97%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                  <div className="h-full rounded-full" style={{ width: '99.97%', background: '#10B981' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: 12 }}>Latency Target (&lt;100ms)</span>
                  <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>18ms avg</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                  <div className="h-full rounded-full" style={{ width: '18%', background: '#10B981' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: c.text2, fontSize: 12 }}>Failover Readiness</span>
                  <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>100%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: '#10B981' }} />
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>

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
            onClick={() => navigate(`${prefix}/trade/copy-trading/regulatory-reports-dashboard`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <Shield size={16} color="#10B981" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Dashboard</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}