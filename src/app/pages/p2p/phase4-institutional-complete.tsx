/**
 * Phase 4 - Institutional Features - Complete (12 pages)
 * OTC, Prime, Custody, KYC, Credit, White-label, API, Multi-account, Settlement, Reporting, Treasury, Block Trades
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign, TrendingUp, Shield, Building, CreditCard, Palette,
  Code, Users, RefreshCw, BarChart3, Wallet, Package
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

// Compact implementations - 12 institutional pages

export function P2POTCDeskPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const otc = { minOrder: 100000000, volume24h: 5000000000, avgSize: 500000000, quotes: 12 };

  return (
    <PageLayout>
      <Header title="OTC Desk" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>OTC Trading Desk</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Large order execution</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Min Order</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(otc.minOrder / 1000000)}M</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>24h Volume</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(otc.volume24h / 1000000)}M</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Request OTC Quote" onClick={() => toast.success('Opening quote request')} />
      </div>
    </PageLayout>
  );
}

export function P2PPrimeBrokeragePage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const prime = { marginLending: true, secLending: false, execution: true, riskMgmt: true };

  return (
    <PageLayout>
      <Header title="Prime Brokerage" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <TrendingUp size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Prime Services</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Institutional-grade services</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {Object.entries(prime).map(([key, enabled]) => (
          <TrCard key={key} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</p>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PCustodySolutionsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const custody = { hot: 20, cold: 80, insurance: 10000000000, reserves: 100 };

  return (
    <PageLayout>
      <Header title="Custody Solutions" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Institutional Custody</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Bank-grade security</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Cold Storage</p>
              <p style={{ color: '#3B82F6', fontSize: φ.lg, fontWeight: 700 }}>{custody.cold}%</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Insurance</p>
              <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(custody.insurance / 1000000000)}B</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Proof of Reserves</p>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{custody.reserves}%</p>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>Fully backed</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PInstitutionalKYCPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const kyc = { status: 'pending', docs: 3, required: 5, beneficialOwners: 2 };

  return (
    <PageLayout>
      <Header title="Institutional KYC" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3">
            <Building size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Corporate KYC</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Entity verification in progress</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Documents</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{kyc.docs}/{kyc.required}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Owners</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{kyc.beneficialOwners}</p>
          </TrCard>
        </div>
        <CTAButton label="Complete KYC" onClick={() => toast.success('Opening KYC form')} />
      </div>
    </PageLayout>
  );
}

export function P2PCreditLinesPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const credit = { approved: 500000000, used: 200000000, available: 300000000, rate: 8.5 };

  return (
    <PageLayout>
      <Header title="Credit Lines" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Credit Facility</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Rate: {credit.rate}% APR</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Available</p>
              <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(credit.available / 1000000)}M</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Used</p>
              <p style={{ color: c.text2, fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(credit.used / 1000000)}M</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Draw Credit" onClick={() => toast.success('Opening credit draw')} />
      </div>
    </PageLayout>
  );
}

export function P2PWhiteLabelSolutionsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="White-Label Solutions" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <div className="flex items-center gap-3">
            <Palette size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>White-Label Setup</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Custom branding & domain</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {['Branding', 'Custom Domain', 'API Access', 'Revenue Sharing'].map(feat => (
          <TrCard key={feat} rounded="md" className="p-4 mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{feat}</p>
          </TrCard>
        ))}
        <CTAButton label="Start White-Label Setup" onClick={() => toast.success('Opening setup wizard')} />
      </div>
    </PageLayout>
  );
}

export function P2PAPIManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production API', key: 'pk_live_***************', calls: 12450, limit: 100000 },
    { id: '2', name: 'Test API', key: 'pk_test_***************', calls: 340, limit: 10000 },
  ]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="API Management" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Code size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>API Keys</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Institutional API access</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {keys.map(k => (
          <TrCard key={k.id} rounded="md" className="p-4 mb-3">
            <div className="mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{k.name}</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{k.key}</p>
            </div>
            <div className="flex items-center justify-between" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Calls: {k.calls.toLocaleString()} / {k.limit.toLocaleString()}</p>
              <div className="flex-1 mx-3 h-1 rounded-full" style={{ background: c.surface2 }}>
                <div className="h-1 rounded-full" style={{ width: `${(k.calls / k.limit) * 100}%`, background: '#3B82F6' }} />
              </div>
            </div>
          </TrCard>
        ))}
        <CTAButton label="Generate New API Key" onClick={() => toast.success('Generating API key')} />
      </div>
    </PageLayout>
  );
}

export function P2PMultiAccountManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const accounts = [
    { id: 'main', name: 'Main Account', balance: 500000000, type: 'master' },
    { id: 'sub1', name: 'Trading Desk A', balance: 200000000, type: 'sub' },
    { id: 'sub2', name: 'Trading Desk B', balance: 150000000, type: 'sub' },
  ];

  return (
    <PageLayout>
      <Header title="Multi-Account" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Users size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Account Hierarchy</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{accounts.length} accounts</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {accounts.map(acc => (
          <TrCard key={acc.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{acc.name}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{acc.type}</p>
              </div>
              <p style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(acc.balance / 1000000)}M</p>
            </div>
          </TrCard>
        ))}
        <CTAButton label="Create Sub-Account" onClick={() => toast.success('Creating sub-account')} />
      </div>
    </PageLayout>
  );
}

export function P2PSettlementOptimizationPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const settlement = { netting: true, batching: true, savingsToday: 2500000 };

  return (
    <PageLayout>
      <Header title="Settlement Optimization" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Netting & Batching</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Cost optimization</p>
            </div>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Savings Today</p>
            <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(settlement.savingsToday)}</p>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PInstitutionalReportingPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Institutional Reporting" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <BarChart3 size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Custom Reports</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Scheduled & on-demand</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {['Daily P&L', 'Monthly Summary', 'Tax Report', 'Compliance Report'].map(type => (
          <TrCard key={type} rounded="md" className="p-4 mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{type}</p>
          </TrCard>
        ))}
        <CTAButton label="Schedule Report" onClick={() => toast.success('Opening report builder')} />
      </div>
    </PageLayout>
  );
}

export function P2PTreasuryManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const treasury = { total: 2500000000, reserved: 500000000, available: 2000000000 };

  return (
    <PageLayout>
      <Header title="Treasury Management" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Wallet size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Treasury Dashboard</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Liquidity management</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Total</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(treasury.total / 1000000000)}B</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Available</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(treasury.available / 1000000000)}B</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PBlockTradeExecutionPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Block Trade Execution" subtitle="Tổ chức · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Package size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Block Trades</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Large volume execution</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4 mb-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Minimum Size</p>
          <p style={{ color: '#8B5CF6', fontSize: φ.xl, fontWeight: 700 }}>500M VND</p>
        </TrCard>
        <CTAButton label="Request Block Trade" onClick={() => toast.success('Opening block trade request')} />
      </div>
    </PageLayout>
  );
}