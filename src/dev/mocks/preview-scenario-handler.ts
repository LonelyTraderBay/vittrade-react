import { delay, http, HttpResponse } from 'msw';
import { getTestDcaSnapshot } from './dca-fixtures';
import { getTestEarnSnapshot } from './earn-fixtures';
import { ACTIVE_CAMPAIGN, REFERRAL_TIERS } from './referral-fixtures';
import { getMarketSuccessPreviewFixture } from './market-preview-fixtures';
import {
  devMockNowIso,
  devMockNowMs,
  getDevPreviewScenario,
  nextDevMockId,
} from './scenario-runtime';

interface PreviewPendingWalletTransaction {
  id: string;
  type: 'withdraw';
  asset: string;
  amount: number;
  status: 'pending';
  createdAt: string;
}

const previewWalletTransactions = new Map<string, PreviewPendingWalletTransaction>();

const domainPathPrefixes: Record<string, string[]> = {
  support: ['/support/', '/content/news', '/notifications'],
  ...Object.fromEntries(
    [
      'admin',
      'arena',
      'auth',
      'dca',
      'discovery',
      'earn',
      'launchpad',
      'market',
      'p2p',
      'predictions',
      'profile',
      'referral',
      'trading',
      'wallet',
    ].map((domain) => [domain, [`/${domain}/`]]),
  ),
  profile: ['/profile/', '/profile'],
};

function matchesScenarioDomain(pathname: string, domain: string): boolean {
  return (domainPathPrefixes[domain] ?? []).some((prefix) => pathname.includes(prefix));
}

function isProtectedMarketOperation(request: Request): boolean {
  const pathname = new URL(request.url).pathname;
  return pathname.includes('/market/watchlist') || pathname.includes('/market/price-alerts');
}

const marketServiceUnavailablePaths = [
  '/market/news',
  '/market/calendar',
  '/market/correlations',
  '/market/unlocks',
  '/market/derivatives',
  '/market/sentiment',
  '/market/signals',
];

function isMarketReadWithoutServerError(pathname: string): boolean {
  return (
    [
      '/market/overview',
      '/market/movers',
      '/market/price-alerts',
      '/market/pairs',
      '/market/watchlist',
    ].some((path) => pathname.endsWith(path)) ||
    /\/market\/pairs\/[^/]+(?:\/(?:orderbook|trades|candles))?$/.test(pathname)
  );
}

/**
 * A preview-only MSW layer for transport/access states shared by domain APIs.
 * It passes through to the real dev handlers for success and unsupported states.
 */
export const previewScenarioHandler = http.all('*', async ({ request }) => {
  if (!request.headers.get('accept')?.includes('application/json')) return undefined;

  const scenario = getDevPreviewScenario();
  if (!scenario) return undefined;

  const pathname = new URL(request.url).pathname;
  if (
    scenario.state === 'unauthorized' &&
    scenario.domain !== 'auth' &&
    pathname.endsWith('/auth/refresh')
  ) {
    if (scenario.domain === 'earn') return HttpResponse.json(null);

    return HttpResponse.json(
      { code: 'SESSION_EXPIRED', message: 'Kịch bản xem trước: phiên đăng nhập đã hết hạn.' },
      { status: 401 },
    );
  }

  if (!matchesScenarioDomain(pathname, scenario.domain)) return undefined;

  if (
    scenario.domain === 'market' &&
    (scenario.state === 'unauthorized' || scenario.state === 'forbidden') &&
    !isProtectedMarketOperation(request)
  ) {
    return undefined;
  }

  if (
    scenario.domain === 'p2p' &&
    scenario.state === 'forbidden' &&
    (request.method !== 'POST' || !/\/p2p\/orders\/[^/]+\/release\/challenge$/.test(pathname))
  ) {
    return undefined;
  }

  if (scenario.state === 'success') {
    if (scenario.domain === 'market') {
      const fixture = getMarketSuccessPreviewFixture(request, devMockNowMs());
      if (fixture !== undefined) return HttpResponse.json(fixture);
    }
    return undefined;
  }

  // Market OpenAPI declares 503 only for the seven provider reads below. Other
  // reads without a 5xx contract fail at transport; writes keep their handlers.
  if (scenario.domain === 'market' && scenario.state === 'error') {
    if (request.method !== 'GET') return undefined;

    if (marketServiceUnavailablePaths.some((path) => pathname.endsWith(path))) {
      return new HttpResponse(null, { status: 503 });
    }

    if (isMarketReadWithoutServerError(pathname)) return HttpResponse.error();
    return undefined;
  }

  if (
    scenario.domain === 'p2p' &&
    scenario.state === 'duplicate' &&
    request.method === 'POST' &&
    (pathname.endsWith('/p2p/orders') ||
      /\/p2p\/orders\/[^/]+\/(?:mark-paid|release)$/.test(pathname))
  ) {
    const markPaidConflict = pathname.endsWith('/mark-paid');
    const releaseConflict = /\/p2p\/orders\/[^/]+\/release$/.test(pathname);
    return HttpResponse.json(
      {
        code: 'P2P_ORDER_CONFLICT',
        message: markPaidConflict
          ? 'Kịch bản xem trước: đơn hàng không thể chuyển sang trạng thái đã thanh toán.'
          : releaseConflict
            ? 'Kịch bản xem trước: đơn hàng không thể chuyển sang trạng thái đã release.'
            : 'Kịch bản xem trước: yêu cầu tạo đơn bị trùng hoặc xung đột.',
      },
      { status: 409 },
    );
  }

  if (
    scenario.domain === 'predictions' &&
    scenario.state === 'duplicate' &&
    request.method === 'POST' &&
    pathname.endsWith('/predictions/orders')
  ) {
    return new HttpResponse(null, { status: 409 });
  }

  if (scenario.domain === 'earn' && scenario.state === 'pending' && request.method === 'POST') {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.length < 8) return undefined;

    const body = (await request
      .clone()
      .json()
      .catch(() => null)) as Record<string, unknown> | null;
    if (
      !body ||
      typeof body.amount !== 'number' ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      return undefined;
    }

    const snapshot = getTestEarnSnapshot();
    const createdAt = new Date(devMockNowMs()).toISOString();
    const id = nextDevMockId('preview-earn-receipt');

    if (pathname.endsWith('/earn/subscriptions') && typeof body.productId === 'string') {
      const product = snapshot.products.find((item) => item.id === body.productId);
      if (
        !product ||
        body.amount < product.minAmount ||
        body.amount > (snapshot.balances[product.asset] ?? 0)
      ) {
        return undefined;
      }

      return HttpResponse.json(
        {
          id,
          operation: 'subscribe',
          productId: product.id,
          asset: product.asset,
          amount: body.amount,
          status: 'pending',
          createdAt,
        },
        { status: 201 },
      );
    }

    if (pathname.endsWith('/earn/redemptions') && typeof body.positionId === 'string') {
      const position = snapshot.positions.find((item) => item.id === body.positionId);
      if (!position || body.amount > position.amount) return undefined;

      return HttpResponse.json(
        {
          id,
          operation: 'redeem',
          productId: position.productId,
          positionId: position.id,
          asset: position.asset,
          amount: body.amount,
          status: 'pending',
          createdAt,
        },
        { status: 201 },
      );
    }
  }

  if (scenario.domain === 'wallet' && scenario.state === 'pending') {
    if (request.method === 'GET' && /\/wallet\/transactions\/[^/]+$/.test(pathname)) {
      const transactionId = pathname.split('/').at(-1);
      const transaction = transactionId ? previewWalletTransactions.get(transactionId) : undefined;
      return transaction ? HttpResponse.json(transaction) : undefined;
    }

    if (request.method === 'POST') {
      const idempotencyKey = request.headers.get('Idempotency-Key');
      if (!idempotencyKey || idempotencyKey.length < 16) return undefined;

      const body = (await request
        .clone()
        .json()
        .catch(() => null)) as Record<string, unknown> | null;
      if (!body || typeof body.asset !== 'string' || typeof body.amount !== 'number') {
        return undefined;
      }
      if (!Number.isFinite(body.amount) || body.amount <= 0) return undefined;

      const createdAt = new Date(devMockNowMs()).toISOString();
      if (
        pathname.endsWith('/wallet/transfers') &&
        typeof body.fromWallet === 'string' &&
        typeof body.toWallet === 'string'
      ) {
        return HttpResponse.json(
          {
            ...body,
            id: nextDevMockId('preview-wallet-transfer'),
            status: 'pending',
            createdAt,
          },
          { status: 201 },
        );
      }

      if (
        pathname.endsWith('/wallet/withdrawals') &&
        typeof body.networkId === 'string' &&
        typeof body.address === 'string' &&
        typeof body.verificationToken === 'string'
      ) {
        const transactionId = nextDevMockId('preview-wallet-transaction');
        const transaction: PreviewPendingWalletTransaction = {
          id: transactionId,
          type: 'withdraw',
          asset: body.asset,
          amount: body.amount,
          status: 'pending',
          createdAt,
        };
        previewWalletTransactions.set(transactionId, transaction);
        return HttpResponse.json(
          {
            id: nextDevMockId('preview-wallet-withdrawal'),
            transactionId,
            asset: body.asset,
            amount: body.amount,
            status: 'pending',
            createdAt,
          },
          { status: 201 },
        );
      }
    }
  }

  if (
    scenario.domain === 'p2p' &&
    scenario.state === 'pending' &&
    request.method === 'POST' &&
    (pathname.endsWith('/p2p/orders') ||
      /\/p2p\/orders\/[^/]+\/(?:mark-paid|release)$/.test(pathname))
  ) {
    await delay(2_000);
    return undefined;
  }

  if (
    scenario.domain === 'trading' &&
    scenario.state === 'pending' &&
    ((request.method === 'POST' && pathname.endsWith('/trading/orders')) ||
      (request.method === 'PATCH' && /\/trading\/orders\/[^/]+$/.test(pathname)) ||
      (request.method === 'POST' && /\/trading\/orders\/[^/]+\/cancel$/.test(pathname)))
  ) {
    await delay(2_000);
    return undefined;
  }

  if (
    scenario.domain === 'predictions' &&
    scenario.state === 'pending' &&
    request.method === 'POST' &&
    pathname.endsWith('/predictions/orders')
  ) {
    await delay(2_000);
    return undefined;
  }

  if (scenario.state === 'empty') {
    if (
      scenario.domain === 'launchpad' &&
      request.method === 'GET' &&
      pathname.endsWith('/launchpad/projects')
    ) {
      return HttpResponse.json({ projects: [], total: 0, activeCount: 0 });
    }

    if (
      scenario.domain === 'dca' &&
      request.method === 'GET' &&
      pathname.endsWith('/dca/snapshot')
    ) {
      return HttpResponse.json(getTestDcaSnapshot([]));
    }

    if (
      scenario.domain === 'auth' &&
      request.method === 'GET' &&
      pathname.endsWith('/auth/session')
    ) {
      return HttpResponse.json(null);
    }

    if (
      scenario.domain === 'arena' &&
      request.method === 'GET' &&
      pathname.endsWith('/arena/discovery')
    ) {
      return HttpResponse.json({ modes: [], challenges: [] });
    }

    if (scenario.domain === 'admin' && request.method === 'GET') {
      if (pathname.endsWith('/admin/analytics/funnel')) {
        return HttpResponse.json({ steps: [] });
      }
      if (pathname.endsWith('/admin/analytics/ab-tests')) {
        return HttpResponse.json({ tests: [] });
      }
    }

    if (scenario.domain === 'trading' && request.method === 'GET') {
      if (pathname.endsWith('/trading/orders')) {
        return HttpResponse.json({ items: [] });
      }
      if (pathname.endsWith('/trading/orders/history')) {
        return HttpResponse.json({ items: [] });
      }
      if (pathname.endsWith('/trading/positions')) {
        return HttpResponse.json({ items: [], updatedAt: devMockNowIso() });
      }
    }

    if (
      scenario.domain === 'profile' &&
      request.method === 'GET' &&
      ['/profile/devices', '/profile/activity', '/profile/sub-accounts'].some((path) =>
        pathname.endsWith(path),
      )
    ) {
      return HttpResponse.json({ items: [] });
    }

    if (
      scenario.domain === 'predictions' &&
      request.method === 'GET' &&
      [
        '/predictions/events',
        '/predictions/positions',
        '/predictions/rewards',
        '/predictions/leaderboard',
        '/predictions/activity',
      ].some((path) => pathname.endsWith(path))
    ) {
      return HttpResponse.json({ items: [] });
    }

    if (
      scenario.domain === 'wallet' &&
      request.method === 'GET' &&
      pathname.endsWith('/wallet/transactions')
    ) {
      return HttpResponse.json({ items: [], total: 0 });
    }

    if (scenario.domain === 'p2p' && request.method === 'GET' && pathname.endsWith('/p2p/orders')) {
      return HttpResponse.json({ items: [], total: 0 });
    }

    if (
      scenario.domain === 'referral' &&
      request.method === 'GET' &&
      pathname.endsWith('/referral/overview')
    ) {
      return HttpResponse.json({
        referralCode: 'PREVIEW-EMPTY',
        stats: {
          totalFriends: 0,
          activeFriends: 0,
          kycCompleted: 0,
          totalCommission: 0,
          pendingCommission: 0,
          totalVolume: 0,
          thisMonthCommission: 0,
          thisMonthFriends: 0,
        },
        currentTier: REFERRAL_TIERS[0],
        friends: [],
        campaign: {
          id: ACTIVE_CAMPAIGN.id,
          title: ACTIVE_CAMPAIGN.title,
          description: ACTIVE_CAMPAIGN.description,
          bonusLabel: ACTIVE_CAMPAIGN.bonusLabel,
          daysLeft: ACTIVE_CAMPAIGN.daysLeft,
          totalParticipants: ACTIVE_CAMPAIGN.totalParticipants,
        },
      });
    }

    if (scenario.domain === 'earn' && request.method === 'GET') {
      if (pathname.endsWith('/earn/snapshot')) {
        return HttpResponse.json({
          products: [],
          positions: [],
          balances: {},
          summary: {
            totalDepositedUsd: 0,
            totalEarnedUsd: 0,
            averageApy: 0,
            activePositions: 0,
          },
        });
      }
      if (pathname.endsWith('/earn/transactions')) return HttpResponse.json({ items: [] });
    }

    if (scenario.domain === 'discovery' && request.method === 'GET') {
      if (pathname.endsWith('/discovery/search')) {
        const query = new URL(request.url).searchParams.get('query') ?? '';
        return HttpResponse.json({
          query,
          predictions: [],
          arenaModes: [],
          arenaRooms: [],
          creators: [],
          tradingPairs: [],
        });
      }
    }

    if (
      scenario.domain === 'market' &&
      request.method === 'GET' &&
      pathname.endsWith('/market/pairs')
    ) {
      return HttpResponse.json({ items: [] });
    }
    return undefined;
  }

  if (
    scenario.domain === 'trading' &&
    scenario.state === 'loading' &&
    request.method === 'GET' &&
    ['/trading/orders', '/trading/orders/history', '/trading/positions'].some((path) =>
      pathname.endsWith(path),
    )
  ) {
    await delay(2_000);
    return undefined;
  }

  if (scenario.state === 'loading' && scenario.domain !== 'trading') {
    await delay(2_000);
    return undefined;
  }

  if (scenario.domain === 'trading' && scenario.state === 'error') {
    // Trading's contract declares 503 only for positions. Let each existing
    // development handler decide its own response instead of failing the domain.
    return undefined;
  }

  if (scenario.state === 'error') {
    if (scenario.domain === 'dca') {
      // DCA OpenAPI declares no 5xx; model a transport failure only for the
      // snapshot read and let the other operations retain their normal handlers.
      return request.method === 'GET' && pathname.endsWith('/dca/snapshot')
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'earn') {
      // Earn OpenAPI declares no 5xx; fail its reads at transport and leave
      // mutations to the normal handlers because a lost write outcome is unknown.
      return request.method === 'GET' &&
        (pathname.endsWith('/earn/snapshot') || pathname.endsWith('/earn/transactions'))
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'auth') {
      // Auth OpenAPI declares no 5xx. Model an unavailable login request without
      // inventing an HTTP status; other Auth operations use their real handlers.
      return request.method === 'POST' && pathname.endsWith('/auth/login')
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'predictions') {
      return request.method === 'GET' && pathname.endsWith('/predictions/events')
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'arena') {
      return request.method === 'GET' && pathname.endsWith('/arena/discovery')
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'launchpad') {
      // Launchpad declares no 5xx response; fail only its project-list read at
      // the transport layer and let project detail keep its normal handler.
      return request.method === 'GET' && pathname.endsWith('/launchpad/projects')
        ? HttpResponse.error()
        : undefined;
    }

    if (scenario.domain === 'p2p') {
      // P2P declares no 5xx response. Fail only the order-list read at the
      // transport layer; mutations keep their normal handlers and outcomes.
      return request.method === 'GET' && pathname.endsWith('/p2p/orders')
        ? HttpResponse.error()
        : undefined;
    }

    return HttpResponse.json(
      { code: 'PREVIEW_SERVER_ERROR', message: 'Kịch bản xem trước: dịch vụ tạm thời lỗi.' },
      { status: 503 },
    );
  }

  if (scenario.state === 'unauthorized') {
    if (scenario.domain === 'auth') {
      const hasContractUnauthorizedResponse =
        (request.method === 'GET' && pathname.endsWith('/auth/session')) ||
        (request.method === 'POST' &&
          (pathname.endsWith('/auth/password/verify-current') ||
            pathname.endsWith('/auth/password/change')));
      if (!hasContractUnauthorizedResponse) return undefined;
    }

    return HttpResponse.json(
      { code: 'PREVIEW_UNAUTHORIZED', message: 'Kịch bản xem trước: cần đăng nhập lại.' },
      { status: 401 },
    );
  }

  if (scenario.state === 'forbidden') {
    if (scenario.domain === 'auth') return undefined;

    return HttpResponse.json(
      { code: 'PREVIEW_FORBIDDEN', message: 'Kịch bản xem trước: tài khoản không có quyền.' },
      { status: 403 },
    );
  }

  return undefined;
});
