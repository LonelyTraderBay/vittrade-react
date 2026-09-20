/**
 * ══════════════════════════════════════════════════════════════
 *  RegulatoryDisclosuresPage — Phase 3: Legal Compliance
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - MiFID II compliance statement
 * - Investor protection scheme info
 * - Jurisdictional restrictions
 * - Liability limitations
 * - Regulatory contact info
 * - Terms of Service (Copy Trading specific)
 * 
 * Compliance:
 * - Mandatory legal disclosures (MiFID II/ESMA)
 * - Transparent regulatory compliance
 * - User protection information
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Legal language (clear but formal)
 * - Prominent disclaimers
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Shield, FileText, AlertTriangle, Globe, Info, Phone,
  ExternalLink, ChevronRight, Lock, Scale
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';

type TabType = 'mifid' | 'protection' | 'restrictions' | 'liability' | 'contact';

export function RegulatoryDisclosuresPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('mifid');

  return (
    <PageLayout>
      <Header title="Regulatory Disclosures" back />

      <PageContent gap="relaxed">
        {/* Hero Banner */}
        <div className="p-4 rounded-2xl" style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
          <div className="flex gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: c.primary }}
            >
              <Scale size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Legal & Regulatory Framework
              </h3>
              <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.5 }}>
                Understanding your rights and protections under MiFID II
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabBar
          variant="underline"
          tabs={[
            { id: 'mifid', label: 'MiFID II' },
            { id: 'protection', label: 'Protection' },
            { id: 'restrictions', label: 'Restrictions' },
            { id: 'liability', label: 'Liability' },
            { id: 'contact', label: 'Contact' },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* Tab Content */}
        {activeTab === 'mifid' && (
          <div className="space-y-4">
            <PageSection label="MiFID II Compliance Statement" accentColor={c.primary}>
              <div className="space-y-3">
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Article 24: Information to Clients
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    We provide all material information about copy trading, including risks, costs, 
                    and nature of service. All disclosures are clear, accurate, and not misleading.
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Article 25: Assessment of Suitability and Appropriateness
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginBottom: 8 }}>
                    Before you can copy trade, we assess:
                  </p>
                  <ul className="space-y-1">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Your knowledge and experience with copy trading
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Your ability to bear financial losses
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Your risk tolerance level
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Your investment objectives
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Article 27: Best Execution Obligation
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    We execute your copy orders on terms most favorable to you, considering price, 
                    costs, speed, likelihood of execution, and other relevant factors. Execution 
                    quality metrics are disclosed transparently.
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Article 58: Record Keeping
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    All transactions, communications, and risk assessments are recorded and retained 
                    for a minimum of 5 years. You can request your complete audit trail at any time.
                  </p>
                </div>
              </div>
            </PageSection>

            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                  <strong>Our Commitment:</strong> We comply with all MiFID II requirements to protect 
                  retail investors. Our compliance is audited annually by independent third parties.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protection' && (
          <div className="space-y-4">
            <PageSection label="Investor Protection Scheme" accentColor="#10B981">
              <div className="space-y-3">
                <div className="p-3 rounded-xl" style={{ background: '#10B98122' }}>
                  <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Coverage Limit
                  </p>
                  <p style={{ color: '#10B981', fontSize: 10, lineHeight: 1.5 }}>
                    Eligible claims are covered up to €20,000 per user under the Investor Compensation 
                    Scheme (ICS). This protects you if we become insolvent.
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    What's Covered
                  </p>
                  <ul className="space-y-1">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Cash balances in your copy trading account
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Open positions at time of insolvency
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Uncredited deposits
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    What's NOT Covered
                  </p>
                  <ul className="space-y-1">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Trading losses (market risk)
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Poor provider performance
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Slippage costs
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Unauthorized account access (negligence)
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    How to File a Claim
                  </p>
                  <ol className="space-y-1">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      1. Contact our support team within 30 days
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      2. Complete claim form with evidence
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      3. Submit to ICS operator
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      4. Receive decision within 90 days
                    </li>
                  </ol>
                </div>

                <button
                  className="w-full p-3 rounded-xl flex items-center justify-between"
                  style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}
                >
                  <div className="flex items-center gap-2">
                    <Phone size={16} color={c.primary} />
                    <span style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
                      ICS Operator Contact
                    </span>
                  </div>
                  <ExternalLink size={14} color={c.primary} />
                </button>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'restrictions' && (
          <div className="space-y-4">
            <PageSection label="Jurisdictional Restrictions" accentColor="#F59E0B">
              <div className="space-y-3">
                <div className="p-3 rounded-xl" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                    <p style={{ color: c.warningText, fontSize: 11, fontWeight: 700 }}>
                      Copy Trading Not Available In:
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {[
                      'United States (US residents)',
                      'China (mainland)',
                      'North Korea',
                      'Iran',
                      'Syria',
                      'Countries under OFAC sanctions',
                    ].map((country, i) => (
                      <li key={i} style={{ color: c.warningText, fontSize: 10, paddingLeft: 12 }}>
                        • {country}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Leverage Restrictions by Region
                  </p>
                  <div className="space-y-2 mt-3">
                    <div>
                      <p style={{ color: c.text2, fontSize: 11, marginBottom: 2 }}>EU Retail Clients:</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Max 30:1 for major forex, 20:1 for minor</p>
                    </div>
                    <div>
                      <p style={{ color: c.text2, fontSize: 11, marginBottom: 2 }}>UK Retail Clients:</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>FCA limits apply (same as EU)</p>
                    </div>
                    <div>
                      <p style={{ color: c.text2, fontSize: 11, marginBottom: 2 }}>Professional Clients:</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Higher leverage available (up to 100:1)</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Tax Reporting Obligations
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginBottom: 6 }}>
                    You are responsible for reporting trading income to your local tax authority. We provide:
                  </p>
                  <ul className="space-y-1">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Annual tax report (P/L summary)
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Trade-by-trade export (CSV)
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Fee breakdown report
                    </li>
                  </ul>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'liability' && (
          <div className="space-y-4">
            <PageSection label="Liability Limitations" accentColor={c.primary}>
              <div className="space-y-3">
                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Platform Role
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    We are a <strong>technology provider</strong>, not an investment advisor. We do not:
                  </p>
                  <ul className="space-y-1 mt-2">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Recommend specific providers to copy
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Guarantee provider performance
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Control provider trading decisions
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Provide personalized investment advice
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    User Responsibility
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    You are solely responsible for:
                  </p>
                  <ul className="space-y-1 mt-2">
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Conducting your own due diligence
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Risk assessment and management
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Investment decisions and outcomes
                    </li>
                    <li style={{ color: c.text3, fontSize: 10, paddingLeft: 12 }}>
                      • Monitoring your copy positions
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.dangerBg }}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={14} color={c.dangerText} className="shrink-0 mt-0.5" />
                    <p style={{ color: c.dangerText, fontSize: 11, fontWeight: 700 }}>
                      Indemnification
                    </p>
                  </div>
                  <p style={{ color: c.dangerText, fontSize: 10, lineHeight: 1.5 }}>
                    You agree to indemnify and hold us harmless from any claims, damages, or losses 
                    arising from your use of copy trading, except in cases of our gross negligence or 
                    willful misconduct.
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Limitation of Liability
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                    Our maximum liability is limited to the fees you paid in the last 12 months, 
                    except where prohibited by law. We are not liable for consequential, indirect, 
                    or punitive damages.
                  </p>
                </div>
              </div>
            </PageSection>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <PageSection label="Regulatory Contact Information" accentColor={c.primary}>
              <div className="space-y-2">
                <button
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Globe size={20} color={c.primary} />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                        Financial Conduct Authority (FCA)
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        UK regulatory authority
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} color={c.text3} />
                </button>

                <button
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Shield size={20} color={c.primary} />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                        European Securities and Markets Authority (ESMA)
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        EU regulatory authority
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} color={c.text3} />
                </button>

                <button
                  className="w-full p-4 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Phone size={20} color={c.primary} />
                    <div>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                        Financial Ombudsman Service
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        Dispute resolution
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} color={c.text3} />
                </button>
              </div>
            </PageSection>

            <PageSection label="Whistleblower Protection" accentColor="#10B981">
              <div className="p-3 rounded-xl" style={{ background: '#10B98122' }}>
                <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                  Report Regulatory Violations Confidentially
                </p>
                <p style={{ color: '#10B981', fontSize: 10, lineHeight: 1.5, marginBottom: 8 }}>
                  If you suspect violations of financial regulations, you can report anonymously to:
                </p>
                <ul className="space-y-1">
                  <li style={{ color: '#10B981', fontSize: 10, paddingLeft: 12 }}>
                    • Email: compliance@vit trade.com
                  </li>
                  <li style={{ color: '#10B981', fontSize: 10, paddingLeft: 12 }}>
                    • Hotline: +44 20 XXXX XXXX
                  </li>
                  <li style={{ color: '#10B981', fontSize: 10, paddingLeft: 12 }}>
                    • Secure form: vit trade.com/whistleblower
                  </li>
                </ul>
              </div>
            </PageSection>

            <PageSection label="Terms & Privacy" accentColor={c.primary}>
              <div className="space-y-2">
                <button
                  className="w-full p-3 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} color={c.primary} />
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      Copy Trading Terms of Service
                    </span>
                  </div>
                  <ChevronRight size={14} color={c.text3} />
                </button>

                <button
                  className="w-full p-3 rounded-xl flex items-center justify-between"
                  style={{ background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <Lock size={16} color={c.primary} />
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      Privacy Policy (Data Handling)
                    </span>
                  </div>
                  <ChevronRight size={14} color={c.text3} />
                </button>
              </div>
            </PageSection>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
