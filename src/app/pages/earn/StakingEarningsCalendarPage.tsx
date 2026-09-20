import React, { useState } from 'react';
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Clock, DollarSign, Bell, BellOff, Download } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd, fmtAmount } from '../../data/formatNumber';

type EventType = 'daily-reward' | 'maturity' | 'auto-compound' | 'rate-change';

interface CalendarEvent {
  id: string;
  date: string;
  type: EventType;
  product: string;
  asset: string;
  amount?: number;
  usdValue?: number;
  newRate?: number;
  oldRate?: number;
  color: string;
  description: string;
}

const EVENTS: CalendarEvent[] = [
  { id: 'e1', date: '2026-03-07', type: 'daily-reward', product: 'USDT Flexible', asset: 'USDT', amount: 0.45, usdValue: 0.45, color: '#26A17B', description: 'Nhận lãi hàng ngày' },
  { id: 'e2', date: '2026-03-08', type: 'daily-reward', product: 'USDT Flexible', asset: 'USDT', amount: 0.45, usdValue: 0.45, color: '#26A17B', description: 'Nhận lãi hàng ngày' },
  { id: 'e3', date: '2026-03-09', type: 'daily-reward', product: 'USDT Flexible', asset: 'USDT', amount: 0.45, usdValue: 0.45, color: '#26A17B', description: 'Nhận lãi hàng ngày' },
  { id: 'e4', date: '2026-03-10', type: 'auto-compound', product: 'USDT Flexible', asset: 'USDT', amount: 3.15, usdValue: 3.15, color: '#8B5CF6', description: 'Tái đầu tư tự động (hàng tuần)' },
  { id: 'e5', date: '2026-03-15', type: 'maturity', product: 'SOL Fixed 30D', asset: 'SOL', amount: 51.2, usdValue: 6656, color: '#9945FF', description: 'Đến hạn - Nhận vốn + lãi' },
  { id: 'e6', date: '2026-03-21', type: 'maturity', product: 'ETH Fixed 60D', asset: 'ETH', amount: 1.535, usdValue: 4298, color: '#627EEA', description: 'Đến hạn - Nhận vốn + lãi' },
  { id: 'e7', date: '2026-03-25', type: 'rate-change', product: 'USDT Flexible', asset: 'USDT', newRate: 7.0, oldRate: 6.5, color: '#F59E0B', description: 'Thay đổi APY: 6.5% → 7.0%' },
  { id: 'e8', date: '2026-04-01', type: 'maturity', product: 'BTC Fixed 90D', asset: 'BTC', amount: 0.05029, usdValue: 3396.58, color: '#F7931A', description: 'Đến hạn - Nhận vốn + lãi' },
  { id: 'e9', date: '2026-03-14', type: 'daily-reward', product: 'ETH-USDT LP', asset: 'LP', amount: 0.52, usdValue: 0.52, color: '#06B6D4', description: 'Nhận lãi DeFi pool' },
  { id: 'e10', date: '2026-03-17', type: 'auto-compound', product: 'USDT Flexible', asset: 'USDT', amount: 3.60, usdValue: 3.60, color: '#8B5CF6', description: 'Tái đầu tư tự động (hàng tuần)' },
];

const EVENT_TYPE_CONFIG = {
  'daily-reward': { label: 'Nhận lãi', icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'maturity': { label: 'Đến hạn', icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'auto-compound': { label: 'Tái đầu tư', icon: ChevronRight, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  'rate-change': { label: 'Thay đổi APY', icon: ChevronRight, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

export function StakingEarningsCalendarPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 7)); // March 7, 2026
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return EVENTS.filter(e => e.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date(2026, 2, 7);
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleExportCalendar = () => {
    alert('Xuất lịch nhận lãi (.ics) sẽ sớm ra mắt. Bạn có thể thêm vào Google Calendar / Apple Calendar.');
  };

  const upcomingEvents = EVENTS.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date(2026, 2, 7);
    return eventDate >= today;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10);

  const totalUpcomingValue = upcomingEvents.reduce((sum, e) => sum + (e.usdValue || 0), 0);

  return (
    <PageLayout>
      <Header title="Lịch nhận lãi" back />

      <PageContent>
        {/* Summary */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                Sắp nhận (30 ngày tới)
              </p>
              <p style={{ color: '#10B981', fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtUsd(totalUpcomingValue)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: notificationsEnabled ? 'rgba(16,185,129,0.12)' : c.surface2,
                  border: `1px solid ${notificationsEnabled ? 'rgba(16,185,129,0.3)' : c.borderSolid}`,
                }}>
                {notificationsEnabled ? (
                  <Bell size={18} color="#10B981" />
                ) : (
                  <BellOff size={18} color={c.text3} />
                )}
              </button>
              <button
                onClick={handleExportCalendar}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <Download size={18} color={c.text1} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 11 }}>
              {upcomingEvents.length} sự kiện sắp tới
              {notificationsEnabled && ' • Nhận thông báo trước 24h'}
            </p>
          </div>
        </TrCard>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'calendar', label: 'Lịch' },
            { id: 'list', label: 'Danh sách' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'calendar' && (
          <>
            {/* Month Navigator */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={goToPrevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <ChevronLeft size={20} color={c.text1} />
                </button>
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </p>
                <button onClick={goToNextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <ChevronRight size={20} color={c.text1} />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                  <div key={day} className="text-center">
                    <p style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>{day}</p>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => <div key={`blank-${i}`} />)}
                {days.map(day => {
                  const events = getEventsForDate(day);
                  const hasEvents = events.length > 0;
                  const today = isToday(day);
                  
                  return (
                    <button
                      key={day}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                      style={{
                        background: today ? 'rgba(59,130,246,0.12)' : hasEvents ? c.surface2 : 'transparent',
                        border: `1px solid ${today ? '#3B82F6' : hasEvents ? c.borderSolid : 'transparent'}`,
                      }}>
                      <p style={{
                        color: today ? '#3B82F6' : c.text1,
                        fontSize: 13,
                        fontWeight: today ? 700 : 500,
                      }}>
                        {day}
                      </p>
                      {hasEvents && (
                        <div className="flex gap-0.5 mt-1">
                          {events.slice(0, 3).map((e, idx) => (
                            <div
                              key={idx}
                              className="w-1 h-1 rounded-full"
                              style={{ background: e.color }}
                            />
                          ))}
                          {events.length > 3 && (
                            <p style={{ color: c.text3, fontSize: 8 }}>+{events.length - 3}</p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </TrCard>

            {/* Legend */}
            <TrCard className="p-3">
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>Loại sự kiện:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: config.color }} />
                    <p style={{ color: c.text3, fontSize: 11 }}>{config.label}</p>
                  </div>
                ))}
              </div>
            </TrCard>
          </>
        )}

        {tab === 'list' && (
          <PageSection label="Sự kiện sắp tới">
            {upcomingEvents.length === 0 ? (
              <TrCard className="p-8">
                <div className="flex flex-col items-center gap-3">
                  <CalendarIcon size={48} color={c.text3} />
                  <p style={{ color: c.text3, fontSize: 14, textAlign: 'center' }}>
                    Không có sự kiện nào
                  </p>
                </div>
              </TrCard>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingEvents.map(event => {
                  const config = EVENT_TYPE_CONFIG[event.type];
                  const Icon = config.icon;
                  const eventDate = new Date(event.date);
                  const daysUntil = Math.ceil((eventDate.getTime() - new Date(2026, 2, 7).getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <TrCard key={event.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: config.bg }}>
                          <Icon size={18} color={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }} className="text-truncate">
                              {config.label}
                            </p>
                            {daysUntil === 0 && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                                Hôm nay
                              </span>
                            )}
                            {daysUntil === 1 && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                                Ngày mai
                              </span>
                            )}
                            {daysUntil > 1 && daysUntil <= 7 && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                                {daysUntil} ngày nữa
                              </span>
                            )}
                          </div>
                          <p style={{ color: c.text2, fontSize: 12, marginBottom: 2 }} className="text-truncate">
                            {event.product}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>
                            {eventDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {event.amount !== undefined && (
                            <>
                              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                                +{fmtAmount(event.amount)} {event.asset}
                              </p>
                              <p style={{ color: c.text3, fontSize: 10 }}>
                                {fmtUsd(event.usdValue!)}
                              </p>
                            </>
                          )}
                          {event.type === 'rate-change' && (
                            <>
                              <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700 }}>
                                {event.newRate}%
                              </p>
                              <p style={{ color: c.text3, fontSize: 10 }}>
                                (từ {event.oldRate}%)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <p style={{ color: c.text3, fontSize: 11 }}>{event.description}</p>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            )}
          </PageSection>
        )}

        {/* Info Banner */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <CalendarIcon size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Về Lịch nhận lãi
              </p>
              <ul style={{ color: c.text2, fontSize: 12, lineHeight: 1.7, paddingLeft: 16 }}>
                <li>Lãi được phân phối <strong>tự động</strong> vào ví staking của bạn</li>
                <li>Bật thông báo để nhận alert trước <strong>24 giờ</strong></li>
                <li>Xuất lịch để đồng bộ với Google/Apple Calendar</li>
                <li>APY có thể thay đổi - kiểm tra thông báo thường xuyên</li>
              </ul>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
