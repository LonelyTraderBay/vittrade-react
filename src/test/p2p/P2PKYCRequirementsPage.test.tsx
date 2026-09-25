import type { ComponentType } from 'react';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { P2PKYCRequirementsPage } from '@/dev/legacy/p2p/P2PKYCRequirementsPage';

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{`${location.pathname}${location.search}`}</output>;
}

function renderPage(Page: ComponentType, path: string) {
  return renderWithProviders(
    <>
      <Page />
      <CurrentPath />
    </>,
    { routerProps: { initialEntries: [path] } },
  );
}

describe('development-only P2P KYC requirements preview', () => {
  it('renders the demo tier and routes an upgrade to its verification preview', async () => {
    const user = userEvent.setup();
    renderPage(P2PKYCRequirementsPage, '/p2p/kyc/requirements');

    expect(screen.getByText('P2P KYC Requirements', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Đang dùng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nâng cấp lên Tier 2' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/kyc/verify?tier=2');
  });
});
