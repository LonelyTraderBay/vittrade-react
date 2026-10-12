import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '@/test/test-utils';
import { ChartSkeleton } from './ChartSkeleton';

describe('ChartSkeleton', () => {
  it('renders volume bars and both candle directions', () => {
    let randomCall = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      const position = randomCall++ % 4;
      return position === 0 || position === 3 ? 0.75 : 0.5;
    });

    try {
      const { container } = renderWithTheme(<ChartSkeleton />);
      const bars = Array.from(container.querySelectorAll('div[class*="max-w-"]'));
      const colors = new Set(bars.map((bar) => (bar as HTMLDivElement).style.backgroundColor));

      expect(container.querySelector('.absolute.bottom-0')).toBeInTheDocument();
      expect(colors).toEqual(new Set(['rgb(16, 185, 129)', 'rgb(239, 68, 68)']));
    } finally {
      random.mockRestore();
    }
  });

  it('omits volume bars when the chart does not show volume', () => {
    const { container } = renderWithTheme(<ChartSkeleton height={180} showVolume={false} />);

    expect(screen.getByText('Loading...')).toBeVisible();
    expect(container.querySelector('.absolute.bottom-0')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ height: '180px' });
  });

  it('does not append a duplicate animation style after module re-evaluation', async () => {
    expect(document.querySelectorAll('#chart-skeleton-styles')).toHaveLength(1);
    vi.resetModules();

    await import('./ChartSkeleton');

    expect(document.querySelectorAll('#chart-skeleton-styles')).toHaveLength(1);
  });
});
