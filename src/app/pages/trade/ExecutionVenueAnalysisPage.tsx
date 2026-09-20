/**
 * ══════════════════════════════════════════════════════════════
 *  ExecutionVenueAnalysisPage — Phase 4 Sprint 1 Day 9-10
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Detailed execution venue comparison & analysis
 * - Cost breakdown (fees, spread, market impact)
 * - Speed analysis (latency, fill time)
 * - Liquidity metrics
 * - Venue selection optimization
 * 
 * Compliance:
 * - Supports Best Execution obligation (MiFID II Art. 27)
 * - Transparency in venue selection criteria
 * - Data-driven decision making
 * - Cost-benefit analysis for clients
 * 
 * Features:
 * - Side-by-side venue comparison
 * - Historical performance trends
 * - Cost efficiency ranking
 * - Speed efficiency ranking
 * - Liquidity depth analysis
 * - Custom filters & sorting
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Interactive comparison tables
 * - Charts for trends
 * - Export capabilities
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, DollarSign, Zap, Activity, BarChart3, Filter,
  Download, ChevronDown, Target, Award, CheckCircle, Shield,
  Clock, TrendingDown
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtNum, fmtPct } from '../../data/formatNumber';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

type TabType = 'comparison' | 'costs' | 'speed' | 'trends';
type SortBy = 'volume' | 'cost' | 'speed' | 'fill-rate';

interface VenueMetrics {
  venue: string;
  volume: number;
  value: number;
  avgFee: number; // percentage
  avgSpread: number; // bps
  marketImpact: number; // bps
  totalCost: number; // bps
  avgLatency: number; // ms
  avgFillTime: number; // seconds
  fillRate: number; // percentage
  liquidity: number; // USD millions available
  reliability: number; // percentage uptime
}

const VENUE_METRICS: VenueMetrics[] = [
  {
    venue: 'Binance',
    volume: 12450,
    value: 852000000,
    avgFee: 0.08,
    avgSpread: 2.5,
    marketImpact: 1.2,
    totalCost: 3.88,
    avgLatency: 45,
    avgFillTime: 0.3,
    fillRate: 99.8,
    liquidity: 250,
    reliability: 99.95,
  },
  {
    venue: 'Coinbase Pro',
    volume: 8920,
    value: 610000000,
    avgFee: 0.12,
    avgSpread: 3.0,
    marketImpact: 1.5,
    totalCost: 4.82,
    avgLatency: 65,
    avgFillTime: 0.5,
    fillRate: 99.5,
    liquidity: 180,
    reliability: 99.90,
  },
  {
    venue: 'Kraken',
    volume: 6780,
    value: 465000000,
    avgFee: 0.10,
    avgSpread: 2.8,
    marketImpact: 1.3,
    totalCost: 4.30,
    avgLatency: 55,
    avgFillTime: 0.4,
    fillRate: 99.3,
    liquidity: 150,
    reliability: 99.85,
  },
  {
    venue: 'Bybit',
    volume: 4560,
    value: 312000000,
    avgFee: 0.09,
    avgSpread: 2.6,
    marketImpact: 1.4,
    totalCost: 4.19,
    avgLatency: 50,
    avgFillTime: 0.35,
    fillRate: 98.9,
    liquidity: 120,
    reliability: 99.80,
  },
  {
    venue: 'OKX',
    volume: 3920,
    value: 268000000,
    avgFee: 0.11,
    avgSpread: 3.2,
    marketImpact: 1.6,
    totalCost: 5.01,
    avgLatency: 60,
    avgFillTime: 0.45,
    fillRate: 98.5,
    liquidity: 100,
    reliability: 99.75,
  },
];

const COST_TRENDS = [
  { month: 'Nov', binance: 3.9, coinbase: 4.9, kraken: 4.4 },
  { month: 'Dec', binance: 3.85, coinbase: 4.85, kraken: 4.35 },
  { month: 'Jan', binance: 3.88, coinbase: 4.82, kraken: 4.30 },
];

export function ExecutionVenueAnalysisPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('comparison');
  const [sortBy, setSortBy] = useState<SortBy>('volume');

  const sortedVenues = useMemo(() => {
    const sorted = [...VENUE_METRICS];
    if (sortBy === 'volume') sorted.sort((a, b) => b.volume - a.volume);
    else if (sortBy === 'cost') sorted.sort((a, b) => a.totalCost - b.totalCost);
    else if (sortBy === 'speed') sorted.sort((a, b) => a.avgFillTime - b.avgFillTime);
    else if (sortBy === 'fill-rate') sorted.sort((a, b) => b.fillRate - a.fillRate);
    return sorted;
  }, [sortBy]);

  const TABS = [
    { id: 'comparison' as TabType, label: 'Comparison' },
    { id: 'costs' as TabType, label: 'Costs' },
    { id: 'speed' as TabType, label: 'Speed' },
    { id: 'trends' as TabType, label: 'Trends' },
  ];

  const SORT_OPTIONS: { id: SortBy; label: string }[] = [
    { id: 'volume', label: 'Volume' },
    { id: 'cost', label: 'Lowest Cost' },
    { id: 'speed', label: 'Fastest' },
    { id: 'fill-rate', label: 'Best Fill Rate' },
  ];

  return (
    <PageLayout>
      <Header
        title="Execution Venue Analysis"
        subtitle="Detailed Comparison"
        back
        action={{
          icon: Download,
          onClick: () => console.log('Export analysis'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Total Venues</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {VENUE_METRICS.length}
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              Active integrations
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Avg Total Cost</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {(VENUE_METRICS.reduce((s, v) => s + v.totalCost, 0) / VENUE_METRICS.length).toFixed(2)} bps
            </p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
              -5% vs last quarter
            </p>
          </TrCard>

          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 10 }}>Avg Fill Time</p>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {(VENUE_METRICS.reduce((s, v) => s + v.avgFillTime, 0) / VENUE_METRICS.length).toFixed(2)}s
            </p>
            <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
              -12% vs last quarter
            </p>
          </TrCard>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 11 }}>Sort by:</span>
          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: sortBy === opt.id ? c.primary : c.surface2,
                  color: sortBy === opt.id ? '#fff' : c.text2,
                  fontWeight: sortBy === opt.id ? 600 : 500,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'comparison' && (
          <PageSection label="Venue Comparison">
            <div className="space-y-3">
              {sortedVenues.map((venue, idx) => (
                <TrCard key={venue.venue} className="p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: idx === 0 ? '#F59E0B' + '15' : c.surface2 }}>
                      <span style={{
                        color: idx === 0 ? '#F59E0B' : c.text2,
                        fontSize: 14,
                        fontWeight: 700
                      }}>
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                        {venue.venue}
                      </p>
                      <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                        {fmtNum(venue.volume)} orders • {fmtUsd(venue.value)}
                      </p>
                    </div>

                    {idx === 0 && <Award size={16} color="#F59E0B" />}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Total Cost</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {venue.totalCost.toFixed(2)} bps
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Fill Time</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {venue.avgFillTime}s
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Fill Rate</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        {venue.fillRate}%
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Liquidity</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                        ${venue.liquidity}M
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'costs' && (
          <PageSection label="Cost Breakdown">
            <div className="space-y-3">
              {sortedVenues.map((venue) => (
                <TrCard key={venue.venue} className="p-4">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                    {venue.venue}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: c.text3, fontSize: 10 }}>Trading Fee</span>
                        <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                          {venue.avgFee}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div className="h-full rounded-full" style={{
                          width: `${(venue.avgFee / 0.12) * 100}%`,
                          background: '#3B82F6'
                        }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: c.text3, fontSize: 10 }}>Spread Cost</span>
                        <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                          {venue.avgSpread.toFixed(1)} bps
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div className="h-full rounded-full" style={{
                          width: `${(venue.avgSpread / 3.2) * 100}%`,
                          background: '#10B981'
                        }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: c.text3, fontSize: 10 }}>Market Impact</span>
                        <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                          {venue.marketImpact.toFixed(1)} bps
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div className="h-full rounded-full" style={{
                          width: `${(venue.marketImpact / 1.6) * 100}%`,
                          background: '#F59E0B'
                        }} />
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t" style={{ borderColor: c.border }}>
                      <div className="flex items-center justify-between">
                        <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Total Cost</span>
                        <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                          {venue.totalCost.toFixed(2)} bps
                        </span>
                      </div>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'speed' && (
          <PageSection label="Speed Metrics">
            <div className="space-y-3">
              {sortedVenues.map((venue) => (
                <TrCard key={venue.venue} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                      {venue.venue}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} color={venue.avgFillTime < 0.4 ? '#10B981' : '#F59E0B'} />
                      <span style={{
                        color: venue.avgFillTime < 0.4 ? '#10B981' : '#F59E0B',
                        fontSize: 14,
                        fontWeight: 700
                      }}>
                        {venue.avgFillTime}s
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Latency</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                        {venue.avgLatency}ms
                      </p>
                    </div>

                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9 }}>Reliability</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                        {venue.reliability}%
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'trends' && (
          <PageSection label="Cost Trends (Last 3 Months)">
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={COST_TRENDS}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />
                  <XAxis key="x-axis" dataKey="month" stroke={c.text3} style={{ fontSize: 10 }} />
                  <YAxis key="y-axis" stroke={c.text3} style={{ fontSize: 10 }} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Line key="line-binance" type="monotone" dataKey="binance" name="Binance" stroke="#F59E0B" strokeWidth={2} />
                  <Line key="line-coinbase" type="monotone" dataKey="coinbase" name="Coinbase" stroke="#3B82F6" strokeWidth={2} />
                  <Line key="line-kraken" type="monotone" dataKey="kraken" name="Kraken" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: c.border }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Binance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Coinbase</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                  <span style={{ color: c.text3, fontSize: 10 }}>Kraken</span>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg" style={{ background: c.successBg }}>
                <p style={{ color: c.successText, fontSize: 11, fontWeight: 600 }}>
                  ✓ Overall costs trending down 5% over last 3 months
                </p>
              </div>
            </TrCard>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}