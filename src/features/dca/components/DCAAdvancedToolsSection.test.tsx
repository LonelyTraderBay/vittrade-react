import { useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/test-utils';
import { DCAAdvancedToolsSection } from './DCAAdvancedToolsSection';

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

const routes = [
  ['Portfolio Optimizer', '/w/dca/portfolio-optimizer', 'portfolio_optimizer'],
  ['Dynamic Amount', '/w/dca/dynamic-amount', 'dynamic_amount'],
  ['Auto-Rebalance', '/w/dca/rebalance/config', 'rebalance'],
  ['Smart Schedule', '/w/dca/schedule/config', 'schedule'],
] as const;

describe('DCA advanced tools navigation', () => {
  it.each(routes)('opens the %s feature preview', async (label, path, tool) => {
    const user = userEvent.setup();
    const trackEvent = vi.fn();
    renderWithProviders(
      <>
        <DCAAdvancedToolsSection isDevelopment routePrefix="/w" trackEvent={trackEvent} />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/dca'] } },
    );

    await user.click(screen.getByRole('button', { name: new RegExp(label, 'i') }));
    expect(screen.getByTestId('current-path')).toHaveTextContent(path);
    expect(trackEvent).toHaveBeenCalledWith('dca_tool_opened', { tool });
  });

  it('does not render development tools outside development mode', () => {
    const trackEvent = vi.fn();
    renderWithProviders(
      <DCAAdvancedToolsSection isDevelopment={false} routePrefix="/w" trackEvent={trackEvent} />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
