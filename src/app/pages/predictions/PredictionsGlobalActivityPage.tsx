import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, Filter, ArrowUpRight, ArrowDownRight, ChevronRight,
  HelpCircle, Zap, Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useLoadingState } from '../../hooks/useLoadingState';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  PREDICTION_EVENTS,
  generateGlobalActivity,
  fmtVolume,
} from '../../data/predictionMockData';

/* ─── Skeleton ─── */
function ActivitySkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 50%, ${c.surface2} 75%)`,
    backgroundSize: '400px 100%', animation: 'stateShimmer 1.5s ease-in-out infinite', borderRadius: 8,
  };
  return (
    <div className="flex flex-col gap-3">
      <div style={{ ...shimmer, height: 44, borderRadius: 12 }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: 60, borderRadius: 10 }} />
      ))}
    </div>
  );
}

const MIN_AMOUNTS = [
  { label: 'All', value: 0 },
  { label: '$50+', value: 50 },
  { label: '$100+', value: 100 },
  { label: '$500+', value: 500 },
  { label: '$1K+', value: 1000 },
] as const;

export function PredictionsGlobalActivityPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [minAmount, setMinAmount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const allActivity = useMemo(() => generateGlobalActivity(), []);

  const filtered = useMemo(() => {
    if (minAmount === 0) return allActivity;
    return allActivity.filter(a => a.amount >= minAmount);
  }, [allActivity, minAmount]);

  const totalVolume = allActivity.reduce((s, a) => s + a.amount, 0);
  const buyCount = allActivity.filter(a => a.action === 'bought').length;
  const sellCount = allActivity.filter(a => a.action === 'sold').length;

  return (
    <PageLayout>
      <Header title="Global Activity" subtitle="Hoạt động · Prediction" back />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount} className="flex-1 pb-8">
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {hasError ? (
          <ErrorState
            title="Không thể tải hoạt động"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : isLoading ? (
          <PageContent><ActivitySkeleton /></PageContent>
        ) : (
          <PageContent>
            {/* Live indicator + stats */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <Radio size={14} color="#10B981" />
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-full"
                    style={{ background: c.buy, animation: 'pulse 2s infinite' }} />
                </div>
                <span style={{ color: c.buy, fontSize: 12, fontWeight: 700 }}>Live Feed</span>
                <span style={{ color: c.text3, fontSize: 10 }}>Real-time market activity</span>
              </div>

              <div className="flex gap-3">
                <TrCard variant="inner" className="flex-1 p-2.5 text-center">
                  <p style={{ color: c.text3, fontSize: 10 }}>Volume (1h)</p>
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtVolume(totalVolume)}
                  </p>
                </TrCard>
                <TrCard variant="inner" className="flex-1 p-2.5 text-center">
                  <p style={{ color: c.text3, fontSize: 10 }}>Buys</p>
                  <p style={{ color: c.buy, fontSize: 14, fontWeight: 700 }}>{buyCount}</p>
                </TrCard>
                <TrCard variant="inner" className="flex-1 p-2.5 text-center">
                  <p style={{ color: c.text3, fontSize: 10 }}>Sells</p>
                  <p style={{ color: c.sell, fontSize: 14, fontWeight: 700 }}>{sellCount}</p>
                </TrCard>
              </div>
            </TrCard>

            {/* Min amount filter */}
            <div className="flex items-center gap-2">
              <Filter size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 11 }}>Min amount:</span>
              <div className="flex gap-1.5">
                {MIN_AMOUNTS.map(ma => (
                  <button key={ma.label} onClick={() => { setMinAmount(ma.value); hapticSelection(); }}
                    className="px-2.5 py-1 rounded-lg"
                    style={{
                      background: minAmount === ma.value ? c.chipActiveBg : c.surface2,
                      color: minAmount === ma.value ? c.chipActiveText : c.text3,
                      fontSize: 11, fontWeight: minAmount === ma.value ? 600 : 400,
                      border: `1px solid ${minAmount === ma.value ? c.chipActiveBorder : 'transparent'}`,
                    }}>
                    {ma.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity size={36} color={c.text3} style={{ opacity: 0.4 }} />
                  <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginTop: 12 }}>No activity found</p>
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Lower the minimum amount filter</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((act, idx) => {
                    const event = PREDICTION_EVENTS.find(e => e.id === act.eventId);
                    const isBuy = act.action === 'bought';
                    return (
                      <motion.button
                        key={act.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.025, duration: 0.2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (event) { navigate(`${prefix}/markets/predictions/event/${event.id}`); hapticSelection(); }
                        }}
                        className="flex items-center gap-3 py-3 text-left"
                        style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${c.border}` : 'none' }}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: c.surface2, fontSize: 16 }}>
                          {act.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{act.user}</span>
                            <span style={{
                              color: isBuy ? c.buy : c.sell,
                              fontSize: 11, fontWeight: 600,
                            }}>
                              {act.action}
                            </span>
                            <span className="px-1.5 py-0.5 rounded" style={{
                              background: act.outcome === 'Yes' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: act.outcome === 'Yes' ? c.buy : c.sell,
                              fontSize: 9, fontWeight: 600,
                            }}>
                              {act.outcome}
                            </span>
                          </div>
                          {event && (
                            <p className="text-truncate" style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                              {event.title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                              {act.shares.toLocaleString()} shares @ ${act.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Amount + time */}
                        <div className="text-right shrink-0">
                          <p style={{
                            color: isBuy ? c.buy : c.sell,
                            fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                          }}>
                            ${act.amount >= 1000 ? `${(act.amount / 1000).toFixed(1)}K` : act.amount.toFixed(0)}
                          </p>
                          <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{act.timestamp}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

          </PageContent>
        )}
      </PullToRefresh>
    </PageLayout>
  );
}