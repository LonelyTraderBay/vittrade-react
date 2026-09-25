export interface WalletAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  available: number;
  frozen: number;
  inOrder: number;
  usdValue: number;
  change24h: number;
  logoColor: string;
}

export interface WalletSummary {
  totalUsd: number;
  totalBtc: number;
  availableUsd: number;
  inOrderUsd: number;
  frozenUsd: number;
}

export type WalletAccountId = 'spot' | 'funding' | 'futures';

export interface WalletAccount {
  id: WalletAccountId;
  name: string;
  balanceUsd: number;
}

export interface WalletAccountsResponse {
  items: WalletAccount[];
}

export interface WalletAssetsResponse {
  items: WalletAsset[];
  summary: WalletSummary;
}

export type WalletTransactionType =
  'deposit' | 'withdraw' | 'trade_buy' | 'trade_sell' | 'p2p_buy' | 'p2p_sell';

export type WalletTransactionStatus = 'completed' | 'pending' | 'failed';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  asset: string;
  amount: number;
  status: WalletTransactionStatus;
  txHash?: string;
  address?: string;
  network?: string;
  createdAt: string;
  fee?: number;
}

export interface WalletTransactionsResponse {
  items: WalletTransaction[];
  total: number;
  nextCursor?: string;
}

export interface WalletTransactionFilters {
  asset?: string;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  cursor?: string;
  limit?: number;
}

export interface WalletDepositNetwork {
  id: string;
  name: string;
  fee: string;
  minDeposit: number;
  address: string;
  arrivalTime: string;
  confirmations: number;
  memo?: string;
  memoLabel?: string;
}

export interface WalletWithdrawalNetwork {
  id: string;
  name: string;
  fee: number;
  minWithdraw: number;
  maxWithdraw: number;
  requiresMemo?: boolean;
  memoLabel?: string;
  memoPlaceholder?: string;
}

export interface WalletTransferRequest {
  fromWallet: WalletAccountId;
  toWallet: WalletAccountId;
  asset: string;
  amount: number;
}

export interface WalletTransferReceipt extends WalletTransferRequest {
  id: string;
  status: 'completed' | 'pending';
  createdAt: string;
}

export interface WalletWithdrawalRequest {
  asset: string;
  networkId: string;
  address: string;
  memo?: string;
  amount: number;
  verificationToken: string;
}

export type WalletWithdrawalChallengeRequest = Omit<WalletWithdrawalRequest, 'verificationToken'>;

export type WalletWithdrawalChallengeMethod = 'totp' | 'sms';

export interface WalletWithdrawalChallenge {
  id: string;
  method: WalletWithdrawalChallengeMethod;
  maskedDestination?: string;
  expiresAt: string;
}

export interface WalletWithdrawalVerification {
  verificationToken: string;
  expiresAt: string;
}

export interface WalletWithdrawalReceipt {
  id: string;
  transactionId: string;
  asset: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface WalletAddressBookItem {
  id: string;
  label: string;
  address: string;
  network: string;
  asset: string;
  memo?: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
  isWhitelisted: boolean;
}

export interface WalletAddressBookResponse {
  items: WalletAddressBookItem[];
  total: number;
  whitelistEnabled: boolean;
}

export interface WalletAddressBookCreateRequest {
  label: string;
  address: string;
  network: string;
  asset: string;
  memo?: string;
  isWhitelisted: boolean;
}

export interface WalletAddressBookUpdateRequest {
  label?: string;
  memo?: string;
  isFavorite?: boolean;
  isWhitelisted?: boolean;
}

export type PortfolioAnalyticsPeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface PortfolioHistoryPoint {
  timestamp: string;
  value: number;
  pnl: number;
}

export interface PortfolioMonthlyPnl {
  month: string;
  pnl: number;
}

export interface PortfolioPerformer {
  symbol: string;
  name: string;
  change: number;
  usd: number;
  color: string;
}

export interface PortfolioAnalyticsResponse {
  period: PortfolioAnalyticsPeriod;
  history: PortfolioHistoryPoint[];
  monthlyPnl: PortfolioMonthlyPnl[];
  topPerformers: PortfolioPerformer[];
  worstPerformers: PortfolioPerformer[];
  totalTrades: number;
  totalFeesUsd: number;
}

export interface DustConversionQuoteRequest {
  sourceAssetIds: string[];
  targetAsset: string;
}

export interface DustConversionQuote {
  targetAsset: string;
  grossUsd: number;
  feePct: number;
  feeUsd: number;
  receivedUsd: number;
  targetAmount: number;
}

export type DustConversionRequest = DustConversionQuoteRequest;

export interface DustConversionReceipt extends DustConversionQuote {
  id: string;
  status: 'completed' | 'pending';
  createdAt: string;
}
