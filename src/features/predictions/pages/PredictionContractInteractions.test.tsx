import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { PredictionEvent } from '../model/prediction-types';
import {
  PredictionBridgeBackButton,
  PredictionEventContractPage,
  PredictionsHomeContractPage,
} from './PredictionContractPages';

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

describe('prediction contract interaction coverage', () => {
  it('keeps order placement pending and disabled until the API responds', async () => {
    server.use(
      http.get('*/predictions/events/event-1', () => HttpResponse.json(event)),
      http.post('*/predictions/orders', async () => {
        await delay(100);
        return HttpResponse.json({
          id: 'pending-receipt',
          eventId: event.id,
          eventTitle: event.title,
          outcome: 'Yes',
          side: 'buy',
          orderType: 'market',
          shares: 100,
          filledShares: 100,
          price: 0.62,
          avgPrice: 0.62,
          total: 62,
          fee: 0,
          status: 'filled',
          createdAt: '2026-09-24T00:00:00.000Z',
          updatedAt: '2026-09-24T00:01:00.000Z',
          timeline: [],
        });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route
          path="/markets/predictions/event/:eventId"
          element={<PredictionEventContractPage />}
        />
        <Route
          path="/markets/predictions/receipt/:orderId"
          element={<output data-testid="pending-receipt-path">receipt</output>}
        />
      </Routes>,
      { routerProps: { initialEntries: ['/markets/predictions/event/event-1'] } },
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Mua Yes' }));
    const pendingButton = await screen.findByRole('button', { name: 'Đang gửi…' });
    expect(pendingButton).toBeDisabled();
    expect(await screen.findByTestId('pending-receipt-path')).toBeInTheDocument();
  });

  it('disables orders when the contract has no outcomes or the share amount is zero', async () => {
    server.use(
      http.get('*/predictions/events/event-empty', () =>
        HttpResponse.json({ ...event, id: 'event-empty', outcomes: [] }),
      ),
    );
    const emptyOutcome = renderWithProviders(
      <Routes>
        <Route
          path="/markets/predictions/event/:eventId"
          element={<PredictionEventContractPage />}
        />
      </Routes>,
      { routerProps: { initialEntries: ['/markets/predictions/event/event-empty'] } },
    );
    expect(await screen.findByRole('button', { name: 'Mua' })).toBeDisabled();
    emptyOutcome.unmount();

    server.use(http.get('*/predictions/events/event-1', () => HttpResponse.json(event)));
    renderWithProviders(
      <Routes>
        <Route
          path="/markets/predictions/event/:eventId"
          element={<PredictionEventContractPage />}
        />
      </Routes>,
      { routerProps: { initialEntries: ['/markets/predictions/event/event-1'] } },
    );
    const sharesInput = await screen.findByRole('spinbutton');
    fireEvent.change(sharesInput, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Mua Yes' })).toBeDisabled();
    fireEvent.change(sharesInput, { target: { value: '1' } });
    expect(screen.getByRole('button', { name: 'Mua Yes' })).toBeEnabled();
  });

  it('renders market defaults for negative changes and events without outcomes', async () => {
    server.use(
      http.get('*/predictions/events', () =>
        HttpResponse.json({
          items: [
            {
              ...event,
              id: 'event-no-outcomes',
              title: 'Outcome pending',
              change24h: -2.4,
              outcomes: [],
            },
          ],
        }),
      ),
    );

    renderWithProviders(<PredictionsHomeContractPage />);
    const card = await screen.findByRole('button', { name: /Outcome pending/ });
    expect(card).toHaveTextContent('-2.4%');
    expect(card.querySelector('.h-full')).toHaveStyle({ width: '0%' });
  });

  it('uses the bridge back button to return to the previous route', async () => {
    function CurrentRoute() {
      const location = useLocation();
      return (
        <>
          <PredictionBridgeBackButton />
          <output data-testid="bridge-path">{location.pathname}</output>
        </>
      );
    }

    renderWithProviders(
      <Routes>
        <Route path="/previous" element={<output>previous</output>} />
        <Route path="/current" element={<CurrentRoute />} />
      </Routes>,
      { routerProps: { initialEntries: ['/previous', '/current'], initialIndex: 1 } },
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Quay lại' }));
    expect(await screen.findByText('previous')).toBeInTheDocument();
  });
});
