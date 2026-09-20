import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  AlertTriangle, CheckCircle, XCircle, Info, ChevronRight,
  ChevronDown, Clock, MapPin, Monitor, Globe, Smartphone,
  Laptop, Lock, LogIn, LogOut, Key, Eye, EyeOff, Search,
  Filter, Calendar, X, RefreshCw, Download, Bell,
  Zap, Wallet, FileText, Ban, RotateCcw, SlidersHorizontal,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebSecurityAlertListPage — All security alerts with filters
 *
 * Route: /w/profile/security/alerts
 *
 * Features:
 *   - Full list of security alerts/incidents
 *   - Filter by severity (critical/high/medium/low/info)
 *   - Filter by status (active/investigating/resolved/dismissed)
 *   - Filter by date range
 *   - Search by keyword
 *   - Sort options
 *   - Bulk actions (resolve, dismiss)
 *   - Summary stats bar
 *
 * Guidelines:
 *   - §14.1: Security Center
 *   - §4.4: Cards scannable — leading/primary/secondary/trailing
 *   - §7.4: Feedback — empty state, loading
 */

/* ═══ Types ═══ */
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'active' | 'investigating' | 'resolved' | 'dismissed';
type SortOption = 'newest' | 'oldest' | 'severity' | 'status';

interface SecurityAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  createdAt: string;
  sortDate: number;
  source: string;
  location: string;
  ip: string;
  device: string;
  deviceType: 'desktop' | 'mobile';
  icon: React.ElementType;
  responseCount: number;
  resolvedCount: number;
}

/* ═══ Config ═══ */
const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string; icon: React.ElementType; weight: number }> = {
  critical: { label: 'Nghiêm trọng', color: '#DC2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.15)', icon: ShieldOff, weight: 5 },
  high: { label: 'Cao', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', icon: ShieldAlert, weight: 4 },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', icon: AlertTriangle, weight: 3 },
  low: { label: 'Thấp', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', icon: Info, weight: 2 },
  info: { label: 'Thông tin', color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', icon: Info, weight: 1 },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: 'Đang hoạt động', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', icon: Zap },
  investigating: { label: 'Đang điều tra', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', icon: Search },
  resolved: { label: 'Đã xử lý', color: '#10B981', bg: 'rgba(16,185,129,0.06)', icon: CheckCircle },
  dismissed: { label: 'Đã bỏ qua', color: '#6B7280', bg: 'rgba(107,114,128,0.06)', icon: XCircle },
};

const DATE_RANGES = [
  { id: 'all', label: 'Tất cả' },
  { id: '24h', label: '24 giờ' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '90 ngày' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'oldest', label: 'Cũ nhất' },
  { id: 'severity', label: 'Mức độ' },
  { id: 'status', label: 'Trạng thái' },
];

/* ═══ Mock data ═══ */
const MOCK_ALERTS: SecurityAlert[] = [
  {
    id: 'alert-1',
    type: 'unauthorized_login',
    title: 'Đăng nhập trái phép bị chặn',
    description: 'Nỗ lực đăng nhập từ Moscow, Russia qua mạng TOR đã bị chặn tự động.',
    severity: 'critical',
    status: 'active',
    createdAt: '13/03/2026, 18:05',
    sortDate: Date.now() - 1000 * 60 * 30,
    source: 'Hệ thống giám sát',
    location: 'Moscow, Russia',
    ip: '185.220.101.xxx',
    device: 'Unknown Device',
    deviceType: 'desktop',
    icon: LogIn,
    responseCount: 6,
    resolvedCount: 0,
  },
  {
    id: 'alert-2',
    type: 'large_withdrawal',
    title: 'Rút số lượng lớn — 2.5 BTC',
    description: 'Lệnh rút 2.5 BTC (~$162,500) vượt ngưỡng cảnh báo $5,000.',
    severity: 'high',
    status: 'resolved',
    createdAt: '12/03/2026, 14:22',
    sortDate: Date.now() - 1000 * 60 * 60 * 28,
    source: 'Hệ thống rút tiền',
    location: 'Hồ Chí Minh, VN',
    ip: '103.152.xxx.xxx',
    device: 'MacBook Pro 16"',
    deviceType: 'desktop',
    icon: Wallet,
    responseCount: 1,
    resolvedCount: 1,
  },
  {
    id: 'alert-3',
    type: 'new_device_login',
    title: 'Đăng nhập từ thiết bị mới',
    description: 'Đăng nhập thành công từ iPhone 15 Pro — Hà Nội, Việt Nam.',
    severity: 'medium',
    status: 'resolved',
    createdAt: '11/03/2026, 09:15',
    sortDate: Date.now() - 1000 * 60 * 60 * 57,
    source: 'Hệ thống thiết bị',
    location: 'Hà Nội, VN',
    ip: '42.115.xxx.xxx',
    device: 'iPhone 15 Pro',
    deviceType: 'mobile',
    icon: Smartphone,
    responseCount: 2,
    resolvedCount: 2,
  },
  {
    id: 'alert-4',
    type: 'password_attempt',
    title: '5 lần nhập sai mật khẩu liên tiếp',
    description: 'Phát hiện 5 lần đăng nhập sai từ IP 185.220.xxx.xxx trong 3 phút.',
    severity: 'high',
    status: 'investigating',
    createdAt: '10/03/2026, 22:33',
    sortDate: Date.now() - 1000 * 60 * 60 * 68,
    source: 'Hệ thống đăng nhập',
    location: 'Unknown',
    ip: '185.220.xxx.xxx',
    device: 'Unknown Device',
    deviceType: 'desktop',
    icon: Lock,
    responseCount: 3,
    resolvedCount: 1,
  },
  {
    id: 'alert-5',
    type: 'api_key_created',
    title: 'API Key mới được tạo',
    description: 'API key "Trading Bot Prod" đã được tạo với quyền trade-only.',
    severity: 'info',
    status: 'resolved',
    createdAt: '09/03/2026, 16:40',
    sortDate: Date.now() - 1000 * 60 * 60 * 98,
    source: 'Hệ thống API',
    location: 'Hồ Chí Minh, VN',
    ip: '123.45.xxx.xxx',
    device: 'Chrome on Windows',
    deviceType: 'desktop',
    icon: Key,
    responseCount: 0,
    resolvedCount: 0,
  },
  {
    id: 'alert-6',
    type: 'whitelist_change',
    title: 'Địa chỉ rút tiền mới được thêm',
    description: 'Địa chỉ USDT (TRC20) Txxx...abc đã được thêm vào whitelist.',
    severity: 'medium',
    status: 'resolved',
    createdAt: '08/03/2026, 11:20',
    sortDate: Date.now() - 1000 * 60 * 60 * 127,
    source: 'Hệ thống whitelist',
    location: 'Hồ Chí Minh, VN',
    ip: '123.45.xxx.xxx',
    device: 'Chrome on Windows',
    deviceType: 'desktop',
    icon: FileText,
    responseCount: 1,
    resolvedCount: 1,
  },
  {
    id: 'alert-7',
    type: '2fa_disabled',
    title: 'Yêu cầu tắt 2FA bị từ chối',
    description: 'Yêu cầu tắt 2FA không qua được xác thực email — bị chặn.',
    severity: 'critical',
    status: 'dismissed',
    createdAt: '05/03/2026, 03:12',
    sortDate: Date.now() - 1000 * 60 * 60 * 207,
    source: 'Hệ thống 2FA',
    location: 'Unknown',
    ip: '91.234.xxx.xxx',
    device: 'Firefox on Linux',
    deviceType: 'desktop',
    icon: Shield,
    responseCount: 2,
    resolvedCount: 2,
  },
  {
    id: 'alert-8',
    type: 'session_hijack',
    title: 'Phiên bất thường bị kết thúc',
    description: 'Phát hiện session token bất thường từ IP không khớp — phiên đã bị terminate.',
    severity: 'high',
    status: 'resolved',
    createdAt: '01/03/2026, 19:55',
    sortDate: Date.now() - 1000 * 60 * 60 * 286,
    source: 'Hệ thống phiên',
    location: 'Jakarta, Indonesia',
    ip: '110.137.xxx.xxx',
    device: 'Unknown Browser',
    deviceType: 'desktop',
    icon: Ban,
    responseCount: 3,
    resolvedCount: 3,
  },
  {
    id: 'alert-9',
    type: 'login_new_country',
    title: 'Đăng nhập từ quốc gia mới',
    description: 'Đăng nhập thành công từ Singapore — lần đầu tiên từ quốc gia này.',
    severity: 'low',
    status: 'resolved',
    createdAt: '25/02/2026, 08:30',
    sortDate: Date.now() - 1000 * 60 * 60 * 406,
    source: 'Hệ thống giám sát',
    location: 'Singapore',
    ip: '13.250.xxx.xxx',
    device: 'iPhone 15 Pro',
    deviceType: 'mobile',
    icon: Globe,
    responseCount: 0,
    resolvedCount: 0,
  },
  {
    id: 'alert-10',
    type: 'anti_phishing_triggered',
    title: 'Email giả mạo bị phát hiện',
    description: 'Email thiếu mã anti-phishing đã cố yêu cầu xác nhận rút tiền.',
    severity: 'medium',
    status: 'dismissed',
    createdAt: '20/02/2026, 14:10',
    sortDate: Date.now() - 1000 * 60 * 60 * 526,
    source: 'Hệ thống anti-phishing',
    location: 'N/A',
    ip: 'N/A',
    device: 'Email client',
    deviceType: 'desktop',
    icon: ShieldAlert,
    responseCount: 1,
    resolvedCount: 1,
  },
];

/* ═══ Component ═══ */
export function WebSecurityAlertListPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  /* ─── State ─── */
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Set<Severity>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<AlertStatus>>(new Set());
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(true);
  const [showIP, setShowIP] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  /* ─── Filter logic ─── */
  const filteredAlerts = useMemo(() => {
    let items = [...MOCK_ALERTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.device.toLowerCase().includes(q)
      );
    }

    // Severity
    if (severityFilter.size > 0) {
      items = items.filter(a => severityFilter.has(a.severity));
    }

    // Status
    if (statusFilter.size > 0) {
      items = items.filter(a => statusFilter.has(a.status));
    }

    // Date range
    if (dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (ranges[dateRange] || 0);
      items = items.filter(a => a.sortDate >= cutoff);
    }

    // Sort
    switch (sortBy) {
      case 'newest': items.sort((a, b) => b.sortDate - a.sortDate); break;
      case 'oldest': items.sort((a, b) => a.sortDate - b.sortDate); break;
      case 'severity': items.sort((a, b) => SEVERITY_CONFIG[b.severity].weight - SEVERITY_CONFIG[a.severity].weight); break;
      case 'status': {
        const ord: Record<AlertStatus, number> = { active: 0, investigating: 1, resolved: 2, dismissed: 3 };
        items.sort((a, b) => ord[a.status] - ord[b.status]);
        break;
      }
    }

    return items;
  }, [searchQuery, severityFilter, statusFilter, dateRange, sortBy]);

  /* ─── Stats ─── */
  const stats = useMemo(() => ({
    total: MOCK_ALERTS.length,
    active: MOCK_ALERTS.filter(a => a.status === 'active').length,
    investigating: MOCK_ALERTS.filter(a => a.status === 'investigating').length,
    resolved: MOCK_ALERTS.filter(a => a.status === 'resolved').length,
    critical: MOCK_ALERTS.filter(a => a.severity === 'critical').length,
    high: MOCK_ALERTS.filter(a => a.severity === 'high').length,
  }), []);

  const activeFilters = severityFilter.size + statusFilter.size + (dateRange !== 'all' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  /* ─── Toggle helpers ─── */
  const toggleSeverity = (sev: Severity) => {
    setSeverityFilter(prev => {
      const next = new Set(prev);
      next.has(sev) ? next.delete(sev) : next.add(sev);
      return next;
    });
  };
  const toggleStatus = (st: AlertStatus) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      next.has(st) ? next.delete(st) : next.add(st);
      return next;
    });
  };
  const toggleSelect = (id: string) => {
    setSelectedAlerts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter(new Set());
    setStatusFilter(new Set());
    setDateRange('all');
  };

  /* ─── Styles ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault, borderRadius: 14,
    background: c.surface, border: `1px solid ${c.borderSolid}`, ...extra,
  });

  const chipActive = (active: boolean, color: string): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
    fontSize: WEB_FONT.xs, fontWeight: 600, border: 'none',
    background: active ? `${color}12` : 'transparent',
    color: active ? color : c.text3,
    outline: active ? `1.5px solid ${color}40` : `1px solid ${c.borderSolid}`,
    transition: 'all 0.15s',
  });

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between" style={{ height: 56, padding: '0 24px', borderBottom: `1px solid ${c.borderSolid}`, background: c.surface }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/w/profile/security')} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.borderSolid}`, cursor: 'pointer' }}>
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Cảnh báo bảo mật</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Tất cả cảnh báo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowIP(!showIP)} className="flex items-center gap-1.5"
            style={{ padding: '6px 12px', borderRadius: 8, background: c.bg, border: `1px solid ${c.borderSolid}`, color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 500, cursor: 'pointer' }}>
            {showIP ? <EyeOff size={13} /> : <Eye size={13} />}
            {showIP ? 'Ẩn IP' : 'Hiện IP'}
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5"
            style={{ padding: '6px 12px', borderRadius: 8, background: showFilters ? 'rgba(59,130,246,0.06)' : c.bg, border: `1px solid ${showFilters ? 'rgba(59,130,246,0.2)' : c.borderSolid}`, color: showFilters ? '#3B82F6' : c.text2, fontSize: WEB_FONT.xs, fontWeight: 500, cursor: 'pointer' }}>
            <SlidersHorizontal size={13} />
            Bộ lọc
            {activeFilters > 0 && <span style={{ padding: '0 5px', borderRadius: 8, background: '#3B82F6', color: '#fff', fontSize: 9, fontWeight: 700 }}>{activeFilters}</span>}
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px' }}>
        <div className="flex flex-col" style={{ gap: 20 }}>

          {/* ═══ Stats bar ═══ */}
          <div className="flex" style={{ gap: 12 }}>
            {[
              { label: 'Tổng cảnh báo', value: stats.total, color: c.text1, bg: c.surface },
              { label: 'Cần xử lý', value: stats.active, color: '#EF4444', bg: 'rgba(239,68,68,0.04)' },
              { label: 'Đang điều tra', value: stats.investigating, color: '#F59E0B', bg: 'rgba(245,158,11,0.04)' },
              { label: 'Nghiêm trọng', value: stats.critical, color: '#DC2626', bg: 'rgba(220,38,38,0.04)' },
              { label: 'Đã xử lý', value: stats.resolved, color: '#10B981', bg: 'rgba(16,185,129,0.04)' },
            ].map(s => (
              <div key={s.label} className="flex-1" style={{ padding: '14px 16px', borderRadius: 12, background: s.bg, border: `1px solid ${c.borderSolid}`, textAlign: 'center' }}>
                <p style={{ color: s.color, fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ═══ Filters panel ═══ */}
          {showFilters && (
            <div style={card()}>
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={14} color={c.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm cảnh báo theo tiêu đề, mô tả, vị trí, thiết bị..."
                  className="outline-none"
                  style={{
                    width: '100%', height: WEB_BUTTON.md, borderRadius: 10,
                    border: `1px solid ${c.borderSolid}`, background: c.bg,
                    padding: '0 14px 0 36px', color: c.text1, fontSize: WEB_FONT.sm,
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color={c.text3} />
                  </button>
                )}
              </div>

              {/* Severity chips */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 8 }}>Mức độ</p>
                <div className="flex flex-wrap" style={{ gap: 6 }}>
                  {(Object.entries(SEVERITY_CONFIG) as [Severity, typeof SEVERITY_CONFIG[Severity]][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => toggleSeverity(key)} style={chipActive(severityFilter.has(key), cfg.color)}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status chips */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 8 }}>Trạng thái</p>
                <div className="flex flex-wrap" style={{ gap: 6 }}>
                  {(Object.entries(STATUS_CONFIG) as [AlertStatus, typeof STATUS_CONFIG[AlertStatus]][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => toggleStatus(key)} style={chipActive(statusFilter.has(key), cfg.color)}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range + Sort row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: 4 }}>
                  <Calendar size={13} color={c.text3} />
                  <span style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginRight: 6 }}>Thời gian:</span>
                  {DATE_RANGES.map(d => (
                    <button key={d.id} onClick={() => setDateRange(d.id)}
                      style={chipActive(dateRange === d.id, '#3B82F6')}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {activeFilters > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1"
                      style={{ color: '#EF4444', fontSize: WEB_FONT.xs, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <RotateCcw size={11} /> Xóa bộ lọc
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      style={{
                        padding: '4px 8px', borderRadius: 6,
                        border: `1px solid ${c.borderSolid}`, background: c.bg,
                        color: c.text1, fontSize: WEB_FONT.xs, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Results header ═══ */}
          <div className="flex items-center justify-between">
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
              Hiển thị <span style={{ color: c.text1, fontWeight: 600 }}>{filteredAlerts.length}</span> / {MOCK_ALERTS.length} cảnh báo
            </p>
            {selectedAlerts.size > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ color: c.text2, fontSize: WEB_FONT.xs }}>{selectedAlerts.size} đã chọn</span>
                <button style={{ padding: '4px 10px', borderRadius: 6, background: '#10B981', border: 'none', color: '#fff', fontSize: WEB_FONT.xs, fontWeight: 600, cursor: 'pointer' }}>
                  Đánh dấu xử lý
                </button>
                <button onClick={() => setSelectedAlerts(new Set())} style={{ padding: '4px 10px', borderRadius: 6, background: c.bg, border: `1px solid ${c.borderSolid}`, color: c.text3, fontSize: WEB_FONT.xs, cursor: 'pointer' }}>
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

          {/* ═══ Alert list ═══ */}
          {filteredAlerts.length === 0 ? (
            <div style={card({ textAlign: 'center' as const, padding: '48px 24px' })}>
              <div className="flex justify-center" style={{ marginBottom: 12 }}>
                <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.06)' }}>
                  <ShieldCheck size={28} color="#10B981" />
                </div>
              </div>
              <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 600, marginBottom: 4 }}>Không có cảnh báo nào</p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
                {activeFilters > 0 ? 'Thử thay đổi bộ lọc để xem thêm kết quả.' : 'Tài khoản của bạn hiện không có cảnh báo bảo mật.'}
              </p>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 mx-auto" style={{ marginTop: 12, color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <RotateCcw size={12} /> Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 8 }}>
              {filteredAlerts.map(alert => {
                const sev = SEVERITY_CONFIG[alert.severity];
                const sts = STATUS_CONFIG[alert.status];
                const AlertIcon = alert.icon;
                const isSelected = selectedAlerts.has(alert.id);

                return (
                  <div
                    key={alert.id}
                    className="flex items-center cursor-pointer transition-all"
                    onClick={() => navigate(`/w/profile/security/alerts/${alert.id}`)}
                    style={{
                      padding: '14px 16px', borderRadius: 12, gap: 14,
                      background: isSelected ? `${sev.color}04` : c.surface,
                      border: `1px solid ${isSelected ? `${sev.color}25` : alert.status === 'active' ? sev.border : c.borderSolid}`,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleSelect(alert.id); }}
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        border: `1.5px solid ${isSelected ? '#3B82F6' : c.borderSolid}`,
                        background: isSelected ? '#3B82F6' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected && <CheckCircle size={12} color="#fff" />}
                    </button>

                    {/* Icon */}
                    <div className="flex items-center justify-center shrink-0" style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: sev.bg, border: `1px solid ${sev.border}`,
                    }}>
                      <AlertIcon size={18} color={sev.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                        <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>{alert.title}</p>
                        <span style={{ padding: '1px 8px', borderRadius: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontSize: 10, fontWeight: 700 }}>
                          {sev.label}
                        </span>
                        <span style={{ padding: '1px 8px', borderRadius: 10, background: sts.bg, color: sts.color, fontSize: 10, fontWeight: 600 }}>
                          {sts.label}
                        </span>
                      </div>
                      <p style={{ color: c.text2, fontSize: WEB_FONT.sm, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.description}</p>
                      <div className="flex items-center" style={{ gap: 12, color: c.text3, fontSize: WEB_FONT.xs }}>
                        <span className="flex items-center gap-1"><Clock size={10} />{alert.createdAt}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{alert.location}</span>
                        <span className="flex items-center gap-1">
                          {alert.deviceType === 'mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                          {alert.device}
                        </span>
                        {showIP && <span className="flex items-center gap-1"><Globe size={10} />{alert.ip}</span>}
                      </div>
                    </div>

                    {/* Trailing */}
                    <div className="flex flex-col items-end shrink-0" style={{ gap: 4 }}>
                      {alert.status === 'active' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
                      )}
                      {alert.responseCount > 0 && (
                        <span style={{ color: c.text3, fontSize: 10 }}>{alert.resolvedCount}/{alert.responseCount} phản hồi</span>
                      )}
                      <ChevronRight size={14} color={c.text3} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ Footer info ═══ */}
          <div className="flex items-start gap-3" style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Cảnh báo bảo mật được tạo tự động bởi hệ thống giám sát. Cảnh báo mức <strong>Nghiêm trọng</strong> và <strong>Cao</strong> nên được xử lý trong vòng 24 giờ.
              Cảnh báo cũ hơn 90 ngày sẽ được lưu trữ tự động.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
