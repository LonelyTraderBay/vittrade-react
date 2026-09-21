import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';

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
    const title = `${error.status} — ${error.statusText || 'Lỗi định tuyến'}`;
    if (error.status === 404) {
      return { title, detail: 'Trang bạn tìm không tồn tại hoặc đã bị di chuyển.' };
    }
    return { title, detail: 'Yêu cầu không thể hoàn tất. Vui lòng thử lại.' };
  }
  if (error instanceof Error) {
    return { title: 'Lỗi hiển thị trang', detail: error.message };
  }
  return { title: 'Lỗi không xác định', detail: 'Đã xảy ra sự cố ngoài dự kiến.' };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, detail } = getErrorMessage(error);

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
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'inherit',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#3B82F6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
}
