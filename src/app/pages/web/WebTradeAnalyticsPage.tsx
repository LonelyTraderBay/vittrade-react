import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  ChevronDown,
  Download,
  PieChart,
  Activity,
  Award,
  AlertTriangle,
  Clock,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtPct, fmtPrice } from '../../data/formatNumber';
import { ORDER_HISTORY, CRYPTO_PAIRS } from '../../data/mockData';
import { WEB_FULL_BLEED_HEIGHT } from '../../components/layout/webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WebTradeAnalyticsPage — Trade History Analytics Dashboard
 * ══════════════════════════════════════════════════════════
 *
 *  Professional trading analytics dashboard:
 *  ● PnL over time chart (equity curve)
 *  ● Win rate & profit factor KPIs
 *  ● Best/worst trades
 *  ● Drawdown visualization
 *  ● Per-asset breakdown
 *  ● Trade distribution by time/day
 */

/* ─── Deterministic Mock Analytics Data ─── */
const MOCK_DAILY_PNL = [
  { date: '01/03', pnl: 245.5, cumPnl: 245.5, trades: 8, wins: 5 },
  { date: '02/03', pnl: -120.3, cumPnl: 125.2, trades: 6, wins: 2 },
  { date: '03/03', pnl: 380.15, cumPnl: 505.35, trades: 12, wins: 9 },
  { date: '04/03', pnl: 55.8, cumPnl: 561.15, trades: 4, wins: 3 },
  { date: '05/03', pnl: -210.45, cumPnl: 350.7, trades: 9, wins: 3 },
  { date: '06/03', pnl: 167.9, cumPnl: 518.6, trades: 7, wins: 5 },
  { date: '07/03', pnl: 290.25, cumPnl: 808.85, trades: 11, wins: 8 },
  { date: '08/03', pnl: -85.6, cumPnl: 723.25, trades: 5, wins: 2 },
  { date: '09/03', pnl: 410.7, cumPnl: 1133.95, trades: 14, wins: 10 },
  { date: '10/03', pnl: 125.4, cumPnl: 1259.35, trades: 6, wins: 4 },
  { date: '11/03', pnl: -340.2, cumPnl: 919.15, trades: 8, wins: 2 },
  { date: '12/03', pnl: 520.85, cumPnl: 1440.0, trades: 15, wins: 11 },
  { date: '13/03', pnl: 180.3, cumPnl: 1620.3, trades: 9, wins: 7 },
];

const MOCK_BEST_TRADES = [
  {
    id: 1,
    pair: 'SOL/USDT',
    side: 'buy' as const,
    entry: 165.4,
    exit: 178.32,
    qty: 15,
    pnl: 193.8,
    roi: 7.8,
    date: '03/03',
  },
  {
    id: 2,
    pair: 'BTC/USDT',
    side: 'buy' as const,
    entry: 65200,
    exit: 67543,
    qty: 0.08,
    pnl: 187.44,
    roi: 3.59,
    date: '09/03',
  },
  {
    id: 3,
    pair: 'AVAX/USDT',
    side: 'buy' as const,
    entry: 35.8,
    exit: 38.54,
    qty: 50,
    pnl: 137.0,
    roi: 7.65,
    date: '12/03',
  },
  {
    id: 4,
    pair: 'MATIC/USDT',
    side: 'buy' as const,
    entry: 0.82,
    exit: 0.8976,
    qty: 1500,
    pnl: 116.4,
    roi: 9.46,
    date: '07/03',
  },
];

const MOCK_WORST_TRADES = [
  {
    id: 5,
    pair: 'DOT/USDT',
    side: 'buy' as const,
    entry: 8.45,
    exit: 7.83,
    qty: 200,
    pnl: -124.0,
    roi: -7.34,
    date: '11/03',
  },
  {
    id: 6,
    pair: 'LINK/USDT',
    side: 'sell' as const,
    entry: 13.8,
    exit: 14.23,
    qty: 100,
    pnl: -43.0,
    roi: -3.12,
    date: '05/03',
  },
  {
    id: 7,
    pair: 'XRP/USDT',
    side: 'buy' as const,
    entry: 0.648,
    exit: 0.623,
    qty: 3000,
    pnl: -75.0,
    roi: -3.86,
    date: '02/03',
  },
  {
    id: 8,
    pair: 'ETH/USDT',
    side: 'sell' as const,
    entry: 3480,
    exit: 3521,
    qty: 0.5,
    pnl: -20.5,
    roi: -1.18,
    date: '08/03',
  },
];

const MOCK_ASSET_BREAKDOWN = [
  { asset: 'BTC', color: '#F7931A', trades: 28, pnl: 680.5, winRate: 67.8 },
  { asset: 'ETH', color: '#627EEA', trades: 22, pnl: 320.3, winRate: 59.1 },
  { asset: 'SOL', color: '#9945FF', trades: 18, pnl: 445.2, winRate: 72.2 },
  { asset: 'BNB', color: '#F3BA2F', trades: 12, pnl: 125.8, winRate: 58.3 },
  { asset: 'AVAX', color: '#E84142', trades: 10, pnl: 89.4, winRate: 60.0 },
  { asset: 'Khác', color: '#6B7280', trades: 24, pnl: -40.9, winRate: 45.8 },
];

const MOCK_HOURLY_DIST = [
  { hour: '00-03', trades: 5, pnl: 45 },
  { hour: '03-06', trades: 3, pnl: -12 },
  { hour: '06-09', trades: 12, pnl: 230 },
  { hour: '09-12', trades: 28, pnl: 520 },
  { hour: '12-15', trades: 22, pnl: 380 },
  { hour: '15-18', trades: 18, pnl: 210 },
  { hour: '18-21', trades: 15, pnl: 165 },
  { hour: '21-00', trades: 11, pnl: 82 },
];

type TimeRange = '1W' | '1M' | '3M' | '6M' | 'YTD' | 'ALL';

export function WebTradeAnalyticsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefix = useRoutePrefix();

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showTab, setShowTab] = useState<'overview' | 'trades' | 'assets'>('overview');

  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const panelBg = isDark ? '#0F1117' : '#FFFFFF';
  const topBarBg = isDark ? '#13151D' : '#F8F9FA';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // KPIs
  const totalTrades = MOCK_DAILY_PNL.reduce((s, d) => s + d.trades, 0);
  const totalWins = MOCK_DAILY_PNL.reduce((s, d) => s + d.wins, 0);
  const winRate = (totalWins / totalTrades) * 100;
  const totalPnl = MOCK_DAILY_PNL[MOCK_DAILY_PNL.length - 1].cumPnl;
  const avgPnlPerTrade = totalPnl / totalTrades;
  const winDays = MOCK_DAILY_PNL.filter((d) => d.pnl > 0).length;
  const lossDays = MOCK_DAILY_PNL.filter((d) => d.pnl < 0).length;
  const bestDay = Math.max(...MOCK_DAILY_PNL.map((d) => d.pnl));
  const worstDay = Math.min(...MOCK_DAILY_PNL.map((d) => d.pnl));
  const avgWin = MOCK_BEST_TRADES.reduce((s, t) => s + t.pnl, 0) / MOCK_BEST_TRADES.length;
  const avgLoss =
    MOCK_WORST_TRADES.reduce((s, t) => s + Math.abs(t.pnl), 0) / MOCK_WORST_TRADES.length;
  const profitFactor = avgWin / avgLoss;

  // Drawdown
  const maxCumPnl = Math.max(...MOCK_DAILY_PNL.map((d) => d.cumPnl));
  const drawdown = MOCK_DAILY_PNL.map((d) => ({
    date: d.date,
    dd: ((d.cumPnl - maxCumPnl) / Math.max(maxCumPnl, 1)) * 100,
  }));
  const maxDrawdown = Math.min(...drawdown.map((d) => d.dd));

  const KPICard = ({
    label,
    value,
    sub,
    color,
    icon: Icon,
  }: {
    label: string;
    value: string;
    sub?: string;
    color: string;
    icon: React.ComponentType<any>;
  }) => (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{ background: inputBg, border: `1px solid ${panelBorder}` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '12' }}
      >
        <Icon size={16} color={color} />
      </div>
      <div>
        <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, display: 'block' }}>
          {label}
        </span>
        <span
          style={{
            color: c.text1,
            fontSize: 18,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            display: 'block',
            marginTop: 2,
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ color: c.text3, fontSize: 10, display: 'block', marginTop: 2 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );

  // Equity curve rendering (simple bar chart via divs)
  const maxAbsPnl = Math.max(...MOCK_DAILY_PNL.map((d) => Math.abs(d.pnl)));
  const maxCum = Math.max(...MOCK_DAILY_PNL.map((d) => d.cumPnl));

  return (
    <div className="flex flex-col" style={{ minHeight: WEB_FULL_BLEED_HEIGHT }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3.5 shrink-0"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${prefix}/trade/btcusdt`)}
            className="w-9 h-9 rounded-lg flex items-center justify-center web-cmd-btn transition-colors"
          >
            <ArrowLeft size={18} color={c.text2} />
          </button>
          <div>
            <span style={{ color: c.text1, fontSize: 18, fontWeight: 700, display: 'block' }}>
              Phân tích giao dịch
            </span>
            <span style={{ color: c.text3, fontSize: 12 }}>Trade History Analytics Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Time range */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: `1px solid ${panelBorder}` }}
          >
            {(['1W', '1M', '3M', '6M', 'YTD', 'ALL'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className="px-3 py-1.5 transition-colors"
                style={{
                  background: timeRange === r ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: timeRange === r ? '#3B82F6' : c.text3,
                  fontSize: 12,
                  fontWeight: timeRange === r ? 700 : 500,
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            className="web-cmd-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors"
            style={{ border: `1px solid ${panelBorder}` }}
          >
            <Download size={14} color={c.text3} />
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Export</span>
          </button>
        </div>
      </div>

      {/* Content tabs */}
      <div
        className="flex items-center gap-0 px-6"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
      >
        {[
          { id: 'overview' as const, label: 'Tổng quan', icon: BarChart3 },
          { id: 'trades' as const, label: 'Giao dịch nổi bật', icon: Target },
          { id: 'assets' as const, label: 'Theo tài sản', icon: PieChart },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setShowTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 transition-colors"
            style={{
              color: showTab === t.id ? c.text1 : c.text3,
              fontSize: 12,
              fontWeight: showTab === t.id ? 700 : 500,
              borderBottom: showTab === t.id ? '2px solid #3B82F6' : '2px solid transparent',
            }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-none p-6"
        style={{ background: isDark ? '#0A0C12' : '#F5F6F8' }}
      >
        {showTab === 'overview' && (
          <div className="flex flex-col gap-5" style={{ maxWidth: 1400 }}>
            {/* KPI row */}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <KPICard
                label="Tổng P/L"
                value={fmtUsd(totalPnl)}
                sub={`${winDays}W / ${lossDays}L ngày`}
                color={totalPnl >= 0 ? '#10B981' : '#EF4444'}
                icon={DollarSign}
              />
              <KPICard
                label="Win Rate"
                value={`${winRate.toFixed(1)}%`}
                sub={`${totalWins}/${totalTrades} lệnh`}
                color="#3B82F6"
                icon={Target}
              />
              <KPICard
                label="Profit Factor"
                value={profitFactor.toFixed(2)}
                sub="Avg win / avg loss"
                color={profitFactor >= 1.5 ? '#10B981' : '#F59E0B'}
                icon={Activity}
              />
              <KPICard
                label="TB/Lệnh"
                value={fmtUsd(avgPnlPerTrade)}
                sub={`${totalTrades} lệnh tổng`}
                color="#8B5CF6"
                icon={BarChart3}
              />
              <KPICard
                label="Max Drawdown"
                value={`${maxDrawdown.toFixed(1)}%`}
                sub={`Peak: ${fmtUsd(maxCumPnl)}`}
                color="#EF4444"
                icon={AlertTriangle}
              />
            </div>

            {/* Charts row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
              {/* Equity Curve + Daily PnL */}
              <div
                className="rounded-xl p-4"
                style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                    Equity Curve & P/L hàng ngày
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center gap-1"
                      style={{ color: '#3B82F6', fontSize: 10 }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />{' '}
                      Tích lũy
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: '#10B981', fontSize: 10 }}
                    >
                      <span className="w-2 h-0.5" style={{ background: '#10B981' }} /> Ngày
                    </span>
                  </div>
                </div>

                {/* Chart bars */}
                <div className="flex items-end gap-1" style={{ height: 180 }}>
                  {MOCK_DAILY_PNL.map((d, i) => {
                    const cumHeight = (d.cumPnl / maxCum) * 150;
                    const barHeight = (Math.abs(d.pnl) / maxAbsPnl) * 60;
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-0.5 relative"
                        style={{ height: 180 }}
                      >
                        {/* Cumulative line dot */}
                        <div
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            background: '#3B82F6',
                            border: '1.5px solid ' + panelBg,
                            bottom: Math.max(4, cumHeight),
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 2,
                          }}
                        />
                        {/* Connecting line to next */}
                        {i < MOCK_DAILY_PNL.length - 1 && (
                          <div
                            className="absolute"
                            style={{
                              bottom: Math.max(4, cumHeight) + 3,
                              left: '50%',
                              width: '100%',
                              height: 1,
                              background: 'rgba(59,130,246,0.3)',
                              zIndex: 1,
                            }}
                          />
                        )}
                        {/* Daily PnL bar */}
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t"
                          style={{
                            width: '60%',
                            height: barHeight,
                            background: d.pnl >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                            borderTop: `2px solid ${d.pnl >= 0 ? '#10B981' : '#EF4444'}`,
                          }}
                        />
                        {/* Label */}
                        <span
                          className="absolute -bottom-4 text-center w-full"
                          style={{ color: c.text3, fontSize: 8, marginTop: 2 }}
                        >
                          {d.date}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Best/Worst day summary */}
                <div
                  className="flex gap-3 mt-6 pt-3"
                  style={{ borderTop: `1px solid ${panelBorder}` }}
                >
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'rgba(16,185,129,0.04)',
                      border: '1px solid rgba(16,185,129,0.1)',
                    }}
                  >
                    <ArrowUpRight size={15} color="#10B981" />
                    <div>
                      <span style={{ color: c.text3, fontSize: 11 }}>Ngày tốt nhất</span>
                      <span
                        style={{
                          color: '#10B981',
                          fontSize: 14,
                          fontWeight: 700,
                          display: 'block',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        +{fmtUsd(bestDay)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'rgba(239,68,68,0.04)',
                      border: '1px solid rgba(239,68,68,0.1)',
                    }}
                  >
                    <ArrowDownRight size={15} color="#EF4444" />
                    <div>
                      <span style={{ color: c.text3, fontSize: 11 }}>Ngày tệ nhất</span>
                      <span
                        style={{
                          color: '#EF4444',
                          fontSize: 14,
                          fontWeight: 700,
                          display: 'block',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtUsd(worstDay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Distribution + Stats */}
              <div className="flex flex-col gap-4">
                {/* Hourly distribution */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
                >
                  <span
                    style={{
                      color: c.text1,
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 10,
                    }}
                  >
                    Phân bổ theo giờ
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {MOCK_HOURLY_DIST.map((h) => {
                      const maxTrades = Math.max(...MOCK_HOURLY_DIST.map((x) => x.trades));
                      const pct = (h.trades / maxTrades) * 100;
                      return (
                        <div key={h.hour} className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: 10, width: 40, flexShrink: 0 }}>
                            {h.hour}
                          </span>
                          <div
                            className="flex-1 rounded-full overflow-hidden"
                            style={{ height: 6, background: inputBg }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: h.pnl >= 0 ? '#10B981' : '#EF4444',
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: c.text2,
                              fontSize: 10,
                              fontVariantNumeric: 'tabular-nums',
                              width: 22,
                              textAlign: 'right',
                            }}
                          >
                            {h.trades}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick stats */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
                >
                  <span
                    style={{
                      color: c.text1,
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 10,
                    }}
                  >
                    Thống kê nhanh
                  </span>
                  {[
                    { l: 'Avg Win', v: fmtUsd(avgWin), cl: '#10B981' },
                    { l: 'Avg Loss', v: fmtUsd(avgLoss), cl: '#EF4444' },
                    { l: 'Largest Win', v: fmtUsd(MOCK_BEST_TRADES[0].pnl), cl: '#10B981' },
                    {
                      l: 'Largest Loss',
                      v: fmtUsd(Math.abs(MOCK_WORST_TRADES[0].pnl)),
                      cl: '#EF4444',
                    },
                    { l: 'Avg Duration', v: '2h 34m', cl: c.text2 },
                    { l: 'Total Volume', v: '$245.8K', cl: c.text2 },
                  ].map((s) => (
                    <div key={s.l} className="flex justify-between py-1.5">
                      <span style={{ color: c.text3, fontSize: 11 }}>{s.l}</span>
                      <span
                        style={{
                          color: s.cl,
                          fontSize: 11,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {s.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawdown chart */}
            <div
              className="rounded-xl p-4"
              style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  Drawdown từ đỉnh
                </span>
                <span
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Max: {maxDrawdown.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-start gap-1" style={{ height: 60 }}>
                {drawdown.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-b"
                      style={{
                        height: Math.max(2, Math.abs(d.dd) * 2),
                        background:
                          d.dd < -15
                            ? 'rgba(239,68,68,0.5)'
                            : d.dd < -5
                              ? 'rgba(239,68,68,0.3)'
                              : 'rgba(239,68,68,0.15)',
                      }}
                    />
                    <span style={{ color: c.text3, fontSize: 8, marginTop: 2 }}>{d.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showTab === 'trades' && (
          <div className="flex flex-col gap-5" style={{ maxWidth: 1400 }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Best trades */}
              <div
                className="rounded-xl p-4"
                style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Award size={15} color="#10B981" />
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                    Top lệnh lãi
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {MOCK_BEST_TRADES.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl web-cmd-btn transition-colors"
                      style={{ background: inputBg, border: `1px solid ${panelBorder}` }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          color: '#10B981',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                            {t.pair}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              background:
                                t.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: t.side === 'buy' ? '#10B981' : '#EF4444',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {t.side === 'buy' ? 'MUA' : 'BÁN'}
                          </span>
                          <span style={{ color: c.text3, fontSize: 10 }}>{t.date}</span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 11 }}>
                          {fmtPrice(t.entry)} → {fmtPrice(t.exit)} · {t.qty} units
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          style={{
                            color: '#10B981',
                            fontSize: 14,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            display: 'block',
                          }}
                        >
                          +{fmtUsd(t.pnl)}
                        </span>
                        <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                          +{t.roi.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worst trades */}
              <div
                className="rounded-xl p-4"
                style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} color="#EF4444" />
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Top lệnh lỗ</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {MOCK_WORST_TRADES.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl web-cmd-btn transition-colors"
                      style={{ background: inputBg, border: `1px solid ${panelBorder}` }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#EF4444',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                            {t.pair}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              background:
                                t.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: t.side === 'buy' ? '#10B981' : '#EF4444',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {t.side === 'buy' ? 'MUA' : 'BÁN'}
                          </span>
                          <span style={{ color: c.text3, fontSize: 10 }}>{t.date}</span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 11 }}>
                          {fmtPrice(t.entry)} → {fmtPrice(t.exit)} · {t.qty} units
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          style={{
                            color: '#EF4444',
                            fontSize: 14,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            display: 'block',
                          }}
                        >
                          {fmtUsd(t.pnl)}
                        </span>
                        <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>
                          {t.roi.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showTab === 'assets' && (
          <div className="flex flex-col gap-5" style={{ maxWidth: 1400 }}>
            {/* Asset breakdown table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${panelBorder}` }}
              >
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                  Hiệu suất theo tài sản
                </span>
              </div>
              <div>
                <div
                  className="grid items-center px-5 py-2.5"
                  style={{
                    gridTemplateColumns: '130px 1fr 80px 120px 80px 100px',
                    borderBottom: `1px solid ${panelBorder}`,
                  }}
                >
                  {['Tài sản', 'P/L Bar', 'Lệnh', 'P/L', 'Win Rate', 'Trạng thái'].map((h) => (
                    <span key={h} style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
                      {h}
                    </span>
                  ))}
                </div>
                {MOCK_ASSET_BREAKDOWN.map((a) => {
                  const maxPnl = Math.max(...MOCK_ASSET_BREAKDOWN.map((x) => Math.abs(x.pnl)));
                  const barPct = (Math.abs(a.pnl) / maxPnl) * 100;
                  return (
                    <div
                      key={a.asset}
                      className="grid items-center px-5 py-3 web-cmd-btn transition-colors"
                      style={{
                        gridTemplateColumns: '130px 1fr 80px 120px 80px 100px',
                        borderBottom: `1px solid ${panelBorder}`,
                        minHeight: 44,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: a.color + '15' }}
                        >
                          <span style={{ color: a.color, fontSize: 9, fontWeight: 700 }}>
                            {a.asset.slice(0, 3)}
                          </span>
                        </div>
                        <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {a.asset}
                        </span>
                      </div>
                      <div className="pr-4">
                        <div
                          className="w-full rounded-full overflow-hidden"
                          style={{ height: 6, background: inputBg }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barPct}%`,
                              background: a.pnl >= 0 ? '#10B981' : '#EF4444',
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        style={{ color: c.text2, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {a.trades}
                      </span>
                      <span
                        style={{
                          color: a.pnl >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 12,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {a.pnl >= 0 ? '+' : ''}
                        {fmtUsd(a.pnl)}
                      </span>
                      <span
                        style={{
                          color:
                            a.winRate >= 60 ? '#10B981' : a.winRate >= 50 ? '#F59E0B' : '#EF4444',
                          fontSize: 11,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {a.winRate.toFixed(1)}%
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-center"
                        style={{
                          background: a.pnl >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          color: a.pnl >= 0 ? '#10B981' : '#EF4444',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {a.pnl >= 0 ? 'Profitable' : 'Losing'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset PnL pie-like visual */}
            <div
              className="rounded-xl p-4"
              style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
            >
              <span
                style={{
                  color: c.text1,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                Phân bổ lệnh
              </span>
              <div className="flex items-center gap-4">
                {/* Stacked bar */}
                <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: 20 }}>
                  {MOCK_ASSET_BREAKDOWN.map((a) => {
                    const totalAll = MOCK_ASSET_BREAKDOWN.reduce((s, x) => s + x.trades, 0);
                    return (
                      <div
                        key={a.asset}
                        style={{
                          width: `${(a.trades / totalAll) * 100}%`,
                          background: a.color,
                          opacity: 0.7,
                        }}
                        title={`${a.asset}: ${a.trades} lệnh`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ width: 200 }}>
                  {MOCK_ASSET_BREAKDOWN.map((a) => (
                    <div key={a.asset} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                      <span style={{ color: c.text2, fontSize: 10 }}>
                        {a.asset} ({a.trades})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
