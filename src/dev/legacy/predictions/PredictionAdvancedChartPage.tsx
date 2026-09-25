/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionAdvancedChartPage — Prediction Markets Advanced Feature 2/4
 * ══════════════════════════════════════════════════════════════
 *  Advanced charting with Technical Analysis: Probability chart
 *  with indicators, Volume analysis, Order flow, Support/Resistance
 *  Pattern B — Page with Tabs (Chart/Indicators/Analysis)
 * ══════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { Header } from '@/shared/ui/layout/Header';
import { TabBar } from '@/shared/ui/TabBar';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Info, Eye, EyeOff } from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { PRICE_HISTORY, TABS, type Tab } from '@/dev/mocks/prediction-chart-fixtures';
import { PredictionAdvancedAnalysisPanel } from './PredictionAdvancedAnalysisPanel';

export function PredictionAdvancedChartPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<Tab>('Bieu do');
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1H');
  const [showMA7, setShowMA7] = useState(true);
  const [showMA25, setShowMA25] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const currentPrice = PRICE_HISTORY[PRICE_HISTORY.length - 1].price;
  const priceChange = currentPrice - PRICE_HISTORY[0].price;
  const priceChangePercent = (priceChange / PRICE_HISTORY[0].price) * 100;
  const currentRSI = PRICE_HISTORY[PRICE_HISTORY.length - 1].rsi;

  // Support/Resistance levels
  const supportLevel = 0.62;
  const resistanceLevel = 0.72;

  return (
    <PageLayout>
      <Header title="Advanced Chart" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Bieu do' && (
          <>
            {/* Timeframe Selector */}
            <div className="flex gap-2">
              {(['1H', '4H', '1D', '1W'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className="flex-1 py-2 rounded-xl transition-all"
                  style={{
                    background: timeframe === tf ? c.primary : c.bg,
                    color: timeframe === tf ? '#fff' : c.text1,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${timeframe === tf ? 'transparent' : c.border}`,
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Price Info */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Probability</p>
              <div className="flex items-baseline gap-2">
                <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
                  {(currentPrice * 100).toFixed(1)}%
                </p>
                <div className="flex items-center gap-1">
                  {priceChange >= 0 ? (
                    <ArrowUpRight size={16} color="#10B981" />
                  ) : (
                    <ArrowDownRight size={16} color="#EF4444" />
                  )}
                  <p
                    style={{
                      color: priceChange >= 0 ? c.buy : c.sell,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {priceChange >= 0 ? '+' : ''}
                    {priceChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Probability Chart
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={PRICE_HISTORY}>
                  <defs key="gradient-defs">
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    key="x-axis-main"
                    dataKey="time"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis-main"
                    domain={[0.5, 0.75]}
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-main"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />

                  {/* Support/Resistance Lines */}
                  <ReferenceLine
                    key="ref-support"
                    y={supportLevel}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{ value: 'Support', fill: '#10B981', fontSize: 10 }}
                  />
                  <ReferenceLine
                    key="ref-resistance"
                    y={resistanceLevel}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    label={{ value: 'Resistance', fill: '#EF4444', fontSize: 10 }}
                  />

                  {/* Bollinger Bands */}
                  {showBB && (
                    <>
                      <Line
                        key="line-bb-upper"
                        type="monotone"
                        dataKey="bb_upper"
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                      <Line
                        key="line-bb-lower"
                        type="monotone"
                        dataKey="bb_lower"
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </>
                  )}

                  {/* Moving Averages */}
                  {showMA7 && (
                    <Line
                      key="line-ma7"
                      type="monotone"
                      dataKey="ma7"
                      stroke="#10B981"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  )}
                  {showMA25 && (
                    <Line
                      key="line-ma25"
                      type="monotone"
                      dataKey="ma25"
                      stroke="#8B5CF6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  )}

                  {/* Price Line */}
                  <Area
                    key="area-price"
                    type="monotone"
                    dataKey="price"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Chart */}
            {showVolume && (
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  Trading Volume
                </p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={PRICE_HISTORY}>
                    <XAxis
                      key="x-axis-vol"
                      dataKey="time"
                      tick={{ fill: c.text3, fontSize: 10 }}
                      axisLine={{ stroke: c.border }}
                    />
                    <YAxis
                      key="y-axis-vol"
                      tick={{ fill: c.text3, fontSize: 10 }}
                      axisLine={{ stroke: c.border }}
                    />
                    <Tooltip
                      key="tooltip-vol"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 12,
                        fontSize: 11,
                        color: c.text1,
                      }}
                    />
                    <Bar key="bar-volume" dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart Controls */}
            <PageSection label="Lop hien thi">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'MA(7)', state: showMA7, setter: setShowMA7, color: c.buy },
                  { label: 'MA(25)', state: showMA25, setter: setShowMA25, color: '#8B5CF6' },
                  { label: 'Bollinger Bands', state: showBB, setter: setShowBB, color: c.warn },
                  { label: 'Volume', state: showVolume, setter: setShowVolume, color: c.primary },
                ].map((control) => (
                  <button
                    key={control.label}
                    onClick={() => control.setter(!control.state)}
                    className="rounded-xl p-3 flex items-center justify-between transition-all hover:opacity-90"
                    style={{
                      background: control.state ? `${control.color}15` : c.bg,
                      border: `1px solid ${control.state ? control.color : c.border}`,
                    }}
                  >
                    <span
                      style={{
                        color: control.state ? control.color : c.text2,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {control.label}
                    </span>
                    {control.state ? (
                      <Eye size={14} color={control.color} />
                    ) : (
                      <EyeOff size={14} color={c.text3} />
                    )}
                  </button>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'Chi bao' && (
          <>
            {/* RSI */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                  RSI (Relative Strength Index)
                </p>
                <p
                  style={{
                    color: currentRSI > 70 ? c.sell : currentRSI < 30 ? c.buy : c.warn,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {currentRSI.toFixed(0)}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={PRICE_HISTORY}>
                  <XAxis
                    key="x-axis-rsi"
                    dataKey="time"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis-rsi"
                    domain={[0, 100]}
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-rsi"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <ReferenceLine key="ref-70" y={70} stroke="#EF4444" strokeDasharray="3 3" />
                  <ReferenceLine key="ref-30" y={30} stroke="#10B981" strokeDasharray="3 3" />
                  <Line
                    key="line-rsi"
                    type="monotone"
                    dataKey="rsi"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-3 flex items-center gap-2">
                <Info size={12} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>
                  RSI &gt; 70: Overbought · RSI &lt; 30: Oversold
                </p>
              </div>
            </div>

            {/* Indicator Summary */}
            <PageSection label="Technical Indicators">
              <div className="space-y-2">
                {[
                  {
                    name: 'Moving Average (7)',
                    signal: 'BUY',
                    strength: 'Strong',
                    color: c.buy,
                    desc: 'Price above MA7',
                  },
                  {
                    name: 'Moving Average (25)',
                    signal: 'BUY',
                    strength: 'Moderate',
                    color: c.buy,
                    desc: 'Price above MA25',
                  },
                  {
                    name: 'RSI',
                    signal: 'NEUTRAL',
                    strength: 'Weak',
                    color: c.warn,
                    desc: 'Neither overbought nor oversold',
                  },
                  {
                    name: 'Bollinger Bands',
                    signal: 'BUY',
                    strength: 'Moderate',
                    color: c.buy,
                    desc: 'Price near lower band',
                  },
                ].map((indicator) => (
                  <div
                    key={indicator.name}
                    className="rounded-xl p-3"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {indicator.name}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{indicator.desc}</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          background: `${indicator.color}20`,
                          color: indicator.color,
                        }}
                      >
                        {indicator.signal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{ height: 4, background: c.bg }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width:
                              indicator.strength === 'Strong'
                                ? '80%'
                                : indicator.strength === 'Moderate'
                                  ? '50%'
                                  : '25%',
                            background: indicator.color,
                          }}
                        />
                      </div>
                      <p style={{ color: c.text3, fontSize: 10 }}>{indicator.strength}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Overall Signal */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Overall Signal</p>
                <TrendingUp size={18} color="#10B981" />
              </div>
              <p style={{ color: c.buy, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                BULLISH
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                3/4 indicators show buy signal. Momentum is positive.
              </p>
            </div>
          </>
        )}

        {tab === 'Phan tich' && (
          <PredictionAdvancedAnalysisPanel
            c={c}
            currentPrice={currentPrice}
            supportLevel={supportLevel}
            resistanceLevel={resistanceLevel}
          />
        )}
      </PageContent>
    </PageLayout>
  );
}
