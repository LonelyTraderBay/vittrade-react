import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Download, Calendar, DollarSign, Percent } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useIsDark } from '../../hooks/useIsDark';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface EarningsData {
  date: string;
  btc: number;
  usdt: number;
  eth: number;
  sol: number;
  lp: number;
  total: number;
}

interface APYTrendData {
  date: string;
  flexible: number;
  fixed: number;
  defi: number;
}

interface ROIData {
  month: string;
  staking: number;
  holding: number;
}

interface ProductPerformance {
  product: string;
  asset: string;
  invested: number;
  earned: number;
  roi: number;
  apy: number;
  color: string;
}

const EARNINGS_BREAKDOWN: EarningsData[] = [
  { date: '01/01', btc: 0, usdt: 0, eth: 0, sol: 0, lp: 0, total: 0 },
  { date: '15/01', btc: 5.2, usdt: 12.3, eth: 0, sol: 0, lp: 0, total: 17.5 },
  { date: '01/02', btc: 10.8, usdt: 24.6, eth: 15.2, sol: 0, lp: 0, total: 50.6 },
  { date: '15/02', btc: 16.2, usdt: 36.9, eth: 32.4, sol: 18.5, lp: 5.8, total: 109.8 },
  { date: '01/03', btc: 21.5, usdt: 49.2, eth: 51.6, sol: 42.3, lp: 14.2, total: 178.8 },
  { date: '07/03', btc: 19.58, usdt: 18.74, eth: 98, sol: 156, lp: 23.5, total: 315.82 },
];

const APY_TRENDS: APYTrendData[] = [
  { date: '01/01', flexible: 4.5, fixed: 6.2, defi: 22.5 },
  { date: '15/01', flexible: 4.3, fixed: 6.0, defi: 21.8 },
  { date: '01/02', flexible: 4.8, fixed: 6.5, defi: 23.2 },
  { date: '15/02', flexible: 5.0, fixed: 7.0, defi: 24.5 },
  { date: '01/03', flexible: 4.7, fixed: 6.8, defi: 22.9 },
  { date: '07/03', flexible: 4.5, fixed: 6.5, defi: 20.8 },
];

const ROI_COMPARISON: ROIData[] = [
  { month: 'T1', staking: 2.1, holding: -3.5 },
  { month: 'T2', staking: 4.8, holding: 1.2 },
  { month: 'T3', staking: 7.2, holding: 5.8 },
  { month: 'T4', staking: 9.8, holding: 7.2 },
  { month: 'T5', staking: 12.5, holding: 9.1 },
  { month: 'T6', staking: 15.3, holding: 11.8 },
];

const PRODUCT_PERFORMANCE: ProductPerformance[] = [
  { product: 'BTC Fixed 90D', asset: 'BTC', invested: 3377, earned: 19.58, roi: 0.58, apy: 5.8, color: '#F7931A' },
  { product: 'USDT Flexible', asset: 'USDT', invested: 2500, earned: 18.74, roi: 0.75, apy: 6.5, color: '#26A17B' },
  { product: 'ETH Fixed 60D', asset: 'ETH', invested: 4200, earned: 98, roi: 2.33, apy: 7.2, color: '#627EEA' },
  { product: 'SOL Fixed 30D', asset: 'SOL', invested: 6500, earned: 156, roi: 2.4, apy: 9.8, color: '#9945FF' },
  { product: 'ETH-USDT LP', asset: 'LP', invested: 1000, earned: 23.5, roi: 2.35, apy: 18.7, color: '#06B6D4' },
];

export function StakingAnalyticsPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const [tab, setTab] = useState<'earnings' | 'apy' | 'roi' | 'products'>('earnings');
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState({ principal: '', apy: '', days: '', compound: false });

  const totalEarned = EARNINGS_BREAKDOWN[EARNINGS_BREAKDOWN.length - 1].total;
  const avgAPY = 7.2;
  const bestPerformer = PRODUCT_PERFORMANCE.reduce((best, p) => p.roi > best.roi ? p : best);

  const calculateCompound = () => {
    const P = parseFloat(calcInput.principal || '0');
    const r = parseFloat(calcInput.apy || '0') / 100;
    const t = parseFloat(calcInput.days || '0') / 365;
    
    if (calcInput.compound) {
      // Daily compounding: A = P(1 + r/365)^(365*t)
      const A = P * Math.pow(1 + r / 365, 365 * t);
      return { final: A, earned: A - P };
    } else {
      // Simple interest: A = P(1 + r*t)
      const A = P * (1 + r * t);
      return { final: A, earned: A - P };
    }
  };

  const calcResult = calculateCompound();

  const handleExport = () => {
    alert('Xuất báo cáo CSV/PDF sẽ sớm ra mắt');
  };

  return (
    <PageLayout>
      <Header title="Phân tích Hiệu suất" back />

      <BottomSheetV2
        open={showCalc}
        onClose={() => setShowCalc(false)}
        title="Tính lợi nhuận">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
              Số lượng gốc (USD)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="1000"
              value={calcInput.principal}
              onChange={e => setCalcInput({ ...calcInput, principal: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
              APY (%)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="7.5"
              value={calcInput.apy}
              onChange={e => setCalcInput({ ...calcInput, apy: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
              Số ngày
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="90"
              value={calcInput.days}
              onChange={e => setCalcInput({ ...calcInput, days: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                fontFamily: 'monospace',
              }}
            />
          </div>
          <button
            onClick={() => setCalcInput({ ...calcInput, compound: !calcInput.compound })}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: c.surface2 }}>
            <div
              className="w-5 h-5 rounded-md border flex items-center justify-center"
              style={{
                borderColor: calcInput.compound ? '#10B981' : c.borderSolid,
                background: calcInput.compound ? '#10B981' : 'transparent',
              }}>
              {calcInput.compound && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Auto-compound</p>
              <p style={{ color: c.text3, fontSize: 11 }}>Lãi kép hàng ngày</p>
            </div>
          </button>

          {calcInput.principal && calcInput.apy && calcInput.days && (
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 12 }}>Kết quả:</p>
              <BottomSheetRow label="Số lượng gốc" value={`$${parseFloat(calcInput.principal).toLocaleString()}`} />
              <BottomSheetRow
                label="Lợi nhuận"
                value={`+$${calcResult.earned.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                valueColor="#10B981"
              />
              <BottomSheetRow
                label="Tổng nhận về"
                value={`$${calcResult.final.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                highlight
              />
              <BottomSheetRow
                label="ROI"
                value={`${((calcResult.earned / parseFloat(calcInput.principal)) * 100).toFixed(2)}%`}
                valueColor="#10B981"
              />
            </div>
          )}
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Summary */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign size={14} color="#10B981" />
                <p style={{ color: c.text3, fontSize: 11 }}>Tổng thu nhập</p>
              </div>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(totalEarned)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Percent size={14} color="#3B82F6" />
                <p style={{ color: c.text3, fontSize: 11 }}>APY TB</p>
              </div>
              <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700 }}>
                {avgAPY}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={14} color="#F59E0B" />
                <p style={{ color: c.text3, fontSize: 11 }}>Tốt nhất</p>
              </div>
              <p style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>
                {bestPerformer.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowCalc(true)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              style={{ background: c.primary, color: '#FFF' }}>
              <BarChart3 size={14} />
              Tính lợi nhuận
            </button>
            <button
              onClick={handleExport}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              style={{ background: c.surface2, color: c.text1 }}>
              <Download size={14} />
              Xuất báo cáo
            </button>
          </div>
        </TrCard>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'earnings', label: 'Thu nhập' },
            { id: 'apy', label: 'APY Trends' },
            { id: 'roi', label: 'ROI So sánh' },
            { id: 'products', label: 'Sản phẩm' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'earnings' && (
          <>
            <PageSection label="Phân tích Thu nhập theo Tài sản">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={EARNINGS_BREAKDOWN}>
                    <CartesianGrid
                      key="grid"
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                      vertical={false}
                    />
                    <XAxis
                      key="x-axis"
                      dataKey="date"
                      stroke={c.text3}
                      tick={{ fill: c.text3, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      key="y-axis"
                      stroke={c.text3}
                      tick={{ fill: c.text3, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.borderSolid}`,
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name.toUpperCase()]}
                    />
                    <Legend
                      key="legend"
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => value.toUpperCase()}
                    />
                    <Area
                      key="analytics-area-btc"
                      type="monotone"
                      dataKey="btc"
                      stackId="1"
                      stroke="#F7931A"
                      fill="#F7931A"
                      fillOpacity={0.6}
                    />
                    <Area
                      key="analytics-area-usdt"
                      type="monotone"
                      dataKey="usdt"
                      stackId="1"
                      stroke="#26A17B"
                      fill="#26A17B"
                      fillOpacity={0.6}
                    />
                    <Area
                      key="analytics-area-eth"
                      type="monotone"
                      dataKey="eth"
                      stackId="1"
                      stroke="#627EEA"
                      fill="#627EEA"
                      fillOpacity={0.6}
                    />
                    <Area
                      key="analytics-area-sol"
                      type="monotone"
                      dataKey="sol"
                      stackId="1"
                      stroke="#9945FF"
                      fill="#9945FF"
                      fillOpacity={0.6}
                    />
                    <Area
                      key="analytics-area-lp"
                      type="monotone"
                      dataKey="lp"
                      stackId="1"
                      stroke="#06B6D4"
                      fill="#06B6D4"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TrCard>
            </PageSection>

            <PageSection label="Thu nhập theo Tài sản">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { asset: 'BTC', earned: 19.58, color: '#F7931A' },
                  { asset: 'USDT', earned: 18.74, color: '#26A17B' },
                  { asset: 'ETH', earned: 98, color: '#627EEA' },
                  { asset: 'SOL', earned: 156, color: '#9945FF' },
                  { asset: 'LP', earned: 23.5, color: '#06B6D4' },
                ].map(item => (
                  <TrCard key={item.asset} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.asset}</p>
                    </div>
                    <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                      +${item.earned.toFixed(2)}
                    </p>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'apy' && (
          <PageSection label="Xu hướng APY (6 tháng)">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={APY_TRENDS}>
                  <CartesianGrid
                    key="grid"
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    vertical={false}
                  />
                  <XAxis
                    key="x-axis"
                    dataKey="date"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    key="y-axis"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.borderSolid}`,
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'flexible' ? 'Linh hoạt' : name === 'fixed' ? 'Cố định' : 'DeFi'
                    ]}
                  />
                  <Legend
                    key="legend"
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => value === 'flexible' ? 'Linh hoạt' : value === 'fixed' ? 'Cố định' : 'DeFi'}
                  />
                  <Line
                    key="analytics-line-flexible"
                    type="monotone"
                    dataKey="flexible"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    key="analytics-line-fixed"
                    type="monotone"
                    dataKey="fixed"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    key="analytics-line-defi"
                    type="monotone"
                    dataKey="defi"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="rounded-xl p-3 mt-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                  💡 <strong>Insight:</strong> APY DeFi biến động cao (±15-25%) do thay đổi thanh khoản pool. APY Fixed và Flexible ổn định hơn (±4-7%).
                </p>
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'roi' && (
          <PageSection label="ROI: Staking vs Holding">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ROI_COMPARISON}>
                  <CartesianGrid
                    key="grid"
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    vertical={false}
                  />
                  <XAxis
                    key="x-axis"
                    dataKey="month"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    key="y-axis"
                    stroke={c.text3}
                    tick={{ fill: c.text3, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.borderSolid}`,
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'staking' ? 'Staking' : 'Holding'
                    ]}
                  />
                  <Legend
                    key="legend"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar
                    key="analytics-bar-staking"
                    dataKey="staking"
                    fill="#10B981"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    key="analytics-bar-holding"
                    dataKey="holding"
                    fill="#EF4444"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="rounded-xl p-3 mt-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                  💡 <strong>Insight:</strong> Staking cho ROI cao hơn +3.5% so với holding sau 6 tháng nhờ phần thưởng hàng ngày.
                </p>
              </div>
            </TrCard>
          </PageSection>
        )}

        {tab === 'products' && (
          <PageSection label="Hiệu suất theo Sản phẩm">
            <div className="flex flex-col gap-3">
              {PRODUCT_PERFORMANCE.map(product => (
                <TrCard key={product.product} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `${product.color}22`, border: `1.5px solid ${product.color}44` }}>
                      <span style={{ color: product.color, fontSize: 10, fontWeight: 700 }}>
                        {product.asset.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{product.product}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>APY: {product.apy}%</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                        +{product.roi.toFixed(2)}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 10 }}>ROI</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Đầu tư</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(product.invested)}
                      </p>
                    </div>
                    <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Thu nhập</p>
                      <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                        +${product.earned.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: product.color,
                        width: `${Math.min(100, (product.roi / bestPerformer.roi) * 100)}%`,
                      }}
                    />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {/* Bottom Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Dữ liệu được cập nhật theo thời gian thực. APY có thể thay đổi dựa trên điều kiện thị trường. ROI tính theo giá trị USD tại thời điểm hiện tại.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}