import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { CreateDCAPlanRequest } from '../model/dca-types';
import { DCACreatePlanSheet } from './DCACreatePlanSheet';

describe('DCACreatePlanSheet', () => {
  it('preselects a coin, formats input, applies every preset, and resets after creation', async () => {
    const onCreate = vi.fn<(_: CreateDCAPlanRequest) => Promise<void>>().mockResolvedValue();
    const user = userEvent.setup();
    const view = renderWithProviders(
      <DCACreatePlanSheet
        open
        onClose={() => undefined}
        onCreate={onCreate}
        preselectedCoin="ETH"
      />,
    );

    expect(await screen.findByRole('dialog', { name: 'Tạo Kế Hoạch DCA Mới' })).toBeInTheDocument();
    expect(screen.getAllByText('ETH')).not.toHaveLength(0);
    const amount = screen.getByPlaceholderText('500.000');
    const preset = screen.getByRole('button', { name: '100.000' });
    fireEvent.mouseEnter(preset);
    fireEvent.mouseLeave(preset);
    const originalBorder = amount.style.borderColor;
    fireEvent.focus(amount);
    expect(amount.style.borderColor).not.toBe(originalBorder);
    fireEvent.blur(amount);
    expect(amount.style.borderColor).toBe(originalBorder);

    await user.clear(amount);
    await user.type(amount, '12a345');
    expect(amount).toHaveValue('12345');
    expect(screen.getByText('12.345 VND')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Solana/ }));
    await user.click(screen.getByRole('button', { name: 'Hàng ngày' }));
    await user.click(screen.getByRole('button', { name: '100.000' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('3.000.000 VND');

    await user.click(screen.getByRole('button', { name: 'Hàng tuần' }));
    await user.click(screen.getByRole('button', { name: '250.000' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('1.000.000 VND');

    await user.click(screen.getByRole('button', { name: 'Hàng tháng' }));
    await user.click(screen.getByRole('button', { name: '500.000' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('500.000 VND');

    await user.click(screen.getByRole('button', { name: '1.000.000' }));
    await user.click(screen.getByRole('button', { name: 'Hàng ngày' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('30.000.000 VND');
    await user.click(screen.getByRole('button', { name: '2.000.000' }));
    await user.click(screen.getByRole('button', { name: 'Hàng tuần' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('8.000.000 VND');
    await user.click(screen.getByRole('button', { name: '5.000.000' }));
    await user.click(screen.getByRole('button', { name: 'Hàng tháng' }));

    await user.click(screen.getByRole('button', { name: 'Tạo Kế Hoạch' }));
    expect(onCreate).toHaveBeenCalledWith({
      coinSymbol: 'SOL',
      frequency: 'monthly',
      amountPerPurchase: 5_000_000,
    });
    expect(screen.getAllByText('BTC')).toHaveLength(2);
    expect(screen.getByText('Tần suất:').parentElement).toHaveTextContent('Hàng tuần');
    expect(screen.getByText('Mỗi lần:').parentElement).toHaveTextContent('500.000 VND');

    const bitcoinLogo = screen.getByAltText('Bitcoin');
    fireEvent.error(bitcoinLogo);
    expect(bitcoinLogo).toHaveAttribute(
      'src',
      'https://ui-avatars.com/api/?name=BTC&background=random',
    );

    view.rerender(
      <DCACreatePlanSheet
        open
        onClose={() => undefined}
        onCreate={onCreate}
        preselectedCoin="BNB"
      />,
    );
    expect(await screen.findAllByText('BNB')).toHaveLength(2);
  });

  it('disables invalid amounts and prevents closing while creation is pending', async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn<(_: CreateDCAPlanRequest) => Promise<void>>().mockResolvedValue();
    const user = userEvent.setup();
    const view = renderWithProviders(
      <DCACreatePlanSheet open onClose={onClose} onCreate={onCreate} preselectedCoin={null} />,
    );

    expect(await screen.findAllByText('BTC')).toHaveLength(2);
    const amount = screen.getByPlaceholderText('500.000');
    const createButton = screen.getByRole('button', { name: 'Tạo Kế Hoạch' });
    await user.clear(amount);
    expect(createButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Hàng ngày' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('0 VND');
    await user.click(screen.getByRole('button', { name: 'Hàng tháng' }));
    expect(screen.getByText('Ước tính/tháng:').parentElement).toHaveTextContent('0 VND');
    await user.type(amount, '9999');
    expect(createButton).toBeDisabled();
    await user.clear(amount);
    await user.type(amount, '10000');
    expect(createButton).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledOnce();

    view.rerender(
      <DCACreatePlanSheet
        open
        onClose={onClose}
        onCreate={onCreate}
        isCreating
        preselectedCoin={null}
      />,
    );
    expect(screen.getByRole('button', { name: 'Đang tạo...' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
