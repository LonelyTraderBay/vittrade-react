import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/session/useAuth';
import { supportApi } from '../api/support-api';
import type { CreateTicketRequest } from './support-types';

export const supportQueryKeys = {
  all: ['support'] as const,
  news: ['support', 'news'] as const,
  notifications: ['support', 'notifications'] as const,
  help: ['support', 'help'] as const,
  tickets: ['support', 'tickets'] as const,
};
export function useNewsQuery() {
  const { isLoading } = useAuth();
  return useQuery({
    // Public routes can mount before bootstrap clears the previous identity cache.
    enabled: !isLoading,
    queryKey: supportQueryKeys.news,
    queryFn: ({ signal }) => supportApi.listNews(signal),
    retry: false,
    staleTime: 60_000,
  });
}
export function useNotificationsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: supportQueryKeys.notifications,
    queryFn: ({ signal }) => supportApi.listNotifications(signal),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 10_000,
  });
}

export function useUnreadNotificationsCount() {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();
  const canRead = !isLoading && isAuthenticated && hasPermission('notifications:read');
  const query = useNotificationsQuery({ enabled: canRead });

  if (!canRead || query.isError) return 0;
  return query.data?.items.filter((notification) => !notification.isRead).length ?? 0;
}

export function useMarkNotificationReadMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      supportApi.markNotificationRead(id, idempotencyKey),
    onSuccess: async () => client.invalidateQueries({ queryKey: supportQueryKeys.notifications }),
  });
}
export function useHelpQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: supportQueryKeys.help,
    queryFn: ({ signal }) => supportApi.listHelp(signal),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 300_000,
  });
}
export function useSupportTicketsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: supportQueryKeys.tickets,
    queryFn: ({ signal }) => supportApi.listTickets(signal),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 15_000,
  });
}
export function useCreateSupportTicketMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: CreateTicketRequest;
      idempotencyKey: string;
    }) => supportApi.createTicket(request, idempotencyKey),
    onSuccess: async () => client.invalidateQueries({ queryKey: supportQueryKeys.tickets }),
  });
}
