/**
 * ══════════════════════════════════════════════════════════════════
 *  SOCIAL TRADING SIGNALS PAGE — P3 Community Signal Feed
 * ══════════════════════════════════════════════════════════════════
 *  Signal feed, provider rankings, signal performance, risk
 *  disclaimers. Route: /markets/signals
 */

import React, { useState, useMemo } from 'react';
import {
  Target, Users, Star, TrendingUp, TrendingDown,
  Shield, AlertTriangle, Copy, Heart, ChevronDown,
  CheckCircle, XCircle, Clock, Info,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import {
  TRADING_SIGNALS, SIGNAL_PROVIDER_TIERS, SIGNAL_STATUS_CONFIG,
  type TradingSignal,
} from '../../data/marketP3Data';

const TABS = ['Tín hiệu', 'Nhà cung cấp', 'Hiệu suất'];
const STATUS_FILTERS = ['all', 'active', 'target_hit', 'stopped'] as const;
const CATEGORY_FILTERS = ['all', 'scalp', 'swing', 'position'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tất cả', scalp: 'Scalp', swing: 'Swing', position: 'Position',
};

export function SocialSignalsPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState('Tín hiệu');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSignals = useMemo(() => {
    let items = [...TRADING_SIGNALS];
    if (statusFilter !== 'all') items = items.filter(s => s.status === statusFilter);
    if (categoryFilter !== 'all') items = items.filter(s => s.category === categoryFilter);
    return items;
  }, [statusFilter, categoryFilter]);

  // Provider aggregation
  const providers = useMemo(() => {
    const map = new Map<string, {
      name: string; avatar: string; tier: TradingSignal['providerTier'];
      winRate: number; followers: number; totalSignals: number;
      activeSignals: number; avgPnl: number;
    }>();

    TRADING_SIGNALS.forEach(s => {
      const existing = map.get(s.providerName);
      if (existing) {
        existing.totalSignals++;
        if (s.status === 'active') existing.activeSignals++;
        existing.avgPnl = (existing.avgPnl * (existing.totalSignals - 1) + s.pnlPct) / existing.totalSignals;
      } else {
        map.set(s.providerName, {
          name: s.providerName, avatar: s.providerAvatar,
          tier: s.providerTier, winRate: s.providerWinRate,
          followers: s.providerFollowers, totalSignals: 1,
          activeSignals: s.status === 'active' ? 1 : 0,
          avgPnl: s.pnlPct,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.winRate - a.winRate);
  }, []);

  // Performance stats
  const totalSignals = TRADING_SIGNALS.length;
  const hitSignals = TRADING_SIGNALS.filter(s => s.status === 'target_hit').length;
  const stoppedSignals = TRADING_SIGNALS.filter(s => s.status === 'stopped').length;
  const overallWinRate = totalSignals > 0 ? (hitSignals / (hitSignals + stoppedSignals)) * 100 : 0;
  const avgPnl = TRADING_SIGNALS.reduce((s, sig) => s + sig.pnlPct, 0) / totalSignals;

  return (
    <PageLayout>
      <Header title="Tín hiệu giao dịch" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Risk disclaimer */}
        <TrCard className="p-3" accentBorder="rgba(245,158,11,0.15)">
          <div className="flex gap-2">
            <Shield size={14} color="#F59E0B" className="shrink-0 mt-1" />
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
              Tín hiệu từ cộng đồng chỉ mang tính tham khảo. Không phải khuyến nghị đầu tư. 
              Luôn tự nghiên cứu và quản lý rủi ro.
            </p>
          </div>
        </TrCard>

        {/* ═══ Signals tab ═══ */}
        {tab === 'Tín hiệu' && (
          <>
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
              {STATUS_FILTERS.map(f => {
                const cfg = f === 'all' ? { label: 'Tất cả', color: '#6B7280' } : SIGNAL_STATUS_CONFIG[f as TradingSignal['status']];
                return (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); hapticSelection(); }}
                    className="shrink-0 px-3 py-2 rounded-xl min-h-9"
                    style={{
                      background: statusFilter === f ? `${cfg.color}12` : c.surface2,
                      color: statusFilter === f ? cfg.color : c.text3,
                      border: `1px solid ${statusFilter === f ? `${cfg.color}30` : 'transparent'}`,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.medium,
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => { setCategoryFilter(f); hapticSelection(); }}
                  className="px-3 py-1 rounded-lg min-h-9"
                  style={{
                    background: categoryFilter === f ? c.chipActiveBg : 'transparent',
                    color: categoryFilter === f ? c.chipActiveText : c.text3,
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.medium,
                  }}
                >
                  {CATEGORY_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Signal cards */}
            <div className="flex flex-col" style={{ gap: 6 }}>
              {filteredSignals.map(signal => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  expanded={expandedId === signal.id}
                  onToggle={() => { setExpandedId(expandedId === signal.id ? null : signal.id); hapticSelection(); }}
                  c={c}
                />
              ))}
            </div>

            {filteredSignals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Target size={32} color={c.text3} style={{ opacity: 0.3 }} />
                <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
                  Không có tín hiệu phù hợp
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ Providers tab ═══ */}
        {tab === 'Nhà cung cấp' && (
          <>
            <div className="flex flex-col" style={{ gap: 4 }}>
              {providers.map((provider, idx) => {
                const tierCfg = SIGNAL_PROVIDER_TIERS[provider.tier];
                return (
                  <TrCard key={provider.name} className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: idx < 3 ? `${tierCfg.color}15` : c.surface2,
                          border: `1px solid ${idx < 3 ? tierCfg.color : c.borderSolid}`,
                        }}
                      >
                        <span style={{
                          color: idx < 3 ? tierCfg.color : c.text3,
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.bold,
                        }}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Avatar */}
                      <span style={{ fontSize: 24 }}>{provider.avatar}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                            {provider.name}
                          </span>
                          <span
                            className="px-2 py-1 rounded"
                            style={{ background: tierCfg.bg, color: tierCfg.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}
                          >
                            {tierCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            <Users size={12} className="inline mr-1" /> {fmtCompact(provider.followers)}
                          </span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            {provider.totalSignals} tín hiệu
                          </span>
                        </div>
                      </div>

                      {/* Win rate */}
                      <div className="text-right shrink-0">
                        <p style={{
                          color: provider.winRate >= 65 ? '#10B981' : provider.winRate >= 50 ? '#F59E0B' : '#EF4444',
                          fontSize: FONT_SCALE.base,
                          fontWeight: FONT_WEIGHT.bold,
                        }}>
                          {provider.winRate.toFixed(1)}%
                        </p>
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Win rate</p>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
                      <div className="text-center">
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Đang active</p>
                        <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {provider.activeSignals}
                        </p>
                      </div>
                      <div className="text-center">
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng signals</p>
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                          {provider.totalSignals}
                        </p>
                      </div>
                      <div className="text-center">
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>TB PnL</p>
                        <p style={{
                          color: provider.avgPnl >= 0 ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.bold,
                        }}>
                          {fmtPct(provider.avgPnl)}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ Performance tab ═══ */}
        {tab === 'Hiệu suất' && (
          <>
            {/* Overall performance */}
            <TrCard variant="hero" className="p-4">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium, marginBottom: 8 }}>
                Hiệu suất tổng hợp
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p style={{
                    color: overallWinRate >= 60 ? '#10B981' : '#F59E0B',
                    fontSize: FONT_SCALE.lg,
                    fontWeight: FONT_WEIGHT.bold,
                  }}>
                    {overallWinRate.toFixed(1)}%
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Win rate</p>
                </div>
                <div className="text-center">
                  <p style={{
                    color: avgPnl >= 0 ? '#10B981' : '#EF4444',
                    fontSize: FONT_SCALE.lg,
                    fontWeight: FONT_WEIGHT.bold,
                  }}>
                    {fmtPct(avgPnl)}
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>TB PnL</p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
                    {totalSignals}
                  </p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng signals</p>
                </div>
              </div>
            </TrCard>

            {/* Status breakdown */}
            <TrCard className="p-4">
              <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 12 }}>
                Phân bổ trạng thái
              </p>
              <div className="flex rounded-lg overflow-hidden" style={{ height: 12 }}>
                {Object.entries(SIGNAL_STATUS_CONFIG).map(([key, cfg]) => {
                  const count = TRADING_SIGNALS.filter(s => s.status === key).length;
                  const pct = (count / totalSignals) * 100;
                  if (pct === 0) return null;
                  return (
                    <div key={key} style={{ width: `${pct}%`, background: cfg.color, opacity: 0.8 }} />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries(SIGNAL_STATUS_CONFIG).map(([key, cfg]) => {
                  const count = TRADING_SIGNALS.filter(s => s.status === key).length;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                        {cfg.label}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </TrCard>

            {/* Signal results list */}
            <PageSection label="Kết quả tín hiệu" accentColor="#3B82F6">
              <div className="flex flex-col" style={{ gap: 2 }}>
                {TRADING_SIGNALS
                  .filter(s => s.status !== 'active')
                  .sort((a, b) => b.pnlPct - a.pnlPct)
                  .map(signal => {
                    const statusCfg = SIGNAL_STATUS_CONFIG[signal.status];
                    return (
                      <div key={signal.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: c.surface }}>
                        <div className="shrink-0">
                          {signal.status === 'target_hit'
                            ? <CheckCircle size={16} color="#10B981" />
                            : <XCircle size={16} color="#EF4444" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                              {signal.pair}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                background: signal.direction === 'long' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: signal.direction === 'long' ? '#10B981' : '#EF4444',
                                fontSize: 8,
                                fontWeight: FONT_WEIGHT.semibold,
                              }}
                            >
                              {signal.direction === 'long' ? 'LONG' : 'SHORT'}
                            </span>
                          </div>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                            {signal.providerName} · {signal.timeAgo}
                          </span>
                        </div>
                        <span style={{
                          color: signal.pnlPct >= 0 ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.sm,
                          fontWeight: FONT_WEIGHT.bold,
                        }}>
                          {fmtPct(signal.pnlPct)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function SignalCard({ signal, expanded, onToggle, c }: {
  signal: TradingSignal;
  expanded: boolean;
  onToggle: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const statusCfg = SIGNAL_STATUS_CONFIG[signal.status];
  const tierCfg = SIGNAL_PROVIDER_TIERS[signal.providerTier];
  const isLong = signal.direction === 'long';
  const dirColor = isLong ? '#10B981' : '#EF4444';

  const confidenceColor = signal.confidence === 'high' ? '#10B981' : signal.confidence === 'medium' ? '#F59E0B' : '#6B7280';
  const confidenceLabel = signal.confidence === 'high' ? 'Cao' : signal.confidence === 'medium' ? 'TB' : 'Thấp';

  return (
    <TrCard className="overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        {/* Provider row */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 16 }}>{signal.providerAvatar}</span>
          <span style={{ color: c.text2, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
            {signal.providerName}
          </span>
          <span
            className="px-1 py-0.5 rounded"
            style={{ background: tierCfg.bg, color: tierCfg.color, fontSize: 7, fontWeight: FONT_WEIGHT.bold }}
          >
            {tierCfg.label}
          </span>
          <span style={{ color: c.text3, fontSize: 8 }}>{signal.providerWinRate}% win</span>
          <div className="flex-1" />
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{signal.timeAgo}</span>
        </div>

        {/* Signal header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2 py-0.5 rounded"
            style={{ background: `${dirColor}12`, color: dirColor, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}
          >
            {isLong ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            {signal.pair}
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: `${statusCfg.color}12`, color: statusCfg.color, fontSize: 8, fontWeight: FONT_WEIGHT.semibold }}
          >
            {statusCfg.label}
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: c.surface2, color: c.text3, fontSize: 8 }}
          >
            {signal.category}
          </span>
        </div>

        {/* Key prices */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Entry</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              {fmtPrice(signal.entry)}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hiện tại</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              {fmtPrice(signal.currentPrice)}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Stop Loss</p>
            <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              {fmtPrice(signal.stopLoss)}
            </p>
          </div>
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>PnL</p>
            <p style={{
              color: signal.pnlPct >= 0 ? '#10B981' : '#EF4444',
              fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold,
            }}>
              {fmtPct(signal.pnlPct)}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-3 pt-1" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
          {/* Targets */}
          <div className="mb-3 mt-2">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>
              Mục tiêu
            </p>
            <div className="flex gap-2">
              {signal.targets.map((target, idx) => (
                <div key={idx} className="flex-1 text-center py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>TP{idx + 1}</p>
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                    {fmtPrice(target)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence + expires */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Độ tin cậy:</span>
              <span style={{ color: confidenceColor, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                {confidenceLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{signal.expiresIn}</span>
            </div>
          </div>

          {/* Reasoning */}
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6, marginBottom: 12 }}>
            {signal.reasoning}
          </p>

          {/* Social stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart size={14} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{signal.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Copy size={14} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{signal.copies} copies</span>
            </div>
          </div>
        </div>
      )}
    </TrCard>
  );
}