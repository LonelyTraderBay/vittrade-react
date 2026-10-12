import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { PredictionRiskCalculatorPage } from './PredictionRiskCalculatorPage';

describe('PredictionRiskCalculatorPage', () => {
  it('keeps the calculator, scenario and guide tabs within its feature route', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PredictionRiskCalculatorPage />);

    expect(screen.getByText('Risk Calculator')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'May tinh' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Kich ban' }));
    expect(screen.getByText('Scenarios Analysis')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Huong dan' }));
    expect(screen.getByText('How to Use')).toBeInTheDocument();
  });

  it('recalculates a losing position when its inputs and outcome change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PredictionRiskCalculatorPage />);

    const [eventInput, sharesInput, entryPriceInput, currentPriceInput, bankrollInput] =
      screen.getAllByRole('textbox');

    await user.clear(eventInput);
    await user.type(eventInput, 'ETH above $5K by Dec 2026?');
    await user.clear(sharesInput);
    await user.type(sharesInput, '100');
    await user.clear(entryPriceInput);
    await user.type(entryPriceInput, '0.65');
    await user.clear(currentPriceInput);
    await user.type(currentPriceInput, '0.5');
    await user.clear(bankrollInput);
    await user.type(bankrollInput, '1200');

    expect(eventInput).toHaveValue('ETH above $5K by Dec 2026?');
    expect(screen.getAllByText('$-15.00')).toHaveLength(2);
    expect(screen.getByText('-23.08%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'NO' }));
    await user.click(screen.getByRole('tab', { name: 'Kich ban' }));

    expect(screen.getByText('Scenarios Analysis')).toBeInTheDocument();
    expect(screen.getByText('$-65.00')).toBeInTheDocument();
    expect(screen.getByText('-100.00%')).toBeInTheDocument();
    expect(screen.getByText('$-15.00')).toBeInTheDocument();
  });

  it('uses zero return percentages when the position has no cost', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PredictionRiskCalculatorPage />);

    const [, sharesInput] = screen.getAllByRole('textbox');
    await user.clear(sharesInput);
    await user.type(sharesInput, '0');
    await user.click(screen.getByRole('tab', { name: 'Kich ban' }));

    expect(screen.getByText('Scenarios Analysis')).toBeInTheDocument();
    expect(screen.getAllByText('+0.00%')).toHaveLength(2);
  });
});
