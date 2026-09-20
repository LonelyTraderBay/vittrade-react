/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionEventCalendarPage — Prediction Markets Feature 4/4
 * ══════════════════════════════════════════════════════════════
 *  Event calendar: timeline view, filter by category/date,
 *  notification settings, quick access to event details
 *  Pattern B — Page with Tabs (Calendar/Upcoming/Notifications)
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Calendar, Clock, Bell, Filter, TrendingUp, AlertCircle,
  ChevronRight, Star, CheckCircle, Info,
} from 'lucide-react';

const TABS = ['Lich', 'Sap toi', 'Thong bao'] as const;
type Tab = typeof TABS[number];

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  resolutionDate: Date;
  status: 'active' | 'upcoming' | 'resolving' | 'resolved';
  probability: number;
  volume: number;
  isWatching: boolean;
  notifyBefore?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'ev1',
    title: 'BTC > $100K by Dec 2026?',
    category: 'Crypto',
    resolutionDate: new Date('2026-12-31'),
    status: 'active',
    probability: 68,
    volume: 2340000,
    isWatching: true,
    notifyBefore: '1 week',
  },
  {
    id: 'ev2',
    title: 'ETH merge to PoS in 2025?',
    category: 'Crypto',
    resolutionDate: new Date('2025-12-31'),
    status: 'active',
    probability: 75,
    volume: 1890000,
    isWatching: true,
    notifyBefore: '1 day',
  },
  {
    id: 'ev3',
    title: 'US Election 2024 - Candidate A wins?',
    category: 'Politics',
    resolutionDate: new Date('2024-11-05'),
    status: 'upcoming',
    probability: 42,
    volume: 5600000,
    isWatching: false,
  },
  {
    id: 'ev4',
    title: 'AI beats human in chess 2025?',
    category: 'Tech',
    resolutionDate: new Date('2025-06-30'),
    status: 'resolving',
    probability: 88,
    volume: 890000,
    isWatching: true,
    notifyBefore: '1 hour',
  },
  {
    id: 'ev5',
    title: 'Global GDP growth > 3% in 2025?',
    category: 'Macro',
    resolutionDate: new Date('2025-03-31'),
    status: 'resolved',
    probability: 52,
    volume: 1200000,
    isWatching: false,
  },
  {
    id: 'ev6',
    title: 'SpaceX Mars landing in 2026?',
    category: 'Tech',
    resolutionDate: new Date('2026-12-31'),
    status: 'active',
    probability: 35,
    volume: 3400000,
    isWatching: true,
    notifyBefore: '1 week',
  },
];

export function PredictionEventCalendarPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<Tab>('Lich');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const categories = Array.from(new Set(MOCK_EVENTS.map(e => e.category)));

  const filteredEvents = selectedCategory
    ? MOCK_EVENTS.filter(e => e.category === selectedCategory)
    : MOCK_EVENTS;

  const upcomingEvents = filteredEvents
    .filter(e => e.status === 'active' || e.status === 'upcoming')
    .sort((a, b) => a.resolutionDate.getTime() - b.resolutionDate.getTime());

  const watchingEvents = MOCK_EVENTS.filter(e => e.isWatching);

  // Group events by month
  const eventsByMonth = new Map<string, CalendarEvent[]>();
  filteredEvents.forEach(event => {
    const monthKey = event.resolutionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const existing = eventsByMonth.get(monthKey) || [];
    eventsByMonth.set(monthKey, [...existing, event]);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return c.buy;
      case 'upcoming': return c.warn;
      case 'resolving': return c.primary;
      case 'resolved': return '#6B7280';
      default: return c.text3;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'rgba(16,185,129,0.08)';
      case 'upcoming': return 'rgba(245,158,11,0.08)';
      case 'resolving': return 'rgba(59,130,246,0.08)';
      case 'resolved': return 'rgba(107,114,128,0.08)';
      default: return c.bg;
    }
  };

  const getDaysUntil = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Đã qua';
    if (days === 0) return 'Hôm nay';
    if (days === 1) return '1 ngày';
    if (days < 30) return `${days} ngày`;
    const months = Math.floor(days / 30);
    return `${months} tháng`;
  };

  return (
    <PageLayout>
      <Header
        title="Event Calendar"
        back
        action={{
          icon: Filter,
          onClick: () => setShowFilter(!showFilter),
        }}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Category Filter */}
        {showFilter && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: !selectedCategory ? c.primary : c.bg,
                color: !selectedCategory ? '#fff' : c.text1,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${!selectedCategory ? 'transparent' : c.border}`,
              }}
            >
              Tat ca
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: selectedCategory === cat ? c.primary : c.bg,
                  color: selectedCategory === cat ? '#fff' : c.text1,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${selectedCategory === cat ? 'transparent' : c.border}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {tab === 'Lich' && (
          <>
            {/* Stats Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>
                    {filteredEvents.length}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Watching</p>
                  <p style={{ color: c.primary, fontSize: 20, fontWeight: 700 }}>
                    {watchingEvents.length}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>This Month</p>
                  <p style={{ color: c.buy, fontSize: 20, fontWeight: 700 }}>
                    {filteredEvents.filter(e => {
                      const now = new Date();
                      return e.resolutionDate.getMonth() === now.getMonth() &&
                        e.resolutionDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Events by Month */}
            {Array.from(eventsByMonth.entries()).map(([month, events]) => (
              <PageSection key={month} label={month}>
                <div className="space-y-2">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => navigate(`${prefix}/predictions/event/${event.id}`)}
                      className="w-full rounded-2xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {event.isWatching && <Star size={14} color={c.warn} fill={c.warn} />}
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                            {event.title}
                          </p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{
                            background: getStatusBg(event.status),
                            color: getStatusColor(event.status),
                          }}
                        >
                          {event.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Resolution</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                            {event.resolutionDate.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Probability</p>
                          <p style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
                            {event.probability}%
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Volume</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                            ${(event.volume / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} color={c.text3} />
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            {getDaysUntil(event.resolutionDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px]"
                            style={{ background: c.chipBg, color: c.chipText }}
                          >
                            {event.category}
                          </span>
                          <ChevronRight size={14} color={c.text3} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </PageSection>
            ))}
          </>
        )}

        {tab === 'Sap toi' && (
          <>
            <PageSection label="Su kien sap dien ra">
              {upcomingEvents.slice(0, 10).map((event) => {
                const daysUntil = Math.floor(
                  (event.resolutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysUntil <= 7 && daysUntil >= 0;
                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`${prefix}/predictions/event/${event.id}`)}
                    className="w-full rounded-2xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
                    style={{
                      background: isUrgent ? 'rgba(245,158,11,0.06)' : c.surface,
                      border: `1px solid ${isUrgent ? 'rgba(245,158,11,0.15)' : c.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {isUrgent && <AlertCircle size={14} color={c.warn} />}
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          {event.title}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Resolution Date</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {event.resolutionDate.toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Time Until</p>
                        <p
                          style={{
                            color: isUrgent ? c.warn : c.text1,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {getDaysUntil(event.resolutionDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded-lg text-[10px]"
                        style={{ background: c.chipBg, color: c.chipText }}
                      >
                        {event.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
                          {event.probability}%
                        </p>
                        <ChevronRight size={14} color={c.text3} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </PageSection>
          </>
        )}

        {tab === 'Thong bao' && (
          <>
            {/* Notification Settings */}
            <PageSection label="Cai dat thong bao">
              <div
                className="rounded-2xl p-4"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="space-y-3">
                  {[
                    { label: 'Resolution Reminder', desc: 'Thong bao truoc khi su kien chot ket qua' },
                    { label: 'Price Alert', desc: 'Canh bao khi xac suat thay doi lon' },
                    { label: 'New Events', desc: 'Thong bao su kien moi theo danh muc quan tam' },
                  ].map((setting, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: idx < 2 ? `1px solid ${c.border}` : 'none' }}
                    >
                      <div>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{setting.label}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>{setting.desc}</p>
                      </div>
                      <button
                        className="relative"
                        style={{ width: 48, height: 28, borderRadius: 14, background: c.primary }}
                      >
                        <div
                          className="absolute top-1 transition-all"
                          style={{
                            left: 22,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            background: '#fff',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>

            {/* Watching Events */}
            <PageSection label="Dang theo doi">
              {watchingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl p-4"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={14} color={c.warn} fill={c.warn} />
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                          {event.title}
                        </p>
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>{event.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Resolution</p>
                      <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {event.resolutionDate.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Notify Before</p>
                      <p style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
                        {event.notifyBefore || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full rounded-xl py-2 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text1,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Bell size={14} />
                    Chinh sua thong bao
                  </button>
                </div>
              ))}
            </PageSection>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color={c.primary} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Thong bao giup ban khong bo lo su kien quan trong. Ban se nhan canh bao qua app va email.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}