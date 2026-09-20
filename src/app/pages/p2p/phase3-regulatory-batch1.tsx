/**
 * Phase 3 - Regulatory & Risk - Batch 1
 * CRITICAL enterprise compliance pages
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Shield, AlertTriangle, Globe, FileText, Activity, Bell,
  Eye, Lock, MapPin, Smartphone, TrendingUp, DollarSign,
  Search, Filter, Download, CheckCircle, XCircle, Clock,
  BarChart3, Target, Zap, Users, AlertCircle, ArrowRight
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
//  P2PSanctionsScreeningPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const SANCTIONS_LISTS = [
  { id: 'ofac', name: 'OFAC (US Treasury)', status: 'clear', lastCheck: '2026-03-05 14:00', nextCheck: '2026-03-05 20:00' },
  { id: 'un', name: 'UN Security Council', status: 'clear', lastCheck: '2026-03-05 14:00', nextCheck: '2026-03-05 20:00' },
  { id: 'eu', name: 'EU Sanctions List', status: 'clear', lastCheck: '2026-03-05 14:00', nextCheck: '2026-03-05 20:00' },
  { id: 'uk', name: 'UK HMT', status: 'clear', lastCheck: '2026-03-05 14:00', nextCheck: '2026-03-05 20:00' },
];

const PEP_STATUS = {
  isPEP: false,
  relatedPEP: false,
  lastCheck: '2026-03-05 14:00',
  nextCheck: '2026-03-12 14:00',
};

export function P2PSanctionsScreeningPage() {
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

  const overallStatus = SANCTIONS_LISTS.every(l => l.status === 'clear') && !PEP_STATUS.isPEP ? 'clear' : 'review';

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Sanctions Screening" subtitle="Tuân thủ · P2P" back />

        {/* Status Hero */}
        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: overallStatus === 'clear' ? hexToRgba('#10B981', 10) : hexToRgba('#F59E0B', 10) }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: overallStatus === 'clear' ? '#10B981' : '#F59E0B' }}>
                {overallStatus === 'clear' ? <CheckCircle size={24} color="#FFFFFF" /> : <AlertTriangle size={24} color="#FFFFFF" />}
              </div>
              <div>
                <h2 style={{ color: overallStatus === 'clear' ? '#10B981' : '#F59E0B', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  {overallStatus === 'clear' ? 'All Clear' : 'Under Review'}
                </h2>
                <p style={{ color: c.text2, fontSize: φ.xs }}>
                  {overallStatus === 'clear' ? 'No sanctions matches found' : 'Additional review required'}
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Sanctions Lists */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Screening Results</h3>
          {SANCTIONS_LISTS.map(list => (
            <TrCard key={list.id} rounded="md" className="p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(list.status === 'clear' ? '#10B981' : '#F59E0B', 15) }}>
                    {list.status === 'clear' ? <CheckCircle size={16} color="#10B981" /> : <AlertCircle size={16} color="#F59E0B" />}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{list.name}</p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>Last check: {list.lastCheck}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: hexToRgba(list.status === 'clear' ? '#10B981' : '#F59E0B', 15), color: list.status === 'clear' ? '#10B981' : '#F59E0B' }}>
                  {list.status}
                </span>
              </div>
              <div className="flex items-center gap-2" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
                <Clock size={12} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>Next screening: {list.nextCheck}</p>
              </div>
            </TrCard>
          ))}
        </div>

        {/* PEP Status */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>PEP Screening</h3>
          <TrCard rounded="md" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(PEP_STATUS.isPEP ? '#EF4444' : '#10B981', 15) }}>
                  <Users size={18} color={PEP_STATUS.isPEP ? '#EF4444' : '#10B981'} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Politically Exposed Person</p>
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>Status: {PEP_STATUS.isPEP ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: hexToRgba(PEP_STATUS.isPEP ? '#EF4444' : '#10B981', 15), color: PEP_STATUS.isPEP ? '#EF4444' : '#10B981' }}>
                {PEP_STATUS.isPEP ? 'PEP' : 'NOT PEP'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2" style={{ paddingTop: 12, borderTop: `1px solid ${c.borderSolid}` }}>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Last Check</p>
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{PEP_STATUS.lastCheck}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Next Check</p>
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{PEP_STATUS.nextCheck}</p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Info */}
        <div className="px-5">
          <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                <strong style={{ color: '#3B82F6' }}>Continuous Monitoring:</strong> Your profile is screened against global sanctions lists every 6 hours automatically. Any matches require immediate review.
              </p>
            </div>
          </TrCard>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PTransactionMonitoringPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const ALERTS = [
  { id: '1', type: 'velocity', severity: 'high', message: 'Unusual transaction frequency detected', timestamp: '2026-03-05 14:20', status: 'open' },
  { id: '2', type: 'amount', severity: 'medium', message: 'Large transaction pending review', timestamp: '2026-03-05 13:15', status: 'reviewing' },
  { id: '3', type: 'pattern', severity: 'low', message: 'Geographic pattern change', timestamp: '2026-03-05 10:30', status: 'closed' },
];

export function P2PTransactionMonitoringPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [filter, setFilter] = useState<'all' | 'open' | 'reviewing' | 'closed'>('all');
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

  const filtered = ALERTS.filter(a => filter === 'all' || a.status === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return c.text3;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Transaction Monitoring" subtitle="Tuân thủ · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
            <div className="flex items-center gap-3">
              <Activity size={24} color="#FFFFFF" />
              <div>
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Real-Time Monitoring</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Automated suspicious activity detection</p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Stats */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <TrCard rounded="md" className="p-3">
              <p style={{ color: '#EF4444', fontSize: φ.xl, fontWeight: 700, marginBottom: 2 }}>1</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Open</p>
            </TrCard>
            <TrCard rounded="md" className="p-3">
              <p style={{ color: '#F59E0B', fontSize: φ.xl, fontWeight: 700, marginBottom: 2 }}>1</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Reviewing</p>
            </TrCard>
            <TrCard rounded="md" className="p-3">
              <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700, marginBottom: 2 }}>1</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Closed</p>
            </TrCard>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'open', 'reviewing', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                style={{ background: filter === f ? '#3B82F6' : c.surface2, color: filter === f ? '#FFFFFF' : c.text2 }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="px-5">
          {filtered.map(alert => (
            <TrCard key={alert.id} rounded="md" className="p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexToRgba(getSeverityColor(alert.severity), 15) }}>
                  <AlertTriangle size={16} color={getSeverityColor(alert.severity)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(getSeverityColor(alert.severity), 15), color: getSeverityColor(alert.severity) }}>
                      {alert.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(c.text3, 10), color: c.text2 }}>
                      {alert.status}
                    </span>
                  </div>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>{alert.message}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{alert.timestamp}</p>
                </div>
              </div>
            </TrCard>
          ))}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PAuditTrailPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const AUDIT_LOGS = [
  { id: '1', event: 'User Login', actor: 'user@example.com', ip: '192.168.1.1', timestamp: '2026-03-05 14:20:00', details: 'Successful login from Chrome' },
  { id: '2', event: 'Order Created', actor: 'user@example.com', ip: '192.168.1.1', timestamp: '2026-03-05 14:21:30', details: 'P2P Order #45892 created' },
  { id: '3', event: 'Payment Confirmed', actor: 'user@example.com', ip: '192.168.1.1', timestamp: '2026-03-05 14:35:00', details: 'Order #45892 marked as paid' },
];

export function P2PAuditTrailPage() {
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

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Audit Trail" subtitle="Tuân thủ · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
            <div className="flex items-center gap-3 mb-3">
              <Eye size={24} color="#8B5CF6" />
              <div>
                <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Complete Audit Log</h2>
                <p style={{ color: c.text2, fontSize: φ.xs }}>Forensic search & compliance</p>
              </div>
            </div>
            <button onClick={() => toast.success('Export audit log')} className="w-full py-2 rounded-lg flex items-center justify-center gap-2" style={{ background: '#8B5CF6', color: '#FFFFFF', fontSize: φ.sm, fontWeight: 600 }}>
              <Download size={16} />
              Export for Regulators
            </button>
          </TrCard>
        </div>

        <div className="px-5">
          {AUDIT_LOGS.map(log => (
            <TrCard key={log.id} rounded="md" className="p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexToRgba('#3B82F6', 15) }}>
                  <Activity size={16} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>{log.event}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p style={{ color: c.text3, fontSize: 10 }}>Actor</p>
                      <p style={{ color: c.text2, fontSize: 11 }}>{log.actor}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10 }}>IP Address</p>
                      <p style={{ color: c.text2, fontSize: 11 }}>{log.ip}</p>
                    </div>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 8 }}>{log.timestamp}</p>
                  <p style={{ color: c.text2, fontSize: 11, marginTop: 4 }}>{log.details}</p>
                </div>
              </div>
            </TrCard>
          ))}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// Export all
export {
  P2PSanctionsScreeningPage,
  P2PTransactionMonitoringPage,
  P2PAuditTrailPage,
};