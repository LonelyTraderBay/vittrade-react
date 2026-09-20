/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadLPMonitorPage — Liquidity Pool Monitor (Phase 4.11)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Monitor liquidity pools, track health metrics, volume/price charts,
 *            locked liquidity status, alerts for drops/spikes
 */

import React, { useState, useMemo } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import {
  Droplets, TrendingUp, TrendingDown, AlertCircle,
  ChevronRight, Lock, Activity, BarChart3, Info, CheckCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  MOCK_LIQUIDITY_POOLS, generateLPHistory,
  type LiquidityPool, type PoolAlert,
} from './launchpadData';

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'health', label: 'Health' },
];

const HEALTH_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  healthy: { label: 'Healthy', color: '#10B981', icon: CheckCircle },
  warning: { label: 'Warning', color: '#F59E0B', icon: AlertCircle },
  critical: { label: 'Critical', color: '#EF4444', icon: AlertCircle },
};

const ALERT_CONFIG: Record<string, { color: string; icon: typeof AlertCircle }> = {
  info: { color: '#3B82F6', icon: Info },
  warning: { color: '#F59E0B', icon: AlertCircle },
  critical: { color: '#EF4444', icon: AlertCircle },
};

export function LaunchpadLPMonitorPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('overview');
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);

  const pools = MOCK_LIQUIDITY_POOLS;
  const totalLiquidityUSD = pools.reduce((sum, p) => sum + parseFloat(p.liquidityUSD.replace(/[$,]/g, '')), 0);

  return (
    <PageLayout>
      <Header title="LP Monitor" back />

      {/* Pool detail sheet */}
      {selectedPool && (
        <PoolDetailSheet
          pool={selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}

      <PageContent gap="default">
        {/* Stats Hero */}
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: c.portfolioBg,
            border: `1px solid ${c.portfolioBorder}`,
            boxShadow: c.portfolioShadow,
          }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <Droplets size={22} color="#3B82F6" />
              </div>
              <div>
                <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>LP Monitor</h2>
                <p style={{ color: c.text3, fontSize: 12 }}>Theo dõi thanh khoản</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pools', value: pools.length, color: '#3B82F6' },
                { label: 'Total Liquidity', value: '$' + (totalLiquidityUSD / 1000000).toFixed(2) + 'M', color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 15, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <TabBar variant="underline" tabs={TABS.map(t => t.label)} active={TABS.find(t => t.key === tab)?.label || TABS[0].label}
          onChange={(label) => setTab(TABS.find(t => t.label === label)?.key || 'overview')} />

        {/* Content */}
        {tab === 'overview' && <OverviewTab pools={pools} onSelect={setSelectedPool} />}
        {tab === 'health' && <HealthTab pools={pools} onSelect={setSelectedPool} />}

        {/* Bottom spacer */}
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════════════════════ */

function OverviewTab({ pools, onSelect }: {
  pools: LiquidityPool[];
  onSelect: (p: LiquidityPool) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {pools.map(pool => (
        <LiquidityPoolCard key={pool.id} pool={pool} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Health Tab
   ═══════════════════════════════════════════════════════════ */

function HealthTab({ pools, onSelect }: {
  pools: LiquidityPool[];
  onSelect: (p: LiquidityPool) => void;
}) {
  const c = useThemeColors();
  const poolsWithAlerts = pools.filter(p => p.alerts.length > 0 || p.health !== 'healthy');

  return (
    <div className="flex flex-col gap-3">
      {poolsWithAlerts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: c.surface2 }}>
          <CheckCircle size={40} color="#10B981" className="mx-auto mb-3" />
          <p style={{ color: c.text2, fontSize: 14 }}>Tất cả pools đều healthy</p>
        </div>
      ) : (
        poolsWithAlerts.map(pool => (
          <LiquidityPoolCard key={pool.id} pool={pool} onSelect={onSelect} showAlerts />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Liquidity Pool Card
   ═══════════════════════════════════════════════════════════ */

function LiquidityPoolCard({ pool, onSelect, showAlerts = false }: {
  pool: LiquidityPool;
  onSelect: (p: LiquidityPool) => void;
  showAlerts?: boolean;
}) {
  const c = useThemeColors();
  const healthConfig = HEALTH_CONFIG[pool.health];

  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={() => onSelect(pool)}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: pool.projectLogoColor + '22', border: `2px solid ${pool.projectLogoColor}44`, color: pool.projectLogoColor }}>
            {pool.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{pool.token0}/{pool.token1}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1"
                style={{ background: healthConfig.color + '15', color: healthConfig.color }}>
                <healthConfig.icon size={10} />
                {healthConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: c.text3, fontSize: 11 }}>{pool.dex} · {pool.chain}</span>
            </div>
          </div>
          <ChevronRight size={18} color={c.text3} className="shrink-0 mt-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Liquidity', value: pool.liquidityUSD },
            { label: 'Volume 24h', value: pool.volume24h },
            { label: 'APR', value: pool.apr + '%' },
            { label: 'Price', value: '$' + pool.priceToken0.toFixed(4) },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Changes */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
            style={{ background: pool.priceChange24h >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
            {pool.priceChange24h >= 0 ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
            <span style={{ color: pool.priceChange24h >= 0 ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
              {pool.priceChange24h > 0 ? '+' : ''}{pool.priceChange24h}% price
            </span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
            style={{ background: pool.liquidityChange24h >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
            {pool.liquidityChange24h >= 0 ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
            <span style={{ color: pool.liquidityChange24h >= 0 ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
              {pool.liquidityChange24h > 0 ? '+' : ''}{pool.liquidityChange24h}% liq
            </span>
          </div>
        </div>

        {/* Locked liquidity */}
        <div className="flex items-center gap-2 p-2 rounded-xl mb-2" style={{ background: 'rgba(99,102,241,0.08)' }}>
          <Lock size={12} color="#6366F1" />
          <span style={{ color: c.text2, fontSize: 11 }}>
            <strong>{pool.lockedLiquidity}%</strong> locked {pool.lockedUntil && `until ${pool.lockedUntil}`}
          </span>
        </div>

        {/* Alerts */}
        {showAlerts && pool.alerts.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-3 border-t" style={{ borderColor: c.borderSolid }}>
            {pool.alerts.map(alert => {
              const alertConfig = ALERT_CONFIG[alert.severity];
              return (
                <div key={alert.id} className="flex items-start gap-2 p-2 rounded-xl"
                  style={{ background: alertConfig.color + '08', border: `1px solid ${alertConfig.color}22` }}>
                  <alertConfig.icon size={12} color={alertConfig.color} className="shrink-0 mt-0.5" />
                  <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>{alert.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Pool Detail Sheet
   ═══════════════════════════════════════════════════════════ */

function PoolDetailSheet({ pool, onClose }: {
  pool: LiquidityPool;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const [chartType, setChartType] = useState<'liquidity' | 'volume' | 'price'>('liquidity');
  const historyData = useMemo(() => generateLPHistory(pool.id), [pool.id]);

  const chartConfig = {
    liquidity: { key: 'liquidity', color: '#3B82F6', label: 'Liquidity' },
    volume: { key: 'volume', color: '#10B981', label: 'Volume' },
    price: { key: 'price', color: '#F59E0B', label: 'Price' },
  };
  const currentChart = chartConfig[chartType];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div className="relative w-full max-h-[85vh] rounded-t-3xl overflow-y-auto"
        style={{ background: c.bg, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 flex items-center justify-between"
          style={{ background: c.bg, borderBottom: `1px solid ${c.borderSolid}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold"
              style={{ background: pool.projectLogoColor + '22', color: pool.projectLogoColor }}>
              {pool.projectLogo}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pool.token0}/{pool.token1}</h3>
              <p style={{ color: c.text3, fontSize: 12 }}>{pool.dex} · {pool.chain}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover-ghost" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <CheckCircle size={18} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Chart type selector */}
          <div className="flex gap-2">
            {(['liquidity', 'volume', 'price'] as const).map(type => (
              <button key={type}
                onClick={() => setChartType(type)}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: chartType === type ? chartConfig[type].color : c.surface2,
                  color: chartType === type ? '#fff' : c.text2,
                  border: `1px solid ${chartType === type ? chartConfig[type].color : c.borderSolid}`,
                }}>
                {chartConfig[type].label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-3" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={historyData}>
                <XAxis key="x-axis" dataKey="time" tick={{ fill: c.text3, fontSize: 10 }} stroke={c.borderSolid} />
                <YAxis key="y-axis" tick={{ fill: c.text3, fontSize: 10 }} stroke={c.borderSolid} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: c.text3 }}
                  itemStyle={{ color: c.text1 }}
                />
                <Line key="line-data" type="monotone" dataKey={currentChart.key} stroke={currentChart.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pool info */}
          <PageSection label="Pool Information" accentColor={pool.projectLogoColor}>
            <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: c.surface2 }}>
              {[
                { label: 'Pair Address', value: pool.pairAddress },
                { label: 'Total Liquidity', value: pool.liquidityUSD },
                { label: 'Volume 24h', value: pool.volume24h },
                { label: 'Fees 24h', value: pool.fees24h },
                { label: 'APR', value: pool.apr + '%' },
                { label: 'Transactions 24h', value: pool.txCount24h.toLocaleString() },
                { label: 'Holders', value: pool.holders.toLocaleString() },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: 11 }}>{r.label}</span>
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </PageSection>

          {/* Alerts */}
          {pool.alerts.length > 0 && (
            <PageSection label="Alerts" accentColor="#EF4444">
              <div className="flex flex-col gap-2">
                {pool.alerts.map(alert => {
                  const alertConfig = ALERT_CONFIG[alert.severity];
                  return (
                    <div key={alert.id} className="rounded-xl p-2.5 flex items-start gap-2"
                      style={{ background: alertConfig.color + '08', border: `1px solid ${alertConfig.color}22` }}>
                      <alertConfig.icon size={14} color={alertConfig.color} className="shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{alert.message}</p>
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{alert.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageSection>
          )}
        </div>
      </div>
    </div>
  );
}