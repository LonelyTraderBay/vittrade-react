/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET CALENDAR PAGE — P1 Crypto Events & Unlocks
 * ══════════════════════════════════════════════════════════════════
 *  Upcoming events: token unlocks, upgrades, airdrops, listings,
 *  burns, conferences, macro reports. Route: /markets/calendar
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { MARKET_EVENTS, EVENT_TYPE_CONFIG, IMPACT_CONFIG, type MarketEvent } from '../../data/marketP1Data';

const VIEW_TABS = ['Danh sách', 'Lịch'];
const TYPE_FILTERS = ['Tất cả', 'Token Unlock', 'Nâng cấp', 'Airdrop', 'Đốt token', 'Niêm yết', 'Báo cáo', 'Hội nghị'];
const TYPE_FILTER_MAP: Record<string, MarketEvent['type'] | null> = {
  'Tất cả': null,
  'Token Unlock': 'unlock',
  'Nâng cấp': 'upgrade',
  'Airdrop': 'airdrop',
  'Đốt token': 'burn',
  'Niêm yết': 'listing',
  'Báo cáo': 'report',
  'Hội nghị': 'conference',
};

function parseDate(dateStr: string) {
  return new Date(dateStr);
}

function formatEventDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatEventTime(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} UTC`;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date('2026-03-11T12:00:00Z');
  const d = parseDate(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getRelativeLabel(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} ngày trước`;
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  return `${days} ngày nữa`;
}

// Group events by date
function groupByDate(events: MarketEvent[]): { date: string; label: string; events: MarketEvent[] }[] {
  const groups: Record<string, MarketEvent[]> = {};
  for (const ev of events) {
    const dateKey = parseDate(ev.date).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(ev);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, evs]) => ({
      date: dateKey,
      label: formatEventDate(evs[0].date),
      events: evs.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
    }));
}

export function MarketCalendarPage() {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const [view, setView] = useState('Danh sách');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [impactFilter, setImpactFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    let items = [...MARKET_EVENTS];
    const typeKey = TYPE_FILTER_MAP[typeFilter];
    if (typeKey) items = items.filter(e => e.type === typeKey);
    if (impactFilter) items = items.filter(e => e.impact === impactFilter);
    return items.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  }, [typeFilter, impactFilter]);

  const grouped = useMemo(() => groupByDate(filteredEvents), [filteredEvents]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const days: { day: number; events: MarketEvent[] }[] = [];
    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-03-${d.toString().padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => parseDate(e.date).toISOString().split('T')[0] === dateStr);
      days.push({ day: d, events: dayEvents });
    }
    return days;
  }, [filteredEvents]);

  // Stats
  const stats = useMemo(() => {
    const upcoming = MARKET_EVENTS.filter(e => getDaysUntil(e.date) >= 0);
    const highImpact = upcoming.filter(e => e.impact === 'high');
    const thisWeek = upcoming.filter(e => getDaysUntil(e.date) <= 7);
    return { total: upcoming.length, highImpact: highImpact.length, thisWeek: thisWeek.length };
  }, []);

  return (
    <PageLayout>
      <Header title="Lịch sự kiện" back />
      <TabBar tabs={VIEW_TABS} active={view} onChange={setView} />

      <PageContent gap="default">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Sắp diễn ra" value={stats.total} color="#3B82F6" c={c} />
          <MiniStat label="Tác động cao" value={stats.highImpact} color="#EF4444" c={c} />
          <MiniStat label="Tuần này" value={stats.thisWeek} color="#10B981" c={c} />
        </div>

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setTypeFilter(f); hapticSelection(); }}
              className="shrink-0 px-3 py-2 rounded-xl min-h-9"
              style={{
                background: typeFilter === f ? c.chipActiveBg : c.surface2,
                color: typeFilter === f ? c.chipActiveText : c.text3,
                border: `1px solid ${typeFilter === f ? c.chipActiveBorder : 'transparent'}`,
                fontSize: FONT_SCALE.xs,
                fontWeight: FONT_WEIGHT.medium,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Impact filter */}
        <div className="flex gap-2">
          {(['high', 'medium', 'low'] as const).map(imp => {
            const cfg = IMPACT_CONFIG[imp];
            const isActive = impactFilter === imp;
            return (
              <button
                key={imp}
                onClick={() => { setImpactFilter(isActive ? null : imp); hapticSelection(); }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg"
                style={{
                  background: isActive ? `${cfg.color}18` : 'transparent',
                  border: `1px solid ${isActive ? `${cfg.color}40` : c.borderSolid}`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                <span style={{
                  color: isActive ? cfg.color : c.text3,
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.medium,
                }}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* List view */}
        {view === 'Danh sách' && (
          <div className="flex flex-col" style={{ gap: 16 }}>
            {grouped.map(group => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2">
                  <span style={{
                    color: c.text1,
                    fontSize: FONT_SCALE.sm,
                    fontWeight: FONT_WEIGHT.bold,
                  }}>
                    {group.label}
                  </span>
                  <span style={{
                    color: c.text3,
                    fontSize: FONT_SCALE.micro,
                  }}>
                    {getRelativeLabel(group.events[0].date)}
                  </span>
                </div>

                <div className="flex flex-col" style={{ gap: 4 }}>
                  {group.events.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      expanded={expandedId === ev.id}
                      onToggle={() => { setExpandedId(expandedId === ev.id ? null : ev.id); hapticSelection(); }}
                      c={c}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar view */}
        {view === 'Lịch' && (
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                Tháng 3, 2026
              </span>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} className="text-center">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                    {d}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar grid — March 2026 starts on Sunday */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ day, events: dayEvents }) => {
                const isToday = day === 11;
                const hasEvents = dayEvents.length > 0;
                const hasHighImpact = dayEvents.some(e => e.impact === 'high');
                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (hasEvents) {
                        setExpandedId(dayEvents[0].id);
                        setView('Danh sách');
                        hapticSelection();
                      }
                    }}
                    className="flex flex-col items-center justify-center rounded-xl py-2"
                    style={{
                      background: isToday ? 'rgba(59,130,246,0.12)' : hasEvents ? `${c.surface2}` : 'transparent',
                      border: isToday ? '1.5px solid rgba(59,130,246,0.3)' : '1.5px solid transparent',
                      minHeight: 44,
                    }}
                  >
                    <span style={{
                      color: isToday ? '#3B82F6' : c.text1,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: isToday ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                    }}>
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{ background: hasHighImpact ? '#EF4444' : EVENT_TYPE_CONFIG[ev.type].color }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: `1px solid ${c.borderSolid}` }}>
              {Object.entries(EVENT_TYPE_CONFIG).slice(0, 5).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </TrCard>
        )}

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar size={40} color={c.text3} style={{ opacity: 0.3 }} />
            <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, marginTop: 12 }}>
              Không có sự kiện phù hợp
            </p>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

/* ─── Sub-components ─── */

function MiniStat({ label, value, color, c }: {
  label: string; value: number; color: string;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TrCard className="p-3 text-center">
      <p style={{ color, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
        {value}
      </p>
      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>
        {label}
      </p>
    </TrCard>
  );
}

function EventCard({ event, expanded, onToggle, c }: {
  event: MarketEvent;
  expanded: boolean;
  onToggle: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const typeCfg = EVENT_TYPE_CONFIG[event.type];
  const impactCfg = IMPACT_CONFIG[event.impact];
  const daysUntil = getDaysUntil(event.date);
  const isPast = daysUntil < 0;

  return (
    <TrCard
      className="overflow-hidden"
      accentBorder={event.impact === 'high' ? `${impactCfg.color}25` : undefined}
    >
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${typeCfg.color}12` }}
          >
            <span style={{ fontSize: 16 }}>{typeCfg.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {event.symbol && (
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    background: `${event.symbolColor}15`,
                    color: event.symbolColor,
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {event.symbol}
                </span>
              )}
              <span
                className="px-1.5 py-0.5 rounded"
                style={{
                  background: `${typeCfg.color}12`,
                  color: typeCfg.color,
                  fontSize: 10,
                  fontWeight: FONT_WEIGHT.semibold,
                }}
              >
                {typeCfg.label}
              </span>
            </div>

            <p style={{
              color: isPast ? c.text3 : c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              lineHeight: 1.3,
            }}>
              {event.titleVi}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Clock size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                {formatEventTime(event.date)}
              </span>
              <span style={{ fontSize: FONT_SCALE.micro, color: impactCfg.color, fontWeight: FONT_WEIGHT.medium }}>
                • {impactCfg.label}
              </span>
              {!event.confirmed && (
                <span style={{ fontSize: FONT_SCALE.micro, color: '#F59E0B' }}>
                  • Chưa xác nhận
                </span>
              )}
            </div>
          </div>

          {/* Days countdown */}
          <div className="text-right shrink-0">
            <p style={{
              color: daysUntil <= 1 ? '#EF4444' : daysUntil <= 3 ? '#F59E0B' : c.text2,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.bold,
            }}>
              {daysUntil === 0 ? 'Hôm nay' : daysUntil > 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d trước`}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-3"
          style={{ borderTop: `1px solid ${c.borderSolid}` }}
        >
          <p style={{
            color: c.text2,
            fontSize: FONT_SCALE.xs,
            lineHeight: 1.5,
            paddingTop: 12,
          }}>
            {event.description}
          </p>
          {event.source && (
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 8 }}>
              Nguồn: {event.source}
            </p>
          )}
        </div>
      )}
    </TrCard>
  );
}