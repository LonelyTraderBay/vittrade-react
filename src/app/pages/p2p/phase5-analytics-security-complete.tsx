/**
 * Phase 5 - Advanced Analytics (8) + Advanced Security (8) = 16 pages
 * Complete implementation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3, TrendingUp, Signal, PieChart, DollarSign, Users,
  AlertCircle, Target, Lock, Shield, Key, Database, AlertOctagon,
  FileCheck, Bug, Award
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

// ═══════════════════════════════════════════════════════════
//  ADVANCED ANALYTICS (8 pages)
// ═══════════════════════════════════════════════════════════

export function P2PAdvancedAnalyticsPage() {
  const c = useThemeColors();
  const metrics = { users: 12450, revenue: 245000000, growth: 15.5, retention: 85 };

  return (
    <PageLayout>
      <Header title="Advanced Analytics" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Analytics Dashboard</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Real-time insights</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Growth</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>+{metrics.growth}%</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Retention</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{metrics.retention}%</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <Users size={18} color="#3B82F6" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Users</p>
            <p style={{ color: '#3B82F6', fontSize: φ.lg, fontWeight: 700 }}>{(metrics.users / 1000).toFixed(1)}K</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <DollarSign size={18} color="#10B981" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Revenue</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{fmtVnd(metrics.revenue / 1000000)}M</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PMarketIntelligencePage() {
  const c = useThemeColors();
  const market = { depth: 'high', liquidity: 92, volatility: 'medium', sentiment: 'bullish' };

  return (
    <PageLayout>
      <Header title="Market Intelligence" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <TrendingUp size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Market Analysis</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Sentiment: {market.sentiment}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Depth', value: market.depth },
            { label: 'Liquidity', value: `${market.liquidity}%` },
            { label: 'Volatility', value: market.volatility },
            { label: 'Sentiment', value: market.sentiment },
          ].map(m => (
            <TrCard key={m.label} rounded="md" className="p-3">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>{m.label}</p>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{m.value}</p>
            </TrCard>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PTradingSignalsPage() {
  const c = useThemeColors();
  const signals = [
    { asset: 'BTC', signal: 'buy', strength: 'strong', confidence: 85 },
    { asset: 'ETH', signal: 'hold', strength: 'medium', confidence: 65 },
  ];

  return (
    <PageLayout>
      <Header title="Trading Signals" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Signal size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>AI Signals</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{signals.length} active</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {signals.map(sig => (
          <TrCard key={sig.asset} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{sig.asset}</p>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(sig.signal === 'buy' ? '#10B981' : '#F59E0B', 15), color: sig.signal === 'buy' ? '#10B981' : '#F59E0B' }}>
                {sig.signal}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Strength</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{sig.strength}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Confidence</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{sig.confidence}%</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PPortfolioOptimizationPage() {
  const c = useThemeColors();
  const portfolio = { risk: 'moderate', sharpeRatio: 1.8, diversification: 85, rebalanceNeeded: false };

  return (
    <PageLayout>
      <Header title="Portfolio Optimization" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <PieChart size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Portfolio Health</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Risk: {portfolio.risk}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Sharpe Ratio</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{portfolio.sharpeRatio}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Diversification</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{portfolio.diversification}%</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PPnLAnalyticsPage() {
  const c = useThemeColors();
  const pnl = { realized: 45000000, unrealized: 12000000, ytd: 57000000, winRate: 68 };

  return (
    <PageLayout>
      <Header title="P&L Analytics" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Year-to-Date P&L</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Win rate: {pnl.winRate}%</p>
            </div>
          </div>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>+{fmtVnd(pnl.ytd / 1000000)}M</p>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Realized</p>
            <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>+{fmtVnd(pnl.realized / 1000000)}M</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Unrealized</p>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>+{fmtVnd(pnl.unrealized / 1000000)}M</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PUserSegmentationPage() {
  const c = useThemeColors();
  const segments = [
    { name: 'Whale', count: 45, value: 5000000000 },
    { name: 'Active Trader', count: 340, value: 2000000000 },
    { name: 'Casual', count: 12065, value: 500000000 },
  ];

  return (
    <PageLayout>
      <Header title="User Segmentation" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Users size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>User Cohorts</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{segments.length} segments</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {segments.map(seg => (
          <TrCard key={seg.name} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{seg.name}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{seg.count} users</p>
              </div>
              <p style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(seg.value / 1000000000)}B</p>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PChurnAnalysisPage() {
  const c = useThemeColors();
  const churn = { rate: 5.2, atRisk: 125, prevented: 89, retention: 94.8 };

  return (
    <PageLayout>
      <Header title="Churn Analysis" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Churn Rate</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{churn.atRisk} users at risk</p>
            </div>
          </div>
          <p style={{ color: '#F59E0B', fontSize: φ.xl, fontWeight: 700 }}>{churn.rate}%</p>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Retention</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{churn.retention}%</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Prevented</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{churn.prevented}</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PRevenueOptimizationPage() {
  const c = useThemeColors();
  const revenue = { current: 245000000, potential: 320000000, uplift: 30.6, optimizations: 5 };

  return (
    <PageLayout>
      <Header title="Revenue Optimization" subtitle="Phân tích · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Target size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Potential Uplift</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>+{revenue.uplift}% growth</p>
            </div>
          </div>
          <p style={{ color: '#FFFFFF', fontSize: φ.xl, fontWeight: 700 }}>+{fmtVnd((revenue.potential - revenue.current) / 1000000)}M</p>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Active Optimizations</p>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{revenue.optimizations}</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  ADVANCED SECURITY (8 pages)
// ═══════════════════════════════════════════════════════════

export function P2PTransactionSigningPage() {
  const c = useThemeColors();
  const signing = { method: 'hardware_wallet', device: 'Ledger Nano X', signed: 245, pending: 0 };

  return (
    <PageLayout>
      <Header title="Transaction Signing" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Key size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Hardware Wallet</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{signing.device}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Signed</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{signing.signed}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Pending</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{signing.pending}</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PMPCWalletPage() {
  const c = useThemeColors();
  const mpc = { shards: 5, threshold: 3, recovery: 'enabled', lastAudit: '2026-02-01' };

  return (
    <PageLayout>
      <Header title="MPC Wallet" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Shield size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Multi-Party Computation</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{mpc.threshold}/{mpc.shards} threshold</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Recovery</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{mpc.recovery}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Last Audit</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{mpc.lastAudit}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PProofOfReservesPage() {
  const c = useThemeColors();
  const reserves = { ratio: 100, lastAudit: '2026-03-01', auditor: 'Deloitte', nextAudit: '2026-04-01' };

  return (
    <PageLayout>
      <Header title="Proof of Reserves" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center" style={{ background: hexToRgba('#10B981', 10) }}>
          <p style={{ color: '#10B981', fontSize: 64, fontWeight: 700, marginBottom: 4 }}>{reserves.ratio}%</p>
          <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 600 }}>Fully Reserved</p>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>Audited by {reserves.auditor}</p>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Last Audit</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{reserves.lastAudit}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Next Audit</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{reserves.nextAudit}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PColdStorageManagementPage() {
  const c = useThemeColors();
  const cold = { allocation: 80, balance: 8000000000, withdrawals: 'manual', multisig: '3/5' };

  return (
    <PageLayout>
      <Header title="Cold Storage" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <Database size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Cold Storage</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{cold.allocation}% allocation</p>
            </div>
          </div>
          <p style={{ color: '#3B82F6', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(cold.balance / 1000000000)}B VND</p>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Withdrawals</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{cold.withdrawals}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Multi-sig</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{cold.multisig}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PEmergencyFreezePage() {
  const c = useThemeColors();
  const freeze = { active: false, triggers: 5, lastActivation: 'Never', protocol: 'Manual + Auto' };

  return (
    <PageLayout>
      <Header title="Emergency Freeze" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba(freeze.active ? '#EF4444' : '#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <AlertOctagon size={24} color={freeze.active ? '#EF4444' : '#10B981'} />
            <div>
              <h2 style={{ color: freeze.active ? '#EF4444' : '#10B981', fontSize: φ.md, fontWeight: 700 }}>
                {freeze.active ? 'Freeze Active' : 'System Normal'}
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{freeze.triggers} auto-triggers configured</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Protocol</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{freeze.protocol}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Last Used</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{freeze.lastActivation}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PSecurityIncidentResponsePage() {
  const c = useThemeColors();
  const incidents = { total: 3, resolved: 3, avgTime: '1.5h', severity: 'low' };

  return (
    <PageLayout>
      <Header title="Security Incidents" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>No Active Incidents</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>All resolved</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Total (30d)</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{incidents.total}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Avg Resolution</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{incidents.avgTime}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PPenetrationTestResultsPage() {
  const c = useThemeColors();
  const pentest = { lastTest: '2026-02-15', findings: 2, critical: 0, high: 0, medium: 2, resolved: 2 };

  return (
    <PageLayout>
      <Header title="Penetration Test" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Bug size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>No Critical Issues</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Last test: {pentest.lastTest}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Findings</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{pentest.findings}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Resolved</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{pentest.resolved}</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PSecurityComplianceDashboardPage() {
  const c = useThemeColors();
  const compliance = [
    { standard: 'SOC 2 Type II', status: 'certified', expiry: '2027-01-15' },
    { standard: 'ISO 27001', status: 'certified', expiry: '2027-03-01' },
    { standard: 'PCI DSS', status: 'in_progress', expiry: null },
  ];

  return (
    <PageLayout>
      <Header title="Security Compliance" subtitle="Bảo mật · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Award size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Compliance Status</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>2 certifications active</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {compliance.map(comp => (
          <TrCard key={comp.standard} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{comp.standard}</p>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(comp.status === 'certified' ? '#10B981' : '#F59E0B', 15), color: comp.status === 'certified' ? '#10B981' : '#F59E0B' }}>
                {comp.status}
              </span>
            </div>
            {comp.expiry && (
              <p style={{ color: c.text3, fontSize: 10 }}>Expires: {comp.expiry}</p>
            )}
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}