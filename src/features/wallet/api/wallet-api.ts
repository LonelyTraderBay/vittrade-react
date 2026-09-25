import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  DustConversionQuote,
  DustConversionQuoteRequest,
  DustConversionReceipt,
  DustConversionRequest,
  WalletAsset,
  PortfolioAnalyticsPeriod,
  PortfolioAnalyticsResponse,
  WalletAccountsResponse,
  WalletAssetsResponse,
  WalletDepositNetwork,
  WalletSummary,
  WalletTransaction,
  WalletTransactionFilters,
  WalletTransactionsResponse,
  WalletTransferReceipt,
  WalletTransferRequest,
  WalletWithdrawalReceipt,
  WalletWithdrawalChallenge,
  WalletWithdrawalChallengeRequest,
  WalletWithdrawalVerification,
  WalletWithdrawalRequest,
  WalletWithdrawalNetwork,
  WalletAddressBookCreateRequest,
  WalletAddressBookItem,
  WalletAddressBookResponse,
  WalletAddressBookUpdateRequest,
} from '../model/wallet-types';

const walletAssetSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  balance: z.number().nonnegative(),
  available: z.number().nonnegative(),
  frozen: z.number().nonnegative(),
  inOrder: z.number().nonnegative(),
  usdValue: z.number().nonnegative(),
  change24h: z.number(),
  logoColor: z.string(),
});

const walletSummarySchema = z.object({
  totalUsd: z.number().nonnegative(),
  totalBtc: z.number().nonnegative(),
  availableUsd: z.number().nonnegative(),
  inOrderUsd: z.number().nonnegative(),
  frozenUsd: z.number().nonnegative(),
});

const walletAssetsResponseSchema = z.object({
  items: z.array(walletAssetSchema),
  summary: walletSummarySchema,
});

const walletAccountsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.enum(['spot', 'funding', 'futures']),
      name: z.string(),
      balanceUsd: z.number().nonnegative(),
    }),
  ),
});

const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(['deposit', 'withdraw', 'trade_buy', 'trade_sell', 'p2p_buy', 'p2p_sell']),
  asset: z.string(),
  amount: z.number().nonnegative(),
  status: z.enum(['completed', 'pending', 'failed']),
  txHash: z.string().optional(),
  address: z.string().optional(),
  network: z.string().optional(),
  createdAt: z.string(),
  fee: z.number().nonnegative().optional(),
});

const transactionsResponseSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number().int().nonnegative(),
  nextCursor: z.string().optional(),
});

const depositNetworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  fee: z.string(),
  minDeposit: z.number().nonnegative(),
  address: z.string(),
  arrivalTime: z.string(),
  confirmations: z.number().int().nonnegative(),
  memo: z.string().optional(),
  memoLabel: z.string().optional(),
});

const withdrawalNetworkSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    fee: z.number().nonnegative(),
    minWithdraw: z.number().nonnegative(),
    maxWithdraw: z.number().positive(),
    requiresMemo: z.boolean().optional(),
    memoLabel: z.string().optional(),
    memoPlaceholder: z.string().optional(),
  })
  .refine((network) => network.maxWithdraw >= network.minWithdraw, {
    path: ['maxWithdraw'],
    message: 'Maximum withdrawal must be greater than or equal to the minimum.',
  });

const transferReceiptSchema = z
  .object({
    id: z.string(),
    fromWallet: z.enum(['spot', 'funding', 'futures']),
    toWallet: z.enum(['spot', 'funding', 'futures']),
    asset: z.string(),
    amount: z.number().positive(),
    status: z.enum(['completed', 'pending']),
    createdAt: z.string().datetime({ offset: true }),
  })
  .refine((receipt) => receipt.fromWallet !== receipt.toWallet, {
    path: ['toWallet'],
    message: 'Wallet transfer source and destination must differ.',
  });

const withdrawalReceiptSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  asset: z.string(),
  amount: z.number().positive(),
  status: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.string().datetime({ offset: true }),
});

const withdrawalChallengeSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['totp', 'sms']),
  maskedDestination: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }),
});

const withdrawalVerificationSchema = z.object({
  verificationToken: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }),
});

const addressBookItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  address: z.string().min(1),
  network: z.string().min(1),
  asset: z.string().min(1),
  memo: z.string().optional(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
  lastUsed: z.string().optional(),
  isWhitelisted: z.boolean(),
});

const addressBookResponseSchema = z.object({
  items: z.array(addressBookItemSchema),
  total: z.number().int().nonnegative(),
  whitelistEnabled: z.boolean(),
});

const portfolioAnalyticsResponseSchema = z.object({
  period: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']),
  history: z.array(
    z.object({
      timestamp: z.string(),
      value: z.number().nonnegative(),
      pnl: z.number(),
    }),
  ),
  monthlyPnl: z.array(z.object({ month: z.string(), pnl: z.number() })),
  topPerformers: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      change: z.number(),
      usd: z.number(),
      color: z.string(),
    }),
  ),
  worstPerformers: z.array(
    z.object({
      symbol: z.string(),
      name: z.string(),
      change: z.number(),
      usd: z.number(),
      color: z.string(),
    }),
  ),
  totalTrades: z.number().int().nonnegative(),
  totalFeesUsd: z.number().nonnegative(),
});

const dustConversionQuoteSchema = z.object({
  targetAsset: z.string(),
  grossUsd: z.number().nonnegative(),
  feePct: z.number().nonnegative(),
  feeUsd: z.number().nonnegative(),
  receivedUsd: z.number().nonnegative(),
  targetAmount: z.number().nonnegative(),
});

const dustConversionReceiptSchema = dustConversionQuoteSchema.extend({
  id: z.string(),
  status: z.enum(['completed', 'pending']),
  createdAt: z.string(),
});

export interface WalletApi {
  getAssets(signal?: AbortSignal): Promise<WalletAssetsResponse>;
  getAccounts(signal?: AbortSignal): Promise<WalletAccountsResponse>;
  getTransactions(
    filters?: WalletTransactionFilters,
    signal?: AbortSignal,
  ): Promise<WalletTransactionsResponse>;
  getTransaction(id: string, signal?: AbortSignal): Promise<WalletTransaction>;
  getDepositNetworks(asset: string, signal?: AbortSignal): Promise<WalletDepositNetwork[]>;
  getWithdrawalNetworks(asset: string, signal?: AbortSignal): Promise<WalletWithdrawalNetwork[]>;
  getAddressBook(signal?: AbortSignal): Promise<WalletAddressBookResponse>;
  createAddressBookEntry(
    request: WalletAddressBookCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<WalletAddressBookItem>;
  updateAddressBookEntry(
    id: string,
    request: WalletAddressBookUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<WalletAddressBookItem>;
  deleteAddressBookEntry(id: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
  updateAddressBookSettings(
    whitelistEnabled: boolean,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<WalletAddressBookResponse>;
  createWithdrawalChallenge(
    request: WalletWithdrawalChallengeRequest,
    signal?: AbortSignal,
  ): Promise<WalletWithdrawalChallenge>;
  verifyWithdrawalChallenge(
    challengeId: string,
    code: string,
    signal?: AbortSignal,
  ): Promise<WalletWithdrawalVerification>;
  createTransfer(
    request: WalletTransferRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<WalletTransferReceipt>;
  createWithdrawal(
    request: WalletWithdrawalRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<WalletWithdrawalReceipt>;
  getPortfolioAnalytics(
    period: PortfolioAnalyticsPeriod,
    signal?: AbortSignal,
  ): Promise<PortfolioAnalyticsResponse>;
  getDustConversionQuote(
    request: DustConversionQuoteRequest,
    signal?: AbortSignal,
  ): Promise<DustConversionQuote>;
  createDustConversion(
    request: DustConversionRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<DustConversionReceipt>;
}

export const walletApi: WalletApi = {
  async getAssets(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/wallet/assets', signal },
      { retries: 2 },
    );
    return walletAssetsResponseSchema.parse(response);
  },
  async getAccounts(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/wallet/accounts', signal },
      { retries: 2 },
    );
    return walletAccountsResponseSchema.parse(response);
  },
  async getTransactions(filters = {}, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/wallet/transactions',
        query: {
          asset: filters.asset,
          type: filters.type,
          status: filters.status,
          cursor: filters.cursor,
          limit: filters.limit,
        },
        signal,
      },
      { retries: 2 },
    );
    return transactionsResponseSchema.parse(response);
  },
  async getTransaction(id, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: `/wallet/transactions/${encodeURIComponent(id)}`, signal },
      { retries: 2 },
    );
    return transactionSchema.parse(response);
  },
  async getDepositNetworks(asset, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/wallet/deposit/networks',
        query: { asset },
        signal,
      },
      { retries: 2 },
    );
    return z.object({ networks: z.array(depositNetworkSchema) }).parse(response).networks;
  },
  async getWithdrawalNetworks(asset, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/wallet/withdrawal/networks',
        query: { asset },
        signal,
      },
      { retries: 2 },
    );
    return z.object({ networks: z.array(withdrawalNetworkSchema) }).parse(response).networks;
  },
  async getAddressBook(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/wallet/address-book', signal },
      { retries: 2 },
    );
    return addressBookResponseSchema.parse(response);
  },
  async createAddressBookEntry(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/wallet/address-book',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return addressBookItemSchema.parse(response);
  },
  async updateAddressBookEntry(id, request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: `/wallet/address-book/${encodeURIComponent(id)}`,
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return addressBookItemSchema.parse(response);
  },
  async deleteAddressBookEntry(id, idempotencyKey, signal) {
    await apiClient.request<unknown>(
      {
        method: 'DELETE',
        path: `/wallet/address-book/${encodeURIComponent(id)}`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
  },
  async updateAddressBookSettings(whitelistEnabled, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: '/wallet/address-book/settings',
        body: { whitelistEnabled },
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return addressBookResponseSchema.parse(response);
  },
  async createWithdrawalChallenge(request, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/wallet/withdrawals/challenge',
        body: request,
        signal,
      },
      { retries: 0 },
    );
    return withdrawalChallengeSchema.parse(response);
  },
  async verifyWithdrawalChallenge(challengeId, code, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: `/wallet/withdrawals/challenge/${encodeURIComponent(challengeId)}/verify`,
        body: { code },
        signal,
      },
      { retries: 0 },
    );
    return withdrawalVerificationSchema.parse(response);
  },
  async createTransfer(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/wallet/transfers',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return transferReceiptSchema.parse(response);
  },
  async createWithdrawal(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/wallet/withdrawals',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return withdrawalReceiptSchema.parse(response);
  },
  async getPortfolioAnalytics(period, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/wallet/analytics/portfolio',
        query: { period },
        signal,
      },
      { retries: 2 },
    );
    return portfolioAnalyticsResponseSchema.parse(response);
  },
  async getDustConversionQuote(request, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/wallet/dust-conversions/quote',
        query: {
          assets: request.sourceAssetIds.join(','),
          targetAsset: request.targetAsset,
        },
        signal,
      },
      { retries: 2 },
    );
    return dustConversionQuoteSchema.parse(response);
  },
  async createDustConversion(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/wallet/dust-conversions',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return dustConversionReceiptSchema.parse(response);
  },
};

export type { WalletAsset, WalletAssetsResponse, WalletSummary };
