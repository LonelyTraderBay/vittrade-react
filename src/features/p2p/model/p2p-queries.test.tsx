import { createElement, type PropsWithChildren } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { p2pApi } from '../api/p2p-api';
import * as queries from './p2p-queries';

const apiMethods = p2pApi as unknown as Record<string, () => Promise<unknown>>;
const queryClients: QueryClient[] = [];

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  queryClients.push(client);
  return client;
}

function createWrapper(client: QueryClient) {
  return ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client, children });
}

async function runQuery(hook: () => unknown) {
  const client = createQueryClient();
  const rendered = renderHook(hook as () => UseQueryResult<unknown, Error>, {
    wrapper: createWrapper(client),
  });
  await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true));
  return { ...rendered, client };
}

async function runMutation(hook: () => unknown, variables?: unknown) {
  const client = createQueryClient();
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
  const setQueryData = vi.spyOn(client, 'setQueryData');
  const rendered = renderHook(hook as () => UseMutationResult<unknown, Error, unknown, unknown>, {
    wrapper: createWrapper(client),
  });
  await act(async () => {
    await rendered.result.current.mutateAsync(variables);
  });
  return { ...rendered, client, invalidateQueries, setQueryData };
}

const queryCases = [
  { title: 'ads', hook: () => queries.useP2PAdsQuery({ status: 'active' }), api: 'listAds' },
  { title: 'overview', hook: () => queries.useP2POverviewQuery(), api: 'getOverview' },
  { title: 'dashboard', hook: () => queries.useP2PDashboardQuery(), api: 'getDashboard' },
  {
    title: 'blacklist',
    hook: () => queries.useP2PBlacklistQuery({ cursor: 'next' }),
    api: 'listBlacklist',
  },
  { title: 'reviews', hook: () => queries.useP2PReviewsQuery('received'), api: 'listReviews' },
  { title: 'chat', hook: () => queries.useP2PChatQuery('order-1'), api: 'getChat' },
  { title: 'achievements', hook: () => queries.useP2PAchievementsQuery(), api: 'getAchievements' },
  {
    title: 'ad analytics',
    hook: () => queries.useP2PAdAnalyticsQuery('ad-1'),
    api: 'getAdAnalytics',
  },
  {
    title: 'merchant profile',
    hook: () => queries.useP2PMerchantProfileQuery('merchant-1'),
    api: 'getMerchantProfile',
  },
  { title: 'ad', hook: () => queries.useP2PAdQuery('ad-1'), api: 'getAd' },
  { title: 'order', hook: () => queries.useP2POrderQuery('order-1'), api: 'getOrder' },
  {
    title: 'orders',
    hook: () => queries.useP2POrdersQuery({ status: 'pending_payment' }),
    api: 'listOrders',
  },
  { title: '2FA settings', hook: () => queries.useP2P2FASettingsQuery(), api: 'get2FASettings' },
  {
    title: 'payment methods',
    hook: () => queries.useP2PPaymentMethodsQuery(),
    api: 'listPaymentMethods',
  },
  {
    title: 'disputes',
    hook: () => queries.useP2PDisputesQuery({ status: 'under_review' }),
    api: 'listDisputes',
  },
  {
    title: 'dispute detail',
    hook: () => queries.useP2PDisputeQuery('dispute-1'),
    api: 'getDispute',
  },
] satisfies Array<{ title: string; hook: () => unknown; api: keyof typeof p2pApi }>;

const mutationCases = [
  {
    title: 'ad creation',
    hook: () => queries.useP2PAdCreateMutation(),
    variables: { request: {}, idempotencyKey: 'ad-create-1' },
    api: 'createAd',
  },
  {
    title: 'ad status update',
    hook: () => queries.useP2PAdStatusMutation(),
    variables: { adId: 'ad-1', request: {}, idempotencyKey: 'ad-status-1' },
    api: 'updateAdStatus',
  },
  {
    title: 'ad deletion',
    hook: () => queries.useP2PAdDeleteMutation(),
    variables: { adId: 'ad-1', idempotencyKey: 'ad-delete-1' },
    api: 'deleteAd',
  },
  {
    title: 'blacklist creation',
    hook: () => queries.useP2PBlacklistCreateMutation(),
    variables: { request: {}, idempotencyKey: 'blacklist-create-1' },
    api: 'createBlacklistEntry',
  },
  {
    title: 'blacklist removal',
    hook: () => queries.useP2PBlacklistRemoveMutation(),
    variables: { entryId: 'entry-1', idempotencyKey: 'blacklist-remove-1' },
    api: 'removeBlacklistEntry',
  },
  {
    title: 'chat message',
    hook: () => queries.useP2PChatMessageMutation('order-1'),
    variables: { request: {}, idempotencyKey: 'chat-1' },
    api: 'sendChatMessage',
  },
  {
    title: 'merchant report',
    hook: () => queries.useP2PMerchantReportMutation(),
    variables: { request: {}, idempotencyKey: 'report-1' },
    api: 'reportMerchant',
  },
  {
    title: 'order creation',
    hook: () => queries.useP2POrderMutation(),
    variables: { request: {}, idempotencyKey: 'order-create-1' },
    api: 'createOrder',
  },
  {
    title: 'mark paid',
    hook: () => queries.useP2PMarkPaidMutation('order-1'),
    api: 'markOrderPaid',
  },
  {
    title: 'release order',
    hook: () => queries.useP2PReleaseOrderMutation('order-1'),
    variables: { verificationToken: 'server-token', idempotencyKey: 'release-1' },
    api: 'releaseOrder',
  },
  {
    title: 'create release challenge',
    hook: () => queries.useP2PReleaseChallengeMutation('order-1'),
    api: 'createReleaseChallenge',
  },
  {
    title: 'verify release challenge',
    hook: () => queries.useP2PReleaseVerificationMutation('order-1'),
    variables: { challengeId: 'challenge-1', code: '123456' },
    api: 'verifyReleaseChallenge',
  },
  {
    title: 'toggle 2FA method',
    hook: () => queries.useP2P2FAMethodMutation(),
    variables: { methodId: 'authenticator', enabled: true, idempotencyKey: '2fa-method-1' },
    api: 'toggle2FAMethod',
  },
  {
    title: 'set primary 2FA method',
    hook: () => queries.useP2P2FAPrimaryMutation(),
    variables: { methodId: 'authenticator', idempotencyKey: '2fa-primary-1' },
    api: 'setPrimary2FAMethod',
  },
  {
    title: 'update 2FA threshold',
    hook: () => queries.useP2P2FAThresholdMutation(),
    variables: { thresholdId: 'withdrawal', request: {}, idempotencyKey: '2fa-threshold-1' },
    api: 'update2FAThreshold',
  },
  {
    title: 'begin authenticator setup',
    hook: () => queries.useP2PAuthenticatorSetupMutation(),
    api: 'beginAuthenticatorSetup',
  },
  {
    title: 'confirm authenticator setup',
    hook: () => queries.useP2PAuthenticatorConfirmMutation(),
    variables: { code: '123456', idempotencyKey: '2fa-confirm-1' },
    api: 'confirmAuthenticatorSetup',
  },
  {
    title: 'cancel order',
    hook: () => queries.useP2PCancelOrderMutation('order-1'),
    variables: { request: {}, idempotencyKey: 'cancel-1' },
    api: 'cancelOrder',
  },
  {
    title: 'rate order',
    hook: () => queries.useP2PRateOrderMutation('order-1'),
    variables: { request: {}, idempotencyKey: 'rate-1' },
    api: 'rateOrder',
  },
  {
    title: 'payment proof',
    hook: () => queries.useP2PPaymentProofMutation('order-1'),
    variables: { request: {}, idempotencyKey: 'proof-1' },
    api: 'submitPaymentProof',
  },
  {
    title: 'payment method creation',
    hook: () => queries.useP2PPaymentMethodCreateMutation(),
    variables: { request: {}, idempotencyKey: 'payment-method-create-1' },
    api: 'createPaymentMethod',
  },
  {
    title: 'payment method update',
    hook: () => queries.useP2PPaymentMethodUpdateMutation(),
    variables: { id: 'method-1', request: {}, idempotencyKey: 'payment-method-update-1' },
    api: 'updatePaymentMethod',
  },
  {
    title: 'payment method deletion',
    hook: () => queries.useP2PPaymentMethodDeleteMutation(),
    variables: { id: 'method-1', idempotencyKey: 'payment-method-delete-1' },
    api: 'deletePaymentMethod',
  },
  {
    title: 'dispute message',
    hook: () => queries.useP2PDisputeMessageMutation('dispute-1'),
    variables: { request: {}, idempotencyKey: 'dispute-message-1' },
    api: 'sendDisputeMessage',
  },
  {
    title: 'dispute escalation',
    hook: () => queries.useP2PDisputeEscalationMutation('dispute-1'),
    variables: { request: {}, idempotencyKey: 'dispute-escalation-1' },
    api: 'escalateDispute',
  },
] satisfies Array<{
  title: string;
  hook: () => unknown;
  variables?: unknown;
  api: keyof typeof p2pApi;
}>;

beforeEach(() => {
  for (const method of Object.keys(apiMethods)) {
    vi.spyOn(apiMethods, method).mockResolvedValue({});
  }
});

afterEach(() => {
  for (const client of queryClients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('P2P query hooks', () => {
  it.each(queryCases)('loads $title through the API adapter', async ({ hook, api }) => {
    const { result, unmount } = await runQuery(hook);

    expect(result.current.isSuccess).toBe(true);
    expect(apiMethods[api]).toHaveBeenCalled();
    unmount();
  });

  it('skips identifier-scoped queries until a valid ID exists', () => {
    const disabledQueries = [
      { hook: () => queries.useP2PChatQuery(undefined), api: 'getChat' },
      { hook: () => queries.useP2PAdAnalyticsQuery(undefined), api: 'getAdAnalytics' },
      { hook: () => queries.useP2PMerchantProfileQuery(undefined), api: 'getMerchantProfile' },
      { hook: () => queries.useP2PAdQuery(undefined), api: 'getAd' },
      { hook: () => queries.useP2POrderQuery(undefined), api: 'getOrder' },
      { hook: () => queries.useP2PDisputeQuery(undefined), api: 'getDispute' },
    ] satisfies Array<{ hook: () => unknown; api: keyof typeof p2pApi }>;

    for (const { hook, api } of disabledQueries) {
      const client = createQueryClient();
      const { result, unmount } = renderHook(hook as () => UseQueryResult<unknown, Error>, {
        wrapper: createWrapper(client),
      });
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiMethods[api]).not.toHaveBeenCalled();
      unmount();
    }
  });
});

describe('P2P mutation hooks', () => {
  it.each(mutationCases)(
    'runs $title through the API adapter',
    async ({ hook, variables, api }) => {
      const { unmount } = await runMutation(hook, variables);

      expect(apiMethods[api]).toHaveBeenCalled();
      unmount();
    },
  );

  it('preserves verification data and idempotency keys on escrow mutations', async () => {
    const release = await runMutation(() => queries.useP2PReleaseOrderMutation('order-1'), {
      verificationToken: 'server-token',
      idempotencyKey: 'release-1',
    });
    const releaseCall = vi.mocked(p2pApi.releaseOrder).mock.calls[0];
    expect(releaseCall).toEqual(['order-1', 'server-token', 'release-1']);

    const verification = await runMutation(
      () => queries.useP2PReleaseVerificationMutation('order-1'),
      { challengeId: 'challenge-1', code: '123456' },
    );
    expect(vi.mocked(p2pApi.verifyReleaseChallenge).mock.calls[0]).toEqual([
      'order-1',
      'challenge-1',
      '123456',
    ]);

    release.unmount();
    verification.unmount();
  });

  it('updates the local chat and dispute detail caches from mutation responses', async () => {
    const chat = await runMutation(() => queries.useP2PChatMessageMutation('order-1'), {
      request: {},
      idempotencyKey: 'chat-1',
    });
    const dispute = await runMutation(() => queries.useP2PDisputeMessageMutation('dispute-1'), {
      request: {},
      idempotencyKey: 'dispute-message-1',
    });

    expect(chat.setQueryData).toHaveBeenCalledWith(['p2p', 'chat', 'order-1'], {});
    expect(dispute.setQueryData).toHaveBeenCalledWith(['p2p', 'dispute', 'dispute-1'], {});
    expect(dispute.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['p2p', 'disputes'] });

    chat.unmount();
    dispute.unmount();
  });

  it('invalidates every filtered order list after order state transitions', async () => {
    const created = await runMutation(() => queries.useP2POrderMutation(), {
      request: {},
      idempotencyKey: 'order-create-1',
    });
    const paid = await runMutation(() => queries.useP2PMarkPaidMutation('order-1'));
    const released = await runMutation(() => queries.useP2PReleaseOrderMutation('order-1'), {
      verificationToken: 'server-token',
      idempotencyKey: 'release-1',
    });

    expect(created.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queries.p2pQueryKeys.adsRoot,
    });
    expect(created.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queries.p2pQueryKeys.ordersRoot,
    });
    for (const transition of [paid, released]) {
      expect(transition.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queries.p2pQueryKeys.order('order-1'),
      });
      expect(transition.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queries.p2pQueryKeys.ordersRoot,
      });
    }

    created.unmount();
    paid.unmount();
    released.unmount();
  });
});
