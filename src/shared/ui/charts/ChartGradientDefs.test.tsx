import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartGradientDefs } from './ChartGradientDefs';

describe('ChartGradientDefs', () => {
  it('renders vertical and horizontal gradients with their defaults and overrides', () => {
    const { container } = render(
      <svg>
        <ChartGradientDefs
          gradients={[
            { id: 'default-fill', color: '#123456' },
            {
              id: 'custom-fill',
              color: '#abcdef',
              direction: 'horizontal',
              opacityFrom: 0.6,
              opacityTo: 0.1,
            },
          ]}
        />
      </svg>,
    );

    const vertical = container.querySelector('#default-fill');
    expect(vertical).toHaveAttribute('x2', '0');
    expect(vertical).toHaveAttribute('y2', '1');
    expect(vertical?.querySelector('stop[offset="0%"]')).toHaveAttribute('stop-opacity', '0.3');
    expect(vertical?.querySelector('stop[offset="100%"]')).toHaveAttribute('stop-opacity', '0');

    const horizontal = container.querySelector('#custom-fill');
    expect(horizontal).toHaveAttribute('x2', '1');
    expect(horizontal).toHaveAttribute('y2', '0');
    expect(horizontal?.querySelector('stop[offset="0%"]')).toHaveAttribute('stop-opacity', '0.6');
    expect(horizontal?.querySelector('stop[offset="100%"]')).toHaveAttribute('stop-opacity', '0.1');
  });
});
