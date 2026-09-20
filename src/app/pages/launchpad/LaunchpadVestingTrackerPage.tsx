/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadVestingTrackerPage — Token Vesting Schedule Tracker (Phase 4.11)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Features: Comprehensive vesting schedule tracker across all projects,
 *            unlock timeline, claim history, vesting progress charts,
 *            schedule types (linear/cliff/milestone), next unlock alerts
 */

import React, { useState, useMemo } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Clock, TrendingUp, CheckCircle, Lock, Unlock,
  ChevronRight, Calendar, ArrowRight, AlertCircle,
  Copy, Check, ExternalLink, Info,
} from 'lucide-react';
import {
  MOCK_VESTING_SCHEDULES, calculateVestingStats,
  type VestingSchedule, type VestingUnlock,
} from './launchpadData';

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'schedules', label: 'Lịch vesting' },
  { key: 'timeline', label: 'Timeline' },
];

const SCHEDULE_TYPE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  linear: { label: 'Linear', color: '#3B82F6', desc: 'Mở khóa đều theo tháng' },
  cliff: { label: 'Cliff', color: '#F59E0B', desc: 'Khóa đến cliff date' },
  milestone: { label: 'Milestone', color: '#10B981', desc: 'Mở khóa theo milestone' },
  custom: { label: 'Custom', color: '#8B5CF6', desc: 'Lịch riêng custom' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10B981' },
  completed: { label: 'Completed', color: '#8B95B3' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
  paused: { label: 'Paused', color: '#F59E0B' },
};

export function LaunchpadVestingTrackerPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState('overview');
  const [selectedSchedule, setSelectedSchedule] = useState<VestingSchedule | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const schedules = MOCK_VESTING_SCHEDULES;
  const stats = useMemo(() => calculateVestingStats(schedules), [schedules]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <PageLayout>
      <Header title="Vesting Tracker" back />

      {/* Schedule detail sheet */}
      {selectedSchedule && (
        <ScheduleDetailSheet
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onCopy={handleCopy}
          copiedField={copiedField}
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
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Clock size={22} color="#6366F1" />
              </div>
              <div>
                <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Vesting Tracker</h2>
                <p style={{ color: c.text3, fontSize: 12 }}>Theo dõi lịch mở khóa token</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Du an', value: stats.totalProjects, color: '#6366F1' },
                { label: 'Active', value: stats.activeSchedules, color: '#10B981' },
                { label: 'Vested', value: stats.totalTokensVested + ' tokens', color: '#3B82F6' },
                { label: 'Claimed', value: stats.totalTokensClaimed + ' tokens', color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {stats.nextUnlock.projects > 0 && (
              <div className="mt-3 rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Calendar size={16} color="#F59E0B" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>Next unlock: {stats.nextUnlock.date}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>~{stats.nextUnlock.amount} tokens · {stats.nextUnlock.projects} projects</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <TabBar variant="underline" tabs={TABS.map(t => t.label)} active={TABS.find(t => t.key === tab)?.label || TABS[0].label}
          onChange={(label) => setTab(TABS.find(t => t.label === label)?.key || 'overview')} />

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab schedules={schedules} onSelect={setSelectedSchedule} />}
        {tab === 'schedules' && <SchedulesTab schedules={schedules} onSelect={setSelectedSchedule} />}
        {tab === 'timeline' && <TimelineTab schedules={schedules} />}

        {/* Bottom spacer */}
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════════════════════ */

function OverviewTab({ schedules, onSelect }: {
  schedules: VestingSchedule[];
  onSelect: (s: VestingSchedule) => void;
}) {
  const c = useThemeColors();
  const activeSchedules = schedules.filter(s => s.status === 'active');

  return (
    <div className="flex flex-col gap-4">
      {activeSchedules.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: c.surface2 }}>
          <Clock size={40} color={c.text3} className="mx-auto mb-3" />
          <p style={{ color: c.text2, fontSize: 14 }}>Không có vesting schedule nào đang active</p>
        </div>
      ) : (
        activeSchedules.map(schedule => (
          <VestingScheduleCard key={schedule.id} schedule={schedule} onSelect={onSelect} />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Schedules Tab
   ═══════════════════════════════════════════════════════════ */

function SchedulesTab({ schedules, onSelect }: {
  schedules: VestingSchedule[];
  onSelect: (s: VestingSchedule) => void;
}) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = filter === 'all' ? schedules : schedules.filter(s =>
    filter === 'active' ? s.status === 'active' : s.status === 'completed'
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFilter(f.key as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? c.primary : c.surface2,
              color: filter === f.key ? '#fff' : c.text2,
              border: `1px solid ${filter === f.key ? c.primary : c.borderSolid}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.map(schedule => (
        <VestingScheduleCard key={schedule.id} schedule={schedule} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Timeline Tab
   ═══════════════════════════════════════════════════════════ */

function TimelineTab({ schedules }: { schedules: VestingSchedule[] }) {
  const c = useThemeColors();
  const activeSchedules = schedules.filter(s => s.status === 'active');

  // Collect all unlocks across all schedules
  const allUnlocks = activeSchedules.flatMap(schedule =>
    schedule.unlocks.map(unlock => ({ schedule, unlock }))
  ).sort((a, b) => new Date(a.unlock.date).getTime() - new Date(b.unlock.date).getTime());

  return (
    <div className="flex flex-col gap-3">
      {allUnlocks.map(({ schedule, unlock }, idx) => {
        const statusConfig = unlock.status === 'claimed'
          ? { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.08)' }
          : unlock.status === 'unlocked'
            ? { icon: Unlock, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' }
            : { icon: Lock, color: '#8B95B3', bg: 'rgba(139,149,179,0.08)' };

        return (
          <div key={`${schedule.id}-${unlock.id}`} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: statusConfig.bg, border: `2px solid ${statusConfig.color}` }}>
                <statusConfig.icon size={14} color={statusConfig.color} />
              </div>
              {idx < allUnlocks.length - 1 && (
                <div className="w-0.5 flex-1 mt-1" style={{ background: c.borderSolid, minHeight: 24 }} />
              )}
            </div>

            {/* Unlock card */}
            <div className="flex-1 pb-4">
              <div className="rounded-2xl p-3" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: schedule.projectLogoColor + '22', color: schedule.projectLogoColor }}>
                      {schedule.projectLogo}
                    </div>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{schedule.projectSymbol}</span>
                  </div>
                  <span style={{ color: c.text3, fontSize: 11 }}>{unlock.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                      {unlock.tokenAmount.toLocaleString()} tokens
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{unlock.percentage}% · {unlock.milestone || 'Scheduled unlock'}</p>
                  </div>
                  {unlock.claimedAt && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                      Claimed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vesting Schedule Card
   ═══════════════════════════════════════════════════════════ */

function VestingScheduleCard({ schedule, onSelect }: {
  schedule: VestingSchedule;
  onSelect: (s: VestingSchedule) => void;
}) {
  const c = useThemeColors();
  const scheduleType = SCHEDULE_TYPE_LABELS[schedule.scheduleType];
  const statusConfig = STATUS_CONFIG[schedule.status];

  return (
    <TrCard overflow hover>
      <button className="w-full text-left p-4" onClick={() => onSelect(schedule)}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
            style={{ background: schedule.projectLogoColor + '22', border: `2px solid ${schedule.projectLogoColor}44`, color: schedule.projectLogoColor }}>
            {schedule.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{schedule.projectName}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{ background: scheduleType.bg, color: scheduleType.color }}>
                {scheduleType.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig.color }} />
              <span style={{ color: statusConfig.color, fontSize: 11 }}>{statusConfig.label}</span>
              <span style={{ color: c.text3, fontSize: 11 }}>· {schedule.chain}</span>
            </div>
          </div>
          <ChevronRight size={18} color={c.text3} className="shrink-0 mt-2" />
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span style={{ color: c.text3, fontSize: 11 }}>Vesting progress</span>
            <span style={{ color: schedule.vestingProgress === 100 ? '#10B981' : c.text1, fontSize: 11, fontWeight: 600 }}>
              {schedule.vestingProgress}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${schedule.vestingProgress}%`,
                background: schedule.vestingProgress === 100
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : `linear-gradient(90deg, ${schedule.projectLogoColor}, ${schedule.projectLogoColor}99)`,
              }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Total', value: schedule.totalTokens.toLocaleString() },
            { label: 'Claimed', value: schedule.claimedTokens.toLocaleString() },
            { label: 'Vested', value: schedule.vestedTokens.toLocaleString() },
            { label: 'Locked', value: schedule.lockedTokens.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Next unlock */}
        {schedule.status === 'active' && schedule.nextUnlockDate !== '—' && (
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)' }}>
            <Calendar size={12} color="#F59E0B" />
            <span style={{ color: c.text2, fontSize: 11 }}>Next unlock: <strong>{schedule.nextUnlockDate}</strong> · {schedule.nextUnlockAmount.toLocaleString()} tokens</span>
          </div>
        )}
      </button>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Schedule Detail Sheet
   ═══════════════════════════════════════════════════════════ */

function ScheduleDetailSheet({ schedule, onClose, onCopy, copiedField }: {
  schedule: VestingSchedule;
  onClose: () => void;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}) {
  const c = useThemeColors();
  const scheduleType = SCHEDULE_TYPE_LABELS[schedule.scheduleType];

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
              style={{ background: schedule.projectLogoColor + '22', color: schedule.projectLogoColor }}>
              {schedule.projectLogo}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{schedule.projectName}</h3>
              <p style={{ color: c.text3, fontSize: 12 }}>{scheduleType.label} Vesting</p>
            </div>
          </div>
          <button onClick={onClose} className="hover-ghost" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <CheckCircle size={18} color={c.text3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Contract info */}
          <PageSection label="Contract Details" accentColor={schedule.projectLogoColor}>
            <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: 11 }}>Token Address</span>
                <button onClick={() => onCopy(schedule.tokenAddress, 'token')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:opacity-80"
                  style={{ background: c.chipBg }}>
                  {copiedField === 'token' ? <Check size={12} color="#10B981" /> : <Copy size={12} color={c.text2} />}
                  <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                    {schedule.tokenAddress.slice(0, 6)}...{schedule.tokenAddress.slice(-4)}
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: 11 }}>Chain</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                  style={{ background: schedule.chainColor + '15', color: schedule.chainColor }}>
                  {schedule.chain}
                </span>
              </div>
            </div>
          </PageSection>

          {/* Unlock schedule */}
          <PageSection label="Unlock Schedule" accentColor="#6366F1">
            <div className="flex flex-col gap-2">
              {schedule.unlocks.map((unlock, idx) => (
                <UnlockRow key={unlock.id} unlock={unlock} schedule={schedule} isLast={idx === schedule.unlocks.length - 1} />
              ))}
            </div>
          </PageSection>

          {/* Info */}
          <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              {scheduleType.desc}. Vesting schedule bắt đầu {schedule.startDate} và kết thúc {schedule.endDate}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnlockRow({ unlock, schedule, isLast }: { unlock: VestingUnlock; schedule: VestingSchedule; isLast: boolean }) {
  const c = useThemeColors();
  const statusConfig = unlock.status === 'claimed'
    ? { icon: CheckCircle, color: '#10B981', label: 'Claimed' }
    : unlock.status === 'unlocked'
      ? { icon: Unlock, color: '#3B82F6', label: 'Claimable' }
      : { icon: Lock, color: '#8B95B3', label: 'Locked' };

  return (
    <div className="flex gap-2">
      {/* Status icon */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: statusConfig.color + '15', border: `2px solid ${statusConfig.color}` }}>
          <statusConfig.icon size={12} color={statusConfig.color} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ background: c.borderSolid, minHeight: 16 }} />}
      </div>

      {/* Unlock card */}
      <div className="flex-1 pb-2">
        <div className="rounded-xl p-2.5" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              {unlock.tokenAmount.toLocaleString()} {schedule.projectSymbol}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
              style={{ background: statusConfig.color + '15', color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: 11 }}>{unlock.date} · {unlock.percentage}%</span>
            {unlock.milestone && (
              <span style={{ color: c.text2, fontSize: 10, fontStyle: 'italic' }}>{unlock.milestone}</span>
            )}
          </div>
          {unlock.claimedAt && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: c.borderSolid }}>
              <span style={{ color: c.text3, fontSize: 10 }}>Claimed: {unlock.claimedAt}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}