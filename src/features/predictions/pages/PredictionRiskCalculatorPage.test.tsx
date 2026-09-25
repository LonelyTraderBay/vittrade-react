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
});
