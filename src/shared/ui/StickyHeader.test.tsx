import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { StickyColumnHeader, StickyDateHeader, StickyHeader } from './StickyHeader';

describe('StickyHeader', () => {
  it('renders children with the supplied sticky offset and background', () => {
    const { container } = renderWithProviders(
      <StickyHeader top={24} bg="rgb(12, 34, 56)">
        Lệnh gần đây
      </StickyHeader>,
    );
    const header = container.querySelector('.sticky');

    expect(screen.getByText('Lệnh gần đây')).toBeInTheDocument();
    expect(header).toHaveStyle({ top: '24px', background: 'rgb(12, 34, 56)' });
  });

  it('applies default and explicit column alignment and flex values', () => {
    const { container } = renderWithProviders(
      <StickyColumnHeader
        top={12}
        columns={[
          { label: 'Tài sản' },
          { label: 'Giá', flex: 2 },
          { label: 'Biến động', align: 'right' },
          { label: 'Khối lượng' },
        ]}
      />,
    );
    const columns = Array.from(container.querySelectorAll('.sticky span')) as HTMLSpanElement[];

    expect(columns.map((column) => column.textContent)).toEqual([
      'Tài sản',
      'Giá',
      'Biến động',
      'Khối lượng',
    ]);
    expect(columns.map((column) => column.style.textAlign)).toEqual([
      'left',
      'center',
      'right',
      'right',
    ]);
    expect(columns[0].style.flexGrow).toBe('1');
    expect(columns[1].style.flexGrow).toBe('2');
    expect(container.querySelector('.sticky')).toHaveStyle({ top: '12px' });
  });

  it('renders a date group with its default sticky background and custom offset', () => {
    const { container } = renderWithProviders(
      <StickyDateHeader date="10 tháng 10, 2026" top={48} />,
    );
    const header = container.querySelector('.sticky');

    expect(screen.getByText('10 tháng 10, 2026')).toBeInTheDocument();
    expect(header).toHaveStyle({ top: '48px' });
    expect((header as HTMLElement).style.background).not.toBe('');
  });
});
