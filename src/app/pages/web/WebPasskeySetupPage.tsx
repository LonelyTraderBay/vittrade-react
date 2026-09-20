import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Fingerprint, ShieldCheck, ShieldAlert, Plus, Trash2,
  CheckCircle, ArrowLeft, Info, AlertTriangle, Monitor,
  Smartphone, Laptop, Key, Clock, Globe, Lock,
  Eye, EyeOff, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebPasskeySetupPage — Passkey / Biometric registration for desktop
 *
 * Route: /w/profile/security/passkey
 *
 * Features:
 *   - Explain passkeys & biometrics
 *   - Register new passkey (simulated WebAuthn flow)
 *   - Manage existing passkeys (list, rename, delete)
 *   - 3-step flow: Confirm → Biometric prompt → Success
 *   - FAQ section
 *
 * Guidelines:
 *   - §14.1: Security Center features
 *   - §14.3: High-risk actions require preview + confirm
 */

/* ═══ Mock data ═══ */
interface PasskeyDevice {
  id: string;
  name: string;
  icon: 'laptop' | 'phone' | 'desktop';
  browser: string;
  os: string;
  createdAt: string;
  lastUsed: string;
  isCurrent: boolean;
}

const MOCK_PASSKEYS: PasskeyDevice[] = [
  {
    id: 'pk-1',
    name: 'MacBook Pro — Touch ID',
    icon: 'laptop',
    browser: 'Chrome 122',
    os: 'macOS Sonoma',
    createdAt: '2024-12-15',
    lastUsed: '2026-03-13',
    isCurrent: true,
  },
  {
    id: 'pk-2',
    name: 'iPhone 15 Pro — Face ID',
    icon: 'phone',
    browser: 'Safari 17',
    os: 'iOS 17.4',
    createdAt: '2025-01-20',
    lastUsed: '2026-03-10',
    isCurrent: false,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Passkey là gì?',
    a: 'Passkey là phương thức đăng nhập không cần mật khẩu, sử dụng sinh trắc học (vân tay, khuôn mặt) hoặc PIN thiết bị để xác thực. Passkey được mã hóa và lưu trữ an toàn trên thiết bị của bạn.',
  },
  {
    q: 'Passkey có an toàn hơn mật khẩu không?',
    a: 'Có. Passkey không thể bị phishing, không có mật khẩu để đánh cắp, và được bảo vệ bởi phần cứng bảo mật của thiết bị (TPM/Secure Enclave). Mỗi passkey là duy nhất cho từng trang web.',
  },
  {
    q: 'Nếu mất thiết bị thì sao?',
    a: 'Bạn vẫn có thể đăng nhập bằng mật khẩu + 2FA. Sau đó, xóa passkey cũ và đăng ký passkey mới trên thiết bị thay thế. Passkey không thể bị trích xuất từ thiết bị đã mất.',
  },
  {
    q: 'Passkey có thay thế hoàn toàn 2FA không?',
    a: 'Passkey là lớp bảo mật bổ sung. VitTrade khuyến nghị sử dụng passkey KẾT HỢP với 2FA (Authenticator) để bảo vệ tối đa. Bạn không nên tắt 2FA khi bật passkey.',
  },
  {
    q: 'Trình duyệt nào hỗ trợ passkey?',
    a: 'Chrome 108+, Safari 16+, Firefox 122+, Edge 108+ đều hỗ trợ passkey. Trên mobile: iOS 16+ và Android 9+ với Google Play Services.',
  },
];

type SetupStep = 'idle' | 'naming' | 'biometric' | 'success';

const DEVICE_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop,
  phone: Smartphone,
  desktop: Monitor,
};

export function WebPasskeySetupPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [passkeys, setPasskeys] = useState<PasskeyDevice[]>(MOCK_PASSKEYS);
  const [setupStep, setSetupStep] = useState<SetupStep>('idle');
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  /* ─── Actions ─── */
  const handleStartSetup = () => {
    setSetupStep('naming');
    setNewName('');
    setError('');
  };

  const handleBiometric = async () => {
    if (!newName.trim()) { setError('Vui lòng đặt tên cho passkey'); return; }
    setError('');
    setSetupStep('biometric');
    setIsLoading(true);

    // Simulate WebAuthn prompt
    await new Promise(r => setTimeout(r, 2500));

    // Success
    const newKey: PasskeyDevice = {
      id: `pk-${Date.now()}`,
      name: newName,
      icon: 'desktop',
      browser: 'Chrome 122',
      os: 'macOS Sonoma',
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: new Date().toISOString().split('T')[0],
      isCurrent: true,
    };
    setPasskeys(prev => [...prev, newKey]);
    setIsLoading(false);
    setSetupStep('success');
  };

  const handleDelete = async (id: string) => {
    if (!password) { setError('Nhập mật khẩu để xóa passkey'); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setPasskeys(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
    setPassword('');
    setError('');
    setIsLoading(false);
  };

  const handleDone = () => {
    setSetupStep('idle');
    setNewName('');
  };

  /* ─── Card helper ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  return (
    <PageLayout>
      {/* Header bar */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56, padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/profile/security')}
            className="flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: c.bg, border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
              Passkey & Sinh trắc học
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Bảo mật &gt; Passkey / Biometrics
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          style={{
            padding: '6px 14px', borderRadius: 20,
            background: passkeys.length > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
            border: `1px solid ${passkeys.length > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
          }}
        >
          {passkeys.length > 0
            ? <><CheckCircle size={13} color="#10B981" /><span style={{ color: '#10B981', fontSize: WEB_FONT.sm, fontWeight: 600 }}>{passkeys.length} Passkey</span></>
            : <><ShieldAlert size={13} color="#F59E0B" /><span style={{ color: '#F59E0B', fontSize: WEB_FONT.sm, fontWeight: 600 }}>Chưa thiết lập</span></>}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>

          {/* ═══ SETUP STEP: idle — Main view ═══ */}
          {setupStep === 'idle' && (
            <>
              {/* Explainer card */}
              <div style={card()}>
                <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.06)' }}
                  >
                    <Fingerprint size={22} color="#8B5CF6" />
                  </div>
                  <div>
                    <h2 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 2 }}>
                      Đăng nhập không cần mật khẩu
                    </h2>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Sử dụng vân tay, khuôn mặt hoặc PIN thiết bị</p>
                  </div>
                </div>

                <div className="flex flex-wrap" style={{ gap: 12, marginTop: 4 }}>
                  {[
                    { icon: ShieldCheck, label: 'Chống phishing', color: '#10B981' },
                    { icon: Fingerprint, label: 'Sinh trắc học', color: '#8B5CF6' },
                    { icon: Key, label: 'Mã hóa phần cứng', color: '#3B82F6' },
                    { icon: Sparkles, label: 'Đăng nhập 1 chạm', color: '#F59E0B' },
                  ].map(f => (
                    <div
                      key={f.label}
                      className="flex items-center gap-2"
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: `${f.color}08`, border: `1px solid ${f.color}15`,
                      }}
                    >
                      <f.icon size={13} color={f.color} />
                      <span style={{ color: c.text1, fontSize: WEB_FONT.xs, fontWeight: 500 }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registered passkeys */}
              <div style={card()}>
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    Passkey đã đăng ký ({passkeys.length})
                  </h3>
                  <button
                    onClick={handleStartSetup}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: '#3B82F6', color: '#fff',
                      fontSize: WEB_FONT.sm, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Thêm mới
                  </button>
                </div>

                {passkeys.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ padding: '32px 0' }}>
                    <div
                      className="flex items-center justify-center"
                      style={{ width: 56, height: 56, borderRadius: 16, background: c.bg, marginBottom: 12 }}
                    >
                      <Key size={24} color={c.text3} />
                    </div>
                    <p style={{ color: c.text2, fontSize: WEB_FONT.sm, marginBottom: 4 }}>Chưa có passkey nào</p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Thêm passkey để đăng nhập nhanh hơn và an toàn hơn</p>
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    {passkeys.map(pk => {
                      const DeviceIcon = DEVICE_ICONS[pk.icon] || Monitor;
                      const isDeleting = deleteId === pk.id;

                      return (
                        <div key={pk.id}>
                          <div
                            className="flex items-center"
                            style={{
                              padding: '14px 16px', borderRadius: 12,
                              background: pk.isCurrent ? 'rgba(59,130,246,0.03)' : c.bg,
                              border: `1px solid ${pk.isCurrent ? 'rgba(59,130,246,0.12)' : c.borderSolid}`,
                              gap: 14,
                            }}
                          >
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: pk.isCurrent ? 'rgba(59,130,246,0.06)' : c.surface,
                              }}
                            >
                              <DeviceIcon size={20} color={pk.isCurrent ? '#3B82F6' : c.text3} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                                <p style={{
                                  color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{pk.name}</p>
                                {pk.isCurrent && (
                                  <span style={{
                                    padding: '1px 8px', borderRadius: 10,
                                    background: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                    fontSize: WEB_FONT.xs, fontWeight: 600, whiteSpace: 'nowrap',
                                  }}>
                                    Thiết bị này
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{pk.browser} · {pk.os}</span>
                                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                  Dùng lần cuối: {pk.lastUsed}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteId(isDeleting ? null : pk.id)}
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: isDeleting ? 'rgba(239,68,68,0.06)' : 'transparent',
                                border: `1px solid ${isDeleting ? 'rgba(239,68,68,0.2)' : 'transparent'}`,
                                cursor: 'pointer',
                              }}
                              title="Xóa passkey"
                            >
                              <Trash2 size={15} color={isDeleting ? '#EF4444' : c.text3} />
                            </button>
                          </div>

                          {/* Delete confirm */}
                          {isDeleting && (
                            <div
                              style={{
                                margin: '8px 0 0 0', padding: '14px 16px', borderRadius: 10,
                                background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)',
                              }}
                            >
                              <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 8 }}>
                                Xóa passkey "{pk.name}"?
                              </p>
                              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5, marginBottom: 12 }}>
                                Bạn sẽ không thể dùng passkey này để đăng nhập nữa. Nhập mật khẩu để xác nhận.
                              </p>
                              <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                                <div
                                  className="flex-1 flex items-center"
                                  style={{
                                    height: 40, borderRadius: 8,
                                    border: `1.5px solid ${error && deleteId === pk.id ? '#EF4444' : c.borderSolid}`,
                                    background: c.bg, padding: '0 12px', gap: 8,
                                  }}
                                >
                                  <Lock size={14} color={c.text3} />
                                  <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Mật khẩu..."
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    className="flex-1 bg-transparent outline-none min-w-0"
                                    style={{ color: c.text1, fontSize: WEB_FONT.sm, height: '100%' }}
                                  />
                                  <button
                                    onClick={() => setShowPw(!showPw)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  >
                                    {showPw ? <EyeOff size={14} color={c.text3} /> : <Eye size={14} color={c.text3} />}
                                  </button>
                                </div>
                              </div>
                              {error && deleteId === pk.id && (
                                <p style={{ color: '#EF4444', fontSize: WEB_FONT.xs, marginBottom: 8 }}>{error}</p>
                              )}
                              <div className="flex" style={{ gap: 8 }}>
                                <button
                                  onClick={() => handleDelete(pk.id)}
                                  disabled={isLoading}
                                  className="flex items-center justify-center gap-1.5"
                                  style={{
                                    height: 36, borderRadius: 8, padding: '0 16px',
                                    background: '#EF4444', color: '#fff',
                                    fontSize: WEB_FONT.sm, fontWeight: 600,
                                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.7 : 1,
                                  }}
                                >
                                  <Trash2 size={13} /> Xóa
                                </button>
                                <button
                                  onClick={() => { setDeleteId(null); setPassword(''); setError(''); }}
                                  style={{
                                    height: 36, borderRadius: 8, padding: '0 16px',
                                    background: c.bg, color: c.text2,
                                    fontSize: WEB_FONT.sm, fontWeight: 500,
                                    border: `1px solid ${c.borderSolid}`, cursor: 'pointer',
                                  }}
                                >
                                  Hủy
                                </button>
                              </div>
                              {/* Demo hint */}
                              <p style={{ color: c.text3, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
                                Demo: nhập bất kỳ mật khẩu nào
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FAQ */}
              <div style={card()}>
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 14 }}>
                  Câu hỏi thường gặp
                </h3>
                <div className="flex flex-col" style={{ gap: 0 }}>
                  {FAQ_ITEMS.map((item, i) => (
                    <div key={i}>
                      {i > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="flex items-center justify-between"
                        style={{
                          width: '100%', padding: '14px 0', textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer', gap: 12,
                        }}
                      >
                        <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500, flex: 1 }}>
                          {item.q}
                        </span>
                        {expandedFaq === i ? <ChevronUp size={16} color={c.text3} /> : <ChevronDown size={16} color={c.text3} />}
                      </button>
                      {expandedFaq === i && (
                        <div style={{ paddingBottom: 14 }}>
                          <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.7 }}>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div
                className="flex items-start gap-3"
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(59,130,246,0.03)',
                  border: '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Passkey được hỗ trợ bởi tiêu chuẩn{' '}
                  <span style={{ color: c.text1, fontWeight: 500 }}>FIDO2 / WebAuthn</span>.
                  Khóa riêng không bao giờ rời khỏi thiết bị của bạn — VitTrade chỉ lưu trữ khóa công khai.
                </p>
              </div>
            </>
          )}

          {/* ═══ SETUP STEP: naming ═══ */}
          {setupStep === 'naming' && (
            <div style={card()}>
              <button
                onClick={() => setSetupStep('idle')}
                className="flex items-center hover:underline"
                style={{ gap: 6, color: c.text2, fontSize: WEB_FONT.sm, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ArrowLeft size={16} /> Quay lại
              </button>

              <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
                <div
                  className="flex items-center justify-center"
                  style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(139,92,246,0.06)', marginBottom: 16 }}
                >
                  <Fingerprint size={28} color="#8B5CF6" />
                </div>
                <h2 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}>
                  Đăng ký Passkey mới
                </h2>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, textAlign: 'center', maxWidth: 360 }}>
                  Đặt tên dễ nhận diện cho passkey này (ví dụ: "MacBook văn phòng" hoặc "Desktop nhà")
                </p>
              </div>

              {/* Name input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
                  Tên Passkey
                </label>
                <div
                  className="flex items-center"
                  style={{
                    height: WEB_BUTTON.lg, borderRadius: 10,
                    border: `1.5px solid ${error ? '#EF4444' : c.borderSolid}`,
                    background: c.bg, padding: '0 14px', gap: 10,
                  }}
                >
                  <Key size={15} color={c.text3} className="shrink-0" />
                  <input
                    type="text"
                    placeholder="VD: MacBook Pro — Touch ID"
                    value={newName}
                    onChange={e => { setNewName(e.target.value); setError(''); }}
                    maxLength={50}
                    className="flex-1 bg-transparent outline-none min-w-0"
                    style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <AlertTriangle size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{error}</span>
                  </div>
                )}
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 4 }}>{newName.length}/50 ký tự</p>
              </div>

              {/* Device info preview */}
              <div
                style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: c.bg, border: `1px solid ${c.borderSolid}`,
                  marginBottom: 24,
                }}
              >
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 500, marginBottom: 8 }}>
                  Thiết bị hiện tại
                </p>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {[
                    { icon: Monitor, label: 'Trình duyệt', value: 'Chrome 122' },
                    { icon: Globe, label: 'Hệ điều hành', value: navigator.platform || 'macOS' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <r.icon size={12} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{r.label}</span>
                      </div>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.xs, fontWeight: 500 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div
                className="flex items-start gap-3"
                style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)',
                  marginBottom: 24,
                }}
              >
                <Info size={14} color="#8B5CF6" className="shrink-0" style={{ marginTop: 2 }} />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Ở bước tiếp theo, trình duyệt sẽ yêu cầu xác nhận sinh trắc học (Touch ID / Windows Hello / PIN).
                  Đảm bảo thiết bị của bạn đã bật tính năng này.
                </p>
              </div>

              <button
                onClick={handleBiometric}
                disabled={!newName.trim()}
                className="flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                  background: !newName.trim() ? c.surface2 : 'linear-gradient(135deg, #8B5CF6 0%, #6d28d9 100%)',
                  color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                  cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: !newName.trim() ? 'none' : '0 4px 16px rgba(139,92,246,0.25)',
                }}
              >
                <Fingerprint size={18} />
                Tiếp tục — Xác nhận sinh trắc học
              </button>
            </div>
          )}

          {/* ═══ SETUP STEP: biometric — Simulated biometric prompt ═══ */}
          {setupStep === 'biometric' && (
            <div style={card()}>
              <div className="flex flex-col items-center" style={{ paddingTop: 24, paddingBottom: 24 }}>
                {/* Animated fingerprint */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 100, height: 100, borderRadius: 28,
                    background: 'rgba(139,92,246,0.06)',
                    border: '3px solid rgba(139,92,246,0.15)',
                    marginBottom: 24,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  <Fingerprint size={48} color="#8B5CF6" />
                </div>

                <h2 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 8 }}>
                  Xác nhận sinh trắc học
                </h2>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5, textAlign: 'center', maxWidth: 360, marginBottom: 20 }}>
                  Hãy xác nhận danh tính bằng Touch ID, Face ID, Windows Hello, hoặc PIN thiết bị khi trình duyệt yêu cầu.
                </p>

                {/* Loading indicator */}
                <div className="flex items-center gap-2">
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(139,92,246,0.2)',
                    borderTopColor: '#8B5CF6',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  <span style={{ color: '#8B5CF6', fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                    Đang chờ xác nhận...
                  </span>
                </div>
              </div>

              {/* Cancel */}
              <div className="flex justify-center" style={{ marginTop: 12 }}>
                <button
                  onClick={() => { setSetupStep('naming'); setIsLoading(false); }}
                  className="hover:underline"
                  style={{ color: c.text3, fontSize: WEB_FONT.sm, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Hủy
                </button>
              </div>

              <style>{`
                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.05); opacity: 0.8; }
                }
              `}</style>
            </div>
          )}

          {/* ═══ SETUP STEP: success ═══ */}
          {setupStep === 'success' && (
            <div style={card()}>
              <div className="flex flex-col items-center" style={{ paddingTop: 24 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: 'rgba(16,185,129,0.08)',
                    border: '2px solid rgba(16,185,129,0.15)',
                    marginBottom: 20,
                  }}
                >
                  <ShieldCheck size={36} color="#10B981" />
                </div>

                <h2 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 8 }}>
                  Passkey đã đăng ký!
                </h2>
                <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 380, marginBottom: 24 }}>
                  Passkey <span style={{ fontWeight: 600, color: c.text1 }}>"{newName}"</span> đã được thêm thành công.
                  Bạn có thể sử dụng sinh trắc học để đăng nhập từ thiết bị này.
                </p>

                {/* What's next */}
                <div
                  style={{
                    width: '100%', maxWidth: 400, padding: '16px 18px', borderRadius: 12,
                    background: c.bg, border: `1px solid ${c.borderSolid}`,
                    marginBottom: 24,
                  }}
                >
                  <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 10 }}>
                    Lần đăng nhập tiếp theo
                  </p>
                  <div className="flex flex-col" style={{ gap: 8 }}>
                    {[
                      'Mở trang đăng nhập VitTrade',
                      'Nhấn "Đăng nhập bằng Passkey"',
                      'Xác nhận bằng sinh trắc học (Touch ID / Face ID)',
                      'Đăng nhập thành công — không cần mật khẩu!',
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#10B981', marginTop: 1,
                          }}
                        >
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                        </div>
                        <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div
                  className="flex items-start gap-3"
                  style={{
                    width: '100%', maxWidth: 400,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(245,158,11,0.04)',
                    border: '1px solid rgba(245,158,11,0.1)',
                    marginBottom: 24,
                  }}
                >
                  <AlertTriangle size={14} color="#F59E0B" className="shrink-0" style={{ marginTop: 2 }} />
                  <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                    Giữ 2FA (Authenticator) luôn bật như lớp bảo vệ phụ. Passkey bổ sung cho 2FA, không thay thế.
                  </p>
                </div>

                <button
                  onClick={handleDone}
                  className="flex items-center justify-center gap-2"
                  style={{
                    height: WEB_BUTTON.lg, borderRadius: 10, width: '100%', maxWidth: 400,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                    color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                    cursor: 'pointer', border: 'none',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                  }}
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
