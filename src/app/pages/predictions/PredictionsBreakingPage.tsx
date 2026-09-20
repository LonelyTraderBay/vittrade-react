import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Zap, TrendingUp, TrendingDown, Mail, ChevronRight,
  BarChart3, Users, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
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
import { CTAButton } from '../../components/ui/CTAButton';
import { SkeletonRow } from '../../components/states/SkeletonBlock';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import {
  PREDICTION_EVENTS,
  fmtVolume,
  timeRemaining,
} from '../../data/predictionMockData';
import type { PredictionEvent } from '../../data/predictionMockData';
import { φ, φRadius, φIcon } from '../../utils/golden';
import { TOAST } from '../../data/toastMessages';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Politics', label: 'Politics' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Live Crypto', label: 'Crypto' },
  { id: 'Finance', label: 'Finance' },
  { id: 'Tech', label: 'Tech' },
  { id: 'AI', label: 'AI' },
  { id: 'Culture', label: 'Culture' },
] as const;

/* ─── Mover Item ─── */
function MoverItem({ event, rank }: { event: PredictionEvent; rank: number }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const isUp = event.change24h > 0;
  const topOutcome = event.outcomes[0];
  const remaining = timeRemaining(event.endDate);

  const rankColors = [c.warn, '#94A3B8', '#CD7F32'];

  return (
    <TrCard hover as="button"
      onClick={() => { hapticSelection(); navigate(`${prefix}/markets/predictions/event/${event.id}`); }}
      className="p-4 w-full text-left">
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: rank <= 3
              ? `${rankColors[rank - 1]}18`
              : c.surface2,
          }}
        >
          <span
            style={{
              color: rank <= 3 ? rankColors[rank - 1] : c.text3,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {rank}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
            {event.title}
          </p>

          {/* Probability + change */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.text2, fontSize: 11 }}>Yes:</span>
              <span style={{
                color: topOutcome.chance >= 50 ? c.buy : c.sell,
                fontSize: 13,
                fontWeight: 700,
              }}>
                {topOutcome.chance}%
              </span>
            </div>

            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md"
              style={{
                background: isUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              }}
            >
              {isUp ? (
                <ArrowUpRight size={12} color={c.buy} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={12} color={c.sell} strokeWidth={2.5} />
              )}
              <span style={{
                color: isUp ? c.buy : c.sell,
                fontSize: 12,
                fontWeight: 700,
              }}>
                {isUp ? '+' : ''}{event.change24h}%
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3">
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ background: c.primaryAlpha12, color: c.primary, fontSize: 9, fontWeight: 600 }}
            >
              {event.category}
            </span>
            <div className="flex items-center gap-1">
              <BarChart3 size={10} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 10 }}>{fmtVolume(event.volume24h)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 10 }}>{remaining}</span>
            </div>
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ─── Email CTA Card ─── */
function EmailCTA() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email.includes('@')) {
      actionToast.error(TOAST.PREDICTIONS.EMAIL_INVALID);
      return;
    }
    hapticSelection();
    setSubscribed(true);
    actionToast.success(TOAST.PREDICTIONS.EMAIL_SUBSCRIBED);
  };

  if (subscribed) {
    return (
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.buyAlpha10 }}
          >
            <Mail size={18} color={c.buy} />
          </div>
          <div className="flex-1">
            <p style={{ color: c.buy, fontSize: 13, fontWeight: 700 }}>Subscribed!</p>
            <p style={{ color: c.text3, fontSize: 11 }}>You'll receive daily prediction updates</p>
          </div>
        </div>
      </TrCard>
    );
  }

  return (
    <TrCard className="p-4" accentBorder="rgba(139,92,246,0.2)">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)' }}
        >
          <Mail size={18} color="#8B5CF6" />
        </div>
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Get daily updates</p>
          <p style={{ color: c.text3, fontSize: 11 }}>Top movers & trending markets in your inbox</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl"
          style={{
            background: c.surface2,
            border: `1px solid ${c.borderSolid}`,
            color: c.text1,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubscribe}
          className="px-4 py-2.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
          }}
        >
          Subscribe
        </button>
      </div>
    </TrCard>
  );
}

/* ─── Main Page ─── */
export function PredictionsBreakingPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const [activeTab, setActiveTab] = useState('all');
  const [hasError, setHasError] = useState(false);
  const [isOffline] = useState(false);

  const movers = useMemo(() => {
    let events = PREDICTION_EVENTS.filter(e => e.status === 'active' && e.change24h !== 0);
    if (activeTab !== 'all') {
      events = events.filter(e => e.category === activeTab);
    }
    return [...events].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  }, [activeTab]);

  const upCount = movers.filter(m => m.change24h > 0).length;
  const downCount = movers.filter(m => m.change24h < 0).length;

  return (
    <PageLayout>
      <Header title="Breaking Movers" subtitle="Biến động · Prediction" back />

      <PullToRefresh
        onRefresh={refresh}
        lastRefreshedLabel={lastRefreshedLabel}
        refreshCount={refreshCount}
        className="flex-1 pb-8"
      >
        {/* ─── Offline Banner ─── */}
        {isOffline && (
          <div className="pt-3">
            <OfflineBanner showStaleHint />
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError ? (
          <ErrorState
            title="Không thể tải dữ liệu"
            message="Kiểm tra kết nối mạng và thử lại."
            onAction={() => { setHasError(false); refresh(); }}
          />
        ) : (
        <PageContent>
        {/* Summary bar */}
        <TrCard className="p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} color={c.warn} />
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>24h Movement</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingUp size={13} color={c.buy} />
                <span style={{ color: c.buy, fontSize: 12, fontWeight: 600 }}>{upCount} up</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown size={13} color={c.sell} />
                <span style={{ color: c.sell, fontSize: 12, fontWeight: 600 }}>{downCount} down</span>
              </div>
            </div>
          </div>
        </TrCard>

        {/* Category tabs */}
        <div className="flex gap-2 -mx-5 px-5 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); hapticSelection(); }}
                className="shrink-0 px-3.5 py-2 rounded-xl"
                style={{
                  background: active ? c.chipActiveBg : c.chipBg,
                  border: `1px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                  color: active ? c.chipActiveText : c.chipText,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Movers list */}
        {isLoading ? (
          <div>
            <TrCard overflow>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </TrCard>
          </div>
        ) : movers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Zap size={40} color={c.text3} style={{ opacity: 0.4 }} />
            <p style={{ color: c.text2, fontSize: 14, fontWeight: 600, marginTop: 12 }}>
              No movers in this category
            </p>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              Try selecting a different category
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {movers.map((event, i) => (
              <MoverItem key={event.id} event={event} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Email subscription CTA */}
        <EmailCTA />

        </PageContent>
        )}
      </PullToRefresh>
    </PageLayout>
  );
}