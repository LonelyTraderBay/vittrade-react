import type { ComponentType } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/test-utils';
import { P2P_FRONTEND_VIEW_IDS } from '../model/frontend-view-types';
import {
  P2PInsuranceFundPage,
  P2PContributionHistoryPage,
  P2PKYCRequirementsPage,
  P2PKYCStatusPage,
  P2PSecurityCenterPage,
  P2PTransactionLimitsPage,
  P2PWalletPage,
} from './P2PFrontendStatusPages';

const mockViewStates = P2P_FRONTEND_VIEW_IDS.map((view) => ({
  view,
  state: 'backend-required' as const,
}));
const server = setupServer(
  http.get('*/p2p/frontend-view-status', ({ request }) => {
    const view = new URL(request.url).searchParams.get('view');
    const state = mockViewStates.find((item) => item.view === view);
    return state ? HttpResponse.json(state) : HttpResponse.json({}, { status: 400 });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const cases: Array<[ComponentType, string, string]> = [
  [P2PInsuranceFundPage, 'Quỹ bảo hiểm P2P', 'Số dư quỹ'],
  [P2PContributionHistoryPage, 'Lịch sử đóng góp', 'Chưa có nguồn dữ liệu'],
  [P2PKYCRequirementsPage, 'Yêu cầu xác minh P2P', 'Danh sách giấy tờ'],
  [P2PKYCStatusPage, 'Trạng thái xác minh P2P', 'chưa được xác nhận'],
  [P2PSecurityCenterPage, 'Trung tâm bảo mật P2P', 'Trạng thái thiết bị'],
  [P2PTransactionLimitsPage, 'Hạn mức giao dịch P2P', 'Không hiển thị hạn mức ước đoán'],
  [P2PWalletPage, 'Ví P2P', 'Số dư, tài sản ký quỹ'],
];

describe('P2P frontend status pages', () => {
  it.each(cases)(
    'shows %s as unavailable without account data or actions',
    async (Page, title, detail) => {
      renderWithProviders(<Page />);
      expect(await screen.findByText(title, { exact: true })).toBeInTheDocument();
      expect(
        await screen.findByRole('status', { name: 'Backend integration required' }),
      ).toHaveTextContent(detail);
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    },
  );

  it('shows a retry boundary when the P2P status contract is unavailable', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get('*/p2p/frontend-view-status', ({ request }) => {
        requests += 1;
        const view = new URL(request.url).searchParams.get('view');
        if (requests === 1) return HttpResponse.json({ view, state: 'unknown' });
        return HttpResponse.json(mockViewStates.find((item) => item.view === view));
      }),
    );
    renderWithProviders(<P2PWalletPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(
      await screen.findByRole('status', { name: 'Backend integration required' }),
    ).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
