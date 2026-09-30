import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useP2PFrontendViewStatus } from '../model/frontend-view-queries';
import type { P2PFrontendViewId } from '../model/frontend-view-types';

const viewCopy: Record<P2PFrontendViewId, { title: string; detail: string }> = {
  'insurance-fund': {
    title: 'Quỹ bảo hiểm P2P',
    detail: 'Số dư quỹ và trạng thái bảo hiểm phải được lấy từ nguồn backend có thẩm quyền.',
  },
  'contribution-history': {
    title: 'Lịch sử đóng góp',
    detail: 'Chưa có nguồn dữ liệu giao dịch để hiển thị lịch sử đóng góp.',
  },
  'kyc-requirements': {
    title: 'Yêu cầu xác minh P2P',
    detail: 'Danh sách giấy tờ phụ thuộc chính sách xác minh từ backend và khu vực tài khoản.',
  },
  'kyc-status': {
    title: 'Trạng thái xác minh P2P',
    detail: 'Trạng thái và cấp xác minh của tài khoản chưa được xác nhận.',
  },
  'security-center': {
    title: 'Trung tâm bảo mật P2P',
    detail: 'Trạng thái thiết bị, phiên đăng nhập và xác thực cần được đọc từ dịch vụ bảo mật.',
  },
  'transaction-limits': {
    title: 'Hạn mức giao dịch P2P',
    detail: 'Không hiển thị hạn mức ước đoán; backend phải trả chính sách đúng với tài khoản.',
  },
  wallet: {
    title: 'Ví P2P',
    detail: 'Số dư, tài sản ký quỹ và lịch sử khóa tiền chưa có nguồn dữ liệu backend.',
  },
};

function P2PFrontendStatusPage({ view }: { view: P2PFrontendViewId }) {
  const status = useP2PFrontendViewStatus(view);
  const copy = viewCopy[view];

  if (status.isPending) {
    return (
      <PageLayout>
        <Header title={copy.title} subtitle="P2P · Đang tải" back />
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
      <Header title={copy.title} subtitle="P2P · Bản xem trước frontend" back />
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
            Bản MSW development không chứa số dư, hạn mức, kết quả KYC hoặc trạng thái bảo mật giả.
          </p>
        </section>
      </PageContent>
    </PageLayout>
  );
}

export function P2PInsuranceFundPage() {
  return <P2PFrontendStatusPage view="insurance-fund" />;
}
export function P2PContributionHistoryPage() {
  return <P2PFrontendStatusPage view="contribution-history" />;
}
export function P2PKYCRequirementsPage() {
  return <P2PFrontendStatusPage view="kyc-requirements" />;
}
export function P2PKYCStatusPage() {
  return <P2PFrontendStatusPage view="kyc-status" />;
}
export function P2PSecurityCenterPage() {
  return <P2PFrontendStatusPage view="security-center" />;
}
export function P2PTransactionLimitsPage() {
  return <P2PFrontendStatusPage view="transaction-limits" />;
}
export function P2PWalletPage() {
  return <P2PFrontendStatusPage view="wallet" />;
}
