/**
 * Phase 3 - Regulatory Compliance - Batch 3 (Final)
 * Jurisdiction, Licensing, Data Retention, Compliance Alerts
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Globe, Award, Database, Bell, MapPin, CheckCircle,
  AlertTriangle, Calendar, Shield, Download, Settings
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
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
//  P2PJurisdictionSettingsPage
// ═══════════════════════════════════════════════════════════

const JURISDICTIONS = [
  { code: 'US', name: 'United States', enabled: true, kycRequired: true, limits: '$10K daily', taxReporting: true },
  { code: 'EU', name: 'European Union', enabled: true, kycRequired: true, limits: '€8K daily', taxReporting: true },
  { code: 'UK', name: 'United Kingdom', enabled: false, kycRequired: true, limits: '£7K daily', taxReporting: true },
  { code: 'SG', name: 'Singapore', enabled: true, kycRequired: true, limits: '$15K daily', taxReporting: false },
  { code: 'VN', name: 'Vietnam', enabled: true, kycRequired: true, limits: '200M VND daily', taxReporting: false },
];

export function P2PJurisdictionSettingsPage() {
  const c = useThemeColors();
  const { hapticSuccess, hapticSelection } = useHaptic();
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

  const enabledCount = JURISDICTIONS.filter(j => j.enabled).length;

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Jurisdiction Settings" subtitle="Tuân thủ · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <div className="flex items-center gap-3">
              <Globe size={24} color="#FFFFFF" />
              <div>
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Multi-Jurisdiction</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>{enabledCount} jurisdictions active</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5">
          {JURISDICTIONS.map(jur => (
            <TrCard key={jur.code} rounded="md" className="p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(jur.enabled ? '#10B981' : c.text3, 15) }}>
                    <MapPin size={18} color={jur.enabled ? '#10B981' : c.text3} />
                  </div>
                  <div>
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{jur.name}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{jur.code}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(jur.enabled ? '#10B981' : c.text3, 15), color: jur.enabled ? '#10B981' : c.text3 }}>
                  {jur.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>KYC Required</p>
                  <p style={{ color: c.text2, fontSize: 11 }}>{jur.kycRequired ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Limits</p>
                  <p style={{ color: c.text2, fontSize: 11 }}>{jur.limits}</p>
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
//  P2PLicensingStatusPage
// ═══════════════════════════════════════════════════════════

const LICENSES = [
  { id: '1', jurisdiction: 'US - FinCEN', type: 'MSB Registration', status: 'active', issueDate: '2024-01-15', expiryDate: '2026-01-15', daysToExpiry: 315 },
  { id: '2', jurisdiction: 'EU - MiFID II', type: 'Investment Firm', status: 'active', issueDate: '2024-03-01', expiryDate: '2027-03-01', daysToExpiry: 730 },
  { id: '3', jurisdiction: 'UK - FCA', type: 'Crypto Asset Firm', status: 'pending', issueDate: null, expiryDate: null, daysToExpiry: null },
];

export function P2PLicensingStatusPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Licensing Status" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Award size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>License Tracker</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Multi-jurisdiction compliance</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Active</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>2</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Pending</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>1</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Expired</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>0</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        {LICENSES.map(license => (
          <TrCard key={license.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>{license.type}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{license.jurisdiction}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba(getStatusColor(license.status), 15), color: getStatusColor(license.status) }}>
                {license.status}
              </span>
            </div>
            {license.status === 'active' && (
              <div className="grid grid-cols-2 gap-2" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Expiry Date</p>
                  <p style={{ color: c.text2, fontSize: 11 }}>{license.expiryDate}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Days to Expiry</p>
                  <p style={{ color: license.daysToExpiry! < 90 ? '#EF4444' : c.text2, fontSize: 11, fontWeight: 600 }}>{license.daysToExpiry} days</p>
                </div>
              </div>
            )}
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PDataRetentionPage
// ═══════════════════════════════════════════════════════════

const RETENTION_POLICIES = [
  { category: 'User Data', retention: '7 years', regulation: 'AML Requirement', autoArchive: true, gdprCompliant: true },
  { category: 'Transaction Records', retention: '5 years', regulation: 'Tax Law', autoArchive: true, gdprCompliant: true },
  { category: 'KYC Documents', retention: '5 years post-termination', regulation: 'KYC Regulation', autoArchive: true, gdprCompliant: true },
  { category: 'Communication Logs', retention: '3 years', regulation: 'MiFID II', autoArchive: true, gdprCompliant: true },
];

export function P2PDataRetentionPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <PageLayout>
      <Header title="Data Retention" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 10) }}>
          <div className="flex items-center gap-3">
            <Database size={24} color="#3B82F6" />
            <div>
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>GDPR Compliant</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Automated data lifecycle management</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Retention Policies</h3>
        {RETENTION_POLICIES.map((policy, idx) => (
          <TrCard key={idx} rounded="md" className="p-4 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>{policy.category}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{policy.regulation}</p>
              </div>
              {policy.gdprCompliant && (
                <CheckCircle size={18} color="#10B981" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Retention</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{policy.retention}</p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Auto-Archive</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{policy.autoArchive ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </TrCard>
        ))}
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
          <h3 style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Right to be Forgotten</h3>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
            Users can request data deletion after retention period. GDPR-compliant workflow ensures complete erasure.
          </p>
          <button onClick={() => toast.success('Opening deletion request form')} className="px-4 py-2 rounded-lg" style={{ background: '#10B981', color: '#FFFFFF', fontSize: φ.sm, fontWeight: 600 }}>
            Request Data Deletion
          </button>
        </TrCard>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PComplianceAlertCenterPage
// ═══════════════════════════════════════════════════════════

const ALERTS = [
  { id: '1', type: 'regulatory', severity: 'high', message: 'US FinCEN reporting deadline in 5 days', dueDate: '2026-03-10', status: 'open' },
  { id: '2', type: 'license', severity: 'medium', message: 'UK FCA license expiring in 90 days', dueDate: '2026-06-05', status: 'acknowledged' },
  { id: '3', type: 'audit', severity: 'low', message: 'SOC 2 audit scheduled for next month', dueDate: '2026-04-01', status: 'closed' },
];

export function P2PComplianceAlertCenterPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const [filter, setFilter] = useState<'all' | 'open' | 'acknowledged' | 'closed'>('all');
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
        <Header title="Compliance Alert Center" subtitle="Tuân thủ · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>
            <div className="flex items-center gap-3">
              <Bell size={24} color="#FFFFFF" />
              <div>
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Real-Time Alerts</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Regulatory deadlines & actions</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'open', 'acknowledged', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                style={{ background: filter === f ? '#EF4444' : c.surface2, color: filter === f ? '#FFFFFF' : c.text2 }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5">
          {filtered.map(alert => (
            <TrCard key={alert.id} rounded="md" className="p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexToRgba(getSeverityColor(alert.severity), 15) }}>
                  <Bell size={16} color={getSeverityColor(alert.severity)} />
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
                  <div className="flex items-center gap-2">
                    <Calendar size={12} color={c.text3} />
                    <p style={{ color: c.text3, fontSize: 10 }}>Due: {alert.dueDate}</p>
                  </div>
                </div>
              </div>
            </TrCard>
          ))}
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}