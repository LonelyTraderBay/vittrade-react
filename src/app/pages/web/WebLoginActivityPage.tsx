import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Monitor, Smartphone, Tablet, Globe,
  MapPin, Clock, CheckCircle, XCircle, AlertTriangle,
  Shield, Search, Filter, ChevronDown, ChevronUp,
  LogIn, LogOut, ShieldAlert, Eye, RefreshCw,
  Laptop, Info, Download,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebLoginActivityPage — Detailed login history & session management
 *
 * Route: /w/profile/security/login-activity
 *
 * Features:
 *   - Full login history with IP, location, device, browser, status
 *   - Filter by status (all/success/failed/suspicious)
 *   - Search by device/IP/location
 *   - Expandable detail rows
 *   - Active sessions management (terminate remote sessions)
 *   - Security alerts for suspicious activity
 *   - Export functionality
 *
 * Guidelines:
 *   - §14.1: Security Center — login activity
 *   - §14.2: Sensitive data masking (IP partial mask)
 *   - §4.4: Lists scannable — leading, primary, secondary, trailing
 */

/* ═══ Types ═══ */
type LoginStatus = 'success' | 'failed' | 'suspicious' | 'blocked';
type DeviceType = 'desktop' | 'mobile' | 'tablet';

interface LoginEntry {
  id: string;
  timestamp: string;
  timeAgo: string;
  device: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  ip: string;
  location: string;
  country: string;
  status: LoginStatus;
  statusDetail: string;
  method: string;
  isCurrentSession?: boolean;
  sessionActive?: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

/* ═══ Mock data ═══ */
const MOCK_ENTRIES: LoginEntry[] = [
  {
    id: 'l1', timestamp: '2026-03-13 14:32:05', timeAgo: 'Vừa xong',
    device: 'MacBook Pro 16"', deviceType: 'desktop', browser: 'Chrome 122', os: 'macOS Sonoma 14.3',
    ip: '103.152.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập thành công', method: 'Email + 2FA',
    isCurrentSession: true, sessionActive: true,
  },
  {
    id: 'l2', timestamp: '2026-03-13 09:15:42', timeAgo: '5 giờ trước',
    device: 'iPhone 15 Pro', deviceType: 'mobile', browser: 'Safari 17', os: 'iOS 17.4',
    ip: '113.185.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập bằng Passkey', method: 'Passkey (Face ID)',
    sessionActive: true,
  },
  {
    id: 'l3', timestamp: '2026-03-12 22:48:31', timeAgo: '16 giờ trước',
    device: 'Windows Desktop', deviceType: 'desktop', browser: 'Firefox 123', os: 'Windows 11',
    ip: '42.115.xxx.xxx', location: 'TP.HCM', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập thành công', method: 'Email + 2FA',
    sessionActive: false,
  },
  {
    id: 'l4', timestamp: '2026-03-12 18:05:12', timeAgo: '20 giờ trước',
    device: 'Unknown Device', deviceType: 'desktop', browser: 'Chrome 120', os: 'Linux',
    ip: '185.220.xxx.xxx', location: 'Moscow', country: 'Russia',
    status: 'suspicious', statusDetail: 'Đăng nhập từ vị trí bất thường — bị chặn bởi hệ thống', method: 'Email + Password',
  },
  {
    id: 'l5', timestamp: '2026-03-12 14:22:08', timeAgo: '1 ngày trước',
    device: 'MacBook Pro 16"', deviceType: 'desktop', browser: 'Chrome 122', os: 'macOS Sonoma 14.3',
    ip: '103.152.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'failed', statusDetail: 'Sai mật khẩu (lần 2/5)', method: 'Email + Password',
  },
  {
    id: 'l6', timestamp: '2026-03-11 10:33:55', timeAgo: '2 ngày trước',
    device: 'iPad Air', deviceType: 'tablet', browser: 'Safari 17', os: 'iPadOS 17.3',
    ip: '14.162.xxx.xxx', location: 'Đà Nẵng', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập thành công', method: 'Email + 2FA',
    sessionActive: false,
  },
  {
    id: 'l7', timestamp: '2026-03-10 08:12:44', timeAgo: '3 ngày trước',
    device: 'Unknown Device', deviceType: 'desktop', browser: 'Chrome 118', os: 'Windows 10',
    ip: '91.134.xxx.xxx', location: 'Paris', country: 'France',
    status: 'blocked', statusDetail: 'Bị chặn: Tài khoản tạm khóa do nhập sai 5 lần', method: 'Email + Password',
  },
  {
    id: 'l8', timestamp: '2026-03-09 19:45:22', timeAgo: '4 ngày trước',
    device: 'MacBook Pro 16"', deviceType: 'desktop', browser: 'Chrome 122', os: 'macOS Sonoma 14.3',
    ip: '103.152.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập thành công', method: 'Email + 2FA',
    sessionActive: false,
  },
  {
    id: 'l9', timestamp: '2026-03-08 11:28:09', timeAgo: '5 ngày trước',
    device: 'Samsung Galaxy S24', deviceType: 'mobile', browser: 'Chrome 122', os: 'Android 14',
    ip: '113.185.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'success', statusDetail: 'Đăng nhập bằng OTP email', method: 'Email + OTP',
    sessionActive: false,
  },
  {
    id: 'l10', timestamp: '2026-03-07 16:55:33', timeAgo: '6 ngày trước',
    device: 'MacBook Pro 16"', deviceType: 'desktop', browser: 'Chrome 122', os: 'macOS Sonoma 14.3',
    ip: '103.152.xxx.xxx', location: 'Hà Nội', country: 'Việt Nam',
    status: 'failed', statusDetail: 'Sai mã OTP', method: 'Email + OTP',
  },
];

const ACTIVE_SESSIONS: ActiveSession[] = [
  { id: 's1', device: 'MacBook Pro 16"', deviceType: 'desktop', browser: 'Chrome 122', os: 'macOS Sonoma', ip: '103.152.xxx.xxx', location: 'Hà Nội', lastActive: 'Đang hoạt động', isCurrent: true },
  { id: 's2', device: 'iPhone 15 Pro', deviceType: 'mobile', browser: 'Safari 17', os: 'iOS 17.4', ip: '113.185.xxx.xxx', location: 'Hà Nội', lastActive: '5 giờ trước', isCurrent: false },
];

/* ═══ Helpers ═══ */
const STATUS_CONFIG: Record<LoginStatus, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  success: { color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', label: 'Thành công', icon: CheckCircle },
  failed: { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', label: 'Thất bại', icon: XCircle },
  suspicious: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', label: 'Đáng ngờ', icon: ShieldAlert },
  blocked: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', label: 'Bị chặn', icon: Shield },
};

const DEVICE_ICONS: Record<DeviceType, React.ElementType> = {
  desktop: Laptop, mobile: Smartphone, tablet: Tablet,
};

type FilterStatus = 'all' | LoginStatus;

export function WebLoginActivityPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(true);

  /* ─── Filtering ─── */
  const filtered = MOCK_ENTRIES.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.device.toLowerCase().includes(q) || e.ip.includes(q)
        || e.location.toLowerCase().includes(q) || e.browser.toLowerCase().includes(q);
    }
    return true;
  });

  /* ─── Stats ─── */
  const stats = {
    total: MOCK_ENTRIES.length,
    success: MOCK_ENTRIES.filter(e => e.status === 'success').length,
    failed: MOCK_ENTRIES.filter(e => e.status === 'failed').length,
    suspicious: MOCK_ENTRIES.filter(e => e.status === 'suspicious' || e.status === 'blocked').length,
  };

  /* ─── Terminate session ─── */
  const handleTerminate = async (id: string) => {
    setTerminatingId(id);
    await new Promise(r => setTimeout(r, 800));
    setSessions(prev => prev.filter(s => s.id !== id));
    setTerminatingId(null);
  };

  /* ─── Card style ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault, borderRadius: 14,
    background: c.surface, border: `1px solid ${c.borderSolid}`, ...extra,
  });

  const filterBtns: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: stats.total },
    { key: 'success', label: 'Thành công', count: stats.success },
    { key: 'failed', label: 'Thất bại', count: stats.failed },
    { key: 'suspicious', label: 'Đáng ngờ', count: stats.suspicious },
  ];

  return (
    <PageLayout>
      {/* ─── Header bar ─── */}
      <div
        className="flex items-center justify-between"
        style={{ height: 56, padding: '0 24px', borderBottom: `1px solid ${c.borderSolid}`, background: c.surface }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/profile/security')}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.borderSolid}`, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Lịch sử đăng nhập</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Hoạt động đăng nhập</p>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5"
          style={{ padding: '6px 14px', borderRadius: 8, background: c.bg, border: `1px solid ${c.borderSolid}`, cursor: 'pointer', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500 }}
        >
          <Download size={14} /> Xuất CSV
        </button>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>

          {/* ═══ Security alert (if suspicious detected) ═══ */}
          {stats.suspicious > 0 && (
            <div
              className="flex items-start gap-3"
              style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <ShieldAlert size={18} color="#EF4444" className="shrink-0" style={{ marginTop: 1 }} />
              <div className="flex-1">
                <p style={{ color: '#EF4444', fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 3 }}>
                  Phát hiện hoạt động đáng ngờ
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  {stats.suspicious} lần đăng nhập bất thường trong 7 ngày qua. Kiểm tra chi tiết bên dưới và{' '}
                  <button
                    onClick={() => navigate('/w/auth/forgot-password')}
                    className="hover:underline"
                    style={{ color: '#3B82F6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >đổi mật khẩu</button> nếu bạn không nhận ra hoạt động này.
                </p>
              </div>
            </div>
          )}

          {/* ═══ Stats row ═══ */}
          <div className="grid grid-cols-4" style={{ gap: 12 }}>
            {[
              { label: 'Tổng đăng nhập', value: stats.total, color: '#3B82F6', sub: '7 ngày qua' },
              { label: 'Thành công', value: stats.success, color: '#10B981', sub: `${Math.round(stats.success / stats.total * 100)}%` },
              { label: 'Thất bại', value: stats.failed, color: '#F59E0B', sub: 'Sai mật khẩu/OTP' },
              { label: 'Đáng ngờ', value: stats.suspicious, color: '#EF4444', sub: 'Cần kiểm tra' },
            ].map(s => (
              <div key={s.label} style={card({ textAlign: 'center' as const, padding: 16 })}>
                <p style={{ color: s.color, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 2 }}>{s.value}</p>
                <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 2 }}>{s.label}</p>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ═══ Active sessions ═══ */}
          <div style={card()}>
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="flex items-center justify-between"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showSessions ? 14 : 0 }}
            >
              <div className="flex items-center gap-2">
                <Monitor size={16} color="#3B82F6" />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Phiên đang hoạt động ({sessions.length})
                </h3>
              </div>
              {showSessions ? <ChevronUp size={16} color={c.text3} /> : <ChevronDown size={16} color={c.text3} />}
            </button>

            {showSessions && (
              <div className="flex flex-col" style={{ gap: 10 }}>
                {sessions.map(s => {
                  const DevIcon = DEVICE_ICONS[s.deviceType];
                  return (
                    <div
                      key={s.id}
                      className="flex items-center"
                      style={{
                        padding: '12px 14px', borderRadius: 10, gap: 14,
                        background: s.isCurrent ? 'rgba(59,130,246,0.03)' : c.bg,
                        border: `1px solid ${s.isCurrent ? 'rgba(59,130,246,0.12)' : c.borderSolid}`,
                      }}
                    >
                      <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 10, background: s.isCurrent ? 'rgba(59,130,246,0.06)' : c.surface }}>
                        <DevIcon size={18} color={s.isCurrent ? '#3B82F6' : c.text3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500 }}>{s.device}</p>
                          {s.isCurrent && (
                            <span style={{ padding: '1px 8px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                              Phiên hiện tại
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.browser} · {s.os}</span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.location} · {s.ip}</span>
                          <span style={{ color: s.isCurrent ? '#10B981' : c.text3, fontSize: WEB_FONT.xs, fontWeight: s.isCurrent ? 600 : 400 }}>{s.lastActive}</span>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => handleTerminate(s.id)}
                          disabled={terminatingId === s.id}
                          className="flex items-center gap-1.5 shrink-0"
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                            color: '#EF4444', fontSize: WEB_FONT.xs, fontWeight: 600,
                            cursor: terminatingId === s.id ? 'not-allowed' : 'pointer',
                            opacity: terminatingId === s.id ? 0.6 : 1,
                          }}
                        >
                          <LogOut size={12} />
                          {terminatingId === s.id ? 'Đang...' : 'Kết thúc'}
                        </button>
                      )}
                    </div>
                  );
                })}

                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <button
                    onClick={() => { setSessions(prev => prev.filter(s => s.isCurrent)); }}
                    className="flex items-center justify-center gap-1.5"
                    style={{
                      height: 36, borderRadius: 8, width: '100%',
                      background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
                      color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600,
                      cursor: 'pointer', marginTop: 4,
                    }}
                  >
                    <LogOut size={14} />
                    Kết thúc tất cả phiên khác
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ═══ Login history ═══ */}
          <div style={card()}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>Lịch sử đăng nhập</h3>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>7 ngày gần nhất</span>
            </div>

            {/* Search & filter */}
            <div className="flex items-center" style={{ gap: 10, marginBottom: 16 }}>
              <div className="flex-1 flex items-center" style={{ height: 38, borderRadius: 8, border: `1px solid ${c.borderSolid}`, background: c.bg, padding: '0 12px', gap: 8 }}>
                <Search size={14} color={c.text3} />
                <input
                  type="text" placeholder="Tìm thiết bị, IP, vị trí..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none min-w-0"
                  style={{ color: c.text1, fontSize: WEB_FONT.sm, height: '100%' }}
                />
              </div>
              <div className="flex" style={{ gap: 4 }}>
                {filterBtns.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="flex items-center gap-1"
                    style={{
                      padding: '6px 10px', borderRadius: 6,
                      background: filter === f.key ? '#3B82F6' : c.bg,
                      color: filter === f.key ? '#fff' : c.text2,
                      fontSize: WEB_FONT.xs, fontWeight: 500,
                      border: `1px solid ${filter === f.key ? '#3B82F6' : c.borderSolid}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                    <span style={{
                      fontSize: 10, fontWeight: 700, marginLeft: 2,
                      opacity: filter === f.key ? 1 : 0.6,
                    }}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entries */}
            <div className="flex flex-col" style={{ gap: 0 }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center" style={{ padding: '32px 0' }}>
                  <Search size={24} color={c.text3} style={{ marginBottom: 8 }} />
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Không tìm thấy kết quả</p>
                </div>
              ) : filtered.map((entry, idx) => {
                const sc = STATUS_CONFIG[entry.status];
                const DevIcon = DEVICE_ICONS[entry.deviceType];
                const StatusIcon = sc.icon;
                const isExpanded = expandedId === entry.id;

                return (
                  <div key={entry.id}>
                    {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex items-center"
                      style={{
                        width: '100%', padding: '12px 0', gap: 14,
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {/* Device icon */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 38, height: 38, borderRadius: 10, background: sc.bg, border: `1px solid ${sc.border}` }}
                      >
                        <DevIcon size={17} color={sc.color} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.device}
                          </p>
                          {entry.isCurrentSession && (
                            <span style={{ padding: '1px 6px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{entry.location}, {entry.country}</span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>·</span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{entry.ip}</span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="shrink-0 text-right" style={{ minWidth: 80 }}>
                        <p style={{ color: c.text2, fontSize: WEB_FONT.xs, marginBottom: 2 }}>{entry.timeAgo}</p>
                        {/* Status badge */}
                        <div className="flex items-center justify-end gap-1">
                          <StatusIcon size={11} color={sc.color} />
                          <span style={{ color: sc.color, fontSize: WEB_FONT.xs, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>

                      <div className="shrink-0" style={{ marginLeft: 4 }}>
                        {isExpanded ? <ChevronUp size={14} color={c.text3} /> : <ChevronDown size={14} color={c.text3} />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '14px 16px', borderRadius: 10, marginBottom: 8,
                          background: c.bg, border: `1px solid ${c.borderSolid}`,
                        }}
                      >
                        <div className="grid grid-cols-2" style={{ gap: 12 }}>
                          {[
                            { icon: Clock, label: 'Thời gian chính xác', value: entry.timestamp },
                            { icon: Globe, label: 'Trình duyệt', value: `${entry.browser} — ${entry.os}` },
                            { icon: MapPin, label: 'Vị trí', value: `${entry.location}, ${entry.country}` },
                            { icon: Shield, label: 'Phương thức', value: entry.method },
                            { icon: Monitor, label: 'Địa chỉ IP', value: entry.ip },
                            { icon: LogIn, label: 'Trạng thái', value: entry.statusDetail },
                          ].map(d => (
                            <div key={d.label} className="flex items-start gap-2">
                              <d.icon size={13} color={c.text3} style={{ marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 1 }}>{d.label}</p>
                                <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{d.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {(entry.status === 'suspicious' || entry.status === 'blocked') && (
                          <div
                            className="flex items-start gap-2"
                            style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.borderSolid}` }}
                          >
                            <AlertTriangle size={13} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ color: '#EF4444', fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                              Hoạt động này được đánh dấu đáng ngờ. Nếu không phải bạn, hãy đổi mật khẩu và kiểm tra thiết bị tin tưởng.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-3" style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Lịch sử đăng nhập được lưu trữ trong <span style={{ color: c.text1, fontWeight: 500 }}>90 ngày</span>.
              Nếu phát hiện hoạt động lạ, hãy{' '}
              <button onClick={() => navigate('/w/auth/forgot-password')} className="hover:underline" style={{ color: '#3B82F6', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>đổi mật khẩu</button>,{' '}
              <button onClick={() => navigate('/w/profile/security/passkey')} className="hover:underline" style={{ color: '#3B82F6', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>thêm Passkey</button>{' '}
              và liên hệ bộ phận hỗ trợ.
            </p>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
