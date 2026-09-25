import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { arenaApi } from './arena-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const creator = {
  id: 'creator-1',
  name: 'Creator',
  avatar: '🎮',
  trustScore: 98,
  fairPlayBadge: true,
};
const mode = {
  id: 'mode001',
  title: 'BTC Weekly Predict',
  description: 'Predict BTC.',
  cloneCount: 10,
  activeChallenges: 2,
  fairPlay: true,
  template: {
    id: 'template-1',
    title: 'Closest guess',
    icon: '🎯',
    color: '#F59E0B',
    complexity: 'easy',
  },
  creator,
  tags: ['Crypto'],
  completionRate: 90,
  allowedFormats: ['Numeric'],
  relatedRooms: [],
  relatedModes: [],
};
const challenge = {
  id: 'ch001',
  title: 'BTC challenge',
  description: 'Predict BTC.',
  modeId: 'mode001',
  modeName: 'BTC Weekly Predict',
  creator,
  entryPoints: 100,
  prizePool: 1000,
  slotsTotal: 10,
  slotsFilled: 1,
  status: 'waiting',
  privacy: 'public',
  format: 'Closest Guess',
  rules: ['One prediction'],
  startAt: '2026-09-22T00:00:00Z',
  endAt: '2026-09-23T00:00:00Z',
  leaderboard: [],
  challengeState: 'open',
  participants: [],
};

describe('arena API contract', () => {
  it('loads and validates a mode detail', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/modes/mode001', () => HttpResponse.json(mode)),
    );
    await expect(arenaApi.getMode('mode001')).resolves.toMatchObject({ id: 'mode001' });
  });

  it('joins with an idempotency key and returns an audit event', async () => {
    server.use(
      http.post('http://localhost:3000/api/arena/challenges/ch001/join', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('arena-key-001');
        return HttpResponse.json({ challenge, auditEventId: 'audit-1' }, { status: 201 });
      }),
    );
    await expect(arenaApi.joinChallenge('ch001', 'arena-key-001')).resolves.toMatchObject({
      auditEventId: 'audit-1',
    });
  });

  it('rejects invalid challenge state data', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json({ ...challenge, slotsFilled: '1' }),
      ),
    );
    await expect(arenaApi.getChallenge('ch001')).rejects.toThrow();
  });
});
