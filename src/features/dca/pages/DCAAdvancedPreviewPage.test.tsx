import { renderWithProviders, screen } from '@/test/test-utils';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';
import { DCA_ADVANCED_VIEW_IDS } from '../model/dca-advanced-types';
import { DCAAdvancedPreviewPage } from './DCAAdvancedPreviewPage';

const mockOverview = {
  views: DCA_ADVANCED_VIEW_IDS.map((id) => ({ id, state: 'backend-required' as const })),
};
const server = setupServer(
  http.get('*/dca/advanced/overview', () => HttpResponse.json(mockOverview)),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const cases: Array<[string, string]> = [
  ['/dca/backtester', 'Kiểm thử chiến lược DCA'],
  ['/dca/dynamic-amount', 'Số tiền DCA linh hoạt'],
  ['/dca/multi-asset', 'DCA nhiều tài sản'],
  ['/dca/performance-compare', 'So sánh hiệu suất DCA'],
  ['/dca/portfolio-optimizer', 'Tối ưu danh mục DCA'],
  ['/dca/rebalance/config', 'Cấu hình cân bằng lại'],
  ['/dca/rebalance/dev-1', 'Theo dõi cân bằng danh mục'],
  ['/dca/schedule/dev-1', 'Phân tích lịch DCA'],
  ['/dca/schedule/config', 'Cấu hình lịch DCA'],
  ['/dca/smart-rules', 'Quy tắc DCA thông minh'],
  ['/unmatched', 'Kiểm thử chiến lược DCA'],
];

describe('DCA advanced preview page', () => {
  it.each(cases)(
    'loads %s through the mock contract without enabling financial actions',
    async (path, title) => {
      renderWithProviders(<DCAAdvancedPreviewPage />, { routerProps: { initialEntries: [path] } });

      expect(await screen.findByText(title, { exact: true })).toBeInTheDocument();
      expect(
        await screen.findByRole('status', { name: 'Backend integration required' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /execute|rebalance|buy|mua/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/MSW chỉ xác nhận trạng thái giao diện/)).toBeInTheDocument();
    },
  );

  it('fails closed when the contract omits a view by repeating another view', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get('*/dca/advanced/overview', () => {
        requests += 1;
        return HttpResponse.json(
          requests === 1
            ? { views: [...mockOverview.views.slice(1), mockOverview.views[1]] }
            : mockOverview,
        );
      }),
    );
    renderWithProviders(<DCAAdvancedPreviewPage />, {
      routerProps: { initialEntries: ['/dca/backtester'] },
    });

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(
      await screen.findByRole('status', { name: 'Backend integration required' }),
    ).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
