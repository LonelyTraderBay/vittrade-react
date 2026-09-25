import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { LaunchpadContractPage, LaunchpadProjectContractPage } from './LaunchpadContractPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const project = {
  id: 'proj1',
  name: 'NexaAI Protocol',
  symbol: 'NEXA',
  logo: 'NA',
  logoColor: '#6366F1',
  description: 'AI DeFi protocol',
  type: 'ieo',
  status: 'active',
  totalRaise: '$2,500,000',
  price: 0.05,
  priceUnit: 'USDT',
  startDate: '2026-03-05T10:00:00Z',
  endDate: '2026-03-08T10:00:00Z',
  listingDate: '2026-03-10T12:00:00Z',
  progress: 67,
  participants: 12843,
  subscribed: 2010000,
  allocation: 0,
  tags: ['AI'],
  kyc: true,
  kycLevel: 2,
  whitelist: false,
  chain: 'BSC',
  longDescription: 'Long description from the Launchpad contract.',
  hardCap: '$3,000,000',
  minBuy: 50,
  maxBuy: 5000,
  contractAddress: '0x1234567890abcdef',
  website: 'https://nexaai.io',
  twitter: '@NexaAI',
  telegram: 't.me/NexaAI',
  tokenomics: [{ label: 'Public Sale', percent: 10, color: '#6366F1' }],
  vesting: [{ label: 'TGE', percent: 20, date: '2026-03-10', status: 'locked' }],
  team: [{ name: 'Alex', role: 'CEO', avatar: 'A', verified: true }],
  audit: { auditor: 'CertiK', status: 'passed', critical: 0, high: 0, medium: 1, reportUrl: '#' },
  platformFee: 0,
  restrictions: [],
};

describe('Launchpad contract pages', () => {
  it('renders the server-backed project list and status metrics', async () => {
    server.use(
      http.get('*/launchpad/projects', () =>
        HttpResponse.json({ projects: [project], total: 1, activeCount: 1 }),
      ),
    );

    renderWithProviders(<LaunchpadContractPage />);

    expect(await screen.findByText('NexaAI Protocol')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('renders the detail contract boundary without simulating a transaction', async () => {
    server.use(http.get('*/launchpad/projects/proj1', () => HttpResponse.json(project)));

    renderWithProviders(
      <Routes>
        <Route path="/launchpad/:id" element={<LaunchpadProjectContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/launchpad/proj1'] },
      },
    );

    expect(
      await screen.findByText('Long description from the Launchpad contract.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Production action boundary')).toBeInTheDocument();
    expect(
      screen.getByText(/Subscription and allocation mutations are intentionally not simulated/i),
    ).toBeInTheDocument();
  });

  it('renders the shared error state when the contract is unavailable', async () => {
    server.use(
      http.get('*/launchpad/projects', () =>
        HttpResponse.json(
          { code: 'LAUNCHPAD_UNAVAILABLE', message: 'Unavailable' },
          { status: 503 },
        ),
      ),
    );

    renderWithProviders(<LaunchpadContractPage />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    expect(screen.queryByText('NexaAI Protocol')).not.toBeInTheDocument();
  });
});
