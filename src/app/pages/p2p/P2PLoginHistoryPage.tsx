/**
 * ══════════════════════════════════════════════════════════
 *  P2PLoginHistoryPage — /p2p/security/login-history
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Full login history for P2P module
 *  IP tracking, device info, location, suspicious detection
 *  Tone: Security-focused, transparent, actionable
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Smartphone, Monitor, Tablet, MapPin, Clock,
  CheckCircle, AlertTriangle, XCircle, ChevronDown, Filter,
  Download, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';

/* ═══════════════════════════════════════════════════════════
   Login History Types
   ═══════════════════════════════════════════════════════════ */
interface LoginEvent {
  id: string;
  timestamp: string;
  device: {
    type: 'mobile' | 'desktop' | 'tablet';
    name: string;
    os: string;
    browser: string;
  };
  location: {
    city: string;
    country: string;
    ip: string;
  };
  status: 'success' | 'failed' | 'suspicious';
  method: '2fa' | 'password' | 'biometric';
  isCurrent: boolean;
}

const MOCK_LOGIN_HISTORY: LoginEvent[] = [
  {
    id: '1',
    timestamp: '2026-03-05 14:30:22',
    device: {
      type: 'mobile',
      name: 'iPhone 15 Pro',
      os: 'iOS 17.3',
      browser: 'Safari',
    },
    location: {
      city: 'Hà Nội',
      country: 'VN',
      ip: '123.21.45.67',
    },
    status: 'success',
    method: 'biometric',
    isCurrent: true,
  },
  {
    id: '2',
    timestamp: '2026-03-05 10:15:33',
    device: {
      type: 'desktop',
      name: 'MacBook Pro',
      os: 'macOS 14.3',
      browser: 'Chrome 121',
    },
    location: {
      city: 'TP.HCM',
      country: 'VN',
      ip: '113.161.78.90',
    },
    status: 'success',
    method: '2fa',
    isCurrent: false,
  },
  {
    id: '3',
    timestamp: '2026-03-04 22:45:10',
    device: {
      type: 'mobile',
      name: 'Samsung Galaxy S24',
      os: 'Android 14',
      browser: 'Chrome Mobile',
    },
    location: {
      city: 'Đà Nẵng',
      country: 'VN',
      ip: '14.231.56.12',
    },
    status: 'success',
    method: 'password',
    isCurrent: false,
  },
  {
    id: '4',
    timestamp: '2026-03-04 15:20:05',
    device: {
      type: 'desktop',
      name: 'Windows PC',
      os: 'Windows 11',
      browser: 'Edge',
    },
    location: {
      city: 'Singapore',
      country: 'SG',
      ip: '103.45.78.21',
    },
    status: 'suspicious',
    method: 'password',
    isCurrent: false,
  },
  {
    id: '5',
    timestamp: '2026-03-04 08:10:44',
    device: {
      type: 'mobile',
      name: 'Unknown Device',
      os: 'Android 12',
      browser: 'Chrome',
    },
    location: {
      city: 'Bangkok',
      country: 'TH',
      ip: '101.99.12.88',
    },
    status: 'failed',
    method: 'password',
    isCurrent: false,
  },
];

/* ═══════════════════════════════════════════════════════════
   Login Event Card
   ═══════════════════════════════════════════════════════════ */
function LoginEventCard({ event }: { event: LoginEvent }) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [expanded, setExpanded] = useState(false);

  const getDeviceIcon = () => {
    switch (event.device.type) {
      case 'mobile':
        return Smartphone;
      case 'desktop':
        return Monitor;
      case 'tablet':
        return Tablet;
    }
  };

  const getStatusConfig = () => {
    switch (event.status) {
      case 'success':
        return { color: '#10B981', icon: CheckCircle, label: 'Thành công' };
      case 'failed':
        return { color: '#EF4444', icon: XCircle, label: 'Thất bại' };
      case 'suspicious':
        return { color: '#F59E0B', icon: AlertTriangle, label: 'Đáng ngờ' };
    }
  };

  const DeviceIcon = getDeviceIcon();
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <TrCard
      rounded="md"
      className="overflow-hidden"
      accentBorder={event.status === 'suspicious' ? '#F59E0B' : undefined}
    >
      <button
        onClick={() => {
          hapticSelection();
          setExpanded(!expanded);
        }}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: event.isCurrent
                ? hexToRgba('#10B981', 12)
                : hexToRgba(statusConfig.color, 12),
            }}
          >
            <DeviceIcon
              size={18}
              color={event.isCurrent ? '#10B981' : statusConfig.color}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                {event.device.name}
              </h4>
              {event.isCurrent && (
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: hexToRgba('#10B981', 15), color: '#10B981' }}
                >
                  Hiện tại
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <p style={{ color: c.text3, fontSize: 11 }}>
                {event.device.os} • {event.device.browser}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin size={10} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>
                  {event.location.city}, {event.location.country}
                </p>
              </div>
              <span style={{ color: c.text3, fontSize: 10 }}>•</span>
              <div className="flex items-center gap-1">
                <Clock size={10} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10 }}>{event.timestamp}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className="px-2 py-1 rounded-md flex items-center gap-1"
              style={{ background: hexToRgba(statusConfig.color, 12) }}
            >
              <StatusIcon size={10} color={statusConfig.color} />
              <span style={{ color: statusConfig.color, fontSize: 9, fontWeight: 700 }}>
                {statusConfig.label}
              </span>
            </div>

            <ChevronDown
              size={14}
              color={c.text3}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{ borderColor: c.borderSolid }}
          >
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>IP Address</p>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {event.location.ip}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>
                    Login Method
                  </p>
                  <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                    {event.method === '2fa'
                      ? '2FA'
                      : event.method === 'biometric'
                        ? 'Biometric'
                        : 'Password'}
                  </p>
                </div>
              </div>

              {event.status === 'suspicious' && (
                <div
                  className="mt-3 p-2 rounded-lg flex items-start gap-2"
                  style={{ background: hexToRgba('#F59E0B', 10) }}
                >
                  <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                      Đăng nhập đáng ngờ
                    </p>
                    <p style={{ color: c.text2, fontSize: 9, lineHeight: 1.5 }}>
                      Vị trí không quen thuộc. Nếu không phải bạn, hãy đổi mật khẩu ngay.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PLoginHistoryPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [events, setEvents] = useState<LoginEvent[]>(MOCK_LOGIN_HISTORY);
  const [filter, setFilter] = useState<'all' | 'success' | 'suspicious'>('all');

  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'suspicious') return e.status === 'suspicious' || e.status === 'failed';
    return e.status === filter;
  });

  const suspiciousCount = events.filter(
    e => e.status === 'suspicious' || e.status === 'failed'
  ).length;

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header
          title="Lịch sử đăng nhập"
          subtitle="Bảo mật · P2P"
          back
          action={{
            icon: Download,
          }}
        />

        {/* Stats */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <TrCard rounded="md" className="p-3 text-center">
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ background: hexToRgba('#3B82F6', 12) }}
              >
                <Shield size={18} color="#3B82F6" />
              </div>
              <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 700 }}>
                {events.length}
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Tổng số</p>
            </TrCard>

            <TrCard rounded="md" className="p-3 text-center">
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ background: hexToRgba('#10B981', 12) }}
              >
                <CheckCircle size={18} color="#10B981" />
              </div>
              <p style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>
                {events.filter(e => e.status === 'success').length}
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Thành công</p>
            </TrCard>

            <TrCard rounded="md" className="p-3 text-center">
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ background: hexToRgba('#F59E0B', 12) }}
              >
                <AlertTriangle size={18} color="#F59E0B" />
              </div>
              <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>
                {suspiciousCount}
              </p>
              <p style={{ color: c.text3, fontSize: 9 }}>Đáng ngờ</p>
            </TrCard>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 mb-4">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'success', label: 'Thành công' },
              { id: 'suspicious', label: 'Đáng ngờ' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  hapticSelection();
                  setFilter(f.id as typeof filter);
                }}
                className="px-4 py-2 rounded-lg font-semibold text-xs"
                style={{
                  background: filter === f.id ? '#3B82F6' : c.surface2,
                  color: filter === f.id ? '#FFFFFF' : c.text2,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        {suspiciousCount > 0 && filter !== 'success' && (
          <div className="px-5 mb-4">
            <div
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                background: hexToRgba('#F59E0B', 10),
                border: `1px solid ${hexToRgba('#F59E0B', 30)}`,
              }}
            >
              <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                  Phát hiện {suspiciousCount} đăng nhập đáng ngờ
                </p>
                <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                  Nếu không phải bạn, vui lòng đổi mật khẩu và bật 2FA ngay.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="px-5 flex flex-col gap-3">
          {filteredEvents.map(event => (
            <LoginEventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Shield size={48} color={c.text3} className="mx-auto mb-4" />
            <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
              Không có lịch sử đăng nhập
            </p>
          </div>
        )}

        {/* Info */}
        <div className="px-5 mt-6">
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#3B82F6', 10) }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                Lưu ý bảo mật
              </p>
              <ul style={{ color: c.text2, fontSize: 10, lineHeight: 1.6, paddingLeft: 16 }}>
                <li>Lịch sử được lưu trong 90 ngày</li>
                <li>Kiểm tra thường xuyên để phát hiện truy cập trái phép</li>
                <li>Báo ngay cho Support nếu thấy hoạt động đáng ngờ</li>
              </ul>
            </div>
          </div>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}