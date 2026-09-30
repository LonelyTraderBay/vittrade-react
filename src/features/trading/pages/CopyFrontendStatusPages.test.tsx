import type { ComponentType } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/test-utils';
import { COPY_FRONTEND_VIEW_IDS } from '../model/copy-frontend-view-types';
import {
  CopySafetyCenterPage,
  PerformanceAttributionPage,
  ProviderApplicationPage,
  ProviderGovernancePage,
} from './CopyFrontendStatusPages';

const mockViewStates = COPY_FRONTEND_VIEW_IDS.map((view) => ({
  view,
  state: 'backend-required' as const,
}));
const server = setupServer(
  http.get('*/trading/copy/frontend-view-status', ({ request }) => {
    const view = new URL(request.url).searchParams.get('view');
    const state = mockViewStates.find((item) => item.view === view);
    return state ? HttpResponse.json(state) : HttpResponse.json({}, { status: 400 });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const cases: Array<[ComponentType, string, string]> = [
  [CopySafetyCenterPage, 'Trung tâm an toàn Copy Trading', 'backend xác nhận'],
  [
    ProviderApplicationPage,
    'Đăng ký nhà cung cấp chiến lược',
    'không thu thập hoặc gửi dữ liệu cá nhân',
  ],
  [ProviderGovernancePage, 'Quản trị nhà cung cấp', 'Quyền, trạng thái duyệt'],
  [PerformanceAttributionPage, 'Phân tích hiệu suất sao chép', 'Chưa có dữ liệu lệnh'],
];

describe('Copy Trading frontend status pages', () => {
  it.each(cases)(
    'keeps %s read-only until its backend contract is available',
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

  it('shows a retry boundary when the Copy Trading status contract is unavailable', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get('*/trading/copy/frontend-view-status', ({ request }) => {
        requests += 1;
        const view = new URL(request.url).searchParams.get('view');
        if (requests === 1) return HttpResponse.json({ view, state: 'unknown' });
        return HttpResponse.json(mockViewStates.find((item) => item.view === view));
      }),
    );
    renderWithProviders(<ProviderGovernancePage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(
      await screen.findByRole('status', { name: 'Backend integration required' }),
    ).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
