/**
 * Analytics Dashboard - DCA Analytics Visualization
 * 
 * Comprehensive analytics dashboard showing:
 * - Event volume trends
 * - Top events breakdown
 * - User activity timeline
 * - Real-time event stream
 * 
 * @module pages/admin/AnalyticsDashboard
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  ChevronLeft, 
  Activity, 
  TrendingUp, 
  Users, 
  Zap,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';
import { dcaAnalytics } from '../../services/DCAAnalyticsService';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface EventSummary {
  eventName: string;
  count: number;
  percentage: number;
}

interface DailyStats {
  date: string;
  events: number;
  users: number;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get analytics data
  const analyticsData = useMemo(() => {
    const queue = dcaAnalytics.getQueue();
    return queue;
  }, [refreshKey]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = Date.now();
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - timeRangeMs[timeRange];
    
    const recentEvents = analyticsData.filter(e => e.timestamp >= cutoff);
    
    // Total events
    const totalEvents = recentEvents.length;
    
    // Unique users (based on userId if available)
    const uniqueUsers = new Set(recentEvents.map(e => e.userId || 'anonymous')).size;
    
    // Events per day
    const eventsPerDay = totalEvents / (timeRangeMs[timeRange] / (24 * 60 * 60 * 1000));
    
    // Top events
    const eventCounts = recentEvents.reduce((acc, e) => {
      acc[e.eventName] = (acc[e.eventName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topEvents: EventSummary[] = Object.entries(eventCounts)
      .map(([eventName, count]) => ({
        eventName,
        count,
        percentage: (count / totalEvents) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Daily breakdown
    const dailyStats: DailyStats[] = [];
    const days = Math.ceil(timeRangeMs[timeRange] / (24 * 60 * 60 * 1000));
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayEvents = recentEvents.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      const dayUsers = new Set(dayEvents.map(e => e.userId || 'anonymous')).size;
      
      dailyStats.push({
        date: new Date(dayStart).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        events: dayEvents.length,
        users: dayUsers,
      });
    }
    
    return {
      totalEvents,
      uniqueUsers,
      eventsPerDay: Math.round(eventsPerDay),
      topEvents,
      dailyStats,
    };
  }, [analyticsData, timeRange, refreshKey]);

  // Recent events (last 20)
  const recentEvents = useMemo(() => {
    return [...analyticsData]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  }, [analyticsData]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    const csv = [
      ['Event Name', 'Timestamp', 'User ID', 'Properties'],
      ...analyticsData.map(e => [
        e.eventName,
        new Date(e.timestamp).toISOString(),
        e.userId || 'anonymous',
        JSON.stringify(e.properties),
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dca-analytics-${Date.now()}.csv`;
    a.click();
  };

  // Event colors for pie chart
  const EVENT_COLORS = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Analytics Dashboard"
        subtitle="DCA Event Analytics"
        back
        breadcrumb
      />

      <PageContent gap="default">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-2 bg-[var(--surface-2)] p-1 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-4 py-1.5 rounded-lg text-[13px] transition-all"
                style={{
                  background: timeRange === range ? c.surface1 : 'transparent',
                  color: timeRange === range ? c.text1 : c.text3,
                  fontWeight: timeRange === range ? 600 : 500,
                }}
              >
                {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : '90 ngày'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Làm mới"
            >
              <RefreshCw size={18} color={c.text2} />
            </button>
            <button
              onClick={handleExport}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Xuất CSV"
            >
              <Download size={18} color={c.text2} />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Activity size={20} color="#8B5CF6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Tổng sự kiện</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  {metrics.totalEvents.toLocaleString()}
                </p>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              ~{metrics.eventsPerDay} sự kiện/ngày
            </p>
          </TrCard>

          <TrCard className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.12)' }}
              >
                <Users size={20} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 11 }}>Người dùng</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  {metrics.uniqueUsers}
                </p>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              Unique users
            </p>
          </TrCard>
        </div>

        {/* Event Volume Chart */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} color={c.text1} />
              <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
                Khối lượng sự kiện
              </h2>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.dailyStats} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs key="gradient-defs">
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
              <XAxis 
                key="x-axis"
                dataKey="date" 
                stroke={c.text3} 
                style={{ fontSize: 11 }}
              />
              <YAxis 
                key="y-axis"
                stroke={c.text3} 
                style={{ fontSize: 11 }}
              />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                itemStyle={{ color: c.text1 }}
              />
              <Area
                key="area-events"
                type="monotone"
                dataKey="events"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#eventGradient)"
                name="Sự kiện"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TrCard>

        {/* Top Events */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Top sự kiện
            </h2>
          </div>

          <div className="space-y-2">
            {metrics.topEvents.map((event, idx) => (
              <div key={event.eventName} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ 
                    background: EVENT_COLORS[idx % EVENT_COLORS.length] + '20',
                    color: EVENT_COLORS[idx % EVENT_COLORS.length],
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    style={{ color: c.text1, fontSize: 13, fontWeight: 500 }}
                    className="truncate"
                  >
                    {event.eventName}
                  </p>
                </div>

                <div className="text-right">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                    {event.count}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    {event.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Event Distribution Pie Chart */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Phân bố sự kiện
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                key="pie-events"
                data={metrics.topEvents.slice(0, 5)}
                dataKey="count"
                nameKey="eventName"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.percentage.toFixed(0)}%`}
                labelStyle={{ fontSize: 11, fontWeight: 600 }}
              >
                {metrics.topEvents.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={EVENT_COLORS[index % EVENT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                key="tooltip-pie"
                contentStyle={{
                  background: c.surface2,
                  border: `1px solid ${c.borderSolid}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend 
                key="legend"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </TrCard>

        {/* Recent Events Stream */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} color={c.text1} />
            <h2 style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
              Sự kiện gần đây
            </h2>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={32} color={c.text3} className="mx-auto mb-2" />
                <p style={{ color: c.text3, fontSize: 13 }}>
                  Chưa có sự kiện nào
                </p>
              </div>
            ) : (
              recentEvents.map((event, idx) => (
                <div 
                  key={`${event.eventName}-${event.timestamp}-${idx}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(139,92,246,0.12)' }}
                  >
                    <Activity size={16} color="#8B5CF6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 500 }}>
                      {event.eventName}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }} className="truncate">
                      {JSON.stringify(event.properties)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock size={12} color={c.text3} />
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {new Date(event.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {new Date(event.timestamp).toLocaleDateString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TrCard>

        {/* Debug Info */}
        <TrCard className="p-3">
          <p style={{ color: c.text3, fontSize: 11, textAlign: 'center' }}>
            Tổng {analyticsData.length} sự kiện trong queue • 
            Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
          </p>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}