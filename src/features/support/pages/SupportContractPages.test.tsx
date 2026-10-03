import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { HelpCenterContractPage } from './HelpCenterContractPage';
import { NotificationsContractPage } from './NotificationsContractPage';
import { SupportContractPage } from './SupportContractPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer(http.get('*/notifications', () => HttpResponse.json({ items: [] })));

const ticket = {
  id: 'ticket-1',
  subject: 'Cannot access account',
  category: 'other',
  status: 'open' as const,
  priority: 'normal',
  description: 'Login returns an error',
  createdAt: '2026-09-24T00:00:00.000Z',
  updatedAt: '2026-09-24T00:00:00.000Z',
  messages: [],
};

const notification = {
  id: 'notification-1',
  type: 'system' as const,
  title: 'System update',
  message: 'A new update is available.',
  time: '2026-09-24T00:00:00.000Z',
  isRead: false,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function supportWriteAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['support:write', 'notifications:read', 'notifications:write'],
      },
    },
  };
}

describe('SupportContractPage', () => {
  it('submits trimmed ticket content with an idempotency key and confirms success', async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post('*/support/tickets', async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(ticket, { status: 201 });
      }),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tiêu đề ticket'), '  Cannot access account  ');
    await user.type(screen.getByLabelText('Nội dung ticket'), '  Login returns an error  ');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', { duration: 1500 }),
    );
    expect(requestBody).toEqual({
      subject: 'Cannot access account',
      description: 'Login returns an error',
      category: 'other',
    });
    expect(idempotencyKey).toMatch(/^support-ticket-/);
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('');
  });

  it('locks the ticket form and prevents a second submission while the request is in flight', async () => {
    let attempts = 0;
    let resolveCreate!: (response: Response) => void;
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post(
        '*/support/tickets',
        () =>
          new Promise<Response>((resolve) => {
            attempts += 1;
            resolveCreate = resolve;
          }),
      ),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    const subjectField = await screen.findByLabelText('Tiêu đề ticket');
    const descriptionField = screen.getByLabelText('Nội dung ticket');
    await user.type(subjectField, 'Login issue');
    await user.type(descriptionField, 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    const pendingButton = await screen.findByRole('button', { name: 'Đang gửi…' });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(subjectField).toBeDisabled();
    expect(descriptionField).toBeDisabled();
    expect(attempts).toBe(1);

    resolveCreate(HttpResponse.json(ticket, { status: 201 }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', { duration: 1500 }),
    );
    expect(attempts).toBe(1);
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('');
  });

  it('reports ticket creation failures and retains the entered content', async () => {
    let attempts = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post('*/support/tickets', ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Ticket service unavailable' }, { status: 503 })
          : HttpResponse.json(ticket, { status: 201 });
      }),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tiêu đề ticket'), 'Login issue');
    await user.type(screen.getByLabelText('Nội dung ticket'), 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Ticket service unavailable', { duration: 2000 }),
    );
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('Login issue');
    expect(screen.getByLabelText('Nội dung ticket')).toHaveValue('Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', {
        duration: 1500,
      }),
    );
    expect(attempts).toBe(2);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('shows an empty ticket state', async () => {
    server.use(http.get('*/support/tickets', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('status')).toHaveTextContent('Bạn chưa có yêu cầu hỗ trợ nào.');
  });

  it('shows a ticket read failure instead of treating it as an empty list', async () => {
    server.use(http.get('*/support/tickets', () => HttpResponse.error()));
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(screen.queryByText('Bạn chưa có yêu cầu hỗ trợ nào.')).not.toBeInTheDocument();
  });
});

describe('NotificationsContractPage', () => {
  it('marks a notification as read with an idempotency key and confirms success', async () => {
    let idempotencyKey: string | null = null;
    let isRead = false;
    server.use(
      http.get('*/notifications', () =>
        HttpResponse.json({ items: [{ ...notification, isRead }] }),
      ),
      http.post('*/notifications/notification-1/read', ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key');
        isRead = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Đã đọc' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu thông báo là đã đọc.', {
        duration: 1500,
      }),
    );
    expect(idempotencyKey).toMatch(/^notification-read-notification-1-/);
    expect(await screen.findByText('0 chưa đọc')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Đã đọc' })).not.toBeInTheDocument();
  });

  it('reports notification acknowledgement failures and keeps the action available', async () => {
    let attempts = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.get('*/notifications', () => HttpResponse.json({ items: [notification] })),
      http.post('*/notifications/notification-1/read', ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Notification service unavailable' }, { status: 503 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Đã đọc' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Notification service unavailable', {
        duration: 2000,
      }),
    );
    expect(screen.getByRole('button', { name: 'Đã đọc' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Đã đọc' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu thông báo là đã đọc.', {
        duration: 1500,
      }),
    );
    expect(attempts).toBe(2);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('shows an empty notification state', async () => {
    server.use(http.get('*/notifications', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('status')).toHaveTextContent('Bạn chưa có thông báo nào.');
  });
});

describe('HelpCenterContractPage', () => {
  it('explains when a search returns no help articles', async () => {
    server.use(
      http.get('*/support/help', () =>
        HttpResponse.json({
          categories: [{ id: 'account', name: 'Tài khoản', icon: '👤', count: 1 }],
          articles: [
            {
              id: 'article-1',
              category: 'account',
              categoryIcon: '👤',
              title: 'Bảo vệ tài khoản',
              summary: 'Cách bảo vệ tài khoản của bạn.',
              views: 20,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<HelpCenterContractPage />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tìm kiếm trợ giúp'), 'không tồn tại');

    expect(await screen.findByRole('status')).toHaveTextContent('Không tìm thấy bài viết phù hợp.');
  });
});
