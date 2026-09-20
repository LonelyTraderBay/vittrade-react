import React, { useState } from 'react';
import { Shield, TrendingUp, CheckCircle2, Download, FileText, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { fmtUsd } from '../../data/formatNumber';

const FUND_DATA = {
  totalBalance: 50000000,
  targetRatio: 150,
  currentRatio: 165,
  liabilities: 30303030,
  surplus: 19696970,
  lastUpdated: '2026-03-07T14:30:00Z',
};

const ASSET_BREAKDOWN = [
  { asset: 'ETH', value: 30000000, percentage: 60, color: '#3B82F6' },
  { asset: 'BTC', value: 15000000, percentage: 30, color: '#F59E0B' },
  { asset: 'USDT', value: 5000000, percentage: 10, color: '#10B981' },
];

const CLAIMS_HISTORY = [
  {
    id: 'c-20260220',
    date: '2026-02-20',
    user: 'User#12345',
    reason: 'Validator slashing (2%)',
    loss: 125.50,
    coverage: 50,
    payout: 62.75,
    status: 'approved',
    processingDays: 3,
  },
  {
    id: 'c-20260115',
    date: '2026-01-15',
    user: 'User#67890',
    reason: 'Smart contract exploit (partial)',
    loss: 5000.00,
    coverage: 80,
    payout: 4000.00,
    status: 'approved',
    processingDays: 7,
  },
  {
    id: 'c-20251210',
    date: '2025-12-10',
    user: 'User#24680',
    reason: 'Validator downtime loss',
    loss: 50.00,
    coverage: 100,
    payout: 50.00,
    status: 'approved',
    processingDays: 2,
  },
  {
    id: 'c-20251105',
    date: '2025-11-05',
    user: 'User#13579',
    reason: 'Slashing event (1.5%)',
    loss: 200.00,
    coverage: 50,
    payout: 100.00,
    status: 'approved',
    processingDays: 4,
  },
];

const FUND_HISTORY = [
  { month: 'Apr 2025', balance: 45.2, ratio: 155 },
  { month: 'May 2025', balance: 46.0, ratio: 157 },
  { month: 'Jun 2025', balance: 46.8, ratio: 159 },
  { month: 'Jul 2025', balance: 47.5, ratio: 160 },
  { month: 'Aug 2025', balance: 48.0, ratio: 161 },
  { month: 'Sep 2025', balance: 48.5, ratio: 162 },
  { month: 'Oct 2025', balance: 49.0, ratio: 163 },
  { month: 'Nov 2025', balance: 49.2, ratio: 164 },
  { month: 'Dec 2025', balance: 49.5, ratio: 164 },
  { month: 'Jan 2026', balance: 49.8, ratio: 165 },
  { month: 'Feb 2026', balance: 49.9, ratio: 165 },
  { month: 'Mar 2026', balance: 50.0, ratio: 165 },
];

const CONTRIBUTIONS = {
  stakingFees: 2,
  monthlyContribution: 150000,
  ytdContributions: 450000,
  totalContributed: 5200000,
};

export function StakingInsuranceFundTransparencyPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'overview' | 'claims' | 'history'>('overview');

  const circleProgress = (FUND_DATA.currentRatio / FUND_DATA.targetRatio) * 100;

  return (
    <PageLayout>
      <Header title="Insurance Fund" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                User Protection Fund
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                A dedicated fund covers up to 50-100% of losses from slashing, smart contract exploits, and validator failures. Fully transparent, audited monthly.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'claims', label: 'Claims' },
            { id: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'overview' && (
          <>
            {/* Fund Status */}
            <PageSection label="Current Fund Status">
              <TrCard className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Total Fund Balance</p>
                    <p style={{ color: c.text1, fontSize: 24, fontWeight: 700 }}>
                      {fmtUsd(FUND_DATA.totalBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Reserve Ratio</p>
                    <div className="flex items-baseline gap-1">
                      <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>
                        {FUND_DATA.currentRatio}%
                      </p>
                      <p style={{ color: c.text3, fontSize: 12 }}>/ {FUND_DATA.targetRatio}%</p>
                    </div>
                  </div>
                </div>

                {/* Progress Circle */}
                <div className="relative mx-auto" style={{ width: 160, height: 160 }}>
                  <svg width="160" height="160" className="transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={c.surface2}
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#10B981"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - circleProgress / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p style={{ color: '#10B981', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                      {Math.round(circleProgress)}%
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>of target</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Total Liabilities</p>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      {fmtUsd(FUND_DATA.liabilities)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Surplus</p>
                    <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                      {fmtUsd(FUND_DATA.surplus)}
                    </p>
                  </div>
                </div>

                <p style={{ color: c.text3, fontSize: 10, textAlign: 'center', marginTop: 12 }}>
                  Last updated: {new Date(FUND_DATA.lastUpdated).toLocaleString('en-GB')}
                </p>
              </TrCard>
            </PageSection>

            {/* Asset Breakdown */}
            <PageSection label="Asset Breakdown">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={ASSET_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ asset, percentage }) => `${asset} ${percentage}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value">
                      {ASSET_BREAKDOWN.map((entry, index) => (
                        <Cell key={`asset-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      key="tooltip-pie"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.borderSolid}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => fmtUsd(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col gap-2 mt-3">
                  {ASSET_BREAKDOWN.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: c.surface2 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{item.asset}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                          {fmtUsd(item.value)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            {/* Contribution Model */}
            <PageSection label="Fund Contribution Model">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      How the Fund Grows
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      {CONTRIBUTIONS.stakingFees}% of all staking fees are automatically allocated to the insurance fund. No user funds are ever used.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Monthly Avg</p>
                    <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      {fmtUsd(CONTRIBUTIONS.monthlyContribution)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>YTD 2026</p>
                    <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                      {fmtUsd(CONTRIBUTIONS.ytdContributions)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3 col-span-2" style={{ background: 'rgba(59,130,246,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Total Contributed (All-time)</p>
                    <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 700 }}>
                      {fmtUsd(CONTRIBUTIONS.totalContributed)}
                    </p>
                  </div>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'claims' && (
          <>
            <PageSection label="Claims History">
              <div className="flex flex-col gap-3">
                {CLAIMS_HISTORY.map(claim => (
                  <TrCard key={claim.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                          {claim.user}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {new Date(claim.date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        Approved
                      </span>
                    </div>

                    <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Loss</p>
                          <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
                            ${claim.loss.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Coverage</p>
                          <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>
                            {claim.coverage}%
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Payout</p>
                          <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>
                            ${claim.payout.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} color="#10B981" />
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        Processed in {claim.processingDays} business days
                      </p>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex gap-2">
                <FileText size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>Claim Processing:</strong> All claims are reviewed within 24 hours. Approved claims are paid out within 7 business days. Average approval rate: 94%.
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <PageSection label="Historical Performance (12 Months)">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={FUND_HISTORY}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.borderSolid} />
                    <XAxis key="x-axis" dataKey="month" tick={{ fill: c.text3, fontSize: 10 }} />
                    <YAxis
                      key="y-axis-left"
                      yAxisId="left"
                      tick={{ fill: c.text3, fontSize: 10 }}
                      tickFormatter={(val) => `$${val}M`}
                    />
                    <YAxis
                      key="y-axis-right"
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: c.text3, fontSize: 10 }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.borderSolid}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: any, name: string) =>
                        name === 'balance' ? `$${value}M` : `${value}%`
                      }
                    />
                    <Legend key="legend" wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      key="line-balance"
                      yAxisId="left"
                      type="monotone"
                      dataKey="balance"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      name="Fund Balance"
                    />
                    <Line
                      key="line-ratio"
                      yAxisId="right"
                      type="monotone"
                      dataKey="ratio"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                      name="Reserve Ratio"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>12M Growth</p>
                    <p style={{ color: '#3B82F6', fontSize: 16, fontWeight: 700 }}>
                      +10.6%
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Avg Ratio</p>
                    <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                      161%
                    </p>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Monthly Audit Reports">
              <div className="flex flex-col gap-2">
                {['March 2026', 'February 2026', 'January 2026'].map((month, idx) => (
                  <TrCard key={idx} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={20} color="#3B82F6" />
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{month} Audit</p>
                          <p style={{ color: c.text3, fontSize: 11 }}>Third-party verified</p>
                        </div>
                      </div>
                      <Download size={18} color={c.text3} />
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
            Insurance fund is audited monthly by third-party firms. All claim data is anonymized. Fund balance and ratio are updated in real-time. Last audit: March 1, 2026.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}