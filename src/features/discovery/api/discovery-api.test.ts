import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { discoveryApi } from './discovery-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const topicResponse = {
  topic: { id: 'crypto', label: 'Crypto', color: '#F59E0B', description: 'Crypto topics' },
  stats: { events: 1, rooms: 0, modes: 0, creators: 0 },
  predictions: [
    {
      id: 'pred-1',
      title: 'BTC target?',
      category: 'Live Crypto',
      tags: ['BTC'],
      topOutcome: { label: 'Yes', chance: 60, color: '#10B981' },
      volume24h: 1000,
      participants: 12,
      status: 'active',
    },
  ],
  arenaRooms: [],
  arenaModes: [],
  creators: [],
};

describe('discovery API contract', () => {
  it('loads segmented search results', async () => {
    server.use(
      http.get('http://localhost:3000/api/discovery/search', ({ request }) => {
        expect(new URL(request.url).searchParams.get('query')).toBe('bitcoin');
        return HttpResponse.json({
          query: 'bitcoin',
          predictions: [],
          arenaModes: [],
          arenaRooms: [],
          creators: [],
          tradingPairs: [],
        });
      }),
    );
    await expect(discoveryApi.search('bitcoin')).resolves.toMatchObject({ query: 'bitcoin' });
  });

  it('validates topic responses', async () => {
    server.use(
      http.get('http://localhost:3000/api/discovery/topics/crypto', () =>
        HttpResponse.json(topicResponse),
      ),
    );
    await expect(discoveryApi.getTopic('crypto')).resolves.toMatchObject({
      topic: { id: 'crypto' },
      stats: { events: 1 },
    });
  });

  it('rejects an invalid topic response', async () => {
    server.use(
      http.get('http://localhost:3000/api/discovery/topics/crypto', () =>
        HttpResponse.json({ ...topicResponse, stats: { ...topicResponse.stats, events: '1' } }),
      ),
    );
    await expect(discoveryApi.getTopic('crypto')).rejects.toThrow();
  });
});
