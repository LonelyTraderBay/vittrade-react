/**
 * Phase 3 - Risk Management - Batch 2 (FINAL)
 * Margin, Liquidation, Geo, Device, Auth, Fraud, Chargeback, ATO, Crypto, Exposure
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, TrendingDown, MapPin, Smartphone, Lock,
  Shield, CreditCard, UserX, Bitcoin, BarChart3, CheckCircle
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

// Compact implementations - 10 pages in one file

export function P2PMarginCallsPage() {
  const c = useThemeColors();
  const marginData = { equity: 800000000, required: 1000000000, call: 200000000, status: 'margin_call' };
  
  return (
    <PageLayout>
      <Header title="Margin Calls" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#EF4444', 10) }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} color="#EF4444" />
            <div>
              <h2 style={{ color: '#EF4444', fontSize: φ.md, fontWeight: 700 }}>Margin Call Active</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Add collateral to avoid liquidation</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Amount Required</p>
          <p style={{ color: '#EF4444', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(marginData.call)}</p>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Add Collateral" onClick={() => toast.success('Opening collateral deposit')} />
      </div>
    </PageLayout>
  );
}

export function P2PLiquidationEnginePage() {
  const c = useThemeColors();
  const liquidation = { trigger: 800000000, current: 950000000, buffer: 15.8, status: 'safe' };
  
  return (
    <PageLayout>
      <Header title="Liquidation Engine" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-6 text-center" style={{ background: hexToRgba('#10B981', 10) }}>
          <p style={{ color: '#10B981', fontSize: 48, fontWeight: 700, marginBottom: 4 }}>{liquidation.buffer}%</p>
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Safety Buffer</p>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Liquidation Price</p>
              <p style={{ color: c.text1, fontSize: φ.sm }}>{fmtVnd(liquidation.trigger)}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Current Value</p>
              <p style={{ color: c.text1, fontSize: φ.sm }}>{fmtVnd(liquidation.current)}</p>
            </div>
          </div>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PGeolocationRiskPage() {
  const c = useThemeColors();
  const geo = { country: 'Vietnam', ip: '14.xxx.xxx.xxx', vpn: false, riskScore: 15, status: 'low' };
  
  return (
    <PageLayout>
      <Header title="Geolocation Risk" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <MapPin size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>{geo.country}</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>IP: {geo.ip} • {geo.vpn ? 'VPN Detected' : 'Direct Connection'}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Risk Score</p>
          <p style={{ color: '#10B981', fontSize: φ.xl, fontWeight: 700 }}>{geo.riskScore}/100</p>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>Low Risk</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PDeviceFingerprintingAdvancedPage() {
  const c = useThemeColors();
  const device = { id: 'fp_abc123', type: 'Mobile', os: 'iOS 17.2', browser: 'Safari 17', trusted: true };
  
  return (
    <PageLayout>
      <Header title="Device Fingerprinting" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Smartphone size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>{device.type}</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{device.os} • {device.browser}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-center justify-between">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Trusted Device</p>
            <CheckCircle size={20} color="#10B981" />
          </div>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 8 }}>ID: {device.id}</p>
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PRiskBasedAuthPage() {
  const c = useThemeColors();
  const auth = { currentLevel: 'basic', required: 'enhanced', trigger: 'Large transaction detected' };
  
  return (
    <PageLayout>
      <Header title="Risk-Based Authentication" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3">
            <Lock size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Enhanced Auth Required</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{auth.trigger}</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <CTAButton label="Complete 2FA" onClick={() => toast.success('Opening 2FA verification')} />
      </div>
    </PageLayout>
  );
}

export function P2PFraudPatternLibraryPage() {
  const c = useThemeColors();
  const patterns = [
    { id: '1', name: 'Structuring', matches: 0, severity: 'high' },
    { id: '2', name: 'Account Takeover', matches: 0, severity: 'critical' },
    { id: '3', name: 'Velocity Abuse', matches: 1, severity: 'medium' },
  ];
  
  return (
    <PageLayout>
      <Header title="Fraud Pattern Library" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <Shield size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>ML Fraud Detection</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Real-time pattern matching</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {patterns.map(p => (
          <TrCard key={p.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{p.name}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>Matches: {p.matches}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(p.severity === 'critical' ? '#EF4444' : '#F59E0B', 15), color: p.severity === 'critical' ? '#EF4444' : '#F59E0B' }}>
                {p.severity}
              </span>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PChargebackManagementPage() {
  const c = useThemeColors();
  const chargeback = { total: 3, won: 2, lost: 1, ratio: 0.5 };
  
  return (
    <PageLayout>
      <Header title="Chargeback Management" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <CreditCard size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700 }}>Chargeback Ratio</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>{chargeback.ratio}% (Industry standard < 1%)</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <div className="grid grid-cols-3 gap-3">
          <TrCard rounded="md" className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Total</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{chargeback.total}</p>
          </TrCard>
          <TrCard rounded="md" className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Won</p>
            <p style={{ color: '#10B981', fontSize: φ.lg, fontWeight: 700 }}>{chargeback.won}</p>
          </TrCard>
          <TrCard rounded="md" className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Lost</p>
            <p style={{ color: '#EF4444', fontSize: φ.lg, fontWeight: 700 }}>{chargeback.lost}</p>
          </TrCard>
        </div>
      </div>
    </PageLayout>
  );
}

export function P2PAccountTakeoverPreventionPage() {
  const c = useThemeColors();
  const ato = { loginAnomaly: false, passwordChange: false, emailChange: false, status: 'secure' };
  
  return (
    <PageLayout>
      <Header title="Account Takeover Prevention" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <div className="flex items-center gap-3">
            <UserX size={24} color="#10B981" />
            <div>
              <h2 style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>Account Secure</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>No suspicious activity detected</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        <TrCard rounded="md" className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Monitoring</h3>
          {(['Login anomaly', 'Password change', 'Email change'] as const).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2" style={{ borderBottom: idx < 2 ? `1px solid ${c.borderSolid}` : 'none' }}>
              <p style={{ color: c.text2, fontSize: 11 }}>{item}</p>
              <CheckCircle size={16} color="#10B981" />
            </div>
          ))}
        </TrCard>
      </div>
    </PageLayout>
  );
}

export function P2PCryptocurrencyRiskPage() {
  const c = useThemeColors();
  const cryptos = [
    { asset: 'BTC', risk: 15, liquidity: 'high', volatility: 'medium' },
    { asset: 'ETH', risk: 20, liquidity: 'high', volatility: 'medium' },
    { asset: 'USDT', risk: 5, liquidity: 'high', volatility: 'low' },
  ];
  
  return (
    <PageLayout>
      <Header title="Cryptocurrency Risk" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3">
            <Bitcoin size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700 }}>Asset Risk Analysis</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Coin-specific risk scores</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5">
        {cryptos.map(crypto => (
          <TrCard key={crypto.asset} rounded="md" className="p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{crypto.asset}</p>
              <p style={{ color: crypto.risk < 10 ? '#10B981' : crypto.risk < 30 ? '#F59E0B' : '#EF4444', fontSize: φ.sm, fontWeight: 700 }}>{crypto.risk}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Liquidity</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{crypto.liquidity}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Volatility</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{crypto.volatility}</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

export function P2PExposureLimitsPage() {
  const c = useThemeColors();
  const exposure = {
    counterparty: { used: 30000000, limit: 50000000 },
    asset: { btc: 60, eth: 30, usdt: 10 },
    geographic: { vn: 70, us: 20, other: 10 },
  };
  
  return (
    <PageLayout>
      <Header title="Exposure Limits" subtitle="Rủi ro · P2P" back />
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#8B5CF6', 10) }}>
          <div className="flex items-center gap-3">
            <BarChart3 size={24} color="#8B5CF6" />
            <div>
              <h2 style={{ color: '#8B5CF6', fontSize: φ.md, fontWeight: 700 }}>Portfolio Exposure</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Risk diversification</p>
            </div>
          </div>
        </TrCard>
      </div>
      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Asset Concentration</h3>
        {Object.entries(exposure.asset).map(([asset, pct]) => (
          <div key={asset} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: c.text2, fontSize: 11, textTransform: 'uppercase' }}>{asset}</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 700 }}>{pct}%</p>
            </div>
            <div className="h-2 rounded-full" style={{ background: c.surface2 }}>
              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: '#8B5CF6' }} />
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}