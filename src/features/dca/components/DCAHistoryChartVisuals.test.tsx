import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DCAPortfolioHistoryPoint } from '../model/dca-types';
import { CrosshairCursor, CrosshairTooltip, PurchaseDot } from './DCAHistoryChartVisuals';

const point: DCAPortfolioHistoryPoint = {
  date: new Date('2026-09-01T00:00:00.000Z'),
  portfolioValue: 1_100_000,
  totalInvested: 1_000_000,
  hasPurchase: true,
};

describe('DCAHistoryChartVisuals', () => {
  it('renders no cursor until Recharts supplies an active point', () => {
    const { container, rerender } = render(
      <svg>
        <CrosshairCursor />
      </svg>,
    );
    expect(container.querySelector('g')).not.toBeInTheDocument();

    rerender(
      <svg>
        <CrosshairCursor points={[{ x: 12, y: 24 }]} width={100} height={60} top={5} left={7} />
      </svg>,
    );

    expect(container.querySelectorAll('line')).toHaveLength(2);
    expect(container.querySelector('line')).toHaveAttribute('x1', '12');
    expect(container.querySelector('line')).toHaveAttribute('y1', '5');
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('circle')).toHaveAttribute('cy', '24');
  });

  it('renders portfolio values, profit and purchase marker in the tooltip', () => {
    const { container } = render(
      <CrosshairTooltip active payload={[{ payload: { ...point, date: point.date.getTime() } }]} />,
    );

    expect(screen.getByText('01/09/2026')).toBeInTheDocument();
    expect(screen.getByText('Giá trị')).toBeInTheDocument();
    expect(screen.getByText('Đã đầu tư')).toBeInTheDocument();
    expect(container.textContent).toContain('+10.00%');
    expect(screen.getByText('Đã mua tại điểm này')).toBeInTheDocument();
  });

  it('handles loss, zero investment, and inactive or empty tooltip states', () => {
    const payload = {
      ...point,
      date: point.date.getTime(),
      portfolioValue: 900_000,
      totalInvested: 1_000_000,
      hasPurchase: false,
    };
    const { container, rerender } = render(<CrosshairTooltip active payload={[{ payload }]} />);
    expect(container.textContent).toContain('-10.00%');
    expect(screen.queryByText('Đã mua tại điểm này')).not.toBeInTheDocument();

    rerender(
      <CrosshairTooltip
        active
        payload={[{ payload: { ...payload, portfolioValue: 0, totalInvested: 0 } }]}
      />,
    );
    expect(container.textContent).toContain('+0.00%');

    rerender(<CrosshairTooltip active={false} payload={[{ payload }]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<CrosshairTooltip active payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks purchased points and omits non-purchase points', () => {
    const { container, rerender } = render(
      <svg>
        <PurchaseDot payload={point} index={2} />
      </svg>,
    );
    expect(container.querySelector('circle')).toHaveAttribute('r', '4');
    expect(container.querySelector('circle')).not.toHaveAttribute('cx');

    rerender(
      <svg>
        <PurchaseDot payload={{ ...point, hasPurchase: false }} index={3} />
      </svg>,
    );
    expect(container.querySelector('circle')).toHaveAttribute('r', '0');
  });
});
