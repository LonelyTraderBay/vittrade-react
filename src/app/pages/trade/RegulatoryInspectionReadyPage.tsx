/**
 * ══════════════════════════════════════════════════════════════
 *  RegulatoryInspectionReadyPage — Phase 4 Sprint 4 Day 11-12
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Regulatory compliance dashboard
 * - FCA/ESMA inspection readiness
 * - Compliance score & gap analysis
 * - Document repository access
 * - Audit trail verification
 * 
 * Compliance:
 * - MiFID II: Full compliance status
 * - PRIIPs: Documentation complete
 * - FCA CASS: Client money segregation
 * - All records accessible for inspection
 * 
 * Features:
 * - Compliance score (97%)
 * - Regulatory framework coverage
 * - Document availability check
 * - Audit trail integrity
 * - Inspector portal access
 */

import React from 'react';
import {
  Shield, CheckCircle, FileText, Download, TrendingUp,
  Clock, Users, BarChart3, Award, ExternalLink, AlertCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

export function RegulatoryInspectionReadyPage() {
  const c = useThemeColors();
  const complianceScore = 97;

  const frameworks = [
    {
      name: 'MiFID II',
      compliance: 98,
      requirements: [
        'Client categorization ✓',
        'Suitability assessment ✓',
        'Best execution ✓',
        'Transaction reporting ✓',
        'Record-keeping (7 years) ✓',
        'Complaints handling ✓',
      ],
    },
    {
      name: 'PRIIPs Regulation',
      compliance: 100,
      requirements: [
        'KID document ✓',
        'Ex-ante cost disclosure ✓',
        'Ex-post reporting ✓',
        'Performance scenarios ✓',
        'Risk indicator (SRI) ✓',
      ],
    },
    {
      name: 'FCA CASS 7',
      compliance: 100,
      requirements: [
        'Segregated client money ✓',
        'Daily reconciliation ✓',
        'Client money letters ✓',
        'Insolvency protection ✓',
      ],
    },
    {
      name: 'FCA DISP',
      compliance: 95,
      requirements: [
        'Complaints procedure ✓',
        '8-week resolution ✓',
        'FOS referral rights ✓',
        'Annual reporting ✓',
      ],
    },
  ];

  const documents = [
    { name: 'Transaction Reports (ARM)', count: 1247, status: 'Ready' },
    { name: 'Best Execution Reports', count: 52, status: 'Ready' },
    { name: 'Client Categorization Records', count: 3421, status: 'Ready' },
    { name: 'Suitability Assessments', count: 2890, status: 'Ready' },
    { name: 'KID Documents', count: 15, status: 'Ready' },
    { name: 'Cost Disclosures (Ex-Ante)', count: 2890, status: 'Ready' },
    { name: 'Cost Reports (Ex-Post)', count: 1834, status: 'Ready' },
    { name: 'CASS Reconciliations', count: 365, status: 'Ready' },
    { name: 'Complaints Records', count: 127, status: 'Ready' },
    { name: 'Audit Trail Logs', count: 45892, status: 'Ready' },
  ];

  return (
    <PageLayout>
      <Header
        title="Regulatory Compliance"
        subtitle="Inspection Ready Dashboard"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Download compliance report'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Score */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#10B981' + '15' }}>
              <Award size={28} color="#10B981" />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 11 }}>Overall Compliance Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p style={{ color: '#10B981', fontSize: 36, fontWeight: 700 }}>
                  {complianceScore}%
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>/ 100%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden mb-3" style={{ background: c.surface2 }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ background: '#10B981', width: `${complianceScore}%` }}
            />
          </div>

          <div className="rounded-lg p-3" style={{ background: c.successBg }}>
            <div className="flex gap-2">
              <CheckCircle size={14} color={c.successText} className="shrink-0 mt-0.5" />
              <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4 }}>
                <strong>Inspection Ready:</strong> All regulatory requirements met. Full documentation available for FCA/ESMA inspection.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <TrCard className="p-2.5">
            <FileText size={14} color={c.primary} className="mb-2" />
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>10</p>
            <p style={{ color: c.text3, fontSize: 8 }}>Documents</p>
          </TrCard>

          <TrCard className="p-2.5">
            <Users size={14} color="#10B981" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>3.4k</p>
            <p style={{ color: c.text3, fontSize: 8 }}>Clients</p>
          </TrCard>

          <TrCard className="p-2.5">
            <BarChart3 size={14} color="#F59E0B" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>45k</p>
            <p style={{ color: c.text3, fontSize: 8 }}>Audit Logs</p>
          </TrCard>

          <TrCard className="p-2.5">
            <Clock size={14} color="#3B82F6" className="mb-2" />
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>7yr</p>
            <p style={{ color: c.text3, fontSize: 8 }}>Retention</p>
          </TrCard>
        </div>

        {/* Framework Compliance */}
        <PageSection label="Regulatory Framework Coverage">
          <div className="space-y-3">
            {frameworks.map((framework) => (
              <TrCard key={framework.name} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                    {framework.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{
                      color: framework.compliance >= 95 ? '#10B981' : '#F59E0B',
                      fontSize: 16,
                      fontWeight: 700
                    }}>
                      {framework.compliance}%
                    </span>
                    {framework.compliance >= 95 && (
                      <CheckCircle size={16} color="#10B981" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  {framework.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle size={10} color="#10B981" />
                      <span style={{ color: c.text2, fontSize: 10 }}>{req}</span>
                    </div>
                  ))}
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Document Repository */}
        <PageSection label="Document Repository">
          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <TrCard key={idx} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: '#10B981' + '15' }}>
                      <FileText size={14} color="#10B981" />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                        {doc.name}
                      </p>
                      <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                        {doc.count.toLocaleString()} records
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-semibold"
                    style={{ background: '#10B981' + '15', color: '#10B981' }}>
                    {doc.status}
                  </span>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Inspector Access */}
        <PageSection label="Regulatory Inspector Access">
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: c.primary + '15' }}>
                <Shield size={22} color={c.primary} />
              </div>

              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Secure Inspector Portal
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                  FCA/ESMA inspectors can access all required documents through our secure portal with audit logging.
                </p>
              </div>
            </div>

            <button
              className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.surface2,
                color: c.text1,
                height: 40,
                fontWeight: 600,
                fontSize: 12,
                border: `1px solid ${c.border}`,
              }}>
              <ExternalLink size={14} />
              <span>Inspector Portal Access</span>
            </button>
          </TrCard>
        </PageSection>

        {/* Final CTA */}
        <button
          className="w-full rounded-[14px] h-[48px] flex items-center justify-center gap-2 transition-all"
          style={{ background: '#10B981', color: '#fff', fontWeight: 600, fontSize: 14 }}>
          <Download size={18} />
          <span>Download Full Compliance Report (PDF)</span>
        </button>
      </PageContent>
    </PageLayout>
  );
}
