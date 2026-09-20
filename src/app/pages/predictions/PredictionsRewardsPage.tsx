import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Gift, Star, TrendingUp, TrendingDown, Filter, Heart, HelpCircle,
  ChevronRight, ArrowUpRight, ArrowDownRight, Info, Shield,
  Gamepad2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
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
  PREDICTION_REWARDS,
  PREDICTION_CATEGORIES,
  fmtVolume,
} from '../../data/predictionMockData';
import type { PredictionReward } from '../../data/predictionMockData';
import { PredictionRiskExplainerSheet } from '../../components/predictions/PredictionSheets';
import { φ } from '../../utils/golden';

/* ─── InfoBubble ─── */
function InfoBubble({ text }: { text: string }) {
  const c = useThemeColors();
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        className="flex items-center justify-center" style={{ width: 16, height: 16 }}>
        <HelpCircle size={12} color={c.text3} />
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 bottom-full left-1/2 mb-1.5 px-3 py-2 rounded-lg"
          style={{
            background: c.surface2, border: `1px solid ${c.borderSolid}`,
            fontSize: 11, color: c.text2, lineHeight: 1.4, width: 200,
            transform: 'translateX(-50%)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
          onClick={() => setShow(false)}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */
function RewardsSkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 50%, ${c.surface2} 75%)`,
    backgroundSize: '400px 100%', animation: 'stateShimmer 1.5s ease-in-out infinite', borderRadius: 8,
  };
  return (
    <div className="flex flex-col gap-3">
      <div style={{ ...shimmer, height: 80, borderRadius: 16 }} />
      <div style={{ ...shimmer, height: 36 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: 72, borderRadius: 12 }} />
      ))}
    </div>
  );
}

const CATEGORY_FILTERS = ['All', ...PREDICTION_CATEGORIES] as const;

export function PredictionsRewardsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [category, setCategory] = useState<string>('All');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['rw-1', 'rw-4']));
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);

  const toggleFav = (id: string) => {
    hapticSelection();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = PREDICTION_REWARDS;
    if (category !== 'All') list = list.filter(r => r.category === category);
    if (showFavOnly) list = list.filter(r => favorites.has(r.id));
    return list;
  }, [category, showFavOnly, favorites]);

  const totalDailyRewards = PREDICTION_REWARDS.reduce((s, r) => s + r.dailyReward, 0);

  return (
    <PageLayout>
      <Header title="Daily Rewards" subtitle="Phần thưởng · Prediction" back />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount} className="flex-1 pb-8">
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải phần thưởng"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : isLoading ? <PageContent><RewardsSkeleton /></PageContent> : (
          <PageContent>
            {/* Hero card */}
            <TrCard variant="hero" className="p-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 65%)' }} />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Gift size={22} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Daily Rewards</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    Earn rewards by placing competitive limit orders
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 relative z-10">
                <InfoBubble text="Limit order rewards incentivize you to provide liquidity. Place limit orders within the max spread to earn daily USDT rewards automatically." />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  Total daily pool:
                </span>
                <span style={{ color: c.warn, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                  ${totalDailyRewards}
                </span>
              </div>
            </TrCard>

            {/* Microcopy */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                <strong style={{ color: c.text1 }}>How it works:</strong> Place a <strong>limit order</strong> (not market order) within the <strong>Max Spread</strong> and hold at least <strong>Min Shares</strong>. Rewards are distributed daily in USDT at 00:00 UTC.
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 -mx-5 px-5 overflow-x-auto scrollbar-none pb-1">
              {CATEGORY_FILTERS.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); hapticSelection(); }}
                  className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
                  style={{
                    background: category === cat ? c.chipActiveBg : c.surface2,
                    color: category === cat ? c.chipActiveText : c.text3,
                    fontSize: 11, fontWeight: category === cat ? 600 : 400,
                    border: `1px solid ${category === cat ? c.chipActiveBorder : 'transparent'}`,
                  }}>
                  {cat}
                </button>
              ))}
              <button onClick={() => { setShowFavOnly(!showFavOnly); hapticSelection(); }}
                className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1"
                style={{
                  background: showFavOnly ? 'rgba(239,68,68,0.12)' : c.surface2,
                  color: showFavOnly ? c.sell : c.text3,
                  fontSize: 11, fontWeight: showFavOnly ? 600 : 400,
                  border: `1px solid ${showFavOnly ? 'rgba(239,68,68,0.25)' : 'transparent'}`,
                }}>
                <Heart size={10} fill={showFavOnly ? c.sell : 'transparent'} color={showFavOnly ? c.sell : c.text3} />
                Favs
              </button>
            </div>

            {/* Table header */}
            <div className="flex items-center px-3 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
              <span className="flex-1 min-w-0" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>MARKET</span>
              <span className="w-14 text-center" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SPREAD</span>
              <span className="w-14 text-center" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>MIN</span>
              <span className="w-14 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>REWARD</span>
              <span className="w-5" />
            </div>

            {/* Rewards list */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Gift size={36} color={c.text3} style={{ opacity: 0.4 }} />
                <p style={{ color: c.text2, fontSize: 13, fontWeight: 600, marginTop: 12 }}>No rewards found</p>
                <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((reward, idx) => {
                  const event = PREDICTION_EVENTS.find(e => e.id === reward.eventId);
                  if (!event) return null;
                  return (
                    <motion.button
                      key={reward.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { navigate(`${prefix}/markets/predictions/event/${event.id}`); hapticSelection(); }}
                      className="flex items-center px-3 py-3 text-left"
                      style={{ borderBottom: `1px solid ${c.border}` }}
                    >
                      {/* Fav */}
                      <button onClick={(e) => { e.stopPropagation(); toggleFav(reward.id); }}
                        className="mr-2 shrink-0">
                        <Star size={12}
                          color={favorites.has(reward.id) ? c.warn : c.text3}
                          fill={favorites.has(reward.id) ? c.warn : 'transparent'} />
                      </button>

                      {/* Market info */}
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 9, fontWeight: 600 }}>
                            {reward.category}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {reward.priceChange24h >= 0
                              ? <ArrowUpRight size={10} color={c.buy} />
                              : <ArrowDownRight size={10} color={c.sell} />}
                            <span style={{
                              color: reward.priceChange24h >= 0 ? c.buy : c.sell,
                              fontSize: 10, fontWeight: 600,
                            }}>
                              {reward.priceChange24h >= 0 ? '+' : ''}{reward.priceChange24h}%
                            </span>
                          </div>
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            {reward.earningsPct}% APY
                          </span>
                        </div>
                      </div>

                      {/* Spread */}
                      <span className="w-14 text-center" style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
                        {(reward.maxSpread * 100).toFixed(0)}%
                      </span>

                      {/* Min shares */}
                      <span className="w-14 text-center" style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>
                        {reward.minShares}
                      </span>

                      {/* Reward */}
                      <span className="w-14 text-right" style={{ color: c.buy, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                        ${reward.dailyReward}
                      </span>

                      <ChevronRight size={12} color={c.text3} className="ml-1 shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Hiểu rủi ro link */}
            <button
              onClick={() => { setShowRiskExplainer(true); hapticSelection(); }}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl active:opacity-70"
              style={{ color: c.warn, fontSize: 12, fontWeight: 600, minHeight: 36 }}
            >
              <Shield size={12} />
              Reward không phải lợi nhuận đảm bảo — tìm hiểu thêm
              <ChevronRight size={10} />
            </button>

            {/* ─── 09C: Arena Bridge — "Room Arena cùng chủ đề" ─── */}
            <div>
              <SectionHeader title="Room Arena cùng chủ đề" accent accentColor="#F59E0B" mb={8} />
              <TrCard hover as="button"
                onClick={() => { navigate(`${prefix}/arena`); hapticSelection(); }}
                className="w-full p-3.5 text-left"
                accentBorder="rgba(245,158,11,0.15)">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star size={9} color={c.warn} />
                  <span style={{ color: c.warn, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
                    Arena Points only
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,158,11,0.10)' }}>
                    <Gamepad2 size={16} color="#F59E0B" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
                      BTC $70K? — Tuần 9
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color: c.text3, fontSize: φ.xs }}>38/50 slots</span>
                      <span style={{ color: c.warn, fontSize: φ.xs, fontWeight: 600 }}>100 pts</span>
                      <span className="px-1 py-0.5 rounded" style={{ background: c.warnAlpha10, color: c.warn, fontSize: 8, fontWeight: 600 }}>
                        Closest Guess
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={12} color={c.text3} />
                </div>
              </TrCard>
              <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.4, marginTop: 4 }}>
                Room social points-only, không liên quan wallet hay vị thế Prediction.
              </p>
            </div>

          </PageContent>
        )}
      </PullToRefresh>

      {/* Risk Explainer Sheet */}
      <PredictionRiskExplainerSheet
        open={showRiskExplainer}
        onClose={() => setShowRiskExplainer(false)}
      />
    </PageLayout>
  );
}