import React, { useState } from 'react';
import { useParams } from 'react-router';
import { BarChart3, Users, Target, Shield, TrendingUp, TrendingDown, Clock, Copy, Star, ChevronRight, AlertTriangle, Calendar, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtUsd, fmtPct, fmtCompact, fmtSignedUsd } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#10B981', label: 'Thấp' },
  medium: { color: '#F59E0B', label: 'Trung bình' },
  high: { color: '#EF4444', label: 'Cao' },
};

// Mock PnL history
function generatePnlHistory(totalPnl: number): { day: string; pnl: number; cumPnl: number }[] {
  const data = [];
  let cum = 0;
  for (let i = 30; i >= 0; i--) {
    const daily = (Math.random() - 0.35) * (totalPnl / 15);
    cum += daily;
    data.push({
      day: `${30 - i}`,
      pnl: parseFloat(daily.toFixed(2)),
      cumPnl: parseFloat(cum.toFixed(2)),
    });
  }
  return data;
}

// Mock recent trades
const MOCK_TRADES = [
  { id: 't1', pair: 'BTC/USDT', side: 'long' as const, entry: 65200, exit: 67543, pnl: 2343, pnlPct: 3.59, time: '2h trước', status: 'closed' },
  { id: 't2', pair: 'ETH/USDT', side: 'short' as const, entry: 3620, exit: 3521, pnl: 990, pnlPct: 2.73, time: '5h trước', status: 'closed' },
  { id: 't3', pair: 'SOL/USDT', side: 'long' as const, entry: 172, exit: null, pnl: 316, pnlPct: 3.37, time: '1d trước', status: 'open' },
  { id: 't4', pair: 'BNB/USDT', side: 'long' as const, entry: 405, exit: 398, pnl: -700, pnlPct: -1.73, time: '2d trước', status: 'closed' },
  { id: 't5', pair: 'BTC/USDT', side: 'long' as const, entry: 63800, exit: 65200, pnl: 1400, pnlPct: 2.19, time: '3d trước', status: 'closed' },
];

export function TraderProfilePage() {
  const { traderId } = useParams<{ traderId: string }>();
  const c = useThemeColors();
  const [tab, setTab] = useState<'overview' | 'trades' | 'stats'>('overview');
  const [isFollowing, setIsFollowing] = useState(false);

  const trader = COPY_TRADERS.find(t => t.id === traderId) || COPY_TRADERS[0];
  const risk = RISK_CONFIG[trader.riskLevel];
  const pnlHistory = React.useMemo(() => generatePnlHistory(trader.totalPnl), [trader.totalPnl]);

  return (
    <PageLayout>
      <Header title="Trader Profile" subtitle="Hồ sơ · Trade" back />

      <PageContent>
        {/* Profile header */}
        <div className="mx-5 mt-4 rounded-3xl p-5"
          style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2550 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: c.primary + '22', border: `2.5px solid ${c.primary}44` }}>
              <span style={{ color: c.primary, fontSize: 22, fontWeight: 700 }}>{trader.avatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{trader.name}</span>
                {isFollowing && <Star size={16} fill="#F59E0B" color="#F59E0B" />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trader.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.08)', color: c.text2, fontSize: 10, fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-md"
                  style={{ background: risk.color + '15', color: risk.color, fontSize: 10, fontWeight: 600 }}>
                  Rủi ro: {risk.label}
                </span>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Tổng ROI', value: `+${trader.totalPnlPct.toFixed(1)}%`, color: '#10B981' },
              { label: 'Win Rate', value: `${trader.winRate}%`, color: '#10B981' },
              { label: 'Sharpe', value: trader.sharpeRatio.toFixed(2), color: '#F59E0B' },
              { label: 'MDD', value: `${trader.maxDrawdown}%`, color: '#EF4444' },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p style={{ color: c.text3, fontSize: 9 }}>{m.label}</p>
                <p style={{ color: m.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Copier bar */}
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ color: c.text3, fontSize: 10 }}>Copiers: {trader.copiers} / {trader.maxCopiers}</span>
              <span style={{ color: c.text2, fontSize: 10 }}>{trader.maxCopiers - trader.copiers} slots trống</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ background: c.primary, width: `${(trader.copiers / trader.maxCopiers) * 100}%` }} />
            </div>
          </div>

          {/* Follow button */}
          <button onClick={() => setIsFollowing(!isFollowing)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              background: isFollowing ? 'rgba(239,68,68,0.15)' : c.primary,
              border: isFollowing ? '1px solid rgba(239,68,68,0.3)' : 'none',
            }}>
            {isFollowing ? (
              <div className="contents">
                <AlertTriangle size={16} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 600 }}>Hủy theo dõi</span>
              </div>
            ) : (
              <div className="contents">
                <Copy size={16} color="#FFF" />
                <span style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>Copy Trader này</span>
              </div>
            )}
          </button>
        </div>

        {/* Tab switcher */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'trades', label: 'Giao dịch' },
            { id: 'stats', label: 'Thống kê' },
          ]}
          active={tab}
          onChange={setTab}
          className="mx-5 mt-4"
        />

        {/* Overview */}
        {tab === 'overview' && (
          <div className="mx-5 mt-4 flex flex-col gap-4">
            {/* Cumulative PnL chart */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>PnL tích lũy (30 ngày)</span>
                <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>{fmtSignedUsd(trader.totalPnl)}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={pnlHistory} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <defs key="gradient-defs">
                    <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis key="tp-x" dataKey="day" hide />
                  <YAxis key="tp-y" hide />
                  <Tooltip
                    key="tp-tip"
                    contentStyle={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [fmtSignedUsd(v), 'PnL']}
                  />
                  <Area key="tp-area" type="monotone" dataKey="cumPnl" stroke="#10B981" strokeWidth={2} fill="url(#pnlGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </TrCard>

            {/* Daily PnL bars */}
            <TrCard className="p-4">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>PnL hàng ngày</span>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={pnlHistory.slice(-14)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis key="tpb-x" dataKey="day" hide />
                  <YAxis key="tpb-y" hide />
                  <Bar key="tpb-bar" dataKey="pnl" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {pnlHistory.slice(-14).map((entry, idx) => (
                      <Cell key={idx} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TrCard>

            {/* Details */}
            <TrCard className="p-4">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chi tiết</span>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[
                  { icon: BarChart3, label: 'Tổng lệnh', value: trader.totalTrades.toLocaleString() },
                  { icon: Clock, label: 'TG nắm giữ TB', value: trader.avgHoldingTime },
                  { icon: Users, label: 'Copiers hiện tại', value: trader.copiers.toLocaleString() },
                  { icon: Shield, label: 'AUM', value: fmtCompact(trader.aum, { prefix: '$' }) },
                  { icon: Target, label: 'Max Drawdown', value: `${trader.maxDrawdown}%` },
                  { icon: Zap, label: 'Sharpe Ratio', value: trader.sharpeRatio.toFixed(2) },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-2.5 py-2">
                    <d.icon size={14} color={c.text3} />
                    <div>
                      <p style={{ color: c.text3, fontSize: 10 }}>{d.label}</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>
        )}

        {/* Trades tab */}
        {tab === 'trades' && (
          <div className="mx-5 mt-4 flex flex-col gap-2">
            {MOCK_TRADES.map(trade => {
              const isProfit = trade.pnl >= 0;
              return (
                <TrCard key={trade.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{trade.pair}</span>
                      <span className="px-1.5 py-0.5 rounded-md" style={{
                        background: trade.side === 'long' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: trade.side === 'long' ? '#10B981' : '#EF4444',
                        fontSize: 9, fontWeight: 700,
                      }}>{trade.side.toUpperCase()}</span>
                      {trade.status === 'open' && (
                        <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.12)', color: c.primary, fontSize: 9, fontWeight: 600 }}>OPEN</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p style={{ color: isProfit ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                        {fmtSignedUsd(trade.pnl)}
                      </p>
                      <p style={{ color: isProfit ? '#10B981' : '#EF4444', fontSize: 10 }}>{fmtPct(trade.pnlPct)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span style={{ color: c.text3, fontSize: 10 }}>Entry: </span>
                      <span style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>${trade.entry.toLocaleString()}</span>
                    </div>
                    {trade.exit && (
                      <div>
                        <span style={{ color: c.text3, fontSize: 10 }}>Exit: </span>
                        <span style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>${trade.exit.toLocaleString()}</span>
                      </div>
                    )}
                    <span style={{ color: c.text3, fontSize: 10, marginLeft: 'auto' }}>{trade.time}</span>
                  </div>
                </TrCard>
              );
            })}
          </div>
        )}

        {/* Stats tab */}
        {tab === 'stats' && (
          <div className="mx-5 mt-4 flex flex-col gap-3">
            {/* Win/Loss chart */}
            <TrCard className="p-4">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tỷ lệ thắng/thua</span>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
                  <div style={{ width: `${trader.winRate}%`, background: '#10B981', height: '100%' }} />
                  <div style={{ width: `${100 - trader.winRate}%`, background: '#EF4444', height: '100%' }} />
                </div>
                <span style={{ color: c.text2, fontSize: 12, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>{trader.winRate}%</span>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Thắng: {Math.round(trader.totalTrades * trader.winRate / 100)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Thua: {Math.round(trader.totalTrades * (100 - trader.winRate) / 100)}</span>
                </div>
              </div>
            </TrCard>

            {/* Performance metrics */}
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Thống kê chi tiết</p>
              {[
                { label: 'Tổng PnL', value: fmtSignedUsd(trader.totalPnl), color: '#10B981' },
                { label: 'ROI tổng', value: `+${trader.totalPnlPct.toFixed(1)}%`, color: '#10B981' },
                { label: 'Sharpe Ratio', value: trader.sharpeRatio.toFixed(2), color: '#F59E0B' },
                { label: 'Max Drawdown', value: `${trader.maxDrawdown}%`, color: '#EF4444' },
                { label: 'Avg Holding Time', value: trader.avgHoldingTime, color: c.text1 },
                { label: 'Tổng lệnh', value: trader.totalTrades.toLocaleString(), color: c.text1 },
                { label: 'AUM', value: fmtCompact(trader.aum, { prefix: '$' }), color: c.primary },
                { label: 'Copiers', value: `${trader.copiers} / ${trader.maxCopiers}`, color: c.primary },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
                  <span style={{ color: row.color, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
                </div>
              ))}
            </TrCard>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}