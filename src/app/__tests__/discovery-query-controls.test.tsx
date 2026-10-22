import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '@/test/test-utils';
import { LaunchpadContractPage } from '@/features/launchpad/pages/LaunchpadContractPages';
import { PredictionsSearchContractPage } from '@/features/predictions/pages/PredictionContractPages';
import { CopyTradingPage } from '@/features/trading/pages/CopyTradingPage';
import { ProviderLeaderboardPage } from '@/features/trading/pages/ProviderLeaderboardPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const cases = [
  {
    name: 'Launchpad',
    Component: LaunchpadContractPage,
    endpoint: '*/launchpad/projects',
    region: 'Kết quả Launchpad',
    control: 'Sắp tới',
    field: 'status',
    value: 'upcoming',
    empty: { projects: [], total: 0, activeCount: 0 },
    queryRoot: 'launchpad',
  },
  {
    name: 'Prediction search',
    Component: PredictionsSearchContractPage,
    endpoint: '*/predictions/events',
    region: 'Kết quả prediction market',
    control: 'Tìm prediction market',
    field: 'search',
    value: 'btc',
    empty: { items: [] },
    queryRoot: 'predictions',
  },
  {
    name: 'Copy Trading',
    Component: CopyTradingPage,
    endpoint: '*/trading/copy/providers',
    region: 'Kết quả Copy Trading',
    control: 'Ổn định nhất',
    field: 'sort',
    value: 'sharpe',
    empty: { items: [] },
    queryRoot: 'trading',
  },
  {
    name: 'Provider leaderboard',
    Component: ProviderLeaderboardPage,
    endpoint: '*/trading/copy/providers',
    region: 'Kết quả bảng xếp hạng provider',
    control: 'Trung bình',
    field: 'risk',
    value: 'medium',
    empty: { items: [] },
    queryRoot: 'trading',
  },
] as const;

function CaptureClient({ onReady }: { onReady: (client: QueryClient) => void }) {
  const client = useQueryClient();
  useEffect(() => onReady(client), [client, onReady]);
  return null;
}

function controlFor(item: (typeof cases)[number]) {
  return screen.getByRole(item.field === 'search' ? 'textbox' : 'button', {
    name: item.control,
  });
}

describe('Discovery list control lifecycle through real query/API owners', () => {
  it.each(cases)(
    '$name keeps native control/draft through pending/error and explicit retry',
    async (item) => {
      let release!: () => void;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      const selectedRequests: string[] = [];
      let recover = false;
      server.use(
        http.get(item.endpoint, async ({ request }) => {
          const value = new URL(request.url).searchParams.get(item.field);
          if (value === item.value) {
            selectedRequests.push(value);
            if (!recover) {
              await held;
              return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
            }
          }
          return HttpResponse.json(item.empty);
        }),
      );
      renderWithProviders(<item.Component />);
      const region = screen.getByRole('region', { name: item.region });
      await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'false'));
      const control = controlFor(item);
      control.focus();
      try {
        if (item.field === 'search') await userEvent.type(control, item.value);
        else fireEvent.click(control);
        await waitFor(() => expect(selectedRequests.length).toBeGreaterThan(0));
        expect(region).toHaveAttribute('aria-busy', 'true');
        expect(within(region).getByRole('status')).toBeInTheDocument();
        expect(control.isConnected).toBe(true);
        expect(control).toHaveFocus();
        expect(controlFor(item)).toBe(control);
      } finally {
        release();
      }
      expect(await within(region).findByRole('alert')).toBeInTheDocument();
      expect(controlFor(item)).toBe(control);
      expect(control).toHaveFocus();
      if (item.field === 'search') expect(control).toHaveValue(item.value);
      else expect(control).toHaveAttribute('aria-pressed', 'true');
      recover = true;
      await userEvent.click(within(region).getByRole('button', { name: 'Thử lại' }));
      await waitFor(() => expect(within(region).queryByRole('alert')).not.toBeInTheDocument());
      expect(region).toHaveAttribute('aria-busy', 'false');
      expect(controlFor(item)).toBe(control);
      expect(selectedRequests.every((value) => value === item.value)).toBe(true);
      if (item.field === 'search') {
        await userEvent.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
        expect(control).toHaveValue('');
        expect(control).toHaveFocus();
      }
    },
  );

  it.each(cases)(
    '$name retains control on cached refetch failure and distinguishes error from successful empty',
    async (item) => {
      let failed = false;
      let queryClient: QueryClient | undefined;
      server.use(
        http.get(item.endpoint, () =>
          failed
            ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
            : HttpResponse.json(item.empty),
        ),
      );
      renderWithProviders(
        <>
          <item.Component />
          <CaptureClient
            onReady={(client) => {
              queryClient = client;
            }}
          />
        </>,
      );
      const region = screen.getByRole('region', { name: item.region });
      await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'false'));
      expect(within(region).queryByRole('alert')).not.toBeInTheDocument();
      const control = controlFor(item);
      control.focus();
      failed = true;
      await act(async () => {
        await queryClient!.refetchQueries({ queryKey: [item.queryRoot], type: 'active' });
      });
      expect(await within(region).findByRole('alert')).toBeInTheDocument();
      expect(controlFor(item)).toBe(control);
      expect(control).toHaveFocus();
      expect(within(region).queryByText(/Không có .*phù hợp/)).not.toBeInTheDocument();
      if (item.name === 'Launchpad')
        expect(screen.queryByText('VitLaunch')).not.toBeInTheDocument();
      if (item.name === 'Copy Trading')
        expect(screen.queryByText('AUM', { exact: true })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    },
  );
});
