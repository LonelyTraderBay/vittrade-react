/**
 * ══════════════════════════════════════════════════════════════
 *  OmbudsmanReferralPage — Phase 4 Sprint 4 Day 7-8
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Financial Ombudsman Service (FOS) information
 * - Referral eligibility & process
 * - Rights & deadlines
 * - Contact information
 */

import React from 'react';
import { Shield, ExternalLink, CheckCircle, Info, FileText, Phone } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

export function OmbudsmanReferralPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Financial Ombudsman" subtitle="Independent Dispute Resolution" back />

      <PageContent gap="relaxed">
        {/* Info Card */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#10B981' + '15' }}>
              <Shield size={28} color="#10B981" />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                Free & Independent
              </p>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                The Financial Ombudsman Service (FOS) is a free service that settles complaints between consumers and financial businesses.
              </p>
            </div>
          </div>
        </TrCard>

        {/* When to Refer */}
        <PageSection label="When Can You Refer?">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    After 8 Weeks
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    If we haven't sent you a final response within 8 weeks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    Not Satisfied
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    If you're not satisfied with our final response
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    Within 6 Months
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    You must refer within 6 months of our final response
                  </p>
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Contact Info */}
        <PageSection label="Contact Information">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.primary + '15' }}>
                  <Phone size={18} color={c.primary} />
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 9 }}>Phone</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                    0800 023 4567
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                    Monday to Friday, 8am to 8pm • Saturday, 9am to 1pm
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#10B981' + '15' }}>
                  <ExternalLink size={18} color="#10B981" />
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 9 }}>Website</p>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                    www.financial-ombudsman.org.uk
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#F59E0B' + '15' }}>
                  <FileText size={18} color="#F59E0B" />
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 9 }}>Address</p>
                  <p style={{ color: c.text1, fontSize: 11, marginTop: 1, lineHeight: 1.4 }}>
                    Financial Ombudsman Service<br />
                    Exchange Tower<br />
                    London E14 9SR
                  </p>
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* How It Works */}
        <PageSection label="How It Works">
          <div className="space-y-3">
            {[
              { step: 1, title: 'Submit Your Complaint', desc: 'Contact FOS with your complaint details' },
              { step: 2, title: 'FOS Reviews', desc: 'They review both sides of the story' },
              { step: 3, title: 'Investigation', desc: 'Independent investigation of the facts' },
              { step: 4, title: 'Decision', desc: 'FOS makes a binding decision (for us, not you)' },
            ].map((item) => (
              <TrCard key={item.step} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: c.surface2 }}>
                    <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                      {item.step}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      {item.title}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* CTA */}
        <button
          onClick={() => window.open('https://www.financial-ombudsman.org.uk', '_blank')}
          className="w-full rounded-[14px] h-[48px] flex items-center justify-center gap-2 transition-all"
          style={{ background: c.primary, color: '#fff', fontWeight: 600, fontSize: 14 }}>
          <ExternalLink size={18} />
          <span>Visit FOS Website</span>
        </button>
      </PageContent>
    </PageLayout>
  );
}
