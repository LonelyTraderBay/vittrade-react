/**
 * ══════════════════════════════════════════════════════════════
 *  DisputeResolutionPage — Phase 3: Complaint Handling
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - File complaint form (execution/fees/strategy/performance/misconduct)
 * - Case status tracking (timeline view)
 * - Resolution history
 * - Escalation path
 * 
 * Compliance:
 * - Consumer protection requirement
 * - Fair dispute resolution process
 * - Transparent case handling
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Step-by-step complaint form
 * - Clear status indicators
 * - Evidence upload capability
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  FileText, AlertCircle, CheckCircle, Clock, Send, Upload,
  ChevronRight, MessageSquare, Shield, Info, XCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type TabType = 'file' | 'active' | 'history';

type ComplaintType = 
  | 'execution_issue' 
  | 'fee_discrepancy' 
  | 'strategy_change' 
  | 'performance_data' 
  | 'misconduct';

type CaseStatus = 'submitted' | 'under_review' | 'provider_response' | 'resolved' | 'escalated';

interface DisputeCase {
  id: string;
  providerId: string;
  providerName: string;
  complaintType: ComplaintType;
  subject: string;
  description: string;
  status: CaseStatus;
  submittedDate: string;
  updatedDate: string;
  estimatedResolution: string;
  outcome?: 'refund' | 'warning' | 'suspension' | 'no_action';
}

const ACTIVE_CASES: DisputeCase[] = [
  {
    id: 'case-001',
    providerId: 'trader-2',
    providerName: 'SwingMaster',
    complaintType: 'execution_issue',
    subject: 'Excessive slippage on BTC trade',
    description: 'Provider executed at $68,500 but my copy filled at $68,750 (0.36% slippage)',
    status: 'under_review',
    submittedDate: '2026-03-06',
    updatedDate: '2026-03-07',
    estimatedResolution: '2026-03-10',
  },
];

const RESOLVED_CASES: DisputeCase[] = [
  {
    id: 'case-002',
    providerId: 'trader-3',
    providerName: 'AlgoTrader',
    complaintType: 'fee_discrepancy',
    subject: 'Charged 15% instead of 10%',
    description: 'My profit was $100 but fee charged was $15 instead of $10',
    status: 'resolved',
    submittedDate: '2026-02-20',
    updatedDate: '2026-02-25',
    estimatedResolution: '2026-02-25',
    outcome: 'refund',
  },
];

const COMPLAINT_TYPES: { value: ComplaintType; label: string; description: string }[] = [
  { 
    value: 'execution_issue', 
    label: 'Execution Issue', 
    description: 'Slippage, delay, or fill rate problems' 
  },
  { 
    value: 'fee_discrepancy', 
    label: 'Fee Discrepancy', 
    description: 'Incorrect fee calculation or charge' 
  },
  { 
    value: 'strategy_change', 
    label: 'Strategy Change Without Notice', 
    description: 'Provider changed strategy without 24h notice' 
  },
  { 
    value: 'performance_data', 
    label: 'Performance Data Inaccuracy', 
    description: 'Suspicious or fake performance stats' 
  },
  { 
    value: 'misconduct', 
    label: 'Provider Misconduct', 
    description: 'Unethical behavior or scam' 
  },
];

export function DisputeResolutionPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'submitted': return '#6B7280';
      case 'under_review': return '#3B82F6';
      case 'provider_response': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'escalated': return '#EF4444';
    }
  };

  const getStatusLabel = (status: CaseStatus) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'provider_response': return 'Provider Responded';
      case 'resolved': return 'Resolved';
      case 'escalated': return 'Escalated';
    }
  };

  const getOutcomeLabel = (outcome?: DisputeCase['outcome']) => {
    switch (outcome) {
      case 'refund': return 'Refund Issued';
      case 'warning': return 'Provider Warned';
      case 'suspension': return 'Provider Suspended';
      case 'no_action': return 'No Action Required';
      default: return 'Pending';
    }
  };

  const handleSubmit = () => {
    if (!selectedType || !selectedProvider || !subject || !description) {
      alert('Please fill all required fields');
      return;
    }
    
    alert('Complaint submitted successfully! You will receive updates via email.');
    // Reset form
    setSelectedType(null);
    setSelectedProvider('');
    setSubject('');
    setDescription('');
    setActiveTab('active');
  };

  return (
    <PageLayout variant={activeTab === 'file' ? 'flush' : 'default'}>
      <Header title="Dispute Resolution" back />

      {activeTab !== 'file' && (
        <TabBar
          variant="underline"
          tabs={[
            { id: 'file', label: 'File Complaint' },
            { id: 'active', label: 'Active Cases', badge: ACTIVE_CASES.length },
            { id: 'history', label: 'History', badge: RESOLVED_CASES.length },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />
      )}

      {activeTab === 'file' ? (
        <>
          <PageContent grow gap="relaxed">
            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                    Fair Dispute Resolution
                  </p>
                  <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                    We investigate all complaints fairly. Most cases are resolved within 48 hours.
                  </p>
                </div>
              </div>
            </div>

            <PageSection label="Complaint Type" accentColor={c.primary}>
              <div className="space-y-2">
                {COMPLAINT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className="w-full p-3 rounded-xl text-left"
                    style={{
                      background: selectedType === type.value ? c.primary + '22' : c.surface2,
                      border: `2px solid ${selectedType === type.value ? c.primary : c.border}`,
                    }}
                  >
                    <p style={{ 
                      color: selectedType === type.value ? c.primary : c.text1,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 2
                    }}>
                      {type.label}
                    </p>
                    <p style={{ 
                      color: selectedType === type.value ? c.primary : c.text3,
                      fontSize: 10
                    }}>
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </PageSection>

            <PageSection label="Provider" accentColor={c.primary}>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: selectedProvider ? c.text1 : c.text3,
                  fontSize: 13,
                }}
              >
                <option value="">Select provider...</option>
                <option value="trader-1">CryptoKing</option>
                <option value="trader-2">SwingMaster</option>
                <option value="trader-3">AlgoTrader</option>
              </select>
            </PageSection>

            <PageSection label="Details" accentColor={c.primary}>
              <div className="space-y-3">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe the issue in detail. Include dates, trade IDs, amounts, etc."
                    className="w-full px-4 py-3 rounded-xl"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 12,
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  className="w-full p-3 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: c.surface2, border: `1px dashed ${c.border}` }}
                >
                  <Upload size={16} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 12 }}>Upload Evidence (Optional)</span>
                </button>
              </div>
            </PageSection>
          </PageContent>

          <StickyFooter>
            <button
              onClick={handleSubmit}
              disabled={!selectedType || !selectedProvider || !subject || !description}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: (!selectedType || !selectedProvider || !subject || !description) ? c.border : c.primary,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                opacity: (!selectedType || !selectedProvider || !subject || !description) ? 0.5 : 1,
              }}
            >
              <Send size={16} />
              Submit Complaint
            </button>
          </StickyFooter>
        </>
      ) : activeTab === 'active' ? (
        <PageContent gap="relaxed">
          {ACTIVE_CASES.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle size={48} color={c.text3} className="mb-3" />
              <p style={{ color: c.text3, fontSize: 13, textAlign: 'center' }}>
                No active cases
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ACTIVE_CASES.map(caseItem => (
                <div
                  key={caseItem.id}
                  className="p-4 rounded-2xl"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            background: getStatusColor(caseItem.status) + '22',
                            color: getStatusColor(caseItem.status),
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {getStatusLabel(caseItem.status)}
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>Case #{caseItem.id}</span>
                      </div>

                      <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        {caseItem.subject}
                      </h4>

                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>
                        Provider: {caseItem.providerName}
                      </p>

                      <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, marginBottom: 8 }}>
                        {caseItem.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock size={10} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 9 }}>Submitted: {caseItem.submittedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle size={10} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 9 }}>Est. resolution: {caseItem.estimatedResolution}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
                    <div className="space-y-2">
                      {[
                        { status: 'submitted', date: caseItem.submittedDate, label: 'Complaint submitted', done: true },
                        { status: 'under_review', date: caseItem.updatedDate, label: 'Under review by support team', done: caseItem.status !== 'submitted' },
                        { status: 'provider_response', date: '', label: 'Awaiting provider response', done: ['provider_response', 'resolved'].includes(caseItem.status) },
                        { status: 'resolved', date: '', label: 'Resolution', done: caseItem.status === 'resolved' },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="shrink-0 mt-1">
                            {step.done ? (
                              <CheckCircle size={14} color="#10B981" />
                            ) : (
                              <Clock size={14} color={c.text3} />
                            )}
                          </div>
                          <div>
                            <p style={{ color: step.done ? c.text1 : c.text3, fontSize: 10, fontWeight: step.done ? 600 : 400 }}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p style={{ color: c.text3, fontSize: 9 }}>{step.date}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Escalation feature coming soon')}
                    className="w-full mt-3 py-2 rounded-lg"
                    style={{
                      background: c.dangerBg,
                      color: c.dangerText,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Escalate to Senior Support
                  </button>
                </div>
              ))}
            </div>
          )}
        </PageContent>
      ) : (
        <PageContent gap="relaxed">
          {RESOLVED_CASES.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} color={c.text3} className="mb-3" />
              <p style={{ color: c.text3, fontSize: 13, textAlign: 'center' }}>
                No resolved cases yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {RESOLVED_CASES.map(caseItem => (
                <div
                  key={caseItem.id}
                  className="p-4 rounded-2xl"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={14} color="#10B981" />
                        <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                          {getOutcomeLabel(caseItem.outcome)}
                        </span>
                      </div>

                      <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        {caseItem.subject}
                      </h4>

                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>
                        Provider: {caseItem.providerName}
                      </p>

                      <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4, marginBottom: 8 }}>
                        {caseItem.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs">
                        <span style={{ color: c.text3, fontSize: 9 }}>Resolved: {caseItem.updatedDate}</span>
                      </div>
                    </div>
                  </div>

                  {caseItem.outcome === 'refund' && (
                    <div className="p-2 rounded-lg" style={{ background: '#10B98122' }}>
                      <p style={{ color: '#10B981', fontSize: 10 }}>
                        ✓ $5 refund issued to your account
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PageContent>
      )}
    </PageLayout>
  );
}
