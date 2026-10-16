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
    expect(copy).toHaveAttribute('type', 'button');
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith('0x1234');
    expect(copy.querySelector('svg.lucide-check')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(copy.querySelector('svg.lucide-copy')).toBeInTheDocument();
    expect(screen.getByText('Wallet address')).toBeInTheDocument();
  });

  it('resolves the stacked shorthand and applies label and value color overrides', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <>
        <InfoRow
          label="Memo"
          value="A long note"
          stacked
          icon={Globe}
          labelColor="purple"
          valueColor="green"
          helper="Shown below"
          onPress={onPress}
        />
        <InfoRow label="Network" value="USDT" stacked icon={Globe} />
      </>,
    );

    expect(screen.getByText('Memo')).toHaveStyle({ color: 'rgb(128, 0, 128)' });
    expect(screen.getByText('A long note')).toHaveStyle({
      color: 'rgb(0, 128, 0)',
      fontWeight: '500',
    });
    expect(screen.getByText('Shown below')).toBeInTheDocument();
    expect(screen.getByText('Network').parentElement?.querySelector('svg')).toBeInTheDocument();
    const stackedAction = screen.getByRole('button', { name: /Memo.*A long note/ });
    expect(stackedAction).toHaveAttribute('type', 'button');
    expect(stackedAction.querySelector('svg.lucide-chevron-right')).toBeInTheDocument();
    fireEvent.click(stackedAction);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('keeps numeric zero copyable and safely handles clipboard rejection', () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(<InfoRow label="Retries" value={0} copyable />);
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));

    expect(writeText).toHaveBeenCalledWith('0');
    expect(
      screen.getByRole('button', { name: 'Sao chép' }).querySelector('svg.lucide-check'),
    ).toBeInTheDocument();
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

  it('shows a navigation cue for a clickable horizontal row', () => {
    const onPress = vi.fn();
    renderWithProviders(<InfoRow label="Security" value="Enabled" onPress={onPress} />);

    const row = screen.getByRole('button', { name: /Security.*Enabled/ });
    expect(row.querySelector('svg.lucide-chevron-right')).toBeInTheDocument();
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledOnce();
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
          { label: 'Network', value: '2 USDT', icon: Globe },
          { label: 'Total', value: '2 USDT', highlight: true },
        ]}
      />,
    );
    expect(screen.getByText('Fees')).toBeInTheDocument();
    expect(screen.getAllByText('2 USDT')).toHaveLength(2);
  });

  it('preserves non-element group children while removing the final row separator', () => {
    renderWithProviders(
      <InfoRowGroup>
        <InfoRow label="First" value="A" />
        Text note
      </InfoRowGroup>,
    );

    expect(screen.getByText('Text note')).toBeInTheDocument();
  });
});
