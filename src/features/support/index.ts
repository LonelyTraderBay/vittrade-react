export { supportApi } from './api/support-api';
export { createSupportProtectedRoutes, createSupportPublicRoutes } from './routes';
export {
  supportQueryKeys,
  useCreateSupportTicketMutation,
  useHelpQuery,
  useMarkNotificationReadMutation,
  useNewsQuery,
  useNotificationsQuery,
  useSupportTicketsQuery,
} from './model/support-queries';
export type * from './model/support-types';
