import { useState } from 'react';
import { PageTitle } from '../../components/common/PageTitle';
import { Tabs, panelId, tabId, type TabItem } from '../../components/common/Tabs';
import { SuggestionsStrip } from '../../components/layout/Suggestions';
import { PostComposer } from '../../components/post/PostComposer';
import { PostFeed } from '../../components/post/PostFeed';
import type { FeedFilter } from '../../types';

const TABS: ReadonlyArray<TabItem<FeedFilter>> = [
  { id: 'all', label: 'Everyone' },
  { id: 'following', label: 'Following' },
  { id: 'me', label: 'My posts' },
];

const EMPTY_COPY: Record<FeedFilter, { title: string; description: string }> = {
  all: { title: 'No posts yet', description: 'Be the first to share something.' },
  following: {
    title: 'Nothing from people you follow',
    description: 'Posts from accounts you follow will appear here. Switch to Everyone to see all posts.',
  },
  me: { title: "You haven't posted yet", description: 'Share your first post using the box above.' },
};

export default function HomePage() {
  const [only, setOnly] = useState<FeedFilter>('all');

  return (
    <div className="space-y-4">
      <PageTitle title="Home" />
      <h1 className="sr-only">Home feed</h1>
      <SuggestionsStrip />
      <PostComposer />

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <Tabs tabs={TABS} value={only} onChange={setOnly} label="Feed filter" idPrefix="home" />
      </div>

      <div key={only} role="tabpanel" id={panelId('home', only)} aria-labelledby={tabId('home', only)} className="animate-fade-in">
        <PostFeed only={only} emptyTitle={EMPTY_COPY[only].title} emptyDescription={EMPTY_COPY[only].description} />
      </div>
    </div>
  );
}
