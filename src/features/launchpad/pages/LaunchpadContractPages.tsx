import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckCircle, ExternalLink, Rocket, Shield } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useLaunchpadProjectQuery, useLaunchpadProjectsQuery } from '../model/launchpad-queries';
import type { LaunchpadProjectSummary } from '../model/launchpad-types';

const TABS = ['all', 'active', 'upcoming', 'ended'] as const;
type Tab = (typeof TABS)[number];

function LoadingPage({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} subtitle="Launchpad contract" back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu Launchpad API…</p>
      </PageContent>
    </PageLayout>
  );
}

export function LaunchpadContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<Tab>('all');
  const query = useLaunchpadProjectsQuery(tab === 'all' ? {} : { status: tab });

  if (query.isPending) return <LoadingPage title="Launchpad" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Launchpad" subtitle="Token launch marketplace · server data" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15">
              <Rocket size={24} color="#A78BFA" />
            </div>
            <div>
              <h1 style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>VitLaunch</h1>
              <p style={{ color: colors.text2, fontSize: 12 }}>
                Dự án và token sale được cung cấp từ Launchpad API.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Dự án" value={query.data.total} />
            <Metric label="Đang mở" value={query.data.activeCount} />
            <Metric label="Contract" value="API" />
          </div>
        </TrCard>

        <div className="grid grid-cols-4 gap-2">
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className="rounded-xl px-2 py-2 text-xs font-semibold"
              style={{
                background: tab === value ? '#8B5CF620' : colors.surface2,
                color: tab === value ? '#A78BFA' : colors.text3,
              }}
            >
              {value === 'all'
                ? 'Tất cả'
                : value === 'active'
                  ? 'Đang mở'
                  : value === 'upcoming'
                    ? 'Sắp tới'
                    : 'Đã kết thúc'}
            </button>
          ))}
        </div>

        {query.data.projects.length === 0 ? (
          <TrCard className="p-4">
            <p style={{ color: colors.text2 }}>Không có dự án phù hợp.</p>
          </TrCard>
        ) : (
          query.data.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`${prefix}/launchpad/${project.id}`)}
            />
          ))
        )}
      </PageContent>
    </PageLayout>
  );
}

export function LaunchpadProjectContractPage() {
  const colors = useThemeColors();
  const { id = '' } = useParams();
  const query = useLaunchpadProjectQuery(id);
  if (query.isPending) return <LoadingPage title="Launchpad project" />;
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const project = query.data;

  return (
    <PageLayout>
      <Header title={project.name} subtitle="Launchpad project contract" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold"
              style={{ background: `${project.logoColor}20`, color: project.logoColor }}
            >
              {project.logo}
            </div>
            <div className="min-w-0 flex-1">
              <h1 style={{ color: colors.text1, fontSize: 19, fontWeight: 700 }}>{project.name}</h1>
              <p style={{ color: colors.text2, fontSize: 12 }}>
                ${project.symbol} · {project.type.toUpperCase()} · {project.chain}
              </p>
              <StatusLine project={project} />
            </div>
          </div>
          <p className="mt-4" style={{ color: colors.text2, lineHeight: 1.5 }}>
            {project.longDescription}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Raise" value={project.totalRaise} />
            <Metric label="Progress" value={`${project.progress}%`} />
            <Metric label="Participants" value={project.participants} />
          </div>
        </TrCard>

        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Tokenomics</h2>
          <div className="mt-3 grid gap-2">
            {project.tokenomics.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                <span style={{ color: colors.text2, fontSize: 12 }}>{item.label}</span>
                <strong className="ml-auto" style={{ color: colors.text1, fontSize: 12 }}>
                  {item.percent}%
                </strong>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <div className="flex items-center gap-2">
            <Shield size={16} color={project.audit.status === 'passed' ? '#10B981' : '#F59E0B'} />
            <h2 style={{ color: colors.text1, fontWeight: 700 }}>Audit & access</h2>
          </div>
          <InfoRow label="Auditor" value={project.audit.auditor} />
          <InfoRow label="Audit status" value={project.audit.status} />
          <InfoRow label="KYC" value={project.kyc ? `Level ${project.kycLevel}` : 'Not required'} />
          <InfoRow label="Whitelist" value={project.whitelist ? 'Required' : 'Not required'} />
          <InfoRow label="Contract" value={shorten(project.contractAddress)} />
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400"
            >
              Website <ExternalLink size={12} />
            </a>
          )}
        </TrCard>

        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Vesting</h2>
          <div className="mt-3 grid gap-2">
            {project.vesting.map((step) => (
              <div key={`${step.label}-${step.date}`} className="flex items-center gap-2 text-xs">
                <CheckCircle
                  size={13}
                  color={step.status === 'claimed' ? '#10B981' : colors.text3}
                />
                <span style={{ color: colors.text2 }}>{step.label}</span>
                <span className="ml-auto" style={{ color: colors.text3 }}>
                  {step.percent}% · {step.date}
                </span>
              </div>
            ))}
          </div>
        </TrCard>

        <TrCard className="p-4">
          <h2 style={{ color: colors.text1, fontWeight: 700 }}>Production action boundary</h2>
          <p className="mt-2" style={{ color: colors.text2, fontSize: 12, lineHeight: 1.5 }}>
            Subscription and allocation mutations are intentionally not simulated in this slice.
            They require the backend transaction contract, balance reservation, idempotency and
            audit event.
          </p>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: LaunchpadProjectSummary;
  onOpen: () => void;
}) {
  const colors = useThemeColors();
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <TrCard className="p-4 transition-opacity hover:opacity-90">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: `${project.logoColor}20`, color: project.logoColor }}
          >
            {project.logo}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 style={{ color: colors.text1, fontWeight: 700 }}>{project.name}</h2>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px]"
                style={{ background: `${project.logoColor}20`, color: project.logoColor }}
              >
                {project.type.toUpperCase()}
              </span>
            </div>
            <p className="mt-1 line-clamp-2" style={{ color: colors.text2, fontSize: 12 }}>
              {project.description}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Raise" value={project.totalRaise} />
          <Metric label="Progress" value={`${project.progress}%`} />
          <Metric label="Users" value={project.participants} />
        </div>
      </TrCard>
    </button>
  );
}

function StatusLine({ project }: { project: LaunchpadProjectSummary }) {
  const colors = useThemeColors();
  const color =
    project.status === 'active'
      ? '#10B981'
      : project.status === 'upcoming'
        ? '#F59E0B'
        : colors.text3;
  return (
    <p className="mt-2 text-xs" style={{ color }}>
      {project.status}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2 text-center" style={{ background: colors.surface2 }}>
      <strong style={{ color: colors.text1, fontSize: 13 }}>{value}</strong>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
      <span style={{ color: colors.text3 }}>{label}</span>
      <span className="text-right" style={{ color: colors.text1 }}>
        {value}
      </span>
    </div>
  );
}

function shorten(value: string) {
  return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}
