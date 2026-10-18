import { isApiError } from '@/shared/api/api-error';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

interface AdminQueryErrorStateProps {
  error: unknown;
  onRetry: () => void;
  pageTitle: string;
}

export function AdminQueryErrorState({ error, onRetry, pageTitle }: AdminQueryErrorStateProps) {
  const isForbidden = isApiError(error) && error.status === 403;
  return (
    <PageLayout>
      <Header title={pageTitle} />
      <PageContent>
        {isForbidden ? (
          <ErrorState
            title="Không có quyền truy cập"
            message="Tài khoản của bạn không có quyền xem dữ liệu quản trị."
          />
        ) : (
          <ErrorState onAction={onRetry} />
        )}
      </PageContent>
    </PageLayout>
  );
}
