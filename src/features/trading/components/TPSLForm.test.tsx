import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { renderWithProviders } from '@/test/test-utils';
import type { TPSLValues } from '../model/trading-types';
import { TPSLForm } from './TPSLForm';

afterEach(cleanup);

const emptyValues: TPSLValues = {
  enabled: false,
  tpPrice: '',
  slPrice: '',
  tpTriggerType: 'last',
  slTriggerType: 'last',
};

function renderForm({
  side = 'buy',
  entryPrice = 65_000,
  amount = 0.1,
  values = emptyValues,
  defaultBracketMode = false,
}: {
  side?: 'buy' | 'sell';
  entryPrice?: number;
  amount?: number;
  values?: TPSLValues;
  defaultBracketMode?: boolean;
} = {}) {
  function Harness() {
    const [currentValues, setCurrentValues] = useState(values);
    return (
      <TPSLForm
        side={side}
        entryPrice={entryPrice}
        amount={amount}
        values={currentValues}
        onChange={setCurrentValues}
        defaultBracketMode={defaultBracketMode}
      />
    );
  }

  return renderWithProviders(<Harness />);
}

describe('TPSLForm', () => {
  it.each([
    ['buy', '64000', '66000', 'cao hơn', 'thấp hơn'],
    ['sell', '66000', '64000', 'thấp hơn', 'cao hơn'],
  ] as const)(
    'shows correct price direction errors for %s orders',
    (side, tp, sl, tpRule, slRule) => {
      renderForm({ side });
      fireEvent.click(screen.getByRole('button', { name: /TP\/SL/ }));

      const tpInput = screen.getByLabelText('Take Profit (USDT)');
      const slInput = screen.getByLabelText('Stop Loss (USDT)');
      fireEvent.change(tpInput, { target: { value: tp } });
      fireEvent.change(slInput, { target: { value: sl } });

      expect(screen.getByText(`TP phải ${tpRule} giá vào`)).toBeInTheDocument();
      expect(screen.getByText(`SL phải ${slRule} giá vào`)).toBeInTheDocument();
      expect(tpInput).toHaveAttribute('aria-invalid', 'true');
      expect(slInput).toHaveAttribute('aria-invalid', 'true');
    },
  );

  it('shows reward-to-risk values and warns when reward is below risk', () => {
    renderForm({
      values: { ...emptyValues, enabled: true, tpPrice: '66000', slPrice: '60000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));

    expect(screen.getByText('1 : 0.20')).toBeInTheDocument();
    expect(screen.getByText(/R:R thấp hơn 1:1/)).toBeInTheDocument();
    expect(screen.getByText(/R:R 0.2/)).toBeInTheDocument();
  });

  it('warns until bracket mode has both TP and SL prices', () => {
    renderForm({ values: { ...emptyValues, enabled: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Bracket OFF' }));

    expect(screen.getByText(/Bracket mode yêu cầu cả TP và SL/)).toBeInTheDocument();
    expect(screen.getByText(/Thiếu Take Profit/)).toBeInTheDocument();
    expect(screen.getByText(/Thiếu Stop Loss/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Take Profit (USDT)'), { target: { value: '70000' } });
    fireEvent.change(screen.getByLabelText('Stop Loss (USDT)'), { target: { value: '60000' } });
    expect(screen.queryByText(/Bracket mode yêu cầu cả TP và SL/)).not.toBeInTheDocument();
  });

  it('applies the selected quick preset to both prices', () => {
    renderForm({ values: { ...emptyValues, enabled: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));
    fireEvent.click(screen.getByRole('button', { name: 'R:R 1:2' }));

    expect(screen.getByLabelText('Take Profit (USDT)')).toHaveValue(67_600);
    expect(screen.getByLabelText('Stop Loss (USDT)')).toHaveValue(63_700);
  });

  it('clears both prices when disabled and restores the configured bracket default when enabled', () => {
    renderForm({
      values: { ...emptyValues, tpPrice: '70000', slPrice: '60000' },
      defaultBracketMode: true,
    });
    const toggle = () => screen.getByRole('button', { name: /TP\/SL|Bracket Order/ });

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle());
    expect(screen.getByRole('button', { name: 'Bracket ON' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Take Profit (USDT)')).toHaveValue(null);
    expect(screen.getByLabelText('Stop Loss (USDT)')).toHaveValue(null);
  });
});
