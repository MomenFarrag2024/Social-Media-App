import { useState } from 'react';
import { ImageViewerButton } from '../common/ImageLightbox';

interface ProfileCoverProps {
  /** The profile owner's cover URL (from that user's own data), if any. */
  src?: string;
  ownerName?: string;
  /** Clicking opens the large viewer. Off for local previews in Settings. */
  viewable?: boolean;
  /** `hero` for profile pages, `compact` for the Settings preview. */
  size?: 'hero' | 'compact';
}

/** Responsive banner: the owner's cover when available, otherwise a clean decorative default. */
export function ProfileCover({ src, ownerName, viewable = true, size = 'hero' }: ProfileCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = src && failedSrc !== src ? src : undefined;

  const banner = (
    <div
      className={`relative w-full overflow-hidden bg-brand-gradient ${
        size === 'hero' ? 'h-36 sm:h-52 md:h-64 lg:h-72' : 'h-28 sm:h-40'
      }`}
    >
      {image ? (
        <img src={image} alt="" onError={() => setFailedSrc(src ?? null)} className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.03]" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
      )}
    </div>
  );

  if (!image || !viewable) return banner;
  return (
    <ImageViewerButton
      src={image}
      alt={ownerName ? `${ownerName}'s cover photo` : 'Cover photo'}
      label={ownerName ? `View ${ownerName}'s cover photo` : 'View cover photo'}
      className="w-full"
    >
      {banner}
    </ImageViewerButton>
  );
}
