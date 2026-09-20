/**
 * Real-Time Metrics - Live Analytics Feed
 * 
 * Real-time analytics component showing:
 * - Live event stream
 * - Active users counter
 * - Recent conversions
 * - System health
 * 
 * Auto-refreshes every 5 seconds
 * 
 * @module components/admin/RealTimeMetrics
 * @version 1.0 (Phase 2 - Sprint 3)
 */

import { useState, useEffect } from 'react';
import { Activity, Users, Zap, TrendingUp, Circle, Clock } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../ui/TrCard';
import { φ } from '../../utils/golden';
import { dcaAnalytics } from '../../services/DCAAnalyticsService';

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export function RealTimeMetrics() {
  const c = useThemeColors();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isLive, setIsLive] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Get recent events (last 5 minutes)
  const recentEvents = dcaAnalytics.getQueue().filter(e => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return e.timestamp >= fiveMinutesAgo;
  });

  // Calculate active users (unique users in last 5 minutes)
  const activeUsers = new Set(recentEvents.map(e => e.userId || 'anonymous')).size;

  // Events per minute
  const eventsPerMinute = recentEvents.length > 0
    ? (recentEvents.length / 5).toFixed(1)
    : '0';

  // Recent conversions (last 10)
  const recentConversions = recentEvents
    .filter(e => 
      e.eventName.includes('created') || 
      e.eventName.includes('completed') ||
      e.eventName.includes('conversion')
    )
    .slice(-10)
    .reverse();

  // System health (based on error events)
  const errorEvents = recentEvents.filter(e => 
    e.eventName.includes('error') || 
    e.eventName.includes('failed')
  );
  const errorRate = recentEvents.length > 0
    ? (errorEvents.length / recentEvents.length) * 100
    : 0;
  
  const healthStatus = errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'error';
  const healthColor = healthStatus === 'good' ? '#10B981' : healthStatus === 'warning' ? '#F59E0B' : '#EF4444';
  const healthLabel = healthStatus === 'good' ? 'Tốt' : healthStatus === 'warning' ? 'Cảnh báo' : 'Lỗi';

  return (
    <div className="space-y-3">
      {/* Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'animate-pulse' : ''}`} style={{ background: '#10B981' }} />
          <p style={{ color: c.text2, fontSize: 13, fontWeight: 600 }}>
            {isLive ? 'LIVE' : 'PAUSED'}
          </p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="px-3 py-1 rounded-lg text-[11px] transition-colors"
          style={{
            background: c.surface2,
            color: c.text2,
            fontWeight: 600,
          }}
        >
          {isLive ? 'Tạm dừng' : 'Tiếp tục'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} color="#8B5CF6" />
            <p style={{ color: c.text3, fontSize: 10 }}>Events/phút</p>
          </div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
            {eventsPerMinute}
          </p>
        </TrCard>

        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} color="#3B82F6" />
            <p style={{ color: c.text3, fontSize: 10 }}>Users</p>
          </div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
            {activeUsers}
          </p>
        </TrCard>

        <TrCard className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Circle size={14} color={healthColor} />
            <p style={{ color: c.text3, fontSize: 10 }}>Health</p>
          </div>
          <p style={{ color: healthColor, fontSize: 18, fontWeight: 700 }}>
            {healthLabel}
          </p>
        </TrCard>
      </div>

      {/* Live Event Stream */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} color={c.text1} />
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Live Event Stream
            </h3>
          </div>
          <p style={{ color: c.text3, fontSize: 10 }}>
            {recentEvents.length} sự kiện (5 phút)
          </p>
        </div>

        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {recentEvents.slice(-10).reverse().map((event, idx) => {
            const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
            const timeLabel = timeAgo < 60 
              ? `${timeAgo}s`
              : `${Math.floor(timeAgo / 60)}m`;

            return (
              <div 
                key={`${event.eventName}-${event.timestamp}-${idx}`}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
                <p 
                  style={{ color: c.text1, fontSize: 11, fontWeight: 500 }}
                  className="flex-1 truncate"
                >
                  {event.eventName}
                </p>
                <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>
                  {timeLabel}
                </p>
              </div>
            );
          })}

          {recentEvents.length === 0 && (
            <div className="text-center py-4">
              <p style={{ color: c.text3, fontSize: 11 }}>
                Không có sự kiện mới
              </p>
            </div>
          )}
        </div>
      </TrCard>

      {/* Recent Conversions */}
      {recentConversions.length > 0 && (
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} color={c.text1} />
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Conversions gần đây
            </h3>
          </div>

          <div className="space-y-1">
            {recentConversions.map((event, idx) => {
              const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
              const timeLabel = timeAgo < 60 
                ? `${timeAgo}s trước`
                : `${Math.floor(timeAgo / 60)}m trước`;

              return (
                <div 
                  key={`${event.eventName}-${event.timestamp}-${idx}`}
                  className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(16,185,129,0.15)' }}
                  >
                    <TrendingUp size={12} color="#10B981" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 500 }}>
                      {event.eventName}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {timeLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>
      )}

      {/* Last Update Time */}
      <div className="flex items-center justify-center gap-2">
        <Clock size={12} color={c.text3} />
        <p style={{ color: c.text3, fontSize: 10 }}>
          Cập nhật lúc {new Date(lastUpdate).toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </div>
  );
}
