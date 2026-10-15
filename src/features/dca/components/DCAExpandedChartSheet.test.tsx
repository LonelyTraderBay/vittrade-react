import { describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/react';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { testDcaApi } from '@/test/dca-test-adapter';
import { DCAExpandedChartSheet } from './DCAExpandedChartSheet';

describe('DCA expanded chart performance', () => {
  it('shows a loss in the selected period even when overall performance is positive', async () => {
    const snapshot = testDcaApi.getInitialSnapshot();
    const changeTimeframe = vi.fn();
    renderWithProviders(
      <DCAExpandedChartSheet
        isOpen
        onClose={vi.fn()}
        overview={{ ...snapshot.overview, profitLoss: 100, profitLossPercent: 10 }}
        chartTimeframe="7d"
        setChartTimeframe={changeTimeframe}
        timeframeOptions={[
          { key: '7d', label: '7 ngày' },
          { key: 'all', label: 'Tất cả' },
        ]}
        timeframeSubtitle="7 ngày qua"
        timeframePnL={{
          isProfit: false,
          percentChange: -2.5,
          valueChange: -25_000,
          investedChange: 10_000,
        }}
        portfolioHistory={[]}
        filteredChartData={[]}
      />,
    );
    const dialog = within(await screen.findByRole('dialog', { name: 'Biểu đồ danh mục' }));
    expect(dialog.getByText('+10,0%')).toBeInTheDocument();
    expect(dialog.getByText('-2,50%')).toBeInTheDocument();
    expect(dialog.getByText('-25.000 VND')).toBeInTheDocument();
    expect(dialog.getByText('+10.000 VND')).toBeInTheDocument();
    await userEvent.setup().click(dialog.getByRole('button', { name: 'Tất cả' }));
    expect(changeTimeframe).toHaveBeenCalledWith('all');
  });
});
