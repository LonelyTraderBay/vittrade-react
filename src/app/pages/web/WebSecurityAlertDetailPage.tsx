import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Monitor,
  Globe,
  Smartphone,
  Laptop,
  Lock,
  LogIn,
  LogOut,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  Ban,
  Flag,
  RefreshCw,
  ExternalLink,
  Copy,
  Fingerprint,
  Mail,
  MessageSquare,
  FileText,
  Zap,
  Trash2,
  CheckCircle2,
  X,
  Send,
  Download,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebSecurityAlertDetailPage — Alert/incident detail with response actions
 *
 * Route: /w/profile/security/alerts/:alertId
 *
 * Features:
 *   - Full incident detail (type, severity, time, source)
 *   - Timeline of related events
 *   - Affected resources (sessions, devices, API keys)
 *   - Response actions (terminate session, block IP, change password, enable 2FA)
 *   - Resolution status & tracking
 *   - Similar incidents
 *   - Report false positive
 *
 * Guidelines:
 *   - §14.1: Security Center — alert investigation
 *   - §14.2: IP/device masking
 *   - §14.3: Response = high-risk → confirm
 *   - §5: Safety-by-design
 */

/* ═══ Types ═══ */
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'active' | 'investigating' | 'resolved' | 'dismissed';
type ActionType =
  | 'terminate'
  | 'block_ip'
  | 'change_pw'
  | 'enable_2fa'
  | 'revoke_api'
  | 'lock_account'
  | 'report_fp';

interface TimelineEvent {
  id: string;
  time: string;
  action: string;
  detail: string;
  icon: React.ElementType;
  iconColor: string;
}

interface AffectedResource {
  type: 'session' | 'device' | 'api_key' | 'address';
  name: string;
  detail: string;
  status: 'compromised' | 'safe' | 'unknown';
}

interface ResponseAction {
  id: ActionType;
  label: string;
  description: string;
  icon: React.ElementType;
  severity: 'destructive' | 'warning' | 'normal';
  executed?: boolean;
}

interface SecurityAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  source: string;
  location: string;
  country: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile';
  detailText: string;
  timeline: TimelineEvent[];
  affectedResources: AffectedResource[];
  responseActions: ResponseAction[];
  similarCount: number;
}

/* ═══ Mock data ═══ */
const MOCK_ALERTS: Record<string, SecurityAlert> = {
  'alert-1': {
    id: 'alert-1',
    type: 'unauthorized_login',
    title: 'Đăng nhập trái phép bị chặn',
    description: 'Phát hiện nỗ lực đăng nhập từ vị trí và IP bất thường. Hệ thống đã tự động chặn.',
    severity: 'critical',
    status: 'active',
    createdAt: '13/03/2026, 18:05',
    updatedAt: '13/03/2026, 18:05',
    source: 'Hệ thống giám sát đăng nhập',
    location: 'Moscow',
    country: 'Russia',
    ip: '185.220.101.xxx',
    device: 'Unknown Device',
    browser: 'Chrome 120',
    os: 'Linux (Ubuntu)',
    deviceType: 'desktop',
    detailText:
      'Nỗ lực đăng nhập bằng email và mật khẩu đúng nhưng từ IP thuộc mạng TOR (Moscow, Russia). Hệ thống phát hiện bất thường về vị trí địa lý (cách vị trí đăng nhập gần nhất 8,500km) và tự động chặn. Đăng nhập bị từ chối trước bước 2FA.',
    timeline: [
      {
        id: 't1',
        time: '18:05:42',
        action: 'Phát hiện nỗ lực đăng nhập',
        detail: 'Email + Password — IP: 185.220.101.xxx',
        icon: LogIn,
        iconColor: '#EF4444',
      },
      {
        id: 't2',
        time: '18:05:42',
        action: 'Phân tích IP tự động',
        detail: 'IP thuộc mạng TOR — Rủi ro cao',
        icon: Globe,
        iconColor: '#F59E0B',
      },
      {
        id: 't3',
        time: '18:05:43',
        action: 'So sánh vị trí địa lý',
        detail: 'Moscow, RU — Bất thường (8,500km so với login gần nhất)',
        icon: MapPin,
        iconColor: '#F59E0B',
      },
      {
        id: 't4',
        time: '18:05:43',
        action: 'Device fingerprint check',
        detail: 'Thiết bị chưa từng sử dụng — Không khớp profile',
        icon: Monitor,
        iconColor: '#EF4444',
      },
      {
        id: 't5',
        time: '18:05:43',
        action: 'Đăng nhập bị chặn tự động',
        detail: 'Bị chặn trước bước xác thực 2FA',
        icon: ShieldAlert,
        iconColor: '#EF4444',
      },
      {
        id: 't6',
        time: '18:05:44',
        action: 'Gửi cảnh báo bảo mật',
        detail: 'Email + Push + SMS đến chủ tài khoản',
        icon: Mail,
        iconColor: '#3B82F6',
      },
    ],
    affectedResources: [
      {
        type: 'session',
        name: 'Phiên hiện tại (Chrome/Windows)',
        detail: 'Hồ Chí Minh, VN — Đang hoạt động',
        status: 'safe',
      },
      {
        type: 'session',
        name: 'iPhone 15 Pro (Safari)',
        detail: 'Hà Nội, VN — 5 giờ trước',
        status: 'safe',
      },
      {
        type: 'api_key',
        name: 'Trading Bot Prod',
        detail: 'API key hoạt động — Không có quyền rút',
        status: 'safe',
      },
      {
        type: 'address',
        name: 'Whitelist BTC (bc1q...)',
        detail: '4 địa chỉ whitelist — Không thay đổi',
        status: 'safe',
      },
    ],
    responseActions: [
      {
        id: 'change_pw',
        label: 'Đổi mật khẩu ngay',
        description: 'Mật khẩu có thể đã bị lộ. Nên đổi ngay.',
        icon: Lock,
        severity: 'destructive',
      },
      {
        id: 'terminate',
        label: 'Kết thúc phiên khác',
        description: 'Đăng xuất tất cả phiên ngoại trừ phiên hiện tại',
        icon: LogOut,
        severity: 'warning',
      },
      {
        id: 'block_ip',
        label: 'Chặn IP 185.220.101.xxx',
        description: 'Thêm IP vào danh sách chặn vĩnh viễn',
        icon: Ban,
        severity: 'warning',
      },
      {
        id: 'enable_2fa',
        label: 'Kiểm tra cài đặt 2FA',
        description: 'Xác nhận 2FA đang hoạt động bình thường',
        icon: Shield,
        severity: 'normal',
      },
      {
        id: 'revoke_api',
        label: 'Xoay API keys',
        description: 'Tạo API key mới và thu hồi key cũ',
        icon: Key,
        severity: 'warning',
      },
      {
        id: 'report_fp',
        label: 'Báo cáo nhầm lẫn',
        description: 'Đánh dấu cảnh báo này là false positive',
        icon: Flag,
        severity: 'normal',
      },
    ],
    similarCount: 2,
  },
  'alert-2': {
    id: 'alert-2',
    type: 'large_withdrawal',
    title: 'Rút số lượng lớn — 2.5 BTC',
    description: 'Lệnh rút 2.5 BTC (~$162,500) vượt ngưỡng cảnh báo tự động ($5,000).',
    severity: 'high',
    status: 'resolved',
    createdAt: '12/03/2026, 14:22',
    updatedAt: '12/03/2026, 14:35',
    source: 'Hệ thống giám sát rút tiền',
    location: 'Hồ Chí Minh',
    country: 'Việt Nam',
    ip: '103.152.xxx.xxx',
    device: 'MacBook Pro 16"',
    browser: 'Chrome 122',
    os: 'macOS Sonoma 14.3',
    deviceType: 'desktop',
    detailText:
      'Lệnh rút 2.5 BTC đến địa chỉ whitelist (bc1q...0wlh) được thực hiện từ thiết bị tin tưởng, xác thực 2FA thành công. Số tiền vượt ngưỡng $5,000 nên kích hoạt cảnh báo. Giao dịch hợp lệ đã được xác nhận bởi chủ tài khoản.',
    timeline: [
      {
        id: 't1',
        time: '14:22:10',
        action: 'Lệnh rút 2.5 BTC được tạo',
        detail: 'Đến bc1q...0wlh — Whitelist address',
        icon: Zap,
        iconColor: '#F59E0B',
      },
      {
        id: 't2',
        time: '14:22:10',
        action: 'Vượt ngưỡng cảnh báo',
        detail: '~$162,500 > $5,000 — Kích hoạt cảnh báo tự động',
        icon: AlertTriangle,
        iconColor: '#F59E0B',
      },
      {
        id: 't3',
        time: '14:22:15',
        action: 'Gửi thông báo bảo mật',
        detail: 'Email + Push + SMS',
        icon: Mail,
        iconColor: '#3B82F6',
      },
      {
        id: 't4',
        time: '14:30:00',
        action: 'Chủ tài khoản xác nhận',
        detail: 'Xác nhận qua email — "Giao dịch hợp lệ"',
        icon: CheckCircle,
        iconColor: '#10B981',
      },
      {
        id: 't5',
        time: '14:35:00',
        action: 'Cảnh báo được đóng',
        detail: 'Đánh dấu: Resolved — Giao dịch hợp lệ',
        icon: CheckCircle2,
        iconColor: '#10B981',
      },
    ],
    affectedResources: [
      {
        type: 'address',
        name: 'bc1qxy2kgdygjrs...0wlh (BTC)',
        detail: 'Whitelist từ 01/02/2026',
        status: 'safe',
      },
      {
        type: 'session',
        name: 'MacBook Pro (Chrome)',
        detail: 'Thiết bị tin tưởng — Hồ Chí Minh',
        status: 'safe',
      },
    ],
    responseActions: [
      {
        id: 'report_fp',
        label: 'Đã xử lý',
        description: 'Cảnh báo đã được xác nhận và đóng',
        icon: CheckCircle,
        severity: 'normal',
        executed: true,
      },
    ],
    similarCount: 0,
  },
};

/* ═══ Config ═══ */
const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  critical: {
    label: 'Nghiêm trọng',
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.15)',
    icon: ShieldOff,
  },
  high: {
    label: 'Cao',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.15)',
    icon: ShieldAlert,
  },
  medium: {
    label: 'Trung bình',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.15)',
    icon: AlertTriangle,
  },
  low: {
    label: 'Thấp',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.15)',
    icon: Info,
  },
  info: {
    label: 'Thông tin',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.06)',
    border: 'rgba(107,114,128,0.15)',
    icon: Info,
  },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Đang hoạt động', color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
  investigating: { label: 'Đang điều tra', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  resolved: { label: 'Đã xử lý', color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
  dismissed: { label: 'Đã bỏ qua', color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
};

const RESOURCE_STATUS: Record<string, { label: string; color: string }> = {
  compromised: { label: 'Bị ảnh hưởng', color: '#EF4444' },
  safe: { label: 'An toàn', color: '#10B981' },
  unknown: { label: 'Chưa rõ', color: '#F59E0B' },
};

const ACTION_SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; color: string; hoverBg: string }
> = {
  destructive: { bg: '#EF4444', border: '#EF4444', color: '#fff', hoverBg: '#DC2626' },
  warning: {
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    color: '#D97706',
    hoverBg: 'rgba(245,158,11,0.1)',
  },
  normal: { bg: 'transparent', border: '', color: '', hoverBg: '' },
};

export function WebSecurityAlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = useParams<{ alertId: string }>();
  const c = useThemeColors();

  const alert = MOCK_ALERTS[alertId || 'alert-1'] || MOCK_ALERTS['alert-1'];
  const sev = SEVERITY_CONFIG[alert.severity];
  const sts = STATUS_CONFIG[alert.status];

  const [showIP, setShowIP] = useState(false);
  const [expandTimeline, setExpandTimeline] = useState(true);
  const [expandResources, setExpandResources] = useState(true);
  const [executedActions, setExecutedActions] = useState<Set<ActionType>>(
    new Set(alert.responseActions.filter((a) => a.executed).map((a) => a.id)),
  );
  const [confirmAction, setConfirmAction] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState<AlertStatus>(alert.status);
  const [copiedField, setCopiedField] = useState('');

  /* ─── Actions ─── */
  const handleExecuteAction = async (id: ActionType) => {
    if (id === 'change_pw') {
      navigate('/w/profile/security/change-password');
      return;
    }
    if (id === 'enable_2fa') {
      navigate('/w/profile/security');
      return;
    }
    const action = alert.responseActions.find((a) => a.id === id);
    if (action?.severity === 'destructive' || action?.severity === 'warning') {
      if (confirmAction !== id) {
        setConfirmAction(id);
        return;
      }
    }
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setExecutedActions((prev) => new Set([...prev, id]));
    setConfirmAction(null);
    setActionLoading(false);
  };

  const handleResolve = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setAlertStatus('resolved');
    setActionLoading(false);
  };

  const handleDismiss = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setAlertStatus('dismissed');
    setActionLoading(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  /* ─── Helpers ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  return (
    <PageLayout>
      {/* Header */}
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
            onClick={() => navigate('/w/profile/security')}
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
              Chi tiết cảnh báo
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Bảo mật &gt; Cảnh báo &gt; {alert.id}
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
          <button
            onClick={() =>
              handleCopy(
                JSON.stringify(
                  { id: alert.id, type: alert.type, severity: alert.severity },
                  null,
                  2,
                ),
                'export',
              )
            }
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
            <Download size={13} />
            {copiedField === 'export' ? 'Đã copy' : 'Xuất'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* ═══ Alert header ═══ */}
          <div style={card({ borderColor: sev.border })}>
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: sev.bg,
                  border: `1px solid ${sev.border}`,
                }}
              >
                <sev.icon size={24} color={sev.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 6 }}>
                  <h2 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, margin: 0 }}>
                    {alert.title}
                  </h2>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: sev.bg,
                      border: `1px solid ${sev.border}`,
                      color: sev.color,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                    }}
                  >
                    {sev.label}
                  </span>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: sts.bg,
                      color: sts.color,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                    }}
                  >
                    {alertStatus === alert.status ? sts.label : STATUS_CONFIG[alertStatus].label}
                  </span>
                </div>
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.md,
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  {alert.description}
                </p>

                {/* Meta grid */}
                <div className="grid grid-cols-2" style={{ gap: 10 }}>
                  {[
                    { label: 'Thời gian', value: alert.createdAt, icon: Clock },
                    { label: 'Nguồn', value: alert.source, icon: Shield },
                    { label: 'Vị trí', value: `${alert.location}, ${alert.country}`, icon: MapPin },
                    {
                      label: 'IP',
                      value: showIP ? alert.ip : '•••.•••.xxx.xxx',
                      icon: Globe,
                      copyable: alert.ip,
                    },
                    {
                      label: 'Thiết bị',
                      value: `${alert.device} — ${alert.browser}`,
                      icon: alert.deviceType === 'mobile' ? Smartphone : Laptop,
                    },
                    { label: 'Hệ điều hành', value: alert.os, icon: Monitor },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-2">
                      <m.icon size={13} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{m.label}:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.xs, fontWeight: 500 }}>
                        {m.value}
                      </span>
                      {m.copyable && (
                        <button
                          onClick={() => handleCopy(m.copyable!, m.label)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >
                          {copiedField === m.label ? (
                            <CheckCircle size={11} color="#10B981" />
                          ) : (
                            <Copy size={11} color={c.text3} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed explanation */}
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                borderRadius: 10,
                background: c.bg,
                border: `1px solid ${c.borderSolid}`,
              }}
            >
              <p
                style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 6 }}
              >
                Phân tích chi tiết
              </p>
              <p style={{ color: c.text1, fontSize: WEB_FONT.sm, lineHeight: 1.7 }}>
                {alert.detailText}
              </p>
            </div>
          </div>

          {/* ═══ Timeline ═══ */}
          <div style={card()}>
            <button
              onClick={() => setExpandTimeline(!expandTimeline)}
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
                  Dòng thời gian sự kiện
                </h3>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  {alert.timeline.length} sự kiện
                </span>
              </div>
              {expandTimeline ? (
                <ChevronUp size={16} color={c.text3} />
              ) : (
                <ChevronDown size={16} color={c.text3} />
              )}
            </button>

            {expandTimeline && (
              <div
                className="flex flex-col"
                style={{ marginTop: 16, gap: 0, position: 'relative', paddingLeft: 24 }}
              >
                {/* Vertical line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    background: c.borderSolid,
                    borderRadius: 1,
                  }}
                />
                {alert.timeline.map((ev, i) => (
                  <div
                    key={ev.id}
                    className="flex items-start"
                    style={{
                      gap: 14,
                      paddingBottom: i < alert.timeline.length - 1 ? 14 : 0,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: -19,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: ev.iconColor,
                        border: `2px solid ${c.surface}`,
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                        <ev.icon size={13} color={ev.iconColor} />
                        <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                          {ev.action}
                        </p>
                      </div>
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{ev.detail}</p>
                    </div>
                    <span
                      style={{
                        color: c.text3,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                      }}
                    >
                      {ev.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Affected Resources ═══ */}
          <div style={card()}>
            <button
              onClick={() => setExpandResources(!expandResources)}
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
                <Shield size={16} color={c.text2} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Tài nguyên bị ảnh hưởng
                </h3>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  {alert.affectedResources.length} mục
                </span>
              </div>
              {expandResources ? (
                <ChevronUp size={16} color={c.text3} />
              ) : (
                <ChevronDown size={16} color={c.text3} />
              )}
            </button>

            {expandResources && (
              <div className="flex flex-col" style={{ marginTop: 14, gap: 0 }}>
                {alert.affectedResources.map((res, i) => {
                  const rs = RESOURCE_STATUS[res.status];
                  const ResIcon =
                    res.type === 'session'
                      ? Monitor
                      : res.type === 'device'
                        ? Smartphone
                        : res.type === 'api_key'
                          ? Key
                          : Lock;
                  return (
                    <div key={i}>
                      {i > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                      <div className="flex items-center" style={{ padding: '10px 0', gap: 12 }}>
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${rs.color}08`,
                          }}
                        >
                          <ResIcon size={15} color={rs.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                            {res.name}
                          </p>
                          <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{res.detail}</p>
                        </div>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: `${rs.color}08`,
                            color: rs.color,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {rs.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ Response Actions ═══ */}
          <div
            style={card({
              borderColor: alertStatus === 'active' ? 'rgba(239,68,68,0.15)' : undefined,
            })}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <Zap size={16} color={alertStatus === 'active' ? '#EF4444' : c.text2} />
              <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                Hành động phản hồi
              </h3>
              {alertStatus === 'active' && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.06)',
                    color: '#EF4444',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  CẦN XỬ LÝ
                </span>
              )}
            </div>

            <div className="flex flex-col" style={{ gap: 8 }}>
              {alert.responseActions.map((action) => {
                const isExecuted = executedActions.has(action.id);
                const isConfirming = confirmAction === action.id;
                const sevStyle = ACTION_SEVERITY_STYLES[action.severity];

                return (
                  <div key={action.id}>
                    <div
                      className="flex items-center"
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        gap: 14,
                        background: isExecuted
                          ? 'rgba(16,185,129,0.03)'
                          : isConfirming
                            ? 'rgba(239,68,68,0.02)'
                            : c.bg,
                        border: `1px solid ${isExecuted ? 'rgba(16,185,129,0.12)' : isConfirming ? 'rgba(239,68,68,0.15)' : c.borderSolid}`,
                        opacity: isExecuted ? 0.7 : 1,
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isExecuted
                            ? 'rgba(16,185,129,0.08)'
                            : action.severity === 'destructive'
                              ? 'rgba(239,68,68,0.06)'
                              : action.severity === 'warning'
                                ? 'rgba(245,158,11,0.06)'
                                : 'rgba(107,114,128,0.06)',
                        }}
                      >
                        {isExecuted ? (
                          <CheckCircle size={16} color="#10B981" />
                        ) : (
                          <action.icon
                            size={16}
                            color={
                              action.severity === 'destructive'
                                ? '#EF4444'
                                : action.severity === 'warning'
                                  ? '#F59E0B'
                                  : c.text2
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            color: isExecuted ? '#10B981' : c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 600,
                          }}
                        >
                          {isExecuted ? `✓ ${action.label}` : action.label}
                        </p>
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                          {action.description}
                        </p>
                      </div>

                      {!isExecuted && !isConfirming && (
                        <button
                          onClick={() => handleExecuteAction(action.id)}
                          className="shrink-0 flex items-center gap-1"
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background:
                              action.severity === 'destructive'
                                ? '#EF4444'
                                : action.severity === 'warning'
                                  ? 'rgba(245,158,11,0.06)'
                                  : c.surface,
                            border:
                              action.severity === 'destructive'
                                ? 'none'
                                : `1px solid ${action.severity === 'warning' ? 'rgba(245,158,11,0.2)' : c.borderSolid}`,
                            color:
                              action.severity === 'destructive'
                                ? '#fff'
                                : action.severity === 'warning'
                                  ? '#D97706'
                                  : c.text2,
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <action.icon size={12} />
                          Thực hiện
                        </button>
                      )}

                      {isConfirming && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setConfirmAction(null)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: c.surface,
                              border: `1px solid ${c.borderSolid}`,
                              color: c.text2,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleExecuteAction(action.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1"
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              background: action.severity === 'destructive' ? '#EF4444' : '#F59E0B',
                              color: '#fff',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              border: 'none',
                              cursor: actionLoading ? 'not-allowed' : 'pointer',
                              opacity: actionLoading ? 0.7 : 1,
                            }}
                          >
                            {actionLoading ? (
                              <RefreshCw
                                size={11}
                                style={{ animation: 'spin 1s linear infinite' }}
                              />
                            ) : (
                              <CheckCircle size={11} />
                            )}
                            {actionLoading ? 'Đang...' : 'Xác nhận'}
                          </button>
                        </div>
                      )}

                      {isExecuted && (
                        <span
                          style={{
                            color: '#10B981',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Đã thực hiện
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resolve / Dismiss bar */}
            {alertStatus === 'active' && (
              <div
                className="flex items-center justify-between"
                style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.borderSolid}` }}
              >
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  Sau khi xử lý xong, đánh dấu cảnh báo:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex items-center gap-1"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} /> Bỏ qua
                  </button>
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#10B981',
                      border: 'none',
                      color: '#fff',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle size={12} /> Đã xử lý
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Similar incidents ═══ */}
          {alert.similarCount > 0 && (
            <div style={card()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} color={c.text2} />
                  <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    Sự cố tương tự
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/w/profile/security/login-activity')}
                  className="flex items-center gap-1"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: `1px solid ${c.borderSolid}`,
                    color: '#3B82F6',
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Xem tất cả <ChevronRight size={12} />
                </button>
              </div>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, marginTop: 8 }}>
                Phát hiện{' '}
                <span style={{ color: '#EF4444', fontWeight: 700 }}>{alert.similarCount}</span> sự
                cố tương tự trong 30 ngày qua từ cùng dải IP. Nên theo dõi chặt chẽ và cân nhắc chặn
                IP vĩnh viễn.
              </p>
            </div>
          )}

          {/* Info */}
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
              Nếu nghi ngờ tài khoản bị xâm phạm, hãy: <strong>(1)</strong> Đổi mật khẩu ngay,{' '}
              <strong>(2)</strong> Kết thúc tất cả phiên, <strong>(3)</strong> Kiểm tra whitelist
              rút tiền, <strong>(4)</strong> Liên hệ{' '}
              <button
                onClick={() => navigate('/w/support')}
                style={{
                  color: '#3B82F6',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Bộ phận hỗ trợ
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
