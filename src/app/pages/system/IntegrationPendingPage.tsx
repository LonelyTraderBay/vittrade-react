import React from 'react';
import { ArrowLeft, Database, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '../../components/ui/TrCard';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Boundary an toàn cho route chưa có backend contract hoàn chỉnh.
 *
 * Không được thay component này bằng mock page trong staging/production.
 * Development/test có thể giữ implementation cũ để tiếp tục xây dựng vertical slice.
 */
export function IntegrationPendingPage() {
  const colors = useThemeColors();
  const location = useLocation();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();

  return (
    <PageLayout aria-label="Tính năng đang chờ tích hợp backend">
      <Header title="Tính năng đang tích hợp" subtitle="Contract-first delivery" back />
      <PageContent gap="relaxed">
        <TrCard variant="hero" density="relaxed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                color: colors.buy,
                background: `${colors.buy}18`,
              }}
            >
              <Database size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, color: colors.text1, fontSize: 20, fontWeight: 700 }}>
                Route này chưa sẵn sàng cho production
              </h1>
              <p style={{ margin: '10px 0 0', color: colors.text2, lineHeight: 1.6 }}>
                Tính năng chỉ được mở lại sau khi API contract, quyền truy cập, audit event và trạng
                thái lỗi đã được kiểm thử trên backend staging.
              </p>
            </div>
          </div>
        </TrCard>

        <TrCard density="standard">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={18} color={colors.buy} aria-hidden="true" />
              <strong style={{ color: colors.text1 }}>Production safety boundary</strong>
            </div>
            <p style={{ margin: 0, color: colors.text2, lineHeight: 1.6 }}>
              Không có dữ liệu giả, giao dịch giả hoặc fallback không xác định nào được phép chạy
              tại route này trong môi trường staging/production.
            </p>
            <code
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: 10,
                color: colors.text2,
                background: colors.surface2,
                overflowWrap: 'anywhere',
              }}
            >
              {location.pathname}
            </code>
          </div>
        </TrCard>

        <button
          type="button"
          onClick={() => navigate(routePrefix || '/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 44,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12,
            color: colors.text1,
            background: colors.surface,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Về trang chính
        </button>
      </PageContent>
    </PageLayout>
  );
}
