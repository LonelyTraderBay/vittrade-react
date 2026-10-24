import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { EarnSnapshot } from './earn-types';
import { useEarnSnapshotQuery } from './earn-queries';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const snapshot: EarnSnapshot = {
  products: [
    {
      id: 'product-1',
      domain: 'savings',
      type: 'flexible',
      name: 'Stable Savings',
      asset: 'USDT',
      apy: 8.5,
      minAmount: 10,
      remainingQuota: '1M USDT',
      participants: 100,
      totalStaked: '500000',
      color: '#10B981',
      riskLevel: 'low',
    },
  ],
  positions: [],
  balances: { USDT: 1_000 },
  summary: {
    totalDepositedUsd: 0,
    totalEarnedUsd: 0,
    averageApy: 8.5,
    activePositions: 0,
  },
};

function EarnSnapshotPollingProbe({ pausePolling }: { pausePolling: boolean }) {
  const query = useEarnSnapshotQuery({ pausePolling });
  return <p data-testid="earn-snapshot-status">{query.status}</p>;
}

describe('Earn snapshot polling', () => {
  it('keeps one snapshot query and pauses/resumes its interval with the action state', async () => {
    vi.useFakeTimers();
    let requests = 0;
    server.use(
      http.get('*/earn/snapshot', () => {
        requests++;
        return HttpResponse.json(snapshot);
      }),
    );

    const view = renderWithProviders(<EarnSnapshotPollingProbe pausePolling={false} />);
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByTestId('earn-snapshot-status')).toHaveTextContent('success');
      expect(requests).toBe(1);

      view.rerender(<EarnSnapshotPollingProbe pausePolling />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(screen.getByTestId('earn-snapshot-status')).toHaveTextContent('success');
      expect(requests).toBe(1);

      view.rerender(<EarnSnapshotPollingProbe pausePolling={false} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      const requestsAfterResume = requests;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(requests).toBeGreaterThan(requestsAfterResume);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });
});
