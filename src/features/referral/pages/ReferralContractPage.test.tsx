import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ReferralContractPage } from './ReferralContractPage';

const server = setupServer();
let clipboardDescriptor: PropertyDescriptor | undefined;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
});
afterEach(() => {
  server.resetHandlers();
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
});
afterAll(() => server.close());

function overview() {
  return {
    referralCode: 'INVITE-42',
    stats: {
      totalFriends: 3,
      activeFriends: 2,
      kycCompleted: 2,
      totalCommission: 123.45,
      pendingCommission: 10,
      totalVolume: 12_000,
      thisMonthCommission: 20,
      thisMonthFriends: 1,
    },
    currentTier: {
      name: 'Pro',
      nameEn: 'Pro',
      friends: 3,
      commission: 10,
      color: '#10B981',
      icon: '★',
      kycBonus: 5,
    },
    friends: [
      {
        id: 'friend-1',
        name: 'Nguyễn An',
        avatar: 'A',
        joinedDate: '2026-09-01',
        status: 'active_trader' as const,
        totalVolume: 5_000,
        totalCommission: 12.5,
        isActive: true,
      },
    ],
    campaign: {
      id: 'campaign-1',
      title: 'Invite and earn',
      description: 'Earn rewards with friends.',
      bonusLabel: 'September campaign',
      daysLeft: 7,
      totalParticipants: 250,
    },
  };
}

describe('ReferralContractPage', () => {
  it('shows loading, referral metrics, campaign and a copyable invite link', async () => {
    server.use(
      http.get('*/referral/overview', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json(overview());
      }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderWithProviders(<ReferralContractPage />);

    expect(screen.getByText('Đang tải dữ liệu Referral API…')).toBeVisible();
    expect(await screen.findByText('Invite and earn')).toBeVisible();
    expect(screen.getByRole('heading', { name: /Pro/ })).toBeVisible();
    expect(screen.getByText('https://vittrade.app/ref/INVITE-42')).toBeVisible();
    expect(screen.getByText('Nguyễn An')).toBeVisible();
    expect(screen.getByText('$123.45')).toBeVisible();
    expect(screen.getByText('7 days left · 250 participants')).toBeVisible();

    const inviteLink = screen.getByText('https://vittrade.app/ref/INVITE-42');
    const linkContainer = inviteLink.parentElement;
    expect(linkContainer).not.toBeNull();
    await user.click(within(linkContainer as HTMLElement).getByRole('button'));
    expect(writeText).toHaveBeenCalledWith('https://vittrade.app/ref/INVITE-42');
  });

  it('keeps the referral retry action available after the API fails', async () => {
    let shouldFail = true;
    server.use(
      http.get('*/referral/overview', () => {
        return shouldFail ? HttpResponse.error() : HttpResponse.json(overview());
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReferralContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Invite and earn')).toBeVisible();
  });

  it('shows an explicit no-referrals state while retaining overview content', async () => {
    server.use(
      http.get('*/referral/overview', () =>
        HttpResponse.json({
          ...overview(),
          stats: {
            totalFriends: 0,
            activeFriends: 0,
            kycCompleted: 0,
            totalCommission: 0,
            pendingCommission: 0,
            totalVolume: 0,
            thisMonthCommission: 0,
            thisMonthFriends: 0,
          },
          friends: [],
        }),
      ),
    );
    renderWithProviders(<ReferralContractPage />);

    expect(
      await screen.findByText('Chưa có người được giới thiệu. Hãy chia sẻ mã để bắt đầu.'),
    ).toBeVisible();
    expect(screen.getByText('Invite and earn')).toBeVisible();
    expect(screen.getByText('$0.00')).toBeVisible();
    expect(screen.queryByText('Nguyễn An')).not.toBeInTheDocument();
  });

  it('shows a permission state instead of retrying a forbidden overview', async () => {
    server.use(
      http.get('*/referral/overview', () =>
        HttpResponse.json({ code: 'REFERRAL_FORBIDDEN' }, { status: 403 }),
      ),
    );
    renderWithProviders(<ReferralContractPage />);

    const permissionAlert = await screen.findByRole('alert');
    expect(permissionAlert).toHaveTextContent('Không có quyền truy cập Referral');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });
});
