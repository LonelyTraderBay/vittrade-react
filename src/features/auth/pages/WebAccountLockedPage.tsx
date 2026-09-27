import { AlertTriangle, ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_BUTTON, WEB_FONT } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';

/** Route shown after the authentication API rejects access with AccountLocked (423). */
export function WebAccountLockedPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Tài khoản đang bị từ chối theo chính sách bảo mật. Trạng thái đăng nhập được hệ thống xác thực quyết định." />

      <WebAuthFormShell textColor={c.text1}>
        <button
          type="button"
          onClick={() => navigate('/w/auth/login')}
          className="flex items-center hover:underline"
          style={{
            gap: 6,
            color: c.text2,
            fontSize: WEB_FONT.sm,
            marginBottom: 32,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </button>

        <main>
          <header className="flex flex-col items-center" style={{ marginBottom: 28 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(239,68,68,0.08)',
                marginBottom: 20,
                border: '2px solid rgba(239,68,68,0.15)',
              }}
            >
              <Lock size={32} color="#EF4444" />
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
              Tài khoản tạm khóa
            </h1>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.md,
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 360,
              }}
            >
              Hệ thống xác thực hiện chưa cho phép đăng nhập tài khoản này.
            </p>
          </header>

          <div
            role="status"
            className="flex items-start gap-3"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              marginBottom: 24,
            }}
          >
            <AlertTriangle size={16} color="#F59E0B" className="shrink-0" />
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
              Hãy quay lại đăng nhập để kiểm tra trạng thái mới nhất. Nếu bạn không thực hiện yêu
              cầu này, hãy đặt lại mật khẩu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/w/auth/forgot-password')}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              width: '100%',
              background: c.surface,
              color: c.text1,
              fontSize: WEB_FONT.md,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1.5px solid ${c.borderSolid}`,
              marginBottom: 20,
            }}
          >
            <ShieldAlert size={16} color={c.text2} />
            Không phải bạn? Đặt lại mật khẩu
          </button>

          <div
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              background: 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.12)',
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 8 }}>
              Gợi ý bảo mật
            </p>
            <ul
              style={{
                color: c.text3,
                fontSize: WEB_FONT.xs,
                lineHeight: 1.7,
                paddingLeft: 16,
                margin: 0,
              }}
            >
              <li>Sử dụng mật khẩu mạnh, không trùng với dịch vụ khác.</li>
              <li>Bật xác thực hai bước để bảo vệ tài khoản.</li>
            </ul>
          </div>
        </main>
      </WebAuthFormShell>
    </div>
  );
}
