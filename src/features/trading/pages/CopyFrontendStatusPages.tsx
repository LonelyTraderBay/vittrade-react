import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useCopyFrontendViewStatus } from '../model/copy-frontend-view-queries';
import type { CopyFrontendViewId } from '../model/copy-frontend-view-types';

const viewCopy: Record<CopyFrontendViewId, { title: string; detail: string }> = {
  'safety-center': {
    title: 'Trung tâm an toàn Copy Trading',
    detail:
      'Cài đặt bảo vệ tài khoản chỉ được hiển thị sau khi backend xác nhận trạng thái hiện hành.',
  },
  'provider-application': {
    title: 'Đăng ký nhà cung cấp chiến lược',
    detail:
      'Chưa có quy trình gửi hồ sơ được kết nối. Màn hình này không thu thập hoặc gửi dữ liệu cá nhân.',
  },
  'provider-governance': {
    title: 'Quản trị nhà cung cấp',
    detail: 'Quyền, trạng thái duyệt và lịch sử quyết định cần đến từ backend.',
  },
  'performance-attribution': {
    title: 'Phân tích hiệu suất sao chép',
    detail: 'Chưa có dữ liệu lệnh và danh mục được xác nhận để quy kết hiệu suất.',
  },
};

function CopyFrontendStatusPage({ view }: { view: CopyFrontendViewId }) {
  const status = useCopyFrontendViewStatus(view);
  const copy = viewCopy[view];

  if (status.isPending) {
    return (
      <PageLayout>
        <Header title={copy.title} subtitle="Copy Trading · Đang tải" back />
        <PageContent>
          <p role="status">Đang tải trạng thái tích hợp…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (status.isError || status.data?.state !== 'backend-required') {
    return <ErrorState onAction={() => void status.refetch()} />;
  }

  return (
    <PageLayout>
      <Header title={copy.title} subtitle="Copy Trading · Bản xem trước frontend" back />
      <PageContent>
        <section
          role="status"
          aria-label="Backend integration required"
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--tr-border)', background: 'var(--tr-surface)' }}
        >
          <p className="font-semibold">Chưa kết nối backend</p>
          <p className="mt-2 text-sm opacity-80">{copy.detail}</p>
          <p className="mt-3 text-xs opacity-70">
            Bản MSW development không chứa hồ sơ nhà cung cấp hoặc số liệu hiệu suất giả.
          </p>
        </section>
      </PageContent>
    </PageLayout>
  );
}

export function CopySafetyCenterPage() {
  return <CopyFrontendStatusPage view="safety-center" />;
}
export function ProviderApplicationPage() {
  return <CopyFrontendStatusPage view="provider-application" />;
}
export function ProviderGovernancePage() {
  return <CopyFrontendStatusPage view="provider-governance" />;
}
export function PerformanceAttributionPage() {
  return <CopyFrontendStatusPage view="performance-attribution" />;
}
