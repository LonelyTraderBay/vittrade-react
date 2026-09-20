/**
 * ══════════════════════════════════════════════════════════════
 *  BestExecutionReportsPage — Phase 4 Sprint 1 Day 7-8
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - MiFID II RTS 27/28 compliance (Best Execution reports)
 * - Quarterly Top 5 execution venues disclosure
 * - Quality of execution metrics
 * - Client-facing transparency reports
 * 
 * Compliance:
 * - RTS 27: Annual Top 5 venues (retail clients)
 * - RTS 28: Quarterly Top 5 venues (professional clients)
 * - Quality criteria: Price, costs, speed, likelihood, settlement
 * - Public disclosure requirement
 * - PDF/XML export for regulatory submission
 * 
 * Features:
 * - Quarterly reports archive
 * - Top 5 execution venues ranking
 * - Quality metrics breakdown
 * - Volume & value statistics
 * - PDF export capability
 * - Regulator-ready format
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Professional report layout
 * - Export buttons prominent
 * - Compliance-first transparency
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText, Download, TrendingUp, Target, Clock, DollarSign,
  CheckCircle, Award, BarChart3, Calendar, ExternalLink, Shield,
  ChevronRight, Info, Eye
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtNum, fmtPct } from '../../data/formatNumber';

type TabType = 'current' | 'archive';

interface ExecutionVenue {
  rank: number;
  venue: string;
  volume: number;
  value: number;
  avgPrice: number;
  avgCost: number;
  avgSpeed: number; // seconds
  fillRate: number; // percentage
  score: number; // composite quality score 0-100
}

interface QuarterlyReport {
  id: string;
  quarter: string;
  year: number;
  period: string;
  totalOrders: number;
  totalValue: number;
  publishDate: string;
  status: 'published' | 'draft' | 'pending';
}

// Mock data - Current Q1 2026
const CURRENT_TOP_5: ExecutionVenue[] = [
  {
    rank: 1,
    venue: 'Binance',
    volume: 12450,
    value: 852000000,
    avgPrice: 68450,
    avgCost: 0.08,
    avgSpeed: 0.3,
    fillRate: 99.8,
    score: 96.5,
  },
  {
    rank: 2,
    venue: 'Coinbase Pro',
    volume: 8920,
    value: 610000000,
    avgPrice: 68400,
    avgCost: 0.12,
    avgSpeed: 0.5,
    fillRate: 99.5,
    score: 94.2,
  },
  {
    rank: 3,
    venue: 'Kraken',
    volume: 6780,
    value: 465000000,
    avgPrice: 68550,
    avgCost: 0.10,
    avgSpeed: 0.4,
    fillRate: 99.3,
    score: 93.8,
  },
  {
    rank: 4,
    venue: 'Bybit',
    volume: 4560,
    value: 312000000,
    avgPrice: 68500,
    avgCost: 0.09,
    avgSpeed: 0.35,
    fillRate: 98.9,
    score: 92.1,
  },
  {
    rank: 5,
    venue: 'OKX',
    volume: 3920,
    value: 268000000,
    avgPrice: 68600,
    avgCost: 0.11,
    avgSpeed: 0.45,
    fillRate: 98.5,
    score: 90.5,
  },
];

const REPORT_ARCHIVE: QuarterlyReport[] = [
  {
    id: 'Q1-2026',
    quarter: 'Q1',
    year: 2026,
    period: 'Jan 1 - Mar 31, 2026',
    totalOrders: 36630,
    totalValue: 2507000000,
    publishDate: '2026-04-15',
    status: 'draft',
  },
  {
    id: 'Q4-2025',
    quarter: 'Q4',
    year: 2025,
    period: 'Oct 1 - Dec 31, 2025',
    totalOrders: 32450,
    totalValue: 2210000000,
    publishDate: '2026-01-15',
    status: 'published',
  },
  {
    id: 'Q3-2025',
    quarter: 'Q3',
    year: 2025,
    period: 'Jul 1 - Sep 30, 2025',
    totalOrders: 28900,
    totalValue: 1980000000,
    publishDate: '2025-10-15',
    status: 'published',
  },
];

export function BestExecutionReportsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('current');

  const TABS = [
    { id: 'current' as TabType, label: 'Q1 2026 (Current)' },
    { id: 'archive' as TabType, label: 'Archive' },
  ];

  const handleExportPDF = (reportId: string) => {
    console.log('Export PDF:', reportId);
    // In production: generate PDF report
  };

  const handlePublishReport = () => {
    console.log('Publish Q1 2026 report');
    // In production: submit to regulator
  };

  return (
    <PageLayout>
      <Header
        title="Best Execution Reports"
        subtitle="RTS 27 / RTS 28 Compliance"
        back
        action={{
          icon: Download,
          onClick: () => handleExportPDF('Q1-2026'),
        }}
      />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Shield size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              MiFID II RTS 27/28 Compliance
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              Quarterly disclosure of Top 5 execution venues by trading volume. Reports assessed on price, cost, speed, likelihood of execution, and settlement.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} color={c.primary} />
              <span style={{ color: c.text3, fontSize: 10 }}>Total Orders</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {fmtNum(CURRENT_TOP_5.reduce((s, v) => s + v.volume, 0))}
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              Q1 2026 (YTD)
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} color="#10B981" />
              <span style={{ color: c.text3, fontSize: 10 }}>Total Value</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              ${(CURRENT_TOP_5.reduce((s, v) => s + v.value, 0) / 1000000000).toFixed(2)}B
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              Executed value
            </p>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Award size={14} color="#F59E0B" />
              <span style={{ color: c.text3, fontSize: 10 }}>Avg Score</span>
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
              {(CURRENT_TOP_5.reduce((s, v) => s + v.score, 0) / CURRENT_TOP_5.length).toFixed(1)}
            </p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
              Quality index
            </p>
          </TrCard>
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'current' && (
          <>
            {/* Top 5 Venues */}
            <PageSection label="Top 5 Execution Venues (By Volume)">
              <div className="space-y-3">
                {CURRENT_TOP_5.map((venue) => (
                  <TrCard key={venue.rank} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Rank Badge */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: venue.rank === 1 ? '#F59E0B' + '15' : c.surface2,
                          border: venue.rank === 1 ? `2px solid #F59E0B` : 'none',
                        }}>
                        <span style={{
                          color: venue.rank === 1 ? '#F59E0B' : c.text1,
                          fontSize: 18,
                          fontWeight: 700
                        }}>
                          #{venue.rank}
                        </span>
                      </div>

                      {/* Venue Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                            {venue.venue}
                          </span>
                          {venue.rank === 1 && (
                            <Award size={14} color="#F59E0B" />
                          )}
                        </div>
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          {fmtNum(venue.volume)} orders • {fmtUsd(venue.value)} value
                        </p>
                      </div>

                      {/* Quality Score */}
                      <div className="text-right">
                        <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                          {venue.score.toFixed(1)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>Quality</p>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Avg Price</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                          ${venue.avgPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Cost</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                          {venue.avgCost}%
                        </p>
                      </div>

                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Speed</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                          {venue.avgSpeed}s
                        </p>
                      </div>

                      <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 9 }}>Fill Rate</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                          {venue.fillRate}%
                        </p>
                      </div>
                    </div>

                    {/* Quality Score Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: c.text3, fontSize: 9 }}>Composite Quality Score</span>
                        <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                          {venue.score.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div className="h-full rounded-full" style={{
                          width: `${venue.score}%`,
                          background: venue.score >= 90 ? '#10B981' : venue.score >= 80 ? '#F59E0B' : '#EF4444'
                        }} />
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>

              <button
                onClick={() => navigate(`${prefix}/trade/copy-trading/execution-venue-analysis`)}
                className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: c.surface2,
                  color: c.text1,
                  height: 44,
                  fontWeight: 600,
                  fontSize: 13,
                  border: `1px solid ${c.border}`,
                }}>
                <BarChart3 size={16} />
                <span>View Detailed Analysis</span>
                <ChevronRight size={14} />
              </button>
            </PageSection>

            {/* Publish Report */}
            <PageSection label="Report Actions">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: c.primary + '15' }}>
                    <FileText size={22} color={c.primary} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      Q1 2026 Best Execution Report
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                      Report period: Jan 1 - Mar 31, 2026. Due date: April 15, 2026. Status: Draft.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF('Q1-2026')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      background: c.surface2,
                      color: c.text1,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${c.border}`,
                    }}>
                    <Download size={14} />
                    <span>Export PDF</span>
                  </button>

                  <button
                    onClick={handlePublishReport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      background: c.primary,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                    <ExternalLink size={14} />
                    <span>Publish Report</span>
                  </button>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'archive' && (
          <PageSection label="Historical Reports">
            <div className="space-y-3">
              {REPORT_ARCHIVE.map((report) => (
                <TrCard key={report.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: c.primary + '15' }}>
                        <Calendar size={18} color={c.primary} />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          {report.quarter} {report.year}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>
                          {report.period}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          background: report.status === 'published' ? '#10B981' + '15' : c.surface2,
                          color: report.status === 'published' ? '#10B981' : c.text3,
                        }}>
                        {report.status === 'published' ? 'Published' : 'Draft'}
                      </span>

                      <button
                        onClick={() => handleExportPDF(report.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: c.surface2 }}>
                        <Download size={14} color={c.text3} />
                      </button>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}
      </PageContent>
    </PageLayout>
  );
}
