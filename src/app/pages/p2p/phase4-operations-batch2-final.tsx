/**
 * Phase 4 - Operational Excellence - Batch 2 (FINAL)
 * User Management, Order Admin, Dispute Admin, Feature Flags, Config, Workflow, Export, Logs, Incidents
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, ShoppingCart, MessageSquare, ToggleLeft, Settings,
  GitBranch, Download, FileText, AlertCircle, Search, Filter
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

// Compact implementations - 9 pages

export function P2PUserManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [filter, setFilter] = useState('all');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const stats = { total: 12450, active: 8930, suspended: 120, banned: 45 };

  return (
    <PageLayout>
      <Header title="User Management" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Users size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>{stats.total.toLocaleString()} Users</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>User lifecycle management</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'active', 'suspended', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0" style={{ background: filter === f ? '#3B82F6' : c.surface2, color: filter === f ? '#FFFFFF' : c.text2 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({(stats as any)[f]})
            </button>
          ))}
        </div>
      </div>
      <div className="px-5">
        <CTAButton label="Bulk Operations" onClick={() => toast.success('Opening bulk actions')} />
      </div>
    </PageLayout>
  );
}

export function P2POrderManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const stats = { active: 156, pending: 45, completed: 2340, cancelled: 23 };

  return (
    <PageLayout>
      <Header title="Order Management" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Order Dashboard</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>All orders overview</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key}>
                <p style={{ color: c.text3, fontSize: 9 }}>{key}</p>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{val}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Advanced Filters" onClick={() => toast.success('Opening filters')} />
      </div>
    </PageLayout>
  );
}

export function P2PDisputeManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const queue = { new: 3, investigating: 5, resolved: 120, escalated: 1 };

  return (
    <PageLayout>
      <Header title="Dispute Management" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Dispute Queue</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>SLA tracking & assignment</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(queue).map(([key, val]) => (
              <div key={key}>
                <p style={{ color: c.text3, fontSize: 9 }}>{key}</p>
                <p style={{ color: key === 'escalated' ? '#EF4444' : c.text1, fontSize: φ.sm, fontWeight: 700 }}>{val}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Assign Cases" onClick={() => toast.success('Opening assignment')} />
      </div>
    </PageLayout>
  );
}

export function P2PFeatureFlagsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [features, setFeatures] = useState([
    { id: '1', name: 'New Order Flow', enabled: true, rollout: 100 },
    { id: '2', name: 'Chat V2', enabled: true, rollout: 50 },
    { id: '3', name: 'OTC Desk', enabled: false, rollout: 0 },
  ]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Feature Flags" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <ToggleLeft size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Feature Flags</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>A/B testing & gradual rollout</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {features.map(feat => (
          <TrCard key={feat.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{feat.name}</p>
              <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${feat.enabled ? 'justify-end' : 'justify-start'}`} style={{ background: feat.enabled ? '#10B981' : c.surface2 }}>
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full" style={{ background: c.surface2 }}>
                <div className="h-1 rounded-full" style={{ width: `${feat.rollout}%`, background: '#8B5CF6' }} />
              </div>
              <p style={{ color: c.text3, fontSize: 10 }}>{feat.rollout}%</p>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PConfigurationPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const configs = [
    { key: 'max_order_amount', value: '100,000,000 VND', category: 'Limits' },
    { key: 'dispute_timeout', value: '24 hours', category: 'Workflow' },
    { key: 'platform_fee', value: '0.5%', category: 'Fees' },
  ];

  return (
    <PageLayout>
      <Header title="Configuration" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Settings size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Business Rules</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>System parameters</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {configs.map((cfg, idx) => (
          <TrCard key={idx} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{cfg.key}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{cfg.category}</p>
              </div>
              <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>{cfg.value}</p>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PBackofficeWorkflowPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const tasks = { pending: 12, approved: 56, rejected: 3 };

  return (
    <PageLayout>
      <Header title="Backoffice Workflow" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <GitBranch size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Approval Queue</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Task management</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(tasks).map(([key, val]) => (
            <TrCard key={key} rounded="md" className="p-3">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>{key}</p>
              <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{val}</p>
            </TrCard>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PDataExportPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Data Export" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Download size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Bulk Export</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>CSV, Excel, JSON formats</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {['Users', 'Orders', 'Disputes', 'Transactions'].map(type => (
          <TrCard key={type} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{type} Data</p>
              <button onClick={() => toast.success(`Exporting ${type}`)} className="px-3 py-1.5 rounded-lg" style={{ background: '#8B5CF6', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}>
                Export
              </button>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PSystemLogsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const logs = [
    { level: 'info', message: 'Order #12345 created', time: '14:30:01' },
    { level: 'warning', message: 'High velocity detected', time: '14:28:45' },
    { level: 'error', message: 'Payment gateway timeout', time: '14:25:12' },
  ];

  return (
    <PageLayout>
      <Header title="System Logs" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <FileText size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Live Logs</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time streaming</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {logs.map((log, idx) => (
          <TrCard key={idx} rounded="md" className="p-3 mb-2">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(log.level === 'error' ? '#EF4444' : log.level === 'warning' ? '#F59E0B' : '#3B82F6', 15), color: log.level === 'error' ? '#EF4444' : log.level === 'warning' ? '#F59E0B' : '#3B82F6' }}>
                {log.level}
              </span>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 11 }}>{log.message}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{log.time}</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PIncidentManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const incidents = { active: 0, resolved: 12, avgResolutionTime: '2.5h' };

  return (
    <PageLayout>
      <Header title="Incident Management" subtitle="Vận hành · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>All Systems Operational</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>No active incidents</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Resolved (30d)</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{incidents.resolved}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Avg Resolution</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{incidents.avgResolutionTime}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="View Incident History" onClick={() => toast.success('Opening history')} />
      </div>
    </PageLayout>
  );
}