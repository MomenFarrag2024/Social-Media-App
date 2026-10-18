import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../api/errors';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.api';
import type { AppNotification } from '../types';
import { mapItemInCache } from '../utils/cache';
import { isRecord } from '../utils/normalize';
import { notificationKeys } from './queryKeys';
import { useToast } from './useToast';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadCount,
    refetchInterval: 60_000, // one poll for every badge on screen (same key); paused in background tabs
    refetchOnWindowFocus: true,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: async (_data, notificationId) => {
      qc.setQueriesData<unknown>({ queryKey: notificationKeys.list }, (old) =>
        mapItemInCache<AppNotification>(old, notificationId, (n) => ({ ...n, isRead: true })),
      );
      await qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      qc.setQueriesData<unknown>({ queryKey: notificationKeys.list }, (old) => {
        if (!isRecord(old) || !Array.isArray(old.pages)) return old;
        return {
          ...old,
          pages: old.pages.map((page: unknown) =>
            isRecord(page) && Array.isArray(page.items)
              ? { ...page, items: (page.items as AppNotification[]).map((n) => ({ ...n, isRead: true })) }
              : page,
          ),
        };
      });
      qc.setQueryData(notificationKeys.unread, 0);
      await qc.invalidateQueries({ queryKey: notificationKeys.unread });
      toast.push('All notifications marked as read', 'success');
    },
    onError: (error) => toast.push(getErrorMessage(error, 'Could not mark notifications as read.'), 'error'),
  });
}
