import { isApiError } from '@/shared/api/api-error';

const UNCERTAIN_EARN_REQUEST_MESSAGE =
  'Không nhận được phản hồi từ dịch vụ. Trạng thái yêu cầu chưa xác định.';

export function formatEarnActionError(error: unknown): string {
  if (isApiError(error) && (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT')) {
    return UNCERTAIN_EARN_REQUEST_MESSAGE;
  }

  return error instanceof Error ? error.message : 'Không thể hoàn tất yêu cầu Earn.';
}
