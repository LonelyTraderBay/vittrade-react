/**
 * ══════════════════════════════════════════════════════════════
 *  ComplaintsHandlingPage — Phase 4 Sprint 4 Day 1-2
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - FCA/MiFID II complaints handling framework
 * - Client rights & escalation paths
 * - Complaint lifecycle management
 * - SLA tracking (8 weeks resolution)
 * - Financial Ombudsman Service info
 * 
 * Compliance:
 * - FCA DISP (Dispute Resolution: Complaints)
 * - MiFID II Art. 26: Complaints handling
 * - 8-week deadline for final response
 * - Right to refer to Financial Ombudsman
 * - Annual complaints data reporting
 * 
 * Features:
 * - Complaints overview dashboard
 * - Submit new complaint
 * - Track existing complaints
 * - Complaint categories
 * - Resolution timeline
 * - Ombudsman referral info
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MessageSquare, AlertCircle, Clock, CheckCircle, TrendingUp,
  FileText, Shield, ChevronRight, Info, BarChart3, Users
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

type TabType = 'overview' | 'my-complaints' | 'process';

interface Complaint {
  id: string;
  category: string;
  status: 'submitted' | 'under-review' | 'resolved' | 'escalated';
  submittedDate: string;
  deadline: string;
  subject: string;
}

const MY_COMPLAINTS: Complaint[] = [
  {
    id: 'COMP-2026-001',
    category: 'Trade Execution',
    status: 'under-review',
    submittedDate: '2026-02-15',
    deadline: '2026-04-12',
    subject: 'Order not executed at expected price',
  },
  {
    id: 'COMP-2025-089',
    category: 'Customer Service',
    status: 'resolved',
    submittedDate: '2025-11-20',
    deadline: '2026-01-15',
    subject: 'Delayed response to support ticket',
  },
];

export function ComplaintsHandlingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('overview');

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'my-complaints' as TabType, label: 'My Complaints' },
    { id: 'process' as TabType, label: 'Process' },
  ];

  const STATUS_CONFIG = {
    submitted: { color: '#3B82F6', label: 'Submitted' },
    'under-review': { color: '#F59E0B', label: 'Under Review' },
    resolved: { color: '#10B981', label: 'Resolved' },
    escalated: { color: '#EF4444', label: 'Escalated' },
  };

  const CATEGORIES = [
    { id: 'trade', label: 'Trade Execution', icon: TrendingUp },
    { id: 'account', label: 'Account Management', icon: Users },
    { id: 'payment', label: 'Payments & Withdrawals', icon: FileText },
    { id: 'service', label: 'Customer Service', icon: MessageSquare },
    { id: 'fees', label: 'Fees & Charges', icon: BarChart3 },
    { id: 'other', label: 'Other', icon: AlertCircle },
  ];

  return (
    <PageLayout>
      <Header
        title="Complaints Handling"
        subtitle="FCA Regulated Process"
        back
      />

      <PageContent gap="relaxed">
        {/* Your Rights Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Shield size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Your Rights
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              You have the right to complain. We will investigate fairly and respond within 8 weeks. If dissatisfied, you can refer to the Financial Ombudsman Service.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Active</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {MY_COMPLAINTS.filter(c => c.status !== 'resolved').length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Resolved</p>
            <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {MY_COMPLAINTS.filter(c => c.status === 'resolved').length}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Avg. Days</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>12</p>
          </TrCard>
        </div>

        {/* Quick Action */}
        <button
          onClick={() => navigate(`${prefix}/trade/copy-trading/complaint-submission`)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all"
          style={{ background: c.primary }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <MessageSquare size={22} color="#fff" />
          </div>
          <div className="flex-1 text-left">
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Submit a Complaint</p>
            <p style={{ color: '#fff', fontSize: 11, opacity: 0.9, marginTop: 2 }}>
              We'll respond within 8 weeks
            </p>
          </div>
          <ChevronRight size={20} color="#fff" />
        </button>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'overview' && (
          <>
            <PageSection label="Complaint Categories">
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TrCard key={category.id} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: c.primary + '15' }}>
                          <Icon size={16} color={c.primary} />
                        </div>
                      </div>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                        {category.label}
                      </p>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            <PageSection label="Resolution Timeline">
              <TrCard className="p-4">
                <div className="space-y-3">
                  {[
                    { step: 1, label: 'Submit Complaint', time: 'Day 0' },
                    { step: 2, label: 'Acknowledgement', time: 'Within 5 days' },
                    { step: 3, label: 'Investigation', time: 'Up to 8 weeks' },
                    { step: 4, label: 'Final Response', time: 'By deadline' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: c.surface2 }}>
                        <span style={{ color: c.primary, fontSize: 13, fontWeight: 700 }}>
                          {item.step}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {item.label}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'my-complaints' && (
          <PageSection label="Your Complaints">
            <div className="space-y-3">
              {MY_COMPLAINTS.map((complaint) => {
                const statusCfg = STATUS_CONFIG[complaint.status];
                const daysRemaining = Math.ceil(
                  (new Date(complaint.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <TrCard
                    key={complaint.id}
                    className="p-4"
                    hover
                    onClick={() => navigate(`${prefix}/trade/copy-trading/complaint-tracking/${complaint.id}`)}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: statusCfg.color + '15' }}>
                        <MessageSquare size={18} color={statusCfg.color} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            {complaint.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: statusCfg.color + '15', color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </div>

                        <p style={{ color: c.text2, fontSize: 11, marginBottom: 2 }}>
                          {complaint.subject}
                        </p>

                        <p style={{ color: c.text3, fontSize: 9 }}>
                          {complaint.category} • Submitted {new Date(complaint.submittedDate).toLocaleDateString()}
                        </p>

                        {complaint.status !== 'resolved' && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock size={10} color={daysRemaining < 14 ? '#F59E0B' : c.text3} />
                            <span style={{
                              color: daysRemaining < 14 ? '#F59E0B' : c.text3,
                              fontSize: 9
                            }}>
                              {daysRemaining} days remaining
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronRight size={16} color={c.text3} />
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'process' && (
          <>
            <PageSection label="How We Handle Complaints">
              <TrCard className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Fair Investigation</p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        We investigate all complaints fairly and independently
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>8-Week Deadline</p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        We'll send a final response within 8 weeks (FCA requirement)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Ombudsman Rights</p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        If you're not satisfied, you can refer to the Financial Ombudsman Service (free)
                      </p>
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Financial Ombudsman Service">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5, marginBottom: 3 }}>
                  The Financial Ombudsman Service is a free, independent service that settles complaints between consumers and businesses that provide financial services.
                </p>

                <div className="rounded-lg p-3 mb-3" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Contact:</p>
                  <p style={{ color: c.text1, fontSize: 11 }}>
                    Phone: 0800 023 4567
                  </p>
                  <p style={{ color: c.text1, fontSize: 11, marginTop: 1 }}>
                    Web: www.financial-ombudsman.org.uk
                  </p>
                </div>

                <button
                  onClick={() => navigate(`${prefix}/trade/copy-trading/ombudsman-referral`)}
                  className="w-full rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: c.surface2,
                    color: c.text1,
                    height: 40,
                    fontWeight: 600,
                    fontSize: 12,
                    border: `1px solid ${c.border}`,
                  }}>
                  <Info size={14} />
                  <span>Learn About Ombudsman Referral</span>
                  <ChevronRight size={14} />
                </button>
              </TrCard>
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
