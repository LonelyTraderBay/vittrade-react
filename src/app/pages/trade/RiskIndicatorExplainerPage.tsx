/**
 * ══════════════════════════════════════════════════════════════
 *  RiskIndicatorExplainerPage — Phase 4 Sprint 3 Day 11-12
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Explain Summary Risk Indicator (SRI) 1-7 scale
 * - PRIIPs requirement: risk classification
 * - Educational content for investors
 * - Show product's SRI score
 * 
 * Compliance:
 * - PRIIPs: SRI mandatory in KID
 * - Scale 1 (lowest risk) to 7 (highest risk)
 * - Based on market risk & credit risk
 */

import React from 'react';
import { AlertTriangle, Info, Shield, TrendingUp } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

const RISK_LEVELS = [
  {
    level: 1,
    label: 'Lowest Risk',
    color: '#10B981',
    description: 'Capital protected products. Very low volatility.',
    examples: ['Money market funds', 'Cash deposits'],
  },
  {
    level: 2,
    label: 'Low Risk',
    color: '#10B981',
    description: 'Low volatility. Small chance of loss.',
    examples: ['Government bonds', 'High-grade corporate bonds'],
  },
  {
    level: 3,
    label: 'Low-Medium Risk',
    color: '#3B82F6',
    description: 'Some volatility. Moderate chance of loss.',
    examples: ['Mixed bond funds', 'Conservative balanced funds'],
  },
  {
    level: 4,
    label: 'Medium Risk',
    color: '#3B82F6',
    description: 'Moderate volatility. Balanced risk/reward.',
    examples: ['Balanced funds', 'Index funds'],
  },
  {
    level: 5,
    label: 'Medium-High Risk',
    color: '#F59E0B',
    description: 'Higher volatility. Significant loss possible.',
    examples: ['Equity funds', 'Emerging market bonds'],
  },
  {
    level: 6,
    label: 'High Risk',
    color: '#EF4444',
    description: 'High volatility. Substantial loss possible.',
    examples: ['Small-cap equities', 'High-yield bonds', 'Copy trading'],
  },
  {
    level: 7,
    label: 'Highest Risk',
    color: '#EF4444',
    description: 'Extreme volatility. Total loss possible.',
    examples: ['Leveraged products', 'Complex derivatives', 'Crypto'],
  },
];

export function RiskIndicatorExplainerPage() {
  const c = useThemeColors();
  const productSRI = 6; // Mirror Copy Trading = High Risk

  return (
    <PageLayout>
      <Header title="Risk Indicator" subtitle="Summary Risk Indicator (SRI)" back />

      <PageContent gap="relaxed">
        {/* Product SRI */}
        <TrCard className="p-4">
          <div className="text-center mb-4">
            <p style={{ color: c.text3, fontSize: 11 }}>Mirror Copy Trading</p>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 600, marginTop: 8, marginBottom: 8 }}>
              Summary Risk Indicator
            </p>

            {/* SRI Scale */}
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5, 6, 7].map(level => (
                <div
                  key={level}
                  className="flex-1 h-12 rounded flex items-center justify-center"
                  style={{
                    background: level <= productSRI
                      ? level <= 2 ? '#10B981' : level <= 4 ? '#3B82F6' : level <= 5 ? '#F59E0B' : '#EF4444'
                      : c.surface2,
                  }}>
                  <span style={{
                    color: level <= productSRI ? '#fff' : c.text3,
                    fontSize: 14,
                    fontWeight: 700
                  }}>
                    {level}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 9 }}>Lower Risk</span>
              <span style={{ color: c.text3, fontSize: 9 }}>Higher Risk</span>
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ background: c.warningBg }}>
            <div className="flex gap-2">
              <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
              <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4 }}>
                <strong>SRI 6 - High Risk:</strong> This product has high volatility. You could lose a significant portion of your investment.
              </p>
            </div>
          </div>
        </TrCard>

        {/* What is SRI */}
        <PageSection label="What is the Summary Risk Indicator?">
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
              The Summary Risk Indicator (SRI) is a guide to the level of risk of this product compared to other products. It shows how likely it is that the product will lose money because of movements in the markets or because we are not able to pay you.
            </p>

            <div className="mt-3 p-3 rounded-lg" style={{ background: c.infoBg }}>
              <div className="flex gap-2">
                <Info size={14} color={c.infoText} className="shrink-0 mt-0.5" />
                <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4 }}>
                  The risk indicator assumes you keep the product for 3 years. The actual risk can vary significantly if you cash in at an early stage.
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Risk Scale Explanation */}
        <PageSection label="Understanding the 1-7 Scale">
          <div className="space-y-2">
            {RISK_LEVELS.map((risk) => (
              <TrCard key={risk.level} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: risk.color + '15' }}>
                    <span style={{ color: risk.color, fontSize: 16, fontWeight: 700 }}>
                      {risk.level}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {risk.label}
                      </span>
                      {risk.level === productSRI && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: c.primary + '15', color: c.primary }}>
                          THIS PRODUCT
                        </span>
                      )}
                    </div>

                    <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>
                      {risk.description}
                    </p>

                    <p style={{ color: c.text3, fontSize: 9 }}>
                      Examples: {risk.examples.join(', ')}
                    </p>
                  </div>
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Additional Risks */}
        <PageSection label="Additional Risks Not Captured by SRI">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.errorText} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                    Provider Risk
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    The trader you copy may underperform or take excessive risks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.errorText} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                    Liquidity Risk
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    In extreme market conditions, you may not be able to exit positions quickly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertTriangle size={14} color={c.errorText} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                    Operational Risk
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    Technical failures or errors in trade copying may occur.
                  </p>
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}
