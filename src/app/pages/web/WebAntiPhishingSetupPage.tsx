import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Mail,
  Lock,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebAntiPhishingSetupPage — Anti-phishing code management
 *
 * Route: /w/profile/security/anti-phishing
 *
 * Features:
 *   - Explain what anti-phishing codes are
 *   - Set / change custom code (4-20 chars)
 *   - Preview how code appears in VitTrade emails
 *   - Enable / disable
 *   - Confirm via password before activation
 *
 * Guidelines:
 *   - §14.1: Security Center features
 *   - §14.3: High-risk actions require preview + confirm
 */

const SUGGESTED_CODES = ['VitSafe2024', 'MyTradeOK', 'SecureMe!', 'TrustVT#1'];

type PageState = 'setup' | 'preview' | 'confirm' | 'success';

export function WebAntiPhishingSetupPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [state, setState] = useState<PageState>('setup');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false); // current status (demo: disabled)

  /* ─── Validation ─── */
  const codeError = (() => {
    if (!code) return '';
    if (code.length < 4) return 'Mã phải có ít nhất 4 ký tự';
    if (code.length > 20) return 'Mã tối đa 20 ký tự';
    if (/^\d+$/.test(code)) return 'Không nên chỉ dùng số — dễ đoán';
    return '';
  })();

  const codeStrength = (() => {
    if (!code) return 0;
    let s = 0;
    if (code.length >= 4) s++;
    if (code.length >= 8) s++;
    if (/[A-Z]/.test(code) && /[a-z]/.test(code)) s++;
    if (/[!@#$%^&*]/.test(code)) s++;
    return s;
  })();

  const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

  /* ─── Actions ─── */
  const handleGoPreview = () => {
    if (!code || codeError) return;
    setState('preview');
  };

  const handleGoConfirm = () => setState('confirm');

  const handleConfirm = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setIsEnabled(true);
    setState('success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggest = () => {
    const random = SUGGESTED_CODES[Math.floor(Math.random() * SUGGESTED_CODES.length)];
    setCode(random);
  };

  /* ─── Card style helper ─── */
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
              Mã chống giả mạo
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Bảo mật &gt; Mã chống giả mạo (Anti-Phishing)
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: isEnabled ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
            border: `1px solid ${isEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
          }}
        >
          {isEnabled ? (
            <>
              <CheckCircle size={13} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                Đã bật
              </span>
            </>
          ) : (
            <>
              <ShieldAlert size={13} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                Chưa bật
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* ═══ SETUP STATE ═══ */}
        {state === 'setup' && (
          <div className="flex flex-col" style={{ gap: 24 }}>
            {/* Explainer */}
            <div style={card()}>
              <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.06)',
                  }}
                >
                  <ShieldCheck size={22} color="#3B82F6" />
                </div>
                <div>
                  <h2
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.lg,
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    Mã chống giả mạo là gì?
                  </h2>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
                    Thêm một lớp bảo vệ cho email từ VitTrade
                  </p>
                </div>
              </div>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.7 }}>
                Mã chống giả mạo (Anti-Phishing Code) là một chuỗi ký tự do bạn tự đặt. Mã này sẽ
                xuất hiện trong{' '}
                <span style={{ fontWeight: 600, color: c.text1 }}>mọi email chính thức</span> từ
                VitTrade. Nếu email không chứa mã này → đó là email giả mạo, không nên nhấn vào bất
                kỳ link nào.
              </p>

              <div
                className="flex flex-col"
                style={{
                  gap: 8,
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${c.borderSolid}`,
                }}
              >
                {[
                  'Mọi email thông báo, xác nhận, bảo mật sẽ chứa mã này',
                  'Email không có mã → khả năng cao là giả mạo / phishing',
                  'Bạn có thể đổi mã bất cứ lúc nào',
                  'Mã chỉ bạn biết — VitTrade sẽ không hỏi mã này qua chat/điện thoại',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle
                      size={13}
                      color="#10B981"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input code */}
            <div style={card()}>
              <h3
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 4 }}
              >
                Đặt mã chống giả mạo
              </h3>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 16 }}>
                4 – 20 ký tự. Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>

              <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <div
                  className="flex-1 flex items-center"
                  style={{
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    border: `1.5px solid ${codeError ? '#EF4444' : code ? '#3B82F6' : c.borderSolid}`,
                    background: c.bg,
                    padding: '0 14px',
                    gap: 10,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <Lock size={15} color={c.text3} className="shrink-0" />
                  <input
                    type={showCode ? 'text' : 'password'}
                    placeholder="Nhập mã chống giả mạo..."
                    value={code}
                    onChange={(e) => setCode(e.target.value.slice(0, 20))}
                    className="flex-1 bg-transparent outline-none min-w-0"
                    style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
                  />
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {showCode ? (
                      <EyeOff size={15} color={c.text3} />
                    ) : (
                      <Eye size={15} color={c.text3} />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSuggest}
                  className="flex items-center justify-center shrink-0"
                  title="Gợi ý ngẫu nhiên"
                  style={{
                    width: WEB_BUTTON.lg,
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    background: c.bg,
                    border: `1.5px solid ${c.borderSolid}`,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={16} color="#3B82F6" />
                </button>
              </div>

              {/* Error */}
              {codeError && (
                <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{codeError}</span>
                </div>
              )}

              {/* Strength meter */}
              {code && !codeError && (
                <div style={{ marginBottom: 8 }}>
                  <div className="flex" style={{ gap: 4, marginBottom: 4 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i < codeStrength ? strengthColors[codeStrength] : c.borderSolid,
                          transition: 'background 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                  {codeStrength > 0 && (
                    <span
                      style={{
                        color: strengthColors[codeStrength],
                        fontSize: WEB_FONT.xs,
                        fontWeight: 500,
                      }}
                    >
                      {strengthLabels[codeStrength]}
                    </span>
                  )}
                </div>
              )}

              {/* Char counter */}
              <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  {code.length}/20 ký tự
                </span>
                {code && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:underline"
                    style={{
                      color: '#3B82F6',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 500,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={11} /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> Sao chép
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleGoPreview}
              disabled={!code || !!codeError}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                width: '100%',
                background:
                  !code || !!codeError
                    ? c.surface2
                    : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 600,
                cursor: !code || !!codeError ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: !code || !!codeError ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
              }}
            >
              Xem trước email mẫu
            </button>
          </div>
        )}

        {/* ═══ PREVIEW STATE ═══ */}
        {state === 'preview' && (
          <div className="flex flex-col" style={{ gap: 24 }}>
            <button
              onClick={() => setState('setup')}
              className="flex items-center hover:underline"
              style={{
                gap: 6,
                color: c.text2,
                fontSize: WEB_FONT.sm,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Chỉnh sửa mã
            </button>

            <div className="flex flex-col items-center" style={{ marginBottom: 8 }}>
              <h2
                style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}
              >
                Xem trước email VitTrade
              </h2>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                Đây là cách mã chống giả mạo sẽ hiển thị trong email từ VitTrade
              </p>
            </div>

            {/* Email preview */}
            <div
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: `1px solid ${c.borderSolid}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              }}
            >
              {/* Email header */}
              <div
                className="flex items-center gap-3"
                style={{
                  padding: '16px 20px',
                  background: c.surface,
                  borderBottom: `1px solid ${c.borderSolid}`,
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)',
                  }}
                >
                  <Mail size={18} color="#fff" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    VitTrade Security
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>no-reply@vittrade.vn</p>
                </div>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Vừa xong</span>
              </div>

              {/* Anti-phishing banner */}
              <div
                className="flex items-center gap-3"
                style={{
                  padding: '12px 20px',
                  background: 'rgba(16,185,129,0.04)',
                  borderBottom: '1px solid rgba(16,185,129,0.1)',
                }}
              >
                <ShieldCheck size={16} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  Mã chống giả mạo:{' '}
                  <span
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      padding: '2px 10px',
                      borderRadius: 6,
                      fontFamily: 'monospace',
                      letterSpacing: 1,
                    }}
                  >
                    {code}
                  </span>
                </span>
              </div>

              {/* Email body */}
              <div style={{ padding: '24px 20px', background: c.bg }}>
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.lg,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  Đăng nhập mới được phát hiện
                </h3>
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.sm,
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  Xin chào,
                  <br />
                  <br />
                  Chúng tôi phát hiện một lần đăng nhập mới vào tài khoản VitTrade của bạn từ thiết
                  bị:
                </p>
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    marginBottom: 16,
                  }}
                >
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Thiết bị:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                        Chrome trên macOS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Thời gian:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                        {new Date().toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Vị trí:</span>
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                        Hà Nội, Việt Nam
                      </span>
                    </div>
                  </div>
                </div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.7 }}>
                  Nếu đây không phải bạn, hãy đổi mật khẩu ngay lập tức.
                </p>
              </div>

              {/* Email footer */}
              <div
                style={{
                  padding: '14px 20px',
                  background: c.surface,
                  borderTop: `1px solid ${c.borderSolid}`,
                }}
              >
                <p
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    lineHeight: 1.5,
                    textAlign: 'center',
                  }}
                >
                  Email này được gửi tự động từ VitTrade. Vui lòng không trả lời.
                </p>
              </div>
            </div>

            {/* Reminder */}
            <div
              className="flex items-start gap-3"
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.1)',
              }}
            >
              <AlertTriangle
                size={16}
                color="#F59E0B"
                className="shrink-0"
                style={{ marginTop: 1 }}
              />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: c.text1 }}>Quan trọng:</span> Nếu nhận email
                từ VitTrade mà <strong>không có mã này</strong>, đó có thể là email giả mạo. Không
                nhấn vào bất kỳ link nào.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleGoConfirm}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                width: '100%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
              }}
            >
              Kích hoạt mã chống giả mạo
            </button>
          </div>
        )}

        {/* ═══ CONFIRM STATE — Password confirmation ═══ */}
        {state === 'confirm' && (
          <div className="flex flex-col" style={{ gap: 24 }}>
            <button
              onClick={() => setState('preview')}
              className="flex items-center hover:underline"
              style={{
                gap: 6,
                color: c.text2,
                fontSize: WEB_FONT.sm,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div className="flex flex-col items-center" style={{ marginBottom: 8 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: 'rgba(59,130,246,0.06)',
                  marginBottom: 16,
                }}
              >
                <Lock size={28} color="#3B82F6" />
              </div>
              <h2
                style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}
              >
                Xác nhận bằng mật khẩu
              </h2>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  lineHeight: 1.5,
                  textAlign: 'center',
                  maxWidth: 380,
                }}
              >
                Để bảo mật, vui lòng nhập mật khẩu tài khoản để kích hoạt mã chống giả mạo.
              </p>
            </div>

            {/* Summary */}
            <div
              className="flex items-center gap-3"
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(59,130,246,0.03)',
                border: '1px solid rgba(59,130,246,0.1)',
              }}
            >
              <ShieldCheck size={18} color="#3B82F6" />
              <div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, marginBottom: 2 }}>
                  Mã chống giả mạo
                </p>
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  }}
                >
                  {code}
                </p>
              </div>
            </div>

            {/* Password input */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Mật khẩu tài khoản
              </label>
              <div
                className="flex items-center"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  border: `1.5px solid ${error ? '#EF4444' : c.borderSolid}`,
                  background: c.bg,
                  padding: '0 14px',
                  gap: 10,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Lock size={15} color={c.text3} className="shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent outline-none min-w-0"
                  style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {showPw ? (
                    <EyeOff size={15} color={c.text3} />
                  ) : (
                    <Eye size={15} color={c.text3} />
                  )}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{error}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={isLoading || !password}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                width: '100%',
                background:
                  isLoading || !password
                    ? c.surface2
                    : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 600,
                cursor: isLoading || !password ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: isLoading || !password ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : (
                'Xác nhận kích hoạt'
              )}
            </button>

            {/* Demo hint */}
            <div
              className="flex items-center justify-center"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(59,130,246,0.04)',
                border: '1px dashed rgba(59,130,246,0.2)',
              }}
            >
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                Demo: nhập bất kỳ mật khẩu nào
              </span>
            </div>
          </div>
        )}

        {/* ═══ SUCCESS STATE ═══ */}
        {state === 'success' && (
          <div className="flex flex-col items-center" style={{ paddingTop: 32, gap: 24 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: 'rgba(16,185,129,0.08)',
                border: '2px solid rgba(16,185,129,0.15)',
              }}
            >
              <ShieldCheck size={36} color="#10B981" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT['2xl'],
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Mã chống giả mạo đã kích hoạt!
              </h2>
              <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, maxWidth: 400 }}>
                Từ giờ, mọi email từ VitTrade sẽ chứa mã{' '}
                <span
                  style={{
                    color: '#10B981',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    background: 'rgba(16,185,129,0.06)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {code}
                </span>
                . Kiểm tra mã này mỗi khi nhận email.
              </p>
            </div>

            {/* Tips */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
                width: '100%',
                maxWidth: 420,
              }}
            >
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 10 }}
              >
                Tiếp theo bạn nên
              </p>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {[
                  'Ghi nhớ mã này (hoặc lưu an toàn)',
                  'Kiểm tra mã trong mọi email từ VitTrade',
                  'Báo cáo email không có mã đến bộ phận hỗ trợ',
                  'Đổi mã định kỳ để tăng bảo mật',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle
                      size={13}
                      color="#10B981"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex" style={{ gap: 12, width: '100%', maxWidth: 420 }}>
              <button
                onClick={() => navigate('/w/profile/security')}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                }}
              >
                Quay lại Bảo mật
              </button>
              <button
                onClick={() => navigate('/w/home')}
                className="flex items-center justify-center"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  padding: '0 24px',
                  background: c.surface,
                  color: c.text1,
                  fontSize: WEB_FONT.md,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1.5px solid ${c.borderSolid}`,
                }}
              >
                Trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
