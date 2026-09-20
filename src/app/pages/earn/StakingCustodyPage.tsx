import React from 'react';
import { Shield, Lock, Building2, FileCheck, Eye, ArrowRightLeft } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsDark } from '../../hooks/useIsDark';
import { fmtUsd } from '../../data/formatNumber';

const CUSTODIAN_INFO = {
  name: 'Fireblocks',
  type: 'Institutional Digital Asset Custodian',
  founded: '2018',
  headquarters: 'New York, USA',
  licenses: ['NY Trust Charter', 'SOC 2 Type II', 'ISO 27001'],
  insurance: '$255M Crime Insurance (Lloyd\'s of London)',
  clients: '1,800+ institutions',
  aum: '$4 Trillion+ in digital assets transferred',
};

const SEGREGATION_DATA = [
  { name: 'Client Staking Funds', value: 85, color: '#3B82F6' },
  { name: 'Platform Operational', value: 10, color: '#8B5CF6' },
  { name: 'Insurance Reserve', value: 5, color: '#10B981' },
];

const HOT_COLD_DATA = [
  { name: 'Cold Wallet (95%)', value: 95, color: '#3B82F6' },
  { name: 'Hot Wallet (5%)', value: 5, color: '#F59E0B' },
];

const RECONCILIATION_LOG = [
  { date: '2026-03-07', status: 'success', onChain: 125430.50, custody: 125430.50, discrepancy: 0 },
  { date: '2026-03-06', status: 'success', onChain: 124850.25, custody: 124850.25, discrepancy: 0 },
  { date: '2026-03-05', status: 'success', onChain: 123900.75, custody: 123900.75, discrepancy: 0 },
  { date: '2026-03-04', status: 'success', onChain: 122500.00, custody: 122500.00, discrepancy: 0 },
  { date: '2026-03-03', status: 'success', onChain: 121200.50, custody: 121200.50, discrepancy: 0 },
];

export function StakingCustodyPage() {
  const c = useThemeColors();
  const isDark = useIsDark();

  return (
    <PageLayout>
      <Header title="Custody & Segregation" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Lock size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Institutional-Grade Custody
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Your staked assets are held by {CUSTODIAN_INFO.name}, a regulated institutional custodian, segregated from platform operational funds.
              </p>
            </div>
          </div>
        </div>

        {/* Custodian Info */}
        <PageSection label="Third-Party Custodian">
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.3)' }}>
                🔥
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  {CUSTODIAN_INFO.name}
                </p>
                <p style={{ color: c.text3, fontSize: 12, marginBottom: 6 }}>
                  {CUSTODIAN_INFO.type}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    Regulated
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                    Insured
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Founded</p>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  {CUSTODIAN_INFO.founded}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Headquarters</p>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  {CUSTODIAN_INFO.headquarters}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Clients</p>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  {CUSTODIAN_INFO.clients}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>AUM Transferred</p>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                  {CUSTODIAN_INFO.aum}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} color="#10B981" />
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Insurance Coverage</p>
              </div>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                {CUSTODIAN_INFO.insurance}
              </p>
            </div>

            <div>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 6 }}>Licenses & Certifications</p>
              <div className="flex flex-wrap gap-2">
                {CUSTODIAN_INFO.licenses.map((license, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: c.surface2, color: c.text1 }}>
                    {license}
                  </span>
                ))}
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Fund Segregation */}
        <PageSection label="Fund Segregation">
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Client staking funds are <strong>completely segregated</strong> from platform operational funds. In the event of insolvency, your assets are protected and returned in full.
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  key="pie-seg"
                  data={SEGREGATION_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value">
                  {SEGREGATION_DATA.map((entry, index) => (
                    <Cell key={`seg-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  key="tooltip-seg"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-2 mt-3">
              {[
                { icon: Building2, label: 'Client Funds', desc: 'Held in segregated accounts at custodian', color: '#3B82F6' },
                { icon: Lock, label: 'Platform Operational', desc: 'Company operating capital (separate)', color: '#8B5CF6' },
                { icon: Shield, label: 'Insurance Reserve', desc: 'Emergency fund for slashing events', color: '#10B981' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                    <Icon size={18} color={item.color} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                        {item.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
        </PageSection>

        {/* Hot/Cold Wallet */}
        <PageSection label="Hot vs Cold Wallet Distribution">
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              95% of staked assets are held in <strong>cold storage</strong> (offline, air-gapped). Only 5% in hot wallets for operational liquidity (withdrawals, auto-compound).
            </p>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  key="pie-hc"
                  data={HOT_COLD_DATA}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={450}
                  innerRadius={50}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value">
                  {HOT_COLD_DATA.map((entry, index) => (
                    <Cell key={`hc-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  key="tooltip-hc"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} color="#3B82F6" />
                  <p style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700 }}>Cold Storage</p>
                </div>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>
                  Offline, air-gapped, multi-signature hardware wallets
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft size={16} color="#F59E0B" />
                  <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>Hot Wallet</p>
                </div>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>
                  Online for withdrawals, secured with MPC technology
                </p>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Daily Reconciliation */}
        <PageSection label="Daily Reconciliation Audit Trail">
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Every day, we reconcile on-chain balances with custodian records. 100% match rate since launch.
            </p>

            <div className="space-y-2">
              {RECONCILIATION_LOG.map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3"
                  style={{ background: c.surface2 }}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      {new Date(log.date).toLocaleDateString('en-GB')}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                      <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                        Matched
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>On-chain</p>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(log.onChain * 1000)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>Custodian</p>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                        {fmtUsd(log.custody * 1000)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 9 }}>Discrepancy</p>
                      <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                        ${log.discrepancy.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              View Full Audit Trail
            </button>
          </TrCard>
        </PageSection>

        {/* Transparency */}
        <PageSection label="Transparency Commitment">
          <TrCard className="p-4">
            <div className="flex items-start gap-3">
              <Eye size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                  Real-time On-Chain Verification
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                  All staking transactions are visible on-chain. You can verify your stake anytime using blockchain explorers.
                </p>

                <div className="space-y-2">
                  {[
                    { label: 'Ethereum Mainnet', address: '0x1234...5678', explorer: 'etherscan.io' },
                    { label: 'Polygon', address: '0xabcd...ef12', explorer: 'polygonscan.com' },
                    { label: 'BNB Chain', address: '0x9876...5432', explorer: 'bscscan.com' },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{item.label}</p>
                        <a
                          href={`https://${item.explorer}/address/${item.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold"
                          style={{ color: '#3B82F6' }}>
                          View →
                        </a>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                        {item.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Custody arrangements are reviewed quarterly. Custodian is independently audited annually. Insurance coverage is updated to reflect total AUM. All disclosures are accurate as of March 2026.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}