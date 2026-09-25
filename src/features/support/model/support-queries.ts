import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: supportQueryKeys.news,
    queryFn: ({ signal }) => supportApi.listNews(signal),
    staleTime: 60_000,
  });
}
export function useNotificationsQuery() {
  return useQuery({
    queryKey: supportQueryKeys.notifications,
    queryFn: ({ signal }) => supportApi.listNotifications(signal),
    staleTime: 10_000,
  });
}
export function useMarkNotificationReadMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      supportApi.markNotificationRead(id, idempotencyKey),
    onSuccess: async () => client.invalidateQueries({ queryKey: supportQueryKeys.notifications }),
  });
}
export function useHelpQuery() {
  return useQuery({
    queryKey: supportQueryKeys.help,
    queryFn: ({ signal }) => supportApi.listHelp(signal),
    staleTime: 300_000,
  });
}
export function useSupportTicketsQuery() {
  return useQuery({
    queryKey: supportQueryKeys.tickets,
    queryFn: ({ signal }) => supportApi.listTickets(signal),
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
