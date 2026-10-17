import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { useEarnTransactionsQuery } from '../model/earn-queries';
import { SavingsHistoryPage } from './EarnHistoryPage';

vi.mock('../model/earn-queries', () => ({ useEarnTransactionsQuery: vi.fn() }));

const useEarnTransactionsQueryMock = vi.mocked(useEarnTransactionsQuery);

describe('EarnHistoryPage defensive timestamp rendering', () => {
  beforeEach(() => {
    useEarnTransactionsQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: 'tx-invalid-date',
                domain: 'savings',
                operation: 'subscribe',
                productId: 'sav001',
                product: 'USDT Flexible',
                asset: 'USDT',
                amount: 500,
                status: 'completed',
                createdAt: 'not-a-date',
              },
            ],
          },
        ],
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);
  });

  it('keeps the transaction visible and labels a timestamp outside the API contract', () => {
    renderWithProviders(<SavingsHistoryPage />);

    expect(screen.getByText('Đăng ký · USDT Flexible')).toBeInTheDocument();
    expect(screen.getByText('Ngày không hợp lệ')).toBeInTheDocument();
  });
});
