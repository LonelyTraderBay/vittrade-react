import React, { useState } from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Validator {
  id: string;
  name: string;
  address: string;
  uptime: number;
  apr: number;
  totalStaked: number;
  commission: number;
  status: 'healthy' | 'warning' | 'critical';
  lastBlock: string;
  missedBlocks: number;
}

const VALIDATORS: Validator[] = [
  {
    id: 'v1',
    name: 'Validator #1',
    address: '0x1234...5678',
    uptime: 99.95,
    apr: 4.5,
    totalStaked: 15000,
    commission: 10,
    status: 'healthy',
    lastBlock: '2 mins ago',
    missedBlocks: 2,
  },
  {
    id: 'v2',
    name: 'Validator #2',
    address: '0xabcd...ef12',
    uptime: 99.92,
    apr: 4.3,
    totalStaked: 12500,
    commission: 10,
    status: 'healthy',
    lastBlock: '1 min ago',
    missedBlocks: 3,
  },
  {
    id: 'v3',
    name: 'Validator #3',
    address: '0x9876...5432',
    uptime: 98.50,
    apr: 3.8,
    totalStaked: 10000,
    commission: 10,
    status: 'warning',
    lastBlock: '5 mins ago',
    missedBlocks: 15,
  },
];

const UPTIME_HISTORY = [
  { date: '01 Mar', v1: 99.9, v2: 99.8, v3: 99.2 },
  { date: '02 Mar', v1: 99.95, v2: 99.9, v3: 99.0 },
  { date: '03 Mar', v1: 99.92, v2: 99.85, v3: 98.8 },
  { date: '04 Mar', v1: 99.96, v2: 99.9, v3: 98.5 },
  { date: '05 Mar', v1: 99.94, v2: 99.88, v3: 98.4 },
  { date: '06 Mar', v1: 99.95, v2: 99.92, v3: 98.5 },
  { date: '07 Mar', v1: 99.95, v2: 99.92, v3: 98.5 },
];

export function StakingValidatorHealthMonitorPage() {
  const c = useThemeColors();
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);

  const healthyCount = VALIDATORS.filter(v => v.status === 'healthy').length;
  const warningCount = VALIDATORS.filter(v => v.status === 'warning').length;
  const avgUptime = (VALIDATORS.reduce((sum, v) => sum + v.uptime, 0) / VALIDATORS.length).toFixed(2);

  return (
    <PageLayout>
      <Header title="Validator Health" back />

      <PageContent>
        {/* Summary Stats */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <CheckCircle2 size={20} color="#10B981" className="mx-auto mb-2" />
              <p style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                {healthyCount}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Healthy</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: warningCount > 0 ? 'rgba(245,158,11,0.08)' : c.surface2 }}>
              <AlertCircle size={20} color={warningCount > 0 ? '#F59E0B' : c.text3} className="mx-auto mb-2" />
              <p style={{ color: warningCount > 0 ? '#F59E0B' : c.text1, fontSize: 20, fontWeight: 700 }}>
                {warningCount}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Warning</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: c.surface2 }}>
              <Activity size={20} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                {avgUptime}%
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>Avg Uptime</p>
            </div>
          </div>
        </TrCard>

        {/* Validators List */}
        <PageSection label="Active Validators">
          <div className="flex flex-col gap-3">
            {VALIDATORS.map(validator => {
              const statusColor =
                validator.status === 'healthy' ? '#10B981' :
                validator.status === 'warning' ? '#F59E0B' : '#EF4444';
              const statusBg =
                validator.status === 'healthy' ? 'rgba(16,185,129,0.08)' :
                validator.status === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

              return (
                <TrCard
                  key={validator.id}
                  hover
                  className="p-4"
                  onClick={() => setSelectedValidator(validator.id === selectedValidator ? null : validator.id)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: statusBg }}>
                      {validator.status === 'healthy' ? (
                        <CheckCircle2 size={24} color={statusColor} />
                      ) : validator.status === 'warning' ? (
                        <AlertCircle size={24} color={statusColor} />
                      ) : (
                        <XCircle size={24} color={statusColor} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                          {validator.name}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ background: statusBg, color: statusColor }}>
                          {validator.status === 'healthy' ? 'Healthy' :
                           validator.status === 'warning' ? 'Warning' : 'Critical'}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
                        {validator.address}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Activity size={12} color={statusColor} />
                          <p style={{ color: c.text2, fontSize: 11 }}>
                            {validator.uptime}% uptime
                          </p>
                        </div>
                        <div className="w-1 h-1 rounded-full" style={{ background: c.borderSolid }} />
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {validator.apr}% APR
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Staked</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
                        {validator.totalStaked.toLocaleString()} ETH
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Commission</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
                        {validator.commission}%
                      </p>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Missed Blocks</p>
                      <p style={{ color: validator.missedBlocks > 10 ? '#F59E0B' : c.text1, fontSize: 12, fontWeight: 700 }}>
                        {validator.missedBlocks}
                      </p>
                    </div>
                  </div>

                  {selectedValidator === validator.id && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: c.borderSolid }}>
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ color: c.text2, fontSize: 12, fontWeight: 700 }}>
                          Last Block Produced
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {validator.lastBlock}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2 rounded-lg text-xs font-semibold"
                          style={{ background: c.surface2, color: c.text1 }}>
                          View Details
                        </button>
                        {validator.status === 'warning' && (
                          <button
                            className="flex-1 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                            Rebalance Stake
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Uptime Trend */}
        <PageSection label="7-Day Uptime Trend">
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={UPTIME_HISTORY}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.borderSolid} />
                <XAxis key="x-axis" dataKey="date" tick={{ fill: c.text3, fontSize: 10 }} />
                <YAxis key="y-axis" domain={[98, 100]} tick={{ fill: c.text3, fontSize: 10 }} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
                <Line key="line-v1" type="monotone" dataKey="v1" stroke="#10B981" strokeWidth={2} name="Validator #1" />
                <Line key="line-v2" type="monotone" dataKey="v2" stroke="#3B82F6" strokeWidth={2} name="Validator #2" />
                <Line key="line-v3" type="monotone" dataKey="v3" stroke="#F59E0B" strokeWidth={2} name="Validator #3" />
              </LineChart>
            </ResponsiveContainer>
          </TrCard>
        </PageSection>

        {/* Actions */}
        {warningCount > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
            <div className="flex gap-3">
              <AlertCircle size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  Action Required
                </p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                  {warningCount} validator(s) showing degraded performance. Consider rebalancing your stake to healthier validators.
                </p>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Auto-Rebalance Stake
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Validator metrics updated every 5 minutes. Uptime calculated based on last 10,000 blocks. Auto-rebalancing triggers when validator uptime drops below 99%.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}