import type {
  P2PAd,
  P2PAdCreateRequest,
  P2PAdStatusUpdateRequest,
  P2PAdsQuery,
  P2PAdsResponse,
  P2POrderReceipt,
  P2POrderRequest,
  P2PCancelOrderRequest,
  P2PRateOrderRequest,
  P2PPaymentProofRequest,
  P2POrder,
  P2PReleaseChallenge,
  P2PReleaseVerification,
  P2P2FASettingsResponse,
  P2PAuthenticatorSetupChallenge,
  P2P2FAMethodId,
  P2P2FAThresholdId,
  P2POrdersQuery,
  P2POrdersResponse,
  P2POverviewResponse,
  P2PPaymentMethod,
  P2PPaymentMethodCreateRequest,
  P2PPaymentMethodUpdateRequest,
  P2PDispute,
  P2PDisputesQuery,
  P2PDisputesResponse,
  P2PDisputeMessageRequest,
  P2PDisputeEscalationRequest,
  P2PDashboardResponse,
  P2PBlacklistCreateRequest,
  P2PBlacklistEntry,
  P2PBlacklistQuery,
  P2PBlacklistResponse,
  P2PReviewsResponse,
  P2PReviewScope,
  P2PChatResponse,
  P2PChatMessageRequest,
  P2PAchievementsResponse,
  P2PAdAnalytics,
  P2PMerchantProfileResponse,
  P2PReportCreateRequest,
  P2PReportReceipt,
} from '../model/p2p-types';

export interface P2PApi {
  listAds(query?: P2PAdsQuery, signal?: AbortSignal): Promise<P2PAdsResponse>;
  createAd(
    request: P2PAdCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PAd>;
  updateAdStatus(
    adId: string,
    request: P2PAdStatusUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PAd>;
  deleteAd(adId: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
  getAd(adId: string, signal?: AbortSignal): Promise<P2PAd>;
  getOrder(orderId: string, signal?: AbortSignal): Promise<P2POrder>;
  listOrders(query?: P2POrdersQuery, signal?: AbortSignal): Promise<P2POrdersResponse>;
  getOverview(signal?: AbortSignal): Promise<P2POverviewResponse>;
  getDashboard(signal?: AbortSignal): Promise<P2PDashboardResponse>;
  listBlacklist(query?: P2PBlacklistQuery, signal?: AbortSignal): Promise<P2PBlacklistResponse>;
  createBlacklistEntry(
    request: P2PBlacklistCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PBlacklistEntry>;
  removeBlacklistEntry(
    entryId: string,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<void>;
  listReviews(scope?: P2PReviewScope, signal?: AbortSignal): Promise<P2PReviewsResponse>;
  getChat(orderId: string, signal?: AbortSignal): Promise<P2PChatResponse>;
  sendChatMessage(
    orderId: string,
    request: P2PChatMessageRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PChatResponse>;
  getAchievements(signal?: AbortSignal): Promise<P2PAchievementsResponse>;
  getAdAnalytics(adId: string, signal?: AbortSignal): Promise<P2PAdAnalytics>;
  getMerchantProfile(merchantId: string, signal?: AbortSignal): Promise<P2PMerchantProfileResponse>;
  reportMerchant(
    request: P2PReportCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PReportReceipt>;
  createOrder(
    request: P2POrderRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2POrderReceipt>;
  markOrderPaid(orderId: string, signal?: AbortSignal): Promise<P2POrder>;
  createReleaseChallenge(orderId: string, signal?: AbortSignal): Promise<P2PReleaseChallenge>;
  verifyReleaseChallenge(
    orderId: string,
    challengeId: string,
    code: string,
    signal?: AbortSignal,
  ): Promise<P2PReleaseVerification>;
  releaseOrder(
    orderId: string,
    verificationToken: string,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2POrder>;
  get2FASettings(signal?: AbortSignal): Promise<P2P2FASettingsResponse>;
  toggle2FAMethod(
    methodId: P2P2FAMethodId,
    enabled: boolean,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2P2FASettingsResponse>;
  setPrimary2FAMethod(
    methodId: P2P2FAMethodId,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2P2FASettingsResponse>;
  update2FAThreshold(
    thresholdId: P2P2FAThresholdId,
    request: { value?: number; enabled?: boolean },
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2P2FASettingsResponse>;
  beginAuthenticatorSetup(signal?: AbortSignal): Promise<P2PAuthenticatorSetupChallenge>;
  confirmAuthenticatorSetup(
    code: string,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2P2FASettingsResponse>;
  cancelOrder(
    orderId: string,
    request: P2PCancelOrderRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2POrder>;
  submitPaymentProof(
    orderId: string,
    request: P2PPaymentProofRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2POrder>;
  rateOrder(
    orderId: string,
    request: P2PRateOrderRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2POrder>;
  listPaymentMethods(signal?: AbortSignal): Promise<{ items: P2PPaymentMethod[] }>;
  createPaymentMethod(
    request: P2PPaymentMethodCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PPaymentMethod>;
  updatePaymentMethod(
    id: string,
    request: P2PPaymentMethodUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PPaymentMethod>;
  deletePaymentMethod(id: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
  listDisputes(query?: P2PDisputesQuery, signal?: AbortSignal): Promise<P2PDisputesResponse>;
  getDispute(disputeId: string, signal?: AbortSignal): Promise<P2PDispute>;
  sendDisputeMessage(
    disputeId: string,
    request: P2PDisputeMessageRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PDispute>;
  escalateDispute(
    disputeId: string,
    request: P2PDisputeEscalationRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<P2PDispute>;
}
