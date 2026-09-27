import type { ComponentType } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen } from '@/test/test-utils';
import { P2PKYCRequirementsPage } from '@/features/p2p/pages/P2PFrontendStatusPages';

const server = setupServer(
  http.get('*/p2p/frontend-view-status', () =>
    HttpResponse.json({ view: 'kyc-requirements', state: 'backend-required' }),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(Page: ComponentType, path: string) {
  return renderWithProviders(<Page />, { routerProps: { initialEntries: [path] } });
}

describe('P2P KYC requirements frontend route', () => {
  it('states that policy is unavailable until a backend source exists', async () => {
    renderPage(P2PKYCRequirementsPage, '/p2p/kyc/requirements');

    expect(await screen.findByText('Yêu cầu xác minh P2P', { exact: true })).toBeInTheDocument();
    expect(
      await screen.findByText(/Danh sách giấy tờ phụ thuộc chính sách xác minh/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
  });
});
