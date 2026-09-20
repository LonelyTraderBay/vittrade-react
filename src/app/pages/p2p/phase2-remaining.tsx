/**
 * Phase 2 Remaining Pages - Compact Implementations
 * These will be split into individual files
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  TrendingUp, TrendingDown, Users, Star, Filter, Search, 
  Bell, BellOff, Play, CheckCircle, BarChart3, Award, DollarSign,
  MessageCircle, Settings, Calendar, Clock, AlertCircle
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
import { fmtAmount, fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
//  P2PDisputeCenterPage
// ═══════════════════════════════════════════════════════════

const DISPUTES = [
  { id: 'D001', orderId: '#45892', status: 'pending', createdAt: '2026-03-05 14:20', lastUpdate: '2026-03-05 16:00' },
  { id: 'D002', orderId: '#45880', status: 'resolved', createdAt: '2026-03-04 10:30', lastUpdate: '2026-03-04 18:00' },
];

export function P2PDisputeCenterPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
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

  const filtered = DISPUTES.filter(d => filter === 'all' || d.status === filter);

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Dispute Center" subtitle="Giao dịch · P2P" back />
        <div className="px-5 py-4">
          <div className="flex gap-2">
            {(['all', 'pending', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex-1"
                style={{ background: filter === f ? '#3B82F6' : c.surface2, color: filter === f ? '#FFFFFF' : c.text2 }}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Resolved'}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 flex flex-col gap-3">
          {filtered.map(d => (
            <TrCard key={d.id} rounded="md" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Dispute {d.id}</p>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: d.status === 'resolved' ? hexToRgba('#10B981', 15) : hexToRgba('#F59E0B', 15), color: d.status === 'resolved' ? '#10B981' : '#F59E0B' }}>
                  {d.status}
                </span>
              </div>
              <p style={{ color: c.text2, fontSize: 11 }}>Order: {d.orderId}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Created: {d.createdAt}</p>
            </TrCard>
          ))}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PArbitrationRulesPage
// ═══════════════════════════════════════════════════════════

const RULES = [
  { id: '1', title: 'Evidence submission', desc: 'Cung cấp đầy đủ bằng chứng trong 24h' },
  { id: '2', title: 'Communication', desc: 'Không sử dụng ngôn ngữ xúc phạm' },
  { id: '3', title: 'Timeline', desc: 'Quyết định trong vòng 48h' },
  { id: '4', title: 'Appeal', desc: 'Kháng cáo trong vòng 48h sau quyết định' },
];

export function P2PArbitrationRulesPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Arbitration Rules" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Quy tắc tranh chấp</h2>
          <p style={{ color: c.text2, fontSize: φ.xs }}>Avg resolution: 24h | Success rate: 94.5%</p>
        </TrCard>
      </div>
      <div className="px-5 flex flex-col gap-3">
        {RULES.map(rule => (
          <TrCard key={rule.id} rounded="md" className="p-4">
            <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>{rule.title}</h4>
            <p style={{ color: c.text2, fontSize: 11 }}>{rule.desc}</p>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  MERCHANT DASHBOARD (5 pages)
// ═══════════════════════════════════════════════════════════

export function P2PMerchantDashboardPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Merchant Dashboard" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <DollarSign size={24} color="#10B981" className="mb-2" />
            <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(850000000 / 1000000)}M</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Revenue (30d)</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <BarChart3 size={24} color="#3B82F6" className="mb-2" />
            <p style={{ color: '#3B82F6', fontSize: φ.xl, fontWeight: 700 }}>156</p>
            <p style={{ color: c.text3, fontSize: 10 }}>Active Orders</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PMerchantOrdersPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Merchant Orders" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Order #45892</p>
          <p style={{ color: c.text2, fontSize: 11 }}>Buyer: user_123 | 24M VND</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PMerchantAdsManagerPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Ads Manager" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>USDT Ad #1</p>
          <p style={{ color: c.text2, fontSize: 11 }}>Price: 24,500 VND | Volume: 10,000 USDT</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PMerchantStatisticsPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Statistics" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
          <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Trading Statistics</p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Volume, demographics, peak hours</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PMerchantReputationPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Reputation" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: hexToRgba('#F59E0B', 15) }}>
              <Star size={32} color="#F59E0B" />
            </div>
            <div>
              <p style={{ color: '#F59E0B', fontSize: φ.xl, fontWeight: 700 }}>95</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Reputation Score</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  ADVANCED FILTERS (3 pages)
// ═══════════════════════════════════════════════════════════

export function P2PAdvancedFilterPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Advanced Filter" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="md" className="p-4">
          <Filter size={24} color="#3B82F6" className="mb-3" />
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Filter Options</p>
          <p style={{ color: c.text2, fontSize: 11 }}>Multi-criteria filters with save presets</p>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Apply Filters" onClick={() => toast.success('Filters applied')} />
      </div>
    </PageLayout>
  );
}

export function P2PMerchantSearchPage() {
  const c = useThemeColors();
  const [query, setQuery] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Search Merchants" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <div className="flex gap-2 p-3 rounded-lg" style={{ background: c.surface1 }}>
          <Search size={20} color={c.text3} />
          <input
            type="text"
            placeholder="Search by name, rating..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none"
            style={{ color: c.text1, fontSize: φ.sm }}
          />
        </div>
      </div>
    </PageLayout>
  );
}

export function P2POrderHistorySearchPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Search Orders" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="md" className="p-4">
          <Search size={24} color="#3B82F6" className="mb-3" />
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Search Order History</p>
          <p style={{ color: c.text2, fontSize: 11 }}>Date range, status, export CSV</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS (2 pages)
// ═══════════════════════════════════════════════════════════

export function P2PNotificationSettingsPage() {
  const c = useThemeColors();
  const [settings, setSettings] = useState({ order: true, price: false, security: true });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Notification Settings" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="md" className="p-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${c.borderSolid}` }}>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{key} notifications</p>
              <button onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))} className="w-12 h-6 rounded-full relative" style={{ background: value ? '#10B981' : c.surface3 }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: value ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
          ))}
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PAlertCenterPage() {
  const c = useThemeColors();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const ALERTS = [
    { id: '1', type: 'order', message: 'Order #45892 completed', priority: 'high', timestamp: '2026-03-05 14:20' },
    { id: '2', type: 'price', message: 'USDT price alert: 24,500 VND', priority: 'medium', timestamp: '2026-03-05 13:00' },
  ];

  return (
    <PageLayout>
      <Header title="Alert Center" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        {ALERTS.map(alert => (
          <TrCard key={alert.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-start gap-3">
              <Bell size={18} color="#3B82F6" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{alert.message}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{alert.timestamp}</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  ONBOARDING (1 page)
// ═══════════════════════════════════════════════════════════

const STEPS = [
  { id: '1', title: 'Welcome to P2P', desc: 'Trade crypto directly with other users', icon: Play },
  { id: '2', title: 'Complete KYC', desc: 'Verify identity to unlock higher limits', icon: CheckCircle },
  { id: '3', title: 'Add Payment Method', desc: 'Setup bank account for transfers', icon: DollarSign },
  { id: '4', title: 'Start Trading', desc: 'Buy or sell crypto safely', icon: TrendingUp },
];

export function P2POnboardingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [step, setStep] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return (
    <PageLayout>
      <Header title="P2P Onboarding" subtitle="Giao dịch · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: hexToRgba('#3B82F6', 15) }}>
            <StepIcon size={40} color="#3B82F6" />
          </div>
          <h2 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700, marginBottom: 8 }}>{currentStep.title}</h2>
          <p style={{ color: c.text2, fontSize: φ.sm, marginBottom: 16 }}>{currentStep.desc}</p>
          <div className="flex gap-2 justify-center mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: i === step ? '#3B82F6' : c.surface3 }} />
            ))}
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {step < STEPS.length - 1 ? (
          <CTAButton label="Next" onClick={() => setStep(step + 1)} />
        ) : (
          <CTAButton label="Start Trading" onClick={() => navigate(`${prefix}/p2p`)} />
        )}
      </div>
    </PageLayout>
  );
}