/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderGovernancePage — Phase 3: Provider Accountability
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - For providers only (access gated)
 * - Strategy modification log
 * - Follower communication center
 * - Performance fee waterfall report
 * - Compliance checklist
 * 
 * Compliance:
 * - Provider must notify followers 24h before major changes
 * - Transparency in fee earnings
 * - Regular compliance verification
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Trust-first (providers accountable to followers)
 * - Clear communication obligations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  FileText, Users, DollarSign, CheckCircle, AlertTriangle,
  Calendar, TrendingUp, MessageSquare, Send, Clock, Shield,
  Eye, ChevronRight, Edit, Lock
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type TabType = 'modifications' | 'communication' | 'fees' | 'compliance';

interface StrategyModification {
  id: string;
  date: string;
  type: 'strategy_change' | 'risk_level' | 'fee_structure' | 'description';
  oldValue: string;
  newValue: string;
  notificationSent: boolean;
  followerImpact: number;
}

interface FollowerMessage {
  id: string;
  date: string;
  subject: string;
  body: string;
  recipients: number;
  openRate: number;
}

const STRATEGY_MODIFICATIONS: StrategyModification[] = [
  {
    id: 'mod-1',
    date: '2026-03-05',
    type: 'strategy_change',
    oldValue: 'Swing Trading',
    newValue: 'Scalping',
    notificationSent: true,
    followerImpact: 245,
  },
  {
    id: 'mod-2',
    date: '2026-02-15',
    type: 'risk_level',
    oldValue: 'Medium',
    newValue: 'High',
    notificationSent: true,
    followerImpact: 180,
  },
  {
    id: 'mod-3',
    date: '2026-01-20',
    type: 'fee_structure',
    oldValue: '15% performance fee',
    newValue: '10% performance fee',
    notificationSent: true,
    followerImpact: 320,
  },
];

const FOLLOWER_MESSAGES: FollowerMessage[] = [
  {
    id: 'msg-1',
    date: '2026-03-04',
    subject: 'Strategy Change Notification: Swing → Scalping',
    body: 'Dear followers, effective March 5, I will be switching from swing trading to scalping...',
    recipients: 245,
    openRate: 78,
  },
  {
    id: 'msg-2',
    date: '2026-02-14',
    subject: 'Risk Level Adjustment Notice',
    body: 'I am increasing my risk level to capture more opportunities in the current market...',
    recipients: 180,
    openRate: 85,
  },
];

export function ProviderGovernancePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [activeTab, setActiveTab] = useState<TabType>('modifications');
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Mock provider stats
  const providerStats = {
    followers: 245,
    aum: 125000,
    monthlyFeesEarned: 1850,
    allTimeFeesEarned: 12400,
    complianceScore: 95,
  };

  return (
    <PageLayout>
      <Header title="Provider Governance" back />

      <PageContent gap="relaxed">
        {/* Provider Stats Summary */}
        <div className="p-4 rounded-2xl" style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: c.primary }}
            >
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                Provider Dashboard
              </h3>
              <p style={{ color: c.primary, fontSize: 11 }}>
                Managing {providerStats.followers} followers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p style={{ color: c.primary, fontSize: 10, marginBottom: 2 }}>AUM</p>
              <p style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                ${(providerStats.aum / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-center">
              <p style={{ color: c.primary, fontSize: 10, marginBottom: 2 }}>This Month</p>
              <p style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                ${providerStats.monthlyFeesEarned}
              </p>
            </div>
            <div className="text-center">
              <p style={{ color: c.primary, fontSize: 10, marginBottom: 2 }}>Compliance</p>
              <p style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                {providerStats.complianceScore}/100
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'modifications', label: 'Modifications' },
            { id: 'communication', label: 'Communication' },
            { id: 'fees', label: 'Fees' },
            { id: 'compliance', label: 'Compliance' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'modifications' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.5 }}>
                  <strong>24-Hour Notice Required:</strong> You must notify all followers at least 24 hours before implementing major strategy changes.
                </p>
              </div>
            </div>

            <PageSection label="Strategy Modification Log" accentColor={c.primary}>
              {STRATEGY_MODIFICATIONS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText size={32} color={c.text3} className="mb-3" />
                  <p style={{ color: c.text3, fontSize: 13 }}>No modifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {STRATEGY_MODIFICATIONS.map(mod => (
                    <div
                      key={mod.id}
                      className="p-4 rounded-xl"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ 
                                background: mod.type === 'fee_structure' ? '#10B98122' : 
                                           mod.type === 'risk_level' ? '#EF444422' : '#F59E0B22',
                                color: mod.type === 'fee_structure' ? '#10B981' : 
                                       mod.type === 'risk_level' ? '#EF4444' : '#F59E0B',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}
                            >
                              {mod.type.replace('_', ' ')}
                            </span>
                            {mod.notificationSent && (
                              <CheckCircle size={12} color="#10B981" />
                            )}
                          </div>

                          <div className="mb-2">
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Change:</p>
                            <div className="flex items-center gap-2">
                              <span style={{ color: c.text2, fontSize: 11 }}>{mod.oldValue}</span>
                              <ChevronRight size={12} color={c.text3} />
                              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{mod.newValue}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} color={c.text3} />
                              <span style={{ color: c.text3, fontSize: 10 }}>{mod.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={10} color={c.text3} />
                              <span style={{ color: c.text3, fontSize: 10 }}>{mod.followerImpact} followers impacted</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {mod.notificationSent && (
                        <div className="mt-2 p-2 rounded-lg" style={{ background: '#10B98122' }}>
                          <p style={{ color: '#10B981', fontSize: 9 }}>
                            ✓ Notification sent 24h before implementation
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </PageSection>

            <button
              onClick={() => setShowMessageModal(true)}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: c.primary,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <Edit size={16} />
              Request Strategy Modification
            </button>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="space-y-4">
            <PageSection label="Follower Communication Center" accentColor={c.primary}>
              <button
                onClick={() => setShowMessageModal(true)}
                className="w-full p-4 rounded-xl flex items-center justify-between mb-3"
                style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}
              >
                <div className="flex items-center gap-3">
                  <Send size={20} color={c.primary} />
                  <div className="text-left">
                    <p style={{ color: c.primary, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      Broadcast Message
                    </p>
                    <p style={{ color: c.primary, fontSize: 10 }}>
                      Send announcement to all {providerStats.followers} followers
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color={c.primary} />
              </button>

              <div className="space-y-2">
                {FOLLOWER_MESSAGES.map(msg => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <MessageSquare size={16} color={c.primary} className="shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                          {msg.subject}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>
                          {msg.body}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users size={10} color={c.text3} />
                            <span style={{ color: c.text3, fontSize: 9 }}>{msg.recipients} recipients</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={10} color={c.text3} />
                            <span style={{ color: c.text3, fontSize: 9 }}>{msg.openRate}% open rate</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={10} color={c.text3} />
                            <span style={{ color: c.text3, fontSize: 9 }}>{msg.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-4">
            <PageSection label="Performance Fee Waterfall" accentColor="#10B981">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>This Month</p>
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                    ${providerStats.monthlyFeesEarned}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9 }}>From {providerStats.followers} followers</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>All-Time</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                    ${providerStats.allTimeFeesEarned}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9 }}>Total earned</p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                  High-Water Mark System
                </p>
                <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                  You only earn performance fees when followers are in profit (above their previous peak). 
                  This ensures fair compensation aligned with follower success.
                </p>
              </div>

              {/* Fee Breakdown by Follower (Top 5) */}
              <div className="space-y-2">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  Top Fee Contributors (This Month)
                </p>
                {[
                  { name: 'Follower #001', profit: 450, fee: 45 },
                  { name: 'Follower #023', profit: 380, fee: 38 },
                  { name: 'Follower #045', profit: 320, fee: 32 },
                  { name: 'Follower #067', profit: 280, fee: 28 },
                  { name: 'Follower #089', profit: 250, fee: 25 },
                ].map((follower, i) => (
                  <div 
                    key={i}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{ background: c.surface2 }}
                  >
                    <div>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                        {follower.name}
                      </p>
                      <p style={{ color: c.text3, fontSize: 9 }}>
                        Profit: ${follower.profit} (10% fee)
                      </p>
                    </div>
                    <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
                      ${follower.fee}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <PageSection label="Compliance Checklist" accentColor={c.primary}>
              <div className="space-y-2">
                {[
                  { item: 'KYC verification up-to-date', status: true, lastCheck: '2026-03-01' },
                  { item: 'Risk disclosure accurate', status: true, lastCheck: '2026-03-05' },
                  { item: 'Fee structure transparent', status: true, lastCheck: '2026-02-28' },
                  { item: 'No conflicts of interest undisclosed', status: true, lastCheck: '2026-03-01' },
                  { item: 'Strategy description current', status: true, lastCheck: '2026-03-05' },
                  { item: 'Communication obligations met', status: true, lastCheck: '2026-03-08' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: item.status ? '#10B98122' : '#FEF2F2' }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {item.status ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : (
                        <AlertTriangle size={16} color="#EF4444" />
                      )}
                      <div>
                        <p style={{ color: item.status ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                          {item.item}
                        </p>
                        <p style={{ color: item.status ? '#10B981' : '#EF4444', fontSize: 9 }}>
                          Last check: {item.lastCheck}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl text-center" style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
                <p style={{ color: c.primary, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  Compliance Score: {providerStats.complianceScore}/100
                </p>
                <p style={{ color: c.primary, fontSize: 10 }}>
                  Excellent standing — All requirements met
                </p>
              </div>
            </PageSection>
          </div>
        )}
      </PageContent>

      {/* Broadcast Message Modal */}
      {showMessageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMessageModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: c.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Broadcast Message
            </h3>
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 16 }}>
              Send announcement to all followers
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Strategy Change Notification"
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
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter your message..."
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
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  color: c.text1,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Message sent to all followers!');
                  setShowMessageModal(false);
                }}
                className="flex-1 py-3 rounded-xl"
                style={{
                  background: c.primary,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
