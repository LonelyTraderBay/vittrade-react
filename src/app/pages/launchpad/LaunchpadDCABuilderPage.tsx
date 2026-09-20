/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadDCABuilderPage — Phase 4.11 (Feature 3/4)
 * ══════════════════════════════════════════════════════════════
 *  Dollar Cost Averaging strategy builder for token accumulation
 *  Pattern B — Page with Tabs (Strategies/History/Create)
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
  Plus, TrendingUp, Calendar, DollarSign, Pause, Play,
  Clock, BarChart3, ArrowRight, CheckCircle2, Settings,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TABS = ['Chiến lược', 'Lịch sử', 'Tạo mới'] as const;
type Tab = typeof TABS[number];

interface DCAStrategy {
  id: string;
  token: string;
  tokenSymbol: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  amount: number;
  startDate: Date;
  nextBuy: Date;
  totalInvested: number;
  totalTokens: number;
  avgPrice: number;
  currentValue: number;
  status: 'active' | 'paused' | 'completed';
  executedOrders: number;
  remainingBudget: number;
}

interface DCAExecution {
  date: Date;
  amount: number;
  price: number;
  tokens: number;
  fee: number;
}

const MOCK_STRATEGIES: DCAStrategy[] = [
  {
    id: 'dca_001',
    token: 'Arbitrum',
    tokenSymbol: 'ARB',
    frequency: 'weekly',
    amount: 100,
    startDate: new Date(Date.now() - 30 * 86400000),
    nextBuy: new Date(Date.now() + 2 * 86400000),
    totalInvested: 400,
    totalTokens: 165.32,
    avgPrice: 2.42,
    currentValue: 410.19,
    status: 'active',
    executedOrders: 4,
    remainingBudget: 600,
  },
  {
    id: 'dca_002',
    token: 'Optimism',
    tokenSymbol: 'OP',
    frequency: 'biweekly',
    amount: 200,
    startDate: new Date(Date.now() - 60 * 86400000),
    nextBuy: new Date(Date.now() + 5 * 86400000),
    totalInvested: 600,
    totalTokens: 324.68,
    avgPrice: 1.85,
    currentValue: 607.15,
    status: 'active',
    executedOrders: 3,
    remainingBudget: 400,
  },
  {
    id: 'dca_003',
    token: 'Polygon',
    tokenSymbol: 'MATIC',
    frequency: 'monthly',
    amount: 500,
    startDate: new Date(Date.now() - 90 * 86400000),
    nextBuy: new Date(Date.now() - 3 * 86400000),
    totalInvested: 1500,
    totalTokens: 1695.24,
    avgPrice: 0.885,
    currentValue: 1508.76,
    status: 'paused',
    executedOrders: 3,
    remainingBudget: 0,
  },
];

const MOCK_EXECUTIONS: DCAExecution[] = [
  { date: new Date(Date.now() - 28 * 86400000), amount: 100, price: 2.45, tokens: 40.82, fee: 0.5 },
  { date: new Date(Date.now() - 21 * 86400000), amount: 100, price: 2.38, tokens: 42.02, fee: 0.5 },
  { date: new Date(Date.now() - 14 * 86400000), amount: 100, price: 2.51, tokens: 39.84, fee: 0.5 },
  { date: new Date(Date.now() - 7 * 86400000), amount: 100, price: 2.35, tokens: 42.55, fee: 0.5 },
];

export function LaunchpadDCABuilderPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Chiến lược');

  // Create form state
  const [token, setToken] = useState('ARB');
  const [frequency, setFrequency] = useState<DCAStrategy['frequency']>('weekly');
  const [amount, setAmount] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState('');

  const chartData = MOCK_EXECUTIONS.map((ex, idx) => ({
    name: ex.date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    price: ex.price,
    tokens: ex.tokens,
  }));

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Hàng ngày';
      case 'weekly': return 'Hàng tuần';
      case 'biweekly': return '2 tuần/lần';
      case 'monthly': return 'Hàng tháng';
      default: return freq;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return c.text3;
    }
  };

  const handleCreateStrategy = () => {
    alert(`DCA Strategy Created:\nToken: ${token}\nFrequency: ${frequency}\nAmount: $${amount}\nBudget: $${totalBudget}\nStart: ${startDate}`);
  };

  return (
    <PageLayout>
      <Header
        title="DCA Builder"
        back
        action={{
          icon: Plus,
          onClick: () => setTab('Tạo mới'),
        }}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Chiến lược' && (
          <>
            {/* Summary Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Invested</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                    ${MOCK_STRATEGIES.reduce((sum, s) => sum + s.totalInvested, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Value</p>
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                    ${MOCK_STRATEGIES.reduce((sum, s) => sum + s.currentValue, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Active Strategies</p>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 600 }}>
                    {MOCK_STRATEGIES.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Orders</p>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 600 }}>
                    {MOCK_STRATEGIES.reduce((sum, s) => sum + s.executedOrders, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategies List */}
            <PageSection label="Các chiến lược">
              {MOCK_STRATEGIES.map((strategy) => {
                const pnlPercent = ((strategy.currentValue - strategy.totalInvested) / strategy.totalInvested) * 100;
                return (
                  <div
                    key={strategy.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'rgba(59,130,246,0.08)',
                          }}
                        >
                          <TrendingUp size={20} color="#3B82F6" />
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{strategy.token}</p>
                          <div className="flex items-center gap-2">
                            <p style={{ color: c.text3, fontSize: 11 }}>{getFrequencyLabel(strategy.frequency)}</p>
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                              style={{
                                background: strategy.status === 'active' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                color: getStatusColor(strategy.status),
                              }}
                            >
                              {strategy.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {strategy.status === 'active' ? (
                          <button className="p-2 rounded-lg hover:opacity-80" style={{ background: c.bg }}>
                            <Pause size={14} color={c.text3} />
                          </button>
                        ) : (
                          <button className="p-2 rounded-lg hover:opacity-80" style={{ background: c.bg }}>
                            <Play size={14} color="#10B981" />
                          </button>
                        )}
                        <button className="p-2 rounded-lg hover:opacity-80" style={{ background: c.bg }}>
                          <Settings size={14} color={c.text3} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Invested</p>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          ${strategy.totalInvested.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Value</p>
                        <p style={{ color: pnlPercent >= 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 600 }}>
                          ${strategy.currentValue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Tokens</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {strategy.totalTokens.toFixed(2)} {strategy.tokenSymbol}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg Price</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          ${strategy.avgPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="rounded-xl p-2 mb-2"
                      style={{ background: pnlPercent >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}
                    >
                      <div className="flex items-center justify-between">
                        <p style={{ color: c.text3, fontSize: 10 }}>P/L</p>
                        <p
                          style={{
                            color: pnlPercent >= 0 ? '#10B981' : '#EF4444',
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% (${(strategy.currentValue - strategy.totalInvested).toFixed(2)})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={11} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          Next: {strategy.nextBuy.toLocaleDateString()}
                        </p>
                      </div>
                      <p style={{ color: c.text3, fontSize: 10 }}>
                        {strategy.executedOrders} orders • ${strategy.amount}/order
                      </p>
                    </div>
                  </div>
                );
              })}
            </PageSection>
          </>
        )}

        {tab === 'Lịch sử' && (
          <>
            {/* Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Price & Tokens Purchased (ARB)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis
                    key="x-axis"
                    dataKey="name"
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
                  <Bar key="bar-tokens" dataKey="tokens" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Execution History */}
            <PageSection label="Lịch sử mua">
              {MOCK_EXECUTIONS.map((exec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={14} color="#10B981" />
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          ${exec.amount} → {exec.tokens.toFixed(2)} ARB
                        </p>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {exec.date.toLocaleDateString()} {exec.date.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                        ${exec.price.toFixed(2)}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>Fee: ${exec.fee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>
          </>
        )}

        {tab === 'Tạo mới' && (
          <>
            <PageSection label="Token">
              <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Chọn token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ARB, OP, MATIC..."
                  className="w-full px-4 py-2.5 rounded-xl outline-none"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                />
              </div>
            </PageSection>

            <PageSection label="Tần suất mua">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'daily' as const, label: 'Hàng ngày', icon: '📅' },
                  { value: 'weekly' as const, label: 'Hàng tuần', icon: '📆' },
                  { value: 'biweekly' as const, label: '2 tuần/lần', icon: '🗓️' },
                  { value: 'monthly' as const, label: 'Hàng tháng', icon: '📋' },
                ].map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => setFrequency(freq.value)}
                    className="rounded-2xl p-4 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: frequency === freq.value ? 'rgba(59,130,246,0.08)' : c.surface,
                      border: `2px solid ${frequency === freq.value ? '#3B82F6' : c.border}`,
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{freq.icon}</div>
                    <p
                      style={{
                        color: frequency === freq.value ? '#3B82F6' : c.text1,
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      {freq.label}
                    </p>
                  </button>
                ))}
              </div>
            </PageSection>

            <PageSection label="Số tiền">
              <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Số tiền mỗi lần (USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} color={c.text3} />
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                      className="flex-1 px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Tổng ngân sách (USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} color={c.text3} />
                    <input
                      type="text"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="1000"
                      className="flex-1 px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Ngày bắt đầu
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} color={c.text3} />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl outline-none"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Preview */}
            {amount && totalBudget && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Xem trước chiến lược</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Token</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{token}</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Frequency</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{getFrequencyLabel(frequency)}</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Per Order</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>${amount}</p>
                  </div>
                  <div>
                    <p style={{ color: c.text3, fontSize: 10 }}>Est. Orders</p>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      {Math.floor(parseFloat(totalBudget) / parseFloat(amount))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PageContent>

      {/* Floating CTA for Create tab */}
      {tab === 'Tạo mới' && amount && totalBudget && startDate && (
        <>
          <div style={{ height: 60 }} />
          <div
            className="fixed left-0 right-0 px-5 pb-8"
            style={{ bottom: 92, maxWidth: 480, margin: '0 auto' }}
          >
            <button
              onClick={handleCreateStrategy}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Tạo DCA Strategy
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
}