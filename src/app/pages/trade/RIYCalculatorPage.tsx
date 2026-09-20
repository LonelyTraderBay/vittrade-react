/**
 * ══════════════════════════════════════════════════════════════
 *  RIYCalculatorPage — Phase 4 Sprint 3 Day 3-4
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Interactive RIY (Reduction in Yield) calculator
 * - Show impact of costs on investment returns
 * - Scenario comparison (with/without costs)
 * - Visual charts for understanding
 * 
 * Compliance:
 * - PRIIPs: RIY calculation methodology
 * - Help clients understand cost impact
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, Info, BarChart3
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RIYCalculatorPage() {
  const c = useThemeColors();
  const [investment, setInvestment] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(8);
  const [totalCosts, setTotalCosts] = useState(4.5);
  const [years, setYears] = useState(5);

  // Calculate projections
  const projections = useMemo(() => {
    const data = [];
    for (let year = 0; year <= years; year++) {
      const withoutCosts = investment * Math.pow(1 + expectedReturn / 100, year);
      const withCosts = investment * Math.pow(1 + (expectedReturn - totalCosts) / 100, year);
      
      data.push({
        year,
        withoutCosts: Math.round(withoutCosts),
        withCosts: Math.round(withCosts),
      });
    }
    return data;
  }, [investment, expectedReturn, totalCosts, years]);

  const finalWithoutCosts = projections[years].withoutCosts;
  const finalWithCosts = projections[years].withCosts;
  const difference = finalWithoutCosts - finalWithCosts;
  const riy = totalCosts;

  return (
    <PageLayout>
      <Header title="RIY Calculator" subtitle="Cost Impact Analysis" back />

      <PageContent gap="relaxed">
        {/* Input Section */}
        <PageSection label="Investment Parameters">
          <TrCard className="p-4">
            <div className="space-y-4">
              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  Initial Investment (€)
                </label>
                <input
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-xl outline-none"
                  style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
                />
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  step="0.1"
                  className="w-full h-12 px-3 rounded-xl outline-none"
                  style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
                />
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  Total Annual Costs (%)
                </label>
                <input
                  type="number"
                  value={totalCosts}
                  onChange={(e) => setTotalCosts(Number(e.target.value))}
                  step="0.1"
                  className="w-full h-12 px-3 rounded-xl outline-none"
                  style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
                />
              </div>

              <div>
                <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                  Holding Period (Years)
                </label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full h-12 px-3 rounded-xl outline-none"
                  style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
                />
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Results */}
        <PageSection label="Impact Analysis">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 10 }}>Without Costs</p>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                €{finalWithoutCosts.toLocaleString()}
              </p>
            </TrCard>

            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 10 }}>With Costs</p>
              <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                €{finalWithCosts.toLocaleString()}
              </p>
            </TrCard>
          </div>

          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Cost Impact</span>
              <span style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>
                -€{difference.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg p-3" style={{ background: c.infoBg }}>
              <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4 }}>
                Over {years} years, costs reduce your investment by €{difference.toLocaleString()} ({((difference / finalWithoutCosts) * 100).toFixed(1)}% loss).
              </p>
            </div>
          </TrCard>
        </PageSection>

        {/* Chart */}
        <PageSection label="Growth Comparison">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projections}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                <XAxis key="x-axis" dataKey="year" stroke={c.text3} style={{ fontSize: 10 }} />
                <YAxis key="y-axis" stroke={c.text3} style={{ fontSize: 10 }} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line key="line-without" type="monotone" dataKey="withoutCosts" name="Without Costs" stroke="#10B981" strokeWidth={2} />
                <Line key="line-with" type="monotone" dataKey="withCosts" name="With Costs" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}