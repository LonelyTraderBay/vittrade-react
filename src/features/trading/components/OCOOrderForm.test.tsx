import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { OCOOrderForm, type OCOOrderParams } from './OCOOrderForm';

function renderForm(
  props: Partial<OCOOrderParams> & { available?: number; canWriteTrading?: boolean } = {},
) {
  const onSubmit = vi.fn(async (_params: OCOOrderParams) => {});
  const onCancel = vi.fn();

  renderWithProviders(
    <OCOOrderForm
      side={props.side ?? 'buy'}
      symbol={props.symbol ?? 'BTCUSDT'}
      baseAsset={props.baseAsset ?? 'BTC'}
      currentPrice={props.currentPrice ?? 100}
      available={props.available ?? 1_000}
      canWriteTrading={props.canWriteTrading ?? true}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );

  return { onSubmit, onCancel };
}

describe('OCOOrderForm', () => {
  it('blocks a valid OCO order for a read-only trading session', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ canWriteTrading: false });

    await user.type(screen.getByRole('textbox', { name: 'Take Profit price' }), '120');
    await user.type(screen.getByRole('textbox', { name: 'Take Profit amount' }), '1');
    await user.type(screen.getByRole('textbox', { name: 'Stop Loss price' }), '80');

    expect(screen.getByRole('alert')).toHaveTextContent('Trading permission is required');
    expect(screen.getByRole('button', { name: /Đặt lệnh OCO/ })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks a buy OCO when either mutually exclusive leg exceeds available quote balance', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ available: 100 });

    await user.type(screen.getByRole('textbox', { name: 'Take Profit price' }), '120');
    await user.type(screen.getByRole('textbox', { name: 'Take Profit amount' }), '1');
    await user.type(screen.getByRole('textbox', { name: 'Stop Loss price' }), '80');

    expect(screen.getByRole('alert')).toHaveTextContent('Số dư USDT khả dụng không đủ');
    expect(screen.getByRole('button', { name: /Đặt lệnh OCO/ })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();

    const takeProfitAmount = screen.getByRole('textbox', { name: 'Take Profit amount' });
    await user.clear(takeProfitAmount);
    await user.type(takeProfitAmount, '0.5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Risk/Reward Ratio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Đặt lệnh OCO/ }));
    expect(onSubmit).toHaveBeenCalledWith({
      side: 'buy',
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      currentPrice: 100,
      takeProfitPrice: '120',
      takeProfitAmount: '0.5',
      stopLossPrice: '80',
      stopLossAmount: '0.5',
      amountType: 'same',
    });
  });

  it('validates sell split legs against base balance and preserves both amounts', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ side: 'sell', available: 2 });

    await user.type(screen.getByRole('textbox', { name: 'Take Profit price' }), '80');
    await user.type(screen.getByRole('textbox', { name: 'Take Profit amount' }), '1');
    await user.click(screen.getByRole('button', { name: 'Khối lượng riêng' }));
    await user.type(screen.getByRole('textbox', { name: 'Stop Loss price' }), '120');
    await user.type(screen.getByRole('textbox', { name: 'Stop Loss amount' }), '2.5');

    expect(screen.getByRole('alert')).toHaveTextContent('Số dư BTC khả dụng không đủ');
    expect(screen.getByRole('button', { name: /Đặt lệnh OCO/ })).toBeDisabled();

    const stopLossAmount = screen.getByRole('textbox', { name: 'Stop Loss amount' });
    await user.clear(stopLossAmount);
    await user.type(stopLossAmount, '1.5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Đặt lệnh OCO/ }));
    expect(onSubmit).toHaveBeenCalledWith({
      side: 'sell',
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      currentPrice: 100,
      takeProfitPrice: '80',
      takeProfitAmount: '1',
      stopLossPrice: '120',
      stopLossAmount: '1.5',
      amountType: 'split',
    });
  });

  it('keeps the form retryable after a rejected submit and calls cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async (_params: OCOOrderParams) => {
      throw new Error('temporary API failure');
    });
    const onCancel = vi.fn();

    renderWithProviders(
      <OCOOrderForm
        side="buy"
        symbol="BTCUSDT"
        baseAsset="BTC"
        currentPrice={100}
        available={1_000}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Take Profit price' }), '120');
    await user.type(screen.getByRole('textbox', { name: 'Take Profit amount' }), '1');
    await user.type(screen.getByRole('textbox', { name: 'Stop Loss price' }), '80');
    await user.click(screen.getByRole('button', { name: /Đặt lệnh OCO/ }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /Đặt lệnh OCO/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
