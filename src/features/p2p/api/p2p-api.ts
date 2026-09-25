import { apiClient } from '@/shared/api/app-client';
import type { P2PApi } from './p2p-api-contract';
export type { P2PApi } from './p2p-api-contract';
import {
  adSchema,
  responseSchema,
  overviewSchema,
  orderReceiptSchema,
  orderSchema,
  chatResponseSchema,
  achievementsResponseSchema,
  ordersResponseSchema,
  releaseChallengeSchema,
  releaseVerificationSchema,
  twoFactorSettingsSchema,
  authenticatorSetupChallengeSchema,
  paymentMethodSchema,
  paymentMethodsResponseSchema,
  disputeSchema,
  disputesResponseSchema,
  dashboardResponseSchema,
  blacklistEntrySchema,
  blacklistResponseSchema,
  reviewsResponseSchema,
  adAnalyticsSchema,
  merchantProfileSchema,
  reportReceiptSchema,
} from './p2p-api-schemas';

export function createP2PApi(client: typeof apiClient = apiClient): P2PApi {
  return {
    async listAds(query, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/ads', query, signal },
        { retries: 2 },
      );
      return responseSchema.parse(response);
    },

    async createAd(request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/ads',
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return adSchema.parse(response);
    },

    async updateAdStatus(adId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'PATCH',
          path: `/p2p/ads/${encodeURIComponent(adId)}`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return adSchema.parse(response);
    },

    async deleteAd(adId, idempotencyKey, signal) {
      await client.request<unknown>(
        {
          method: 'DELETE',
          path: `/p2p/ads/${encodeURIComponent(adId)}`,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
    },

    async getOverview(signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/overview', signal },
        { retries: 2 },
      );
      return overviewSchema.parse(response);
    },
    async getDashboard(signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/dashboard', signal },
        { retries: 2 },
      );
      return dashboardResponseSchema.parse(response);
    },
    async listBlacklist(query, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/blacklist', query, signal },
        { retries: 2 },
      );
      return blacklistResponseSchema.parse(response);
    },
    async createBlacklistEntry(request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/blacklist',
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return blacklistEntrySchema.parse(response);
    },
    async removeBlacklistEntry(entryId, idempotencyKey, signal) {
      await client.request<unknown>(
        {
          method: 'DELETE',
          path: `/p2p/blacklist/${encodeURIComponent(entryId)}`,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
    },
    async listReviews(scope = 'received', signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/reviews', query: { scope }, signal },
        { retries: 2 },
      );
      return reviewsResponseSchema.parse(response);
    },
    async getChat(orderId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/orders/${encodeURIComponent(orderId)}/chat`, signal },
        { retries: 2 },
      );
      return chatResponseSchema.parse(response);
    },
    async sendChatMessage(orderId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/chat/messages`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return chatResponseSchema.parse(response);
    },
    async getAchievements(signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/achievements', signal },
        { retries: 2 },
      );
      return achievementsResponseSchema.parse(response);
    },
    async getAdAnalytics(adId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/ads/${encodeURIComponent(adId)}/analytics`, signal },
        { retries: 2 },
      );
      return adAnalyticsSchema.parse(response);
    },
    async getMerchantProfile(merchantId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/merchants/${encodeURIComponent(merchantId)}`, signal },
        { retries: 2 },
      );
      return merchantProfileSchema.parse(response);
    },
    async reportMerchant(request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/reports/merchants',
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return reportReceiptSchema.parse(response);
    },
    async getAd(adId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/ads/${encodeURIComponent(adId)}`, signal },
        { retries: 2 },
      );
      return adSchema.parse(response);
    },
    async createOrder(request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/orders',
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return orderReceiptSchema.parse(response);
    },
    async getOrder(orderId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/orders/${encodeURIComponent(orderId)}`, signal },
        { retries: 2 },
      );
      return orderSchema.parse(response);
    },
    async listOrders(query, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/orders', query, signal },
        { retries: 2 },
      );
      return ordersResponseSchema.parse(response);
    },
    async markOrderPaid(orderId, signal) {
      const response = await client.request<unknown>(
        { method: 'POST', path: `/p2p/orders/${encodeURIComponent(orderId)}/mark-paid`, signal },
        { retries: 0 },
      );
      return orderSchema.parse(response);
    },
    async createReleaseChallenge(orderId, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/release/challenge`,
          signal,
        },
        { retries: 0 },
      );
      return releaseChallengeSchema.parse(response);
    },
    async verifyReleaseChallenge(orderId, challengeId, code, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/release/challenge/${encodeURIComponent(challengeId)}/verify`,
          body: { code },
          signal,
        },
        { retries: 0 },
      );
      return releaseVerificationSchema.parse(response);
    },
    async releaseOrder(orderId, verificationToken, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/release`,
          body: { verificationToken },
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return orderSchema.parse(response);
    },
    async get2FASettings(signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/security/2fa/settings', signal },
        { retries: 2 },
      );
      return twoFactorSettingsSchema.parse(response);
    },
    async toggle2FAMethod(methodId, enabled, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'PATCH',
          path: `/p2p/security/2fa/methods/${encodeURIComponent(methodId)}`,
          body: { enabled },
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return twoFactorSettingsSchema.parse(response);
    },
    async setPrimary2FAMethod(methodId, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/security/2fa/primary',
          body: { methodId },
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return twoFactorSettingsSchema.parse(response);
    },
    async update2FAThreshold(thresholdId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'PATCH',
          path: `/p2p/security/2fa/thresholds/${encodeURIComponent(thresholdId)}`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return twoFactorSettingsSchema.parse(response);
    },
    async beginAuthenticatorSetup(signal) {
      const response = await client.request<unknown>(
        { method: 'POST', path: '/p2p/security/2fa/authenticator/setup', signal },
        { retries: 0 },
      );
      return authenticatorSetupChallengeSchema.parse(response);
    },
    async confirmAuthenticatorSetup(code, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/security/2fa/authenticator/confirm',
          body: { code },
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return twoFactorSettingsSchema.parse(response);
    },
    async cancelOrder(orderId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/cancel`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return orderSchema.parse(response);
    },
    async rateOrder(orderId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/rate`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return orderSchema.parse(response);
    },
    async submitPaymentProof(orderId, request, idempotencyKey, signal) {
      const body = new FormData();
      request.files.forEach((file) => body.append('files', file, file.name));
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/orders/${encodeURIComponent(orderId)}/payment-proof`,
          body,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return orderSchema.parse(response);
    },
    async listPaymentMethods(signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/payment-methods', signal },
        { retries: 2 },
      );
      return paymentMethodsResponseSchema.parse(response);
    },
    async createPaymentMethod(request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: '/p2p/payment-methods',
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return paymentMethodSchema.parse(response);
    },
    async updatePaymentMethod(id, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'PATCH',
          path: `/p2p/payment-methods/${encodeURIComponent(id)}`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return paymentMethodSchema.parse(response);
    },
    async deletePaymentMethod(id, idempotencyKey, signal) {
      await client.request<unknown>(
        {
          method: 'DELETE',
          path: `/p2p/payment-methods/${encodeURIComponent(id)}`,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
    },
    async listDisputes(query, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: '/p2p/disputes', query, signal },
        { retries: 2 },
      );
      return disputesResponseSchema.parse(response);
    },
    async getDispute(disputeId, signal) {
      const response = await client.request<unknown>(
        { method: 'GET', path: `/p2p/disputes/${encodeURIComponent(disputeId)}`, signal },
        { retries: 2 },
      );
      return disputeSchema.parse(response);
    },
    async sendDisputeMessage(disputeId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/disputes/${encodeURIComponent(disputeId)}/messages`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return disputeSchema.parse(response);
    },
    async escalateDispute(disputeId, request, idempotencyKey, signal) {
      const response = await client.request<unknown>(
        {
          method: 'POST',
          path: `/p2p/disputes/${encodeURIComponent(disputeId)}/escalate`,
          body: request,
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      );
      return disputeSchema.parse(response);
    },
  };
}

export const p2pApi = createP2PApi();
