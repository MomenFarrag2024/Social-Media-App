import { useState } from 'react';
import type { User } from '../../types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-28 w-28 text-4xl',
  '2xl': 'h-32 w-32 text-5xl md:h-40 md:w-40 md:text-6xl',
};

/** Ring thickness per size; large avatars also get a soft glow. */
const RING: Record<AvatarSize, string> = {
  xs: 'p-[1.5px]',
  sm: 'p-[1.5px]',
  md: 'p-[2px]',
  lg: 'p-[2.5px] shadow-ring-glow',
  xl: 'p-[3px] shadow-ring-glow',
  '2xl': 'p-1 shadow-ring-glow',
};

export function Avatar({ user, size = 'md' }: { user: Pick<User, 'name' | 'photo'>; size?: AvatarSize }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(user.photo) && failedSrc !== user.photo;
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`inline-flex shrink-0 rounded-full bg-accent-ring ${RING[size]}`}>
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-gradient font-semibold text-white ring-2 ring-surface ${size === '2xl' ? 'ring-4' : ''} ${SIZES[size]}`}
      >
        {showImage ? (
          <img
            src={user.photo}
            alt={`${user.name}'s profile photo`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailedSrc(user.photo ?? null)}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </span>
    </span>
  );
}
