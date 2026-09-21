/**
 * ══════════════════════════════════════════════════════════
 *  WEB ACTIVITY HISTORY PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/activity
 *
 *  Account activity log & audit trail
 *  - Login/Logout events
 *  - Security changes (2FA, password, API)
 *  - Trading activities
 *  - Withdrawal/Deposit logs
 *  - Settings changes
 *  - Filtering & search
 *
 *  Guidelines compliance:
 *  - §14.1: Security Center patterns
 *  - §15.1: Clear, factual logging
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  LogIn,
  LogOut,
  Shield,
  Settings,
  DollarSign,
  TrendingUp,
  Key,
  Lock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Download,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type ActivityType =
  'login' | 'logout' | 'security' | 'trade' | 'withdrawal' | 'deposit' | 'settings' | 'api';
type ActivityStatus = 'success' | 'failed' | 'pending';

interface ActivityLog {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  status: ActivityStatus;
  device?: string;
  location?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

const ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'a1',
    type: 'login',
    action: 'Đăng nhập thành công',
    description: 'Chrome on Windows',
    timestamp: '2026-03-13 09:45:23',
    status: 'success',
    device: 'Desktop',
    location: 'Hồ Chí Minh, VN',
    ip: '123.45.67.89',
  },
  {
    id: 'a2',
    type: 'trade',
    action: 'Đặt lệnh Market Buy',
    description: 'BTC/USDT · 0.05 BTC · $3,750',
    timestamp: '2026-03-13 09:30:15',
    status: 'success',
    metadata: { pair: 'BTC/USDT', amount: 0.05, value: 3750 },
  },
  {
    id: 'a3',
    type: 'security',
    action: 'Thay đổi mật khẩu',
    description: 'Mật khẩu đã được cập nhật',
    timestamp: '2026-03-12 18:20:45',
    status: 'success',
    device: 'iPhone',
    location: 'Hồ Chí Minh, VN',
  },
  {
    id: 'a4',
    type: 'withdrawal',
    action: 'Rút USDT',
    description: '5,000 USDT → Binance',
    timestamp: '2026-03-12 15:30:00',
    status: 'success',
    metadata: { asset: 'USDT', amount: 5000, destination: 'Binance' },
  },
  {
    id: 'a5',
    type: 'login',
    action: 'Đăng nhập thất bại',
    description: 'Sai mật khẩu (3 lần)',
    timestamp: '2026-03-11 22:15:30',
    status: 'failed',
    device: 'Mobile',
    location: 'Hà Nội, VN',
    ip: '98.76.54.32',
  },
  {
    id: 'a6',
    type: 'api',
    action: 'Tạo API key mới',
    description: 'Trading Bot — Production',
    timestamp: '2026-03-11 14:20:00',
    status: 'success',
    metadata: { keyName: 'Trading Bot — Production', permissions: ['read', 'trade'] },
  },
  {
    id: 'a7',
    type: 'deposit',
    action: 'Nạp ETH',
    description: '2.5 ETH từ MetaMask',
    timestamp: '2026-03-10 10:45:00',
    status: 'success',
    metadata: { asset: 'ETH', amount: 2.5, source: 'MetaMask' },
  },
  {
    id: 'a8',
    type: 'security',
    action: 'Bật 2FA',
    description: 'Google Authenticator',
    timestamp: '2026-03-09 16:30:00',
    status: 'success',
    device: 'Desktop',
  },
  {
    id: 'a9',
    type: 'settings',
    action: 'Cập nhật thông tin KYC',
    description: 'KYC Lv2 → Lv3',
    timestamp: '2026-03-08 11:00:00',
    status: 'pending',
  },
  {
    id: 'a10',
    type: 'logout',
    action: 'Đăng xuất',
    description: 'Safari on macOS',
    timestamp: '2026-03-07 20:15:00',
    status: 'success',
    device: 'Desktop',
    location: 'Hà Nội, VN',
  },
];

const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { label: string; color: string; icon: React.ElementType }
> = {
  login: { label: 'Đăng nhập', color: '#10B981', icon: LogIn },
  logout: { label: 'Đăng xuất', color: '#94A3B8', icon: LogOut },
  security: { label: 'Bảo mật', color: '#EF4444', icon: Shield },
  trade: { label: 'Giao dịch', color: '#3B82F6', icon: TrendingUp },
  withdrawal: { label: 'Rút tiền', color: '#F59E0B', icon: DollarSign },
  deposit: { label: 'Nạp tiền', color: '#10B981', icon: DollarSign },
  settings: { label: 'Cài đặt', color: '#8B5CF6', icon: Settings },
  api: { label: 'API', color: '#EC4899', icon: Key },
};

const STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  success: { label: 'Thành công', color: '#10B981', icon: CheckCircle2 },
  failed: { label: 'Thất bại', color: '#EF4444', icon: XCircle },
  pending: { label: 'Đang xử lý', color: '#F59E0B', icon: Clock },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function ActivityLogItem({ log }: { log: ActivityLog }) {
  const c = useThemeColors();
  const typeConfig = ACTIVITY_TYPE_CONFIG[log.type];
  const statusConfig = STATUS_CONFIG[log.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="flex gap-4 p-4 rounded-xl transition-colors"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: 48,
          height: 48,
          background: `${typeConfig.color}15`,
        }}
      >
        <TypeIcon size={24} color={typeConfig.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.BODY,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {log.action}
            </div>
            <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION }}>{log.description}</div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-md"
              style={{
                background: `${typeConfig.color}15`,
                color: typeConfig.color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {typeConfig.label}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-md"
              style={{
                background: `${statusConfig.color}15`,
                color: statusConfig.color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <StatusIcon size={10} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div
          className="flex items-center gap-4 flex-wrap"
          style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}
        >
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(log.timestamp).toLocaleString('vi-VN')}
          </span>
          {log.device && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                {log.device === 'Desktop' ? <Monitor size={12} /> : <Smartphone size={12} />}
                {log.device}
              </span>
            </>
          )}
          {log.location && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {log.location}
              </span>
            </>
          )}
          {log.ip && (
            <>
              <span>•</span>
              <span className="font-mono">{log.ip}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebActivityHistoryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = ACTIVITY_LOGS.filter((log) => {
    const matchesType = selectedType === 'all' || log.type === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const activityCounts = {
    all: ACTIVITY_LOGS.length,
    login: ACTIVITY_LOGS.filter((l) => l.type === 'login').length,
    security: ACTIVITY_LOGS.filter((l) => l.type === 'security').length,
    trade: ACTIVITY_LOGS.filter((l) => l.type === 'trade').length,
    withdrawal: ACTIVITY_LOGS.filter((l) => l.type === 'withdrawal').length,
  };

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
              Hoạt động
            </h2>
          </div>

          {/* Search */}
          <div className="p-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <Search size={16} color={c.text3} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: c.text1,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 pb-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Lọc theo loại
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedType('all')}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                style={{
                  background: selectedType === 'all' ? '#3B82F615' : 'transparent',
                  color: selectedType === 'all' ? '#3B82F6' : c.text2,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: selectedType === 'all' ? 600 : 500,
                }}
              >
                <span className="flex items-center gap-2">
                  <Activity size={14} />
                  Tất cả
                </span>
                <span style={{ fontSize: 12 }}>{activityCounts.all}</span>
              </button>

              {Object.entries(ACTIVITY_TYPE_CONFIG)
                .slice(0, 5)
                .map(([type, config]) => {
                  const Icon = config.icon;
                  const isActive = selectedType === type;
                  const count = ACTIVITY_LOGS.filter((l) => l.type === type).length;

                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as ActivityType)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                      style={{
                        background: isActive ? `${config.color}15` : 'transparent',
                        color: isActive ? config.color : c.text2,
                        fontSize: WEB_FONT.SIZE.CAPTION,
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={14} />
                        {config.label}
                      </span>
                      <span style={{ fontSize: 12 }}>{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Export Button */}
          <div className="px-4 pb-4 mt-auto">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
              }}
            >
              <Download size={14} />
              Xuất lịch sử
            </button>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.H3,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Lịch sử hoạt động
                </h3>
                <p style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, margin: 0 }}>
                  {filteredLogs.length} hoạt động
                </p>
              </div>
            </div>

            {/* Activity List */}
            {filteredLogs.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredLogs.map((log) => (
                  <ActivityLogItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-xl"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <Activity size={48} color={c.text3} className="mb-4" />
                <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.BODY, marginBottom: 8 }}>
                  Không tìm thấy hoạt động
                </div>
                <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
