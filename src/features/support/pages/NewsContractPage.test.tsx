import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/test-utils';
import { AnnouncementsContractPage, NewsContractPage } from './NewsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const articles = [
  {
    id: 'pinned-general',
    type: 'general',
    title: 'Pinned platform update',
    summary: 'A pinned general update',
    content: 'The platform is available.',
    publishedAt: '2026-10-08T08:00:00.000Z',
    isPinned: true,
    tags: ['platform', 'release'],
  },
  {
    id: 'maintenance',
    type: 'maintenance',
    title: 'Scheduled maintenance',
    summary: 'Maintenance window',
    content: 'Trading services will be read-only.',
    publishedAt: '2026-10-08T09:00:00.000Z',
    isPinned: false,
    tags: ['service'],
  },
  {
    id: 'security',
    type: 'security',
    title: 'Security notice',
    summary: 'Security guidance',
    content: 'Review active sessions.',
    publishedAt: '2026-10-08T10:00:00.000Z',
    isPinned: false,
    tags: ['account'],
  },
  {
    id: 'promotion',
    type: 'promotion',
    title: 'Trading promotion',
    summary: 'A general promotion',
    content: 'Promotion details.',
    publishedAt: '2026-10-08T11:00:00.000Z',
    isPinned: false,
    tags: ['trading'],
  },
];

describe('NewsContractPage', () => {
  it('loads, opens, and returns from a complete news article', async () => {
    server.use(http.get('*/content/news', () => HttpResponse.json({ items: articles })));

    renderWithProviders(<NewsContractPage />);

    const article = await screen.findByRole('button', { name: /Pinned platform update/ });
    expect(article).toHaveTextContent('Ghim');
    expect(article).toHaveTextContent('platform, release');
    fireEvent.click(article);

    expect(await screen.findByRole('heading', { name: 'Pinned platform update' })).toBeVisible();
    expect(screen.getByText('The platform is available.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '← Danh sách' }));
    expect(await screen.findByRole('button', { name: /Trading promotion/ })).toBeVisible();
  });

  it('filters announcements to pinned, maintenance, and security items', async () => {
    server.use(http.get('*/content/news', () => HttpResponse.json({ items: articles })));

    renderWithProviders(<AnnouncementsContractPage />);

    expect(await screen.findByRole('button', { name: /Pinned platform update/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Scheduled maintenance/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Security notice/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Trading promotion/ })).not.toBeInTheDocument();
  });

  it('shows the loading state while the news contract is pending', async () => {
    server.use(
      http.get('*/content/news', async () => {
        await delay(100);
        return HttpResponse.json({ items: [] });
      }),
    );

    renderWithProviders(<NewsContractPage />);

    expect(await screen.findByText('Đang tải nội dung…')).toBeVisible();
    expect(await screen.findByText('Tin tức')).toBeVisible();
  });

  it('recovers from a failed news request when retry succeeds', async () => {
    let attempts = 0;
    let allowSuccess = false;
    server.use(
      http.get('*/content/news', () => {
        attempts += 1;
        return allowSuccess
          ? HttpResponse.json({ items: articles })
          : HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
      }),
    );

    renderWithProviders(<NewsContractPage />);
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    allowSuccess = true;
    fireEvent.click(retry);

    expect(await screen.findByRole('button', { name: /Pinned platform update/ })).toBeVisible();
    expect(attempts).toBeGreaterThanOrEqual(2);
  });

  it('renders the empty collection without article controls', async () => {
    server.use(http.get('*/content/news', () => HttpResponse.json({ items: [] })));

    renderWithProviders(<NewsContractPage />);

    expect(await screen.findByText('Tin tức')).toBeVisible();
    expect(screen.queryByRole('button', { name: /article/i })).not.toBeInTheDocument();
  });
});
