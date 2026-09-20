import React, { useState } from 'react';
import { FileText, Download, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';

const TAX_YEARS = ['2026', '2025', '2024', '2023'];

const REPORT_TYPES = [
  {
    id: 'irs-8949',
    name: 'IRS Form 8949',
    description: 'US tax form for capital gains/losses',
    format: 'PDF',
    recommended: true,
  },
  {
    id: 'turbotax',
    name: 'TurboTax CSV',
    description: 'Import directly into TurboTax software',
    format: 'CSV',
    recommended: true,
  },
  {
    id: 'detailed-csv',
    name: 'Detailed Trade Log',
    description: 'All trades with timestamps, fees, PnL',
    format: 'CSV',
    recommended: false,
  },
  {
    id: 'summary-pdf',
    name: 'Summary Report',
    description: 'Overview of yearly gains/losses',
    format: 'PDF',
    recommended: false,
  },
];

const SAMPLE_DATA = {
  year: '2025',
  totalTrades: 1247,
  realizedGains: 3842.50,
  realizedLosses: -1127.30,
  netGainLoss: 2715.20,
  shortTermGains: 2318.40,
  longTermGains: 396.80,
  totalFees: 287.60,
  costBasisMethod: 'FIFO',
};

export function BotTaxReportingPage() {
  const c = useThemeColors();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedReports, setSelectedReports] = useState<string[]>(['irs-8949', 'turbotax']);
  const [costBasisMethod, setCostBasisMethod] = useState<'FIFO' | 'LIFO'>('FIFO');
  const [generating, setGenerating] = useState(false);

  const toggleReport = (id: string) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(r => r !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const handleGenerate = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report type');
      return;
    }

    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    toast.success(`Generated ${selectedReports.length} tax report(s) for ${selectedYear}`);
  };

  return (
    <PageLayout variant="flush">
      <Header title="Tax Reporting" back />

      <PageContent grow>
        {/* Info Banner */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={20} color="#F59E0B" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Tax Reporting Notice
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                Cryptocurrency trading is taxable in most countries. Bot trades are treated as individual transactions. 
                We provide reports for convenience, but you should consult a tax professional for accurate filing.
              </p>
            </div>
          </div>
        </div>

        {/* Tax Year Selection */}
        <PageSection label="Select Tax Year">
          <div className="grid grid-cols-4 gap-2">
            {TAX_YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className="p-3 rounded-xl text-center"
                style={{
                  background: selectedYear === year ? c.primary : c.surface,
                  color: selectedYear === year ? '#FFF' : c.text1,
                  border: `1px solid ${selectedYear === year ? c.primary : c.borderSolid}`,
                }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{year}</p>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Summary Stats */}
        <PageSection label="Summary for 2025">
          <TrCard className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p style={{ color: c.text3, fontSize: 11 }}>Total Trades</p>
                <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                  {SAMPLE_DATA.totalTrades.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 11 }}>Total Fees Paid</p>
                <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                  ${SAMPLE_DATA.totalFees.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p style={{ color: c.text3, fontSize: 11 }}>Realized Gains</p>
                <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>
                  +${SAMPLE_DATA.realizedGains.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 11 }}>Realized Losses</p>
                <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 700 }}>
                  ${SAMPLE_DATA.realizedLosses.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: c.borderSolid }}>
              <div className="flex items-center justify-between">
                <p style={{ color: c.text2, fontSize: 13, fontWeight: 600 }}>Net Gain/Loss:</p>
                <p style={{ 
                  color: SAMPLE_DATA.netGainLoss >= 0 ? '#10B981' : '#EF4444', 
                  fontSize: 20, 
                  fontWeight: 700,
                }}>
                  {SAMPLE_DATA.netGainLoss >= 0 ? '+' : ''}${SAMPLE_DATA.netGainLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Cost Basis Method */}
        <PageSection label="Cost Basis Method">
          <div className="flex gap-3">
            {[
              { id: 'FIFO', label: 'FIFO', desc: 'First In, First Out (most common)' },
              { id: 'LIFO', label: 'LIFO', desc: 'Last In, First Out' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setCostBasisMethod(method.id as 'FIFO' | 'LIFO')}
                className="flex-1 p-3 rounded-xl text-left"
                style={{
                  background: costBasisMethod === method.id ? `${c.primary}08` : c.surface,
                  border: `2px solid ${costBasisMethod === method.id ? c.primary : c.borderSolid}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full border-2"
                    style={{ borderColor: costBasisMethod === method.id ? c.primary : c.borderSolid }}>
                    {costBasisMethod === method.id && (
                      <div className="w-2 h-2 rounded-full m-0.5" style={{ background: c.primary }} />
                    )}
                  </div>
                  <p style={{ color: costBasisMethod === method.id ? c.primary : c.text1, fontSize: 13, fontWeight: 700 }}>
                    {method.label}
                  </p>
                </div>
                <p style={{ color: c.text3, fontSize: 10, paddingLeft: 24 }}>{method.desc}</p>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Report Types */}
        <PageSection label="Select Report Types">
          <div className="flex flex-col gap-2">
            {REPORT_TYPES.map(report => (
              <button
                key={report.id}
                onClick={() => toggleReport(report.id)}
                className="w-full p-4 rounded-xl text-left"
                style={{
                  background: selectedReports.includes(report.id) ? `${c.primary}08` : c.surface,
                  border: `2px solid ${selectedReports.includes(report.id) ? c.primary : c.borderSolid}`,
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ 
                      borderColor: selectedReports.includes(report.id) ? c.primary : c.borderSolid,
                      background: selectedReports.includes(report.id) ? c.primary : 'transparent',
                    }}>
                    {selectedReports.includes(report.id) && <CheckCircle2 size={16} color="#FFF" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: selectedReports.includes(report.id) ? c.primary : c.text1, fontSize: 13, fontWeight: 700 }}>
                        {report.name}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: c.surface2, color: c.text3 }}>
                        {report.format}
                      </span>
                      {report.recommended && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{report.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Breakdown by Term */}
        <PageSection label="Capital Gains Breakdown">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: c.text2, fontSize: 12 }}>Short-Term Gains</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Held &lt; 1 year (taxed as income)</p>
                </div>
                <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                  +${SAMPLE_DATA.shortTermGains.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: c.text2, fontSize: 12 }}>Long-Term Gains</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Held &gt; 1 year (lower tax rate)</p>
                </div>
                <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                  +${SAMPLE_DATA.longTermGains.toFixed(2)}
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Important Notes */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Important Tax Notes
          </p>
          <ul className="space-y-2">
            {[
              'Bot trades are taxable events (buy/sell, not just withdrawal)',
              'Trading fees can be deducted from capital gains',
              'Crypto-to-crypto trades (BTC→ETH) are taxable',
              'Consult a tax professional for accurate filing',
              'Keep reports for 7 years (IRS audit protection)',
            ].map((note, idx) => (
              <li key={idx} className="flex gap-2">
                <span style={{ color: c.text3 }}>•</span>
                <p style={{ color: c.text3, fontSize: 11 }}>{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageContent>

      <StickyFooter>
        <button
          onClick={handleGenerate}
          disabled={generating || selectedReports.length === 0}
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: (generating || selectedReports.length === 0) ? c.surface2 : c.primary,
            color: (generating || selectedReports.length === 0) ? c.text3 : '#FFF',
            cursor: (generating || selectedReports.length === 0) ? 'not-allowed' : 'pointer',
          }}>
          {generating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating Reports...
            </>
          ) : (
            <>
              <Download size={16} />
              Generate {selectedReports.length} Report{selectedReports.length > 1 ? 's' : ''} for {selectedYear}
            </>
          )}
        </button>
      </StickyFooter>
    </PageLayout>
  );
}
