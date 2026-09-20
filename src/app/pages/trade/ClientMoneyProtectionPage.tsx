/**
 * ══════════════════════════════════════════════════════════════
 *  ClientMoneyProtectionPage — Phase 4 Sprint 2 Day 7-8
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - FCA CASS (Client Assets Sourcebook) compliance dashboard
 * - Segregated client money accounts
 * - Daily reconciliation statements
 * - Insolvency protection disclosure
 * - Trust account information
 * 
 * Compliance:
 * - CASS 7: Client money rules (UK)
 * - Segregated accounts required
 * - Daily reconciliation mandatory
 * - Client money acknowledgement letters
 * - Distribution in event of insolvency
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Lock, CheckCircle, FileText, Download, Eye,
  TrendingUp, Activity, Clock, Info, ChevronRight
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';

type TabType = 'overview' | 'reconciliation' | 'documents';

export function ClientMoneyProtectionPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('overview');

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'reconciliation' as TabType, label: 'Reconciliation' },
    { id: 'documents' as TabType, label: 'Documents' },
  ];

  return (
    <PageLayout>
      <Header title="Client Money Protection" subtitle="CASS 7 Compliance" back />

      <PageContent gap="relaxed">
        {/* Protection Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <Shield size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Your Funds Are Protected
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              All client money is held in segregated bank accounts and reconciled daily per FCA CASS 7 rules.
            </p>
          </div>
        </div>

        {/* Account Summary */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#10B981' + '15' }}>
              <Lock size={28} color="#10B981" />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 11 }}>Your Segregated Balance</p>
              <p style={{ color: c.text1, fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {fmtUsd(45230.50)}
              </p>
              <p style={{ color: '#10B981', fontSize: 11, marginTop: 2 }}>
                ✓ Fully segregated and protected
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Trust Account</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                Barclays UK
              </p>
            </div>

            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Last Reconciled</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                Today 09:00 UTC
              </p>
            </div>
          </div>
        </TrCard>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'overview' && (
          <>
            <PageSection label="How Your Money Is Protected">
              <TrCard className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        Segregated Bank Accounts
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
                        Your funds are held in trust accounts separate from company funds. This means your money is protected even if the company becomes insolvent.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        Daily Reconciliation
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
                        We reconcile all client money daily to ensure accuracy and compliance with FCA regulations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        FCA Supervision
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
                        Our client money handling is supervised by the Financial Conduct Authority (FCA) under CASS 7 rules.
                      </p>
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="In Case of Insolvency">
              <TrCard className="p-4">
                <div className="rounded-lg p-3 mb-3" style={{ background: c.infoBg }}>
                  <div className="flex gap-2">
                    <Info size={14} color={c.infoText} className="shrink-0 mt-0.5" />
                    <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4 }}>
                      <strong>Client Money Protection:</strong> If we become insolvent, your segregated funds will be distributed to clients proportionally, not used to pay company debts.
                    </p>
                  </div>
                </div>

                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Segregated client money is held on trust and is not available to general creditors. The FCA's client money rules ensure you have priority access to your funds in an insolvency scenario.
                </p>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'reconciliation' && (
          <PageSection label="Daily Reconciliation">
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  Latest Reconciliation
                </p>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: '#10B981' + '15', color: '#10B981' }}>
                  MATCHED
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>Client Ledger Balance</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    {fmtUsd(45230.50)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>Bank Account Balance</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    {fmtUsd(45230.50)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: '#10B981' + '15' }}>
                  <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>Difference</span>
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                    {fmtUsd(0.00)}
                  </span>
                </div>
              </div>

              <p style={{ color: c.text3, fontSize: 9, marginTop: 3 }}>
                Last reconciled: Today at 09:00 UTC • Next: Tomorrow at 09:00 UTC
              </p>
            </TrCard>

            <button
              onClick={() => navigate(`${prefix}/trade/copy-trading/cass-reconciliation`)}
              className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.surface2,
                color: c.text1,
                height: 44,
                fontWeight: 600,
                fontSize: 13,
                border: `1px solid ${c.border}`,
              }}>
              <Eye size={16} />
              <span>View Full Reconciliation History</span>
              <ChevronRight size={14} />
            </button>
          </PageSection>
        )}

        {tab === 'documents' && (
          <PageSection label="CASS Documents">
            <div className="space-y-3">
              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.primary + '15' }}>
                      <FileText size={18} color={c.primary} />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Client Money Letter
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                        Your segregation agreement
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>

              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#10B981' + '15' }}>
                      <FileText size={18} color="#10B981" />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        CASS Compliance Report
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                        Annual auditor report
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>

              <TrCard className="p-3" hover>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#F59E0B' + '15' }}>
                      <Shield size={18} color="#F59E0B" />
                    </div>
                    <div className="text-left">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Insolvency Protection Guide
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                        What happens to your funds
                      </p>
                    </div>
                  </div>
                  <Download size={18} color={c.text3} />
                </button>
              </TrCard>
            </div>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}
