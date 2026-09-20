import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Shield, CheckCircle2, Clock } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

interface AuditReport {
  id: string;
  type: 'smart-contract' | 'financial' | 'security';
  title: string;
  auditor: string;
  date: string;
  status: 'published' | 'in-progress' | 'scheduled';
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  summary: string;
  pdfUrl?: string;
  scope: string[];
}

const AUDIT_REPORTS: AuditReport[] = [
  {
    id: 'sc-2026-q1',
    type: 'smart-contract',
    title: 'Q1 2026 Smart Contract Security Audit',
    auditor: 'Trail of Bits',
    date: '2026-02-28',
    status: 'published',
    findings: {
      critical: 0,
      high: 0,
      medium: 2,
      low: 5,
      informational: 8,
    },
    summary: 'Comprehensive security audit of staking smart contracts. All critical and high-severity issues resolved. Medium-severity findings relate to gas optimization opportunities.',
    pdfUrl: '/audits/trail-of-bits-q1-2026.pdf',
    scope: ['Staking Pool Contract', 'Reward Distribution', 'Validator Registry', 'Emergency Pause Mechanism'],
  },
  {
    id: 'sc-2025-q4',
    type: 'smart-contract',
    title: 'Q4 2025 Smart Contract Audit',
    auditor: 'Sigma Prime',
    date: '2025-11-20',
    status: 'published',
    findings: {
      critical: 0,
      high: 1,
      medium: 3,
      low: 7,
      informational: 12,
    },
    summary: 'All high-severity issues patched before deployment. Focus areas: reentrancy protection, integer overflow checks, access control.',
    pdfUrl: '/audits/sigma-prime-q4-2025.pdf',
    scope: ['Liquid Staking Module', 'Auto-Compound Logic', 'Insurance Fund Contract'],
  },
  {
    id: 'fin-2025',
    type: 'financial',
    title: '2025 Annual Financial Audit',
    auditor: 'Deloitte',
    date: '2026-01-31',
    status: 'published',
    findings: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    summary: 'Unqualified opinion. Financial statements present fairly the financial position. Internal controls are adequate and effective.',
    pdfUrl: '/audits/deloitte-financial-2025.pdf',
    scope: ['Balance Sheet', 'Income Statement', 'Cash Flow', 'Internal Controls', 'Client Fund Segregation'],
  },
  {
    id: 'sec-2025',
    type: 'security',
    title: 'SOC 2 Type II Audit 2025',
    auditor: 'PwC',
    date: '2025-12-15',
    status: 'published',
    findings: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 3,
      informational: 5,
    },
    summary: 'Successfully passed SOC 2 Type II audit. Controls operating effectively for Security, Availability, and Confidentiality.',
    pdfUrl: '/audits/pwc-soc2-2025.pdf',
    scope: ['Access Controls', 'Encryption', 'Incident Response', 'Business Continuity', 'Change Management'],
  },
  {
    id: 'sc-2026-q2',
    type: 'smart-contract',
    title: 'Q2 2026 Smart Contract Audit',
    auditor: 'ConsenSys Diligence',
    date: '2026-05-15',
    status: 'in-progress',
    findings: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    summary: 'Audit currently in progress. Expected completion: May 20, 2026.',
    scope: ['Cross-Chain Staking', 'Governance Module', 'Slashing Protection'],
  },
];

export function StakingAuditReportsPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'all' | 'smart-contract' | 'financial' | 'security'>('all');

  const filtered = tab === 'all' ? AUDIT_REPORTS : AUDIT_REPORTS.filter(r => r.type === tab);
  const published = AUDIT_REPORTS.filter(r => r.status === 'published');

  return (
    <PageLayout>
      <Header title="Audit Reports" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Transparency & Trust
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                All staking smart contracts are audited quarterly by leading security firms. Financial and security audits are conducted annually.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Published Audits</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {published.length}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Critical Issues</p>
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                0
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>All-time</p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Bug Bounty</p>
              <p style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700 }}>
                $2M
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Max payout</p>
            </div>
          </div>
        </TrCard>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'smart-contract', label: 'Smart Contract' },
            { id: 'financial', label: 'Financial' },
            { id: 'security', label: 'Security' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Audit Reports */}
        <PageSection label="">
          <div className="flex flex-col gap-3">
            {filtered.map(report => {
              const totalFindings = report.findings.critical + report.findings.high + report.findings.medium + report.findings.low;
              return (
                <TrCard
                  key={report.id}
                  hover={report.status === 'published'}
                  className="p-4"
                  style={{
                    opacity: report.status === 'published' ? 1 : 0.7,
                  }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: report.type === 'smart-contract' ? 'rgba(139,92,246,0.12)' :
                                   report.type === 'financial' ? 'rgba(16,185,129,0.12)' :
                                   'rgba(245,158,11,0.12)',
                        border: `1.5px solid ${
                          report.type === 'smart-contract' ? 'rgba(139,92,246,0.3)' :
                          report.type === 'financial' ? 'rgba(16,185,129,0.3)' :
                          'rgba(245,158,11,0.3)'
                        }`,
                      }}>
                      <FileText
                        size={24}
                        color={
                          report.type === 'smart-contract' ? '#8B5CF6' :
                          report.type === 'financial' ? '#10B981' : '#F59E0B'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {report.title}
                        </p>
                        {report.status === 'published' && (
                          <CheckCircle2 size={14} color="#10B981" />
                        )}
                        {report.status === 'in-progress' && (
                          <Clock size={14} color="#F59E0B" />
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                        By {report.auditor} • {new Date(report.date).toLocaleDateString('en-GB')}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: report.type === 'smart-contract' ? 'rgba(139,92,246,0.15)' :
                                     report.type === 'financial' ? 'rgba(16,185,129,0.15)' :
                                     'rgba(245,158,11,0.15)',
                          color: report.type === 'smart-contract' ? '#8B5CF6' :
                                 report.type === 'financial' ? '#10B981' : '#F59E0B',
                        }}>
                        {report.type === 'smart-contract' ? 'Smart Contract' :
                         report.type === 'financial' ? 'Financial' : 'Security'}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                    {report.summary}
                  </p>

                  {report.status === 'published' && totalFindings > 0 && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Findings Summary</p>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: 'Critical', value: report.findings.critical, color: '#EF4444' },
                          { label: 'High', value: report.findings.high, color: '#F59E0B' },
                          { label: 'Medium', value: report.findings.medium, color: '#FBBF24' },
                          { label: 'Low', value: report.findings.low, color: '#3B82F6' },
                          { label: 'Info', value: report.findings.informational, color: '#6B7280' },
                        ].map(item => (
                          <div key={item.label} className="text-center">
                            <p style={{ color: item.color, fontSize: 16, fontWeight: 700 }}>
                              {item.value}
                            </p>
                            <p style={{ color: c.text3, fontSize: 9 }}>{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Scope</p>
                    <div className="flex flex-wrap gap-1">
                      {report.scope.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: c.surface2, color: c.text2 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {report.status === 'published' && report.pdfUrl && (
                    <div className="flex gap-2">
                      <a
                        href={report.pdfUrl}
                        download
                        className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: c.primary, color: '#FFF' }}>
                        <Download size={16} />
                        Download PDF
                      </a>
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: c.surface2, color: c.text1 }}>
                        <ExternalLink size={16} />
                        View
                      </a>
                    </div>
                  )}

                  {report.status === 'in-progress' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <Clock size={14} color="#F59E0B" />
                      <p style={{ color: '#F59E0B', fontSize: 11 }}>
                        Audit in progress • Expected: {new Date(report.date).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Bug Bounty */}
        <PageSection label="Bug Bounty Program">
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1.5px solid rgba(139,92,246,0.3)' }}>
                <Shield size={24} color="#8B5CF6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  Immunefi Bug Bounty
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>
                  Up to $2M for critical vulnerabilities
                </p>
              </div>
            </div>

            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              We partner with Immunefi to reward security researchers who discover vulnerabilities in our smart contracts and infrastructure.
            </p>

            <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Critical</p>
                  <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>$2,000,000</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>High</p>
                  <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700 }}>$100,000</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Medium</p>
                  <p style={{ color: '#FBBF24', fontSize: 16, fontWeight: 700 }}>$10,000</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Low</p>
                  <p style={{ color: '#3B82F6', fontSize: 16, fontWeight: 700 }}>$1,000</p>
                </div>
              </div>
            </div>

            <a
              href="https://immunefi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: c.primary, color: '#FFF' }}>
              View on Immunefi
              <ExternalLink size={16} />
            </a>
          </TrCard>
        </PageSection>

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            All audit reports are published within 14 days of completion. Smart contract audits are conducted quarterly. Financial and security audits are conducted annually. Reports are available for download and verification.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
