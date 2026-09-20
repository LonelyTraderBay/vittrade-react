import React from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const CONTINGENCY_SCENARIOS = [
  {
    scenario: 'Smart Contract Exploit',
    likelihood: 'Very Low',
    impact: 'Critical',
    response: [
      'Immediate pause of all deposits',
      'Emergency withdrawal enabled',
      'Insurance fund activation',
      'Full audit within 24 hours',
      'User communication within 1 hour',
    ],
    preventative: ['Quarterly security audits', 'Bug bounty program', 'Multi-sig wallet controls', 'Insurance fund 165% coverage'],
  },
  {
    scenario: 'Validator Slashing Event',
    likelihood: 'Low',
    impact: 'Medium',
    response: [
      'Automatic stake rebalancing',
      'Insurance payout within 7 days',
      'Affected users notified immediately',
      'Validator removed from rotation',
    ],
    preventative: ['24/7 validator monitoring', 'Multi-validator distribution', 'Performance-based allocation', 'Automatic failover'],
  },
  {
    scenario: 'Network Failure',
    likelihood: 'Very Low',
    impact: 'High',
    response: [
      'Failover to backup infrastructure',
      'Read-only mode activated',
      'Status page updated real-time',
      'Service restoration within 4 hours',
    ],
    preventative: ['Multi-region deployment', 'Redundant infrastructure', 'Daily backups', 'Disaster recovery drills'],
  },
  {
    scenario: 'Regulatory Action',
    likelihood: 'Low',
    impact: 'High',
    response: [
      'Legal team engagement',
      'Compliance review',
      'User withdrawal window (30 days)',
      'Geographic restriction if required',
    ],
    preventative: ['Proactive compliance monitoring', 'Multiple jurisdictional licenses', 'Legal reserve fund'],
  },
];

const RECOVERY_METRICS = {
  rto: '4 hours', // Recovery Time Objective
  rpo: '15 minutes', // Recovery Point Objective
  mttr: '2 hours', // Mean Time To Recovery
  insuranceCoverage: '165%',
  lastTest: '2026-02-15',
  nextTest: '2026-05-15',
};

export function StakingContingencyPlanPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Contingency Plan" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Disaster Recovery & Business Continuity
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Our contingency plan ensures continuity of service and asset protection in all emergency scenarios. Tested quarterly.
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Metrics */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Recovery Metrics
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Recovery Time (RTO)</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                {RECOVERY_METRICS.rto}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Data Loss Limit (RPO)</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                {RECOVERY_METRICS.rpo}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Mean Time To Recovery</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                {RECOVERY_METRICS.mttr}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Insurance Coverage</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                {RECOVERY_METRICS.insuranceCoverage}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Scenarios */}
        <PageSection label="Contingency Scenarios">
          <div className="flex flex-col gap-3">
            {CONTINGENCY_SCENARIOS.map((item, idx) => (
              <TrCard key={idx} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      {item.scenario}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs"
                        style={{ background: c.surface2, color: c.text3 }}>
                        {item.likelihood}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: item.impact === 'Critical' ? 'rgba(239,68,68,0.15)' :
                                     item.impact === 'High' ? 'rgba(245,158,11,0.15)' :
                                     'rgba(59,130,246,0.15)',
                          color: item.impact === 'Critical' ? '#EF4444' :
                                 item.impact === 'High' ? '#F59E0B' : '#3B82F6',
                        }}>
                        {item.impact} Impact
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text2, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Immediate Response
                  </p>
                  <div className="space-y-2">
                    {item.response.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: c.text3, fontSize: 11 }}>{i + 1}.</span>
                        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>
                    Preventative Measures
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.preventative.map((measure, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981' }}>
                        {measure}
                      </span>
                    ))}
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Testing Schedule */}
        <PageSection label="Testing & Validation">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: c.borderSolid }}>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    Last DR Test
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    {new Date(RECOVERY_METRICS.lastTest).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <CheckCircle2 size={20} color="#10B981" />
              </div>
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: c.borderSolid }}>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    Next Scheduled Test
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    {new Date(RECOVERY_METRICS.nextTest).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <AlertTriangle size={20} color="#F59E0B" />
              </div>
              <div>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  Our disaster recovery plan is tested quarterly with full simulations. All test results are documented and audited by third parties.
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Documentation */}
        <PageSection label="Documentation">
          <div className="flex flex-col gap-2">
            {[
              { name: 'Full Contingency Plan (PDF)', size: '2.5 MB', date: '2026-01-15' },
              { name: 'Incident Response Playbook', size: '1.8 MB', date: '2026-01-20' },
              { name: 'Business Continuity Plan', size: '3.2 MB', date: '2026-02-01' },
            ].map((doc, idx) => (
              <TrCard key={idx} hover className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} color="#3B82F6" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{doc.name}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{doc.size} • Updated {new Date(doc.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <ExternalLink size={16} color={c.text3} />
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Our contingency plan is reviewed annually and updated based on new threats, regulatory requirements, and industry best practices. For inquiries, contact compliance@platform.com.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
