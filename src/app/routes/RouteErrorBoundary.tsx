import { useEffect } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { CTAButton } from '@/shared/ui/CTAButton';
import { env } from '@/shared/config/env';
import { captureException } from '../../shared/telemetry/telemetry';

/**
 * ══════════════════════════════════════════════════════════
 *  Route Error Boundary — top-level render crash safety net
 * ══════════════════════════════════════════════════════════
 *
 *  Wired as the router's global `errorElement`. When any route
 *  throws during render/navigation, the user gets a readable
 *  recovery screen instead of a blank page.
 *
 *  Guidelines §15.2 — error copy structure:
 *  vấn đề → lý do → cách xử lý.
 */

function getErrorMessage(error: unknown): { title: string; detail: string } {
  if (isRouteErrorResponse(error)) {
    const title = `${error.status} — ${env.isDev ? error.statusText || 'Lỗi định tuyến' : 'Lỗi định tuyến'}`;
    if (error.status === 404) {
      return { title, detail: 'Trang bạn tìm không tồn tại hoặc đã bị di chuyển.' };
    }
    return { title, detail: 'Yêu cầu không thể hoàn tất. Vui lòng thử lại.' };
  }
  if (error instanceof Error) {
    return {
      title: 'Lỗi hiển thị trang',
      detail: env.isDev
        ? error.message
        : 'Trang gặp sự cố. Vui lòng thử lại hoặc quay về trang trước.',
    };
  }
  return { title: 'Lỗi không xác định', detail: 'Đã xảy ra sự cố ngoài dự kiến.' };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, detail } = getErrorMessage(error);

  useEffect(() => {
    captureException(error, {
      area: 'router',
      operation: 'route-error',
      release: env.releaseVersion,
      metadata: {
        status: isRouteErrorResponse(error) ? error.status : undefined,
        path: window.location.pathname,
      },
    });
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: 'var(--background, #0b0e11)',
        color: 'var(--foreground, #e5e7eb)',
      }}
    >
      <div aria-hidden style={{ fontSize: 40, lineHeight: 1 }}>
        ⚠️
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 14, opacity: 0.7, margin: 0, maxWidth: 420 }}>{detail}</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <CTAButton variant="ghost" density="compact" fullWidth={false} onClick={() => navigate(-1)}>
          Quay lại
        </CTAButton>
        <CTAButton density="compact" fullWidth={false} onClick={() => window.location.reload()}>
          Tải lại trang
        </CTAButton>
      </div>
    </div>
  );
}
