import { TOAST } from '@/shared/constants/toastMessages';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Copy, CheckCircle, Download, ChevronRight } from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { useAuth } from '@/shared/session/useAuth';
import { CTAButton } from '@/shared/ui/CTAButton';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useActionToast } from '@/shared/hooks/useActionToast';
import type { MfaSetupChallenge } from '../api/auth-api';

function QRCodeSVG({ src }: { src?: string }) {
  return src ? (
    <img src={src} width="160" height="160" alt="Mã QR thiết lập xác thực hai bước" />
  ) : (
    <div
      style={{ width: 160, height: 160, display: 'grid', placeItems: 'center', color: '#6B7280' }}
      aria-label="Đang tải mã QR"
    >
      Đang tải...
    </div>
  );
}

export function TwoFASetupPage() {
  const { beginMfaSetup, confirmMfaSetup } = useAuth();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setup, setSetup] = useState<MfaSetupChallenge | null>(null);
  const navigate = useNavigate();
  const actionToast = useActionToast();

  useEffect(() => {
    let active = true;
    void beginMfaSetup()
      .then((challenge) => {
        if (active) setSetup(challenge);
      })
      .catch(() => {
        if (active) actionToast.error('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [actionToast, beginMfaSetup]);

  const handleCopyKey = () => {
    if (!setup) return;
    navigator.clipboard.writeText(setup.secret).catch(() => {});
    setCopied(true);
    actionToast.success(TOAST.COPY.SECRET_KEY);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleConfirm = async () => {
    setIsLoading(true);
    if (step === 2) {
      try {
        await confirmMfaSetup({ code: otp });
        setStep(3);
      } catch {
        actionToast.error('Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.');
      }
    } else if (step === 3) {
      navigate(`${prefix}/home`, { replace: true });
    } else {
      setStep((s) => s + 1);
    }
    setIsLoading(false);
  };

  return (
    <PageLayout>
      <Header title="Thiết lập 2FA" subtitle="Xác thực · Bảo mật" back />
      <div className="flex items-center px-5 py-4 gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="contents">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: s <= step ? '#3B82F6' : c.surface2,
                color: s <= step ? '#fff' : c.text3,
                border: s === step ? '2px solid #3B82F6' : '2px solid transparent',
              }}
            >
              {s < step ? <CheckCircle size={16} color="#fff" /> : s}
            </div>
            {s < 3 && (
              <div
                className="flex-1 h-0.5"
                style={{ background: s < step ? '#3B82F6' : c.borderSolid }}
              />
            )}
          </div>
        ))}
      </div>
      <PageContent gap={20} className="flex-1">
        {step === 1 && (
          <div className="contents">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1.5px solid rgba(59,130,246,0.3)',
                }}
              >
                <Shield size={32} color="#3B82F6" />
              </div>
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Bước 1: Quét mã QR</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                Mở ứng dụng <strong style={{ color: c.text1 }}>Google Authenticator</strong> hoặc{' '}
                <strong style={{ color: c.text1 }}>Authy</strong> và quét mã QR bên dưới.
              </p>
            </div>
            <div className="flex justify-center">
              <div
                className="rounded-3xl p-4"
                style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
              >
                <QRCodeSVG src={setup?.qrCodeUrl} />
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
            >
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>
                Hoặc nhập thủ công khóa bí mật:
              </p>
              <div className="flex items-center justify-between gap-3">
                <span
                  style={{
                    color: c.text1,
                    fontSize: 14,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    letterSpacing: 2,
                  }}
                >
                  {setup?.secret ?? 'Đang tải khóa bảo mật...'}
                </span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                  style={{
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                    color: copied ? '#10B981' : '#3B82F6',
                    fontSize: 12,
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div
              className="rounded-2xl p-3"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              <p style={{ color: '#F59E0B', fontSize: 12 }}>⚠️ Giữ bí mật khóa này.</p>
            </div>
            <CTAButton onClick={() => setStep(2)} variant="primary">
              Tiếp theo <ChevronRight size={18} />
            </CTAButton>
          </div>
        )}

        {step === 2 && (
          <div className="contents">
            <div className="text-center">
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Bước 2: Xác minh mã</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8 }}>
                Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-11 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: c.surface2,
                      border: `2px solid ${otp[i] ? '#3B82F6' : c.borderSolid}`,
                    }}
                  >
                    <span style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>
                      {otp[i] ?? ''}
                    </span>
                  </div>
                ))}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="opacity-0 absolute"
                autoFocus
              />
              <p style={{ color: c.text3, fontSize: 12 }}>Chạm vào đây để nhập mã</p>
            </div>
            <CTAButton
              onClick={handleConfirm}
              disabled={otp.length < 6}
              loading={isLoading}
              variant="primary"
            >
              {isLoading ? 'Đang xác minh...' : 'Xác nhận'}
            </CTAButton>
          </div>
        )}

        {step === 3 && (
          <div className="contents">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1.5px solid rgba(16,185,129,0.3)',
                }}
              >
                <Download size={32} color="#10B981" />
              </div>
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Bước 3: Mã dự phòng</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                Lưu các mã này ở nơi an toàn. Dùng khi mất thiết bị xác thực.
              </p>
            </div>
            <div
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
            >
              {(setup?.backupCodes ?? []).map((code, i) => (
                <div key={code} className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: 12, width: 20 }}>{i + 1}.</span>
                  <span
                    style={{
                      color: c.text1,
                      fontSize: 15,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      letterSpacing: 2,
                    }}
                  >
                    {code}
                  </span>
                  <div className="w-20" />
                </div>
              ))}
            </div>
            <div
              className="rounded-2xl p-3"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <p style={{ color: '#EF4444', fontSize: 12, lineHeight: 1.6 }}>
                ⚠️ Mỗi mã chỉ dùng được 1 lần.
              </p>
            </div>
            <button onClick={() => setSavedCodes(!savedCodes)} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{
                  background: savedCodes ? '#3B82F6' : 'transparent',
                  border: `1.5px solid ${savedCodes ? '#3B82F6' : c.borderSolid}`,
                }}
              >
                {savedCodes && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ color: c.text2, fontSize: 13 }}>Tôi đã lưu các mã dự phòng</span>
            </button>
            <CTAButton
              onClick={handleConfirm}
              disabled={!savedCodes}
              loading={isLoading}
              variant="success"
            >
              {isLoading ? 'Đang hoàn tất...' : '✓ Hoàn tất thiết lập 2FA'}
            </CTAButton>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
