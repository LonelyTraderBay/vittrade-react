/**
 * ══════════════════════════════════════════════════════════════
 *  DCAMultiAssetPage — DCA Advanced Feature 2/4
 * ══════════════════════════════════════════════════════════════
 *  Multi-asset DCA: Create plans for multiple assets,
 *  Portfolio allocation, Rebalancing rules, Combined tracking
 *  Pattern B — Page with Tabs (Setup/Assets/Performance)
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
  PieChart as PieIcon, Plus, Trash2, TrendingUp, DollarSign,
  BarChart3, Settings, CheckCircle, Info, Percent,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const TABS = ['Cai dat', 'Tai san', 'Hieu suat'] as const;
type Tab = typeof TABS[number];

interface AssetAllocation {
  id: string;
  symbol: string;
  name: string;
  targetPercent: number;
  currentPercent: number;
  amountPerPeriod: number;
  totalInvested: number;
  currentValue: number;
  shares: number;
  avgPrice: number;
}

const MOCK_ALLOCATIONS: AssetAllocation[] = [
  {
    id: 'a1',
    symbol: 'BTC',
    name: 'Bitcoin',
    targetPercent: 40,
    currentPercent: 42,
    amountPerPeriod: 400,
    totalInvested: 4800,
    currentValue: 5280,
    shares: 0.096,
    avgPrice: 50000,
  },
  {
    id: 'a2',
    symbol: 'ETH',
    name: 'Ethereum',
    targetPercent: 30,
    currentPercent: 28,
    amountPerPeriod: 300,
    totalInvested: 3600,
    currentValue: 3960,
    shares: 1.44,
    avgPrice: 2500,
  },
  {
    id: 'a3',
    symbol: 'BNB',
    name: 'Binance Coin',
    targetPercent: 20,
    currentPercent: 20,
    amountPerPeriod: 200,
    totalInvested: 2400,
    currentValue: 2640,
    shares: 8.0,
    avgPrice: 300,
  },
  {
    id: 'a4',
    symbol: 'SOL',
    name: 'Solana',
    targetPercent: 10,
    currentPercent: 10,
    amountPerPeriod: 100,
    totalInvested: 1200,
    currentValue: 1320,
    shares: 12.0,
    avgPrice: 100,
  },
];

const COLORS = ['#F59E0B', '#3B82F6', '#F97316', '#8B5CF6'];

const PERFORMANCE_DATA = [
  { month: 'Jan', BTC: 400, ETH: 300, BNB: 200, SOL: 100 },
  { month: 'Feb', BTC: 820, ETH: 615, BNB: 410, SOL: 205 },
  { month: 'Mar', BTC: 1260, ETH: 945, BNB: 630, SOL: 315 },
  { month: 'Apr', BTC: 1680, ETH: 1260, BNB: 840, SOL: 420 },
  { month: 'May', BTC: 2120, ETH: 1590, BNB: 1060, SOL: 530 },
  { month: 'Jun', BTC: 2640, ETH: 1980, BNB: 1320, SOL: 660 },
];

export function DCAMultiAssetPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Cai dat');
  const [totalBudget, setTotalBudget] = useState('1000');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [rebalanceEnabled, setRebalanceEnabled] = useState(true);
  const [rebalanceThreshold, setRebalanceThreshold] = useState('5');

  const totalInvested = MOCK_ALLOCATIONS.reduce((sum, a) => sum + a.totalInvested, 0);
  const totalValue = MOCK_ALLOCATIONS.reduce((sum, a) => sum + a.currentValue, 0);
  const totalReturn = totalValue - totalInvested;
  const totalReturnPercent = (totalReturn / totalInvested) * 100;

  const pieData = MOCK_ALLOCATIONS.map((a) => ({
    name: a.symbol,
    value: a.currentValue,
  }));

  const needsRebalance = MOCK_ALLOCATIONS.some(
    (a) => Math.abs(a.currentPercent - a.targetPercent) > parseFloat(rebalanceThreshold)
  );

  return (
    <PageLayout>
      <Header title="Multi-Asset DCA" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Cai dat' && (
          <>
            {/* Budget & Frequency */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Total Budget per Period
              </p>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={18} color={c.text3} />
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                />
              </div>

              <p style={{ color: c.text2, fontSize: 11, marginBottom: 6 }}>Frequency</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ].map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => setFrequency(freq.value as any)}
                    className="py-2 rounded-xl transition-all"
                    style={{
                      background: frequency === freq.value ? c.primary : c.bg,
                      color: frequency === freq.value ? '#fff' : c.text1,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid ${frequency === freq.value ? 'transparent' : c.border}`,
                    }}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Allocation */}
            <PageSection label="Phan bo tai san">
              <div className="space-y-2">
                {MOCK_ALLOCATIONS.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{asset.symbol}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>{asset.name}</p>
                      </div>
                      <button
                        onClick={() => alert(`Remove ${asset.symbol}`)}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.08)' }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Target %</p>
                        <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          {asset.targetPercent}%
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Amount per Period</p>
                        <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                          ${asset.amountPerPeriod}
                        </p>
                      </div>
                    </div>

                    {/* Allocation Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text3, fontSize: 10 }}>Current Allocation</p>
                        <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                          {asset.currentPercent}%
                        </p>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, background: c.bg }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${asset.currentPercent}%`,
                            background:
                              Math.abs(asset.currentPercent - asset.targetPercent) <= 2
                                ? '#10B981'
                                : '#F59E0B',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Add Asset Button */}
            <button
              onClick={() => alert('Add new asset')}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              Add Asset
            </button>

            {/* Rebalancing Settings */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings size={16} color={c.text1} />
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Auto Rebalancing</p>
                </div>
                <button
                  onClick={() => setRebalanceEnabled(!rebalanceEnabled)}
                  className="relative"
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    background: rebalanceEnabled ? c.primary : '#6B7280',
                  }}
                >
                  <div
                    className="absolute top-1 transition-all"
                    style={{
                      left: rebalanceEnabled ? 22 : 2,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: '#fff',
                    }}
                  />
                </button>
              </div>

              {rebalanceEnabled && (
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Rebalance Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={rebalanceThreshold}
                    onChange={(e) => setRebalanceThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 13 }}
                  />
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
                    Rebalance when allocation deviates by this %
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Multi-asset DCA giup da dang hoa danh muc. Tu dong phan bo theo ti le muc tieu moi ky.
              </p>
            </div>
          </>
        )}

        {tab === 'Tai san' && (
          <>
            {/* Portfolio Overview */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Portfolio Overview
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Invested</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                    ${totalInvested.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Current Value</p>
                  <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Return</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                    +${totalReturn.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Return %</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                    +{totalReturnPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Allocation Pie Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    key="pie-alloc"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    key="tooltip-pie"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Details */}
            <PageSection label="Chi tiet tai san">
              {MOCK_ALLOCATIONS.map((asset, idx) => (
                <div
                  key={asset.id}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: COLORS[idx % COLORS.length],
                      }}
                    />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{asset.symbol}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{asset.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Invested</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        ${asset.totalInvested.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Value</p>
                      <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                        ${asset.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Shares</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {asset.shares.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Avg Price</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        ${asset.avgPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Rebalance Alert */}
            {needsRebalance && rebalanceEnabled && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <div className="flex items-start gap-2 mb-3">
                  <Settings size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Rebalancing Required
                    </p>
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      Some allocations deviate from target. Next purchase will rebalance automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'Hieu suat' && (
          <>
            {/* Performance Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Investment Growth by Asset
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={PERFORMANCE_DATA}>
                  <XAxis
                    key="x-axis"
                    dataKey="month"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <YAxis
                    key="y-axis"
                    tick={{ fill: c.text3, fontSize: 10 }}
                    axisLine={{ stroke: c.border }}
                  />
                  <Tooltip
                    key="tooltip-bar"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: c.text1,
                    }}
                  />
                  <Legend key="legend" />
                  <Bar key="bar-btc" dataKey="BTC" stackId="stack" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                  <Bar key="bar-eth" dataKey="ETH" stackId="stack" fill={COLORS[1]} radius={[0, 0, 0, 0]} />
                  <Bar key="bar-bnb" dataKey="BNB" stackId="stack" fill={COLORS[2]} radius={[0, 0, 0, 0]} />
                  <Bar key="bar-sol" dataKey="SOL" stackId="stack" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Performance Ranking */}
            <PageSection label="Asset Performance">
              {[...MOCK_ALLOCATIONS]
                .sort((a, b) => {
                  const returnA = ((a.currentValue - a.totalInvested) / a.totalInvested) * 100;
                  const returnB = ((b.currentValue - b.totalInvested) / b.totalInvested) * 100;
                  return returnB - returnA;
                })
                .map((asset, idx) => {
                  const assetReturn = ((asset.currentValue - asset.totalInvested) / asset.totalInvested) * 100;
                  return (
                    <div
                      key={asset.id}
                      className="rounded-xl p-3 flex items-center justify-between"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center" style={{ width: 24 }}>
                          {idx === 0 && <TrendingUp size={18} color="#10B981" />}
                          {idx > 0 && (
                            <p style={{ color: c.text2, fontSize: 13, fontWeight: 700 }}>
                              #{idx + 1}
                            </p>
                          )}
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{asset.symbol}</p>
                          <p style={{ color: c.text3, fontSize: 10 }}>{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                          +{assetReturn.toFixed(2)}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          +${(asset.currentValue - asset.totalInvested).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </PageSection>

            {/* Diversification Score */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle size={16} color="#10B981" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Diversification Score
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Portfolio well diversified across {MOCK_ALLOCATIONS.length} assets
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p style={{ color: '#10B981', fontSize: 28, fontWeight: 700 }}>8.5</p>
                <p style={{ color: c.text3, fontSize: 12 }}>/ 10</p>
              </div>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}