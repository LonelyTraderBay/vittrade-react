import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, Shield } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function BotTermsOfServicePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [readToEnd, setReadToEnd] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setReadToEnd(true);
    }
  };

  const handleAccept = () => {
    if (!agreed) return;
    // Save to localStorage (in production: save to backend)
    localStorage.setItem('bot_terms_accepted', new Date().toISOString());
    toast.success('Terms accepted successfully');
    navigate('/trade/bots');
  };

  return (
    <PageLayout>
      <Header title="Trading Bots Terms" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <FileText size={20} color="#3B82F6" className="shrink-0 mt-1" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Legal Agreement Required
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                You must read and accept these terms before using Trading Bots. Scroll to the bottom to enable acceptance.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content (Scrollable) */}
        <TrCard className="p-0 overflow-hidden">
          <div 
            className="p-5 overflow-y-auto"
            style={{ maxHeight: '60vh' }}
            onScroll={handleScroll}>
            
            <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Trading Bots Terms of Service
            </h2>
            <p style={{ color: c.text3, fontSize: 12, marginBottom: 24 }}>
              Last Updated: March 8, 2026
            </p>

            {/* Section 1 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                1. Acceptance of Terms
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                By using our Trading Bots service ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you must not use the Service.
              </p>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                These Terms constitute a legally binding agreement between you and the Company. Your use of automated 
                trading algorithms is subject to additional regulatory requirements which you acknowledge and accept.
              </p>
            </div>

            {/* Section 2 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                2. No Profit Guarantee
              </h3>
              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex gap-2">
                  <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-1" />
                  <p style={{ color: '#EF4444', fontSize: 12, lineHeight: 1.6 }}>
                    <strong>CRITICAL WARNING:</strong> Trading Bots do NOT guarantee profits. Past performance does not 
                    predict future results. You may lose some or all of your invested capital.
                  </p>
                </div>
              </div>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                Automated trading carries significant risk. Market conditions, volatility, liquidity, technical failures, 
                and other factors can result in substantial losses. You should only invest capital you can afford to lose entirely.
              </p>
            </div>

            {/* Section 3 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                3. Risk Acknowledgment
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                You acknowledge and accept the following risks:
              </p>
              <ul style={{ color: c.text2, fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>
                <li><strong>Market Risk:</strong> Cryptocurrency markets are highly volatile and can move against your positions.</li>
                <li><strong>Liquidity Risk:</strong> Insufficient market liquidity may prevent bot execution at desired prices.</li>
                <li><strong>Slippage Risk:</strong> Actual execution prices may differ significantly from expected prices.</li>
                <li><strong>Technical Risk:</strong> System failures, bugs, or network issues may cause unexpected bot behavior.</li>
                <li><strong>Leverage Risk:</strong> Strategies like Martingale can amplify losses beyond initial investment.</li>
                <li><strong>Regulatory Risk:</strong> Changes in regulations may affect your ability to trade or withdraw funds.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                4. User Responsibilities
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                You are solely responsible for:
              </p>
              <ul style={{ color: c.text2, fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Configuring bot parameters appropriately for your risk tolerance</li>
                <li>Monitoring bot performance and making adjustments as needed</li>
                <li>Maintaining sufficient account balance to cover trading fees and margin requirements</li>
                <li>Understanding the strategy before deploying a bot</li>
                <li>Complying with all applicable laws and regulations in your jurisdiction</li>
                <li>Securing your account credentials and API keys</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                5. Liability Limitation
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR:
              </p>
              <ul style={{ color: c.text2, fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>
                <li>Any trading losses incurred through bot usage</li>
                <li>Inaccurate backtest results or performance projections</li>
                <li>System downtime, technical failures, or execution delays</li>
                <li>Market manipulation, flash crashes, or exchange failures</li>
                <li>Unauthorized access to your account due to compromised credentials</li>
                <li>Regulatory actions or changes affecting your trading ability</li>
              </ul>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                Our maximum liability is limited to the fees you paid for the Service in the 12 months preceding the claim.
              </p>
            </div>

            {/* Section 6 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                6. Service Modifications & Termination
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                We reserve the right to modify, suspend, or terminate the Service at any time with or without notice. 
                We may disable bots, change strategies, or impose new restrictions as necessary to comply with regulations 
                or protect user interests. You may terminate your use of the Service at any time by stopping all bots and 
                closing your account.
              </p>
            </div>

            {/* Section 7 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                7. Dispute Resolution
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration 
                in accordance with the rules of [Arbitration Organization]. You waive your right to participate in class action 
                lawsuits. This agreement is governed by the laws of [Jurisdiction].
              </p>
            </div>

            {/* Section 8 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                8. Regulatory Compliance
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                Trading Bots may be classified as complex financial products under MiFID II (EU), requiring appropriateness 
                assessment. By accepting these Terms, you confirm that you have completed the suitability questionnaire and 
                understand the risks involved. Certain jurisdictions may prohibit automated trading - you are responsible 
                for ensuring compliance with local laws.
              </p>
            </div>

            {/* Section 9 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                9. Data Usage & Privacy
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                We collect and process trading data, bot performance metrics, and account information to provide the Service. 
                This data may be used for analytics, risk monitoring, and service improvement. We do not sell your personal 
                data to third parties. See our Privacy Policy for details.
              </p>
            </div>

            {/* Section 10 */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                10. Contact Information
              </h3>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                For questions about these Terms, contact us at:
              </p>
              <div className="mt-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                <p style={{ color: c.text2, fontSize: 12 }}>Email: legal@tradingplatform.com</p>
                <p style={{ color: c.text2, fontSize: 12 }}>Support: support@tradingplatform.com</p>
                <p style={{ color: c.text2, fontSize: 12 }}>Address: [Company Address]</p>
              </div>
            </div>

            {/* End Marker */}
            <div className="border-t pt-4" style={{ borderColor: c.borderSolid }}>
              <p style={{ color: c.text3, fontSize: 12, textAlign: 'center' }}>
                — End of Terms —
              </p>
            </div>
          </div>
        </TrCard>

        {/* Acceptance */}
        <PageSection label="Accept Terms">
          {!readToEnd && (
            <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-2">
                <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 12 }}>
                  Please scroll to the bottom of the terms to enable acceptance.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setAgreed(!agreed)} 
            disabled={!readToEnd}
            className="flex items-start gap-3 w-full text-left p-3 rounded-xl"
            style={{ 
              background: readToEnd ? c.surface2 : c.surface,
              opacity: readToEnd ? 1 : 0.5,
              cursor: readToEnd ? 'pointer' : 'not-allowed',
            }}>
            <div className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-1"
              style={{ 
                borderColor: agreed ? c.primary : c.borderSolid, 
                background: agreed ? c.primary : 'transparent',
              }}>
              {agreed && <CheckCircle2 size={16} color="#FFF" />}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                I have read and agree to the Trading Bots Terms of Service
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                By checking this box, you acknowledge that you understand the risks of automated trading and 
                accept the terms outlined above.
              </p>
            </div>
          </button>
        </PageSection>

        {/* CTA */}
        <button
          onClick={handleAccept}
          disabled={!agreed}
          className="w-full py-3 rounded-[14px] text-sm font-semibold"
          style={{
            background: agreed ? c.primary : c.surface2,
            color: agreed ? '#FFF' : c.text3,
            cursor: agreed ? 'pointer' : 'not-allowed',
          }}>
          {agreed ? 'Accept & Continue' : 'Read Terms to Continue'}
        </button>

        {/* Compliance Note */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex gap-3">
            <Shield size={16} color={c.text3} className="shrink-0 mt-1" />
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Regulatory Compliance
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6 }}>
                These terms comply with MiFID II (EU), SEC regulations (US), FCA guidelines (UK), and other applicable 
                financial regulations. Acceptance is recorded and auditable.
              </p>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}