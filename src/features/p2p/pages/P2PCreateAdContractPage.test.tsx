import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { p2pApi } from '../api/p2p-api';
import { P2PCreateAdContractPage } from './P2PCreateAdContractPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const createdAd = {
  id: 'ad-created',
  type: 'sell' as const,
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 20,
  totalVolume30d: 100_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed' as const,
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Vietcombank'],
  avgResponseTime: '1m',
  isOnline: true,
  createdAt: '2026-09-22',
  status: 'active' as const,
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('spinbutton', { name: 'Giá (VND/USDT)' }), '25000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tổng USDT' }), '1000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tối thiểu (VND)' }), '100000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tối đa (VND)' }), '10000000');
  await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
}

describe('P2P create ad contract page', () => {
  it('validates the form and creates an ad with an idempotency key', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/p2p/ads', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-/);
        requestBody = await request.json();
        return HttpResponse.json(createdAd, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));

    await vi.waitFor(() => {
      expect(requestBody).toMatchObject({
        type: 'sell',
        asset: 'USDT',
        currency: 'VND',
        priceType: 'fixed',
        price: 25_000,
        available: 1_000,
        minLimit: 100_000,
        maxLimit: 10_000_000,
        paymentMethods: ['Vietcombank'],
      });
    });
  });

  it('blocks invalid submission and displays API errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Nhập giá quảng cáo hợp lệ.');

    await fillValidForm(user);
    server.use(http.post('*/p2p/ads', () => HttpResponse.error()));
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));

    expect(
      await screen.findByText('Không thể đăng quảng cáo. Vui lòng thử lại.'),
    ).toBeInTheDocument();
  });

  it('keeps form submission behind the P2P write permission', async () => {
    const noP2PPermissionSession = {
      ...testAuthSession,
      user: {
        ...testAuthSession.user,
        permissions: testAuthSession.user.permissions.filter(
          (permission) => !permission.startsWith('p2p:'),
        ),
      },
    };
    const authAdapter = { ...testAuthAdapter, initialSession: noP2PPermissionSession };
    const createAd = vi.spyOn(p2pApi, 'createAd');
    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />, { authAdapter });

    expect(
      screen.getByText('P2P ad write permission is required to create an advertisement.'),
    ).toHaveAttribute('role', 'alert');
    await fillValidForm(user);

    const submitButton = screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' });
    expect(submitButton).toBeDisabled();
    fireEvent.submit(submitButton.closest('form')!);

    expect(createAd).not.toHaveBeenCalled();
  });

  it('validates floating margins and rejects non-finite input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);

    await user.click(screen.getByRole('button', { name: 'Giá thả nổi' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Giá (VND/USDT)' }), '25000');

    const marginInput = screen.getByRole('spinbutton', { name: 'Biên độ giá (%)' });
    let runtimeValue = '1e309';
    Object.defineProperty(marginInput, 'value', {
      configurable: true,
      get: () => runtimeValue,
      set: (value: string) => {
        runtimeValue = value;
      },
    });
    fireEvent.change(marginInput);

    expect(screen.getByRole('alert')).toHaveTextContent('Biên độ giá không hợp lệ.');
  });

  it('locks confirmation dismissal while pending and retains the form after a transport error', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let attempts = 0;
    server.use(
      http.post('*/p2p/ads', async () => {
        attempts++;
        await gate;
        return HttpResponse.error();
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    await fillValidForm(user);
    const trigger = screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));
    try {
      await vi.waitFor(() => expect(attempts).toBe(1));
      expect(screen.getByRole('button', { name: 'Huỷ' })).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    } finally {
      release();
    }
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể đăng quảng cáo.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Giá (VND/USDT)' })).toHaveValue(25000);
    expect(screen.getByRole('spinbutton', { name: 'Tổng USDT' })).toHaveValue(1000);
    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });

  it('supports floating ads, caps payment methods, and closes confirmation', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/p2p/ads', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(createdAd, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    await user.click(screen.getByRole('button', { name: 'Giá thả nổi' }));
    await fillValidForm(user);
    await user.type(screen.getByRole('spinbutton', { name: 'Biên độ giá (%)' }), '2.5');

    await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
    expect(screen.getByRole('button', { name: 'Vietcombank' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    for (const method of ['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'MB Bank']) {
      await user.click(screen.getByRole('button', { name: method }));
    }
    await user.click(screen.getByRole('button', { name: 'ACB' }));
    expect(screen.getByRole('button', { name: 'ACB' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    const dialog = screen.getByRole('dialog', { name: 'Xác nhận đăng quảng cáo' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' });
    await vi.waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));

    await vi.waitFor(() => {
      expect(requestBody).toMatchObject({
        priceType: 'floating',
        priceMargin: 2.5,
        paymentMethods: ['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'MB Bank'],
      });
    });
  });
});
