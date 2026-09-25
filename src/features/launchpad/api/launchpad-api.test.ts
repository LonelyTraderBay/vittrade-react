import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { launchpadApi } from './launchpad-api';

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
  description: 'AI DeFi',
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
  longDescription: 'Long description',
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

describe('launchpad API contract', () => {
  it('loads and validates project list filters', async () => {
    server.use(
      http.get('http://localhost:3000/api/launchpad/projects', ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('active');
        return HttpResponse.json({ projects: [project], total: 1, activeCount: 1 });
      }),
    );
    await expect(launchpadApi.getProjects({ status: 'active' })).resolves.toMatchObject({
      total: 1,
    });
  });

  it('rejects malformed project detail data', async () => {
    server.use(
      http.get('http://localhost:3000/api/launchpad/projects/proj1', () =>
        HttpResponse.json({ ...project, progress: '67' }),
      ),
    );
    await expect(launchpadApi.getProject('proj1')).rejects.toThrow();
  });
});
