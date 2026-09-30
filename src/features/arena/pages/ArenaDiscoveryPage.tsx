import { useMemo, useState } from 'react';
import { Search, ShieldCheck, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useArenaDiscoveryQuery } from '../model/arena-queries';
import type { ArenaDiscoveryChallenge, ArenaDiscoveryMode } from '../model/arena-types';

type DiscoveryTab = 'challenges' | 'modes';

function ModeCard({ mode, onOpen }: { mode: ArenaDiscoveryMode; onOpen: () => void }) {
  const colors = useThemeColors();
  return (
    <TrCard className="grid gap-3 p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: `${mode.color}18` }}
          aria-hidden="true"
        >
          {mode.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>{mode.title}</h2>
          <p style={{ color: colors.text2, fontSize: 12 }}>{mode.description}</p>
        </div>
        {mode.fairPlay && <ShieldCheck size={16} color={colors.buy} aria-label="Fair play" />}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: colors.text3, fontSize: 11 }}>
          {mode.creator.avatar} {mode.creator.name} · Trust {mode.creator.trustScore}/100
        </span>
        <span style={{ color: colors.text3, fontSize: 11 }}>
          {mode.activeChallenges} challenges · {mode.completionRate}% hoàn tất
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 rounded-xl border px-3 text-sm font-semibold"
        style={{ color: colors.text1, borderColor: colors.borderSolid }}
      >
        Xem mode
      </button>
    </TrCard>
  );
}

function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: ArenaDiscoveryChallenge;
  onOpen: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p style={{ color: colors.text3, fontSize: 11 }}>{challenge.modeName}</p>
          <h2 className="mt-1" style={{ color: colors.text1, fontWeight: 700 }}>
            {challenge.title}
          </h2>
          <p style={{ color: colors.text2, fontSize: 12 }}>{challenge.description}</p>
        </div>
        <span className="shrink-0" style={{ color: colors.text3, fontSize: 11 }}>
          {challenge.creator.avatar} {challenge.creator.name}
        </span>
      </div>
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{ color: colors.text2, fontSize: 12 }}
      >
        <span>{challenge.entryPoints} Arena Points để tham gia</span>
        <span>{challenge.prizePool} Arena Points trong pool</span>
        <span>
          <Users size={12} className="mr-1 inline" />
          {challenge.slotsFilled}/{challenge.slotsTotal}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 rounded-xl px-3 text-sm font-semibold"
        style={{ background: '#8B5CF6', color: '#fff' }}
      >
        Xem challenge
      </button>
    </TrCard>
  );
}

export function ArenaDiscoveryPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const query = useArenaDiscoveryQuery();
  const [tab, setTab] = useState<DiscoveryTab>('challenges');
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const challenges = useMemo(
    () =>
      (query.data?.challenges ?? []).filter((item) =>
        `${item.title} ${item.description} ${item.modeName} ${item.creator.name}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [normalizedSearch, query.data?.challenges],
  );
  const modes = useMemo(
    () =>
      (query.data?.modes ?? []).filter((item) =>
        `${item.title} ${item.description} ${item.tags.join(' ')} ${item.creator.name}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [normalizedSearch, query.data?.modes],
  );

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Open Arena" subtitle="Khám phá challenge và mode" />
        <PageContent>
          <p role="status" style={{ color: colors.text2 }}>
            Đang tải dữ liệu Arena…
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageLayout>
        <Header title="Open Arena" subtitle="Khám phá challenge và mode" />
        <PageContent>
          <ErrorState onAction={() => void query.refetch()} />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Open Arena" subtitle="Khám phá challenge và mode" />
      <PageContent gap="default">
        <TrCard className="flex gap-3 p-3" role="note">
          <Zap size={18} className="shrink-0" color="#8B5CF6" />
          <p style={{ color: colors.text2, fontSize: 12, lineHeight: 1.5 }}>
            <strong style={{ color: colors.text1 }}>Arena Points only.</strong> Điểm trong Arena
            không liên quan đến ví hoặc tài sản tài chính.
          </p>
        </TrCard>

        <label
          className="flex min-h-11 items-center gap-2 rounded-xl border px-3"
          style={{ borderColor: colors.borderSolid }}
        >
          <Search size={16} color={colors.text3} />
          <span className="sr-only">Tìm trong Open Arena</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm challenge hoặc mode"
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{ color: colors.text1 }}
          />
        </label>

        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Loại nội dung Arena">
          {(['challenges', 'modes'] as const).map((nextTab) => (
            <button
              key={nextTab}
              type="button"
              role="tab"
              aria-selected={tab === nextTab}
              onClick={() => setTab(nextTab)}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold"
              style={{
                background: tab === nextTab ? '#8B5CF6' : colors.surface2,
                color: tab === nextTab ? '#fff' : colors.text2,
              }}
            >
              {nextTab === 'challenges' ? 'Challenge' : 'Mode'}
            </button>
          ))}
        </div>

        {tab === 'challenges' ? (
          challenges.length ? (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onOpen={() => navigate(`${prefix}/arena/challenge/${challenge.id}`)}
              />
            ))
          ) : (
            <p role="status" style={{ color: colors.text2 }}>
              {normalizedSearch
                ? 'Không tìm thấy challenge phù hợp.'
                : 'Chưa có challenge nào khả dụng.'}
            </p>
          )
        ) : modes.length ? (
          modes.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              onOpen={() => navigate(`${prefix}/arena/mode/${mode.id}`)}
            />
          ))
        ) : (
          <p role="status" style={{ color: colors.text2 }}>
            {normalizedSearch ? 'Không tìm thấy mode phù hợp.' : 'Chưa có mode nào khả dụng.'}
          </p>
        )}
      </PageContent>
    </PageLayout>
  );
}
