import type { User } from '../../types';
import { ProfileCover } from './ProfileCover';

/**
 * The cover for `user`'s profile, taken from that user's own profile data (`user.cover`), otherwise the clean
 * default banner. Own profile: the auth profile; other users: their `/users/:id/profile` data.
 */
export function UserCover({ user }: { user: User }) {
  return <ProfileCover src={user.cover} ownerName={user.name} />;
}
