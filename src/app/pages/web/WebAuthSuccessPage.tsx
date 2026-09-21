import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { CheckCircle, ArrowRight, Shield, TrendingUp, Wallet, Globe, Sparkles } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebAuthSuccessPage — Shared welcome/success screen after auth flows complete.
 *
 * Route: /w/auth/success
 * Receives via location.state: { purpose, from }
 *
 * Purposes:
 *   - register   → Welcome + onboarding suggestions
 *   - 2fa-setup  → 2FA activated confirmation
 *   - reset      → Password changed, redirecting to login
 *   - generic    → General success state
 *
 * Features:
 *   - Auto-redirect countdown (configurable per purpose)
 *   - Quick actions / next steps
 *   - Animated success indicator
 */

type Purpose = 'register' | '2fa-setup' | 'reset' | 'generic';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  desc: string;
  route: string;
  color: string;
}

const PURPOSE_CONFIG: Record<
  Purpose,
  {
    title: string;
    subtitle: string;
    redirectRoute: string;
    redirectLabel: string;
    countdown: number;
    accentColor: string;
    brandTagline: string;
  }
> = {
  register: {
    title: 'Chào mừng bạn đến VitTrade!',
    subtitle: 'Tài khoản đã được tạo thành công. Hãy bắt đầu khám phá nền tảng.',
    redirectRoute: '/w/home',
    redirectLabel: 'Vào trang chủ',
    countdown: 15,
    accentColor: '#3B82F6',
    brandTagline:
      'Chào mừng thành viên mới! Khám phá Spot, P2P, Prediction Markets và Open Arena ngay hôm nay.',
  },
  '2fa-setup': {
    title: 'Bảo mật đã được nâng cấp!',
    subtitle: 'Xác thực hai bước đã kích hoạt thành công. Tài khoản của bạn giờ đây an toàn hơn.',
    redirectRoute: '/w/home',
    redirectLabel: 'Vào trang chủ',
    countdown: 10,
    accentColor: '#10B981',
    brandTagline:
      'Tài khoản đã được bảo vệ bằng xác thực hai bước. Mọi đăng nhập đều cần mã xác thực.',
  },
  reset: {
    title: 'Mật khẩu đã được đổi!',
    subtitle: 'Bạn đã đặt lại mật khẩu thành công. Đăng nhập bằng mật khẩu mới.',
    redirectRoute: '/w/auth/login',
    redirectLabel: 'Đăng nhập ngay',
    countdown: 8,
    accentColor: '#8B5CF6',
    brandTagline: 'Mật khẩu đã cập nhật. Đăng nhập lại để tiếp tục sử dụng nền tảng.',
  },
  generic: {
    title: 'Thao tác thành công!',
    subtitle: 'Yêu cầu của bạn đã được xử lý thành công.',
    redirectRoute: '/w/home',
    redirectLabel: 'Về trang chủ',
    countdown: 10,
    accentColor: '#3B82F6',
    brandTagline:
      'Nền tảng giao dịch thông minh — kết nối Spot, P2P, Prediction Markets và Open Arena.',
  },
};

const QUICK_ACTIONS_REGISTER: QuickAction[] = [
  {
    icon: Shield,
    label: 'Xác minh danh tính (KYC)',
    desc: 'Hoàn tất KYC để mở khóa toàn bộ tính năng',
    route: '/w/settings/kyc',
    color: '#3B82F6',
  },
  {
    icon: Wallet,
    label: 'Nạp tiền',
    desc: 'Nạp crypto hoặc fiat để bắt đầu giao dịch',
    route: '/w/wallet/deposit',
    color: '#10B981',
  },
  {
    icon: TrendingUp,
    label: 'Giao dịch đầu tiên',
    desc: 'Mua BTC, ETH và hơn 300 altcoin',
    route: '/w/trade',
    color: '#F59E0B',
  },
  {
    icon: Globe,
    label: 'Khám phá Prediction Markets',
    desc: 'Dự đoán sự kiện, theo dõi xác suất realtime',
    route: '/w/markets/predictions',
    color: '#8B5CF6',
  },
];

const QUICK_ACTIONS_2FA: QuickAction[] = [
  {
    icon: Shield,
    label: 'Trung tâm bảo mật',
    desc: 'Kiểm tra cài đặt bảo mật khác',
    route: '/w/settings/security',
    color: '#10B981',
  },
  {
    icon: TrendingUp,
    label: 'Bắt đầu giao dịch',
    desc: 'Giao dịch Spot với bảo mật nâng cao',
    route: '/w/trade',
    color: '#3B82F6',
  },
];

export function WebAuthSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  const state = location.state as { purpose?: string; from?: string } | null;
  const purpose = (state?.purpose || 'generic') as Purpose;
  const config = PURPOSE_CONFIG[purpose] || PURPOSE_CONFIG.generic;

  const [countdown, setCountdown] = useState(config.countdown);
  const [paused, setPaused] = useState(false);

  /* ─── Auto-redirect countdown ─── */
  useEffect(() => {
    if (paused) return;
    if (countdown <= 0) {
      navigate(config.redirectRoute, { replace: true });
      return;
    }
    const id = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [countdown, paused, navigate, config.redirectRoute]);

  const quickActions =
    purpose === 'register'
      ? QUICK_ACTIONS_REGISTER
      : purpose === '2fa-setup'
        ? QUICK_ACTIONS_2FA
        : [];

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline={config.brandTagline} />

      <WebAuthFormShell textColor={c.text1}>
        {/* ─── Success Icon ─── */}
        <div className="flex flex-col items-center" style={{ paddingTop: 12, marginBottom: 28 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            {/* Outer glow ring */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: `${config.accentColor}08`,
                border: `2px solid ${config.accentColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Inner circle */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `${config.accentColor}12`,
                }}
              >
                <CheckCircle size={36} color={config.accentColor} strokeWidth={2} />
              </div>
            </div>
            {/* Decorative sparkle */}
            <Sparkles
              size={18}
              color={config.accentColor}
              style={{ position: 'absolute', top: -4, right: -4, opacity: 0.7 }}
            />
          </div>

          <h1
            style={{
              color: c.text1,
              fontSize: WEB_FONT['2xl'],
              fontWeight: 700,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {config.title}
          </h1>
          <p
            style={{
              color: c.text2,
              fontSize: WEB_FONT.md,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: 380,
            }}
          >
            {config.subtitle}
          </p>
        </div>

        {/* ─── Security badge (for register/2fa) ─── */}
        {(purpose === 'register' || purpose === '2fa-setup') && (
          <div
            className="flex items-center gap-3"
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: `${config.accentColor}06`,
              border: `1px solid ${config.accentColor}15`,
              marginBottom: 24,
            }}
          >
            <Shield size={20} color={config.accentColor} className="shrink-0" />
            <div>
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 2 }}
              >
                {purpose === '2fa-setup' ? '2FA đã kích hoạt' : 'Tài khoản đã bảo mật'}
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                {purpose === '2fa-setup'
                  ? 'Mỗi lần đăng nhập sẽ yêu cầu mã từ ứng dụng xác thực.'
                  : 'Khuyến nghị bật 2FA và hoàn tất KYC để nâng cao bảo mật.'}
              </p>
            </div>
          </div>
        )}

        {/* ─── Quick actions grid ─── */}
        {quickActions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Bước tiếp theo
            </p>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {quickActions.map((action) => (
                <button
                  key={action.route}
                  onClick={() => {
                    setPaused(true);
                    navigate(action.route);
                  }}
                  className="flex items-center text-left"
                  style={{
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = action.color;
                    (e.currentTarget as HTMLElement).style.background = `${action.color}06`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = c.borderSolid;
                    (e.currentTarget as HTMLElement).style.background = c.surface;
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${action.color}10`,
                    }}
                  >
                    <action.icon size={18} color={action.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {action.label}
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.3 }}>
                      {action.desc}
                    </p>
                  </div>
                  <ArrowRight size={16} color={c.text3} className="shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Primary CTA ─── */}
        <button
          onClick={() => navigate(config.redirectRoute, { replace: true })}
          className="flex items-center justify-center gap-2"
          style={{
            height: WEB_BUTTON.lg,
            borderRadius: 10,
            width: '100%',
            background: `linear-gradient(135deg, ${config.accentColor} 0%, ${config.accentColor}dd 100%)`,
            color: '#fff',
            fontSize: WEB_FONT.md,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            boxShadow: `0 4px 16px ${config.accentColor}40`,
            transition: 'all 0.15s ease',
          }}
        >
          {config.redirectLabel}
          <ArrowRight size={16} />
        </button>

        {/* ─── Auto-redirect countdown ─── */}
        <div className="flex items-center justify-center" style={{ marginTop: 16, gap: 8 }}>
          {!paused ? (
            <div className="flex items-center" style={{ gap: 6 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${config.accentColor}30`,
                  borderTopColor: config.accentColor,
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                Tự động chuyển hướng sau{' '}
                <span
                  style={{ color: c.text1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                >
                  {countdown}s
                </span>
              </span>
              <button
                onClick={() => setPaused(true)}
                className="hover:underline"
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                Dừng
              </button>
            </div>
          ) : (
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Đã tạm dừng chuyển hướng tự động
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Cần trợ giúp?{' '}
            <button
              className="hover:underline"
              style={{
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Liên hệ hỗ trợ
            </button>{' '}
            ·{' '}
            <button
              className="hover:underline"
              style={{
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Trung tâm trợ giúp
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
