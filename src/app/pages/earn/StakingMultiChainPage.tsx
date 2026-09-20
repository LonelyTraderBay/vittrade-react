import React, { useState } from 'react';
import { Globe, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router';

const CHAIN_POSITIONS = [
  { chain: 'Ethereum', asset: 'ETH', staked: 125.5, value: 287650, apy: 4.2, color: '#627EEA', logo: '⟠' },
  { chain: 'Polygon', asset: 'MATIC', staked: 50000, value: 45000, apy: 8.5, color: '#8247E5', logo: '◮' },
  { chain: 'Avalanche', asset: 'AVAX', staked: 1200, value: 48000, apy: 6.8, color: '#E84142', logo: '▲' },
  { chain: 'Cosmos', asset: 'ATOM', staked: 3500, value: 38500, apy: 12.5, color: '#2E3148', logo: '⚛' },
  { chain: 'Solana', asset: 'SOL', staked: 450, value: 63000, apy: 7.2, color: '#14F195', logo: '◎' },
];

const CROSS_CHAIN_STATS = {
  totalValue: 482150,
  totalRewards24h: 156.8,
  avgApy: 7.84,
  activeChains: 5,
};

export function StakingMultiChainPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const pieData = CHAIN_POSITIONS.map(p => ({ name: p.chain, value: p.value, color: p.color }));

  return (
    <PageLayout>
      <Header title="Multi-Chain Portfolio" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1.5px solid rgba(139,92,246,0.2)' }}>
          <div className="flex gap-3">
            <Globe size={20} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Cross-Chain Staking Hub
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Manage staking positions across Ethereum, Polygon, Avalanche, Cosmos, and Solana from one dashboard. Unified rewards tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Total Stats */}
        <TrCard className="p-4">
          <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Total Portfolio Value</p>
          <div className="flex items-baseline gap-2 mb-3">
            <p style={{ color: c.text1, fontSize: 28, fontWeight: 700 }}>
              ${CROSS_CHAIN_STATS.totalValue.toLocaleString()}
            </p>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
              +12.4%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>24h Rewards</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                +${CROSS_CHAIN_STATS.totalRewards24h.toFixed(2)}
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Avg APY</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                {CROSS_CHAIN_STATS.avgApy}%
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: 10 }}>Active Chains</p>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                {CROSS_CHAIN_STATS.activeChains}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Allocation Chart */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Chain Allocation
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                key="pie-mc"
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-multichain-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="tooltip-mc"
                contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 12, padding: 8 }}
                labelStyle={{ color: c.text1, fontSize: 12, fontWeight: 700 }}
                itemStyle={{ color: c.text2, fontSize: 11 }}
                formatter={(value: any) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <p style={{ color: c.text2, fontSize: 11 }}>
                  {item.name} {((item.value / CROSS_CHAIN_STATS.totalValue) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Chain Positions */}
        <PageSection label="Positions by Chain">
          <div className="flex flex-col gap-2">
            {CHAIN_POSITIONS.map(position => (
              <TrCard key={position.chain} hover className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${position.color}15` }}>
                    {position.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                        {position.chain}
                      </p>
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                        ${position.value.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {position.staked.toLocaleString()} {position.asset}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                        {position.apy}% APY
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/earn/dashboard')}
                  className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                  style={{ background: c.surface2, color: c.text1 }}>
                  Manage Position
                  <ArrowRight size={14} />
                </button>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Quick Actions */}
        <PageSection label="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <TrCard hover className="p-4">
              <TrendingUp size={24} color="#10B981" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Rebalance
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>
                Optimize allocation across chains
              </p>
            </TrCard>
            <TrCard hover className="p-4">
              <Globe size={24} color="#3B82F6" className="mb-2" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Add Chain
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>
                Expand to new networks
              </p>
            </TrCard>
          </div>
        </PageSection>

        {/* Performance Comparison */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            APY Comparison
          </p>
          <div className="space-y-2">
            {CHAIN_POSITIONS.sort((a, b) => b.apy - a.apy).map(position => (
              <div key={position.chain}>
                <div className="flex items-center justify-between mb-1">
                  <p style={{ color: c.text2, fontSize: 12 }}>{position.chain}</p>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{position.apy}%</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                  <div
                    className="h-full"
                    style={{
                      background: position.color,
                      width: `${(position.apy / 12.5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Cross-Chain Benefits */}
        <PageSection label="Why Multi-Chain?">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { title: 'Diversification', desc: 'Reduce risk by spreading across multiple blockchains' },
                { title: 'APY Optimization', desc: 'Access higher yields on different networks' },
                { title: 'Network Resilience', desc: 'Not dependent on single chain performance' },
                { title: 'Gas Efficiency', desc: 'Choose low-cost chains for smaller positions' },
              ].map((benefit, idx) => (
                <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {benefit.title}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Technical Note */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex gap-3">
            <AlertCircle size={16} color={c.text3} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
              Cross-chain positions require separate wallet connections for each network. Bridge fees apply when moving assets between chains. Always verify contract addresses.
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}