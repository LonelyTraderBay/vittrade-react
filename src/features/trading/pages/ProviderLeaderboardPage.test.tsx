import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ProviderLeaderboardPage } from './ProviderLeaderboardPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const providers = {
  items: [
    {
      id: 'provider-1',
      name: 'Provider One',
      avatar: 'P1',
      winRate: 62,
      totalPnl: 1_250,
      totalPnlPct: 12.5,
      aum: 250_000,
      copiers: 48,
      maxCopiers: 100,
      sharpeRatio: 1.8,
      maxDrawdown: 8.5,
      totalTrades: 120,
      avgHoldingTime: '4h',
      weeklyPnl: [1, 2, -1, 3],
      tags: ['swing'],
      isFollowing: true,
      riskLevel: 'medium',
      verified: true,
    },
    {
      id: 'provider-2',
      name: 'Provider Two',
      avatar: 'P2',
      winRate: 48,
      totalPnl: -240,
      totalPnlPct: -4.2,
      aum: 90_000,
      copiers: 17,
      maxCopiers: 80,
      sharpeRatio: 0.8,
      maxDrawdown: 18.5,
      totalTrades: 85,
      avgHoldingTime: '2h',
      weeklyPnl: [-1, 0, -2, 1],
      tags: ['momentum'],
      isFollowing: false,
      riskLevel: 'high',
      verified: false,
    },
  ],
};

describe('provider leaderboard', () => {
  it('shows loading then applies sort, risk, and verification filters', async () => {
    server.use(
      http.get('*/trading/copy/providers', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(providers);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProviderLeaderboardPage />);

    expect(await screen.findByText('Đang tải provider…')).toBeInTheDocument();
    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sharpe' }));
    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Trung bình' }));
    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Chỉ hiện provider đã xác minh/ }));

    expect(await screen.findByText('Bật')).toBeInTheDocument();
    expect(await screen.findByText('Provider One')).toBeInTheDocument();
  });

  it('shows a retry state when leaderboard data is unavailable', async () => {
    let recover = false;
    let reads = 0;
    let finishAutomaticAttempts!: () => void;
    const automaticAttemptsFinished = new Promise<void>((resolve) => {
      finishAutomaticAttempts = resolve;
    });
    server.use(
      http.get('*/trading/copy/providers', () => {
        reads++;
        if (!recover && reads === 3) finishAutomaticAttempts();
        return recover
          ? HttpResponse.json(providers)
          : HttpResponse.json({ code: 'PROVIDERS_UNAVAILABLE' }, { status: 503 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProviderLeaderboardPage />);

    const results = screen.getByRole('region', { name: 'Kết quả bảng xếp hạng provider' });
    // Chờ đủ vòng retry transport trước khi kiểm tra UI, không lấy mốc 1 giây bao cả backoff.
    await automaticAttemptsFinished;
    const retryButton = await within(results).findByRole('button', { name: 'Thử lại' });
    expect(reads).toBe(3);
    recover = true;
    await user.click(retryButton);

    expect(await within(results).findByText('Provider One')).toBeInTheDocument();
    expect(reads).toBe(4);
  });
});
