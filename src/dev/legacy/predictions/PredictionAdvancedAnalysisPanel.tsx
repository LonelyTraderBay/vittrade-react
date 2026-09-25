import { Info, Target, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import { PageSection } from '@/shared/ui/layout/PageContent';
import { ORDER_FLOW } from '@/dev/mocks/prediction-chart-fixtures';

interface Props {
  c: ThemeColors;
  currentPrice: number;
  supportLevel: number;
  resistanceLevel: number;
}

export function PredictionAdvancedAnalysisPanel({
  c,
  currentPrice,
  supportLevel,
  resistanceLevel,
}: Props) {
  return (
    <>
      {/* Order Flow */}
      <div
        className="rounded-2xl p-4"
        style={{ background: c.surface, border: `1px solid ${c.border}` }}
      >
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Order Flow (Buy vs Sell Pressure)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ORDER_FLOW} layout="vertical">
            <XAxis key="x-axis-of" type="number" tick={{ fill: c.text3, fontSize: 10 }} />
            <YAxis
              key="y-axis-of"
              dataKey="price"
              type="category"
              tick={{ fill: c.text3, fontSize: 10 }}
            />
            <Tooltip
              key="tooltip-of"
              contentStyle={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                fontSize: 11,
                color: c.text1,
              }}
            />
            <Bar key="bar-buy" dataKey="buyVolume" fill="#10B981" stackId="stack" />
            <Bar key="bar-sell" dataKey="sellVolume" fill="#EF4444" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c.buy }} />
            <p style={{ color: c.text2, fontSize: 11 }}>Buy Volume</p>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c.sell }} />
            <p style={{ color: c.text2, fontSize: 11 }}>Sell Volume</p>
          </div>
        </div>
      </div>

      {/* Support/Resistance */}
      <PageSection label="Support & Resistance">
        <div className="space-y-2">
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Resistance</p>
              <Target size={14} color="#EF4444" />
            </div>
            <p style={{ color: c.sell, fontSize: 18, fontWeight: 700 }}>
              {(resistanceLevel * 100).toFixed(1)}%
            </p>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
              {((currentPrice - resistanceLevel) * 100).toFixed(1)}% to reach
            </p>
          </div>

          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Support</p>
              <Target size={14} color="#10B981" />
            </div>
            <p style={{ color: c.buy, fontSize: 18, fontWeight: 700 }}>
              {(supportLevel * 100).toFixed(1)}%
            </p>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
              {((currentPrice - supportLevel) * 100).toFixed(1)}% above support
            </p>
          </div>
        </div>
      </PageSection>

      {/* Pattern Recognition */}
      <div
        className="rounded-2xl p-4"
        style={{ background: c.surface, border: `1px solid ${c.border}` }}
      >
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Pattern Recognition
        </p>
        <div className="space-y-3">
          {[
            { pattern: 'Ascending Triangle', confidence: 72, bullish: true },
            { pattern: 'Higher Lows', confidence: 68, bullish: true },
            { pattern: 'Volume Breakout', confidence: 54, bullish: true },
          ].map((item) => (
            <div key={item.pattern} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.pattern}</p>
                  {item.bullish && <TrendingUp size={12} color="#10B981" />}
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 4, background: c.bg }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${item.confidence}%`,
                      background: item.bullish ? c.buy : c.sell,
                    }}
                  />
                </div>
              </div>
              <p
                style={{
                  color: item.bullish ? c.buy : c.sell,
                  fontSize: 13,
                  fontWeight: 700,
                  marginLeft: 12,
                }}
              >
                {item.confidence}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl p-3 flex items-start gap-2"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
        }}
      >
        <Info size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
          Phan tich ky thuat chi mang tinh tham khao. Khong dam bao ket qua tuong lai. Ket hop voi
          nghien cuu co ban de quyet dinh.
        </p>
      </div>
    </>
  );
}
