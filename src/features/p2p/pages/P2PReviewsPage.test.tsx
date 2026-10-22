import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { p2pApi } from '../api/p2p-api';
import type { P2PReviewsResponse } from '../model/p2p-types';
import { P2PReviewsPage } from './P2PReviewsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
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
  it('cancels an older scope and keeps cached received data after the given handler finishes late', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false,
      aborted = false,
      finished = false;
    server.use(
      http.get('*/p2p/reviews', async ({ request }) => {
        if (new URL(request.url).searchParams.get('scope') === 'given') {
          started = true;
          request.signal.addEventListener(
            'abort',
            () => {
              aborted = true;
            },
            { once: true },
          );
          await gate;
          finished = true;
          return HttpResponse.json({
            ...reviews,
            items: [{ ...reviews.items[0], comment: 'Late given fixture' }],
          });
        }
        return HttpResponse.json(reviews);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PReviewsPage />);
    await screen.findByText('Fast and reliable.');
    try {
      await user.click(screen.getByRole('tab', { name: 'Đã viết' }));
      await waitFor(() => expect(started).toBe(true));
      const received = screen.getByRole('tab', { name: 'Nhận được' });
      await user.click(received);
      await screen.findByText('Fast and reliable.');
      expect(aborted).toBe(true);
      await act(async () => release());
      await waitFor(() => expect(finished).toBe(true));
      expect(screen.getByText('Fast and reliable.')).toBeInTheDocument();
      expect(screen.queryByText('Late given fixture')).not.toBeInTheDocument();
      expect(received).toHaveFocus();
    } finally {
      release();
    }
  });

  it('keeps named tab-panel relationships and keyboard focus when changing scope', async () => {
    server.use(http.get('*/p2p/reviews', () => HttpResponse.json(reviews)));
    const user = userEvent.setup();
    renderWithProviders(<P2PReviewsPage />);
    await screen.findByText('Fast and reliable.');
    expect(screen.getByRole('tablist', { name: 'Phạm vi đánh giá P2P' })).toBeInTheDocument();
    const received = screen.getByRole('tab', { name: 'Nhận được' });
    const given = screen.getByRole('tab', { name: 'Đã viết' });
    const firstPanel = screen.getByRole('tabpanel', { name: 'Nhận được' });
    expect(received.getAttribute('aria-controls')).toBe(firstPanel.id);
    expect(firstPanel.getAttribute('aria-labelledby')).toBe(received.id);
    expect(document.getElementById(given.getAttribute('aria-controls')!)).toHaveAttribute('hidden');
    received.focus();
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('tabpanel', { name: 'Đã viết' });
    expect(given).toHaveFocus();
    expect(given).toHaveAttribute('aria-selected', 'true');
    expect(firstPanel).toHaveAttribute('hidden');
  });

  it('retains the active tab and focus during a delayed scope request', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false;
    server.use(
      http.get('*/p2p/reviews', async ({ request }) => {
        if (new URL(request.url).searchParams.get('scope') === 'given') {
          started = true;
          await gate;
        }
        return HttpResponse.json(reviews);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PReviewsPage />);
    await screen.findByText('Fast and reliable.');
    const given = screen.getByRole('tab', { name: 'Đã viết' });
    try {
      await user.click(given);
      await waitFor(() => expect(started).toBe(true));
      expect(given).toBeInTheDocument();
      expect(given).toHaveFocus();
      expect(given).toHaveAttribute('aria-selected', 'true');
    } finally {
      release();
    }
    await screen.findByText('Fast and reliable.');
    expect(given).toHaveFocus();
  });

  it('retains scope tabs after a read error and recovers through the received tab', async () => {
    server.use(
      http.get('*/p2p/reviews', ({ request }) =>
        new URL(request.url).searchParams.get('scope') === 'given'
          ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
          : HttpResponse.json(reviews),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PReviewsPage />);
    await screen.findByText('Fast and reliable.');
    const given = screen.getByRole('tab', { name: 'Đã viết' });
    await user.click(given);
    await screen.findByText('Không thể tải đánh giá P2P');
    expect(given).toBeInTheDocument();
    expect(given).toHaveFocus();
    expect(screen.queryByText('Fast and reliable.')).not.toBeInTheDocument();
    const received = screen.getByRole('tab', { name: 'Nhận được' });
    await user.click(received);
    await screen.findByText('Fast and reliable.');
    expect(received).toHaveFocus();
  });

  it('renders low ratings and the merchant reply without showing five filled stars', async () => {
    server.use(
      http.get('*/p2p/reviews', () =>
        HttpResponse.json({
          ...reviews,
          averageRating: 2,
          positiveCount: 0,
          negativeCount: 1,
          items: [
            { ...reviews.items[0], rating: 2, type: 'negative', reply: 'We will investigate.' },
          ],
        }),
      ),
    );
    renderWithProviders(<P2PReviewsPage />);
    expect(await screen.findByText('Phản hồi: We will investigate.')).toBeInTheDocument();
    const stars = screen.getByRole('img', { name: '2 sao' }).querySelectorAll('svg');
    expect(stars).toHaveLength(5);
    expect(
      Array.from(stars).filter((star) => star.getAttribute('fill') === '#F59E0B'),
    ).toHaveLength(2);
  });
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

  it('defaults absent summary counts to zero at the page boundary', async () => {
    vi.spyOn(p2pApi, 'listReviews').mockResolvedValueOnce({
      items: [],
      total: 0,
      averageRating: 0,
    } as unknown as P2PReviewsResponse);

    renderWithProviders(<P2PReviewsPage />);

    expect(await screen.findByText('Tích cực')).toBeInTheDocument();
    expect(screen.getByText('Tích cực').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Tiêu cực').parentElement).toHaveTextContent('0');
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
    expect(await screen.findByRole('status')).toHaveTextContent('Chưa có đánh giá nào');
  });
});
