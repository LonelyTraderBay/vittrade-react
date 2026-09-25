import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  CreateTicketRequest,
  HelpArticle,
  HelpCategory,
  NewsArticle,
  Notification,
  SupportTicket,
} from '../model/support-types';

const newsItem = z.object({
  id: z.string(),
  type: z.enum(['maintenance', 'new_feature', 'promotion', 'security', 'listing', 'general']),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
  publishedAt: z.string(),
  isPinned: z.boolean(),
  tags: z.array(z.string()),
});
const notificationItem = z.object({
  id: z.string(),
  type: z.enum([
    'trade',
    'deposit',
    'withdraw',
    'security',
    'system',
    'p2p',
    'price_alert',
    'referral',
    'arena',
  ]),
  title: z.string(),
  message: z.string(),
  time: z.string(),
  isRead: z.boolean(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  actionUrl: z.string().optional(),
});
const helpCategory = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  count: z.number().int().nonnegative(),
});
const helpArticle = z.object({
  id: z.string(),
  category: z.string(),
  categoryIcon: z.string(),
  title: z.string(),
  summary: z.string(),
  views: z.number().int().nonnegative(),
});
const ticketItem = z.object({
  id: z.string(),
  subject: z.string(),
  category: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      sender: z.enum(['user', 'support']),
      text: z.string(),
      time: z.string(),
      attachments: z.array(z.string()).optional(),
    }),
  ),
});
const list = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item) });

export interface SupportApi {
  listNews(signal?: AbortSignal): Promise<{ items: NewsArticle[] }>;
  listNotifications(signal?: AbortSignal): Promise<{ items: Notification[] }>;
  markNotificationRead(id: string, idempotencyKey: string): Promise<void>;
  listHelp(signal?: AbortSignal): Promise<{ categories: HelpCategory[]; articles: HelpArticle[] }>;
  listTickets(signal?: AbortSignal): Promise<{ items: SupportTicket[] }>;
  createTicket(request: CreateTicketRequest, idempotencyKey: string): Promise<SupportTicket>;
}

export const supportApi: SupportApi = {
  async listNews(signal) {
    return list(newsItem).parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/content/news', signal }),
    );
  },
  async listNotifications(signal) {
    return list(notificationItem).parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/notifications', signal }),
    );
  },
  async markNotificationRead(id, idempotencyKey) {
    await apiClient.request<void>(
      { method: 'POST', path: `/notifications/${encodeURIComponent(id)}/read`, idempotencyKey },
      { retries: 0 },
    );
  },
  async listHelp(signal) {
    const schema = z.object({ categories: z.array(helpCategory), articles: z.array(helpArticle) });
    return schema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/support/help', signal }),
    );
  },
  async listTickets(signal) {
    return list(ticketItem).parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/support/tickets', signal }),
    );
  },
  async createTicket(request, idempotencyKey) {
    return ticketItem.parse(
      await apiClient.request<unknown>(
        { method: 'POST', path: '/support/tickets', body: request, idempotencyKey },
        { retries: 0 },
      ),
    );
  },
};
