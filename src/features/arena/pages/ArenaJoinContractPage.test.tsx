import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import {
  ArenaChallengeContractPage,
  ArenaJoinContractPage,
  ArenaModeContractPage,
} from './ArenaContractPages';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const challenge = {
  id: 'ch001',
  title: 'BTC challenge',
  description: 'Predict BTC.',
  modeId: 'mode001',
  modeName: 'BTC Weekly Predict',
  creator: {
    id: 'creator-1',
    name: 'Creator',
    avatar: '🎮',
    trustScore: 98,
    fairPlayBadge: true,
  },
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

const mode = {
  id: 'mode001',
  title: 'BTC Weekly Predict',
  description: 'Predict BTC for the coming week.',
  cloneCount: 4,
  activeChallenges: 2,
  fairPlay: true,
  template: {
    id: 'prediction',
    title: 'Price prediction',
    icon: '📈',
    color: '#2563EB',
    complexity: 'easy',
  },
  creator: {
    id: 'creator-1',
    name: 'Arena creator',
    avatar: '🎮',
    trustScore: 98,
    fairPlayBadge: true,
  },
  tags: ['BTC'],
  completionRate: 90,
  allowedFormats: ['Closest Guess'],
  winCondition: 'Closest price wins',
  resolutionType: 'Oracle price',
  avgDuration: '1 week',
  relatedRooms: [],
  relatedModes: [],
};

describe('ArenaModeContractPage', () => {
  it('shows loading while the mode request is pending', async () => {
    let resolveMode: (() => void) | undefined;
    const modeResponse = new Promise<Response>((resolve) => {
      resolveMode = () => resolve(HttpResponse.json(mode));
    });
    server.use(http.get('http://localhost:3000/api/arena/modes/mode001', () => modeResponse));

    renderWithProviders(
      <Routes>
        <Route path="/arena/mode/:modeId" element={<ArenaModeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/mode/mode001'] } },
    );

    expect(screen.getByText('Đang tải dữ liệu Arena API…')).toBeInTheDocument();
    resolveMode?.();
    expect(await screen.findByRole('heading', { name: 'BTC Weekly Predict' })).toBeInTheDocument();
  });

  it('loads and renders mode rules from the Arena API contract', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/modes/mode001', () => HttpResponse.json(mode)),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/mode/:modeId" element={<ArenaModeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/mode/mode001'] } },
    );

    expect(await screen.findByRole('heading', { name: 'BTC Weekly Predict' })).toBeInTheDocument();
    expect(screen.getByText('Closest price wins')).toBeInTheDocument();
    expect(screen.getByText('Oracle price')).toBeInTheDocument();
    expect(screen.getByText('1 week')).toBeInTheDocument();
    expect(screen.getByText('Closest Guess')).toBeInTheDocument();
  });

  it('renders creator, room details and fallback contract values', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/modes/mode001', () =>
        HttpResponse.json({
          ...mode,
          creator: { ...mode.creator, fairPlayBadge: false },
          winCondition: undefined,
          resolutionType: undefined,
          avgDuration: undefined,
          relatedRooms: [
            {
              id: 'room-1',
              title: 'BTC room',
              entryPoints: 40,
              format: 'Closest Guess',
              slotsFilled: 2,
              slotsTotal: 8,
              status: 'waiting',
            },
          ],
        }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/mode/:modeId" element={<ArenaModeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/mode/mode001'] } },
    );

    expect(await screen.findByText('Defined by challenge')).toBeInTheDocument();
    expect(screen.getByText('Pending contract')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('BTC room')).toBeInTheDocument();
    expect(screen.getByText(/2\/8 slots/)).toBeInTheDocument();
  });

  it('shows a retry action after a failed mode request and recovers on retry', async () => {
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/arena/modes/mode001', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: 'invalid request' }, { status: 400 })
          : HttpResponse.json(mode);
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/mode/:modeId" element={<ArenaModeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/mode/mode001'] } },
    );

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    await userEvent.click(retryButton);
    expect(await screen.findByRole('heading', { name: 'BTC Weekly Predict' })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});

describe('ArenaChallengeContractPage', () => {
  it('shows the join action and handles a failed join mutation', async () => {
    let resolveJoin: (() => void) | undefined;
    const joinResponse = new Promise<Response>((resolve) => {
      resolveJoin = () =>
        resolve(HttpResponse.json({ message: 'challenge is no longer open' }, { status: 409 }));
    });
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json({
          ...challenge,
          warningBanners: ['Entry uses Arena Points only.'],
          participants: [
            { id: 'player-1', name: 'Player One', avatar: '🧑', role: 'player', status: 'joined' },
          ],
        }),
      ),
      http.post('http://localhost:3000/api/arena/challenges/ch001/join', () => joinResponse),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/challenge/:challengeId" element={<ArenaChallengeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/challenge/ch001'] } },
    );

    expect(await screen.findByRole('heading', { name: 'BTC challenge' })).toBeInTheDocument();
    expect(screen.getByText('Entry uses Arena Points only.')).toBeInTheDocument();
    expect(screen.getByText('Player One')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tham gia challenge' }));
    expect(await screen.findByRole('button', { name: 'Đang tham gia…' })).toBeDisabled();
    resolveJoin?.();
    expect(await screen.findByText('Không thể tham gia. Vui lòng thử lại.')).toBeInTheDocument();
  });

  it('shows a retry action when challenge details fail to load', async () => {
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: 'invalid request' }, { status: 400 })
          : HttpResponse.json(challenge);
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/challenge/:challengeId" element={<ArenaChallengeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/challenge/ch001'] } },
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'BTC challenge' })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('uses the contract status fallback and hides actions for a closed challenge', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json({ ...challenge, challengeState: undefined, status: 'completed' }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/challenge/:challengeId" element={<ArenaChallengeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/challenge/ch001'] } },
    );

    expect(await screen.findByText('completed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tham gia challenge' })).not.toBeInTheDocument();
  });

  it('hides join for read-only users and full challenges', async () => {
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['arena:read'] },
      },
    };
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json(challenge),
      ),
    );

    const readOnlyRender = renderWithProviders(
      <Routes>
        <Route path="/arena/challenge/:challengeId" element={<ArenaChallengeContractPage />} />
      </Routes>,
      {
        authAdapter: readOnlyAdapter,
        routerProps: { initialEntries: ['/arena/challenge/ch001'] },
      },
    );
    expect(
      await screen.findByText('Arena join permission is required to enter a challenge.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tham gia challenge' })).not.toBeInTheDocument();
    readOnlyRender.unmount();

    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json({ ...challenge, challengeState: 'full', slotsFilled: 10 }),
      ),
    );
    renderWithProviders(
      <Routes>
        <Route path="/arena/challenge/:challengeId" element={<ArenaChallengeContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/challenge/ch001'] } },
    );
    expect(await screen.findByText('full')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tham gia challenge' })).not.toBeInTheDocument();
  });
});

describe('ArenaJoinContractPage', () => {
  it('requires confirmations and sends an idempotent join mutation', async () => {
    let joinRequests = 0;
    let resolveJoin: (() => void) | undefined;
    const joinResponse = new Promise<Response>((resolve) => {
      resolveJoin = () =>
        resolve(
          HttpResponse.json(
            {
              challenge: {
                ...challenge,
                slotsFilled: 2,
                participants: [
                  {
                    id: 'dev-user',
                    name: 'Test user',
                    avatar: '🧑‍💻',
                    role: 'player',
                    status: 'joined',
                  },
                ],
              },
              auditEventId: 'audit-1',
            },
            { status: 201 },
          ),
        );
    });
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json(challenge),
      ),
      http.post('http://localhost:3000/api/arena/challenges/ch001/join', async ({ request }) => {
        joinRequests += 1;
        expect(request.headers.get('Idempotency-Key')).toMatch(/^arena-join-ch001-/);
        return joinResponse;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
        <Route path="/arena/challenge/:challengeId" element={<p>challenge joined</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/join/ch001'] } },
    );

    expect(await screen.findByRole('heading', { name: 'BTC challenge' })).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: 'Xác nhận tham gia' });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getAllByRole('checkbox')[1]);
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);
    expect(await screen.findByRole('button', { name: 'Đang tham gia…' })).toBeDisabled();
    await waitFor(() => expect(joinRequests).toBe(1));
    resolveJoin?.();
    expect(await screen.findByText('challenge joined')).toBeInTheDocument();
  });

  it('keeps the join form visible and reports a failed join mutation', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json(challenge),
      ),
      http.post('http://localhost:3000/api/arena/challenges/ch001/join', () =>
        HttpResponse.json({ message: 'conflict' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/join/ch001'] } },
    );

    await screen.findByRole('heading', { name: 'BTC challenge' });
    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getAllByRole('checkbox')[1]);
    await user.click(screen.getByRole('button', { name: 'Xác nhận tham gia' }));

    expect(await screen.findByText('Không thể tham gia. Vui lòng thử lại.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận tham gia' })).toBeEnabled();
  });

  it('shows a retry action when the join confirmation challenge fails to load', async () => {
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: 'invalid request' }, { status: 400 })
          : HttpResponse.json(challenge);
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/join/ch001'] } },
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'BTC challenge' })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('does not expose the join action to read-only users', async () => {
    let joinRequests = 0;
    server.use(http.get('*/arena/challenges/ch001', () => HttpResponse.json(challenge)));
    server.use(
      http.post('*/arena/challenges/ch001/join', () => {
        joinRequests += 1;
        return HttpResponse.json({ message: 'forbidden' }, { status: 403 });
      }),
    );

    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['arena:read'] },
      },
    };

    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      {
        authAdapter: readOnlyAdapter,
        routerProps: { initialEntries: ['/arena/join/ch001'] },
      },
    );

    expect(
      await screen.findByText('Arena join permission is required to enter a challenge.'),
    ).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /tham gia/i });
    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(joinRequests).toBe(0);
  });

  it('uses the contract status fallback and keeps confirmation disabled when closed', async () => {
    server.use(
      http.get('http://localhost:3000/api/arena/challenges/ch001', () =>
        HttpResponse.json({ ...challenge, challengeState: undefined, status: 'completed' }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/arena/join/:challengeId" element={<ArenaJoinContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/arena/join/ch001'] } },
    );

    expect(await screen.findByText('State')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận tham gia' })).toBeDisabled();
  });
});
