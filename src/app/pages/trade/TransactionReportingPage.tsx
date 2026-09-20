/**
 * ══════════════════════════════════════════════════════════════
 *  TransactionReportingPage — Phase 4 Sprint 1 Day 1-2
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Real-time transaction reporting to ARM (Approved Reporting Mechanism)
 * - MiFID II Article 26 compliance (transaction reporting)
 * - EMIR compliance (derivatives reporting)
 * - ISO 20022 message format support
 * - Submission queue & status tracking
 * 
 * Compliance:
 * - MiFID II Art. 26: T+1 transaction reporting mandatory
 * - EMIR: Real-time derivatives reporting
 * - RTS 22: Transaction reporting fields (65+ fields)
 * - ISO 20022: Standard message format
 * - ARM integration: Approved reporting mechanism
 * 
 * Features:
 * - Real-time reporting queue
 * - Auto-submission (< 1 min latency)
 * - Manual retry for failed submissions
 * - ISO 20022 XML preview
 * - Audit trail (immutable log)
 * - SLA monitoring (T+1 compliance)
 * 
 * Guidelines:
 * - PageLayout + TabBar pattern
 * - Enterprise-grade tables (sortable)
 * - Status pills (pending, submitted, confirmed, failed)
 * - Export to CSV/XML
 * - Trust-first: show all submission details
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText, Send, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Download, Eye, Filter, Search, Info, Shield,
  Activity, TrendingUp, Zap, Database, ChevronRight, Copy,
  ExternalLink, BarChart3, Calendar
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtNum } from '../../data/formatNumber';

type TabType = 'queue' | 'history' | 'failed' | 'stats';
type ReportStatus = 'pending' | 'submitting' | 'submitted' | 'confirmed' | 'failed' | 'retrying';

interface TransactionReport {
  id: string;
  transactionId: string;
  reportType: 'mifid2' | 'emir' | 'both';
  tradingVenue: string;
  instrument: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  executionTime: string;
  reportedTime?: string;
  confirmedTime?: string;
  status: ReportStatus;
  armProvider: 'REGIS-TR' | 'UnaVista' | 'Bloomberg';
  messageId?: string;
  errorMessage?: string;
  retryCount: number;
  slaStatus: 'on-time' | 'warning' | 'breach';
}

// Mock data - in production, this would come from real-time API
const MOCK_REPORTS: TransactionReport[] = [
  {
    id: 'RPT-001',
    transactionId: 'TXN-2026-03-08-001',
    reportType: 'both',
    tradingVenue: 'Binance',
    instrument: 'BTC/USDT',
    side: 'buy',
    quantity: 0.5,
    price: 68500,
    value: 34250,
    executionTime: '2026-03-08T10:15:23Z',
    reportedTime: '2026-03-08T10:15:45Z',
    confirmedTime: '2026-03-08T10:16:12Z',
    status: 'confirmed',
    armProvider: 'REGIS-TR',
    messageId: 'MSG-REGIS-TR-20260308-001',
    retryCount: 0,
    slaStatus: 'on-time',
  },
  {
    id: 'RPT-002',
    transactionId: 'TXN-2026-03-08-002',
    reportType: 'mifid2',
    tradingVenue: 'OKX',
    instrument: 'ETH/USDT',
    side: 'sell',
    quantity: 10,
    price: 3825,
    value: 38250,
    executionTime: '2026-03-08T10:22:11Z',
    reportedTime: '2026-03-08T10:22:34Z',
    status: 'submitted',
    armProvider: 'UnaVista',
    messageId: 'MSG-UnaVista-20260308-002',
    retryCount: 0,
    slaStatus: 'on-time',
  },
  {
    id: 'RPT-003',
    transactionId: 'TXN-2026-03-08-003',
    reportType: 'both',
    tradingVenue: 'Binance',
    instrument: 'SOL/USDT',
    side: 'buy',
    quantity: 100,
    price: 125.5,
    value: 12550,
    executionTime: '2026-03-08T10:30:45Z',
    reportedTime: '2026-03-08T10:31:02Z',
    status: 'failed',
    armProvider: 'REGIS-TR',
    errorMessage: 'Field validation error: Invalid LEI format',
    retryCount: 2,
    slaStatus: 'warning',
  },
  {
    id: 'RPT-004',
    transactionId: 'TXN-2026-03-08-004',
    reportType: 'mifid2',
    tradingVenue: 'Bybit',
    instrument: 'BTC/USDT',
    side: 'buy',
    quantity: 0.25,
    price: 68600,
    value: 17150,
    executionTime: '2026-03-08T10:35:12Z',
    status: 'pending',
    armProvider: 'Bloomberg',
    retryCount: 0,
    slaStatus: 'on-time',
  },
  {
    id: 'RPT-005',
    transactionId: 'TXN-2026-03-08-005',
    reportType: 'emir',
    tradingVenue: 'Binance',
    instrument: 'BTC-PERP',
    side: 'sell',
    quantity: 1.5,
    price: 68550,
    value: 102825,
    executionTime: '2026-03-08T10:40:33Z',
    status: 'submitting',
    armProvider: 'REGIS-TR',
    retryCount: 0,
    slaStatus: 'on-time',
  },
];

const STATUS_CONFIG: Record<ReportStatus, { color: string; label: string; icon: any }> = {
  pending: { color: '#94A3B8', label: 'Pending', icon: Clock },
  submitting: { color: '#3B82F6', label: 'Submitting', icon: Send },
  submitted: { color: '#F59E0B', label: 'Submitted', icon: Activity },
  confirmed: { color: '#10B981', label: 'Confirmed', icon: CheckCircle },
  failed: { color: '#EF4444', label: 'Failed', icon: XCircle },
  retrying: { color: '#F59E0B', label: 'Retrying', icon: RefreshCw },
};

const SLA_CONFIG: Record<string, { color: string; label: string }> = {
  'on-time': { color: '#10B981', label: 'On-time' },
  'warning': { color: '#F59E0B', label: 'Warning' },
  'breach': { color: '#EF4444', label: 'SLA Breach' },
};

export function TransactionReportingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<TabType>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<TransactionReport | null>(null);

  // Filter reports based on tab
  const filteredReports = useMemo(() => {
    let filtered = MOCK_REPORTS;

    if (tab === 'queue') {
      filtered = filtered.filter(r => ['pending', 'submitting', 'submitted'].includes(r.status));
    } else if (tab === 'failed') {
      filtered = filtered.filter(r => r.status === 'failed');
    } else if (tab === 'history') {
      filtered = filtered.filter(r => r.status === 'confirmed');
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.instrument.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [tab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = MOCK_REPORTS.length;
    const confirmed = MOCK_REPORTS.filter(r => r.status === 'confirmed').length;
    const failed = MOCK_REPORTS.filter(r => r.status === 'failed').length;
    const pending = MOCK_REPORTS.filter(r => ['pending', 'submitting', 'submitted'].includes(r.status)).length;
    const onTime = MOCK_REPORTS.filter(r => r.slaStatus === 'on-time').length;
    const avgLatency = 22; // seconds (mock)
    
    return { total, confirmed, failed, pending, onTime, avgLatency };
  }, []);

  const TABS = [
    { id: 'queue' as TabType, label: `Queue (${stats.pending})` },
    { id: 'history' as TabType, label: 'History' },
    { id: 'failed' as TabType, label: `Failed (${stats.failed})` },
    { id: 'stats' as TabType, label: 'Stats' },
  ];

  const handleRetry = (reportId: string) => {
    console.log('Retry report:', reportId);
    // In production: call API to retry submission
  };

  const handleViewXML = (reportId: string) => {
    console.log('View ISO 20022 XML for:', reportId);
    // In production: show modal with XML preview
  };

  return (
    <PageLayout>
      <Header title="Transaction Reporting" subtitle="MiFID II · EMIR Compliance" back />

      <PageContent gap="relaxed">
        {/* Compliance Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Shield size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              MiFID II Article 26 Compliance
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              All transactions must be reported to ARM within T+1. Reports include 65+ data fields per RTS 22. Auto-submission enabled.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <TrCard className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Total Today</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>{stats.total}</p>
                <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
                  {stats.confirmed} confirmed
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: c.primary + '15' }}>
                <FileText size={16} color={c.primary} />
              </div>
            </div>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Avg Latency</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>{stats.avgLatency}s</p>
                <p style={{ color: '#10B981', fontSize: 9, marginTop: 2 }}>
                  Under 60s SLA ✓
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: '#10B981' + '15' }}>
                <Zap size={16} color="#10B981" />
              </div>
            </div>
          </TrCard>

          <TrCard className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>SLA Compliance</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {((stats.onTime / stats.total) * 100).toFixed(0)}%
                </p>
                <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
                  {stats.onTime}/{stats.total} on-time
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: '#10B981' + '15' }}>
                <TrendingUp size={16} color="#10B981" />
              </div>
            </div>
          </TrCard>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by transaction ID or instrument..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-xl outline-none text-sm"
            style={{
              background: c.surface2,
              border: `1px solid ${c.border}`,
              color: c.text1,
            }}
          />
        </div>

        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} variant="underline" />

        {/* Content */}
        {tab === 'stats' ? (
          <PageSection label="Reporting Statistics">
            <TrCard className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Today's Volume</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>MiFID II Reports</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {MOCK_REPORTS.filter(r => r.reportType === 'mifid2' || r.reportType === 'both').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>EMIR Reports</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {MOCK_REPORTS.filter(r => r.reportType === 'emir' || r.reportType === 'both').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>Total Value</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {fmtUsd(MOCK_REPORTS.reduce((s, r) => s + r.value, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>ARM Providers</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>REGIS-TR</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {MOCK_REPORTS.filter(r => r.armProvider === 'REGIS-TR').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>UnaVista</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {MOCK_REPORTS.filter(r => r.armProvider === 'UnaVista').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: c.text2, fontSize: 12 }}>Bloomberg</span>
                      <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                        {MOCK_REPORTS.filter(r => r.armProvider === 'Bloomberg').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TrCard>

            <button
              onClick={() => navigate(`${prefix}/trade/copy-trading/regulatory-reports-dashboard`)}
              className="w-full mt-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: c.primary,
                color: '#fff',
                height: 44,
                fontWeight: 600,
                fontSize: 13,
              }}>
              <BarChart3 size={16} />
              <span>View Full Dashboard</span>
              <ChevronRight size={14} />
            </button>
          </PageSection>
        ) : (
          <PageSection label={`${filteredReports.length} Reports`}>
            <div className="flex flex-col gap-3">
              {filteredReports.map((report) => {
                const statusConfig = STATUS_CONFIG[report.status];
                const StatusIcon = statusConfig.icon;
                const slaConfig = SLA_CONFIG[report.slaStatus];

                return (
                  <TrCard key={report.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: statusConfig.color + '15' }}>
                        <StatusIcon size={18} color={statusConfig.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                                {report.instrument}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                style={{
                                  background: report.side === 'buy' ? '#10B981' + '15' : '#EF4444' + '15',
                                  color: report.side === 'buy' ? '#10B981' : '#EF4444',
                                }}>
                                {report.side.toUpperCase()}
                              </span>
                            </div>
                            <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                              {report.transactionId} • {report.tradingVenue}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                              style={{ background: statusConfig.color + '15', color: statusConfig.color }}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.text3, fontSize: 9 }}>Qty:</span>
                            <span style={{ color: c.text2, fontSize: 10, fontWeight: 500 }}>
                              {fmtNum(report.quantity)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.text3, fontSize: 9 }}>Value:</span>
                            <span style={{ color: c.text2, fontSize: 10, fontWeight: 500 }}>
                              {fmtUsd(report.value)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.text3, fontSize: 9 }}>ARM:</span>
                            <span style={{ color: c.text2, fontSize: 10, fontWeight: 500 }}>
                              {report.armProvider}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: c.text3, fontSize: 9 }}>Type:</span>
                            <span style={{ color: c.text2, fontSize: 10, fontWeight: 500 }}>
                              {report.reportType.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* SLA Status */}
                        {report.slaStatus && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: slaConfig.color }} />
                            <span style={{ color: slaConfig.color, fontSize: 9, fontWeight: 600 }}>
                              {slaConfig.label}
                            </span>
                          </div>
                        )}

                        {/* Error Message */}
                        {report.errorMessage && (
                          <div className="rounded-lg p-2 mb-2 flex gap-1.5"
                            style={{ background: c.errorBg, border: `1px solid ${c.errorBorder}` }}>
                            <AlertTriangle size={12} color={c.errorText} className="shrink-0 mt-0.5" />
                            <p style={{ color: c.errorText, fontSize: 9, lineHeight: 1.3 }}>
                              {report.errorMessage}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewXML(report.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                            style={{ background: c.surface2, color: c.text2, fontSize: 10, fontWeight: 500 }}>
                            <Eye size={12} />
                            <span>View XML</span>
                          </button>

                          {report.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(report.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                              style={{ background: c.primary + '15', color: c.primary, fontSize: 10, fontWeight: 600 }}>
                              <RefreshCw size={12} />
                              <span>Retry</span>
                            </button>
                          )}

                          {report.messageId && (
                            <button
                              onClick={() => navigator.clipboard.writeText(report.messageId!)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                              style={{ background: c.surface2, color: c.text2, fontSize: 10, fontWeight: 500 }}>
                              <Copy size={12} />
                              <span>Copy ID</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TrCard>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <Database size={48} color={c.text3} className="mx-auto mb-3 opacity-50" />
                  <p style={{ color: c.text3, fontSize: 13 }}>No reports found</p>
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                    {searchQuery ? 'Try a different search term' : 'Reports will appear here automatically'}
                  </p>
                </div>
              )}
            </div>
          </PageSection>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/regulatory-reports-dashboard`)}
            className="rounded-xl p-3 flex flex-col items-start gap-2 transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <BarChart3 size={18} color={c.primary} />
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Dashboard</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>View all reports</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/arm-integration-status`)}
            className="rounded-xl p-3 flex flex-col items-start gap-2 transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <Activity size={18} color="#10B981" />
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>ARM Status</p>
              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>Connection health</p>
            </div>
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
