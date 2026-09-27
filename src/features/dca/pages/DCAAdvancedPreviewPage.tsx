import { useLocation } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useDCAAdvancedOverviewQuery } from '../model/dca-queries';
import type { DCAAdvancedViewId } from '../model/dca-advanced-types';

const views: Record<DCAAdvancedViewId, { title: string; summary: string }> = {
  backtester: {
    title: 'Kiểm thử chiến lược DCA',
    summary: 'Cần lịch sử giá và bộ máy tính toán từ backend trước khi hiển thị kết quả kiểm thử.',
  },
  'dynamic-amount': {
    title: 'Số tiền DCA linh hoạt',
    summary: 'Chưa có dữ liệu tài khoản và quy tắc tính toán được xác nhận để đề xuất số tiền mua.',
  },
  'multi-asset': {
    title: 'DCA nhiều tài sản',
    summary: 'Tỷ trọng, giá và số dư cần lấy từ nguồn dữ liệu có thẩm quyền trước khi so sánh.',
  },
  'performance-compare': {
    title: 'So sánh hiệu suất DCA',
    summary: 'Hiệu suất chỉ được tính khi backend cung cấp lịch sử đầu tư và giá đã kiểm chứng.',
  },
  'portfolio-optimizer': {
    title: 'Tối ưu danh mục DCA',
    summary: 'Chưa có dữ liệu đầu vào để tạo phân tích tương quan hoặc phân bổ danh mục.',
  },
  'rebalance-config': {
    title: 'Cấu hình cân bằng lại',
    summary: 'Cấu hình chưa được lưu. Không có lịch tái phân bổ nào được bật từ màn hình này.',
  },
  'rebalance-dashboard': {
    title: 'Theo dõi cân bằng danh mục',
    summary:
      'Cần danh mục và tỷ trọng mục tiêu do backend cung cấp; không có giao dịch nào được thực thi.',
  },
  'schedule-analytics': {
    title: 'Phân tích lịch DCA',
    summary: 'Chưa có dữ liệu lịch chạy hoặc giá để đánh giá khung giờ.',
  },
  'schedule-config': {
    title: 'Cấu hình lịch DCA',
    summary: 'Lịch chưa được lưu hoặc kích hoạt. Kết nối backend là điều kiện bắt buộc.',
  },
  'smart-rules': {
    title: 'Quy tắc DCA thông minh',
    summary: 'Quy tắc hiện chưa được lưu và không ảnh hưởng tới kế hoạch mua nào.',
  },
};

const routeView: Record<string, DCAAdvancedViewId> = {
  '/dca/backtester': 'backtester',
  '/dca/dynamic-amount': 'dynamic-amount',
  '/dca/multi-asset': 'multi-asset',
  '/dca/performance-compare': 'performance-compare',
  '/dca/portfolio-optimizer': 'portfolio-optimizer',
  '/dca/rebalance/config': 'rebalance-config',
  '/dca/schedule/config': 'schedule-config',
  '/dca/smart-rules': 'smart-rules',
};

function getView(pathname: string): DCAAdvancedViewId {
  const normalizedPath = pathname.replace(/^\/(?:t|w|r)(?=\/)/, '').replace(/\/$/, '');
  const directView = routeView[normalizedPath];
  if (directView) return directView;
  if (normalizedPath.startsWith('/dca/rebalance/')) return 'rebalance-dashboard';
  if (normalizedPath.startsWith('/dca/schedule/')) return 'schedule-analytics';
  return 'backtester';
}

export function DCAAdvancedPreviewPage() {
  const { pathname } = useLocation();
  const id = getView(pathname);
  const view = views[id];
  const overview = useDCAAdvancedOverviewQuery();
  const backendRequired = overview.data?.views.some(
    (item) => item.id === id && item.state === 'backend-required',
  );

  if (overview.isPending) return <LoadingPage title={view.title} />;
  if (overview.isError || !backendRequired) {
    return <ErrorState onAction={() => void overview.refetch()} />;
  }

  return (
    <PageLayout>
      <Header title={view.title} subtitle="DCA · Bản xem trước frontend" back />
      <PageContent gap="default">
        <section
          role="status"
          aria-label="Backend integration required"
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--tr-border)', background: 'var(--tr-surface)' }}
        >
          <p className="font-semibold">Chưa kết nối backend</p>
          <p className="mt-2 text-sm opacity-80">{view.summary}</p>
          <p className="mt-3 text-xs opacity-70">
            MSW chỉ xác nhận trạng thái giao diện trong development. Dữ liệu mô phỏng không phải
            khuyến nghị đầu tư.
          </p>
        </section>
      </PageContent>
    </PageLayout>
  );
}

function LoadingPage({ title }: { title: string }) {
  return (
    <PageLayout>
      <Header title={title} subtitle="DCA · Đang tải" back />
      <PageContent>
        <p role="status">Đang tải trạng thái tích hợp…</p>
      </PageContent>
    </PageLayout>
  );
}
