import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/api-error';
import { formatEarnActionError } from './earn-error-message';

describe('formatEarnActionError', () => {
  it.each(['NETWORK_ERROR', 'REQUEST_TIMEOUT'])(
    'does not expose transport details when the %s leaves the request outcome unknown',
    (code) => {
      const error = new ApiError('Failed to fetch', { status: 0, code });

      expect(formatEarnActionError(error)).toBe(
        'Không nhận được phản hồi từ dịch vụ. Trạng thái yêu cầu chưa xác định.',
      );
    },
  );

  it('preserves API error messages returned by the Earn contract', () => {
    const error = new ApiError('Subscription service unavailable', {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
    });

    expect(formatEarnActionError(error)).toBe('Subscription service unavailable');
  });
});
