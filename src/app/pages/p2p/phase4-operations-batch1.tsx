/**
 * Phase 4 - Operational Excellence - Batch 1
 * Admin Dashboard, CS Tools, Fraud Investigation, Officer Dashboards, System Monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard, Headphones, ShieldAlert, FileCheck, AlertOctagon,
  Activity, Users, Search, Settings, TrendingUp, Clock, CheckCircle,
  XCircle, AlertTriangle, BarChart3, Zap, Eye, Download
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
//  P2PAdminDashboardPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PAdminDashboardPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      if (mountedRef.current) hapticSuccess();
    },
  });

  const stats = {
    activeOrders: 156,
    activeDisputes: 3,
    activeUsers: 12450,
    systemHealth: 99.8,
    revenue24h: 245000000,
    alerts: 2,
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Admin Dashboard" subtitle="Vận hành · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            <div className="flex items-center gap-3 mb-3">
              <LayoutDashboard size={24} color="#FFFFFF" />
              <div>
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>System Overview</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Real-time monitoring</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Health</p>
                <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{stats.systemHealth}%</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Users</p>
                <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{(stats.activeUsers / 1000).toFixed(1)}K</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Alerts</p>
                <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{stats.alerts}</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <TrCard rounded="md" className="p-4">
              <Activity size={18} color="#3B82F6" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Active Orders</p>
              <p style={{ color: '#3B82F6', fontSize: φ.lg, fontWeight: 700 }}>{stats.activeOrders}</p>
            </TrCard>
            <TrCard rounded="md" className="p-4">
              <AlertTriangle size={18} color="#F59E0B" className="mb-2" />
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Disputes</p>
              <p style={{ color: '#F59E0B', fontSize: φ.lg, fontWeight: 700 }}>{stats.activeDisputes}</p>
            </TrCard>
          </div>
          <TrCard rounded="md" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>24h Revenue</p>
                <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(stats.revenue24h / 1000000)}M</p>
              </div>
              <TrendingUp size={32} color="#10B981" />
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: 'Users', color: '#3B82F6' },
              { icon: Activity, label: 'Orders', color: '#10B981' },
              { icon: AlertTriangle, label: 'Disputes', color: '#F59E0B' },
              { icon: ShieldAlert, label: 'Fraud', color: '#EF4444' },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => toast.success(`Opening ${label} management`)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{ background: hexToRgba(color, 10), border: `1px solid ${hexToRgba(color, 20)}` }}
              >
                <Icon size={24} color={color} />
                <p style={{ color, fontSize: 11, fontWeight: 600 }}>{label}</p>
              </button>
            ))}
          </div>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PCustomerSupportToolsPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PCustomerSupportToolsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="CS Tools" subtitle="Vận hành · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Headphones size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Customer Support</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Investigation & quick actions</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <div className="relative">
          <Search size={18} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search user by email, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg"
            style={{ background: c.surface1, border: `1px solid ${c.borderSolid}`, color: c.text1, fontSize: φ.sm }}
          />
        </div>
      </div>

      <div className="px-5">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Quick Actions</h3>
        {[
          { label: 'View User Details', icon: Eye, color: '#3B82F6' },
          { label: 'Freeze Account', icon: AlertOctagon, color: '#EF4444' },
          { label: 'View Orders', icon: Activity, color: '#10B981' },
          { label: 'Contact User', icon: Headphones, color: '#8B5CF6' },
        ].map(({ label, icon: Icon, color }) => (
          <TrCard key={label} rounded="md" className="p-4 mb-3">
            <button
              onClick={() => toast.success(label)}
              className="w-full flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(color, 15) }}>
                <Icon size={18} color={color} />
              </div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{label}</p>
            </button>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PFraudInvestigationPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const FRAUD_CASES = [
  { id: 'FR-001', user: 'user@example.com', type: 'Structuring', severity: 'high', status: 'investigating', createdAt: '2026-03-05 14:00' },
  { id: 'FR-002', user: 'suspect@example.com', type: 'Fake Payment', severity: 'critical', status: 'open', createdAt: '2026-03-05 10:30' },
];

export function P2PFraudInvestigationPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  return (
    <PageLayout>
      <Header title="Fraud Investigation" subtitle="Vận hành · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#EF4444', 10) }}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} color="#EF4444" />
            <div>
              <h2 style={{ color: '#EF4444', fontSize: φ.md, fontWeight: 700 }}>Active Cases</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{FRAUD_CASES.length} investigations</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        {FRAUD_CASES.map(c_case => (
          <TrCard key={c_case.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{c_case.id}</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{c_case.user}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(getSeverityColor(c_case.severity), 15), color: getSeverityColor(c_case.severity) }}>
                {c_case.severity}
              </span>
            </div>
            <div className="flex items-center justify-between" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Type: {c_case.type}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>Status: {c_case.status}</p>
              </div>
              <button
                onClick={() => toast.success('Opening case details')}
                className="px-3 py-1.5 rounded-lg"
                style={{ background: '#EF4444', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}
              >
                Investigate
              </button>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PComplianceOfficerDashboardPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PComplianceOfficerDashboardPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const queue = {
    pendingReviews: 8,
    escalatedCases: 2,
    deadlinesToday: 3,
    completedToday: 12,
  };

  return (
    <PageLayout>
      <Header title="Compliance Officer" subtitle="Vận hành · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <FileCheck size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Compliance Queue</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Daily overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Pending</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{queue.pendingReviews}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Escalated</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{queue.escalatedCases}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <Clock size={18} color="#F59E0B" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Deadlines Today</p>
            <p style={{ color: '#F59E0B', fontSize: φ.lg, fontWeight: 700 }}>{queue.deadlinesToday}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <CheckCircle size={18} color="#10B981" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Completed</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{queue.completedToday}</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PRiskOfficerDashboardPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PRiskOfficerDashboardPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const riskOverview = {
    highRiskUsers: 5,
    velocityBreaches: 2,
    anomalies: 3,
    avgRiskScore: 42,
  };

  return (
    <PageLayout>
      <Header title="Risk Officer" subtitle="Vận hành · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertOctagon size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Risk Overview</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Real-time monitoring</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>High Risk</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{riskOverview.highRiskUsers}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Breaches</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{riskOverview.velocityBreaches}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Anomalies</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{riskOverview.anomalies}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <TrCard rounded="md" className="p-6 text-center">
          <p style={{ color: '#F59E0B', fontSize: 48, fontWeight: 700, marginBottom: 4 }}>{riskOverview.avgRiskScore}</p>
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Average Risk Score</p>
          <p style={{ color: c.text3, fontSize: 10 }}>Across all active users</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PSystemMonitoringPage - HIGH
// ═══════════════════════════════════════════════════════════

export function P2PSystemMonitoringPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      if (mountedRef.current) hapticSuccess();
    },
  });

  const system = {
    uptime: 99.98,
    apiLatency: 45,
    dbHealth: 100,
    queueDepth: 12,
    errorRate: 0.02,
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="System Monitoring" subtitle="Vận hành · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
            <div className="flex items-center gap-3 mb-3">
              <Activity size={24} color="#10B981" />
              <div>
                <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>System Health</h2>
                <p style={{ color: c.text2, fontSize: φ.xs }}>All systems operational</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Uptime</p>
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{system.uptime}%</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Latency</p>
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{system.apiLatency}ms</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Errors</p>
                <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{system.errorRate}%</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5">
          <div className="grid grid-cols-2 gap-3">
            <TrCard rounded="md" className="p-4">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Database</p>
              <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{system.dbHealth}%</p>
            </TrCard>
            <TrCard rounded="md" className="p-4">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Queue Depth</p>
              <p style={{ color: c.text1, fontSize: φ.xl, fontWeight: 700 }}>{system.queueDepth}</p>
            </TrCard>
          </div>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}