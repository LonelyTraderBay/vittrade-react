import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Lock,
  QrCode,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Download,
  Mail,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  Fingerprint,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/**
 * WebTwoFAManagementPage — 2FA management hub
 *
 * Route: /w/profile/security/2fa
 *
 * Features:
 *   - Overview of all 2FA methods with status
 *   - Google Authenticator management (enable/disable/relink)
 *   - SMS 2FA management (enable/change number)
 *   - Backup codes (view/regenerate/download)
 *   - Recovery options (email recovery, security questions)
 *   - 2FA enforcement settings (login, withdrawal, API)
 *   - Method priority ordering
 *
 * Guidelines:
 *   - §14.1: Security Center screens
 *   - §14.3: High-risk actions — disable 2FA = destructive confirm
 *   - §5: Safety-by-design
 *   - §7.2: Inputs — label, placeholder, helper, error
 */

/* ═══ Types ═══ */
type MethodStatus = 'active' | 'inactive' | 'pending';
type MethodType = 'totp' | 'sms' | 'passkey' | 'email';

interface TwoFAMethod {
  id: MethodType;
  title: string;
  description: string;
  status: MethodStatus;
  icon: React.ElementType;
  color: string;
  detail?: string;
  lastUsed?: string;
  primary?: boolean;
}

interface BackupCode {
  code: string;
  used: boolean;
}

interface EnforcementSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  required?: boolean;
  icon: React.ElementType;
}

/* ═══ Mock data ═══ */
const METHODS: TwoFAMethod[] = [
  {
    id: 'totp',
    title: 'Google Authenticator',
    description: 'Mã TOTP 6 chữ số mỗi 30 giây',
    status: 'active',
    icon: Shield,
    color: '#3B82F6',
    detail: 'Được liên kết lúc 15/01/2026',
    lastUsed: '30 phút trước',
    primary: true,
  },
  {
    id: 'sms',
    title: 'Xác thực SMS',
    description: 'Mã OTP qua tin nhắn SMS',
    status: 'active',
    icon: Smartphone,
    color: '#10B981',
    detail: '+84 ••• ••• 1234',
    lastUsed: '3 ngày trước',
  },
  {
    id: 'passkey',
    title: 'Passkey / Sinh trắc học',
    description: 'FIDO2 WebAuthn — vân tay hoặc Face ID',
    status: 'active',
    icon: Fingerprint,
    color: '#8B5CF6',
    detail: '2 passkey đã đăng ký',
    lastUsed: 'Hôm nay',
  },
  {
    id: 'email',
    title: 'Xác thực Email',
    description: 'Mã OTP qua email đăng ký',
    status: 'inactive',
    icon: Mail,
    color: '#F59E0B',
    detail: 'tr•••@gmail.com',
  },
];

const BACKUP_CODES: BackupCode[] = [
  { code: 'ABCD-1234-EFGH', used: false },
  { code: 'IJKL-5678-MNOP', used: false },
  { code: 'QRST-9012-UVWX', used: true },
  { code: 'YZAB-3456-CDEF', used: false },
  { code: 'GHIJ-7890-KLMN', used: false },
  { code: 'OPQR-1234-STUV', used: true },
  { code: 'WXYZ-5678-ABCD', used: false },
  { code: 'EFGH-9012-IJKL', used: false },
  { code: 'MNOP-3456-QRST', used: true },
  { code: 'UVWX-7890-YZAB', used: false },
];

const ENFORCEMENT_SETTINGS: EnforcementSetting[] = [
  {
    id: 'login',
    title: 'Đăng nhập',
    description: 'Yêu cầu 2FA khi đăng nhập từ thiết bị mới',
    enabled: true,
    required: true,
    icon: Key,
  },
  {
    id: 'withdrawal',
    title: 'Rút tiền',
    description: 'Yêu cầu 2FA cho mọi lệnh rút',
    enabled: true,
    required: true,
    icon: Lock,
  },
  {
    id: 'api',
    title: 'Tạo / Xóa API Key',
    description: 'Yêu cầu 2FA khi thao tác với API keys',
    enabled: true,
    icon: Settings,
  },
  {
    id: 'password',
    title: 'Đổi mật khẩu',
    description: 'Yêu cầu 2FA khi đổi mật khẩu tài khoản',
    enabled: true,
    required: true,
    icon: Lock,
  },
  {
    id: 'p2p',
    title: 'P2P Release',
    description: 'Yêu cầu 2FA khi release crypto trong P2P',
    enabled: true,
    icon: ShieldCheck,
  },
  {
    id: 'whitelist',
    title: 'Whitelist rút tiền',
    description: 'Yêu cầu 2FA khi thêm/xóa địa chỉ whitelist',
    enabled: true,
    icon: FileText,
  },
  {
    id: 'device',
    title: 'Thiết bị tin tưởng',
    description: 'Yêu cầu 2FA khi thêm thiết bị tin tưởng mới',
    enabled: false,
    icon: Smartphone,
  },
];

/* ═══ Component ═══ */
export function WebTwoFAManagementPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  /* ─── State ─── */
  const [methods, setMethods] = useState(METHODS);
  const [backupCodes, setBackupCodes] = useState(BACKUP_CODES);
  const [backupRevealed, setBackupRevealed] = useState(false);
  const [enforcement, setEnforcement] = useState(ENFORCEMENT_SETTINGS);
  const [expandedSection, setExpandedSection] = useState<string | null>('methods');
  const [confirmDisable, setConfirmDisable] = useState<MethodType | null>(null);
  const [confirmDisableCode, setConfirmDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [showQR, setShowQR] = useState(false);

  /* ─── Computed ─── */
  const activeMethods = methods.filter((m) => m.status === 'active').length;
  const usedCodes = backupCodes.filter((c) => c.used).length;
  const remainingCodes = backupCodes.length - usedCodes;

  /* ─── Actions ─── */
  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 1500);
  };

  const handleToggleEnforcement = (id: string) => {
    setEnforcement((prev) =>
      prev.map((e) => (e.id === id && !e.required ? { ...e, enabled: !e.enabled } : e)),
    );
  };

  const handleDisableMethod = async (id: MethodType) => {
    if (confirmDisable !== id) {
      setConfirmDisable(id);
      setConfirmDisableCode('');
      setDisableError('');
      return;
    }
    if (confirmDisableCode.length < 6) {
      setDisableError('Vui lòng nhập mã 2FA 6 chữ số');
      return;
    }
    // Simulate disable
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: 'inactive' as MethodStatus, primary: false } : m,
      ),
    );
    setConfirmDisable(null);
    setConfirmDisableCode('');
  };

  const handleEnableMethod = (id: MethodType) => {
    if (id === 'passkey') {
      navigate('/w/profile/security/passkey');
      return;
    }
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'active' as MethodStatus } : m)),
    );
  };

  const handleSetPrimary = (id: MethodType) => {
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        primary: m.id === id,
      })),
    );
  };

  const handleRegenerateBackup = async () => {
    setRegenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newCodes: BackupCode[] = Array.from({ length: 10 }, () => ({
      code: `${randomBlock()}-${randomBlock()}-${randomBlock()}`,
      used: false,
    }));
    setBackupCodes(newCodes);
    setBackupRevealed(true);
    setRegenerating(false);
  };

  const handleDownloadCodes = () => {
    const text = backupCodes
      .filter((c) => !c.used)
      .map((c, i) => `${i + 1}. ${c.code}`)
      .join('\n');
    const blob = new Blob(
      [
        `Backup Codes - Generated ${new Date().toISOString()}\n\n${text}\n\nLưu ý: Mỗi mã chỉ sử dụng được 1 lần.`,
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Helpers ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const sectionHeader = (id: string, icon: React.ElementType, title: string, subtitle?: string) => {
    const Icon = icon;
    const isExpanded = expandedSection === id;
    return (
      <button
        onClick={() => setExpandedSection(isExpanded ? null : id)}
        className="flex items-center justify-between"
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} color={c.text2} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 600 }}>{title}</p>
            {subtitle && <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{subtitle}</p>}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} color={c.text3} />
        ) : (
          <ChevronDown size={16} color={c.text3} />
        )}
      </button>
    );
  };

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
              Xác thực 2 bước (2FA)
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Quản lý 2FA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: activeMethods >= 2 ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1px solid ${activeMethods >= 2 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
            }}
          >
            <ShieldCheck size={12} color={activeMethods >= 2 ? '#10B981' : '#F59E0B'} />
            <span
              style={{
                color: activeMethods >= 2 ? '#10B981' : '#F59E0B',
                fontSize: WEB_FONT.xs,
                fontWeight: 700,
              }}
            >
              {activeMethods} phương thức
            </span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* ═══ Status overview ═══ */}
          <div
            style={{
              ...card(),
              background: activeMethods >= 2 ? 'rgba(16,185,129,0.02)' : 'rgba(245,158,11,0.02)',
              borderColor: activeMethods >= 2 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background:
                    activeMethods >= 2 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                }}
              >
                {activeMethods >= 2 ? (
                  <ShieldCheck size={24} color="#10B981" />
                ) : (
                  <ShieldAlert size={24} color="#F59E0B" />
                )}
              </div>
              <div className="flex-1">
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.lg,
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  {activeMethods >= 3
                    ? 'Bảo mật rất mạnh'
                    : activeMethods >= 2
                      ? 'Bảo mật tốt'
                      : 'Cần cải thiện'}
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  {activeMethods >= 2
                    ? `${activeMethods} phương thức đang hoạt động. Mã backup còn ${remainingCodes}/${backupCodes.length}.`
                    : 'Nên bật ít nhất 2 phương thức 2FA để bảo vệ tài khoản tốt hơn.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    title={m.title}
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: m.status === 'active' ? `${m.color}10` : c.bg,
                      border: `1px solid ${m.status === 'active' ? `${m.color}25` : c.borderSolid}`,
                    }}
                  >
                    <m.icon size={14} color={m.status === 'active' ? m.color : c.text3} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Methods section ═══ */}
          <div style={card()}>
            {sectionHeader(
              'methods',
              Shield,
              'Phương thức xác thực',
              `${activeMethods} đang hoạt động`,
            )}

            {expandedSection === 'methods' && (
              <div className="flex flex-col" style={{ marginTop: 16, gap: 0 }}>
                {methods.map((method, idx) => {
                  const isDisabling = confirmDisable === method.id;

                  return (
                    <div key={method.id}>
                      {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                      <div style={{ padding: '14px 0' }}>
                        <div className="flex items-center" style={{ gap: 14 }}>
                          {/* Icon */}
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 11,
                              background: method.status === 'active' ? `${method.color}08` : c.bg,
                              border: `1px solid ${method.status === 'active' ? `${method.color}20` : c.borderSolid}`,
                            }}
                          >
                            <method.icon
                              size={18}
                              color={method.status === 'active' ? method.color : c.text3}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                                {method.title}
                              </p>
                              {method.primary && (
                                <span
                                  style={{
                                    padding: '1px 7px',
                                    borderRadius: 6,
                                    background: 'rgba(59,130,246,0.06)',
                                    border: '1px solid rgba(59,130,246,0.15)',
                                    color: '#3B82F6',
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  Chính
                                </span>
                              )}
                              <span
                                style={{
                                  padding: '1px 7px',
                                  borderRadius: 6,
                                  background:
                                    method.status === 'active'
                                      ? 'rgba(16,185,129,0.06)'
                                      : 'rgba(107,114,128,0.06)',
                                  color: method.status === 'active' ? '#10B981' : '#6B7280',
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {method.status === 'active' ? 'Đã bật' : 'Chưa bật'}
                              </span>
                            </div>
                            <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                              {method.description}
                            </p>
                            {method.detail && (
                              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 2 }}>
                                {method.detail}
                              </p>
                            )}
                            {method.lastUsed && method.status === 'active' && (
                              <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>
                                Sử dụng gần nhất: {method.lastUsed}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {method.status === 'active' && !method.primary && activeMethods > 1 && (
                              <button
                                onClick={() => handleSetPrimary(method.id)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: 'transparent',
                                  border: `1px solid ${c.borderSolid}`,
                                  color: c.text3,
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Đặt chính
                              </button>
                            )}
                            {method.status === 'active' && (
                              <>
                                {method.id === 'totp' && (
                                  <button
                                    onClick={() => setShowQR(!showQR)}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 6,
                                      background: 'transparent',
                                      border: `1px solid ${c.borderSolid}`,
                                      color: c.text2,
                                      fontSize: WEB_FONT.xs,
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Liên kết lại
                                  </button>
                                )}
                                {method.id === 'sms' && (
                                  <button
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 6,
                                      background: 'transparent',
                                      border: `1px solid ${c.borderSolid}`,
                                      color: c.text2,
                                      fontSize: WEB_FONT.xs,
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Đổi SĐT
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDisableMethod(method.id)}
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
                                  Tắt
                                </button>
                              </>
                            )}
                            {method.status === 'inactive' && (
                              <button
                                onClick={() => handleEnableMethod(method.id)}
                                className="flex items-center gap-1"
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 6,
                                  background: '#3B82F6',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={11} /> Bật
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Disable confirm */}
                        {isDisabling && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: '12px 16px',
                              borderRadius: 10,
                              background: 'rgba(239,68,68,0.02)',
                              border: '1px solid rgba(239,68,68,0.1)',
                            }}
                          >
                            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                              <AlertTriangle size={13} color="#EF4444" />
                              <p
                                style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600 }}
                              >
                                Xác nhận tắt {method.title}
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
                              Tắt phương thức này sẽ giảm bảo mật tài khoản. Nhập mã 2FA từ phương
                              thức chính để xác nhận.
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                value={confirmDisableCode}
                                onChange={(e) => {
                                  setConfirmDisableCode(
                                    e.target.value.replace(/\D/g, '').slice(0, 6),
                                  );
                                  setDisableError('');
                                }}
                                placeholder="Mã 2FA (6 số)"
                                className="outline-none"
                                style={{
                                  width: 140,
                                  height: WEB_BUTTON.sm,
                                  borderRadius: 8,
                                  border: `1.5px solid ${disableError ? '#EF4444' : c.borderSolid}`,
                                  background: c.bg,
                                  padding: '0 10px',
                                  color: c.text1,
                                  fontSize: WEB_FONT.sm,
                                  textAlign: 'center',
                                  fontFamily: 'monospace',
                                  letterSpacing: 4,
                                }}
                              />
                              <button
                                onClick={() => handleDisableMethod(method.id)}
                                style={{
                                  padding: '5px 14px',
                                  borderRadius: 8,
                                  background: '#EF4444',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Xác nhận tắt
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDisable(null);
                                  setDisableError('');
                                }}
                                style={{
                                  padding: '5px 10px',
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
                            {disableError && (
                              <p style={{ color: '#EF4444', fontSize: WEB_FONT.xs, marginTop: 4 }}>
                                {disableError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* QR relink */}
                        {showQR && method.id === 'totp' && method.status === 'active' && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: '16px',
                              borderRadius: 10,
                              background: c.bg,
                              border: `1px solid ${c.borderSolid}`,
                              textAlign: 'center' as const,
                            }}
                          >
                            <p
                              style={{
                                color: c.text1,
                                fontSize: WEB_FONT.sm,
                                fontWeight: 600,
                                marginBottom: 10,
                              }}
                            >
                              Quét mã QR bằng ứng dụng Authenticator
                            </p>
                            {/* Placeholder QR */}
                            <div className="flex justify-center" style={{ marginBottom: 12 }}>
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: 160,
                                  height: 160,
                                  borderRadius: 12,
                                  background: '#fff',
                                  border: `2px solid ${c.borderSolid}`,
                                }}
                              >
                                <QrCode size={100} color="#1a1a1a" />
                              </div>
                            </div>
                            <div
                              className="flex items-center justify-center gap-2"
                              style={{ marginBottom: 8 }}
                            >
                              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                Hoặc nhập mã thủ công:
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <code
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: c.surface,
                                  border: `1px solid ${c.borderSolid}`,
                                  color: c.text1,
                                  fontSize: WEB_FONT.sm,
                                  fontFamily: 'monospace',
                                  letterSpacing: 2,
                                }}
                              >
                                JBSW Y3DP EHPK 3PXP
                              </code>
                              <button
                                onClick={() => handleCopy('JBSWY3DPEHPK3PXP')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 4,
                                }}
                              >
                                {copiedCode === 'JBSWY3DPEHPK3PXP' ? (
                                  <CheckCircle size={14} color="#10B981" />
                                ) : (
                                  <Copy size={14} color={c.text3} />
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => setShowQR(false)}
                              style={{
                                marginTop: 12,
                                padding: '5px 14px',
                                borderRadius: 8,
                                background: c.surface,
                                border: `1px solid ${c.borderSolid}`,
                                color: c.text2,
                                fontSize: WEB_FONT.xs,
                                cursor: 'pointer',
                              }}
                            >
                              Đóng
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ Backup codes section ═══ */}
          <div style={card()}>
            {sectionHeader(
              'backup',
              Key,
              'Mã backup khôi phục',
              `${remainingCodes}/${backupCodes.length} mã còn lại`,
            )}

            {expandedSection === 'backup' && (
              <div style={{ marginTop: 16 }}>
                {/* Warning if running low */}
                {remainingCodes <= 3 && (
                  <div
                    className="flex items-start gap-2"
                    style={{
                      marginBottom: 14,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(239,68,68,0.03)',
                      border: '1px solid rgba(239,68,68,0.1)',
                    }}
                  >
                    <AlertTriangle
                      size={13}
                      color="#EF4444"
                      className="shrink-0"
                      style={{ marginTop: 1 }}
                    />
                    <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                      Chỉ còn <strong style={{ color: '#EF4444' }}>{remainingCodes}</strong> mã
                      backup. Nên tạo bộ mã mới để tránh bị khóa tài khoản.
                    </p>
                  </div>
                )}

                {/* Progress */}
                <div className="flex items-center" style={{ gap: 12, marginBottom: 14 }}>
                  <div
                    className="flex-1"
                    style={{ height: 6, borderRadius: 3, background: c.borderSolid }}
                  >
                    <div
                      style={{
                        width: `${(remainingCodes / backupCodes.length) * 100}%`,
                        height: '100%',
                        borderRadius: 3,
                        background:
                          remainingCodes <= 3
                            ? '#EF4444'
                            : remainingCodes <= 5
                              ? '#F59E0B'
                              : '#10B981',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {remainingCodes} / {backupCodes.length}
                  </span>
                </div>

                {/* Reveal / codes grid */}
                {!backupRevealed ? (
                  <button
                    onClick={() => setBackupRevealed(true)}
                    className="flex items-center justify-center gap-2"
                    style={{
                      width: '100%',
                      height: WEB_BUTTON.lg,
                      borderRadius: 10,
                      background: 'rgba(59,130,246,0.04)',
                      border: `1px solid rgba(59,130,246,0.15)`,
                      color: '#3B82F6',
                      fontSize: WEB_FONT.md,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={16} /> Hiện mã backup
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-2" style={{ gap: 6, marginBottom: 14 }}>
                      {backupCodes.map((bc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: bc.used ? 'rgba(107,114,128,0.03)' : c.bg,
                            border: `1px solid ${bc.used ? 'rgba(107,114,128,0.1)' : c.borderSolid}`,
                            opacity: bc.used ? 0.5 : 1,
                          }}
                        >
                          <code
                            style={{
                              color: bc.used ? c.text3 : c.text1,
                              fontSize: WEB_FONT.sm,
                              fontFamily: 'monospace',
                              textDecoration: bc.used ? 'line-through' : 'none',
                            }}
                          >
                            {bc.code}
                          </code>
                          {bc.used ? (
                            <span style={{ color: c.text3, fontSize: 10 }}>Đã dùng</span>
                          ) : (
                            <button
                              onClick={() => handleCopy(bc.code)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                            >
                              {copiedCode === bc.code ? (
                                <CheckCircle size={12} color="#10B981" />
                              ) : (
                                <Copy size={12} color={c.text3} />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCodes}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          background: c.bg,
                          border: `1px solid ${c.borderSolid}`,
                          color: c.text2,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={13} /> Tải xuống
                      </button>
                      <button
                        onClick={handleRegenerateBackup}
                        disabled={regenerating}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          background: 'rgba(245,158,11,0.04)',
                          border: `1px solid rgba(245,158,11,0.15)`,
                          color: '#D97706',
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                          cursor: regenerating ? 'not-allowed' : 'pointer',
                          opacity: regenerating ? 0.7 : 1,
                        }}
                      >
                        <RefreshCw
                          size={13}
                          style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }}
                        />
                        {regenerating ? 'Đang tạo...' : 'Tạo bộ mới'}
                      </button>
                      <button
                        onClick={() => setBackupRevealed(false)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          background: 'transparent',
                          border: `1px solid ${c.borderSolid}`,
                          color: c.text3,
                          fontSize: WEB_FONT.xs,
                          cursor: 'pointer',
                        }}
                      >
                        Ẩn mã
                      </button>
                    </div>
                  </>
                )}

                {/* Info */}
                <div
                  className="flex items-start gap-2"
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(59,130,246,0.03)',
                    border: '1px solid rgba(59,130,246,0.08)',
                  }}
                >
                  <Info size={12} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
                  <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                    Mã backup dùng khi mất quyền truy cập tất cả phương thức 2FA. Mỗi mã chỉ dùng 1
                    lần. Lưu ở nơi an toàn, không chia sẻ.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Enforcement settings ═══ */}
          <div style={card()}>
            {sectionHeader(
              'enforcement',
              Lock,
              'Yêu cầu 2FA cho hành động',
              `${enforcement.filter((e) => e.enabled).length}/${enforcement.length} đang bật`,
            )}

            {expandedSection === 'enforcement' && (
              <div className="flex flex-col" style={{ marginTop: 16, gap: 0 }}>
                {enforcement.map((setting, idx) => (
                  <div key={setting.id}>
                    {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                    <div className="flex items-center" style={{ padding: '12px 0', gap: 14 }}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: setting.enabled ? 'rgba(16,185,129,0.06)' : c.bg,
                        }}
                      >
                        <setting.icon size={15} color={setting.enabled ? '#10B981' : c.text3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                            {setting.title}
                          </p>
                          {setting.required && (
                            <span
                              style={{
                                padding: '0px 6px',
                                borderRadius: 4,
                                background: 'rgba(239,68,68,0.06)',
                                color: '#EF4444',
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              BẮT BUỘC
                            </span>
                          )}
                        </div>
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                          {setting.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleEnforcement(setting.id)}
                        disabled={setting.required}
                        className="shrink-0"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: setting.required ? 'not-allowed' : 'pointer',
                          padding: 0,
                          opacity: setting.required ? 0.6 : 1,
                        }}
                      >
                        {setting.enabled ? (
                          <ToggleRight size={28} color="#10B981" />
                        ) : (
                          <ToggleLeft size={28} color={c.text3} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Recovery options ═══ */}
          <div style={card()}>
            {sectionHeader(
              'recovery',
              HelpCircle,
              'Khôi phục tài khoản',
              'Tùy chọn khi mất quyền truy cập 2FA',
            )}

            {expandedSection === 'recovery' && (
              <div className="flex flex-col" style={{ marginTop: 16, gap: 10 }}>
                {[
                  {
                    icon: Mail,
                    title: 'Khôi phục qua Email',
                    desc: 'Xác thực qua email đăng ký (tr•••@gmail.com)',
                    status: 'Đã cấu hình',
                    color: '#10B981',
                    action: 'Kiểm tra',
                  },
                  {
                    icon: Key,
                    title: 'Mã Backup',
                    desc: `${remainingCodes} mã còn lại — Dùng khi mất 2FA`,
                    status: remainingCodes > 3 ? 'Khả dụng' : 'Sắp hết',
                    color: remainingCodes > 3 ? '#10B981' : '#F59E0B',
                    action: 'Xem',
                  },
                  {
                    icon: FileText,
                    title: 'Yêu cầu hỗ trợ',
                    desc: 'Liên hệ support kèm KYC để khôi phục thủ công',
                    status: 'Khả dụng',
                    color: '#3B82F6',
                    action: 'Mở',
                  },
                ].map((opt) => (
                  <div
                    key={opt.title}
                    className="flex items-center"
                    style={{ padding: '12px 14px', borderRadius: 10, background: c.bg, gap: 14 }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: `${opt.color}08`,
                      }}
                    >
                      <opt.icon size={16} color={opt.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                        {opt.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{opt.desc}</p>
                    </div>
                    <span
                      style={{
                        color: opt.color,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                        marginRight: 8,
                      }}
                    >
                      {opt.status}
                    </span>
                    <button
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: 'transparent',
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.action}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Warning ═══ */}
          <div
            className="flex items-start gap-3"
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.03)',
              border: '1px solid rgba(245,158,11,0.1)',
            }}
          >
            <AlertTriangle
              size={14}
              color="#F59E0B"
              className="shrink-0"
              style={{ marginTop: 2 }}
            />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              <strong>Không chia sẻ mã 2FA, mã backup, hay mã QR</strong> cho bất kỳ ai, kể cả nhân
              viên hỗ trợ. Chúng tôi sẽ không bao giờ yêu cầu bạn cung cấp các mã này.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══ Utility ═══ */
function randomBlock(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
