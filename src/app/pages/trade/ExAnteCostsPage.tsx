/**
 * ══════════════════════════════════════════════════════════════
 *  ExAnteCostsPage — Phase 4 Sprint 3 Day 1-2
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - PRIIPs Regulation: Ex-ante cost disclosure
 * - Show all costs BEFORE client invests
 * - Breakdown: one-off costs, recurring costs, incidental costs
 * - RIY (Reduction in Yield) calculation
 * - Regulatory requirement for retail clients
 * 
 * Compliance:
 * - PRIIPs Regulation Art. 8: Cost disclosure
 * - MiFID II: Cost & charges disclosure
 * - Categories:
 *   - One-off: Entry costs, Exit costs
 *   - Recurring: Management fees, Transaction costs, Other ongoing
 *   - Incidental: Performance fees, Carried interest
 * 
 * Features:
 * - Pre-investment cost summary
 * - Cost breakdown by category
 * - Total cost in EUR & % of investment
 * - RIY impact visualization
 * - Holding period scenarios (1/3/5 years)
 * - Downloadable PDF disclosure
 * 
 * Guidelines:
 * - PageLayout pattern
 * - Clear cost categories
 * - Transparency-first
 * - Educational tooltips
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DollarSign, TrendingDown, Info, Download, Calculator,
  FileText, Shield, AlertCircle, ChevronRight, BarChart3
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtPct } from '../../data/formatNumber';

type TabType = 'summary' | 'breakdown' | 'scenarios';
type HoldingPeriod = 1 | 3 | 5;

interface CostItem {
  category: 'one-off' | 'recurring' | 'incidental';
  type: string;
  description: string;
  amountEur: number;
  percentOfInvestment: number;
}

const EXAMPLE_COSTS: CostItem[] = [
  // One-off costs
  {
    category: 'one-off',
    type: 'Entry Cost',
    description: 'Platform fee charged when you start copying',
    amountEur: 50,
    percentOfInvestment: 0.50,
  },
  {
    category: 'one-off',
    type: 'Exit Cost',
    description: 'Platform fee when you stop copying (no early exit fee)',
    amountEur: 0,
    percentOfInvestment: 0,
  },
  // Recurring costs
  {
    category: 'recurring',
    type: 'Management Fee',
    description: 'Annual fee for copy trading service',
    amountEur: 200,
    percentOfInvestment: 2.00,
  },
  {
    category: 'recurring',
    type: 'Transaction Costs',
    description: 'Estimated trading fees (based on historical activity)',
    amountEur: 80,
    percentOfInvestment: 0.80,
  },
  {
    category: 'recurring',
    type: 'Other Ongoing',
    description: 'Custody, admin, and operational costs',
    amountEur: 20,
    percentOfInvestment: 0.20,
  },
  // Incidental costs
  {
    category: 'incidental',
    type: 'Performance Fee',
    description: '20% of profits above high water mark',
    amountEur: 100,
    percentOfInvestment: 1.00,
  },
];

const INVESTMENT_AMOUNT = 10000; // EUR

export function ExAnteCostsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('summary');
  const [holdingPeriod, setHoldingPeriod] = useState<HoldingPeriod>(3);

  // Calculate totals
  const oneOffCosts = EXAMPLE_COSTS.filter(c => c.category === 'one-off')
    .reduce((s, c) => s + c.amountEur, 0);
  const recurringCosts = EXAMPLE_COSTS.filter(c => c.category === 'recurring')
    .reduce((s, c) => s + c.amountEur, 0);
  const incidentalCosts = EXAMPLE_COSTS.filter(c => c.category === 'incidental')
    .reduce((s, c) => s + c.amountEur, 0);

  const totalFirstYear = oneOffCosts + recurringCosts + incidentalCosts;
  const totalPercentage = (totalFirstYear / INVESTMENT_AMOUNT) * 100;

  // RIY calculation (simplified)
  const riy = totalPercentage / holdingPeriod;

  const TABS = [
    { id: 'summary' as TabType, label: 'Summary' },
    { id: 'breakdown' as TabType, label: 'Breakdown' },
    { id: 'scenarios' as TabType, label: 'Scenarios' },
  ];

  const HOLDING_PERIODS: { id: HoldingPeriod; label: string }[] = [
    { id: 1, label: '1 Year' },
    { id: 3, label: '3 Years' },
    { id: 5, label: '5 Years' },
  ];

  const CATEGORY_CONFIG = {
    'one-off': { color: '#3B82F6', label: 'One-off Costs' },
    'recurring': { color: '#F59E0B', label: 'Recurring Costs' },
    'incidental': { color: '#10B981', label: 'Incidental Costs' },
  };

  return (
    <PageLayout>
      <Header
        title="Cost Disclosure (Ex-Ante)"
        subtitle="Before You Invest"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Download PDF'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Regulatory Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Shield size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              PRIIPs Cost Disclosure
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              This document shows all costs you will pay before investing. Required by EU regulation for retail clients.
            </p>
          </div>
        </div>

        {/* Investment Amount */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: c.primary + '15' }}>
              <DollarSign size={22} color={c.primary} />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 11 }}>Example Investment Amount</p>
              <p style={{ color: c.text1, fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                €{INVESTMENT_AMOUNT.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                Estimated for illustration purposes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Total Costs (Year 1)</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                €{totalFirstYear.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>% of Investment</p>
              <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {totalPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </TrCard>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'summary' && (
          <>
            {/* Cost Categories */}
            <PageSection label="Cost Summary">
              <div className="space-y-3">
                <TrCard className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: CATEGORY_CONFIG['one-off'].color }} />
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        One-off Costs
                      </span>
                    </div>
                    <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      €{oneOffCosts.toLocaleString()}
                    </span>
                  </div>

                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Costs paid once when entering or exiting the investment
                  </p>
                </TrCard>

                <TrCard className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: CATEGORY_CONFIG['recurring'].color }} />
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Recurring Costs
                      </span>
                    </div>
                    <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      €{recurringCosts.toLocaleString()}/year
                    </span>
                  </div>

                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Costs paid every year while you hold the investment
                  </p>
                </TrCard>

                <TrCard className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: CATEGORY_CONFIG['incidental'].color }} />
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        Incidental Costs
                      </span>
                    </div>
                    <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      €{incidentalCosts.toLocaleString()}
                    </span>
                  </div>

                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Performance fees (only paid if investment performs well)
                  </p>
                </TrCard>
              </div>
            </PageSection>

            {/* RIY */}
            <PageSection label="Impact on Returns">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#EF4444' + '15' }}>
                    <TrendingDown size={22} color="#EF4444" />
                  </div>

                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      Reduction in Yield (RIY)
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                      How much costs reduce your returns over {holdingPeriod} {holdingPeriod === 1 ? 'year' : 'years'}
                    </p>
                  </div>

                  <span style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>
                    {riy.toFixed(2)}%
                  </span>
                </div>

                <div className="rounded-lg p-3" style={{ background: c.warningBg }}>
                  <div className="flex gap-2">
                    <Info size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                    <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4 }}>
                      Example: If the investment returns 8% per year, after costs you would receive approximately {(8 - riy).toFixed(2)}% per year.
                    </p>
                  </div>
                </div>
              </TrCard>

              <button
                onClick={() => navigate(`${prefix}/trade/copy-trading/riy-calculator`)}
                className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: c.surface2,
                  color: c.text1,
                  height: 44,
                  fontWeight: 600,
                  fontSize: 13,
                  border: `1px solid ${c.border}`,
                }}>
                <Calculator size={16} />
                <span>Use RIY Calculator</span>
                <ChevronRight size={14} />
              </button>
            </PageSection>
          </>
        )}

        {tab === 'breakdown' && (
          <PageSection label="Detailed Cost Breakdown">
            <div className="space-y-3">
              {Object.entries(CATEGORY_CONFIG).map(([categoryKey, config]) => {
                const categoryItems = EXAMPLE_COSTS.filter(c => c.category === categoryKey);
                
                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded" style={{ background: config.color }} />
                      <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {config.label}
                      </span>
                    </div>

                    {categoryItems.map((cost, idx) => (
                      <TrCard key={idx} className="p-3 mb-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                              {cost.type}
                            </p>
                            <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
                              {cost.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                            <p style={{ color: c.text3, fontSize: 9 }}>Amount</p>
                            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                              €{cost.amountEur.toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                            <p style={{ color: c.text3, fontSize: 9 }}>% of Investment</p>
                            <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                              {cost.percentOfInvestment.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </TrCard>
                    ))}
                  </div>
                );
              })}
            </div>
          </PageSection>
        )}

        {tab === 'scenarios' && (
          <PageSection label="Cost Scenarios by Holding Period">
            {/* Holding Period Selector */}
            <div className="flex gap-2 mb-3">
              {HOLDING_PERIODS.map(period => (
                <button
                  key={period.id}
                  onClick={() => setHoldingPeriod(period.id)}
                  className="flex-1 px-4 py-2 rounded-full text-xs transition-all"
                  style={{
                    background: holdingPeriod === period.id ? c.primary : c.surface2,
                    color: holdingPeriod === period.id ? '#fff' : c.text2,
                    fontWeight: holdingPeriod === period.id ? 600 : 500,
                  }}>
                  {period.label}
                </button>
              ))}
            </div>

            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                Total Costs Over {holdingPeriod} {holdingPeriod === 1 ? 'Year' : 'Years'}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>One-off Costs</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    €{oneOffCosts.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>Recurring Costs ({holdingPeriod} years)</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    €{(recurringCosts * holdingPeriod).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: 11 }}>Incidental Costs (estimated)</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    €{(incidentalCosts * holdingPeriod).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg mt-3"
                  style={{ background: '#EF4444' + '15' }}>
                  <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>Total</span>
                  <span style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
                    €{(oneOffCosts + (recurringCosts * holdingPeriod) + (incidentalCosts * holdingPeriod)).toLocaleString()}
                  </span>
                </div>
              </div>
            </TrCard>
          </PageSection>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/ex-post-costs-report`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <FileText size={16} color={c.primary} />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Ex-Post Report</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>

          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/kid-generator`)}
            className="rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} color="#10B981" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>View KID</span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
