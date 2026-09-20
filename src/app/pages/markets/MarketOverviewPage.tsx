/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET OVERVIEW DASHBOARD — P0 Enterprise Market Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Global market cap, BTC dominance, Fear & Greed, sector performance,
 *  market breadth, trending, quick navigation to movers/sectors.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, ChevronRight, BarChart3,
  Activity, Globe, Layers, Gauge, ArrowUpRight, ArrowDownRight,
  PieChart, Zap, Target,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtCompact, fmtPct, fmtPrice } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  GLOBAL_MARKET_STATS,
  MARKET_BREADTH,
  FEAR_GREED_HISTORY,
  MARKET_SECTORS,
  getTopGainers,
  getTopLosers,
} from '../../data/marketOverviewData';
import { CRYPTO_PAIRS } from '../../data/mockData';

/* ─── Fear & Greed Gauge ─── */
function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const c = useThemeColors();
  const getColor = (v: number) => {
    if (v <= 25) return '#EF4444';
    if (v <= 45) return '#F59E0B';
    if (v <= 55) return '#6B7280';
    if (v <= 75) return '#10B981';
    return '#059669';
  };
  const color = getColor(value);
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 120, height: 64, overflow: 'hidden' }}>
        {/* Background arc */}
        <svg width="120" height="64" viewBox="0 0 120 64">
          <defs>
            <linearGradient id="fgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="25%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#6B7280" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="url(#fgGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity={0.25}
          />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="url(#fgGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 157} 157`}
          />
          {/* Needle */}
          <line
            x1="60" y1="60"
            x2={60 + 35 * Math.cos((rotation * Math.PI) / 180)}
            y2={60 + 35 * Math.sin((rotation * Math.PI) / 180)}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="4" fill={color} />
        </svg>
      </div>
      <span style={{ fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, color, fontFamily: 'monospace' }}>
        {value}
      </span>
      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  label, value, change, icon: Icon, color,
}: {
  label: string; value: string; change?: number; icon: React.ElementType; color: string;
}) {
  const c = useThemeColors();
  const isPositive = (change ?? 0) >= 0;

  return (
    <TrCard className="p-3 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, fontWeight: FONT_WEIGHT.medium }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
        {value}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
          <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, color: isPositive ? '#10B981' : '#EF4444' }}>
            {fmtPct(change)}
          </span>
        </div>
      )}
    </TrCard>
  );
}

/* ─── Sector Row ─── */
function SectorRow({ sector, onClick }: { sector: typeof MARKET_SECTORS[0]; onClick: () => void }) {
  const c = useThemeColors();
  const isPos = sector.change24h >= 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 w-full"
      style={{ borderBottom: `1px solid ${c.divider}` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${sector.color}15` }}
      >
        <span style={{ fontSize: 16 }}>{sector.icon}</span>
      </div>
      <div className="flex-1 text-left">
        <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
          {sector.nameVi}
        </p>
        <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
          {sector.coinCount} coins
        </p>
      </div>
      <div className="text-right mr-1">
        <p style={{
          fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold,
          color: isPos ? '#10B981' : '#EF4444', fontFamily: 'monospace',
        }}>
          {isPos ? '+' : ''}{fmtPct(sector.change24h)}
        </p>
        <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
          {fmtCompact(sector.totalMarketCap, { prefix: '$' })}
        </p>
      </div>
      <ChevronRight size={14} color={c.text3} />
    </button>
  );
}

/* ─── Quick Mover Row ─── */
function QuickMoverRow({ symbol, price, change, color }: {
  symbol: string; price: number; change: number; color: string;
}) {
  const c = useThemeColors();
  const isPos = change >= 0;

  return (
    <div className="flex items-center gap-2 py-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}
      >
        <span style={{ fontSize: 10, fontWeight: FONT_WEIGHT.bold, color }}>{symbol.slice(0, 3)}</span>
      </div>
      <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, flex: 1 }}>
        {symbol}
      </span>
      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
        {fmtPrice(price)}
      </span>
      <span
        className="rounded-lg px-2 py-1"
        style={{
          fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
          color: isPos ? '#10B981' : '#EF4444',
          background: isPos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        }}
      >
        {isPos ? '+' : ''}{fmtPct(change)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function MarketOverviewPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const stats = GLOBAL_MARKET_STATS;
  const breadth = MARKET_BREADTH;
  const topGainers = getTopGainers('24h', 5);
  const topLosers = getTopLosers('24h', 5);
  const topSectors = [...MARKET_SECTORS].sort((a, b) => b.change24h - a.change24h);

  return (
    <PageLayout>
      <Header title="Tổng quan thị trường" back />
      <PageContent gap="relaxed">

        {/* ─── Hero: Global Market Cap ─── */}
        <TrCard variant="hero" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} color="#3B82F6" />
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
              Tổng vốn hóa thị trường
            </span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span style={{
              fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace',
            }}>
              {fmtCompact(stats.totalMarketCap, { prefix: '$' })}
            </span>
            <span
              className="rounded-lg px-2 py-0.5 mb-0.5"
              style={{
                fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
                color: stats.totalMarketCapChange24h >= 0 ? '#10B981' : '#EF4444',
                background: stats.totalMarketCapChange24h >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              }}
            >
              {stats.totalMarketCapChange24h >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(stats.totalMarketCapChange24h))}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>BTC Dominance</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#F7931A', fontFamily: 'monospace' }}>
                {stats.btcDominance}%
              </p>
            </div>
            <div className="rounded-xl p-2" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>ETH Dominance</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#627EEA', fontFamily: 'monospace' }}>
                {stats.ethDominance}%
              </p>
            </div>
            <div className="rounded-xl p-2" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>KL 24h</p>
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
                {fmtCompact(stats.total24hVolume, { prefix: '$' })}
              </p>
            </div>
          </div>
        </TrCard>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="DeFi TVL"
            value={fmtCompact(stats.defiTVL, { prefix: '$' })}
            change={stats.defiTVLChange24h}
            icon={Layers}
            color="#8B5CF6"
          />
          <StatCard
            label="Stablecoin Vol"
            value={fmtCompact(stats.stablecoinVolume24h, { prefix: '$' })}
            icon={Activity}
            color="#3B82F6"
          />
          <StatCard
            label="Tổng coin"
            value={stats.totalCoins.toLocaleString()}
            icon={PieChart}
            color="#10B981"
          />
          <StatCard
            label="Sàn giao dịch"
            value={stats.totalExchanges.toLocaleString()}
            icon={BarChart3}
            color="#F59E0B"
          />
        </div>

        {/* ─── Fear & Greed + Market Breadth ─── */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 self-start">
              <Gauge size={14} color="#F59E0B" />
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
                Fear & Greed
              </span>
            </div>
            <FearGreedGauge value={stats.fearGreedIndex} label={stats.fearGreedLabel} />
          </TrCard>

          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} color="#3B82F6" />
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>
                Biến động thị trường
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>Tăng</span>
                </div>
                <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#10B981', fontFamily: 'monospace' }}>
                  {breadth.advancing.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                  <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>Giảm</span>
                </div>
                <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#EF4444', fontFamily: 'monospace' }}>
                  {breadth.declining.toLocaleString()}
                </span>
              </div>
              {/* Bar */}
              <div className="flex rounded-full overflow-hidden" style={{ height: 6 }}>
                <div style={{
                  width: `${(breadth.advancing / (breadth.advancing + breadth.declining)) * 100}%`,
                  background: '#10B981',
                }} />
                <div style={{ flex: 1, background: '#EF4444' }} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>
                  {breadth.newATH} ATH mới
                </span>
                <span style={{ fontSize: FONT_SCALE.micro, color: '#EF4444' }}>
                  {breadth.dropping10Pct} giảm &gt;10%
                </span>
              </div>
            </div>
          </TrCard>
        </div>

        {/* ─── Quick Navigation ─── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Biến động', icon: TrendingUp, color: '#10B981', path: 'movers' },
            { label: 'Ngành', icon: Layers, color: '#8B5CF6', path: 'sectors' },
            { label: 'Heatmap', icon: BarChart3, color: '#3B82F6', path: 'heatmap' },
          ].map(item => (
            <TrCard
              key={item.path}
              as="button"
              hover
              className="p-3 flex flex-col items-center gap-2"
              onClick={() => navigate(`${prefix}/markets/${item.path}`)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}12` }}
              >
                <item.icon size={18} color={item.color} />
              </div>
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                {item.label}
              </span>
            </TrCard>
          ))}
        </div>

        {/* ─── Top Gainers & Losers ─── */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => navigate(`${prefix}/markets/movers`)}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={14} color="#10B981" />
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#10B981' }}>
                  Tăng mạnh
                </span>
              </div>
              <ChevronRight size={12} color={c.text3} />
            </button>
            {topGainers.map(m => (
              <QuickMoverRow key={m.id} symbol={m.symbol} price={m.price} change={m.change24h} color={m.color} />
            ))}
          </TrCard>

          <TrCard className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => navigate(`${prefix}/markets/movers`)}
            >
              <div className="flex items-center gap-2">
                <TrendingDown size={14} color="#EF4444" />
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#EF4444' }}>
                  Giảm mạnh
                </span>
              </div>
              <ChevronRight size={12} color={c.text3} />
            </button>
            {topLosers.map(m => (
              <QuickMoverRow key={m.id} symbol={m.symbol} price={m.price} change={m.change24h} color={m.color} />
            ))}
          </TrCard>
        </div>

        {/* ─── Sector Performance ─── */}
        <PageSection label="Hiệu suất ngành" accentColor="#8B5CF6">
          <TrCard className="px-4">
            {topSectors.slice(0, 5).map(sector => (
              <SectorRow
                key={sector.id}
                sector={sector}
                onClick={() => navigate(`${prefix}/markets/sectors?id=${sector.id}`)}
              />
            ))}
            <button
              className="flex items-center justify-center gap-2 w-full py-3"
              onClick={() => navigate(`${prefix}/markets/sectors`)}
            >
              <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: '#3B82F6' }}>
                Xem tất cả ngành
              </span>
              <ChevronRight size={12} color="#3B82F6" />
            </button>
          </TrCard>
        </PageSection>

        {/* ─── Fear & Greed History ─── */}
        <PageSection label="Lịch sử Fear & Greed (7 ngày)" accentColor="#F59E0B">
          <TrCard className="p-4">
            <div className="flex items-end gap-1" style={{ height: 80 }}>
              {FEAR_GREED_HISTORY.map((point, i) => {
                const height = (point.value / 100) * 64;
                const getBarColor = (v: number) => {
                  if (v <= 25) return '#EF4444';
                  if (v <= 45) return '#F59E0B';
                  if (v <= 55) return '#6B7280';
                  return '#10B981';
                };
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span style={{ fontSize: 8, color: c.text3, fontFamily: 'monospace' }}>{point.value}</span>
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height,
                        background: getBarColor(point.value),
                        opacity: i === FEAR_GREED_HISTORY.length - 1 ? 1 : 0.6,
                        minWidth: 4,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ fontSize: 8, color: c.text3 }}>7 ngày trước</span>
              <span style={{ fontSize: 8, color: c.text3 }}>Hôm nay</span>
            </div>
          </TrCard>
        </PageSection>

        {/* ─── Quick Links ─── */}
        <PageSection label="Công cụ thị trường" accentColor="#3B82F6">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Danh sách theo dõi', icon: '⭐', path: 'watchlist' },
              { label: 'Cảnh báo giá', icon: '🔔', path: 'alerts' },
              { label: 'Biểu đồ nhiệt', icon: '🗺️', path: 'heatmap' },
              { label: 'Danh sách thị trường', icon: '📋', path: '' },
            ].map(item => (
              <TrCard
                key={item.path}
                as="button"
                hover
                className="p-3 flex items-center gap-3"
                onClick={() => navigate(`${prefix}/markets/${item.path}`)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.medium, color: c.text1 }}>
                  {item.label}
                </span>
              </TrCard>
            ))}
          </div>
        </PageSection>
      </PageContent>
    </PageLayout>
  );
}