import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type {
  P2PAdsQuery,
  P2PAdCreateRequest,
  P2PAdStatusUpdateRequest,
  P2PCancelOrderRequest,
  P2POrderRequest,
  P2POrdersQuery,
  P2PRateOrderRequest,
  P2PPaymentProofRequest,
  P2PDisputesQuery,
  P2PDisputeMessageRequest,
  P2PDisputeEscalationRequest,
  P2PBlacklistCreateRequest,
  P2PBlacklistQuery,
  P2PReviewScope,
  P2PChatMessageRequest,
  P2PReportCreateRequest,
} from './p2p-types';

export const p2pQueryKeys = {
  all: ['p2p'] as const,
  adsRoot: ['p2p', 'ads'] as const,
  ads: (query: P2PAdsQuery = {}) => ['p2p', 'ads', query] as const,
  overview: () => ['p2p', 'overview'] as const,
  dashboard: () => ['p2p', 'dashboard'] as const,
  blacklistRoot: ['p2p', 'blacklist'] as const,
  blacklist: (query: P2PBlacklistQuery = {}) => ['p2p', 'blacklist', query] as const,
  reviews: (scope: P2PReviewScope = 'received') => ['p2p', 'reviews', scope] as const,
  chat: (orderId: string) => ['p2p', 'chat', orderId] as const,
  achievements: () => ['p2p', 'achievements'] as const,
  adAnalytics: (adId: string) => ['p2p', 'ad-analytics', adId] as const,
  merchantProfile: (merchantId: string) => ['p2p', 'merchant', merchantId] as const,
  ad: (adId: string) => ['p2p', 'ad', adId] as const,
  order: (orderId: string) => ['p2p', 'order', orderId] as const,
  ordersRoot: ['p2p', 'orders'] as const,
  orders: (query: P2POrdersQuery = {}) => ['p2p', 'orders', query] as const,
  paymentMethods: ['p2p', 'payment-methods'] as const,
  disputesRoot: ['p2p', 'disputes'] as const,
  disputes: (query: P2PDisputesQuery = {}) => ['p2p', 'disputes', query] as const,
  dispute: (disputeId: string) => ['p2p', 'dispute', disputeId] as const,
  twoFactorSettings: () => ['p2p', 'security', '2fa'] as const,
};

export function useP2PAdsQuery(query: P2PAdsQuery = {}) {
  return useQuery({
    queryKey: p2pQueryKeys.ads(query),
    queryFn: ({ signal }) => p2pApi.listAds(query, signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useP2PAdCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PAdCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.createAd(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.adsRoot });
    },
  });
}

export function useP2PAdStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adId,
      request,
      idempotencyKey,
    }: {
      adId: string;
      request: P2PAdStatusUpdateRequest;
      idempotencyKey: string;
    }) => p2pApi.updateAdStatus(adId, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.adsRoot });
    },
  });
}

export function useP2PAdDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, idempotencyKey }: { adId: string; idempotencyKey: string }) =>
      p2pApi.deleteAd(adId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.adsRoot });
    },
  });
}

export function useP2POverviewQuery() {
  return useQuery({
    queryKey: p2pQueryKeys.overview(),
    queryFn: ({ signal }) => p2pApi.getOverview(signal),
    staleTime: 30_000,
  });
}

export function useP2PDashboardQuery() {
  return useQuery({
    queryKey: p2pQueryKeys.dashboard(),
    queryFn: ({ signal }) => p2pApi.getDashboard(signal),
    staleTime: 30_000,
  });
}

export function useP2PBlacklistQuery(query: P2PBlacklistQuery = {}) {
  return useQuery({
    queryKey: p2pQueryKeys.blacklist(query),
    queryFn: ({ signal }) => p2pApi.listBlacklist(query, signal),
    staleTime: 15_000,
  });
}

export function useP2PBlacklistCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PBlacklistCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.createBlacklistEntry(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.blacklistRoot });
    },
  });
}

export function useP2PBlacklistRemoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, idempotencyKey }: { entryId: string; idempotencyKey: string }) =>
      p2pApi.removeBlacklistEntry(entryId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.blacklistRoot });
    },
  });
}

export function useP2PReviewsQuery(scope: P2PReviewScope = 'received') {
  return useQuery({
    queryKey: p2pQueryKeys.reviews(scope),
    queryFn: ({ signal }) => p2pApi.listReviews(scope, signal),
    staleTime: 30_000,
  });
}

export function useP2PChatQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.chat(orderId ?? ''),
    queryFn: ({ signal }) => p2pApi.getChat(orderId!, signal),
    enabled: Boolean(orderId),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useP2PChatMessageMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PChatMessageRequest;
      idempotencyKey: string;
    }) => p2pApi.sendChatMessage(orderId!, request, idempotencyKey),
    onSuccess: (chat) => {
      queryClient.setQueryData(p2pQueryKeys.chat(orderId ?? ''), chat);
    },
  });
}

export function useP2PAchievementsQuery() {
  return useQuery({
    queryKey: p2pQueryKeys.achievements(),
    queryFn: ({ signal }) => p2pApi.getAchievements(signal),
    staleTime: 30_000,
  });
}

export function useP2PAdAnalyticsQuery(adId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.adAnalytics(adId ?? ''),
    queryFn: ({ signal }) => p2pApi.getAdAnalytics(adId!, signal),
    enabled: Boolean(adId),
    staleTime: 30_000,
  });
}

export function useP2PMerchantProfileQuery(merchantId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.merchantProfile(merchantId ?? ''),
    queryFn: ({ signal }) => p2pApi.getMerchantProfile(merchantId!, signal),
    enabled: Boolean(merchantId),
    staleTime: 30_000,
  });
}

export function useP2PMerchantReportMutation() {
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PReportCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.reportMerchant(request, idempotencyKey),
  });
}

export function useP2PAdQuery(adId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.ad(adId ?? ''),
    queryFn: ({ signal }) => p2pApi.getAd(adId!, signal),
    enabled: Boolean(adId),
    staleTime: 5_000,
  });
}

export function useP2POrderQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.order(orderId ?? ''),
    queryFn: ({ signal }) => p2pApi.getOrder(orderId!, signal),
    enabled: Boolean(orderId),
    staleTime: 5_000,
  });
}

export function useP2POrdersQuery(query: P2POrdersQuery = {}) {
  return useQuery({
    queryKey: p2pQueryKeys.orders(query),
    queryFn: ({ signal }) => p2pApi.listOrders(query, signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useP2POrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2POrderRequest;
      idempotencyKey: string;
    }) => p2pApi.createOrder(request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.adsRoot }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PMarkPaidMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => p2pApi.markOrderPaid(orderId!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.order(orderId ?? '') }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PReleaseOrderMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      verificationToken,
      idempotencyKey,
    }: {
      verificationToken: string;
      idempotencyKey: string;
    }) => p2pApi.releaseOrder(orderId!, verificationToken, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.order(orderId ?? '') }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PReleaseChallengeMutation(orderId: string | undefined) {
  return useMutation({
    mutationFn: () => p2pApi.createReleaseChallenge(orderId!),
  });
}

export function useP2PReleaseVerificationMutation(orderId: string | undefined) {
  return useMutation({
    mutationFn: ({ challengeId, code }: { challengeId: string; code: string }) =>
      p2pApi.verifyReleaseChallenge(orderId!, challengeId, code),
  });
}

export function useP2P2FASettingsQuery() {
  return useQuery({
    queryKey: p2pQueryKeys.twoFactorSettings(),
    queryFn: ({ signal }) => p2pApi.get2FASettings(signal),
    staleTime: 30_000,
  });
}

export function useP2P2FAMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      methodId,
      enabled,
      idempotencyKey,
    }: {
      methodId: Parameters<typeof p2pApi.toggle2FAMethod>[0];
      enabled: boolean;
      idempotencyKey: string;
    }) => p2pApi.toggle2FAMethod(methodId, enabled, idempotencyKey),
    onSuccess: (settings) => {
      queryClient.setQueryData(p2pQueryKeys.twoFactorSettings(), settings);
    },
  });
}

export function useP2P2FAPrimaryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      methodId,
      idempotencyKey,
    }: {
      methodId: Parameters<typeof p2pApi.setPrimary2FAMethod>[0];
      idempotencyKey: string;
    }) => p2pApi.setPrimary2FAMethod(methodId, idempotencyKey),
    onSuccess: (settings) => {
      queryClient.setQueryData(p2pQueryKeys.twoFactorSettings(), settings);
    },
  });
}

export function useP2P2FAThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      thresholdId,
      request,
      idempotencyKey,
    }: {
      thresholdId: Parameters<typeof p2pApi.update2FAThreshold>[0];
      request: Parameters<typeof p2pApi.update2FAThreshold>[1];
      idempotencyKey: string;
    }) => p2pApi.update2FAThreshold(thresholdId, request, idempotencyKey),
    onSuccess: (settings) => {
      queryClient.setQueryData(p2pQueryKeys.twoFactorSettings(), settings);
    },
  });
}

export function useP2PAuthenticatorSetupMutation() {
  return useMutation({
    mutationFn: () => p2pApi.beginAuthenticatorSetup(),
  });
}

export function useP2PAuthenticatorConfirmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, idempotencyKey }: { code: string; idempotencyKey: string }) =>
      p2pApi.confirmAuthenticatorSetup(code, idempotencyKey),
    onSuccess: (settings) => {
      queryClient.setQueryData(p2pQueryKeys.twoFactorSettings(), settings);
    },
  });
}

export function useP2PCancelOrderMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PCancelOrderRequest;
      idempotencyKey: string;
    }) => p2pApi.cancelOrder(orderId!, request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.order(orderId ?? '') }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PRateOrderMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PRateOrderRequest;
      idempotencyKey: string;
    }) => p2pApi.rateOrder(orderId!, request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.order(orderId ?? '') }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PPaymentProofMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PPaymentProofRequest;
      idempotencyKey: string;
    }) => p2pApi.submitPaymentProof(orderId!, request, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.order(orderId ?? '') }),
        queryClient.invalidateQueries({ queryKey: p2pQueryKeys.ordersRoot }),
      ]);
    },
  });
}

export function useP2PPaymentMethodsQuery() {
  return useQuery({
    queryKey: p2pQueryKeys.paymentMethods,
    queryFn: ({ signal }) => p2pApi.listPaymentMethods(signal),
    staleTime: 30_000,
  });
}

export function useP2PPaymentMethodCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof p2pApi.createPaymentMethod>[0];
      idempotencyKey: string;
    }) => p2pApi.createPaymentMethod(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.paymentMethods });
    },
  });
}

export function useP2PPaymentMethodUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      idempotencyKey,
    }: {
      id: string;
      request: Parameters<typeof p2pApi.updatePaymentMethod>[1];
      idempotencyKey: string;
    }) => p2pApi.updatePaymentMethod(id, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.paymentMethods });
    },
  });
}

export function useP2PPaymentMethodDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      p2pApi.deletePaymentMethod(id, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.paymentMethods });
    },
  });
}

export function useP2PDisputesQuery(query: P2PDisputesQuery = {}) {
  return useQuery({
    queryKey: p2pQueryKeys.disputes(query),
    queryFn: ({ signal }) => p2pApi.listDisputes(query, signal),
    staleTime: 15_000,
  });
}

export function useP2PDisputeQuery(disputeId: string | undefined) {
  return useQuery({
    queryKey: p2pQueryKeys.dispute(disputeId ?? ''),
    queryFn: ({ signal }) => p2pApi.getDispute(disputeId!, signal),
    enabled: Boolean(disputeId),
    staleTime: 10_000,
  });
}

export function useP2PDisputeMessageMutation(disputeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PDisputeMessageRequest;
      idempotencyKey: string;
    }) => p2pApi.sendDisputeMessage(disputeId!, request, idempotencyKey),
    onSuccess: async (dispute) => {
      queryClient.setQueryData(p2pQueryKeys.dispute(disputeId ?? ''), dispute);
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.disputesRoot });
    },
  });
}

export function useP2PDisputeEscalationMutation(disputeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PDisputeEscalationRequest;
      idempotencyKey: string;
    }) => p2pApi.escalateDispute(disputeId!, request, idempotencyKey),
    onSuccess: async (dispute) => {
      queryClient.setQueryData(p2pQueryKeys.dispute(disputeId ?? ''), dispute);
      await queryClient.invalidateQueries({ queryKey: p2pQueryKeys.disputesRoot });
    },
  });
}
