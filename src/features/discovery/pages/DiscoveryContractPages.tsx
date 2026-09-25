import { useEffect, useState } from 'react';
import { BarChart3, Search, Shield, Star, Target, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useDiscoverySearchQuery, useDiscoveryTopicQuery } from '../model/discovery-queries';
import { discoveryTopicIds } from '../model/discovery-types';
import type {
  DiscoveryArenaMode,
  DiscoveryArenaRoom,
  DiscoveryCreator,
  DiscoveryPrediction,
  DiscoveryTradingPair,
} from '../model/discovery-types';

function LoadingPage({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu Discovery API…</p>
      </PageContent>
    </PageLayout>
  );
}

function ModuleLabel({ type }: { type: 'prediction' | 'arena' | 'spot' }) {
  const config = {
    prediction: { label: 'Prediction Market', color: '#8B5CF6', icon: Target },
    arena: { label: 'Arena Points only', color: '#F59E0B', icon: Zap },
    spot: { label: 'Spot Trading', color: '#3B82F6', icon: BarChart3 },
  }[type];
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
      style={{ color: config.color, background: `${config.color}15`, fontSize: 9, fontWeight: 700 }}
    >
      <Icon size={9} /> {config.label}
    </span>
  );
}

function PredictionResult({ item }: { item: DiscoveryPrediction }) {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  return (
    <button
      type="button"
      className="text-left"
      onClick={() => navigate(`${prefix}/markets/predictions/event/${item.id}`)}
    >
      <TrCard className="p-3.5">
        <ModuleLabel type="prediction" />
        <p className="mt-2" style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
          {item.title}
        </p>
        <div className="mt-2 flex items-center justify-between" style={{ fontSize: 11 }}>
          <span style={{ color: item.topOutcome.color }}>
            {item.topOutcome.label} {item.topOutcome.chance}%
          </span>
          <span style={{ color: colors.text3 }}>{item.participants.toLocaleString()} traders</span>
        </div>
      </TrCard>
    </button>
  );
}

function ArenaResult({ item }: { item: DiscoveryArenaMode | DiscoveryArenaRoom }) {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const isMode = 'cloneCount' in item;
  return (
    <button
      type="button"
      className="text-left"
      onClick={() =>
        navigate(`${prefix}/arena/${isMode ? `mode/${item.id}` : `challenge/${item.id}`}`)
      }
    >
      <TrCard className="p-3.5">
        <ModuleLabel type="arena" />
        <p className="mt-2" style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
          {item.title}
        </p>
        <p className="mt-1" style={{ color: colors.text3, fontSize: 11 }}>
          {isMode
            ? `${item.activeChallenges} challenges · ${item.cloneCount} clones`
            : `${item.slotsFilled}/${item.slotsTotal} slots · ${item.entryPoints} pts`}
        </p>
      </TrCard>
    </button>
  );
}

function CreatorResult({ item }: { item: DiscoveryCreator }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3.5">
      <div className="flex items-center gap-3">
        <span className="text-xl">{item.avatar}</span>
        <div className="min-w-0 flex-1">
          <p style={{ color: colors.text1, fontWeight: 700 }}>{item.name}</p>
          <p style={{ color: colors.text3, fontSize: 11 }}>Trust score {item.trustScore}/100</p>
        </div>
        {item.fairPlayBadge && <Shield size={14} color="#10B981" />}
      </div>
    </TrCard>
  );
}

function PairResult({ item }: { item: DiscoveryTradingPair }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <ModuleLabel type="spot" />
          <p className="mt-2" style={{ color: colors.text1, fontWeight: 700 }}>
            {item.symbol}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: colors.text1, fontFamily: 'monospace' }}>
            {item.price.toLocaleString()}
          </p>
          <p style={{ color: item.change24h >= 0 ? colors.buy : colors.sell, fontSize: 11 }}>
            {item.change24h >= 0 ? '+' : ''}
            {item.change24h}%
          </p>
        </div>
      </div>
    </TrCard>
  );
}

export function DiscoverySearchContractPage() {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const result = useDiscoverySearchQuery(submittedQuery);
  useEffect(() => {
    const timer = window.setTimeout(() => setSubmittedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const data = result.data;
  return (
    <PageLayout>
      <Header title="Search" subtitle="Unified discovery across modules" back />
      <PageContent gap="default">
        <label
          className="flex items-center gap-2 rounded-xl px-3"
          style={{ background: colors.surface2 }}
        >
          <Search size={15} color={colors.text3} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm market, mode, creator hoặc pair…"
            className="flex-1 bg-transparent py-3 outline-none"
            style={{ color: colors.text1 }}
          />
        </label>
        {result.isError && <ErrorState onAction={() => void result.refetch()} />}
        {result.isPending && submittedQuery.length >= 2 && <LoadingPage title="Search" />}
        {data && (
          <>
            <ResultSection title="Prediction markets" count={data.predictions.length}>
              {data.predictions.map((item) => (
                <PredictionResult key={item.id} item={item} />
              ))}
            </ResultSection>
            <ResultSection title="Arena" count={data.arenaModes.length + data.arenaRooms.length}>
              {data.arenaModes.map((item) => (
                <ArenaResult key={`mode-${item.id}`} item={item} />
              ))}
              {data.arenaRooms.map((item) => (
                <ArenaResult key={`room-${item.id}`} item={item} />
              ))}
            </ResultSection>
            <ResultSection title="Creators" count={data.creators.length}>
              {data.creators.map((item) => (
                <CreatorResult key={item.id} item={item} />
              ))}
            </ResultSection>
            <ResultSection title="Spot pairs" count={data.tradingPairs.length}>
              {data.tradingPairs.map((item) => (
                <PairResult key={item.id} item={item} />
              ))}
            </ResultSection>
            {!data.predictions.length &&
              !data.arenaModes.length &&
              !data.arenaRooms.length &&
              !data.creators.length &&
              !data.tradingPairs.length && (
                <p style={{ color: colors.text2 }}>Không tìm thấy kết quả phù hợp.</p>
              )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  if (!count) return null;
  return (
    <section className="grid gap-2">
      <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
        {title} ({count})
      </h2>
      {children}
    </section>
  );
}

export function DiscoveryTopicContractPage() {
  const colors = useThemeColors();
  const { topicId = 'crypto' } = useParams();
  const safeTopicId = discoveryTopicIds.includes(topicId as (typeof discoveryTopicIds)[number])
    ? (topicId as (typeof discoveryTopicIds)[number])
    : 'crypto';
  const query = useDiscoveryTopicQuery(safeTopicId);
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  if (query.isPending) return <LoadingPage title="Topic" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const { topic, stats } = query.data;
  return (
    <PageLayout>
      <Header title={topic.label} subtitle="Discovery topic" back />
      <PageContent gap="default">
        <TrCard className="p-4" style={{ borderColor: `${topic.color}30` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: `${topic.color}18` }}
            >
              <Star size={20} color={topic.color} />
            </div>
            <div>
              <h1 style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>{topic.label}</h1>
              <p style={{ color: colors.text2, fontSize: 11 }}>{topic.description}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Object.entries(stats).map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg p-2 text-center"
                style={{ background: colors.surface2 }}
              >
                <strong style={{ color: topic.color }}>{value}</strong>
                <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
              </div>
            ))}
          </div>
        </TrCard>
        <div className="flex flex-wrap gap-2">
          {discoveryTopicIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(`${prefix}/topic/${id}`)}
              className="rounded-lg px-3 py-2"
              style={{
                background: id === safeTopicId ? `${topic.color}20` : colors.surface2,
                color: colors.text2,
                fontSize: 11,
              }}
            >
              {id}
            </button>
          ))}
        </div>
        <ResultSection title="Prediction markets" count={query.data.predictions.length}>
          {query.data.predictions.map((item) => (
            <PredictionResult key={item.id} item={item} />
          ))}
        </ResultSection>
        <ResultSection
          title="Arena rooms and modes"
          count={query.data.arenaRooms.length + query.data.arenaModes.length}
        >
          {query.data.arenaRooms.map((item) => (
            <ArenaResult key={`room-${item.id}`} item={item} />
          ))}
          {query.data.arenaModes.map((item) => (
            <ArenaResult key={`mode-${item.id}`} item={item} />
          ))}
        </ResultSection>
        <ResultSection title="Top creators" count={query.data.creators.length}>
          {query.data.creators.map((item) => (
            <CreatorResult key={item.id} item={item} />
          ))}
        </ResultSection>
      </PageContent>
    </PageLayout>
  );
}
