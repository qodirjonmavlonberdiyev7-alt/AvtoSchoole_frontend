import type { NotificationType, PaginatedResult } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myNotifications: builder.query<
      PaginatedResult<NotificationItem>,
      { page?: number; limit?: number; unreadOnly?: boolean } | void
    >({
      query: (params) => ({ url: '/notifications/my', params: params ?? undefined }),
      providesTags: ['Notification'],
    }),
    unreadNotificationCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/my/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<NotificationItem, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useMyNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
