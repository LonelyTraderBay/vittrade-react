/**
 * Phase 3 - Risk Management - Batch 1
 * CRITICAL: Real-time Risk, Velocity, Behavior, Credit, Collateral
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Target, Zap, Activity, TrendingUp, Shield, DollarSign,
  AlertTriangle, CheckCircle, BarChart3, Eye, Lock, Clock
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
//  P2PRealTimeRiskScoringPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PRealTimeRiskScoringPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const riskScore = {
    overall: 72,
    tier: 'medium',
    factors: {
      kyc: 95,
      transaction: 68,
      behavior: 75,
      geolocation: 80,
      device: 85,
      network: 60,
    },
    recommendedActions: [
      'Review recent transaction patterns',
      'Verify device fingerprint',
      'Monitor network connections',
    ],
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Real-Time Risk Scoring" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center" style={{ background: hexToRgba(getTierColor(riskScore.tier), 10) }}>
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: getTierColor(riskScore.tier) }}>
            <p style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 700 }}>{riskScore.overall}</p>
          </div>
          <h2 style={{ color: getTierColor(riskScore.tier), fontSize: φ.lg, fontWeight: 700, marginBottom: 4 }}>
            Risk Score: {riskScore.tier.toUpperCase()}
          </h2>
          <p style={{ color: c.text2, fontSize: φ.xs }}>Live risk assessment</p>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Risk Factors</h3>
        {Object.entries(riskScore.factors).map(([key, value]) => (
          <div key={key} className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text2, fontSize: 11, textTransform: 'capitalize' }}>{key.replace('_', ' ')}</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>{value}</p>
            </div>
            <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
              <div className="h-2 rounded-full" style={{ width: `${value}%`, background: value > 80 ? '#10B981' : value > 60 ? '#F59E0B' : '#EF4444' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Recommended Actions</h3>
          {riskScore.recommendedActions.map((action, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2">
              <CheckCircle size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11 }}>{action}</p>
            </div>
          ))}
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PVelocityChecksPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const VELOCITY_RULES = [
  { id: '1', name: '1-Hour Limit', window: '1h', maxTx: 5, maxVolume: 10000000, current: 3, status: 'ok' },
  { id: '2', name: '24-Hour Limit', window: '24h', maxTx: 20, maxVolume: 50000000, current: 12, status: 'ok' },
  { id: '3', name: '7-Day Limit', window: '7d', maxTx: 100, maxVolume: 200000000, current: 89, status: 'warning' },
  { id: '4', name: '30-Day Limit', window: '30d', maxTx: 300, maxVolume: 500000000, current: 156, status: 'ok' },
];

export function P2PVelocityChecksPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'breach': return '#EF4444';
      default: return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Velocity Checks" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Zap size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Transaction Velocity</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time frequency monitoring</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        {VELOCITY_RULES.map(rule => {
          const txPercentage = (rule.current / rule.maxTx) * 100;
          return (
            <TrCard key={rule.id} rounded="md" className="p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{rule.name}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Window: {rule.window}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(getStatusColor(rule.status), 15), color: getStatusColor(rule.status) }}>
                  {rule.status}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p style={{ color: c.text3, fontSize: 10 }}>Transactions</p>
                  <p style={{ color: c.text2, fontSize: 10 }}>{rule.current} / {rule.maxTx}</p>
                </div>
                <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
                  <div className="h-2 rounded-full" style={{ width: `${txPercentage}%`, background: getStatusColor(rule.status) }} />
                </div>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Volume Limit</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{fmtVnd(rule.maxVolume)}</p>
              </div>
            </TrCard>
          );
        })}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PBehaviorAnalyticsPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PBehaviorAnalyticsPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const behaviorData = {
    typingPattern: { status: 'normal', confidence: 95 },
    mouseMovement: { status: 'normal', confidence: 92 },
    sessionDuration: { avg: 15, current: 18, status: 'normal' },
    loginTime: { usual: '14:00-18:00', current: '15:30', status: 'normal' },
    anomalyScore: 8,
  };

  return (
    <PageLayout>
      <Header title="Behavior Analytics" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <Activity size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Behavioral Biometrics</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>AI-powered anomaly detection</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <Eye size={18} color="#3B82F6" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Typing Pattern</p>
            <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{behaviorData.typingPattern.confidence}%</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <Activity size={18} color="#3B82F6" className="mb-2" />
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Mouse Movement</p>
            <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{behaviorData.mouseMovement.confidence}%</p>
          </TrCard>
        </div>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Session Analysis</h3>
          <div className="flex flex-col gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Avg Session Duration</p>
              <p style={{ color: c.text1, fontSize: φ.sm }}>{behaviorData.sessionDuration.avg} min (Current: {behaviorData.sessionDuration.current} min)</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Usual Login Time</p>
              <p style={{ color: c.text1, fontSize: φ.sm }}>{behaviorData.loginTime.usual} (Current: {behaviorData.loginTime.current})</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <TrCard rounded="md" className="p-4 text-center" style={{ background: hexToRgba('#10B981', 10) }}>
          <p style={{ color: '#10B981', fontSize: 48, fontWeight: 700, marginBottom: 4 }}>{behaviorData.anomalyScore}</p>
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Anomaly Score</p>
          <p style={{ color: c.text3, fontSize: 10 }}>Low risk (0-20 normal)</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PCreditScoringPage - HIGH
// ═══════════════════════════════════════════════════════════

export function P2PCreditScoringPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const creditData = {
    score: 780,
    tier: 'Excellent',
    paymentHistory: 100,
    completionRate: 98,
    avgSettlementTime: 12,
    defaultProbability: 0.5,
    creditLimit: 100000000,
  };

  return (
    <PageLayout>
      <Header title="P2P Credit Score" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <TrendingUp size={32} color="#FFFFFF" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs, marginBottom: 4 }}>Credit Score</p>
          <p style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 700, marginBottom: 4 }}>{creditData.score}</p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.sm, fontWeight: 600 }}>{creditData.tier}</p>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Payment History</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{creditData.paymentHistory}%</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Completion Rate</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{creditData.completionRate}%</p>
          </TrCard>
        </div>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Credit Limit</h3>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700, marginBottom: 4 }}>{fmtVnd(creditData.creditLimit)}</p>
          <p style={{ color: c.text3, fontSize: 10 }}>Based on your credit score</p>
        </TrCard>
      </div>

      <div className="px-5">
        <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <h3 style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Improve Your Score</h3>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
            Complete orders on time, maintain high completion rate, and build transaction history to increase your credit limit.
          </p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PCollateralManagementPage - HIGH
// ═══════════════════════════════════════════════════════════

const COLLATERAL = [
  { asset: 'BTC', amount: 0.5, value: 600000000, marginReq: 20, status: 'active' },
  { asset: 'ETH', amount: 10, value: 400000000, marginReq: 25, status: 'active' },
];

export function P2PCollateralManagementPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const totalValue = COLLATERAL.reduce((sum, col) => sum + col.value, 0);

  return (
    <PageLayout>
      <Header title="Collateral Management" subtitle="Rủi ro · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Total Collateral</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time valuation</p>
            </div>
          </div>
          <p style={{ color: '#8B5CF6', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(totalValue)}</p>
        </TrCard>
      </div>

      <div className="px-5">
        {COLLATERAL.map((col, idx) => (
          <TrCard key={idx} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{col.asset}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{col.amount} {col.asset}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba('#10B981', 15), color: '#10B981' }}>
                {col.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Value</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{fmtVnd(col.value)}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Margin Req</p>
                <p style={{ color: c.text1, fontSize: 11 }}>{col.marginReq}%</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}