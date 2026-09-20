import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Crown, TrendingUp, BarChart3, Trophy, Medal,
  HelpCircle, ArrowUpRight, Zap,
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
import { LEADERBOARD_DATA, PREDICTION_EVENTS, fmtVolume } from '../../data/predictionMockData';
import type { LeaderboardTrader } from '../../data/predictionMockData';

const TIME_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all', label: 'All Time' },
] as const;

const METRIC_TABS = [
  { id: 'pnl', label: 'Profit/Loss', icon: TrendingUp },
  { id: 'volume', label: 'Volume', icon: BarChart3 },
] as const;

type TimeFilter = typeof TIME_FILTERS[number]['id'];
type MetricTab = typeof METRIC_TABS[number]['id'];

/* ─── InfoBubble ─── */
function InfoBubble({ text }: { text: string }) {
  const c = useThemeColors();
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShow(!show); } }}
        style={{ width: 16, height: 16, cursor: 'pointer' }} className="inline-flex items-center justify-center">
        <HelpCircle size={12} color={c.text3} />
      </span>
      {show && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 bottom-full left-1/2 mb-1.5 px-3 py-2 rounded-lg"
          style={{
            background: c.surface2, border: `1px solid ${c.borderSolid}`,
            fontSize: 11, color: c.text2, lineHeight: 1.4, width: 200,
            transform: 'translateX(-50%)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }} onClick={() => setShow(false)}>
          {text}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */
function LeaderboardSkeleton() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 50%, ${c.surface2} 75%)`,
    backgroundSize: '400px 100%', animation: 'stateShimmer 1.5s ease-in-out infinite', borderRadius: 8,
  };
  return (
    <div className="flex flex-col gap-3">
      <div style={{ ...shimmer, height: 100, borderRadius: 16 }} />
      <div style={{ ...shimmer, height: 36 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: 64, borderRadius: 12 }} />
      ))}
    </div>
  );
}

/* ─── Podium Top 3 ─── */
function Podium({ traders }: { traders: LeaderboardTrader[] }) {
  const c = useThemeColors();
  const top3 = traders.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const heights = [90, 110, 75];
  const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];
  const labels = ['2nd', '1st', '3rd'];

  return (
    <div className="flex items-end justify-center gap-3 pt-4 pb-2">
      {podiumOrder.map((t, idx) => {
        if (!t) return null;
        return (
          <motion.div key={t.rank}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.12, duration: 0.4 }}
            className="flex flex-col items-center" style={{ width: 100 }}>
            <span style={{ fontSize: 22 }}>{t.avatar}</span>
            <p className="text-truncate w-full text-center" style={{ color: c.text1, fontSize: 11, fontWeight: 700, marginTop: 4 }}>
              {t.user}
            </p>
            <p style={{ color: c.buy, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
              +${t.pnl >= 1000 ? `${(t.pnl / 1000).toFixed(1)}K` : t.pnl}
            </p>
            <div className="w-full rounded-t-xl flex items-end justify-center pb-2 mt-2"
              style={{
                height: heights[idx],
                background: `linear-gradient(180deg, ${colors[idx]}20, ${colors[idx]}08)`,
                border: `1px solid ${colors[idx]}30`,
                borderBottom: 'none',
              }}>
              <div className="flex items-center gap-1">
                {idx === 1 && <Crown size={14} color="#FFD700" fill="#FFD700" />}
                <span style={{ color: colors[idx], fontSize: 13, fontWeight: 700 }}>{labels[idx]}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function PredictionsLeaderboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  const [metric, setMetric] = useState<MetricTab>('pnl');
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const traders = useMemo(() => {
    const data = LEADERBOARD_DATA[timeFilter] ?? LEADERBOARD_DATA.today;
    if (metric === 'volume') {
      return [...data].sort((a, b) => b.volume - a.volume).map((t, i) => ({ ...t, rank: i + 1 }));
    }
    return data;
  }, [timeFilter, metric]);

  const biggestWins = useMemo(() =>
    traders.filter(t => t.biggestWin && t.biggestWinMarket).slice(0, 4),
    [traders]
  );

  return (
    <PageLayout>
      <Header title="Leaderboard" subtitle="Bảng xếp hạng · Prediction" back />

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
            title="Không thể tải bảng xếp hạng"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : isLoading ? <PageContent><LeaderboardSkeleton /></PageContent> : (
          <PageContent>
            {/* Time filter */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: c.surface2 }}>
              {TIME_FILTERS.map(f => (
                <button key={f.id} onClick={() => { setTimeFilter(f.id); hapticSelection(); }}
                  className="flex-1 py-2 rounded-lg"
                  style={{
                    background: timeFilter === f.id ? c.surface : 'transparent',
                    color: timeFilter === f.id ? c.text1 : c.text3,
                    fontSize: 12, fontWeight: timeFilter === f.id ? 700 : 400,
                    boxShadow: timeFilter === f.id ? c.cardShadow : 'none',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Metric tabs */}
            <div className="flex gap-2">
              {METRIC_TABS.map(m => (
                <button key={m.id} onClick={() => { setMetric(m.id); hapticSelection(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{
                    background: metric === m.id ? c.chipActiveBg : c.surface2,
                    color: metric === m.id ? c.chipActiveText : c.text3,
                    fontSize: 12, fontWeight: metric === m.id ? 600 : 400,
                    border: `1px solid ${metric === m.id ? c.chipActiveBorder : 'transparent'}`,
                  }}>
                  <m.icon size={12} />
                  {m.label}
                  {m.id === 'pnl' && (
                    <InfoBubble text="P/L (Profit/Loss) shows how much a trader has gained or lost. A positive P/L means profit, negative means loss." />
                  )}
                </button>
              ))}
            </div>

            {/* Podium */}
            <TrCard className="overflow-hidden">
              <Podium traders={traders} />
            </TrCard>

            {/* Full list */}
            <div>
              <SectionHeader title="Rankings" accent accentColor="#F59E0B" />
              <TrCard className="overflow-hidden">
                {/* Header */}
                <div className="flex items-center px-4 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
                  <span className="w-8" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>#</span>
                  <span className="flex-1" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>TRADER</span>
                  <span className="w-20 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
                    {metric === 'pnl' ? 'P/L' : 'VOLUME'}
                  </span>
                  <span className="w-14 text-right" style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>WIN %</span>
                </div>

                {traders.map((t, idx) => (
                  <motion.div key={`${t.user}-${idx}`}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="flex items-center px-4 py-3"
                    style={{ borderBottom: idx < traders.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                    <span className="w-8" style={{
                      color: t.rank <= 3 ? c.warn : c.text3,
                      fontSize: 12, fontWeight: t.rank <= 3 ? 700 : 400,
                    }}>
                      {t.rank <= 3 ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: t.rank === 1 ? 'rgba(255,215,0,0.15)' : t.rank === 2 ? 'rgba(192,192,192,0.15)' : 'rgba(205,127,50,0.15)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.rank === 1 ? '#FFD700' : t.rank === 2 ? '#C0C0C0' : '#CD7F32' }}>
                            {t.rank}
                          </span>
                        </div>
                      ) : t.rank}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span style={{ fontSize: 16 }}>{t.avatar}</span>
                      <div className="min-w-0">
                        <p className="text-truncate" style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{t.user}</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>{t.trades} trades</p>
                      </div>
                    </div>
                    <span className="w-20 text-right" style={{
                      color: metric === 'pnl' ? c.buy : c.text1,
                      fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                    }}>
                      {metric === 'pnl'
                        ? `+$${t.pnl >= 1000 ? `${(t.pnl / 1000).toFixed(1)}K` : t.pnl}`
                        : fmtVolume(t.volume)}
                    </span>
                    <span className="w-14 text-right" style={{ color: t.winRate >= 70 ? c.buy : t.winRate >= 50 ? c.warn : c.sell, fontSize: 11, fontWeight: 600 }}>
                      {t.winRate}%
                    </span>
                  </motion.div>
                ))}
              </TrCard>
            </div>

            {/* Biggest Wins */}
            {biggestWins.length > 0 && (
              <div>
                <SectionHeader title="Biggest Wins" accent accentColor="#10B981"
                  subtitle="Top single-trade profits this period" />
                <div className="flex flex-col gap-2">
                  {biggestWins.map((t, idx) => {
                    const matchedEvent = t.biggestWinMarket
                      ? PREDICTION_EVENTS.find(e => e.title.toLowerCase().includes(t.biggestWinMarket!.toLowerCase().split(' ').slice(0, 3).join(' ')))
                      : null;
                    return (
                    <motion.div key={`bw-${t.user}-${idx}`}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}>
                      <TrCard variant="inner" hover as="button"
                        onClick={() => {
                          hapticSelection();
                          if (matchedEvent) {
                            navigate(`${prefix}/markets/predictions/event/${matchedEvent.id}`);
                          }
                        }}
                        className="p-3 flex items-center gap-3 w-full text-left">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <Trophy size={16} color="#10B981" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 14 }}>{t.avatar}</span>
                            <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>{t.user}</span>
                          </div>
                          <p className="text-truncate" style={{ color: matchedEvent ? c.primary : c.text3, fontSize: 10, marginTop: 2 }}>
                            {t.biggestWinMarket}
                            {matchedEvent && <ArrowUpRight size={10} className="inline ml-0.5" style={{ verticalAlign: 'middle' }} />}
                          </p>
                        </div>
                        <span style={{ color: c.buy, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                          +${t.biggestWin && t.biggestWin >= 1000 ? `${(t.biggestWin / 1000).toFixed(1)}K` : t.biggestWin}
                        </span>
                      </TrCard>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

          </PageContent>
        )}
      </PullToRefresh>
    </PageLayout>
  );
}