/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadGasTrackerPage — Multi-chain Gas Price Tracker (Phase 4.10)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Live gas prices per chain, 24h history chart,
 *            cost estimator for common operations, gas alerts,
 *            chain comparison, EIP-1559 breakdown
 */

import React, { useState, useMemo } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Fuel, TrendingUp, TrendingDown, Minus, Bell, BellOff,
  Zap, Info, Plus,
  Trash2, X,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  MOCK_GAS_PRICES, MOCK_GAS_ESTIMATES, generateGasHistory,
  loadGasAlerts, saveGasAlerts,
  type GasAlert,
} from './launchpadData';

const TABS = ['prices', 'estimator', 'alerts'];

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TREND_COLORS = { up: '#EF4444', down: '#10B981', stable: '#8B95B3' };

export function LaunchpadGasTrackerPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('prices');
  const [selectedChain, setSelectedChain] = useState('Ethereum');
  const [alerts, setAlerts] = useState<GasAlert[]>(() => loadGasAlerts());
  const [showAddAlert, setShowAddAlert] = useState(false);

  const gasHistory = useMemo(() => generateGasHistory(selectedChain), [selectedChain]);
  const selectedGas = MOCK_GAS_PRICES.find(g => g.chain === selectedChain);

  const toggleAlert = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlerts(updated);
    saveGasAlerts(updated);
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    saveGasAlerts(updated);
  };

  return (
    <PageLayout>
      <Header title="Gas Tracker" back />

      {/* Featured chain card */}
      {selectedGas && (
        <div className="px-5 pt-2 pb-1">
          <TrCard variant="hero" className="p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
              style={{ background: `radial-gradient(circle, ${selectedGas.chainColor}25 0%, transparent 65%)` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Fuel size={14} color="rgba(255,255,255,0.5)" />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{selectedGas.chain} Gas</span>
                <span className="ml-auto flex items-center gap-1 px-1.5 py-px rounded"
                  style={{ background: TREND_COLORS[selectedGas.trend] + '20', color: TREND_COLORS[selectedGas.trend], fontSize: 9, fontWeight: 600 }}>
                  {React.createElement(TREND_ICONS[selectedGas.trend], { size: 9 })}
                  {selectedGas.change24h > 0 ? '+' : ''}{selectedGas.change24h}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {([
                  { label: 'Slow', value: selectedGas.slow, color: '#10B981' },
                  { label: 'Standard', value: selectedGas.standard, color: '#3B82F6' },
                  { label: 'Fast', value: selectedGas.fast, color: '#F59E0B' },
                  { label: 'Instant', value: selectedGas.instant, color: '#EF4444' },
                ]).map(tier => (
                  <div key={tier.label} className="text-center">
                    <p style={{ color: tier.color, fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>
                      {tier.value < 1 ? tier.value.toFixed(2) : Math.round(tier.value)}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>{tier.label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>
                {selectedGas.unit} · Updated {selectedGas.lastUpdated}
              </p>
            </div>
          </TrCard>
        </div>
      )}

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'prices' && (
          <>
            {/* Chain selector pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {MOCK_GAS_PRICES.map(g => (
                <button key={g.chain} onClick={() => setSelectedChain(g.chain)}
                  className="shrink-0 px-3 py-1.5 rounded-lg"
                  style={{
                    background: selectedChain === g.chain ? g.chainColor + '15' : c.surface2,
                    border: `1.5px solid ${selectedChain === g.chain ? g.chainColor + '40' : 'transparent'}`,
                    color: selectedChain === g.chain ? g.chainColor : c.text3,
                    fontSize: 11, fontWeight: 600,
                  }}>
                  {g.chain}
                </button>
              ))}
            </div>

            {/* 24h Chart */}
            <TrCard className="p-3">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                Gas 24h — {selectedChain}
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={gasHistory}>
                  <CartesianGrid key="gas-grid" strokeDasharray="3 3" stroke={c.border} />
                  <XAxis key="gas-x" dataKey="time" tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis key="gas-y" tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip
                    key="gas-tooltip"
                    contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: c.text1, fontWeight: 600 }}
                  />
                  <Line key="gas-slow" type="monotone" dataKey="slow" stroke="#10B981" strokeWidth={1.5} dot={false} name="Slow" />
                  <Line key="gas-standard" type="monotone" dataKey="standard" stroke="#3B82F6" strokeWidth={2} dot={false} name="Standard" />
                  <Line key="gas-fast" type="monotone" dataKey="fast" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Fast" />
                </LineChart>
              </ResponsiveContainer>
            </TrCard>

            {/* EIP-1559 breakdown for Ethereum */}
            {selectedGas?.baseFee && (
              <TrCard className="p-3">
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>EIP-1559</p>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(59,130,246,0.06)' }}>
                    <p style={{ color: '#3B82F6', fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>{selectedGas.baseFee}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Base Fee</p>
                  </div>
                  <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(139,92,246,0.06)' }}>
                    <p style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>{selectedGas.priorityFee}</p>
                    <p style={{ color: c.text3, fontSize: 9 }}>Priority Fee</p>
                  </div>
                </div>
              </TrCard>
            )}

            {/* All chains comparison */}
            <PageSection label="Tat ca chains" accentColor="#6366F1">
              <div className="flex flex-col gap-1.5">
                {MOCK_GAS_PRICES.map(g => {
                  const TrendIcon = TREND_ICONS[g.trend];
                  return (
                    <TrCard key={g.chain} as="button" onClick={() => setSelectedChain(g.chain)}
                      className="p-3"
                      style={{ border: selectedChain === g.chain ? `1.5px solid ${g.chainColor}30` : undefined }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: g.chainColor + '15' }}>
                          <span style={{ color: g.chainColor, fontSize: 10, fontWeight: 800 }}>{g.chainIcon}</span>
                        </div>
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{g.chain}</p>
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            {g.slow < 1 ? g.slow.toFixed(2) : g.slow} / {g.standard < 1 ? g.standard.toFixed(2) : g.standard} / {g.fast < 1 ? g.fast.toFixed(2) : g.fast} {g.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendIcon size={12} color={TREND_COLORS[g.trend]} />
                          <span style={{ color: TREND_COLORS[g.trend], fontSize: 10, fontWeight: 600 }}>
                            {g.change24h > 0 ? '+' : ''}{g.change24h}%
                          </span>
                        </div>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>
          </>
        )}

        {tab === 'estimator' && (
          <PageSection label="Chi phi uoc tinh" accentColor="#F59E0B">
            <div className="flex flex-col gap-2">
              {MOCK_GAS_ESTIMATES.map(est => (
                <TrCard key={est.operation} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} color="#F59E0B" />
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{est.operation}</span>
                    <span className="ml-auto" style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>
                      {est.gasUnits.toLocaleString()} gas
                    </span>
                  </div>
                  <div className="flex flex-col gap-0">
                    {est.costs.map(cost => (
                      <div key={cost.chain} className="flex items-center justify-between py-1.5"
                        style={{ borderBottom: `1px solid ${c.border}` }}>
                        <span style={{ color: c.text2, fontSize: 10 }}>{cost.chain}</span>
                        <div className="flex items-center gap-3">
                          <span style={{ color: '#10B981', fontSize: 10, fontFamily: 'monospace' }}>{cost.slow}</span>
                          <span style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>{cost.standard}</span>
                          <span style={{ color: '#F59E0B', fontSize: 10, fontFamily: 'monospace' }}>{cost.fast}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-4 mt-1">
                    <span style={{ color: '#10B981', fontSize: 8 }}>Slow</span>
                    <span style={{ color: '#3B82F6', fontSize: 8 }}>Standard</span>
                    <span style={{ color: '#F59E0B', fontSize: 8 }}>Fast</span>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>
        )}

        {tab === 'alerts' && (
          <>
            <button onClick={() => setShowAddAlert(true)}
              className="w-full rounded-2xl p-3 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.98]"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px dashed rgba(59,130,246,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Plus size={18} color="#3B82F6" />
              </div>
              <div className="text-left">
                <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 700 }}>Them canh bao gas</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Thong bao khi gas dat nguong</p>
              </div>
            </button>

            <PageSection label="Canh bao hien tai" accentColor="#F59E0B">
              <div className="flex flex-col gap-2">
                {alerts.map(alert => (
                  <TrCard key={alert.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: alert.chainColor + '12' }}>
                        {alert.direction === 'below'
                          ? <TrendingDown size={14} color={alert.chainColor} />
                          : <TrendingUp size={14} color={alert.chainColor} />}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
                          {alert.chain} {alert.direction === 'below' ? '<' : '>'} {alert.threshold} {alert.unit}
                        </p>
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            {alert.triggerCount} lan kich hoat
                          </span>
                          {alert.lastTriggered && (
                            <span style={{ color: c.text3, fontSize: 10 }}>
                              · {alert.lastTriggered}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => toggleAlert(alert.id)} className="p-1.5">
                        {alert.enabled
                          ? <Bell size={16} color="#10B981" />
                          : <BellOff size={16} color={c.text3} />}
                      </button>
                      <button onClick={() => deleteAlert(alert.id)} className="p-1.5">
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            {alerts.length === 0 && (
              <TrCard className="p-8 text-center">
                <Bell size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Chua co canh bao nao</p>
                <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Them canh bao de biet khi gas giam</p>
              </TrCard>
            )}
          </>
        )}

        <div className="h-[60px]" />
      </PageContent>

      {/* Add Alert Sheet */}
      {showAddAlert && (
        <AddAlertSheet
          onClose={() => setShowAddAlert(false)}
          onAdd={(alert) => {
            const updated = [...alerts, alert];
            setAlerts(updated);
            saveGasAlerts(updated);
            setShowAddAlert(false);
          }}
        />
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function AddAlertSheet({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (alert: GasAlert) => void;
}) {
  const c = useThemeColors();
  const [chain, setChain] = useState('Ethereum');
  const [threshold, setThreshold] = useState('');
  const [direction, setDirection] = useState<'below' | 'above'>('below');

  const chainOpt = MOCK_GAS_PRICES.find(g => g.chain === chain);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-full max-w-[428px] rounded-t-3xl" style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.border }} />
        </div>
        <div className="px-5 pb-2 flex items-center justify-between">
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Them canh bao gas</p>
          <button onClick={onClose} className="p-1"><X size={18} color={c.text3} /></button>
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Chain</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MOCK_GAS_PRICES.map(g => (
                <button key={g.chain} onClick={() => setChain(g.chain)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{
                    background: chain === g.chain ? g.chainColor + '15' : c.surface2,
                    border: `1.5px solid ${chain === g.chain ? g.chainColor + '40' : 'transparent'}`,
                    color: chain === g.chain ? g.chainColor : c.text3,
                    fontSize: 11, fontWeight: 600,
                  }}>
                  {g.chain}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Dieu kien</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setDirection('below')}
                className="flex-1 rounded-xl py-2 text-center"
                style={{
                  background: direction === 'below' ? 'rgba(16,185,129,0.1)' : c.surface2,
                  border: `1.5px solid ${direction === 'below' ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                  color: direction === 'below' ? '#10B981' : c.text3, fontSize: 12, fontWeight: 600,
                }}>
                Thap hon
              </button>
              <button onClick={() => setDirection('above')}
                className="flex-1 rounded-xl py-2 text-center"
                style={{
                  background: direction === 'above' ? 'rgba(239,68,68,0.1)' : c.surface2,
                  border: `1.5px solid ${direction === 'above' ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                  color: direction === 'above' ? '#EF4444' : c.text3, fontSize: 12, fontWeight: 600,
                }}>
                Cao hon
              </button>
            </div>
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Nguong ({chainOpt?.unit || 'Gwei'})</label>
            <input value={threshold} onChange={e => setThreshold(e.target.value)}
              type="number" placeholder="VD: 15"
              className="w-full mt-1 rounded-xl px-3 py-2.5"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}`, outline: 'none' }} />
          </div>

          <CTAButton disabled={!threshold.trim()} onClick={() => {
            onAdd({
              id: `ga_${Date.now()}`, chain,
              chainColor: chainOpt?.chainColor || '#8B95B3',
              threshold: parseFloat(threshold),
              direction, unit: chainOpt?.unit || 'Gwei',
              enabled: true, triggerCount: 0,
            });
          }}>
            Them canh bao
          </CTAButton>
        </div>
      </div>
    </div>
  );
}