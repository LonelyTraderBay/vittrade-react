/**
 * Phase 5 - Payment Infrastructure - Complete (10 pages)
 * Gateway, Settlement, Cross-border, Routing, Refund, Reconciliation, Verification, Rails, Direct Debit, Analytics
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Zap, Globe, Route, RefreshCcw, FileCheck,
  CheckCircle, Layers, DollarSign, BarChart3, Clock
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

// Compact 10 pages

export function P2PPaymentGatewayIntegrationPage() {
  const c = useThemeColors();
  const gateways = [
    { name: 'Stripe', status: 'active', uptime: 99.9, volume: 2000000000 },
    { name: 'PayPal', status: 'active', uptime: 99.5, volume: 1500000000 },
    { name: 'Local Bank', status: 'active', uptime: 98.5, volume: 3000000000 },
  ];

  return (
    <PageLayout>
      <Header title="Payment Gateways" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <CreditCard size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Gateway Management</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{gateways.length} gateways active</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {gateways.map(gw => (
          <TrCard key={gw.name} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{gw.name}</p>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba('#10B981', 15), color: '#10B981' }}>
                {gw.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Uptime</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{gw.uptime}%</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Volume</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{fmtVnd(gw.volume / 1000000)}M</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PInstantSettlementPage() {
  const c = useThemeColors();
  const settlement = { enabled: true, avgTime: 15, successRate: 98.5, todayVolume: 500000000 };

  return (
    <PageLayout>
      <Header title="Instant Settlement" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <Zap size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Real-Time Settlement</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Avg {settlement.avgTime} seconds</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Success Rate</p>
              <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{settlement.successRate}%</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Today Volume</p>
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(settlement.todayVolume / 1000000)}M</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PCrossBorderPaymentsPage() {
  const c = useThemeColors();
  const corridors = [
    { from: 'VN', to: 'US', time: '24h', fee: '1.5%', volume: 1000000000 },
    { from: 'VN', to: 'EU', time: '48h', fee: '2.0%', volume: 500000000 },
  ];

  return (
    <PageLayout>
      <Header title="Cross-Border Payments" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Globe size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>International Transfers</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{corridors.length} corridors active</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {corridors.map((cor, idx) => (
          <TrCard key={idx} rounded="md" className="p-4 mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>{cor.from} → {cor.to}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Time</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{cor.time}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Fee</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{cor.fee}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Volume</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{fmtVnd(cor.volume / 1000000)}M</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PPaymentRoutingPage() {
  const c = useThemeColors();
  const routing = { smart: true, cost: 92, speed: 88, success: 95 };

  return (
    <PageLayout>
      <Header title="Payment Routing" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Route size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Smart Routing</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>AI-powered optimization</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cost', score: routing.cost, color: '#10B981' },
            { label: 'Speed', score: routing.speed, color: '#3B82F6' },
            { label: 'Success', score: routing.success, color: '#8B5CF6' },
          ].map(m => (
            <TrCard key={m.label} rounded="md" className="p-3">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>{m.label}</p>
              <p style={{ color: m.color, fontSize: φ.lg, fontWeight: 700 }}>{m.score}</p>
            </TrCard>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PRefundManagementPage() {
  const c = useThemeColors();
  const refunds = { pending: 3, approved: 45, rejected: 2, totalAmount: 50000000 };

  return (
    <PageLayout>
      <Header title="Refund Management" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <RefreshCcw size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Refund Queue</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{refunds.pending} pending</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries({ pending: refunds.pending, approved: refunds.approved, rejected: refunds.rejected }).map(([k, v]) => (
              <div key={k}>
                <p style={{ color: c.text3, fontSize: 9 }}>{k}</p>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{v}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PPaymentReconciliationPage() {
  const c = useThemeColors();
  const recon = { matched: 1240, pending: 5, discrepancies: 1, rate: 99.5 };

  return (
    <PageLayout>
      <Header title="Reconciliation" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <FileCheck size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Payment Matching</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{recon.rate}% auto-matched</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Matched</p>
              <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>{recon.matched}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Pending</p>
              <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>{recon.pending}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Issues</p>
              <p style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>{recon.discrepancies}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PBankAccountVerificationPage() {
  const c = useThemeColors();
  const verification = { method: 'instant', provider: 'Plaid', status: 'verified', time: '5s' };

  return (
    <PageLayout>
      <Header title="Bank Verification" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Instant Verification</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Via {verification.provider}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Method</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{verification.method}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Time</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{verification.time}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Verify New Account" onClick={() => toast.success('Opening verification')} />
      </div>
    </PageLayout>
  );
}

export function P2PPaymentRailsPage() {
  const c = useThemeColors();
  const rails = [
    { name: 'ACH', speed: 'slow', cost: 'low', availability: '98%' },
    { name: 'Wire', speed: 'fast', cost: 'high', availability: '99%' },
    { name: 'RTP', speed: 'instant', cost: 'medium', availability: '95%' },
  ];

  return (
    <PageLayout>
      <Header title="Payment Rails" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Layers size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Available Rails</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{rails.length} options</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {rails.map(rail => (
          <TrCard key={rail.name} rounded="md" className="p-4 mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>{rail.name}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Speed</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{rail.speed}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Cost</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{rail.cost}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Uptime</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{rail.availability}</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PDirectDebitPage() {
  const c = useThemeColors();
  const debit = { mandates: 12, active: 10, pending: 2, failed: 0 };

  return (
    <PageLayout>
      <Header title="Direct Debit" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Mandate Management</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{debit.active} active mandates</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Total</p>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{debit.mandates}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Active</p>
              <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>{debit.active}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 9 }}>Pending</p>
              <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>{debit.pending}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Create Mandate" onClick={() => toast.success('Creating mandate')} />
      </div>
    </PageLayout>
  );
}

export function P2PPaymentAnalyticsPage() {
  const c = useThemeColors();
  const analytics = { successRate: 95.5, avgTime: 25, volume: 10000000000, failureRate: 4.5 };

  return (
    <PageLayout>
      <Header title="Payment Analytics" subtitle="Thanh toán · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Payment Performance</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Real-time metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Success</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{analytics.successRate}%</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Avg Time</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>{analytics.avgTime}s</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Total Volume (30d)</p>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(analytics.volume / 1000000000)}B</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}