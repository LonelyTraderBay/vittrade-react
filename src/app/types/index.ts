/**
 * ══════════════════════════════════════════════════════════
 *  TYPES — Central Export
 * ══════════════════════════════════════════════════════════
 *
 *  Single import point for all types:
 *  import type { User, Order, ArenaRoom } from '@/types';
 */

/* ─── Common Types ─── */
export type {
  // Base Entities
  User,
  Asset,
  Network,
  
  // UI Props
  BaseCardProps,
  BaseButtonProps,
  BaseInputProps,
  
  // State
  LoadingState,
  AsyncState,
  PaginatedData,
  
  // Filters & Sort
  SortDirection,
  SortConfig,
  FilterOption,
  
  // Time & Date
  TimeRange,
  DateRange,
  
  // Charts
  ChartDataPoint,
  OHLCVDataPoint,
  
  // Notifications
  NotificationType,
  Notification,
  
  // API
  ApiResponse,
  ApiError,
  ApiPaginatedResponse,
  
  // Forms
  FormField,
  FormState,
  
  // Modal & Sheets
  SheetConfig,
  
  // Theme
  ColorScheme,
  ThemeColors,
  
  // Utility Types
  PartialBy,
  RequiredBy,
  ValueOf,
  DeepReadonly,
  DeepNonNullable,
} from './common';

/* ─── Trading Types ─── */
export type {
  // Market Data
  TradingPair,
  MarketTicker,
  OrderBook,
  OrderBookEntry,
  
  // Orders
  OrderSide,
  OrderType,
  OrderStatus,
  TimeInForce,
  Order,
  CreateOrderParams,
  
  // Positions & Portfolio
  Position,
  Portfolio,
  
  // Trade History
  Trade,
  
  // Balance
  Balance,
  
  // Charts
  ChartInterval,
  Candlestick,
  ChartIndicator,
  
  // Watchlist
  WatchlistItem,
  Watchlist,
  
  // Transfers
  TransferType,
  TransferStatus,
  Transfer,
  
  // Convert
  ConvertQuote,
  ConvertTransaction,
} from './trading';

/* ─── Arena Types ─── */
export type {
  // Core
  ArenaRoomStatus,
  ArenaRoomVisibility,
  ArenaRoom,
  ArenaRules,
  ArenaCategory,
  
  // Modes
  ArenaMode,
  
  // Participation
  ParticipationStatus,
  ArenaParticipation,
  
  // Points
  PointsTransactionType,
  PointsTransaction,
  
  // Trust & Safety
  TrustMetric,
  CreatorTrust,
  SafetySnapshot,
  
  // Moderation
  ReportType,
  ReportCaseStatus,
  ReportCase,
  BlockedUser,
  
  // Resolution
  ResolutionStatus,
  RoomResolution,
  
  // Studio
  ArenaDraft,
  PublishEligibilityCheck,
  
  // Leaderboard
  LeaderboardMetric,
  LeaderboardEntry,
  
  // Discovery
  ArenaTrendingRoom,
  ArenaFeaturedMode,
} from './arena';

/* ─── Prediction Types ─── */
export type {
  // Events
  PredictionEventStatus,
  PredictionCategory,
  PredictionEvent,
  
  // Outcomes
  PredictionOutcome,
  
  // Orders
  PredictionOrderSide,
  PredictionOrderType,
  PredictionOrderStatus,
  PredictionOrder,
  CreatePredictionOrderParams,
  
  // Positions
  PredictionPosition,
  PredictionPortfolio,
  
  // Trades
  PredictionTrade,
  
  // Market Data
  PredictionMarketData,
  PredictionOrderbook,
  PredictionOrderbookEntry,
  
  // Resolution
  ResolutionSource,
  PredictionResolution,
  
  // Rewards
  RewardType,
  PredictionReward,
  
  // Leaderboard
  PredictionLeaderboardMetric,
  PredictionLeaderboardEntry,
  
  // Activity
  ActivityType,
  PredictionActivity,
  
  // Comments
  PredictionComment,
} from './prediction';

/* ─── P2P Types ─── */
export type {
  // Ads
  P2PAdType,
  P2PAdStatus,
  P2PAd,
  
  // Payment
  PaymentMethodType,
  P2PPaymentMethod,
  
  // Orders
  P2POrderStatus,
  P2POrder,
  
  // Chat
  P2PMessage,
  
  // Disputes
  DisputeReason,
  DisputeStatus,
  P2PDispute,
  
  // Merchant
  MerchantProfile,
  
  // Reviews
  ReviewType,
  P2PReview,
  
  // Filters
  P2PFilter,
  
  // Stats
  P2PMarketStats,
  
  // Insurance
  ClaimStatus,
  InsuranceClaim,
  InsuranceFundStats,
} from './p2p';
