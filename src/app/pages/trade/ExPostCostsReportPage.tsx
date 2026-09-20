/**
 * ══════════════════════════════════════════════════════════════
 *  ExPostCostsReportPage — Phase 4 Sprint 3 Day 5-6
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Annual ex-post cost report (actual costs paid)
 * - Compare ex-ante estimates vs. actual costs
 * - PRIIPs requirement: annual reporting
 * 
 * Compliance:
 * - PRIIPs: Ex-post cost disclosure (annual)
 * - Show actual costs paid in previous year
 * - Compare to ex-ante estimates
 */

import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

type TabType = '2025' | '2024' | '2023';

const REPORT_2025 = {
  year: 2025,
  oneOff: 50,
  recurring: 285,
  incidental: 120,
  estimated: {
    oneOff: 50,
    recurring: 300,
    incidental: 100,
  },
};

export function ExPostCostsReportPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<TabType>('2025');

  const TABS = [
    { id: '2025' as TabType, label: '2025' },
    { id: '2024' as TabType, label: '2024' },
    { id: '2023' as TabType, label: '2023' },
  ];

  const totalActual = REPORT_2025.oneOff + REPORT_2025.recurring + REPORT_2025.incidental;
  const totalEstimated = REPORT_2025.estimated.oneOff + REPORT_2025.estimated.recurring + REPORT_2025.estimated.incidental;
  const variance = totalActual - totalEstimated;

  return (
    <PageLayout>
      <Header
        title="Ex-Post Cost Report"
        subtitle="Annual Actual Costs"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Download PDF'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
          <CheckCircle size={16} color={c.successText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.successText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Annual Cost Report Available
            </p>
            <p style={{ color: c.successText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              This report shows the actual costs you paid in {REPORT_2025.year}. Required by PRIIPs regulation.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Total Actual Costs</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              €{totalActual.toLocaleString()}
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Estimated Costs</p>
            <p style={{ color: c.text3, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              €{totalEstimated.toLocaleString()}
            </p>
          </TrCard>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Cost Breakdown */}
        <PageSection label="Actual vs. Estimated">
          <div className="space-y-3">
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>One-off Costs</span>
                <div className="text-right">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    €{REPORT_2025.oneOff}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                    Est: €{REPORT_2025.estimated.oneOff}
                  </p>
                </div>
              </div>
            </TrCard>

            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Recurring Costs</span>
                <div className="text-right">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    €{REPORT_2025.recurring}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                    Est: €{REPORT_2025.estimated.recurring}
                  </p>
                </div>
              </div>
              {REPORT_2025.recurring < REPORT_2025.estimated.recurring && (
                <div className="rounded-lg p-2" style={{ background: c.successBg }}>
                  <p style={{ color: c.successText, fontSize: 9 }}>
                    ✓ €{REPORT_2025.estimated.recurring - REPORT_2025.recurring} lower than estimated
                  </p>
                </div>
              )}
            </TrCard>

            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Incidental Costs</span>
                <div className="text-right">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                    €{REPORT_2025.incidental}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>
                    Est: €{REPORT_2025.estimated.incidental}
                  </p>
                </div>
              </div>
              {REPORT_2025.incidental > REPORT_2025.estimated.incidental && (
                <div className="rounded-lg p-2" style={{ background: c.warningBg }}>
                  <p style={{ color: c.warningText, fontSize: 9 }}>
                    ⚠ €{REPORT_2025.incidental - REPORT_2025.estimated.incidental} higher (better performance)
                  </p>
                </div>
              )}
            </TrCard>
          </div>
        </PageSection>

        {/* Variance Analysis */}
        <PageSection label="Variance Analysis">
          <TrCard className="p-4">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Total Variance</span>
              <span style={{
                color: variance > 0 ? '#EF4444' : '#10B981',
                fontSize: 18,
                fontWeight: 700
              }}>
                {variance > 0 ? '+' : ''}€{variance.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg p-3 mt-3" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
                {variance > 0
                  ? `Actual costs were €${Math.abs(variance)} higher than estimated, mainly due to higher performance fees.`
                  : variance < 0
                  ? `Actual costs were €${Math.abs(variance)} lower than estimated, mainly due to lower transaction costs.`
                  : 'Actual costs matched estimates exactly.'}
              </p>
            </div>
          </TrCard>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}
