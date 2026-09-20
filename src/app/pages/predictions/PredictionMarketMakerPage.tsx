/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionMarketMakerPage — Prediction Markets Feature 2/4
 * ══════════════════════════════════════════════════════════════
 *  Liquidity provider tool: add/remove liquidity, manage spreads,
 *  track earnings from fees, impermanent loss analysis
 *  Pattern B — Page with Tabs (Provide/Positions/Earnings)
 *  Compliance: §9.4 Trade Safety, §9.6 No guaranteed returns
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Droplets, TrendingUp, DollarSign, Percent, AlertTriangle,
  Plus, Minus, BarChart3, Activity, Info, Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const TABS = ['Cung cap', 'Vi the', 'Thu nhap'] as const;
type Tab = typeof TABS[number];

interface LiquidityPosition {
  id: string;
  eventName: string;
  liquidityProvided: number;
  currentValue: number;
  feesEarned: number;
  impermanentLoss: number;
  apr: number;
  dateAdded: Date;
  status: 'active' | 'withdrawn';
}

const MOCK_POSITIONS: LiquidityPosition[] = [
  {
    id: 'lp_001',
    eventName: 'BTC > $100K by Dec 2026?',
    liquidityProvided: 5000,
    currentValue: 5240,
    feesEarned: 320,
    impermanentLoss: -80,
    apr: 24.5,
    dateAdded: new Date(Date.now() - 30 * 86400000),
    status: 'active',
  },
  {
    id: 'lp_002',
    eventName: 'ETH merge to PoS in 2025?',
    liquidityProvided: 3000,
    currentValue: 3150,
    feesEarned: 180,
    impermanentLoss: -30,
    apr: 18.2,
    dateAdded: new Date(Date.now() - 60 * 86400000),
    status: 'active',
  },
];

const EARNINGS_HISTORY = [
  { date: '01/03', fees: 45, volume: 1200 },
  { date: '08/03', fees: 62, volume: 1580 },
  { date: '15/03', fees: 58, volume: 1420 },
  { date: '22/03', fees: 71, volume: 1890 },
  { date: '29/03', fees: 84, volume: 2150 },
  { date: '05/04', fees: 92, volume: 2340 },
];

export function PredictionMarketMakerPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Cung cap');

  // Provide liquidity form
  const [eventName, setEventName] = useState('BTC > $100K by Dec 2026?');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [spreadBps, setSpreadBps] = useState('50');
  const [minDepth, setMinDepth] = useState('1000');

  const totalLiquidity = MOCK_POSITIONS.reduce((sum, p) => sum + p.liquidityProvided, 0);
  const totalValue = MOCK_POSITIONS.reduce((sum, p) => sum + p.currentValue, 0);
  const totalFees = MOCK_POSITIONS.reduce((sum, p) => sum + p.feesEarned, 0);
  const totalIL = MOCK_POSITIONS.reduce((sum, p) => sum + p.impermanentLoss, 0);
  const netReturn = totalValue - totalLiquidity + totalFees + totalIL;
  const netReturnPercent = totalLiquidity > 0 ? (netReturn / totalLiquidity) * 100 : 0;

  const avgAPR = MOCK_POSITIONS.length > 0
    ? MOCK_POSITIONS.reduce((sum, p) => sum + p.apr, 0) / MOCK_POSITIONS.length
    : 0;

  return (
    <PageLayout>
      <Header title="Market Maker" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Cung cap' && (
          <>
            {/* Overview Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(59,130,246,0.08)',
                  }}
                >
                  <Droplets size={24} color="#3B82F6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Liquidity Provider</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Thu nhap tu phi giao dich</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Provided</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    ${totalLiquidity.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg APR</p>
                  <p style={{ color: c.buy, fontSize: 18, fontWeight: 700 }}>
                    {avgAPR.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Add Liquidity Form */}
            <PageSection label="Them thanh khoan">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Select Event
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Event name..."
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Liquidity Amount (USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} color={c.text3} />
                    <input
                      type="text"
                      value={liquidityAmount}
                      onChange={(e) => setLiquidityAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Spread (basis points)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {['25', '50', '100', '200'].map((bps) => (
                      <button
                        key={bps}
                        onClick={() => setSpreadBps(bps)}
                        className="py-2 rounded-xl transition-all"
                        style={{
                          background: spreadBps === bps ? c.primary : c.bg,
                          color: spreadBps === bps ? '#fff' : c.text1,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {bps}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Hieu gia bid/ask: {(parseFloat(spreadBps) / 100).toFixed(2)}%
                  </p>
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Minimum Depth (USD)
                  </label>
                  <input
                    type="text"
                    value={minDepth}
                    onChange={(e) => setMinDepth(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                    Thanh khoan toi thieu moi ben
                  </p>
                </div>

                {/* Estimated Returns */}
                {liquidityAmount && (
                  <div
                    className="rounded-xl p-3 mb-4"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                  >
                    <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      Estimated Returns
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10 }}>Daily Fees</p>
                        <p style={{ color: c.buy, fontSize: 13, fontWeight: 700 }}>
                          ${(parseFloat(liquidityAmount) * 0.0012).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10 }}>Est. APR</p>
                        <p style={{ color: c.buy, fontSize: 13, fontWeight: 700 }}>
                          ~22.5%
                        </p>
                      </div>
                    </div>
                    <p style={{ color: c.text3, fontSize: 9, marginTop: 6 }}>
                      Ước tính dựa trên volume trung bình. Không đảm bảo lợi nhuận thực tế.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => alert(`Add Liquidity: ${liquidityAmount} USD to ${eventName}`)}
                  disabled={!liquidityAmount}
                  className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    height: 48,
                    background: c.primary,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  <Plus size={18} />
                  Them thanh khoan
                </button>
              </div>
            </PageSection>

            {/* Risk Warning - §9.6 compliance */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Cung cap thanh khoan co rui ro impermanent loss. APR khong co dinh va phu thuoc vao volume giao dich.
                Khong dam bao loi nhuan.
              </p>
            </div>
          </>
        )}

        {tab === 'Vi the' && (
          <>
            {/* Summary */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Value</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Fees</p>
                  <p style={{ color: c.buy, fontSize: 18, fontWeight: 700 }}>
                    ${totalFees.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>IL</p>
                  <p style={{ color: c.sell, fontSize: 16, fontWeight: 700 }}>
                    ${totalIL.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Net Return</p>
                  <p
                    style={{
                      color: netReturn >= 0 ? c.buy : c.sell,
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {netReturn >= 0 ? '+' : ''}${netReturn.toFixed(2)}
                  </p>
                </div>
              </div>
              <div
                className="rounded-xl p-2 flex items-center justify-between"
                style={{ background: netReturn >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}
              >
                <p style={{ color: c.text3, fontSize: 11 }}>Total Return %</p>
                <p
                  style={{
                    color: netReturnPercent >= 0 ? c.buy : c.sell,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {netReturnPercent >= 0 ? '+' : ''}{netReturnPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Positions List */}
            <PageSection label="Cac vi the">
              {MOCK_POSITIONS.map((position) => {
                const netPnL = position.currentValue - position.liquidityProvided + position.feesEarned + position.impermanentLoss;
                const netPnLPercent = (netPnL / position.liquidityProvided) * 100;
                return (
                  <div
                    key={position.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                          {position.eventName}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock size={11} color={c.text3} />
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            Added {position.dateAdded.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.buy, fontSize: 14, fontWeight: 700 }}>
                          {position.apr.toFixed(1)}% APR
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Provided</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          ${position.liquidityProvided.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Value</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          ${position.currentValue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Fees Earned</p>
                        <p style={{ color: c.buy, fontSize: 13, fontWeight: 600 }}>
                          +${position.feesEarned.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>IL</p>
                        <p style={{ color: c.sell, fontSize: 13, fontWeight: 600 }}>
                          ${position.impermanentLoss.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="rounded-xl p-2 mb-3 flex items-center justify-between"
                      style={{
                        background: netPnL >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                      }}
                    >
                      <p style={{ color: c.text3, fontSize: 11 }}>Net P/L</p>
                      <p
                        style={{
                          color: netPnL >= 0 ? c.buy : c.sell,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)} ({netPnLPercent >= 0 ? '+' : ''}{netPnLPercent.toFixed(2)}%)
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Remove liquidity from ${position.eventName}`)}
                      className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: c.sell,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Minus size={14} />
                      Rut thanh khoan
                    </button>
                  </div>
                );
              })}
            </PageSection>
          </>
        )}

        {tab === 'Thu nhap' && (
          <>
            {/* Earnings Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Fee Earnings Over Time
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={EARNINGS_HISTORY}>
                  <defs key="gradient-defs">
                    <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    key="x-axis"
                    dataKey="date"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: c.text1,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fees"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorFees)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Trading Volume
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={EARNINGS_HISTORY}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: c.text1,
                    }}
                  />
                  <Bar key="bar-volume" dataKey="volume" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Earnings Breakdown */}
            <PageSection label="Phan tich thu nhap">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={16} color="#10B981" />
                      <p style={{ color: c.text2, fontSize: 13 }}>Total Fees</p>
                    </div>
                    <p style={{ color: c.buy, fontSize: 15, fontWeight: 700 }}>
                      ${totalFees.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Avg Daily Fees</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      ${(totalFees / 60).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} color={c.text3} />
                      <p style={{ color: c.text2, fontSize: 13 }}>Fee Yield (annualized)</p>
                    </div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                      {avgAPR.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Thu nhap qua khu khong dam bao ket qua tuong lai. APR thay doi theo volume va volatility.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}