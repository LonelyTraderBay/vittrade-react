import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { ActivityLog } from '../model/profile-types';
import { ActivityLogContractPage } from './ActivityLogContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const logs: ActivityLog[] = [
  {
    id: 'login-1',
    type: 'login',
    description: 'Đăng nhập từ thiết bị mới',
    ipAddress: '203.0.113.8',
    device: 'Chrome trên Windows',
    location: 'Hà Nội',
    status: 'success',
    timestamp: '2026-09-27T09:00:00.000Z',
  },
  {
    id: 'security-1',
    type: '2fa_enable',
    description: 'Đã bật xác thực hai lớp',
    ipAddress: '203.0.113.8',
    device: 'Chrome trên Windows',
    location: 'Hà Nội',
    status: 'success',
    timestamp: '2026-09-27T09:05:00.000Z',
  },
  {
    id: 'security-2',
    type: 'password_change',
    description: 'Đổi mật khẩu thất bại',
    ipAddress: '198.51.100.10',
    device: 'Safari trên iOS',
    location: 'Singapore',
    status: 'failed',
    timestamp: '2026-09-27T09:10:00.000Z',
  },
];

describe('ActivityLogContractPage', () => {
  it('shows an explicit empty state when the server has no account activity', async () => {
    server.use(http.get('*/profile/activity', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<ActivityLogContractPage />);

    expect(await screen.findByRole('status')).toHaveTextContent('Chưa có hoạt động tài khoản nào.');
  });

  it('distinguishes an empty filter result from an empty activity history', async () => {
    server.use(http.get('*/profile/activity', () => HttpResponse.json({ items: [logs[0]] })));
    const user = userEvent.setup();
    renderWithProviders(<ActivityLogContractPage />);

    expect(await screen.findByText('Đăng nhập từ thiết bị mới')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'security' }));

    expect(screen.getByRole('status')).toHaveTextContent('Không có hoạt động phù hợp bộ lọc.');
  });

  it('filters server-owned login and security events without dropping audit details', async () => {
    server.use(http.get('*/profile/activity', () => HttpResponse.json({ items: logs })));
    const user = userEvent.setup();
    renderWithProviders(<ActivityLogContractPage />);

    expect(await screen.findByText('Đăng nhập từ thiết bị mới')).toBeVisible();
    expect(screen.getByText('203.0.113.8 · 2026-09-27T09:00:00.000Z')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'login' }));
    expect(screen.getByText('Đăng nhập từ thiết bị mới')).toBeVisible();
    expect(screen.queryByText('Đã bật xác thực hai lớp')).not.toBeInTheDocument();
    expect(screen.queryByText('Đổi mật khẩu thất bại')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'security' }));
    expect(screen.getByText('Đã bật xác thực hai lớp')).toBeVisible();
    expect(screen.getByText('Đổi mật khẩu thất bại')).toBeVisible();
    expect(screen.getByText('failed')).toBeVisible();
    expect(screen.queryByText('Đăng nhập từ thiết bị mới')).not.toBeInTheDocument();
  });
});
