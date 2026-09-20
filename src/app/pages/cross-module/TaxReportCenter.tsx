/**
 * ══════════════════════════════════════════════════════════════
 *  TaxReportCenter — Cross-Module Feature 4/4
 * ══════════════════════════════════════════════════════════════
 *  Tax report center: Generate tax reports from all activities,
 *  Trading/P2P/Predictions/DCA/Wallet transactions,
 *  Export formats (PDF/CSV/Excel), Tax period selection
 *  Pattern B — Page with Tabs (Generate/Reports/Settings)
 *  Compliance: §15 Microcopy, Clear disclaimers
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
  FileText, Download, Calendar, DollarSign, TrendingUp,
  Clock, Info, AlertTriangle, CheckCircle, Activity,
  Target, ShoppingCart, Wallet, BarChart3, Zap,
} from 'lucide-react';

const TABS = ['Tao bao cao', 'Bao cao', 'Cai dat'] as const;
type Tab = typeof TABS[number];

interface TaxableActivity {
  module: string;
  moduleName: string;
  count: number;
  gainLoss: number;
  icon: any;
  color: string;
  taxable: boolean;
}

const TAXABLE_ACTIVITIES: TaxableActivity[] = [
  {
    module: 'trading',
    moduleName: 'Spot Trading',
    count: 245,
    gainLoss: 3850,
    icon: BarChart3,
    color: '#10B981',
    taxable: true,
  },
  {
    module: 'p2p',
    moduleName: 'P2P Transactions',
    count: 28,
    gainLoss: 125,
    icon: ShoppingCart,
    color: '#F59E0B',
    taxable: true,
  },
  {
    module: 'predictions',
    moduleName: 'Prediction Markets',
    count: 87,
    gainLoss: 780,
    icon: Target,
    color: '#8B5CF6',
    taxable: true,
  },
  {
    module: 'dca',
    moduleName: 'DCA Purchases',
    count: 12,
    gainLoss: 1200,
    icon: Activity,
    color: '#6366F1',
    taxable: true,
  },
  {
    module: 'wallet',
    moduleName: 'Wallet Deposits/Withdrawals',
    count: 45,
    gainLoss: 0, // Not gains, just movements
    icon: Wallet,
    color: '#3B82F6',
    taxable: false,
  },
  {
    module: 'arena',
    moduleName: 'Arena Points (Non-taxable)',
    count: 32,
    gainLoss: 0,
    icon: Zap,
    color: '#F97316',
    taxable: false,
  },
];

interface GeneratedReport {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'csv' | 'excel';
  totalGainLoss: number;
  transactionCount: number;
  generatedAt: Date;
  status: 'ready' | 'generating' | 'error';
}

const GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: 'r1',
    period: '2024 Tax Year',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    format: 'pdf',
    totalGainLoss: 5955,
    transactionCount: 372,
    generatedAt: new Date(Date.now() - 5 * 86400000),
    status: 'ready',
  },
  {
    id: 'r2',
    period: 'Q4 2024',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    format: 'csv',
    totalGainLoss: 1850,
    transactionCount: 128,
    generatedAt: new Date(Date.now() - 15 * 86400000),
    status: 'ready',
  },
  {
    id: 'r3',
    period: 'Q3 2024',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    format: 'excel',
    totalGainLoss: 1420,
    transactionCount: 95,
    generatedAt: new Date(Date.now() - 30 * 86400000),
    status: 'ready',
  },
];

export function TaxReportCenter() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Tao bao cao');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [jurisdiction, setJurisdiction] = useState('us');
  const [includeArena, setIncludeArena] = useState(false);

  const totalGainLoss = TAXABLE_ACTIVITIES.filter((a) => a.taxable).reduce(
    (sum, a) => sum + a.gainLoss,
    0
  );
  const totalTransactions = TAXABLE_ACTIVITIES.reduce((sum, a) => sum + a.count, 0);
  const taxableModules = TAXABLE_ACTIVITIES.filter((a) => a.taxable).length;

  const generateReport = () => {
    alert(
      `Generating ${format.toUpperCase()} report for ${startDate} to ${endDate}...\nTotal Gain/Loss: $${totalGainLoss.toLocaleString()}`
    );
  };

  return (
    <PageLayout>
      <Header title="Tax Report Center" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Tao bao cao' && (
          <>
            {/* Tax Summary */}
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
                    background: 'rgba(16,185,129,0.08)',
                  }}
                >
                  <FileText size={24} color="#10B981" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Tax Summary</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>All taxable activities</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Gain/Loss</p>
                  <p
                    style={{
                      color: totalGainLoss >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Transactions</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                    {totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Taxable Modules</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{taxableModules}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Reports Generated</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {GENERATED_REPORTS.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Period */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Tax Period
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '2024', start: '2024-01-01', end: '2024-12-31' },
                  { label: 'Q4 2024', start: '2024-10-01', end: '2024-12-31' },
                  { label: 'YTD', start: '2024-01-01', end: new Date().toISOString().split('T')[0] },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setStartDate(preset.start);
                      setEndDate(preset.end);
                    }}
                    className="py-2 rounded-xl transition-all hover:opacity-90"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Breakdown */}
            <PageSection label="Module Breakdown">
              <div className="space-y-2">
                {TAXABLE_ACTIVITIES.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.module}
                      className="rounded-2xl p-4"
                      style={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        opacity: activity.taxable ? 1 : 0.5,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${activity.color}20`,
                            }}
                          >
                            <Icon size={16} color={activity.color} />
                          </div>
                          <div>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                              {activity.moduleName}
                            </p>
                            {!activity.taxable && (
                              <span
                                className="px-2 py-0.5 rounded text-[9px] font-semibold"
                                style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
                              >
                                NON-TAXABLE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Transactions</p>
                          <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                            {activity.count}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Gain/Loss</p>
                          <p
                            style={{
                              color:
                                activity.gainLoss > 0
                                  ? '#10B981'
                                  : activity.gainLoss < 0
                                  ? '#EF4444'
                                  : c.text3,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {activity.taxable
                              ? `${activity.gainLoss >= 0 ? '+' : ''}$${activity.gainLoss.toLocaleString()}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {activity.module === 'arena' && (
                        <div
                          className="rounded-lg p-2 mt-3"
                          style={{ background: 'rgba(245,158,11,0.06)' }}
                        >
                          <p style={{ color: '#F59E0B', fontSize: 10, lineHeight: 1.4 }}>
                            Arena Points are not financial assets and typically not taxable
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PageSection>

            {/* Export Format */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Export Format
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'csv', label: 'CSV' },
                  { value: 'excel', label: 'Excel' },
                ].map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value as any)}
                    className="py-2 rounded-xl transition-all"
                    style={{
                      background: format === fmt.value ? c.primary : c.bg,
                      color: format === fmt.value ? '#fff' : c.text1,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid ${format === fmt.value ? 'transparent' : c.border}`,
                    }}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jurisdiction */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Tax Jurisdiction
              </p>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 13,
                }}
              >
                <option value="us">United States (IRS)</option>
                <option value="uk">United Kingdom (HMRC)</option>
                <option value="ca">Canada (CRA)</option>
                <option value="au">Australia (ATO)</option>
                <option value="sg">Singapore (IRAS)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateReport}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <FileText size={18} />
              Generate Tax Report
            </button>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Tax reports are for reference only. Consult a tax professional for accurate filing.
                We are not tax advisors.
              </p>
            </div>
          </>
        )}

        {tab === 'Bao cao' && (
          <>
            {/* Generated Reports */}
            <PageSection label="Generated Reports">
              {GENERATED_REPORTS.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <FileText size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13, marginBottom: 4 }}>
                    No reports generated
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>Create your first tax report</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {GENERATED_REPORTS.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl p-4"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                              {report.period}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                              style={{
                                background:
                                  report.status === 'ready'
                                    ? 'rgba(16,185,129,0.1)'
                                    : report.status === 'generating'
                                    ? 'rgba(245,158,11,0.1)'
                                    : 'rgba(239,68,68,0.1)',
                                color:
                                  report.status === 'ready'
                                    ? '#10B981'
                                    : report.status === 'generating'
                                    ? '#F59E0B'
                                    : '#EF4444',
                              }}
                            >
                              {report.status}
                            </span>
                          </div>
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            {report.startDate.toLocaleDateString('vi-VN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            -{' '}
                            {report.endDate.toLocaleDateString('vi-VN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        {report.status === 'ready' && (
                          <button
                            onClick={() => alert(`Download ${report.period} report`)}
                            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                            style={{ background: `${c.primary}15` }}
                          >
                            <Download size={16} color={c.primary} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Format</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                            {report.format.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Transactions</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                            {report.transactionCount}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Gain/Loss</p>
                          <p
                            style={{
                              color: report.totalGainLoss >= 0 ? '#10B981' : '#EF4444',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {report.totalGainLoss >= 0 ? '+' : ''}$
                            {report.totalGainLoss.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock size={10} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          Generated{' '}
                          {report.generatedAt.toLocaleDateString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageSection>
          </>
        )}

        {tab === 'Cai dat' && (
          <>
            {/* Report Settings */}
            <PageSection label="Report Settings">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      Include Arena Points
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      Show Arena activity in reports (typically non-taxable)
                    </p>
                  </div>
                  <button
                    onClick={() => setIncludeArena(!includeArena)}
                    className="relative ml-3"
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      background: includeArena ? c.primary : '#6B7280',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      className="absolute top-1 transition-all"
                      style={{
                        left: includeArena ? 22 : 2,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: '#fff',
                      }}
                    />
                  </button>
                </div>
              </div>
            </PageSection>

            {/* Tax Resources */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Tax Resources
              </p>
              <ul className="space-y-2">
                {[
                  'IRS Publication 544 - Sales and Other Dispositions',
                  'Form 8949 - Sales and Dispositions of Capital Assets',
                  'Schedule D - Capital Gains and Losses',
                  'Crypto Tax Guide by IRS',
                ].map((resource, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ color: c.text2, fontSize: 11 }}>{resource}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Disclaimer */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={16} color="#EF4444" style={{ marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Important Notice
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    This platform does not provide tax advice. Tax reports are generated for your
                    convenience only. Please consult a qualified tax professional or accountant for
                    accurate tax filing guidance specific to your jurisdiction.
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 ml-6">
                {[
                  'Reports may not include all taxable events',
                  'Tax laws vary by jurisdiction',
                  'Accuracy depends on transaction data quality',
                  'Arena Points are typically non-taxable but check local laws',
                  'We are not tax advisors or accountants',
                ].map((note, idx) => (
                  <li key={idx} style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    • {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Tax reports aggregate data from all modules. Each transaction includes timestamp, type,
                amount, and gain/loss calculation.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
