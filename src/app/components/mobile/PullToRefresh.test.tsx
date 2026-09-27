import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { PullToRefreshIndicator } from './PullToRefresh';

describe('PullToRefreshIndicator', () => {
  it('stays hidden when no pull is active', () => {
    const { container } = renderWithProviders(
      <PullToRefreshIndicator pullDistance={0} isRefreshing={false} progress={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows pull progress, the release hint at threshold, and the refreshing state', () => {
    const { container, rerender } = renderWithProviders(
      <PullToRefreshIndicator pullDistance={60} isRefreshing={false} progress={0.6} />,
    );
    const indicator = container.querySelector('.overflow-hidden');

    expect(indicator).toHaveStyle({ height: '60px' });
    expect(screen.queryByText('Thả để làm mới')).not.toBeInTheDocument();

    rerender(<PullToRefreshIndicator pullDistance={100} isRefreshing={false} progress={1} />);
    expect(screen.getByText('Thả để làm mới')).toBeVisible();

    rerender(<PullToRefreshIndicator pullDistance={60} isRefreshing progress={1} />);
    expect(screen.queryByText('Thả để làm mới')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveStyle({ animation: 'spin 0.8s linear infinite' });
  });
});
