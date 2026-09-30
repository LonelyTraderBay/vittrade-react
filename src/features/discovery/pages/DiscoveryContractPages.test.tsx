import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { DiscoverySearchContractPage, DiscoveryTopicContractPage } from './DiscoveryContractPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const prediction = {
  id: 'pred-1',
  title: 'BTC target?',
  category: 'Live Crypto',
  tags: ['BTC'],
  topOutcome: { label: 'Yes', chance: 60, color: '#10B981' },
  volume24h: 1_000,
  participants: 12,
  status: 'active' as const,
};

const arenaMode = {
  id: 'mode-1',
  title: 'Mirror challenge',
  description: 'Follow a strategy',
  tags: ['BTC'],
  cloneCount: 4,
  activeChallenges: 2,
  fairPlay: true,
  creator: { id: 'creator-1', name: 'Alice', avatar: '🦊' },
};

const arenaRoom = {
  id: 'room-1',
  title: 'BTC weekly room',
  modeId: 'mode-1',
  format: 'weekly',
  slotsTotal: 10,
  slotsFilled: 6,
  entryPoints: 20,
  status: 'waiting' as const,
  creator: { name: 'Alice', avatar: '🦊' },
};

const creator = {
  id: 'creator-1',
  name: 'Alice',
  avatar: '🦊',
  trustScore: 92,
  fairPlayBadge: true,
};

const tradingPair = {
  id: 'btc-usdt',
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  change24h: -2.5,
  volume24h: 1_000_000,
  logoColor: '#F7931A',
};

const searchResponse = {
  query: 'bitcoin',
  predictions: [prediction],
  arenaModes: [arenaMode],
  arenaRooms: [arenaRoom],
  creators: [creator],
  tradingPairs: [tradingPair],
};

const topicResponse = {
  topic: { id: 'crypto' as const, label: 'Crypto', color: '#F59E0B', description: 'Crypto topics' },
  stats: { events: 1, rooms: 2, modes: 3, creators: 4 },
  predictions: [prediction],
  arenaRooms: [arenaRoom],
  arenaModes: [arenaMode],
  creators: [creator],
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('Discovery contract pages', () => {
  it('debounces a unified search, renders every result group and keeps web navigation prefixes', async () => {
    let requests = 0;
    let finishSearch: (() => void) | undefined;
    server.use(
      http.get('*/discovery/search', async ({ request }) => {
        requests += 1;
        expect(new URL(request.url).searchParams.get('query')).toBe('bitcoin');
        return await new Promise<Response>((resolve) => {
          finishSearch = () => resolve(HttpResponse.json(searchResponse));
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <DiscoverySearchContractPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/search'] } },
    );

    fireEvent.change(screen.getByPlaceholderText('Tìm market, mode, creator hoặc pair…'), {
      target: { value: 'bitcoin' },
    });

    expect(requests).toBe(0);
    expect(await screen.findByRole('status')).toHaveTextContent('Đang tải dữ liệu Discovery API');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    finishSearch?.();
    expect(await screen.findByText('BTC target?')).toBeInTheDocument();
    expect(screen.getByText('Prediction markets (1)')).toBeInTheDocument();
    expect(screen.getByText('Arena (2)')).toBeInTheDocument();
    expect(screen.getByText('Creators (1)')).toBeInTheDocument();
    expect(screen.getByText('Spot pairs (1)')).toBeInTheDocument();
    expect(screen.getByText('Mirror challenge')).toBeInTheDocument();
    expect(screen.getByText('BTC weekly room')).toBeInTheDocument();
    expect(screen.getByText('Trust score 92/100')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(requests).toBe(1);

    await user.click(screen.getByRole('button', { name: /BTC target\?/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets/predictions/event/pred-1');

    await user.click(screen.getByRole('button', { name: /Mirror challenge/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/arena/mode/mode-1');

    await user.click(screen.getByRole('button', { name: /BTC weekly room/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/arena/challenge/room-1');
  });

  it('renders the empty state when the contract returns no matches', async () => {
    server.use(
      http.get('*/discovery/search', () =>
        HttpResponse.json({
          query: 'no-match',
          predictions: [],
          arenaModes: [],
          arenaRooms: [],
          creators: [],
          tradingPairs: [],
        }),
      ),
    );

    renderWithProviders(<DiscoverySearchContractPage />);
    fireEvent.change(screen.getByPlaceholderText('Tìm market, mode, creator hoặc pair…'), {
      target: { value: 'no-match' },
    });

    expect(await screen.findByText('Không tìm thấy kết quả phù hợp.')).toBeInTheDocument();
    expect(screen.queryByText('Prediction markets (0)')).not.toBeInTheDocument();
  });

  it('retries a failed search through the shared error action', async () => {
    let retryAllowed = false;
    let requests = 0;
    server.use(
      http.get('*/discovery/search', () => {
        requests += 1;
        if (!retryAllowed) {
          return HttpResponse.json({ code: 'SEARCH_UNAVAILABLE' }, { status: 500 });
        }
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

    renderWithProviders(<DiscoverySearchContractPage />);
    fireEvent.change(screen.getByPlaceholderText('Tìm market, mode, creator hoặc pair…'), {
      target: { value: 'bitcoin' },
    });

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    retryAllowed = true;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không tìm thấy kết quả phù hợp.')).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('shows permission denial instead of retry when Discovery search returns 403', async () => {
    server.use(
      http.get('*/discovery/search', () =>
        HttpResponse.json({ code: 'DISCOVERY_FORBIDDEN' }, { status: 403 }),
      ),
    );

    renderWithProviders(<DiscoverySearchContractPage />);
    fireEvent.change(screen.getByPlaceholderText('Tìm market, mode, creator hoặc pair…'), {
      target: { value: 'bitcoin' },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền truy cập Discovery');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

  it('falls back to the crypto topic for unknown IDs and navigates between topics in the web shell', async () => {
    const requestedTopics: string[] = [];
    server.use(
      http.get('*/discovery/topics/:topicId', ({ params }) => {
        requestedTopics.push(String(params.topicId));
        return HttpResponse.json(topicResponse);
      }),
    );

    renderWithProviders(
      <>
        <Routes>
          <Route path="/w/topic/:topicId" element={<DiscoveryTopicContractPage />} />
        </Routes>
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/topic/not-a-topic'] } },
    );

    expect(await screen.findByRole('heading', { name: 'Crypto' })).toBeInTheDocument();
    expect(screen.getByText('Crypto topics')).toBeInTheDocument();
    expect(screen.getByText('Prediction markets (1)')).toBeInTheDocument();
    expect(screen.getByText('Arena rooms and modes (2)')).toBeInTheDocument();
    expect(screen.getByText('Top creators (1)')).toBeInTheDocument();
    expect(requestedTopics).toEqual(['crypto']);

    await userEvent.click(screen.getByRole('button', { name: 'macro' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/topic/macro');
    expect(await screen.findByRole('heading', { name: 'Crypto' })).toBeInTheDocument();
    expect(requestedTopics).toEqual(['crypto', 'macro']);
  });

  it('shows the shared error state and retries a failed topic request', async () => {
    let retryAllowed = false;
    let requests = 0;
    server.use(
      http.get('*/discovery/topics/crypto', () => {
        requests += 1;
        return retryAllowed
          ? HttpResponse.json(topicResponse)
          : HttpResponse.json({ code: 'TOPIC_UNAVAILABLE' }, { status: 500 });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/topic/:topicId" element={<DiscoveryTopicContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/topic/crypto'] },
      },
    );

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    retryAllowed = true;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Crypto' })).toBeInTheDocument();
    expect(requests).toBe(2);
  });

  it('shows permission denial instead of retry when a Discovery topic returns 403', async () => {
    server.use(
      http.get('*/discovery/topics/:topicId', () =>
        HttpResponse.json({ code: 'DISCOVERY_FORBIDDEN' }, { status: 403 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/w/topic/:topicId" element={<DiscoveryTopicContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/w/topic/crypto'] } },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền truy cập Discovery');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });
});
