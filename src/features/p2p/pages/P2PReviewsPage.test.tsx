import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PReviewsResponse } from '../model/p2p-types';
import { P2PReviewsPage } from './P2PReviewsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const reviews: P2PReviewsResponse = {
  items: [
    {
      id: 'review-1',
      orderId: 'order-1',
      fromUser: 'buyer-one',
      fromUserId: 'user-1',
      toUser: 'merchant-one',
      toUserId: 'merchant-1',
      rating: 5,
      comment: 'Fast and reliable.',
      createdAt: '2026-09-21',
      type: 'positive',
    },
  ],
  total: 1,
  averageRating: 5,
  positiveCount: 1,
  negativeCount: 0,
};

describe('P2P reviews contract page', () => {
  it('loads received and given scopes through the typed query boundary', async () => {
    server.use(
      http.get('*/p2p/reviews', ({ request }) => {
        const scope = new URL(request.url).searchParams.get('scope');
        return HttpResponse.json(
          scope === 'given'
            ? { ...reviews, items: [{ ...reviews.items[0], fromUser: 'merchant-one' }] }
            : reviews,
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PReviewsPage />);
    expect(await screen.findByText('Fast and reliable.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Đã viết' }));
    expect(await screen.findByText('merchant-one')).toBeInTheDocument();
  });

  it('renders empty and retryable error states', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/p2p/reviews', () => {
        if (shouldFail)
          return HttpResponse.json({ code: 'P2P_REVIEWS_UNAVAILABLE' }, { status: 503 });
        return HttpResponse.json({ ...reviews, items: [], total: 0 });
      }),
    );

    renderWithProviders(<P2PReviewsPage />);
    expect(await screen.findByText('Không thể tải đánh giá P2P')).toBeInTheDocument();
    shouldFail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('status', { name: 'No P2P reviews' })).toBeInTheDocument();
  });
});
