/**
 * Phase 3 - Regulatory Compliance - Batch 2
 * CRITICAL: Travel Rule, EDD, SAR, Reporting
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Globe, Shield, FileText, Send, AlertTriangle, CheckCircle,
  MapPin, User, Building, Calendar, Download, Upload, Clock
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
//  P2PTravelRuleCompliancePage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PTravelRuleCompliancePage() {
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
        <Header title="Travel Rule Compliance" subtitle="Tuân thủ · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            <div className="flex items-center gap-3">
              <Globe size={24} color="#FFFFFF" />
              <div>
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>FATF Travel Rule</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Cross-border transaction compliance</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-6">
          <TrCard rounded="md" className="p-4">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>What is Travel Rule?</h3>
            <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6, marginBottom: 12 }}>
              FATF Travel Rule requires VASPs to share originator and beneficiary information for transactions ≥ $1,000 USD.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11 }}>Originator name, address, account number</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11 }}>Beneficiary name, address, account number</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11 }}>IVMS101 message format compliance</p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Your Compliance Status</h3>
          <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#10B981' }}>
                  <CheckCircle size={20} color="#FFFFFF" />
                </div>
                <div>
                  <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>Compliant</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>All required info collected</p>
                </div>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5">
          <CTAButton label="View Transaction History" onClick={() => toast.success('Viewing travel rule transactions')} />
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PEnhancedDueDiligencePage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PEnhancedDueDiligencePage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const eddStatus = {
    required: true,
    status: 'pending',
    reason: 'High transaction volume detected',
    dueDate: '2026-03-15',
    questionsAnswered: 3,
    totalQuestions: 8,
    documentsUploaded: 1,
    documentsRequired: 3,
  };

  return (
    <PageLayout>
      <Header title="Enhanced Due Diligence" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
          <div className="flex items-center gap-3">
            <Shield size={24} color="#F59E0B" />
            <div>
              <h2 style={{ color: '#F59E0B', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>EDD Required</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>Complete by {eddStatus.dueDate}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Why EDD is Required</h3>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{eddStatus.reason}</p>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Questionnaire</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{eddStatus.questionsAnswered}/{eddStatus.totalQuestions}</p>
          </TrCard>
          <TrCard rounded="md" className="p-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Documents</p>
            <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{eddStatus.documentsUploaded}/{eddStatus.documentsRequired}</p>
          </TrCard>
        </div>
      </div>

      <div className="px-5">
        <CTAButton label="Continue EDD Process" onClick={() => toast.success('Opening EDD questionnaire')} />
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PSARFilingPage - CRITICAL
// ═══════════════════════════════════════════════════════════

export function P2PSARFilingPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const sarData = {
    id: 'SAR-2026-001',
    status: 'draft',
    createdAt: '2026-03-05',
    dueDate: '2026-03-19',
    suspiciousActivity: 'Structuring - Multiple transactions just below reporting threshold',
    amountInvolved: 120000000,
    filedTo: 'FinCEN',
  };

  return (
    <PageLayout>
      <Header title="SAR Filing" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#EF4444', 10) }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} color="#EF4444" />
            <div>
              <h2 style={{ color: '#EF4444', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Suspicious Activity Report</h2>
              <p style={{ color: c.text2, fontSize: φ.xs }}>CONFIDENTIAL - Law Enforcement Only</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>SAR {sarData.id}</p>
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: hexToRgba('#F59E0B', 15), color: '#F59E0B' }}>
              {sarData.status}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Activity Type</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{sarData.suspiciousActivity}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Amount Involved</p>
              <p style={{ color: c.text1, fontSize: 11 }}>{fmtVnd(sarData.amountInvolved)}</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Filing Deadline</p>
              <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>{sarData.dueDate}</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#EF4444', 8) }}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.6 }}>
              <strong style={{ color: '#EF4444' }}>Confidentiality Warning:</strong> Disclosing a SAR filing to the subject is PROHIBITED by law. Violations may result in civil and criminal penalties.
            </p>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        <CTAButton label="Complete & Submit SAR" onClick={() => toast.success('Opening SAR form')} />
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════════════════
//  P2PRegulatoryReportingPage - CRITICAL
// ═══════════════════════════════════════════════════════════

const REPORTS = [
  { id: '1', type: 'Monthly Transaction Report', jurisdiction: 'US - FinCEN', status: 'submitted', dueDate: '2026-03-10', submittedAt: '2026-03-08' },
  { id: '2', type: 'Quarterly Compliance Report', jurisdiction: 'EU - ESMA', status: 'pending', dueDate: '2026-03-31', submittedAt: null },
  { id: '3', type: 'Annual AML Report', jurisdiction: 'UK - FCA', status: 'draft', dueDate: '2026-04-15', submittedAt: null },
];

export function P2PRegulatoryReportingPage() {
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'draft': return '#3B82F6';
      default: return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Regulatory Reporting" subtitle="Tuân thủ · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <FileText size={24} color="#FFFFFF" />
            <div>
              <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>Automated Reporting</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>Multi-jurisdiction compliance</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Submitted</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>1</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Pending</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>1</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Draft</p>
              <p style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700 }}>1</p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5">
        {REPORTS.map(report => (
          <TrCard key={report.id} rounded="md" className="p-4 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>{report.type}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{report.jurisdiction}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0" style={{ background: hexToRgba(getStatusColor(report.status), 15), color: getStatusColor(report.status) }}>
                {report.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2" style={{ paddingTop: 8, borderTop: `1px solid ${c.borderSolid}` }}>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Due Date</p>
                <p style={{ color: c.text2, fontSize: 11 }}>{report.dueDate}</p>
              </div>
              {report.submittedAt && (
                <div>
                  <p style={{ color: c.text3, fontSize: 10 }}>Submitted</p>
                  <p style={{ color: c.text2, fontSize: 11 }}>{report.submittedAt}</p>
                </div>
              )}
            </div>
          </TrCard>
        ))}
      </div>
    </PageLayout>
  );
}