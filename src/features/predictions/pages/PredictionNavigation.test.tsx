import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/test-utils';
import type { PredictionEvent } from '../model/prediction-types';
import { PredictionsContractPage } from './PredictionContractPages';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const event: PredictionEvent = {
  id: 'event-1',
  title: 'Will BTC close above 100k?',
  category: 'Crypto',
  tags: ['btc'],
  outcomes: [
    { label: 'Yes', chance: 62, color: '#10B981' },
    { label: 'No', chance: 38, color: '#EF4444' },
  ],
  volume24h: 12_000,
  totalVolume: 50_000,
  endDate: '2026-10-01T00:00:00.000Z',
  liquidity: 25_000,
  participants: 120,
  status: 'active',
  isTrending: true,
  change24h: 3.2,
  createdAt: '2026-09-23T00:00:00.000Z',
};

describe('Prediction navigation', () => {
  it('round-trips the API event identifier through the dynamic route without adding query or hash', async () => {
    const id = 'event/a?b#c%';
    server.use(
      http.get('*/predictions/events', () => HttpResponse.json({ items: [{ ...event, id }] })),
    );
    function EventRouteProbe() {
      const location = useLocation();
      const { eventId } = useParams();
      return (
        <>
          <output data-testid="event-url">
            {location.pathname}
            {location.search}
            {location.hash}
          </output>
          <output data-testid="event-id">{eventId}</output>
        </>
      );
    }
    renderWithProviders(
      <Routes>
        <Route path="/r/markets/predictions" element={<PredictionsContractPage />} />
        <Route path="/r/markets/predictions/event/:eventId" element={<EventRouteProbe />} />
      </Routes>,
      { routerProps: { initialEntries: ['/r/markets/predictions'] } },
    );
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(event.title) }));
    expect(await screen.findByTestId('event-url')).toHaveTextContent(
      `/r/markets/predictions/event/${encodeURIComponent(id)}`,
    );
    expect(screen.getByTestId('event-id').textContent).toBe(id);
  });
});
