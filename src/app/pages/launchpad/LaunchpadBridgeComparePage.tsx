/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadBridgeComparePage — Bridge Route Comparison View
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Side-by-side route comparison, visual bars for metrics,
 *            route detail expansion, sort/filter, best-in-class tags,
 *            route path visualization, execute from comparison
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  ArrowRight, ChevronDown, ChevronUp,
  X, Info, Shield, Fuel, Clock, TrendingUp,
  AlertTriangle, CheckCircle, Star, BarChart3,
  Layers, RefreshCw,
} from 'lucide-react';
import {
  generateRouteComparison, BRIDGE_NETWORKS,
  type BridgeRouteOption, type RouteComparisonResult,
} from './launchpadData';
import { RiskDisclosure } from './LaunchpadComponents';

type SortMode = 'recommended' | 'output' | 'fee' | 'speed' | 'security';

const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof Star }[] = [
  { value: 'recommended', label: 'Khuyến nghị', icon: Star },
  { value: 'output', label: 'Output cao nhất', icon: TrendingUp },
  { value: 'fee', label: 'Phí thấp nhất', icon: Fuel },
  { value: 'speed', label: 'Nhanh nhất', icon: Clock },
  { value: 'security', label: 'An toàn nhất', icon: Shield },
];

export function LaunchpadBridgeComparePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const location = useLocation();

  const locState = (location.state as any) || {};
  const sourceChain = locState.sourceChain || 'Ethereum';
  const targetChain = locState.targetChain || 'Polygon';
  const inputToken = locState.inputToken || 'USDT';
  const outputToken = locState.outputToken || 'GCE';
  const inputAmount = locState.inputAmount || 1000;

  const [comparison, setComparison] = useState<RouteComparisonResult>(() =>
    generateRouteComparison(sourceChain, targetChain, inputToken, outputToken, inputAmount)
  );
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const sortedRoutes = useMemo(() => {
    const routes = [...comparison.routes];
    switch (sortMode) {
      case 'output': return routes.sort((a, b) => b.outputAmount - a.outputAmount);
      case 'fee': return routes.sort((a, b) => a.totalFee - b.totalFee);
      case 'speed': return routes.sort((a, b) => a.estimatedSeconds - b.estimatedSeconds);
      case 'security': return routes.sort((a, b) => b.securityScore - a.securityScore);
      default: return routes.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
    }
  }, [comparison.routes, sortMode]);

  // Computed min/max for bar visualization
  const maxOutput = Math.max(...comparison.routes.map(r => r.outputAmount));
  const minOutput = Math.min(...comparison.routes.map(r => r.outputAmount));
  const maxFee = Math.max(...comparison.routes.map(r => r.totalFee));
  const maxSeconds = Math.max(...comparison.routes.map(r => r.estimatedSeconds));

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setComparison(generateRouteComparison(sourceChain, targetChain, inputToken, outputToken, inputAmount));
      setSelectedRoute(null);
      setExpandedRoute(null);
      setLoading(false);
    }, 800);
  }, [sourceChain, targetChain, inputToken, outputToken, inputAmount]);

  const selectedRouteObj = comparison.routes.find(r => r.id === selectedRoute);

  return (
    <PageLayout variant={selectedRoute ? 'flush' : 'default'}>
      {/* Confirm sheet */}
      {showConfirm && selectedRouteObj && (
        <RouteConfirmSheet
          route={selectedRouteObj}
          comparison={comparison}
          onClose={() => setShowConfirm(false)}
          onExecute={() => {
            setShowConfirm(false);
            // Navigate to bridge order tracking
            navigate(`${prefix}/launchpad/bridge-order/batch_${Date.now()}`, {
              state: { scenario: 'success' },
            });
          }}
        />
      )}

      <Header
        title="So sánh routes"
        back
        action={{
          icon: RefreshCw,
          onClick: handleRefresh,
        }}
      />

      <PageContent gap="default">
        {/* Input summary */}
        <TrCard variant="hero" className="p-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Bridge Route Comparison</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {comparison.routes.length} routes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <ChainBadge chain={sourceChain} />
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'monospace', marginTop: 4 }}>
                  {inputAmount.toLocaleString()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{inputToken}</p>
              </div>
              <div className="flex flex-col items-center gap-1 px-3">
                <ArrowRight size={18} color="rgba(255,255,255,0.4)" />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>bridge</span>
              </div>
              <div className="text-center">
                <ChainBadge chain={targetChain} />
                <p style={{ color: '#10B981', fontSize: 15, fontWeight: 800, fontFamily: 'monospace', marginTop: 4 }}>
                  ~{sortedRoutes[0]?.outputAmount.toLocaleString() || '—'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{outputToken}</p>
              </div>
            </div>
          </div>
        </TrCard>

        {/* Quick comparison bars */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} color="#6366F1" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>So sánh nhanh</p>
          </div>

          {/* Output comparison */}
          <div className="mb-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 6 }}>Output ({outputToken})</p>
            {sortedRoutes.map(route => {
              const pct = minOutput === maxOutput ? 100 : ((route.outputAmount - minOutput) / (maxOutput - minOutput)) * 60 + 40;
              const isBest = route.id === comparison.bestOutput;
              return (
                <div key={route.id + '-out'} className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: c.text3, fontSize: 9, width: 24, textAlign: 'right', flexShrink: 0 }}>
                    {route.providerIcon}
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                      style={{ width: `${pct}%`, background: isBest ? '#10B981' : route.providerColor + '60' }}>
                      <span style={{ color: '#fff', fontSize: 8, fontWeight: 600, fontFamily: 'monospace' }}>
                        {route.outputAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {isBest && <Star size={10} color="#10B981" fill="#10B981" />}
                </div>
              );
            })}
          </div>

          {/* Fee comparison */}
          <div className="mb-4">
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 6 }}>Tổng phí (USD)</p>
            {sortedRoutes.map(route => {
              const pct = maxFee === 0 ? 0 : (route.totalFee / maxFee) * 100;
              const isBest = route.id === comparison.bestFee;
              return (
                <div key={route.id + '-fee'} className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: c.text3, fontSize: 9, width: 24, textAlign: 'right', flexShrink: 0 }}>
                    {route.providerIcon}
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max(pct, 15)}%`, background: isBest ? '#10B981' : '#EF444460' }}>
                      <span style={{ color: '#fff', fontSize: 8, fontWeight: 600, fontFamily: 'monospace' }}>
                        {route.totalFeeUSD}
                      </span>
                    </div>
                  </div>
                  {isBest && <Star size={10} color="#10B981" fill="#10B981" />}
                </div>
              );
            })}
          </div>

          {/* Speed comparison */}
          <div>
            <p style={{ color: c.text3, fontSize: 10, marginBottom: 6 }}>Thời gian</p>
            {sortedRoutes.map(route => {
              const pct = maxSeconds === 0 ? 0 : (route.estimatedSeconds / maxSeconds) * 100;
              const isBest = route.id === comparison.bestSpeed;
              return (
                <div key={route.id + '-speed'} className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: c.text3, fontSize: 9, width: 24, textAlign: 'right', flexShrink: 0 }}>
                    {route.providerIcon}
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max(pct, 15)}%`, background: isBest ? '#10B981' : '#3B82F660' }}>
                      <span style={{ color: '#fff', fontSize: 8, fontWeight: 600, fontFamily: 'monospace' }}>
                        {route.estimatedTime}
                      </span>
                    </div>
                  </div>
                  {isBest && <Star size={10} color="#10B981" fill="#10B981" />}
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = sortMode === opt.value;
            return (
              <button key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.1)' : c.surface2,
                  border: isActive ? '1px solid rgba(99,102,241,0.2)' : `1px solid transparent`,
                  color: isActive ? '#6366F1' : c.text3,
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                }}>
                <Icon size={11} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Route cards */}
        <div className="flex flex-col gap-3">
          {sortedRoutes.map((route, i) => (
            <RouteCard
              key={route.id}
              route={route}
              rank={i + 1}
              comparison={comparison}
              selected={selectedRoute === route.id}
              expanded={expandedRoute === route.id}
              onSelect={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
              onToggleExpand={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
              bestOutput={maxOutput}
            />
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} color="#6366F1" className="animate-spin" />
            <span className="ml-3" style={{ color: c.text2, fontSize: 13 }}>Cập nhật routes...</span>
          </div>
        )}

        <RiskDisclosure />
        <div className="h-[120px]" />
      </PageContent>

      {/* Sticky footer when route selected */}
      {selectedRoute && selectedRouteObj && (
        <StickyFooter>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: selectedRouteObj.providerColor + '22', color: selectedRouteObj.providerColor, fontSize: 9, fontWeight: 700 }}>
              {selectedRouteObj.providerIcon}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{selectedRouteObj.provider}</p>
              <p style={{ color: c.text3, fontSize: 10 }}>
                {selectedRouteObj.outputAmount.toLocaleString()} {outputToken} · {selectedRouteObj.totalFeeUSD} fee · {selectedRouteObj.estimatedTime}
              </p>
            </div>
          </div>
          <CTAButton onClick={() => setShowConfirm(true)} className="w-full">
            Chọn route này
          </CTAButton>
        </StickyFooter>
      )}
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   ChainBadge
   ═══════════════════════════════════════════════════════════ */

function ChainBadge({ chain }: { chain: string }) {
  const net = BRIDGE_NETWORKS.find(n => n.name === chain || n.symbol === chain);
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto"
      style={{ background: (net?.color || '#6366F1') + '22', border: `1.5px solid ${(net?.color || '#6366F1')}44` }}>
      <span style={{ color: net?.color || '#6366F1', fontSize: 9, fontWeight: 700 }}>
        {net?.icon || chain.slice(0, 2)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RouteCard — expandable route comparison card
   ═══════════════════════════════════════════════════════════ */

function RouteCard({ route, rank, comparison, selected, expanded, onSelect, onToggleExpand, bestOutput }: {
  route: BridgeRouteOption; rank: number; comparison: RouteComparisonResult;
  selected: boolean; expanded: boolean;
  onSelect: () => void; onToggleExpand: () => void;
  bestOutput: number;
}) {
  const c = useThemeColors();

  const isBestOutput = route.id === comparison.bestOutput;
  const isBestFee = route.id === comparison.bestFee;
  const isBestSpeed = route.id === comparison.bestSpeed;
  const isBestSecurity = route.id === comparison.bestSecurity;
  const outputDiff = bestOutput > 0 ? ((route.outputAmount - bestOutput) / bestOutput * 100).toFixed(2) : '0';

  return (
    <TrCard className="overflow-hidden" style={{
      border: selected ? `1.5px solid ${route.providerColor}50` : route.recommended ? `1.5px solid rgba(99,102,241,0.2)` : `1px solid ${c.border}`,
    }}>
      {/* Header — clickable to select */}
      <button className="w-full p-4 text-left" onClick={onSelect}>
        <div className="flex items-start gap-3">
          {/* Rank + icon */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: route.providerColor + '18', border: `1.5px solid ${route.providerColor}30` }}>
              <span style={{ color: route.providerColor, fontSize: 11, fontWeight: 800 }}>{route.providerIcon}</span>
            </div>
            {rank === 1 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#F59E0B' }}>
                <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>1</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{route.provider}</p>
              {route.recommended && (
                <div className="px-1.5 py-px rounded-md" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <span style={{ color: '#6366F1', fontSize: 8, fontWeight: 700 }}>KHUYEN NGHI</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {isBestOutput && <MetricTag label="Best output" color="#10B981" />}
              {isBestFee && <MetricTag label="Lowest fee" color="#3B82F6" />}
              {isBestSpeed && <MetricTag label="Fastest" color="#F59E0B" />}
              {isBestSecurity && <MetricTag label="Most secure" color="#8B5CF6" />}
              {route.tags.filter(t => !['Best output', 'Lowest fee', 'Fastest'].includes(t)).map(t => (
                <MetricTag key={t} label={t} color={c.text3} />
              ))}
              {route.warnings.map(w => (
                <MetricTag key={w} label={w} color="#EF4444" />
              ))}
            </div>

            {/* Key metrics */}
            <div className="flex items-center gap-4">
              <div>
                <p style={{ color: c.text3, fontSize: 9 }}>Output</p>
                <p style={{ color: isBestOutput ? '#10B981' : c.text1, fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>
                  {route.outputAmount.toLocaleString()}
                </p>
                {!isBestOutput && (
                  <p style={{ color: '#EF4444', fontSize: 9 }}>{outputDiff}%</p>
                )}
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 9 }}>Phi</p>
                <p style={{ color: isBestFee ? '#10B981' : c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                  {route.totalFeeUSD}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 9 }}>Thời gian</p>
                <p style={{ color: isBestSpeed ? '#10B981' : c.text1, fontSize: 13, fontWeight: 700 }}>
                  {route.estimatedTime}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 9 }}>Security</p>
                <div className="flex items-center gap-1">
                  <SecurityDots score={route.securityScore} />
                  <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{route.securityScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Select indicator */}
          <div className="shrink-0 mt-1">
            {selected ? (
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: route.providerColor }}>
                <CheckCircle size={14} color="#fff" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2"
                style={{ borderColor: c.borderSolid }} />
            )}
          </div>
        </div>
      </button>

      {/* Expand toggle */}
      <button className="w-full flex items-center justify-center gap-1 py-2"
        style={{ borderTop: `1px solid ${c.border}` }}
        onClick={onToggleExpand}>
        <span style={{ color: c.text3, fontSize: 10 }}>Chi tiết</span>
        {expanded ? <ChevronUp size={12} color={c.text3} /> : <ChevronDown size={12} color={c.text3} />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.border}` }}>
          {/* Route path visualization */}
          <div className="py-3">
            <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Route path ({route.hops} hops)</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {route.path.map((hop, i) => (
                <React.Fragment key={i}>
                  {i === 0 && (
                    <div className="px-2 py-1 rounded-lg shrink-0" style={{ background: c.surface2 }}>
                      <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{hop.fromToken}</span>
                      <p style={{ color: c.text3, fontSize: 8 }}>{hop.chain}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <ArrowRight size={10} color={c.text3} />
                    <div className="px-1.5 py-0.5 rounded" style={{ background: route.providerColor + '10' }}>
                      <span style={{ color: route.providerColor, fontSize: 8, fontWeight: 600 }}>{hop.dex}</span>
                    </div>
                    <ArrowRight size={10} color={c.text3} />
                  </div>
                  <div className="px-2 py-1 rounded-lg shrink-0" style={{ background: c.surface2 }}>
                    <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{hop.toToken}</span>
                    <p style={{ color: c.text3, fontSize: 8 }}>{hop.chain}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Detailed metrics */}
          <div className="flex flex-col gap-0">
            {[
              { label: 'Output', value: `${route.outputAmount.toLocaleString()} ${comparison.outputToken}`, color: isBestOutput ? '#10B981' : undefined },
              { label: 'Gas cost', value: `$${route.gasCost.toFixed(2)}` },
              { label: 'Bridge fee', value: `$${route.bridgeFee.toFixed(2)}` },
              { label: 'Tổng phí', value: route.totalFeeUSD, color: isBestFee ? '#10B981' : undefined },
              { label: 'Price impact', value: `${route.priceImpact}%`, color: route.priceImpact > 0.3 ? '#F59E0B' : '#10B981' },
              { label: 'Slippage tolerance', value: `${route.slippage}%` },
              { label: 'Thời gian', value: route.estimatedTime, color: isBestSpeed ? '#10B981' : undefined },
              { label: 'Hops', value: `${route.hops}` },
              { label: 'Security score', value: `${route.securityScore}/100`, color: route.securityScore >= 90 ? '#10B981' : route.securityScore >= 80 ? '#F59E0B' : '#EF4444' },
              { label: 'Liquidity depth', value: route.liquidityDepth },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 11 }}>{r.label}</span>
                <span style={{ color: r.color || c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   MetricTag — small colored tag
   ═══════════════════════════════════════════════════════════ */

function MetricTag({ label, color }: { label: string; color: string }) {
  return (
    <div className="px-1.5 py-px rounded-md" style={{ background: color + '12', border: `1px solid ${color}20` }}>
      <span style={{ color, fontSize: 8, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SecurityDots — visual security score indicator
   ═══════════════════════════════════════════════════════════ */

function SecurityDots({ score }: { score: number }) {
  const dots = 5;
  const filled = Math.round((score / 100) * dots);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < filled ? '#10B981' : 'rgba(139,149,179,0.3)' }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RouteConfirmSheet — confirm route selection
   ═══════════════════════════════════════════════════════════ */

function RouteConfirmSheet({ route, comparison, onClose, onExecute }: {
  route: BridgeRouteOption; comparison: RouteComparisonResult;
  onClose: () => void; onExecute: () => void;
}) {
  const c = useThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '85vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Xác nhận route</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          {/* Route summary */}
          <div className="text-center py-3">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: route.providerColor + '18', border: `2px solid ${route.providerColor}30` }}>
              <span style={{ color: route.providerColor, fontSize: 14, fontWeight: 800 }}>{route.providerIcon}</span>
            </div>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{route.provider}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>{route.hops} hops · {route.estimatedTime}</p>
          </div>

          {/* From → To */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="text-center flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Ban</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                {comparison.inputAmount.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>{comparison.inputToken} · {comparison.sourceChain}</p>
            </div>
            <ArrowRight size={16} color={c.text3} />
            <div className="text-center flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Nhận</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                {route.outputAmount.toLocaleString()}
              </p>
              <p style={{ color: c.text3, fontSize: 10 }}>{comparison.outputToken} · {comparison.targetChain}</p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-0">
            {[
              { label: 'Provider', value: route.provider },
              { label: 'Output', value: `${route.outputAmount.toLocaleString()} ${comparison.outputToken}` },
              { label: 'Price impact', value: `${route.priceImpact}%`, color: route.priceImpact > 0.3 ? '#F59E0B' : '#10B981' },
              { label: 'Slippage', value: `${route.slippage}%` },
              { label: 'Gas cost', value: `$${route.gasCost.toFixed(2)}` },
              { label: 'Bridge fee', value: `$${route.bridgeFee.toFixed(2)}` },
              { label: 'Tổng phí', value: route.totalFeeUSD },
              { label: 'Security', value: `${route.securityScore}/100` },
              { label: 'Liquidity', value: route.liquidityDepth },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                <span style={{ color: (r as any).color || c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          {/* Warning for high impact */}
          {route.priceImpact > 0.3 && (
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <AlertTriangle size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Price impact ({route.priceImpact}%) cao hơn bình thường. Kết quả thực tế có thể khác so với dự kiến.
              </p>
            </div>
          )}

          <div className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Đây là chế độ mô phỏng. Giao dịch thực tế có thể có kết quả khác tùy điều kiện thị trường.
            </p>
          </div>

          <CTAButton onClick={onExecute}>
            Xác nhận Bridge qua {route.provider}
          </CTAButton>
        </div>
      </div>
    </div>
  );
}