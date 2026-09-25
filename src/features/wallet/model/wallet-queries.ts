import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api/wallet-api';
import type {
  DustConversionQuoteRequest,
  DustConversionRequest,
  PortfolioAnalyticsPeriod,
  WalletTransactionFilters,
  WalletTransferRequest,
  WalletWithdrawalRequest,
} from '../model/wallet-types';

export const walletQueryKeys = {
  all: ['wallet'] as const,
  assets: ['wallet', 'assets'] as const,
  accounts: ['wallet', 'accounts'] as const,
  transactions: (filters: WalletTransactionFilters = {}) =>
    ['wallet', 'transactions', filters] as const,
  transaction: (id: string) => ['wallet', 'transactions', id] as const,
  depositNetworks: (asset: string) => ['wallet', 'deposit-networks', asset] as const,
  withdrawalNetworks: (asset: string) => ['wallet', 'withdrawal-networks', asset] as const,
  addressBook: ['wallet', 'address-book'] as const,
  portfolioAnalytics: (period: PortfolioAnalyticsPeriod) =>
    ['wallet', 'portfolio-analytics', period] as const,
  dustConversionQuote: (request: DustConversionQuoteRequest) =>
    ['wallet', 'dust-conversion-quote', request] as const,
};

export function useWalletAssetsQuery() {
  return useQuery({
    queryKey: walletQueryKeys.assets,
    queryFn: ({ signal }) => walletApi.getAssets(signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useWalletAccountsQuery() {
  return useQuery({
    queryKey: walletQueryKeys.accounts,
    queryFn: ({ signal }) => walletApi.getAccounts(signal),
    staleTime: 5_000,
  });
}

export function useWalletTransactionsQuery(filters: WalletTransactionFilters = {}) {
  return useQuery({
    queryKey: walletQueryKeys.transactions(filters),
    queryFn: ({ signal }) => walletApi.getTransactions(filters, signal),
    staleTime: 5_000,
  });
}

export function useWalletTransactionQuery(id: string | undefined) {
  return useQuery({
    queryKey: walletQueryKeys.transaction(id ?? ''),
    queryFn: ({ signal }) => walletApi.getTransaction(id!, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useWalletDepositNetworksQuery(asset: string | undefined) {
  return useQuery({
    queryKey: walletQueryKeys.depositNetworks(asset ?? ''),
    queryFn: ({ signal }) => walletApi.getDepositNetworks(asset!, signal),
    enabled: Boolean(asset),
    staleTime: 60_000,
  });
}

export function useWalletWithdrawalNetworksQuery(asset: string | undefined) {
  return useQuery({
    queryKey: walletQueryKeys.withdrawalNetworks(asset ?? ''),
    queryFn: ({ signal }) => walletApi.getWithdrawalNetworks(asset!, signal),
    enabled: Boolean(asset),
    staleTime: 60_000,
  });
}

export function useWalletAddressBookQuery() {
  return useQuery({
    queryKey: walletQueryKeys.addressBook,
    queryFn: ({ signal }) => walletApi.getAddressBook(signal),
    staleTime: 30_000,
  });
}

export function useWalletAddressBookCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof walletApi.createAddressBookEntry>[0];
      idempotencyKey: string;
    }) => walletApi.createAddressBookEntry(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.addressBook });
    },
  });
}

export function useWalletAddressBookUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      idempotencyKey,
    }: {
      id: string;
      request: Parameters<typeof walletApi.updateAddressBookEntry>[1];
      idempotencyKey: string;
    }) => walletApi.updateAddressBookEntry(id, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.addressBook });
    },
  });
}

export function useWalletAddressBookDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      walletApi.deleteAddressBookEntry(id, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.addressBook });
    },
  });
}

export function useWalletAddressBookSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      whitelistEnabled,
      idempotencyKey,
    }: {
      whitelistEnabled: boolean;
      idempotencyKey: string;
    }) => walletApi.updateAddressBookSettings(whitelistEnabled, idempotencyKey),
    onSuccess: async (response) => {
      queryClient.setQueryData(walletQueryKeys.addressBook, response);
    },
  });
}

export function useWalletWithdrawalChallengeMutation() {
  return useMutation({
    mutationFn: ({
      request,
    }: {
      request: Parameters<typeof walletApi.createWithdrawalChallenge>[0];
    }) => walletApi.createWithdrawalChallenge(request),
  });
}

export function useWalletWithdrawalVerificationMutation() {
  return useMutation({
    mutationFn: ({ challengeId, code }: { challengeId: string; code: string }) =>
      walletApi.verifyWithdrawalChallenge(challengeId, code),
  });
}

export function useWalletPortfolioAnalyticsQuery(period: PortfolioAnalyticsPeriod) {
  return useQuery({
    queryKey: walletQueryKeys.portfolioAnalytics(period),
    queryFn: ({ signal }) => walletApi.getPortfolioAnalytics(period, signal),
    staleTime: 60_000,
  });
}

export function useWalletDustConversionQuoteQuery(request: DustConversionQuoteRequest) {
  return useQuery({
    queryKey: walletQueryKeys.dustConversionQuote(request),
    queryFn: ({ signal }) => walletApi.getDustConversionQuote(request, signal),
    enabled: request.sourceAssetIds.length > 0,
    staleTime: 30_000,
  });
}

export function useWalletDustConversionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: DustConversionRequest;
      idempotencyKey: string;
    }) => walletApi.createDustConversion(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.assets });
    },
  });
}

export function useWalletTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: WalletTransferRequest;
      idempotencyKey: string;
    }) => walletApi.createTransfer(request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletQueryKeys.assets }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      ]);
    },
  });
}

export function useWalletWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: WalletWithdrawalRequest;
      idempotencyKey: string;
    }) => walletApi.createWithdrawal(request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletQueryKeys.assets }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      ]);
    },
  });
}
