import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertTriangle, Shield, Users, Zap } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import {
  useArenaChallengeQuery,
  useArenaModeQuery,
  useJoinArenaChallengeMutation,
} from '../model/arena-queries';
import type { ArenaModeDetail } from '../model/arena-types';

function LoadingPage({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} subtitle="Open Arena contract" back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu Arena API…</p>
      </PageContent>
    </PageLayout>
  );
}

function CreatorLine({ mode }: { mode: ArenaModeDetail }) {
  const colors = useThemeColors();
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{mode.creator.avatar}</span>
      <span style={{ color: colors.text1, fontWeight: 600 }}>{mode.creator.name}</span>
      {mode.creator.fairPlayBadge && <Shield size={13} color="#10B981" />}
      <span style={{ color: colors.text3, fontSize: 11 }}>Trust {mode.creator.trustScore}/100</span>
    </div>
  );
}

export function ArenaModeContractPage() {
  const colors = useThemeColors();
  const { modeId = '' } = useParams();
  const query = useArenaModeQuery(modeId);
  if (query.isPending) return <LoadingPage title="Arena mode" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const mode = query.data;
  return (
    <PageLayout>
      <Header title={mode.title} subtitle="Open Arena · mode detail" back />
      <PageContent gap="default">
        <TrCard className="p-4" style={{ borderColor: `${mode.template.color}35` }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{ background: `${mode.template.color}18` }}
            >
              {mode.template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h1 style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>{mode.title}</h1>
              <p style={{ color: colors.text2, fontSize: 12 }}>{mode.template.title}</p>
              <div className="mt-3">
                <CreatorLine mode={mode} />
              </div>
            </div>
          </div>
          <p className="mt-4" style={{ color: colors.text2, lineHeight: 1.5 }}>
            {mode.description}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Challenges" value={mode.activeChallenges} />
            <Metric label="Clones" value={mode.cloneCount} />
            <Metric label="Completion" value={`${mode.completionRate}%`} />
          </div>
        </TrCard>
        <TrCard className="grid gap-3 p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Rules & resolution</h2>
          <InfoRow label="Win condition" value={mode.winCondition ?? 'Defined by challenge'} />
          <InfoRow label="Resolution" value={mode.resolutionType ?? 'Pending contract'} />
          <InfoRow label="Average duration" value={mode.avgDuration ?? '—'} />
          <InfoRow label="Allowed formats" value={mode.allowedFormats.join(' · ')} />
        </TrCard>
        <Section title="Live rooms" count={mode.relatedRooms.length}>
          {mode.relatedRooms.map((room) => (
            <TrCard key={room.id} className="p-3">
              <div className="flex items-center justify-between">
                <span style={{ color: colors.text1, fontWeight: 600 }}>{room.title}</span>
                <span style={{ color: '#F59E0B', fontSize: 11 }}>{room.entryPoints} pts</span>
              </div>
              <p style={{ color: colors.text3, fontSize: 11 }}>
                {room.format} · {room.slotsFilled}/{room.slotsTotal} slots
              </p>
            </TrCard>
          ))}
        </Section>
      </PageContent>
    </PageLayout>
  );
}

export function ArenaChallengeContractPage() {
  const colors = useThemeColors();
  const { challengeId = '' } = useParams();
  const query = useArenaChallengeQuery(challengeId);
  const join = useJoinArenaChallengeMutation(challengeId);
  const { hasPermission } = useAuth();
  if (query.isPending) return <LoadingPage title="Arena challenge" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const challenge = query.data;
  const canJoin =
    (hasPermission('arena:write') || hasPermission('arena:join')) &&
    challenge.challengeState === 'open' &&
    challenge.slotsFilled < challenge.slotsTotal;
  return (
    <PageLayout>
      <Header title={challenge.title} subtitle="Open Arena · challenge detail" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-1"
              style={{ background: '#F59E0B18', color: '#F59E0B', fontSize: 10, fontWeight: 700 }}
            >
              <Zap size={10} className="mr-1 inline" /> Arena Points only
            </span>
            <span style={{ color: colors.text3, fontSize: 11 }}>
              {challenge.challengeState ?? challenge.status}
            </span>
          </div>
          <h1 className="mt-3" style={{ color: colors.text1, fontSize: 19, fontWeight: 700 }}>
            {challenge.title}
          </h1>
          <p className="mt-2" style={{ color: colors.text2, lineHeight: 1.5 }}>
            {challenge.description}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Entry" value={`${challenge.entryPoints} pts`} />
            <Metric label="Prize pool" value={`${challenge.prizePool} pts`} />
            <Metric label="Players" value={`${challenge.slotsFilled}/${challenge.slotsTotal}`} />
          </div>
          {!canJoin &&
            challenge.challengeState === 'open' &&
            challenge.slotsFilled < challenge.slotsTotal &&
            !(hasPermission('arena:write') || hasPermission('arena:join')) && (
              <p role="alert" className="mt-3" style={{ color: colors.sell, fontSize: 12 }}>
                Arena join permission is required to enter a challenge.
              </p>
            )}
          {canJoin && (
            <button
              type="button"
              disabled={join.isPending}
              onClick={() => void join.mutateAsync()}
              className="mt-4 w-full rounded-xl py-3 font-semibold"
              style={{ background: '#F59E0B', color: '#111827', opacity: join.isPending ? 0.6 : 1 }}
            >
              {join.isPending ? 'Đang tham gia…' : 'Tham gia challenge'}
            </button>
          )}
          {join.isError && (
            <p className="mt-2" style={{ color: colors.sell, fontSize: 12 }}>
              Không thể tham gia. Vui lòng thử lại.
            </p>
          )}
        </TrCard>
        {challenge.warningBanners?.map((warning) => (
          <div
            key={warning}
            className="flex gap-2 rounded-xl p-3"
            style={{ background: '#F59E0B12', color: '#F59E0B', fontSize: 11 }}
          >
            <AlertTriangle size={14} className="shrink-0" />
            {warning}
          </div>
        ))}
        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Participants</h2>
          <p className="mt-1" style={{ color: colors.text3, fontSize: 11 }}>
            <Users size={12} className="mr-1 inline" />
            {challenge.participants.length} participants · {challenge.format}
          </p>
          <div className="mt-3 grid gap-2">
            {challenge.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 rounded-lg p-2"
                style={{ background: colors.surface2 }}
              >
                <span>{participant.avatar}</span>
                <span style={{ color: colors.text1, fontSize: 12 }}>{participant.name}</span>
                <span className="ml-auto" style={{ color: colors.text3, fontSize: 10 }}>
                  {participant.role}
                </span>
              </div>
            ))}
          </div>
        </TrCard>
        <Section title="Rules" count={challenge.rules.length}>
          {challenge.rules.map((rule, index) => (
            <TrCard key={`${index}-${rule}`} className="p-3">
              <p style={{ color: colors.text2, fontSize: 12 }}>
                {index + 1}. {rule}
              </p>
            </TrCard>
          ))}
        </Section>
        <TrCard className="grid gap-3 p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Resolution contract</h2>
          <InfoRow label="Win condition" value={challenge.winCondition ?? '—'} />
          <InfoRow label="Resolution method" value={challenge.resolutionMethod ?? '—'} />
          <InfoRow label="Void rule" value={challenge.voidRule ?? '—'} />
          <InfoRow label="Refund policy" value={challenge.refundPolicy ?? '—'} />
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

export function ArenaJoinContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { challengeId = '' } = useParams();
  const query = useArenaChallengeQuery(challengeId);
  const join = useJoinArenaChallengeMutation(challengeId);
  const { hasPermission } = useAuth();
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [pointsConfirmed, setPointsConfirmed] = useState(false);

  if (query.isPending) return <LoadingPage title="Join Arena challenge" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  const challenge = query.data;
  const canJoin =
    (hasPermission('arena:write') || hasPermission('arena:join')) &&
    challenge.challengeState === 'open' &&
    challenge.slotsFilled < challenge.slotsTotal;
  const ready = canJoin && rulesConfirmed && pointsConfirmed;

  const handleJoin = async () => {
    if (!canJoin) return;
    await join.mutateAsync();
    navigate(`${prefix}/arena/challenge/${challenge.id}`, { replace: true });
  };

  return (
    <PageLayout>
      <Header title="Tham gia challenge" subtitle="Arena contract confirmation" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <h1 style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>{challenge.title}</h1>
          <p className="mt-2" style={{ color: colors.text2, fontSize: 12, lineHeight: 1.5 }}>
            {challenge.description}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Entry" value={`${challenge.entryPoints} pts`} />
            <Metric label="Players" value={`${challenge.slotsFilled}/${challenge.slotsTotal}`} />
            <Metric label="State" value={challenge.challengeState ?? challenge.status} />
          </div>
        </TrCard>

        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Xác nhận trước khi tham gia</h2>
          <label className="mt-4 flex items-start gap-3 text-sm" style={{ color: colors.text2 }}>
            <input
              type="checkbox"
              checked={rulesConfirmed}
              onChange={(event) => setRulesConfirmed(event.target.checked)}
            />
            <span>Tôi đã đọc và đồng ý với luật của challenge.</span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm" style={{ color: colors.text2 }}>
            <input
              type="checkbox"
              checked={pointsConfirmed}
              onChange={(event) => setPointsConfirmed(event.target.checked)}
            />
            <span>Tôi hiểu entry points và chính sách hoàn trả theo contract.</span>
          </label>
          {!canJoin && (
            <p className="mt-3" style={{ color: colors.sell, fontSize: 12 }}>
              Challenge không còn nhận người tham gia hoặc đã đầy.
            </p>
          )}
          {canJoin === false &&
            challenge.challengeState === 'open' &&
            challenge.slotsFilled < challenge.slotsTotal &&
            !(hasPermission('arena:write') || hasPermission('arena:join')) && (
              <p className="mt-3" role="alert" style={{ color: colors.sell, fontSize: 12 }}>
                Arena join permission is required to enter a challenge.
              </p>
            )}
          {join.isError && (
            <p className="mt-3" style={{ color: colors.sell, fontSize: 12 }}>
              Không thể tham gia. Vui lòng thử lại.
            </p>
          )}
          <button
            type="button"
            disabled={!ready || join.isPending}
            onClick={() => void handleJoin()}
            className="mt-4 w-full rounded-xl py-3 font-semibold"
            style={{
              background: ready ? '#F59E0B' : colors.surface2,
              color: ready ? '#111827' : colors.text3,
              opacity: join.isPending ? 0.6 : 1,
            }}
          >
            {join.isPending ? 'Đang tham gia…' : 'Xác nhận tham gia'}
          </button>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: colors.surface2 }}>
      <strong style={{ color: colors.text1, fontSize: 14 }}>{value}</strong>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="flex items-start justify-between gap-4" style={{ fontSize: 12 }}>
      <span style={{ color: colors.text3 }}>{label}</span>
      <span className="text-right" style={{ color: colors.text2 }}>
        {value}
      </span>
    </div>
  );
}

function Section({
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
