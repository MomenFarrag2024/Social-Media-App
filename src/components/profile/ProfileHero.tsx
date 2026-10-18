import type { CSSProperties, ReactNode } from 'react';
import type { User } from '../../types';
import { ProfileStats } from './ProfileStats';

interface ProfileHeroProps {
  user: User;
  /** The owner's cover banner (already resolved for this user). */
  cover: ReactNode;
  /** Profile picture block (viewer trigger, camera button, ...). */
  avatar: ReactNode;
  /** Right-hand actions: Follow for other users, Settings for yourself. */
  actions?: ReactNode;
  /** Notes shown under the bio (e.g. "partial profile"). */
  notice?: ReactNode;
  /** Footer slot, used for the profile tabs. */
  children?: ReactNode;
}

/** Shared profile header: wide cover, overlapping avatar, name, stats and actions (own and other users'). */
export function ProfileHero({ user, cover, avatar, actions, notice, children }: ProfileHeroProps) {
  return (
    <section aria-labelledby="profile-heading" className="animate-fade-up overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {cover}
      <div className="px-4 sm:px-6">
        <div className="-mt-14 flex flex-col gap-3 sm:-mt-16 md:-mt-20 md:flex-row md:items-end md:gap-5">
          <div className="animate-fade-up shrink-0" style={{ '--i': 1 } as CSSProperties}>
            {avatar}
          </div>
          <div className="animate-fade-up min-w-0 flex-1 md:pb-3" style={{ '--i': 2 } as CSSProperties}>
            <h1 id="profile-heading" className="break-words text-2xl font-bold leading-tight md:text-3xl md:text-white">
              {user.name}
            </h1>
            {user.username && <p className="text-[15px] text-muted">@{user.username}</p>}
            <ProfileStats user={user} align="start" className="mt-2" />
          </div>
          {actions && <div className="flex items-center gap-2 md:pb-3">{actions}</div>}
        </div>
        {user.bio && <p className="mt-4 whitespace-pre-wrap break-words text-[15px]">{user.bio}</p>}
        {notice}
      </div>
      <div className={children ? 'animate-fade-up mt-4 border-t border-line px-2 sm:px-4' : 'pb-5'} style={{ '--i': 3 } as CSSProperties}>
        {children}
      </div>
    </section>
  );
}
