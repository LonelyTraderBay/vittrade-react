/**
 * ══════════════════════════════════════════════════════════════
 *  InvestorCompensationPage — Phase 4 Sprint 2 Day 11-12
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - FSCS (Financial Services Compensation Scheme) disclosure
 * - DGS (Deposit Guarantee Scheme) for EU clients
 * - Coverage limits disclosure (€20k - €100k)
 * - Eligibility checker
 * - Claim process guide
 * 
 * Compliance:
 * - FSCS: UK investor protection (up to £85k)
 * - DGS: EU deposit guarantee (€100k)
 * - MiFID II: Client must be informed of coverage
 * - Disclosure before client relationship starts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, CheckCircle, Info, AlertCircle, FileText,
  ChevronRight, ExternalLink, HelpCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';

type TabType = 'overview' | 'eligibility' | 'claim';

export function InvestorCompensationPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<TabType>('overview');

  const TABS = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'eligibility' as TabType, label: 'Eligibility' },
    { id: 'claim' as TabType, label: 'How to Claim' },
  ];

  return (
    <PageLayout>
      <Header title="Investor Compensation" subtitle="FSCS Protection" back />

      <PageContent gap="relaxed">
        {/* Protection Summary */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#10B981' + '15' }}>
              <Shield size={28} color="#10B981" />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                Protected up to £85,000
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                Your investments are protected by the UK Financial Services Compensation Scheme (FSCS)
              </p>
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
            <div className="flex gap-2">
              <CheckCircle size={14} color={c.successText} className="shrink-0 mt-0.5" />
              <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4 }}>
                <strong>You're covered:</strong> If our firm fails, FSCS may pay compensation for claims up to £85,000 per eligible person.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Info Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Info size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Automatic Protection
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              FSCS protection is automatic for eligible claimants. No registration required. Coverage applies if we cannot meet our obligations.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'overview' && (
          <>
            <PageSection label="What Is FSCS?">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, marginBottom: 3 }}>
                  The Financial Services Compensation Scheme (FSCS) is the UK's statutory deposit insurance and investors compensation scheme for customers of authorised financial services firms.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        Independent Protection
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        FSCS is independent of the government and financial services industry
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        Free to Claimants
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        No cost to make a claim. Funded by levies on authorized firms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        Fast Payment
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                        FSCS aims to pay compensation within 3-6 months
                      </p>
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Coverage Limits">
              <TrCard className="p-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: c.text2, fontSize: 12 }}>Investments</span>
                      <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                        £85,000
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 9 }}>
                      Per eligible person, per firm
                    </p>
                  </div>

                  <div className="p-3 rounded-lg" style={{ background: c.surface2 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: c.text2, fontSize: 12 }}>Deposits</span>
                      <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                        £85,000
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 9 }}>
                      Per eligible person, per banking institution
                    </p>
                  </div>

                  <div className="rounded-lg p-3" style={{ background: c.warningBg }}>
                    <div className="flex gap-2">
                      <AlertCircle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                      <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4 }}>
                        <strong>Note:</strong> Some products may not be covered. Check eligibility for each product type.
                      </p>
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'eligibility' && (
          <PageSection label="Who Is Eligible?">
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                ✓ Eligible Customers:
              </p>

              <div className="space-y-2 mb-4">
                {[
                  'Individuals (retail clients)',
                  'Small businesses (turnover < £6.5M)',
                  'Charities (annual income < £6.5M)',
                  'Trustees of trusts (net asset value < £1M)',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                ✗ Not Eligible:
              </p>

              <div className="space-y-2">
                {[
                  'Large companies',
                  'Professional investors (unless opted down)',
                  'Financial institutions',
                  'Public sector bodies',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertCircle size={12} color="#EF4444" className="shrink-0 mt-1" />
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'claim' && (
          <PageSection label="How to Make a Claim">
            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: 'Firm Declared in Default',
                  description: 'FSCS can only pay if the FCA declares our firm in default (unable to meet obligations)',
                },
                {
                  step: 2,
                  title: 'FSCS Contacts You',
                  description: 'FSCS will write to all known eligible customers with claim forms',
                },
                {
                  step: 3,
                  title: 'Complete Claim Form',
                  description: 'Fill out the claim form with details of your investment/deposit',
                },
                {
                  step: 4,
                  title: 'Submit Evidence',
                  description: 'Provide proof of ownership (account statements, contracts)',
                },
                {
                  step: 5,
                  title: 'Assessment',
                  description: 'FSCS reviews your claim and calculates compensation',
                },
                {
                  step: 6,
                  title: 'Payment',
                  description: 'If approved, FSCS pays compensation directly to you (typically within 3-6 months)',
                },
              ].map((item) => (
                <TrCard key={item.step} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: c.primary + '15' }}>
                      <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                        {item.step}
                      </span>
                    </div>

                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                        {item.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>

            <button
              onClick={() => window.open('https://www.fscs.org.uk', '_blank')}
              className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.primary,
                color: '#fff',
                height: 44,
                fontWeight: 600,
                fontSize: 13,
              }}>
              <ExternalLink size={16} />
              <span>Visit FSCS Website</span>
            </button>
          </PageSection>
        )}

        {/* FAQ Link */}
        <button
          className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
          style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
          <div className="flex items-center gap-2">
            <HelpCircle size={16} color={c.primary} />
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
              FSCS FAQs
            </span>
          </div>
          <ChevronRight size={16} color={c.text3} />
        </button>
      </PageContent>
    </PageLayout>
  );
}
