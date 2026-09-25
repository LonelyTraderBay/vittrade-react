import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { supportApi } from './support-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('support API contract', () => {
  it('loads news through the content boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/content/news', () =>
        HttpResponse.json({
          items: [
            {
              id: 'news-1',
              type: 'security',
              title: 'Security',
              summary: 'Summary',
              content: 'Content',
              publishedAt: '2026-09-22T08:00:00.000Z',
              isPinned: true,
              tags: ['security'],
            },
          ],
        }),
      ),
    );
    await expect(supportApi.listNews()).resolves.toMatchObject({
      items: [{ id: 'news-1', isPinned: true }],
    });
  });

  it('marks a notification read with an idempotency key', async () => {
    server.use(
      http.post('http://localhost:3000/api/notifications/n-1/read', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('notification-1');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(supportApi.markNotificationRead('n-1', 'notification-1')).resolves.toBeUndefined();
  });

  it('validates help-center categories and articles', async () => {
    server.use(
      http.get('http://localhost:3000/api/support/help', () =>
        HttpResponse.json({
          categories: [{ id: 'trading', name: 'Trading', icon: 'T', count: 1 }],
          articles: [
            {
              id: 'h-1',
              category: 'trading',
              categoryIcon: 'T',
              title: 'Limit',
              summary: 'How',
              views: 10,
            },
          ],
        }),
      ),
    );
    await expect(supportApi.listHelp()).resolves.toMatchObject({
      categories: [{ id: 'trading' }],
      articles: [{ id: 'h-1' }],
    });
  });

  it('loads tickets and creates a ticket idempotently', async () => {
    const ticket = {
      id: 'ticket-1',
      subject: 'Help',
      category: 'other',
      status: 'open',
      priority: 'medium',
      description: 'Need help',
      createdAt: '2026-09-22T08:00:00.000Z',
      updatedAt: '2026-09-22T08:00:00.000Z',
      messages: [],
    };
    server.use(
      http.get('http://localhost:3000/api/support/tickets', () =>
        HttpResponse.json({ items: [ticket] }),
      ),
      http.post('http://localhost:3000/api/support/tickets', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('ticket-1');
        expect(await request.json()).toMatchObject({ subject: 'Help' });
        return HttpResponse.json(ticket, { status: 201 });
      }),
    );
    await expect(supportApi.listTickets()).resolves.toMatchObject({ items: [{ id: 'ticket-1' }] });
    await expect(
      supportApi.createTicket(
        { subject: 'Help', category: 'other', description: 'Need help' },
        'ticket-1',
      ),
    ).resolves.toMatchObject({ id: 'ticket-1' });
  });
});
