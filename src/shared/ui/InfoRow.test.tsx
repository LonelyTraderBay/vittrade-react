import { act, fireEvent, screen } from '@testing-library/react';
import { Globe } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { FeeBreakdown, InfoRow, InfoRowGroup } from './InfoRow';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
});

describe('InfoRow', () => {
  it('renders default values, custom trailing content, icons, and sublabels', () => {
    const { rerender } = renderWithProviders(
      <InfoRow label="Trading fee" value="0.1%" subLabel="Maker" icon={Globe} />,
    );

    expect(screen.getByText('Trading fee')).toBeInTheDocument();
    expect(screen.getByText('Maker')).toBeInTheDocument();
    expect(screen.getByText('0.1%')).toBeInTheDocument();
    expect(
      screen.getByText('Trading fee').parentElement?.parentElement?.querySelector('svg'),
    ).toBeInTheDocument();

    rerender(<InfoRow label="Status" value="hidden" trailing={<span>Completed</span>} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('copies stacked values, shows confirmation, and resets it after two seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(
      <InfoRow
        label="Address"
        value="0x1234"
        variant="stacked"
        copyable
        helper="Wallet address"
        mono
        valueBold
      />,
    );

    const copy = screen.getByRole('button', { name: 'Sao chép' });
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith('0x1234');
    expect(copy.querySelector('svg.lucide-check')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(copy.querySelector('svg.lucide-copy')).toBeInTheDocument();
    expect(screen.getByText('Wallet address')).toBeInTheDocument();
  });

  it('uses the explicit highlight variant and invokes the row action', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <InfoRow label="Total" value="$1,000" highlight stacked onPress={onPress} border={false} />,
    );

    const row = screen.getByRole('button', { name: /Total.*\$1,000/ });
    expect(row.style.background).not.toBe('');
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('InfoRow groups', () => {
  it('removes the final row separator and renders grouped fee details', () => {
    const { container, rerender } = renderWithProviders(
      <InfoRowGroup title="Details">
        <InfoRow label="First" value="A" />
        <InfoRow label="Last" value="B" />
      </InfoRowGroup>,
    );

    expect(screen.getByText('Details')).toBeInTheDocument();
    const rows = container.querySelectorAll('div.flex.items-center.gap-3.w-full');
    expect(rows).toHaveLength(2);
    expect(rows[0].getAttribute('style')).toContain('border-bottom');
    expect(rows[1].getAttribute('style')).not.toContain('border-bottom');

    rerender(
      <FeeBreakdown
        title="Fees"
        items={[
          { label: 'Network', value: '2 USDT' },
          { label: 'Total', value: '2 USDT', highlight: true },
        ]}
      />,
    );
    expect(screen.getByText('Fees')).toBeInTheDocument();
    expect(screen.getAllByText('2 USDT')).toHaveLength(2);
  });
});
