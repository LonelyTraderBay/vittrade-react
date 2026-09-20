import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter, CheckCircle2, ExternalLink } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { fmtUsd } from '../../data/formatNumber';

type CostBasisMethod = 'FIFO' | 'LIFO' | 'Specific ID' | 'Average Cost';

const TAX_SUMMARY_2025 = {
  totalStakingIncome: 5234.56,
  totalCapitalGains: 12345.67,
  costBasis: 100000,
  proceeds: 112345.67,
  shortTermGains: 8000.00,
  longTermGains: 4345.67,
  stakingRewardsByAsset: {
    ETH: { amount: 2.5, usdValue: 7000 },
    BTC: { amount: 0.05, usdValue: 2250 },
    SOL: { amount: 50, usdValue: 4750 },
  },
};

const TRANSACTIONS_2025 = [
  {
    date: '2025-12-31',
    type: 'stake' as const,
    asset: 'ETH',
    amount: 10,
    usdValue: 28000,
    costBasis: 28000,
    taxable: false,
  },
  {
    date: '2025-12-15',
    type: 'reward' as const,
    asset: 'ETH',
    amount: 0.1,
    usdValue: 280,
    costBasis: null,
    taxable: true,
  },
  {
    date: '2025-11-20',
    type: 'unstake' as const,
    asset: 'BTC',
    amount: 0.5,
    usdValue: 22500,
    costBasis: 20000,
    taxable: true,
  },
  {
    date: '2025-11-01',
    type: 'reward' as const,
    asset: 'SOL',
    amount: 25,
    usdValue: 2375,
    costBasis: null,
    taxable: true,
  },
  {
    date: '2025-10-15',
    type: 'stake' as const,
    asset: 'SOL',
    amount: 200,
    usdValue: 18000,
    costBasis: 18000,
    taxable: false,
  },
  {
    date: '2025-09-01',
    type: 'reward' as const,
    asset: 'ETH',
    amount: 0.05,
    usdValue: 140,
    costBasis: null,
    taxable: true,
  },
];

const COST_BASIS_METHODS: { value: CostBasisMethod; label: string; desc: string }[] = [
  {
    value: 'FIFO',
    label: 'First In, First Out (FIFO)',
    desc: 'Default IRS method. First purchased assets are first sold.',
  },
  {
    value: 'LIFO',
    label: 'Last In, First Out (LIFO)',
    desc: 'Last purchased assets are first sold. May reduce short-term gains.',
  },
  {
    value: 'Specific ID',
    label: 'Specific Identification',
    desc: 'Manually identify which lots to sell. Requires detailed records.',
  },
  {
    value: 'Average Cost',
    label: 'Average Cost Basis',
    desc: 'Average cost of all holdings. Simplified calculation.',
  },
];

export function StakingTransactionReportingPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'summary' | 'transactions' | 'export'>('summary');
  const [year, setYear] = useState('2025');
  const [costBasisMethod, setCostBasisMethod] = useState<CostBasisMethod>('FIFO');
  const [showMethodSheet, setShowMethodSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);

  const handleExport = (format: string) => {
    console.log(`Exporting ${format} for ${year} using ${costBasisMethod}`);
    setShowExportSheet(false);
  };

  return (
    <PageLayout>
      <Header title="Tax Reporting" back />

      {/* Cost Basis Method Sheet */}
      <BottomSheetV2
        open={showMethodSheet}
        onClose={() => setShowMethodSheet(false)}
        title="Select Cost Basis Method">
        <div className="flex flex-col gap-3">
          {COST_BASIS_METHODS.map(method => (
            <TrCard
              key={method.value}
              hover
              className="p-4"
              onClick={() => {
                setCostBasisMethod(method.value);
                setShowMethodSheet(false);
              }}
              style={{
                border: costBasisMethod === method.value ? `2px solid ${c.primary}` : undefined,
              }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ borderColor: costBasisMethod === method.value ? c.primary : c.borderSolid }}>
                  {costBasisMethod === method.value && (
                    <div className="w-3 h-3 rounded-full" style={{ background: c.primary }} />
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    {method.label}
                  </p>
                  <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                    {method.desc}
                  </p>
                </div>
              </div>
            </TrCard>
          ))}
          <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              💡 Once you choose a method for a tax year, you should use it consistently. Consult a tax professional for guidance.
            </p>
          </div>
        </div>
      </BottomSheetV2>

      {/* Export Options Sheet */}
      <BottomSheetV2
        open={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        title="Export Options">
        <div className="flex flex-col gap-3">
          <PageSection label="Tax Forms (PDF)">
            <div className="flex flex-col gap-2">
              {[
                { form: 'Form 1099-MISC', desc: 'Staking income report' },
                { form: 'Form 8949', desc: 'Capital gains & losses' },
                { form: 'Schedule D', desc: 'Capital gains summary' },
              ].map((item, idx) => (
                <TrCard key={idx} hover className="p-3" onClick={() => handleExport(item.form)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.form}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{item.desc}</p>
                    </div>
                    <Download size={18} color={c.text3} />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>

          <PageSection label="Third-Party Integrations">
            <div className="flex flex-col gap-2">
              {[
                { name: 'TurboTax CSV', desc: 'Import directly to TurboTax' },
                { name: 'CoinTracker JSON', desc: 'Export to CoinTracker' },
                { name: 'Koinly CSV', desc: 'Export to Koinly' },
              ].map((item, idx) => (
                <TrCard key={idx} hover className="p-3" onClick={() => handleExport(item.name)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.name}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{item.desc}</p>
                    </div>
                    <Download size={18} color={c.text3} />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>

          <PageSection label="Raw Data">
            <div className="flex flex-col gap-2">
              {[
                { format: 'CSV', desc: 'All transactions' },
                { format: 'JSON', desc: 'Developer-friendly format' },
              ].map((item, idx) => (
                <TrCard key={idx} hover className="p-3" onClick={() => handleExport(item.format)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.format}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{item.desc}</p>
                    </div>
                    <Download size={18} color={c.text3} />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <FileText size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Tax Compliance Made Easy
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Generate IRS-compliant tax reports. Export to TurboTax, CoinTracker, or download PDF forms. Always consult a tax professional.
              </p>
            </div>
          </div>
        </div>

        {/* Year & Method Selector */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-3">
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Tax Year</p>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full p-2 rounded-lg text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1, border: 'none' }}>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </TrCard>
          <TrCard hover className="p-3" onClick={() => setShowMethodSheet(true)}>
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Cost Basis</p>
            <div className="flex items-center justify-between">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{costBasisMethod}</p>
              <Filter size={16} color={c.text3} />
            </div>
          </TrCard>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'export', label: 'Export' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'summary' && (
          <>
            <PageSection label="Tax Summary 2025">
              <TrCard className="p-4">
                <div className="space-y-4">
                  {/* Staking Income */}
                  <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ color: c.text2, fontSize: 13, fontWeight: 700 }}>Total Staking Income</p>
                      <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                        {fmtUsd(TAX_SUMMARY_2025.totalStakingIncome)}
                      </p>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                      Taxed as ordinary income at your marginal tax rate (reported on Form 1099-MISC)
                    </p>
                  </div>

                  {/* Capital Gains */}
                  <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ color: c.text2, fontSize: 13, fontWeight: 700 }}>Total Capital Gains</p>
                      <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                        {fmtUsd(TAX_SUMMARY_2025.totalCapitalGains)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Short-term (&lt;1 year)</p>
                        <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700 }}>
                          {fmtUsd(TAX_SUMMARY_2025.shortTermGains)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Long-term (≥1 year)</p>
                        <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                          {fmtUsd(TAX_SUMMARY_2025.longTermGains)}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>
                      Reported on Form 8949 and Schedule D. Long-term gains taxed at lower rates.
                    </p>
                  </div>

                  {/* Cost Basis */}
                  <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Cost Basis</p>
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                          {fmtUsd(TAX_SUMMARY_2025.costBasis)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Proceeds</p>
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                          {fmtUsd(TAX_SUMMARY_2025.proceeds)}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10, marginTop: 6 }}>
                      Using {costBasisMethod} method
                    </p>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Staking Rewards by Asset">
              <TrCard className="p-4">
                <div className="space-y-3">
                  {Object.entries(TAX_SUMMARY_2025.stakingRewardsByAsset).map(([asset, data]) => (
                    <div key={asset} className="flex items-center justify-between p-3 rounded-xl" style={{ background: c.surface2 }}>
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{asset}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {data.amount} {asset}
                        </p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {fmtUsd(data.usdValue)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Taxable income</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'transactions' && (
          <PageSection label="All Transactions 2025">
            <div className="flex flex-col gap-2">
              {TRANSACTIONS_2025.map((tx, idx) => (
                <TrCard key={idx} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                        {tx.type === 'stake' ? 'Staked' : tx.type === 'unstake' ? 'Unstaked' : 'Reward'}{' '}
                        {tx.amount} {tx.asset}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {new Date(tx.date).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                        {fmtUsd(tx.usdValue)}
                      </p>
                      {tx.taxable && (
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                          Taxable
                        </span>
                      )}
                    </div>
                  </div>
                  {tx.costBasis && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: c.borderSolid }}>
                      <span style={{ color: c.text3 }}>Cost Basis:</span>
                      <span style={{ color: c.text2, fontFamily: 'monospace' }}>{fmtUsd(tx.costBasis)}</span>
                    </div>
                  )}
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'export' && (
          <>
            <PageSection label="Generate Tax Forms">
              <div className="flex flex-col gap-3">
                <TrCard hover className="p-4" onClick={() => setShowExportSheet(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <FileText size={24} color="#EF4444" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                        IRS Tax Forms (PDF)
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        Form 1099-MISC, 8949, Schedule D
                      </p>
                    </div>
                    <Download size={20} color={c.text3} />
                  </div>
                </TrCard>

                <TrCard hover className="p-4" onClick={() => setShowExportSheet(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <ExternalLink size={24} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                        Third-Party Integrations
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        TurboTax, CoinTracker, Koinly
                      </p>
                    </div>
                    <Download size={20} color={c.text3} />
                  </div>
                </TrCard>

                <TrCard hover className="p-4" onClick={() => setShowExportSheet(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <FileText size={24} color="#10B981" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                        Raw Data Export
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        CSV, JSON formats
                      </p>
                    </div>
                    <Download size={20} color={c.text3} />
                  </div>
                </TrCard>
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-3">
                <FileText size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    Important Tax Notice
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                    These reports are for informational purposes only. Tax laws vary by jurisdiction. Always consult a qualified tax professional or CPA before filing. We are not tax advisors.
                  </p>
                </div>
              </div>
            </div>

            <PageSection label="Helpful Resources">
              <div className="flex flex-col gap-2">
                {[
                  { title: 'IRS Crypto Tax Guide', url: 'irs.gov' },
                  { title: 'Find a Crypto Tax Professional', url: 'taxbit.com' },
                  { title: 'Tax Loss Harvesting Guide', url: 'platform.com/tax-guide' },
                ].map((item, idx) => (
                  <TrCard key={idx} hover className="p-3">
                    <div className="flex items-center justify-between">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                      <ExternalLink size={16} color="#3B82F6" />
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Tax reports are generated using real-time transaction data. Historical data cannot be modified once a tax year closes. Reports use fair market value at the time of transaction (UTC timezone). Last updated: {new Date().toLocaleDateString('en-GB')}.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
