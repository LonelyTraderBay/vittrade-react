import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkeletonCard, SkeletonList, SkeletonPageList, SkeletonRow } from './SkeletonBlock';

describe('SkeletonBlock loading layouts', () => {
  it('renders regular and fast shimmer rows with their standard shape', () => {
    const { container } = render(
      <>
        <SkeletonRow />
        <SkeletonRow fast />
      </>,
    );

    const rows = container.querySelectorAll('.flex.items-center.gap-3.px-5.py-3');
    expect(rows).toHaveLength(2);
    expect(rows[0].firstElementChild).toHaveStyle({
      animation: 'stateShimmer 1.8s ease-in-out infinite',
    });
    expect(rows[1].firstElementChild).toHaveStyle({
      animation: 'stateShimmerFast 0.9s ease-in-out infinite',
    });
    expect(rows[0].firstElementChild).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('renders the reusable card skeleton with its expected content blocks', () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelector('.rounded-2xl.p-4')).toBeInTheDocument();
    expect(container.querySelectorAll('[style*="background-size: 800px"]')).toHaveLength(9);
  });

  it('renders the requested list count and fast shimmer during refresh', () => {
    const { container } = render(<SkeletonList rows={3} isRefreshing />);

    const rows = container.querySelectorAll('.flex.items-center.gap-3.px-5.py-3');
    expect(rows).toHaveLength(3);
    expect(rows[0].firstElementChild).toHaveStyle({
      animation: 'stateShimmerFast 0.9s ease-in-out infinite',
    });

    const defaultList = render(<SkeletonList />);
    expect(
      defaultList.container.querySelectorAll('.flex.items-center.gap-3.px-5.py-3'),
    ).toHaveLength(6);
  });

  it('shows an optional page title and supports an empty list body', () => {
    const { container, rerender } = render(<SkeletonPageList title="Wallet" />);

    expect(container.querySelectorAll('.flex.items-center.gap-3.px-5.py-3')).toHaveLength(6);
    expect(container.querySelector('.px-5.pt-4.pb-2')).toBeInTheDocument();

    rerender(<SkeletonPageList rows={0} />);
    expect(container.querySelectorAll('.flex.items-center.gap-3.px-5.py-3')).toHaveLength(0);
    expect(container.querySelector('.px-5.pt-4.pb-2')).not.toBeInTheDocument();
    expect(container.querySelector('.h-12.rounded-2xl')).toBeInTheDocument();
  });
});
