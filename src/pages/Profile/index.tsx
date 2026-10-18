import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark, FiGrid, FiRepeat, FiSettings } from 'react-icons/fi';
import { Button } from '../../components/common/Button';
import { PageTitle } from '../../components/common/PageTitle';
import { Tabs, panelId, tabId, type TabItem } from '../../components/common/Tabs';
import { BookmarksList } from '../../components/post/BookmarksList';
import { PostFeed } from '../../components/post/PostFeed';
import { ProfileAvatar } from '../../components/profile/ProfileAvatar';
import { ProfileHero } from '../../components/profile/ProfileHero';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { UserCover } from '../../components/profile/UserCover';
import { useAuth } from '../../hooks/useAuth';
import type { Post } from '../../types';

type ProfileTab = 'all' | 'shared' | 'bookmarks';

const TABS: ReadonlyArray<TabItem<ProfileTab>> = [
  { id: 'all', label: 'All', icon: <FiGrid aria-hidden /> },
  { id: 'shared', label: 'Shared', icon: <FiRepeat aria-hidden /> },
  { id: 'bookmarks', label: 'Bookmarks', icon: <FiBookmark aria-hidden /> },
];

// Stable reference so PostFeed's memo doesn't recompute on every render.
const isSharedPost = (post: Post) => Boolean(post.sharedPost);

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ProfileTab>('all');
  if (!user) return null; // guarded by ProtectedRoute; keeps types honest

  return (
    <div className="space-y-4">
      <PageTitle title="Profile" />

      <ProfileHero
        user={user}
        cover={<UserCover user={user} />}
        avatar={<ProfileAvatar user={user} />}
        actions={
          <Link to="/settings">
            <Button variant="secondary">
              <FiSettings aria-hidden /> Edit in Settings
            </Button>
          </Link>
        }
      >
        <Tabs tabs={TABS} value={tab} onChange={setTab} label="Profile content" idPrefix="profile" bordered={false} />
      </ProfileHero>

      <div className="grid items-start gap-4 ">
        

        <div
          key={tab}
          role="tabpanel"
          id={panelId('profile', tab)}
          aria-labelledby={tabId('profile', tab)}
          tabIndex={0}
          className="animate-fade-in min-w-0 space-y-4"
        >
          {tab === 'all' && (
            <>
            <div className="">
          <ProfileInfo user={user} />
        </div>
            <PostFeed
              only="me"
              emptyTitle="No posts yet"
              emptyDescription="Posts you publish or share will appear here."
              />
              </>
          )}
          {tab === 'shared' && (
            <PostFeed
              only="me"
              filter={isSharedPost}
              emptyTitle="Nothing shared yet"
              emptyDescription="Posts you share from other people will appear here."
            />
          )}
          {tab === 'bookmarks' && <BookmarksList />}
        </div>
      </div>
    </div>
  );
}
