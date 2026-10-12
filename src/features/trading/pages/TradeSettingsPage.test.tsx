import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { TradeSettingsPage } from './TradeSettingsPage';

const settingsKey = 'trade_settings_v1';

describe('TradeSettingsPage', () => {
  beforeEach(() => {
    const storedValues = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => storedValues.set(key, value),
      removeItem: (key: string) => storedValues.delete(key),
      clear: () => storedValues.clear(),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('persists accessible preference changes and restores the defaults', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradeSettingsPage />);

    const tpslToggle = screen.getByRole('button', { name: 'Mặc định mở TP/SL' });
    expect(tpslToggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(tpslToggle);
    expect(tpslToggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Thị trường' }));
    expect(screen.getByRole('button', { name: 'Thị trường' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(JSON.parse(localStorage.getItem(settingsKey) ?? '{}')).toMatchObject({
      showTpsl: true,
      defaultOrderType: 'market',
    });

    await user.click(screen.getByRole('button', { name: 'Đặt lại mặc định' }));
    expect(JSON.parse(localStorage.getItem(settingsKey) ?? '{}')).toMatchObject({
      showTpsl: false,
      defaultOrderType: 'limit',
    });
  });

  it('updates every visible trade preference and its dependent controls', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradeSettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Mặc định mở TP/SL' }));
    expect(screen.getByRole('button', { name: 'Bracket Order mặc định' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bracket Order mặc định' }));
    await user.click(screen.getByRole('button', { name: 'Mặc định mở TP/SL' }));
    expect(
      screen.queryByRole('button', { name: 'Bracket Order mặc định' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mặc định mở TP/SL' }));

    await user.click(screen.getByRole('button', { name: 'Xác nhận trước khi đặt lệnh' }));
    expect(
      screen.queryByRole('button', { name: 'Bỏ qua xác nhận cho lệnh nhỏ' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xác nhận trước khi đặt lệnh' }));
    await user.click(screen.getByRole('button', { name: 'Bỏ qua xác nhận cho lệnh nhỏ' }));
    const threshold = screen.getByRole('spinbutton');
    await user.clear(threshold);
    await user.type(threshold, '75.25');
    expect(threshold).toHaveValue(75.25);

    for (const label of [
      'Âm thanh khi khớp lệnh',
      'Rung khi khớp lệnh',
      'Hiển thị Order Book',
      'Hiển thị Giao dịch gần đây',
      'Nút phần trăm nhanh',
    ]) {
      const toggle = screen.getByRole('button', { name: label });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    }

    for (const orderType of ['Giới hạn', 'Dừng lỗ', 'Thị trường']) {
      await user.click(screen.getByRole('button', { name: orderType }));
      expect(screen.getByRole('button', { name: orderType })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }

    for (const timeframe of ['1m', '5m', '15m', '1h', '4h', '1D']) {
      await user.click(screen.getByRole('button', { name: timeframe }));
      expect(screen.getByRole('button', { name: timeframe })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }

    for (const decimals of ['2', '4', '6', 'Tự động']) {
      await user.click(screen.getByRole('button', { name: decimals }));
      expect(screen.getByRole('button', { name: decimals })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }

    expect(JSON.parse(localStorage.getItem(settingsKey) ?? '{}')).toMatchObject({
      showTpsl: true,
      confirmOrders: true,
      skipConfirmSmall: true,
      smallOrderThreshold: '75.25',
      soundOnFill: false,
      hapticOnFill: false,
      showOrderBook: false,
      showRecentTrades: false,
      defaultPctButtons: false,
      defaultOrderType: 'market',
      chartTimeframe: '1D',
      priceDecimals: 'auto',
    });
  });
});
