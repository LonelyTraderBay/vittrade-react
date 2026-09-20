import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Shield, Download, Filter } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface SlashingEvent {
  id: string;
  date: string;
  validator: string;
  network: string;
  reason: 'double-sign' | 'downtime' | 'attestation-miss' | 'sync-committee';
  slashedAmount: number;
  affectedUsers: number;
  insuranceCoverage: number;
  status: 'covered' | 'partial' | 'uncovered';
}

const SLASHING_EVENTS: SlashingEvent[] = [
  {
    id: 'se-20260220',
    date: '2026-02-20',
    validator: 'Validator #3',
    network: 'Ethereum',
    reason: 'downtime',
    slashedAmount: 0.5,
    affectedUsers: 12,
    insuranceCoverage: 100,
    status: 'covered',
  },
  {
    id: 'se-20251115',
    date: '2025-11-15',
    validator: 'Validator #7',
    network: 'Ethereum',
    reason: 'attestation-miss',
    slashedAmount: 0.2,
    affectedUsers: 8,
    insuranceCoverage: 100,
    status: 'covered',
  },
  {
    id: 'se-20250820',
    date: '2025-08-20',
    validator: 'Validator #12',
    network: 'Solana',
    reason: 'double-sign',
    slashedAmount: 5.0,
    affectedUsers: 25,
    insuranceCoverage: 80,
    status: 'partial',
  },
];

const SLASHING_STATS = {
  totalEvents: 3,
  totalSlashed: 5.7,
  totalCovered: 5.1,
  coverageRate: 89.5,
  avgRecoveryTime: '2.5 days',
  lastEvent: '2026-02-20',
};

const SLASHING_TREND = [
  { month: 'Apr 2025', events: 0, amount: 0 },
  { month: 'May 2025', events: 0, amount: 0 },
  { month: 'Jun 2025', events: 0, amount: 0 },
  { month: 'Jul 2025', events: 0, amount: 0 },
  { month: 'Aug 2025', events: 1, amount: 5.0 },
  { month: 'Sep 2025', events: 0, amount: 0 },
  { month: 'Oct 2025', events: 0, amount: 0 },
  { month: 'Nov 2025', events: 1, amount: 0.2 },
  { month: 'Dec 2025', events: 0, amount: 0 },
  { month: 'Jan 2026', events: 0, amount: 0 },
  { month: 'Feb 2026', events: 1, amount: 0.5 },
  { month: 'Mar 2026', events: 0, amount: 0 },
];

const PREVENTION_MEASURES = [
  {
    measure: 'Multi-Validator Distribution',
    status: 'active' as const,
    desc: 'Stakes distributed across 15+ validators to minimize single-point failure',
  },
  {
    measure: 'Real-time Monitoring',
    status: 'active' as const,
    desc: '24/7 automated monitoring of validator uptime and performance',
  },
  {
    measure: 'Auto-Rebalancing',
    status: 'active' as const,
    desc: 'Automatic stake reallocation from underperforming validators',
  },
  {
    measure: 'Insurance Fund',
    status: 'active' as const,
    desc: '165% coverage ratio ensures full compensation for slashing events',
  },
];

export function StakingSlashingHistoryPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'history' | 'stats' | 'prevention'>('history');

  return (
    <PageLayout>
      <Header title="Slashing History" back />

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Protected by Insurance
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                All slashing events are covered by our insurance fund. {SLASHING_STATS.coverageRate}% of historical losses have been fully compensated.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <TrCard className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Events</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {SLASHING_STATS.totalEvents}
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Last 12 months</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Slashed</p>
              <p style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>
                {SLASHING_STATS.totalSlashed} ETH
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>All networks</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Insurance Paid</p>
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                {SLASHING_STATS.totalCovered} ETH
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>{SLASHING_STATS.coverageRate}% coverage</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg Recovery</p>
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {SLASHING_STATS.avgRecoveryTime}
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Time to payout</p>
            </div>
          </div>
        </TrCard>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'history', label: 'History' },
            { id: 'stats', label: 'Statistics' },
            { id: 'prevention', label: 'Prevention' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'history' && (
          <>
            <PageSection label="Slashing Events">
              {SLASHING_EVENTS.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {SLASHING_EVENTS.map(event => (
                    <TrCard key={event.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                            {event.validator}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            {event.network} • {new Date(event.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: event.status === 'covered' ? 'rgba(16,185,129,0.15)' :
                                       event.status === 'partial' ? 'rgba(245,158,11,0.15)' :
                                       'rgba(239,68,68,0.15)',
                            color: event.status === 'covered' ? '#10B981' :
                                   event.status === 'partial' ? '#F59E0B' : '#EF4444',
                          }}>
                          {event.status === 'covered' ? 'Fully Covered' :
                           event.status === 'partial' ? 'Partially Covered' : 'Not Covered'}
                        </span>
                      </div>

                      <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>
                          <strong>Reason:</strong>{' '}
                          {event.reason === 'double-sign' ? 'Double Signing' :
                           event.reason === 'downtime' ? 'Validator Downtime' :
                           event.reason === 'attestation-miss' ? 'Missed Attestations' :
                           'Sync Committee Failure'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Slashed</p>
                            <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
                              {event.slashedAmount} ETH
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Coverage</p>
                            <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>
                              {event.insuranceCoverage}%
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10 }}>Users</p>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                              {event.affectedUsers}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield size={14} color="#10B981" />
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          Insurance payout: {(event.slashedAmount * event.insuranceCoverage / 100).toFixed(2)} ETH
                        </p>
                      </div>
                    </TrCard>
                  ))}
                </div>
              ) : (
                <TrCard className="p-8 text-center">
                  <Shield size={48} color="#10B981" className="mx-auto mb-3" />
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    No Slashing Events
                  </p>
                  <p style={{ color: c.text3, fontSize: 12 }}>
                    Great! No slashing events in the last 12 months.
                  </p>
                </TrCard>
              )}
            </PageSection>
          </>
        )}

        {tab === 'stats' && (
          <>
            <PageSection label="12-Month Trend">
              <TrCard className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={SLASHING_TREND}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.borderSolid} />
                    <XAxis key="x-axis" dataKey="month" tick={{ fill: c.text3, fontSize: 10 }} />
                    <YAxis key="y-axis" tick={{ fill: c.text3, fontSize: 10 }} />
                    <Tooltip
                      key="tooltip"
                      contentStyle={{
                        background: c.surface,
                        border: `1px solid ${c.borderSolid}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) =>
                        name === 'amount' ? `${value} ETH` : `${value} events`
                      }
                    />
                    <Line
                      key="line-amount"
                      type="monotone"
                      dataKey="amount"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', r: 4 }}
                      name="amount"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} color="#10B981" />
                    <p style={{ color: c.text2, fontSize: 11 }}>
                      -40% vs 12 months ago
                    </p>
                  </div>
                  <div className="w-1 h-1 rounded-full" style={{ background: c.borderSolid }} />
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Avg: 0.25 events/month
                  </p>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Breakdown by Network">
              <div className="flex flex-col gap-2">
                {[
                  { network: 'Ethereum', events: 2, amount: 0.7, coverage: 100 },
                  { network: 'Solana', events: 1, amount: 5.0, coverage: 80 },
                ].map((item, idx) => (
                  <TrCard key={idx} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{item.network}</p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{item.events} events</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-2" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Total Slashed</p>
                        <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
                          {item.amount} {item.network === 'Ethereum' ? 'ETH' : 'SOL'}
                        </p>
                      </div>
                      <div className="rounded-xl p-2" style={{ background: 'rgba(16,185,129,0.08)' }}>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Coverage</p>
                        <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
                          {item.coverage}%
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <PageSection label="Breakdown by Reason">
              <div className="flex flex-col gap-2">
                {[
                  { reason: 'Double Signing', events: 1, severity: 'critical' },
                  { reason: 'Validator Downtime', events: 1, severity: 'high' },
                  { reason: 'Missed Attestations', events: 1, severity: 'medium' },
                ].map((item, idx) => (
                  <TrCard key={idx} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          size={18}
                          color={
                            item.severity === 'critical' ? '#EF4444' :
                            item.severity === 'high' ? '#F97316' : '#F59E0B'
                          }
                        />
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                            {item.reason}
                          </p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)} severity
                          </p>
                        </div>
                      </div>
                      <p style={{ color: c.text2, fontSize: 13, fontWeight: 700 }}>
                        {item.events}
                      </p>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'prevention' && (
          <>
            <PageSection label="Active Prevention Measures">
              <div className="flex flex-col gap-3">
                {PREVENTION_MEASURES.map((measure, idx) => (
                  <TrCard key={idx} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)' }}>
                        <Shield size={20} color="#10B981" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                            {measure.measure}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                            Active
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                          {measure.desc}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                💡 <strong>Proactive Protection:</strong> Our multi-layered prevention system has reduced slashing events by 40% year-over-year. Continuous monitoring and automated rebalancing ensure your stake is always protected.
              </p>
            </div>
          </>
        )}

        {/* Export */}
        <button
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: c.surface2, color: c.text1 }}>
          <Download size={16} />
          Export Slashing Report (CSV)
        </button>

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Slashing data is updated in real-time. Insurance claims are processed within 7 business days. Historical data available for 24 months. For questions, contact support@platform.com.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}