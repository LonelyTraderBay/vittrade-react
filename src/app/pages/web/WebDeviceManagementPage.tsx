/**
 * ══════════════════════════════════════════════════════════
 *  WEB DEVICE MANAGEMENT PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/devices
 *
 *  Trusted device management & login session tracking
 *  - Active sessions list
 *  - Trusted devices
 *  - Device fingerprinting
 *  - Remote logout
 *  - Device trust management
 *  - Login history
 *
 *  Guidelines compliance:
 *  - §14.1: Security Center patterns
 *  - §14.2: Sensitive data masking
 *  - §14.3: Destructive actions require confirm
 *  - §21.4: Header with breadcrumb
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Star,
  Info,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type DeviceType = 'desktop' | 'mobile' | 'tablet';
type DeviceStatus = 'trusted' | 'active' | 'suspicious';

interface Device {
  id: string;
  name: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  firstSeen: string;
  status: DeviceStatus;
  isCurrent?: boolean;
  loginCount: number;
}

const DEVICES: Device[] = [
  {
    id: 'd1',
    name: 'Chrome on Windows',
    deviceType: 'desktop',
    browser: 'Chrome 122',
    os: 'Windows 11',
    location: 'Hồ Chí Minh, Việt Nam',
    ip: '123.45.67.89',
    lastActive: '5 phút trước',
    firstSeen: '2026-01-15',
    status: 'trusted',
    isCurrent: true,
    loginCount: 234,
  },
  {
    id: 'd2',
    name: 'iPhone 15 Pro',
    deviceType: 'mobile',
    browser: 'Safari 17',
    os: 'iOS 17.3',
    location: 'Hồ Chí Minh, Việt Nam',
    ip: '123.45.67.90',
    lastActive: '2 giờ trước',
    firstSeen: '2025-12-20',
    status: 'trusted',
    loginCount: 156,
  },
  {
    id: 'd3',
    name: 'Safari on macOS',
    deviceType: 'desktop',
    browser: 'Safari 17',
    os: 'macOS 14.3',
    location: 'Hà Nội, Việt Nam',
    ip: '98.76.54.32',
    lastActive: '1 ngày trước',
    firstSeen: '2025-11-10',
    status: 'active',
    loginCount: 89,
  },
  {
    id: 'd4',
    name: 'Chrome on Android',
    deviceType: 'mobile',
    browser: 'Chrome 122',
    os: 'Android 14',
    location: 'Đà Nẵng, Việt Nam',
    ip: '45.123.78.65',
    lastActive: '3 ngày trước',
    firstSeen: '2026-03-01',
    status: 'suspicious',
    loginCount: 3,
  },
];

const DEVICE_TYPE_CONFIG: Record<DeviceType, { icon: React.ElementType; color: string }> = {
  desktop: { icon: Monitor, color: '#3B82F6' },
  mobile: { icon: Smartphone, color: '#10B981' },
  tablet: { icon: Tablet, color: '#8B5CF6' },
};

const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; icon: React.ElementType }> = {
  trusted: { label: 'Đáng tin cậy', color: '#10B981', icon: ShieldCheck },
  active: { label: 'Hoạt động', color: '#3B82F6', icon: Shield },
  suspicious: { label: 'Đáng ngờ', color: '#EF4444', icon: ShieldAlert },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function DeviceCard({ device }: { device: Device }) {
  const c = useThemeColors();
  const [showIP, setShowIP] = useState(false);

  const DeviceIcon = DEVICE_TYPE_CONFIG[device.deviceType].icon;
  const deviceColor = DEVICE_TYPE_CONFIG[device.deviceType].color;
  const StatusIcon = STATUS_CONFIG[device.status].icon;
  const statusConfig = STATUS_CONFIG[device.status];

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: device.isCurrent ? `${deviceColor}08` : c.surface,
        border: device.isCurrent ? `2px solid ${deviceColor}` : `1px solid ${c.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              background: `${deviceColor}15`,
            }}
          >
            <DeviceIcon size={24} color={deviceColor} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
                {device.name}
              </span>
              {device.isCurrent && (
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{
                    background: '#10B98115',
                    color: '#10B981',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Thiết bị hiện tại
                </span>
              )}
              {device.status === 'trusted' && (
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
              )}
            </div>
            <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION }}>
              {device.browser} · {device.os}
            </div>
          </div>
        </div>

        {!device.isCurrent && (
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg transition-colors"
              style={{
                color: '#EF4444',
                border: `1px solid #EF444440`,
              }}
            >
              <LogOut size={16} />
            </button>
            {device.status !== 'trusted' && (
              <button
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: c.text3,
                  border: `1px solid ${c.border}`,
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              fontSize: WEB_FONT.SIZE.CAPTION,
              fontWeight: 600,
            }}
          >
            <StatusIcon size={12} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Location & IP */}
      <div className="mb-4">
        <div className="flex items-center gap-4" style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION }}>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} />
            {device.location}
          </span>
          <span>•</span>
          <button
            onClick={() => setShowIP(!showIP)}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: c.text3 }}
          >
            {showIP ? <EyeOff size={12} /> : <Eye size={12} />}
            {showIP ? device.ip : '•••.•••.•••.•••'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        className="pt-4 grid grid-cols-3 gap-4"
        style={{ borderTop: `1px solid ${c.divider}` }}
      >
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Hoạt động
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {device.lastActive}
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Lần đầu
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {new Date(device.firstSeen).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            Đăng nhập
          </div>
          <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
            {device.loginCount} lần
          </div>
        </div>
      </div>

      {/* Suspicious Warning */}
      {device.status === 'suspicious' && (
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: '#EF444415',
            border: `1px solid #EF444440`,
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} color="#EF4444" className="flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ color: '#EF4444', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 4 }}>
                Cảnh báo bảo mật
              </div>
              <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                Thiết bị này có dấu hiệu đáng ngờ (đăng nhập từ vị trí lạ, lần đầu tiên).
                Nếu không phải bạn, hãy đăng xuất ngay.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebDeviceManagementPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const trustedDevices = DEVICES.filter((d) => d.status === 'trusted');
  const suspiciousDevices = DEVICES.filter((d) => d.status === 'suspicious');

  return (
    <PageLayout>
    <div className="flex" style={{ minHeight: '100%' }}>
      {/* ═══ LEFT SIDEBAR (280px) ═══ */}
      <div
        className="flex flex-col"
        style={{
          width: 280,
          background: c.surface,
          borderRight: `1px solid ${c.divider}`,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: 60,
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <h2
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.H2,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Thiết bị
          </h2>
        </div>

        {/* Stats */}
        <div className="p-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Tổng quan
          </div>
          <div className="flex flex-col gap-3">
            <div
              className="p-3 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  Tổng thiết bị
                </div>
                <div style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>
                  {DEVICES.length}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  Đáng tin cậy
                </div>
                <div style={{ color: '#10B981', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                  {trustedDevices.length}
                </div>
              </div>
            </div>

            {suspiciousDevices.length > 0 && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background: '#EF444415',
                  border: `1px solid #EF444440`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#EF4444" />
                  <div style={{ color: '#EF4444', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}>
                    Cảnh báo
                  </div>
                </div>
                <div style={{ color: c.text3, fontSize: 11 }}>
                  {suspiciousDevices.length} thiết bị đáng ngờ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-4">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 12 }}>
            Thao tác nhanh
          </div>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              <LogOut size={14} />
              Đăng xuất tất cả
            </button>
            <button
              onClick={() => navigate('/w/profile/activity')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              <Clock size={14} />
              Lịch sử đăng nhập
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="px-4 pb-4 mt-auto">
          <div
            className="p-3 rounded-lg"
            style={{
              background: '#3B82F615',
              border: `1px solid #3B82F640`,
            }}
          >
            <div className="flex items-start gap-2">
              <Info size={14} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ color: '#3B82F6', fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 600, marginBottom: 4 }}>
                  Bảo mật thiết bị
                </div>
                <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Thiết bị đáng tin cậy giúp bạn đăng nhập nhanh hơn và bỏ qua một số bước xác minh.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h3
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H3,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Thiết bị đã kết nối
            </h3>
            <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
              Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn
            </p>
          </div>

          {/* Devices List */}
          <div className="flex flex-col gap-4">
            {DEVICES.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>

          {/* Security Tips */}
          <div className="mt-8">
            <h4
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.BODY,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Khuyến nghị bảo mật
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Kiểm tra thiết bị định kỳ, đăng xuất thiết bị không quen',
                'Chỉ đánh dấu tin cậy cho thiết bị cá nhân',
                'Bật 2FA để bảo vệ tài khoản khỏi truy cập trái phép',
                'Thay đổi mật khẩu ngay nếu phát hiện thiết bị lạ',
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <CheckCircle2 size={16} color="#10B981" className="flex-shrink-0 mt-0.5" />
                  <span style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, lineHeight: 1.5 }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}