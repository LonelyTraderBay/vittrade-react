import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { CreateDCAPlanRequest } from '../model/dca-types';
import { DCACreatePlanSheet } from './DCACreatePlanSheet';

describe('DCACreatePlanSheet', () => {
  it('retains a non-default intent when creation is not confirmed', async () => {
    const onCreate = vi.fn(async (_request: CreateDCAPlanRequest) => false);
    const user = userEvent.setup();
    renderWithProviders(<DCACreatePlanSheet open onClose={() => undefined} onCreate={onCreate} />);

    const amount = await screen.findByPlaceholderText('500.000');
    await user.click(screen.getByRole('button', { name: /Solana/ }));
    await user.click(screen.getByRole('button', { name: 'Hàng ngày' }));
    await user.clear(amount);
    await user.type(amount, '1234567');
    const submit = screen.getByRole('button', { name: 'Tạo Kế Hoạch' });
    await user.click(submit);

    expect(amount).toHaveValue('1234567');
    expect(screen.getByText('Coin:').parentElement).toHaveTextContent('SOL');
    expect(screen.getByText('Tần suất:').parentElement).toHaveTextContent('Hàng ngày');
    await user.click(submit);
    expect(onCreate).toHaveBeenCalledTimes(2);
    for (const call of onCreate.mock.calls) {
      expect(call[0]).toEqual({
        coinSymbol: 'SOL',
        frequency: 'daily',
        amountPerPurchase: 1234567,
      });
    }
  });

  it('preselects a coin, formats input, applies every preset, and resets after creation', async () => {
    const onCreate = vi.fn<(_: CreateDCAPlanRequest) => Promise<boolean>>().mockResolvedValue(true);
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
    // InputField owns its visible border and focus ring on the control frame.
    const frame = amount.parentElement!;
    const originalStyle = frame.getAttribute('style');
    fireEvent.focus(amount);
    expect(frame.getAttribute('style')).toContain('border: 1.5px solid var(--tr-primary)');
    expect(frame.style.boxShadow).not.toBe('none');
    fireEvent.blur(amount);
    expect(frame.getAttribute('style')).toBe(originalStyle);
    expect(frame.style.boxShadow).toBe('none');

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
    expect(bitcoinLogo).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bitcoin' })).toHaveTextContent('BTC');
    expect(screen.getByRole('img', { name: 'Bitcoin' })).not.toHaveAttribute('src');

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
    const onCreate = vi.fn<(_: CreateDCAPlanRequest) => Promise<boolean>>().mockResolvedValue(true);
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
    expect(screen.getByRole('button', { name: 'Đang tạo...' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByPlaceholderText('500.000')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Solana/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hàng ngày' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '100.000' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('names choice groups and connects the existing amount minimum to its labeled field', async () => {
    const onCreate = vi.fn(async (_request: CreateDCAPlanRequest) => false);
    const user = userEvent.setup();
    renderWithProviders(<DCACreatePlanSheet open onClose={() => undefined} onCreate={onCreate} />);

    expect(await screen.findByRole('group', { name: 'Chọn Coin' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tần Suất Mua' })).toBeInTheDocument();
    const bitcoin = screen.getByRole('button', { name: /Bitcoin/ });
    const solana = screen.getByRole('button', { name: /Solana/ });
    expect(bitcoin).toHaveAttribute('aria-pressed', 'true');
    expect(solana).toHaveAttribute('aria-pressed', 'false');
    await user.click(solana);
    expect(bitcoin).toHaveAttribute('aria-pressed', 'false');
    expect(solana).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Hàng ngày' }));
    expect(screen.getByRole('button', { name: 'Hàng ngày' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Hàng tuần' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    const amount = screen.getByRole('textbox', { name: 'Số Tiền Mỗi Lần (VND)' });
    await user.click(screen.getByText('Số Tiền Mỗi Lần (VND)', { exact: true }));
    expect(amount).toHaveFocus();
    expect(amount).toHaveAttribute('inputmode', 'numeric');
    expect(amount).toHaveAccessibleDescription('Tối thiểu 10.000 VND mỗi lần mua.');
    await user.clear(amount);
    await user.type(amount, '9999');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Nhập ít nhất 10.000 VND.');
    expect(amount).toHaveAccessibleDescription(
      'Tối thiểu 10.000 VND mỗi lần mua. Nhập ít nhất 10.000 VND.',
    );
    await user.clear(amount);
    await user.type(amount, '10000');
    expect(amount).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Kế Hoạch' })).toBeEnabled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
