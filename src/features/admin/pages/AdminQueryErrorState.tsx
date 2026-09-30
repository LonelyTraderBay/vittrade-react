import { isApiError } from '@/shared/api/api-error';
import { ErrorState } from '@/shared/ui/ErrorState';

interface AdminQueryErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

export function AdminQueryErrorState({ error, onRetry }: AdminQueryErrorStateProps) {
  if (isApiError(error) && error.status === 403) {
    return (
      <ErrorState
        title="Không có quyền truy cập"
        message="Tài khoản của bạn không có quyền xem dữ liệu quản trị."
      />
    );
  }

  return <ErrorState onAction={onRetry} />;
}
