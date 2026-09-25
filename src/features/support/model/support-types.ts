export type NewsType =
  'maintenance' | 'new_feature' | 'promotion' | 'security' | 'listing' | 'general';
export interface NewsArticle {
  id: string;
  type: NewsType;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  isPinned: boolean;
  tags: string[];
}
export type NotificationType =
  | 'trade'
  | 'deposit'
  | 'withdraw'
  | 'security'
  | 'system'
  | 'p2p'
  | 'price_alert'
  | 'referral'
  | 'arena';
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon?: string;
  iconColor?: string;
  actionUrl?: string;
}
export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}
export interface HelpArticle {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  summary: string;
  views: number;
}
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    text: string;
    time: string;
    attachments?: string[];
  }>;
}
export interface CreateTicketRequest {
  subject: string;
  category: string;
  description: string;
}
