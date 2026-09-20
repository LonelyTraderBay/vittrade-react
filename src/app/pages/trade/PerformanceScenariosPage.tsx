/**
 * ══════════════════════════════════════════════════════════════
 *  PerformanceScenariosPage — Phase 4 Sprint 3 Day 9-10
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - PRIIPs performance scenarios (4 scenarios required)
 * - Stress / Unfavorable / Moderate / Favorable
 * - Show potential outcomes
 * - Educational: not a guarantee
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

type HoldingPeriod = 1 | 3 | 5;

const SCENARIOS = {
  stress: { label: 'Stress', return: -25, color: '#EF4444', icon: TrendingDown },
  unfavorable: { label: 'Unfavorable', return: -5, color: '#F59E0B', icon: TrendingDown },
  moderate: { label: 'Moderate', return: 8, color: '#3B82F6', icon: Minus },
  favorable: { label: 'Favorable', return: 22, color: '#10B981', icon: TrendingUp },
};

export function PerformanceScenariosPage() {
  const c = useThemeColors();
  const [holdingPeriod, setHoldingPeriod] = useState<HoldingPeriod>(3);
  const investment = 10000;

  const calculateOutcome = (annualReturn: number, years: number) => {
    return investment * Math.pow(1 + annualReturn / 100, years);
  };

  return (
    <PageLayout>
      <Header title="Performance Scenarios" subtitle="Potential Outcomes" back />

      <PageContent gap="relaxed">
        {/* Disclaimer */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <AlertTriangle size={16} color={c.warningText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Not a Guarantee
            </p>
            <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              These scenarios are illustrations based on past performance and statistical models. Actual results may differ significantly.
            </p>
          </div>
        </div>

        {/* Investment Amount */}
        <TrCard className="p-4">
          <div className="text-center">
            <p style={{ color: c.text3, fontSize: 11 }}>Example Investment</p>
            <p style={{ color: c.text1, fontSize: 28, fontWeight: 700, marginTop: 4 }}>
              €{investment.toLocaleString()}
            </p>
          </div>
        </TrCard>

        {/* Holding Period Selector */}
        <div className="flex gap-2">
          {[1, 3, 5].map(period => (
            <button
              key={period}
              onClick={() => setHoldingPeriod(period as HoldingPeriod)}
              className="flex-1 px-4 py-2 rounded-full text-xs transition-all"
              style={{
                background: holdingPeriod === period ? c.primary : c.surface2,
                color: holdingPeriod === period ? '#fff' : c.text2,
                fontWeight: holdingPeriod === period ? 600 : 500,
              }}>
              {period} {period === 1 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>

        {/* Scenarios */}
        <PageSection label="Potential Outcomes">
          <div className="space-y-3">
            {Object.entries(SCENARIOS).map(([key, scenario]) => {
              const Icon = scenario.icon;
              const outcome = calculateOutcome(scenario.return, holdingPeriod);
              const profit = outcome - investment;

              return (
                <TrCard key={key} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: scenario.color + '15' }}>
                      <Icon size={22} color={scenario.color} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          {scenario.label} Scenario
                        </span>
                        <span style={{ color: scenario.color, fontSize: 16, fontWeight: 700 }}>
                          {scenario.return > 0 ? '+' : ''}{scenario.return}% p.a.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 9 }}>Value After {holdingPeriod}Y</p>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                            €{Math.round(outcome).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 9 }}>Profit/Loss</p>
                          <p style={{
                            color: profit >= 0 ? '#10B981' : '#EF4444',
                            fontSize: 13,
                            fontWeight: 700,
                            marginTop: 1
                          }}>
                            {profit >= 0 ? '+' : ''}€{Math.round(profit).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Info */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Info size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4 }}>
            Scenarios calculated using statistical models based on historical volatility and returns. The stress scenario shows what you might get back in extreme market conditions.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
