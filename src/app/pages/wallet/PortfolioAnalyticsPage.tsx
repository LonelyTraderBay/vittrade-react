import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieChartIcon, DollarSign, ArrowUpRight, ArrowDownRight, Info, Target, Award } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { USER_ASSETS } from '../../data/mockData';
import { fmtUsd, fmtPct, fmtSignedUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';

const PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
const ASSET_COLORS = ['#F7931A', '#627EEA', '#9945FF', '#26A17B', '#F3BA2F', '#0033AD'];

function generatePortfolioHistory(period: string): { time: string; value: number; pnl: number }[] {
  const totalNow = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);
  const points: Record<string, number> = { '1D': 24, '1W': 7, '1M': 30, '3M': 90, '1Y': 52, 'ALL': 60 };
  const n = points[period] ?? 30;
  const data = [];
  let v = totalNow * 0.82;
  const now = Date.now();
  const step: Record<string, number> = { '1D': 3600000, '1W': 86400000, '1M': 86400000, '3M': 86400000*3, '1Y': 86400000*7, 'ALL': 86400000*30 };
  const stepMs = step[period] ?? 86400000;
  for (let i = n; i >= 0; i--) {
    const noise = (Math.random() - 0.46) * v * 0.018;
    v = Math.max(totalNow * 0.6, Math.min(totalNow * 1.15, v + noise));
    const ts = new Date(now - i * stepMs);
    let label = '';
    if (period === '1D') label = `${ts.getHours().toString().padStart(2,'0')}:00`;
    else if (period === '1W' || period === '1M') label = `${ts.getDate()}/${ts.getMonth()+1}`;
    else label = `T${ts.getMonth()+1}`;
    data.push({ time: label, value: parseFloat(v.toFixed(2)), pnl: parseFloat((v - totalNow * 0.82).toFixed(2)) });
  }
  return data;
}

const MONTHLY_PNL = [
  { month: 'T9', pnl: 1240 }, { month: 'T10', pnl: -580 }, { month: 'T11', pnl: 2100 },
  { month: 'T12', pnl: 890 }, { month: 'T1', pnl: -340 }, { month: 'T2', pnl: 1750 },
];

const TOP_PERFORMERS = [
  { symbol: 'SOL', name: 'Solana', change: 42.3, usd: 1240, color: '#9945FF' },
  { symbol: 'BTC', name: 'Bitcoin', change: 18.7, usd: 2310, color: '#F7931A' },
  { symbol: 'BNB', name: 'BNB', change: 12.4, usd: 680, color: '#F3BA2F' },
];

const WORST_PERFORMERS = [
  { symbol: 'DOT', name: 'Polkadot', change: -8.2, usd: -234, color: '#E6007A' },
  { symbol: 'XRP', name: 'Ripple', change: -3.1, usd: -89, color: '#00AAE4' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  const c = useThemeColors();
  if (active && payload && payload.length) {
    const val = payload[0]?.value ?? 0;
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
        <p style={{ color: c.text2 }}>{label}</p>
        <p style={{ color: c.text1, fontWeight: 700, fontFamily: 'monospace' }}>
          {fmtUsd(val)}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioAnalyticsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [period, setPeriod] = useState('1M');
  const [view, setView] = useState<'overview' | 'allocation' | 'pnl'>('overview');

  const historyData = useMemo(() => generatePortfolioHistory(period), [period]);
  const totalUSD = USER_ASSETS.reduce((s, a) => s + a.usdValue, 0);
  const startValue = historyData[0]?.value ?? totalUSD;
  const totalReturn = totalUSD - startValue;
  const totalReturnPct = (totalReturn / startValue) * 100;
  const isPositive = totalReturn >= 0;

  const pieData = USER_ASSETS.map((a, i) => ({
    name: a.symbol,
    value: parseFloat(((a.usdValue / totalUSD) * 100).toFixed(1)),
    usd: a.usdValue,
    color: ASSET_COLORS[i] ?? '#8B95B3',
  }));

  return (
    <PageLayout>
      <Header title="Phân tích Danh mục" subtitle="Phân tích · Wallet" back />

      <PageContent gap="default">
      {/* Total Value Card */}
      <div className="rounded-3xl p-5"
        style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2550 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <p style={{ color: c.text2, fontSize: 12 }}>Tổng giá trị danh mục</p>
        <div className="flex items-end gap-3 mt-1">
          <span style={{ color: c.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtUsd(totalUSD)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
            style={{ background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
            {isPositive ? <TrendingUp size={13} color="#10B981" /> : <TrendingDown size={13} color="#EF4444" />}
            <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              {isPositive ? '+' : ''}{fmtUsd(Math.abs(totalReturn), { prefix: false })}
            </span>
            <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 12 }}>
              ({fmtPct(totalReturnPct)})
            </span>
          </div>
          <span style={{ color: c.text3, fontSize: 11 }}>so với đầu kỳ</span>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mt-4">
          {[
            { label: 'Lợi nhuận tốt nhất', value: '+$2,310', sub: 'BTC', color: '#10B981' },
            { label: 'Thua lỗ nhất', value: '-$234', sub: 'DOT', color: '#EF4444' },
            { label: 'Tài sản', value: `${USER_ASSETS.length}`, sub: 'loại coin', color: '#3B82F6' },
          ].map((s, i) => (
            <div key={s.label} className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
              <p style={{ color: c.text2, fontSize: 10 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* View switcher */}
      <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
        {[
          { id: 'overview', label: 'Tổng quan', icon: BarChart2 },
          { id: 'allocation', label: 'Phân bổ', icon: PieChartIcon },
          { id: 'pnl', label: 'Lãi/Lỗ', icon: TrendingUp },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id as any)}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold"
            style={{ background: view === v.id ? c.chipActiveBg : 'transparent', color: view === v.id ? c.chipActiveText : c.chipText }}>
            <v.icon size={13} />
            {v.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {view === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Period selector */}
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: period === p ? c.chipActiveBg : c.chipBg,
                  color: period === p ? c.chipActiveText : c.chipText,
                }}>
                {p}
              </button>
            ))}
          </div>

          {/* Area Chart */}
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={historyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs key="gradient-defs">
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis key="pa-x" dataKey="time" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis key="pa-y" hide domain={['auto', 'auto']} />
                <Tooltip key="pa-tip" content={<CustomTooltip />} />
                <Area
                  key="pa-area"
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#10B981' : '#EF4444'}
                  strokeWidth={2}
                  fill="url(#portfolioGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: isPositive ? '#10B981' : '#EF4444', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TrCard>

          {/* Performance metrics */}
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 12 }}>Chỉ số hiệu suất</p>
            {[
              { label: 'Lợi nhuận theo kỳ', value: fmtPct(totalReturnPct), color: isPositive ? '#10B981' : '#EF4444' },
              { label: 'Lợi nhuận tuyệt đối', value: fmtSignedUsd(totalReturn), color: isPositive ? '#10B981' : '#EF4444' },
              { label: 'Giá trị cao nhất', value: fmtUsd(Math.max(...historyData.map(d => d.value))), color: c.text1 },
              { label: 'Giá trị thấp nhất', value: fmtUsd(Math.min(...historyData.map(d => d.value))), color: c.text1 },
              { label: 'Số lệnh thực hiện', value: '47', color: c.text1 },
              { label: 'Phí giao dịch tổng', value: '$38.42', color: '#F59E0B' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
                <span style={{ color: row.color, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
              </div>
            ))}
          </TrCard>

          {/* Asset list */}
          <TrCard overflow>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Vị thế hiện tại</p>
            </div>
            {USER_ASSETS.map((asset, i) => {
              const pct = (asset.usdValue / totalUSD) * 100;
              const color = ASSET_COLORS[i] ?? c.text2;
              return (
                <div key={asset.id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < USER_ASSETS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: color + '22', border: `1.5px solid ${color}44` }}>
                    <span style={{ color, fontSize: 9, fontWeight: 700 }}>{asset.symbol.slice(0,3)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{asset.symbol}</span>
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(asset.usdValue)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="flex-1 mr-2">
                        <div className="h-1 rounded-full" style={{ background: c.borderSolid }}>
                          <div className="h-full rounded-full" style={{ background: color, width: `${pct}%` }} />
                        </div>
                      </div>
                      <span style={{ color: asset.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
                        {fmtPct(asset.change24h)}
                      </span>
                    </div>
                    <span style={{ color: c.text3, fontSize: 11 }}>{pct.toFixed(1)}% danh mục</span>
                  </div>
                </div>
              );
            })}
          </TrCard>
        </div>
      )}

      {/* === ALLOCATION === */}
      {view === 'allocation' && (
        <div className="flex flex-col gap-4">
          {/* Donut via recharts */}
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Phân bổ danh mục</span>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie key="pa-pie" data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col gap-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span style={{ color: c.text2, fontSize: 12, flex: 1 }}>{d.name}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TrCard>

          {/* Detail table */}
          <TrCard overflow>
            <div className="grid grid-cols-4 px-4 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
              {['Tài sản', 'Tỷ lệ', 'Giá trị', '24h'].map(h => (
                <span key={h} style={{ color: c.text3, fontSize: 11 }}>{h}</span>
              ))}
            </div>
            {pieData.map((d, i) => (
              <div key={d.name} className="grid grid-cols-4 px-4 py-3 items-center"
                style={{ borderBottom: i < pieData.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                </div>
                <span style={{ color: c.text2, fontSize: 12 }}>{d.value}%</span>
                <span style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace' }}>
                  {fmtUsd(d.usd, { decimals: 0 })}
                </span>
                <span style={{ color: USER_ASSETS[i]?.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  {fmtPct(USER_ASSETS[i]?.change24h ?? 0, 1)}
                </span>
              </div>
            ))}
          </TrCard>

          {/* Concentration risk */}
          <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
            <div className="flex items-start gap-2">
              <Info size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>Rủi ro tập trung</p>
                <p style={{ color: c.text2, fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
                  Top 3 tài sản chiếm {(pieData.slice(0,3).reduce((s,d)=>s+d.value,0)).toFixed(1)}% danh mục. Cân nhắc đa dạng hóa để giảm rủi ro.
                </p>
              </div>
            </div>
          </TrCard>
        </div>
      )}

      {/* === P&L === */}
      {view === 'pnl' && (
        <div className="flex flex-col gap-4">
          {/* Monthly PnL bar chart */}
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Lãi/Lỗ theo tháng</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MONTHLY_PNL} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis key="pnl-x" dataKey="month" tick={{ fill: c.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis key="pnl-y" hide />
                <Tooltip
                  key="pnl-tip"
                  contentStyle={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: c.text1 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'PnL']}
                />
                <Bar key="pnl-bar" dataKey="pnl" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {MONTHLY_PNL.map((entry, i) => (
                    <Cell key={entry.month} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TrCard>

          {/* Top performers */}
          <TrCard className="p-4">
            <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              <TrendingUp size={14} className="inline mr-1" />Hiệu suất tốt nhất
            </p>
            {TOP_PERFORMERS.map((p, i) => (
              <div key={p.symbol} className="flex items-center gap-3 py-2" style={{ borderBottom: i < TOP_PERFORMERS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: p.color + '22' }}>
                  <span style={{ color: p.color, fontSize: 9, fontWeight: 700 }}>{p.symbol.slice(0,3)}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{p.symbol}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{p.name}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>+{p.change}%</p>
                  <p style={{ color: '#10B981', fontSize: 11 }}>+${p.usd.toLocaleString()}</p>
                </div>
                <ArrowUpRight size={16} color="#10B981" />
              </div>
            ))}
          </TrCard>

          {/* Worst performers */}
          <TrCard className="p-4">
            <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              <TrendingDown size={14} className="inline mr-1" />Hiệu suất kém nhất
            </p>
            {WORST_PERFORMERS.map((p, i) => (
              <div key={p.symbol} className="flex items-center gap-3 py-2" style={{ borderBottom: i < WORST_PERFORMERS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: p.color + '22' }}>
                  <span style={{ color: p.color, fontSize: 9, fontWeight: 700 }}>{p.symbol.slice(0,3)}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{p.symbol}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{p.name}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>{p.change}%</p>
                  <p style={{ color: '#EF4444', fontSize: 11 }}>${p.usd.toLocaleString()}</p>
                </div>
                <ArrowDownRight size={16} color="#EF4444" />
              </div>
            ))}
          </TrCard>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Win rate', value: '68.1%', icon: Target, color: '#10B981' },
              { label: 'Tháng tốt nhất', value: '+$2,100', icon: Award, color: '#F59E0B' },
              { label: 'Lệnh thắng', value: '32', icon: TrendingUp, color: '#10B981' },
              { label: 'Lệnh thua', value: '15', icon: TrendingDown, color: '#EF4444' },
            ].map((s, i) => (
              <TrCard key={s.label} className="p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: s.color + '22' }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <p style={{ color: c.text3, fontSize: 11 }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 17, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
              </TrCard>
            ))}
          </div>
        </div>
      )}
      </PageContent>
    </PageLayout>
  );
}