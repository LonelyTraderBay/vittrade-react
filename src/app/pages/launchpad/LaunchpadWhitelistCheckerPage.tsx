/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadWhitelistCheckerPage — Whitelist Eligibility Checker (Phase 4.11)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Check whitelist status across projects, requirement checker,
 *            tier allocation tracker, application status, upcoming whitelists
 */

import React, { useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  CheckCircle, XCircle, Clock, AlertCircle, Star,
  ChevronRight, Award, TrendingUp, Users, Shield,
  Info, Zap,
} from 'lucide-react';
import {
  MOCK_WHITELIST_ENTRIES, MOCK_WHITELIST_PROJECTS,
  type WhitelistEntry, type WhitelistProject, type WhitelistRequirement,
} from './launchpadData';

const TABS = [
  { key: 'my_status', label: 'Trạng thái' },
  { key: 'upcoming', label: 'Sắp mở' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle; bg: string }> = {
  whitelisted: { label: 'Whitelisted', color: '#10B981', icon: CheckCircle, bg: 'rgba(16,185,129,0.08)' },
  pending: { label: 'Pending', color: '#F59E0B', icon: Clock, bg: 'rgba(245,158,11,0.08)' },
  not_whitelisted: { label: 'Not eligible', color: '#8B95B3', icon: XCircle, bg: 'rgba(139,149,179,0.08)' },
  rejected: { label: 'Rejected', color: '#EF4444', icon: XCircle, bg: 'rgba(239,68,68,0.08)' },
  expired: { label: 'Expired', color: '#8B95B3', icon: Clock, bg: 'rgba(139,149,179,0.08)' },
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  bronze: { label: 'Bronze', color: '#CD7F32' },
  silver: { label: 'Silver', color: '#C0C0C0' },
  gold: { label: 'Gold', color: '#FFD700' },
  platinum: { label: 'Platinum', color: '#E5E4E2' },
};

const REQUIREMENT_ICONS: Record<string, typeof CheckCircle> = {
  kyc: Shield,
  stake: TrendingUp,
  hold: Award,
  social: Users,
  lottery: Star,
  fcfs: Zap,
};

export function LaunchpadWhitelistCheckerPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('my_status');
  const [selectedEntry, setSelectedEntry] = useState<WhitelistEntry | null>(null);
  const [selectedProject, setSelectedProject] = useState<WhitelistProject | null>(null);

  const myEntries = MOCK_WHITELIST_ENTRIES;
  const upcomingProjects = MOCK_WHITELIST_PROJECTS;

  const whitelistedCount = myEntries.filter(e => e.status === 'whitelisted').length;
  const pendingCount = myEntries.filter(e => e.status === 'pending').length;

  return (
    <PageLayout>
      <Header title="Whitelist Checker" back />

      {/* Entry detail sheet */}
      {selectedEntry && (
        <WhitelistDetailSheet
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Project detail sheet */}
      {selectedProject && (
        <ProjectWhitelistSheet
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <PageContent gap="default">
        {/* Stats Hero */}
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: c.portfolioBg,
            border: `1px solid ${c.portfolioBorder}`,
            boxShadow: c.portfolioShadow,
          }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Star size={22} color="#10B981" />
              </div>
              <div>
                <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Whitelist Checker</h2>
                <p style={{ color: c.text3, fontSize: 12 }}>Kiểm tra trạng thái whitelist</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Whitelisted', value: whitelistedCount, color: '#10B981' },
                { label: 'Pending', value: pendingCount, color: '#F59E0B' },
                { label: 'Upcoming', value: upcomingProjects.length, color: '#3B82F6' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <p style={{ color: s.color, fontSize: 16, fontWeight: 700 }}>{s.value}</p>
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <TabBar variant="underline" tabs={TABS.map(t => t.label)} active={TABS.find(t => t.key === tab)?.label || TABS[0].label}
          onChange={(label) => setTab(TABS.find(t => t.label === label)?.key || 'my_status')} />

        {/* Tab content */}
        {tab === 'my_status' && <MyStatusTab entries={myEntries} onSelect={setSelectedEntry} />}
        {tab === 'upcoming' && <UpcomingTab projects={upcomingProjects} onSelect={setSelectedProject} />}

        {/* Bottom spacer */}
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   My Status Tab
   ═══════════════════════════════════════════════════════════ */

function MyStatusTab({ entries, onSelect }: {
  entries: WhitelistEntry[];
  onSelect: (e: WhitelistEntry) => void;
}) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: c.surface2 }}>
          <Star size={40} color={c.text3} className="mx-auto mb-3" />
          <p style={{ color: c.text2, fontSize: 14 }}>Chưa có whitelist nào</p>
        </div>
      ) : (
        entries.map(entry => (
          <WhitelistEntryCard key={entry.id} entry={entry} onSelect={onSelect} />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Upcoming Tab
   ═══════════════════════════════════════════════════════════ */

function UpcomingTab({ projects, onSelect }: {
  projects: WhitelistProject[];
  onSelect: (p: WhitelistProject) => void;
}) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-3">
      {projects.map(project => (
        <UpcomingWhitelistCard key={project.projectId} project={project} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Whitelist Entry Card
   ═══════════════════════════════════════════════════════════ */

function WhitelistEntryCard({ entry, onSelect }: {
  entry: WhitelistEntry;
  onSelect: (e: WhitelistEntry) => void;
}) {
  const c = useThemeColors();
  const statusConfig = STATUS_CONFIG[entry.status];
  const tierConfig = entry.tier ? TIER_CONFIG[entry.tier] : null;

  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={() => onSelect(entry)}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: entry.projectLogoColor + '22', border: `2px solid ${entry.projectLogoColor}44`, color: entry.projectLogoColor }}>
            {entry.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{entry.projectName}</span>
              {tierConfig && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1"
                  style={{ background: tierConfig.color + '22', color: tierConfig.color }}>
                  <Award size={10} />
                  {tierConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <statusConfig.icon size={12} color={statusConfig.color} />
              <span style={{ color: statusConfig.color, fontSize: 11 }}>{statusConfig.label}</span>
            </div>
          </div>
          <ChevronRight size={18} color={c.text3} className="shrink-0 mt-2" />
        </div>

        {/* Allocation (if whitelisted) */}
        {entry.status === 'whitelisted' && (
          <div className="rounded-2xl p-3 mb-3" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: c.text3, fontSize: 11 }}>Max allocation</span>
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                ${entry.allocation.toLocaleString()}
              </span>
            </div>
            {entry.allocationUsed > 0 && (
              <>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: c.borderSolid }}>
                  <div className="h-full rounded-full" style={{
                    width: `${(entry.allocationUsed / entry.allocation) * 100}%`,
                    background: `linear-gradient(90deg, ${entry.projectLogoColor}, ${entry.projectLogoColor}99)`,
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: 10 }}>Used: ${entry.allocationUsed.toLocaleString()}</span>
                  <span style={{ color: c.text2, fontSize: 10 }}>
                    {((entry.allocationUsed / entry.allocation) * 100).toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Requirements */}
        <div className="flex flex-col gap-1.5">
          {entry.requirements.slice(0, 2).map(req => (
            <RequirementRow key={req.id} requirement={req} compact />
          ))}
          {entry.requirements.length > 2 && (
            <span style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
              +{entry.requirements.length - 2} more requirements
            </span>
          )}
        </div>

        {/* Dates */}
        {entry.registeredAt && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: c.borderSolid }}>
            <span style={{ color: c.text3, fontSize: 10 }}>Registered: {entry.registeredAt}</span>
            {entry.expiresAt && entry.status === 'whitelisted' && (
              <span style={{ color: '#F59E0B', fontSize: 10 }}>Expires: {entry.expiresAt}</span>
            )}
          </div>
        )}
      </button>
    </TrCard>
  );
}

/* ══════════════════════════════════════════════════════════��
   Upcoming Whitelist Card
   ═══════════════════════════════════════════════════════════ */

function UpcomingWhitelistCard({ project, onSelect }: {
  project: WhitelistProject;
  onSelect: (p: WhitelistProject) => void;
}) {
  const c = useThemeColors();
  const fillPercent = (project.filledSlots / project.totalSlots) * 100;
  const canApply = project.userStatus === 'can_apply';

  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={() => onSelect(project)}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: project.projectLogoColor + '22', border: `2px solid ${project.projectLogoColor}44`, color: project.projectLogoColor }}>
            {project.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{project.projectName}</span>
            <p style={{ color: c.text3, fontSize: 11 }}>{project.startDate} - {project.endDate}</p>
          </div>
          <ChevronRight size={18} color={c.text3} className="shrink-0 mt-2" />
        </div>

        {/* Slots progress */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span style={{ color: c.text3, fontSize: 11 }}>Slots filled</span>
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
              {project.filledSlots.toLocaleString()} / {project.totalSlots.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${Math.min(fillPercent, 100)}%`,
              background: fillPercent >= 90
                ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                : `linear-gradient(90deg, ${project.projectLogoColor}, ${project.projectLogoColor}99)`,
            }} />
          </div>
        </div>

        {/* Requirements */}
        <div className="flex flex-col gap-1.5">
          {project.requirements.map(req => (
            <RequirementRow key={req.id} requirement={req} compact />
          ))}
        </div>

        {/* Status badge */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: c.borderSolid }}>
          {canApply ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={14} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Bạn có thể apply</span>
            </div>
          ) : project.userStatus === 'pending' ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Clock size={14} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>Application pending</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(139,149,179,0.08)', border: '1px solid rgba(139,149,179,0.15)' }}>
              <XCircle size={14} color="#8B95B3" />
              <span style={{ color: c.text2, fontSize: 12 }}>Chưa đủ điều kiện</span>
            </div>
          )}
        </div>
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Requirement Row
   ═══════════════════════════════════════════════════════════ */

function RequirementRow({ requirement, compact = false }: {
  requirement: WhitelistRequirement;
  compact?: boolean;
}) {
  const c = useThemeColors();
  const Icon = REQUIREMENT_ICONS[requirement.type] || CheckCircle;
  const metColor = requirement.met ? '#10B981' : '#8B95B3';

  return (
    <div className="flex items-center gap-2">
      <Icon size={12} color={metColor} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <span style={{ color: requirement.met ? c.text1 : c.text3, fontSize: compact ? 11 : 12 }}>
          {requirement.label}
        </span>
        {!compact && requirement.details && (
          <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{requirement.details}</p>
        )}
      </div>
      {requirement.met ? (
        <CheckCircle size={14} color="#10B981" />
      ) : (
        <XCircle size={14} color="#8B95B3" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Whitelist Detail Sheet
   ═══════════════════════════════════════════════════════════ */

function WhitelistDetailSheet({ entry, onClose }: {
  entry: WhitelistEntry;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const statusConfig = STATUS_CONFIG[entry.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div className="relative w-full max-h-[85vh] rounded-t-3xl overflow-y-auto"
        style={{ background: c.bg, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 flex items-center justify-between"
          style={{ background: c.bg, borderBottom: `1px solid ${c.borderSolid}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold"
              style={{ background: entry.projectLogoColor + '22', color: entry.projectLogoColor }}>
              {entry.projectLogo}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{entry.projectName}</h3>
              <p style={{ color: c.text3, fontSize: 12 }}>Whitelist Status</p>
            </div>
          </div>
          <button onClick={onClose} className="hover-ghost" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <CheckCircle size={18} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Status */}
          <div className="rounded-2xl p-4 text-center" style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.color}33` }}>
            <statusConfig.icon size={32} color={statusConfig.color} className="mx-auto mb-2" />
            <p style={{ color: statusConfig.color, fontSize: 16, fontWeight: 700 }}>{statusConfig.label}</p>
          </div>

          {/* Requirements */}
          <PageSection label="Requirements" accentColor={entry.projectLogoColor}>
            <div className="flex flex-col gap-2">
              {entry.requirements.map(req => (
                <RequirementRow key={req.id} requirement={req} />
              ))}
            </div>
          </PageSection>

          {/* Info */}
          {entry.status === 'whitelisted' && (
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Info size={14} color="#10B981" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Bạn đã được whitelist với allocation tối đa ${entry.allocation.toLocaleString()}.
                {entry.expiresAt && ` Whitelist hết hạn vào ${entry.expiresAt}.`}
              </p>
            </div>
          )}

          {entry.status === 'pending' && (
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <AlertCircle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Application đang chờ xử lý. Hoàn thành tất cả requirements để tăng cơ hội được chấp nhận.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Project Whitelist Sheet
   ═══════════════════════════════════════════════════════════ */

function ProjectWhitelistSheet({ project, onClose }: {
  project: WhitelistProject;
  onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div className="relative w-full max-h-[85vh] rounded-t-3xl overflow-y-auto"
        style={{ background: c.bg, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 flex items-center justify-between"
          style={{ background: c.bg, borderBottom: `1px solid ${c.borderSolid}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold"
              style={{ background: project.projectLogoColor + '22', color: project.projectLogoColor }}>
              {project.projectLogo}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{project.projectName}</h3>
              <p style={{ color: c.text3, fontSize: 12 }}>Whitelist Application</p>
            </div>
          </div>
          <button onClick={onClose} className="hover-ghost" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <CheckCircle size={18} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Timeline */}
          <PageSection label="Timeline" accentColor={project.projectLogoColor}>
            <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: c.surface2 }}>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Start</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{project.startDate}</p>
              </div>
              <ChevronRight size={16} color={c.text3} />
              <div className="text-right">
                <p style={{ color: c.text3, fontSize: 10 }}>End</p>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{project.endDate}</p>
              </div>
            </div>
          </PageSection>

          {/* Requirements */}
          <PageSection label="Requirements" accentColor="#3B82F6">
            <div className="flex flex-col gap-2">
              {project.requirements.map(req => (
                <RequirementRow key={req.id} requirement={req} />
              ))}
            </div>
          </PageSection>

          {/* Apply CTA */}
          {project.userStatus === 'can_apply' && (
            <CTAButton>Apply for Whitelist</CTAButton>
          )}
        </div>
      </div>
    </div>
  );
}