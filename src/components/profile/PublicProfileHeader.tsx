import { FiInfo } from 'react-icons/fi';
import type { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { FollowButton } from '../common/FollowButton';
import { ImageViewerButton } from '../common/ImageLightbox';
import { ProfileHero } from './ProfileHero';
import { UserCover } from './UserCover';

export type ProfileStatus = 'full' | 'partial' | 'loading';

/**
 * Header for another user's profile: that user's own cover and photo (both enlargeable), then their info.
 *  - full: loaded from GET /users/:id/profile
 *  - partial: assembled from posts/comments/likes/suggestions because that endpoint is unavailable
 *  - loading: showing what is already known while the full profile loads
 */
export function PublicProfileHeader({ user, status }: { user: User; status: ProfileStatus }) {
  return (
    <ProfileHero
      user={user}
      cover={<UserCover user={user} />}
      avatar={
        <ImageViewerButton
          src={user.photo}
          alt={`${user.name}'s profile photo`}
          label={`View ${user.name}'s profile photo`}
          className="relative rounded-full transition-transform duration-200 hover:scale-[1.03]"
        >
          <Avatar user={user} size="2xl" />
        </ImageViewerButton>
      }
      actions={<FollowButton user={user} />}
      notice={
        <>
          {status === 'loading' && <p className="mt-4 text-xs text-muted">Loading the full profile…</p>}
          {status === 'partial' && (
            <p className="mt-4 flex max-w-xl items-start gap-2 rounded-lg bg-soft px-3 py-2 text-left text-xs text-muted">
              <FiInfo className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-semibold text-ink">Partial profile.</strong> The full profile couldn&apos;t be
                loaded, so this shows only what the API has already returned in posts, comments, and suggestions. Bio
                and statistics appear only if included there.
              </span>
            </p>
          )}
        </>
      }
    />
  );
}
