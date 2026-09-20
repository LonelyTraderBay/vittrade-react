/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadRebalancePage — Portfolio Rebalancing (Phase 4.10)
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Page
 *  Features: Current vs target allocation, strategy selector,
 *            rebalance suggestions, deviation chart, action cards,
 *            simulated execution, risk analysis
 */

import React, { useState, useMemo } from 'react';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Minus,
  Shield, AlertTriangle, CheckCircle,
  Info, RefreshCw,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  MOCK_PORTFOLIO_ASSETS, REBALANCE_STRATEGIES, generateRebalanceSuggestions,
  type PortfolioAsset, type RebalanceSuggestion, type RebalanceStrategy,
} from './launchpadData';

const ACTION_CONFIG = {
  buy: { label: 'Mua', color: '#10B981', icon: ArrowUpRight, bg: 'rgba(16,185,129,0.08)' },
  sell: { label: 'Bán', color: '#EF4444', icon: ArrowDownRight, bg: 'rgba(239,68,68,0.08)' },
  hold: { label: 'Giữ', color: '#8B95B3', icon: Minus, bg: 'rgba(139,149,179,0.06)' },
};

const RISK_COLORS = { conservative: '#10B981', moderate: '#3B82F6', aggressive: '#F59E0B' };

export function LaunchpadRebalancePage() {
  const c = useThemeColors();
  const [assets] = useState<PortfolioAsset[]>(MOCK_PORTFOLIO_ASSETS);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('moderate');
  const [showConfirm, setShowConfirm] = useState(false);

  const strategy = REBALANCE_STRATEGIES.find(s => s.id === selectedStrategy)!;

  // Apply strategy targets to assets
  const assetsWithTargets = useMemo(() => {
    return assets.map(a => {
      const stratTarget = strategy.targets.find(t => t.symbol === a.symbol);
      const otherTarget = strategy.targets.find(t => t.symbol === 'Other');
      return { ...a, targetPercent: stratTarget?.percent || otherTarget?.percent || 0 };
    });
  }, [assets, strategy]);

  const suggestions = useMemo(() => generateRebalanceSuggestions(assetsWithTargets), [assetsWithTargets]);
  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalDeviation = suggestions.reduce((s, sg) => s + Math.abs(sg.deviation), 0);
  const totalGasEstimate = suggestions.filter(s => s.action !== 'hold').length * 1.5;

  const pieData = assetsWithTargets.map(a => ({ name: a.symbol, value: a.currentPercent, color: a.color }));
  const targetPieData = assetsWithTargets.map(a => ({ name: a.symbol, value: a.targetPercent, color: a.color }));

  const barData = assetsWithTargets.map(a => ({
    name: a.symbol,
    current: a.currentPercent,
    target: a.targetPercent,
    fill: a.color,
  }));

  return (
    <PageLayout variant="flush">
      <Header title="Rebalance" back />

      <PageContent gap="default" grow>
        {/* Portfolio value hero */}
        <TrCard variant="hero" className="p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <PieIcon size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Portfolio Value</span>
            </div>
            <p style={{ color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {assets.length} assets · Deviation: {totalDeviation.toFixed(1)}%
              </span>
            </div>
          </div>
        </TrCard>

        {/* Strategy selector */}
        <PageSection label="Chiến lược" accentColor="#6366F1">
          <div className="flex gap-2">
            {REBALANCE_STRATEGIES.map(s => (
              <button key={s.id} onClick={() => setSelectedStrategy(s.id)}
                className="flex-1 rounded-2xl p-3 text-center hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{
                  background: selectedStrategy === s.id ? s.color + '12' : c.surface2,
                  border: `1.5px solid ${selectedStrategy === s.id ? s.color + '35' : 'transparent'}`,
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                  style={{ background: s.color + '18' }}>
                  <Shield size={14} color={s.color} />
                </div>
                <p style={{ color: selectedStrategy === s.id ? s.color : c.text1, fontSize: 11, fontWeight: 700 }}>
                  {s.name}
                </p>
                <p style={{ color: c.text3, fontSize: 9 }}>{s.description}</p>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Allocation comparison — Current vs Target */}
        <TrCard className="p-3">
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Hiện tại vs Mục tiêu
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 9, textAlign: 'center', marginBottom: 4 }}>Hiện tại</p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie key="rebal-pie-cur" data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={`cur-${i}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <RefreshCw size={16} color={c.text3} />
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 9, textAlign: 'center', marginBottom: 4 }}>Mục tiêu</p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie key="rebal-pie-tgt" data={targetPieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} strokeWidth={0}>
                    {targetPieData.map((entry, i) => <Cell key={`tgt-${i}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
            {assetsWithTargets.map(a => (
              <div key={a.symbol} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span style={{ color: c.text3, fontSize: 9 }}>{a.symbol}</span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Deviation bar chart */}
        <TrCard className="p-3">
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Độ lệch phân bổ</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} layout="vertical" barGap={2}>
              <CartesianGrid key="rebal-grid" strokeDasharray="3 3" stroke={c.border} horizontal={false} />
              <XAxis key="rebal-x" type="number" tick={{ fontSize: 9, fill: c.text3 }} tickLine={false} axisLine={false} />
              <YAxis key="rebal-y" type="category" dataKey="name" tick={{ fontSize: 10, fill: c.text1, fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                key="rebal-tooltip"
                contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 11 }}
              />
              <Bar key="rebal-bar-cur" dataKey="current" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={8} name="Hiện tại %" />
              <Bar key="rebal-bar-tgt" dataKey="target" fill="rgba(99,102,241,0.3)" radius={[0, 4, 4, 0]} barSize={8} name="Mục tiêu %" />
            </BarChart>
          </ResponsiveContainer>
        </TrCard>

        {/* Suggestions */}
        <PageSection label="Đề xuất rebalance" accentColor="#F59E0B">
          <div className="flex flex-col gap-2">
            {suggestions.map(sg => {
              const cfg = ACTION_CONFIG[sg.action];
              const ActionIcon = cfg.icon;
              return (
                <TrCard key={sg.assetId} className="p-3"
                  style={{ borderLeft: `3px solid ${cfg.color}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: sg.color + '15' }}>
                      <span style={{ color: sg.color, fontSize: 10, fontWeight: 800 }}>{sg.symbol.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{sg.symbol}</span>
                        <span className="flex items-center gap-0.5 px-1.5 py-px rounded"
                          style={{ background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 700 }}>
                          <ActionIcon size={8} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text3, fontSize: 10 }}>
                          {sg.currentPercent.toFixed(1)}% → {sg.targetPercent.toFixed(1)}%
                        </span>
                        {sg.action !== 'hold' && (
                          <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>
                            {sg.deviation > 0 ? '-' : '+'}{Math.abs(sg.deviation).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {sg.action !== 'hold' && (
                      <div className="text-right">
                        <p style={{ color: cfg.color, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                          ${sg.suggestedValue.toFixed(0)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 9 }}>
                          {sg.suggestedAmount < 1 ? sg.suggestedAmount.toFixed(4) : sg.suggestedAmount.toFixed(2)} {sg.symbol}
                        </p>
                      </div>
                    )}
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Summary */}
        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info size={12} color="#6366F1" />
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Tóm tắt rebalance</span>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { label: 'Số giao dịch cần thực hiện', value: `${suggestions.filter(s => s.action !== 'hold').length} tx` },
              { label: 'Gas ước tính', value: `~$${totalGasEstimate.toFixed(2)}` },
              { label: 'Chiến lược', value: strategy.name },
              { label: 'Mức rủi ro', value: strategy.riskLevel, color: RISK_COLORS[strategy.riskLevel] },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: row.color || c.text1, fontSize: 11, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Warning */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Đây là đề xuất tự động dựa trên tỷ lệ mục tiêu. Giá token có thể thay đổi giữa lúc xem và lúc thực hiện.
            Luôn kiểm tra lại trước khi giao dịch.
          </p>
        </div>
      </PageContent>

      <StickyFooter>
        <CTAButton onClick={() => setShowConfirm(true)} variant="primary">
          Xem lại & Thực hiện Rebalance
        </CTAButton>
      </StickyFooter>

      {/* Confirm Sheet */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-[428px] rounded-t-3xl" style={{ background: c.bg }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: c.border }} />
            </div>
            <div className="px-5 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} color="#10B981" />
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Xác nhận Rebalance</p>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {suggestions.filter(s => s.action !== 'hold').map(sg => {
                  const cfg = ACTION_CONFIG[sg.action];
                  return (
                    <div key={sg.assetId} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{ background: cfg.bg }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                        <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{sg.symbol}</span>
                      </div>
                      <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                        ${sg.suggestedValue.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-4 px-1">
                <span style={{ color: c.text3, fontSize: 11 }}>Gas tổng</span>
                <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>~${totalGasEstimate.toFixed(2)}</span>
              </div>

              <CTAButton variant="success" onClick={() => setShowConfirm(false)}>
                Xác nhận Rebalance (Mô phỏng)
              </CTAButton>
              <button onClick={() => setShowConfirm(false)}
                className="w-full mt-2 py-2.5 rounded-[14px] text-center"
                style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}