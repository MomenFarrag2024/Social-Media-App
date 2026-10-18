import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getErrorMessage } from '../../api/errors';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadMore } from '../../components/common/LoadMore';
import { Skeleton } from '../../components/common/Skeleton';
import { UserLink } from '../../components/common/UserLink';
import { EmptyState, ErrorState } from '../../components/common/States';
import { useMarkAllRead, useMarkRead, useNotifications } from '../../hooks/useNotifications';
import type { AppNotification } from '../../types';
import { timeAgo } from '../../utils/format';
import { dedupeById } from '../../utils/normalize';

function NotificationRow({ notification, onRead }: { notification: AppNotification; onRead: (id: string) => void }) {
  const body = (
    <>
      <div className="min-w-0 flex-1 text-left">
        <p className={`break-words text-sm ${notification.isRead ? 'text-muted' : 'font-medium text-ink'}`}>
          {notification.text}
        </p>
        <time className="text-xs text-muted" dateTime={notification.createdAt}>
          {timeAgo(notification.createdAt)}
        </time>
      </div>
      {!notification.isRead && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-gradient" aria-label="Unread" />
      )}
    </>
  );

  const rowClass = 'flex min-w-0 flex-1 items-center gap-3 self-stretch';
  const markRead = () => {
    if (!notification.isRead) onRead(notification.id);
  };

  // The avatar is a sibling of the row link (not nested inside it) so it can open the actor's profile.
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-soft ${
        notification.isRead ? '' : 'bg-brand-soft'
      }`}
    >
      {notification.actor ? (
        <UserLink user={notification.actor} ariaLabel={`${notification.actor.name}'s profile`} onClick={markRead}>
          <Avatar user={notification.actor} size="sm" />
        </UserLink>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-muted">
          <FiBell aria-hidden />
        </span>
      )}
      {notification.postId ? (
        <Link to={`/posts/${notification.postId}`} onClick={markRead} className={rowClass}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={markRead} className={rowClass} aria-label={notification.text}>
          {body}
        </button>
      )}
    </li>
  );
}

export default function NotificationsPage() {
  const query = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const items = useMemo(() => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);
  const hasUnread = items.some((item) => !item.isRead);

  return (
    <div>
      <PageTitle title="Notifications" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasUnread}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all as read
        </Button>
      </div>

      {query.isPending && (
        <ul className="space-y-3" role="status" aria-label="Loading notifications">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 rounded-card border border-line bg-surface shadow-card p-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {query.isError && (
        <ErrorState
          title="Couldn't load notifications"
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}

      {query.isSuccess && items.length === 0 && (
        <EmptyState
          icon={FiBell}
          title="You're all caught up"
          description="Likes, comments and shares on your posts will show up here."
        />
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={(id) => markRead.mutate(id)}
            />
          ))}
        </ul>
      )}

      <LoadMore
        hasNextPage={Boolean(query.hasNextPage)}
        isFetching={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  );
}
