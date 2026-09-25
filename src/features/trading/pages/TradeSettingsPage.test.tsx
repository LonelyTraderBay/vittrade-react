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
});
