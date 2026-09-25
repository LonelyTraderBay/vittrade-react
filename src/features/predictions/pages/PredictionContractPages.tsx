import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BarChart3, Clock, Search, Users } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import {
  usePlacePredictionOrderMutation,
  usePredictionActivityQuery,
  usePredictionEventQuery,
  usePredictionEventsQuery,
  usePredictionLeaderboardQuery,
  usePredictionPositionsQuery,
  usePredictionReceiptQuery,
  usePredictionRewardsQuery,
} from '../model/prediction-queries';
import type { PredictionEvent } from '../model/prediction-types';

function LoadingPage({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu từ Prediction API…</p>
      </PageContent>
    </PageLayout>
  );
}

function PredictionCard({ event }: { event: PredictionEvent }) {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const topOutcome = event.outcomes[0];
  return (
    <button
      type="button"
      className="text-left"
      onClick={() => navigate(`${prefix}/predictions/event/${event.id}`)}
    >
      <TrCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span style={{ color: colors.primary, fontSize: 11 }}>{event.category}</span>
            <h2 className="mt-1" style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
              {event.title}
            </h2>
          </div>
          <span
            style={{
              color: event.change24h >= 0 ? colors.buy : colors.sell,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {event.change24h >= 0 ? '+' : ''}
            {event.change24h}%
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ background: colors.surface2 }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${topOutcome?.chance ?? 0}%`,
              background: topOutcome?.color ?? colors.primary,
            }}
          />
        </div>
        <div
          className="mt-2 flex items-center justify-between"
          style={{ color: colors.text3, fontSize: 11 }}
        >
          <span>{event.outcomes.map((item) => `${item.label} ${item.chance}%`).join(' · ')}</span>
          <span>{event.participants.toLocaleString()} traders</span>
        </div>
      </TrCard>
    </button>
  );
}

export function PredictionsContractPage({
  mode = 'all',
}: {
  mode?: 'all' | 'search' | 'breaking';
}) {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const query = usePredictionEventsQuery({
    search: mode === 'search' ? search : undefined,
    status: 'active',
  });
  const items = useMemo(() => {
    const events = query.data?.items ?? [];
    if (mode === 'breaking')
      return events.filter((event) => event.isTrending).sort((a, b) => b.volume24h - a.volume24h);
    return events;
  }, [mode, query.data?.items]);
  if (query.isPending)
    return <LoadingPage title={mode === 'breaking' ? 'Breaking markets' : 'Prediction markets'} />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header
        title={mode === 'breaking' ? 'Breaking markets' : 'Prediction markets'}
        subtitle="Contract-first prediction data"
        back
      />
      <PageContent gap="default">
        {mode === 'search' && (
          <label
            className="flex items-center gap-2 rounded-xl px-3"
            style={{ background: colors.surface2 }}
          >
            <Search size={14} color={colors.text3} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm event…"
              className="flex-1 bg-transparent py-3 outline-none"
              style={{ color: colors.text1 }}
            />
          </label>
        )}
        {items.map((event) => (
          <PredictionCard key={event.id} event={event} />
        ))}
        {!items.length && (
          <p style={{ color: colors.text2 }}>Không có prediction market phù hợp.</p>
        )}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionEventContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { eventId = '' } = useParams();
  const query = usePredictionEventQuery(eventId);
  const order = usePlacePredictionOrderMutation();
  const { hasPermission } = useAuth();
  const canTrade = hasPermission('predictions:write') || hasPermission('predictions:trade');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [shares, setShares] = useState('100');
  if (query.isPending) return <LoadingPage title="Prediction event" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const event = query.data;
  const outcome = selectedOutcome || event.outcomes[0]?.label || '';
  const submit = async () => {
    if (!canTrade) return;
    const receipt = await order.mutateAsync({
      request: {
        eventId: event.id,
        outcome,
        side: 'buy',
        orderType: 'market',
        shares: Number(shares),
      },
      idempotencyKey: `prediction-order-${crypto.randomUUID()}`,
    });
    navigate(`${prefix}/predictions/receipt/${receipt.id}`);
  };
  return (
    <PageLayout>
      <Header title="Prediction event" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <p style={{ color: colors.primary, fontSize: 11 }}>{event.category}</p>
          <h1 className="mt-1" style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>
            {event.title}
          </h1>
          <div className="mt-3 flex gap-2" style={{ color: colors.text3, fontSize: 11 }}>
            <span>
              <BarChart3 size={12} className="mr-1 inline" />
              {event.volume24h.toLocaleString()}
            </span>
            <span>
              <Users size={12} className="mr-1 inline" />
              {event.participants.toLocaleString()}
            </span>
            <span>
              <Clock size={12} className="mr-1 inline" />
              {new Date(event.endDate).toLocaleDateString()}
            </span>
          </div>
        </TrCard>
        <div className="grid gap-2 sm:grid-cols-2">
          {event.outcomes.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedOutcome(item.label)}
              className="rounded-xl p-3 text-left"
              style={{
                background: colors.surface2,
                border: `1px solid ${outcome === item.label ? item.color : colors.borderSolid}`,
              }}
            >
              <span style={{ color: colors.text2, fontSize: 12 }}>{item.label}</span>
              <strong className="mt-1 block" style={{ color: item.color, fontSize: 20 }}>
                {item.chance}%
              </strong>
            </button>
          ))}
        </div>
        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Đặt vị thế</h2>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(event) => setShares(event.target.value)}
              className="min-w-0 flex-1 rounded-xl px-3 py-3"
              style={{ background: colors.surface2, color: colors.text1 }}
            />
            <button
              type="button"
              disabled={!canTrade || order.isPending || Number(shares) <= 0}
              onClick={() => void submit()}
              className="rounded-xl px-4 py-3 font-semibold"
              style={{
                background: canTrade ? colors.primary : colors.surface2,
                color: canTrade ? '#fff' : colors.text3,
              }}
            >
              {order.isPending ? 'Đang gửi…' : `Mua ${outcome}`}
            </button>
          </div>
          {order.isError && (
            <p className="mt-2" style={{ color: colors.sell, fontSize: 12 }}>
              Không thể gửi lệnh. Vui lòng thử lại.
            </p>
          )}
          {!canTrade && (
            <p role="alert" className="mt-2" style={{ color: colors.sell, fontSize: 12 }}>
              Prediction trading permission is required to place an order.
            </p>
          )}
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

export function PredictionPortfolioContractPage() {
  const colors = useThemeColors();
  const query = usePredictionPositionsQuery();
  if (query.isPending) return <LoadingPage title="Prediction portfolio" />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Prediction portfolio" back />
      <PageContent gap="default">
        {query.data?.items.map((position) => (
          <TrCard key={position.id} className="p-4">
            <div className="flex justify-between">
              <strong style={{ color: colors.text1 }}>
                {position.eventId} · {position.outcome}
              </strong>
              <span style={{ color: position.pnl >= 0 ? colors.buy : colors.sell }}>
                {position.pnl >= 0 ? '+' : ''}
                {position.pnl.toFixed(2)} ({position.pnlPct.toFixed(2)}%)
              </span>
            </div>
            <p className="mt-2" style={{ color: colors.text2, fontSize: 12 }}>
              {position.shares} shares · value {position.currentValue.toFixed(2)}
            </p>
          </TrCard>
        ))}
        {!query.data?.items.length && <p style={{ color: colors.text2 }}>Chưa có vị thế.</p>}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionRewardsContractPage() {
  const colors = useThemeColors();
  const query = usePredictionRewardsQuery();
  if (query.isPending) return <LoadingPage title="Prediction rewards" />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Prediction rewards" back />
      <PageContent gap="default">
        {query.data?.items.map((reward) => (
          <TrCard key={reward.id} className="p-4">
            <div className="flex justify-between">
              <strong style={{ color: colors.text1 }}>
                {reward.category} · {reward.eventId}
              </strong>
              <span style={{ color: colors.buy }}>{reward.earningsPct}% APY</span>
            </div>
            <p className="mt-2" style={{ color: colors.text2, fontSize: 12 }}>
              Reward {reward.dailyReward} · min {reward.minShares} shares · max spread{' '}
              {reward.maxSpread}
            </p>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionLeaderboardContractPage() {
  const colors = useThemeColors();
  const query = usePredictionLeaderboardQuery();
  if (query.isPending) return <LoadingPage title="Prediction leaderboard" />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Prediction leaderboard" back />
      <PageContent gap="default">
        {query.data?.items.map((trader) => (
          <TrCard key={`${trader.user}-${trader.rank}`} className="p-4">
            <div className="flex items-center justify-between">
              <strong style={{ color: colors.text1 }}>
                #{trader.rank} {trader.avatar} {trader.user}
              </strong>
              <span style={{ color: trader.pnl >= 0 ? colors.buy : colors.sell }}>
                {trader.pnl >= 0 ? '+' : ''}
                {trader.pnl.toLocaleString()}
              </span>
            </div>
            <p className="mt-2" style={{ color: colors.text2, fontSize: 12 }}>
              {trader.trades} trades · win rate {trader.winRate}% · volume{' '}
              {trader.volume.toLocaleString()}
            </p>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionActivityContractPage() {
  const colors = useThemeColors();
  const query = usePredictionActivityQuery();
  if (query.isPending) return <LoadingPage title="Prediction activity" />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Prediction activity" back />
      <PageContent gap="default">
        {query.data?.items.map((item) => (
          <TrCard key={item.id} className="p-3">
            <div className="flex items-center justify-between">
              <span style={{ color: colors.text1 }}>
                {item.avatar} {item.user} {item.action} {item.outcome}
              </span>
              <span style={{ color: item.action === 'bought' ? colors.buy : colors.sell }}>
                {item.shares} @ {item.price}
              </span>
            </div>
            <p className="mt-1" style={{ color: colors.text3, fontSize: 11 }}>
              {item.eventId} · {item.timestamp}
            </p>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionReceiptContractPage() {
  const colors = useThemeColors();
  const { orderId = '' } = useParams();
  const query = usePredictionReceiptQuery(orderId);
  if (query.isPending) return <LoadingPage title="Prediction order" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const receipt = query.data;
  return (
    <PageLayout>
      <Header title="Prediction order receipt" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex justify-between">
            <strong style={{ color: colors.text1 }}>{receipt.eventTitle}</strong>
            <span style={{ color: colors.primary }}>{receipt.status}</span>
          </div>
          <p className="mt-2" style={{ color: colors.text2, fontSize: 12 }}>
            {receipt.side} {receipt.outcome} · {receipt.shares} shares · total{' '}
            {receipt.total.toFixed(2)}
          </p>
        </TrCard>
        {receipt.timeline.map((step) => (
          <TrCard key={`${step.label}-${step.date}`} className="p-3">
            <span style={{ color: step.done ? colors.buy : colors.text3 }}>
              {step.done ? '✓' : '○'} {step.label}
            </span>
            <span className="ml-2" style={{ color: colors.text3, fontSize: 11 }}>
              {step.date}
            </span>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}

export function PredictionBridgeBackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại">
      <ArrowLeft size={16} />
    </button>
  );
}

export function PredictionsHomeContractPage() {
  return <PredictionsContractPage />;
}
export function PredictionsSearchContractPage() {
  return <PredictionsContractPage mode="search" />;
}
export function PredictionsBreakingContractPage() {
  return <PredictionsContractPage mode="breaking" />;
}
