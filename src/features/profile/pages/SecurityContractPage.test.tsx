import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { SecurityContractPage } from './SecurityContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function profile(has2FA: boolean) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    phone: '+84 900',
    fullName: 'Nguyễn Văn A',
    username: 'vana',
    avatar: null,
    kycLevel: 1,
    kycStatus: 'verified',
    referralCode: 'VITTA',
    vipLevel: 0,
    joinDate: '2026-01-01',
    has2FA,
    totalBalance: 1_000,
  };
}

function renderSecurityPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/w/profile/security" element={<SecurityContractPage />} />
      <Route path="/w/auth/2fa-setup" element={<p>Two-factor setup destination</p>} />
      <Route path="/w/profile/devices" element={<p>Device management destination</p>} />
    </Routes>,
    { routerProps: { initialEntries: ['/w/profile/security'] } },
  );
}

describe('SecurityContractPage', () => {
  it('shows the pending state before rendering the server security snapshot', async () => {
    server.use(
      http.get('*/profile', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(profile(false));
      }),
    );
    const user = userEvent.setup();
    renderSecurityPage();

    expect(screen.getByText('Đang tải trạng thái bảo mật…')).toBeVisible();
    expect(await screen.findByText('Điểm bảo mật 2/4')).toBeVisible();
    expect(screen.getByText('2FA chưa bật')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Xác thực 2 lớp/ }));
    expect(await screen.findByText('Two-factor setup destination')).toBeVisible();
  });

  it('shows enabled 2FA and navigates through the current web-shell prefix', async () => {
    server.use(http.get('*/profile', () => HttpResponse.json(profile(true))));
    const user = userEvent.setup();
    renderSecurityPage();

    expect(await screen.findByText('Điểm bảo mật 3/4')).toBeVisible();
    expect(screen.getByText('2FA đang bật')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Quản lý thiết bị/ }));
    expect(await screen.findByText('Device management destination')).toBeVisible();
  });

  it('keeps the retry action available after the profile request fails', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/profile', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Profile unavailable' }, { status: 503 })
          : HttpResponse.json(profile(false));
      }),
    );
    const user = userEvent.setup();
    renderSecurityPage();

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(requestCount).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Điểm bảo mật 2/4')).toBeVisible();
    expect(requestCount).toBe(4);
  });
});
