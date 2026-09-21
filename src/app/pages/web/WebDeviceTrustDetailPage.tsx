import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Globe,
  Fingerprint,
  Wifi,
  Cpu,
  HardDrive,
  RefreshCw,
  Trash2,
  Ban,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Settings,
  Copy,
  CheckCircle2,
  X,
  Calendar,
  Zap,
  FileText,
  ToggleLeft,
  ToggleRight,
  Star,
  StarOff,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebDeviceTrustDetailPage — Trusted device detail + activity log
 *
 * Route: /w/profile/security/devices/:deviceId
 *
 * Features:
 *   - Device info (name, OS, browser, fingerprint hash)
 *   - Trust status & trust level
 *   - Activity log (logins, trades, withdrawals, 2FA verifications)
 *   - Sessions from this device
 *   - Security attributes (fingerprint, IP history, location)
 *   - Actions: rename, revoke trust, block, terminate sessions
 *
 * Guidelines:
 *   - §14.1: Security Center — device management
 *   - §14.2: IP/fingerprint masking
 *   - §14.3: Revoke trust = high-risk action → confirm
 *   - §4.4: Activity log scannable
 */

/* ═══ Types ═══ */
type TrustLevel = 'trusted' | 'recognized' | 'new' | 'blocked';
type ActivityType =
  'login' | 'logout' | 'trade' | 'withdrawal' | '2fa' | 'settings' | 'api' | 'p2p';

interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  fingerprint: string;
  trustLevel: TrustLevel;
  trustedSince: string;
  lastActive: string;
  lastIP: string;
  lastLocation: string;
  lastCountry: string;
  isCurrent: boolean;
  sessions: number;
  passkeys: number;
  ipHistory: string[];
  locationHistory: string[];
  totalLogins: number;
  totalActions: number;
  riskScore: number;
}

interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  time: string;
  sortTime: number;
  ip: string;
  location: string;
  status: 'success' | 'failed' | 'blocked';
  riskFlag?: boolean;
}

/* ═══ Config ═══ */
const TRUST_CONFIG: Record<
  TrustLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  trusted: {
    label: 'Tin tưởng',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.15)',
    icon: ShieldCheck,
  },
  recognized: {
    label: 'Đã nhận diện',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.15)',
    icon: Shield,
  },
  new: {
    label: 'Thiết bị mới',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.15)',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Đã chặn',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.15)',
    icon: Ban,
  },
};

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; color: string; icon: React.ElementType }
> = {
  login: { label: 'Đăng nhập', color: '#3B82F6', icon: LogIn },
  logout: { label: 'Đăng xuất', color: '#6B7280', icon: LogOut },
  trade: { label: 'Giao dịch', color: '#10B981', icon: Zap },
  withdrawal: { label: 'Rút tiền', color: '#F59E0B', icon: Lock },
  '2fa': { label: 'Xác thực 2FA', color: '#8B5CF6', icon: Shield },
  settings: { label: 'Cài đặt', color: '#6B7280', icon: Settings },
  api: { label: 'API', color: '#F97316', icon: Key },
  p2p: { label: 'P2P', color: '#14B8A6', icon: FileText },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  success: { color: '#10B981', label: 'Thành công' },
  failed: { color: '#EF4444', label: 'Thất bại' },
  blocked: { color: '#DC2626', label: 'Bị chặn' },
};

const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

/* ═══ Mock data ═══ */
const MOCK_DEVICES: Record<string, DeviceInfo> = {
  'dev-1': {
    id: 'dev-1',
    name: 'MacBook Pro 16" (2024)',
    type: 'desktop',
    os: 'macOS',
    osVersion: 'Sonoma 14.3',
    browser: 'Chrome',
    browserVersion: '122.0.6261',
    fingerprint: 'fp_8a3b2c1d_e4f5_6789_ab01',
    trustLevel: 'trusted',
    trustedSince: '15/01/2026',
    lastActive: '5 phút trước',
    lastIP: '123.45.67.89',
    lastLocation: 'Hồ Chí Minh',
    lastCountry: 'Việt Nam',
    isCurrent: true,
    sessions: 1,
    passkeys: 1,
    ipHistory: ['123.45.67.89', '123.45.67.90', '42.115.xxx.xxx'],
    locationHistory: ['Hồ Chí Minh, VN', 'Hà Nội, VN'],
    totalLogins: 234,
    totalActions: 1847,
    riskScore: 5,
  },
  'dev-2': {
    id: 'dev-2',
    name: 'iPhone 15 Pro',
    type: 'mobile',
    os: 'iOS',
    osVersion: '17.3',
    browser: 'Safari',
    browserVersion: '17.3',
    fingerprint: 'fp_9d4e5f6a_b7c8_90de_f012',
    trustLevel: 'trusted',
    trustedSince: '20/01/2026',
    lastActive: '2 giờ trước',
    lastIP: '42.115.xxx.xxx',
    lastLocation: 'Hà Nội',
    lastCountry: 'Việt Nam',
    isCurrent: false,
    sessions: 1,
    passkeys: 1,
    ipHistory: ['42.115.xxx.xxx', '42.115.xxx.xxx'],
    locationHistory: ['Hà Nội, VN', 'Hồ Chí Minh, VN'],
    totalLogins: 156,
    totalActions: 892,
    riskScore: 8,
  },
  'dev-3': {
    id: 'dev-3',
    name: 'Firefox on Linux',
    type: 'desktop',
    os: 'Linux',
    osVersion: 'Ubuntu 22.04',
    browser: 'Firefox',
    browserVersion: '120.0',
    fingerprint: 'fp_a1b2c3d4_e5f6_7890_1234',
    trustLevel: 'new',
    trustedSince: '',
    lastActive: '3 ngày trước',
    lastIP: '91.234.xxx.xxx',
    lastLocation: 'Unknown',
    lastCountry: 'Unknown',
    isCurrent: false,
    sessions: 0,
    passkeys: 0,
    ipHistory: ['91.234.xxx.xxx'],
    locationHistory: ['Unknown'],
    totalLogins: 2,
    totalActions: 3,
    riskScore: 72,
  },
};

const MOCK_ACTIVITY: Record<string, ActivityEntry[]> = {
  'dev-1': [
    {
      id: 'a1',
      type: 'login',
      title: 'Đăng nhập thành công',
      detail: '2FA: Google Authenticator',
      time: '13/03/2026, 17:35',
      sortTime: 1,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a2',
      type: 'trade',
      title: 'Mua 0.05 BTC',
      detail: 'Market order — $3,250',
      time: '13/03/2026, 16:20',
      sortTime: 2,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a3',
      type: '2fa',
      title: 'Xác thực 2FA',
      detail: 'Xác nhận lệnh rút — Google Authenticator',
      time: '13/03/2026, 15:12',
      sortTime: 3,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a4',
      type: 'withdrawal',
      title: 'Rút 0.5 ETH',
      detail: 'Đến 0x9a3b...4c2f — Whitelist',
      time: '13/03/2026, 15:10',
      sortTime: 4,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a5',
      type: 'settings',
      title: 'Đổi cài đặt thông báo',
      detail: 'Bật push notification cho rút tiền',
      time: '13/03/2026, 14:00',
      sortTime: 5,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a6',
      type: 'login',
      title: 'Đăng nhập thành công',
      detail: '2FA: Passkey (MacBook)',
      time: '13/03/2026, 09:15',
      sortTime: 6,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a7',
      type: 'trade',
      title: 'Bán 100 USDT → VND',
      detail: 'P2P order #3847',
      time: '12/03/2026, 20:45',
      sortTime: 7,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a8',
      type: 'api',
      title: 'Tạo API Key',
      detail: '"Trading Bot Prod" — trade-only',
      time: '12/03/2026, 15:30',
      sortTime: 8,
      ip: '123.45.67.89',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
    {
      id: 'a9',
      type: 'login',
      title: 'Đăng nhập thất bại',
      detail: 'Sai mã 2FA — 2 lần thử',
      time: '11/03/2026, 22:10',
      sortTime: 9,
      ip: '123.45.67.90',
      location: 'Hồ Chí Minh, VN',
      status: 'failed',
      riskFlag: true,
    },
    {
      id: 'a10',
      type: 'login',
      title: 'Đăng nhập thành công',
      detail: '2FA: Google Authenticator',
      time: '11/03/2026, 22:12',
      sortTime: 10,
      ip: '123.45.67.90',
      location: 'Hồ Chí Minh, VN',
      status: 'success',
    },
  ],
  'dev-2': [
    {
      id: 'b1',
      type: 'login',
      title: 'Đăng nhập thành công',
      detail: '2FA: Face ID',
      time: '13/03/2026, 15:20',
      sortTime: 1,
      ip: '42.115.xxx.xxx',
      location: 'Hà Nội, VN',
      status: 'success',
    },
    {
      id: 'b2',
      type: 'trade',
      title: 'Mua 200 USDT',
      detail: 'Quick buy — Credit card',
      time: '13/03/2026, 15:25',
      sortTime: 2,
      ip: '42.115.xxx.xxx',
      location: 'Hà Nội, VN',
      status: 'success',
    },
    {
      id: 'b3',
      type: 'p2p',
      title: 'P2P order tạo',
      detail: 'Mua 500 USDT — VietcomBank',
      time: '12/03/2026, 10:00',
      sortTime: 3,
      ip: '42.115.xxx.xxx',
      location: 'Hà Nội, VN',
      status: 'success',
    },
  ],
  'dev-3': [
    {
      id: 'c1',
      type: 'login',
      title: 'Đăng nhập bị chặn',
      detail: 'IP thuộc mạng TOR — Auto-blocked',
      time: '10/03/2026, 03:12',
      sortTime: 1,
      ip: '91.234.xxx.xxx',
      location: 'Unknown',
      status: 'blocked',
      riskFlag: true,
    },
    {
      id: 'c2',
      type: 'login',
      title: 'Đăng nhập bị chặn',
      detail: 'Quá nhiều lần thử — Rate limited',
      time: '10/03/2026, 03:15',
      sortTime: 2,
      ip: '91.234.xxx.xxx',
      location: 'Unknown',
      status: 'blocked',
      riskFlag: true,
    },
    {
      id: 'c3',
      type: 'login',
      title: 'Đăng nhập thất bại',
      detail: 'Sai mật khẩu — 5 lần liên tiếp',
      time: '10/03/2026, 03:10',
      sortTime: 3,
      ip: '91.234.xxx.xxx',
      location: 'Unknown',
      status: 'failed',
      riskFlag: true,
    },
  ],
};

/* ═══ Filter types ═══ */
type ActivityFilter = 'all' | ActivityType;

/* ═══ Component ═══ */
export function WebDeviceTrustDetailPage() {
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const c = useThemeColors();

  const device = MOCK_DEVICES[deviceId || 'dev-1'] || MOCK_DEVICES['dev-1'];
  const activities = MOCK_ACTIVITY[device.id] || [];
  const trust = TRUST_CONFIG[device.trustLevel];
  const DevIcon = DEVICE_ICONS[device.type] || Monitor;

  /* ─── State ─── */
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [showIP, setShowIP] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [expandAttributes, setExpandAttributes] = useState(true);
  const [expandActivity, setExpandActivity] = useState(true);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deviceTrust, setDeviceTrust] = useState<TrustLevel>(device.trustLevel);
  const [copiedField, setCopiedField] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deviceName, setDeviceName] = useState(device.name);

  /* ─── Filtered activities ─── */
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter((a) => a.type === activityFilter);
  }, [activities, activityFilter]);

  /* ─── Activity type counts ─── */
  const actTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  /* ─── Actions ─── */
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  const handleRevokeTrust = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeviceTrust('new');
    setConfirmRevoke(false);
    setActionLoading(false);
  };

  const handleBlockDevice = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeviceTrust('blocked');
    setConfirmBlock(false);
    setActionLoading(false);
  };

  const handleTrustDevice = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setDeviceTrust('trusted');
    setActionLoading(false);
  };

  /* ─── Helpers ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const currentTrust = TRUST_CONFIG[deviceTrust];

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/profile/devices')}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
              Chi tiết thiết bị
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Bảo mật &gt; Thiết bị &gt; {device.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIP(!showIP)}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              color: c.text2,
              fontSize: WEB_FONT.xs,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {showIP ? <EyeOff size={13} /> : <Eye size={13} />}
            {showIP ? 'Ẩn IP' : 'Hiện IP'}
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* ═══ Device hero ═══ */}
          <div style={card({ borderColor: currentTrust.border })}>
            <div className="flex items-start gap-4">
              {/* Device icon */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: currentTrust.bg,
                  border: `1.5px solid ${currentTrust.border}`,
                }}
              >
                <DevIcon size={30} color={currentTrust.color} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 4 }}>
                  {renaming ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        autoFocus
                        className="outline-none"
                        style={{
                          height: 28,
                          borderRadius: 6,
                          border: `1.5px solid #3B82F6`,
                          background: c.bg,
                          padding: '0 8px',
                          color: c.text1,
                          fontSize: WEB_FONT.md,
                          fontWeight: 600,
                        }}
                      />
                      <button
                        onClick={() => setRenaming(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <CheckCircle size={16} color="#10B981" />
                      </button>
                      <button
                        onClick={() => {
                          setDeviceName(device.name);
                          setRenaming(false);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <X size={16} color={c.text3} />
                      </button>
                    </div>
                  ) : (
                    <h2
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.xl,
                        fontWeight: 700,
                        margin: 0,
                        cursor: 'pointer',
                      }}
                      onClick={() => setRenaming(true)}
                    >
                      {deviceName}
                    </h2>
                  )}
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: currentTrust.bg,
                      border: `1px solid ${currentTrust.border}`,
                      color: currentTrust.color,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                    }}
                  >
                    {currentTrust.label}
                  </span>
                  {device.isCurrent && (
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        color: '#3B82F6',
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                      }}
                    >
                      Phiên hiện tại
                    </span>
                  )}
                </div>

                <p style={{ color: c.text2, fontSize: WEB_FONT.md, marginBottom: 10 }}>
                  {device.os} {device.osVersion} — {device.browser} {device.browserVersion}
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap" style={{ gap: 16 }}>
                  {[
                    { label: 'Đăng nhập', value: device.totalLogins, icon: LogIn },
                    { label: 'Hành động', value: device.totalActions, icon: Zap },
                    { label: 'Phiên', value: device.sessions, icon: Monitor },
                    { label: 'Passkey', value: device.passkeys, icon: Fingerprint },
                    {
                      label: 'Rủi ro',
                      value: `${device.riskScore}%`,
                      icon: AlertTriangle,
                      color:
                        device.riskScore > 50
                          ? '#EF4444'
                          : device.riskScore > 20
                            ? '#F59E0B'
                            : '#10B981',
                    },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <s.icon size={12} color={s.color || c.text3} />
                      <span
                        style={{
                          color: s.color || c.text1,
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                        }}
                      >
                        {s.value}
                      </span>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col shrink-0" style={{ gap: 6 }}>
                {!renaming && (
                  <button
                    onClick={() => setRenaming(true)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: c.bg,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Đổi tên
                  </button>
                )}
                {deviceTrust === 'trusted' && !device.isCurrent && (
                  <button
                    onClick={() => setConfirmRevoke(true)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'rgba(245,158,11,0.04)',
                      border: `1px solid rgba(245,158,11,0.15)`,
                      color: '#D97706',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy tin tưởng
                  </button>
                )}
                {deviceTrust !== 'blocked' && !device.isCurrent && (
                  <button
                    onClick={() => setConfirmBlock(true)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'rgba(239,68,68,0.04)',
                      border: `1px solid rgba(239,68,68,0.15)`,
                      color: '#EF4444',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Chặn thiết bị
                  </button>
                )}
                {(deviceTrust === 'new' || deviceTrust === 'recognized') && (
                  <button
                    onClick={handleTrustDevice}
                    disabled={actionLoading}
                    className="flex items-center gap-1"
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: '#10B981',
                      border: 'none',
                      color: '#fff',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ShieldCheck size={11} /> Tin tưởng
                  </button>
                )}
              </div>
            </div>

            {/* Confirm revoke */}
            {confirmRevoke && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(245,158,11,0.03)',
                  border: '1px solid rgba(245,158,11,0.12)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} color="#F59E0B" />
                  <p style={{ color: '#D97706', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                    Hủy tin tưởng thiết bị này?
                  </p>
                </div>
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.xs,
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  Thiết bị sẽ cần xác thực 2FA cho mọi đăng nhập tiếp theo. Passkey trên thiết bị
                  này vẫn hoạt động.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRevokeTrust}
                    disabled={actionLoading}
                    className="flex items-center gap-1"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#F59E0B',
                      border: 'none',
                      color: '#fff',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading ? (
                      <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <CheckCircle size={11} />
                    )}
                    Xác nhận
                  </button>
                  <button
                    onClick={() => setConfirmRevoke(false)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: c.bg,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Confirm block */}
            {confirmBlock && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.02)',
                  border: '1px solid rgba(239,68,68,0.1)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Ban size={13} color="#EF4444" />
                  <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                    Chặn thiết bị này?
                  </p>
                </div>
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.xs,
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  Thiết bị sẽ bị cấm đăng nhập vĩnh viễn. Tất cả phiên từ thiết bị này sẽ bị kết
                  thúc ngay lập tức.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBlockDevice}
                    disabled={actionLoading}
                    className="flex items-center gap-1"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#EF4444',
                      border: 'none',
                      color: '#fff',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading ? (
                      <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Ban size={11} />
                    )}
                    Chặn vĩnh viễn
                  </button>
                  <button
                    onClick={() => setConfirmBlock(false)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: c.bg,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Security attributes ═══ */}
          <div style={card()}>
            <button
              onClick={() => setExpandAttributes(!expandAttributes)}
              className="flex items-center justify-between"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <Fingerprint size={16} color={c.text2} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Thuộc tính bảo mật
                </h3>
              </div>
              {expandAttributes ? (
                <ChevronUp size={16} color={c.text3} />
              ) : (
                <ChevronDown size={16} color={c.text3} />
              )}
            </button>

            {expandAttributes && (
              <div className="flex flex-col" style={{ marginTop: 14, gap: 0 }}>
                {/* Fingerprint */}
                <div
                  className="flex items-center"
                  style={{ padding: '10px 0', gap: 14, borderBottom: `1px solid ${c.borderSolid}` }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(139,92,246,0.06)',
                    }}
                  >
                    <Fingerprint size={15} color="#8B5CF6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                      Device Fingerprint
                    </p>
                    <code
                      style={{ color: c.text3, fontSize: WEB_FONT.xs, fontFamily: 'monospace' }}
                    >
                      {showFingerprint ? device.fingerprint : '••••••••_••••_••••_••••'}
                    </code>
                  </div>
                  <button
                    onClick={() => setShowFingerprint(!showFingerprint)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    {showFingerprint ? (
                      <EyeOff size={14} color={c.text3} />
                    ) : (
                      <Eye size={14} color={c.text3} />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(device.fingerprint, 'fp')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    {copiedField === 'fp' ? (
                      <CheckCircle size={14} color="#10B981" />
                    ) : (
                      <Copy size={14} color={c.text3} />
                    )}
                  </button>
                </div>

                {/* Info rows */}
                {[
                  {
                    icon: Globe,
                    label: 'IP hiện tại',
                    value: showIP ? device.lastIP : '•••.•••.•••.•••',
                    copyKey: 'ip',
                    copyValue: device.lastIP,
                  },
                  {
                    icon: MapPin,
                    label: 'Vị trí',
                    value: `${device.lastLocation}, ${device.lastCountry}`,
                  },
                  {
                    icon: Calendar,
                    label: 'Tin tưởng từ',
                    value: device.trustedSince || 'Chưa tin tưởng',
                  },
                  { icon: Clock, label: 'Hoạt động cuối', value: device.lastActive },
                  { icon: Cpu, label: 'Hệ điều hành', value: `${device.os} ${device.osVersion}` },
                  {
                    icon: Globe,
                    label: 'Trình duyệt',
                    value: `${device.browser} ${device.browserVersion}`,
                  },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="flex items-center"
                    style={{
                      padding: '10px 0',
                      gap: 14,
                      borderBottom: i < 5 ? `1px solid ${c.borderSolid}` : 'none',
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 32, height: 32, borderRadius: 8, background: c.bg }}
                    >
                      <row.icon size={15} color={c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{row.label}</p>
                      <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                        {row.value}
                      </p>
                    </div>
                    {row.copyKey && (
                      <button
                        onClick={() => handleCopy(row.copyValue!, row.copyKey!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        {copiedField === row.copyKey ? (
                          <CheckCircle size={12} color="#10B981" />
                        ) : (
                          <Copy size={12} color={c.text3} />
                        )}
                      </button>
                    )}
                  </div>
                ))}

                {/* IP history */}
                <div style={{ padding: '12px 0' }}>
                  <p
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Lịch sử IP ({device.ipHistory.length})
                  </p>
                  <div className="flex flex-wrap" style={{ gap: 4 }}>
                    {device.ipHistory.map((ip, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: c.bg,
                          border: `1px solid ${c.borderSolid}`,
                          color: c.text2,
                          fontSize: WEB_FONT.xs,
                          fontFamily: 'monospace',
                        }}
                      >
                        {showIP ? ip : '•••.•••.xxx.xxx'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Location history */}
                <div>
                  <p
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Lịch sử vị trí
                  </p>
                  <div className="flex flex-wrap" style={{ gap: 4 }}>
                    {device.locationHistory.map((loc, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1"
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: c.bg,
                          border: `1px solid ${c.borderSolid}`,
                          color: c.text2,
                          fontSize: WEB_FONT.xs,
                        }}
                      >
                        <MapPin size={10} />
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Activity log ═══ */}
          <div style={card()}>
            <button
              onClick={() => setExpandActivity(!expandActivity)}
              className="flex items-center justify-between"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} color={c.text2} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Nhật ký hoạt động
                </h3>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  {activities.length} sự kiện
                </span>
              </div>
              {expandActivity ? (
                <ChevronUp size={16} color={c.text3} />
              ) : (
                <ChevronDown size={16} color={c.text3} />
              )}
            </button>

            {expandActivity && (
              <div style={{ marginTop: 14 }}>
                {/* Filter chips */}
                <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 14 }}>
                  <button
                    onClick={() => setActivityFilter('all')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      cursor: 'pointer',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      border: 'none',
                      background:
                        activityFilter === 'all' ? 'rgba(59,130,246,0.08)' : 'transparent',
                      color: activityFilter === 'all' ? '#3B82F6' : c.text3,
                      outline:
                        activityFilter === 'all'
                          ? '1.5px solid rgba(59,130,246,0.25)'
                          : `1px solid ${c.borderSolid}`,
                    }}
                  >
                    Tất cả ({activities.length})
                  </button>
                  {(Object.entries(actTypeCounts) as [string, number][]).map(([type, count]) => {
                    const cfg = ACTIVITY_CONFIG[type as ActivityType];
                    if (!cfg) return null;
                    return (
                      <button
                        key={type}
                        onClick={() => setActivityFilter(type as ActivityFilter)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 16,
                          cursor: 'pointer',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          border: 'none',
                          background: activityFilter === type ? `${cfg.color}08` : 'transparent',
                          color: activityFilter === type ? cfg.color : c.text3,
                          outline:
                            activityFilter === type
                              ? `1.5px solid ${cfg.color}40`
                              : `1px solid ${c.borderSolid}`,
                        }}
                      >
                        {cfg.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Activity list */}
                {filteredActivities.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center' }}>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
                      Không có hoạt động nào với bộ lọc hiện tại.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    {filteredActivities.map((entry, idx) => {
                      const cfg = ACTIVITY_CONFIG[entry.type];
                      const st = STATUS_CONFIG[entry.status];

                      return (
                        <div key={entry.id}>
                          {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                          <div className="flex items-center" style={{ padding: '10px 0', gap: 12 }}>
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: entry.riskFlag
                                  ? 'rgba(239,68,68,0.06)'
                                  : `${cfg.color}06`,
                                border: entry.riskFlag ? '1px solid rgba(239,68,68,0.12)' : 'none',
                              }}
                            >
                              <cfg.icon size={15} color={entry.riskFlag ? '#EF4444' : cfg.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2" style={{ marginBottom: 1 }}>
                                <p
                                  style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}
                                >
                                  {entry.title}
                                </p>
                                {entry.riskFlag && <AlertTriangle size={11} color="#EF4444" />}
                                <span
                                  style={{
                                    padding: '0px 6px',
                                    borderRadius: 4,
                                    background: `${st.color}08`,
                                    color: st.color,
                                    fontSize: 9,
                                    fontWeight: 600,
                                  }}
                                >
                                  {st.label}
                                </span>
                              </div>
                              <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                {entry.detail}
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0" style={{ gap: 2 }}>
                              <span style={{ color: c.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
                                {entry.time}
                              </span>
                              <div className="flex items-center gap-1">
                                <MapPin size={9} color={c.text3} />
                                <span style={{ color: c.text3, fontSize: 10 }}>
                                  {entry.location}
                                </span>
                              </div>
                              {showIP && (
                                <span
                                  style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}
                                >
                                  {entry.ip}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ Info footer ═══ */}
          <div
            className="flex items-start gap-3"
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.03)',
              border: '1px solid rgba(59,130,246,0.1)',
            }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Thiết bị được nhận diện bằng device fingerprint (kết hợp hardware + software signals).
              Thiết bị tin tưởng có thể bỏ qua 2FA cho đăng nhập. Nếu không nhận ra thiết bị này,
              hãy <strong>chặn ngay</strong> và{' '}
              <button
                onClick={() => navigate('/w/profile/security/change-password')}
                style={{
                  color: '#EF4444',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                đổi mật khẩu
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
