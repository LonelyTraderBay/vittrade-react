import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { ActivityLogContractPage } from '@/features/profile/pages/ActivityLogContractPage';
import { EditProfileContractPage } from '@/features/profile/pages/EditProfileContractPage';
import { ProfileContractPage } from '@/features/profile/pages/ProfileContractPage';
import { SubAccountContractPage } from '@/features/profile/pages/SubAccountContractPage';
import { HelpCenterContractPage } from '@/features/support/pages/HelpCenterContractPage';
import { NotificationsContractPage } from '@/features/support/pages/NotificationsContractPage';
import { SupportContractPage } from '@/features/support/pages/SupportContractPage';
import { P2PAdAnalyticsPage } from '@/features/p2p/pages/P2PAdAnalyticsPage';
import { P2PDashboardPage } from '@/features/p2p/pages/P2PDashboardPage';
import { P2PReportMerchantPage } from '@/features/p2p/pages/P2PReportMerchantPage';
import { P2PTradingLevelPage } from '@/features/p2p/pages/P2PTradingLevelPage';
import { ActiveCopiesContractPage } from '@/features/trading/pages/ActiveCopiesContractPage';
import { ProviderComparisonContractPage } from '@/features/trading/pages/ProviderComparisonContractPage';
import { WebCopyPerformancePage } from '@/features/trading/pages/WebCopyPerformancePage';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/features/profile/model/profile-queries', () => ({
  useActivityQuery: query,
  useProfileQuery: query,
  useSubAccountsQuery: query,
  useUpdateProfileMutation: () => ({}),
}));
vi.mock('@/features/support/model/support-queries', () => ({
  useUnreadNotificationsCount: () => 0,
  useHelpQuery: query,
  useNotificationsQuery: query,
  useSupportTicketsQuery: query,
  useCreateSupportTicketMutation: () => ({}),
  useMarkNotificationReadMutation: () => ({}),
}));

vi.mock('@/features/p2p/model/p2p-ad-queries', () => ({
  useP2PAdAnalyticsQuery: query,
  useP2PAdQuery: query,
}));
vi.mock('@/features/p2p/model/p2p-overview-queries', () => ({
  useP2PDashboardQuery: query,
  useP2POverviewQuery: query,
}));
vi.mock('@/features/p2p/model/p2p-trust-queries', () => ({
  useP2PMerchantProfileQuery: query,
  useP2PMerchantReportMutation: () => ({}),
}));
vi.mock('@/features/trading/model/trading-queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/trading/model/trading-queries')>()),
  useCopyRelationshipsQuery: query,
  useCopyProvidersQuery: query,
  useStopCopyRelationshipMutation: () => ({}),
}));

const pages: Array<{
  name: string;
  Page: ComponentType;
  errorTitle?: string;
  retryQueries?: number;
}> = [
  { name: 'activity', Page: ActivityLogContractPage },
  { name: 'edit profile', Page: EditProfileContractPage },
  { name: 'profile', Page: ProfileContractPage },
  { name: 'sub-accounts', Page: SubAccountContractPage },
  { name: 'help center', Page: HelpCenterContractPage },
  { name: 'notifications', Page: NotificationsContractPage },
  { name: 'support tickets', Page: SupportContractPage },
  {
    name: 'P2P ad analytics',
    Page: P2PAdAnalyticsPage,
    errorTitle: 'Không thể tải phân tích quảng cáo',
    retryQueries: 2,
  },
  {
    name: 'P2P dashboard',
    Page: P2PDashboardPage,
    errorTitle: 'Không thể tải dữ liệu P2P dashboard',
  },
  {
    name: 'P2P merchant report',
    Page: P2PReportMerchantPage,
    errorTitle: 'Không thể tải thông tin merchant',
  },
  {
    name: 'P2P trading level',
    Page: P2PTradingLevelPage,
    errorTitle: 'Không thể tải cấp độ giao dịch P2P',
  },
  { name: 'active copies', Page: ActiveCopiesContractPage },
  { name: 'provider comparison', Page: ProviderComparisonContractPage },
  { name: 'copy performance', Page: WebCopyPerformancePage },
];

const readSession = {
  ...testAuthSession,
  user: {
    ...testAuthSession.user,
    permissions: [...testAuthSession.user.permissions, 'trade:read', 'notifications:read'],
  },
};
const readAdapter = {
  ...testAuthAdapter,
  initialSession: readSession,
  getSession: async () => readSession,
};

describe.each([true, false])('read recovery with isError=%s and absent data', (isError) => {
  it.each(pages)(
    'allows the user to retry $name without exposing the original response',
    ({ Page, errorTitle, retryQueries }) => {
      const refetch = vi.fn();
      query.mockReturnValue({
        isPending: false,
        isError,
        data: undefined,
        error: new Error('private-response'),
        refetch,
      });
      renderWithProviders(
        <Routes>
          <Route path="/w/test/:id/:merchantId/:copyId" element={<Page />} />
        </Routes>,
        {
          routerProps: { initialEntries: ['/w/test/ad-1/merchant-1/copy-1'] },
          authAdapter: readAdapter,
        },
      );
      expect(screen.getByText(errorTitle ?? 'Có lỗi xảy ra')).toBeInTheDocument();
      expect(screen.queryByText('private-response')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
      expect(refetch).toHaveBeenCalledTimes(retryQueries ?? 1);
    },
  );
});

describe('support read results', () => {
  it('returns from an empty provider comparison to the current web trading shell', () => {
    query.mockReturnValue({ isPending: false, isError: false, data: { items: [] } });
    renderWithProviders(
      <Routes>
        <Route path="/w/compare" element={<ProviderComparisonContractPage />} />
        <Route path="/w/trade/copy-trading" element={<p>Copy trading destination</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/w/compare'] }, authAdapter: readAdapter },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại Copy Trading' }));
    expect(screen.getByText('Copy trading destination')).toBeInTheDocument();
  });
  it('offers recovery when the requested copy relationship is absent from the confirmed list', () => {
    const refetch = vi.fn();
    query.mockReturnValue({ isPending: false, isError: false, data: { items: [] }, refetch });
    renderWithProviders(
      <Routes>
        <Route path="/w/copy/:copyId" element={<WebCopyPerformancePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/w/copy/missing-copy'] }, authAdapter: readAdapter },
    );
    expect(screen.getByText('Có lỗi xảy ra')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it('toggles a help category without losing articles from the other categories', () => {
    query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        categories: [
          { id: 'account', name: 'Account', icon: 'A', count: 1 },
          { id: 'wallet', name: 'Wallet', icon: 'W', count: 1 },
        ],
        articles: [
          {
            id: 'account-1',
            category: 'account',
            categoryIcon: 'A',
            title: 'Account help',
            summary: 'Account steps',
            views: 10,
          },
          {
            id: 'wallet-1',
            category: 'wallet',
            categoryIcon: 'W',
            title: 'Wallet help',
            summary: 'Wallet steps',
            views: 20,
          },
        ],
      },
    });
    renderWithProviders(<HelpCenterContractPage />, { authAdapter: readAdapter });
    fireEvent.click(screen.getByRole('button', { name: 'A Account' }));
    expect(screen.getByText('Account help')).toBeInTheDocument();
    expect(screen.queryByText('Wallet help')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'A Account' }));
    expect(screen.getByText('Wallet help')).toBeInTheDocument();
  });

  it('renders the server-owned status, description and update time of a support ticket', () => {
    query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: 'ticket-1',
            subject: 'Account help',
            category: 'other',
            status: 'in_progress',
            priority: 'normal',
            description: 'Check account access',
            createdAt: '2026-10-12T00:00:00.000Z',
            updatedAt: '2026-10-13T00:00:00.000Z',
            messages: [],
          },
        ],
      },
    });
    renderWithProviders(<SupportContractPage />, { authAdapter: readAdapter });
    expect(screen.getByRole('heading', { name: 'Account help' })).toBeInTheDocument();
    expect(screen.getByText('in_progress')).toBeInTheDocument();
    expect(screen.getByText('Check account access')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật 2026-10-13T00:00:00.000Z')).toBeInTheDocument();
  });
});
