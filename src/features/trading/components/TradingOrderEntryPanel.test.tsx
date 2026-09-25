import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketPair } from '@/features/market';
import type { TPSLValues } from './TPSLForm';
import { TradingOrderEntryPanel } from './TradingOrderEntryPanel';

vi.mock('./OCOOrderForm', () => ({
  OCOOrderForm: ({ onCancel }: { onCancel: () => void }) => (
    <button onClick={onCancel}>Hủy OCO</button>
  ),
}));
vi.mock('./TPSLForm', () => ({ TPSLForm: () => null }));
vi.mock('./TradingFeeNotice', () => ({ TradingFeeNotice: () => null }));

afterEach(cleanup);

const pair: MarketPair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: 1.5,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000,
  marketCap: 1_200_000_000,
  sparklineData: [64_000, 65_000],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const initialTpsl: TPSLValues = {
  enabled: false,
  tpPrice: '',
  slPrice: '',
  tpTriggerType: 'last',
  slTriggerType: 'last',
};

function renderEntry({ canWriteTrading = true } = {}) {
  const handlePct = vi.fn();
  const onRequestConfirmation = vi.fn();
  const onSubmitOco = vi.fn();
  function Harness() {
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [orderTypeId, setOrderTypeId] = useState('limit');
    const [limitPrice, setLimitPrice] = useState('65000');
    const [amount, setAmount] = useState('0.1');
    const [activePct, setActivePct] = useState<number | null>(null);
    const [tpsl, setTpsl] = useState(initialTpsl);

    return (
      <TradingOrderEntryPanel
        pair={pair}
        available={100_000}
        availableLabel={side === 'buy' ? 'USDT' : 'BTC'}
        side={side}
        setSide={setSide}
        orderTypeId={orderTypeId}
        setOrderTypeId={setOrderTypeId}
        isMarket={orderTypeId === 'market'}
        limitPrice={limitPrice}
        setLimitPrice={setLimitPrice}
        amount={amount}
        amountNum={Number(amount) || 0}
        setAmount={setAmount}
        activePct={activePct}
        setActivePct={setActivePct}
        handlePct={handlePct}
        tpsl={tpsl}
        setTpsl={setTpsl}
        livePrice={65_000}
        effectivePrice={orderTypeId === 'market' ? 65_000 : Number(limitPrice)}
        defaultBracketMode={false}
        total={(Number(amount) || 0) * 65_000}
        canPlace={canWriteTrading && Number(amount) > 0}
        canWriteTrading={canWriteTrading}
        onRequestConfirmation={onRequestConfirmation}
        onSubmitOco={onSubmitOco}
        onCancelOco={() => setOrderTypeId('limit')}
      />
    );
  }

  renderWithProviders(<Harness />);
  return { handlePct, onRequestConfirmation, onSubmitOco };
}

describe('TradingOrderEntryPanel', () => {
  it('switches side and forwards percentage and confirmation actions', () => {
    const { handlePct, onRequestConfirmation } = renderEntry();

    fireEvent.click(screen.getByRole('button', { name: 'BÁN' }));
    expect(screen.getAllByText('BTC', { selector: 'span' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '50%' }));
    expect(handlePct).toHaveBeenCalledWith(50);

    fireEvent.click(screen.getByRole('button', { name: /Đặt lệnh bán BTC\/USDT/ }));
    expect(onRequestConfirmation).toHaveBeenCalledOnce();
  });

  it('exposes the advanced order menu accessibly and switches its order fields', () => {
    renderEntry();
    const advancedToggle = screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' });

    expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(advancedToggle);
    expect(screen.getByRole('button', { name: 'Ẩn loại lệnh nâng cao' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Stop-Limit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stop-Limit' }));
    expect(screen.getByText('Giá kích hoạt (USDT)')).toBeInTheDocument();
    expect(screen.getByText('Giá đặt (USDT)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trailing Stop' }));
    expect(screen.getByLabelText('Trailing Delta (%)')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Trailing Delta (%)'), { target: { value: '1.5' } });
    expect(screen.getByText(/giá đảo chiều 1.5%/)).toBeInTheDocument();
  });

  it('omits limit price for market orders and returns from the OCO form', () => {
    renderEntry();
    fireEvent.click(screen.getByRole('button', { name: 'Thị trường' }));
    expect(screen.queryByText('Giá đặt (USDT)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' }));
    fireEvent.click(screen.getByRole('button', { name: 'OCO' }));
    expect(screen.getByRole('button', { name: 'Hủy OCO' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy OCO' }));
    expect(screen.getByText('Giá đặt (USDT)')).toBeInTheDocument();
  });

  it('disables order placement and explains missing permission', () => {
    renderEntry({ canWriteTrading: false });

    expect(screen.getByRole('alert')).toHaveTextContent('Trading permission is required');
    expect(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/ })).toBeDisabled();
  });
});
