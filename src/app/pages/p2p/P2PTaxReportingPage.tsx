/**
 * P2PTaxReportingPage — /p2p/tax-reporting
 * CRITICAL: Tax reporting & 1099 generation for enterprise compliance
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';
import { fmtVnd } from '../../data/formatNumber';
import { toast } from 'sonner';

const TAX_YEARS = [2026, 2025, 2024, 2023];

const MOCK_TAX_DATA_2025 = {
  year: 2025,
  jurisdiction: 'US',
  totalTransactions: 156,
  totalVolume: 1250000000, // VND
  capitalGains: 45000000,
  capitalLosses: -12000000,
  netGains: 33000000,
  form1099Generated: true,
  generatedAt: '2026-01-15',
  downloadUrl: '/tax/2025/1099.pdf',
};

const JURISDICTIONS = [
  { code: 'US', name: 'United States', form: 'Form 1099' },
  { code: 'EU', name: 'European Union', form: 'Tax Certificate' },
  { code: 'UK', name: 'United Kingdom', form: 'P60/P45' },
  { code: 'VN', name: 'Vietnam', form: 'Tax Declaration' },
];

export function P2PTaxReportingPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSuccess, hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('US');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      if (mountedRef.current) hapticSuccess();
    },
  });

  const taxData = MOCK_TAX_DATA_2025;
  const jurisdiction = JURISDICTIONS.find(j => j.code === selectedJurisdiction);

  const handleDownload = (format: string) => {
    hapticSuccess();
    toast.success(`Đang tải ${format} cho năm ${selectedYear}...`);
  };

  const handleExportTurboTax = () => {
    hapticSuccess();
    toast.success('Export to TurboTax TXF format');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header title="Tax Reporting" subtitle="Thuế · P2P" back />

        {/* Hero Card */}
        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <FileText size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#FFFFFF', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Tax Year {selectedYear}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: φ.xs }}>
                  {jurisdiction?.name} • {jurisdiction?.form}
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Year & Jurisdiction Selector */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Select Tax Year</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TAX_YEARS.map(year => (
              <button
                key={year}
                onClick={() => { hapticSelection(); setSelectedYear(year); }}
                className="px-4 py-2 rounded-lg shrink-0"
                style={{
                  background: selectedYear === year ? '#8B5CF6' : c.surface1,
                  color: selectedYear === year ? '#FFFFFF' : c.text2,
                  fontSize: φ.sm,
                  fontWeight: 600,
                  border: `1px solid ${selectedYear === year ? '#8B5CF6' : c.borderSolid}`,
                }}
              >
                {year}
              </button>
            ))}
          </div>

          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12, marginTop: 20 }}>Jurisdiction</h3>
          <div className="flex flex-col gap-2">
            {JURISDICTIONS.map(jur => (
              <button
                key={jur.code}
                onClick={() => { hapticSelection(); setSelectedJurisdiction(jur.code); }}
                className="p-3 rounded-lg text-left"
                style={{
                  background: selectedJurisdiction === jur.code ? hexToRgba('#8B5CF6', 12) : c.surface1,
                  border: `1px solid ${selectedJurisdiction === jur.code ? '#8B5CF6' : c.borderSolid}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: selectedJurisdiction === jur.code ? '#8B5CF6' : c.text1, fontSize: φ.sm, fontWeight: 600 }}>{jur.name}</p>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{jur.form}</p>
                  </div>
                  {selectedJurisdiction === jur.code && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#8B5CF6' }}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <TrCard rounded="md" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>Transactions</p>
              </div>
              <p style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700 }}>{taxData.totalTransactions}</p>
            </TrCard>

            <TrCard rounded="md" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>Total Volume</p>
              </div>
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{fmtVnd(taxData.totalVolume / 1000000)}M</p>
            </TrCard>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#10B981', 10) }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} color="#10B981" />
                <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>Capital Gains</p>
              </div>
              <p style={{ color: '#10B981', fontSize: φ.md, fontWeight: 700 }}>+{fmtVnd(taxData.capitalGains / 1000000)}M</p>
            </TrCard>

            <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#EF4444', 10) }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>Capital Losses</p>
              </div>
              <p style={{ color: '#EF4444', fontSize: φ.md, fontWeight: 700 }}>{fmtVnd(taxData.capitalLosses / 1000000)}M</p>
            </TrCard>
          </div>

          <TrCard rounded="md" className="p-4 mt-3" style={{ background: hexToRgba('#8B5CF6', 10) }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Net Capital Gains</p>
                <p style={{ color: '#8B5CF6', fontSize: φ.xl, fontWeight: 700 }}>{fmtVnd(taxData.netGains / 1000000)}M VND</p>
              </div>
              <DollarSign size={32} color="#8B5CF6" />
            </div>
          </TrCard>
        </div>

        {/* Download Options */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Download Tax Documents</h3>
          
          {taxData.form1099Generated ? (
            <div className="flex flex-col gap-3">
              <TrCard rounded="md" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba('#10B981', 15) }}>
                      <FileText size={18} color="#10B981" />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{jurisdiction?.form}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>Generated {taxData.generatedAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload('PDF')}
                    className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                    style={{ background: '#10B981', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}
                  >
                    <Download size={14} />
                    PDF
                  </button>
                </div>
              </TrCard>

              <TrCard rounded="md" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba('#3B82F6', 15) }}>
                      <FileText size={18} color="#3B82F6" />
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Transaction History (CSV)</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>All transactions for {selectedYear}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload('CSV')}
                    className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                    style={{ background: '#3B82F6', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}
                  >
                    <Download size={14} />
                    CSV
                  </button>
                </div>
              </TrCard>

              {selectedJurisdiction === 'US' && (
                <TrCard rounded="md" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexToRgba('#F59E0B', 15) }}>
                        <FileText size={18} color="#F59E0B" />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>TurboTax Export (TXF)</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Import to TurboTax/TaxAct</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportTurboTax}
                      className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                      style={{ background: '#F59E0B', color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}
                    >
                      <Download size={14} />
                      TXF
                    </button>
                  </div>
                </TrCard>
              )}
            </div>
          ) : (
            <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#F59E0B', 10) }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>
                    Tax documents not yet generated
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Tax forms for {selectedYear} will be available after January 31, {selectedYear + 1}
                  </p>
                </div>
              </div>
            </TrCard>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-5 mb-6">
          <TrCard rounded="md" className="p-4" style={{ background: hexToRgba('#EF4444', 8) }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.6 }}>
                <strong style={{ color: '#EF4444' }}>Tax Disclaimer:</strong> This report is for informational purposes only and should not be considered tax advice. Please consult a qualified tax professional for your specific situation. Cryptocurrency tax laws vary by jurisdiction.
              </p>
            </div>
          </TrCard>
        </div>

        {/* CTA */}
        <div className="px-5">
          <CTAButton 
            label="View Detailed Tax Report" 
            onClick={() => navigate(`${prefix}/p2p/tax-report/detailed/${selectedYear}`)} 
          />
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}