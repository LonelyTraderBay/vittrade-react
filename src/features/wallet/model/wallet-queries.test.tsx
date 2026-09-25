import { createElement, type PropsWithChildren } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { walletApi } from '../api/wallet-api';
import * as queries from './wallet-queries';

const apiMethods = walletApi as unknown as Record<string, (...args: never[]) => Promise<unknown>>;
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
  { title: 'assets', hook: () => queries.useWalletAssetsQuery(), api: 'getAssets' },
  { title: 'accounts', hook: () => queries.useWalletAccountsQuery(), api: 'getAccounts' },
  {
    title: 'transactions',
    hook: () => queries.useWalletTransactionsQuery({ asset: 'BTC', status: 'pending', limit: 20 }),
    api: 'getTransactions',
  },
  {
    title: 'transaction detail',
    hook: () => queries.useWalletTransactionQuery('transaction-1'),
    api: 'getTransaction',
  },
  {
    title: 'deposit networks',
    hook: () => queries.useWalletDepositNetworksQuery('BTC'),
    api: 'getDepositNetworks',
  },
  {
    title: 'withdrawal networks',
    hook: () => queries.useWalletWithdrawalNetworksQuery('BTC'),
    api: 'getWithdrawalNetworks',
  },
  {
    title: 'address book',
    hook: () => queries.useWalletAddressBookQuery(),
    api: 'getAddressBook',
  },
  {
    title: 'portfolio analytics',
    hook: () => queries.useWalletPortfolioAnalyticsQuery('1M'),
    api: 'getPortfolioAnalytics',
  },
  {
    title: 'dust quote',
    hook: () =>
      queries.useWalletDustConversionQuoteQuery({
        sourceAssetIds: ['asset-1'],
        targetAsset: 'BTC',
      }),
    api: 'getDustConversionQuote',
  },
] satisfies Array<{ title: string; hook: () => unknown; api: string }>;

const mutationCases = [
  {
    title: 'create address book entry',
    hook: () => queries.useWalletAddressBookCreateMutation(),
    variables: { request: {}, idempotencyKey: 'address-create-1' },
    api: 'createAddressBookEntry',
  },
  {
    title: 'update address book entry',
    hook: () => queries.useWalletAddressBookUpdateMutation(),
    variables: { id: 'address-1', request: {}, idempotencyKey: 'address-update-1' },
    api: 'updateAddressBookEntry',
  },
  {
    title: 'delete address book entry',
    hook: () => queries.useWalletAddressBookDeleteMutation(),
    variables: { id: 'address-1', idempotencyKey: 'address-delete-1' },
    api: 'deleteAddressBookEntry',
  },
  {
    title: 'update address book settings',
    hook: () => queries.useWalletAddressBookSettingsMutation(),
    variables: { whitelistEnabled: true, idempotencyKey: 'address-settings-1' },
    api: 'updateAddressBookSettings',
  },
  {
    title: 'create withdrawal challenge',
    hook: () => queries.useWalletWithdrawalChallengeMutation(),
    variables: { request: {} },
    api: 'createWithdrawalChallenge',
  },
  {
    title: 'verify withdrawal challenge',
    hook: () => queries.useWalletWithdrawalVerificationMutation(),
    variables: { challengeId: 'challenge-1', code: '123456' },
    api: 'verifyWithdrawalChallenge',
  },
  {
    title: 'convert dust',
    hook: () => queries.useWalletDustConversionMutation(),
    variables: {
      request: { sourceAssetIds: ['asset-1'], targetAsset: 'BTC' },
      idempotencyKey: 'dust-conversion-1',
    },
    api: 'createDustConversion',
  },
  {
    title: 'transfer funds',
    hook: () => queries.useWalletTransferMutation(),
    variables: {
      request: { fromWallet: 'spot', toWallet: 'funding', asset: 'USDT', amount: 10 },
      idempotencyKey: 'transfer-1',
    },
    api: 'createTransfer',
  },
  {
    title: 'withdraw funds',
    hook: () => queries.useWalletWithdrawalMutation(),
    variables: {
      request: {
        asset: 'BTC',
        networkId: 'bitcoin',
        address: 'wallet-address',
        amount: 0.1,
        verificationToken: 'server-token',
      },
      idempotencyKey: 'withdrawal-1',
    },
    api: 'createWithdrawal',
  },
] satisfies Array<{ title: string; hook: () => unknown; variables: unknown; api: string }>;

beforeEach(() => {
  for (const method of Object.keys(apiMethods)) {
    vi.spyOn(apiMethods, method).mockResolvedValue({});
  }
});

afterEach(() => {
  for (const client of queryClients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('Wallet query hooks', () => {
  it.each(queryCases)('loads $title through the wallet API adapter', async ({ hook, api }) => {
    const { result, unmount } = await runQuery(hook);

    expect(result.current.isSuccess).toBe(true);
    expect(apiMethods[api]).toHaveBeenCalled();
    unmount();
  });

  it('waits for IDs and selected assets before running scoped queries', () => {
    const disabledQueries = [
      { hook: () => queries.useWalletTransactionQuery(undefined), api: 'getTransaction' },
      { hook: () => queries.useWalletDepositNetworksQuery(undefined), api: 'getDepositNetworks' },
      {
        hook: () => queries.useWalletWithdrawalNetworksQuery(undefined),
        api: 'getWithdrawalNetworks',
      },
      {
        hook: () =>
          queries.useWalletDustConversionQuoteQuery({ sourceAssetIds: [], targetAsset: 'BTC' }),
        api: 'getDustConversionQuote',
      },
    ];

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

describe('Wallet mutation hooks', () => {
  it.each(mutationCases)(
    'runs $title through the wallet API adapter',
    async ({ hook, variables, api }) => {
      const { unmount } = await runMutation(hook, variables);

      expect(apiMethods[api]).toHaveBeenCalled();
      unmount();
    },
  );

  it('invalidates affected wallet data after transfer, withdrawal and dust conversion', async () => {
    const mutations = [
      await runMutation(() => queries.useWalletTransferMutation(), mutationCases[7].variables),
      await runMutation(() => queries.useWalletWithdrawalMutation(), mutationCases[8].variables),
      await runMutation(
        () => queries.useWalletDustConversionMutation(),
        mutationCases[6].variables,
      ),
    ];

    for (const mutation of mutations.slice(0, 2)) {
      expect(mutation.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallet', 'assets'] });
      expect(mutation.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['wallet', 'transactions'],
      });
    }
    expect(mutations[2].invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['wallet', 'assets'],
    });

    mutations.forEach(({ unmount }) => unmount());
  });

  it('updates the address book cache from the whitelist settings response', async () => {
    const response = { items: [], total: 0, whitelistEnabled: true };
    vi.mocked(walletApi.updateAddressBookSettings).mockResolvedValue(response);
    const mutation = await runMutation(() => queries.useWalletAddressBookSettingsMutation(), {
      whitelistEnabled: true,
      idempotencyKey: 'address-settings-1',
    });

    expect(mutation.setQueryData).toHaveBeenCalledWith(
      queries.walletQueryKeys.addressBook,
      response,
    );
    mutation.unmount();
  });
});
